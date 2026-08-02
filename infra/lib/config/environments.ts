import { type AwsAccountId, parseAwsAccountId } from "./accounts";
import {
	parseNameServers,
	parseSuiteShuffleDomainName,
	sandboxDomainNameOf,
} from "./dns";

const supportedAwsRegions = ["ap-northeast-1", "us-east-1"] as const;

export type AwsRegion = (typeof supportedAwsRegions)[number];

export interface AwsEnvironment {
	readonly account: AwsAccountId;
	readonly region: AwsRegion;
}

const suiteShuffleEnvironments = ["sandbox", "production"] as const;

export type SuiteShuffleEnvironment = (typeof suiteShuffleEnvironments)[number];

export interface SuiteShuffleConfiguration {
	readonly sandbox: AwsEnvironment;
	readonly production: AwsEnvironment;
	readonly domainName: string;
	readonly sandboxDomainName: string;
	readonly sandboxSubdomainNameServers?: readonly string[] | undefined;
}

class MissingEnvironmentVariableError extends Error {
	public constructor(name: string) {
		super(`Required environment variable is missing: ${name}`);
		this.name = "MissingEnvironmentVariableError";
	}
}

function readRequiredEnvironmentVariable(name: string): string {
	const value: string | undefined = process.env[name];

	if (value === undefined || value.length === 0) {
		throw new MissingEnvironmentVariableError(name);
	}

	return value;
}

function readOptionalEnvironmentVariable(name: string): string | undefined {
	const value: string | undefined = process.env[name];

	return value === undefined || value.length === 0 ? undefined : value;
}

export function loadSuiteShuffleConfiguration(): SuiteShuffleConfiguration {
	const region: AwsRegion = "ap-northeast-1";

	const sandboxSubdomainNameServersValue = readOptionalEnvironmentVariable(
		"SANDBOX_SUBDOMAIN_NAME_SERVERS",
	);
	const sandboxSubdomainNameServers =
		sandboxSubdomainNameServersValue === undefined
			? undefined
			: parseNameServers(sandboxSubdomainNameServersValue);

	const domainName = parseSuiteShuffleDomainName(
		readRequiredEnvironmentVariable("SUITE_SHUFFLE_DOMAIN_NAME"),
	);

	return {
		sandbox: {
			account: parseAwsAccountId(
				readRequiredEnvironmentVariable("AWS_SUITE_SHUFFLE_SANDBOX_ACCOUNT_ID"),
			),
			region,
		},
		production: {
			account: parseAwsAccountId(
				readRequiredEnvironmentVariable(
					"AWS_SUITE_SHUFFLE_PRODUCTION_ACCOUNT_ID",
				),
			),
			region,
		},
		domainName,
		sandboxDomainName: sandboxDomainNameOf(domainName),
		sandboxSubdomainNameServers,
	} satisfies SuiteShuffleConfiguration;
}
