/* English-Voc – Vokabeltrainer Englisch C1/C2 (amerikanisches Englisch)
   Reines JavaScript, keine Abhängigkeiten. Fortschritt liegt in localStorage. */
(() => {
'use strict';

const APP_VERSION = '1.0.1';
const LS_KEY = 'english-voc-v1';
const GAP_MIN = 8, GAP_MAX = 20;          // Wiederholabstand in Sitzungen
const CATS = ['Umwelt und Nachhaltigkeit', 'Wissenschaft und Technik', 'Kunst und Kultur', 'Politik und Gesellschaft',
  'Recht und Kriminalität', 'Wirtschaft und Finanzen', 'Gesundheit und Medizin', 'Bildung und Forschung',
  'Arbeit und Beruf', 'Gefühle und Persönlichkeit', 'Argumentieren und Überzeugen',
  'Phrasal Verbs und Redewendungen', 'Allgemein'];

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const filled = v => Array.isArray(v) ? v.some(x => String(x).trim()) : !!(v && String(v).trim());
const pl = (n, one, many) => n === 1 ? one : many;

/* ---------- Icons ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  speak: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  share: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path d="M7 4l13 8-13 8V4z"/>'
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
const FLAG_US = '<svg viewBox="0 0 26 18" aria-hidden="true"><rect width="26" height="18" fill="#fff"/>' +
  [0, 2, 4, 6, 8, 10, 12].map(i => `<rect y="${i * 18 / 13}" width="26" height="${18 / 13 + .05}" fill="#B22234"/>`).join('') +
  '<rect width="12" height="9.7" fill="#3C3B6E"/><g fill="#fff">' +
  [1.6, 4, 6.4, 8.8, 11.2].flatMap(y => [2, 5, 8, 10.6].map(x => `<circle cx="${x + (y > 5 ? 0 : 0)}" cy="${y - .2}" r=".55"/>`)).join('') + '</g></svg>';
const FLAG_DE = '<svg viewBox="0 0 26 18" aria-hidden="true"><rect width="26" height="6" fill="#000"/><rect y="6" width="26" height="6" fill="#DD0000"/><rect y="12" width="26" height="6" fill="#FFCE00"/></svg>';

/* ---------- Zustand ---------- */
const defaults = () => ({
  v: 1, sess: 0, cards: {}, lastBackup: null, dirty: 0,
  settings: { lang: 'en', theme: null, level: 'all', cat: 'all', size: 20 }
});
let storageOk = true;
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? normalize(JSON.parse(raw)) : defaults();
  } catch (e) { storageOk = false; return defaults(); }
}
function normalize(s) {
  const d = defaults();
  if (!s || typeof s !== 'object') return d;
  const out = Object.assign(d, s);
  out.settings = Object.assign(defaults().settings, s.settings || {});
  if (typeof out.cards !== 'object' || !out.cards) out.cards = {};
  out.sess = Math.max(0, parseInt(out.sess, 10) || 0);
  out.dirty = Math.max(0, parseInt(out.dirty, 10) || 0);
  return out;
}
let state = load();
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { storageOk = false; } }
const S = () => state.settings;

/* ---------- Daten ---------- */
let cards = [];
const byId = new Map();
const st = c => state.cards[c.id];
const filtered = () => cards.filter(c => (S().level === 'all' || c.level === S().level) && (S().cat === 'all' || c.cat === S().cat));
const inBox = () => cards.filter(c => st(c) && st(c).s === 'w');
const isDue = c => st(c) && st(c).s === 'w' && (st(c).due || 0) <= state.sess;

async function loadData() {
  const res = await fetch('vocab.json');
  if (!res.ok) throw new Error('vocab.json: HTTP ' + res.status);
  const d = await res.json();
  cards = [].concat(d.C1 || [], d.C2 || []);
  cards.forEach(c => byId.set(c.id, c));
}

/* ---------- Wort des Tages ---------- */
function localDateKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function wordOfTheDay() {
  let h = 2166136261;
  const k = localDateKey();
  for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return cards[h % cards.length];
}

