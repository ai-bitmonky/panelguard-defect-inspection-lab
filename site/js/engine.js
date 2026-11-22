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
var S = { cur: null, subs: {}, navW: 250, outW: 470, navC: false, outC: false };
try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.subs) S = Object.assign(S, saved); } catch (e) {}
/* Review mode (generic): every built page open, nothing required, nothing saved as progress.
   The student's state S is never changed by work done in review mode: review work lives in RV (memory only). */
var RKEY = 'panelguard.review';
var REVIEW = (function () { try { if (/(^|[#&])review($|&)/.test(location.hash.slice(1)) || /[?&]review=1/.test(location.search)) return true; return localStorage.getItem(RKEY) === '1'; } catch (e) { return false; } })();
var RV = { subs: {}, studentCur: S.cur };
var REVIEW_MSG = 'Review mode: press “Run up to here” to load real data for this page.';
var RBKEY = 'panelguard.reviewBannerClosed';
function bannerClosed() { try { return localStorage.getItem(RBKEY) === '1'; } catch (e) { return !!RV.bannerClosed; } }
function setBannerClosed(c) { RV.bannerClosed = c; try { if (c) localStorage.setItem(RBKEY, '1'); else localStorage.removeItem(RBKEY); } catch (e) {} applyReviewUI(); }
function applyReviewUI() {
  document.body.classList.toggle('review', REVIEW);
  document.body.classList.toggle('rvclosed', REVIEW && bannerClosed());
  var b = document.getElementById('revbtn'); if (b) { b.textContent = 'Review mode: ' + (REVIEW ? 'ON' : 'OFF'); b.setAttribute('aria-pressed', REVIEW ? 'true' : 'false'); }
}
function setReview(on) {
  try { localStorage.setItem(RKEY, on ? '1' : '0'); } catch (e) {}
  if (on !== REVIEW) setBannerClosed(false);           // the banner comes back each time review mode is turned on again
  if (on) { if (REVIEW) return; REVIEW = true; RV.studentCur = S.cur; applyReviewUI(); updateGoal(); renderNav(); renderWork(); renderOut(); return; }
  if (!REVIEW) return;
  /* OFF: reload, so the student's real progress, kernel state and locks come back exactly as they were */
  save();
  var cur0 = RV.studentCur || '0a', qs = location.search.replace(/([?&])review=1(&|$)/, '$1').replace(/[?&]$/, '');
  try {
    if (qs !== location.search) { location.replace(location.pathname + qs + '#sub-' + cur0); return; }
    location.hash = '#sub-' + cur0; location.reload();
  } catch (e) { location.reload(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(REVIEW ? Object.assign({}, S, { cur: RV.studentCur }) : S)); } catch (e) {} }
function SSs(id) { return S.subs[id] || (S.subs[id] = { mech: {}, pred: {} }); }           // the student's real progress
function SS(id) { return REVIEW ? (RV.subs[id] || (RV.subs[id] = { mech: {}, pred: {} })) : SSs(id); }

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
  if (s.pre) { var pn = s.pre.need(st.mech || {}); if (pn) return pn; }
  if (!st.codePass) return st.mech && st.mech.lost === 'restore' ? 'press RUN to train again: the trained model could not be restored in this browser'
    : st.mech && (st.mech.lost === 'model' || st.mech.stale) ? 'press RUN again: the model it uses changed' : 'run the code until the check passes';
  if (s.mechNeed) return s.mechNeed(st.mech || {});
  return null;
}
function passed(id) { return pendingOf(id) === null; }
function openable(id) { if (REVIEW) return true; var i = ORDER.indexOf(id); for (var k = 0; k < i; k++) if (!passed(ORDER[k])) return false; return true; }
function firstBlock(id) { if (REVIEW) return null; var i = ORDER.indexOf(id); for (var k = 0; k < i; k++) if (!passed(ORDER[k])) return ORDER[k]; return null; }
function lockText(id) { var b = firstBlock(id); return b ? 'Locked. First finish ' + b + ' “' + SUB[b].name + '”: ' + pendingOf(b) + '.' : ''; }
function stepDone(st) { return st.substeps.length && st.substeps.every(function (s) { return passed(s.id); }); }

/* ---------- data ---------- */
var PACK = null, LAB = null, ID2I = {}, FULL = {}, D = null;
var prog = { dataMB: 0, dataTotal: 5.36, pyMB: 0, pyTotal: 33.8, text: '' };
function showProg() {
  if (K.blocked) { $('#ltext').innerHTML = '<b>PYTHON BLOCKED</b>' + (prog.dataMB >= prog.dataTotal ? 'Photos ready.' : 'Loading the photos…'); return; }
  var done = prog.dataMB + prog.pyMB, tot = prog.dataTotal + prog.pyTotal;
  $('#lbar').style.width = Math.min(100, 100 * done / tot).toFixed(1) + '%';
  $('#lnum').textContent = done.toFixed(1) + ' / ' + tot.toFixed(0) + ' MB';
  $('#ltext').innerHTML = '<b>LOADING ' + Math.round(100 * done / tot) + '%</b>' + esc(prog.text);
}
var WASM_MSG = 'This viewer blocks WebAssembly, so Python cannot start here. Download the HTML file and open it in Chrome.';
function wasmProbe() { try { if (typeof WebAssembly === 'undefined') return Promise.resolve(false); return WebAssembly.instantiate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])).then(function () { return true; }, function () { return false; }); } catch (e) { return Promise.resolve(false); } }
function wasmBlocked() {
  if (K.blocked) return; K.blocked = true;
  var e = $('#lerr'); e.classList.add('show'); e.innerHTML = '<b>Python is off in this viewer.</b> ' + esc(WASM_MSG) + '<br>Step 0 and every page without code still work here.';
  $('#lbar').parentNode.style.display = 'none'; $('#lnum').style.display = 'none'; showProg();
  $('#kdot').className = 'kdot bad'; $('#ktext').textContent = 'Python blocked here (no WebAssembly)'; $('#ktext').parentNode.title = WASM_MSG;
  updateRunBtn();
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
  else if (m.type === 'fatal') { if (m.wasmBlocked) wasmBlocked(); else fatal(m.text); }
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
      if (ev.data && ev.data.wasmBlocked) { got = true; try { w.terminate(); } catch (e) {} return wasmBlocked(); }
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

/* ---------- JavaScript kernel (cell language 'js': TensorFlow.js in this page) ---------- */
var JSR = { k: null, T: null, ready: false, err: null, backend: null, gpu: null, live: null, liveId: null, pending: [] };
var EPOCHS = { quick: 10, full: 30 };
/* Test setting only (shown plainly in the app): ?pgEpochs=N in the address, or window.PG_TEST_EPOCHS for srcdoc frames that have no address. */
var TEST_EPOCHS = (function () { try { if (window.PG_TEST_EPOCHS) return Math.max(1, +window.PG_TEST_EPOCHS); var m = location.search.match(/[?&]pgEpochs=(\d+)/); return m ? Math.max(1, +m[1]) : null; } catch (e) { return null; } })();
function epochsMode() { return TEST_EPOCHS ? 'test' : REVIEW ? 'review' : (S.epochsMode === 'quick' ? 'quick' : 'full'); }
function epochsNow() { return TEST_EPOCHS || (REVIEW ? 1 : EPOCHS[epochsMode()]); }
function gpuInfo() {
  try {
    var c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return { name: 'none', soft: true };
    var d = gl.getExtension('WEBGL_debug_renderer_info'), n = String(d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    return { name: n, soft: /swiftshader|llvmpipe|software|basic render/i.test(n) };
  } catch (e) { return { name: 'unknown', soft: false }; }
}
function initJS() {
  if (!window.tf || !window.PGJS) { JSR.err = 'TensorFlow.js could not be loaded (js/tf.min.js).'; showJSStat(); return; }
  var tf = window.tf;
  return tf.setBackend('webgl').then(function (ok) { return ok ? 'webgl' : tf.setBackend('cpu').then(function () { return 'cpu'; }); }, function () { return tf.setBackend('cpu').then(function () { return 'cpu'; }); })
    .then(function (be) { return tf.ready().then(function () { return be; }); })
    .then(function (be) {
      JSR.backend = tf.getBackend(); JSR.gpu = JSR.backend === 'webgl' ? gpuInfo() : null;
      JSR.k = window.PGJS.create({ tf: tf, global: window });
      JSR.T = window.PGJS.trainer(JSR.k, tf, { tick: function (s) { if (JSR.live && S.cur === JSR.liveId && !JSR.liveQ) { JSR.liveQ = 1; requestAnimationFrame(function () { JSR.liveQ = 0; if (JSR.live) JSR.live.update(s); }); } } });
      JSR.ready = true; showJSStat();
      var p = JSR.pending; JSR.pending = []; p.forEach(function (f) { f(); });
    }).catch(function (e) { JSR.err = 'TensorFlow.js could not start: ' + (e && e.message || e); showJSStat(); });
}
function jsReady() { return new Promise(function (res) { if (JSR.ready) res(); else JSR.pending.push(res); }); }
function showJSStat() {
  var t = $('#tstat'); if (!t) return;
  if (JSR.err) { t.innerHTML = '<span class="kdot bad"></span>' + esc(JSR.err); return; }
  if (!JSR.ready) { t.innerHTML = '<span class="kdot"></span>TensorFlow.js loading…'; return; }
  var be = JSR.backend === 'webgl' ? 'WebGL' + (JSR.gpu && JSR.gpu.soft ? ' (software)' : '') : 'CPU — slow';
  t.innerHTML = '<span class="kdot ' + (JSR.backend === 'webgl' && !(JSR.gpu && JSR.gpu.soft) ? 'ok' : 'bad') + '"></span>TensorFlow.js ' + esc(window.tf.version.tfjs) + ' · ' + be;
  t.title = JSR.backend === 'webgl' ? 'Graphics: ' + (JSR.gpu && JSR.gpu.name) : 'No WebGL here: TensorFlow.js runs on the CPU. Training will be very slow.';
}
/* pg: the data bridge. Pixels from this page; split, labels and Step 2 scores from the Python kernel (one source of truth). */
var BR = null;
function refreshBridge() {
  return kEval(window.PG_STEP3_BRIDGE).then(function (b) {
    if (!b || b.missing || b.probe_error) throw new Error('Python does not have ' + (b && b.missing ? b.missing.join(', ') : 'the Step 1–2 results') + ' yet. Finish Steps 1 and 2 first.');
    BR = b;
    var J = window.PGJS, i2 = {};
    LAB.rows.forEach(function (r, i) { i2[r[0]] = i; });
    var pg = {
      pixels: PACK, n: b.n, idx_train: b.idx_train, idx_val: b.idx_val, y_train: b.y_train, y_val: b.y_val, p_val: b.p_val,
      cell_val: b.cell_val, prob_val: b.prob_val, kind_val: b.kind_val, baseline: b.baseline,
      cellIndex: function (id) { return i2[id]; }, kindOf: function (id) { var r = LAB.rows[i2[id]]; return r ? r[2] : null; },
      get epochs() { return epochsNow(); }, epochsMode: epochsMode(), gpu: JSR.gpu,
      live: JSR.T.live, trainingWatch: JSR.T.watch, trainState: function () { return JSR.T.state; },
      falseAlarmAt95: J.falseAlarmAt95, twoGates: J.twoGates, gatesFor: window.PG_STEP3_gatesFor, auc: J.auc,
      saveModel: saveModel, review: REVIEW,
      py: function (expr) { return kEval('_r = (' + expr + ')').then(function (r) { if (r && r.probe_error) throw window.PGJS.CheckError('Python said: ' + r.probe_error); return r; }); },   // one Python expression -> JSON (Step 8 scores the sealed tray with the Step 2 model)
      mechOf: function (id) { try { var rv = REVIEW && RV.subs[id] && RV.subs[id].mech && Object.keys(RV.subs[id].mech).length ? RV.subs[id] : S.subs[id]; return JSON.parse(JSON.stringify((rv && rv.mech) || {})); } catch (e) { return {}; } }   // read-only copy (Step 6 action_list reads the student's 4f boxes; never creates entries)
    };
    pg.rough = !!(REVIEW && RES['3e'] && RES['3e'].quick === 'review');
    if (window.PG_PG_EXTRA) Object.assign(pg, window.PG_PG_EXTRA(pg));
    JSR.k.setPg(pg); return pg;
  });
}
function saveModel(model) {
  if (REVIEW) return Promise.resolve(false);           // review runs never touch the student's saved model
  var ss = SSs('3e'), key = window.PG_STEP3_MODEL_KEY + Date.now().toString(36);
  try {
    if (typeof indexedDB === 'undefined' || !indexedDB) return Promise.resolve(false);
    return model.save(key).then(function () {
      var old = ss.mech.modelKey; ss.mech.modelKey = key; ss.mech.savedAt = new Date().toLocaleString(); save();
      if (old && old !== key) window.tf.io.removeModel(old).catch(function () {});
      return true;
    }).catch(function () { return false; });
  } catch (e) { return Promise.resolve(false); }
}
function restoreModel() {
  var ss = SSs('3e'), key = ss.mech && ss.mech.modelKey;
  if (!key || !ss.mech.lastRes) return Promise.resolve(false);
  try {
    return window.tf.loadLayersModel(key).then(function (m) {
      JSR.k.NS.model = m;      // same name the cells use
      var r = Object.assign({}, ss.mech.lastRes, { restoredFrom: ss.mech.savedAt || 'an earlier visit', saved: true });
      RES['3e'] = r; VERD['3e'] = SUB['3e'].check(r); return true;
    }).catch(function () { return false; });
  } catch (e) { return Promise.resolve(false); }
}
function jsRun(code, probe, out) {
  return jsReady().then(refreshBridge).then(function () {
    var lg = console.log; console.log = function () { if (out) out(Array.prototype.map.call(arguments, function (a) { return window.PGJS.fmt(a); }).join(' ')); };
    return JSR.k.run(code, probe, function (t, e) { if (out) out(t, e); }).then(function (r) { console.log = lg; return r; }, function (e) { console.log = lg; throw e; });
  }).catch(function (e) { return { error: { type: 'Setup', msg: e.message || String(e), line: null, tb: '' } }; });
}
function jsEval(fn) { return jsReady().then(function () { return JSR.k.eval(fn); }).catch(function (e) { console.warn('jsEval: ' + String(e && e.message || e)); return null; }); }
function lose(id, why) { var ss = SSs(id); ss.codePass = false; ss.mech.lost = why || 1; delete RES[id]; VERD[id] = null; save(); }
function invalidateAfter(id) {
  var later = { '3c': ['3e', '3f', '3g'], '3e': ['3f', '3g'], '3f': ['3g'] }[id] || [];
  later.forEach(function (x) { if (SS(x).codePass) { SS(x).codePass = false; delete RES[x]; VERD[x] = null; SS(x).mech.stale = id; } });
  if (later.length) save();
}
function replayJS() {
  var ids = ORDER.filter(function (id) { var x = S.subs[id]; return SUB[id].lang === 'js' && x && x.codePass && x.code; });
  if (!ids.length) return Promise.resolve();
  replaying = true;
  var chain = jsReady().then(refreshBridge), modelLost = false;
  ids.forEach(function (id, n) {
    chain = chain.then(function () {
      $('#ktext').textContent = 'Rebuilding your work: ' + id + ' (' + (n + 1) + ' of ' + ids.length + ')…'; $('#kdot').className = 'kdot busy';
      if (modelLost && (id === '3f' || id === '3g')) { lose(id, 'model'); return; }
      if (SUB[id].restore) return restoreModel().then(function (ok) { if (!ok) { modelLost = true; lose(id, 'restore'); } });
      return JSR.k.run(SSs(id).code, SUB[id].probe, null).then(function (m) {
        if (!m.error && m.probe && !m.probe.probe_error) { RES[id] = m.probe; VERD[id] = SUB[id].check(m.probe); if (!VERD[id].pass) lose(id); }
        else lose(id);
      });
    });
  });
  return chain.catch(function (e) { console.warn('JS replay stopped: ' + (e && e.message)); }).then(function () {
    replaying = false; $('#kdot').className = 'kdot ok';
    if (K.versions) $('#ktext').textContent = 'Python ' + K.versions.python + ' · scikit-learn ' + K.versions.sklearn;
    if (S.cur && SUB[S.cur]) { renderWork(); renderOut(); }
  });
}
function liveHook(id) { var s = SUB[id]; if (!s || !s.live) return; var vb = $('#vizbox'); if (!vb) return; vb.innerHTML = ''; JSR.live = window.PGViz3.curvesLive(vb, makeApi(id)); JSR.liveId = id; if (JSR.T && JSR.T.state && running === id) JSR.live.update(JSR.T.state); }

/* replay passed code so the notebook state comes back (after reload or Stop) */
var replaying = false;
function replay() {
  var ids = ORDER.filter(function (id) { var x = S.subs[id]; return SUB[id].kind === 'code' && SUB[id].lang !== 'js' && x && x.codePass && x.code; });
  if (!ids.length) return replayJS();
  replaying = true;
  var chain = Promise.resolve();
  ids.forEach(function (id, n) {
    chain = chain.then(function () {
      $('#ktext').textContent = 'Rebuilding your work: ' + id + ' (' + (n + 1) + ' of ' + ids.length + ')…';
      $('#kdot').className = 'kdot busy';
      return kRun(SSs(id).code, SUB[id].probe).then(function (m) {
        if (!m.error && m.probe && !m.probe.probe_error) { RES[id] = m.probe; VERD[id] = SUB[id].check(m.probe); }
        var mk = SSs(id).mech && SSs(id).mech.keptCmd;
        if (mk) return kRun(mk, null);
      });
    });
  });
  return chain.then(function () {
    replaying = false; $('#kdot').className = 'kdot ok';
    $('#ktext').textContent = 'Python ' + K.versions.python + ' · scikit-learn ' + K.versions.sklearn;
    if (S.cur && SUB[S.cur].kind === 'code') renderOut();
  }).then(replayJS);
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
    if (st.locked && !(STEPS[i - 1] || {}).locked) nav.appendChild(h('div', { class: 'plan', text: 'FULL PLAN — COMING NEXT' }));
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
function stripLabel(cx, name, col, n) {
  var words = name.split(' '), lines = [name];
  if (n >= 6 && name.length > 13) { var best = 1, bd = 1e9; for (var k = 1; k < words.length; k++) { var d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length); if (d < bd) { bd = d; best = k; } } lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]; }
  return '<text x="' + cx + '" y="' + (lines.length > 1 ? 68 : 74) + '" text-anchor="middle" font-family="Rajdhani,Arial,sans-serif" font-size="15" font-weight="600" fill="' + col + '">' +
    lines.map(function (l, i) { return '<tspan x="' + cx + '" dy="' + (i ? 15 : 0) + '">' + esc(l) + '</tspan>'; }).join('') + '</text>';
}
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
      stripLabel(cx, s.name, cur ? '#46e3ff' : (ok ? '#c6d2e2' : '#5d6b80'), n);
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
var KWJ = /^(const|let|var|function|return|for|of|in|if|else|while|await|async|new|true|false|null|undefined|Infinity|this|typeof|break|continue)$/;
var BIJ = /^(console|Math|Array|tf|pg|Number|JSON|Object)$/;
function hl(code, lang) {
  var js = lang === 'js';
  var re = js ? /(\/\/[^\n]*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(____)|(\b\d+\.?\d*(?:e-?\d+)?\b)|([A-Za-z_$][\w$]*)/g
              : /(#[^\n]*)|([fbr]?'(?:\\.|[^'\\\n])*'|[fbr]?"(?:\\.|[^"\\\n])*")|(____)|(\b\d+\.?\d*(?:e-?\d+)?\b)|([A-Za-z_]\w*)/g;
  var K1 = js ? KWJ : KW, B1 = js ? BIJ : BI, out = '', last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index)); last = re.lastIndex;
    if (m[1]) out += '<span class="t-c">' + esc(m[1]) + '</span>';
    else if (m[2]) out += '<span class="t-s">' + esc(m[2]).replace(/____/g, '<span class="gap">____</span>') + '</span>';
    else if (m[3]) out += '<span class="gap">____</span>';
    else if (m[4]) out += '<span class="t-n">' + m[4] + '</span>';
    else { var w = m[5], nx = code[last]; out += K1.test(w) ? '<span class="t-k">' + w + '</span>' : B1.test(w) ? '<span class="t-b">' + w + '</span>' : nx === '(' ? '<span class="t-f">' + w + '</span>' : w; }
  }
  return out + esc(code.slice(last)) + '\n';
}
function Editor(box, code, onRun, onChange, lang) {
  var gut = h('div', { class: 'gut' }), pre = h('pre', { 'aria-hidden': 'true' }), ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off', 'aria-label': (lang === 'js' ? 'JavaScript' : 'Python') + ' code editor' });
  var ed = h('div', { class: 'ed' }, [gut, h('div', { class: 'edw' }, [pre, ta])]);
  box.appendChild(ed);
  var errLine = null;
  function paint() {
    var v = ta.value, lines = v.split('\n');
    pre.innerHTML = hl(v, lang);
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
      if (lang === 'js' ? /[{(\[]\s*$/.test(line) : /:\s*$/.test(line)) ind += lang === 'js' ? '  ' : '    ';
      ev.preventDefault(); ta.setRangeText('\n' + ind, s, e, 'end'); ta.dispatchEvent(new Event('input'));
    }
  });
  return {
    get: function () { return ta.value; },
    set: function (c) { ta.value = c; errLine = null; paint(); ed.scrollTop = 0; ed.scrollLeft = 0; },
    mark: function (n) { errLine = n; paint(); },
    focusGap: function (line) {
      var v = ta.value, i = -1, m;
      if (line) { var st = 0, L = v.split('\n'); for (var k = 0; k < line - 1; k++) st += L[k].length + 1; m = L[line - 1].match(/(?<![A-Za-z])_{2,}(?![A-Za-z])/); if (m) { i = st + m.index; ta.focus(); ta.setSelectionRange(i, i + m[0].length); return; } }
      i = v.indexOf('____'); if (i >= 0) { ta.focus(); ta.setSelectionRange(i, i + 4); }
    },
    ta: ta
  };
}

/* ---------- layout + resizers ---------- */
function layout() {
  var m = $('#main');
  m.classList.toggle('navc', !!S.navC);
  m.style.setProperty('--navw', (S.navC ? 58 : S.navW) + 'px');
  m.classList.toggle('outc', !!S.outC);
  m.style.setProperty('--outw', (S.outC ? 44 : S.outW) + 'px');
}
function resizer(el, which) {
  el.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); el.setPointerCapture(ev.pointerId); el.classList.add('drag');
    var x0 = ev.clientX, w0 = which === 'nav' ? S.navW : S.outW;
    function mv(e) {
      var dx = e.clientX - x0;
      if (which !== 'nav') S.outC = false;
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
    out: $('#out'), work: $('#work'), art: ART, getMech: function (k) { return SS(k).mech || {}; },
    jsEval: jsEval, gpu: function () { return JSR.gpu; }, review: REVIEW
  };
}
function setBusy(b) { $('#kdot').className = 'kdot ' + (b ? 'busy' : 'ok'); }

/* ---------- open a substep ---------- */
var cur = { ed: null, viz: null };
function openSub(id) {
  if (!SUB[id]) return;
  if (!openable(id)) { var b = firstBlock(id); id = b; }
  var same = S.cur === id; S.cur = id; save(); updateGoal();
  renderNav(); renderWork(); renderOut();
  if (!same) { $('#work').scrollTop = 0; $('#out').scrollTop = 0; }
}
var GOAL1 = null;
/* Output panel fold (same idea as the step list): a slim rail with an open button and a result badge. */
var OB = null;
function setOutC(c) { S.outC = !!c; if (!c) OB = null; save(); layout(); showRail(); if (!c && cur.viz && cur.viz.resize) cur.viz.resize(); }
function outBadge(kind) { if (!S.outC) return; OB = kind; showRail(); }
function showRail() {
  var r = $('#orail'); if (!r) return;
  var b = { pass: ['PASS', 'ok'], check: ['CHECK', 'chk'], error: ['ERROR', 'err'] }[OB];
  r.innerHTML = '';
  r.appendChild(h('button', { class: 'ib', id: 'oopen', title: 'Open the output panel', html: '«', onclick: function () { setOutC(false); } }));
  r.appendChild(h('div', { class: 'orl', text: 'OUTPUT' }));
  if (b) r.appendChild(h('button', { class: 'obadge ' + b[1], id: 'obadge', title: 'A run finished: open the output panel to see it', text: b[0], onclick: function () { setOutC(false); } }));
}
function updateGoal() {
  var g = $('.goal'); if (!g) return; if (GOAL1 == null) GOAL1 = g.innerHTML;
  var i3 = ORDER.indexOf('3g'), two = i3 >= 0 && ORDER.indexOf(S.cur) >= i3 && window.PG_STEP3_GOAL2;
  g.innerHTML = two ? '<i>TARGET</i><span>' + window.PG_STEP3_GOAL2 + '</span>' : GOAL1; g.classList.toggle('two', !!two);
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
  if (s.pre) { var pbx = h('div', { id: 'prebox' }); w.appendChild(pbx); s.pre.render(pbx, makePreApi(id)); }
  if (s.long) w.appendChild(renderEpochs());
  cur.ed = null;
  if (s.kind === 'code') {
    var js = s.lang === 'js';
    var box = h('div', { class: 'edbox' });
    var runB = h('button', { class: 'btn run', id: 'runbtn', text: '▶ RUN' });
    var stopB = h('button', { class: 'btn stop', text: '■ Stop', style: 'display:none', title: js ? 'Stops the run after the current batch.' : 'Stops Python and restarts it. Your passed cells are rebuilt.' });
    var resetB = h('button', { class: 'btn small', text: '↺ Reset this cell', title: 'Put back the starting code' });
    var copyB = h('button', { class: 'btn small', text: '⧉ Copy code' });
    box.appendChild(h('div', { class: 'edbar' }, [h('span', { class: 'fn', text: js ? 'cell_' + id + '.js — ' + (s.edLabel || 'JavaScript · TensorFlow.js') : 'cell_' + id + '.py — Python' }), h('span', { class: 'sp' }), copyB, resetB]));
    cur.ed = Editor(box, ss.code || s.code, doRun, function (v) { ss.draft = v; save(); }, s.lang);
    if (ss.draft && ss.draft !== (ss.code || s.code)) cur.ed.set(ss.draft);
    var note = h('span', { class: 'note' });
    var rvBtns = REVIEW && s.ref ? [h('button', { class: 'btn small rvb', id: 'reffill', text: 'Fill reference answer', onclick: function () { cur.ed.set(refCode(s)); } }),
      h('button', { class: 'btn small rvb', id: 'runupto', text: 'Run up to here', onclick: function () { runUpTo(id); } }), h('span', { class: 'note', id: 'rvstat' })] : [];
    box.appendChild(h('div', { class: 'runrow' }, [runB, stopB].concat(rvBtns, [note, h('span', { class: 'note', style: 'margin-left:auto', text: 'Ctrl+Enter runs · Tab indents' })])));
    if (s.twin) { var pair = h('div', { class: 'pair' }, [box, twinPanel(s)]); w.appendChild(pair); } else w.appendChild(box);
    runB.onclick = doRun;
    stopB.onclick = function () { if (js) { JSR.k && JSR.k.stop(); stopB.textContent = '■ Stopping…'; } else restartKernel(); };
    resetB.onclick = function () { cur.ed.set(s.code); ss.draft = null; save(); };
    copyB.onclick = function () { copyText(cur.ed.get(), copyB); };
    cur.runB = runB; cur.stopB = stopB; cur.note = note;
    tipOn(runB, function () { return runB.disabled ? runB.dataset.why : ''; });
    updateRunBtn();
  } else {
    var stage = h('div', { class: 'scene', id: 'stage' }); w.appendChild(stage);
  }
}
function twinPanel(s) {
  var copyB = h('button', { class: 'btn small', text: '⧉ Copy' });
  copyB.onclick = function () { copyText(s.twin, copyB); };
  var pre = h('pre', { class: 'twcode', html: hl(s.twin, 'py') });
  return h('div', { class: 'twin' }, [h('div', { class: 'edbar' }, [h('span', { class: 'fn', html: '<b style="color:#ffcf6b">' + esc(s.twinTitle || 'Same thing in Python Keras') + '</b> · ' + esc(s.twinNote || 'read-only · Keras 3') }), h('span', { class: 'sp' }), copyB]), pre]);
}
function renderEpochs() {
  var box = h('div', { class: 'card epochs' });
  var mode = epochsMode();
  box.appendChild(h('div', { class: 'row' }, [h('b', { text: 'Training length:' })].concat(REVIEW && !TEST_EPOCHS ? [h('span', { class: 'tagpill', style: 'border-color:#ffb547;color:#ffb547', text: 'review setting: 1 epoch — numbers are rough' })] : TEST_EPOCHS ? [h('span', { class: 'tagpill', text: 'test setting: ' + TEST_EPOCHS + ' epoch' + (TEST_EPOCHS > 1 ? 's' : '') + ' (from the page address)' })] :
    [['quick', 'Quick · ' + EPOCHS.quick + ' epochs'], ['full', 'Full · ' + EPOCHS.full + ' epochs']].map(function (o) {
      return h('button', { class: 'btn small' + (mode === o[0] ? ' on' : ''), text: o[1], onclick: function () { if (running) return; S.epochsMode = o[0]; save(); renderWork(); } });
    }))));
  var last = SS('3e').mech && SS('3e').mech.lastRes, per = last && last.hist && last.hist.length ? last.hist.reduce(function (a, x) { return a + x.sec; }, 0) / last.hist.length : null;
  var g = JSR.gpu, soft = !JSR.ready ? '' : JSR.backend !== 'webgl' ? ' This browser has no WebGL, so TensorFlow.js uses the CPU: training will be VERY slow (many minutes per epoch).' : g && g.soft ? ' WebGL here runs on a software renderer (no graphics chip): expect several minutes per epoch.' : '';
  box.appendChild(h('div', { class: 'hint', html: (per ? 'Your last run: <b>' + per.toFixed(1) + ' s per epoch</b> on ' + esc(last.backend.toUpperCase()) + ' → Quick ≈ ' + (per * EPOCHS.quick / 60).toFixed(1) + ' min, Full ≈ ' + (per * EPOCHS.full / 60).toFixed(1) + ' min. '
    : 'Time depends on your graphics chip; the first epoch shows the real time and a countdown. ') + esc(soft) }));
  return box;
}
function makePreApi(id) {
  var a = makeApi(id), base = a.setMech;
  a.setMech = function (patch) { var was = SUB[id].pre.need(SS(id).mech || {}); base(patch); if (was && !SUB[id].pre.need(SS(id).mech || {})) { updateRunBtn(); } };
  return a;
}
function updateRunBtn() {
  if (!cur.runB) return;
  var s = SUB[S.cur], ss = SS(S.cur), why = '';
  if (K.blocked) why = WASM_MSG;
  else if (!K.ready) why = 'Python is still loading (' + Math.round(100 * (prog.dataMB + prog.pyMB) / (prog.dataTotal + prog.pyTotal)) + '%). Wait a moment.';
  else if (replaying) why = 'Python is rebuilding your earlier cells. Wait a moment.';
  else if (s.lang === 'js' && JSR.err) why = JSR.err;
  else if (s.lang === 'js' && !JSR.ready) why = 'TensorFlow.js is still starting. Wait a moment.';
  else if (s.lang === 'js' && STEP_OF[S.cur].id >= 5 && !window.LangGraph) why = 'LangGraph could not be loaded (js/langgraph.min.js). Reload the page.';
  else if (s.lang === 'js' && STEP_OF[S.cur].id >= 6 && !window.MiniCrew) why = 'The crew runner could not be loaded (js/crew.js). Reload the page.';
  else if (!REVIEW && s.pre && s.pre.need(ss.mech || {})) why = 'First do the hands-on part above: ' + s.pre.need(ss.mech || {}) + '.';
  else if (!REVIEW && s.predict && !(ss.pred && ss.pred.locked)) why = 'Answer the prediction question above first.';
  else if (running) why = 'Code is running.';
  cur.runB.disabled = !!why; cur.runB.dataset.why = why;
  [].forEach.call(document.querySelectorAll('.rvb'), function (b) { b.disabled = !!running || replaying || runningUpTo; });
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
  } else if (P.format === 'tokens') {
    var tk = pr.tokens || (pr.tokens = P.options.map(function () { return 0; }));
    var used = tk.reduce(function (a, b) { return a + b; }, 0), trow = h('div', { class: 'betrow' });
    P.options.forEach(function (o, k) {
      var have = pr.locked ? pr.val[k] : tk[k];
      var dots = h('div', { class: 'tokdots', html: new Array(have + 1).join('<i></i>') || '<span class="hint">no tokens</span>' });
      var kids = [h('div', { class: 'bi', text: String.fromCharCode(65 + k) }), h('div', { text: o.replace(/^[A-C]: /, '') }), dots];
      if (!pr.locked) kids.push(h('div', { class: 'row', style: 'margin-top:6px' }, [
        h('button', { class: 'btn small', id: 'tokm' + k, text: '−', disabled: tk[k] ? null : 'disabled', onclick: function () { tk[k]--; save(); renderWork(); } }),
        h('button', { class: 'btn small', id: 'tokp' + k, text: '+ token', disabled: used < 10 ? null : 'disabled', onclick: function () { tk[k]++; save(); renderWork(); } })]));
      trow.appendChild(h('div', { class: 'bet' + (pr.locked && k === P.right ? ' sel' : '') }, kids));
    });
    body.appendChild(trow);
    if (!pr.locked) {
      body.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, [h('button', { class: 'btn', id: 'tokcheck', text: 'Check', disabled: used === 10 ? null : 'disabled', onclick: function () { pr.good = tk[P.right] >= 6 ? 1 : 0; lock(tk.slice()); } }),
        h('span', { class: 'hint', text: (10 - used) + ' of 10 tokens left to place. One try.' })]));
    } else {
      body.appendChild(h('div', { class: 'verdict ' + (pr.good ? 'good' : 'bad'), html: (pr.good ? '✓ Right. ' : '✗ Not quite. ') + 'You put <b>' + pr.val[P.right] + ' of 10</b> tokens on “' + esc(P.options[P.right]) + '”. If the map is honest, removing its hottest pixels hurts the score most. Your run below shows how strong that really is here.' }));
      body.appendChild(whyBox(P.reveal, 'Why (tap to open)'));
    }
  } else if (P.format === 'draw') {
    var holder2 = h('div'); body.appendChild(holder2);
    var V3 = window.PGViz3;
    if (!pr.locked) {
      V3.drawGuess(holder2, P, { val: pr.sketch || null }, function (pts) { pr.sketch = pts; save(); }, false);
      var hint2 = h('span', { class: 'hint', text: 'Draw from left to right, then tap Check. One try.' });
      var ck = h('button', { class: 'btn', text: 'Check', onclick: function () {
        var pts = pr.sketch || [], n = pts.filter(function (v) { return v != null; }).length;
        if (n < 15) { hint2.textContent = 'Draw across most of the chart first (' + n + ' of 30 epochs drawn).'; return; }
        var full = V3.fillGaps(pts); pr.good = P.judge(full) ? 1 : 0; lock(full);
      } });
      var clr = h('button', { class: 'btn small', text: 'Clear', onclick: function () { pr.sketch = null; save(); renderWork(); } });
      body.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, [ck, clr, hint2]));
    } else {
      V3.drawGuess(holder2, P, pr, null, true);
      body.appendChild(h('div', { class: 'verdict ' + (pr.good ? 'good' : 'bad'), html: pr.good ? '✓ Right. The validation score rises, then stops rising and slides down. The green dashes show the typical shape.' : '✗ Not quite. The validation score rises at first, then flattens and slides down if training goes on too long (green dashes). The train loss keeps falling; validation does not.' }));
      body.appendChild(whyBox(P.reveal, 'Why (tap to open)'));
      body.appendChild(h('div', { class: 'hint', text: 'After training, your real validation curve appears next to your sketch on the right.' }));
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
      whenReady().then(function () { return replayDone(); }).then(function () { return kEval(s.preProbe); }).then(function (r) { if (r && r.curve) { PRE[id] = r; if (S.cur === id) draw(); } else holder.innerHTML = '<div class="hint">' + (REVIEW ? REVIEW_MSG : 'Could not read p_val yet. Finish 2c first.') + '</div>'; });
    }
  } else if (P.render) {                                  // a format with its own renderer (e.g. Step 5 'lanes')
    P.render(body, makeApi(id), pr, lock, whyBox);
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
  o.appendChild(h('div', { class: 'ohead' }, [h('h3', { text: s.kind === 'code' ? 'LIVE OUTPUT' : 'RESULT' }), h('span', { class: 't', id: 'otime' }), h('button', { class: 'ib', id: 'ofold', title: 'Fold the output panel', html: '»', onclick: function () { setOutC(true); } })]));
  o.appendChild(h('div', { id: 'chkbox' }));
  if (s.kind === 'scene') {
    var vz = h('div', { id: 'vizbox' }); o.appendChild(vz);
    cur.viz = V.scene(s, $('#stage'), vz, makeApi(id)) || null;
    refreshStatus(); return;
  }
  o.appendChild(h('div', { id: 'errbox' }));
  o.appendChild(h('div', { id: 'vizbox' }));
  o.appendChild(h('div', { id: 'whybox' }));
  o.appendChild(h('div', { class: 'conh', text: s.lang === 'js' ? 'PRINTED BY console.log' : 'PRINTED BY PYTHON' }));
  conEl = h('div', { class: 'con', id: 'con' }); o.appendChild(conEl);
  if (OUTTXT[id]) conAdd(OUTTXT[id]); else conAdd(ss.codePass && !RES[id] ? '(rebuilding…)' : '(nothing yet — press RUN)');
  o.appendChild(h('div', { id: 'endbox' }));
  if (ERR[id]) showErr(ERR[id]);
  if (RES[id]) drawViz(id);
  else if (REVIEW) $('#vizbox').appendChild(h('div', { class: 'verdict', style: 'background:#151109;border:1px solid #5c4610', text: REVIEW_MSG }));
  refreshStatus();
}
function showErr(e) {
  var b = $('#errbox'); if (!b) return;
  b.innerHTML = '';
  if (!e) return;
  b.appendChild(h('div', { class: 'chk fail errc' }, [h('span', { class: 'ic', text: 'ERROR' }), h('div', {}, [
    h('div', { html: esc((SUB[S.cur] && SUB[S.cur].lang === 'js' ? window.PGJS.friendly : friendly)(e)) + (e.line ? ' <b>(line ' + e.line + ')</b>' : '') }),
    e.tb ? h('details', {}, [h('summary', { text: SUB[S.cur] && SUB[S.cur].lang === 'js' ? 'Show the raw JavaScript message' : 'Show the raw Python message' }), h('pre', { text: e.tb })]) : null])]));
}
function drawViz(id) {
  var vb = $('#vizbox'); if (!vb) return;
  vb.innerHTML = '';
  try { cur.viz = SUB[id].render(RES[id], vb, makeApi(id)) || null; } catch (e) { console.error('render ' + id + ': ' + String(e && e.message || e)); vb.appendChild(h('div', { class: 'hint', text: 'Could not draw this card: ' + e.message })); }
}
function refreshStatus() {
  var id = S.cur, s = SUB[id], ss = SS(id), cb = $('#chkbox');
  if (cb) {
    cb.innerHTML = '';
    var v = VERD[id], pend = pendingOf(id);
    if (s.kind === 'scene') {
      cb.appendChild(pend ? h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'TO DO' }), h('div', { text: 'Now: ' + pend + '.' })])
                          : h('div', { class: 'chk pass' }, [h('span', { class: 'ic', text: 'DONE' }), h('div', { text: 'Done. ' + nextHint(id) })]));
    } else if (running === id) cb.appendChild(h('div', { class: 'chk wait' }, [h('span', { class: 'ic', text: 'RUN' }), h('div', { text: s.lang === 'js' ? (s.live ? 'Training in your browser… watch the curves below.' : 'Your code is running…') : 'Python is working on it…' })]));
    else if (v && !v.pass) cb.appendChild(h('div', { class: 'chk fail' }, [h('span', { class: 'ic', text: 'CHECK' }), h('div', { text: v.msg })]));
    else if (v && v.pass && pend) cb.appendChild(h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'ALMOST' }), h('div', { html: '✓ ' + esc(v.msg) + '<br>Now: <b>' + esc(pend) + '</b>.' })]));
    else if (v && v.pass) cb.appendChild(h('div', { class: 'chk pass' }, [h('span', { class: 'ic', text: 'PASS' }), h('div', { text: v.msg + ' ' + nextHint(id) })]));
    else if (ss.codePass && !RES[id]) cb.appendChild(h('div', { class: 'chk wait' }, [h('span', { class: 'ic', text: 'WAIT' }), h('div', { text: 'You passed this before. ' + (s.lang === 'js' ? 'Your earlier cells are being rebuilt…' : 'Python is rebuilding it…') })]));
    else cb.appendChild(h('div', { class: 'chk todo' }, [h('span', { class: 'ic', text: 'TO DO' }), h('div', { text: pend ? 'Now: ' + pend + '.' : '' })]));
  }
  var wb = $('#whybox');
  if (wb) { wb.innerHTML = ''; if ((passed(id) || (REVIEW && VERD[id] && VERD[id].pass)) && RES[id] && s.explain) wb.appendChild(whyBox(s.explain(RES[id], ss.mech || {}))); }
  var eb = $('#endbox');
  if (eb) { eb.innerHTML = ''; if (id === '2e' && (passed('2e') || (REVIEW && RES['2e']))) V.endCard(eb, RES, makeApi(id));
    else if (s.endCard && RES[id] && (passed(id) || (REVIEW && VERD[id] && VERD[id].pass))) s.endCard(eb, makeApi(id)); }
  var strip = $('.strip'); if (strip) renderStrip(STEP_OF[id], strip);
  renderNav();
}
function nextHint(id) {
  var i = ORDER.indexOf(id), n = ORDER[i + 1];
  if (!n) return 'Step ' + STEP_OF[id].id + ' is complete.';
  return STEP_OF[n] !== STEP_OF[id] ? 'Step ' + STEP_OF[id].id + ' is complete — open Step ' + STEP_OF[n].id + ' in the list.' : 'Next: tap ' + n + ' “' + SUB[n].name + '” in the strip.';
}

