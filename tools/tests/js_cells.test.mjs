// Runs every Step 3 JavaScript cell (right answer + plausible wrong answers) through the SAME kernel (site/js/jskernel.js)
// and the SAME probe/check code (site/js/step3.js), with real TensorFlow.js (CPU backend) under Node.
// 3e: wrong answers must be rejected BEFORE any training; the right answer trains for real only in the browser tests.
// 3f/3g use the model built in 3c (not trained here): the checks test the student's code logic, not model quality.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url'; import { createRequire } from 'module';
import { FILLS, fill } from './fills.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site') + '/';
const require = createRequire(import.meta.url); const tf = require(path.resolve(here, '../node_modules/@tensorflow/tfjs/dist/tf.node.js'));
await tf.setBackend('cpu');
const ctx = { console, setTimeout, clearTimeout, Proxy, Promise, tf, Math, Array, Object, JSON, Number, Float32Array, Uint8Array, Date, isNaN, isFinite, Infinity, NaN, undefined, Error, ReferenceError, TypeError, Symbol, ArrayBuffer, String, Boolean, RegExp, parseInt, parseFloat };
ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['steps.js', 'step3.js', 'jskernel.js']) vm.runInContext(fs.readFileSync(site + 'js/' + f, 'utf8'), ctx, { filename: f });
const S3 = ctx.PG_STEP3, P = ctx.PGJS;
const B = JSON.parse(fs.readFileSync(path.resolve(here, 'bridge_fixture.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(site + 'data/labels.json', 'utf8')).rows; const i2 = {}; rows.forEach((r, i) => { i2[r[0]] = i; });
const J = P.create({ tf, global: ctx }); const T = P.trainer(J, tf, { tick() {} });
const pg = Object.assign({}, B, { pixels: new Uint8Array(fs.readFileSync(path.resolve(here, '../ref/cells64.u8'))), cellIndex: (id) => i2[id], epochs: 1, epochsMode: 'test', gpu: null,
  live: T.live, trainingWatch: T.watch, trainState: () => T.state, falseAlarmAt95: P.falseAlarmAt95, twoGates: P.twoGates, gatesFor: ctx.PG_STEP3_gatesFor, auc: P.auc, saveModel: async () => false });
J.setPg(pg);
const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0;
const runCell = async (s, vals) => {
  const out = []; const r = await J.run(fill(s.code, vals), s.probe, (t) => out.push(t));
  if (r.error) return { pass: false, msg: (r.error.type === 'Check' ? '' : 'ERROR ') + P.friendly(r.error) + (r.error.line ? ' (line ' + r.error.line + ')' : ''), error: r.error.type, out };
  if (r.probe && r.probe.probe_error) return { pass: false, msg: 'PROBE ' + r.probe.probe_error, out };
  return Object.assign(s.check(r.probe), { out, probe: r.probe });
};
for (const s of S3.substeps.filter((x) => x.lang === 'js')) {
  if (only && !only.includes(s.id)) { if (s.id !== '3e') await runCell(s, FILLS[s.id].right); continue; }   // prerequisites, silently
  const F = FILLS[s.id], t0 = Date.now();
  for (const w of F.wrong) { const v = await runCell(s, w); console.log(`${s.id} WRONG ${JSON.stringify(w)} -> ${v.pass ? 'PASSED (BAD!)' : 'fails: ' + v.msg}`); if (v.pass || /^PROBE|undefined|NaN/.test(v.msg)) fails++; }
  if (s.id === '3e') { console.log('3e RIGHT -> trains for real only in the browser tests (skipped here: CPU backend ~20 min per epoch)'); continue; }
  const v = await runCell(s, F.right); console.log(`${s.id} RIGHT -> ${v.pass ? 'PASS: ' : 'FAIL: '}${v.msg}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`); if (!v.pass) { fails++; console.log(v.out.join('\n')); }
  if (s.id === '3c') { J.NS.classWeight = null; }
}
console.log('tensors alive:', tf.memory().numTensors, '| FAILS:', fails); process.exit(fails ? 1 : 0);