/* ---------- Kartenansicht ---------- */
const stripQuotes = s => String(s).trim().replace(/^["“„]+|["”“]+$/g, '');
const chips = a => a.filter(x => String(x).trim()).map(x => `<span class="chip">${esc(x)}</span>`).join('');
function boxes(c) {
  const out = [];
  const add = (label, html, cls) => { if (html) out.push(`<section class="box ${cls || ''}"><h4>${label}</h4>${html}</section>`); };
  add('Deutsch', filled(c.de) && `<p class="big">${esc(c.de)}</p>`, S().lang === 'en' ? 'hl' : '');
  add('Definition', filled(c.def) && `<p>${esc(c.def)}</p>`);
  add('Synonyms', filled(c.syn) && chips(c.syn));
  add('Antonyms', filled(c.ant) && chips(c.ant));
  add('Example', filled(c.example) && `<p><q>${esc(stripQuotes(c.example))}</q></p>`);
  add('IELTS Writing', filled(c.ielts_writing) && `<p><q>${esc(stripQuotes(c.ielts_writing))}</q></p>`);
  add('IELTS Speaking', filled(c.ielts_speaking) && `<p><q>${esc(stripQuotes(c.ielts_speaking))}</q></p>`);
  add('Wortfamilie', filled(c.family) && chips(c.family));
  add('Kollokationen', filled(c.collocations) && chips(c.collocations));
  add('Register', filled(c.register) && `<span class="badge reg">${esc(c.register)}</span>`);
  add('Häufiger Fehler', filled(c.mistake) && `<p>${esc(c.mistake)}</p>`, 'warnbox');
  return out.join('');
}
const speakBtn = c => `<button class="speak" type="button" data-speak="${c.id}" aria-label="Aussprache anhören">${icon('speak')}</button>`;
const levelBadge = c => `<span class="badge ${c.level === 'C2' ? 'c2' : ''}">${esc(c.level)}</span>`;
function headInfo(c) {
  return `<div class="meta">${filled(c.pos) ? `<span class="chip">${esc(c.pos)}</span>` : ''}${levelBadge(c)}<span class="chip">${esc(c.cat)}</span></div>`;
}
// Vorderseite: Englisch zuerst (Wort + IPA) oder Deutsch zuerst
function frontHtml(c) {
  if (S().lang === 'en') {
    return `<div class="word">${esc(c.en)}</div>${filled(c.ipa) ? `<div class="ipa">${esc(c.ipa)}</div>` : ''}` +
      `<div class="meta">${filled(c.pos) ? `<span class="chip">${esc(c.pos)}</span>` : ''}${levelBadge(c)}</div>`;
  }
  return `<div class="word de">${esc(c.de)}</div><div class="meta">${filled(c.pos) ? `<span class="chip">${esc(c.pos)}</span>` : ''}${levelBadge(c)}</div>`;
}
// Rückseite: vollständige Karte inkl. Wort, Wortart, IPA, Niveau, Thema
function backHtml(c) {
  // Deutsch zuerst: das englische Wort ist die gesuchte Übersetzung und wird umrandet
  const hl = S().lang === 'de' ? ' hl' : '';
  return `<div class="back"><div class="head-en${hl}"><div class="word">${esc(c.en)}</div>` +
    `${filled(c.ipa) ? `<div class="ipa">${esc(c.ipa)}</div>` : ''}<div style="margin-top:8px">${speakBtn(c)}</div>` +
    `<div style="margin-top:8px">${headInfo(c)}</div></div>${boxes(c)}</div>`;
}
function speak(id) {
  const c = byId.get(+id);
  if (!c || !('speechSynthesis' in window)) { toast('Sprachausgabe nicht verfügbar', true); return; }
  try {
    const synth = window.speechSynthesis;
    // Nur abbrechen, wenn wirklich etwas läuft; ein cancel() direkt vor speak() verschluckt die Ausgabe auf iOS.
    const busy = synth.speaking || synth.pending;
    if (busy) synth.cancel();
    const u = new SpeechSynthesisUtterance(c.en);
    u.lang = 'en-US'; u.rate = .9; u.volume = 1;
    // Android liefert "en_US", iOS "en-US": beide Schreibweisen zulassen, sonst irgendeine englische Stimme.
    const voices = synth.getVoices();
    const norm = x => String(x.lang).replace('_', '-').toLowerCase();
    const v = voices.find(x => norm(x) === 'en-us') || voices.find(x => norm(x).startsWith('en'));
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onerror = e => { if (e.error && e.error !== 'canceled' && e.error !== 'interrupted') toast('Vorlesen nicht möglich (' + e.error + ')', true); };
    const go = () => { if (synth.paused) synth.resume(); synth.speak(u); };
    if (busy) setTimeout(go, 80); else go();
  } catch (e) { toast('Vorlesen nicht möglich', true); }
}
if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) { /* egal */ } }

