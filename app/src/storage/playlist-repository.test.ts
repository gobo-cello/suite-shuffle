import { describe, expect, it } from "vitest";
import {
	addTrackGroup,
	createPlaylist,
	createTrackGroup,
} from "../domain/playlist";
import { parseTrack } from "../domain/track";
import { createLocalStoragePlaylistRepository } from "./playlist-repository";

function createInMemoryStorage() {
	const store = new Map<string, string>();
	return {
		store,
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
	};
}

describe("createLocalStoragePlaylistRepository", () => {
	it("returns null when nothing has been saved yet", () => {
		const repository = createLocalStoragePlaylistRepository(
			createInMemoryStorage(),
		);

		expect(repository.load()).toBeNull();
	});

	it("round-trips a saved playlist", () => {
		const repository = createLocalStoragePlaylistRepository(
			createInMemoryStorage(),
		);
		const track = parseTrack("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		const playlist = addTrackGroup(
			createPlaylist(""),
			createTrackGroup("", [track]),
		);

		repository.save(playlist);

		expect(repository.load()).toEqual(playlist);
	});

	it("returns null for corrupted JSON", () => {
		const storage = createInMemoryStorage();
		const repository = createLocalStoragePlaylistRepository(storage);
		repository.save(createPlaylist(""));
		const [key] = storage.store.keys();
		storage.store.set(key, "{not valid json");

		expect(repository.load()).toBeNull();
	});

	it("returns null when the stored value doesn't match the playlist shape", () => {
		const storage = createInMemoryStorage();
		const repository = createLocalStoragePlaylistRepository(storage);
		repository.save(createPlaylist(""));
		const [key] = storage.store.keys();
		storage.store.set(key, JSON.stringify({ foo: "bar" }));

		expect(repository.load()).toBeNull();
	});
});
