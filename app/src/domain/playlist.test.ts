import { describe, expect, it } from "vitest";
import {
	buildPlaylist,
	buildTrackGroup,
} from "../test-support/playlist-fixtures";
import { addTrackFromUrl, createPlaylist, removeTrackGroup } from "./playlist";
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

describe("removeTrackGroup", () => {
	it("removes the matching track group without mutating the original playlist", () => {
		const trackGroup = buildTrackGroup();
		const playlist = buildPlaylist([trackGroup]);

		const updated = removeTrackGroup(playlist, trackGroup.id);

		expect(updated.trackGroups).toEqual([]);
		expect(playlist.trackGroups).toEqual([trackGroup]);
	});

	it("leaves the playlist unchanged when the id doesn't match any track group", () => {
		const trackGroup = buildTrackGroup();
		const playlist = buildPlaylist([trackGroup]);

		const updated = removeTrackGroup(playlist, buildTrackGroup().id);

		expect(updated.trackGroups).toEqual([trackGroup]);
	});
});

describe("addTrackFromUrl", () => {
	it("adds a track group containing the parsed track", () => {
		const playlist = createPlaylist("");

		const result = addTrackFromUrl(
			playlist,
			"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		);

		expect(result.ok).toBe(true);
		expect(result.ok && result.playlist.trackGroups).toEqual([
			{
				id: expect.any(String),
				name: "",
				tracks: [parseTrack("https://www.youtube.com/watch?v=dQw4w9WgXcQ")],
			},
		]);
	});

	it("does not mutate the original playlist", () => {
		const playlist = createPlaylist("");

		addTrackFromUrl(playlist, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

		expect(playlist.trackGroups).toEqual([]);
	});

	it("returns an error for an unsupported URL without changing the playlist", () => {
		const playlist = createPlaylist("");

		const result = addTrackFromUrl(playlist, "https://vimeo.com/12345678");

		expect(result).toEqual({
			ok: false,
			error:
				"YouTubeまたはYouTube Musicの動画URLとして認識できません: https://vimeo.com/12345678",
		});
	});
});
