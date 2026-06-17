// Splits raw text into translatable segments (roughly one sentence each).
// Keeps it simple and dependency-free; good enough for a CAT-style workflow.

const ABBREV = new Set([
  "mr", "mrs", "ms", "dr", "prof", "st", "vs", "etc", "e.g", "i.e",
  "np", "itp", "itd", "tzn", "tj", "ok", "por"
]);

export function segment(text) {
  const out = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    let buf = "";
    const chars = [...line];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      buf += ch;
      if (".!?…".includes(ch)) {
        // peek next non-space char
        let j = i + 1;
        while (j < chars.length && chars[j] === " ") j++;
        const next = chars[j];
        const lastWord = buf.split(/\s+/).pop().replace(/[.!?…]+$/, "").toLowerCase();
        const isAbbrev = ABBREV.has(lastWord);
        const looksLikeEnd = !next || /[A-ZĄĆĘŁŃÓŚŹŻ"„(]/.test(next);
        if (!isAbbrev && looksLikeEnd) {
          out.push(buf.trim());
          buf = "";
        }
      }
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}
