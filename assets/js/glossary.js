// Contextual glossary / term base. Detects which glossary terms appear in a
// source segment so the UI can highlight them and propose approved translations.

import { store } from "./store.js";
import { SEED_GLOSSARY } from "./data.js";

const KEY = "glossary";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class Glossary {
  constructor() {
    const saved = store.get(KEY, null);
    this.terms = saved || SEED_GLOSSARY.map(([source, target, note]) => ({ source, target, note: note || "" }));
    if (!saved) this.save();
  }

  save() {
    store.set(KEY, this.terms);
  }

  get size() {
    return this.terms.length;
  }

  add(source, target, note = "") {
    source = source.trim();
    target = target.trim();
    if (!source || !target) return;
    const existing = this.terms.find((t) => t.source.toLowerCase() === source.toLowerCase());
    if (existing) {
      existing.target = target;
      existing.note = note;
    } else {
      this.terms.push({ source, target, note });
    }
    this.terms.sort((a, b) => a.source.localeCompare(b.source));
    this.save();
  }

  remove(source) {
    this.terms = this.terms.filter((t) => t.source.toLowerCase() !== source.toLowerCase());
    this.save();
  }

  // Finds glossary terms occurring in `text` (whole-word, case-insensitive),
  // longest terms first so multi-word terms win over their components.
  match(text) {
    const hits = [];
    const sorted = [...this.terms].sort((a, b) => b.source.length - a.source.length);
    for (const term of sorted) {
      const re = new RegExp(`(?<![\\p{L}])${escapeRegExp(term.source)}(?![\\p{L}])`, "iu");
      const m = re.exec(text);
      if (m) hits.push({ ...term, index: m.index, length: m[0].length });
    }
    return hits.sort((a, b) => a.index - b.index);
  }

  clear() {
    this.terms = [];
    this.save();
  }
}

export const glossary = new Glossary();
