// AUDIT item 1 sweep: a WIDER set of wrong answers for every code cell (typo, case, off-by-one / scale, swapped gaps, wrong type,
// wrong variable), in REVIEW mode on a fresh browser after "Run up to here" 8e (all cells with reference answers, 1-epoch model).
// Each wrong run is followed by the reference run (restores the notebook). Records the verdict and the error box for reading.
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url'; import { fill } from '../tests/fills.mjs'; import { loadSteps } from '../tests/seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const { SUBS } = loadSteps();
const DIST = process.env.DIST; const OUT = path.resolve(here, process.env.OUT || 'sweep_results.json'); const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a); const ev = (f, a) => page.evaluate(f, a);
const open = async (id) => { await ev((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(100); await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const refCode = (id) => { let c = fill(SUBS[id].code, SUBS[id].ref || []); for (const f of SUBS[id].fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const run = async (id, code) => { await page.locator('.edw textarea').first().fill(code); await page.locator('#runbtn').click({ noWaitAfter: true }); const t = Date.now();
  while (true) { await page.waitForTimeout(400); const st = await ev((i) => ({ v: window.PG.VERD[i], r: window.PG.running() }), id); if (st.r == null && st.v) break;
    if (Date.now() - t > 90000) { const s = page.locator('.btn.stop'); if (await s.isVisible()) await s.click(); } if (Date.now() - t > 600000) break; }
  await page.waitForTimeout(250); return { v: await ev((i) => window.PG.VERD[i], id), err: await ev(() => (document.getElementById('errbox') || {}).innerText || ''), sec: (Date.now() - t) / 1000 }; };
// wrong-answer generator
const isNum = (v) => /^-?\d+(\.\d+)?$/.test(v), isQ = (v) => /^'.*'$/.test(v), isName = (v) => /^[A-Za-z_$][\w$]*$/.test(v);
function variants(ref) {
  const out = [], add = (k, a) => { if (JSON.stringify(a) !== JSON.stringify(ref) && !out.some((o) => JSON.stringify(o.w) === JSON.stringify(a))) out.push({ kind: k, w: a }); };
  const g = ref[0];
  if (isName(g) && g.length > 2) add('typo (letter dropped)', [g.slice(0, -1), ...ref.slice(1)]);
  if (isQ(g) && g.length > 4) add('typo in text', [g.slice(0, -2) + "'", ...ref.slice(1)]);
  if (isName(g)) add('wrong case', [g[0] === g[0].toUpperCase() ? g[0].toLowerCase() + g.slice(1) : g[0].toUpperCase() + g.slice(1), ...ref.slice(1)]);
  for (let i = 0; i < ref.length; i++) { const v = ref[i];
    if (isNum(v)) { const n = +v; add('off by one / scale', ref.map((x, j) => j === i ? String(Number.isInteger(n) ? n + 1 : Math.round(n * 100 * 1e6) / 1e6) : x)); add('wrong type (text)', ref.map((x, j) => j === i ? "'" + v + "'" : x)); }
    else if (isQ(v)) add('wrong type (number)', ref.map((x, j) => j === i ? '0' : x));
    else if (isName(v)) add('wrong type (empty list)', ref.map((x, j) => j === i ? '[]' : x)); }
  if (ref.length >= 2 && ref[0] !== ref[1]) add('swapped gaps', [ref[1], ref[0], ...ref.slice(2)]);
  const WV = { idx_train: 'idx_val', idx_val: 'idx_train', idx_test: 'idx_train', y: 'prob', auditLog: 'shift3', pBlend: 'pCnn', low: 'high', high: 'low', kPassed: 'nDefects', bestW: 'w', i: 'c', part: 'idx_train', N: 'R', key: 'lane', lane: 'key', resume: 'goto', memory: 'line' };
  ref.forEach((v, i) => { if (WV[v]) add('wrong variable', ref.map((x, j) => j === i ? WV[v] : x)); });
  return out.slice(0, 6);
}
const RAW = /\n\s+at |Traceback|line \d+, in |^\w*Error:|TypeError|ReferenceError|Cannot read prop|\bundefined\b|\bNaN\b|\[object |\bnull\b/m;
await page.goto('file://' + DIST); await page.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
await page.locator('#revbtn').click(); await page.waitForTimeout(1500);
await page.waitForFunction(() => window.PG.ready() && window.PG.JSR.ready, null, { timeout: 1800000 });
await open(process.env.UPTO || '8e'); await page.locator('#runupto').click(); await page.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 3600000 });
log('run up to 8e:', await ev(() => (document.getElementById('rvstat') || {}).textContent));
const R = fs.existsSync(OUT) && ONLY ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let ids = Object.keys(SUBS).filter((i) => SUBS[i].kind === 'code' && (SUBS[i].ref || []).length); ids = ids.filter((i) => i !== '3c').concat(['3c']); if (ONLY) ids = ids.filter((i) => ONLY.includes(i));
const EXTRA = process.env.VARS ? JSON.parse(process.env.VARS) : null;
for (const id of ids) {
  await open(id); const list = EXTRA ? EXTRA[id].map((w) => ({ kind: 'given', w })) : variants(SUBS[id].ref); R[id] = [];
  for (const x of list) {
    const r = await run(id, fill(SUBS[id].code, x.w)); const plainMsg = r.err ? r.err.split(/Show the raw/)[0] : '';
    const flag = r.v && r.v.pass ? 'PASSED' : (RAW.test(r.v ? r.v.msg : '') || RAW.test(plainMsg.replace(/^ERROR\s*/, '')) ? 'RAW?' : (r.v ? '' : 'NO VERDICT'));
    R[id].push({ kind: x.kind, w: x.w, pass: r.v && r.v.pass, msg: r.v && r.v.msg, err: plainMsg.slice(0, 500), flag, sec: r.sec });
    log(id, x.kind, JSON.stringify(x.w), '->', flag || 'ok', '|', ((r.v && r.v.msg) || '') + (plainMsg ? ' || ' + plainMsg.replace(/\n/g, ' / ') : '').slice(0, 300));
  }
  const back = await run(id, refCode(id)); if (!back.v || !back.v.pass) log('!! reference did not pass again on', id, back.v && back.v.msg);
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
}
log('console errors', errors.length, JSON.stringify(errors.slice(0, 5)));
await browser.close(); process.exit(0);
