import {
	CfnOutput,
	type RemovalPolicy,
	Stack,
	type StackProps,
} from "aws-cdk-lib";
import type { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import type { IHostedZone } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import type { SuiteShuffleEnvironment } from "../config/environments";
import { applyPlatformTags, createPlatformTags } from "../config/tags";
import { StaticSiteHosting } from "../constructs/static-site-hosting";

export interface HostingStackProps extends StackProps {
	readonly deploymentEnvironment: SuiteShuffleEnvironment;
	readonly domainName: string;
	readonly hostedZone: IHostedZone;
	readonly certificate: ICertificate;
	readonly siteContentPath: string;
	readonly removalPolicy: RemovalPolicy;
	readonly autoDeleteObjects: boolean;
	readonly noIndex: boolean;
}

export class HostingStack extends Stack {
	public constructor(scope: Construct, id: string, props: HostingStackProps) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const { distribution } = new StaticSiteHosting(this, "StaticSiteHosting", {
			domainName: props.domainName,
			hostedZone: props.hostedZone,
			certificate: props.certificate,
			siteContentPath: props.siteContentPath,
			removalPolicy: props.removalPolicy,
			autoDeleteObjects: props.autoDeleteObjects,
			noIndex: props.noIndex,
		});

		applyPlatformTags(this, createPlatformTags(props.deploymentEnvironment));

		new CfnOutput(this, "DistributionDomainName", {
			value: distribution.distributionDomainName,
		});
	}
}
