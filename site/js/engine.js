/* PanelGuard engine: layout, navigation, editor, Python kernel bridge, checks, progress.
   Content lives in steps.js (PG_STEPS). Steps 3-8 plug in as more data + renderers. */
(function () {
'use strict';
var STEPS = window.PG_STEPS, V = window.PGViz, ART = window.PGArt;
var $ = function (s, r) { return (r || document).querySelector(s); };
function h(tag, attrs, kids) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    var v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v);
  }
  (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var BASE; try { BASE = new URL('./', location.href).href; } catch (e) { BASE = ''; }
/* Own files: fetched normally, or taken from window.PG_EMBED when the single-file build is used (tools/build_single.py). */
var EMB = window.PG_EMBED || null;
function b64bytes(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function pgFetch(path) {
  if (!EMB) return fetch(path);
  var e = EMB[path];
  if (e == null) return Promise.resolve(new Response('not embedded: ' + path, { status: 404 }));
  var body = e.b64 != null ? new Blob([b64bytes(e.b64)], { type: e.type }) : new Blob([e.text], { type: e.type });
  return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': e.type, 'content-length': String(body.size) } }));
}
/* The ONE place that says where Python comes from (Pyodide runtime + wheels, same versions as pyodide-lock.json). */
var PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';

/* ---------- storage (optional) ---------- */
var KEY = 'panelguard.v0.1';
var S = { cur: null, subs: {}, navW: 250, outW: 470, navC: false };
try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.subs) S = Object.assign(S, saved); } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function SS(id) { return S.subs[id] || (S.subs[id] = { mech: {}, pred: {} }); }

/* ---------- index of substeps ---------- */
var ORDER = [], SUB = {}, STEP_OF = {};
STEPS.forEach(function (st) { st.substeps.forEach(function (s) { ORDER.push(s.id); SUB[s.id] = s; STEP_OF[s.id] = st; }); });

/* runtime (not saved) */
var RES = {}, ERR = {}, OUTTXT = {}, VERD = {}, PRE = {};
var running = null;

/* ---------- pass logic ---------- */
function pendingOf(id) {
  var s = SUB[id], st = SS(id);
  if (s.kind === 'scene') return st.mech && st.mech.done ? null : s.needText;
  if (s.predict && !(st.pred && st.pred.locked)) return 'answer the prediction question';
  if (!st.codePass) return 'run the code until the check passes';
  if (s.mechNeed) return s.mechNeed(st.mech || {});
  return null;
}
function passed(id) { return pendingOf(id) === null; }
function openable(id) { var i = ORDER.indexOf(id); for (var k = 0; k < i; k++) if (!passed(ORDER[k])) return false; return true; }
function firstBlock(id) { var i = ORDER.indexOf(id); for (var k = 0; k < i; k++) if (!passed(ORDER[k])) return ORDER[k]; return null; }
function lockText(id) { var b = firstBlock(id); return b ? 'Locked. First finish ' + b + ' “' + SUB[b].name + '”: ' + pendingOf(b) + '.' : ''; }
function stepDone(st) { return st.substeps.length && st.substeps.every(function (s) { return passed(s.id); }); }

/* ---------- data ---------- */
var PACK = null, LAB = null, ID2I = {}, FULL = {}, D = null;
var prog = { dataMB: 0, dataTotal: 5.36, pyMB: 0, pyTotal: 33.8, text: '' };
function showProg() {
  var done = prog.dataMB + prog.pyMB, tot = prog.dataTotal + prog.pyTotal;
  $('#lbar').style.width = Math.min(100, 100 * done / tot).toFixed(1) + '%';
  $('#lnum').textContent = done.toFixed(1) + ' / ' + tot.toFixed(0) + ' MB';
  $('#ltext').innerHTML = '<b>LOADING ' + Math.round(100 * done / tot) + '%</b>' + esc(prog.text);
}
function fatal(msg) {
  var e = $('#lerr'); e.classList.add('show');
  e.innerHTML = '<b>Loading failed.</b> ' + esc(msg) + '<br>Try: reload the page. This lab needs a recent Chrome, Edge, Firefox or Safari with WebAssembly and Web Workers.';
  $('#kdot').className = 'kdot bad'; $('#ktext').textContent = 'Python not available';
}
function loadData() {
  return pgFetch('data/labels.json').then(function (r) { if (!r.ok) throw new Error('labels.json: HTTP ' + r.status); return r.text(); }).then(function (txt) {
    LAB = JSON.parse(txt); LAB.text = txt;
    LAB.rows.forEach(function (r, i) { ID2I[r[0]] = i; });
    var n = LAB.rows.length, nd = LAB.rows.filter(function (r) { return r[1] >= 0.5; }).length;
    D = { n: n, nDef: nd, nOk: n - nd };
    return pgFetch(ATLAS);
  }).then(function (r) {
    if (!r.ok) throw new Error(ATLAS + ': HTTP ' + r.status);
    var total = +r.headers.get('content-length') || 5623008; prog.dataTotal = total / 1048576;
    if (!r.body || !r.body.getReader) return r.arrayBuffer().then(function (b) { prog.dataMB = prog.dataTotal; showProg(); return b; });
    var rd = r.body.getReader(), parts = [], got = 0;
    return (function pump() {
      return rd.read().then(function (x) {
        if (x.done) { var all = new Uint8Array(got), o = 0; parts.forEach(function (p) { all.set(p, o); o += p.length; }); return all.buffer; }
        parts.push(x.value); got += x.value.length; prog.dataMB = got / 1048576; showProg(); return pump();
      });
    })();
  }).then(function (buf) { prog.text = 'Unpacking the photos…'; showProg(); return decodeAtlas(buf, LAB.rows.length); })
    .then(function (u8) { PACK = u8; prog.dataMB = prog.dataTotal; showProg(); });
}
/* The photo pack is a lossless 8-bit grayscale PNG atlas: 64 tiles per row, 64x64 px each, row-major by cell order.
   Decode without colour management, take one channel, and rebuild the (cells, 64, 64) byte array. */