/* ---------- Sitzung ---------- */
let view = 'home';
let sess = null;           // { q, i, revealed, missed, answered, ok, mode }
let wotdOpen = false;
const openItems = new Set();
let kastenLimit = 50;

function buildQueue(mode) {
  const size = S().size, pool = filtered();
  let q = [];
  if (mode === 'kasten') {
    q = inBox().sort((a, b) => (st(a).due || 0) - (st(b).due || 0)).slice(0, size);
  } else {
    const due = pool.filter(isDue).sort((a, b) => (st(a).due || 0) - (st(b).due || 0));
    q = due.slice(0, Math.ceil(size * .6));
    const fresh = shuffle(pool.filter(c => !st(c)));
    q.push(...fresh.slice(0, size - q.length));
    if (q.length < size) q.push(...due.slice(Math.ceil(size * .6), Math.ceil(size * .6) + size - q.length));
    if (q.length < size) { // Fallback: schon gewusste Karten wiederholen
      const known = shuffle(pool.filter(c => st(c) && st(c).s === 'k'));
      q.push(...known.slice(0, size - q.length));
    }
  }
  return shuffle(q);
}
function startSession(mode) {
  const q = buildQueue(mode);
  if (!q.length) { toast('Keine Karten verfügbar', true); return; }
  sess = { q, i: 0, revealed: false, missed: [], answered: 0, ok: 0, mode, done: false };
  view = 'session';
  render();
}
function reveal() { if (sess && !sess.revealed && !sess.done) { sess.revealed = true; render(); } }
// Gemeinsam für Sitzung und Wort des Tages: Nicht gewusst -> Kasten, Wiederkehr in 8 bis 20 Sitzungen
function applyAnswer(c, ok) {
  const r = state.cards[c.id] || (state.cards[c.id] = { s: 'w', due: 0, r: 0, w: 0 });
  if (ok) { r.s = 'k'; r.r = (r.r || 0) + 1; delete r.due; }
  else { r.s = 'w'; r.w = (r.w || 0) + 1; r.due = state.sess + rand(GAP_MIN, GAP_MAX); }
  r.t = Date.now();
  state.dirty++;
  save();
}
function answerWotd(ok) {
  const w = wordOfTheDay();
  if (state.wotd && state.wotd.date === localDateKey()) return;   // pro Tag nur einmal
  applyAnswer(w, ok);
  state.wotd = { date: localDateKey(), id: w.id, ok };
  save(); render();
  toast(ok ? 'Gewusst ✓' : 'Im Kasten „Nicht gewusst“');
}
function answer(ok) {
  if (!sess || sess.done || !sess.revealed) return;
  const c = sess.q[sess.i];
  applyAnswer(c, ok);
  if (ok) sess.ok++; else sess.missed.push(c);
  sess.answered++; sess.i++; sess.revealed = false;
  save();
  if (sess.i >= sess.q.length) finishSession(); else render();
}
function finishSession() {
  if (!sess) return;
  if (sess.answered > 0) { state.sess++; state.dirty++; save(); }
  sess.done = true;
  render();
}

/* ---------- Rendering ---------- */
const app = $('#app');
function setView(v) { view = v; if (v !== 'session') sess = null; render(); window.scrollTo(0, 0); }

