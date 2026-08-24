const PDFJS_VERSION = '5.7.284';
const PDFJS_CDN_ROOT = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;
const PDFJS_MODULE_URL = `${PDFJS_CDN_ROOT}/build/pdf.min.mjs`;
const PDFJS_WORKER_URL = `${PDFJS_CDN_ROOT}/build/pdf.worker.min.mjs`;

let pdfJsLibraryPromise;

async function loadPdfJsLibrary() {
  if (!pdfJsLibraryPromise) {
    pdfJsLibraryPromise = import(PDFJS_MODULE_URL).then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return pdfjs;
    });
  }

  return pdfJsLibraryPromise;
}

export function calculatePageRenderMetrics({
  pageWidth,
  availableWidth,
  devicePixelRatio = 1,
  maxCssScale = 1.5,
  maxPixelRatio = 2
}) {
  const safePageWidth = Math.max(Number(pageWidth) || 1, 1);
  const safeAvailableWidth = Math.max(Number(availableWidth) || 1, 1);
  const cssScale = Math.min(safeAvailableWidth / safePageWidth, maxCssScale);
  const outputScale = Math.min(Math.max(Number(devicePixelRatio) || 1, 1), maxPixelRatio);

  return { cssScale, outputScale };
}

class PdfJsDocument {
  constructor(pdfDocument) {
    this.pdfDocument = pdfDocument;
    this.pageCount = pdfDocument.numPages;
    this.activeRenderTask = null;
  }

  async renderPage({ pageNumber, canvas, availableWidth, devicePixelRatio = 1 }) {
    if (this.activeRenderTask) this.activeRenderTask.cancel();

    const page = await this.pdfDocument.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const { cssScale, outputScale } = calculatePageRenderMetrics({
      pageWidth: unscaledViewport.width,
      availableWidth,
      devicePixelRatio
    });
    const viewport = page.getViewport({ scale: cssScale });
    const context = canvas.getContext('2d', { alpha: false });

    if (!context) throw new Error('PDF reader: canvas 2D context is unavailable');

    canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
    canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      background: 'rgb(255, 255, 255)'
    });

    this.activeRenderTask = renderTask;

    try {
      await renderTask.promise;
    } finally {
      if (this.activeRenderTask === renderTask) this.activeRenderTask = null;
      page.cleanup();
    }
  }

  async destroy() {
    if (this.activeRenderTask) this.activeRenderTask.cancel();
    await this.pdfDocument.destroy();
  }
}

export async function loadPdfDocument(source, { onProgress } = {}) {
  const pdfjs = await loadPdfJsLibrary();
  const loadingTask = pdfjs.getDocument({
    url: source,
    cMapUrl: `${PDFJS_CDN_ROOT}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_CDN_ROOT}/standard_fonts/`,
    wasmUrl: `${PDFJS_CDN_ROOT}/wasm/`
  });

  if (onProgress) loadingTask.onProgress = onProgress;

  const pdfDocument = await loadingTask.promise;
  return new PdfJsDocument(pdfDocument);
}