var ATLAS = 'data/cells64_atlas.png';
function decodeAtlas(buf, n) {
  var blob = new Blob([buf], { type: 'image/png' });
  return createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(function (bm) {
    var W = bm.width, H = bm.height, cols = W / 64;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bm, 0, 0);
    var px = x.getImageData(0, 0, W, H).data, out = new Uint8Array(n * 4096);
    for (var i = 0; i < n; i++) {
      var tx = (i % cols) * 64, ty = Math.floor(i / cols) * 64, o = i * 4096;
      for (var yy = 0; yy < 64; yy++) { var row = ((ty + yy) * W + tx) * 4; for (var xx = 0; xx < 64; xx++) out[o + yy * 64 + xx] = px[row + xx * 4]; }
    }
    if (bm.close) bm.close();
    return out;
  });
}
var CC = {};
function cellCanvas(id) {
  if (CC[id]) return CC[id];
  var i = ID2I[id]; if (i == null || !PACK) return null;
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var x = c.getContext('2d'), im = x.createImageData(64, 64), off = i * 4096;
  for (var k = 0; k < 4096; k++) { var v = PACK[off + k]; im.data[4 * k] = v; im.data[4 * k + 1] = v; im.data[4 * k + 2] = v; im.data[4 * k + 3] = 255; }
  x.putImageData(im, 0, 0); return (CC[id] = c);
}
function drawCell(ctx, id, x, y, s) { var c = cellCanvas(id); if (c) ctx.drawImage(c, x, y, s, s); }
var fullIdsP = pgFetch('data/full/index.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
function fullURL(id) {
  if (FULL[id]) return FULL[id];
  return (FULL[id] = fullIdsP.then(function (ids) {
    if (ids.indexOf(id) < 0) return null;
    return pgFetch('data/full/cell' + ('000' + id).slice(-4) + '.png').then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { return b ? URL.createObjectURL(b) : null; });
  }).catch(function () { return null; }));
}
function meta(id) { var r = LAB && LAB.rows[ID2I[id]]; return r ? { id: r[0], prob: r[1], kind: r[2] } : null; }

/* ---------- kernel bridge ---------- */
var K = { w: null, mode: null, ready: false, versions: null, cb: {}, seq: 0, queue: Promise.resolve(), onReady: [], pageHandle: null };
function kpost(m) { if (K.mode === 'page') setTimeout(function () { K.pageHandle(m); }, 0); else K.w.postMessage(m); }
function konmsg(m) {
  if (m.type === 'progress') { prog.pyMB = m.pyMB; prog.pyTotal = m.pyTotal; prog.text = m.text; showProg(); }
  else if (m.type === 'ready') {
    K.ready = true; K.versions = m.versions; K.pyodide = m.pyodide;
    $('#kdot').className = 'kdot ok';
    $('#ktext').textContent = 'Python ' + m.versions.python + ' · scikit-learn ' + m.versions.sklearn;
    $('#ktext').parentNode.title = 'Pyodide ' + m.pyodide + ' (self-hosted, running in a ' + (K.mode === 'page' ? 'page thread' : 'Web Worker') + '), numpy ' + m.versions.numpy + ', scipy ' + m.versions.scipy;
    $('#loader').classList.add('gone');
    var f = K.onReady; K.onReady = []; f.forEach(function (fn) { fn(); });
  }
  else if (m.type === 'fatal') fatal(m.text);
  else if (m.type === 'stdout') { var c = K.cb[m.id]; if (c && c.out) c.out(m.text, m.err); }
  else if (m.type === 'result') { var c2 = K.cb[m.id]; delete K.cb[m.id]; if (c2) c2.done(m); }
}
function sendData() {
  var copy = PACK.slice().buffer;
  if (K.mode === 'page') kpost({ cmd: 'data', buf: copy, labels: LAB.text });
  else K.w.postMessage({ cmd: 'data', buf: copy, labels: LAB.text }, [copy]);
}
function spawn(mode, dataP) {
  K.mode = mode;
  var init = { cmd: 'init', pyBase: PYODIDE_BASE, help: window.PG_PY_HELP };
  if (mode === 'page') {
    var s2 = h('script', { src: 'js/pyworker.js' });
    var startPage = function () {
      import(PYODIDE_BASE + 'pyodide.mjs').then(function (mod) { K.pageHandle = window.PGKernelCore(konmsg, mod.loadPyodide, window.PG_PY_HELP); K.pageHandle(init); dataP.then(sendData); },
        function (e) { fatal('Could not load ' + PYODIDE_BASE + 'pyodide.mjs — ' + (e && e.message || e)); });
    };
    if (window.PGKernelCore) { startPage(); return; }
    s2.onload = startPage;
    s2.onerror = function () { fatal('js/pyworker.js could not be loaded.'); };
    document.head.appendChild(s2); return;
  }
  var w, got = false;
  var NEXT = { file: 'blob', blob: 'blobc', blobc: 'page' };
  var fail = function () { if (got) return; got = true; try { w && w.terminate(); } catch (e) {} spawn(NEXT[mode], dataP); };
  var go = function (url) {
    try { w = new Worker(url, mode === 'blobc' ? undefined : { type: 'module' }); } catch (e) { return fail(); }
    K.w = w;
    var live = false;
    w.onmessage = function (ev) {
      if (ev.data && ev.data.type === 'fatal' && !K.ready && !got) { console.warn('kernel mode ' + mode + ' failed: ' + ev.data.text); K.lastFatal = ev.data.text; live = false; return fail(); }
      live = true; konmsg(ev.data);
    };
    w.onerror = function (ev) { if (!live) { ev.preventDefault && ev.preventDefault(); fail(); } else fatal('The Python worker stopped: ' + (ev.message || 'unknown error')); };
    w.postMessage(init);
    dataP.then(sendData);
  };
  if (mode === 'file') go('js/pyworker.js');
  else pgFetch('js/pyworker.js').then(function (r) { return r.text(); }).then(function (t) { go(URL.createObjectURL(new Blob([t], { type: 'text/javascript' }))); }).catch(fail);
}
function kcall(msg, out) {
  var id = 'k' + (++K.seq); msg.id = id;
  var p = K.queue.then(function () {
    return new Promise(function (res) { K.cb[id] = { out: out, done: res }; kpost(msg); });
  });
  K.queue = p.catch(function () {});
  return p;
}
function kRun(code, probe, out) { return kcall({ cmd: 'run', code: code, probe: probe }, out); }
function kEval(code) { return kcall({ cmd: 'eval', code: code }).then(function (m) { return m.probe; }); }
function whenReady() { return new Promise(function (res) { if (K.ready) res(); else K.onReady.push(res); }); }
function restartKernel() {
  if (K.mode === 'page') return;
  try { K.w.terminate(); } catch (e) {}
  Object.keys(K.cb).forEach(function (k) { K.cb[k].done({ type: 'result', error: { type: 'Stopped', msg: 'You stopped the run.', line: null, tb: '' } }); });
  K.cb = {}; K.queue = Promise.resolve(); K.ready = false; running = null;
  $('#kdot').className = 'kdot'; $('#ktext').textContent = 'Restarting Python…';
  $('#loader').classList.remove('gone'); prog.pyMB = 0; prog.text = 'Restarting Python…'; showProg();
  spawn(K.mode, Promise.resolve());
  whenReady().then(replay);
}