function render() {
  document.body.classList.toggle('in-session', view === 'session');
  document.querySelectorAll('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'));
  $('#lang-en').setAttribute('aria-pressed', S().lang === 'en');
  $('#lang-de').setAttribute('aria-pressed', S().lang === 'de');
  const n = inBox().length, kb = $('#kbadge');
  kb.hidden = !n; kb.textContent = n > 999 ? '999+' : n;
  if (view === 'session') app.innerHTML = sess.done ? resultView() : sessionView();
  else if (view === 'kasten') app.innerHTML = kastenView();
  else if (view === 'more') app.innerHTML = moreView();
  else app.innerHTML = homeView();
}

function backupPill() {
  if (!state.lastBackup && state.dirty === 0) return '';
  if (state.dirty === 0) return `<span class="pill ok">Gesichert ${icon('check').replace('class="i"', 'class="i" style="width:14px;height:14px"')}</span>`;
  return `<span class="pill warn">Seit letzter Sicherung: ${state.dirty} ${pl(state.dirty, 'Änderung', 'Änderungen')}</span>`;
}

function wotdAnswer(w) {
  const a = state.wotd && state.wotd.date === localDateKey() && state.wotd.id === w.id ? state.wotd : null;
  if (a) return `<div style="text-align:center;margin-top:14px"><span class="pill ${a.ok ? 'ok' : 'warn'}">${a.ok ? 'Gewusst ✓' : 'Im Kasten „Nicht gewusst“'}</span></div>`;
  return `<div class="actions"><button class="btn bad" type="button" data-act="wotd-no">${icon('x')} Nicht gewusst</button><button class="btn ok" type="button" data-act="wotd-yes">${icon('check')} Gewusst</button></div>`;
}
function homeView() {
  const pool = filtered();
  const known = pool.filter(c => st(c) && st(c).s === 'k').length;
  const box = pool.filter(c => st(c) && st(c).s === 'w').length;
  const fresh = pool.length - known - box;
  const due = pool.filter(isDue).length;
  const w = wordOfTheDay();
  const lv = l => cards.filter(c => c.level === l);
  const kn = l => lv(l).filter(c => st(c) && st(c).s === 'k').length;
  const catOpts = ['all', ...CATS].map(c => {
    const cnt = cards.filter(x => (S().level === 'all' || x.level === S().level) && (c === 'all' || x.cat === c)).length;
    return `<option value="${esc(c)}" ${S().cat === c ? 'selected' : ''}>${c === 'all' ? 'Alle Themen' : esc(c)} (${cnt})</option>`;
  }).join('');
  const lvBtn = (v, l) => `<button type="button" data-level="${v}" aria-pressed="${S().level === v}">${l}</button>`;
  return `<div class="stack">
    <section class="card wotd">
      <div class="row"><span class="lab grow">Wort des Tages</span>${levelBadge(w)}</div>
      <div class="flash" style="padding:8px 0 0">
        ${wotdOpen ? `<div data-act="wotd" role="button" tabindex="0" aria-expanded="true">${backHtml(w)}</div>${wotdAnswer(w)}` : `<div class="front" style="min-height:0;padding:8px 0" data-act="wotd" role="button" tabindex="0" aria-expanded="false">${frontHtml(w)}
          <div class="hint">Antippen für die ganze Karte</div></div>`}
      </div>
    </section>

    <section class="card stack">
      <div class="filters">
        <div class="levels" role="group" aria-label="Niveau">${lvBtn('all', 'C1 + C2')}${lvBtn('C1', 'C1')}${lvBtn('C2', 'C2')}</div>
        <select id="cat" aria-label="Thema">${catOpts}</select>
      </div>
      <div class="stats">
        <div><b>${fresh}</b><span>neu</span></div>
        <div><b>${box}</b><span>nicht gewusst</span></div>
        <div><b>${known}</b><span>gewusst</span></div>
      </div>
      <button class="btn primary block" type="button" data-act="start" ${pool.length ? '' : 'disabled'}>${icon('play')} Sitzung starten</button>
      <div class="small muted" style="text-align:center">${S().size} Karten · ${due} ${pl(due, 'Wiederholung fällig', 'Wiederholungen fällig')} · Sitzung Nr. ${state.sess + 1}</div>
    </section>

    <section class="card stack">
      <div class="small"><b>C1</b> <span class="muted">${kn('C1')} / ${lv('C1').length}</span><div class="bar"><i style="width:${kn('C1') / lv('C1').length * 100}%"></i></div></div>
      <div class="small"><b>C2</b> <span class="muted">${kn('C2')} / ${lv('C2').length}</span><div class="bar"><i style="width:${kn('C2') / lv('C2').length * 100}%"></i></div></div>
      <div>${backupPill()}${storageOk ? '' : ' <span class="pill warn">Speicher nicht verfügbar</span>'}</div>
    </section>
  </div>`;
}

