const REQUIRED_ELEMENTS = Object.freeze([
  'root',
  'audio',
  'title',
  'play',
  'previous',
  'next',
  'speed',
  'progress',
  'currentTime',
  'duration',
  'empty',
  'trackList'
]);

export function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0');

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${remainingSeconds}`
    : `${minutes}:${remainingSeconds}`;
}

export function prepareAudiobookTracks(tracks, resolveSource) {
  return tracks.flatMap((track, index) => {
    try {
      const src = resolveSource(track && track.src);
      if (!src) return [];

      return [{
        id: String(track.id || `track-${index + 1}`),
        title: String(track.title || `Глава ${index + 1}`),
        src
      }];
    } catch (error) {
      return [];
    }
  });
}

export class AudiobookPlayer {
  constructor({ elements, tracks = [], resolveSource = source => source }) {
    this.elements = elements;
    this.validateElements();
    this.documentRef = elements.root.ownerDocument;
    this.tracks = prepareAudiobookTracks(tracks, resolveSource);
    this.currentTrackIndex = -1;
    this.trackButtons = [];
    this.isMounted = false;

    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handlePreviousClick = this.handlePreviousClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleSpeedChange = this.handleSpeedChange.bind(this);
    this.handleProgressInput = this.handleProgressInput.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handleAudioError = this.handleAudioError.bind(this);
    this.updatePlayButton = this.updatePlayButton.bind(this);
    this.updateTimeline = this.updateTimeline.bind(this);

  }

  validateElements() {
    const missing = REQUIRED_ELEMENTS.filter(name => !this.elements[name]);

    if (missing.length > 0) {
      throw new Error(`AudiobookPlayer: отсутствуют элементы: ${missing.join(', ')}`);
    }
  }

  mount() {
    if (this.isMounted) return this;

    this.bindEvents();
    this.renderTrackList();
    this.isMounted = true;

    if (this.tracks.length > 0) {
      this.elements.empty.hidden = true;
      this.elements.trackList.hidden = false;
      this.loadTrack(0);
    } else {
      this.elements.empty.hidden = false;
      this.elements.trackList.hidden = true;
      this.updateControls();
    }

    return this;
  }

  destroy() {
    if (!this.isMounted) return;

    this.unbindEvents();
    this.elements.audio.pause();
    this.elements.audio.removeAttribute('src');
    this.elements.audio.load();
    this.elements.trackList.replaceChildren();
    this.trackButtons = [];
    this.isMounted = false;
  }

  bindEvents() {
    const { audio, play, previous, next, speed, progress } = this.elements;

    play.addEventListener('click', this.handlePlayClick);
    previous.addEventListener('click', this.handlePreviousClick);
    next.addEventListener('click', this.handleNextClick);
    speed.addEventListener('change', this.handleSpeedChange);
    progress.addEventListener('input', this.handleProgressInput);
    audio.addEventListener('play', this.updatePlayButton);
    audio.addEventListener('pause', this.updatePlayButton);
    audio.addEventListener('timeupdate', this.updateTimeline);
    audio.addEventListener('loadedmetadata', this.updateTimeline);
    audio.addEventListener('durationchange', this.updateTimeline);
    audio.addEventListener('ended', this.handleEnded);
    audio.addEventListener('error', this.handleAudioError);
  }

  unbindEvents() {
    const { audio, play, previous, next, speed, progress } = this.elements;

    play.removeEventListener('click', this.handlePlayClick);
    previous.removeEventListener('click', this.handlePreviousClick);
    next.removeEventListener('click', this.handleNextClick);
    speed.removeEventListener('change', this.handleSpeedChange);
    progress.removeEventListener('input', this.handleProgressInput);
    audio.removeEventListener('play', this.updatePlayButton);
    audio.removeEventListener('pause', this.updatePlayButton);
    audio.removeEventListener('timeupdate', this.updateTimeline);
    audio.removeEventListener('loadedmetadata', this.updateTimeline);
    audio.removeEventListener('durationchange', this.updateTimeline);
    audio.removeEventListener('ended', this.handleEnded);
    audio.removeEventListener('error', this.handleAudioError);
  }

  renderTrackList() {
    this.elements.trackList.replaceChildren();
    this.trackButtons = this.tracks.map((track, index) => {
      const button = this.documentRef.createElement('button');
      const number = this.documentRef.createElement('span');
      const title = this.documentRef.createElement('span');

      button.type = 'button';
      button.className = 'audio-track';
      button.setAttribute('aria-label', `Воспроизвести: ${track.title}`);
      button.addEventListener('click', () => this.loadTrack(index, { autoplay: true }));

      number.className = 'audio-track-number';
      number.textContent = String(index + 1).padStart(2, '0');
      title.textContent = track.title;

      button.append(number, title);
      this.elements.trackList.appendChild(button);
      return button;
    });
  }

  loadTrack(index, { autoplay = false } = {}) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrackIndex = index;
    const track = this.tracks[index];
    const { audio, title, progress, currentTime, duration, speed } = this.elements;

    title.textContent = track.title;
    audio.src = track.src;
    audio.playbackRate = Number(speed.value) || 1;
    audio.load();
    progress.value = '0';
    currentTime.textContent = '0:00';
    duration.textContent = '0:00';

    this.updateActiveTrack();
    this.updateControls();
    this.updatePlayButton();

    if (autoplay) this.startPlayback();
  }

  async startPlayback() {
    try {
      await this.elements.audio.play();
    } catch (error) {
      this.updatePlayButton();
    }
  }

  handlePlayClick() {
    if (this.elements.audio.paused) this.startPlayback();
    else this.elements.audio.pause();
  }

  handlePreviousClick() {
    this.loadTrack(this.currentTrackIndex - 1, { autoplay: true });
  }

  handleNextClick() {
    this.loadTrack(this.currentTrackIndex + 1, { autoplay: true });
  }

  handleSpeedChange() {
    this.elements.audio.playbackRate = Number(this.elements.speed.value) || 1;
  }

  handleProgressInput() {
    const { audio, progress } = this.elements;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  }

  handleEnded() {
    if (this.currentTrackIndex < this.tracks.length - 1) {
      this.loadTrack(this.currentTrackIndex + 1, { autoplay: true });
    } else {
      this.updatePlayButton();
    }
  }

  handleAudioError() {
    if (this.currentTrackIndex < 0) return;

    const track = this.tracks[this.currentTrackIndex];
    this.elements.title.textContent = `${track.title} — файл недоступен`;
    this.updatePlayButton();
  }

  updatePlayButton() {
    const isPlaying = !this.elements.audio.paused && !this.elements.audio.ended;
    this.elements.play.textContent = isPlaying ? '⏸' : '▶';
    this.elements.play.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Воспроизвести');
  }

  updateTimeline() {
    const { audio, progress, currentTime, duration } = this.elements;
    const total = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;

    currentTime.textContent = formatAudioTime(current);
    duration.textContent = formatAudioTime(total);
    progress.value = total > 0 ? String((current / total) * 100) : '0';
  }

  updateControls() {
    const hasTracks = this.tracks.length > 0;
    const { play, previous, next, speed, progress } = this.elements;

    play.disabled = !hasTracks;
    previous.disabled = !hasTracks || this.currentTrackIndex <= 0;
    next.disabled = !hasTracks || this.currentTrackIndex >= this.tracks.length - 1;
    speed.disabled = !hasTracks;
    progress.disabled = !hasTracks;
  }

  updateActiveTrack() {
    this.trackButtons.forEach((button, index) => {
      const isActive = index === this.currentTrackIndex;
      button.classList.toggle('is-active', isActive);

      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }
}
