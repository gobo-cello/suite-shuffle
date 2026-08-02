import { useState } from "react";
import {
	advanceToNext,
	advanceToPrevious,
	currentTrackOf,
	emptyPlaybackSession,
	hasNextTrack,
	hasPreviousTrack,
	startShufflePlay,
} from "./domain/playback-session";
import type { TrackGroup } from "./domain/playlist";

export function usePlaybackSession() {
	const [session, setSession] = useState(emptyPlaybackSession);

	return {
		currentTrack: currentTrackOf(session),
		hasNext: hasNextTrack(session),
		hasPrevious: hasPreviousTrack(session),
		shufflePlay(trackGroups: readonly TrackGroup[]) {
			setSession(startShufflePlay(trackGroups));
		},
		next() {
			setSession(advanceToNext);
		},
		previous() {
			setSession(advanceToPrevious);
		},
	};
}
