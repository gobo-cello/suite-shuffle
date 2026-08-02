import type { Track } from "./track";

type TrackGroupId = string & { readonly __brand: unique symbol };
type PlaylistId = string & { readonly __brand: unique symbol };

export type TrackGroup = Readonly<{
	id: TrackGroupId;
	name: string;
	tracks: readonly Track[];
}>;

export type Playlist = Readonly<{
	id: PlaylistId;
	name: string;
	trackGroups: readonly TrackGroup[];
}>;

export function createPlaylist(name: string): Playlist {
	return { id: crypto.randomUUID() as PlaylistId, name, trackGroups: [] };
}

export function createTrackGroup(
	name: string,
	tracks: readonly Track[],
): TrackGroup {
	return { id: crypto.randomUUID() as TrackGroupId, name, tracks };
}

export function addTrackGroup(
	playlist: Playlist,
	trackGroup: TrackGroup,
): Playlist {
	return { ...playlist, trackGroups: [...playlist.trackGroups, trackGroup] };
}

export function removeTrackGroup(
	playlist: Playlist,
	trackGroupId: TrackGroup["id"],
): Playlist {
	return {
		...playlist,
		trackGroups: playlist.trackGroups.filter(
			(trackGroup) => trackGroup.id !== trackGroupId,
		),
	};
}