/* replay passed code so the notebook state comes back (after reload or Stop) */
var replaying = false;
function replay() {
  var ids = ORDER.filter(function (id) { return SUB[id].kind === 'code' && SS(id).codePass && SS(id).code; });
  if (!ids.length) return Promise.resolve();
  replaying = true;
  var chain = Promise.resolve();
  ids.forEach(function (id, n) {
    chain = chain.then(function () {
      $('#ktext').textContent = 'Rebuilding your work: ' + id + ' (' + (n + 1) + ' of ' + ids.length + ')…';
      $('#kdot').className = 'kdot busy';
      return kRun(SS(id).code, SUB[id].probe).then(function (m) {
        if (!m.error && m.probe && !m.probe.probe_error) { RES[id] = m.probe; VERD[id] = SUB[id].check(m.probe); }
        var mk = SS(id).mech && SS(id).mech.keptCmd;
        if (mk) return kRun(mk, null);
      });
    });
  });
  return chain.then(function () {
    replaying = false; $('#kdot').className = 'kdot ok';
    $('#ktext').textContent = 'Python ' + K.versions.python + ' · scikit-learn ' + K.versions.sklearn;
    if (S.cur && SUB[S.cur].kind === 'code') renderOut();
  });
}

/* ---------- friendly errors ---------- */
function friendly(e) {
  var m = e.msg || '', t = e.type, x;
  if (t === 'Stopped') return 'You stopped the run. Python restarted and your passed cells are being rebuilt.';
  if (t === 'SyntaxError' || t === 'IndentationError') return 'Python could not read this code (' + m.replace(/\(<your code>.*?\)/, '').trim() + '). Check brackets, quotes, commas and the spaces at the start of the line.';
  if (t === 'NameError' && (x = m.match(/name '(.+?)' is not defined/))) return 'Python does not know the name “' + x[1] + '”. Check the spelling. If it comes from an earlier substep, run that one again.';
  if ((x = m.match(/cannot reshape array of size (\d+) into shape (\(.+?\))/))) return 'The sizes do not fit: the data has ' + (+x[1]).toLocaleString() + ' values, but shape ' + x[2] + ' needs a different number. Check the gap.';
  if ((x = m.match(/inconsistent numbers of samples: \[(\d+), (\d+)\]/))) return 'Features and labels have different lengths (' + x[1] + ' vs ' + x[2] + '). They must be the same cells, in the same order.';
  if (/zero-size array to reduction/.test(m)) return 'Your condition kept nothing, so there is nothing to take the max of. Check your number: recall runs from 0 to 1.';
  if ((x = m.match(/index (\d+) is out of bounds for axis (\d+) with size (\d+)/))) return 'There is no position ' + x[1] + ' there: that axis has only ' + x[3] + ' entries (0 to ' + (x[3] - 1) + ').';
  if ((x = m.match(/module 'numpy' has no attribute '(.+?)'/))) return 'numpy has nothing called “' + x[1] + '”. Check the spelling.';
  if (/n_splits=1/.test(m) || /at least one train\/test split/.test(m)) return 'Cross-validation needs at least 2 folds.';
  if (t === 'KeyError') return 'There is no entry called ' + m + '.';
  if (t === 'TypeError') return 'A value has the wrong type: ' + m;
  if (t === 'ValueError') return 'A value is not allowed here: ' + m;
  return t + ': ' + m;
}

/* ---------- tooltip ---------- */
var tipEl = $('#tip');
function tipOn(el, fn) {
  el.addEventListener('mouseenter', function (ev) { var t = typeof fn === 'function' ? fn() : fn; if (!t) return; tipEl.textContent = t; tipEl.style.display = 'block'; tipMove(ev); });
  el.addEventListener('mousemove', tipMove);
  el.addEventListener('mouseleave', function () { tipEl.style.display = 'none'; });
}
function tipMove(ev) { var x = Math.min(ev.clientX + 14, innerWidth - 320), y = ev.clientY + 16; if (y > innerHeight - 80) y = ev.clientY - 60; tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; }

