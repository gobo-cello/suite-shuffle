import { type FormEvent, useState } from "react";
import { useYouTubePlayer } from "./player/use-youtube-player";
import { createLocalStoragePlaylistRepository } from "./storage/playlist-repository";
import { usePlaybackSession } from "./use-playback-session";
import { usePlaylist } from "./use-playlist";

const repository = createLocalStoragePlaylistRepository(window.localStorage);

function App() {
	const {
		playlist,
		error,
		addFromUrl,
		remove,
		selectedTrackGroupIds,
		toggleSelection,
		mergeSelected,
	} = usePlaylist(repository);
	const [url, setUrl] = useState("");
	const playback = usePlaybackSession();
	const playerContainerRef = useYouTubePlayer({
		videoId: playback.currentTrack?.videoId ?? null,
		onEnded: playback.next,
	});

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (addFromUrl(url)) {
			setUrl("");
		}
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
			<h1 className="flex items-center gap-2 text-xl font-bold">
				<span className="flex h-7 w-10 items-center justify-center rounded-lg bg-accent">
					<span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
				</span>
				Suite Shuffle
			</h1>

			<form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
				<div className="flex min-w-64 flex-1 flex-col gap-1">
					<label htmlFor="track-url" className="text-sm text-muted">
						YouTubeまたはYouTube MusicのURL
					</label>
					<input
						id="track-url"
						type="url"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="https://www.youtube.com/watch?v=..."
						className="rounded-full border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-foreground"
					/>
				</div>
				<button
					type="submit"
					className="rounded-full bg-accent px-5 py-2 font-medium text-white hover:bg-accent-hover"
				>
					追加
				</button>
			</form>

			{error !== null && (
				<p
					role="alert"
					className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
				>
					{error}
				</p>
			)}

			<section className="flex flex-col gap-3">
				<div
					className="aspect-video w-full overflow-hidden rounded-xl bg-black"
					ref={playerContainerRef}
				/>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => playback.shufflePlay(playlist.trackGroups)}
						disabled={playlist.trackGroups.length === 0}
						className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
					>
						シャッフル再生
					</button>
					<button
						type="button"
						onClick={playback.previous}
						disabled={!playback.hasPrevious}
						className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover disabled:opacity-40"
					>
						前へ
					</button>
					<button
						type="button"
						onClick={playback.next}
						disabled={!playback.hasNext}
						className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover disabled:opacity-40"
					>
						次へ
					</button>
				</div>
				<p className="text-sm text-muted">
					{playback.currentTrack === null
						? "再生中の曲はありません"
						: `再生中: ${playback.currentTrack.sourceUrl}`}
				</p>
			</section>

			<div className="flex items-center justify-between">
				<h2 className="text-sm text-muted">プレイリスト</h2>
				<button
					type="button"
					onClick={mergeSelected}
					disabled={selectedTrackGroupIds.size < 2}
					className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover disabled:opacity-40"
				>
					選択した曲をまとめる
				</button>
			</div>

			<ul className="flex flex-col gap-1">
				{playlist.trackGroups.map((trackGroup) => (
					<li
						key={trackGroup.id}
						className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover"
					>
						<label className="flex min-w-0 flex-1 items-center gap-3">
							<input
								type="checkbox"
								checked={selectedTrackGroupIds.has(trackGroup.id)}
								onChange={() => toggleSelection(trackGroup.id)}
								aria-label="まとめる曲を選択"
							/>
							<div className="flex min-w-0 flex-col">
								{trackGroup.tracks.map((track) => (
									<span key={track.videoId} className="truncate text-sm">
										{track.sourceUrl}
									</span>
								))}
							</div>
						</label>
						<button
							type="button"
							onClick={() => remove(trackGroup.id)}
							className="shrink-0 text-sm text-muted hover:text-accent"
						>
							削除
						</button>
					</li>
				))}
			</ul>
		</main>
	);
}

export default App;
