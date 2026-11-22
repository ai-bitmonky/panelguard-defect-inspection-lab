/* PanelGuard — Step 8 content: the line trial on the sealed test tray, how sure the number is, drift watch,
   the student's own photos + a learning curve, the go / no-go sheet, and the recap + final test.
   THE HONESTY RULE: the test tray is opened ONCE, after everything is frozen (8a). Nothing here tunes anything on it.
   Every number shown is computed live in the browser; nothing is hard-coded. */
(function (G) {
'use strict';
var V = function () { return G.PGViz8; };
var J = function () { return G.PGJS; };
function CE(m) { return J().CheckError(m); }
function need(NS, list, msg) { var m = list.filter(function (k) { return !(k in NS); }); if (m.length) throw CE(msg + ' (missing: ' + m.join(', ') + ').'); }
function errMsg(e) { return String(e && e.message || e).split('\n')[0]; }
function r1(x) { return Math.round(10 * x) / 10; }
function r4(x) { return Math.round(1e4 * x) / 1e4; }
function L(a) { return a.join('\n'); }
var TARGET = 5;                       // at most 5 defects passed per 100 (= catch 95 of every 100)

/* ---------- the freeze: everything the trial depends on ---------- */
function fnv(h, u32) { for (var i = 0; i < u32.length; i++) { h ^= u32[i]; h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function strHash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return ('00000000' + (h >>> 0).toString(16)).slice(-8); }
function modelSum(model) {
  if (!model || !model.getWeights) return null;
  var h = 2166136261, n = 0;
  model.getWeights().forEach(function (w) { var d = w.dataSync(); n += d.length; h = fnv(h, new Uint32Array(d.buffer, d.byteOffset, d.length)); });
  return { sum: ('00000000' + h.toString(16)).slice(-8), n: n };
}
function freezeOf(NS) {
  if (!NS || !('bestW' in NS) || !('low' in NS) || !('routePoly' in NS)) return null;
  var fns = ['checkPhoto', 'reshoot', 'afterCheck', 'byLane', 'humanCheck', 'routePoly'].map(function (k) { return typeof NS[k] === 'function' ? NS[k].toString() : String(NS[k]); }).join('|');
  var m = modelSum(NS.model);
  return { model: m ? m.sum : null, params: m ? m.n : null, bestW: NS.bestW, low: NS.low, high: NS.high, lowPoly: NS.lowPoly,
    flow: strHash(fns + '|' + NS.MAX_TRIES + '|' + NS.DARK + '|' + NS.BLANK + '|' + NS.FLAT), maxTries: NS.MAX_TRIES, rules: [NS.DARK, NS.BLANK, NS.FLAT] };
}
var FREEZE_NAMES = { model: 'model weights', bestW: 'blend weight', low: 'low gate', high: 'high gate', lowPoly: 'poly low gate', flow: 'flow' };
/* compare NOW with the sheet the student froze in 8a: any change after the seal broke = not an honest test any more */
function honesty(NS, pg) {
  var m = (pg.mechOf ? pg.mechOf('8a') : {}) || {}, f = m.frozen, now = freezeOf(NS);
  if (!f) return { frozen: false, open: !!m.sealOpen, ok: null, changed: [] };
  var changed = Object.keys(FREEZE_NAMES).filter(function (k) { return !now || String(now[k]) !== String(f[k]); }).map(function (k) { return FREEZE_NAMES[k]; });
  return { frozen: true, open: !!m.sealOpen, ok: changed.length === 0, changed: changed, at: m.openedAt || null };
}

/* ---------- pg helpers for Step 8 ---------- */
function lcg(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function boxBlur(px) {
  var o = new Array(4096);
  for (var r = 0; r < 64; r++) for (var c = 0; c < 64; c++) { var s = 0, n = 0;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 64 && cc >= 0 && cc < 64) { s += px[rr * 64 + cc]; n++; } }
    o[r * 64 + c] = Math.round(s / n); }
  return o;
}
function squeeze(px, k) { var m = 0, i; for (i = 0; i < px.length; i++) m += px[i]; m /= px.length; return Array.prototype.map.call(px, function (v) { return Math.max(0, Math.min(255, Math.round(m + (v - m) * k))); }); }
function group() { return { n: 0, def: 0, defPassed: 0, good: 0, goodStopped: 0, person: 0, per100: 0, goodStopPer100: 0 }; }
function extra(pg) {
  var TRAY = null;
  function openTest() {
    var m = pg.mechOf ? pg.mechOf('8a') : {};
    if (!pg.review && !(m && m.sealOpen)) return Promise.reject(CE('The test tray is still sealed. Freeze your settings and break the seal in 8a first.'));
    if (TRAY) return TRAY;
    TRAY = pg.py('{"idx_test": idx_test, "cell_test": cell_id[idx_test], "y_test": y[idx_test], "kind_test": kind[idx_test], "prob_test": prob[idx_test]}').then(function (t) {
      var at = {}; t.cell_test.forEach(function (id, i) { at[id] = i; });
      t.n = t.cell_test.length; t.nDef = t.y_test.reduce(function (a, b) { return a + b; }, 0);
      t.labelOf = function (id) { var i = at[id]; return i == null ? null : t.y_test[i]; };
      t.probOf = function (id) { var i = at[id]; return i == null ? null : t.prob_test[i]; };
      t.indexOf = function (id) { return at[id]; };
      t.sealedReview = !!pg.review && !(m && m.sealOpen);
      return t;
    }, function (e) { TRAY = null; throw e; });
    return TRAY;
  }
  /* the trial report: counted from logbook rows, labels from the test tray (decision = what finally happened to the cell) */
  function trialReport(rows, tray) {
    var R = { n: rows.length, lanes: { pass: 0, person: 0, stop: 0 }, reshoots: 0, all: group(), mono: group(), poly: group(), escapes: [], unsureEscapes: 0 };
    rows.forEach(function (r) {
      var y = tray.labelOf(r.id), g = [R.all, R[r.kind] || group()];
      R.lanes[r.lane] = (R.lanes[r.lane] || 0) + 1; R.reshoots += Math.max(0, (r.tries || 1) - 1);
      g.forEach(function (x) { x.n++; if (r.lane === 'person') x.person++; if (y === 1) { x.def++; if (r.decision === 'pass') x.defPassed++; } else { x.good++; if (r.decision === 'stop') x.goodStopped++; } });
      if (y === 1 && r.decision === 'pass') { R.escapes.push(r.id); var p = tray.probOf(r.id); if (p > 0 && p < 1) R.unsureEscapes++; }
    });
    [R.all, R.mono, R.poly].forEach(function (x) { x.per100 = x.def ? 100 * x.defPassed / x.def : 0; x.goodStopPer100 = x.good ? 100 * x.goodStopped / x.good : 0; });
    R.per1000 = { pass: 1000 * R.lanes.pass / R.n, person: 1000 * R.lanes.person / R.n, stop: 1000 * R.lanes.stop / R.n };
    R.target = TARGET;
    return R;
  }
  /* SIMULATED drift scenarios, built from real test photos (clearly labelled as simulated in the page) */
  var SIMS = {};
  function driftScenarios(tray, n) {
    n = Math.min(n || 260, tray.n); if (SIMS[n]) return SIMS[n];
    var cells = tray.cell_test.slice(0, n).map(function (id) { return pg.card(id); }), rnd = lcg(11);
    return (SIMS[n] = {
      dark: { name: 'Darker exposure', what: 'every photo at 65% brightness (lamp ageing, wrong exposure time)', cells: cells.map(function (c) { return { id: c.id, kind: c.kind, photo: c.photo.map(function (v) { return Math.round(0.65 * v); }) }; }) },
      blur: { name: 'Blurred lens', what: 'every photo smoothed with a 3 × 3 blur, twice (focus drifted)', cells: cells.map(function (c) { return { id: c.id, kind: c.kind, photo: boxBlur(boxBlur(c.photo)) }; }) },
      poly: { name: 'Only poly cells', what: 'the same photos, but today the line runs only poly cells (a new order)', cells: cells.filter(function (c) { return c.kind === 'poly'; }) },
      fault: { name: 'Camera fault copies', what: '1 cell in 4 replaced by a fogged-lens copy (contrast squeezed to 25%)', cells: cells.map(function (c) { return { id: c.id, kind: c.kind, photo: rnd() < 0.25 ? squeeze(c.photo, 0.25) : c.photo }; }) }
    });
  }
  /* the student's own photo: Step 2 features in Python (same blocks as F), then the Step 2 model */
  function svcOfPhoto(photo) {
    var m2 = (pg.mechOf ? pg.mechOf('2a') : {}) || {}, keys = m2.keptCmd && Array.isArray(m2.kept) ? m2.kept : ['A', 'B', 'C'];   // F = the kept mix if one was kept, else the 2a code (A + B + C)
    var blocks = keys.map(function (k) { return { A: 'line_finder(_im)', B: 'dark_map(_im)', C: 'pca.transform(_im.reshape(1, 32, 2, 32, 2).mean(axis=(2, 4)).reshape(1, -1))', R: '_im.reshape(1, -1)' }[k]; }).join(', ');
    return pg.py('(lambda _im: float(best.predict_proba(np.hstack([' + blocks + ']))[0, 1]))(np.array([' + Array.prototype.join.call(photo, ',') + '], dtype=np.float32).reshape(1, 64, 64) / 255)');
  }
  return { openTest: openTest, trialReport: trialReport, driftScenarios: driftScenarios, svcOfPhoto: svcOfPhoto, target: TARGET, lcg: lcg };
}

/* ---------- shared checks ---------- */
function needFrozen(NS) {
  need(NS, ['model', 'bestW', 'X', 'low', 'high'], 'Run Step 3 first: the trial uses your Step 3 model, blend and gates');
  need(NS, ['Cell', 'checkPhoto', 'reshoot', 'afterCheck', 'byLane', 'humanCheck', 'routePoly', 'lowPoly', 'auditLog'], 'Run 5g first: the trial runs your Step 5 flow with the poly gate');
}
function need8b(NS) { need(NS, ['tray', 'trial', 'trialLog', 'pTest'], 'Run 8b first: this needs the line trial'); }
function valReport(NS, pg) { var R = pg.shiftReport(NS.auditLog); var g = function (x) { return { n: x.n, def: x.def, defPassed: x.defPassed, good: x.good, goodStopped: x.goodStopped, person: x.person, per100: x.def ? 100 * x.defPassed / x.def : 0, goodStopPer100: x.good ? 100 * x.goodStopped / x.good : 0 }; };
  return { n: R.n, per1000: R.per1000, lanes: R.lanes, all: g(R.all), mono: g(R.mono), poly: g(R.poly) }; }
function slimTrial(T) { var g = function (x) { return { n: x.n, def: x.def, defPassed: x.defPassed, good: x.good, goodStopped: x.goodStopped, person: x.person, per100: x.per100, goodStopPer100: x.goodStopPer100 }; };
  return { n: T.n, per1000: T.per1000, lanes: T.lanes, reshoots: T.reshoots, all: g(T.all), mono: g(T.mono), poly: g(T.poly), escapes: T.escapes.slice(), unsureEscapes: T.unsureEscapes, target: T.target }; }
function wilsonRef(k, n, z) { var p = k / n, d = 1 + z * z / n, mid = (p + z * z / (2 * n)) / d, half = (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [100 * Math.max(0, mid - half), 100 * Math.min(1, mid + half)]; }

/* ================= 8a: freeze, then break the seal (no code) ================= */
var s8a = { id: '8a', name: 'Freeze, then break the seal', kind: 'scene', scene: 'freeze',
  goal: 'The test tray has been sealed since Step 1. Before you open it: lock every setting, write down your guess, then break the seal. One way only.',
  needText: 'lock all 6 lines of the freeze sheet, lock your range on the number line, then press and hold the seal until it breaks' };

/* ================= 8b: the line trial ================= */
var s8b = { id: '8b', name: 'The line trial', kind: 'code', lang: 'js',
  goal: 'Score the sealed cells with your frozen models and send every one through your frozen flow. One run. Then compare with validation and with your guess.',
  task: [
    'Gap 1: the Step 2 score must be for the TEST cells. Type the Python index array of the test tray: idx_test',
    'Gap 2: the frozen blend weight from 3f. Type: bestW',
    'Gap 3: the frozen route station from 5g (with the poly gate). Type: routePoly'
  ],
  code: L([
"// THE LINE TRIAL: cells the model has never seen, frozen settings, ONE run. Nothing is tuned after this.",
"const { StateGraph, START, END, MemorySaver, Command } = LangGraph;",
"const tray = await pg.openTest();                 // the sealed tray: cell ids, kinds, expert labels",
"console.log('test tray:', tray.n, 'cells,', tray.nDef, 'real defects');",
"",
"// 1. Step 2 score: your scikit-learn inspector, run in Python on the test cells",
"const pSvcTest = await pg.py('best.predict_proba(F[____])[:, 1]');",
"// 2. Step 3 score: your CNN looks at the test photos",
"const cnnOut = tf.tidy(() => model.predict(tf.gather(X, tray.idx_test)));",
"const pCnnTest = Array.from(await cnnOut.data());          // await: the page stays responsive while the GPU works",
"cnnOut.dispose();",
"// 3. the frozen 3f blend",
"const pTest = pCnnTest.map((c, i) => ____ * c + (1 - bestW) * pSvcTest[i]);",
"",
"// 4. the frozen flow: same photo check, same gates, a person for the unsure cells",
"const testAt = {};",
"tray.cell_test.forEach((id, i) => { testAt[id] = i; });",
"function trialScore(state) {",
"  const p = pTest[testAt[state.id]];",
"  return { p, log: ['score (test): ' + p.toFixed(3)] };",
"}",
"const trialLog = [];                               // the trial's own logbook",
"function trialRecord(state) {",
"  const decision = state.decision || state.lane;",
"  trialLog.push({ id: state.id, kind: state.kind, p: state.p, lane: state.lane, decision, tries: state.tries });",
"  return { decision, log: ['record: ' + decision] };",
"}",
"const trialLine = new StateGraph(Cell)",
"  .addNode('check_photo', checkPhoto).addNode('reshoot', reshoot).addNode('score', trialScore)",
"  .addNode('route', ____).addNode('human_check', humanCheck).addNode('record', trialRecord)",
"  .addEdge(START, 'check_photo')",
"  .addConditionalEdges('check_photo', afterCheck, ['score', 'reshoot', 'human_check'])",
"  .addEdge('reshoot', 'check_photo').addEdge('score', 'route')",
"  .addConditionalEdges('route', byLane, { pass: 'record', person: 'human_check', stop: 'record' })",
"  .addEdge('human_check', 'record').addEdge('record', END)",
"  .compile({ checkpointer: new MemorySaver() });",
"",
"// 5. one shift: every test cell. The person is perfect here (the expert label answers) — an assumption.",
"const expert = (ask) => (tray.labelOf(ask.id) === 1 ? 'stop' : 'pass');",
"for (const id of tray.cell_test) {",
"  const config = { configurable: { thread_id: 'trial-' + id } };",
"  let out = await trialLine.invoke(pg.card(id), config);",
"  while (out.__interrupt__) out = await trialLine.invoke(new Command({ resume: expert(out.__interrupt__[0].value) }), config);",
"}",
"const trial = pg.trialReport(trialLog, tray);",
"console.log('defects passed:', trial.all.defPassed, 'of', trial.all.def, '=', trial.all.per100.toFixed(1), 'per 100 (target: at most', trial.target + ')');"
  ]),
  twin: L([
"# the same trial in Python: scikit-learn + Keras + LangGraph (tools/research/step8_twin.py runs it)",
"p_svc_test = best.predict_proba(F[idx_test])[:, 1]                      # Step 2, test cells",
"p_cnn_test = model.predict(X[idx_test].reshape(-1, 64, 64, 1) / 255.0, verbose=0).ravel()",
"p_test = best_w * p_cnn_test + (1 - best_w) * p_svc_test                # the frozen 3f blend",
"TEST = {c: i for i, c in enumerate(cell_id[idx_test])}",
"",
"def trial_score(state):",
"    p = float(p_test[TEST[state['id']]])",
"    return {'p': p, 'log': [f'score (test): {p:.3f}']}",
"",
"g = StateGraph(Cell)",
"for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', trial_score),",
"                 ('route', route_poly), ('human_check', human_check), ('record', trial_record)]:",
"    g.add_node(name, fn)",
"# ... the same edges as Step 5 ...",
"trial_line = g.compile(checkpointer=MemorySaver())",
"for c in cell_id[idx_test]:",
"    config = {'configurable': {'thread_id': f'trial-{c}'}}",
"    out = trial_line.invoke(card(c), config)",
"    while '__interrupt__' in out:                                         # the perfect checker",
"        out = trial_line.invoke(Command(resume='stop' if y_test_of(c) else 'pass'), config)"
  ]),
  probe: async function (NS, pg) {
    needFrozen(NS);
    if (!NS.tray || !NS.trial || !NS.trialLog || !NS.pTest || !NS.pSvcTest) return { missing: ['tray', 'pSvcTest', 'pTest', 'trialLog', 'trial'].filter(function (k) { return !NS[k]; }) };
    var T = NS.tray, ref = await pg.py('best.predict_proba(F[idx_test])[:, 1]'), svc = NS.pSvcTest, svcWhich = 'test';
    var same = function (a, b) { return a && b && a.length === b.length && a.every(function (v, i) { return Math.abs(v - b[i]) < 1e-9; }); };
    if (!same(svc, ref)) svcWhich = same(svc, pg.p_val) ? 'val' : svc.length === pg.idx_train.length ? 'train' : svc.length === pg.n ? 'all' : 'other';
    var blendOk = NS.pTest.length === T.n && NS.pTest.every(function (v, i) { return Math.abs(v - (NS.bestW * NS.pCnnTest[i] + (1 - NS.bestW) * svc[i])) < 1e-9; });
    var wGuess = null; if (!blendOk && NS.pTest.length === T.n) { var i0 = NS.pCnnTest.map(function (c, i) { return i; }).filter(function (i) { return NS.pCnnTest[i] > 0.2; })[0]; if (i0 != null) wGuess = Math.round(100 * (NS.pTest[i0] - (1 - NS.bestW) * svc[i0]) / NS.pCnnTest[i0]) / 100; }
    var wrongRoute = { mono: 0, poly: 0 }, checked = 0;
    NS.trialLog.forEach(function (r) { if ((r.tries || 1) !== 1 || r.p == null) return; checked++; var lo = r.kind === 'poly' ? NS.lowPoly : NS.low, want = pg.laneOf(r.p, lo, NS.high); if (r.lane !== want) wrongRoute[r.kind === 'poly' ? 'poly' : 'mono']++; });
    var tr = slimTrial(NS.trial), m = pg.mechOf ? pg.mechOf('8a') : {};
    return { n: T.n, nDef: T.nDef, logged: NS.trialLog.length, svcWhich: svcWhich, blendOk: blendOk, wGuess: wGuess, bestW: NS.bestW, wrongRoute: wrongRoute, checked: checked,
      low: NS.low, high: NS.high, lowPoly: NS.lowPoly, trial: tr, val: valReport(NS, pg), range: m.range || null, rangeLocked: !!m.rangeLocked, honest: honesty(NS, pg), review: !!T.sealedReview,
      scores: NS.trialLog.map(function (r) { return [r.id, r.kind, r.p == null ? null : r4(r.p), r.lane, r.decision, T.labelOf(r.id)]; }) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.svcWhich !== 'test') return { pass: false, msg: { val: 'The Step 2 scores are for the VALIDATION cells (idx_val), not the sealed ones. Type idx_test.', train: 'The Step 2 scores are for the 1,574 TRAIN cells. The trial needs the test cells: idx_test.', all: 'The Step 2 scores are for all 2,624 cells. The trial needs only the test cells: idx_test.' }[r.svcWhich] || 'The Step 2 scores are not the test cells\' scores. Type idx_test.' };
    if (!r.blendOk) return { pass: false, msg: 'Your blend uses CNN weight ' + (r.wGuess == null ? '?' : r.wGuess) + '. The frozen 3f weight is bestW = ' + r.bestW + '. Picking a new weight now would tune on the test tray. Type bestW.' };
    if (r.logged !== r.n) return { pass: false, msg: 'The trial logbook has ' + r.logged + ' rows for ' + r.n + ' test cells. Every cell must go through the flow once.' };
    if (r.wrongRoute.poly || r.wrongRoute.mono) return { pass: false, msg: r.wrongRoute.poly + ' poly and ' + r.wrongRoute.mono + ' mono cells took a different lane than your frozen flow. The frozen route station is the one with the poly gate: routePoly.' };
    var t = r.trial.all;
    return { pass: true, msg: 'Trial done: ' + r.n + ' sealed cells, ' + t.defPassed + ' of ' + t.def + ' defects passed = ' + t.per100.toFixed(1) + ' per 100 (target at most ' + r.trial.target + ') → ' + (t.per100 <= r.trial.target ? 'target MET on the test tray.' : 'target MISSED on the test tray.') + ' Validation was ' + r.val.all.per100.toFixed(1) + '.' };
  },
  example: '<p>A bakery freezes its oven recipe, then bakes ONE batch from flour it never tested:</p><pre>const scoresNew = await lab.measure(\'flour_batch_B\');      // the new flour, not the old one\nconst baked = scoresNew.map((s, i) => recipe.heat * s + 2);  // the frozen setting, not a new one\nconst oven = buildOven(frozenTimer);                    // the frozen station</pre><p>New input, old settings. If the result is bad, you write it down — you do not change the recipe and bake the same flour again.</p>',
  render: function (r, el, api) { V().trialCard(r, el, api); },
  explain: function (r) { var t = r.trial.all, v = r.val.all; return {
    asked: 'Run the frozen system once on cells it has never seen, and count honestly.',
    steps: ['The Step 2 model scored the ' + r.n + ' test cells in Python (F[idx_test]); the CNN scored the same photos; the frozen blend mixes them with weight ' + r.bestW + '.',
            'Each cell went through your Step 5 flow: photo check → score → routePoly (pass below ' + r.low.toFixed(3) + ', poly below ' + r.lowPoly.toFixed(3) + ', stop from ' + r.high.toFixed(3) + ') → a person for the rest → record.',
            'Defects passed = expert says defect AND the final decision was pass: ' + t.defPassed + ' of ' + t.def + ' = ' + t.per100.toFixed(1) + ' per 100. Validation: ' + v.defPassed + ' of ' + v.def + ' = ' + v.per100.toFixed(1) + '.',
            t.per100 > v.per100 ? 'The test number is worse than validation. That is normal: the gates were tuned on validation, so validation looks a little too good.' : 'The test number is not worse than validation this time. With so few defects that can be luck — 8c shows how sure it is.'],
    trap: 'Seeing a bad test number and moving a gate “just a little”. Then the test tray becomes a second validation tray and nobody knows the real number any more.',
    remember: 'Freeze first, test once, report what you get.' }; }
};

/* ================= 8c: how sure is that number? ================= */
var s8c = { id: '8c', name: 'How sure is that number?', kind: 'code', lang: 'js',
  goal: 'The trial number came from one small tray. Pull the lever to redraw the shift many times and watch the number jump. Then code an interval.',
  pre: { need: function (m) { var n = (m && m.pulls) || 0; return n >= 40 ? null : 'pull the lever until 40 redrawn shifts are on the number line (' + n + ' of 40)'; },
    render: function (box, api) { V().lever(box, api); } },
  task: [
    'Gap 1: 95% of a bell curve lies within 1.96 spreads of the middle. Type: 1.96',
    'Gap 2: the interval is for the defects that PASSED. Type the name of that count: kPassed',
    'Gap 3: the target is met for sure only if the TOP end of the interval is under 5. The top end is position 1. Type: 1'
  ],
  code: L([
"// HOW SURE IS THE TRIAL NUMBER?  It came from one small tray.",
"const kPassed = trial.all.defPassed, nDefects = trial.all.def;     // defects passed, real defects in the test tray",
"",
"// A. Wilson 95% interval for \"defects passed per 100\" (works for small counts, never below 0)",
"const z = ____;",
"function wilson(k, n, z) {",
"  const p = k / n, d = 1 + z * z / n;",
"  const mid = (p + z * z / (2 * n)) / d;",
"  const half = (z / d) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));",
"  return [100 * Math.max(0, mid - half), 100 * Math.min(1, mid + half)];",
"}",
"const interval = wilson(____, nDefects, z);",
"",
"// B. Bootstrap: redraw the shift 2,000 times from the test cells (with replacement, seeded = same every run)",
"const drawRows = trialLog.map((r) => ({ y: tray.labelOf(r.id), passed: r.decision === 'pass' }));",
"const rnd = pg.lcg(1);",
"const boot = [];",
"for (let b = 0; b < 2000; b++) {",
"  let d = 0, e = 0;",
"  for (let i = 0; i < drawRows.length; i++) {",
"    const r = drawRows[Math.floor(rnd() * drawRows.length)];",
"    if (r.y === 1) { d++; if (r.passed) e++; }",
"  }",
"  boot.push(100 * e / d);",
"}",
"boot.sort((a, b) => a - b);",
"const bootInterval = [boot[Math.floor(0.025 * boot.length)], boot[Math.floor(0.975 * boot.length)]];",
"",
"const underTarget = interval[____] <= pg.target;            // the WHOLE interval under 5 per 100?",
"console.log('Wilson:', interval.map((x) => x.toFixed(1)).join(' to '), 'per 100 · bootstrap:', bootInterval.map((x) => x.toFixed(1)).join(' to '));"
  ]),
  twin: L([
"from statsmodels.stats.proportion import proportion_confint",
"k, n = trial['defects_passed'], trial['defects']",
"lo, hi = proportion_confint(k, n, alpha=0.05, method='wilson')   # the same Wilson interval",
"print(f'between {100 * lo:.1f} and {100 * hi:.1f} per 100')",
"",
"rng = np.random.default_rng(1)                  # bootstrap: redraw the shift 2,000 times",
"y_t, passed = np.array(y_rows), np.array(passed_rows)",
"boot = []",
"for _ in range(2000):",
"    i = rng.integers(0, len(y_t), len(y_t))",
"    d = y_t[i] == 1",
"    boot.append(100 * (d & passed[i]).sum() / d.sum())",
"print('bootstrap:', np.percentile(boot, [2.5, 97.5]).round(1))",
"under_target = 100 * hi <= 5                    # the WHOLE interval under the target?"
  ]),
  probe: async function (NS, pg) {
    need8b(NS);
    if (!NS.interval || !NS.bootInterval || !('underTarget' in NS) || !('z' in NS)) return { missing: ['z', 'interval', 'bootInterval', 'underTarget'].filter(function (k) { return !(k in NS); }) };
    var k = NS.trial.all.defPassed, n = NS.trial.all.def, ref = wilsonRef(k, n, 1.96), wald = [100 * (k / n - 1.96 * Math.sqrt(k / n * (1 - k / n) / n)), 100 * (k / n + 1.96 * Math.sqrt(k / n * (1 - k / n) / n))];
    var m = pg.mechOf ? pg.mechOf('8c') : {};
    return { k: k, n: n, z: NS.z, interval: NS.interval.slice(), ref: ref, wald: wald, boot: NS.bootInterval.slice(), underTarget: NS.underTarget, refUnder: ref[1] <= TARGET, target: TARGET, point: 100 * k / n,
      hist: NS.boot.filter(function (x, i) { return i % 20 === 0; }), honest: honesty(NS, pg), pulls: (m && m.dots) || [] };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (typeof r.z !== 'number' || Math.abs(r.z - 1.96) > 1e-9) return { pass: false, msg: r.z === 1.645 || r.z === 1.64 ? 'z = ' + r.z + ' gives a 90% interval: too narrow. 95% needs 1.96.' : r.z === 2.58 || r.z === 2.576 ? 'z = ' + r.z + ' gives a 99% interval. The plan asks for 95%: 1.96.' : 'z is ' + r.z + '. For 95% type 1.96.' };
    if (Math.abs(r.interval[0] - r.ref[0]) > 1e-9 || Math.abs(r.interval[1] - r.ref[1]) > 1e-9) return { pass: false, msg: 'Your interval is ' + r.interval.map(function (x) { return x.toFixed(1); }).join(' to ') + ' per 100. It must be built from the defects that passed (' + r.k + ' of ' + r.n + '): type kPassed.' };
    if (r.underTarget !== r.refUnder) return { pass: false, msg: 'underTarget says ' + r.underTarget + ', but the interval goes up to ' + r.ref[1].toFixed(1) + ' per 100 (target ' + r.target + '). Compare the TOP end: position 1.' };
    return { pass: true, msg: 'Between ' + r.ref[0].toFixed(1) + ' and ' + r.ref[1].toFixed(1) + ' defects passed per 100 (Wilson 95%; bootstrap ' + r.boot[0].toFixed(1) + ' to ' + r.boot[1].toFixed(1) + '). ' + (r.refUnder ? 'The whole interval is under the target of ' + r.target + '.' : 'The interval reaches above the target of ' + r.target + ': the trial cannot promise the target.') };
  },
  example: '<p>A courier says “3 of 40 parcels were late”. How sure is 7.5 late per 100?</p><pre>const zz = 1.96;                       // 95%\nconst band = wilson(3, 40, zz);        // the LATE count, not the total\n// band = [2.6, 19.9] per 100\nconst promise = band[1] <= 10;         // the top end decides a promise</pre><p>One small batch gives a wide band. A promise needs the whole band on the right side.</p>',
  render: function (r, el, api) { V().intervalCard(r, el, api); },
  explain: function (r) { return {
    asked: 'Turn “' + r.k + ' of ' + r.n + ' defects passed” into a range that says how sure the number is.',
    steps: ['Point number: ' + r.k + ' ÷ ' + r.n + ' = ' + r.point.toFixed(1) + ' per 100. But another tray of ' + r.n + ' defects could give a few more or fewer — your lever showed it.',
            'Wilson interval (z = 1.96 for 95%): between ' + r.ref[0].toFixed(1) + ' and ' + r.ref[1].toFixed(1) + ' per 100. I chose Wilson because the count is small: the plain ±1.96·spread rule (Wald) gives ' + r.wald[0].toFixed(1) + ' to ' + r.wald[1].toFixed(1) + (r.wald[0] < 0 ? ' — below zero, which is impossible' : ' — too narrow for small counts') + '.',
            'Bootstrap (2,000 redrawn shifts): ' + r.boot[0].toFixed(1) + ' to ' + r.boot[1].toFixed(1) + ' per 100 — close to Wilson, so the two methods agree.',
            'A promise needs the TOP end under the target: ' + r.ref[1].toFixed(1) + (r.refUnder ? ' ≤ ' : ' > ') + r.target + ' → ' + (r.refUnder ? 'the target is met even at the bad end.' : 'the target is NOT sure.')],
    trap: 'Reading only the point number. “' + r.point.toFixed(1) + ' per 100” hides that the real rate could be ' + r.ref[1].toFixed(1) + '.',
    remember: 'A small tray gives a wide band: promise only what the top end allows.' }; }
};

/* ================= 8d: watch for drift ================= */
var s8d = { id: '8d', name: 'Watch for drift', kind: 'code', lang: 'js',
  goal: 'On the real line there are no expert labels. Watch what you CAN see: the scores and simple photo numbers. Code a drift alarm, then find out which alarm catches which change.',
  task: [
    'Gap 1: PSI weighs each bin by log(now ÷ reference). Type the share of TODAY in bin k: N[k]',
    'Gap 2: the alarm level. Rule of thumb: below 0.1 calm, 0.1 to 0.25 watch, above 0.25 act. Type: 0.25',
    'Then tick which alarm you think rings for each simulated change, check it, and see the real alarm values.'
  ],
  code: L([
"// DRIFT WATCH: no labels on a real line. Watch what you CAN see.",
"// 1. what a photo looks like (no label needed)",
"function looks(photo) {",
"  const s = pg.photoStats(photo);                        // mean, spread, contrast (Step 5)",
"  let edge = 0;                                          // sharpness: how much next-door pixels differ",
"  for (let i = 0; i < 4096; i++) if (i % 64 < 63) edge += Math.abs(photo[i + 1] - photo[i]);",
"  return { bright: s.mean, contrast: s.contrast, sharp: edge / (64 * 63) };",
"}",
"// 2. PSI (population stability index): how far today's mix moved from the reference mix",
"function psi(ref, now, bins = 10) {",
"  const r = [...ref].sort((a, b) => a - b);",
"  const edges = Array.from({ length: bins - 1 }, (_, k) => r[Math.floor((k + 1) * r.length / bins)]);",
"  const share = (xs) => {",
"    const c = new Array(bins).fill(0);",
"    xs.forEach((x) => { let b = 0; while (b < bins - 1 && x >= edges[b]) b++; c[b]++; });",
"    return c.map((v) => Math.max(v / xs.length, 1e-4));    // never exactly 0 (log of 0)",
"  };",
"  const R = share(ref), N = share(now);",
"  return R.reduce((sum, rk, k) => sum + (N[k] - rk) * Math.log(____ / rk), 0);",
"}",
"const ALARM = ____;",
"",
"// 3. the reference: the validation tray = how the line looked when you set the gates",
"async function cnnScores(cells) {                        // the CNN part of the score: it looks at the photo live",
"  const out = tf.tidy(() => model.predict(tf.tensor(cells.map((c) => c.photo).flat(), [cells.length, 64, 64, 1], 'float32').div(255)));",
"  const s = Array.from(await out.data());",
"  out.dispose();",
"  return s;",
"}",
"const refCells = pg.cell_val.map((id) => pg.card(id));",
"const refLooks = refCells.map((c) => looks(c.photo));",
"const REFD = { score: pCnn, bright: refLooks.map((x) => x.bright), contrast: refLooks.map((x) => x.contrast), sharp: refLooks.map((x) => x.sharp) };   // pCnn: your CNN on validation (3f)",
"async function drift(cells, scores) {",
"  if (!scores) scores = await cnnScores(cells);",
"  const lk = cells.map((c) => looks(c.photo)), out = { score: psi(REFD.score, scores) };",
"  for (const k of ['bright', 'contrast', 'sharp']) out[k] = psi(REFD[k], lk.map((x) => x[k]));",
"  out.ring = Object.keys(out).filter((k) => out[k] > ALARM);",
"  return out;",
"}",
"",
"// 4. today = the test tray (cells the model never saw, same factory; CNN scores from 8b)",
"const today = await drift(tray.cell_test.map((id) => pg.card(id)), pCnnTest);",
"// 4 SIMULATED changes, built from 260 real test photos",
"const sims = pg.driftScenarios(tray, 260);",
"const alarms = {};",
"for (const k in sims) alarms[k] = await drift(sims[k].cells);",
"console.log('today:', JSON.stringify(today));"
  ]),
  twin: L([
"def looks(photo):                                   # photo: 64 x 64 uint8",
"    p = photo.astype(float); s = np.sort(p.ravel())",
"    return {'bright': p.mean(), 'contrast': s[int(0.95 * s.size)] - s[int(0.05 * s.size)],",
"            'sharp': np.abs(np.diff(p, axis=1)).mean()}",
"",
"def psi(ref, now, bins=10):",
"    edges = np.sort(ref)[[int((k + 1) * len(ref) / bins) for k in range(bins - 1)]]",
"    R = np.maximum(np.bincount(np.searchsorted(edges, ref, side='right'), minlength=bins) / len(ref), 1e-4)",
"    N = np.maximum(np.bincount(np.searchsorted(edges, now, side='right'), minlength=bins) / len(now), 1e-4)",
"    return float(((N - R) * np.log(N / R)).sum())",
"",
"ALARM = 0.25                                        # a rule of thumb, not a law",
"ref_score = p_cnn                                  # your CNN on validation (3f)",
"def drift(photos, scores=None):",
"    if scores is None: scores = model.predict(photos[..., None] / 255.0, verbose=0).ravel()",
"    out = {'score': psi(ref_score, scores)}",
"    L = [looks(p) for p in photos]",
"    for k in ('bright', 'contrast', 'sharp'):",
"        out[k] = psi([looks(p)[k] for p in X[idx_val]], [l[k] for l in L])",
"    return out"
  ]),
  probe: async function (NS, pg) {
    needFrozen(NS); need8b(NS);
    if (!NS.psi || !NS.drift || !NS.today || !NS.alarms || !('ALARM' in NS)) return { missing: ['psi', 'ALARM', 'drift', 'today', 'alarms'].filter(function (k) { return !(k in NS); }) };
    var a = NS.REFD.bright, same = NS.psi(a, a), shifted = NS.psi(a, a.map(function (x) { return x * 0.65; }));
    var sims = pg.driftScenarios(NS.tray, 260), info = {};
    Object.keys(sims).forEach(function (k) { info[k] = { name: sims[k].name, what: sims[k].what, n: sims[k].cells.length }; });
    var rd = function (o) { var x = {}; ['score', 'bright', 'contrast', 'sharp'].forEach(function (k) { x[k] = r4(o[k]); }); x.ring = o.ring.slice(); return x; };
    var al = {}; Object.keys(NS.alarms).forEach(function (k) { al[k] = rd(NS.alarms[k]); });
    return { ALARM: NS.ALARM, same: same, shifted: shifted, today: rd(NS.today), alarms: al, info: info, nRef: NS.REFD.score.length };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (!(Math.abs(r.same) < 1e-9)) return { pass: false, msg: 'PSI of the reference against itself is ' + r.same.toFixed(3) + '. It must be 0: nothing moved. Inside the log, divide TODAY\'s share by the reference share: N[k].' };
    if (!(r.shifted > 0.25)) return { pass: false, msg: 'Photos at 65% brightness give a PSI of only ' + r.shifted.toFixed(3) + ' on brightness. Inside the log you need today\'s share in bin k: N[k].' };
    if (r.ALARM !== 0.25) return { pass: false, msg: 'ALARM is ' + r.ALARM + '. The rule of thumb to ACT is above 0.25 (0.1 to 0.25 means watch). Type 0.25.' };
    var rings = Object.keys(r.alarms).filter(function (k) { return r.alarms[k].ring.length; });
    return { pass: true, msg: 'Drift alarm works. Today (the test tray): ' + (r.today.ring.length ? 'rings on ' + r.today.ring.join(', ') : 'calm, highest PSI ' + Math.max(r.today.score, r.today.bright, r.today.contrast, r.today.sharp).toFixed(3)) + '. Simulated changes that ring at least one alarm: ' + rings.length + ' of ' + Object.keys(r.alarms).length + '.' };
  },
  mechNeed: function (m) { return m && m.matrixLocked ? null : 'tick which alarm you expect for each simulated change, then tap “Check my matrix”'; },
  example: '<p>A shop compares the mix of basket sizes this week with last year:</p><pre>R = [0.5, 0.3, 0.2]       // last year: small, medium, big\nN = [0.2, 0.3, 0.5]       // this week\npsi = (0.2-0.5)*ln(0.2/0.5) + 0 + (0.5-0.2)*ln(0.5/0.2) = 0.55\nconst ACT = 0.25;         // 0.55 > 0.25: act</pre><p>Same mix → 0. The more the mix moves, the bigger the number.</p>',
  render: function (r, el, api) { V().driftCard(r, el, api); },
  explain: function (r, m) { var a = r.alarms; return {
    asked: 'Build an alarm that needs no labels: compare today\'s scores and photo numbers with the reference mix.',
    steps: ['Cut the ' + r.nRef + ' reference values into 10 bins with equal shares (10% each). Count today\'s share in each bin.',
            'PSI = sum of (today − reference) × ln(today ÷ reference). Reference against itself = ' + r.same.toFixed(3) + '; all photos at 65% brightness = ' + r.shifted.toFixed(2) + ' on brightness.',
            'Real values now — today (test tray): score ' + r.today.score.toFixed(3) + ', brightness ' + r.today.bright.toFixed(3) + ', contrast ' + r.today.contrast.toFixed(3) + ', sharpness ' + r.today.sharp.toFixed(3) + '.',
            Object.keys(a).map(function (k) { return r.info[k].name + ': ' + (a[k].ring.length ? a[k].ring.join(' + ') + ' ring' : 'no alarm rings'); }).join(' · ') + '.'],
    trap: 'Trusting 0.1 / 0.25 as laws. They are rules of thumb from credit scoring. Small samples make PSI noisy: check the trend over several shifts.',
    remember: 'No labels on the line: watch the inputs and the scores.' }; }
};

/* ================= 8e: your own factory photos ================= */
var s8e = { id: '8e', name: 'Your own factory photos', kind: 'code',
  goal: 'Your factory will have its own photos. How many labelled photos do you need? Train the Step 2 model on 10%, 25%, 50% and 100% of the train tray and score each on validation. Then try a photo of your own.',
  task: [
    'Gap 1: train only on this part of the train tray. Type the name of the part: part',
    'Gap 2: score on the tray you use for choosing (never the test tray). Type: idx_val',
    'Then load a photo of your own (or use a sample), and turn your Step 4 boxes into a shopping list.'
  ],
  code: L([
"# HOW MANY PHOTOS DO I NEED?  Train the Step 2 inspector on part of the train tray, score on validation.",
"from sklearn.base import clone",
"from sklearn.metrics import roc_auc_score",
"import time",
"",
"def false_alarms_at_95(y_true, s):           # share of good cells stopped when 95% of defects are caught",
"    d = np.sort(s[y_true == 1])",
"    cut = d[int(0.05 * len(d))]",
"    return float((s[y_true == 0] >= cut).mean())",
"",
"order = np.random.RandomState(0).permutation(idx_train)     # a fixed random order of the train tray",
"curve = []",
"for share in [0.1, 0.25, 0.5, 1.0]:",
"    part = order[:int(share * len(order))]",
"    m = clone(models[best_name])",
"    if 'probability' in m.get_params(): m.set_params(probability=False)   # ranking only: faster",
"    pipe = Pipeline([('scale', StandardScaler()), ('model', m)])",
"    t = time.time()",
"    pipe.fit(F[____], y[part])",
"    Fv = F[____]",
"    s = pipe.decision_function(Fv) if hasattr(pipe, 'decision_function') else pipe.predict_proba(Fv)[:, 1]",
"    curve.append({'share': share, 'photos': len(part), 'defects': int(y[part].sum()),",
"                  'auc': round(float(roc_auc_score(y_val, s)), 4), 'far': round(false_alarms_at_95(y_val, s), 4),",
"                  'sec': round(time.time() - t, 1)})",
"    print(f\"{len(part):5d} photos  ranking score {curve[-1]['auc']:.3f}  good cells stopped at 95% {100 * curve[-1]['far']:.1f}%\")"
  ]),
  twinTitle: 'Same thing in plain Python', twinNote: 'read-only · scikit-learn · runs as is outside the browser',
  twin: L([
"from sklearn.model_selection import learning_curve   # scikit-learn's own helper does the same idea with folds",
"sizes, tr, va = learning_curve(best, F[idx_train], y[idx_train], train_sizes=[0.1, 0.25, 0.5, 1.0],",
"                               cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring='roc_auc')",
"print(sizes, va.mean(axis=1).round(3))",
"# The cell on the left scores on idx_val instead of folds, so its numbers match the rest of the course.",
"# Your own photo: resize to 64 x 64 grey, same features, same model",
"from PIL import Image",
"img = np.asarray(Image.open('my_cell.png').convert('L').resize((64, 64), Image.BILINEAR))",
"p_svc = best.predict_proba(features(img[None] / 255.0))[0, 1]"
  ]),
  probe: L([
'_m = _pg_has("curve", "pipe", "part", "Fv")',
'if _m: _r = {"missing": _m}',
'else:',
'    _sv = pipe.decision_function(F[idx_val]) if hasattr(pipe, "decision_function") else pipe.predict_proba(F[idx_val])[:, 1]',
'    _st = pipe.decision_function(F[idx_test]) if hasattr(pipe, "decision_function") else pipe.predict_proba(F[idx_test])[:, 1]',
'    _s = pipe.decision_function(Fv) if hasattr(pipe, "decision_function") else pipe.predict_proba(Fv)[:, 1]',
'    _r = {"curve": curve, "fit_n": int(getattr(pipe, "n_features_in_", -1)), "n_train": int(len(idx_train)), "last_part": int(len(part)),',
'          "fv_n": int(len(Fv)), "on_val": bool(len(_s) == len(_sv) and np.allclose(_s, _sv)), "on_test": bool(len(_s) == len(_st) and np.allclose(_s, _st)),',
'          "model": best_name, "fitted_rows": int(pipe.named_steps["scale"].n_samples_seen_)}'
  ]),
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.fitted_rows !== r.last_part) return { pass: false, msg: 'The last model learned from ' + r.fitted_rows + ' rows, but the part has ' + r.last_part + ' photos. Train on the part only: F[part].' };
    if (r.on_test) return { pass: false, msg: 'You scored on the TEST tray. The test tray is for the one trial only — choosing how many photos to buy is a choice: score on validation, idx_val.' };
    if (!r.on_val) return { pass: false, msg: 'The scores are for ' + r.fv_n + ' cells, not the ' + 525 + ' validation cells. Type idx_val.' };
    var c = r.curve;
    return { pass: true, msg: 'Learning curve: ' + c.map(function (x) { return x.photos + ' photos → ' + x.auc.toFixed(3); }).join(', ') + ' (ranking score on validation, ' + r.model + ').' };
  },
  mechNeed: function (m) { if (!m || !m.tried) return 'load a photo of your own with the file picker (or tap a sample photo) and read its verdict'; return m.listDone ? null : 'turn all 4 Step 4 boxes into lines of the data shopping list'; },
  example: '<p>A cook tests how many practice cakes a new baker needs:</p><pre>for share in [0.2, 0.5, 1.0]:\n    batch = recipes[:int(share * len(recipes))]\n    baker.learn(cakes[batch])          # learn from this batch only\n    grade = taste(baker, judge_plates) # always the same judge plates</pre><p>Learn from a growing part; always measure on the same plates. If the grade stops rising, more cakes buy little.</p>',
  render: function (r, el, api) { V().ownCard(r, el, api); },
  explain: function (r) { var c = r.curve, a = c[0], b = c[c.length - 1], h = c[c.length - 2]; return {
    asked: 'Measure what more labelled photos buy: the same model trained on more and more of the train tray, scored on the same validation cells.',
    steps: ['The train tray was put in a fixed random order; the first 10%, 25%, 50% and 100% were used (' + c.map(function (x) { return x.photos; }).join(', ') + ' photos).',
            'Each model was trained on F[part] only and scored on F[idx_val] — the same ' + 525 + ' validation cells every time.',
            'Ranking score: ' + a.auc.toFixed(3) + ' with ' + a.photos + ' photos → ' + b.auc.toFixed(3) + ' with ' + b.photos + '. Good cells stopped at 95% recall: ' + (100 * a.far).toFixed(1) + '% → ' + (100 * b.far).toFixed(1) + '%.',
            'The last doubling (' + h.photos + ' → ' + b.photos + ') bought ' + (b.auc - h.auc >= 0 ? '+' : '') + (b.auc - h.auc).toFixed(3) + ' ranking score. ' + (b.auc - h.auc > 0.01 ? 'Still rising: more photos should help.' : 'Almost flat: more of the SAME photos buys little; better labels or new kinds of photos may buy more.')],
    trap: 'Measuring each size on its own training photos. Then small sets look great (they remember their photos). Always score on the same held-out tray.',
    remember: 'A learning curve tells you what the next 1,000 photos are worth.' }; }
};

/* ================= 8f: go or no-go (no code) ================= */
var s8f = { id: '8f', name: 'Go or no-go', kind: 'scene', scene: 'acceptance',
  goal: 'Fill the acceptance sheet for the plant manager from your real numbers. Then decide: go, go with conditions, or no-go. The sheet only checks that your decision fits the numbers.',
  needText: 'pick go / go with conditions / no-go, tick the conditions, and stamp a decision that fits the numbers' };

/* ================= 8g: what you built (recap + final test + take it home) ================= */
var s8g = { id: '8g', name: 'What you built', kind: 'scene', scene: 'recap',
  goal: 'The whole line you built, stage by stage, with its real numbers. Then the final test across Steps 1–8, and your project to take home.',
  needText: 'tap every stage of the line, then answer the final test and press Submit' };

var step8 = { id: 8, title: 'Line trial, drift watch, and your own factory', short: 'sealed test, interval, drift, own photos, go / no-go, recap',
  story: 'Everything is built. Now the sealed test tray opens — once — for an honest line trial. Then: how sure is the number, how will you notice when the line changes, and is it a go?',
  substeps: [s8a, s8b, s8c, s8d, s8e, s8f, s8g] };

var REF8 = { '8b': ['idx_test', 'bestW', 'routePoly'], '8c': ['1.96', 'kPassed', '1'], '8d': ['N[k]', '0.25'], '8e': ['part', 'idx_val'] };
step8.substeps.forEach(function (s) { if (REF8[s.id]) s.ref = REF8[s.id]; if (s.kind === 'code' && s.lang === 'js') { s.twinTitle = 'Same thing in Python'; s.twinNote = 'read-only · scikit-learn + Keras + LangGraph'; s.edLabel = 'JavaScript · TensorFlow.js · LangGraph'; } });
s8c.twinNote = 'read-only · statsmodels 0.15 + numpy'; s8d.twinNote = 'read-only · numpy + Keras';

G.PG_NAME_FROM = Object.assign(G.PG_NAME_FROM || {}, { tray: '8b', pSvcTest: '8b', pCnnTest: '8b', cnnOut: '8b', pTest: '8b', testAt: '8b', trialScore: '8b', trialLog: '8b', trialRecord: '8b', trialLine: '8b', expert: '8b', trial: '8b',
  kPassed: '8c', nDefects: '8c', z: '8c', wilson: '8c', interval: '8c', boot: '8c', bootInterval: '8c', underTarget: '8c', drawRows: '8c',
  looks: '8d', psi: '8d', ALARM: '8d', cnnScores: '8d', refCells: '8d', refLooks: '8d', REFD: '8d', drift: '8d', today: '8d', sims: '8d', alarms: '8d' });
G.PG_STEP8 = step8;
G.PG_STEP8_UTIL = { freezeOf: freezeOf, honesty: honesty, modelSum: modelSum, FREEZE_NAMES: FREEZE_NAMES, wilsonRef: wilsonRef, TARGET: TARGET, lcg: lcg, valReport: valReport };
var prevExtra = G.PG_PG_EXTRA;
G.PG_PG_EXTRA = function (pg) { var o = prevExtra ? prevExtra(pg) : {}; return Object.assign(o, extra(pg)); };
if (G.PG_STEPS) { var i8 = G.PG_STEPS.findIndex(function (s) { return s.id === 8; }); if (i8 >= 0) G.PG_STEPS[i8] = step8; }
})(typeof window !== 'undefined' ? window : globalThis);
