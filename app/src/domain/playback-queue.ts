import type { TrackGroup } from "./playlist";
import type { Track } from "./track";

export type PlaybackQueue = readonly Track[];

export function createShuffledPlaybackQueue(
	trackGroups: readonly TrackGroup[],
	random: () => number = Math.random,
): PlaybackQueue {
	return shuffle(trackGroups, random).flatMap(
		(trackGroup) => trackGroup.tracks,
	);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
