import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { TrackGroup } from "../domain/playlist";
import { encodeGroupDraggableId } from "../drag-and-drop/draggable-id";
import { TrackRow } from "./TrackRow";

type TrackGroupCardProps = Readonly<{
	trackGroup: TrackGroup;
	onRemove: (trackGroupId: TrackGroup["id"]) => void;
}>;

export function TrackGroupCard({ trackGroup, onRemove }: TrackGroupCardProps) {
	const draggableId = encodeGroupDraggableId(trackGroup.id);
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableRef,
		transform,
		isDragging,
	} = useDraggable({ id: draggableId });
	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: draggableId,
	});

	return (
		<li
			ref={(node) => {
				setDraggableRef(node);
				setDroppableRef(node);
			}}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
			className={`flex items-start justify-between gap-3 rounded-lg border-2 border-transparent px-3 py-2 hover:bg-surface-hover ${
				isOver ? "border-accent bg-accent/10" : ""
			} ${isDragging ? "opacity-40" : ""}`}
		>
			<div className="flex min-w-0 flex-1 items-start gap-3">
				<button
					type="button"
					{...attributes}
					{...listeners}
					aria-label="TrackGroupを移動してドラッグで結合"
					className="mt-1 shrink-0 cursor-grab touch-none text-muted hover:text-foreground active:cursor-grabbing"
				>
					⠿
				</button>
				<div className="flex min-w-0 flex-1 flex-col">
					{trackGroup.tracks.map((track) => (
						<TrackRow
							key={track.videoId}
							track={track}
							trackGroupId={trackGroup.id}
							draggable={trackGroup.tracks.length > 1}
						/>
					))}
				</div>
			</div>
			<button
				type="button"
				onClick={() => onRemove(trackGroup.id)}
				className="shrink-0 text-sm text-muted hover:text-accent"
			>
				削除
			</button>
		</li>
	);
}
