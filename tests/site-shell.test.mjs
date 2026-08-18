import test from 'node:test';
import assert from 'node:assert/strict';

import { initializeSiteShell } from '../assets/js/site/site-shell.js';

class FakeClassList {
  constructor(...names) {
    this.names = new Set(names);
  }

  add(...names) {
    names.forEach(name => this.names.add(name));
  }

  remove(...names) {
    names.forEach(name => this.names.delete(name));
  }

  contains(name) {
    return this.names.has(name);
  }
}

class FakeElement {
  constructor({ key, classes = [], label = null } = {}) {
    this.dataset = key ? { linkKey: key } : {};
    this.classList = new FakeClassList(...classes);
    this.attributes = new Map();
    this.textContent = '';
    this.label = label;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return selector === '[data-link-label]' ? this.label : null;
  }
}

test('site shell activates configured links and keeps placeholders inert', () => {
  const external = new FakeElement({ key: 'external', classes: ['link-card', 'is-soon'] });
  const internal = new FakeElement({ key: 'internal' });
  const placeholderLabel = new FakeElement();
  const placeholder = new FakeElement({ key: 'placeholder', label: placeholderLabel });
  placeholder.dataset.disabledLabel = 'Скоро';
  const year = new FakeElement();

  const documentRef = {
    querySelectorAll(selector) {
      if (selector === '[data-link-key]') return [external, internal, placeholder];
      if (selector === '[data-current-year]') return [year];
      return [];
    }
  };

  initializeSiteShell({
    links: {
      external: 'https://example.com',
      internal: '/contact.html',
      placeholder: null
    },
    documentRef,
    now: new Date('2030-01-01T00:00:00Z')
  });

  assert.equal(external.getAttribute('href'), 'https://example.com');
  assert.equal(external.getAttribute('target'), '_blank');
  assert.equal(external.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(external.classList.contains('is-soon'), false);

  assert.equal(internal.getAttribute('href'), '/contact.html');
  assert.equal(internal.getAttribute('target'), null);

  assert.equal(placeholder.getAttribute('href'), null);
  assert.equal(placeholder.getAttribute('aria-disabled'), 'true');
  assert.equal(placeholder.classList.contains('is-disabled'), true);
  assert.equal(placeholderLabel.textContent, 'Скоро');
  assert.equal(year.textContent, '2030');
});