/* ---------- nav ---------- */
function renderNav() {
  var nav = $('#nav'); nav.innerHTML = '';
  nav.appendChild(h('div', { class: 'navhead' }, [h('h3', { text: 'COURSE' }), h('button', { class: 'ib', title: S.navC ? 'Open the step list' : 'Fold the step list', html: S.navC ? '»' : '«', onclick: function () { S.navC = !S.navC; save(); layout(); renderNav(); } })]));
  STEPS.forEach(function (st, i) {
    if (st.id === 3) nav.appendChild(h('div', { class: 'plan', text: 'FULL PLAN — COMING NEXT' }));
    var cur = S.cur && STEP_OF[S.cur] === st;
    if (st.locked) {
      var el = h('div', { class: 'ns lock' }, [h('div', { class: 'num', html: st.id }), h('div', { class: 'txt' }, [h('div', { class: 'nt', text: st.title }), h('div', { class: 'nd', text: '🔒 Not in this preview' })])]);
      tipOn(el, 'Step ' + st.id + ' — ' + st.title + '. This part comes in the full course.'); nav.appendChild(el); return;
    }
    var first = st.substeps[0].id, ok = openable(first), done = stepDone(st);
    var n = st.substeps.filter(function (s) { return passed(s.id); }).length;
    var el2 = h('div', { class: 'ns' + (cur ? ' cur' : '') + (done ? ' done' : '') + (ok ? '' : ' lock'), onclick: function () { if (ok) location.hash = '#step-' + st.id; } }, [
      h('div', { class: 'num', html: done ? '✓' : (ok ? st.id : '🔒') }),
      h('div', { class: 'txt', style: 'flex:1;min-width:0' }, [h('div', { class: 'nt', text: st.title }), h('div', { class: 'nd', text: st.short }),
        h('div', { class: 'prog' }, [h('i', { style: 'width:' + (100 * n / st.substeps.length) + '%' })])])]);
    tipOn(el2, function () { return ok ? 'Step ' + st.id + ': ' + n + ' of ' + st.substeps.length + ' parts done' : lockText(first); });
    nav.appendChild(el2);
  });
}

/* ---------- substep strip ---------- */
function renderStrip(st, box) {
  var subs = st.substeps, W = 1000, n = subs.length, gap = W / n;
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 1000 84'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  var html = '<defs><filter id="sg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
    '<linearGradient id="belt" x1="0" x2="1"><stop offset="0" stop-color="#18222f"/><stop offset=".5" stop-color="#223246"/><stop offset="1" stop-color="#18222f"/></linearGradient></defs>' +
    '<rect x="' + (gap / 2) + '" y="30" width="' + (W - gap) + '" height="8" rx="4" fill="url(#belt)"/>' +
    '<line x1="' + (gap / 2) + '" y1="34" x2="' + (W - gap / 2) + '" y2="34" stroke="#46e3ff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 10"><animate attributeName="stroke-dashoffset" from="32" to="0" dur="1.2s" repeatCount="indefinite"/></line>';
  svg.innerHTML = html;
  subs.forEach(function (s, i) {
    var cx = gap / 2 + i * gap, ok = openable(s.id), done = passed(s.id), cur = S.cur === s.id;
    var col = done ? '#3dffa0' : (cur ? '#46e3ff' : (ok ? '#ffb547' : '#3a4658'));
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'snode' + (ok ? '' : ' locked'));
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', s.id + ' ' + s.name);
    var inner = '';
    if (cur) inner += '<rect x="' + (cx - 22) + '" y="12" width="44" height="44" rx="8" fill="' + col + '" opacity=".45" filter="url(#sg)"/>';
    if (ok && !done && !cur) inner += '<rect x="' + (cx - 21) + '" y="13" width="42" height="42" rx="8" fill="none" stroke="#ffb547" stroke-width="2" opacity=".8"><animate attributeName="opacity" values=".9;.15;.9" dur="1.6s" repeatCount="indefinite"/></rect>';
    inner += '<rect x="' + (cx - 17) + '" y="17" width="34" height="34" rx="5" fill="' + (done ? '#0d2a1d' : '#0c131d') + '" stroke="' + col + '" stroke-width="2"/>' +
      '<line x1="' + (cx - 17) + '" y1="28" x2="' + (cx + 17) + '" y2="28" stroke="' + col + '" stroke-opacity=".45"/><line x1="' + (cx - 17) + '" y1="40" x2="' + (cx + 17) + '" y2="40" stroke="' + col + '" stroke-opacity=".45"/>' +
      '<text x="' + cx + '" y="' + 38.5 + '" text-anchor="middle" font-family="Orbitron,Arial,sans-serif" font-size="12" font-weight="700" fill="' + (ok || done ? '#fff' : '#5d6b80') + '">' + (done ? '✓' : (ok ? s.id : '🔒')) + '</text>' +
      '<text x="' + cx + '" y="74" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="15" font-weight="600" fill="' + (cur ? '#46e3ff' : (ok ? '#c6d2e2' : '#5d6b80')) + '">' + esc(s.name) + '</text>';
    g.innerHTML = inner;
    g.addEventListener('click', function () { if (ok) location.hash = '#sub-' + s.id; });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ok) location.hash = '#sub-' + s.id; });
    tipOn(g, function () { return ok ? (done ? s.id + ' ' + s.name + ': done ✓' : s.id + ' ' + s.name + ': open — ' + (pendingOf(s.id) || '')) : lockText(s.id); });
    svg.appendChild(g);
  });
  box.innerHTML = ''; box.appendChild(svg);
}

