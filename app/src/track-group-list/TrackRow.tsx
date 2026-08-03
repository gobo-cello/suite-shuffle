import { useDraggable } from "@dnd-kit/core";
import type { TrackGroup } from "../domain/playlist";
import type { Track } from "../domain/track";
import { encodeTrackDraggableId } from "../drag-and-drop/draggable-id";
import { useVideoTitle } from "../youtube/use-video-title";
import { buildThumbnailUrl } from "../youtube/video-metadata";

type TrackRowProps = Readonly<{
	track: Track;
	trackGroupId: TrackGroup["id"];
	draggable: boolean;
}>;

export function TrackRow({ track, trackGroupId, draggable }: TrackRowProps) {
	const title = useVideoTitle(track.videoId);
	const label = title ?? track.sourceUrl;
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: encodeTrackDraggableId(trackGroupId, track.videoId),
			disabled: !draggable,
		});

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
			className={`flex min-w-0 items-center gap-2 py-0.5 ${
				isDragging ? "opacity-40" : ""
			}`}
		>
			<img
				src={buildThumbnailUrl(track.videoId)}
				alt=""
				loading="lazy"
				className="h-9 w-16 shrink-0 rounded object-cover"
			/>
			<span className="truncate text-sm">{label}</span>
			{draggable && (
				<button
					type="button"
					{...attributes}
					{...listeners}
					aria-label="この曲だけ取り出して独立させる"
					className="ml-auto shrink-0 cursor-grab touch-none text-muted hover:text-foreground active:cursor-grabbing"
				>
					⠿
				</button>
			)}
		</div>
	);
}
