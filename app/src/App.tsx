import { type FormEvent, useState } from "react";
import "./App.css";
import {
	addTrackGroup,
	createPlaylist,
	createTrackGroup,
	type Playlist,
	removeTrackGroup,
} from "./domain/playlist";
import { parseTrack, UnsupportedYouTubeUrlError } from "./domain/track";
import { createLocalStoragePlaylistRepository } from "./storage/playlist-repository";

const repository = createLocalStoragePlaylistRepository(window.localStorage);

function loadInitialPlaylist(): Playlist {
	return repository.load() ?? createPlaylist("");
}

function App() {
	const [playlist, setPlaylist] = useState<Playlist>(loadInitialPlaylist);
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);

	function updatePlaylist(next: Playlist) {
		setPlaylist(next);
		repository.save(next);
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
