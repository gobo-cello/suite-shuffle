class InvalidSuiteShuffleDomainNameError extends Error {
	public constructor(value: unknown) {
		super(`Invalid Suite Shuffle domain name: ${String(value)}`);
		this.name = "InvalidSuiteShuffleDomainNameError";
	}
}

export function parseSuiteShuffleDomainName(value: unknown): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new InvalidSuiteShuffleDomainNameError(value);
	}

	return value;
}

export function sandboxDomainNameOf(domainName: string): string {
	return `sandbox.${domainName}`;
}

class InvalidNameServersError extends Error {
	public constructor(value: unknown) {
		super(`Invalid name servers: ${String(value)}`);
		this.name = "InvalidNameServersError";
	}
}

export function parseNameServers(value: string): readonly string[] {
	const nameServers = value.split(",").map((entry) => entry.trim());

	if (
		nameServers.length === 0 ||
		nameServers.some((entry) => entry.length === 0)
	) {
		throw new InvalidNameServersError(value);
	}

	return nameServers;
}
