// Step 6 JavaScript cells (right answer + plausible wrong answers) through the SAME kernel, probes and checks, with the
// real MiniCrew runner (site/js/crew.js), the real LangGraph bundle (Step 5 replay) and real TensorFlow.js (CPU) under Node.
// Start: 3a, 3c (+ fixture model), 3f, 3g, 4e, 5b-5g with their reference answers. Then every Step 6 cell.
// Writes tools/research/step6_inputs.json (the lab state + the JS crew outputs) for the Python CrewAI twin.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
import { FILLS, fill } from './fills.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site') + '/';
const require = createRequire(import.meta.url); const tf = require(path.resolve(here, '../node_modules/@tensorflow/tfjs/dist/tf.node.js'));
await tf.setBackend('cpu');
const LangGraph = new Function(fs.readFileSync(site + 'js/langgraph.min.js', 'utf8') + ';return LangGraph')();
const ctx = { console, setTimeout, clearTimeout, Proxy, Promise, tf, LangGraph, Math, Array, Object, JSON, Number, Float32Array, Uint8Array, Date, isNaN, isFinite, Infinity, NaN, undefined, Error, ReferenceError, TypeError, Symbol, ArrayBuffer, String, Boolean, RegExp, parseInt, parseFloat, Map };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['steps.js', 'step3.js', 'step4.js', 'step5.js', 'crew.js', 'step6.js', 'jskernel.js']) vm.runInContext(fs.readFileSync(site + 'js/' + f, 'utf8'), ctx, { filename: f });
const P = ctx.PGJS, B = JSON.parse(fs.readFileSync(path.resolve(here, 'bridge_fixture.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(site + 'data/labels.json', 'utf8')).rows; const i2 = {}; rows.forEach((r, i) => { i2[r[0]] = i; });
const J = P.create({ tf, global: ctx }); const T = P.trainer(J, tf, { tick() {} });
const MECH = { '4f': { actions: { more: [], label: [], sharp: [], wrong: [] } } };
const pg = Object.assign({}, B, { pixels: new Uint8Array(fs.readFileSync(path.resolve(here, '../ref/cells64.u8'))), cellIndex: (id) => i2[id], kindOf: (id) => rows[i2[id]][2], epochs: 1, epochsMode: 'test', gpu: null, rough: false,
  live: T.live, trainingWatch: T.watch, trainState: () => T.state, falseAlarmAt95: P.falseAlarmAt95, twoGates: P.twoGates, gatesFor: ctx.PG_STEP3_gatesFor, auc: P.auc, saveModel: async () => false, mechOf: (id) => JSON.parse(JSON.stringify(MECH[id] || {})) });
Object.assign(pg, ctx.PG_PG_EXTRA(pg));
J.setPg(pg);
const SUBS = Object.fromEntries([...ctx.PG_STEP3.substeps, ...ctx.PG_STEP4.substeps, ...ctx.PG_STEP5.substeps, ...ctx.PG_STEP6.substeps].map((s) => [s.id, s]));
const runCell = async (s, vals) => {
  const r = await J.run(fill(s.code, vals), s.probe, () => {});
  if (r.error) return { pass: false, msg: (r.error.type === 'Check' ? '' : 'ERROR ') + P.friendly(r.error) + (r.error.line ? ' (line ' + r.error.line + ')' : '') };
  if (r.probe && r.probe.probe_error) return { pass: false, msg: 'PROBE ' + r.probe.probe_error };
  const v = s.check(r.probe); v.r = r.probe; v.ms = r.ms; return v;
};
let t0 = Date.now();
for (const id of ['3a', '3c']) { const v = await runCell(SUBS[id], SUBS[id].ref); if (!v.pass) throw new Error(id + ' ' + v.msg); }
new Function('return ' + LOAD_SRC)()(tf, J.NS.model, FIX);
for (const id of ['3f', '3g', '4e', '5b', '5c', '5d', '5e', '5f', '5g']) { const v = await runCell(SUBS[id], SUBS[id].ref); if (!v.pass) throw new Error(id + ' ' + v.msg); }
console.log('prereq 3a-5g done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
// a realistic 4f action list (in the app it is the student's own sorting): the defects that passed, spread over the boxes
{ const esc = pg.shiftReport(J.NS.auditLog).escapes; MECH['4f'].actions = { more: esc.slice(0, 2), label: esc.slice(2, 4), sharp: esc.slice(4, 5), wrong: esc.slice(5) }; }
// missing-state message: 6c before 6b
{ const s = SUBS['6c']; const saved = J.NS.shiftStats; delete J.NS.shiftStats; const v = await runCell(s, s.ref); console.log('6c without 6b ->', v.msg); if (v.pass || !/Run 6b first/.test(v.msg)) { console.log('BAD missing-state message'); process.exitCode = 1; } }
const only = process.argv[2] ? process.argv[2].split(',') : null; let fails = 0; const RES = {}, WR = {};
for (const id of ['6b', '6c', '6d', '6e', '6f']) {
  const s = SUBS[id]; if (JSON.stringify(s.ref) !== JSON.stringify(FILLS[id].right)) { console.log(id, 'REF DIFFERS FROM FILLS'); fails++; }
  if (!only || only.includes(id)) for (const w of FILLS[id].wrong) { const t = Date.now(); const v = await runCell(s, w); if (id === '6d' && w[0] === '[]' && w[1][0] === 'w') WR.poor = v.r; console.log(`${id} WRONG ${JSON.stringify(w)} -> ${v.pass ? 'PASSED (BAD!)' : 'fails: ' + v.msg} [${((Date.now() - t) / 1000).toFixed(1)}s]`); if (v.pass || /^PROBE|undefined|NaN|^ERROR \w*Error:/.test(v.msg)) fails++; }
  const t = Date.now(); const v = await runCell(s, s.ref); RES[id] = v.r; console.log(`${id} RIGHT -> ${v.pass ? 'PASS: ' : 'FAIL: '}${v.msg} [${((Date.now() - t) / 1000).toFixed(1)}s]`); if (!v.pass) fails++;
}
if (RES['6f']) {
  const NS = J.NS, F = NS.facts();
  if (!WR.poor) { const v = await runCell(SUBS['6d'], FILLS['6d'].wrong[0]); WR.poor = v.r; }
  console.log('\n=== REAL REPORT (scripted model) ===\n' + RES['6e'].raw);
  console.log('\n=== PLANTED COPY ===', JSON.stringify(RES['6f'].planted.planted), '\nflagged:', RES['6f'].onPlanted.wrong, '| real ok:', RES['6f'].onReal.ok);
  console.log('\n=== GUARDRAIL ATTEMPTS ===\n' + RES['6f'].attempts.map((a, i) => `draft ${i + 1}: ${a.ok ? 'PASS' : 'FAIL ' + a.feedback}`).join('\n') + '\n--- final ---\n' + RES['6f'].final);
  const out = { source: 'tools/tests/js_cells6.test.mjs (Node, TF.js CPU, test fixture model)', crew_js: ctx.MiniCrew.VERSION,
    audit_log: NS.auditLog, slices: { mono: NS.mono, poly: NS.poly, sure: NS.sure, unsure: NS.unsure }, cell_val: B.cell_val, prob_val: B.prob_val, y_val: B.y_val, actions: MECH['4f'].actions,
    js: { tools: F, outs: RES['6e'].outs.map((o) => o.raw), poor: WR.poor ? WR.poor.report : null, planted: RES['6f'].planted.text, planted_now: RES['6f'].planted.planted.map((p) => p.now), on_planted: RES['6f'].onPlanted, on_real: RES['6f'].onReal,
      guarded: RES['6f'].attempts, guarded_final: RES['6f'].final, trace_types: RES['6e'].trace.map((e) => e.type + (e.tool ? ':' + e.tool : '')), prompts: RES['6c'].agents.map((a) => a.prompt) } };
  fs.writeFileSync(path.resolve(here, '../research/step6_inputs.json'), JSON.stringify(out));
}
console.log('FAILS:', fails, '| total', ((Date.now() - t0) / 1000).toFixed(0), 's'); process.exit(fails ? 1 : (process.exitCode || 0));
