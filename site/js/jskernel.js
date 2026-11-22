/* PanelGuard JavaScript kernel: runs the student's TensorFlow.js cells (cell language 'js').
   - one shared notebook scope: top-level names (const/let/var/function) live on across cells
   - console.log goes to the output pane
   - pg = data bridge: pixels from the page, split indices / labels / Step 2 scores from the Python kernel (one source of truth)
   - training helpers with live curves, best-epoch keeping, and a Stop that really stops
   Works in the page (main thread); training yields to the browser every batch so the page never freezes.
   Engine-agnostic: window.PGJS.create(opts) is also used by the Node tests (tools/tests/js_cells.test.mjs). */
(function (G) {
'use strict';

function CheckError(msg) { var e = new Error(msg); e.name = 'Check'; e.pgCheck = true; return e; }
function StopError(msg) { var e = new Error(msg || 'You stopped the run.'); e.name = 'Stopped'; e.pgStop = true; return e; }

/* ---------- metrics on plain arrays (validation tray) ---------- */
function auc(y, s) {                               // rank-based ROC AUC, ties get the average rank
  var n = y.length, idx = new Array(n), i, j;
  for (i = 0; i < n; i++) idx[i] = i;
  idx.sort(function (a, b) { return s[a] - s[b]; });
  var rank = new Float64Array(n);
  for (i = 0; i < n;) { j = i; while (j + 1 < n && s[idx[j + 1]] === s[idx[i]]) j++; var r = (i + j) / 2 + 1; for (var k = i; k <= j; k++) rank[idx[k]] = r; i = j + 1; }
  var np = 0, sum = 0; for (i = 0; i < n; i++) if (y[i] === 1) { np++; sum += rank[i]; }
  var nn = n - np; return nn && np ? (sum - np * (np + 1) / 2) / (np * nn) : NaN;
}
/* Same rule as Step 2 (precision_recall_curve): the highest cutoff that still stops >= 95% of defects. */
function cutAt(y, s, recall) {
  var d = []; for (var i = 0; i < y.length; i++) if (y[i] === 1) d.push(s[i]);
  d.sort(function (a, b) { return b - a; });
  var k = Math.ceil((recall == null ? 0.95 : recall) * d.length - 1e-9);
  return d[Math.max(0, k - 1)];
}
function rates(y, s, cut) {
  var tp = 0, fn = 0, fp = 0, tn = 0;
  for (var i = 0; i < y.length; i++) { var st = s[i] >= cut; if (y[i] === 1) { if (st) tp++; else fn++; } else { if (st) fp++; else tn++; } }
  return { cut: cut, tp: tp, fn: fn, fp: fp, tn: tn, rec: tp / (tp + fn), far: fp / (fp + tn), prec: tp + fp ? tp / (tp + fp) : 0 };
}
function falseAlarmAt95(y, s) { return rates(y, s, cutAt(y, s, 0.95)).far; }
function bce(y, s) { var L = 0; for (var i = 0; i < y.length; i++) { var p = Math.min(1 - 1e-7, Math.max(1e-7, s[i])); L -= y[i] ? Math.log(p) : Math.log(1 - p); } return L / y.length; }
/* Two gates: below low = auto-pass, at/above high = auto-stop, between = a person checks. */
function twoGates(y, s, low, high) {
  var hi = Math.max(high, low), o = { low: low, high: high, n: y.length, defPass: 0, defHuman: 0, defStop: 0, okPass: 0, okHuman: 0, okStop: 0 };
  for (var i = 0; i < y.length; i++) {
    var k = s[i] < low ? 'Pass' : (s[i] >= hi ? 'Stop' : 'Human');
    o[(y[i] === 1 ? 'def' : 'ok') + k]++;
  }
  o.nDef = o.defPass + o.defHuman + o.defStop; o.nOk = o.okPass + o.okHuman + o.okStop;
  o.passRate = o.defPass / o.nDef;                                   // defects passed by mistake
  o.human = (o.defHuman + o.okHuman) / o.n;                          // share sent to a person
  o.autoStop = (o.defStop + o.okStop) / o.n;
  o.autoPass = (o.defPass + o.okPass) / o.n;
  o.stopPrec = o.defStop + o.okStop ? o.defStop / (o.defStop + o.okStop) : null;
  o.okStopRate = o.okStop / o.nOk;                                   // good cells auto-stopped by mistake
  return o;
}

/* ---------- friendly JS errors ---------- */
function friendly(e) {
  var m = e.msg || '', t = e.type, x;
  if (t === 'Stopped') return m || 'You stopped the run.';
  if (t === 'Check') return m;
  if (t === 'SyntaxError') return 'JavaScript could not read this code (' + m + '). Check brackets ( ) [ ] { }, quotes and commas.';
  if (t === 'ReferenceError' && (x = m.match(/^(.+?) is not defined/)) && G.PG_NAME_FROM && G.PG_NAME_FROM[x[1]]) return 'This cell uses “' + x[1] + '”, which is made in ' + G.PG_NAME_FROM[x[1]] + '. Run ' + G.PG_NAME_FROM[x[1]] + ' first (in review mode: press “Run up to here”).';
  if (t === 'ReferenceError' && (x = m.match(/^(.+?) is not defined/))) return 'JavaScript does not know the name “' + x[1] + '”. Check the spelling (capital letters count). If it comes from an earlier substep, run that one again.';
  if ((x = m.match(/Based on the provided shape, \[(.*?)\], the tensor should have (\d+) values but has (\d+)/))) return 'The sizes do not fit: the data has ' + (+x[3]).toLocaleString('en-US') + ' values, but shape [' + x[1] + '] needs ' + (+x[2]).toLocaleString('en-US') + '. Check the gap.';
  if ((x = m.match(/Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+?)'\)/))) return 'Something is ' + x[1] + ' just before “.' + x[2] + '”. Usually a name is misspelled, or a list index is past the end.';
  if ((x = m.match(/^(.+?) is not a function/))) return '“' + x[1] + '” is not a function here. Check the spelling.';
  if ((x = m.match(/index value (-?\d+) is not in \[0, (\d+)\]/))) return 'There is no position ' + x[1] + ' there: that axis has only ' + (+x[2] + 1) + ' entries. Check the order of the numbers in the shape: the photo count comes first.';
  if ((x = m.match(/Unknown loss (\S+)/))) return 'TensorFlow.js has no loss called “' + x[1] + '”. Check the spelling letter by letter: capital letters count.';
  if ((x = m.match(/Axis must be|axis.*out of range|Invalid axis/i))) return 'That axis does not exist here: ' + m;
  if ((x = lgFriendly(m))) return x;
  return t + ': ' + m;
}
/* LangGraph errors in plain words (Step 5). Returns null for other messages. */
function lgFriendly(m) {
  var f = String(m || '').split('\n')[0], x;
  if ((x = f.match(/Node `(.+?)` is not reachable/))) return 'No arrow leads to the station “' + x[1] + '”, so it can never run. Check where each arrow (and each lane of a fork) goes.';
  if ((x = f.match(/Found edge (?:ending|starting) at unknown node `(.+?)`/))) return 'An arrow uses “' + x[1] + '”, but there is no station with that name. Arrows join station names (text in quotes).';
  if ((x = f.match(/^(.+?) is already being used as a state attribute/))) return 'A station cannot have the same name as a card field (“' + x[1] + '”). Rename the station.';
  if (/No checkpointer set/.test(f)) return 'interrupt() can only pause a flow that has a memory to keep it in. Compile the line with a checkpointer: compile({ checkpointer: … }).';
  if (/Called interrupt\(\) outside the context/.test(f)) return 'interrupt() lost track of its station. In the browser, call interrupt() first in the station, before any await.';
  if ((x = f.match(/Recursion limit of (\d+) reached/))) return 'The flow went round and round and never reached END. LangGraph stopped it after ' + x[1] + ' steps (its recursion limit). A loop needs a way out.';
  if (/Branch condition returned unknown or null destination/.test(f)) return 'A fork function returned a station that is not in its list of next stations. Return one of the names in that list.';
  if (/Expected cmd\.update/.test(f)) return 'Command({ update }) changes card fields; it does not carry an answer into a paused flow.';
  if ((x = f.match(/Invalid update for channel (\S+)/))) return 'A station returned something LangGraph cannot write on the card field ' + x[1] + '.';
  if (/Troubleshooting URL: https:\/\/docs\.langchain\.com/.test(m)) return 'LangGraph stopped: ' + f;
  return null;
}

/* ---------- code rewrite: top-level declarations become notebook names ---------- */
function rewrite(code) {
  return code.split('\n').map(function (line) {
    var m;
    if ((m = line.match(/^(const|let|var)(\s+)([A-Za-z_$][\w$]*)(\s*)(=|;|$)/))) {
      if (m[5] === '=') return line.replace(/^(const|let|var)\s+/, '');
      return line.replace(/^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*;?/, '$2 = undefined;');
    }
    if ((m = line.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)/))) return m[2] + ' = ' + line;
    return line;
  }).join('\n');
}
var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
var HEAD_LINES = 3;   // "async function anonymous(__S" / ") {" / "with (__S) {"

function fmt(v, depth) {
  depth = depth || 0;
  if (v == null) return String(v);
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(+v.toPrecision(6));
  if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
  if (typeof v === 'boolean') return String(v);
  if (v && v.shape && v.dtype && typeof v.dataSync === 'function') return 'Tensor shape [' + v.shape.join(', ') + '] ' + v.dtype;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) { var a = Array.prototype.slice.call(v, 0, 12).map(function (x) { return fmt(x, depth + 1); }); return '[' + a.join(', ') + (v.length > 12 ? ', … (' + v.length + ' items)' : '') + ']'; }
  if (typeof v === 'function') return '[function ' + (v.name || '') + ']';
  if (depth > 1) return '{…}';
  try { return '{' + Object.keys(v).slice(0, 10).map(function (k) { return k + ': ' + fmt(v[k], depth + 1); }).join(', ') + '}'; } catch (e) { return String(v); }
}

function create(opt) {
  var tf = opt.tf, NS = Object.create(null), out = null, J = {};
  var stopFlag = false;
  J.NS = NS;
  var consoleObj = { log: function () { if (out) out(Array.prototype.map.call(arguments, function (a) { return fmt(a); }).join(' ')); } };
  consoleObj.info = consoleObj.log; consoleObj.warn = consoleObj.log; consoleObj.error = function () { if (out) out(Array.prototype.map.call(arguments, function (a) { return fmt(a); }).join(' '), true); };
  var BUILT = { tf: tf, console: consoleObj, pg: null };
  function isTensor(v) { return v && typeof v.dispose === 'function' && v.shape && typeof v.dataSync === 'function'; }
  function isModel(v) { return v && typeof v.dispose === 'function' && typeof v.predict === 'function' && v.layers; }
  function disposeOld(old, nu, key) {
    if (old === nu || !(isTensor(old) || isModel(old))) return;
    for (var k in NS) if (k !== key && NS[k] === old) return;      // still used under another name
    try { if (isTensor(old)) { if (!old.isDisposed) old.dispose(); } else old.dispose(); } catch (e) {}
  }
  var GLOB = opt.global || G;
  var scope = new Proxy(NS, {
    has: function (t, k) { return typeof k === 'string'; },
    get: function (t, k) {
      if (k === Symbol.unscopables) return undefined;
      if (k in t) return t[k];
      if (k in BUILT) return BUILT[k];
      if (k in GLOB) { var v = GLOB[k]; return typeof v === 'function' && /^[a-z]/.test(k) && k !== 'eval' ? v.bind(GLOB) : v; }
      throw new ReferenceError(String(k) + ' is not defined');
    },
    set: function (t, k, v) { disposeOld(t[k], v, k); t[k] = v; return true; }
  });
  function errOf(e, code) {
    if (e && e.pgStop) return { type: 'Stopped', msg: e.message, line: null, tb: '' };
    if (e && e.pgCheck) return { type: 'Check', msg: e.message, line: null, tb: '' };
    var line = null, st = String(e && e.stack || ''), mm = st.match(/<anonymous>:(\d+):(\d+)/);
    if (mm) { line = +mm[1] - HEAD_LINES; if (line < 1 || line > code.split('\n').length) line = null; }
    return { type: (e && e.name) || 'Error', msg: String(e && e.message || e), line: line, tb: st.split('\n').slice(0, 6).join('\n') };
  }
  J.setPg = function (pg) { BUILT.pg = pg; };
  J.pg = function () { return BUILT.pg; };
  J.stop = function () { stopFlag = true; };
  J.stopped = function () { return stopFlag; };
  J.CheckError = CheckError; J.StopError = StopError;
  /* run(code, probe, onOut) -> {error, probe, ms}; probe(NS, pg, tf) may be async */
  J.run = async function (code, probe, onOut) {
    out = onOut || null; stopFlag = false;
    var t0 = Date.now(), res = { error: null };
    var fn;
    try { fn = new AsyncFunction('__S', 'with (__S) {\n' + rewrite(code) + '\n}'); }
    catch (e) { out = null; return { error: { type: e.name || 'SyntaxError', msg: String(e.message || e), line: null, tb: '' }, ms: 0 }; }
    try { await fn(scope); }
    catch (e) { res.error = errOf(e, code); }
    res.ms = Date.now() - t0;
    if (!res.error && probe) {
      try { res.probe = await probe(NS, BUILT.pg, tf); }
      catch (e) { if (e && e.pgCheck) res.error = errOf(e, code); else res.probe = { probe_error: (e && e.name || 'Error') + ': ' + (e && e.message || e) }; }
    }
    out = null;
    return res;
  };
  J.eval = async function (fnc) { return fnc(NS, BUILT.pg, tf); };
  J.friendly = friendly;
  return J;
}

/* ---------- training helpers (bound to one kernel) ---------- */
function trainer(J, tf, hooks) {
  var T = { state: null };
  /* pg.live: tfjs fit() callbacks. Yields every batch so the page stays responsive, and makes Stop work. */
  T.live = {
    onBatchEnd: async function (batch, logs) {
      var s = T.state; if (s) { s.batch = batch + 1; s.batchLoss = logs && logs.loss; hooks.tick(s); if (J.stopped() && s.model) s.model.stopTraining = true; }
      await tf.nextFrame();
    },
    onEpochEnd: async function (ep, logs) { var s = T.state; if (s) s.lastLoss = logs && logs.loss; }
  };
  /* pg.trainingWatch({model, classWeight, xVal, yVal}) — checks the setup BEFORE any training, then scores validation after each epoch */
  T.watch = function (o) {
    var pg = J.pg(), model = o.model;
    if (!model || typeof model.fit !== 'function') throw CheckError('trainingWatch needs your model from 3c. Run 3c again.');
    if (!model.optimizer) throw CheckError('The model is not compiled yet. Call model.compile(...) first.');
    var loss = model.loss;
    if (loss !== 'binaryCrossentropy') throw CheckError('The loss is “' + (typeof loss === 'string' ? loss : 'a custom function') + '”. One sigmoid output that says “defect or not” is a yes/no task. Which loss is made for yes/no (binary) answers?');
    var yt = pg.y_train, n = yt.length, nd = 0; for (var i = 0; i < n; i++) nd += yt[i]; var no = n - nd;
    var cw = o.classWeight || {};
    var w0 = n / (2 * no), w1 = n / (2 * nd);
    if (!(Math.abs(cw[0] - w0) < 1e-6)) throw CheckError('The weight for good cells is ' + cw[0] + '. It should be ' + n + ' / (2 × ' + no + ') = ' + w0.toFixed(3) + '.');
    if (!(Math.abs(cw[1] - w1) < 1e-6)) throw CheckError('The weight for defects is ' + (typeof cw[1] === 'number' ? cw[1].toFixed(3) : cw[1]) + '. With ' + nd + ' defects in ' + n + ' train cells it should be ' + n + ' / (2 × ' + nd + ') = ' + w1.toFixed(3) + ': each defect counts ' + (w1 / w0).toFixed(1) + '× a good cell.');
    if (T.state && T.state.bestW) T.state.bestW.forEach(function (w) { w.dispose(); });
    var s = T.state = { model: model, epochs: pg.epochs, done: 0, hist: [], best: null, bestW: null, t0: Date.now(), tEpoch: Date.now(), batch: 0, batches: Math.ceil(n / 32), cw: [w0, w1], nTrain: n, nDef: nd, backend: tf.getBackend(), stopped: false };
    hooks.tick(s);
    return {
      endEpoch: async function (epoch) {
        var yv = o.yVal, pv = model.predict(o.xVal, { batchSize: 128 }), sc = await pv.data(); pv.dispose();
        sc = Array.prototype.slice.call(sc);
        var a = auc(yv, sc), now = Date.now();
        var h = { epoch: epoch, loss: s.lastLoss, valLoss: bce(yv, sc), valAuc: a, sec: (now - s.tEpoch) / 1000 };
        s.hist.push(h); s.done = epoch; s.tEpoch = now; s.batch = 0;
        if (!s.best || a > s.best.valAuc) { if (s.bestW) s.bestW.forEach(function (w) { w.dispose(); }); s.bestW = model.getWeights().map(function (w) { return w.clone(); }); s.best = h; }
        hooks.tick(s);
        if (J.stopped()) { s.stopped = true; throw StopError('You stopped training in epoch ' + epoch + ' of ' + s.epochs + '. The model is only partly trained, so it does not count. Press RUN to train again.'); }
      },
      restoreBest: function () { if (s.bestW) model.setWeights(s.bestW); s.restored = s.best ? s.best.epoch : null; hooks.tick(s); },
      get bestEpoch() { return s.best ? s.best.epoch : null; },
      get bestAuc() { return s.best ? s.best.valAuc : NaN; }
    };
  };
  return T;
}

G.PGJS = { create: create, trainer: trainer, auc: auc, cutAt: cutAt, rates: rates, falseAlarmAt95: falseAlarmAt95, twoGates: twoGates, bce: bce, friendly: friendly, lgFriendly: lgFriendly, rewrite: rewrite, fmt: fmt, CheckError: CheckError, StopError: StopError };
})(typeof window !== 'undefined' ? window : globalThis);
