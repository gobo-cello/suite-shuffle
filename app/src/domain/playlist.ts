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

function createTrackGroup(name: string, tracks: readonly Track[]): TrackGroup {
	return { id: crypto.randomUUID() as TrackGroupId, name, tracks };
}

function addTrackGroup(playlist: Playlist, trackGroup: TrackGroup): Playlist {
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

export type MergeTrackGroupsResult =
	| Readonly<{ ok: true; playlist: Playlist }>
	| Readonly<{ ok: false; error: string }>;

/**
 * 選択された複数の`TrackGroup`を、Track順序を維持したまま1つの`TrackGroup`へまとめる。
 * まとめた`TrackGroup`は、選択されたもののうち最も先頭にあった位置に挿入され、
 * 未選択の`TrackGroup`同士の相対順序は変化しない。
 */
export function mergeTrackGroups(
	playlist: Playlist,
	trackGroupIds: readonly TrackGroup["id"][],
): MergeTrackGroupsResult {
	const targetIds = new Set(trackGroupIds);
	if (targetIds.size < 2) {
		return {
			ok: false,
			error: "まとめるにはTrackGroupを2つ以上選択してください",
		};
	}

	const targets = playlist.trackGroups.filter((trackGroup) =>
		targetIds.has(trackGroup.id),
	);
	if (targets.length !== targetIds.size) {
		return { ok: false, error: "存在しないTrackGroupが指定されました" };
	}

	const merged = createTrackGroup(
		"",
		targets.flatMap((trackGroup) => trackGroup.tracks),
	);

	const trackGroups: TrackGroup[] = [];
	let mergedInserted = false;
	for (const trackGroup of playlist.trackGroups) {
		if (!targetIds.has(trackGroup.id)) {
			trackGroups.push(trackGroup);
			continue;
		}
		if (!mergedInserted) {
			trackGroups.push(merged);
			mergedInserted = true;
		}
	}

	return { ok: true, playlist: { ...playlist, trackGroups } };
}

export type SplitTrackResult =
	| Readonly<{ ok: true; playlist: Playlist }>
	| Readonly<{ ok: false; error: string }>;

/**
 * `TrackGroup`から指定した`Track`を取り出し、直後に新しい`TrackGroup`として挿入する。
 * `mergeTrackGroups`の逆操作にあたる。
 */
export function splitTrackFromGroup(
	playlist: Playlist,
	trackGroupId: TrackGroup["id"],
	videoId: Track["videoId"],
): SplitTrackResult {
	const sourceIndex = playlist.trackGroups.findIndex(
		(trackGroup) => trackGroup.id === trackGroupId,
	);
	if (sourceIndex === -1) {
		return { ok: false, error: "存在しないTrackGroupが指定されました" };
	}

	const source = playlist.trackGroups[sourceIndex];
	if (source.tracks.length < 2) {
		return {
			ok: false,
			error: "分割するにはTrackGroupに2曲以上含まれている必要があります",
		};
	}

	const splitTrack = source.tracks.find((track) => track.videoId === videoId);
	if (splitTrack === undefined) {
		return { ok: false, error: "存在しないTrackが指定されました" };
	}

	const remaining: TrackGroup = {
		...source,
		tracks: source.tracks.filter((track) => track.videoId !== videoId),
	};
	const created = createTrackGroup("", [splitTrack]);

	const trackGroups = [
		...playlist.trackGroups.slice(0, sourceIndex),
		remaining,
		created,
		...playlist.trackGroups.slice(sourceIndex + 1),
	];

	return { ok: true, playlist: { ...playlist, trackGroups } };
}