function sessionView() {
  const c = sess.q[sess.i];
  const pct = sess.i / sess.q.length * 100;
  return `<div>
    <div class="progress"><span class="small muted">${sess.i + 1} / ${sess.q.length}</span><div class="bar"><i style="width:${pct}%"></i></div>
      <button class="btn sm" type="button" data-act="end">Beenden</button></div>
    <section class="card flash">
      ${sess.revealed ? backHtml(c) : `<div class="front" data-act="flip" role="button" tabindex="0" aria-label="Karte umdrehen">${frontHtml(c)}
        <div class="hint">Antippen zum Umdrehen</div></div>
      ${S().lang === 'en' ? `<div style="margin-top:6px">${speakBtn(c)}</div>` : ''}`}
    </section>
    <div class="sticky-actions">${sess.revealed
      ? `<div class="actions"><button class="btn bad" type="button" data-act="no">${icon('x')} Nicht gewusst</button><button class="btn ok" type="button" data-act="yes">${icon('check')} Gewusst</button></div>`
      : `<div class="actions" style="grid-template-columns:1fr"><button class="btn primary" type="button" data-act="flip">Umdrehen</button></div>`}</div>
  </div>`;
}

function resultView() {
  const missed = sess.missed;
  const list = missed.map(c => `<li><div class="head" style="cursor:default"><div class="t"><b>${esc(c.en)}</b><span>${esc(c.de)}</span></div>${levelBadge(c)}</div></li>`).join('');
  return `<div class="stack">
    <section class="card result stack">
      <div class="big">${sess.ok} / ${sess.answered}</div>
      <div class="muted">${sess.answered ? 'Sitzung abgeschlossen' : 'Keine Karte beantwortet'} · ${sess.ok} gewusst, ${missed.length} nicht gewusst</div>
      ${missed.length ? `<div class="small muted">Nicht gewusste Karten kommen in ${GAP_MIN} bis ${GAP_MAX} Sitzungen wieder.</div>` : ''}
      <div class="actions"><button class="btn" type="button" data-act="home">Zur Startseite</button><button class="btn primary" type="button" data-act="${sess.mode === 'kasten' ? 'kasten-start' : 'start'}">Weiter</button></div>
    </section>
    ${missed.length ? `<h2>Nicht gewusst</h2><ul class="list">${list}</ul>` : ''}
  </div>`;
}

function dueLabel(r) {
  const n = (r.due || 0) - state.sess;
  return n <= 0 ? 'fällig' : `in ${n} ${pl(n, 'Sitzung', 'Sitzungen')}`;
}
function kastenView() {
  const all = inBox().sort((a, b) => (st(a).due || 0) - (st(b).due || 0) || a.en.localeCompare(b.en));
  const shown = all.slice(0, kastenLimit);
  const due = all.filter(isDue).length;
  const items = shown.map(c => {
    const r = st(c), open = openItems.has(c.id);
    return `<li><button class="head" type="button" data-toggle="${c.id}" aria-expanded="${open}">
      <div class="t"><b>${esc(c.en)}</b><span>${esc(c.de)}</span></div>
      <span class="badge ${isDue(c) ? 'reg' : ''}">${dueLabel(r)}</span>${levelBadge(c)}</button>
      ${open ? `<div class="body">${backHtml(c)}<div class="actions"><button class="btn sm" type="button" data-known="${c.id}">${icon('check')} Doch gewusst</button><button class="btn sm" type="button" data-speak="${c.id}">${icon('speak')} Anhören</button></div></div>` : ''}</li>`;
  }).join('');
  return `<div class="stack">
    <section class="card stack">
      <div class="row"><div class="grow"><b>Kasten „Nicht gewusst“</b><div class="small muted">${all.length} ${pl(all.length, 'Karte', 'Karten')} · ${due} fällig</div></div></div>
      <button class="btn primary block" type="button" data-act="kasten-start" ${all.length ? '' : 'disabled'}>${icon('play')} Kasten üben</button>
    </section>
    ${all.length ? `<ul class="list">${items}</ul>` : '<div class="empty">Der Kasten ist leer. Karten, die du nicht gewusst hast, landen hier.</div>'}
    ${all.length > shown.length ? `<button class="btn block" type="button" data-act="more-items">Mehr anzeigen (${all.length - shown.length})</button>` : ''}
  </div>`;
}