/* ---------- python highlighter + editor ---------- */
var KW = /^(def|return|for|in|if|else|elif|import|from|as|lambda|and|or|not|True|False|None|while|with|class|try|except|is)$/;
var BI = /^(print|len|range|int|float|str|list|dict|set|max|min|round|sorted|zip|open|sum|abs)$/;
function hl(code) {
  var re = /(#[^\n]*)|([fbr]?'(?:\\.|[^'\\\n])*'|[fbr]?"(?:\\.|[^"\\\n])*")|(____)|(\b\d+\.?\d*(?:e-?\d+)?\b)|([A-Za-z_]\w*)/g, out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += '<span class="t-c">' + esc(m[1]) + '</span>';
    else if (m[2]) out += '<span class="t-s">' + esc(m[2]).replace(/____/g, '<span class="gap">____</span>') + '</span>';
    else if (m[3]) out += '<span class="gap">____</span>';
    else if (m[4]) out += '<span class="t-n">' + m[4] + '</span>';
    else { var w = m[5], nx = code[last]; out += KW.test(w) ? '<span class="t-k">' + w + '</span>' : BI.test(w) ? '<span class="t-b">' + w + '</span>' : nx === '(' ? '<span class="t-f">' + w + '</span>' : w; }
  }
  return out + esc(code.slice(last)) + '\n';
}
function Editor(box, code, onRun, onChange) {
  var gut = h('div', { class: 'gut' }), pre = h('pre', { 'aria-hidden': 'true' }), ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off', 'aria-label': 'Python code editor' });
  var ed = h('div', { class: 'ed' }, [gut, h('div', { class: 'edw' }, [pre, ta])]);
  box.appendChild(ed);
  var errLine = null;
  function paint() {
    var v = ta.value, lines = v.split('\n');
    pre.innerHTML = hl(v);
    var g = ''; for (var i = 1; i <= lines.length; i++) g += '<div' + (i === errLine ? ' class="err"' : '') + '>' + i + '</div>';
    gut.innerHTML = g;
    var longest = lines.reduce(function (a, l) { return Math.max(a, l.length); }, 0);
    ta.style.height = (lines.length * 20 + 22) + 'px'; ta.style.width = 'max(100%, ' + (longest + 4) + 'ch)'; pre.style.width = ta.style.width;
  }
  ta.value = code; paint();
  ta.addEventListener('input', function () { errLine = null; paint(); onChange && onChange(ta.value); });
  ta.addEventListener('keydown', function (ev) {
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey || ev.shiftKey)) { ev.preventDefault(); onRun && onRun(); return; }
    if (ev.key === 'Tab') {
      ev.preventDefault();
      var ls = v.lastIndexOf('\n', s - 1) + 1;
      if (ev.shiftKey) { var sp = v.slice(ls, ls + 4).match(/^ */)[0].length; if (sp) { ta.setRangeText('', ls, ls + sp, 'preserve'); ta.selectionStart = ta.selectionEnd = Math.max(ls, s - sp); } }
      else ta.setRangeText('    ', s, e, 'end');
      ta.dispatchEvent(new Event('input')); return;
    }
    if (ev.key === 'Enter') {
      var ls2 = v.lastIndexOf('\n', s - 1) + 1, line = v.slice(ls2, s), ind = line.match(/^ */)[0];
      if (/:\s*$/.test(line)) ind += '    ';
      ev.preventDefault(); ta.setRangeText('\n' + ind, s, e, 'end'); ta.dispatchEvent(new Event('input'));
    }
  });
  return {
    get: function () { return ta.value; },
    set: function (c) { ta.value = c; errLine = null; paint(); ed.scrollTop = 0; ed.scrollLeft = 0; },
    mark: function (n) { errLine = n; paint(); },
    focusGap: function () { var i = ta.value.indexOf('____'); if (i >= 0) { ta.focus(); ta.setSelectionRange(i, i + 4); } },
    ta: ta
  };
}

/* ---------- layout + resizers ---------- */
function layout() {
  var m = $('#main');
  m.classList.toggle('navc', !!S.navC);
  m.style.setProperty('--navw', (S.navC ? 58 : S.navW) + 'px');
  m.style.setProperty('--outw', S.outW + 'px');
}
function resizer(el, which) {
  el.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); el.setPointerCapture(ev.pointerId); el.classList.add('drag');
    var x0 = ev.clientX, w0 = which === 'nav' ? S.navW : S.outW;
    function mv(e) {
      var dx = e.clientX - x0;
      if (which === 'nav') { S.navC = false; S.navW = Math.max(170, Math.min(420, w0 + dx)); }
      else S.outW = Math.max(320, Math.min(innerWidth - (S.navC ? 58 : S.navW) - 380, w0 - dx));
      layout();
    }
    function up() { el.classList.remove('drag'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); save(); renderNav(); if (cur.viz && cur.viz.resize) cur.viz.resize(); }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  });
}

/* ---------- API given to renderers ---------- */
function makeApi(id) {
  var st = SS(id);
  return {
    sub: SUB[id], D: D, LAB: LAB, meta: meta, pred: st.pred || {}, predVal: st.pred && st.pred.locked ? st.pred.val : null,
    draw: drawCell, canvas: cellCanvas, full: fullURL, esc: esc, h: h, tipOn: tipOn,
    mech: st.mech || (st.mech = {}),
    setMech: function (patch) { Object.assign(st.mech, patch); save(); refreshStatus(); },
    py: function (code) { setBusy(true); return kEval(code).then(function (r) { setBusy(false); return r; }); },
    cmd: function (code, label) { // visible command, output goes to the console
      setBusy(true); conAdd('>>> ' + code + '\n');
      return kRun(code, null, function (t, e) { conAdd(t + '\n', e); }).then(function (m) { setBusy(false); if (m.error) conAdd(friendly(m.error) + '\n', true); return m; });
    },
    res: function (k) { return RES[k]; },
    out: $('#out'), work: $('#work'), art: ART, getMech: function (k) { return SS(k).mech || {}; }
  };
}
function setBusy(b) { $('#kdot').className = 'kdot ' + (b ? 'busy' : 'ok'); }

