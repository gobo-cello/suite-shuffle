import { Tags } from "aws-cdk-lib";
import type { IConstruct } from "constructs";
import type { SuiteShuffleEnvironment } from "./environments";

export interface PlatformTags {
	readonly Owner: string;
	readonly ManagedBy: "AWS-CDK";
	readonly Repository: "gobo-cello/suite-shuffle";
	readonly Workload: "suite-shuffle";
	readonly Environment: SuiteShuffleEnvironment;
}

const commonTags = {
	Owner: "gobo-cello",
	ManagedBy: "AWS-CDK",
	Repository: "gobo-cello/suite-shuffle",
	Workload: "suite-shuffle",
} as const satisfies Omit<PlatformTags, "Environment">;

export function createPlatformTags(
	environment: SuiteShuffleEnvironment,
): PlatformTags {
	return {
		...commonTags,
		Environment: environment,
	};
}

export function applyPlatformTags(scope: IConstruct, tags: PlatformTags): void {
	for (const [key, value] of Object.entries(tags)) {
		Tags.of(scope).add(key, value);
	}
}
