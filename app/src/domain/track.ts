type YouTubeVideoId = string & { readonly __brand: unique symbol };

export type Track = Readonly<{
	videoId: YouTubeVideoId;
	sourceUrl: string;
}>;

export class UnsupportedYouTubeUrlError extends Error {
	constructor(url: string, options?: { cause?: unknown }) {
		super(
			`YouTubeまたはYouTube Musicの動画URLとして認識できません: ${url}`,
			options,
		);
		this.name = "UnsupportedYouTubeUrlError";
	}
}

const SUPPORTED_HOSTS = new Set([
	"youtube.com",
	"www.youtube.com",
	"m.youtube.com",
	"music.youtube.com",
	"youtu.be",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function parseTrack(url: string): Track {
	const parsedUrl = parseUrl(url);
	const videoId = extractVideoId(parsedUrl, url);
	return { videoId, sourceUrl: url };
}

function parseUrl(url: string): URL {
	try {
		return new URL(url);
	} catch (cause) {
		throw new UnsupportedYouTubeUrlError(url, { cause });
	}
}

function extractVideoId(parsedUrl: URL, originalUrl: string): YouTubeVideoId {
	const hostname = parsedUrl.hostname.toLowerCase();
	if (!SUPPORTED_HOSTS.has(hostname)) {
		throw new UnsupportedYouTubeUrlError(originalUrl);
	}

	const candidate =
		hostname === "youtu.be"
			? parsedUrl.pathname.slice(1)
			: parsedUrl.searchParams.get("v");

	if (candidate === null || !VIDEO_ID_PATTERN.test(candidate)) {
		throw new UnsupportedYouTubeUrlError(originalUrl);
	}

	return candidate as YouTubeVideoId;
}
