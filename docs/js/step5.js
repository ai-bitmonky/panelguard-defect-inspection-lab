/* PanelGuard — Step 5 content: Wire the inspection flow with LangGraph (the real LangGraph JS library, browser build).
   Inputs: Step 3 blend scores (pBlend) and gates (low, high), Step 1 labels, Step 4 heat maps. No LLM here: LangGraph is the wiring.
   Every count on screen comes from real graph runs on real validation cells. */
(function (G) {
'use strict';
var V = function () { return G.PGViz5; };
var J = function () { return G.PGJS; };
function LG() { return G.LangGraph; }
function f3(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(3); }
function pc(x, d) { return (100 * x).toFixed(d == null ? 1 : d) + '%'; }
function n0(x) { return Math.round(x).toLocaleString('en-US'); }

/* Quality rule thresholds (out of 255), chosen from all 2,624 real photos (tools/research/step5_photo_stats.txt):
   darkest real photos are 4 fully dead cells (mean 13.8-16.2, all in the train tray); every other photo has mean >= 26,
   spread (std) >= 6.3 and contrast (p95 - p5) >= 16. The gates sit below those. */
var DARK = 20, BLANK = 3, FLAT = 12;
/* Camera fault copies: 3 real GOOD validation photos, each spoiled the way a camera can spoil a photo (labelled, never mixed into the shift). */
var FAULTS = [{ id: 'F1', of: 2567, what: 'lens cap left on (no light)', rule: 'too dark' },
              { id: 'F2', of: 2187, what: 'glare: washed out', rule: 'almost blank' },
              { id: 'F3', of: 1620, what: 'fogged lens', rule: 'low contrast' }];
var DEAD = 1896;       // a real fully dead cell (train tray, expert score 1.0): dark because it is broken
var ONE = 496;         // the first cell you painted in 4a (a real validation defect)

function photoStats(px) {
  var n = px.length, s = 0, i; for (i = 0; i < n; i++) s += px[i];
  var m = s / n, v = 0; for (i = 0; i < n; i++) v += (px[i] - m) * (px[i] - m);
  var so = Array.prototype.slice.call(px).sort(function (a, b) { return a - b; });
  return { mean: m, spread: Math.sqrt(v / n), contrast: so[Math.floor(0.95 * n)] - so[Math.floor(0.05 * n)] };
}
function problemOf(px) { var st = photoStats(px); return st.mean < DARK ? 'too dark' : st.spread < BLANK ? 'almost blank' : st.contrast < FLAT ? 'low contrast' : null; }
function spoil(px, rule) {
  var st = photoStats(px), m = st.mean, k = rule === 'too dark' ? 0 : rule === 'almost blank' ? 0.02 : 10.5 / st.contrast;
  return Array.prototype.map.call(px, function (v) { var x = rule === 'too dark' ? v * 0.08 : m + (v - m) * k; return Math.max(0, Math.min(255, Math.round(x))); });
}
function lcg(seed) { var s = seed % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

/* ---------- helpers given to the student code as pg.* ---------- */
function extra(pg) {
  var valIdx = {}; pg.cell_val.forEach(function (id, i) { valIdx[id] = i; });
  var photoCache = {};
  function realPhoto(id) { var i = pg.cellIndex(id); if (i == null) return null; return Array.prototype.slice.call(pg.pixels.subarray(i * 4096, (i + 1) * 4096)); }
  function faultPhoto(f) { return photoCache[f.id] || (photoCache[f.id] = spoil(realPhoto(f.of), f.rule)); }
  function faultOf(id) { return FAULTS.filter(function (f) { return f.id === id; })[0]; }
  function kindOf(id) { var f = faultOf(id); if (f) id = f.of; return valIdx[id] != null ? pg.kind_val[valIdx[id]] : (pg.kindOf ? pg.kindOf(id) : null); }
  function card(id) { var f = faultOf(id); if (f) return { id: f.id, kind: kindOf(f.of), photo: faultPhoto(f).slice(), tries: 1 }; var ph = realPhoto(id); if (!ph) throw J().CheckError('There is no cell ' + id + '.'); return { id: id, kind: kindOf(id), photo: ph, tries: 1 }; }
  function shoot(id) { var f = faultOf(id); return f ? faultPhoto(f).slice() : realPhoto(id); }    // one photo per cell here: a reshoot gives the same photo back
  function labelOf(id) { var f = faultOf(id); if (f) id = f.of; return valIdx[id] != null ? pg.y_val[valIdx[id]] : null; }
  function sample(n) { var N = pg.cell_val.length, out = []; for (var k = 0; k < n; k++) out.push(pg.cell_val[Math.floor(k * N / n)]); return out; }
  function laneOf(p, lo, hi) { return p < lo ? 'pass' : p >= hi ? 'stop' : 'person'; }
  function unsureCells(s, lo, hi, k) {
    var idx = s.map(function (v, i) { return i; }).filter(function (i) { return laneOf(s[i], lo, hi) === 'person'; }).sort(function (a, b) { return s[a] - s[b]; });
    var out = []; for (var j = 0; j < k && idx.length; j++) out.push(pg.cell_val[idx[Math.min(idx.length - 1, Math.floor((j + 0.5) * idx.length / k))]]);
    return out;
  }
  function rightNineInTen(base, seed) {            // a checker who is right 9 times in 10 (seeded, so every run is the same)
    var r = lcg(seed == null ? 7 : seed);
    return function (ask) { var a = base(ask); return r() < 0.1 ? (a === 'stop' ? 'pass' : 'stop') : a; };
  }
  function group() { return { n: 0, def: 0, defPassed: 0, good: 0, goodStopped: 0, person: 0, personWrong: 0 }; }
  function shiftReport(rows) {                     // counted from the audit log rows
    var R = { n: rows.length, lanes: { pass: 0, person: 0, stop: 0 }, reshoots: 0, all: group(), mono: group(), poly: group(), escapes: [], rows: [] };
    rows.forEach(function (r) {
      var y = labelOf(r.id), g = [R.all, R[r.kind] || group()];
      R.lanes[r.lane] = (R.lanes[r.lane] || 0) + 1; R.reshoots += Math.max(0, (r.tries || 1) - 1);
      g.forEach(function (x) { x.n++; if (r.lane === 'person') { x.person++; if ((r.decision === 'stop') !== (y === 1)) x.personWrong++; }
        if (y === 1) { x.def++; if (r.decision === 'pass') x.defPassed++; } else { x.good++; if (r.decision === 'stop') x.goodStopped++; } });
      if (y === 1 && r.decision === 'pass') R.escapes.push(r.id);
      R.rows.push([r.id, r.lane, r.decision, y, r.kind, r.tries || 1, r.p == null ? null : Math.round(r.p * 1e4) / 1e4]);
    });
    R.per1000 = { pass: 1000 * R.lanes.pass / R.n, person: 1000 * R.lanes.person / R.n, stop: 1000 * R.lanes.stop / R.n };
    return R;
  }
  return { valIndex: function (id) { return valIdx[id]; }, photoStats: photoStats, card: card, shoot: shoot, faultCards: function () { return FAULTS.map(function (f) { return card(f.id); }); },
    faults: FAULTS, labelOf: labelOf, sample: sample, unsureCells: unsureCells, rightNineInTen: rightNineInTen, shiftReport: shiftReport, laneOf: laneOf, problemOf: problemOf };
}
function CE(m) { return J().CheckError(m); }
function needLG() { if (!LG()) throw CE('LangGraph could not be loaded in this page (js/langgraph.min.js). Reload the page.'); }
function need(NS, list, msg) { var m = list.filter(function (k) { return !(k in NS); }); if (m.length) throw CE(msg + ' (missing: ' + m.join(', ') + ').'); }
function needGates(NS) { need(NS, ['pBlend', 'low', 'high'], 'This step needs your Step 3 blend scores and gates. Finish 3f and 3g first'); }
function noPhoto(st) { var o = {}; for (var k in st) if (k !== 'photo') o[k] = st[k]; if (st && st.photo) o.photoStats = photoStats(st.photo); return o; }
function graphOf(g) { var gg = g.getGraph(); return { nodes: Object.keys(gg.nodes), edges: gg.edges.map(function (e) { return { s: e.source, t: e.target, c: !!e.conditional, d: e.data == null ? null : String(e.data) }; }) }; }
function errMsg(e) { return String(e && e.message || e).split('\n')[0]; }
var LGVER = function () { return LG() ? LG().VERSION : '?'; };

/* ================= 5a: draw the flow (no code) ================= */
var s5a = { id: '5a', name: 'Draw the flow', kind: 'scene', scene: 'wire',
  goal: 'Before any code: wire the inspection line by hand. Drag an arrow from each station to the next one a cell must visit.',
  needText: 'draw all 7 arrows of the flow (wrong arrows are refused)' };

/* ================= 5b: the traveller card (state) ================= */
var s5b = { id: '5b', name: 'The traveller card', kind: 'code', lang: 'js',
  goal: 'Each cell carries a card through the line. Every station reads it and writes on it. In LangGraph this card is the state.',
  pre: { need: function (m) { return m.cardOk ? null : 'put every field a station needs on the traveller card'; }, render: function (box, api) { V().cardPlay(box, api); } },
  task: [
    'Gap 1: a list method that gives back a NEW list: the old lines plus the new ones. Type concat.',
    'Gap 2: the log must start as an empty list. Type [] (two square brackets).'
  ],
  code: [
'// The traveller card: the state that travels with ONE cell through the line',
'const { Annotation } = LangGraph;',
'',
'const Cell = Annotation.Root({',
'  id: Annotation(),          // cell number',
"  kind: Annotation(),        // 'mono' or 'poly'",
'  photo: Annotation(),       // the 4,096 pixel values (0 to 255)',
'  problem: Annotation(),     // what is wrong with the photo, or null',
'  tries: Annotation(),       // photos taken so far',
'  p: Annotation(),           // defect score 0 to 1 (your 3f blend)',
"  lane: Annotation(),        // 'pass', 'person' or 'stop'",
"  decision: Annotation(),    // the final answer: 'pass' or 'stop'",
'  log: Annotation({          // audit trail: each station ADDS one line',
'    reducer: (old, add) => old.____(add),',
'    default: () => ____,',
'  }),',
'});',
"console.log('fields on the card:', Object.keys(Cell.spec).join(', '));"
  ].join('\n'),
  twin: [
'import operator',
'from typing import Annotated, Optional, TypedDict',
'',
'class Cell(TypedDict, total=False):',
'    id: int                  # cell number',
"    kind: str                # 'mono' or 'poly'",
'    photo: list              # the 4,096 pixel values (0 to 255)',
'    problem: Optional[str]   # what is wrong with the photo, or None',
'    tries: int               # photos taken so far',
'    p: float                 # defect score 0 to 1',
"    lane: str                # 'pass', 'person' or 'stop'",
"    decision: str            # the final answer: 'pass' or 'stop'",
'    log: Annotated[list, operator.add]   # each station ADDS one line (list + list)'
  ].join('\n'),
  probe: async function (NS) {
    needLG();
    if (!NS.Cell || !NS.Cell.spec) return { missing: ['Cell'] };
    var L = LG(), keys = Object.keys(NS.Cell.spec), want = ['id', 'kind', 'photo', 'problem', 'tries', 'p', 'lane', 'decision', 'log'];
    var out = null, err = null;
    try {
      var g = new L.StateGraph(NS.Cell).addNode('a', function () { return { lane: 'pass', log: ['a: first line'] }; }).addNode('b', function () { return { lane: 'stop', log: ['b: second line'] }; })
        .addEdge(L.START, 'a').addEdge('a', 'b').addEdge('b', L.END).compile();
      out = await g.invoke({ id: 7 });
    } catch (e) { err = errMsg(e); }
    return { keys: keys, miss: want.filter(function (k) { return keys.indexOf(k) < 0; }), err: err, log: out ? out.log : null, logType: out ? (Array.isArray(out.log) ? 'list' : typeof out.log) : null, lane: out ? out.lane : null, ver: LGVER() };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'There is no Cell yet. Run the whole cell.' };
    if (r.miss.length) return { pass: false, msg: 'The card is missing: ' + r.miss.join(', ') + '. Put the fields back (Reset this cell if needed).' };
    if (r.err && /push/.test(r.err)) return { pass: false, msg: 'push adds to the old list and gives back its LENGTH (a number), so after the first station the log is a number and the second station breaks. Use the method that gives back a NEW list: concat.' };
    if (r.err && /null|undefined/.test(r.err)) return { pass: false, msg: 'The first station could not add its line: the log started as nothing (null). Start it as an empty list: [].' };
    var nf = r.err && r.err.match(/([\w$.]+) is not a function/);
    if (nf) return { pass: false, msg: '“' + nf[1].split('.').pop() + '” is not something a list can do, so the second line could not be added. The list method that gives back a NEW, longer list is concat.' };
    if (r.err) return { pass: false, msg: 'LangGraph stopped while the two test stations wrote on the card. Check the reducer line: (old, add) => old.concat(add), starting from [].' };
    if (r.logType === 'string') return { pass: false, msg: 'The log started as text, so the lines were glued into one word: “' + r.log + '”. Start it as an empty list: [].' };
    if (r.logType !== 'list' || r.log.join('|') !== 'a: first line|b: second line') return { pass: false, msg: 'Two test stations each added one line, but the log is ' + JSON.stringify(r.log) + '. It should keep BOTH lines, in order: concat, starting from [].' };
    return { pass: true, msg: 'Card ready: ' + r.keys.length + ' fields. Test with real LangGraph ' + r.ver + ': two stations each added a line → log keeps both; lane kept only the last value (“' + r.lane + '”).' };
  },
  example: '<p>A museum ticket counts rooms visited. Each room returns <code>{ visits: 1 }</code>. The reducer says how a new value joins the old one:</p><pre>visits: Annotation({ reducer: (old, add) => old + add, default: () => 0 })</pre><p>Numbers are added and start at 0. Your log holds <b>lines of text in a list</b>: think which list method joins two lists, and what an empty list looks like.</p>',
  render: function (r, el, api) { V().cardResult(r, el, api); },
  explain: function (r) { return {
    asked: 'Write the state (the card) and tell LangGraph how the log field grows.',
    steps: ['A field with no reducer keeps only the last value written. In the test, lane was “pass”, then “stop” → it kept “' + r.lane + '”.',
            'The log has a reducer: new = old.concat(add). concat gives back a NEW list with both parts; the old one is not changed.',
            'default: () => [] → every card starts with an empty log, so the first station has a list to add to.',
            'Two real test stations each returned one line. The log kept both: ' + JSON.stringify(r.log) + '.'],
    trap: 'push looks right but gives back the new LENGTH, not the list. The log turns into a number.',
    remember: 'Plain field = last value wins. Reducer field = values are combined.' }; }
};

/* ================= 5c: first two stations ================= */
var s5c = { id: '5c', name: 'First two stations', kind: 'code', lang: 'js',
  goal: 'Build the first two stations, join them with arrows, and send ONE real cell through. Then follow it station by station.',
  task: [
    'Gap 1: the score station writes the score on the card. Type the card field for the defect score: p',
    "Gap 2: after check_photo comes the station named 'score'. Type it with quotes: 'score'",
    'Then tap the cell token to move it forward, one station at a time, until it reaches END.'
  ],
  code: [
'const { StateGraph, START, END } = LangGraph;',
'',
'// Quality rule. The gates sit below every real photo except 4 fully dead cells (card on the right).',
'const DARK = 20, BLANK = 3, FLAT = 12;',
'function photoProblem(photo) {',
'  const { mean, spread, contrast } = pg.photoStats(photo);   // brightness, std, p95 - p5',
"  if (mean < DARK) return 'too dark';",
"  if (spread < BLANK) return 'almost blank';",
"  if (contrast < FLAT) return 'low contrast';",
'  return null;',
'}',
'',
'// A station reads the card and returns ONLY what it changes',
'function checkPhoto(state) {',
'  const problem = photoProblem(state.photo);',
"  return { problem, log: ['check_photo: ' + (problem || 'photo ok')] };",
'}',
'function score(state) {',
'  const p = pBlend[pg.valIndex(state.id)];        // your 3f blend score for this cell',
"  return { ____: p, log: ['score: ' + p.toFixed(3)] };",
'}',
'',
'const line1 = new StateGraph(Cell)',
"  .addNode('check_photo', checkPhoto)",
"  .addNode('score', score)",
"  .addEdge(START, 'check_photo')",
"  .addEdge('check_photo', ____)",
"  .addEdge('score', END)",
'  .compile();',
'',
'// One real validation cell (the first one you painted in 4a)',
'const trail = [];',
"for await (const step of await line1.stream(pg.card(496), { streamMode: ['updates', 'values'] })) trail.push(step);",
"console.log('stations run:', trail.filter(([mode]) => mode === 'updates').map(([, u]) => Object.keys(u)[0]).join(' -> '));"
  ].join('\n'),
  twin: [
'from langgraph.graph import StateGraph, START, END',
'',
'DARK, BLANK, FLAT = 20, 3, 12',
'def photo_problem(photo):',
'    a = np.asarray(photo, dtype=float); s = np.sort(a)',
'    mean, spread, contrast = a.mean(), a.std(), s[int(0.95 * a.size)] - s[int(0.05 * a.size)]',
"    if mean < DARK: return 'too dark'",
"    if spread < BLANK: return 'almost blank'",
"    if contrast < FLAT: return 'low contrast'",
'    return None',
'',
'def check_photo(state: Cell) -> dict:                 # return ONLY what changes',
"    problem = photo_problem(state['photo'])",
"    return {'problem': problem, 'log': ['check_photo: ' + (problem or 'photo ok')]}",
'',
'def score(state: Cell) -> dict:',
"    p = float(p_blend[val_ids.index(state['id'])])",
"    return {'p': p, 'log': [f'score: {p:.3f}']}",
'',
'g = StateGraph(Cell)',
"g.add_node('check_photo', check_photo)",
"g.add_node('score', score)",
"g.add_edge(START, 'check_photo')",
"g.add_edge('check_photo', 'score')",
"g.add_edge('score', END)",
'line1 = g.compile()',
'',
"for mode, chunk in line1.stream(card(496), stream_mode=['updates', 'values']):",
'    print(mode, list(chunk))'
  ].join('\n'),
  probe: async function (NS, pg) {
    needLG(); need(NS, ['Cell'], 'Run 5b first: the stations need the traveller card'); needGates(NS);
    if (!NS.line1 || !NS.trail) return { missing: ['line1', 'trail'] };
    var ups = [], vals = [];
    NS.trail.forEach(function (t) { if (t[0] === 'updates') ups.push(t[1]); else if (t[0] === 'values') vals.push(noPhoto(t[1])); });
    var names = ups.map(function (u) { return Object.keys(u)[0]; });
    var upd = ups.map(function (u) { var k = Object.keys(u)[0], x = u[k] || {}; var o = {}; for (var f in x) if (f !== 'photo') o[f] = x[f]; return [k, o]; });
    var last = vals[vals.length - 1] || {}, i = pg.valIndex(ONE);
    var all = [], dark = 0, faults = FAULTS.map(function (f) { var st = photoStats(pg.card(f.id).photo); return { id: f.id, of: f.of, what: f.what, rule: f.rule, got: NS.photoProblem ? NS.photoProblem(pg.card(f.id).photo) : null, st: st }; });
    var P = pg.pixels; for (var c = 0; c < P.length / 4096; c++) { var sm = 0; for (var q = c * 4096; q < (c + 1) * 4096; q++) sm += P[q]; sm /= 4096; all.push(Math.round(sm * 10) / 10); if (sm < DARK) dark++; }
    return { graph: graphOf(NS.line1), names: names, upd: upd, vals: vals, p: last.p, ref: NS.pBlend[i], id: ONE, y: pg.y_val[i], means: all, dark: dark, faults: faults, ver: LGVER() };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.names.indexOf('score') < 0) return { pass: false, msg: 'Only ' + r.names.join(', ') + ' ran: the score station was never reached. The arrow after check_photo must go to the station named \'score\' (in quotes).' };
    if (r.p == null || Math.abs(r.p - r.ref) > 1e-12) return { pass: false, msg: 'The score is not on the card. The station must return it under the card\'s field name for the score: p.' };
    return { pass: true, msg: 'Cell ' + r.id + ' went through ' + r.names.join(' → ') + '. Its card now says p = ' + f3(r.p) + '.' };
  },
  mechNeed: function (m) { return m && m.tokenEnd ? null : 'tap the cell token on the drawing until it reaches END'; },
  example: '<p>A salad line with two stations, wash then cut. Each returns only what it changed:</p><pre>function wash(state) { return { clean: true }; }\nconst salad = new StateGraph(Bowl)\n  .addNode(\'wash\', wash).addNode(\'cut\', cut)\n  .addEdge(START, \'wash\').addEdge(\'wash\', \'cut\').addEdge(\'cut\', END)\n  .compile();</pre><p>Arrows use the station <b>names</b> (text in quotes), not the functions.</p>',
  render: function (r, el, api) { V().firstTwo(r, el, api); },
  explain: function (r) { return {
    asked: 'Make two stations, join them START → check_photo → score → END, and run one real cell.',
    steps: ['addNode(name, function) puts a station on the line. addEdge(a, b) draws an arrow from a to b, by name.',
            'compile() checks the drawing (every arrow must end at a real station) and gives a graph you can run.',
            'check_photo returned only { problem, log }. score returned only { p, log }. LangGraph wrote them on the card; the log reducer added the lines.',
            'Cell ' + r.id + ' (expert label: ' + (r.y ? 'defect' : 'good') + '): photo ok, p = ' + f3(r.p) + ' — the same number as pBlend in 3f.'],
    trap: "A station that returns the WHOLE card works, but hides what it changed. And an arrow to score (the function) instead of 'score' (the name) is refused.",
    remember: 'Stations return only what they change. Arrows join station names.' }; }
};

/* ================= 5d: the fork ================= */
var s5d = { id: '5d', name: 'The fork', kind: 'code', lang: 'js',
  goal: 'After the score, the line splits into three lanes: auto-pass, a person, auto-stop. The route station picks the lane with your two Step 3 gates.',
  predict: { format: 'lanes',
    q: 'Before you run: here are <b>4 real validation cells</b> with their scores and your two gates. <b>Drag each cell into the lane</b> the fork will send it to, then tap <b>Check</b>. One try.',
    reveal: { asked: 'Which lane each of 4 real cells takes at your two gates.',
      steps: ['Below the low gate → auto-pass (nobody looks).', 'At or above the high gate → auto-stop.', 'In between → a person checks it.',
              'Only the score and the two gates matter. The fork does not know the label.'],
      trap: 'Thinking a defect can never pass. A defect with a low score passes too: that is the 5% the low gate allows.',
      remember: 'Two gates make three lanes.' } },
  task: [
    'Gap 1: at or above the HIGH gate the cell is stopped. Type the high gate variable from 3g: high',
    "Gap 2: the person lane must go to the station where a person looks. Type 'human_check' with quotes."
  ],
  code: [
'const { StateGraph, START, END } = LangGraph;',
'',
'// The fork station: writes the lane on the card (your Step 3 gates: low and high)',
'function route(state) {',
"  let lane = 'person';",
"  if (state.p < low) lane = 'pass';",
"  else if (state.p >= ____) lane = 'stop';",
"  return { lane, log: ['route: ' + lane] };",
'}',
'const byLane = (state) => state.lane;              // the conditional edge follows the lane',
'',
'function humanCheck(state) {                       // a person decides (made real in 5f)',
"  return { lane: 'person', decision: 'waiting', log: ['human_check: a person will decide (5f)'] };",
'}',
'const auditLog = [];                               // the line\'s logbook: one row per cell',
'function record(state) {',
'  const decision = state.decision || state.lane;   // pass / stop, or the person\'s answer',
'  auditLog.push({ id: state.id, kind: state.kind, p: state.p, lane: state.lane, decision, tries: state.tries });',
"  return { decision, log: ['record: ' + decision] };",
'}',
'',
'const line2 = new StateGraph(Cell)',
"  .addNode('check_photo', checkPhoto).addNode('score', score).addNode('route', route)",
"  .addNode('human_check', humanCheck).addNode('record', record)",
"  .addEdge(START, 'check_photo').addEdge('check_photo', 'score').addEdge('score', 'route')",
"  .addConditionalEdges('route', byLane, { pass: 'record', person: ____, stop: 'record' })",
"  .addEdge('human_check', 'record').addEdge('record', END)",
'  .compile();',
'',
'// 20 real validation cells through the line',
'const twenty = [];',
'for (const id of pg.sample(20)) twenty.push(await line2.invoke(pg.card(id)));',
"console.log('lanes:', twenty.map((c) => c.lane).join(' '));"
  ].join('\n'),
  twin: [
'def route(state: Cell) -> dict:                      # the fork station',
"    lane = 'pass' if state['p'] < low else 'stop' if state['p'] >= high else 'person'",
"    return {'lane': lane, 'log': ['route: ' + lane]}",
'',
'def human_check(state: Cell) -> dict:                # made real in 5f',
"    return {'lane': 'person', 'decision': 'waiting', 'log': ['human_check: a person will decide (5f)']}",
'',
'audit_log = []',
'def record(state: Cell) -> dict:',
"    decision = state.get('decision') or state['lane']",
"    audit_log.append({k: state.get(k) for k in ('id', 'kind', 'p', 'lane', 'tries')} | {'decision': decision})",
"    return {'decision': decision, 'log': ['record: ' + decision]}",
'',
'g = StateGraph(Cell)',
"for name, fn in [('check_photo', check_photo), ('score', score), ('route', route), ('human_check', human_check), ('record', record)]:",
'    g.add_node(name, fn)',
"g.add_edge(START, 'check_photo'); g.add_edge('check_photo', 'score'); g.add_edge('score', 'route')",
"g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})",
"g.add_edge('human_check', 'record'); g.add_edge('record', END)",
'line2 = g.compile()',
'',
'N = len(val_ids)',
'twenty = [line2.invoke(card(val_ids[k * N // 20])) for k in range(20)]',
"print('lanes:', ' '.join(c['lane'] for c in twenty))"
  ].join('\n'),
  probe: async function (NS, pg) {
    needLG(); need(NS, ['Cell', 'checkPhoto', 'score'], 'Run 5b and 5c first'); needGates(NS);
    if (!NS.line2 || !NS.twenty || typeof NS.route !== 'function') return { missing: ['route', 'line2', 'twenty'] };
    var s = NS.pBlend, lo = NS.low, hi = NS.high, bad = { personToStop: 0, other: 0 }, ref = { pass: 0, person: 0, stop: 0 };
    for (var i = 0; i < s.length; i++) {
      var want = pg.laneOf(s[i], lo, hi), got = (NS.route({ p: s[i] }) || {}).lane; ref[want]++;
      if (got !== want) { if (want === 'person' && got === 'stop') bad.personToStop++; else bad.other++; }
    }
    var gr = graphOf(NS.line2), pe = gr.edges.filter(function (e) { return e.s === 'route' && e.d === 'person'; })[0];
    var twenty = NS.twenty.map(function (c) { return { id: c.id, p: c.p, lane: c.lane, decision: c.decision, y: pg.labelOf(c.id), kind: c.kind, log: c.log }; });
    return { bad: bad, ref: ref, n: s.length, personTo: pe ? pe.t : null, graph: gr, twenty: twenty, low: lo, high: hi };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.bad.personToStop) return { pass: false, msg: 'Your fork sends ' + r.bad.personToStop + ' unsure cells straight to stop. Cells are stopped only at or above the HIGH gate: high.' };
    if (r.bad.other) return { pass: false, msg: 'Your fork picks the wrong lane for ' + r.bad.other + ' of ' + r.n + ' validation cells. Below low → pass; at or above high → stop; between → person.' };
    if (r.personTo !== 'human_check') return { pass: false, msg: 'The person lane goes to “' + r.personTo + '”: nobody looks at the unsure cells. Send it to \'human_check\'.' };
    var c = { pass: 0, person: 0, stop: 0 }; r.twenty.forEach(function (x) { c[x.lane]++; });
    return { pass: true, msg: 'The fork works. 20 real cells: ' + c.pass + ' auto-pass, ' + c.person + ' to a person, ' + c.stop + ' auto-stop.' };
  },
  example: '<p>A parcel sorter with two weight gates (1 kg and 20 kg):</p><pre>function sort(state) {\n  let lane = \'parcel\';\n  if (state.kg < 1) lane = \'letter\';\n  else if (state.kg >= 20) lane = \'freight\';\n  return { lane };\n}\n.addConditionalEdges(\'sort\', (s) => s.lane, { letter: \'post\', parcel: \'van\', freight: \'truck\' })</pre><p>The map says which station each lane leads to.</p>',
  render: function (r, el, api) { V().lanesFill(r, el, api); },
  explain: function (r) { var R = r.ref; return {
    asked: 'Write the fork with your two gates and send each lane to the right station.',
    steps: ['route writes the lane: below ' + f3(r.low) + ' → pass; at or above ' + f3(r.high) + ' → stop; between → person.',
            'addConditionalEdges(\'route\', byLane, map): after route, LangGraph calls byLane(card) and follows the map: pass and stop → record, person → human_check.',
            'On all ' + r.n + ' validation cells this fork gives ' + R.pass + ' pass, ' + R.person + ' person, ' + R.stop + ' stop — the same lanes as 3g.',
            'The 20 cells you watched are spread evenly over the validation tray.'],
    trap: 'Sending the person lane to record looks fine and runs fine — but no person ever looks. The code does not complain; the check does.',
    remember: 'A conditional edge = a function that names the next station.' }; }
};

