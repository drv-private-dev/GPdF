// src/core/i18n/i18n.js
// Lightweight i18n for UI strings only.
// Content (questions/theory HTML) must NOT be translated.

import uk from "./uk.js";
import fr from "./fr.js";
import en from "./en.js";

const DICTS = { uk, fr, en };

let currentLang = "uk";

/**
 * Detect language in this order:
 *  1) localStorage("gpdf.lang")
 *  2) <html lang="..">
 *  3) navigator.language
 * Falls back to "uk".
 */
export function initI18n() {
  const saved = safeGetLocalStorage("gpdf.lang");
  const htmlLang = (document.documentElement.getAttribute("lang") || "").trim();
  const navLang = (navigator.language || "").trim();

  const picked = (saved || htmlLang || navLang || "uk").slice(0, 2).toLowerCase();
  setLang(picked);
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  const l = (lang || "").slice(0, 2).toLowerCase();
  currentLang = DICTS[l] ? l : "uk";
  safeSetLocalStorage("gpdf.lang", currentLang);
}

/**
 * Translate UI key.
 * If key is missing, returns the key itself (so the UI never breaks).
 */
export function t(key, vars = null) {
  const k = String(key || "");
  const dict = DICTS[currentLang] || DICTS.uk || {};
  const raw = Object.prototype.hasOwnProperty.call(dict, k) ? dict[k] : k;
  if (!vars || typeof raw !== "string") return raw;

  // Simple templating: "Done {filled} of {total}"
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v === undefined || v === null ? "" : String(v);
  });
}

function safeGetLocalStorage(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeSetLocalStorage(k, v) {
  try {
    localStorage.setItem(k, String(v));
  } catch {
    // ignore (private mode / blocked storage)
  }
}
