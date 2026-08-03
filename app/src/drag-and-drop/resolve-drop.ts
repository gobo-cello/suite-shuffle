import type { TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";
import { BACKGROUND_DROP_ZONE_ID, decodeDraggableId } from "./draggable-id";

export type DropOutcome =
	| Readonly<{
			type: "merge";
			sourceId: TrackGroup["id"];
			targetId: TrackGroup["id"];
	  }>
	| Readonly<{
			type: "split";
			trackGroupId: TrackGroup["id"];
			videoId: Track["videoId"];
	  }>
	| Readonly<{ type: "none" }>;

const NONE: DropOutcome = { type: "none" };

/**
 * ドラッグ終了時のactive/over idから、TrackGroupの結合・分割のどちらを
 * 実行すべきかを判定する。dnd-kitの実イベントに依存しない純粋関数にすることで、
 * ポインタ操作の再現が難しいDOM環境に頼らずテストできるようにしている。
 */
export function resolveDrop(
	activeId: string,
	overId: string | null,
): DropOutcome {
	const active = decodeDraggableId(activeId);
	if (active === null || overId === null) {
		return NONE;
	}

	if (active.type === "group") {
		const over = decodeDraggableId(overId);
		if (
			over === null ||
			over.type !== "group" ||
			over.trackGroupId === active.trackGroupId
		) {
			return NONE;
		}
		return {
			type: "merge",
			sourceId: active.trackGroupId,
			targetId: over.trackGroupId,
		};
	}

	if (overId !== BACKGROUND_DROP_ZONE_ID) {
		return NONE;
	}
	return {
		type: "split",
		trackGroupId: active.trackGroupId,
		videoId: active.videoId,
	};
}
