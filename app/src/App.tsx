import { type FormEvent, useState } from "react";
import "./App.css";
import { useYouTubePlayer } from "./player/use-youtube-player";
import { createLocalStoragePlaylistRepository } from "./storage/playlist-repository";
import { usePlaybackSession } from "./use-playback-session";
import { usePlaylist } from "./use-playlist";

const repository = createLocalStoragePlaylistRepository(window.localStorage);

function App() {
	const { playlist, error, addFromUrl, remove } = usePlaylist(repository);
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
						onClick={() => playback.shufflePlay(playlist.trackGroups)}
						disabled={playlist.trackGroups.length === 0}
					>
						シャッフル再生
					</button>
					<button
						type="button"
						onClick={playback.previous}
						disabled={!playback.hasPrevious}
					>
						前へ
					</button>
					<button
						type="button"
						onClick={playback.next}
						disabled={!playback.hasNext}
					>
						次へ
					</button>
				</div>
				<p>
					{playback.currentTrack === null
						? "再生中の曲はありません"
						: `再生中: ${playback.currentTrack.sourceUrl}`}
				</p>
			</section>
			<ul>
				{playlist.trackGroups.map((trackGroup) => (
					<li key={trackGroup.id}>
						{trackGroup.tracks.map((track) => (
							<span key={track.videoId}>{track.sourceUrl}</span>
						))}
						<button type="button" onClick={() => remove(trackGroup.id)}>
							削除
						</button>
					</li>
				))}
			</ul>
		</main>
	);
}

export default App;
