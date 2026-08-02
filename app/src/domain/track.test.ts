import { describe, expect, it } from "vitest";
import { parseTrack, UnsupportedYouTubeUrlError } from "./track";

describe("parseTrack", () => {
	it("extracts the video id from a youtube.com watch URL", () => {
		const track = parseTrack("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("extracts the video id from a bare youtube.com watch URL", () => {
		const track = parseTrack("https://youtube.com/watch?v=dQw4w9WgXcQ");

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("extracts the video id from a mobile youtube.com watch URL", () => {
		const track = parseTrack("https://m.youtube.com/watch?v=dQw4w9WgXcQ");

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("extracts the video id from a YouTube Music watch URL", () => {
		const track = parseTrack(
			"https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVM",
		);

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("extracts the video id from a youtu.be short URL", () => {
		const track = parseTrack("https://youtu.be/dQw4w9WgXcQ");

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("ignores extra query parameters on a youtu.be short URL", () => {
		const track = parseTrack("https://youtu.be/dQw4w9WgXcQ?t=30");

		expect(track.videoId).toBe("dQw4w9WgXcQ");
	});

	it("preserves the original URL as sourceUrl", () => {
		const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

		const track = parseTrack(url);

		expect(track.sourceUrl).toBe(url);
	});

	it("throws for a URL from an unsupported host", () => {
		expect(() => parseTrack("https://vimeo.com/12345678")).toThrow(
			UnsupportedYouTubeUrlError,
		);
	});

	it("throws for a malformed URL", () => {
		expect(() => parseTrack("not a url")).toThrow(UnsupportedYouTubeUrlError);
	});

	it("throws for a youtube.com watch URL missing the v parameter", () => {
		expect(() => parseTrack("https://www.youtube.com/watch")).toThrow(
			UnsupportedYouTubeUrlError,
		);
	});

	it("throws for a video id with an invalid format", () => {
		expect(() => parseTrack("https://youtu.be/short")).toThrow(
			UnsupportedYouTubeUrlError,
		);
	});
});
