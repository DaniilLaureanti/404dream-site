const isPlaceholder = href => !href || /_URL$/i.test(href);

const shouldOpenSeparately = href => (
  /^https?:\/\//i.test(href) || /\.pdf(?:$|[?#])/i.test(href)
);

function configureLink(documentRef, { id, href }) {
  const element = documentRef.getElementById(id);
  if (!element) return;

  if (isPlaceholder(href)) {
    element.removeAttribute('href');
    element.removeAttribute('target');
    element.setAttribute('aria-disabled', 'true');
    element.classList.add('is-disabled');

    if (element.classList.contains('cta-primary')) {
      element.textContent = 'Скоро';
    }

    return;
  }

  element.href = href;
  element.removeAttribute('aria-disabled');
  element.classList.remove('is-disabled');

  if (shouldOpenSeparately(href)) {
    element.target = '_blank';
  }
}

export function initializeBookPage({ links, documentRef = globalThis.document }) {
  if (!documentRef) return;

  const year = documentRef.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const cover = documentRef.getElementById('bookCover');
  if (cover) cover.src = links.coverImg;

  [
    { id: 'ctaTop', href: links.bookPdf },
    { id: 'ctaBottom', href: links.bookPdf },
    { id: 'practicumBtn', href: links.practicum },
    { id: 'audioBtn', href: links.guidesAudio },
    { id: 'challengeBtn', href: links.challenge },
    { id: 'tgLink', href: links.telegram },
    { id: 'igLink', href: links.instagram },
    { id: 'ytLink', href: links.youtube }
  ].forEach(link => configureLink(documentRef, link));
}