function moreView() {
  const sizeOpts = [10, 20, 30, 50].map(n => `<option value="${n}" ${S().size === n ? 'selected' : ''}>${n} Karten</option>`).join('');
  const when = state.lastBackup ? new Date(state.lastBackup).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : null;
  return `<div class="stack">
    <h2 style="margin-top:6px">Sitzung</h2>
    <section class="card stack"><label class="small muted" for="size">Karten pro Sitzung</label><select id="size">${sizeOpts}</select></section>

    <h2>Sichern und Wiederherstellen</h2>
    <section class="card stack">
      <div class="small muted">Dein Fortschritt liegt nur auf diesem Gerät. Sichere ihn regelmäßig, z. B. in Dateien oder iCloud.</div>
      <div>${backupPill() || '<span class="pill warn">Noch nicht gesichert</span>'}${when ? ` <span class="small muted">zuletzt ${esc(when)}</span>` : ''}</div>
      <button class="btn primary block" type="button" data-act="backup">${icon('share')} Sichern</button>
      <label class="btn block" for="restore">${icon('restore')} Wiederherstellen</label>
      <input id="restore" type="file" accept="application/json,.json">
    </section>

    <h2>Installation</h2>
    <section class="card small muted">iPhone: in Safari auf „Teilen“ tippen, dann „Zum Home-Bildschirm“. Android: Browsermenü, dann „App installieren“.</section>

    <h2>Info</h2>
    <section class="card small muted">English-Voc ${APP_VERSION} · ${cards.length} Karten (C1 ${cards.filter(c => c.level === 'C1').length}, C2 ${cards.filter(c => c.level === 'C2').length}) · amerikanisches Englisch<br>
      <button class="btn sm" type="button" data-act="reset" style="margin-top:12px;color:var(--bad)">Fortschritt zurücksetzen</button></section>
  </div>`;
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg, err) {
  const t = $('#toast');
  t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Sichern / Wiederherstellen ---------- */
function backupFileName() { return `english-voc-sicherung-${localDateKey()}.json`; }
function markBackedUp(ts) { state.lastBackup = ts; state.dirty = 0; save(); render(); toast('Gesichert ✓'); }
function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function backup() {
  const ts = Date.now();
  const snap = Object.assign({}, state, { lastBackup: ts, dirty: 0 });
  const json = JSON.stringify({ app: 'English-Voc', format: 1, exported: new Date(ts).toISOString(), state: snap });
  let file;
  try { file = new File([json], backupFileName(), { type: 'application/json' }); }
  catch (e) { toast('Sichern nicht möglich', true); return; }
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'English-Voc Sicherung' });
    } else {
      download(file);
    }
    markBackedUp(ts);
  } catch (e) {
    if (e && e.name === 'AbortError') return;        // Nutzer hat abgebrochen: nicht als gesichert markieren
    try { download(file); markBackedUp(ts); } catch (e2) { toast('Sichern fehlgeschlagen', true); }
  }
}
async function restore(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.app !== 'English-Voc' || !data.state || typeof data.state !== 'object') throw new Error('format');
    const s = normalize(data.state);
    const n = Object.keys(s.cards).length;
    if (!confirm(`Sicherung vom ${data.exported ? new Date(data.exported).toLocaleDateString('de-DE') : '?'} mit ${n} Karten laden? Der aktuelle Fortschritt wird ersetzt.`)) return;
    s.dirty = 0; s.lastBackup = Date.now();
    state = s; save(); applyTheme(); render();
    toast('Wiederhergestellt ✓');
  } catch (e) { toast('Datei ist keine gültige Sicherung', true); }
}