/* ---------- run ---------- */
function doRun() {
  var id = S.cur;
  if (!cur.ed || cur.runB.disabled) return;
  var code = cur.ed.get(), bl = blankLine(code);
  if (bl) { VERD[id] = { pass: false, msg: 'Line ' + bl + ' still has a blank ____ . Type your answer there, then press Run.' }; ERR[id] = null; showErr(null); refreshStatus(); cur.ed.mark(bl); cur.ed.focusGap(bl); outBadge('check'); return; }
  return execCell(id, code);
}
function execCell(id, code) {
  var s = SUB[id], ss = SS(id), js = s.lang === 'js';
  running = id; ERR[id] = null; showErr(null); VERD[id] = null; OUTTXT[id] = '';
  if (conEl) conEl.textContent = '';
  updateRunBtn(); refreshStatus(); setBusy(true);
  if (cur.stopB && S.cur === id && (K.mode !== 'page' || js)) { cur.stopB.style.display = ''; cur.stopB.textContent = '■ Stop'; }
  if (js && s.live) liveHook(id);
  var t0 = performance.now(), tick = setInterval(function () { var t = $('#otime'); if (t && running === id) t.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
  var outFn = function (t, e) { OUTTXT[id] += t + '\n'; if (S.cur === id) conAdd(t + '\n', e); };
  return (js ? jsRun(code, s.probe, outFn) : kRun(code, s.probe, outFn)).then(function (m) {
    clearInterval(tick); running = null; setBusy(false); JSR.live = null;
    if (cur.stopB) cur.stopB.style.display = 'none';
    var t = $('#otime'); if (t) t.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s';
    if (m.error && m.error.type === 'Check') {
      VERD[id] = { pass: false, msg: m.error.msg }; ss.codePass = false; save();
      if (S.cur === id) { var vb0 = $('#vizbox'); if (vb0) vb0.innerHTML = ''; }
    } else if (m.error) {
      ERR[id] = m.error; VERD[id] = { pass: false, msg: m.error.type === 'Stopped' ? m.error.msg : (js ? 'JavaScript stopped with an error. Read the red box below.' : 'Python stopped with an error. Read the red box below.') };
      ss.codePass = false; save();
      if (S.cur === id) { showErr(m.error); if (m.error.line && cur.ed) cur.ed.mark(m.error.line); if (js && s.live && JSR.T && JSR.T.state && JSR.T.state.hist.length) { var vb1 = $('#vizbox'); if (vb1) { vb1.innerHTML = ''; window.PGViz3.curvesLive(vb1, makeApi(id)).update(JSR.T.state); } } }
    } else if (m.probe && m.probe.probe_error) {
      VERD[id] = { pass: false, msg: 'The checker could not read your results (' + m.probe.probe_error + '). Did you rename a variable?' }; ss.codePass = false; save();
    } else {
      RES[id] = m.probe; var v = s.check(m.probe); VERD[id] = v;
      ss.codePass = !!v.pass; if (v.pass) { ss.code = code; if (ss.mech) { ss.mech.lost = 0; ss.mech.stale = 0; } if (js) invalidateAfter(id); } save();
      if (id === '3e' && v.pass) { var r = m.probe; ss.mech.lastRes = { epochs: r.epochs, done: r.done, hist: r.hist, best: r.best, restored: r.restored, sec: r.sec, backend: r.backend, gpu: r.gpu, nTrain: r.nTrain, nDef: r.nDef, cw: r.cw, quick: r.quick }; save(); }
      if (S.cur === id) drawViz(id);
      if (id === '2a' && v.pass && ss.mech) { ss.mech.keptCmd = null; ss.mech.kept = null; save(); }
      if (s.predict && s.predict.format !== 'number' && s.predict.format !== 'draw' && v.pass && S.cur === id) { var pb = $('#predbox'); if (pb) pb.replaceWith(renderPredict(id)); }
      if (!OUTTXT[id] && conEl) conAdd('(no printed output)');
    }
    if (S.cur === id) refreshStatus();
    updateRunBtn();
    outBadge(m.error && m.error.type !== 'Check' ? (m.error.type === 'Stopped' ? 'check' : 'error') : VERD[id] && VERD[id].pass ? 'pass' : 'check');
    return VERD[id];
  });
}
/* A blank = 2 or more underscores not touching a letter (so idx_train or __name__ are fine, but ____, ___ , 0.____ and ____5 are blanks). Returns its 1-based line, or 0. */
var BLANK = /(?<![A-Za-z])_{2,}(?![A-Za-z])/;
function blankLine(code) { var L = code.split('\n'); for (var i = 0; i < L.length; i++) { var t = L[i].replace(/(#|\/\/).*$/, ''); if (BLANK.test(t)) return i + 1; } return 0; }
function fillRef(code, vals) { var i = 0; return code.replace(/____/g, function () { return vals[i++]; }); }
/* reference code of a cell: gaps filled, then any planted-bug fixes applied (s.fixes = [[from, to]], used by 7g) */
function refCode(s) { var c = fillRef(s.code, s.ref || []); (s.fixes || []).forEach(function (f) { c = c.split(f[0]).join(f[1]); }); return c; }
/* Review mode: run every earlier code cell (reference answers) whose result is not here yet, then this one. Real computation, nothing faked. */
var runningUpTo = false;
function runUpTo(id) {
  if (runningUpTo || running) return;
  var upto = ORDER.indexOf(id), list = ORDER.filter(function (x, i) { return i <= upto && SUB[x].kind === 'code' && SUB[x].ref && (x === id || !(RES[x] && VERD[x] && VERD[x].pass)); });
  runningUpTo = true; updateRunBtn();
  var stat = function (t) { var n = $('#rvstat'); if (n) n.textContent = t; };
  var chain = (SUB[id].lang === 'js' || list.some(function (x) { return SUB[x].lang === 'js'; }) ? Promise.all([whenReady(), jsReady()]) : whenReady()).then(replayDone);
  list.forEach(function (x, n) {
    chain = chain.then(function (prev) {
      if (prev && prev.stop) return prev;
      stat('Run up to here: ' + x + ' “' + SUB[x].name + '” (' + (n + 1) + ' of ' + list.length + ')' + (x === '3e' ? ' — review setting: 1 epoch, numbers are rough' : '') + '…');
      if (x === id && cur.ed) cur.ed.set(refCode(SUB[x]));
      return execCell(x, refCode(SUB[x])).then(function (v) { if (!v || !v.pass) { stat('Run up to here stopped at ' + x + ': ' + (v ? v.msg : 'no result')); return { stop: 1 }; } });
    });
  });
  return chain.then(function (r) {
    runningUpTo = false;
    if (!(r && r.stop)) stat('Run up to here: done (' + list.length + ' cell' + (list.length === 1 ? '' : 's') + ' run with reference answers).');
    if (S.cur === id) { renderWork(); renderOut(); stat(r && r.stop ? 'Run up to here stopped early.' : 'Run up to here: done.'); }
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
/* WebAssembly probe first: some viewers (host frames with a strict CSP) block it. Then Python never starts; pages without Python still work. */
(window.PGWasmWorks ? window.PGWasmWorks() : wasmProbe()).then(function (ok) {
  if (!ok) return wasmBlocked();
  spawn(typeof Worker === 'undefined' ? 'page' : (EMB ? 'blob' : 'file'), dataP);
});
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
applyReviewUI(); showRail();
(function () { var b = document.getElementById('revbtn'); if (b) b.addEventListener('click', function () { setReview(!REVIEW); }); var x = document.getElementById('revx'); if (x) x.addEventListener('click', function () { setBannerClosed(true); }); })();
initJS();
route();
window.PG = { PYODIDE_BASE: PYODIDE_BASE, pack: function () { return PACK; }, S: S, RES: RES, VERD: VERD, K: K, JSR: JSR, openSub: openSub, passed: passed, pendingOf: pendingOf, ORDER: ORDER, kEval: kEval, epochs: epochsNow,
  ready: function () { return K.ready && !replaying; }, running: function () { return running; }, review: function () { return REVIEW; }, runningUpTo: function () { return runningUpTo; }, SSs: SSs, RV: RV };
})();