/* ---------- open a substep ---------- */
var cur = { ed: null, viz: null };
function openSub(id) {
  if (!SUB[id]) return;
  if (!openable(id)) { var b = firstBlock(id); id = b; }
  var same = S.cur === id; S.cur = id; save();
  renderNav(); renderWork(); renderOut();
  if (!same) { $('#work').scrollTop = 0; $('#out').scrollTop = 0; }
}
function renderWork() {
  var id = S.cur, s = SUB[id], st = STEP_OF[id], w = $('#work'), ss = SS(id);
  w.innerHTML = '';
  var banner = h('div', { class: 'banner' });
  w.appendChild(h('div', { class: 'sthead' }, [h('div', { class: 'stxt' }, [h('h1', { html: '<small>STEP ' + st.id + '</small>' + esc(st.title) }), h('p', { text: st.story })]), banner]));
  if (s.kind === 'scene') banner.style.display = 'none'; else ART.banner(banner, st.id, { cellURL: fullURL, canvas: cellCanvas });
  var strip = h('div', { class: 'strip' }); w.appendChild(strip); renderStrip(st, strip);
  var card = h('div', { class: 'card' }, [h('h2', { html: '<span class="k">' + id + '</span>' + esc(s.name) }), h('p', { class: 'goalline', text: s.goal })]);
  if (s.task) {
    var ul = h('ul', { class: 'task' });
    s.task.forEach(function (t, i) { var mech = /^Then /.test(t); ul.appendChild(h('li', { class: mech ? 'mech' : '', 'data-n': mech ? '' : (i + 1), html: esc(t) })); });
    card.appendChild(ul);
  }
  if (s.example) card.appendChild(h('details', { class: 'ex' }, [h('summary', { text: 'Worked example (same idea, different values)' }), h('div', { class: 'exb', html: s.example })]));
  w.appendChild(card);
  if (s.predict) w.appendChild(renderPredict(id));
  cur.ed = null;
  if (s.kind === 'code') {
    var box = h('div', { class: 'edbox' });
    var runB = h('button', { class: 'btn run', id: 'runbtn', text: '▶ RUN' });
    var stopB = h('button', { class: 'btn stop', text: '■ Stop', style: 'display:none', title: 'Stops Python and restarts it. Your passed cells are rebuilt.' });
    var resetB = h('button', { class: 'btn small', text: '↺ Reset this cell', title: 'Put back the starting code' });
    var copyB = h('button', { class: 'btn small', text: '⧉ Copy code' });
    box.appendChild(h('div', { class: 'edbar' }, [h('span', { class: 'fn', text: 'cell_' + id + '.py — Python' }), h('span', { class: 'sp' }), copyB, resetB]));
    cur.ed = Editor(box, ss.code || s.code, doRun, function (v) { ss.draft = v; save(); });
    if (ss.draft && ss.draft !== (ss.code || s.code)) cur.ed.set(ss.draft);
    var note = h('span', { class: 'note' });
    box.appendChild(h('div', { class: 'runrow' }, [runB, stopB, note, h('span', { class: 'note', style: 'margin-left:auto', text: 'Ctrl+Enter runs · Tab indents' })]));
    w.appendChild(box);
    runB.onclick = doRun;
    stopB.onclick = function () { restartKernel(); };
    resetB.onclick = function () { cur.ed.set(s.code); ss.draft = null; save(); };
    copyB.onclick = function () { copyText(cur.ed.get(), copyB); };
    cur.runB = runB; cur.stopB = stopB; cur.note = note;
    tipOn(runB, function () { return runB.disabled ? runB.dataset.why : ''; });
    updateRunBtn();
  } else {
    var stage = h('div', { class: 'scene', id: 'stage' }); w.appendChild(stage);
  }
}
function updateRunBtn() {
  if (!cur.runB) return;
  var s = SUB[S.cur], ss = SS(S.cur), why = '';
  if (!K.ready) why = 'Python is still loading (' + Math.round(100 * (prog.dataMB + prog.pyMB) / (prog.dataTotal + prog.pyTotal)) + '%). Wait a moment.';
  else if (replaying) why = 'Python is rebuilding your earlier cells. Wait a moment.';
  else if (s.predict && !(ss.pred && ss.pred.locked)) why = 'Answer the prediction question above first.';
  else if (running) why = 'Code is running.';
  cur.runB.disabled = !!why; cur.runB.dataset.why = why;
  cur.note.textContent = why;
}
setInterval(updateRunBtn, 700);
function copyText(t, btn) {
  var ok = function () { var o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(function () { btn.textContent = o; }, 1200); };
  try { navigator.clipboard.writeText(t).then(ok, fb); } catch (e) { fb(); }
  function fb() { try { var x = h('textarea', { style: 'position:fixed;opacity:0' }); x.value = t; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); ok(); } catch (e) { btn.textContent = 'Copy blocked here'; } }
}

/* ---------- predictions ---------- */
function renderPredict(id) {
  var s = SUB[id], P = s.predict, ss = SS(id), pr = ss.pred || (ss.pred = {});
  var box = h('div', { class: 'pred', id: 'predbox' }, [h('h3', { text: 'PREDICT BEFORE YOU RUN · ONE TRY' }), h('p', { html: P.q })]);
  var body = h('div'); box.appendChild(body);
  function lock(v) { pr.val = v; pr.locked = true; save(); renderWork(); renderOut(); refreshStatus(); }
  if (P.format === 'number') {
    if (!pr.locked) {
      var inp = h('input', { type: 'number', min: '0', max: '100', step: '1', placeholder: 'e.g. 50', 'aria-label': 'your guess in percent' });
      var b = h('button', { class: 'btn', text: 'Check my guess', onclick: function () { var v = parseFloat(inp.value); if (isNaN(v)) { inp.focus(); return; } lock(v); } });
      body.appendChild(h('div', { class: 'row' }, [inp, h('span', { text: P.unit }), b]));
    } else {
      var ans = P.answer(D), good = Math.abs(pr.val - ans) <= P.tol, rv = P.reveal(D);
      body.appendChild(h('div', { class: 'verdict ' + (good ? 'good' : 'bad'), html: (good ? '✓ Right. ' : '✗ Not quite. ') + 'You said <b>' + pr.val + '%</b>. The real answer is <b>' + ans.toFixed(1) + '%</b>.' }));
      body.appendChild(whyBox(rv, 'Why (tap to open)'));
    }
  } else if (P.format === 'bet') {
    var row = h('div', { class: 'betrow' });
    P.options.forEach(function (o, i) {
      var c = h('button', { class: 'bet' + (pr.val === o ? ' sel' : ''), disabled: pr.locked ? 'disabled' : null, html: '<div class="bi">MODEL ' + (i + 1) + '</div>' + esc(o) });
      c.onclick = function () { lock(o); };
      row.appendChild(c);
    });
    body.appendChild(row);
    if (pr.locked) {
      var r = RES[id];
      if (r && SS(id).codePass) { var ok = r.best === pr.val; body.appendChild(h('div', { class: 'verdict ' + (ok ? 'good' : 'bad'), html: (ok ? '✓ Good bet. ' : '✗ Not this time. ') + 'You bet on <b>' + esc(pr.val) + '</b>. Winner: <b>' + esc(r.best) + '</b>. See the cards on the right.' })); }
      else body.appendChild(h('div', { class: 'verdict', style: 'background:#141028;border:1px solid #3d3368', html: 'Bet locked: <b>' + esc(pr.val) + '</b>. Now fill the gaps and run.' }));
    }
  } else if (P.format === 'chart') {
    var holder = h('div'); body.appendChild(holder);
    var draw = function () { V.guessChart(holder, PRE[id] || RES['2d'], pr, function (v) { pr.val = v; save(); draw(); }, RES[id] && SS(id).codePass ? RES[id] : null); };
    if (!pr.locked) {
      var lb = h('button', { class: 'btn', text: 'Lock my guess', onclick: function () { if (pr.val == null) return; lock(pr.val); } });
      body.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, [lb, h('span', { class: 'hint', text: 'Tap the line, then lock.' })]));
    }
    if (PRE[id] || (RES[id] && SS(id).codePass)) draw();
    else {
      holder.innerHTML = '<div class="hint">Getting the real curve from Python…</div>';
      whenReady().then(function () { return replayDone(); }).then(function () { return kEval(s.preProbe); }).then(function (r) { if (r && r.curve) { PRE[id] = r; if (S.cur === id) draw(); } else holder.innerHTML = '<div class="hint">Could not read p_val yet. Finish 2c first.</div>'; });
    }
  }
  return box;
}
function replayDone() { return new Promise(function (res) { (function w() { if (!replaying) res(); else setTimeout(w, 200); })(); }); }

