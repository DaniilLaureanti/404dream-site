import { AudiobookPlayer } from './audiobook-player.js';
import { AUDIOBOOK_TRACKS } from './audiobook-tracks.js';
import { AudioSourceResolver, googleDriveSourceAdapter } from './audio-source-resolver.js';
import { BOOK_LINKS } from './page-config.js';
import { initializeBookPage } from './page-links.js';
import { startThoughts } from './thoughts.js';

initializeBookPage({ links: BOOK_LINKS });

const sourceResolver = new AudioSourceResolver({
  baseUrl: document.baseURI,
  adapters: [googleDriveSourceAdapter]
});

const audiobookElements = {
  root: document.getElementById('audiobookPlayer'),
  audio: document.getElementById('audiobookAudio'),
  title: document.getElementById('audioTrackTitle'),
  play: document.getElementById('audioPlay'),
  previous: document.getElementById('audioPrev'),
  next: document.getElementById('audioNext'),
  speed: document.getElementById('audioSpeed'),
  progress: document.getElementById('audioProgress'),
  currentTime: document.getElementById('audioCurrentTime'),
  duration: document.getElementById('audioDuration'),
  empty: document.getElementById('audioEmpty'),
  trackList: document.getElementById('audioTrackList')
};

const audiobookPlayer = new AudiobookPlayer({
  elements: audiobookElements,
  tracks: AUDIOBOOK_TRACKS,
  resolveSource: source => sourceResolver.resolve(source)
});

audiobookPlayer.mount();

startThoughts({
  container: document.getElementById('thoughts')
});
