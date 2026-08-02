import { describe, expect, it } from "vitest";
import { buildTrackGroup } from "../test-support/playlist-fixtures";
import {
	advanceToNext,
	advanceToPrevious,
	currentTrackOf,
	emptyPlaybackSession,
	hasNextTrack,
	hasPreviousTrack,
	startShufflePlay,
} from "./playback-session";
import { parseTrack } from "./track";

function trackGroupsOf(...urls: string[]) {
	return [buildTrackGroup(urls.map(parseTrack))];
}

describe("startShufflePlay", () => {
	it("starts at the first track of the shuffled queue", () => {
		const trackGroups = trackGroupsOf(
			"https://www.youtube.com/watch?v=aaaaaaaaaaa",
			"https://www.youtube.com/watch?v=bbbbbbbbbbb",
		);

		const session = startShufflePlay(trackGroups, () => 0);

		expect(session.currentIndex).toBe(0);
		expect(session.queue).toEqual(trackGroups[0]?.tracks);
	});

	it("has no current track when there are no track groups", () => {
		const session = startShufflePlay([], () => 0);

		expect(session.currentIndex).toBeNull();
		expect(session.queue).toEqual([]);
	});
});

describe("advanceToNext", () => {
	it("moves to the following track in the queue", () => {
		const session = startShufflePlay(
			trackGroupsOf(
				"https://www.youtube.com/watch?v=aaaaaaaaaaa",
				"https://www.youtube.com/watch?v=bbbbbbbbbbb",
			),
			() => 0,
		);

		const next = advanceToNext(session);

		expect(next.currentIndex).toBe(1);
	});

	it("ends the session after the last track", () => {
		const session = startShufflePlay(
			trackGroupsOf("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			() => 0,
		);

		const next = advanceToNext(session);

		expect(next.currentIndex).toBeNull();
	});

	it("leaves an already-ended session unchanged", () => {
		const next = advanceToNext(emptyPlaybackSession);

		expect(next.currentIndex).toBeNull();
	});
});

describe("advanceToPrevious", () => {
	it("moves to the preceding track in the queue", () => {
		const session = advanceToNext(
			startShufflePlay(
				trackGroupsOf(
					"https://www.youtube.com/watch?v=aaaaaaaaaaa",
					"https://www.youtube.com/watch?v=bbbbbbbbbbb",
				),
				() => 0,
			),
		);

		const previous = advanceToPrevious(session);

		expect(previous.currentIndex).toBe(0);
	});

	it("stays on the first track", () => {
		const session = startShufflePlay(
			trackGroupsOf("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			() => 0,
		);

		const previous = advanceToPrevious(session);

		expect(previous.currentIndex).toBe(0);
	});

	it("leaves an ended session unchanged", () => {
		const previous = advanceToPrevious(emptyPlaybackSession);

		expect(previous.currentIndex).toBeNull();
	});
});

describe("currentTrackOf", () => {
	it("returns the track at the current index", () => {
		const session = startShufflePlay(
			trackGroupsOf("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			() => 0,
		);

		expect(currentTrackOf(session)?.videoId).toBe("aaaaaaaaaaa");
	});

	it("returns null when no track is playing", () => {
		expect(currentTrackOf(emptyPlaybackSession)).toBeNull();
	});
});

describe("hasNextTrack", () => {
	it("is true while a following track exists", () => {
		const session = startShufflePlay(
			trackGroupsOf(
				"https://www.youtube.com/watch?v=aaaaaaaaaaa",
				"https://www.youtube.com/watch?v=bbbbbbbbbbb",
			),
			() => 0,
		);

		expect(hasNextTrack(session)).toBe(true);
	});

	it("is false on the last track", () => {
		const session = startShufflePlay(
			trackGroupsOf("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			() => 0,
		);

		expect(hasNextTrack(session)).toBe(false);
	});

	it("is false when no session is playing", () => {
		expect(hasNextTrack(emptyPlaybackSession)).toBe(false);
	});
});

describe("hasPreviousTrack", () => {
	it("is true after advancing past the first track", () => {
		const session = advanceToNext(
			startShufflePlay(
				trackGroupsOf(
					"https://www.youtube.com/watch?v=aaaaaaaaaaa",
					"https://www.youtube.com/watch?v=bbbbbbbbbbb",
				),
				() => 0,
			),
		);

		expect(hasPreviousTrack(session)).toBe(true);
	});

	it("is false on the first track", () => {
		const session = startShufflePlay(
			trackGroupsOf("https://www.youtube.com/watch?v=aaaaaaaaaaa"),
			() => 0,
		);

		expect(hasPreviousTrack(session)).toBe(false);
	});

	it("is false when no session is playing", () => {
		expect(hasPreviousTrack(emptyPlaybackSession)).toBe(false);
	});
});
