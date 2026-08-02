import { Match, Template } from "aws-cdk-lib/assertions";
import { App } from "aws-cdk-lib/core";
import { describe, expect, it } from "vitest";
import { parseAwsAccountId } from "../lib/config/accounts";
import type { SuiteShuffleEnvironment } from "../lib/config/environments";
import { GithubDeployRoleStack } from "../lib/stacks/github-deploy-role-stack";

function synthesize(deploymentEnvironment: SuiteShuffleEnvironment) {
	const app = new App();
	const awsEnvironment = {
		account: parseAwsAccountId("111111111111"),
		region: "ap-northeast-1" as const,
	};

	const stack = new GithubDeployRoleStack(
		app,
		`Test${deploymentEnvironment}Stack`,
		{
			env: awsEnvironment,
			awsEnvironment,
			deploymentEnvironment,
		},
	);

	return { stack, template: Template.fromStack(stack) };
}

describe.each<SuiteShuffleEnvironment>(["sandbox", "production"])(
	"GithubDeployRoleStack(%s)",
	(deploymentEnvironment) => {
		const { stack, template } = synthesize(deploymentEnvironment);

		it("GitHub Actions用のOIDC providerを1つ作成する", () => {
			template.resourceCountIs("AWS::IAM::OIDCProvider", 1);
			template.hasResourceProperties("AWS::IAM::OIDCProvider", {
				Url: "https://token.actions.githubusercontent.com",
				ClientIdList: ["sts.amazonaws.com"],
			});
		});

		it(`sub claimを${deploymentEnvironment}環境に限定したtrust policyを作成する`, () => {
			template.hasResourceProperties("AWS::IAM::Role", {
				AssumeRolePolicyDocument: Match.objectLike({
					Statement: Match.arrayWith([
						Match.objectLike({
							Action: "sts:AssumeRoleWithWebIdentity",
							Effect: "Allow",
							Condition: {
								StringEquals: {
									"token.actions.githubusercontent.com:aud":
										"sts.amazonaws.com",
								},
								StringLike: {
									"token.actions.githubusercontent.com:sub": `repo:gobo-cello@*/suite-shuffle@*:environment:${deploymentEnvironment}`,
								},
							},
						}),
					]),
				}),
			});
		});

		it("CDK bootstrapの3つのroleへのAssumeRoleだけを許可する", () => {
			template.hasResourceProperties("AWS::IAM::Policy", {
				PolicyDocument: Match.objectLike({
					Statement: Match.arrayWith([
						Match.objectLike({
							Action: "sts:AssumeRole",
							Effect: "Allow",
							Resource: [
								"arn:aws:iam::111111111111:role/cdk-hnb659fds-deploy-role-111111111111-ap-northeast-1",
								"arn:aws:iam::111111111111:role/cdk-hnb659fds-file-publishing-role-111111111111-ap-northeast-1",
								"arn:aws:iam::111111111111:role/cdk-hnb659fds-lookup-role-111111111111-ap-northeast-1",
							],
						}),
					]),
				}),
			});
		});

		it("Stack termination protectionを有効にする", () => {
			expect(stack.terminationProtection).toBe(true);
		});
	},
);

it("additionalRegionsを指定した場合はそのregionのCDK bootstrapロールへのAssumeRoleも許可する", () => {
	const app = new App();
	const awsEnvironment = {
		account: parseAwsAccountId("111111111111"),
		region: "ap-northeast-1" as const,
	};

	const stack = new GithubDeployRoleStack(app, "TestProductionStack", {
		env: awsEnvironment,
		awsEnvironment,
		deploymentEnvironment: "production",
		additionalRegions: ["us-east-1"],
	});
	const template = Template.fromStack(stack);

	template.hasResourceProperties("AWS::IAM::Policy", {
		PolicyDocument: Match.objectLike({
			Statement: Match.arrayWith([
				Match.objectLike({
					Action: "sts:AssumeRole",
					Effect: "Allow",
					Resource: [
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-deploy-role-111111111111-ap-northeast-1",
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-file-publishing-role-111111111111-ap-northeast-1",
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-lookup-role-111111111111-ap-northeast-1",
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-deploy-role-111111111111-us-east-1",
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-file-publishing-role-111111111111-us-east-1",
						"arn:aws:iam::111111111111:role/cdk-hnb659fds-lookup-role-111111111111-us-east-1",
					],
				}),
			]),
		}),
	});
});

it("sandboxとproductionで異なるsub claimを生成する", () => {
	const { template: sandboxTemplate } = synthesize("sandbox");
	const { template: productionTemplate } = synthesize("production");

	sandboxTemplate.hasResourceProperties("AWS::IAM::Role", {
		AssumeRolePolicyDocument: Match.objectLike({
			Statement: Match.arrayWith([
				Match.objectLike({
					Condition: Match.objectLike({
						StringLike: {
							"token.actions.githubusercontent.com:sub":
								"repo:gobo-cello@*/suite-shuffle@*:environment:sandbox",
						},
					}),
				}),
			]),
		}),
	});

	productionTemplate.hasResourceProperties("AWS::IAM::Role", {
		AssumeRolePolicyDocument: Match.objectLike({
			Statement: Match.arrayWith([
				Match.objectLike({
					Condition: Match.objectLike({
						StringLike: {
							"token.actions.githubusercontent.com:sub":
								"repo:gobo-cello@*/suite-shuffle@*:environment:production",
						},
					}),
				}),
			]),
		}),
	});
});
