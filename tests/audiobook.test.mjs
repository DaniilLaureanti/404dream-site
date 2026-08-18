import test from 'node:test';
import assert from 'node:assert/strict';

import { AudioSourceResolver, googleDriveSourceAdapter } from '../assets/js/book/audio-source-resolver.js';
import { formatAudioTime, prepareAudiobookTracks } from '../assets/js/book/audiobook-player.js';

test('audio source resolver supports direct and Google Drive links', () => {
  const resolver = new AudioSourceResolver({
    baseUrl: 'https://404dream.info/book.html',
    adapters: [googleDriveSourceAdapter]
  });

  assert.equal(
    resolver.resolve('./audio/chapter-01.mp3'),
    'https://404dream.info/audio/chapter-01.mp3'
  );
  assert.equal(
    resolver.resolve('https://drive.google.com/file/d/file-id/view?resourcekey=key-1'),
    'https://drive.google.com/uc?export=download&id=file-id&resourcekey=key-1'
  );
});

test('playlist preparation filters empty sources and supplies defaults', () => {
  const tracks = prepareAudiobookTracks([
    { id: 'intro', title: 'Введение', src: '/intro.mp3' },
    { src: '' },
    { src: '/chapter-02.mp3' }
  ], source => source);

  assert.deepEqual(tracks, [
    { id: 'intro', title: 'Введение', src: '/intro.mp3' },
    { id: 'track-3', title: 'Глава 3', src: '/chapter-02.mp3' }
  ]);
  assert.equal(formatAudioTime(65), '1:05');
  assert.equal(formatAudioTime(3661), '1:01:01');
});
