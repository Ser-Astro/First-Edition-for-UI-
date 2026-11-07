// Open Snap AAC - a TD Snap style communication board driven by data/symbol-info.csv
const $ = s => document.querySelector(s);
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } },
                set: (k, v) => { try { localStorage.setItem(k, v) } catch {} } };
const S = { rows: [], lang: store.get('lang', 'en'), path: [], msg: [], q: '', groups: new Map(), by: new Map(), vocab: { en: new Set(), fr: new Set() }, draft: '' };

// Minimal RFC 4180 CSV parser (handles quoted fields and commas inside quotes)
export function parseCSV(text) {
  const out = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0]) out.push(row); row = [] }
    else f += c;
  }
  if (f || row.length) { row.push(f); out.push(row) }
  const [head, ...rest] = out;
  return rest.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

// "bake_,_to" -> "to bake", "a_-_lower_case" -> "a", "celebrate_2_,_to" -> "to celebrate"
export function cleanLabel(raw) {
  const p = raw.replace(/_-_lower_case$/, '').replace(/_\d+(?=_,_|$)/, '').split('_,_');
  return (p.length === 2 ? `${p[1]} ${p[0]}` : p[0]).replace(/_/g, ' ').trim();
}

// Modified Fitzgerald Key style colouring
function colour(r) {
  const c = r['category-en'];
  if (r.grammar.startsWith('Verb')) return 'var(--verb)';
  if (c.startsWith('Descriptive') || c === 'Art Colour') return 'var(--desc)';
  if (c === 'Question') return 'var(--ques)';
  if (r.grammar === 'Interjection' || c.startsWith('People Feelings') || c.startsWith('Communication')) return 'var(--social)';
  if (c === 'Alphabet' || c === 'Number') return 'var(--misc)';
  return 'var(--noun)';
}

const GROUP_RE = /^(Work and School|Holiday and travel|Plants and Trees)/;
const groupOf = n => (n.match(GROUP_RE)?.[1] ?? n.split(' ')[0]);

// Look-up tables for core words, typed words and word prediction
function index(r) {
  for (const k of [r.en, r.fr]) if (!S.by.has(k.toLowerCase())) S.by.set(k.toLowerCase(), r);
  for (const l of ['en', 'fr']) for (const w of r[l].toLowerCase().match(/\p{L}+/gu) || []) if (w.length > 1) S.vocab[l].add(w);
}

function build() {
  for (const r of S.rows) {
    r.en = cleanLabel(r['symbol-en']); r.fr = cleanLabel(r['symbol-fr'] || r['symbol-en']);
    r.col = colour(r); index(r); r.search = `${r.en} ${r.fr} ${r.tags}`.toLowerCase();
    const g = groupOf(r['category-en']);
    if (!S.groups.has(g)) S.groups.set(g, new Map());
    const cats = S.groups.get(g);
    if (!cats.has(r['category-id'])) cats.set(r['category-id'], { id: r['category-id'], name: r['category-en'].slice(g.length).trim() || g, rows: [] });
    cats.get(r['category-id']).rows.push(r);
  }
}

const label = r => r[S.lang] || r.en;
const imgSrc = r => `symbols/${encodeURIComponent(r['symbol-en'])}.svg`;

function icon(r) {
  const ic = document.createElement('div'); ic.className = 'ic';
  const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.src = imgSrc(r);
  img.onerror = () => { ic.textContent = label(r).charAt(0).toUpperCase() }; // fallback when no SVG is present
  ic.append(img); return ic;
}

function tile(r, text, onclick, folder) {
  const b = document.createElement('button'); b.className = 'tile' + (folder ? ' folder' : '');
  if (r.col) b.style.setProperty('--c', r.col);
  const lb = document.createElement('span'); lb.className = 'lb'; lb.textContent = text;
  b.append(icon(r), lb); b.onclick = onclick; return b;
}

