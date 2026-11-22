// Runs every substep's code + probe + check in Pyodide under Node, using the SAME self-hosted files and the SAME kernel core.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site') + '/';
const ctx = { console, setInterval, clearInterval, setTimeout }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(site + 'js/steps.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(site + 'js/pyworker.js', 'utf8'), ctx);
const pyBase = path.resolve(here, '../cdn-mirror/pyodide/v314.0.8/full') + '/';
const { loadPyodide } = await import(pyBase + 'pyodide.mjs');
const only = process.argv[2] ? process.argv[2].split(',') : null;
let pending = null, log = [];
const post = (m) => { if (m.type === 'stdout') log.push(m.text); else if (m.type === 'progress') {} else if (pending) { const p = pending; pending = null; p(m); } };
const handle = ctx.PGKernelCore(post, loadPyodide, ctx.PG_PY_HELP);
const call = (m) => new Promise((res) => { pending = res; handle(m); });
const t0 = Date.now();
const readyP = new Promise((res) => { pending = res; });
handle({ cmd: 'init', pyBase });
handle({ cmd: 'data', buf: fs.readFileSync(path.resolve(here, '../ref/cells64.u8')), labels: fs.readFileSync(site + 'data/labels.json', 'utf8') });
const rd = await readyP; if (rd.type !== 'ready') { console.log('init msg', rd); process.exit(1); }
console.log('READY', JSON.stringify(rd.versions), 'pyodide', rd.pyodide, ((Date.now() - t0) / 1000).toFixed(1) + 's');
let fails = 0; const results = {};
const subs = ctx.PG_STEPS.flatMap((s) => s.substeps).filter((s) => s.kind === 'code');
for (const s of subs) {
  const F = FILLS[s.id]; const test = !only || only.includes(s.id);
  const tryIt = async (vals, label) => {
    log = []; const t = Date.now();
    const r = await call({ cmd: 'run', id: s.id, code: fill(s.code, vals), probe: s.probe });
    const sec = (Date.now() - t) / 1000;
    let verdict;
    if (r.error) verdict = { pass: false, msg: 'PYERR ' + r.error.type + ': ' + r.error.msg.slice(0, 120) + ' (line ' + r.error.line + ')' };
    else if (r.probe && r.probe.probe_error) verdict = { pass: false, msg: 'PROBE ' + r.probe.probe_error };
    else verdict = s.check(r.probe);
    return { verdict, sec, r };
  };
  if (test) for (const w of F.wrong) {
    const { verdict, sec } = await tryIt(w, 'wrong');
    const ok = !verdict.pass; if (!ok) fails++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.id} wrong [${w}] -> ${verdict.pass ? 'PASSED (should fail!)' : verdict.msg}  ${sec.toFixed(1)}s`);
  }
  if (test) for (const w of (F.alsoRight || [])) {
    const { verdict } = await tryIt(w);
    if (!verdict.pass) fails++;
    console.log(`${verdict.pass ? 'ok  ' : 'FAIL'} ${s.id} alt-right [${w}] -> ${verdict.msg}`);
  }
  const { verdict, sec, r } = await tryIt(F.right);
  if (!verdict.pass) fails++;
  results[s.id] = { sec, probe: r.probe };
  console.log(`${verdict.pass ? 'ok  ' : 'FAIL'} ${s.id} RIGHT [${F.right}] -> ${verdict.msg}  ${sec.toFixed(1)}s`);
  if (s.id === '2b' || s.id === '2e' || s.id === '2d') console.log('   stdout:', log.join('\n   '));
  // mechanic-side Python calls
  if (s.id === '1d') { const d = await call({ cmd: 'eval', id: 'dice', code: '_r = _pg_dice(7)' }); console.log('   dice(7):', JSON.stringify(d.probe)); if (!d.probe || !d.probe.share) fails++; }
  if (s.id === '2a') for (const k of [['A'], ['B'], ['C'], ['A', 'B', 'C'], ['R']]) { const t = Date.now(); const d = await call({ cmd: 'eval', id: 'mix', code: '_r = _pg_mix(' + JSON.stringify(k) + ')' }); console.log('   mix', k.join('+'), JSON.stringify(d.probe), ((Date.now() - t) / 1000).toFixed(1) + 's'); if (!d.probe || d.probe.auc == null) fails++; }
  if (s.id === '2a') { await call({ cmd: 'run', id: 'keep', code: 'F = np.hstack([A, B, C])', probe: '_r = {"F": list(F.shape)}' }); }
  if (s.id === '2c') { const d = await call({ cmd: 'eval', id: 'pre', code: subs.find((x) => x.id === '2d').preProbe }); console.log('   2d preProbe curve points:', d.probe && d.probe.curve && d.probe.curve.length); if (!d.probe || !d.probe.curve) fails++; }
  // explain() must work with real numbers
  try { const e = s.explain(r.probe, {}); if (!e.steps.length) throw 0; } catch (e) { fails++; console.log('FAIL explain', s.id, e); }
}
const p2e = results['2e'] && results['2e'].probe;
if (p2e) console.log('REPORT', JSON.stringify({ tp: p2e.tp, fn: p2e.fn, fp: p2e.fp, tn: p2e.tn, recall: p2e.rec, far: p2e.far, precision: p2e.tp / (p2e.tp + p2e.fp), cut: p2e.cut }));
console.log('right-answer seconds:', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.sec])));
console.log(fails ? `FAILURES: ${fails}` : 'ALL KERNEL TESTS PASSED', 'total', ((Date.now() - t0) / 1000).toFixed(0) + 's');
process.exit(fails ? 1 : 0);
