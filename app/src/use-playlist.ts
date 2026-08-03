import { useState } from "react";
import {
	addTrackFromUrl,
	createPlaylist,
	mergeTrackGroups,
	type Playlist,
	removeTrackGroup,
	splitTrackFromGroup,
	type TrackGroup,
} from "./domain/playlist";
import type { Track } from "./domain/track";
import type { PlaylistRepository } from "./storage/playlist-repository";

export function usePlaylist(repository: PlaylistRepository) {
	const [playlist, setPlaylist] = useState<Playlist>(
		() => repository.load() ?? createPlaylist(""),
	);
	const [error, setError] = useState<string | null>(null);

	function persist(next: Playlist) {
		setPlaylist(next);
		repository.save(next);
	}

	function addFromUrl(url: string): boolean {
		const result = addTrackFromUrl(playlist, url);
		if (!result.ok) {
			setError(result.error);
			return false;
		}
		persist(result.playlist);
		setError(null);
		return true;
	}

	function remove(trackGroupId: TrackGroup["id"]) {
		persist(removeTrackGroup(playlist, trackGroupId));
	}

	function mergeGroups(
		sourceId: TrackGroup["id"],
		targetId: TrackGroup["id"],
	): boolean {
		const result = mergeTrackGroups(playlist, [targetId, sourceId]);
		if (!result.ok) {
			setError(result.error);
			return false;
		}
		persist(result.playlist);
		setError(null);
		return true;
	}

	function splitTrack(
		trackGroupId: TrackGroup["id"],
		videoId: Track["videoId"],
	): boolean {
		const result = splitTrackFromGroup(playlist, trackGroupId, videoId);
		if (!result.ok) {
			setError(result.error);
			return false;
		}
		persist(result.playlist);
		setError(null);
		return true;
	}

	return {
		playlist,
		error,
		addFromUrl,
		remove,
		mergeGroups,
		splitTrack,
	};
}
