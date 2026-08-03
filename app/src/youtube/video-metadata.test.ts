import { describe, expect, it } from "vitest";
import type { Track } from "../domain/track";
import { buildThumbnailUrl, fetchVideoTitle } from "./video-metadata";

const videoId = "dQw4w9WgXcQ" as Track["videoId"];

function fakeFetch(response: Partial<Response> | Error): typeof fetch {
	return (async () => {
		if (response instanceof Error) {
			throw response;
		}
		return response as Response;
	}) as typeof fetch;
}

describe("buildThumbnailUrl", () => {
	it("builds a thumbnail URL from the video id", () => {
		expect(buildThumbnailUrl(videoId)).toBe(
			"https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
		);
	});
});

describe("fetchVideoTitle", () => {
	it("resolves the title from a successful oEmbed response", async () => {
		const fetchFn = fakeFetch({
			ok: true,
			json: async () => ({ title: "交響曲第5番" }),
		});

		await expect(fetchVideoTitle(videoId, fetchFn)).resolves.toBe(
			"交響曲第5番",
		);
	});

	it("resolves null when the response is not ok", async () => {
		const fetchFn = fakeFetch({ ok: false, json: async () => ({}) });

		await expect(fetchVideoTitle(videoId, fetchFn)).resolves.toBeNull();
	});

	it("resolves null when the response body is not a valid oEmbed shape", async () => {
		const fetchFn = fakeFetch({ ok: true, json: async () => ({}) });

		await expect(fetchVideoTitle(videoId, fetchFn)).resolves.toBeNull();
	});

	it("resolves null when the fetch itself throws", async () => {
		const fetchFn = fakeFetch(new Error("network error"));

		await expect(fetchVideoTitle(videoId, fetchFn)).resolves.toBeNull();
	});

	it("resolves null when the response body is not valid JSON", async () => {
		const fetchFn = fakeFetch({
			ok: true,
			json: async () => {
				throw new Error("invalid json");
			},
		});

		await expect(fetchVideoTitle(videoId, fetchFn)).resolves.toBeNull();
	});
});
