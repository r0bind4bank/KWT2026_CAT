// ============================================================
// LINGUA · KWT2026 CAT — application controller
// Wires together the segment editor, translation memory,
// contextual glossary and Polish spell checker.
// ============================================================

import { store } from "./store.js";
import { segment as segmentText } from "./segmenter.js";
import { tm, similarity } from "./tm.js";
import { glossary } from "./glossary.js";
import { spell } from "./spellcheck.js";
import { SAMPLE_SOURCE } from "./data.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const RING_CIRC = 2 * Math.PI * 19; // ≈ 119.38

// ── State ──────────────────────────────────────────────────
let segments = store.get("segments", []); // [{id, source, target, status}]
let activeId = null;
let uid = segments.reduce((m, s) => Math.max(m, s.id), 0) + 1;

// ── Utilities ──────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function persist() { store.set("segments", segments); }
function getSeg(id) { return segments.find((s) => s.id === id); }
function wordCount(s) { return (s.trim().match(/\S+/g) || []).length; }

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ── Source rendering with glossary highlights ──────────────
function renderSource(text) {
  const hits = glossary.match(text);
  if (!hits.length) return escapeHtml(text);
  let html = "";
  let cursor = 0;
  // hits already sorted by index; guard against overlaps
  let lastEnd = 0;
  for (const h of hits) {
    if (h.index < lastEnd) continue;
    html += escapeHtml(text.slice(cursor, h.index));
    const word = text.slice(h.index, h.index + h.length);
    html += `<span class="term" title="${escapeHtml(h.source)} → ${escapeHtml(h.target)}">${escapeHtml(word)}</span>`;
    cursor = h.index + h.length;
    lastEnd = cursor;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}

// ── Backdrop (spell underlines) ────────────────────────────
function renderBackdrop(text, errors) {
  if (!errors.length) return escapeHtml(text) + "\n";
  let html = "";
  let cursor = 0;
  for (const e of errors) {
    html += escapeHtml(text.slice(cursor, e.start));
    html += `<mark>${escapeHtml(text.slice(e.start, e.end))}</mark>`;
    cursor = e.end;
  }
  html += escapeHtml(text.slice(cursor));
  return html + "\n"; // trailing newline keeps backdrop height in sync
}

function autosize(ta) {
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

const spellTimers = new WeakMap();
function refreshSpell(seg, taWrap) {
  const backdrop = taWrap.querySelector(".ta-backdrop");
  const errors = spell.check(seg.target);
  backdrop.innerHTML = renderBackdrop(seg.target, errors);
  if (seg.id === activeId) renderQA(seg, errors);
  return errors;
}

// ── Build one segment row ──────────────────────────────────
function buildRow(seg) {
  const row = document.createElement("div");
  row.className = "seg";
  row.dataset.id = seg.id;

  row.innerHTML = `
    <div class="seg-idx">${seg.id}<span class="status-dot ${seg.status}"></span></div>
    <div class="seg-src">${renderSource(seg.source)}</div>
    <div class="seg-tgt">
      <div class="ta-wrap">
        <div class="ta-backdrop"></div>
        <textarea class="ta-input" placeholder="Translate into Polish…" spellcheck="false">${escapeHtml(seg.target)}</textarea>
      </div>
    </div>`;

  const ta = row.querySelector(".ta-input");
  const taWrap = row.querySelector(".ta-wrap");

  requestAnimationFrame(() => autosize(ta));
  refreshSpell(seg, taWrap);

  ta.addEventListener("focus", () => setActive(seg.id));
  ta.addEventListener("input", () => {
    seg.target = ta.value;
    seg.status = ta.value.trim() ? "edited" : "draft"; // editing reverts a confirmed segment
    autosize(ta);
    persist();
    updateRowStatus(row, seg);
    // sync backdrop text immediately (without errors) then debounce real check
    taWrap.querySelector(".ta-backdrop").innerHTML = renderBackdrop(seg.target, []);
    clearTimeout(spellTimers.get(ta));
    spellTimers.set(ta, setTimeout(() => refreshSpell(seg, taWrap), 350));
    updateStats();
  });
  ta.addEventListener("scroll", () => {
    taWrap.querySelector(".ta-backdrop").scrollTop = ta.scrollTop;
  });
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      confirmSegment(seg.id);
    }
  });

  return row;
}

