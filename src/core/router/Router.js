// src/core/router/Router.js
// Minimal hash-based router for static hosting (GitHub Pages friendly).
// Routes are defined as RegExp patterns matched against the hash path.
//
// Supported URLs:
//  - #/                 (root)
//  - #/section/<id>     (section page)
//
// Back/forward is handled via the native 'hashchange' event.

export default class Router {
  /**
   * @param {Object} options
   * @param {Array<{pattern:RegExp, handler:Function}>} options.routes
   * @param {string} [options.defaultPath='/']
   */
  constructor({ routes, defaultPath = '/' } = {}) {
    this.routes = Array.isArray(routes) ? routes : [];
    this.defaultPath = defaultPath;

    this._onHashChange = this._onHashChange.bind(this);
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);

    // If no hash present, normalize to default without creating an extra history entry.
    if (!window.location.hash || window.location.hash === '#') {
      this.replace(this.defaultPath);
      return;
    }

    this._dispatch(this._getPathFromHash(window.location.hash));
  }

  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  /**
   * Navigate by pushing a new hash entry.
   * @param {string} path - like '/', '/section/abc'
   */
  navigate(path) {
    const normalized = this._normalizePath(path);
    window.location.hash = '#' + normalized;
  }

  /**
   * Navigate by replacing the current history entry.
   * @param {string} path
   */
  replace(path) {
    const normalized = this._normalizePath(path);
    const base = window.location.href.split('#')[0];
    window.location.replace(base + '#' + normalized);
  }

  _onHashChange() {
    this._dispatch(this._getPathFromHash(window.location.hash));
  }

  _dispatch(path) {
    const normalized = this._normalizePath(path);

    for (const r of this.routes) {
      const m = normalized.match(r.pattern);
      if (m) {
        // Pass capture groups (if any) to handler
        r.handler(...m.slice(1));
        return;
      }
    }

    // No route matched → go to default
    this.replace(this.defaultPath);
  }

  _getPathFromHash(hash) {
    // hash is like "#/section/x" or "#/"
    const h = (hash || '').trim();
    if (!h || h === '#') return this.defaultPath;
    return h.startsWith('#') ? h.slice(1) : h;
  }

  _normalizePath(path) {
    let p = (path || '').trim();
    if (!p) p = this.defaultPath;
    if (!p.startsWith('/')) p = '/' + p;
    // remove trailing slash except root
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p;
  }
}
