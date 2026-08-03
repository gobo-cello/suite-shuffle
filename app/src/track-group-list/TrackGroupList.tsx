import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	TouchSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { Playlist, TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";
import { BACKGROUND_DROP_ZONE_ID } from "../drag-and-drop/draggable-id";
import { resolveDrop } from "../drag-and-drop/resolve-drop";
import { TrackGroupCard } from "./TrackGroupCard";

type TrackGroupListProps = Readonly<{
	playlist: Playlist;
	onRemove: (trackGroupId: TrackGroup["id"]) => void;
	onMergeGroups: (
		sourceId: TrackGroup["id"],
		targetId: TrackGroup["id"],
	) => void;
	onSplitTrack: (
		trackGroupId: TrackGroup["id"],
		videoId: Track["videoId"],
	) => void;
}>;

export function TrackGroupList({
	playlist,
	onRemove,
	onMergeGroups,
	onSplitTrack,
}: TrackGroupListProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 8 },
		}),
	);
	const canSplit = playlist.trackGroups.some(
		(trackGroup) => trackGroup.tracks.length > 1,
	);

	function handleDragEnd(event: DragEndEvent) {
		const outcome = resolveDrop(
			String(event.active.id),
			event.over ? String(event.over.id) : null,
		);
		if (outcome.type === "merge") {
			onMergeGroups(outcome.sourceId, outcome.targetId);
		} else if (outcome.type === "split") {
			onSplitTrack(outcome.trackGroupId, outcome.videoId);
		}
	}

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<ul className="flex flex-col gap-1">
				{playlist.trackGroups.map((trackGroup) => (
					<TrackGroupCard
						key={trackGroup.id}
						trackGroup={trackGroup}
						onRemove={onRemove}
					/>
				))}
			</ul>
			{canSplit && <SplitDropZone />}
		</DndContext>
	);
}

function SplitDropZone() {
	const { setNodeRef, isOver } = useDroppable({ id: BACKGROUND_DROP_ZONE_ID });

	return (
		<div
			ref={setNodeRef}
			className={`mt-2 rounded-xl border-2 border-dashed px-3 py-3 text-center text-xs transition-colors ${
				isOver
					? "border-accent bg-accent/10 text-accent"
					: "border-border text-muted"
			}`}
		>
			曲の⠿をここにドラッグすると、独立したTrackGroupになります
		</div>
	);
}
