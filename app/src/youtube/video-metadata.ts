import type { Track } from "../domain/track";

const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

export function buildThumbnailUrl(videoId: Track["videoId"]): string {
	return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * YouTube oEmbedはAPIキー不要かつCORS許可済みのため、静的サイトからのクライアント
 * サイドfetchで動画タイトルを取得できる。動画の削除・非公開やネットワーク障害は
 * `null`として返し、呼び出し側でsourceUrlへのフォールバック表示に委ねる。
 */
export async function fetchVideoTitle(
	videoId: Track["videoId"],
	fetchFn: typeof fetch = fetch,
): Promise<string | null> {
	const endpoint = new URL(OEMBED_ENDPOINT);
	endpoint.searchParams.set(
		"url",
		`https://www.youtube.com/watch?v=${videoId}`,
	);
	endpoint.searchParams.set("format", "json");

	let response: Response;
	try {
		response = await fetchFn(endpoint.toString());
	} catch {
		return null;
	}
	if (!response.ok) {
		return null;
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		return null;
	}

	return isOEmbedResponse(body) ? body.title : null;
}

function isOEmbedResponse(value: unknown): value is { title: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Record<string, unknown>).title === "string"
	);
}