/* ================= 5e: shoot again, but not forever ================= */
var s5e = { id: '5e', name: 'Shoot again, but not forever', kind: 'code', lang: 'js',
  goal: 'A bad photo goes back to the camera for a new shot. But a loop needs a way out, or it never ends.',
  task: [
    "Gap 2 first: when the cap is reached, a person looks. Type 'human_check' with quotes.",
    'Gap 1, run 1: type Infinity (no cap) and press RUN. Watch what LangGraph does with the camera fault copies.',
    'Gap 1, run 2: the cap. After 2 photos, a person looks: type 2.'
  ],
  code: [
'const { StateGraph, START, END } = LangGraph;',
'',
'const MAX_TRIES = ____;              // run 1: Infinity (no cap). Run 2: the cap.',
'',
'function reshoot(state) {            // the camera takes the photo again',
"  return { photo: pg.shoot(state.id), tries: state.tries + 1, log: ['reshoot: photo ' + (state.tries + 1)] };",
'}',
'function afterCheck(state) {         // the fork after check_photo',
"  if (!state.problem) return 'score';",
'  if (state.tries >= MAX_TRIES) return ____;     // enough tries: a person looks',
"  return 'reshoot';",
'}',
'',
'const line3 = new StateGraph(Cell)',
"  .addNode('check_photo', checkPhoto).addNode('reshoot', reshoot).addNode('score', score)",
"  .addNode('route', route).addNode('human_check', humanCheck).addNode('record', record)",
"  .addEdge(START, 'check_photo')",
"  .addConditionalEdges('check_photo', afterCheck, ['score', 'reshoot', 'human_check'])",
"  .addEdge('reshoot', 'check_photo').addEdge('score', 'route')",
"  .addConditionalEdges('route', byLane, { pass: 'record', person: 'human_check', stop: 'record' })",
"  .addEdge('human_check', 'record').addEdge('record', END)",
'  .compile();',
'',
'// 3 camera fault copies (the camera stays broken), 1 real dead cell, 1 normal real cell',
'const cards = [...pg.faultCards(), pg.card(1896), pg.card(496)];',
'const trails = [];',
'let loopError = null;',
'try {',
'  for (const c of cards) trails.push(await line3.invoke(c));',
'} catch (e) {',
'  loopError = e;                     // LangGraph stops a flow that never ends',
'}',
"console.log(loopError ? 'STOPPED by LangGraph: ' + loopError.name : 'all ' + trails.length + ' cells reached END');"
  ].join('\n'),
  twin: [
'from langgraph.errors import GraphRecursionError',
'',
'MAX_TRIES = 2                        # try float("inf") to see the endless loop',
'',
'def reshoot(state: Cell) -> dict:',
"    return {'photo': shoot(state['id']), 'tries': state['tries'] + 1, 'log': [f\"reshoot: photo {state['tries'] + 1}\"]}",
'',
'def after_check(state: Cell) -> str:',
"    if not state.get('problem'): return 'score'",
"    if state['tries'] >= MAX_TRIES: return 'human_check'",
"    return 'reshoot'",
'',
'g = StateGraph(Cell)',
"for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', score), ('route', route), ('human_check', human_check), ('record', record)]:",
'    g.add_node(name, fn)',
"g.add_edge(START, 'check_photo')",
"g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])",
"g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')",
"g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})",
"g.add_edge('human_check', 'record'); g.add_edge('record', END)",
'line3 = g.compile()',
'',
'try:',
'    trails = [line3.invoke(c, {"recursion_limit": 25}) for c in fault_cards + [card(1896), card(496)]]',
'except GraphRecursionError as e:',
"    print('STOPPED by LangGraph:', e)"
  ].join('\n'),
  probe: async function (NS, pg) {
    needLG(); need(NS, ['Cell', 'checkPhoto', 'score', 'route', 'byLane', 'humanCheck', 'record'], 'Run 5b to 5d first'); needGates(NS);
    if (!('loopError' in NS) || !NS.trails) return { missing: ['trails', 'loopError'] };
    var cap = NS.MAX_TRIES;
    if (NS.loopError) { var e = NS.loopError; return { loop: true, name: e.name || 'Error', raw: String(e.message || e), maxTries: cap === Infinity ? 'Infinity' : cap, recursion: /Recursion limit/i.test(String(e.message)), graph: NS.line3 ? graphOf(NS.line3) : null }; }
    var tr = NS.trails.map(function (t, k) { return { id: t.id, kind: t.kind, problem: t.problem, tries: t.tries, lane: t.lane, decision: t.decision, p: t.p, log: t.log, fault: FAULTS[k] || null, path: (t.log || []).map(function (l) { return l.split(':')[0]; }) }; });
    return { loop: false, maxTries: cap === Infinity ? 'Infinity' : cap, trails: tr, graph: graphOf(NS.line3) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.loop && !r.recursion) return { pass: false, msg: J().lgFriendly(r.raw) || 'LangGraph stopped with an error: ' + r.raw.split('\n')[0] };
    if (r.loop && r.maxTries === 'Infinity') return { pass: false, msg: 'No way out: the camera fault copy went check_photo → reshoot → check_photo … again and again. LangGraph stopped it after ' + ((r.raw.match(/Recursion limit of (\d+)/) || [])[1] || 25) + ' steps (its recursion limit). Now put the cap: type 2 in gap 1.' };
    if (r.loop) return { pass: false, msg: 'Still an endless loop, even with MAX_TRIES = ' + r.maxTries + ': when the cap is reached, afterCheck must send the cell to \'human_check\', not back to reshoot.' };
    var f = r.trails.slice(0, 3), bad = f.filter(function (t) { return t.path.indexOf('human_check') < 0; });
    if (bad.length) return { pass: false, msg: 'Camera fault copy ' + bad[0].id + ' was recorded without a person ever looking at it. When the cap is reached, send it to \'human_check\'.' };
    if (r.maxTries !== 2) return { pass: false, msg: 'Your cap is ' + r.maxTries + ' photos. The rule: after 2 photos, a person looks. Type 2.' };
    return { pass: true, msg: 'Every cell reached END. The 3 fault copies and the dead cell each took 2 photos, then went to a person. Cell 496 went straight on (photo ok).' };
  },
  mechNeed: function (m) { return m && m.sawLoop ? null : 'first run it once with NO cap (MAX_TRIES = Infinity) to see what LangGraph does with an endless loop'; },
  example: '<p>A door asks for a code. Wrong code → ask again. If a key is stuck, it asks forever. With a cap:</p><pre>const MAX = 3;\nfunction afterCode(state) {\n  if (state.ok) return \'open\';\n  if (state.tries >= MAX) return \'call_guard\';\n  return \'ask_again\';\n}</pre><p>Every loop needs a counter and a way out.</p>',
  render: function (r, el, api) { V().loopView(r, el, api); },
  explain: function (r) { return {
    asked: 'Send bad photos back for a new shot, but give the loop a way out.',
    steps: ['check_photo → afterCheck: photo ok → score. Bad photo → reshoot → check_photo again. Each reshoot adds 1 to tries.',
            'Here a reshoot gives back the same photo: we have one photo per cell, and the fault copies stay faulty. So with no cap the loop never ends.',
            'LangGraph counts the steps of a run. At 25 (recursionLimit) it stops the run with GraphRecursionError: nothing is recorded.',
            'With MAX_TRIES = 2: photo 1 bad → reshoot → photo 2 bad → human_check → record. The real dead cell ' + DEAD + ' does the same: dark because it is broken, so a person is the right answer.'],
    trap: 'Trusting the recursion limit as the cap. It throws the cell away with an error; the cap sends it to a person.',
    remember: 'Every loop needs a counter and a way out.' }; }
};

