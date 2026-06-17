// Translation Memory: stores source→target pairs and finds exact + fuzzy matches.
// Similarity is character-level Levenshtein, normalised to a 0–100% score,
// the same metric CAT tools surface as the "fuzzy match" percentage.

import { store } from "./store.js";
import { SEED_TM } from "./data.js";

const KEY = "tm";

function norm(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Bounded Levenshtein distance (two-row variant).
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function similarity(a, b) {
  a = norm(a);
  b = norm(b);
  if (!a && !b) return 100;
  const dist = levenshtein(a, b);
  const max = Math.max(a.length, b.length);
  return Math.round((1 - dist / max) * 100);
}

class TranslationMemory {
  constructor() {
    const saved = store.get(KEY, null);
    this.entries = saved || SEED_TM.map(([s, t]) => ({ source: s, target: t, ts: Date.now() }));
    if (!saved) this.save();
  }

  save() {
    store.set(KEY, this.entries);
  }

  get size() {
    return this.entries.length;
  }

  // Upsert: identical source replaces target.
  upsert(source, target) {
    source = source.trim();
    target = target.trim();
    if (!source || !target) return;
    const n = norm(source);
    const existing = this.entries.find((e) => norm(e.source) === n);
    if (existing) {
      existing.target = target;
      existing.ts = Date.now();
    } else {
      this.entries.unshift({ source, target, ts: Date.now() });
    }
    this.save();
  }

  // Returns top matches sorted by score desc, with at least `threshold`%.
  search(source, { limit = 5, threshold = 55 } = {}) {
    source = source.trim();
    if (!source) return [];
    return this.entries
      .map((e) => ({ ...e, score: similarity(source, e.source) }))
      .filter((m) => m.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  clear() {
    this.entries = [];
    this.save();
  }

  exportJSON() {
    return JSON.stringify(this.entries, null, 2);
  }

  importJSON(text) {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error("Invalid TM file");
    let added = 0;
    for (const e of data) {
      if (e && e.source && e.target) {
        this.upsert(e.source, e.target);
        added++;
      }
    }
    return added;
  }
}

export const tm = new TranslationMemory();
