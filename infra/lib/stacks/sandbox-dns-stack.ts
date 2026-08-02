import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface SandboxDnsStackProps extends StackProps {
	readonly domainName: string;
}

export class SandboxDnsStack extends Stack {
	public readonly hostedZone: HostedZone;
	public readonly certificate: Certificate;

	public constructor(
		scope: Construct,
		id: string,
		props: SandboxDnsStackProps,
	) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		this.hostedZone = new HostedZone(this, "SandboxSuiteShuffleHostedZone", {
			zoneName: props.domainName,
		});

		this.certificate = new Certificate(this, "SandboxSuiteShuffleCertificate", {
			domainName: props.domainName,
			validation: CertificateValidation.fromDns(this.hostedZone),
		});

		applyPlatformTags(this, createPlatformTags("sandbox"));

		new CfnOutput(this, "SandboxSuiteShuffleHostedZoneNameServers", {
			value: Fn.join(",", this.hostedZone.hostedZoneNameServers ?? []),
			description:
				"suite-shuffle-production accountのSANDBOX_SUBDOMAIN_NAME_SERVERS環境変数に設定する値",
		});
	}
}
