const isAvailableLink = value => typeof value === 'string' && value.trim().length > 0;

const shouldOpenSeparately = href => (
  /^https?:\/\//i.test(href) || /\.pdf(?:$|[?#])/i.test(href)
);

const getLabelTarget = element => (
  element.querySelector('[data-link-label]') || element
);

function disableLink(element) {
  element.removeAttribute('href');
  element.removeAttribute('target');
  element.removeAttribute('rel');
  element.setAttribute('aria-disabled', 'true');

  if (element.classList.contains('link-card')) element.classList.add('is-soon');
  else element.classList.add('is-disabled');

  if (element.dataset.disabledLabel) {
    getLabelTarget(element).textContent = element.dataset.disabledLabel;
  }
}

function enableLink(element, href) {
  element.setAttribute('href', href);
  element.removeAttribute('aria-disabled');
  element.classList.remove('is-soon', 'is-disabled');

  if (element.dataset.activeLabel) {
    getLabelTarget(element).textContent = element.dataset.activeLabel;
  }

  if (shouldOpenSeparately(href)) {
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
  } else {
    element.removeAttribute('target');
    element.removeAttribute('rel');
  }
}

export function initializeSiteShell({
  links,
  documentRef = globalThis.document,
  now = new Date()
} = {}) {
  if (!documentRef || !links) return;

  documentRef.querySelectorAll('[data-link-key]').forEach(element => {
    const href = links[element.dataset.linkKey];
    if (isAvailableLink(href)) enableLink(element, href.trim());
    else disableLink(element);
  });

  documentRef.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = String(now.getFullYear());
  });
}
