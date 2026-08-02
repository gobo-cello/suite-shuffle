import { useEffect, useRef, useState } from "react";
import {
	loadYouTubeIframeApi,
	playerStateFromCode,
	type YouTubePlayer,
} from "./youtube-iframe-api";

type UseYouTubePlayerOptions = Readonly<{
	videoId: string | null;
	onEnded: () => void;
}>;

export function useYouTubePlayer({
	videoId,
	onEnded,
}: UseYouTubePlayerOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const playerRef = useRef<YouTubePlayer | null>(null);
	const onEndedRef = useRef(onEnded);
	onEndedRef.current = onEnded;
	const [isPlayerReady, setIsPlayerReady] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (container === null) {
			return;
		}
		let cancelled = false;
		loadYouTubeIframeApi().then((api) => {
			if (cancelled) {
				return;
			}
			playerRef.current = new api.Player(container, {
				events: {
					onReady: () => setIsPlayerReady(true),
					onStateChange: (event) => {
						if (playerStateFromCode(event.data) === "ended") {
							onEndedRef.current();
						}
					},
				},
			});
		});
		return () => {
			cancelled = true;
			playerRef.current?.destroy();
			playerRef.current = null;
			setIsPlayerReady(false);
		};
	}, []);

	useEffect(() => {
		if (!isPlayerReady || videoId === null) {
			return;
		}
		playerRef.current?.loadVideoById(videoId);
	}, [isPlayerReady, videoId]);

	return containerRef;
}
