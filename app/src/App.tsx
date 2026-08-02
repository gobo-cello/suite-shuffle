import { type FormEvent, useState } from "react";
import "./App.css";
import {
	createShuffledPlaybackQueue,
	type PlaybackQueue,
} from "./domain/playback-queue";
import {
	addTrackGroup,
	createPlaylist,
	createTrackGroup,
	type Playlist,
	removeTrackGroup,
} from "./domain/playlist";
import { parseTrack, UnsupportedYouTubeUrlError } from "./domain/track";
import { useYouTubePlayer } from "./player/use-youtube-player";
import { createLocalStoragePlaylistRepository } from "./storage/playlist-repository";

const repository = createLocalStoragePlaylistRepository(window.localStorage);

function loadInitialPlaylist(): Playlist {
	return repository.load() ?? createPlaylist("");
}

function App() {
	const [playlist, setPlaylist] = useState<Playlist>(loadInitialPlaylist);
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [queue, setQueue] = useState<PlaybackQueue>([]);
	const [currentIndex, setCurrentIndex] = useState<number | null>(null);
	const currentTrack = currentIndex === null ? null : queue[currentIndex];
	const playerContainerRef = useYouTubePlayer({
		videoId: currentTrack?.videoId ?? null,
		onEnded: handleNext,
	});

	function updatePlaylist(next: Playlist) {
		setPlaylist(next);
		repository.save(next);
	}

	function handleShufflePlay() {
		const nextQueue = createShuffledPlaybackQueue(playlist.trackGroups);
		setQueue(nextQueue);
		setCurrentIndex(nextQueue.length > 0 ? 0 : null);
	}

	function handleNext() {
		setCurrentIndex((index) => {
			if (index === null || index + 1 >= queue.length) {
				return null;
			}
			return index + 1;
		});
	}

	function handlePrevious() {
		setCurrentIndex((index) =>
			index === null || index === 0 ? index : index - 1,
		);
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			const track = parseTrack(url);
			updatePlaylist(addTrackGroup(playlist, createTrackGroup("", [track])));
			setUrl("");
			setError(null);
		} catch (cause) {
			if (!(cause instanceof UnsupportedYouTubeUrlError)) {
				throw cause;
			}
			setError(cause.message);
		}
	}

	function handleRemove(trackGroupId: Playlist["trackGroups"][number]["id"]) {
		updatePlaylist(removeTrackGroup(playlist, trackGroupId));
	}

	return (
		<main>
			<h1>Suite Shuffle</h1>
			<form onSubmit={handleSubmit}>
				<label htmlFor="track-url">YouTubeまたはYouTube MusicのURL</label>
				<input
					id="track-url"
					type="url"
					value={url}
					onChange={(event) => setUrl(event.target.value)}
					placeholder="https://www.youtube.com/watch?v=..."
				/>
				<button type="submit">追加</button>
			</form>
			{error !== null && <p role="alert">{error}</p>}
			<section className="player">
				<div className="player-frame" ref={playerContainerRef} />
				<div className="player-controls">
					<button
						type="button"
						onClick={handleShufflePlay}
						disabled={playlist.trackGroups.length === 0}
					>
						シャッフル再生
					</button>
					<button
						type="button"
						onClick={handlePrevious}
						disabled={currentIndex === null || currentIndex === 0}
					>
						前へ
					</button>
					<button
						type="button"
						onClick={handleNext}
						disabled={currentIndex === null || currentIndex + 1 >= queue.length}
					>
						次へ
					</button>
				</div>
				<p>
					{currentTrack === null
						? "再生中の曲はありません"
						: `再生中: ${currentTrack.sourceUrl}`}
				</p>
			</section>
			<ul>
				{playlist.trackGroups.map((trackGroup) => (
					<li key={trackGroup.id}>
						{trackGroup.tracks.map((track) => (
							<span key={track.videoId}>{track.sourceUrl}</span>
						))}
						<button type="button" onClick={() => handleRemove(trackGroup.id)}>
							削除
						</button>
					</li>
				))}
			</ul>
		</main>
	);
}

export default App;
