const DEFAULT_BASE_URL = 'https://404dream.info/';

export const googleDriveSourceAdapter = Object.freeze({
  supports(url) {
    return url.hostname === 'drive.google.com';
  },

  resolve(url) {
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    const fileId = pathMatch ? pathMatch[1] : url.searchParams.get('id');

    if (!fileId) return url.href;

    const directUrl = new URL('https://drive.google.com/uc');
    directUrl.searchParams.set('export', 'download');
    directUrl.searchParams.set('id', fileId);

    const resourceKey = url.searchParams.get('resourcekey');
    if (resourceKey) directUrl.searchParams.set('resourcekey', resourceKey);

    return directUrl.href;
  }
});

export class AudioSourceResolver {
  constructor({ baseUrl = DEFAULT_BASE_URL, adapters = [] } = {}) {
    this.baseUrl = baseUrl;
    this.adapters = [...adapters];
  }

  resolve(rawSource) {
    const source = String(rawSource || '').trim();
    if (!source) return '';

    const url = new URL(source, this.baseUrl);
    const adapter = this.adapters.find(candidate => candidate.supports(url));

    return adapter ? adapter.resolve(url) : url.href;
  }
}