/* ---------- Theme ---------- */
function currentTheme() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function applyTheme() {
  const t = S().theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#1a1d2b' : '#3c3b6e';
  $('#theme').innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
  $('#theme').setAttribute('aria-label', t === 'dark' ? 'Helles Design' : 'Dunkles Design');
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act],[data-view],[data-level],[data-toggle],[data-known],[data-speak],#lang-en,#lang-de,#theme');
  if (!el) return;
  if (el.id === 'lang-en' || el.id === 'lang-de') { S().lang = el.id === 'lang-en' ? 'en' : 'de'; save(); render(); return; }
  if (el.id === 'theme') { S().theme = currentTheme() === 'dark' ? 'light' : 'dark'; save(); applyTheme(); return; }
  if (el.dataset.view) { setView(el.dataset.view); return; }
  if (el.dataset.level) { S().level = el.dataset.level; save(); render(); return; }
  if (el.dataset.speak) { ev.stopPropagation(); speak(el.dataset.speak); return; }
  if (el.dataset.toggle) { const id = +el.dataset.toggle; openItems.has(id) ? openItems.delete(id) : openItems.add(id); render(); return; }
  if (el.dataset.known) {
    const id = +el.dataset.known, r = state.cards[id];
    if (r) { r.s = 'k'; delete r.due; r.t = Date.now(); state.dirty++; save(); openItems.delete(id); render(); }
    return;
  }
  switch (el.dataset.act) {
    case 'start': startSession('mixed'); break;
    case 'kasten-start': startSession('kasten'); break;
    case 'flip': reveal(); break;
    case 'yes': answer(true); break;
    case 'no': answer(false); break;
    case 'end': finishSession(); break;
    case 'home': setView('home'); break;
    case 'wotd-yes': answerWotd(true); break;
    case 'wotd-no': answerWotd(false); break;
    case 'wotd': wotdOpen = !wotdOpen; render(); break;
    case 'more-items': kastenLimit += 50; render(); break;
    case 'backup': backup(); break;
    case 'reset':
      if (confirm('Gesamten Fortschritt wirklich löschen? Das kann nicht rückgängig gemacht werden. Tipp: vorher sichern.')) {
        const keep = S(); state = defaults(); state.settings = keep; save(); render(); toast('Zurückgesetzt');
      }
      break;
  }
});
document.addEventListener('change', ev => {
  if (ev.target.id === 'cat') { S().cat = ev.target.value; save(); render(); }
  else if (ev.target.id === 'size') { S().size = parseInt(ev.target.value, 10) || 20; save(); render(); }
  else if (ev.target.id === 'restore' && ev.target.files[0]) { restore(ev.target.files[0]); ev.target.value = ''; }
});
document.addEventListener('keydown', ev => {
  if (ev.target.matches('select,input,textarea') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.target.closest && ev.target.closest('[role="button"]') && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault(); ev.target.click(); return;
  }
  if (view !== 'session' || !sess || sess.done) return;
  if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (!sess.revealed) reveal(); }
  else if (sess.revealed && ev.key === 'ArrowRight') answer(true);
  else if (sess.revealed && ev.key === 'ArrowLeft') answer(false);
});

/* ---------- Start ---------- */
async function init() {
  $('#lang-en').innerHTML = FLAG_US;
  $('#lang-de').innerHTML = FLAG_DE;
  document.querySelectorAll('.ti').forEach(e => { e.innerHTML = icon(e.dataset.i); });
  applyTheme();
  try {
    await loadData();
  } catch (e) {
    app.innerHTML = '<div class="empty">Vokabeln konnten nicht geladen werden.<br>Bitte Verbindung prüfen und neu laden.</div>';
    return;
  }
  // Karten-IDs, die es nicht mehr gibt, aus dem Fortschritt entfernen
  Object.keys(state.cards).forEach(id => { if (!byId.has(+id)) delete state.cards[id]; });
  render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
init();
})();
