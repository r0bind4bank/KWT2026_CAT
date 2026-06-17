// Target-side spell checking for Polish.
// Loads a real Hunspell dictionary (dictionary-pl) and runs it through nspell,
// entirely in the browser. If the dictionary can't be fetched (offline first
// load), the checker reports as unavailable instead of giving false errors.

import nspell from "./vendor/nspell.js";

// Dictionary is bundled in the repo so spell checking works fully offline.
// Paths resolve relative to this module, regardless of where the site is hosted.
const AFF_URL = new URL("../dict/pl.aff", import.meta.url);
const DIC_URL = new URL("../dict/pl.dic", import.meta.url);

const WORD_RE = /[\p{L}](?:[\p{L}’'-]*[\p{L}])?/gu;

class SpellChecker {
  constructor() {
    this.checker = null;
    this.ready = false;
    this.loading = null;
    this.ignored = new Set();
  }

  async load() {
    if (this.ready) return true;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const [aff, dic] = await Promise.all([
          fetch(AFF_URL).then((r) => r.text()),
          fetch(DIC_URL).then((r) => r.text())
        ]);
        this.checker = nspell(aff, dic);
        this.ready = true;
        return true;
      } catch (e) {
        console.warn("Spell checker unavailable:", e);
        this.ready = false;
        return false;
      }
    })();
    return this.loading;
  }

  ignore(word) {
    this.ignored.add(word.toLowerCase());
  }

  isCorrect(word) {
    if (!this.checker) return true;
    if (this.ignored.has(word.toLowerCase())) return true;
    if (/\d/.test(word)) return true; // skip tokens with digits
    return this.checker.correct(word) || this.checker.correct(word.toLowerCase());
  }

  suggest(word) {
    if (!this.checker) return [];
    return this.checker.suggest(word).slice(0, 6);
  }

  // Returns [{word, start, end, suggestions}] for misspelled tokens in `text`.
  check(text) {
    if (!this.ready || !this.checker) return [];
    const errors = [];
    for (const m of text.matchAll(WORD_RE)) {
      const word = m[0];
      if (word.length < 2) continue;
      if (!this.isCorrect(word)) {
        errors.push({
          word,
          start: m.index,
          end: m.index + word.length,
          suggestions: this.suggest(word)
        });
      }
    }
    return errors;
  }
}

export const spell = new SpellChecker();
