import { describe, expect, it } from "vitest";
import type { TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";
import { encodeGroupDraggableId, encodeTrackDraggableId } from "./draggable-id";
import { resolveDrop } from "./resolve-drop";

const groupA = "group-a" as TrackGroup["id"];
const groupB = "group-b" as TrackGroup["id"];
const videoId = "dQw4w9WgXcQ" as Track["videoId"];

describe("resolveDrop", () => {
	it("resolves dropping a TrackGroup onto another TrackGroup as a merge", () => {
		const outcome = resolveDrop(
			encodeGroupDraggableId(groupA),
			encodeGroupDraggableId(groupB),
		);

		expect(outcome).toEqual({
			type: "merge",
			sourceId: groupA,
			targetId: groupB,
		});
	});

	it("resolves dropping a TrackGroup onto itself as no-op", () => {
		const outcome = resolveDrop(
			encodeGroupDraggableId(groupA),
			encodeGroupDraggableId(groupA),
		);

		expect(outcome).toEqual({ type: "none" });
	});

	it("resolves dropping a track onto the background zone as a split", () => {
		const outcome = resolveDrop(
			encodeTrackDraggableId(groupA, videoId),
			"background-drop-zone",
		);

		expect(outcome).toEqual({ type: "split", trackGroupId: groupA, videoId });
	});

	it("resolves dropping a track onto a TrackGroup as no-op", () => {
		const outcome = resolveDrop(
			encodeTrackDraggableId(groupA, videoId),
			encodeGroupDraggableId(groupB),
		);

		expect(outcome).toEqual({ type: "none" });
	});

	it("resolves dropping outside of any droppable as no-op", () => {
		expect(resolveDrop(encodeGroupDraggableId(groupA), null)).toEqual({
			type: "none",
		});
		expect(resolveDrop(encodeTrackDraggableId(groupA, videoId), null)).toEqual({
			type: "none",
		});
	});
});