/* ================= 5f: stop and wait for a person ================= */
var s5f = { id: '5f', name: 'Stop and wait for a person', kind: 'code', lang: 'js',
  goal: 'The flow must really PAUSE at human_check, wait for a person, then go on. That needs a memory (checkpointer) and one thread id per cell.',
  task: [
    'Gap 1: the flow can only pause if it has a memory. Type the name of the MemorySaver made above: memory',
    'Gap 2: the Command field that carries the person\'s answer back into the paused flow. Type resume.',
    'Then be the checker: decide each paused cell (pass or stop) on the right.'
  ],
  code: [
'const { StateGraph, START, END, MemorySaver, interrupt, Command } = LangGraph;',
'',
'function humanCheck(state) {                   // the flow PAUSES here until a person answers',
'  const answer = interrupt({ id: state.id, p: state.p, problem: state.problem });',
"  return { lane: state.lane || 'person', decision: answer, log: ['human_check: a person said ' + answer] };",
'}',
'',
'function buildLine(routeStation, saver) {      // the whole line from 5c to 5e',
'  return new StateGraph(Cell)',
"    .addNode('check_photo', checkPhoto).addNode('reshoot', reshoot).addNode('score', score)",
"    .addNode('route', routeStation).addNode('human_check', humanCheck).addNode('record', record)",
"    .addEdge(START, 'check_photo')",
"    .addConditionalEdges('check_photo', afterCheck, ['score', 'reshoot', 'human_check'])",
"    .addEdge('reshoot', 'check_photo').addEdge('score', 'route')",
"    .addConditionalEdges('route', byLane, { pass: 'record', person: 'human_check', stop: 'record' })",
"    .addEdge('human_check', 'record').addEdge('record', END)",
'    .compile({ checkpointer: saver });',
'}',
'const memory = new MemorySaver();              // keeps every paused flow',
'const line = buildLine(route, ____);',
'',
'// 5 real unsure cells: each gets its own thread id, runs, and pauses at human_check',
'const threads = [];',
'for (const id of pg.unsureCells(pBlend, low, high, 5)) {',
"  const config = { configurable: { thread_id: 'cell-' + id } };",
'  await line.invoke(pg.card(id), config);',
'  threads.push(config);',
'}',
'',
'// You are the checker: the buttons on the right call this with your answer',
'async function decide(config, answer) {',
'  return line.invoke(new Command({ ____: answer }), config);',
'}',
"console.log('paused flows:', threads.length);"
  ].join('\n'),
  twin: [
'from langgraph.checkpoint.memory import MemorySaver',
'from langgraph.types import interrupt, Command',
'',
'def human_check(state: Cell) -> dict:            # the flow PAUSES here',
"    answer = interrupt({'id': state['id'], 'p': state.get('p'), 'problem': state.get('problem')})",
"    return {'lane': state.get('lane') or 'person', 'decision': answer, 'log': ['human_check: a person said ' + answer]}",
'',
'def build_line(route_station, saver):',
'    g = StateGraph(Cell)',
"    for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', score),",
"                     ('route', route_station), ('human_check', human_check), ('record', record)]:",
'        g.add_node(name, fn)',
"    g.add_edge(START, 'check_photo')",
"    g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])",
"    g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')",
"    g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})",
"    g.add_edge('human_check', 'record'); g.add_edge('record', END)",
'    return g.compile(checkpointer=saver)',
'',
'memory = MemorySaver()',
'line = build_line(route, memory)',
'',
'threads = []',
'for cid in unsure_cells(5):',
"    config = {'configurable': {'thread_id': f'cell-{cid}'}}",
'    line.invoke(card(cid), config)              # pauses: result has __interrupt__',
'    threads.append(config)',
'',
'def decide(config, answer):',
'    return line.invoke(Command(resume=answer), config)'
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    needLG(); need(NS, ['Cell', 'checkPhoto', 'score', 'route', 'byLane', 'record', 'reshoot', 'afterCheck'], 'Run 5b to 5e first'); needGates(NS);
    if (!NS.line || !NS.threads || typeof NS.decide !== 'function') return { missing: ['line', 'threads', 'decide'] };
    var cells = [];
    for (var k = 0; k < NS.threads.length; k++) {
      var cfg = NS.threads[k], st = await NS.line.getState(cfg), id = st.values.id, i = pg.valIndex(id), cam = null;
      if (NS.model && NS.xVal && pg.refGradCam) { var img = NS.xVal.slice([i, 0, 0, 0], [1, 64, 64, 1]).squeeze([0]), cm = typeof NS.gradCam === 'function' ? NS.gradCam(img) : pg.refGradCam(NS.model, img); cam = Array.prototype.map.call(await cm.data(), function (v) { return Math.round(v * 1e4) / 1e4; }); cm.dispose(); img.dispose(); }
      cells.push({ id: id, thread: cfg.configurable.thread_id, p: st.values.p, y: pg.y_val[i], prob: pg.prob_val[i], kind: pg.kind_val[i], next: st.next.slice(), cam: cam });
    }
    /* test the student's decide() on a scratch thread (one more real cell), then remove its logbook row */
    var test = null, id0 = cells[0] && cells[0].id;
    if (id0 != null) {
      var cfg0 = { configurable: { thread_id: 'check-' + id0 + '-' + Date.now() } }, n0 = NS.auditLog ? NS.auditLog.length : 0;
      try { await NS.line.invoke(pg.card(id0), cfg0); await NS.decide(cfg0, 'stop'); var s0 = await NS.line.getState(cfg0); test = { next: s0.next.slice(), decision: s0.values.decision }; }
      catch (e) { test = { err: errMsg(e) }; }
      if (NS.auditLog && NS.auditLog.length > n0) NS.auditLog.splice(n0);
    }
    return { cells: cells, test: test, n: NS.threads.length };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.n !== 5) return { pass: false, msg: r.n + ' flows started; there should be 5.' };
    var notPaused = r.cells.filter(function (c) { return c.next.indexOf('human_check') < 0; });
    if (notPaused.length) return { pass: false, msg: notPaused.length + ' of 5 flows did not pause at human_check.' };
    if (!r.test || r.test.err) return { pass: false, msg: 'Your decide() did not work: ' + (r.test ? J().lgFriendly(r.test.err) || r.test.err : 'no result') + ' The answer must go in as resume: new Command({ resume: answer }).' };
    if (r.test.next.length || r.test.decision !== 'stop') return { pass: false, msg: 'decide(config, \'stop\') did not finish the paused flow (it is still waiting at ' + (r.test.next.join(', ') || '—') + '). The answer goes in as resume: new Command({ resume: answer }).' };
    return { pass: true, msg: '5 real flows are paused at human_check, each in its own thread. Your decide() resumes a flow to the end.' };
  },
  mechNeed: function (m) { var d = Object.keys((m && m.dec) || {}).length; return d >= 5 ? null : 'decide all 5 paused cells on the right (' + d + ' of 5 done)'; },
  example: '<p>A loan desk: big loans wait for the manager. Each loan has its own thread id so the right one comes back later:</p><pre>function manager(state) {\n  const ok = interrupt({ amount: state.amount });   // pauses here\n  return { approved: ok };\n}\nconst desk = graph.compile({ checkpointer: notebook });\nawait desk.invoke(loan, { configurable: { thread_id: \'loan-17\' } });</pre><p>Without a checkpointer there is nowhere to keep a paused flow.</p>',
  render: function (r, el, api) { V().humanDesk(r, el, api); },
  explain: function (r, m) { var d = (m && m.dec) || {}, right = r.cells.filter(function (c) { return d[c.id] && (d[c.id] === 'stop') === (c.y === 1); }).length; return {
    asked: 'Pause the flow at human_check, keep it in memory, and resume it with the person\'s answer.',
    steps: ['interrupt(...) stops the run inside human_check and hands its question out. The result of invoke has __interrupt__.',
            'The checkpointer (MemorySaver) keeps the card of every paused flow. The thread id says WHICH flow: cell-' + (r.cells[0] && r.cells[0].id) + ' and so on.',
            'invoke(new Command({ resume: answer }), config) wakes that thread. interrupt(...) now returns the answer, and the flow goes on to record and END.',
            Object.keys(d).length >= 5 ? 'Your answers matched the expert label on ' + right + ' of 5 cells.' : 'Decide all 5 to compare with the labels.'],
    trap: 'Putting an await before interrupt() in the browser: call interrupt() first in the station (LangGraph needs the station\'s setup there).',
    remember: 'Pause = interrupt + checkpointer + thread id. Resume = Command({ resume }).' }; }
};

