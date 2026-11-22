// AUDIT scope D: REVIEW mode from an EMPTY browser (single file, file://). Open every page 0a-8g (renders, no NaN/undefined,
// no console error), then on the LAST code cell of every step: "Fill reference answer" (editor = reference code) and
// "Run up to here" (passes, card has real values). Also runs the 8e Python twin's learning-curve lines in the app's own Pyodide kernel.
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url'; import { fill } from '../tests/fills.mjs'; import { loadSteps } from '../tests/seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const shots = path.resolve(here, 'shots'); fs.mkdirSync(shots, { recursive: true });
const { SUBS } = loadSteps();
const DIST = process.env.DIST || path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
const LAST = (process.env.LAST || '1e,2e,3g,4e,5g,6f,7g,8e').split(',');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx);
await ctx.addInitScript(() => { window.addEventListener('unhandledrejection', (e) => { try { console.error('UNHANDLED REJECTION ' + String(e.reason && (e.reason.stack || e.reason.message) || e.reason)); } catch (x) {} }); });
const page = await ctx.newPage(); const errors = []; const R = { pages: {}, runs: {}, fails: [], errors };
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) R.fails.push(what); fs.writeFileSync(path.resolve(here, 'd_review_results.json'), JSON.stringify(R, null, 1)); return ok; };
const ev = (f, a) => page.evaluate(f, a);
const open = async (id) => { await ev((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(100); await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(900); };
const BAD = /\bNaN\b|\bundefined\b|\[object Object\]/;
const refCode = (id) => { let c = fill(SUBS[id].code, SUBS[id].ref || []); for (const f of SUBS[id].fixes || []) c = c.split(f[0]).join(f[1]); return c; };
await page.goto('file://' + DIST);
await page.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
expect(await ev(() => Object.keys(window.PG.S.subs).length === 0), 'empty browser: no saved progress');
await page.locator('#revbtn').click(); await page.waitForTimeout(3000);
await page.waitForFunction(() => window.PG && window.PG.S && window.PG.review && window.PG.review(), null, { timeout: 120000 });
expect(await ev(() => window.PG.review()), 'review mode ON from the top-bar button');
const ORDER = await ev(() => window.PG.ORDER);
// every page, before any data
for (const id of ORDER) {
  const e0 = errors.length; await open(id);
  const st = await ev(() => ({ cur: window.PG.S.cur, viz: (document.getElementById('out') || {}).innerText || '', work: (document.getElementById('work') || {}).innerText || '' }));
  const bad = (st.viz.match(BAD) || st.work.replace(/\.edw[\s\S]*/, '').match(BAD) || [])[0];
  R.pages[id] = { cur: st.cur, bad: bad || null, newErrors: errors.slice(e0), hint: /Run up to here/.test(st.viz + st.work) };
  expect(st.cur === id && !bad && errors.length === e0, 'review: opens ' + id + (bad ? ' (shows ' + bad + ')' : '') + (errors.length > e0 ? ' ERRORS ' + JSON.stringify(errors.slice(e0)) : ''));
  if (process.env.SHOTS !== '0') await page.screenshot({ path: `${shots}/rv_${id}.png` });
}
await page.waitForFunction(() => window.PG.ready() && window.PG.JSR.ready, null, { timeout: 1800000 });
for (const id of LAST) {
  await open(id);
  await page.locator('#reffill').click(); await page.waitForTimeout(300);
  const ed = await page.locator('.edw textarea').first().inputValue();
  expect(ed === refCode(id), id + ' “Fill reference answer” puts the reference code in the editor');
  const t = Date.now(); await page.locator('#runupto').click();
  await page.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 3600000 }); await page.waitForTimeout(1200);
  const v = await ev((i) => window.PG.VERD[i], id); const stat = await ev(() => (document.getElementById('rvstat') || {}).textContent || '');
  const viz = await ev(() => (document.getElementById('vizbox') || {}).innerText || ''); const m = viz.match(BAD);
  R.runs[id] = { sec: (Date.now() - t) / 1000, pass: v && v.pass, msg: v && v.msg, stat, bad: m ? viz.slice(Math.max(0, m.index - 100), m.index + 40) : null };
  expect(v && v.pass && viz.trim().length > 20 && !m, id + ' “Run up to here” (' + ((Date.now() - t) / 1000).toFixed(0) + ' s): ' + (v ? v.msg.slice(0, 160) : 'no verdict') + ' | ' + stat + (m ? ' | card shows ' + m[0] + ': ' + R.runs[id].bad : ''));
  await page.locator('#out').evaluate((e) => { e.scrollTop = 0; }); await page.screenshot({ path: `${shots}/rv_run_${id}.png` });
}
// every page again, now with data (review copies)
for (const id of ORDER) { const e0 = errors.length; await open(id); const viz = await ev(() => (document.getElementById('out') || {}).innerText || ''); const b = viz.match(BAD);
  expect(!b && errors.length === e0, 'review with data: ' + id + ' renders' + (b ? ' (shows ' + b[0] + ': ' + viz.slice(Math.max(0, b.index - 80), b.index + 30).replace(/\n/g, ' / ') + ')' : '') + (errors.length > e0 ? ' ERRORS ' + JSON.stringify(errors.slice(e0)) : '')); }
// 8e Python twin: the learning-curve lines, in the app's own Python notebook
const tw = SUBS['8e'].twin; const lc = tw.split('\n').slice(0, 4).join('\n');
const r8 = await ev((src) => window.PG.kEval('import json\n_src = ' + JSON.stringify(src) + '\n_r = {"has_features": "features" in globals(), "has_SKF": "StratifiedKFold" in globals(), "has_best": "best" in globals(), "has_F": "F" in globals()}\ntry:\n    exec(compile(_src, "twin8e", "exec"), globals())\n    _r["ran"] = True; _r["va"] = [round(float(v), 3) for v in va.mean(axis=1)]; _r["sizes"] = [int(s) for s in sizes]\nexcept Exception as e:\n    _r["ran"] = False; _r["err"] = type(e).__name__ + ": " + str(e)\n'), lc);
R.twin8e = r8; log('8e twin (learning-curve lines) in the app notebook:', JSON.stringify(r8));
expect(errors.length === 0, 'zero console errors in review mode' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 60000).toFixed(1) + ' min | FAILS', R.fails.length);
await browser.close(); process.exit(0);
