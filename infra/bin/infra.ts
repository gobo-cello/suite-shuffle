#!/usr/bin/env node
import path from "node:path";
import { App, RemovalPolicy } from "aws-cdk-lib/core";
import { loadSuiteShuffleConfiguration } from "../lib/config/environments";
import { DnsStack } from "../lib/stacks/dns-stack";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";
import { HostingStack } from "../lib/stacks/hosting-stack";
import { SandboxDnsStack } from "../lib/stacks/sandbox-dns-stack";

const app = new App();
const configuration = loadSuiteShuffleConfiguration();

// app/distへの絶対path。appとinfraは別々のnpm projectであり、
// 共有の設定helperを持たないため、実行ファイルからの相対pathで解決する。
// Sandbox/Production共通。
const siteContentPath = path.join(__dirname, "..", "..", "app", "dist");

new GithubDeployRoleStack(app, "SandboxGithubDeployRoleStack", {
	env: configuration.sandbox,
	awsEnvironment: configuration.sandbox,
	deploymentEnvironment: "sandbox",
	// SandboxDnsStackなど、CloudFront用ACM証明書はus-east-1固定のstackもdeployするため。
	additionalRegions: ["us-east-1"],
});

new GithubDeployRoleStack(app, "ProductionGithubDeployRoleStack", {
	env: configuration.production,
	awsEnvironment: configuration.production,
	deploymentEnvironment: "production",
	// ProductionDnsStackなど、CloudFront用ACM証明書はus-east-1固定のstackもdeployするため。
	additionalRegions: ["us-east-1"],
});

const productionDnsStack = new DnsStack(app, "ProductionDnsStack", {
	// CloudFrontで使用するACM証明書はus-east-1でしか発行できないため、
	// suite-shuffle-productionの主リージョン(ap-northeast-1)とは別に固定する。
	env: {
		account: configuration.production.account,
		region: "us-east-1",
	},
	domainName: configuration.domainName,
	sandboxSubdomainNameServers: configuration.sandboxSubdomainNameServers,
});

const sandboxDnsStack = new SandboxDnsStack(app, "SandboxDnsStack", {
	// 同上の理由により、suite-shuffle-sandboxもus-east-1で証明書を発行する。
	env: {
		account: configuration.sandbox.account,
		region: "us-east-1",
	},
	domainName: configuration.sandboxDomainName,
});

new HostingStack(app, "SandboxHostingStack", {
	// HostingStackはDNS Stackと同じus-east-1に置き、cross-region
	// cross-stack参照を避ける。
	env: {
		account: configuration.sandbox.account,
		region: "us-east-1",
	},
	deploymentEnvironment: "sandbox",
	domainName: configuration.sandboxDomainName,
	hostedZone: sandboxDnsStack.hostedZone,
	certificate: sandboxDnsStack.certificate,
	siteContentPath,
	removalPolicy: RemovalPolicy.DESTROY,
	autoDeleteObjects: true,
	// sandboxは検証用であり検索結果に出す必要がないため、X-Robots-Tagで
	// インデックス登録を防ぐ。
	noIndex: true,
});

new HostingStack(app, "ProductionHostingStack", {
	// HostingStackはDNS Stackと同じus-east-1に置き、cross-region
	// cross-stack参照を避ける。
	env: {
		account: configuration.production.account,
		region: "us-east-1",
	},
	deploymentEnvironment: "production",
	domainName: configuration.domainName,
	hostedZone: productionDnsStack.hostedZone,
	certificate: productionDnsStack.certificate,
	siteContentPath,
	removalPolicy: RemovalPolicy.RETAIN,
	autoDeleteObjects: false,
	noIndex: false,
});
