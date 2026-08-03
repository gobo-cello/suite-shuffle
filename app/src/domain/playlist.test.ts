import { describe, expect, it } from "vitest";
import {
	buildPlaylist,
	buildTrackGroup,
} from "../test-support/playlist-fixtures";
import {
	addTrackFromUrl,
	createPlaylist,
	mergeTrackGroups,
	removeTrackGroup,
	splitTrackFromGroup,
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

describe("mergeTrackGroups", () => {
	it("merges the tracks of the selected track groups in playlist order, at the position of the first selected group", () => {
		const trackA = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const trackB = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");
		const trackC = parseTrack("https://www.youtube.com/watch?v=ccccccccccc");
		const groupA = buildTrackGroup([trackA]);
		const groupB = buildTrackGroup([trackB]);
		const groupC = buildTrackGroup([trackC]);
		const playlist = buildPlaylist([groupA, groupB, groupC]);

		const result = mergeTrackGroups(playlist, [groupA.id, groupC.id]);

		expect(result.ok).toBe(true);
		expect(result.ok && result.playlist.trackGroups).toEqual([
			{ id: expect.any(String), name: "", tracks: [trackA, trackC] },
			groupB,
		]);
	});

	it("does not mutate the original playlist", () => {
		const groupA = buildTrackGroup();
		const groupB = buildTrackGroup();
		const playlist = buildPlaylist([groupA, groupB]);

		mergeTrackGroups(playlist, [groupA.id, groupB.id]);

		expect(playlist.trackGroups).toEqual([groupA, groupB]);
	});

	it("returns an error when fewer than two track groups are selected", () => {
		const groupA = buildTrackGroup();
		const playlist = buildPlaylist([groupA]);

		const result = mergeTrackGroups(playlist, [groupA.id]);

		expect(result).toEqual({
			ok: false,
			error: "まとめるにはTrackGroupを2つ以上選択してください",
		});
	});

	it("returns an error when a selected id doesn't match any track group in the playlist", () => {
		const groupA = buildTrackGroup();
		const playlist = buildPlaylist([groupA]);

		const result = mergeTrackGroups(playlist, [
			groupA.id,
			buildTrackGroup().id,
		]);

		expect(result).toEqual({
			ok: false,
			error: "存在しないTrackGroupが指定されました",
		});
	});
});

describe("splitTrackFromGroup", () => {
	it("splits the track out into a new TrackGroup inserted right after the source", () => {
		const trackA = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const trackB = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");
		const groupAB = buildTrackGroup([trackA, trackB]);
		const groupC = buildTrackGroup();
		const playlist = buildPlaylist([groupAB, groupC]);

		const result = splitTrackFromGroup(playlist, groupAB.id, trackB.videoId);

		expect(result.ok).toBe(true);
		expect(result.ok && result.playlist.trackGroups).toEqual([
			{ id: groupAB.id, name: "", tracks: [trackA] },
			{ id: expect.any(String), name: "", tracks: [trackB] },
			groupC,
		]);
	});

	it("does not mutate the original playlist", () => {
		const trackA = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const trackB = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");
		const groupAB = buildTrackGroup([trackA, trackB]);
		const playlist = buildPlaylist([groupAB]);

		splitTrackFromGroup(playlist, groupAB.id, trackB.videoId);

		expect(playlist.trackGroups).toEqual([groupAB]);
	});

	it("returns an error when the track group doesn't exist", () => {
		const playlist = buildPlaylist([buildTrackGroup()]);

		const result = splitTrackFromGroup(
			playlist,
			buildTrackGroup().id,
			parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa").videoId,
		);

		expect(result).toEqual({
			ok: false,
			error: "存在しないTrackGroupが指定されました",
		});
	});

	it("returns an error when the track group only has one track", () => {
		const track = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const group = buildTrackGroup([track]);
		const playlist = buildPlaylist([group]);

		const result = splitTrackFromGroup(playlist, group.id, track.videoId);

		expect(result).toEqual({
			ok: false,
			error: "分割するにはTrackGroupに2曲以上含まれている必要があります",
		});
	});

	it("returns an error when the track doesn't exist in the group", () => {
		const trackA = parseTrack("https://www.youtube.com/watch?v=aaaaaaaaaaa");
		const trackB = parseTrack("https://www.youtube.com/watch?v=bbbbbbbbbbb");
		const group = buildTrackGroup([trackA, trackB]);
		const playlist = buildPlaylist([group]);
		const trackC = parseTrack("https://www.youtube.com/watch?v=ccccccccccc");

		const result = splitTrackFromGroup(playlist, group.id, trackC.videoId);

		expect(result).toEqual({
			ok: false,
			error: "存在しないTrackが指定されました",
		});
	});
});
