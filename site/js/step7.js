/* PanelGuard — Step 7 content: the operator console. The student writes a real console (HTML + CSS + JavaScript, no library),
   cell by cell, in the JS notebook. It is driven by the student's own Step 3 model (scored LIVE in the flow), the Step 5
   LangGraph line (routePoly gates, human pause) and the Step 6 crew (report + checker). Validation tray only.
   Every number shown is measured or counted in the browser; nothing is hard-coded. */
(function (G) {
'use strict';
var V = function () { return G.PGViz7; };
var J = function () { return G.PGJS; };
function CE(m) { return J().CheckError(m); }
function need(NS, list, msg) { var m = list.filter(function (k) { return !(k in NS); }); if (m.length) throw CE(msg + ' (missing: ' + m.join(', ') + ').'); }
function errMsg(e) { return String(e && e.message || e).split('\n')[0]; }
function r1(x) { return Math.round(10 * x) / 10; }
function L(a) { return a.join('\n'); }
function hasDoc() { return typeof document !== 'undefined' && document.createElement; }

/* ---------- pg helpers for Step 7 ---------- */
var SCREENS = G.PG7_SCREENS || (G.PG7_SCREENS = {});
var KEYH = null, keysOn = false;
function unitFor(w, h) { return Math.max(7, Math.min(30, Math.min(w / 64, (h || 1e9) / 36))); }
function sizeHost(host) { if (host.dataset.fixed) return; var w = host.clientWidth || 460; host.style.setProperty('--u', Math.max(9, Math.min(30, w / 32)).toFixed(2) + 'px'); }
function extra(pg) {
  function screen(id) {
    var host = SCREENS[id];
    if (!host && hasDoc()) { host = document.createElement('div'); host.className = 'hmi-host'; host.setAttribute('data-screen', id); SCREENS[id] = host;
      if (G.ResizeObserver) new G.ResizeObserver(function () { sizeHost(host); }).observe(host); }
    if (host) { host.innerHTML = ''; sizeHost(host); }
    return host;
  }
  /* ONE keyboard handler for the whole page: a re-run replaces it, it never adds a second one. Keys typed in the code editor are ignored. */
  function keys(fn) {
    KEYH = fn;
    if (!keysOn && hasDoc()) { keysOn = true; document.addEventListener('keydown', function (e) {
      var t = e.target; if (t && t.closest && t.closest('textarea, input, select, [contenteditable]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (KEYH && KEYH(String(e.key || '').toLowerCase(), e) === true) e.preventDefault(); }); }
  }
  return { screen: screen, keys: keys, keysNow: function () { return KEYH; }, hmiUnit: unitFor };
}

/* a hidden 1920 x 1080 screen to MEASURE the real layout (font sizes, what is biggest) */
var MM_PER_PX = 527 / 1920;          // a 24-inch Full HD monitor: 527 mm wide, 1920 px
var CAP_2M = 2000 * Math.tan(20 / 60 * Math.PI / 180);   // 20 arc-minutes at 2 m = 11.6 mm letter height
function measureHost(build) {
  if (!hasDoc()) return null;
  var host = document.createElement('div'); host.className = 'hmi-host';
  host.style.cssText = 'position:fixed;left:-30000px;top:0;width:1920px;height:1080px;overflow:hidden;--u:' + unitFor(1920, 1080) + 'px';
  document.body.appendChild(host);
  try {
    build(host);
    var lamp = host.querySelector('.lamp .word'), lampPx = lamp ? parseFloat(getComputedStyle(lamp).fontSize) : 0, others = [];
    host.querySelectorAll('*').forEach(function (e) {
      if (lamp && (e === lamp || lamp.contains(e) || e.contains(lamp))) return;
      if (e.closest('[hidden]') || !e.childNodes.length) return;
      var own = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (own) others.push([parseFloat(getComputedStyle(e).fontSize), (e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ': ' + e.textContent.trim().slice(0, 24)]);
    });
    others.sort(function (a, b) { return b[0] - a[0]; });
    var cap = 0.7 * lampPx * MM_PER_PX;
    return { lampPx: r1(lampPx), next: others[0] ? { px: r1(others[0][0]), what: others[0][1] } : null, capMm: r1(cap), metres: r1(2 * cap / CAP_2M), needMm: r1(CAP_2M),
      shapes: host.querySelectorAll('.lamp .shape').length, words: host.querySelectorAll('.lamp .word').length };
  } finally { host.remove(); }
}

/* ---------- shared checks ---------- */
function needFlow(NS) {
  need(NS, ['model', 'bestW', 'pSvc', 'pBlend'], 'Run 3f first: the console scores photos with your Step 3 model and the 3f blend');
  need(NS, ['Cell', 'checkPhoto', 'reshoot', 'afterCheck', 'byLane', 'humanCheck', 'routePoly', 'auditLog'], 'Run 5g first: the console runs your Step 5 flow (with the poly gate)');
}
function need7b(NS) { need(NS, ['LAMPS', 'lampOf', 'decideCell', 'consoleLine', 'cellView', 'html', 'useStyle', 'drawPhoto', 'consoleLog'], 'Run 7b first: the console needs its cell view and lamp'); }
function need7c(NS) { need(NS, ['counts', 'onResult', 'runBelt', 'belt', 'times', 'speedReport', 'countersView'], 'Run 7c first: the console needs its counters and the line runner'); }
function need7d(NS) { need(NS, ['queue', 'toQueue', 'answer', 'answers', 'KEYS', 'queueView', 'checkerRate'], 'Run 7d first: the console needs the person\'s queue'); }
function need7e(NS) { need(NS, ['shiftBoard', 'drawBoard'], 'Run 7e first: the console needs the shift board'); }
function need7f(NS) { need(NS, ['makeReport', 'reportView'], 'Run 7f first: the console needs the report button'); }
/* cells of each lane from the Step 5 logbook, away from the gates (a live score can differ from the 3f score in the 7th digit) */
function laneCells(NS, k) {
  var pick = { pass: [], person: [], stop: [] }, lo = NS.low, hi = NS.high, lp = NS.lowPoly;
  NS.auditLog.forEach(function (r) {
    var g = [r.kind === 'poly' ? lp : lo, hi].map(function (x) { return Math.abs(r.p - x); });
    if (pick[r.lane] && pick[r.lane].length < k && (r.tries || 1) === 1 && Math.min.apply(null, g) > 1e-3) pick[r.lane].push(r.id);
  });
  return pick;
}
function snapCounts(NS) { return { c: JSON.parse(JSON.stringify(NS.counts)), t: NS.times.length, q: NS.queue ? NS.queue.slice() : null, a: NS.answers ? NS.answers.length : 0, log: NS.consoleLog.length }; }
function restoreCounts(NS, s) { Object.keys(NS.counts).forEach(function (k) { delete NS.counts[k]; }); Object.assign(NS.counts, s.c); NS.times.length = s.t;
  if (s.q && NS.queue) { NS.queue.length = 0; s.q.forEach(function (x) { NS.queue.push(x); }); } if (NS.answers) NS.answers.length = s.a; NS.consoleLog.length = s.log; }

/* ================= 7a: sketch the screen (no code) ================= */
var s7a = { id: '7a', name: 'Sketch the screen', kind: 'scene', scene: 'sketch',
  goal: 'The operator has about 2 seconds per cell. Before any code: sketch the screen. Drag each block into the frame. The rules check every move.',
  needText: 'put all 7 blocks in a place the rules accept, then look at the sketch from 2 metres' };

/* ================= 7b: show one cell ================= */
var s7b = { id: '7b', name: 'Show one cell', kind: 'code', lang: 'js',
  goal: 'Code the cell view: the photo on a canvas and the verdict lamp, fed by one real run of your LangGraph flow. The flow now scores the photo LIVE with your Step 3 model.',
  task: [
    'Gap 1: the lamp follows the lane the flow wrote on the card. Type the field name: lane',
    'Gap 2: the safe default when the answer is unknown, missing or broken. Type: LAMPS.none',
    'Then look at the preview with the “No colour” and “From 2 m” switches.'
  ],
  code: L([
"// THE CONSOLE, part 1: one cell on screen. Plain HTML + CSS + JavaScript, no library.",
"const { StateGraph, START, END, MemorySaver } = LangGraph;",
"",
"// 1. The verdict lamp: word + shape + colour. Never colour alone.",
"const LAMPS = {",
"  pass:   { key: 'pass',   word: 'PASS',       shape: 'circle' },",
"  person: { key: 'person', word: 'CHECK',      shape: 'triangle' },",
"  stop:   { key: 'stop',   word: 'STOP',       shape: 'square' },",
"  none:   { key: 'none',   word: 'NO VERDICT', shape: 'ring' },     // the safe default",
"};",
"function lampOf(out) {                                  // out = what the flow gave back for one cell",
"  if (out && out.__interrupt__) return LAMPS.person;    // paused at human_check: a person decides",
"  const lamp = out && !out.error ? LAMPS[out.____] : null;",
"  return lamp || ____;                                  // unknown, missing or broken",
"}",
"",
"// 2. The flow behind the screen: your Step 5 line, but the score comes LIVE from your Step 3 model",
"function liveScore(state) {",
"  if (!model) throw new Error('model not loaded');",
"  const cnn = tf.tidy(() => model.predict(tf.tensor(state.photo, [1, 64, 64, 1], 'float32').div(255)).dataSync()[0]);",
"  const p = bestW * cnn + (1 - bestW) * pSvc[pg.valIndex(state.id)];     // the same blend as 3f",
"  return { p, log: ['score (live): ' + p.toFixed(3)] };",
"}",
"const consoleLog = [];                                   // the console's own logbook",
"function logRow(state) {",
"  const decision = state.decision || state.lane;",
"  consoleLog.push({ id: state.id, kind: state.kind, p: state.p, lane: state.lane, decision, tries: state.tries });",
"  return { decision, log: ['record: ' + decision] };",
"}",
"const consoleLine = new StateGraph(Cell)",
"  .addNode('check_photo', checkPhoto).addNode('reshoot', reshoot).addNode('score', liveScore)",
"  .addNode('route', routePoly).addNode('human_check', humanCheck).addNode('record', logRow)",
"  .addEdge(START, 'check_photo')",
"  .addConditionalEdges('check_photo', afterCheck, ['score', 'reshoot', 'human_check'])",
"  .addEdge('reshoot', 'check_photo').addEdge('score', 'route')",
"  .addConditionalEdges('route', byLane, { pass: 'record', person: 'human_check', stop: 'record' })",
"  .addEdge('human_check', 'record').addEdge('record', END)",
"  .compile({ checkpointer: new MemorySaver() });",
"",
"let threadNo = 0;",
"async function decideCell(card) {                       // ONE real decision, timed",
"  const config = { configurable: { thread_id: 'console-' + card.id + '-' + (++threadNo) } };",
"  const t0 = performance.now();",
"  let out;",
"  try { out = await consoleLine.invoke(card, config); }",
"  catch (e) { out = { error: String((e && e.message) || e) }; }     // a broken flow is a result too",
"  return { card, config, out, lamp: lampOf(out), ms: performance.now() - t0 };",
"}",
"",
"// 3. The screen part: HTML from a string, CSS in one style tag per part",
"function html(s) { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; }",
"function useStyle(name, css) {",
"  const old = document.getElementById('hmi-css-' + name);",
"  const tag = old || document.head.appendChild(document.createElement('style'));",
"  tag.id = 'hmi-css-' + name; tag.textContent = css;",
"}",
"const SHAPES = {",
"  circle: `<circle cx='50' cy='50' r='44'/>`, triangle: `<path d='M50 6 L96 92 H4 Z'/>`,",
"  square: `<rect x='8' y='8' width='84' height='84'/>`, ring: `<circle cx='50' cy='50' r='40' stroke-dasharray='14 10'/>`,",
"};",
"const shapeSVG = (lamp) => `<svg class='shape' data-shape='${lamp.shape}' viewBox='0 0 100 100'>${SHAPES[lamp.shape]}</svg>`;",
"const lampHTML = (lamp) => `<div class='lamp' data-key='${lamp.key}'>${shapeSVG(lamp)}<b class='word'>${lamp.word}</b></div>`;",
"function drawPhoto(canvas, photo, cam) {                // 64 x 64 grey photo; cam = optional 16 x 16 heat map",
"  const g = canvas.getContext('2d');",
"  g.fillStyle = '#000'; g.fillRect(0, 0, canvas.width, canvas.height);",
"  if (!photo || photo.length !== 4096) {                // no photo data: say so, never guess",
"    g.fillStyle = '#9aa6b6'; g.font = `bold ${canvas.width / 9}px Arial`; g.textAlign = 'center';",
"    g.fillText('NO PHOTO', canvas.width / 2, canvas.height / 2); return;",
"  }",
"  const small = document.createElement('canvas'); small.width = small.height = 64;",
"  const img = small.getContext('2d').createImageData(64, 64);",
"  photo.forEach((v, i) => img.data.set([v, v, v, 255], 4 * i));",
"  small.getContext('2d').putImageData(img, 0, 0);",
"  g.imageSmoothingEnabled = false; g.drawImage(small, 0, 0, canvas.width, canvas.height);",
"  if (cam) {",
"    const top = Math.max(...cam) || 1, s = canvas.width / 16;",
"    cam.forEach((v, i) => { g.fillStyle = `rgba(255, 110, 0, ${(0.65 * Math.max(0, v) / top).toFixed(2)})`; g.fillRect((i % 16) * s, Math.floor(i / 16) * s, s, s); });",
"  }",
"}",
"function cellView(host) {",
"  const el = html(`<div class='hmi cellview'><canvas class='photo' width='256' height='256'></canvas><div class='lampbox'></div><div class='meta'></div></div>`);",
"  host.appendChild(el);",
"  function show(r) {                                     // r = one decision from decideCell",
"    drawPhoto(el.querySelector('.photo'), r.card.photo);",
"    el.querySelector('.lampbox').innerHTML = lampHTML(r.lamp);",
"    const why = r.out && r.out.error ? 'fault: ' + r.out.error : r.out && r.out.problem ? 'photo: ' + r.out.problem : '';",
"    el.querySelector('.meta').textContent = 'cell ' + r.card.id + ' · ' + (r.card.kind || '?') + (why ? ' · ' + why : '');",
"  }",
"  return { el, show };",
"}",
"useStyle('cell', `",
"  .hmi { --pass: #2ee07a; --check: #ffb21e; --stop: #ff5050; --none: #a3afbf; font-size: var(--u, 12px);",
"         color: #e9eff6; font-family: Rajdhani, Segoe UI, Arial, sans-serif; }",
"  .hmi * { box-sizing: border-box; }",
"  .hmi [data-key=pass] { color: var(--pass); }  .hmi [data-key=person] { color: var(--check); }",
"  .hmi [data-key=stop] { color: var(--stop); }  .hmi [data-key=none] { color: var(--none); }",
"  .hmi .shape { width: 1em; height: 1em; fill: currentColor; stroke: currentColor; stroke-width: 6; flex: none; }",
"  .hmi [data-key=none] .shape { fill: none; stroke-width: 9; }",
"  .cellview { display: grid; grid-template-columns: auto 1fr; gap: .8em; padding: .8em; background: #0e141b; border: 1px solid #263240; border-radius: .5em; }",
"  .cellview .photo { width: 13em; height: 13em; image-rendering: pixelated; border: 1px solid #33414f; }",
"  .lamp { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3em; height: 100%; min-height: 13em;",
"          border: .3em solid currentColor; border-radius: .5em; background: #0a0f15; padding: .4em; }",
"  .lamp[data-key=none] { border-style: dashed; }",
"  .lamp .shape { font-size: 4.6em; }",
"  .lamp .word { font-size: 4.2em; line-height: 1; font-weight: 700; letter-spacing: .03em; text-align: center; }",
"  .cellview .meta { grid-column: 1 / 3; font-size: 1.15em; color: #c3cdd9; font-family: Space Mono, Consolas, monospace; }",
"  .hmi button { font: inherit; font-weight: 700; color: #e9eff6; background: #1a2430; border: 2px solid #3a4a5c; border-radius: .4em;",
"                padding: .35em .9em; cursor: pointer; }",
"  .hmi button:hover:not(:disabled) { background: #22303f; }",
"  .hmi button.big { font-size: 1.4em; min-height: 2.3em; }",
"  .hmi button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }",
"  .hmi kbd { font: 700 .6em Space Mono, Consolas, monospace; color: #e9eff6; border: 1px solid #7d8ca0; border-bottom-width: 3px;",
"             border-radius: .3em; padding: .05em .4em; margin-left: .5em; vertical-align: middle; }",
"`);",
"",
"// 4. One real cell through the real flow, on screen (live preview on the right)",
"const view1 = cellView(pg.screen('7b'));",
"const oneCell = await decideCell(pg.card(pg.cell_val[0]));",
"view1.show(oneCell);",
"console.log('cell ' + oneCell.card.id + ' -> ' + oneCell.lamp.word + ' in ' + oneCell.ms.toFixed(0) + ' ms');"
  ]),
  twin: L([
"import gradio as gr                    # gradio 6.32.0 \u2014 the whole app: tools/research/step7_gradio_app.py",
"LAMPS = {'pass': ('PASS', 'circle', '#2ee07a'), 'person': ('CHECK', 'triangle', '#ffb21e'),",
"         'stop': ('STOP', 'square', '#ff5050'), 'none': ('NO VERDICT', 'ring', '#a3afbf')}",
"",
"def lamp_of(out):",
"    if out and '__interrupt__' in out: return 'person'            # paused: a person decides",
"    lane = out.get('lane') if out and 'error' not in out else None",
"    return lane if lane in ('pass', 'person', 'stop') else 'none'  # unknown, missing or broken",
"",
"def live_score(state):                     # the Keras model looks at THIS photo now",
"    if STATE['model'] is None: raise RuntimeError('model not loaded')",
"    x = np.asarray(state['photo'], dtype='float32').reshape(1, 64, 64, 1) / 255.0",
"    cnn = float(STATE['model'](x, training=False).numpy()[0, 0])",
"    p = best_w * cnn + (1 - best_w) * float(p_svc[VAL[state['id']]])",
"    return {'p': p, 'log': [f'score (live): {p:.3f}']}",
"# console_line = the Step 5 StateGraph with live_score as 'score', route_poly, log_row",
"",
"n_thread = [0]                             # a new thread id for every decision",
"def decide_cell(c):                        # ONE real decision, timed",
"    n_thread[0] += 1; config = {'configurable': {'thread_id': f\"console-{c['id']}-{n_thread[0]}\"}}",
"    t0 = time.perf_counter()",
"    try: out = console_line.invoke(c, config)",
"    except Exception as e: out = {'error': str(e)}",
"    return {'card': c, 'config': config, 'out': out, 'lamp': lamp_of(out), 'ms': 1000 * (time.perf_counter() - t0)}",
"",
"with gr.Blocks(title='PanelGuard \u00b7 operator console') as demo:",
"    with gr.Row():",
"        photo = gr.Image(type='numpy', height=300, interactive=False, show_label=False)",
"        lamp = gr.HTML(lamp_html('none'))        # word + SVG shape, coloured by the lamp key",
"# smoke test (real run): F1 -> CHECK; {}, None, {'error'}, {'lane': 'banana'} -> NO VERDICT"
  ]),
  probe: async function (NS, pg) {
    needFlow(NS);
    if (!NS.lampOf || !NS.decideCell || !NS.LAMPS || !NS.cellView) return { missing: ['LAMPS', 'lampOf', 'decideCell', 'cellView'].filter(function (k) { return !NS[k]; }) };
    var pick = laneCells(NS, 2), real = [], n0 = NS.consoleLog.length;
    for (var lane in pick) for (var i = 0; i < pick[lane].length; i++) {
      var id = pick[lane][i], r = await NS.decideCell(pg.card(id));
      real.push({ id: id, lane: lane, word: r.lamp ? r.lamp.word : String(r.lamp), p: r.out && r.out.p, ref: NS.pBlend[pg.valIndex(id)], ms: r.ms, err: r.out && r.out.error || null });
    }
    var F1 = await NS.decideCell(pg.card('F1'));
    var odd = [['nothing came back', undefined], ['an empty answer {}', {}], ["a flow error {error: 'camera PC lost'}", { error: 'camera PC lost' }], ["an unknown lane {lane: 'banana'}", { lane: 'banana' }]].map(function (x) {
      var w; try { var l = NS.lampOf(x[1]); w = l && l.word; } catch (e) { w = 'ERROR ' + errMsg(e); } return { what: x[0], word: w };
    });
    NS.consoleLog.length = n0;
    var words = Object.keys(NS.LAMPS).map(function (k) { return NS.LAMPS[k].word; }), shapes = Object.keys(NS.LAMPS).map(function (k) { return NS.LAMPS[k].shape; });
    var meas = measureHost(function (host) { NS.cellView(host).show(real[0] ? { card: pg.card(real[0].id), out: {}, lamp: NS.LAMPS.none } : F1); });
    var diff = Math.max.apply(null, real.map(function (x) { return x.p == null ? 0 : Math.abs(x.p - x.ref); }));
    return { real: real, fault: { word: F1.lamp && F1.lamp.word, problem: F1.out && F1.out.problem, paused: !!(F1.out && F1.out.__interrupt__) }, odd: odd, meas: meas, maxDiff: diff,
      distinct: new Set(words).size === 4 && new Set(shapes).size === 4, one: NS.oneCell ? { id: NS.oneCell.card.id, word: NS.oneCell.lamp.word, ms: NS.oneCell.ms } : null };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    var WANT = { pass: 'PASS', person: 'CHECK', stop: 'STOP' };
    var bad = r.real.filter(function (x) { return x.word !== WANT[x.lane]; })[0];
    if (bad && bad.err) return { pass: false, msg: 'The flow failed on cell ' + bad.id + ': ' + bad.err + '.' };
    if (bad) return { pass: false, msg: 'Cell ' + bad.id + ' is in the ' + bad.lane + ' lane, but the lamp showed ' + bad.word + '. Look the lamp up by the lane the flow wrote: out.lane (gap 1: lane).' };
    var o = r.odd.filter(function (x) { return x.word !== 'NO VERDICT'; })[0];
    if (o) return { pass: false, msg: 'For ' + o.what + ' the lamp showed ' + o.word + '. ' + (o.word === 'PASS' ? 'Never show PASS when something is unknown: a defect could go out. ' : o.word === 'CHECK' ? 'CHECK hides that something broke. ' : '') + 'The safe default is NO VERDICT: type LAMPS.none.' };
    if (r.fault.word !== 'CHECK') return { pass: false, msg: 'The spoiled photo F1 (' + r.fault.problem + ') showed ' + r.fault.word + '. It paused for a person: it must show CHECK.' };
    if (!r.distinct) return { pass: false, msg: 'Two lamps share a word or a shape. Each lamp needs its own word AND shape, so it reads without colour.' };
    if (r.meas && r.meas.next && r.meas.lampPx <= r.meas.next.px) return { pass: false, msg: 'The lamp word is ' + r.meas.lampPx + ' px, but “' + r.meas.next.what + '” is ' + r.meas.next.px + ' px. The verdict must be the biggest thing on screen.' };
    return { pass: true, msg: 'Lamp right for ' + r.real.length + ' real cells (pass, check and stop lanes), CHECK for the spoiled photo, NO VERDICT for all ' + r.odd.length + ' broken answers.' + (r.meas ? ' Measured on a 1920×1080 screen: lamp word ' + r.meas.lampPx + ' px — readable from about ' + r.meas.metres + ' m.' : '') };
  },
  mechNeed: function (m) { var v = m.views || {}; return v.gray && v.far ? null : 'look at the preview with ' + (!v.gray ? '“No colour”' : '') + (!v.gray && !v.far ? ' and ' : '') + (!v.far ? '“From 2 m”' : ''); },
  example: '<p>A parcel scanner shows one word per box. The same idea, other values:</p><pre>const SIGNS = { ok: { word: \'SHIP\' }, hold: { word: \'HOLD\' }, none: { word: \'NO READ\' } };\nfunction signOf(scan) {\n  const s = scan && !scan.error ? SIGNS[scan.status] : null;\n  return s || SIGNS.none;          // a failed scan never says SHIP\n}\nsignOf({ status: \'ok\' });         // SHIP\nsignOf({ error: \'no label\' });     // NO READ</pre><p>The lookup uses the field the machine writes. Anything else falls to the safe sign.</p>',
  render: function (r, el, api) { V().cellPreview(r, el, api); },
  explain: function (r) { return {
    asked: 'Turn what the flow gives back into one lamp: PASS, CHECK, STOP — or NO VERDICT when anything is unknown.',
    steps: ['decideCell sends one real card through your Step 5 flow. The score station now runs your Step 3 model on the photo, live (largest difference to the 3f score: ' + (r.maxDiff < 1e-4 ? 'below 0.0001' : r.maxDiff.toFixed(5)) + ').',
            'A paused flow (it came back with __interrupt__) means a person decides → CHECK. Else the lamp is LAMPS[out.lane].',
            'Every other answer — nothing, {}, an error, a lane the screen does not know — finds no lamp, so lampOf returns LAMPS.none: NO VERDICT.',
            r.meas ? 'Measured on a 1920×1080 screen (24 inch): the lamp word is ' + r.meas.lampPx + ' px = ' + r.meas.capMm + ' mm letters. From 2 m you need about ' + r.meas.needMm + ' mm, so it reads from about ' + r.meas.metres + ' m.' : 'The lamp word is the biggest text on the screen.'],
    trap: 'Writing “if (lane === \'pass\') PASS else STOP”. Then a broken answer shows STOP or PASS. List what you know; everything else is NO VERDICT.',
    remember: 'Unknown is never PASS: it is NO VERDICT, and a person looks.' }; }
};

/* ================= 7c: run the line ================= */
var s7c = { id: '7c', name: 'Run the line', kind: 'code', lang: 'js',
  goal: 'Cells now arrive one by one from the validation tray, through the real flow. Code the counters, then run 30 real cells with Start / Stop. The clock measures how long one real decision takes in this browser.',
  task: [
    'Gap 1: count each cell under its lamp. Type the lamp\'s field that names its counter: key',
    'Then turn the line-speed knob, press Start, and run 30 real cells (Stop any time).'
  ],
  code: L([
"// THE CONSOLE, part 2: counters + the line runner",
"const counts = { pass: 0, person: 0, stop: 0, none: 0, total: 0, byPerson: 0 };",
"const times = [];                                       // ms of every real decision",
"function onResult(r) {                                  // called ONCE for every cell that arrives",
"  counts[r.lamp.____] += 1;",
"  counts.total += 1;",
"  times.push(r.ms);",
"}",
"",
"const belt = { running: false, perMinute: 30 };         // the knob sets perMinute (30 = one cell every 2 s)",
"const wait = (ms) => new Promise((done) => setTimeout(done, ms));",
"let nextCell = 0;                                       // the validation tray, in order",
"async function runBelt(n, onCell = onResult) {",
"  belt.running = true;",
"  for (let k = 0; k < n && belt.running; k++) {",
"    const id = pg.cell_val[nextCell++ % pg.cell_val.length];",
"    const r = await decideCell(pg.card(id));",
"    onCell(r);",
"    await wait(Math.max(0, 60000 / belt.perMinute - r.ms));      // keep the line speed",
"  }",
"  belt.running = false;",
"}",
"function speedReport() {                                // measured, not guessed",
"  const t = [...times].sort((a, b) => a - b), at = (f) => t[Math.min(t.length - 1, Math.floor(f * t.length))];",
"  return { cells: t.length, medianMs: at(0.5), slowMs: at(0.95), maxPerMinute: Math.floor(60000 / at(0.95)) };",
"}",
"",
"function countersView(host) {",
"  const el = html(`<div class='hmi counters'></div>`);",
"  host.appendChild(el);",
"  function update() {",
"    el.innerHTML = ['pass', 'person', 'stop', 'none'].map((k) =>",
"      `<div class='ctr' data-key='${k}'>${shapeSVG(LAMPS[k])}<span>${LAMPS[k].word}</span><b>${counts[k]}</b></div>`).join('') +",
"      `<div class='ctr all'><span>CELLS</span><b>${counts.total}</b></div><div class='ctr all'><span>BY PERSON</span><b>${counts.byPerson}</b></div>`;",
"  }",
"  update();",
"  return { el, update };",
"}",
"useStyle('counters', `",
"  .counters { display: flex; gap: .5em; flex-wrap: wrap; }",
"  .counters .ctr { display: flex; align-items: center; gap: .35em; padding: .3em .7em; background: #121a23; border: 1px solid #2b3846; border-radius: .4em; font-size: 1.15em; }",
"  .counters .ctr span { color: #c3cdd9; font-weight: 600; }",
"  .counters .ctr b { color: #fff; font-family: Space Mono, Consolas, monospace; min-width: 1.6em; text-align: right; }",
"  .counters .ctr.all { color: #c3cdd9; }",
"`);",
"",
"// A quick test run: 5 cells at full speed. The real line runs from the Start button on the right.",
"belt.perMinute = Infinity;",
"await runBelt(5);",
"belt.perMinute = 30;",
"console.log('counts after 5 cells:', JSON.stringify(counts));"
  ]),
  twin: L([
"def new_session():",
"    return {'counts': {'pass': 0, 'person': 0, 'stop': 0, 'none': 0, 'total': 0, 'byPerson': 0},",
"            'queue': [], 'answers': [], 'next': 0, 'times': [], 'shown_at': None}",
"",
"def on_result(S, r):                       # ONCE per arriving cell, under its lamp",
"    S['counts'][r['lamp']] += 1",
"    S['counts']['total'] += 1",
"    S['times'].append(r['ms'])",
"",
"def next_cell(S):                          # one cell from the validation tray",
"    S = S or new_session()",
"    r = decide_cell(card(val_ids[S['next'] % len(val_ids)])); S['next'] += 1",
"    on_result(S, r)",
"    return S, photo_img(r['card']['photo']), lamp_html(r['lamp']), counters_html(S)",
"",
"with gr.Blocks() as demo:",
"    S = gr.State(None)                     # one session per browser tab",
"    ...",
"    timer = gr.Timer(2.0, active=False)    # 2 s per cell = 30 cells per minute",
"    timer.tick(next_cell, S, [S, photo, lamp, counters], api_name='next_cell')",
"    start.click(lambda: gr.Timer(active=True), None, timer)",
"    halt.click(lambda: gr.Timer(active=False), None, timer)",
"# smoke test (the course's own test model, Keras on CPU): 30 real cells, median 18.6 ms per decision"
  ]),
  probe: async function (NS, pg) {
    needFlow(NS); need7b(NS);
    if (!NS.counts || !NS.onResult || !NS.runBelt || !NS.speedReport) return { missing: ['counts', 'onResult', 'runBelt', 'speedReport'].filter(function (k) { return !NS[k]; }) };
    var after = JSON.parse(JSON.stringify(NS.counts)), snap = snapCounts(NS), tests = [], err = null;
    try {
      [['a flow error', { card: { id: 'X', kind: 'mono' }, out: { error: 'test' }, lamp: NS.LAMPS.none, ms: 1 }], ['a CHECK cell', { card: { id: 'Y', kind: 'poly' }, out: { lane: 'person' }, lamp: NS.LAMPS.person, ms: 1 }]].forEach(function (x) {
        var b = JSON.parse(JSON.stringify(NS.counts)); NS.onResult(x[1]); var a = NS.counts;
        tests.push({ what: x[0], key: x[1].lamp.key, up: a[x[1].lamp.key] - b[x[1].lamp.key], total: a.total - b.total, nan: Object.keys(a).filter(function (k) { return typeof a[k] !== 'number' || isNaN(a[k]); }) });
      });
    } catch (e) { err = errMsg(e); }
    restoreCounts(NS, snap);
    var sum = ['pass', 'person', 'stop', 'none'].reduce(function (s, k) { return s + (after[k] || 0); }, 0);
    return { after: after, sum: sum, tests: tests, err: err, speed: NS.times.length ? NS.speedReport() : null, perMinute: NS.belt.perMinute };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.err) return { pass: false, msg: 'onResult stopped with an error while counting a cell. Count under the lamp\'s key: r.lamp.key.' };
    var nan = Object.keys(r.after).filter(function (k) { return typeof r.after[k] !== 'number' || isNaN(r.after[k]); });
    if (nan.length || r.sum !== r.after.total) { var odd = Object.keys(r.after).filter(function (k) { return ['pass', 'person', 'stop', 'none', 'total', 'byPerson'].indexOf(k) < 0; });
      return { pass: false, msg: 'After 5 cells the counters show PASS ' + (r.after.pass || 0) + ', CHECK ' + (r.after.person || 0) + ', STOP ' + (r.after.stop || 0) + ', NO VERDICT ' + (r.after.none || 0) + ' — together ' + r.sum + ', but ' + r.after.total + ' cells arrived.' + (odd.length ? ' The cells were counted under names that are not lamp counters (' + odd.map(function (k) { return '“' + k + '”'; }).join(', ') + ').' : '') + ' Each cell must go under its lamp\'s counter: type key.' }; }
    var t = r.tests.filter(function (x) { return x.up !== 1 || x.total !== 1 || x.nan.length; })[0];
    if (t) return { pass: false, msg: 'With ' + t.what + ' the “' + t.key + '” counter went up by ' + t.up + '. Every cell counts once under its own lamp: r.lamp.key.' };
    return { pass: true, msg: '5 real cells counted: ' + ['pass', 'person', 'stop', 'none'].map(function (k) { return k + ' ' + r.after[k]; }).join(', ') + '. A flow error counts as NO VERDICT. Median decision ' + (r.speed ? r.speed.medianMs.toFixed(0) + ' ms' : '?') + '.' };
  },
  mechNeed: function (m) { var n = m.ran || 0; if (!m.knob) return 'turn the line-speed knob'; return n >= 30 ? null : 'run 30 real cells with Start (' + n + ' of 30 so far)'; },
  example: '<p>A ticket gate counts people by the light they got:</p><pre>const tally = { green: 0, red: 0, total: 0 };\nfunction onPerson(p) {\n  tally[p.light.colour] += 1;   // under its own light\n  tally.total += 1;\n}\nonPerson({ light: { colour: \'red\' } });   // red 1, total 1</pre><p>Each arrival counts once, under the name its signal carries.</p>',
  render: function (r, el, api) { V().beltPreview(r, el, api); },
  explain: function (r, m) { var s = (m && m.speed) || r.speed; return {
    asked: 'Count every arriving cell once, under its lamp, and measure one real decision.',
    steps: ['runBelt takes the next validation cell, runs decideCell (photo check + live model + gates + log), then calls onResult once.',
            'counts[r.lamp.key] += 1 puts it under PASS, CHECK, STOP or NO VERDICT. The four always add up to CELLS.',
            s ? 'Measured here: median ' + s.medianMs.toFixed(0) + ' ms, slow cells (95th percentile) ' + s.slowMs.toFixed(0) + ' ms per decision → this browser keeps up with about ' + s.maxPerMinute + ' cells per minute.' : 'The clock measures every decision.',
            'The plant line needs 30 per minute (2 s per cell). The wait fills the rest of the 2 s.'],
    trap: 'Counting by out.lane: a broken flow has no lane, so the cell is lost from the counters (NaN).',
    remember: 'Every cell counts once, under the lamp the operator saw.' }; }
};

/* ================= 7d: the person's queue ================= */
var s7d = { id: '7d', name: 'The person\'s queue', kind: 'code', lang: 'js',
  goal: 'The paused cells wait in a queue for a person: big photo, the reason on demand, two big buttons and keys. Resume the paused flow with the person\'s answer. Then clear 10 real cells yourself — the clock is running.',
  task: [
    'Gap 1: resume the paused flow with the answer. Type the Command option: resume',
    'Gap 2: the key S means stop. Type with quotes: \'stop\'',
    'Then clear 10 real queued cells with the buttons or the keys P / S (H shows why).'
  ],
  code: L([
"// THE CONSOLE, part 3: the person's queue",
"const { Command } = LangGraph;",
"const queue = [];                                       // cells waiting for a person, oldest first",
"function toQueue(r) {                                   // paused flows AND broken ones go to a person",
"  if ((r.out && r.out.__interrupt__) || r.lamp === LAMPS.none) queue.push({ ...r, shownAt: null });",
"}",
"const answers = [];                                     // every real answer, with its time",
"async function answer(item, said) {",
"  const seconds = item.shownAt ? (performance.now() - item.shownAt) / 1000 : null;",
"  if (item.out && item.out.__interrupt__) {",
"    await consoleLine.invoke(new Command({ ____: said }), item.config);      // the flow goes on: human_check -> record",
"  } else {                                              // no flow to resume (it broke): log the person's answer",
"    consoleLog.push({ id: item.card.id, kind: item.card.kind, p: null, lane: 'none', decision: said, tries: item.card.tries });",
"  }",
"  queue.splice(queue.indexOf(item), 1);",
"  counts.byPerson += 1;",
"  answers.push({ id: item.card.id, said, expert: pg.labelOf(item.card.id), seconds });",
"}",
"const KEYS = { p: 'pass', s: ____ };                    // big buttons AND keys",
"",
"function heatOf(photo) {                                // your Step 4 Grad-CAM, 16 x 16 numbers",
"  return tf.tidy(() => Array.from(gradCam(tf.tensor(photo, [64, 64, 1], 'float32').div(255)).dataSync()));",
"}",
"function reasonHTML(item) {                             // the reason: score, gates, photo problem",
"  const o = item.out || {};",
"  if (o.error) return `<b>Fault:</b> ${o.error}. No score. A person decides.`;",
"  if (o.problem) return `<b>Photo problem:</b> ${o.problem} (after ${o.tries} photos). No score.`;",
"  const lo = item.card.kind === 'poly' ? lowPoly : low;",
"  const x = (v) => (100 * Math.min(1, Math.max(0, v))).toFixed(1) + '%';",
"  return `<b>Score ${o.p.toFixed(3)}</b> · pass below ${lo.toFixed(3)} · stop from ${high.toFixed(3)}` +",
"    `<div class='scorebar'><i style='left:${x(lo)}'></i><i style='left:${x(high)}'></i><b style='left:${x(o.p)}'></b></div>`;",
"}",
"function queueView(host, onChange = () => {}) {",
"  const el = html(`<div class='hmi queue'>",
"      <div class='qhead'></div>",
"      <div class='qbody'><canvas class='photo' width='384' height='384'></canvas><div class='reason' hidden></div></div>",
"      <div class='qbtns'>",
"        <button class='big' data-key='pass' data-say='pass'>● PASS <kbd>P</kbd></button>",
"        <button class='big' data-key='stop' data-say='stop'>■ STOP <kbd>S</kbd></button>",
"        <button class='whybtn'>WHY? <kbd>H</kbd></button>",
"      </div></div>`);",
"  host.appendChild(el);",
"  let busy = false;",
"  function show() {",
"    const item = queue[0], why = el.querySelector('.reason');",
"    el.querySelector('.qhead').textContent = queue.length ? `QUEUE · ${queue.length} waiting · cell ${item.card.id} (${item.card.kind})` : 'QUEUE · no cells waiting';",
"    el.querySelectorAll('button').forEach((b) => { b.disabled = !item; });",
"    why.hidden = true;",
"    if (!item) { drawPhoto(el.querySelector('.photo'), null); return; }",
"    drawPhoto(el.querySelector('.photo'), item.card.photo);",
"    item.shownAt = item.shownAt || performance.now();     // the clock starts when the person sees it",
"  }",
"  async function say(word) {",
"    const item = queue[0];",
"    if (!item || busy) return;                           // empty queue: a key press does nothing",
"    busy = true;",
"    try { await answer(item, word); } finally { busy = false; }",
"    show(); onChange(item);",
"  }",
"  function toggleWhy() {",
"    const item = queue[0], why = el.querySelector('.reason');",
"    if (!item) return;",
"    why.hidden = !why.hidden;",
"    if (why.hidden) return drawPhoto(el.querySelector('.photo'), item.card.photo);",
"    why.innerHTML = reasonHTML(item);",
"    const ok = item.card.photo && !(item.out || {}).problem && typeof gradCam === 'function';",
"    drawPhoto(el.querySelector('.photo'), item.card.photo, ok ? heatOf(item.card.photo) : null);",
"  }",
"  el.addEventListener('click', (e) => {",
"    const b = e.target.closest('button'); if (!b) return;",
"    if (b.dataset.say) say(b.dataset.say); else toggleWhy();",
"  });",
"  pg.keys((key) => {                                     // the keyboard goes to the queue on screen now",
"    if (!el.isConnected) return false;",
"    if (KEYS[key]) { say(KEYS[key]); return true; }",
"    if (key === 'h') { toggleWhy(); return true; }",
"    return false;",
"  });",
"  show();",
"  return { el, show, say };",
"}",
"function checkerRate(perMinute = 30) {                  // can ONE checker keep up at this line speed?",
"  const s = answers.map((a) => a.seconds).filter((x) => x > 0).sort((a, b) => a - b);",
"  const median = s[Math.floor(s.length / 2)];",
"  const R = pg.shiftReport(auditLog), share = R.lanes.person / R.n;    // the share your flow sends to a person",
"  const perHour = Math.floor(3600 / median), needed = Math.round(perMinute * 60 * share);",
"  return { answered: s.length, medianSeconds: median, perHour, share, perMinute, neededPerHour: needed,",
"           keepsUp: perHour >= needed, checkers: Math.ceil(needed / perHour) };",
"}",
"useStyle('queue', `",
"  .queue { display: flex; flex-direction: column; gap: .6em; padding: .8em; background: #0e141b; border: 1px solid #263240; border-radius: .5em; }",
"  .queue .qhead { font-size: 1.2em; font-weight: 700; color: #c3cdd9; letter-spacing: .04em; }",
"  .queue .qbody { display: flex; gap: .8em; align-items: flex-start; flex-wrap: wrap; }",
"  .queue .photo { width: 16em; height: 16em; image-rendering: pixelated; border: 1px solid #33414f; }",
"  .queue .reason { flex: 1; min-width: 12em; font-size: 1.15em; line-height: 1.4; color: #dfe7f0; }",
"  .queue .qbtns { display: flex; gap: .6em; flex-wrap: wrap; }",
"  .queue button.big { font-size: 1.7em; min-width: 6.5em; min-height: 2.6em; border-width: .12em; border-color: currentColor; background: #141c26; }",
"  .queue button:disabled { opacity: .35; cursor: default; }",
"  .scorebar { position: relative; height: 1.4em; margin-top: .5em; border-radius: .3em;",
"              background: linear-gradient(90deg, #12301f, #3a2f10 50%, #3a1414); border: 1px solid #3a4a5c; }",
"  .scorebar i { position: absolute; top: -.3em; bottom: -.3em; width: .15em; background: #e9eff6; }",
"  .scorebar b { position: absolute; top: .1em; width: 1.1em; height: 1.1em; margin-left: -.55em; border-radius: 50%; background: #fff; border: .15em solid #0a0f15; }",
"`);",
"",
"// Fill the queue from the real line: run cells until 12 are waiting",
"while (queue.length < 12) {",
"  const r = await decideCell(pg.card(pg.cell_val[nextCell++ % pg.cell_val.length]));",
"  onResult(r);",
"  toQueue(r);",
"}",
"const queue1 = queueView(pg.screen('7d'));",
"console.log('waiting for a person:', queue.length, 'cells');"
  ]),
  twin: L([
"from langgraph.types import Command",
"",
"def answer(S, said):                       # resume the SAME paused flow with the person's answer",
"    if not S['queue']: return (S, counters_html(S)) + queue_view(S)   # empty queue: nothing happens",
"    it = S['queue'].pop(0)",
"    secs = time.perf_counter() - S['shown_at'] if S['shown_at'] else None",
"    if '__interrupt__' in (it['out'] or {}):",
"        console_line.invoke(Command(resume=said), it['config'])",
"    else:                                  # the flow broke: log the person's answer",
"        console_log.append({'id': it['card']['id'], 'lane': 'none', 'decision': said})",
"    S['counts']['byPerson'] += 1           # NOT total: counted when it arrived",
"    S['answers'].append({'id': it['card']['id'], 'said': said, 'seconds': secs})",
"    return (S, counters_html(S)) + queue_view(S)   # the new state + what the screen shows",
"",
"pass_b = gr.Button('\u25cf PASS  [P]', elem_id='pass-btn')",
"stop_b = gr.Button('\u25a0 STOP  [S]', elem_id='stop-btn', variant='stop')",
"why_b = gr.Button('WHY?  [H]', elem_id='why-btn')       # score, gates + Grad-CAM on demand",
"q_out = [S, counters, qhead, qphoto, pass_b, stop_b]   # 6 outputs = the 6 values answer() returns",
"pass_b.click(lambda s: answer(s, 'pass'), S, q_out)",
"stop_b.click(lambda s: answer(s, 'stop'), S, q_out)",
"# keys: gradio has no hotkey option, so a small script in launch(head=...) clicks the buttons",
"KEYS_JS = \"\"\"<script>document.addEventListener('keydown', (e) => {",
"  const id = { p: 'pass-btn', s: 'stop-btn', h: 'why-btn' }[e.key.toLowerCase()];",
"  const b = id && document.querySelector('#' + id); if (b && !b.disabled) b.click(); });</script>\"\"\""
  ]),
  probe: async function (NS, pg) {
    needFlow(NS); need7b(NS); need7c(NS);
    if (!NS.queue || !NS.answer || !NS.KEYS || !NS.queueView || !NS.checkerRate) return { missing: ['queue', 'answer', 'KEYS', 'queueView', 'checkerRate'].filter(function (k) { return !NS[k]; }) };
    var id = laneCells(NS, 1).person[0], snap = snapCounts(NS), res = {}, err = null;
    try {
      var r = await NS.decideCell(pg.card(id)), qn = NS.queue.length; NS.toQueue(r);
      res.queued = NS.queue.length - qn;
      var item = NS.queue[NS.queue.length - 1], n0 = NS.consoleLog.length;
      await NS.answer(item, 'stop');
      var row = NS.consoleLog.slice(n0).filter(function (x) { return x.id === id; })[0];
      res.row = row || null; res.left = NS.queue.indexOf(item) >= 0;
      var st = await NS.consoleLine.getState(item.config); res.next = st && st.next ? st.next.slice() : null;
    } catch (e) { err = errMsg(e); }
    restoreCounts(NS, snap);
    return { res: res, err: err, keys: JSON.parse(JSON.stringify(NS.KEYS)), waiting: NS.queue.length, id: id };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.err) return { pass: false, msg: (/cmd\.update|update/.test(r.err) ? 'Command({ update }) only changes card fields; it cannot carry the person\'s answer into the paused flow.' : /empty Command/i.test(r.err) ? 'The Command was empty: nothing was handed to the paused flow.' : 'Answering a queued cell stopped with an error.') + ' The Command option that hands the answer to the paused flow is resume.' };
    var R = r.res;
    if (!R.queued) return { pass: false, msg: 'Cell ' + r.id + ' paused for a person, but it did not go into the queue.' };
    if (!R.row) return { pass: false, msg: 'The person said stop for cell ' + r.id + ', but the flow did not finish (no logbook row; it waits at ' + JSON.stringify(R.next) + '). Hand the answer to the paused flow: new Command({ resume: said }).' };
    if (R.row.decision !== 'stop') return { pass: false, msg: 'The person said stop, but the logbook says “' + R.row.decision + '”. The answer must reach the flow: resume.' };
    if (r.keys.s !== 'stop' || r.keys.p !== 'pass') return { pass: false, msg: 'The keys are ' + JSON.stringify(r.keys) + '. P must mean pass and S must mean stop: type \'stop\'.' };
    return { pass: true, msg: 'The answer resumed the paused flow (cell ' + r.id + ' → human_check → record: stop). ' + r.waiting + ' real cells are waiting for you.' };
  },
  mechNeed: function (m) { var n = m.answered || 0; return n >= 10 ? null : 'clear 10 real queued cells with the buttons or the keys P / S (' + n + ' of 10)'; },
  example: '<p>A paused bank transfer waits for a manager\'s yes or no:</p><pre>const BUTTONS = { y: \'approve\', n: \'reject\' };\nawait transfer.invoke(new Command({ resume: BUTTONS[key] }), { configurable: { thread_id: \'tx-77\' } });</pre><p>The same thread id finds the paused flow; resume hands it the answer and it runs on.</p>',
  render: function (r, el, api) { V().queuePreview(r, el, api); },
  explain: function (r, m) { var c = m && m.rate; return {
    asked: 'Answer the cells that paused for a person, with big buttons and keys, and measure the person.',
    steps: ['A paused flow came back with __interrupt__. toQueue keeps it with its config (its thread id).',
            'answer() calls consoleLine.invoke(new Command({ resume: said }), item.config): the flow runs human_check → record and the logbook gets the person\'s answer.',
            c ? 'You cleared ' + c.answered + ' cells: median ' + c.medianSeconds.toFixed(1) + ' s each → ' + c.perHour + ' cells per hour for one checker.' : 'The clock starts when the cell is shown and stops at the answer.',
            c ? 'Your flow sends ' + (100 * c.share).toFixed(1) + '% of cells to a person. At ' + c.perMinute + ' cells per minute that is ' + c.neededPerHour + ' per hour → ' + (c.keepsUp ? 'one checker keeps up.' : 'one checker cannot keep up: it needs ' + c.checkers + ' checkers.') : ''],
    trap: 'Using a new thread id for the answer: that starts a NEW flow instead of finishing the paused one.',
    remember: 'A person\'s answer goes back into the same paused flow, with resume.' }; }
};

/* ================= 7e: the shift board ================= */
var s7e = { id: '7e', name: 'The shift board', kind: 'code', lang: 'js',
  goal: 'The shift manager has three questions. First predict which chart answers each one. Then count the real logbook into those three charts — drawn in plain SVG, no chart library.',
  predict: { format: 'match',
    q: 'Three questions from the shift manager. <b>Tap a question, then the chart that answers it.</b> One chart answers none of them. Then tap <b>Check</b>. One try.',
    reveal: { asked: 'Which chart answers which manager question.',
      steps: ['“Are checkers getting busier as the shift goes on?” is about TIME → lanes over the shift, block by block.',
              '“Are we inside the 5-in-100 target?” is one number against a line → defects passed per 100 with the target mark.',
              '“Is poly worse than mono?” compares two groups → two bars side by side.',
              'The pie of cells by type answers none: it shows what came in, not how the line did.'],
      trap: 'Picking the prettiest chart. Start from the question: time, one number vs a target, or two groups.',
      remember: 'The question picks the chart.' } },
  task: [
    'Gap 1: count each logbook row in its lane. Type the row field: lane',
    'Gap 2: a defect that got out is one whose final decision was pass. Type with quotes: \'pass\''
  ],
  code: L([
"// THE CONSOLE, part 4: the shift board, counted from the real logbook (your Step 5 shift)",
"function shiftBoard(log, size = 50) {",
"  const blocks = [];                                    // lanes over the shift, 50 cells per block",
"  for (let i = 0; i < log.length; i += size) {",
"    const b = { pass: 0, person: 0, stop: 0 };",
"    for (const row of log.slice(i, i + size)) b[row.____] += 1;",
"    blocks.push(b);",
"  }",
"  const isDefect = (row) => pg.labelOf(row.id) === 1;   // the expert label",
"  const escaped = (row) => isDefect(row) && row.decision === ____;",
"  const group = (rows) => {",
"    const d = rows.filter(isDefect).length, e = rows.filter(escaped).length;",
"    return { defects: d, passed: e, per100: d ? Math.round(1000 * e / d) / 10 : 0 };",
"  };",
"  return { cells: log.length, blocks, all: group(log), target: 5,",
"           mono: group(log.filter((r) => r.kind === 'mono')), poly: group(log.filter((r) => r.kind === 'poly')) };",
"}",
"",
"function drawBoard(host, b) {                           // three small SVG charts",
"  const C = { pass: '#2ee07a', person: '#ffb21e', stop: '#ff5050' }, w = 300 / b.blocks.length;",
"  const lanes = b.blocks.map((x, i) => {",
"    let y = 120; const n = x.pass + x.person + x.stop;",
"    return ['pass', 'person', 'stop'].map((k) => { const h = 120 * x[k] / n; y -= h;",
"      return `<rect x='${i * w + 1}' y='${y}' width='${w - 2}' height='${h}' fill='${C[k]}'><title>${k}: ${x[k]}</title></rect>`; }).join('');",
"  }).join('');",
"  const max = Math.max(10, b.all.per100, b.mono.per100, b.poly.per100) * 1.2, X = (v) => 10 + 280 * v / max;",
"  const met = b.all.per100 <= b.target;",
"  const bar = (y, g, name) => `<rect x='10' y='${y}' width='${X(g.per100) - 10}' height='26' fill='#4f6d8c'/>` +",
"    `<text x='14' y='${y + 19}' class='lbl'>${name} ${g.passed} of ${g.defects} = ${g.per100} per 100</text>`;",
"  const el = html(`<div class='hmi board'>",
"    <figure><figcaption>LANES OVER THE SHIFT · ${b.blocks.length} blocks of 50 cells</figcaption>",
"      <svg viewBox='0 0 300 140'>${lanes}<text x='0' y='136' class='lbl'>start</text><text x='300' y='136' class='lbl' text-anchor='end'>end of shift</text></svg>",
"      <div class='key'><span data-key='pass'>● pass (bottom)</span> <span data-key='person'>▲ check (middle)</span> <span data-key='stop'>■ stop (top)</span></div></figure>",
"    <figure><figcaption>DEFECTS PASSED · TARGET AT MOST ${b.target} PER 100</figcaption>",
"      <svg viewBox='0 0 300 70'>${bar(8, b.all, 'all')}<line x1='${X(b.target)}' x2='${X(b.target)}' y1='0' y2='44' class='tg'/>",
"        <text x='${X(b.target)}' y='58' class='lbl' text-anchor='middle'>target ${b.target}</text></svg>",
"      <div class='target' data-key='${met ? 'pass' : 'stop'}'>${met ? '● TARGET MET' : '■ TARGET MISSED'}</div></figure>",
"    <figure><figcaption>MONO VS POLY · DEFECTS PASSED PER 100</figcaption>",
"      <svg viewBox='0 0 300 80'>${bar(6, b.mono, 'mono')}${bar(42, b.poly, 'poly')}</svg></figure>",
"  </div>`);",
"  host.appendChild(el);",
"  return el;",
"}",
"useStyle('board', `",
"  .board { display: grid; grid-template-columns: repeat(auto-fit, minmax(18em, 1fr)); gap: .8em; }",
"  .board figure { margin: 0; padding: .7em; background: #0e141b; border: 1px solid #263240; border-radius: .5em; }",
"  .board figcaption { font-size: 1em; font-weight: 700; letter-spacing: .05em; color: #c3cdd9; margin-bottom: .4em; }",
"  .board svg { width: 100%; height: auto; display: block; }",
"  .board .lbl { font: 600 11px Space Mono, Consolas, monospace; fill: #fff; }",
"  .board .tg { stroke: #fff; stroke-width: 3; stroke-dasharray: 4 3; }",
"  .board .key { font-size: 1em; display: flex; gap: .8em; flex-wrap: wrap; margin-top: .3em; }",
"  .board .target { font-size: 1.6em; font-weight: 700; margin-top: .3em; }",
"`);",
"",
"const board = shiftBoard(auditLog);",
"drawBoard(pg.screen('7e'), board);",
"console.log('defects passed:', board.all.passed, 'of', board.all.defects, '=', board.all.per100, 'per 100 (target', board.target + ')');"
  ]),
  twin: L([
"def shift_board(log, size=50):",
"    blocks = []",
"    for i in range(0, len(log), size):",
"        b = {'pass': 0, 'person': 0, 'stop': 0}",
"        for row in log[i:i + size]: b[row['lane']] += 1",
"        blocks.append(b)",
"    def group(rs):",
"        d = [r for r in rs if label_of(r['id']) == 1]",
"        e = [r for r in d if r['decision'] == 'pass']",
"        return {'defects': len(d), 'passed': len(e), 'per100': round(1000 * len(e) / len(d)) / 10 if d else 0}",
"    return {'cells': len(log), 'blocks': blocks, 'all': group(log), 'target': 5,",
"            'mono': group([r for r in log if r['kind'] == 'mono']),",
"            'poly': group([r for r in log if r['kind'] == 'poly'])}",
"",
"board = gr.HTML()                          # the same three charts, as an SVG string",
"board_b.click(lambda: board_html()[0], None, board)",
"# smoke test (the course's own test model): 6 of 165 defects passed = 3.6 per 100, as in its JS logbook; yours shows your model's numbers"
  ]),
  probe: async function (NS, pg) {
    need(NS, ['auditLog'], 'Run 5g first: the board counts the Step 5 logbook'); need7b(NS);
    if (!NS.shiftBoard || !NS.board || !NS.drawBoard) return { missing: ['shiftBoard', 'board', 'drawBoard'].filter(function (k) { return !NS[k]; }) };
    var R = pg.shiftReport(NS.auditLog), b = NS.board, blk = { pass: 0, person: 0, stop: 0 }, nan = false;
    b.blocks.forEach(function (x) { ['pass', 'person', 'stop'].forEach(function (k) { if (typeof x[k] !== 'number' || isNaN(x[k])) nan = true; else blk[k] += x[k]; }); });
    return { b: JSON.parse(JSON.stringify(b)), blk: blk, nan: nan, ref: { lanes: R.lanes, all: [R.all.def, R.all.defPassed], mono: [R.mono.def, R.mono.defPassed], poly: [R.poly.def, R.poly.defPassed], n: R.n } };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    var b = r.b, ref = r.ref;
    if (r.nan || r.blk.pass !== ref.lanes.pass || r.blk.person !== ref.lanes.person || r.blk.stop !== ref.lanes.stop)
      return { pass: false, msg: 'The blocks add up to pass ' + r.blk.pass + ' / check ' + r.blk.person + ' / stop ' + r.blk.stop + ', but the logbook has ' + ref.lanes.pass + ' / ' + ref.lanes.person + ' / ' + ref.lanes.stop + '. Count each row in its lane: row.lane.' };
    if (b.all.passed !== ref.all[1]) return { pass: false, msg: 'The board says ' + b.all.passed + ' defects passed, the logbook says ' + ref.all[1] + ' of ' + ref.all[0] + '. A defect got out when its final decision was \'pass\'.' };
    if (b.mono.passed !== ref.mono[1] || b.poly.passed !== ref.poly[1]) return { pass: false, msg: 'Mono / poly do not match the logbook.' };
    return { pass: true, msg: ref.n + ' logbook rows counted: ' + b.all.passed + ' of ' + b.all.defects + ' defects passed = ' + b.all.per100 + ' per 100 → ' + (b.all.per100 <= b.target ? 'target met' : 'target MISSED') + '. Mono ' + b.mono.per100 + ' vs poly ' + b.poly.per100 + ' per 100.' };
  },
  example: '<p>A bus company counts late buses per hour:</p><pre>for (const trip of day.slice(i, i + 20)) hour[trip.status] += 1;   // on-time / late / cancelled\nconst late = trips.filter((t) => t.final === \'late\').length;</pre><p>Count each row under the field that names its group. Count a failure by its FINAL outcome.</p>',
  render: function (r, el, api) { V().boardPreview(r, el, api); },
  explain: function (r) { var b = r.b; return {
    asked: 'Count the real Step 5 logbook into three charts that answer the manager\'s questions.',
    steps: ['The logbook has ' + r.ref.n + ' rows (your last Step 5 shift, with the poly gate). Blocks of 50 rows give ' + b.blocks.length + ' bars over time.',
            'b[row.lane] += 1 counts each row in its lane: in all, pass ' + r.blk.pass + ', check ' + r.blk.person + ', stop ' + r.blk.stop + '.',
            'A defect got out when the expert says defect and the final decision is \'pass\': ' + b.all.passed + ' of ' + b.all.defects + ' = ' + b.all.per100 + ' per 100 (target at most ' + b.target + ').',
            'Mono ' + b.mono.passed + ' of ' + b.mono.defects + ' (' + b.mono.per100 + ') vs poly ' + b.poly.passed + ' of ' + b.poly.defects + ' (' + b.poly.per100 + ') per 100.'],
    trap: 'Counting escapes by the lane: a person can turn a CHECK cell into pass. The final decision is what left the plant.',
    remember: 'Count from the logbook, by the final decision.' }; }
};

/* ================= 7f: one button, one report ================= */
var s7f = { id: '7f', name: 'One button, one report', kind: 'code', lang: 'js',
  goal: 'Wire your Step 6 crew to one REPORT button. Check the report again before an operator sees it. The badge says “every number checked” or lists the numbers the checker removed. A report that fails the check is held back.',
  task: [
    'Gap 1: check the final report against what the tools say now. Type: facts()',
    'Gap 2: hold the report back unless the check is good. Type the field: ok',
    'Then press REPORT in the preview, then COPY.'
  ],
  code: L([
"// THE CONSOLE, part 5: one button, one report (your Step 6 crew + checker)",
"const { Crew, Process } = MiniCrew;",
"const reportCrew = new Crew({ agents: [inspector, analyst, sloppyWriter],",
"  tasks: [inspectShift, findCauses, checkedReport], process: Process.sequential });   // the 6f job with the guardrail",
"",
"async function makeReport() {",
"  let result;",
"  try { result = await reportCrew.kickoff(); }",
"  catch (e) { return { held: true, why: String(e.message || e), removed: [] }; }       // guardrail gave up: no report",
"  const job = result.tasks_output[result.tasks_output.length - 1];",
"  const removed = job.attempts.filter((a) => !a.ok).flatMap((a) => a.feedback.split(': ').pop().split(', '));",
"  const check = checkReport(result.raw, ____);         // check AGAIN, always, before a person reads it",
"  if (!check.____) return { held: true, why: 'numbers not in the tool results: ' + check.wrong.join(', '), removed };",
"  return { held: false, text: result.raw, removed, drafts: job.attempts.length };",
"}",
"",
"async function copyText(text, button) {",
"  try { await navigator.clipboard.writeText(text); button.textContent = 'COPIED'; }",
"  catch (e) { button.textContent = 'COPY BLOCKED HERE: SELECT THE TEXT'; }",
"}",
"function reportView(host) {",
"  const el = html(`<div class='hmi report'>",
"      <div class='rbtns'><button class='big go'>REPORT</button><button class='copy' disabled>COPY</button></div>",
"      <div class='badge'>No report yet.</div><pre class='paper' hidden></pre></div>`);",
"  host.appendChild(el);",
"  const badge = el.querySelector('.badge'), paper = el.querySelector('.paper'), copy = el.querySelector('.copy');",
"  let last = null;",
"  el.querySelector('.go').addEventListener('click', async () => {",
"    badge.textContent = 'WORKING: 3 workers, then the checker…'; badge.dataset.key = '';",
"    last = await makeReport();",
"    if (last.held) {",
"      badge.dataset.key = 'stop'; badge.textContent = '■ REPORT HELD BACK: ' + last.why; paper.hidden = true; copy.disabled = true;",
"    } else {",
"      badge.dataset.key = 'pass';",
"      badge.textContent = last.removed.length ? '● EVERY NUMBER CHECKED · the checker removed ' + last.removed.join(', ') + ' from draft 1'",
"                                              : '● EVERY NUMBER CHECKED';",
"      paper.textContent = last.text; paper.hidden = false; copy.disabled = false; copy.textContent = 'COPY';",
"    }",
"    el.dispatchEvent(new CustomEvent('report', { detail: last }));",
"  });",
"  copy.addEventListener('click', () => { if (last && !last.held) { copyText(last.text, copy); el.dispatchEvent(new CustomEvent('copied')); } });",
"  return { el };",
"}",
"useStyle('report', `",
"  .report { display: flex; flex-direction: column; gap: .6em; }",
"  .report .rbtns { display: flex; gap: .6em; align-items: center; }",
"  .report .badge { font-size: 1.3em; font-weight: 700; padding: .4em .7em; border: 2px solid currentColor; border-radius: .4em; color: #c3cdd9; }",
"  .report .badge[data-key=pass] { color: var(--pass); }  .report .badge[data-key=stop] { color: var(--stop); }",
"  .report .paper { margin: 0; padding: .8em; background: #e9eff6; color: #0a0f15; border-radius: .3em; white-space: pre-wrap;",
"                   font: 1.05em/1.45 Space Mono, Consolas, monospace; max-height: 26em; overflow: auto; user-select: text; }",
"`);",
"",
"const reportBox = reportView(pg.screen('7f'));",
"const report1 = await makeReport();                     // one run now, so the check can see it",
"console.log(report1.held ? 'HELD: ' + report1.why : 'report ready, ' + report1.drafts + ' drafts, removed: ' + JSON.stringify(report1.removed));"
  ]),
  twin: L([
"def report_crew():                         # a FRESH 6f crew for each press (crewai: workers and jobs run right once)",
"    inspector, analyst, writer = hire()",
"    sloppy = Agent(role=writer.role, goal=writer.goal, backstory=writer.backstory,",
"                   tools=writer.tools, llm=ScriptedLLM(model='scripted-rules', slips=2))",
"    return Crew(agents=[inspector, analyst, sloppy],",
"                tasks=list(jobs(inspector, analyst, sloppy, guardrail=report_guardrail, guardrail_max_retries=1)))",
"",
"def make_report():                         # the Step 6 CrewAI crew + check_report, then show or hold",
"    try:",
"        result = report_crew().kickoff()   # inspector, analyst, writer; the report task has the guardrail",
"    except Exception as e:",
"        return f'\u25a0 REPORT HELD BACK: {e}', ''",
"    check = check_report(result.raw, facts())          # check AGAIN, before a person reads it",
"    if not check['ok']:",
"        return '\u25a0 REPORT HELD BACK: numbers not in the tool results: ' + ', '.join(check['wrong']), ''",
"    return '\u25cf EVERY NUMBER CHECKED', result.raw",
"",
"report_b = gr.Button('REPORT')",
"badge, paper = gr.HTML(), gr.Textbox(label='report', lines=8, interactive=False)",
"report_b.click(make_report, None, [badge, paper])"
  ]),
  probe: async function (NS) {
    need(NS, ['inspector', 'analyst', 'sloppyWriter', 'inspectShift', 'findCauses', 'checkedReport', 'checkReport', 'facts'], 'Run 6f first: the report button uses your Step 6 crew and checker'); need7b(NS);
    if (!NS.makeReport || !NS.report1 || !NS.reportView) return { missing: ['makeReport', 'report1', 'reportView'].filter(function (k) { return !NS[k]; }) };
    var R = NS.report1, recheck = R.text ? NS.checkReport(R.text, NS.facts()) : null;
    /* the safe default: a report with a wrong number must be HELD. Swap the crew's result for one with a planted number, once. */
    var crew = NS.reportCrew, real = crew.kickoff, held = null;
    try {
      crew.kickoff = async function () { var x = await real.apply(crew, arguments); var t = x.raw.replace(/(\d+)\.(\d)/, function (m, a, b) { return (+a + 7) + '.' + b; }); return Object.assign({}, x, { raw: t }); };
      held = await NS.makeReport();
    } catch (e) { held = { err: errMsg(e) }; } finally { crew.kickoff = real; }
    return { r: { held: R.held, why: R.why || null, removed: R.removed, drafts: R.drafts, text: R.text || null }, recheck: recheck, planted: { held: held.held, why: held.why || held.err || null } };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.r.held && /not a function|undefined|Cannot read/i.test(r.r.why || '')) return { pass: false, msg: 'The report was held because the check itself broke: ' + r.r.why + '. Gap 1 is the tool facts now: facts().' };
    if (r.r.held) return { pass: false, msg: 'The real report was held back (' + r.r.why + '). Check it against facts() and hold it only when the check is not ok.' };
    if (!r.recheck || !r.recheck.ok) return { pass: false, msg: 'The report on screen has numbers that are not in the tool results.' };
    if (!r.planted.held) return { pass: false, msg: 'A report with a planted wrong number was SHOWN. The safe default: show it only when check.ok is true. Type ok.' };
    return { pass: true, msg: 'Report ready in ' + r.r.drafts + ' drafts' + (r.r.removed.length ? ' (the checker removed ' + r.r.removed.join(', ') + ' from draft 1)' : '') + '; every number checked. A copy with a planted number was held back.' };
  },
  mechNeed: function (m) { return !m.reported ? 'press REPORT in the preview' : !m.copied ? 'press COPY' : null; },
  example: '<p>A weather screen shows a forecast only when every value is inside the sensor range:</p><pre>const c = checkForecast(text, sensors());\nif (!c.ok) return { held: true, why: \'out of range: \' + c.bad.join(\', \') };\nreturn { held: false, text };</pre><p>Check at the last moment. When the check fails, show nothing rather than something wrong.</p>',
  render: function (r, el, api) { V().reportPreview(r, el, api); },
  explain: function (r) { return {
    asked: 'One button runs the crew, checks the report again, and shows it — or holds it back.',
    steps: ['reportCrew runs the 3 Step 6 jobs; the report job has your 6f guardrail.',
            'Draft 1 of the scripted writer slips 2 numbers on purpose (6f). The guardrail sent it back: ' + (r.r.removed.length ? 'the numbers ' + r.r.removed.join(', ') + ' were removed.' : 'nothing to remove.') + ' The report took ' + r.r.drafts + ' drafts.',
            'checkReport(result.raw, facts()) runs again on the final text: tools now vs the words on the page.',
            'A copy with a planted number (a defect rate changed by 7) was held back: “' + (r.planted.why || '') + '”.'],
    trap: 'Trusting the guardrail of an earlier run. The tool facts can change; check the text you are about to show.',
    remember: 'No checked report, no report.' }; }
};

/* ================= 7g: break it before the plant does ================= */
var FIX7 = [['const lamp = r.out && r.out.lane ? lampOf(r.out) : last;', 'const lamp = lampOf(r.out);'], ['onResult(item); ', '']];
var s7g = { id: '7g', name: 'Break it before the plant does', kind: 'code', lang: 'js',
  goal: 'This is the whole console. Its starter code has TWO bugs planted on purpose (marked BUG 1 and BUG 2). Run it, break it with the fault panel, see what the screen shows wrongly — then fix both bugs in the code.',
  task: [
    'Run 1: run the starter code as it is (bugs and all), then use the fault panel on the right.',
    'Fix 1: on the line marked BUG 1, replace  r.out && r.out.lane ? lampOf(r.out) : last  with  lampOf(r.out)',
    'Fix 2: on the line marked BUG 2, delete  onResult(item);  (keep the rest of the line)',
    'Then run again and fire all 4 faults on the fixed console.'
  ],
  code: L([
"// THE OPERATOR CONSOLE: every part you built, on one screen.",
"// Two bugs are PLANTED in this starter code on purpose: BUG 1 and BUG 2. Find them with the fault panel, then fix them.",
"function makeConsole(root) {",
"  root.innerHTML = '';",
"  const el = html(`<div class='hmi console'>",
"      <header><b class='station'>PANELGUARD · EL STATION 1</b><div class='ctrs'></div><span class='state'>LINE STOPPED</span></header>",
"      <section class='screen-main'></section>",
"      <aside class='screen-side'></aside>",
"      <footer>",
"        <button class='big start' data-key='pass'>▶ START LINE</button>",
"        <button class='big halt' data-key='stop'>■ STOP LINE</button>",
"        <span class='speed'></span>",
"        <button class='tab' data-tab='board'>SHIFT BOARD</button>",
"        <button class='tab' data-tab='report'>REPORT</button>",
"      </footer>",
"      <div class='drawer' hidden></div>",
"    </div>`);",
"  root.appendChild(el);",
"  const cell = cellView(el.querySelector('.screen-main'));",
"  const ctr = countersView(el.querySelector('.ctrs'));",
"  const q = queueView(el.querySelector('.screen-side'), (item) => { onResult(item); ctr.update(); });   // BUG 2 (planted)",
"  let last = LAMPS.none;                                  // the lamp on screen now",
"  cell.show({ card: { id: '-', kind: 'waiting' }, out: null, lamp: last });",
"",
"  function show(r) {                                      // one cell arrived from the camera",
"    const lamp = r.out && r.out.lane ? lampOf(r.out) : last;   // BUG 1 (planted)",
"    last = lamp;",
"    const shown = { ...r, lamp };",
"    cell.show(shown);",
"    onResult(shown);",
"    toQueue(shown);",
"    q.show(); ctr.update();",
"  }",
"  async function feed(card) { show(await decideCell(card)); }   // one cell, by hand (used by the fault drill)",
"",
"  const state = el.querySelector('.state');",
"  async function start() {",
"    if (belt.running) return;",
"    state.textContent = 'LINE RUNNING'; state.dataset.key = 'pass';",
"    await runBelt(Infinity, show);",
"    state.textContent = 'LINE STOPPED'; state.dataset.key = 'stop';",
"  }",
"  function halt() { belt.running = false; }",
"  el.querySelector('.speed').textContent = (belt.perMinute === Infinity ? 'MAX' : belt.perMinute) + ' cells / min';",
"  el.querySelector('.start').addEventListener('click', start);",
"  el.querySelector('.halt').addEventListener('click', halt);",
"",
"  const drawer = el.querySelector('.drawer');               // board and report: on demand, not always",
"  el.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {",
"    const open = drawer.dataset.tab === t.dataset.tab && !drawer.hidden;",
"    drawer.innerHTML = ''; drawer.hidden = open; drawer.dataset.tab = open ? '' : t.dataset.tab;",
"    if (open) return;",
"    if (t.dataset.tab === 'board') drawBoard(drawer, shiftBoard(auditLog)); else reportView(drawer);",
"  }));",
"  return { el, feed, start, halt, show, queue: q, get lamp() { return last; } };",
"}",
"useStyle('console', `",
"  .console { position: relative; display: grid; grid-template-columns: 1.35fr 1fr; grid-template-rows: auto 1fr auto; gap: .7em;",
"             height: 100%; padding: .7em; background: #0a0e13; }",
"  .console header, .console footer { grid-column: 1 / 3; display: flex; align-items: center; gap: .8em; flex-wrap: wrap;",
"                                     padding: .5em .7em; background: #101820; border: 1px solid #243040; border-radius: .5em; }",
"  .console .station { font-size: 1.1em; letter-spacing: .12em; color: #c3cdd9; }",
"  .console header .ctr { font-size: 1em; padding: .2em .6em; }",
"  .console .state { margin-left: auto; font-size: 1.3em; font-weight: 700; color: #c3cdd9; }",
"  .console .screen-main .cellview { height: 100%; grid-template-columns: auto 1fr; }",
"  .console .screen-main .photo { width: 16em; height: 16em; }",
"  .console .screen-main .lamp .word { font-size: 5.2em; }",
"  .console .screen-main .lamp .shape { font-size: 5.4em; }",
"  .console .screen-side { min-height: 0; overflow: auto; }",
"  .console .screen-side .photo { width: 9em; height: 9em; }",
"  .console .screen-side .qhead { font-size: 1.05em; }",
"  .console .screen-side button.big { font-size: 1.35em; min-width: 5.2em; }",
"  .console footer .big { font-size: 1.5em; min-height: 2.4em; border-color: currentColor; background: #141c26; }",
"  .console footer .halt { min-width: 9em; }",
"  .console .speed { color: #c3cdd9; font-size: 1.15em; }",
"  .console .tab { font-size: 1.15em; }",
"  .console .drawer { position: absolute; left: .7em; right: .7em; bottom: 5.2em; max-height: 72%; overflow: auto; padding: .8em;",
"                     background: #0c1218f2; border: 1px solid #3a4a5c; border-radius: .5em; z-index: 2; }",
"`);",
"",
"const console1 = makeConsole(pg.screen('7g'));",
"console.log('console ready: lamp', console1.lamp.word, '· queue', queue.length, '· cells counted', counts.total);"
  ]),
  twin: L([
"def build():",
"    with gr.Blocks(title='PanelGuard \u00b7 operator console') as demo:",
"        ...                                # photo + lamp, counters, queue + 3 buttons, START / STOP LINE, board, report",
"    return demo",
"",
"def smoke():                               # the fault drill, for real, in Python",
"    f1 = decide_cell(card('F1'))                              # camera fault copy -> CHECK",
"    STATE['model'] = None; nm = decide_cell(card(val_ids[3])); STATE['model'] = model   # -> NO VERDICT",
"    fe = decide_cell({'id': 'X9', 'kind': 'mono', 'tries': 1, 'photo': None})          # flow error -> NO VERDICT",
"    e = new_session(); answer(e, 'pass')                     # empty queue -> nothing changes",
"    demo = build()",
"    demo.launch(server_name='127.0.0.1', server_port=port, prevent_thread_lock=True, css=CSS, head=KEYS_JS)",
"    Client(f'http://127.0.0.1:{port}/').predict(api_name='/next_cell')   # a real request to the real server",
"    demo.close()",
"# gradio 6: css / head / theme moved from gr.Blocks(...) to launch(...)"
  ]),
  probe: async function (NS, pg) {
    needFlow(NS); need7b(NS); need7c(NS); need7d(NS); need7e(NS); need7f(NS);
    if (!NS.makeConsole) return { missing: ['makeConsole'] };
    if (!hasDoc()) return { nodom: 1 };
    var snap = snapCounts(NS), host = document.createElement('div'), out = { steps: [] }, saveModel = NS.model, wasRun = NS.belt.running, keysWas = pg.keysNow();
    host.style.cssText = 'position:fixed;left:-30000px;top:0;width:1366px;height:768px;--u:' + unitFor(1366, 768) + 'px'; document.body.appendChild(host);
    NS.belt.running = false;
    function look(C) { var w = host.querySelector('.screen-main .lamp .word'); return { lamp: w ? w.textContent : null, total: NS.counts.total, none: NS.counts.none, person: NS.counts.person, queue: NS.queue.length,
      head: (host.querySelector('.qhead') || {}).textContent || '' }; }
    try {
      NS.queue.length = 0;
      var C = NS.makeConsole(host), ids = laneCells(NS, 2);
      await C.feed(pg.card(ids.pass[0])); out.steps.push(Object.assign({ what: 'a real PASS cell' }, look()));
      await C.feed(pg.card('F1')); out.steps.push(Object.assign({ what: 'camera fault copy (lens cap on)', want: 'CHECK' }, look()));
      await C.feed(pg.card(ids.pass[1]));
      NS.model = null; try { await C.feed(pg.card(ids.stop[0])); } finally { NS.model = saveModel; }
      out.steps.push(Object.assign({ what: 'model not loaded', want: 'NO VERDICT' }, look()));
      await C.feed(pg.card(ids.pass[0]));
      await C.feed({ id: 'X9', kind: 'mono', tries: 1, photo: null }); out.steps.push(Object.assign({ what: 'flow error (no photo data)', want: 'NO VERDICT' }, look()));
      /* a cell comes back from the person through the real button: CELLS must not move (counted once, when it arrived) */
      await C.feed(pg.card(ids.person[0])); var t1 = NS.counts.total, nq = NS.queue.length;
      host.querySelector('.screen-side button[data-say="stop"]').click();
      for (var w = 0; w < 200 && NS.queue.length >= nq; w++) await new Promise(function (res) { setTimeout(res, 20); });
      await new Promise(function (res) { setTimeout(res, 30); });
      out.button = { before: t1, after: NS.counts.total, answered: nq - NS.queue.length };
      /* empty queue: P must do nothing */
      var b0 = NS.counts.byPerson, c0 = JSON.stringify(NS.counts); NS.queue.length = 0; var qv = NS.queueView(host.querySelector('.screen-side'));
      await qv.say('pass'); out.empty = { same: JSON.stringify(NS.counts) === c0 && NS.counts.byPerson === b0, head: host.querySelector('.screen-side .queue:last-child .qhead').textContent };
      var m = measureHost(function (h2) { NS.makeConsole(h2).show({ card: pg.card(ids.pass[0]), out: { lane: 'pass' }, lamp: NS.LAMPS.pass, ms: 1 }); });
      out.meas = m;
    } catch (e) { out.err = errMsg(e); }
    finally { NS.model = saveModel; host.remove(); restoreCounts(NS, snap); NS.belt.running = wasRun; pg.keys(keysWas); }
    return out;
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: makeConsole. Run the whole cell.' };
    if (r.nodom) return { pass: false, msg: 'This check needs a browser page.' };
    if (r.err) return { pass: false, msg: 'The console broke during the fault drill: ' + r.err + '.' };
    var bad = r.steps.filter(function (s) { return s.want && s.lamp !== s.want; })[0];
    if (bad) return { pass: false, msg: 'Fault drill — ' + bad.what + ': the lamp still shows ' + bad.lamp + ' (want ' + bad.want + '). The screen kept the verdict of the cell before. That is BUG 1: replace  r.out && r.out.lane ? lampOf(r.out) : last  with  lampOf(r.out).' };
    if (!r.button.answered) return { pass: false, msg: 'Pressing the STOP button in the queue did not answer the cell.' };
    if (r.button.after !== r.button.before) return { pass: false, msg: 'A cell came back from the person and CELLS went from ' + r.button.before + ' to ' + r.button.after + ': it was counted twice. That is BUG 2: delete  onResult(item);  in the queue line.' };
    if (!r.empty.same) return { pass: false, msg: 'With an empty queue, pressing P changed a counter. It must do nothing.' };
    if (r.meas && r.meas.next && r.meas.lampPx <= r.meas.next.px) return { pass: false, msg: 'On the full console the lamp word (' + r.meas.lampPx + ' px) is not the biggest thing: “' + r.meas.next.what + '” is ' + r.meas.next.px + ' px.' };
    return { pass: true, msg: 'Both bugs fixed. Every fault shows the safe default: camera fault → CHECK, model not loaded → NO VERDICT, flow error → NO VERDICT, empty queue → nothing happens; a cell back from the person is counted once.' + (r.meas ? ' Full console at 1920×1080: lamp word ' + r.meas.lampPx + ' px (next biggest ' + (r.meas.next ? r.meas.next.px : 0) + ' px), readable from about ' + r.meas.metres + ' m.' : '') };
  },
  mechNeed: function (m) { var f = (m && m.fixed) || {}, n = ['camera', 'model', 'empty', 'flow'].filter(function (k) { return f[k]; }).length; return n >= 4 ? null : 'fire all 4 faults on the fixed console from the fault panel (' + n + ' of 4)'; },
  example: '<p>A lift display keeps the last floor when the sensor drops out — a planted bug of the same kind:</p><pre>const floor = s && s.floor ? s.floor : lastFloor;   // stale!\n// fixed:\nconst floor = floorOf(s);                       // unknown -> \'--\'</pre><p>Never re-use an old answer for a new question. And count each event in exactly one place.</p>',
  render: function (r, el, api) { V().drillPreview(r, el, api); },
  endCard: function (box, api) { V().endCard7(box, api); },
  explain: function (r) { return {
    asked: 'Find and fix two planted bugs, and prove the safe default holds for every fault.',
    steps: ['BUG 1: “r.out.lane ? lampOf(r.out) : last” — a camera fault or a broken flow has no lane, so the screen kept the LAST verdict (often PASS) and the cell was counted as PASS and never queued.',
            'Fix: lampOf(r.out) always. lampOf already knows: paused → CHECK, anything unknown → NO VERDICT.',
            'BUG 2: a cell was counted when it arrived (onResult in show) and AGAIN when the person answered (onResult in the queue line). Fix: count in one place only.',
            'The check fired every fault on a hidden console: ' + r.steps.map(function (s) { return s.what + ' → ' + s.lamp; }).join('; ') + '; empty queue → nothing.'],
    trap: 'Testing only the happy path. Both bugs are invisible until something goes wrong — so break it on purpose before the plant does.',
    remember: 'When in doubt the screen says NO VERDICT, and a person looks.' }; }
};
s7g.fixes = FIX7;
s7g.ref = [];

var step7 = { id: 7, title: 'Build the operator console', short: 'lamp, line, queue, board, report, fault drill',
  story: 'The operator at the EL station has about 2 seconds per cell. Everything you built — model, gates, flow, the person\'s pause, the crew report — now goes behind one screen that a tired person can use without mistakes.',
  substeps: [s7a, s7b, s7c, s7d, s7e, s7f, s7g] };

var REF7 = { '7b': ['lane', 'LAMPS.none'], '7c': ['key'], '7d': ['resume', "'stop'"], '7e': ['lane', "'pass'"], '7f': ['facts()', 'ok'] };
step7.substeps.forEach(function (s) { if (REF7[s.id]) s.ref = REF7[s.id]; if (s.kind === 'code') { s.twinTitle = 'Same thing in Python Gradio'; s.twinNote = 'read-only · gradio ' + (G.PG_GRADIO_VERSION || '6.32.0') + ' · one gr.Blocks app'; s.edLabel = 'JavaScript · HTML + CSS · LangGraph'; } });
s7e.predict.render = function (body, api, pr, lock, whyBox) { V().matchPredict(body, api, pr, lock, whyBox, s7e.predict); };

G.PG_NAME_FROM = Object.assign(G.PG_NAME_FROM || {}, { routePoly: '5g', lowPoly: '5g', sloppyWriter: '6f', checkedReport: '6f',
  LAMPS: '7b', lampOf: '7b', decideCell: '7b', consoleLine: '7b', consoleLog: '7b', cellView: '7b', html: '7b', useStyle: '7b', drawPhoto: '7b', shapeSVG: '7b', lampHTML: '7b',
  counts: '7c', onResult: '7c', belt: '7c', runBelt: '7c', times: '7c', speedReport: '7c', countersView: '7c', nextCell: '7c',
  queue: '7d', toQueue: '7d', answer: '7d', answers: '7d', KEYS: '7d', queueView: '7d', checkerRate: '7d', heatOf: '7d', reasonHTML: '7d',
  shiftBoard: '7e', board: '7e', drawBoard: '7e', makeReport: '7f', reportView: '7f', reportCrew: '7f', copyText: '7f', makeConsole: '7g', console1: '7g' });
G.PG_STEP7 = step7;
G.PG_STEP7_UTIL = { measureHost: measureHost, unitFor: unitFor, FIX7: FIX7, laneCells: laneCells, snapCounts: snapCounts, restoreCounts: restoreCounts, CAP_2M: CAP_2M, MM_PER_PX: MM_PER_PX };
var prevExtra = G.PG_PG_EXTRA;
G.PG_PG_EXTRA = function (pg) { var o = prevExtra ? prevExtra(pg) : {}; return Object.assign(o, extra(pg)); };
if (G.PG_STEPS) { var i7 = G.PG_STEPS.findIndex(function (s) { return s.id === 7; }); if (i7 >= 0) G.PG_STEPS[i7] = step7; }
})(typeof window !== 'undefined' ? window : globalThis);
