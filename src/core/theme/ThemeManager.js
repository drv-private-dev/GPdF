// ThemeManager.js
// - setTheme / getTheme
// - Persists theme choice in localStorage
// - Applies theme via document.documentElement.dataset.theme (CSS variables)
// - Keeps Bootstrap 5.3 color mode in sync using data-bs-theme

const STORAGE_KEY = "gpdf_theme";
const THEMES = ["light", "dark", "blue", "green"];
const DEFAULT_THEME = "light";

function normalizeTheme(value) {
  const t = String(value ?? "").toLowerCase();
  return THEMES.includes(t) ? t : DEFAULT_THEME;
}

function applyToDom(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;

  // Bootstrap 5.3 color mode (keeps built-in components readable)
  root.setAttribute("data-bs-theme", theme === "dark" ? "dark" : "light");
}

export default {
  /**
   * Returns the current theme (from localStorage if available).
   * Always returns one of: light | dark | blue | green
   */
  getTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeTheme(saved);
    } catch {
      // ignore storage errors (private mode, blocked storage, etc.)
    }

    // If something already set it on <html>, respect it.
    const fromDom = document.documentElement?.dataset?.theme;
    return normalizeTheme(fromDom || DEFAULT_THEME);
  },

  /**
   * Sets theme and optionally persists it.
   */
  setTheme(theme, { persist = true } = {}) {
    const next = normalizeTheme(theme);
    applyToDom(next);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
    }

    return next;
  },

  /**
   * Call once on startup.
   */
  initTheme() {
    return this.setTheme(this.getTheme(), { persist: true });
  },

  THEMES,
};
