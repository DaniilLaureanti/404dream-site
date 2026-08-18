import { AudiobookPlayer } from './audiobook-player.js';
import { AUDIOBOOK_TRACKS } from './audiobook-tracks.js';
import { AudioSourceResolver, googleDriveSourceAdapter } from './audio-source-resolver.js';
import { startThoughts } from './thoughts.js';
import { SITE_LINKS } from '../site/site-config.js';
import { initializeSiteShell } from '../site/site-shell.js';

initializeSiteShell({ links: SITE_LINKS });

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
