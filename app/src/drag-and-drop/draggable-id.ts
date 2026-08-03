import type { TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";

export const BACKGROUND_DROP_ZONE_ID = "background-drop-zone";

export type DraggableId =
	| Readonly<{ type: "group"; trackGroupId: TrackGroup["id"] }>
	| Readonly<{
			type: "track";
			trackGroupId: TrackGroup["id"];
			videoId: Track["videoId"];
	  }>;

const GROUP_PREFIX = "group-";
const TRACK_PREFIX = "track-";

// YouTube video idは常に11文字(track.tsのVIDEO_ID_PATTERN)であるため、
// 末尾11文字をvideoId、残りをtrackGroupIdとして固定長で切り出せる。
const VIDEO_ID_LENGTH = 11;

export function encodeGroupDraggableId(trackGroupId: TrackGroup["id"]): string {
	return `${GROUP_PREFIX}${trackGroupId}`;
}

export function encodeTrackDraggableId(
	trackGroupId: TrackGroup["id"],
	videoId: Track["videoId"],
): string {
	return `${TRACK_PREFIX}${trackGroupId}-${videoId}`;
}

export function decodeDraggableId(id: string): DraggableId | null {
	if (id.startsWith(GROUP_PREFIX)) {
		return {
			type: "group",
			trackGroupId: id.slice(GROUP_PREFIX.length) as TrackGroup["id"],
		};
	}

	if (id.startsWith(TRACK_PREFIX)) {
		const rest = id.slice(TRACK_PREFIX.length);
		if (rest.length <= VIDEO_ID_LENGTH + 1) {
			return null;
		}
		const videoId = rest.slice(-VIDEO_ID_LENGTH);
		const trackGroupId = rest.slice(0, -VIDEO_ID_LENGTH - 1);
		return {
			type: "track",
			trackGroupId: trackGroupId as TrackGroup["id"],
			videoId: videoId as Track["videoId"],
		};
	}

	return null;
}
