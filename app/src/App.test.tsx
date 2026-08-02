import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./player/use-youtube-player", () => ({
	useYouTubePlayer: () => ({ current: null }),
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

	it("TrackGroupを1つしか選択していない場合、まとめるボタンは無効", () => {
		render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=aaaaaaaaaaa" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		fireEvent.click(screen.getByLabelText("まとめる曲を選択"));

		expect(
			screen.getByRole("button", { name: "選択した曲をまとめる" }),
		).toBeDisabled();
	});

	it("複数のTrackGroupを選択してまとめると、1つのTrackGroupにまとまる", () => {
		render(<App />);

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=aaaaaaaaaaa" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		fireEvent.change(screen.getByLabelText("YouTubeまたはYouTube MusicのURL"), {
			target: { value: "https://www.youtube.com/watch?v=bbbbbbbbbbb" },
		});
		fireEvent.click(screen.getByRole("button", { name: "追加" }));

		expect(screen.getAllByRole("listitem")).toHaveLength(2);

		for (const checkbox of screen.getAllByLabelText("まとめる曲を選択")) {
			fireEvent.click(checkbox);
		}
		fireEvent.click(
			screen.getByRole("button", { name: "選択した曲をまとめる" }),
		);

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(1);
		expect(items[0]).toHaveTextContent(
			"https://www.youtube.com/watch?v=aaaaaaaaaaa",
		);
		expect(items[0]).toHaveTextContent(
			"https://www.youtube.com/watch?v=bbbbbbbbbbb",
		);
	});
});