function render() {
  const grid = $('#grid'); grid.replaceChildren(); grid.scrollTop = 0;
  const [g, cid] = S.path; let crumb = 'Home';
  if (S.q) {
    const t = S.q.toLowerCase(), hits = S.rows.filter(r => r.search.includes(t)).slice(0, 300);
    crumb = `Search: "${S.q}" (${hits.length})`; hits.forEach(r => grid.append(symTile(r)));
    if (!hits.length) grid.innerHTML = '<p class="empty">No symbols found. Try another word.</p>';
  } else if (!g) {
    for (const [name, cats] of S.groups) {
      const first = [...cats.values()][0];
      grid.append(tile(first.rows[0], name, () => open(cats.size === 1 ? [name, first.id] : [name]), true));
    }
  } else if (!cid) {
    crumb = `Home > ${g}`;
    for (const c of S.groups.get(g).values()) grid.append(tile(c.rows[0], c.name, () => open([g, c.id]), true));
  } else {
    const c = S.groups.get(g).get(cid); crumb = `Home > ${g}` + (c.name !== g ? ` > ${c.name}` : '');
    c.rows.forEach(r => grid.append(symTile(r)));
  }
  $('#crumb').textContent = crumb;
}

const symTile = r => tile(r, label(r), () => add(r));
const open = p => { S.path = p; S.q = ''; $('#q').value = ''; render(); };

