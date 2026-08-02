import { useState } from "react";
import {
	addTrackFromUrl,
	createPlaylist,
	mergeTrackGroups,
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
	const [selectedTrackGroupIds, setSelectedTrackGroupIds] = useState<
		ReadonlySet<TrackGroup["id"]>
	>(new Set());

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
		setSelectedTrackGroupIds((current) => withoutId(current, trackGroupId));
	}

	function toggleSelection(trackGroupId: TrackGroup["id"]) {
		setSelectedTrackGroupIds((current) =>
			current.has(trackGroupId)
				? withoutId(current, trackGroupId)
				: new Set(current).add(trackGroupId),
		);
	}

	function mergeSelected(): boolean {
		const result = mergeTrackGroups(playlist, [...selectedTrackGroupIds]);
		if (!result.ok) {
			setError(result.error);
			return false;
		}
		persist(result.playlist);
		setSelectedTrackGroupIds(new Set());
		setError(null);
		return true;
	}

	return {
		playlist,
		error,
		addFromUrl,
		remove,
		selectedTrackGroupIds,
		toggleSelection,
		mergeSelected,
	};
}

function withoutId<T>(ids: ReadonlySet<T>, id: T): Set<T> {
	const next = new Set(ids);
	next.delete(id);
	return next;
}
