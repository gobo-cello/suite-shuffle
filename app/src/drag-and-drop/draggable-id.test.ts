import { describe, expect, it } from "vitest";
import type { TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";
import {
	decodeDraggableId,
	encodeGroupDraggableId,
	encodeTrackDraggableId,
} from "./draggable-id";

const trackGroupId = "550e8400-e29b-41d4-a716-446655440000" as TrackGroup["id"];
const videoId = "dQw4w9WgXcQ" as Track["videoId"];

describe("encodeGroupDraggableId / decodeDraggableId", () => {
	it("round-trips a group id, including ids containing hyphens", () => {
		const id = encodeGroupDraggableId(trackGroupId);

		expect(decodeDraggableId(id)).toEqual({
			type: "group",
			trackGroupId,
		});
	});
});

describe("encodeTrackDraggableId / decodeDraggableId", () => {
	it("round-trips a track id, splitting the fixed-length video id from the group id", () => {
		const id = encodeTrackDraggableId(trackGroupId, videoId);

		expect(decodeDraggableId(id)).toEqual({
			type: "track",
			trackGroupId,
			videoId,
		});
	});

	it("round-trips a track id even when the video id itself contains a hyphen", () => {
		const hyphenVideoId = "a-cdefghijk" as Track["videoId"];
		const id = encodeTrackDraggableId(trackGroupId, hyphenVideoId);

		expect(decodeDraggableId(id)).toEqual({
			type: "track",
			trackGroupId,
			videoId: hyphenVideoId,
		});
	});
});

describe("decodeDraggableId", () => {
	it("returns null for an unrecognized id", () => {
		expect(decodeDraggableId("background-drop-zone")).toBeNull();
		expect(decodeDraggableId("something-else")).toBeNull();
	});
});
