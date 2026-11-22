// Step 5 JavaScript cells (right answer + plausible wrong answers) through the SAME kernel, probes and checks, with the REAL
// LangGraph bundle the app ships (site/js/langgraph.min.js) and real TensorFlow.js (CPU) under Node.
// Scores: the Step 3 cells run for real on the TEST FIXTURE model (Keras-trained, see fixture.mjs) + the Step 2 bridge fixture.
// Also writes tools/research/step5_inputs.json (scores, gates and the JS shift counts) for the Python LangGraph twin.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
import { FILLS, fill } from './fills.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site') + '/';
const require = createRequire(import.meta.url); const tf = require(path.resolve(here, '../node_modules/@tensorflow/tfjs/dist/tf.node.js'));
await tf.setBackend('cpu');
const LangGraph = new Function(fs.readFileSync(site + 'js/langgraph.min.js', 'utf8') + ';return LangGraph')();
const ctx = { console, setTimeout, clearTimeout, Proxy, Promise, tf, LangGraph, Math, Array, Object, JSON, Number, Float32Array, Uint8Array, Date, isNaN, isFinite, Infinity, NaN, undefined, Error, ReferenceError, TypeError, Symbol, ArrayBuffer, String, Boolean, RegExp, parseInt, parseFloat };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['steps.js', 'step3.js', 'step4.js', 'step5.js', 'jskernel.js']) vm.runInContext(fs.readFileSync(site + 'js/' + f, 'utf8'), ctx, { filename: f });
const P = ctx.PGJS, B = JSON.parse(fs.readFileSync(path.resolve(here, 'bridge_fixture.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(site + 'data/labels.json', 'utf8')).rows; const i2 = {}; rows.forEach((r, i) => { i2[r[0]] = i; });
const J = P.create({ tf, global: ctx }); const T = P.trainer(J, tf, { tick() {} });
const pg = Object.assign({}, B, { pixels: new Uint8Array(fs.readFileSync(path.resolve(here, '../ref/cells64.u8'))), cellIndex: (id) => i2[id], kindOf: (id) => rows[i2[id]][2], epochs: 1, epochsMode: 'test', gpu: null, rough: false,
  live: T.live, trainingWatch: T.watch, trainState: () => T.state, falseAlarmAt95: P.falseAlarmAt95, twoGates: P.twoGates, gatesFor: ctx.PG_STEP3_gatesFor, auc: P.auc, saveModel: async () => false });
Object.assign(pg, ctx.PG_PG_EXTRA(pg));
J.setPg(pg);
const SUBS = Object.fromEntries([...ctx.PG_STEP3.substeps, ...ctx.PG_STEP4.substeps, ...ctx.PG_STEP5.substeps].map((s) => [s.id, s]));
const runCell = async (s, vals) => {
  const r = await J.run(fill(s.code, vals), s.probe, () => {});
  if (r.error) return { pass: false, msg: (r.error.type === 'Check' ? '' : 'ERROR ') + P.friendly(r.error) + (r.error.line ? ' (line ' + r.error.line + ')' : '') };
  if (r.probe && r.probe.probe_error) return { pass: false, msg: 'PROBE ' + r.probe.probe_error };
  const v = s.check(r.probe); v.r = r.probe; v.ms = r.ms; return v;
};
for (const id of ['3a', '3c']) { const v = await runCell(SUBS[id], SUBS[id].ref); if (!v.pass) throw new Error(id + ' ' + v.msg); }
new Function('return ' + LOAD_SRC)()(tf, J.NS.model, FIX);
for (const id of ['3f', '3g']) { const v = await runCell(SUBS[id], SUBS[id].ref); console.log('prereq', id, v.msg); if (!v.pass) throw new Error(id); }
// missing-state message: 5c before 5b
{ const s = SUBS['5c']; const saved = J.NS.Cell; delete J.NS.Cell; const v = await runCell(s, s.ref); console.log('5c without 5b ->', v.msg); if (v.pass || !/Run 5b first/.test(v.msg)) { console.log('BAD missing-state message'); process.exitCode = 1; } if (saved) J.NS.Cell = saved; }
const only = process.argv[2] ? process.argv[2].split(',') : null; let fails = 0; const RES = {};
for (const id of ['5b', '5c', '5d', '5e', '5f', '5g']) {
  const s = SUBS[id]; if (JSON.stringify(s.ref) !== JSON.stringify(FILLS[id].right)) { console.log(id, 'REF DIFFERS FROM FILLS'); fails++; }
  if (!only || only.includes(id)) for (const w of FILLS[id].wrong) { const t = Date.now(); const v = await runCell(s, w); console.log(`${id} WRONG ${JSON.stringify(w)} -> ${v.pass ? 'PASSED (BAD!)' : 'fails: ' + v.msg} [${((Date.now() - t) / 1000).toFixed(1)}s]`); if (v.pass || /^PROBE|undefined|NaN|^ERROR \w*Error:/.test(v.msg)) fails++; }
  const t = Date.now(); const v = await runCell(s, s.ref); RES[id] = v.r; console.log(`${id} RIGHT -> ${v.pass ? 'PASS: ' : 'FAIL: '}${v.msg} [${((Date.now() - t) / 1000).toFixed(1)}s]`); if (!v.pass) fails++;
}
if (RES['5g']) {
  const g = RES['5g'], sl = (R) => ({ lanes: R.lanes, reshoots: R.reshoots, all: R.all, mono: R.mono, poly: R.poly });
  const out = { source: 'tools/tests/js_cells5.test.mjs (Node, TF.js CPU, test fixture model)', langgraph_js: LangGraph.VERSION, cell_val: B.cell_val, y_val: B.y_val, kind_val: B.kind_val,
    p_blend: Array.from(J.NS.pBlend), low: J.NS.low, high: J.NS.high, low_poly: g.lowPoly, js: { shift1: sl(g.s1), shift2: sl(g.s2), shift3: sl(g.s3) } };
  fs.writeFileSync(path.resolve(here, '../research/step5_inputs.json'), JSON.stringify(out));
  console.log('shift1', JSON.stringify(sl(g.s1))); console.log('shift2', JSON.stringify(sl(g.s2))); console.log('shift3', JSON.stringify(sl(g.s3)));
}
console.log('FAILS:', fails); process.exit(fails ? 1 : (process.exitCode || 0));