function speak(text) {
  if (!text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = S.lang === 'fr' ? 'fr-FR' : 'en-US';
  speechSynthesis.speak(u);
}

function add(r) { S.msg.push(r); bump(label(r)); drawMsg(); if ($('#tap').checked) speak(label(r)); }
function drawMsg() {
  const m = $('#msg'); m.replaceChildren();
  for (const r of S.msg) {
    const c = document.createElement('div'); c.className = 'chip';
    const img = new Image(); img.alt = ''; img.src = imgSrc(r); img.onerror = () => img.remove();
    c.append(img, label(r)); m.append(c);
  }
  m.scrollLeft = m.scrollWidth;
}

function init() {
  const set = () => {
    document.documentElement.style.setProperty('--s', $('#size').value + 'px');
    document.body.classList.toggle('hide-txt', !$('#txt').checked);
    store.set('size', $('#size').value); store.set('txt', $('#txt').checked ? 1 : 0); store.set('tap', $('#tap').checked ? 1 : 0);
  };
  $('#size').value = store.get('size', 130); $('#txt').checked = store.get('txt', 1) == 1; $('#tap').checked = store.get('tap', 0) == 1;
  $('#lang').value = S.lang; set();
  ['#size', '#txt', '#tap'].forEach(s => $(s).addEventListener('input', set));
  $('#lang').onchange = e => { S.lang = e.target.value; store.set('lang', S.lang); render(); drawMsg(); renderCore(); renderKb(); };
  $('#home').onclick = () => open([]);
  $('#up').onclick = () => open(S.q ? S.path : S.path.slice(0, -1));
  $('#q').oninput = e => { S.q = e.target.value.trim(); render(); };
  $('#speak').onclick = () => speak(S.msg.map(label).join(' '));
  $('#del').onclick = () => { S.msg.pop(); drawMsg(); };
  $('#clear').onclick = () => { S.msg = []; drawMsg(); };
  renderCore(); initKb();
}

// ---- Core words: always-visible bar, coloured by word type ----
const CORE = [['I','je','p'],['you','tu','p'],['it','ça','p'],['want','veux','v'],['go','aller','v'],['like','aimer','v'],
  ['get','prendre','v'],['make','faire','v'],['look','regarder','v'],['help','aide','v'],['stop','arrêt','v'],
  ['more','plus','d'],['big','grand','d'],['good','bien','d'],['yes','oui','s'],['no','non','s'],['not','pas','m'],
  ['again','encore','m'],['all done','fini','m'],['please',"s'il vous plaît",'s'],['what','quoi','q'],['where','où','q']];
const KEYCOL = { p: 'var(--pron)', v: 'var(--verb)', d: 'var(--desc)', s: 'var(--social)', m: 'var(--misc)', q: 'var(--ques)' };
const coreRow = ([en, fr, k]) => { const m = S.by.get(en.toLowerCase()) || {};
  return { ...m, en, fr, col: KEYCOL[k], 'symbol-en': m['symbol-en'] || en.replace(/ /g, '_') } };
const renderCore = () => $('#core').replaceChildren(...CORE.map(w => symTile(coreRow(w))));

// ---- Keyboard + word prediction (learns from what you use, saved in this browser) ----
const KEYS = { en: ['qwertyuiop', 'asdfghjkl', "zxcvbnm'"], fr: ['azertyuiop', 'qsdfghjklm', "wxcvbn'", 'éèêàùçôîâ'] };
const freq = (() => { try { return JSON.parse(store.get('freq', '{}')) } catch { return {} } })();
function bump(w) {
  w = w.toLowerCase(); if (!/^\p{L}+$/u.test(w)) return;
  freq[w] = (freq[w] || 0) + 1; store.set('freq', JSON.stringify(freq));
}
function suggest(p) {
  const byUse = (a, b) => (freq[b] || 0) - (freq[a] || 0) || a.length - b.length || a.localeCompare(b);
  const core = CORE.map(c => c[S.lang === 'fr' ? 1 : 0].toLowerCase());
  p = p.toLowerCase();
  if (!p) return [...new Set([...Object.keys(freq).sort(byUse), ...core])].slice(0, 6);
  const pool = new Set([...core, ...S.vocab[S.lang], ...Object.keys(freq)]);
  return [...pool].filter(w => w !== p && w.startsWith(p)).sort(byUse).slice(0, 6);
}
const wordRow = w => { const m = S.by.get(w.toLowerCase()) || {};
  return { ...m, en: w, fr: w, col: m.col || 'var(--misc)', 'symbol-en': m['symbol-en'] || w } };
const key = (txt, fn, cls = '') => { const b = document.createElement('button'); b.textContent = txt; b.className = 'key ' + cls; b.onclick = fn; return b };
function type(ch) { S.draft = ch === null ? S.draft.slice(0, -1) : S.draft + ch; drawKb(); }
function commit(w = S.draft) { w = w.trim(); if (!w) return; add(wordRow(w)); S.draft = ''; drawKb(); }
function drawKb() {
  $('#draft').textContent = S.draft;
  $('#pred').replaceChildren(...suggest(S.draft).map(w => key(w, () => commit(w))));
}
function renderKb() {
  const k = $('#keys'); k.replaceChildren();
  for (const row of KEYS[S.lang]) { const d = document.createElement('div'); d.className = 'krow'; [...row].forEach(c => d.append(key(c, () => type(c)))); k.append(d) }
  const d = document.createElement('div'); d.className = 'krow';
  d.append(key('Delete letter', () => type(null), 'wide'), key('Space (add word)', () => commit(), 'wide')); k.append(d);
  drawKb();
}
function initKb() {
  renderKb();
  $('#kbtn').onclick = () => { const kb = $('#kb'); kb.hidden = !kb.hidden; $('#kbtn').setAttribute('aria-pressed', String(!kb.hidden)); };
  addEventListener('keydown', e => {   // physical keyboard also works while the keyboard panel is open
    if ($('#kb').hidden || e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input,select')) return;
    if (e.key === 'Backspace') type(null);
    else if ((e.key === ' ' || e.key === 'Enter') && !e.target.matches('button')) { e.preventDefault(); commit(); }
    else if (/^[\p{L}'-]$/u.test(e.key)) type(e.key.toLowerCase());
  });
}

fetch('data/symbol-info.csv').then(r => { if (!r.ok) throw 0; return r.text() })
  .then(t => { S.rows = parseCSV(t); build(); init(); render(); })
  .catch(() => { $('#grid').innerHTML = '<p class="empty">Could not load data/symbol-info.csv. Serve the folder over HTTP (python3 -m http.server) instead of opening the file directly.</p>' });
