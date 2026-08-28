import { readdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { expect, it } from "vitest";

type PackageJson = {
	packageManager?: string;
	engines: {
		node: string;
		npm: string;
	};
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

const rootDirectory = path.resolve(__dirname, "..");
const ignoredDirectories = new Set([
	".git",
	".worktrees",
	"cdk.out",
	"node_modules",
]);
const dependencySections = [
	"dependencies",
	"devDependencies",
	"optionalDependencies",
	"peerDependencies",
] as const;

const getMajorVersion = (version: string): number => {
	const majorVersion = version.match(/^\D*(\d+)/)?.[1];
	if (majorVersion === undefined) {
		throw new Error(`メジャーバージョンを取得できません: ${version}`);
	}
	return Number.parseInt(majorVersion, 10);
};

const findPackageJsonFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
			return findPackageJsonFiles(entryPath);
		}

		return entry.isFile() && entry.name === "package.json" ? [entryPath] : [];
	});

const findNpmrcFiles = (directory: string): string[] =>
	readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
			return findNpmrcFiles(entryPath);
		}

		return entry.isFile() && entry.name === ".npmrc" ? [entryPath] : [];
	});

const readPackageJson = (filePath: string): PackageJson =>
	JSON.parse(readFileSync(filePath, "utf8")) as PackageJson;

it("リポジトリ内の全 package.json の packageManager が一致している", () => {
	const packageJsonFiles = findPackageJsonFiles(rootDirectory);
	const rootPackageManager = readPackageJson(
		path.join(rootDirectory, "package.json"),
	).packageManager;

	expect(typeof rootPackageManager).toBe("string");

	const actualPackageManagers = Object.fromEntries(
		packageJsonFiles.map((filePath) => [
			path.relative(rootDirectory, filePath),
			readPackageJson(filePath).packageManager,
		]),
	);
	const expectedPackageManagers = Object.fromEntries(
		packageJsonFiles.map((filePath) => [
			path.relative(rootDirectory, filePath),
			rootPackageManager,
		]),
	);

	expect(actualPackageManagers).toEqual(expectedPackageManagers);
});

it("リポジトリ内の全 .npmrc で engine-strict が true に設定されている", () => {
	const npmrcFiles = findNpmrcFiles(rootDirectory);
	const actualEngineStrictValues = Object.fromEntries(
		npmrcFiles.map((filePath) => [
			path.relative(rootDirectory, filePath),
			readFileSync(filePath, "utf8")
				.split(/\r?\n/)
				.flatMap((line) => {
					const match = line.trim().match(/^engine-strict\s*=\s*(\S+)$/);
					return match?.[1] === undefined ? [] : [match[1]];
				}),
		]),
	);
	const expectedEngineStrictValues = Object.fromEntries(
		npmrcFiles.map((filePath) => [
			path.relative(rootDirectory, filePath),
			["true"],
		]),
	);

	expect(actualEngineStrictValues).toEqual(expectedEngineStrictValues);
});

it(".node-version と @types/node を依存する package.json の major が一致している", () => {
	const nodeVersion = readFileSync(
		path.join(rootDirectory, ".node-version"),
		"utf8",
	).trim();
	const nodeMajorVersion = getMajorVersion(nodeVersion);
	const mismatches = findPackageJsonFiles(rootDirectory).flatMap((filePath) => {
		const packageJson = readPackageJson(filePath);
		const nodeTypesVersions = dependencySections.flatMap((section) => {
			const version = packageJson[section]?.["@types/node"];
			return version === undefined ? [] : [version];
		});

		return nodeTypesVersions
			.filter((version) => getMajorVersion(version) !== nodeMajorVersion)
			.map(
				(version) =>
					`${path.relative(rootDirectory, filePath)}: @types/node ${version} (expected Node ${nodeVersion})`,
			);
	});

	expect(mismatches).toEqual([]);
});

it(".node-version と全 package.json の Node.js の許容範囲が一致している", () => {
	const nodeVersion = readFileSync(
		path.join(rootDirectory, ".node-version"),
		"utf8",
	).trim();
	const expectedNodeRange = `^${getMajorVersion(nodeVersion)}.0.0`;
	const actualNodeRanges = Object.fromEntries(
		findPackageJsonFiles(rootDirectory).map((filePath) => [
			path.relative(rootDirectory, filePath),
			readPackageJson(filePath).engines.node,
		]),
	);
	const expectedNodeRanges = Object.fromEntries(
		findPackageJsonFiles(rootDirectory).map((filePath) => [
			path.relative(rootDirectory, filePath),
			expectedNodeRange,
		]),
	);

	expect(actualNodeRanges).toEqual(expectedNodeRanges);
});

it("全 package.json の packageManager と npm の許容範囲が一致している", () => {
	const mismatches = findPackageJsonFiles(rootDirectory).flatMap((filePath) => {
		const packageJson = readPackageJson(filePath);
		const packageManager = packageJson.packageManager;
		if (packageManager === undefined)
			return [
				`${path.relative(rootDirectory, filePath)}: packageManager is missing`,
			];

		const expectedNpmRange = `^${getMajorVersion(packageManager)}.0.0`;
		return packageJson.engines.npm === expectedNpmRange
			? []
			: [
					`${path.relative(rootDirectory, filePath)}: engines.npm ${packageJson.engines.npm} (expected ${expectedNpmRange})`,
				];
	});

	expect(mismatches).toEqual([]);
});
