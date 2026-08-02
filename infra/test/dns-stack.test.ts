import { Match, Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { describe, expect, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import { DnsStack } from "../lib/stacks/dns-stack";

describe("DnsStack", () => {
	const app = new App();
	const stack = new DnsStack(app, "TestDnsStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		domainName: "suite-shuffle.example.com",
	});
	const template = Template.fromStack(stack);

	it("指定したdomainName用のhosted zoneを作成する", () => {
		template.resourceCountIs("AWS::Route53::HostedZone", 1);
		template.hasResourceProperties("AWS::Route53::HostedZone", {
			Name: "suite-shuffle.example.com.",
		});
	});

	it("hosted zoneでDNS検証するACM証明書を作成する", () => {
		template.hasResourceProperties("AWS::CertificateManager::Certificate", {
			DomainName: "suite-shuffle.example.com",
			ValidationMethod: "DNS",
			DomainValidationOptions: Match.arrayWith([
				Match.objectLike({
					DomainName: "suite-shuffle.example.com",
					HostedZoneId: Match.objectLike({
						Ref: Match.stringLikeRegexp("SuiteShuffleHostedZone"),
					}),
				}),
			]),
		});
	});

	it("Stack termination protectionを有効にする", () => {
		expect(stack.terminationProtection).toBe(true);
	});

	it("hostedZone・certificateをpublicプロパティとして公開する", () => {
		expect(stack.hostedZone).toBeDefined();
		expect(stack.certificate).toBeDefined();
	});

	it("sandboxSubdomainNameServersが未指定の場合はNS delegationレコードを作成しない", () => {
		template.resourceCountIs("AWS::Route53::RecordSet", 0);
	});
});

describe("DnsStack (sandboxSubdomainNameServers指定時)", () => {
	const app = new App();
	const stack = new DnsStack(app, "TestDnsStack", {
		env: { account: parseAwsAccountId("111111111111"), region: "us-east-1" },
		domainName: "suite-shuffle.example.com",
		sandboxSubdomainNameServers: ["ns-1.awsdns-00.com", "ns-2.awsdns-00.org"],
	});
	const template = Template.fromStack(stack);

	it("sandbox宛のNS delegationレコードを作成する", () => {
		template.hasResourceProperties("AWS::Route53::RecordSet", {
			Name: "sandbox.suite-shuffle.example.com.",
			Type: "NS",
			ResourceRecords: Match.arrayEquals([
				"ns-1.awsdns-00.com",
				"ns-2.awsdns-00.org",
			]),
		});
	});
});
