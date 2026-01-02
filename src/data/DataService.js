// src/data/DataService.js
// Simple JSON loading service with in-memory cache (Map).
// NOTE: Keeps data formats unchanged; only centralizes fetch + caching.

const CONFIG = {
  // Project is served from repo root, so "data/..." is alongside index.html
  sectionsUrl: "./data/sections.json",
};

const _cache = new Map();

/**
 * Normalize URL/path so cache keys are stable and fetch works from index.html.
 * - Adds leading "./" for relative paths like "data/file.json"
 * - Leaves absolute URLs intact (http(s)://, /path)
 */
function normalizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  if (url.startsWith("./") || url.startsWith("../")) return url;
  return "./" + url;
}

async function loadJSON(url) {
  const norm = normalizeUrl(url);

  if (_cache.has(norm)) return _cache.get(norm);

  const res = await fetch(norm, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load " + norm);

  const data = await res.json();
  _cache.set(norm, data);
  return data;
}

async function getSectionsList() {
  return loadJSON(CONFIG.sectionsUrl);
}

async function getSectionFile(path) {
  // sections.json stores e.g. "data/section_addition_1.json"
  return loadJSON(path);
}

const DataService = {
  loadJSON,
  getSectionsList,
  getSectionFile,
  // exposed for potential debugging/tests (not used by app)
  _cache,
  _config: CONFIG,
};

export default DataService;
