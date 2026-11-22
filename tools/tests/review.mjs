// Review mode (v0.4) in real headless Chrome. TARGET=site|file|srcdoc. FULL=1 (site): also "Run up to here" on 3f (Step 3 training, 1-epoch review setting).
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const MODE = process.env.TARGET || 'site', W = 1366, H = 768, KEY = 'panelguard.v0.1';
const DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v0.4.html');
let srv = null;
if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8768'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx);
const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/rv_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const fails = []; const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const ev = (f, a) => F.evaluate(f, a);
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
// fresh visit
if (MODE === 'site') await page.goto('http://localhost:8768/index.html');
else if (MODE === 'file') await page.goto('file://' + DIST);
else { await page.goto('http://localhost:8768/data/labels.json'); await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:' + W + 'px;height:' + H + 'px;border:0"></iframe>');
  await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); F = await frame(); }
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready, null, { timeout: 300000 });
log('fresh visit ready after', ((Date.now() - t0) / 1000).toFixed(0), 's');
expect(!(await ev(() => window.PG.review())), 'starts in student mode (review OFF)');
expect(await ev(() => !window.PG.passed('1a') && window.PG.S.cur === '0a'), 'student mode: fresh visit lands on 0a');
// toggle ON with the top-bar button
const before = await ev((k) => { try { return localStorage.getItem(k); } catch (e) { return 'blocked'; } }, KEY);
await F.locator('#revbtn').click(); await page.waitForTimeout(400);
expect(await ev(() => window.PG.review() && document.body.classList.contains('review') && getComputedStyle(document.getElementById('revbar')).display !== 'none' && /ON/.test(document.getElementById('revbtn').textContent)), 'toggle ON: button says ON, banner visible');
await shot('on');
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(600); };
await open('2e'); expect(await ev(() => window.PG.S.cur === '2e' && !!document.getElementById('runupto')), 'opens 2e directly (fresh visit), review buttons shown');
expect(/Run up to here/.test(await F.locator('#vizbox').innerText()), '2e output says “press Run up to here” (no fake output)');
await shot('2e');
await open('3g'); expect(await ev(() => window.PG.S.cur === '3g'), 'opens 3g directly');
expect(/Run up to here/.test(await F.locator('#prebox').innerText()), '3g two-gate widget asks for Run up to here');
await shot('3g');
await open('0c'); expect(await ev(() => window.PG.S.cur === '0c'), 'opens Step 0 page'); await open('3d');
await F.locator('#prebox [data-aug="lr"]').click(); await F.locator('#prebox [data-drop="real"]').click();
expect(await ev(() => (window.PG.RV.subs['3d'].mech.bins || {}).lr === 'real'), '3d sort works straight away (no kernel data needed)');
await open('3a'); await F.locator('#reffill').click(); expect(!/____/.test(await F.locator('.edw textarea').inputValue()), 'Fill reference answer fills every gap');
// blank ____ left in the code: never run, plain message, line highlighted (Python and JS, incl. a blank touching a number)
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); };
await open('1c'); await setCode("# 1 = defect, 0 = OK\ny = (prob >= 0.___).astype(int)\n");
await F.locator('#runbtn').click(); await page.waitForTimeout(300);
let b1 = await ev(() => ({ msg: (window.PG.VERD['1c'] || {}).msg, res: !!window.PG.RES['1c'], err: [...document.querySelectorAll('.gut .err')].map((e) => e.textContent) }));
expect(/^Line 2 still has a blank ____ \. Type your answer there, then press Run\.$/.test(b1.msg) && !b1.res && b1.err.join() === '2', 'Python blank “0.___” not run: “' + b1.msg + '”, line ' + b1.err + ' highlighted');
await open('3c'); await F.locator('#runbtn').click(); await page.waitForTimeout(300);
b1 = await ev(() => ({ msg: (window.PG.VERD['3c'] || {}).msg, err: [...document.querySelectorAll('.gut .err')].map((e) => e.textContent) }));
expect(/^Line 2 still has a blank/.test(b1.msg) && b1.err.join() === '2', 'JS blank not run: “' + b1.msg + '”');
await shot('blank');
// fold the output panel: rail + badge
const ww = () => ev(() => document.getElementById('work').getBoundingClientRect().width);
const w0 = await ww(); await F.locator('#ofold').click(); await page.waitForTimeout(300);
const w1 = await ww();
expect(await ev(() => document.getElementById('main').classList.contains('outc') && getComputedStyle(document.getElementById('orail')).display !== 'none'), 'fold: output panel folds to a rail');
expect(w1 > w0 + 300, 'fold: middle pane takes the freed width (' + Math.round(w0) + ' → ' + Math.round(w1) + ' px)');
await open('1c'); await F.locator('#reffill').click(); await F.locator('#runbtn').click();
await F.waitForFunction(() => window.PG.running() == null && window.PG.VERD['1c'] != null, null, { timeout: 60000 }); await page.waitForTimeout(200);
expect((await F.locator('#obadge').innerText().catch(() => '')).replace(/\s/g, '') === 'ERROR', 'fold: badge ERROR after a run that failed (1c before any data exists)');
await shot('folded_badge');
await setCode('y = (prob >= ____).astype(int)'); await F.locator('#runbtn').click(); await page.waitForTimeout(200);
expect((await F.locator('#obadge').innerText().catch(() => '')).replace(/\s/g, '') === 'CHECK', 'fold: badge CHECK after a blocked/failed check');
await F.locator('#obadge').click(); await page.waitForTimeout(300);
expect(await ev(() => !document.getElementById('main').classList.contains('outc') && !document.getElementById('obadge')), 'tap the badge: panel opens, badge cleared');
// Run up to here on 2c
await open('2c'); const t1 = Date.now(); await F.locator('#runupto').click();
await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 900000 }); await page.waitForTimeout(500);
const r2c = await ev(() => ({ pass: window.PG.VERD['2c'] && window.PG.VERD['2c'].pass, n: window.PG.RES['2c'] && window.PG.RES['2c'].cells.length, auc: window.PG.RES['2c'] && window.PG.RES['2c'].auc, gate: !!document.querySelector('#vizbox canvas'), stat: (document.getElementById('rvstat') || {}).textContent }));
expect(r2c.pass && r2c.n === 525 && r2c.gate, 'Run up to here on 2c: real output (' + r2c.n + ' cells scored, AUC ' + r2c.auc + ', gate drawn) in ' + ((Date.now() - t1) / 1000).toFixed(0) + 's | ' + r2c.stat);
await shot('2c_run');
await open('2d'); await F.locator('#ofold').click(); await F.locator('#reffill').click(); await F.locator('#runbtn').click();
await F.waitForFunction(() => window.PG.running() == null && window.PG.VERD['2d'] != null, null, { timeout: 60000 }); await page.waitForTimeout(200);
expect((await F.locator('#obadge').innerText().catch(() => '')).replace(/\s/g, '') === 'PASS', 'fold: badge PASS after a passing run (2d)');
if (process.env.FULL === '1') {
  await open('3f'); const t2 = Date.now(); await F.locator('#runupto').click();
  await page.waitForTimeout(20000); await shot('3f_running');
  await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 3600000 }); await page.waitForTimeout(500);
  const r = await ev(() => { const x = window.PG.RES['3f'], e = window.PG.RES['3e']; return x ? { pass: window.PG.VERD['3f'].pass, w: x.bestW, base: x.base.far, cnn: x.cnn.far, blend: x.blend.far, epochs: e && e.epochs, mode: e && e.quick, table: /SIDE BY SIDE/.test(document.getElementById('vizbox').innerText) } : null; });
  expect(r && r.pass && r.epochs === 1 && r.mode === 'review' && r.table, 'Run up to here on 3f: real output after 1-epoch review training: ' + JSON.stringify(r) + ' in ' + ((Date.now() - t2) / 60000).toFixed(1) + ' min');
  await shot('3f_run');
  await open('3e'); expect(/review setting: 1 epoch/.test(await F.locator('#work').innerText()), '3e shows "review setting: 1 epoch — numbers are rough"');
  await shot('3e');
}
// progress not written while ON
const after = await ev((k) => { try { return localStorage.getItem(k); } catch (e) { return 'blocked'; } }, KEY);
const norm = (x) => { try { const o = JSON.parse(x); return JSON.stringify({ cur: o.cur, subs: Object.fromEntries(Object.entries(o.subs || {}).filter(([, v]) => v.codePass || (v.pred && v.pred.locked) || (v.mech && Object.values(v.mech).some((x) => x && (typeof x !== 'object' || Object.keys(x).length))))) }); } catch (e) { return String(x); } };
expect(norm(before) === norm(after), 'student progress not written while ON (saved state identical before/after: ' + norm(after).slice(0, 120) + ')');
// OFF: back to the student's real progress and locks
await F.locator('#revbtn').click();
if (MODE === 'srcdoc') { await page.waitForTimeout(3000); F = await frame(); }
await page.waitForTimeout(2000);
await F.waitForFunction(() => window.PG && window.PG.ready(), null, { timeout: 300000 });
const off = await ev(() => ({ rv: window.PG.review(), cls: document.body.classList.contains('review'), cur: window.PG.S.cur, p2c: window.PG.passed('2c'), btn: document.getElementById('revbtn').textContent }));
expect(!off.rv && !off.cls && /OFF/.test(off.btn), 'toggle OFF: button says OFF, no banner');
expect(!off.p2c && off.cur === '0a', 'student mode after OFF: nothing passed, lands on 0a (' + off.cur + ')');
await ev(() => { location.hash = '#sub-2e'; }); await page.waitForTimeout(600);
expect(await ev(() => window.PG.S.cur === '0a'), 'student mode after OFF: 2e is locked again (redirected to 0a)');
await F.locator('.snode').nth(3).hover(); await page.waitForTimeout(200);
expect(/Locked/.test(await F.locator('#tip').innerText()), 'student mode after OFF: lock tooltip back');
expect(await ev(() => document.getElementById('main').classList.contains('outc')), 'fold state remembered across reload');
await F.locator('#oopen').click(); await page.waitForTimeout(300);
expect(await ev(() => !document.getElementById('main').classList.contains('outc')), 'rail open button expands the panel');
await shot('off');
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length);
await browser.close(); process.exit(fails.length ? 1 : 0);
