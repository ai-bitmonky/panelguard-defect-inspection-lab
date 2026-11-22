// Step 4 JavaScript cells (right answer + plausible wrong answers) through the SAME kernel, probes and checks, real TensorFlow.js (CPU) under Node.
// Model = TEST FIXTURE (Step 3 architecture trained in real Keras, see fixture.mjs). For speed, 4d uses the first 20 validation defects here
// (the browser tests use all of them).
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
import { FILLS, fill } from './fills.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site') + '/';
const require = createRequire(import.meta.url); const tf = require(path.resolve(here, '../node_modules/@tensorflow/tfjs/dist/tf.node.js'));
await tf.setBackend('cpu');
const ctx = { console, setTimeout, clearTimeout, Proxy, Promise, tf, Math, Array, Object, JSON, Number, Float32Array, Uint8Array, Date, isNaN, isFinite, Infinity, NaN, undefined, Error, ReferenceError, TypeError, Symbol, ArrayBuffer, String, Boolean, RegExp, parseInt, parseFloat };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['steps.js', 'step3.js', 'step4.js', 'jskernel.js']) vm.runInContext(fs.readFileSync(site + 'js/' + f, 'utf8'), ctx, { filename: f });
const P = ctx.PGJS, B = JSON.parse(fs.readFileSync(path.resolve(here, 'bridge_fixture.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(site + 'data/labels.json', 'utf8')).rows; const i2 = {}; rows.forEach((r, i) => { i2[r[0]] = i; });
const J = P.create({ tf, global: ctx }); const T = P.trainer(J, tf, { tick() {} });
const pg = Object.assign({}, B, { pixels: new Uint8Array(fs.readFileSync(path.resolve(here, '../ref/cells64.u8'))), cellIndex: (id) => i2[id], epochs: 1, epochsMode: 'test', gpu: null, rough: false,
  live: T.live, trainingWatch: T.watch, trainState: () => T.state, falseAlarmAt95: P.falseAlarmAt95, twoGates: P.twoGates, gatesFor: ctx.PG_STEP3_gatesFor, auc: P.auc, saveModel: async () => false });
Object.assign(pg, ctx.PG_PG_EXTRA(pg)); pg.defectIdx = pg.defectIdx.slice(0, 20);
J.setPg(pg);
const SUBS = Object.fromEntries([...ctx.PG_STEP3.substeps, ...ctx.PG_STEP4.substeps].map((s) => [s.id, s]));
const runCell = async (s, vals) => {
  const r = await J.run(fill(s.code, vals), s.probe, () => {});
  if (r.error) return { pass: false, msg: (r.error.type === 'Check' ? '' : 'ERROR ') + P.friendly(r.error) + (r.error.line ? ' (line ' + r.error.line + ')' : '') };
  if (r.probe && r.probe.probe_error) return { pass: false, msg: 'PROBE ' + r.probe.probe_error };
  return s.check(r.probe);
};
for (const id of ['3a', '3c']) { const v = await runCell(SUBS[id], SUBS[id].ref); if (!v.pass) throw new Error(id + ' ' + v.msg); }
new Function('return ' + LOAD_SRC)()(tf, J.NS.model, FIX);
for (const id of ['3f', '3g']) { const v = await runCell(SUBS[id], SUBS[id].ref); console.log('prereq', id, v.msg); if (!v.pass) throw new Error(id); }
const only = process.argv[2] ? process.argv[2].split(',') : null; let fails = 0;
for (const id of ['4b', '4c', '4d', '4e']) {
  const s = SUBS[id]; if (JSON.stringify(s.ref) !== JSON.stringify(FILLS[id].right)) { console.log(id, 'REF DIFFERS FROM FILLS'); fails++; }
  if (only && !only.includes(id)) { await runCell(s, s.ref); continue; }
  for (const w of FILLS[id].wrong) { const t = Date.now(); const v = await runCell(s, w); console.log(`${id} WRONG ${JSON.stringify(w)} -> ${v.pass ? 'PASSED (BAD!)' : 'fails: ' + v.msg} [${((Date.now() - t) / 1000).toFixed(0)}s]`); if (v.pass || /^PROBE|undefined|NaN/.test(v.msg)) fails++; }
  const t = Date.now(); const v = await runCell(s, s.ref); console.log(`${id} RIGHT -> ${v.pass ? 'PASS: ' : 'FAIL: '}${v.msg} [${((Date.now() - t) / 1000).toFixed(0)}s]`); if (!v.pass) fails++;
}
console.log('FAILS:', fails); process.exit(fails ? 1 : 0);