function whyBox(e, title) {
  if (!e) return h('span');
  return h('details', { class: 'why' }, [h('summary', { text: title || 'WHY THIS WORKS' }), h('div', { class: 'wb', html:
    '<div class="lab">WHAT WAS ASKED</div>' + e.asked +
    '<div class="lab">HOW TO GET IT, STEP BY STEP</div><ol>' + e.steps.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
    '<div class="lab">COMMON TRAP</div>' + e.trap +
    '<div class="rem">⟶ ' + e.remember + '</div>' })]);
}

/* ---------- output pane ---------- */
var conEl = null;
function conAdd(t, err) { if (!conEl) return; var sp = document.createElement('span'); if (err) sp.className = 'e'; sp.textContent = t; conEl.appendChild(sp); conEl.scrollTop = conEl.scrollHeight; }
function renderOut() {
  var id = S.cur, s = SUB[id], o = $('#out'), ss = SS(id);
  o.innerHTML = '';
  cur.viz = null;
  o.appendChild(h('div', { class: 'ohead' }, [h('h3', { text: s.kind === 'code' ? 'LIVE OUTPUT' : 'RESULT' }), h('span', { class: 't', id: 'otime' })]));
  o.appendChild(h('div', { id: 'chkbox' }));
  if (s.kind === 'scene') {
    var vz = h('div', { id: 'vizbox' }); o.appendChild(vz);
    cur.viz = V.scene(s, $('#stage'), vz, makeApi(id)) || null;
    refreshStatus(); return;
  }
  o.appendChild(h('div', { id: 'errbox' }));
  o.appendChild(h('div', { id: 'vizbox' }));
  o.appendChild(h('div', { id: 'whybox' }));
  o.appendChild(h('div', { class: 'conh', text: 'PRINTED BY PYTHON' }));
  conEl = h('div', { class: 'con', id: 'con' }); o.appendChild(conEl);
  if (OUTTXT[id]) conAdd(OUTTXT[id]); else conAdd(ss.codePass && !RES[id] ? '(rebuilding…)' : '(nothing yet — press RUN)');
  o.appendChild(h('div', { id: 'endbox' }));
  if (ERR[id]) showErr(ERR[id]);
  if (RES[id]) drawViz(id);
  refreshStatus();
}
function showErr(e) {
  var b = $('#errbox'); if (!b) return;
  b.innerHTML = '';
  if (!e) return;
  b.appendChild(h('div', { class: 'chk fail errc' }, [h('span', { class: 'ic', text: 'ERROR' }), h('div', {}, [
    h('div', { html: esc(friendly(e)) + (e.line ? ' <b>(line ' + e.line + ')</b>' : '') }),
    e.tb ? h('details', {}, [h('summary', { text: 'Show the raw Python message' }), h('pre', { text: e.tb })]) : null])]));
}
function drawViz(id) {
  var vb = $('#vizbox'); if (!vb) return;
  vb.innerHTML = '';
  try { cur.viz = SUB[id].render(RES[id], vb, makeApi(id)) || null; } catch (e) { console.error(e); vb.appendChild(h('div', { class: 'hint', text: 'Could not draw this card: ' + e.message })); }
}
function refreshStatus() {
  var id = S.cur, s = SUB[id], ss = SS(id), cb = $('#chkbox');
  if (cb) {
    cb.innerHTML = '';
    var v = VERD[id], pend = pendingOf(id);
    if (s.kind === 'scene') {
      cb.appendChild(pend ? h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'TO DO' }), h('div', { text: 'Now: ' + pend + '.' })])
                          : h('div', { class: 'chk pass' }, [h('span', { class: 'ic', text: 'DONE' }), h('div', { text: 'Done. ' + nextHint(id) })]));
    } else if (running === id) cb.appendChild(h('div', { class: 'chk wait' }, [h('span', { class: 'ic', text: 'RUN' }), h('div', { text: 'Python is working on it…' })]));
    else if (v && !v.pass) cb.appendChild(h('div', { class: 'chk fail' }, [h('span', { class: 'ic', text: 'CHECK' }), h('div', { text: v.msg })]));
    else if (v && v.pass && pend) cb.appendChild(h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'ALMOST' }), h('div', { html: '✓ ' + esc(v.msg) + '<br>Now: <b>' + esc(pend) + '</b>.' })]));
    else if (v && v.pass) cb.appendChild(h('div', { class: 'chk pass' }, [h('span', { class: 'ic', text: 'PASS' }), h('div', { text: v.msg + ' ' + nextHint(id) })]));
    else if (ss.codePass && !RES[id]) cb.appendChild(h('div', { class: 'chk wait' }, [h('span', { class: 'ic', text: 'WAIT' }), h('div', { text: 'You passed this before. Python is rebuilding it…' })]));
    else cb.appendChild(h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'TO DO' }), h('div', { text: pend ? 'Now: ' + pend + '.' : '' })]));
  }
  var wb = $('#whybox');
  if (wb) { wb.innerHTML = ''; if (passed(id) && RES[id] && s.explain) wb.appendChild(whyBox(s.explain(RES[id], ss.mech || {}))); }
  var eb = $('#endbox');
  if (eb) { eb.innerHTML = ''; if (id === '2e' && passed('2e')) V.endCard(eb, RES, makeApi(id)); }
  var strip = $('.strip'); if (strip) renderStrip(STEP_OF[id], strip);
  renderNav();
}
function nextHint(id) {
  var i = ORDER.indexOf(id), n = ORDER[i + 1];
  if (!n) return 'Step 2 is complete.';
  return STEP_OF[n] !== STEP_OF[id] ? 'Step ' + STEP_OF[id].id + ' is complete — open Step ' + STEP_OF[n].id + ' in the list.' : 'Next: tap ' + n + ' “' + SUB[n].name + '” in the strip.';
}

