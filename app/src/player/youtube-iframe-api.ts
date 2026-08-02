export type YouTubePlayerState =
	| "unstarted"
	| "ended"
	| "playing"
	| "paused"
	| "buffering"
	| "cued";

export type YouTubePlayer = Readonly<{
	loadVideoById(videoId: string): void;
	destroy(): void;
}>;

type YouTubePlayerConstructor = new (
	element: HTMLElement,
	options: {
		events: {
			onReady?: () => void;
			onStateChange?: (event: { data: number }) => void;
		};
	},
) => YouTubePlayer;

type YouTubeIframeApi = Readonly<{
	Player: YouTubePlayerConstructor;
}>;

declare global {
	interface Window {
		YT?: YouTubeIframeApi;
		onYouTubeIframeAPIReady?: () => void;
	}
}

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

const PLAYER_STATE_BY_CODE: Readonly<Record<number, YouTubePlayerState>> = {
	[-1]: "unstarted",
	0: "ended",
	1: "playing",
	2: "paused",
	3: "buffering",
	5: "cued",
};

export function playerStateFromCode(code: number): YouTubePlayerState {
	return PLAYER_STATE_BY_CODE[code] ?? "unstarted";
}

let apiPromise: Promise<YouTubeIframeApi> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeIframeApi> {
	if (apiPromise === null) {
		apiPromise = new Promise((resolve) => {
			if (window.YT?.Player !== undefined) {
				resolve(window.YT);
				return;
			}
			const previousCallback = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				previousCallback?.();
				resolve(window.YT as YouTubeIframeApi);
			};
			const script = document.createElement("script");
			script.src = IFRAME_API_SRC;
			document.head.appendChild(script);
		});
	}
	return apiPromise;
}
