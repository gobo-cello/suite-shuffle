import { describe, expect, it } from "vitest";
import {
	addTrackGroup,
	createPlaylist,
	createTrackGroup,
	removeTrackGroup,
} from "./playlist";
import { parseTrack } from "./track";

describe("createPlaylist", () => {
	it("creates an empty playlist with the given name", () => {
		const playlist = createPlaylist("弦楽四重奏曲集");

		expect(playlist.name).toBe("弦楽四重奏曲集");
		expect(playlist.trackGroups).toEqual([]);
	});

	it("assigns a unique id to each playlist", () => {
		const first = createPlaylist("");
		const second = createPlaylist("");

		expect(first.id).not.toBe(second.id);
	});
});

describe("createTrackGroup", () => {
	it("creates a track group with the given name and tracks in order", () => {
		const first = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const second = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");

		const trackGroup = createTrackGroup("交響曲第5番", [first, second]);

		expect(trackGroup.name).toBe("交響曲第5番");
		expect(trackGroup.tracks).toEqual([first, second]);
	});
});

describe("addTrackGroup", () => {
	it("appends a track group without mutating the original playlist", () => {
		const playlist = createPlaylist("");
		const trackGroup = createTrackGroup("", []);

		const updated = addTrackGroup(playlist, trackGroup);

		expect(updated.trackGroups).toEqual([trackGroup]);
		expect(playlist.trackGroups).toEqual([]);
	});
});

describe("removeTrackGroup", () => {
	it("removes the matching track group without mutating the original playlist", () => {
		const trackGroup = createTrackGroup("", []);
		const playlist = addTrackGroup(createPlaylist(""), trackGroup);

		const updated = removeTrackGroup(playlist, trackGroup.id);

		expect(updated.trackGroups).toEqual([]);
		expect(playlist.trackGroups).toEqual([trackGroup]);
	});

	it("leaves the playlist unchanged when the id doesn't match any track group", () => {
		const trackGroup = createTrackGroup("", []);
		const playlist = addTrackGroup(createPlaylist(""), trackGroup);

		const updated = removeTrackGroup(playlist, createTrackGroup("", []).id);

		expect(updated.trackGroups).toEqual([trackGroup]);
	});
});
