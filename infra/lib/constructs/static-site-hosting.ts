import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Duration, type RemovalPolicy } from "aws-cdk-lib";
import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
	Distribution,
	type ErrorResponse,
	ResponseHeadersPolicy,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
	BlockPublicAccess,
	Bucket,
	BucketAccessControl,
	BucketEncryption,
	type IBucket,
	ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

/**
 * aws-cdk-libの`Bucket`は`isWebsite`等のoptional getterが`boolean | undefined`を
 * 返す一方、`IBucket`はそれを`boolean`(未設定時のみ省略可)として宣言しており、
 * `exactOptionalPropertyTypes: true`下では構造的代入がコンパイルエラーになる
 * (aws-cdk-lib側の既知の制約)。この関数はそのinterop境界でのみ型を合わせる。
 */
function asIBucket(bucket: Bucket): IBucket {
	return bucket as unknown as IBucket;
}

const hashedAssetDirectoryName = "assets";

/**
 * Viteは"assets/"配下にコンテンツハッシュ付きファイル名でJS/CSSを出力する
 * 不変アセットであり、内容が変わればパス自体が変わるため無効化しなくても
 * 新旧バージョンのキャッシュキーが衝突しない。無効化対象をハッシュの付かない
 * ファイル(index.html等)に絞ることで、デプロイ直後に古いHTMLを参照している
 * クライアントが、エッジにキャッシュ済みの旧アセットをTTLが残っている間は
 * 引き続き取得できるようにする。
 */
function nonHashedAssetInvalidationPaths(siteContentPath: string): string[] {
	return readdirSync(siteContentPath)
		.filter((entry) => entry !== hashedAssetDirectoryName)
		.map((entry) =>
			statSync(join(siteContentPath, entry)).isDirectory()
				? `/${entry}/*`
				: `/${entry}`,
		);
}

export interface StaticSiteHostingProps {
	readonly domainName: string;
	readonly hostedZone: IHostedZone;
	readonly certificate: ICertificate;
	readonly siteContentPath: string;
	readonly removalPolicy: RemovalPolicy;
	readonly autoDeleteObjects: boolean;
	readonly noIndex: boolean;
}

export class StaticSiteHosting extends Construct {
	public readonly distribution: Distribution;

	public constructor(
		scope: Construct,
		id: string,
		props: StaticSiteHostingProps,
	) {
		super(scope, id);

		const siteBucket = new Bucket(this, "SiteBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
		});

		const accessLogBucket = new Bucket(this, "AccessLogBucket", {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
			lifecycleRules: [{ expiration: Duration.days(90) }],
			// CloudFront標準アクセスログはACL経由でログ配信アカウントが書き込むため、
			// S3のデフォルト(ACL無効化)のままではDistribution作成がInvalidRequestで失敗する。
			objectOwnership: ObjectOwnership.OBJECT_WRITER,
			accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
		});

		// robots.txtのDisallowはクロール自体を止めてしまい、検索エンジンが
		// noindexの指示を読み取れなくなる(Googleも非推奨としている)。
		// レスポンスヘッダーでのnoindex指示なら、クロールは許可したままインデックス
		// 登録だけを確実に防げる。
		const responseHeadersPolicy = props.noIndex
			? new ResponseHeadersPolicy(this, "NoIndexResponseHeadersPolicy", {
					customHeadersBehavior: {
						customHeaders: [
							{ header: "X-Robots-Tag", value: "noindex", override: true },
						],
					},
				})
			: undefined;

		this.distribution = new Distribution(this, "Distribution", {
			defaultBehavior: {
				origin: S3BucketOrigin.withOriginAccessControl(asIBucket(siteBucket)),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				...(responseHeadersPolicy ? { responseHeadersPolicy } : {}),
			},
			domainNames: [props.domainName],
			certificate: props.certificate,
			defaultRootObject: "index.html",
			// クライアントサイドルーティング(React Router等)を前提としたSPA配信のため、
			// S3に存在しないパス宛のリクエストは404/403(private bucketをOACで参照する場合、
			// オブジェクトの存在有無を第三者へ漏らさないためS3は404の代わりに403を返す)を
			// 200へ差し替えてindex.htmlを返し、ルーティングをクライアント側へ委ねる。
			errorResponses: [
				{
					httpStatus: 404,
					responseHttpStatus: 200,
					responsePagePath: "/index.html",
				} satisfies ErrorResponse,
				{
					httpStatus: 403,
					responseHttpStatus: 200,
					responsePagePath: "/index.html",
				} satisfies ErrorResponse,
			],
			logBucket: asIBucket(accessLogBucket),
			logFilePrefix: "cloudfront-access-logs/",
		});

		new BucketDeployment(this, "SiteDeployment", {
			sources: [Source.asset(props.siteContentPath)],
			destinationBucket: asIBucket(siteBucket),
			distribution: this.distribution,
			distributionPaths: nonHashedAssetInvalidationPaths(props.siteContentPath),
		});

		new ARecord(this, "SiteAliasRecord", {
			zone: props.hostedZone,
			target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
		});
	}
}
