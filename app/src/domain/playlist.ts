import type { Track } from "./track";
import { parseTrack, UnsupportedYouTubeUrlError } from "./track";

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

/**
 * @public 現在の唯一の生産コード呼び出し元は同一ファイル内の`addTrackFromUrl`だが、
 * 複数Trackを1つのTrackGroupへまとめる操作(ADR 0001のロードマップ)が実装され次第、
 * UIから直接呼び出される想定の公開コンストラクタである。
 */
export function createTrackGroup(
	name: string,
	tracks: readonly Track[],
): TrackGroup {
	return { id: crypto.randomUUID() as TrackGroupId, name, tracks };
}

/** @public {@link createTrackGroup}と同様、将来のUIから直接利用される想定の公開API。 */
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

export type AddTrackFromUrlResult =
	| Readonly<{ ok: true; playlist: Playlist }>
	| Readonly<{ ok: false; error: string }>;

export function addTrackFromUrl(
	playlist: Playlist,
	url: string,
): AddTrackFromUrlResult {
	let track: Track;
	try {
		track = parseTrack(url);
	} catch (cause) {
		if (!(cause instanceof UnsupportedYouTubeUrlError)) {
			throw cause;
		}
		return { ok: false, error: cause.message };
	}
	return {
		ok: true,
		playlist: addTrackGroup(playlist, createTrackGroup("", [track])),
	};
}