function updateRowStatus(row, seg) {
  const dot = row.querySelector(".status-dot");
  dot.className = `status-dot ${seg.status}`;
}

// ── Render all segments ────────────────────────────────────
function render() {
  const wrap = $("#segments");
  wrap.innerHTML = "";
  for (const seg of segments) wrap.appendChild(buildRow(seg));
  $("#emptyState").hidden = segments.length > 0;
  updateStats();
}

// ── Active segment + insight panels ────────────────────────
function setActive(id) {
  if (activeId === id) return;
  activeId = id;
  $$(".seg").forEach((r) => r.classList.toggle("active", +r.dataset.id === id));
  const seg = getSeg(id);
  if (!seg) return;
  renderTM(seg);
  renderGlossaryPanel(seg);
  const wrap = $$(".seg").find((r) => +r.dataset.id === id)?.querySelector(".ta-wrap");
  if (wrap) refreshSpell(seg, wrap);
}

function confirmSegment(id) {
  const seg = getSeg(id);
  if (!seg || !seg.target.trim()) { toast("Nothing to confirm yet"); return; }
  seg.status = "confirmed";
  tm.upsert(seg.source, seg.target);
  persist();
  const row = $$(".seg").find((r) => +r.dataset.id === id);
  if (row) updateRowStatus(row, seg);
  updateStats();
  $("#tmBadge").textContent = tm.size;
  toast("Segment confirmed → saved to memory");
  // jump to next unconfirmed segment
  const idx = segments.findIndex((s) => s.id === id);
  const next = segments.slice(idx + 1).find((s) => s.status !== "confirmed") || segments[idx + 1];
  if (next) {
    const nextTa = $$(".seg").find((r) => +r.dataset.id === next.id)?.querySelector(".ta-input");
    nextTa?.focus();
    nextTa?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

// ── Translation Memory panel ───────────────────────────────
function diffSource(matchSrc, currentSrc) {
  const curWords = new Set(currentSrc.toLowerCase().match(/\p{L}+/gu) || []);
  return matchSrc.replace(/\p{L}+/gu, (w) =>
    curWords.has(w.toLowerCase()) ? escapeHtml(w) : `<mark>${escapeHtml(w)}</mark>`
  );
}
function scoreClass(s) { return s === 100 ? "s100" : s >= 85 ? "shi" : s >= 70 ? "smid" : "slo"; }

function renderTM(seg) {
  const box = $("#tmCards");
  const hint = $("#tmHint");
  const matches = tm.search(seg.source, { limit: 6, threshold: 50 });
  if (!matches.length) {
    hint.textContent = "No memory matches for this segment yet. Confirm translations to grow your memory.";
    box.innerHTML = "";
    return;
  }
  hint.textContent = "Click a match to drop it into the target field.";
  box.innerHTML = matches.map((m) => `
    <div class="card click" data-tm="${escapeHtml(m.target)}">
      <div class="card-top">
        <span class="score ${scoreClass(m.score)}">${m.score}%</span>
        <span class="hintline">${m.score === 100 ? "exact match" : "fuzzy match"}</span>
      </div>
      <div class="src">${diffSource(m.source, seg.source)}</div>
      <div class="tgt">${escapeHtml(m.target)}</div>
    </div>`).join("");

  box.querySelectorAll("[data-tm]").forEach((card) => {
    card.addEventListener("click", () => {
      applyToTarget(card.dataset.tm, true);
      toast("Match inserted from memory");
    });
  });
}

// ── Glossary panel ─────────────────────────────────────────
function renderGlossaryPanel(seg) {
  const box = $("#glossCards");
  const hint = $("#glossHint");
  const hits = glossary.match(seg.source);
  if (!hits.length) {
    hint.textContent = "No glossary terms detected in this segment.";
    box.innerHTML = "";
  } else {
    hint.textContent = "Click a term to insert the approved translation at the cursor.";
    box.innerHTML = hits.map((h) => `
      <div class="card click term-card" data-term="${escapeHtml(h.target)}">
        <div class="pair">
          <div><b>${escapeHtml(h.source)}</b> → <span class="pl">${escapeHtml(h.target)}</span></div>
          ${h.note ? `<div class="note">${escapeHtml(h.note)}</div>` : ""}
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-term]").forEach((card) => {
      card.addEventListener("click", () => {
        insertAtCursor(card.dataset.term);
        toast("Term inserted");
      });
    });
  }
  renderTermList();
}

function renderTermList() {
  $("#glossCount").textContent = glossary.size;
  $("#glossBadge").textContent = glossary.size;
  const list = $("#termList");
  list.innerHTML = glossary.terms.map((t) => `
    <div class="termrow">
      <span class="t-src">${escapeHtml(t.source)}</span>
      <span class="t-tgt">${escapeHtml(t.target)}</span>
      <button class="t-del" data-del="${escapeHtml(t.source)}" title="Delete">×</button>
    </div>`).join("");
  list.querySelectorAll("[data-del]").forEach((b) => {
    b.addEventListener("click", () => {
      glossary.remove(b.dataset.del);
      if (activeId != null) { const s = getSeg(activeId); if (s) renderGlossaryPanel(s); }
      rerenderSources();
    });
  });
}

// ── Spelling (QA) panel ────────────────────────────────────
function renderQA(seg, errors) {
  $("#qaBadge").textContent = errors.length;
  const box = $("#qaCards");
  const hint = $("#qaHint");
  if (!spell.ready) {
    hint.textContent = "Loading the Polish dictionary…";
    box.innerHTML = "";
    return;
  }
  if (!seg.target.trim()) {
    hint.textContent = "Type a Polish translation to spell-check it.";
    box.innerHTML = "";
    return;
  }
  if (!errors.length) {
    hint.textContent = "";
    box.innerHTML = `<div class="panel-empty"><div class="big">✓</div>No spelling issues found.</div>`;
    return;
  }
  hint.textContent = "Click a suggestion to fix the word, or ignore it.";
  box.innerHTML = errors.map((e, i) => `
    <div class="card qa-card" data-i="${i}">
      <div>Unknown word: <span class="bad-word">${escapeHtml(e.word)}</span></div>
      <div class="sugg">
        ${e.suggestions.map((s) => `<button data-fix="${escapeHtml(s)}" data-word="${escapeHtml(e.word)}">${escapeHtml(s)}</button>`).join("")}
        <button class="ignore" data-ignore="${escapeHtml(e.word)}">ignore</button>
      </div>
    </div>`).join("");

  box.querySelectorAll("[data-fix]").forEach((b) => {
    b.addEventListener("click", () => replaceWord(b.dataset.word, b.dataset.fix));
  });
  box.querySelectorAll("[data-ignore]").forEach((b) => {
    b.addEventListener("click", () => {
      spell.ignore(b.dataset.ignore);
      const wrap = activeWrap();
      if (wrap) refreshSpell(getSeg(activeId), wrap);
    });
  });
}

// ── Target field helpers (operate on the active segment) ───
function activeTextarea() {
  return $$(".seg").find((r) => +r.dataset.id === activeId)?.querySelector(".ta-input");
}
function activeWrap() {
  return $$(".seg").find((r) => +r.dataset.id === activeId)?.querySelector(".ta-wrap");
}

function fireInput(ta) {
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyToTarget(text, replace) {
  const ta = activeTextarea();
  if (!ta) return;
  ta.value = replace ? text : ta.value + text;
  fireInput(ta);
  ta.focus();
}

function insertAtCursor(text) {
  const ta = activeTextarea();
  if (!ta) return;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(end);
  const pad = before && !/\s$/.test(before) ? " " : "";
  ta.value = before + pad + text + after;
  const pos = (before + pad + text).length;
  fireInput(ta);
  ta.focus();
  ta.setSelectionRange(pos, pos);
}

function replaceWord(word, replacement) {
  const seg = getSeg(activeId);
  const ta = activeTextarea();
  if (!seg || !ta) return;
  const re = new RegExp(`(?<![\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "u");
  seg.target = seg.target.replace(re, replacement);
  ta.value = seg.target;
  fireInput(ta);
}

// ── Stats / progress ───────────────────────────────────────
function updateStats() {
  const total = segments.length;
  const confirmed = segments.filter((s) => s.status === "confirmed").length;
  const words = segments.reduce((n, s) => n + wordCount(s.source), 0);
  $("#statConfirmed").textContent = `${confirmed} / ${total} segments`;
  $("#statWords").textContent = `${words} words`;
  const pct = total ? Math.round((confirmed / total) * 100) : 0;
  $("#ringPct").textContent = pct + "%";
  $("#ring").style.strokeDashoffset = RING_CIRC * (1 - pct / 100);
  $("#tmBadge").textContent = tm.size;
}

function rerenderSources() {
  $$(".seg").forEach((row) => {
    const seg = getSeg(+row.dataset.id);
    if (seg) row.querySelector(".seg-src").innerHTML = renderSource(seg.source);
  });
}

// ── Loading projects ───────────────────────────────────────
function loadText(text) {
  const parts = segmentText(text);
  if (!parts.length) { toast("No text found"); return; }
  segments = parts.map((p) => ({ id: uid++, source: p, target: "", status: "draft" }));
  activeId = null;
  persist();
  render();
  // auto-focus first segment
  const first = $$(".seg")[0]?.querySelector(".ta-input");
  first?.focus();
  toast(`${segments.length} segments ready`);
}

// ── File helpers ───────────────────────────────────────────
function download(name, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
//  Event wiring
// ============================================================
function wire() {
  $("#btnSample").addEventListener("click", () => loadText(SAMPLE_SOURCE));
  $("#btnSample2").addEventListener("click", () => loadText(SAMPLE_SOURCE));

  const triggerImport = () => $("#fileInput").click();
  $("#btnImport").addEventListener("click", triggerImport);
  $("#btnImport2").addEventListener("click", triggerImport);
  $("#fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadText(reader.result);
    reader.readAsText(file);
    e.target.value = "";
  });

  // tabs
  $("#tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    $$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${tab.dataset.tab}`));
  });

  // data menu
  const pop = $("#menuPop");
  $("#btnMenu").addEventListener("click", (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; });
  document.addEventListener("click", () => (pop.hidden = true));
  pop.addEventListener("click", (e) => {
    const act = e.target.dataset.act;
    if (!act) return;
    if (act === "export-tm") download("translation-memory.json", tm.exportJSON(), "application/json");
    if (act === "import-tm") $("#tmFileInput").click();
    if (act === "export-bi") {
      const txt = segments.map((s) => `${s.source}\t${s.target}`).join("\n");
      download("translation.txt", txt);
    }
    if (act === "reset") {
      if (confirm("Reset everything? This clears segments, translation memory and glossary.")) {
        store.remove("segments"); store.remove("tm"); store.remove("glossary");
        location.reload();
      }
    }
  });
  $("#tmFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const n = tm.importJSON(reader.result);
        toast(`Imported ${n} memory entries`);
        $("#tmBadge").textContent = tm.size;
        if (activeId != null) { const s = getSeg(activeId); if (s) renderTM(s); }
      } catch { toast("Invalid TM file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // glossary form
  $("#glossForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    glossary.add(f.src.value, f.tgt.value, f.note.value);
    f.reset();
    if (activeId != null) { const s = getSeg(activeId); if (s) renderGlossaryPanel(s); }
    rerenderSources();
    toast("Term added to glossary");
  });
}

// ── Spell checker bootstrap ────────────────────────────────
async function initSpell() {
  const chip = $("#spellStatus");
  const ok = await spell.load();
  chip.classList.remove("chip-loading");
  if (ok) {
    chip.classList.add("chip-on");
    chip.innerHTML = `<span class="dot"></span> Spell-check · PL`;
    // re-run spell check on all loaded segments
    $$(".seg").forEach((row) => {
      const seg = getSeg(+row.dataset.id);
      if (seg) refreshSpell(seg, row.querySelector(".ta-wrap"));
    });
  } else {
    chip.classList.add("chip-off");
    chip.innerHTML = `<span class="dot"></span> Spell-check offline`;
  }
}

// ── Boot ───────────────────────────────────────────────────
function boot() {
  $("#tmBadge").textContent = tm.size;
  $("#glossBadge").textContent = glossary.size;
  renderTermList();
  wire();
  render();
  if (segments.length) {
    const first = $$(".seg")[0];
    if (first) setActive(+first.dataset.id);
  }
  initSpell();
}

boot();
