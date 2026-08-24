const REQUIRED_ELEMENTS = Object.freeze([
  'root',
  'viewport',
  'stage',
  'canvas',
  'status',
  'previous',
  'next',
  'pageInput',
  'totalPages'
]);

export function clampPdfPage(value, pageCount) {
  const total = Math.max(1, Math.floor(Number(pageCount) || 1));
  const page = Math.floor(Number(value) || 1);
  return Math.min(Math.max(page, 1), total);
}

export class PdfReader {
  constructor({
    elements,
    source,
    loadDocument,
    windowRef = globalThis.window
  }) {
    this.elements = elements;
    this.source = source;
    this.loadDocument = loadDocument;
    this.windowRef = windowRef;
    this.pdfDocument = null;
    this.pageCount = 0;
    this.currentPage = 1;
    this.renderRequestId = 0;
    this.isLoading = true;
    this.isRendering = false;
    this.isMounted = false;
    this.resizeObserver = null;
    this.resizeTimer = 0;
    this.lastStageWidth = 0;
    this.touchStart = null;

    this.handlePrevious = this.handlePrevious.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.validateElements();
  }

  validateElements() {
    const missing = REQUIRED_ELEMENTS.filter(name => !this.elements[name]);
    if (missing.length > 0) {
      throw new Error(`PdfReader: отсутствуют элементы: ${missing.join(', ')}`);
    }
  }

  mount() {
    if (this.isMounted) return this;

    this.isMounted = true;
    this.bindEvents();
    this.updateControls();
    this.load();
    return this;
  }

  async destroy() {
    if (!this.isMounted) return;

    this.unbindEvents();
    this.resizeObserver?.disconnect();
    if (this.resizeTimer) this.windowRef.clearTimeout(this.resizeTimer);
    await this.pdfDocument?.destroy?.();
    this.isMounted = false;
  }

  bindEvents() {
    const { root, viewport, previous, next, pageInput } = this.elements;
    previous.addEventListener('click', this.handlePrevious);
    next.addEventListener('click', this.handleNext);
    pageInput.addEventListener('change', this.handlePageChange);
    pageInput.addEventListener('keydown', this.handleKeydown);
    root.addEventListener('keydown', this.handleKeydown);
    viewport.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    viewport.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  unbindEvents() {
    const { root, viewport, previous, next, pageInput } = this.elements;
    previous.removeEventListener('click', this.handlePrevious);
    next.removeEventListener('click', this.handleNext);
    pageInput.removeEventListener('change', this.handlePageChange);
    pageInput.removeEventListener('keydown', this.handleKeydown);
    root.removeEventListener('keydown', this.handleKeydown);
    viewport.removeEventListener('touchstart', this.handleTouchStart);
    viewport.removeEventListener('touchend', this.handleTouchEnd);
  }

  async load() {
    const { root, status, pageInput, totalPages } = this.elements;
    root.dataset.state = 'loading';
    root.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Загружаем книгу…';

    try {
      this.pdfDocument = await this.loadDocument(this.source, {
        onProgress: ({ loaded, total }) => {
          if (!total) return;
          const percentage = Math.min(99, Math.round((loaded / total) * 100));
          status.textContent = `Загружаем книгу… ${percentage}%`;
        }
      });

      this.pageCount = this.pdfDocument.pageCount;
      pageInput.max = String(this.pageCount);
      totalPages.textContent = String(this.pageCount);
      this.isLoading = false;
      this.setupResizeObserver();
      await this.goToPage(1, { resetScroll: false });
    } catch (error) {
      this.showError();
    }
  }

  async goToPage(pageNumber, { resetScroll = true } = {}) {
    if (!this.pdfDocument || this.pageCount < 1) return;

    const requestedPage = clampPdfPage(pageNumber, this.pageCount);
    const requestId = ++this.renderRequestId;
    const { root, viewport, stage, canvas, status, pageInput } = this.elements;
    const stageWidth = Math.max(stage.clientWidth, 1);

    this.isRendering = true;
    root.dataset.state = 'rendering';
    root.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = `Открываем страницу ${requestedPage}…`;
    this.updateControls();

    try {
      await this.pdfDocument.renderPage({
        pageNumber: requestedPage,
        canvas,
        availableWidth: stageWidth,
        devicePixelRatio: this.windowRef?.devicePixelRatio || 1
      });

      if (requestId !== this.renderRequestId) return;

      this.currentPage = requestedPage;
      this.lastStageWidth = stageWidth;
      canvas.hidden = false;
      canvas.setAttribute('aria-label', `Страница ${requestedPage} из ${this.pageCount} книги «Бог в нейронах»`);
      pageInput.value = String(requestedPage);
      status.hidden = true;
      root.dataset.state = 'ready';
      root.setAttribute('aria-busy', 'false');
      if (resetScroll) viewport.scrollTop = 0;
    } catch (error) {
      if (requestId !== this.renderRequestId || error?.name === 'RenderingCancelledException') return;
      this.showError();
    } finally {
      if (requestId === this.renderRequestId) {
        this.isRendering = false;
        this.updateControls();
      }
    }
  }

  setupResizeObserver() {
    if (!this.windowRef?.ResizeObserver) return;

    this.resizeObserver = new this.windowRef.ResizeObserver(entries => {
      const width = Math.round(entries[0]?.contentRect?.width || 0);
      if (!width || Math.abs(width - this.lastStageWidth) < 4 || this.isLoading) return;

      if (this.resizeTimer) this.windowRef.clearTimeout(this.resizeTimer);
      this.resizeTimer = this.windowRef.setTimeout(() => {
        this.goToPage(this.currentPage, { resetScroll: false });
      }, 160);
    });

    this.resizeObserver.observe(this.elements.stage);
  }

  handlePrevious() {
    this.goToPage(this.currentPage - 1);
  }

  handleNext() {
    this.goToPage(this.currentPage + 1);
  }

  handlePageChange() {
    this.goToPage(this.elements.pageInput.value);
  }

  handleKeydown(event) {
    if (event.currentTarget === this.elements.pageInput && event.key === 'Enter') {
      event.preventDefault();
      this.handlePageChange();
      return;
    }

    if (event.target === this.elements.pageInput) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.handlePrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.handleNext();
    }
  }

  handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    this.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  handleTouchEnd(event) {
    const touch = event.changedTouches?.[0];
    if (!touch || !this.touchStart) return;

    const deltaX = touch.clientX - this.touchStart.x;
    const deltaY = touch.clientY - this.touchStart.y;
    this.touchStart = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    if (deltaX < 0) this.handleNext();
    else this.handlePrevious();
  }

  showError() {
    const { root, status } = this.elements;
    this.isLoading = false;
    this.isRendering = false;
    root.dataset.state = 'error';
    root.setAttribute('aria-busy', 'false');
    status.hidden = false;
    status.textContent = 'Не удалось открыть книгу внутри страницы. Используйте кнопку «Скачать PDF».';
    this.updateControls();
  }

  updateControls() {
    const unavailable = this.isLoading || this.isRendering || !this.pdfDocument;
    const { previous, next, pageInput } = this.elements;
    previous.disabled = unavailable || this.currentPage <= 1;
    next.disabled = unavailable || this.currentPage >= this.pageCount;
    pageInput.disabled = unavailable;
  }
}
