import type { Playlist, TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";

let sequence = 0;

export function buildTrackGroup(tracks: readonly Track[] = []): TrackGroup {
	sequence += 1;
	return {
		id: `test-track-group-${sequence}` as TrackGroup["id"],
		name: "",
		tracks,
	};
}

export function buildPlaylist(
	trackGroups: readonly TrackGroup[] = [],
): Playlist {
	sequence += 1;
	return {
		id: `test-playlist-${sequence}` as Playlist["id"],
		name: "",
		trackGroups,
	};
}