/* ---------- run ---------- */
function doRun() {
  var id = S.cur, s = SUB[id], ss = SS(id);
  if (!cur.ed || cur.runB.disabled) return;
  var code = cur.ed.get(), gaps = (code.match(/____/g) || []).length;
  if (gaps) { VERD[id] = { pass: false, msg: 'Fill every gap marked ____ first (' + gaps + ' left). Type your answer in place of the underscores.' }; ERR[id] = null; showErr(null); refreshStatus(); cur.ed.focusGap(); return; }
  running = id; ERR[id] = null; showErr(null); VERD[id] = null; OUTTXT[id] = '';
  if (conEl) conEl.textContent = '';
  updateRunBtn(); refreshStatus(); setBusy(true);
  if (K.mode !== 'page') cur.stopB.style.display = '';
  var t0 = performance.now(), tick = setInterval(function () { var t = $('#otime'); if (t && running === id) t.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
  kRun(code, s.probe, function (t, e) { OUTTXT[id] += t + '\n'; if (S.cur === id) conAdd(t + '\n', e); }).then(function (m) {
    clearInterval(tick); running = null; setBusy(false);
    if (cur.stopB) cur.stopB.style.display = 'none';
    var t = $('#otime'); if (t) t.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s';
    if (m.error) {
      ERR[id] = m.error; VERD[id] = { pass: false, msg: 'Python stopped with an error. Read the red box below.' };
      ss.codePass = false; save();
      if (S.cur === id) { showErr(m.error); if (m.error.line && cur.ed) cur.ed.mark(m.error.line); }
    } else if (m.probe && m.probe.probe_error) {
      VERD[id] = { pass: false, msg: 'The checker could not read your results (' + m.probe.probe_error + '). Did you rename a variable?' }; ss.codePass = false; save();
    } else {
      RES[id] = m.probe; var v = s.check(m.probe); VERD[id] = v;
      ss.codePass = !!v.pass; if (v.pass) { ss.code = code; } save();
      if (S.cur === id) drawViz(id);
      if (id === '2a' && v.pass && ss.mech) { ss.mech.keptCmd = null; ss.mech.kept = null; save(); }
      if (s.predict && s.predict.format !== 'number' && v.pass && S.cur === id) { var pb = $('#predbox'); if (pb) pb.replaceWith(renderPredict(id)); }
      if (!OUTTXT[id] && conEl) conAdd('(no printed output)');
    }
    if (S.cur === id) refreshStatus();
    updateRunBtn();
  });
}

/* ---------- routing ---------- */
function route() {
  var hs = location.hash.replace('#', ''), m;
  if ((m = hs.match(/^sub-(\w+)$/)) && SUB[m[1]]) return openSub(m[1]);
  if ((m = hs.match(/^step-(\d+)$/))) {
    var st = STEPS.filter(function (x) { return x.id === +m[1]; })[0];
    if (st && !st.locked) { var pick = st.substeps.filter(function (s) { return openable(s.id) && !passed(s.id); })[0] || st.substeps[0]; return openSub(pick.id); }
  }
  openSub(S.cur && SUB[S.cur] ? S.cur : '0a');
}
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
layout();
resizer($('#rz1'), 'nav'); resizer($('#rz2'), 'out');
showProg();
prog.text = 'Downloading 2,624 real cell photos (5.4 MB)…';
var dataP = loadData();
dataP.then(function () { if (S.cur) { if (SUB[S.cur].kind === 'scene') renderOut(); } }).catch(function (e) { fatal('The photo pack could not be loaded: ' + e.message); });
if (typeof WebAssembly === 'undefined') fatal('This browser has no WebAssembly, so Python cannot run here.');
else spawn(typeof Worker === 'undefined' ? 'page' : (EMB ? 'blob' : 'file'), dataP);
whenReady().then(replay).then(function () { refreshStatus(); });
var licEl = document.getElementById('lic');
if (licEl) licEl.addEventListener('click', function () {
  pgFetch('data/LICENSE.md').then(function (r) { return r.text(); }).then(function (t) {
    var z = h('div', { class: 'zoom', style: 'position:fixed;z-index:70;align-items:stretch;justify-content:flex-start' });
    z.appendChild(h('button', { class: 'btn small', text: '✕ Close', style: 'align-self:flex-end', onclick: function () { z.remove(); } }));
    z.appendChild(h('pre', { text: t, style: 'white-space:pre-wrap;overflow:auto;flex:1;font-size:12px;color:#c6d2e2;max-width:900px;margin:0 auto' }));
    document.body.appendChild(z);
  });
});
route();
window.PG = { PYODIDE_BASE: PYODIDE_BASE, pack: function () { return PACK; }, S: S, RES: RES, VERD: VERD, K: K, openSub: openSub, passed: passed, pendingOf: pendingOf, ORDER: ORDER, kEval: kEval, ready: function () { return K.ready && !replaying; } };
})();
