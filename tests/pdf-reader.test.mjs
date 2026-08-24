import test from 'node:test';
import assert from 'node:assert/strict';

import { clampPdfPage } from '../assets/js/book/pdf-reader.js';
import { calculatePageRenderMetrics } from '../assets/js/book/pdfjs-adapter.js';

test('PDF page numbers are clamped to the available document range', () => {
  assert.equal(clampPdfPage(-10, 420), 1);
  assert.equal(clampPdfPage(27.9, 420), 27);
  assert.equal(clampPdfPage(999, 420), 420);
  assert.equal(clampPdfPage('not-a-number', 420), 1);
});

test('PDF rendering fits the page width and limits retina resolution', () => {
  assert.deepEqual(calculatePageRenderMetrics({
    pageWidth: 600,
    availableWidth: 300,
    devicePixelRatio: 3
  }), {
    cssScale: 0.5,
    outputScale: 2
  });

  assert.deepEqual(calculatePageRenderMetrics({
    pageWidth: 600,
    availableWidth: 1200,
    devicePixelRatio: 1
  }), {
    cssScale: 1.5,
    outputScale: 1
  });
});
