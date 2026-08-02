import { describe, expect, it } from "vitest";
import { createShuffledPlaybackQueue } from "./playback-queue";
import { createTrackGroup } from "./playlist";
import { parseTrack } from "./track";

function sequence(...values: number[]): () => number {
	let index = 0;
	return () => {
		const value = values[index % values.length];
		index += 1;
		return value;
	};
}

describe("createShuffledPlaybackQueue", () => {
	it("keeps the track order within each track group unchanged", () => {
		const first = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const second = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");
		const trackGroup = createTrackGroup("交響曲第5番", [first, second]);

		const queue = createShuffledPlaybackQueue([trackGroup], () => 0);

		expect(queue).toEqual([first, second]);
	});

	it("orders track groups according to the given random source", () => {
		const trackGroupA = createTrackGroup("A", [
			parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
		]);
		const trackGroupB = createTrackGroup("B", [
			parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb"),
		]);
		const trackGroupC = createTrackGroup("C", [
			parseTrack("https://www.youtube.com/watch?v=ccccccccccc"),
		]);

		const queue = createShuffledPlaybackQueue(
			[trackGroupA, trackGroupB, trackGroupC],
			sequence(0, 0),
		);

		expect(queue).toEqual([
			...trackGroupB.tracks,
			...trackGroupC.tracks,
			...trackGroupA.tracks,
		]);
	});

	it("returns an empty queue for a playlist with no track groups", () => {
		const queue = createShuffledPlaybackQueue([], () => 0);

		expect(queue).toEqual([]);
	});

	it("does not mutate the given track groups", () => {
		const trackGroups = [
			createTrackGroup("A", [
				parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			]),
			createTrackGroup("B", [
				parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb"),
			]),
		];
		const original = [...trackGroups];

		createShuffledPlaybackQueue(trackGroups, () => 0);

		expect(trackGroups).toEqual(original);
	});
});
