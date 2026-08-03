import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./player/use-youtube-player", () => ({
	useYouTubePlayer: () => ({ current: null }),
}));

vi.mock("./youtube/use-video-title", () => ({
	useVideoTitle: () => null,
}));

describe("App", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	afterEach(() => {
		cleanup();
	});

	it("サポート対象外のURLを送信すると、エラーメッセージを表示しプレイリストに追加しない", () => {
		render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://example.com/not-a-video" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		expect(screen.getByRole("alert")).toHaveTextContent(
			"YouTubeまたはYouTube Musicの動画URLとして認識できません",
		);
		expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
	});

	it("サポート対象のYouTube URLを送信すると、プレイリストに追加される", () => {
		render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		expect(
			screen.getByText("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "シャッフル再生" }),
		).toBeEnabled();
	});

	it("追加した曲のサムネイルをvideoIdから構築して表示する", () => {
		const { container } = render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		expect(container.querySelector("img")).toHaveAttribute(
			"src",
			"https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
		);
	});

	it("1曲だけのTrackGroupには、曲を取り出すためのドラッグハンドルを表示しない", () => {
		render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=aaaaaaaaaaa" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		expect(
			screen.queryByLabelText("この曲だけ取り出して独立させる"),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "TrackGroupを移動してドラッグで結合",
			}),
		).toBeInTheDocument();
	});
});
