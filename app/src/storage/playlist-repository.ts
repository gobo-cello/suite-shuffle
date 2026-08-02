import type { Playlist, TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";

const STORAGE_KEY = "suite-shuffle:playlist";

export type PlaylistRepository = Readonly<{
	load(): Playlist | null;
	save(playlist: Playlist): void;
}>;

type PlaylistPersistence = Pick<Storage, "getItem" | "setItem">;

export function createLocalStoragePlaylistRepository(
	storage: PlaylistPersistence,
): PlaylistRepository {
	return {
		load() {
			const raw = storage.getItem(STORAGE_KEY);
			return raw === null ? null : parsePlaylist(raw);
		},
		save(playlist) {
			storage.setItem(STORAGE_KEY, JSON.stringify(playlist));
		},
	};
}

function parsePlaylist(raw: string): Playlist | null {
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return null;
	}
	return isPlaylist(value) ? value : null;
}

function isPlaylist(value: unknown): value is Playlist {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === "string" &&
		typeof candidate.name === "string" &&
		Array.isArray(candidate.trackGroups) &&
		candidate.trackGroups.every(isTrackGroup)
	);
}

function isTrackGroup(value: unknown): value is TrackGroup {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === "string" &&
		typeof candidate.name === "string" &&
		Array.isArray(candidate.tracks) &&
		candidate.tracks.every(isTrack)
	);
}

function isTrack(value: unknown): value is Track {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.videoId === "string" &&
		typeof candidate.sourceUrl === "string"
	);
}
