import { useState } from "react";
import {
	addTrackFromUrl,
	createPlaylist,
	type Playlist,
	removeTrackGroup,
	type TrackGroup,
} from "./domain/playlist";
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

	return { playlist, error, addFromUrl, remove };
}
