import { useEffect, useState } from "react";
import type { Track } from "../domain/track";
import { fetchVideoTitle } from "./video-metadata";

const titleCache = new Map<Track["videoId"], Promise<string | null>>();

function getCachedTitle(videoId: Track["videoId"]): Promise<string | null> {
	const cached = titleCache.get(videoId);
	if (cached !== undefined) {
		return cached;
	}
	const promise = fetchVideoTitle(videoId);
	titleCache.set(videoId, promise);
	return promise;
}

export function useVideoTitle(videoId: Track["videoId"] | null): string | null {
	const [title, setTitle] = useState<string | null>(null);

	useEffect(() => {
		if (videoId === null) {
			setTitle(null);
			return;
		}

		let cancelled = false;
		setTitle(null);
		getCachedTitle(videoId).then((result) => {
			if (!cancelled) {
				setTitle(result);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [videoId]);

	return title;
}