/* ================= 5g: run a shift ================= */
var s5g = { id: '5g', name: 'Run a shift', kind: 'code', lang: 'js',
  goal: 'Send every validation cell through the finished line, like one shift. Count the shift from the logbook. Then try a separate low gate for poly cells.',
  task: [
    'Gap 1: the poly gate uses the same rule as 3g: at most 5% of poly defects below it. Type 5% as a fraction: 0.05',
    "Gap 2: the special gate is only for poly cells. Type 'poly' with quotes.",
    'Then find every defect that passed in the logbook on the right: tap each one.'
  ],
  code: [
'const { MemorySaver, Command } = LangGraph;',
'',
'// One shift: every validation cell. Paused flows are answered by `checker`.',
'async function runShift(graph, checker, name) {',
'  auditLog.length = 0;                                 // a fresh logbook',
'  for (const id of pg.cell_val) {',
"    const config = { configurable: { thread_id: name + '-' + id } };",
'    let out = await graph.invoke(pg.card(id), config);',
'    while (out.__interrupt__) {                         // paused at human_check',
'      const ask = out.__interrupt__[0].value;',
'      out = await graph.invoke(new Command({ resume: checker(ask) }), config);',
'    }',
'  }',
'  return pg.shiftReport(auditLog);                      // counted from the logbook rows',
'}',
'',
'// A PERFECT checker: the expert label answers. Real people are not perfect.',
"const perfect = (ask) => (pg.labelOf(ask.id) === 1 ? 'stop' : 'pass');",
'const shiftLine = buildLine(route, new MemorySaver());   // the finished line, with a fresh memory for this shift',
"const shift1 = await runShift(shiftLine, perfect, 'shift1');",
"const shift2 = await runShift(shiftLine, pg.rightNineInTen(perfect, 7), 'shift2');   // right 9 times in 10 (seeded)",
'',
'// Challenge (Step 4: poly cells let more defects pass): a separate low gate for poly cells',
"const polyDef = pBlend.filter((s, i) => yVal[i] === 1 && pg.kind_val[i] === 'poly').sort((a, b) => a - b);",
'const lowPoly = polyDef[Math.floor(____ * polyDef.length)];',
'function routePoly(state) {',
'  const lo = state.kind === ____ ? lowPoly : low;',
"  let lane = 'person';",
"  if (state.p < lo) lane = 'pass';",
"  else if (state.p >= high) lane = 'stop';",
"  return { lane, log: ['route: ' + lane] };",
'}',
"const shift3 = await runShift(buildLine(routePoly, new MemorySaver()), perfect, 'shift3');",
"console.log('per 1,000 cells  pass / person / stop:', [shift1, shift3].map((s) => [s.per1000.pass, s.per1000.person, s.per1000.stop].map(Math.round).join(' / ')).join('   then with the poly gate: '));"
  ].join('\n'),
  twin: [
'def run_shift(graph, checker, name):',
'    audit_log.clear()',
'    for cid in val_ids:',
"        config = {'configurable': {'thread_id': f'{name}-{cid}'}}",
'        out = graph.invoke(card(cid), config)',
"        while '__interrupt__' in out:               # paused at human_check",
"            ask = out['__interrupt__'][0].value",
'            out = graph.invoke(Command(resume=checker(ask)), config)',
'    return shift_report(audit_log)',
'',
"perfect = lambda ask: 'stop' if label_of(ask['id']) == 1 else 'pass'",
"shift_line = build_line(route, MemorySaver())",
"shift1 = run_shift(shift_line, perfect, 'shift1')",
"shift2 = run_shift(shift_line, right_nine_in_ten(perfect, 7), 'shift2')",
'',
"poly_def = np.sort(p_blend[(y_val == 1) & (kind_v == 'poly')])",
'low_poly = poly_def[int(np.floor(0.05 * len(poly_def)))]',
'def route_poly(state: Cell) -> dict:',
"    lo = low_poly if state['kind'] == 'poly' else low",
"    lane = 'pass' if state['p'] < lo else 'stop' if state['p'] >= high else 'person'",
"    return {'lane': lane, 'log': ['route: ' + lane]}",
"shift3 = run_shift(build_line(route_poly, MemorySaver()), perfect, 'shift3')"
  ].join('\n'),
  probe: async function (NS, pg) {
    needLG(); need(NS, ['line', 'buildLine', 'auditLog'], 'Run 5f first: the shift uses the finished line'); needGates(NS);
    if (!NS.shift1 || !NS.shift2 || !NS.shift3 || typeof NS.routePoly !== 'function') return { missing: ['shift1', 'shift2', 'shift3', 'routePoly'] };
    var s = NS.pBlend, y = pg.y_val, k = pg.kind_val;
    var pd = s.filter(function (v, i) { return y[i] === 1 && k[i] === 'poly'; }).sort(function (a, b) { return a - b; }), refLow = pd[Math.floor(0.05 * pd.length)];
    var bad = { mono: 0, poly: 0 };
    for (var i = 0; i < s.length; i++) { var lo = k[i] === 'poly' ? refLow : NS.low, want = pg.laneOf(s[i], lo, NS.high), got = (NS.routePoly({ p: s[i], kind: k[i] }) || {}).lane; if (got !== want) bad[k[i]]++; }
    function slim(R) { return { n: R.n, lanes: R.lanes, per1000: R.per1000, reshoots: R.reshoots, all: R.all, mono: R.mono, poly: R.poly, escapes: R.escapes, rows: R.rows }; }
    return { lowPoly: NS.lowPoly, refLow: refLow, nPolyDef: pd.length, bad: bad, low: NS.low, high: NS.high, s1: slim(NS.shift1), s2: slim(NS.shift2), s3: slim(NS.shift3) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.lowPoly == null || isNaN(r.lowPoly)) return { pass: false, msg: 'lowPoly is empty: the list position is past the end. Write 5% as a fraction of 1.' };
    if (Math.abs(r.lowPoly - r.refLow) > 1e-12) { return { pass: false, msg: 'Your poly gate is ' + f3(r.lowPoly) + '. With the 5% rule on the ' + r.nPolyDef + ' poly defects it is ' + f3(r.refLow) + '. Write 5% as a fraction: 0.05.' }; }
    if (r.bad.mono || r.bad.poly) return { pass: false, msg: 'routePoly picks the wrong lane for ' + r.bad.mono + ' mono and ' + r.bad.poly + ' poly cells. The special gate is for poly cells only: \'poly\'.' };
    var a = r.s1.poly, b = r.s3.poly;
    return { pass: true, msg: 'Shift done: ' + r.s1.n + ' cells. Poly defects passed: ' + a.defPassed + ' of ' + a.def + ' → ' + b.defPassed + ' of ' + b.def + ' with the poly gate; cells to a person: ' + r.s1.lanes.person + ' → ' + r.s3.lanes.person + '.' };
  },
  mechNeed: function (m) { var n = (m && m.found) || 0, need = m && m.need; return need != null && n >= need ? null : 'tap every defect that passed in the logbook on the right' + (need != null ? ' (' + n + ' of ' + need + ' found)' : ''); },
  example: '<p>A school has a day class and a night class. The night class gets its own pass mark, with the same rule (the bottom 10% of its scores):</p><pre>const night = scores.filter((s, i) => cls[i] === \'night\').sort((a, b) => a - b);\nconst markNight = night[Math.floor(0.1 * night.length)];\nconst mark = (st) => (st.cls === \'night\' ? markNight : markDay);</pre>',
  render: function (r, el, api) { V().shiftBoard(r, el, api); },
  endCard: function (box, api) { V().endCard5(box, api); },
  explain: function (r) { var a = r.s1, b = r.s2, c = r.s3, ap = a.poly, cp = c.poly; return {
    asked: 'Run the whole validation tray through the finished line, count it from the logbook, and test a separate poly gate.',
    steps: ['Each cell runs in its own thread. When a flow pauses at human_check, the checker answers and Command({ resume }) wakes it.',
            'Perfect checker (the label answers): defects passed ' + a.all.defPassed + ' of ' + a.all.def + ', good cells stopped ' + a.all.goodStopped + ' of ' + a.all.good + ', ' + n0(a.per1000.person) + ' person checks per 1,000 cells.',
            'Checker right 9 in 10: defects passed ' + b.all.defPassed + ', good cells stopped ' + b.all.goodStopped + ' (' + b.all.personWrong + ' wrong person answers).',
            'Poly gate ' + f3(r.lowPoly) + ' (vs ' + f3(r.low) + '): poly defects passed ' + ap.defPassed + ' of ' + ap.def + ' → ' + cp.defPassed + ' of ' + cp.def + '; poly cells to a person ' + pc(ap.person / ap.n, 0) + ' → ' + pc(cp.person / cp.n, 0) + '.',
            'The gate was tuned on these same validation cells, so the gain is an upper bound. Step 8 measures it on the sealed test tray.'],
    trap: 'Reading the perfect-checker numbers as the real line. Real people get tired and make mistakes.',
    remember: 'The flow guarantees the routing. The quality still depends on the scores and the people.' }; }
};

