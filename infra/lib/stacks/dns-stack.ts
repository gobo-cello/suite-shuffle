import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
	Certificate,
	CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone, NsRecord } from "aws-cdk-lib/aws-route53";
import type { Construct } from "constructs";
import { applyPlatformTags, createPlatformTags } from "../config/tags";

export interface DnsStackProps extends StackProps {
	readonly domainName: string;
	readonly sandboxSubdomainNameServers?: readonly string[] | undefined;
}

export class DnsStack extends Stack {
	public readonly hostedZone: HostedZone;
	public readonly certificate: Certificate;

	public constructor(scope: Construct, id: string, props: DnsStackProps) {
		super(scope, id, {
			...props,
			terminationProtection: true,
		});

		const zone = new HostedZone(this, "SuiteShuffleHostedZone", {
			zoneName: props.domainName,
			comment:
				"Suite Shuffleのhosted zone。sandbox subdomainはsuite-shuffle-sandbox accountのhosted zoneへNS delegationする。",
		});
		this.hostedZone = zone;

		this.certificate = new Certificate(this, "SuiteShuffleCertificate", {
			domainName: props.domainName,
			validation: CertificateValidation.fromDns(zone),
		});

		if (props.sandboxSubdomainNameServers !== undefined) {
			new NsRecord(this, "SandboxSubdomainDelegation", {
				zone,
				recordName: "sandbox",
				values: [...props.sandboxSubdomainNameServers],
			});
		}

		applyPlatformTags(this, createPlatformTags("production"));

		new CfnOutput(this, "SuiteShuffleHostedZoneNameServers", {
			value: Fn.join(",", zone.hostedZoneNameServers ?? []),
			description:
				"aws-platform側のSUITE_SHUFFLE_SUBDOMAIN_NAME_SERVERS環境変数に設定する値",
		});
	}
}
