import { describe, expect, it, test } from "vitest";
import {
	parseNameServers,
	parseSuiteShuffleDomainName,
	sandboxDomainNameOf,
} from "../lib/config/dns";

describe("parseSuiteShuffleDomainName", () => {
	describe("空でない文字列が与えられた場合", () => {
		it("そのまま受け入れる", () => {
			expect(parseSuiteShuffleDomainName("suite-shuffle.example.com")).toBe(
				"suite-shuffle.example.com",
			);
		});
	});

	describe("空でない文字列以外が与えられた場合", () => {
		test.each([undefined, null, ""])("エラーを投げる: %p", (value: unknown) => {
			expect(() => parseSuiteShuffleDomainName(value)).toThrow();
		});
	});
});

describe("sandboxDomainNameOf", () => {
	it("sandboxサブドメインを前置したドメイン名を返す", () => {
		expect(sandboxDomainNameOf("suite-shuffle.example.com")).toBe(
			"sandbox.suite-shuffle.example.com",
		);
	});
});

describe("parseNameServers", () => {
	describe("カンマ区切りの文字列が与えられた場合", () => {
		it("name serverの配列に変換する", () => {
			expect(parseNameServers("ns-1.awsdns-00.com,ns-2.awsdns-00.org")).toEqual(
				["ns-1.awsdns-00.com", "ns-2.awsdns-00.org"],
			);
		});

		it("各要素の前後の空白をtrimする", () => {
			expect(
				parseNameServers(" ns-1.awsdns-00.com , ns-2.awsdns-00.org "),
			).toEqual(["ns-1.awsdns-00.com", "ns-2.awsdns-00.org"]);
		});
	});

	describe("空要素を含む値が与えられた場合", () => {
		test.each(["", "ns-1.awsdns-00.com,", ",ns-1.awsdns-00.com"])(
			"エラーを投げる: %p",
			(value: string) => {
				expect(() => parseNameServers(value)).toThrow();
			},
		);
	});
});
