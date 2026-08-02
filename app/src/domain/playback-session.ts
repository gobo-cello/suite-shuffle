import {
	createShuffledPlaybackQueue,
	type PlaybackQueue,
} from "./playback-queue";
import type { TrackGroup } from "./playlist";
import type { Track } from "./track";

export type PlaybackSession = Readonly<{
	queue: PlaybackQueue;
	currentIndex: number | null;
}>;

export const emptyPlaybackSession: PlaybackSession = {
	queue: [],
	currentIndex: null,
};

export function startShufflePlay(
	trackGroups: readonly TrackGroup[],
	random: () => number = Math.random,
): PlaybackSession {
	const queue = createShuffledPlaybackQueue(trackGroups, random);
	return { queue, currentIndex: queue.length > 0 ? 0 : null };
}

export function advanceToNext(session: PlaybackSession): PlaybackSession {
	if (
		session.currentIndex === null ||
		session.currentIndex + 1 >= session.queue.length
	) {
		return { ...session, currentIndex: null };
	}
	return { ...session, currentIndex: session.currentIndex + 1 };
}

export function advanceToPrevious(session: PlaybackSession): PlaybackSession {
	if (session.currentIndex === null || session.currentIndex === 0) {
		return session;
	}
	return { ...session, currentIndex: session.currentIndex - 1 };
}

export function currentTrackOf(session: PlaybackSession): Track | null {
	return session.currentIndex === null
		? null
		: session.queue[session.currentIndex];
}

export function hasNextTrack(session: PlaybackSession): boolean {
	return (
		session.currentIndex !== null &&
		session.currentIndex + 1 < session.queue.length
	);
}

export function hasPreviousTrack(session: PlaybackSession): boolean {
	return session.currentIndex !== null && session.currentIndex > 0;
}
