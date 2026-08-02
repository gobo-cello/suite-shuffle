import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import {
	Effect,
	OidcProviderNative,
	OpenIdConnectPrincipal,
	PolicyStatement,
	Role,
} from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import {
	createCdkDeployRoleArn,
	createCdkFilePublishingRoleArn,
	createCdkLookupRoleArn,
} from "../config/cdk-bootstrap";
import type {
	AwsEnvironment,
	AwsRegion,
	SuiteShuffleEnvironment,
} from "../config/environments";
import {
	createGithubActionsSubClaim,
	githubActionsOidcAudience,
	githubActionsOidcProviderUrl,
} from "../config/github";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface GithubDeployRoleStackProps extends StackProps {
	readonly deploymentEnvironment: SuiteShuffleEnvironment;
	readonly awsEnvironment: AwsEnvironment;
	/**
	 * awsEnvironment.regionに加えてAssumeRoleを許可するregion。
	 * CloudFront用ACM証明書などus-east-1固定のstackをdeployする場合に指定する。
	 */
	readonly additionalRegions?: readonly AwsRegion[];
}

export class GithubDeployRoleStack extends Stack {
	public constructor(
		scope: Construct,
		id: string,
		props: GithubDeployRoleStackProps,
	) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const provider = new OidcProviderNative(this, "GithubActionsOidcProvider", {
			url: githubActionsOidcProviderUrl,
			clientIds: [githubActionsOidcAudience],
		});

		const deployRole = new Role(this, "GithubDeployRole", {
			assumedBy: new OpenIdConnectPrincipal(provider, {
				StringEquals: {
					"token.actions.githubusercontent.com:aud": githubActionsOidcAudience,
				},
				StringLike: {
					"token.actions.githubusercontent.com:sub":
						createGithubActionsSubClaim(props.deploymentEnvironment),
				},
			}),
			description:
				`Role assumed by GitHub Actions to CDK deploy the ${props.deploymentEnvironment} environment. ` +
				"Only allows assuming the CDK bootstrap deploy-role, file-publishing-role, and lookup-role.",
		});

		const regions = [
			props.awsEnvironment.region,
			...(props.additionalRegions ?? []),
		];

		deployRole.addToPolicy(
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["sts:AssumeRole"],
				resources: regions.flatMap((region) => [
					createCdkDeployRoleArn(props.awsEnvironment.account, region),
					createCdkFilePublishingRoleArn(props.awsEnvironment.account, region),
					createCdkLookupRoleArn(props.awsEnvironment.account, region),
				]),
			}),
		);

		applyPlatformTags(this, createPlatformTags(props.deploymentEnvironment));

		new CfnOutput(this, "GithubDeployRoleArn", {
			value: deployRole.roleArn,
		});
	}
}