s5d.predict.render = function (body, api, pr, lock, whyBox) { V().lanesPredict(body, api, pr, lock, whyBox, s5d.predict); };

var step5 = { id: 5, title: 'Wire the inspection flow with LangGraph', short: 'state, stations, fork, loop cap, human pause, shift',
  story: 'You have scores and two gates. Now wire the real line: every cell is checked, scored, routed, and recorded — and unsure cells really wait for a person. LangGraph is the wiring; the talking AI agents come in Step 6.',
  substeps: [s5a, s5b, s5c, s5d, s5e, s5f, s5g] };

var REF5 = { '5b': ['concat', '[]'], '5c': ['p', "'score'"], '5d': ['high', "'human_check'"], '5e': ['2', "'human_check'"], '5f': ['memory', 'resume'], '5g': ['0.05', "'poly'"] };
step5.substeps.forEach(function (s) { if (REF5[s.id]) s.ref = REF5[s.id]; if (s.kind === 'code') { s.twinTitle = 'Same thing in Python LangGraph'; s.twinNote = 'read-only · langgraph 1.2'; s.edLabel = 'JavaScript · LangGraph'; } });

/* where each notebook name is made: a missing name gives a plain "run X first" message */
G.PG_NAME_FROM = Object.assign(G.PG_NAME_FROM || {}, { X: '3a', xVal: '3a', yVal: '3a', model: '3c', pBlend: '3f', pCnn: '3f', low: '3g', high: '3g', gradCam: '4c',
  Cell: '5b', photoProblem: '5c', checkPhoto: '5c', score: '5c', route: '5d', byLane: '5d', humanCheck: '5d', record: '5d', auditLog: '5d',
  reshoot: '5e', afterCheck: '5e', buildLine: '5f', memory: '5f', line: '5f', decide: '5f' });
G.PG_STEP5 = step5;
var prevExtra = G.PG_PG_EXTRA;
G.PG_PG_EXTRA = function (pg) { var o = prevExtra ? prevExtra(pg) : {}; return Object.assign(o, extra(pg)); };
G.PG_STEP5_RULE = { DARK: DARK, BLANK: BLANK, FLAT: FLAT, FAULTS: FAULTS, DEAD: DEAD, photoStats: photoStats, problemOf: problemOf };
if (G.PG_STEPS) { var i5 = G.PG_STEPS.findIndex(function (s) { return s.id === 5; }); if (i5 >= 0) G.PG_STEPS[i5] = step5; }
})(typeof window !== 'undefined' ? window : globalThis);
