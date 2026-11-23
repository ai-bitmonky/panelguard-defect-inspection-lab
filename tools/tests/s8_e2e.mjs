// Step 8 end to end in real headless Chrome. TARGET=site|file|srcdoc. QUICK=1: one wrong answer per cell. RELOAD=0 / REVIEW=0 / FLAG=0 skip parts.
// Start state: Steps 0-7 passed (s8seed.mjs); Step 3 model = the Keras-trained TEST FIXTURE. Everything replays for real, then every Step 8 part runs for real.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs'; import { SUBS, putFixture, state8, KEY } from './s8seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const W = 1366, H = 768, MODE = process.env.TARGET || 'site', QUICK = process.env.QUICK === '1', DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
let srv = null; if (MODE !== 'file') { srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8775'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r)); }
process.on('exit', () => { try { srv && srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:8775' }); } catch (e) {}
const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let n = 0; const shot = async (nm) => page.screenshot({ path: `${shots}/s8_${MODE}_${String(++n).padStart(2, '0')}_${nm}.png` });
let F = page; const ev = (f, a) => F.evaluate(f, a); const fails = [];
const expect = (ok, what) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) fails.push(what); };
const frame = async () => { for (let i = 0; i < 80; i++) { const x = page.frames().find((q) => q.url().startsWith('about:srcdoc')); if (x) return x; await page.waitForTimeout(100); } return page.frames()[1]; };
const URL0 = 'http://localhost:8775/index.html' + (process.env.FLAG === '0' ? '' : '?pgEpochs=1');
const loadApp = async (first) => {
  if (MODE === 'site') { if (first) await page.goto(URL0); else await page.reload(); F = page; }
  else if (MODE === 'file') { if (first) await page.goto('file://' + DIST); else await page.reload(); F = page; }
  else { if (first) await page.goto('http://localhost:8775/data/labels.json');
    await page.setContent('<style>body{margin:0}</style><iframe id=f sandbox="allow-scripts allow-same-origin" style="width:100vw;height:100vh;border:0"></iframe>');
    await page.evaluate((h) => { document.getElementById('f').srcdoc = h; }, fs.readFileSync(DIST, 'utf8')); await page.waitForTimeout(1500); F = await frame(); }
};
await loadApp(true);
await F.waitForFunction(() => window.PG && window.PG.JSR.ready, null, { timeout: 300000 });
await putFixture(ev);
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, state8('8a')]);
await loadApp(false);
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['7g'], null, { timeout: 1200000 });
log('ready: Steps 0-7 rebuilt after', ((Date.now() - t0) / 1000).toFixed(0), 's');
const open = async (id) => { await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(800); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const run = async (id, timeout = 600000) => { const t = Date.now(); await F.locator('#runbtn').click({ noWaitAfter: true }); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); const v = await ev((i) => window.PG.VERD[i], id); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS' : 'fail', '|', v.msg.slice(0, 220)); return v; };
const codeStep = async (id, wrongs) => { for (const w of (QUICK ? wrongs.slice(0, 1) : wrongs)) { await setCode(fill(SUBS[id].code, w)); const v = await run(id); expect(!v.pass, id + ' wrong answer ' + JSON.stringify(w) + ' fails with a plain message'); } await setCode(fill(SUBS[id].code, SUBS[id].ref)); const v = await run(id); expect(v.pass, id + ' right answer passes'); return v; };
const top = async () => { await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); };
const outText = () => F.locator('#out').innerText();
const drag = async (loc, dx, dy, at = [0.5, 0.5]) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); const x = b.x + b.width * at[0], y = b.y + b.height * at[1]; await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx, y + dy, { steps: 8 }); await page.mouse.up(); };

expect(await ev(() => document.querySelectorAll('.ns.lock').length === 0 && !/COMING NEXT/.test(document.querySelector('#nav').innerText)), 'nothing locked in the course list (Step 8 unlocked, no “coming next”)');
expect(await ev(() => /v1\.0/.test(document.title) && /v1\.0/.test(document.querySelector('.top .brand').textContent) && /v1\.0/.test(document.querySelector('.foot').innerText)), 'v1.0 in title, brand and footer');
// ---------- 8a ----------
await open('8a'); await F.locator('[data-lock8="flow"]').waitFor({ timeout: 60000 });
expect(await F.locator('#lockrange8').isDisabled() && await F.locator('#seal8').isDisabled(), '8a range and seal blocked until the sheet is locked');
for (const k of ['model', 'bestW', 'low', 'lowPoly', 'high', 'flow']) { await F.locator(`[data-lock8="${k}"]`).click(); await page.waitForTimeout(120); }
{ const svgL = F.locator('#guess8 svg'); await svgL.scrollIntoViewIfNeeded(); const b = await svgL.boundingBox(), X = (v) => b.x + b.width * (24 + 560 * v / 20) / 600, y = b.y + b.height * 0.7;
  await page.mouse.move(X(8), y); await page.mouse.down(); await page.mouse.move(X(7), y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(200); }
const rng = (await mech('8a')).range; expect(rng && rng[1] === 7 && rng[0] === 2, '8a band end dragged on the number line (' + JSON.stringify(rng) + ')');
await F.locator('#lockrange8').click(); await page.waitForTimeout(300);
{ const s = F.locator('#seal8'); await s.scrollIntoViewIfNeeded(); const b = await s.boundingBox(); await page.mouse.move(b.x + 30, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(300);
  expect(!(await mech('8a')).sealOpen, '8a letting go early does not break the seal');
  await page.mouse.down(); await page.waitForTimeout(2500); await page.mouse.up(); await page.waitForTimeout(1200); }
const m8a = await mech('8a'); expect(m8a.sealOpen && m8a.frozen && m8a.frozen.model && await pend('8a') === null, '8a seal broken, frozen sheet recorded (model ' + (m8a.frozen || {}).model + ', w ' + (m8a.frozen || {}).bestW + ')'); await shot('8a');
// ---------- 8b ----------
await open('8b'); const v8b = await codeStep('8b', FILLS['8b'].wrong);
expect(await F.locator('#trial8').count() === 1 && await F.locator('[data-flag8="honest"]').count() >= 1, '8b trial card with the honest-test line'); await top(); await shot('8b');
const T = await ev(() => window.PG.RES['8b'].trial); log('TRIAL', JSON.stringify({ all: T.all, mono: T.mono, poly: T.poly, per1000: T.per1000 }));
// ---------- 8c ----------
await open('8c'); await page.waitForTimeout(800);
for (let i = 0; i < 10; i++) { await drag(F.locator('#lever8'), 0, 80, [0.71, 0.2]); await page.waitForTimeout(250); }
for (let i = 0; i < 3; i++) { await F.locator('#lever8x10').click(); await page.waitForTimeout(100); }
expect((await mech('8c')).pulls >= 40 && (await mech('8c')).dots.length >= 40, '8c lever pulled: ' + (await mech('8c')).pulls + ' redrawn shifts'); await F.locator('#lever8').scrollIntoViewIfNeeded(); await shot('8c_lever');
await codeStep('8c', FILLS['8c'].wrong); expect(await F.locator('#intline8').count() === 1, '8c interval line shown'); await top(); await shot('8c');
log('INTERVAL', JSON.stringify(await ev(() => ({ wilson: window.PG.RES['8c'].ref, boot: window.PG.RES['8c'].boot, under: window.PG.RES['8c'].refUnder }))));
// ---------- 8d ----------
await open('8d'); await codeStep('8d', FILLS['8d'].wrong);
for (const k of ['dark|bright', 'blur|sharp', 'fault|contrast', 'poly|score']) { await F.locator(`[data-cell8="${k}"]`).click(); await page.waitForTimeout(100); }
await F.locator('#matrixcheck8').click(); await page.waitForTimeout(500);
expect(await pend('8d') === null && (await mech('8d')).matrixLocked, '8d alarm matrix checked once and locked (' + (await mech('8d')).nRight + ' of 16 right)');
log('DRIFT', JSON.stringify(await ev(() => ({ today: window.PG.RES['8d'].today, alarms: window.PG.RES['8d'].alarms })))); await F.locator('#matrix8').scrollIntoViewIfNeeded(); await shot('8d');
// ---------- 8e ----------
await open('8e'); await codeStep('8e', FILLS['8e'].wrong);
log('CURVE', JSON.stringify(await ev(() => window.PG.RES['8e'].curve)));
await F.locator('#own8sky').scrollIntoViewIfNeeded(); await F.locator('#own8sky').click();
await F.waitForFunction(() => /drawing/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 120000 });
expect(/Far from the training photos|inside the range/.test(await F.locator('#own8res').innerText()), '8e sample photo (no upload) scored with the distance check');
const png = path.resolve(shots, 'upload_test.png'); if (!fs.existsSync(png)) fs.copyFileSync(path.resolve(here, '../../site/data/full/' + fs.readdirSync(path.resolve(here, '../../site/data/full')).find((f) => f.endsWith('.png'))), png);
await F.locator('#own8file').setInputFiles(png);
await F.waitForFunction(() => /upload_test/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 120000 });
const own = await F.locator('#own8res').innerText(); log('OWN PHOTO', own.slice(0, 240).replace(/\n/g, ' | '));
expect(/score \d\.\d{3}/.test(own), '8e a real image file loaded through the file picker and scored'); await F.locator('#own8res').scrollIntoViewIfNeeded(); await shot('8e_upload');
for (const k of ['more', 'label', 'sharp', 'wrong']) { await F.locator(`[data-box8="${k}"] button`).click(); await page.waitForTimeout(120); }
expect(await pend('8e') === null && (await F.locator('#shop8 li').count()) === 4, '8e shopping list made from the 4f boxes'); await F.locator('#shop8').scrollIntoViewIfNeeded(); await shot('8e_shop');
// ---------- 8f ----------
await open('8f'); await F.locator('#sheet8').waitFor({ timeout: 60000 }); await shot('8f');
let stamped = false;
await F.locator('[data-dec8="cond"]').click(); await page.waitForTimeout(200); await F.locator('[data-cond8="x_gates"]').check(); await F.locator('#stamp8').click(); await page.waitForTimeout(300);
expect(/tunes on the test tray/.test(await F.locator('#stampmsg8').innerText()), '8f trap condition “move the gates using the test tray” refused with the reason');
await F.locator('[data-cond8="x_gates"]').uncheck();
await F.locator('[data-dec8="go"]').click(); await page.waitForTimeout(200); await F.locator('#stamp8').click(); await page.waitForTimeout(300);
const goMsg = await F.locator('#stampmsg8').innerText(); const iv = await ev(() => window.PG.RES['8c'].ref);
if (iv[1] > 5) expect(/interval reaches/.test(goMsg), '8f “go, no conditions” refused because the interval\'s top end (' + iv[1].toFixed(1) + ') is above 5');
else stamped = /Stamped/.test(goMsg);
if (!stamped) { await F.locator('[data-dec8="cond"]').click(); await page.waitForTimeout(200);
  for (const c of ['c_bigger', 'c_second', 'c_poly', 'c_labels', 'c_drift']) await F.locator(`[data-cond8="${c}"]`).check();
  await F.locator('#stamp8').click(); await page.waitForTimeout(400); stamped = /Stamped/.test(await F.locator('#stampmsg8').innerText()); }
if (!stamped) { await F.locator('[data-dec8="nogo"]').click(); await page.waitForTimeout(200); await F.locator('#stamp8').click(); await page.waitForTimeout(400); }
expect(await pend('8f') === null && await F.locator('[data-stamp8]').count() === 1, '8f a decision that fits the numbers is stamped (' + (await mech('8f')).stamped.dec + ')'); await shot('8f_stamped');
// ---------- 8g ----------
await open('8g'); await F.locator('[data-stage8="photos"]').waitFor();
for (const k of ['photos', 'svc', 'cnn', 'blend', 'why', 'flow', 'crew', 'console', 'trial', 'drift']) { await F.locator(`[data-stage8="${k}"]`).click(); await page.waitForTimeout(80); }
expect(Object.keys((await mech('8g')).seen).length === 10 && /per 100/.test(await F.locator('#stage').innerText()), '8g all 10 stages of the line tapped; real numbers shown');
await shot('8g_line');
const QS = await ev(() => { const D = { t: window.PG.RES['8b'], iv: window.PG.RES['8c'] }; return window.PGViz8._questions(D).map((q) => ({ id: q.id, fmt: q.fmt, v: q.v.map((v) => ({ ans: v.ans, items: v.items, opts: v.opts })), opts: q.opts })); });
expect(QS.length >= 12 && QS.length <= 15 && new Set(QS.map((q) => q.fmt)).size >= 8, '8g final test: ' + QS.length + ' questions in ' + new Set(QS.map((q) => q.fmt)).size + ' formats');
const LBL = { train: 'TRAIN TRAY', validation: 'VALIDATION TRAY', test: 'TEST TRAY', pass: '● PASS', person: '▲ CHECK', stop: '■ STOP', none: '◌ NO VERDICT', yes: 'Yes', no: 'No', calm: 'CALM', watch: 'WATCH', act: 'ACT' };
async function answer(q, vi, right) {
  const card = F.locator(`[data-q8="${q.id}${vi ? 'b' : ''}"]`), v = q.v[vi]; await card.scrollIntoViewIfNeeded();
  if (q.fmt === 'num' || q.fmt === 'type') await card.locator('input').fill(String(right ? v.ans : (q.fmt === 'num' ? +v.ans + 7 : 'pause')));
  else if (q.fmt === 'order') { const ord = right ? v.items.map((x, i) => i) : v.items.map((x, i) => v.items.length - 1 - i); for (const i of ord) await card.locator('button', { hasText: v.items[i] }).click(); }
  else if (q.fmt === 'tf') { const rows = card.locator('.row').filter({ hasText: 'True' }); for (let i = 0; i < v.items.length; i++) await rows.nth(i).locator('button', { hasText: (right ? v.items[i][1] : !v.items[i][1]) ? 'True' : 'False' }).click(); }
  else if (q.fmt === 'pick') await card.locator('button.bet').nth(right ? v.ans : (v.ans + 1) % v.opts.length).click();
  else { const opts = q.opts || ['yes', 'no']; const a = right ? v.ans : opts.find((o) => o !== v.ans); await card.locator('button.bet', { hasText: LBL[a] }).first().click(); }
  await card.locator(`[data-check8="${q.id}${vi ? 'b' : ''}"]`).click(); await page.waitForTimeout(150);
}
for (let i = 0; i < QS.length - 3; i++) await answer(QS[i], 0, i !== 4);           // question 5 answered wrong on purpose
const st1 = await ev(() => window.PG.S.subs['8g'].mech.q);
expect(QS.slice(0, -3).every((q) => st1[q.id].locked) && st1[QS[4].id].good === 0 && st1[QS[0].id].good === 1, '8g each question: one check, then locked with the answer');
expect(await F.locator(`[data-q8="${QS[0].id}"] .verdict`).count() === 1 && await F.locator(`[data-q8="${QS[0].id}"] details.why`).count() === 1 && await F.locator(`[data-q8="${QS[0].id}"] details.why[open]`).count() === 0, '8g checked question shows the correct answer + a collapsed explanation');
expect(await F.locator(`[data-q8="${QS[QS.length - 1].id}"] [data-check8]`).count() === 1, '8g unanswered questions stay open before Submit');
await F.locator(`[data-q8="${QS[4].id}"]`).scrollIntoViewIfNeeded(); await shot('8g_checked');
await F.locator('#submit8').scrollIntoViewIfNeeded(); await F.locator('#submit8').click(); await page.waitForTimeout(200); await F.locator('#submit8').click(); await page.waitForTimeout(800);
const m8g = await mech('8g');
expect(m8g.submitted && QS.every((q) => m8g.q[q.id].locked) && await F.locator('#final8 [data-check8]:not([data-check8$="b"])').count() === 0, '8g Submit locks every question (unanswered count as not answered)');
expect(await F.locator('#score8 tr').count() === QS.length + 1 && !/after Check/.test(await F.locator('#score8').innerText()), '8g scorecard lists every question with its final answer');
const wrongN = QS.filter((q) => !m8g.q[q.id].good).length;
expect(await F.locator('#retake8 [data-q8]').count() === wrongN && wrongN === 4 && /SOLUTIONS FOR YOUR WRONG ANSWERS/.test(await outText()), '8g after Submit: ' + wrongN + ' elaborate solutions + a retake of only those');
await answer(QS[4], 1, true); const rq = (await mech('8g')).rq[QS[4].id];
expect(rq && rq.locked && rq.good === 1, '8g retake question (other values) answered and checked');
expect(await pend('8g') === null && await F.locator('#done8').count() === 1, '8g done: course complete card'); await F.locator('#retake8').scrollIntoViewIfNeeded(); await shot('8g_retake'); await top(); await shot('8g_score');
expect(await F.locator('[data-file8]').count() === 7 && await F.locator('#limits8').count() === 1, '8g take-home project (7 files with Copy buttons) + limits card');
await F.locator('[data-file8="train.py"]').scrollIntoViewIfNeeded(); await F.locator('[data-file8="train.py"] summary').click(); await page.waitForTimeout(200); await F.locator('[data-file8="train.py"] button').click(); await page.waitForTimeout(400);
expect(/Copied|blocked/.test(await F.locator('[data-file8="train.py"] button').innerText()), '8g Copy button on train.py works (' + await F.locator('[data-file8="train.py"] button').innerText() + ')'); await shot('8g_takehome');
const np = await ev(() => window.PG.ORDER.filter((i) => !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-8 all passed (' + JSON.stringify(np) + ')');
// twin inputs for tools/research/step8_twin.py
if (MODE === 'site') fs.writeFileSync(path.resolve(here, '../research/step8_inputs.json'), JSON.stringify(await ev(() => { const NS = window.PG.JSR.k.NS, R = window.PG.RES; return { source: 's8_e2e site run, fixture model', idx_test: NS.tray.idx_test, cell_test: NS.tray.cell_test, pSvcTest: NS.pSvcTest, pCnnTest: NS.pCnnTest, pTest: NS.pTest, bestW: NS.bestW, low: NS.low, high: NS.high, lowPoly: NS.lowPoly,
  scores: R['8b'].scores, trial: R['8b'].trial, val: R['8b'].val, interval: R['8c'].interval, bootInterval: R['8c'].boot, cell_val: NS.refCells.map((c) => c.id), pCnnVal: NS.pCnn, today: R['8d'].today, alarms: R['8d'].alarms, curve: R['8e'].curve }; })));
// reload: Step 8 comes back by itself
if (process.env.RELOAD !== '0') {
  const t1 = Date.now(); await loadApp(false);
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && window.PG.RES['8e'] && window.PG.RES['8d'], null, { timeout: 1200000 });
  log('reload: rebuilt up to 8e in', ((Date.now() - t1) / 1000).toFixed(0), 's');
  expect(await ev(() => window.PG.ORDER.filter((i) => !window.PG.passed(i)).length === 0) && (await ev(() => window.PG.RES['8b'].trial.all.defPassed)) === T.all.defPassed, 'after reload: Steps 0-8 still passed; the same trial result');
  await open('8g'); await page.waitForTimeout(800); expect(await F.locator('#final8 [data-check8]:not([data-check8$="b"])').count() === 0 && (await mech('8g')).submitted, 'after reload: the submitted test stays locked');
}
// review mode: open 8a-8g, Run up to here on 8b
if (process.env.REVIEW !== '0') {
  await F.locator('#revbtn').click(); await page.waitForTimeout(600);
  for (const id of ['8g', '8a', '8c', '8f', '8b', '8e', '8d']) { await open(id); expect(await ev((i) => window.PG.S.cur === i, id), 'review: opens ' + id); }
  await open('8b'); const t2 = Date.now(); await F.locator('#runupto').click(); await F.waitForFunction(() => !window.PG.runningUpTo(), null, { timeout: 1200000 }); await page.waitForTimeout(800);
  log('review Run up to here 8b:', ((Date.now() - t2) / 1000).toFixed(0), 's');
  expect(await ev(() => window.PG.VERD['8b'] && window.PG.VERD['8b'].pass) && await F.locator('#trial8').count() === 1, 'review: Run up to here on 8b runs the trial (reference answers) and passes'); await top(); await shot('8b_review');
  await F.locator('#revbtn').click(); await page.waitForTimeout(3000); if (MODE === 'srcdoc') F = await frame();
  await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready && !window.PG.review() && window.PG.RES['8e'], null, { timeout: 1200000 });
}
// the seal flag: retrain the model AFTER the seal broke (3e, 1 test epoch), re-run 3f + 3g, then look at the test results
if (MODE === 'site' && process.env.FLAG !== '0') {
  await open('3e'); await setCode(fill(SUBS['3e'].code, SUBS['3e'].ref)); await run('3e', 1800000);
  for (const id of ['3f', '3g']) { await open(id); await setCode(fill(SUBS[id].code, SUBS[id].ref)); await run(id); }
  await open('8b'); await page.waitForTimeout(1500);
  const fl = await F.locator('[data-flag8="dishonest"]').count() ? await F.locator('[data-flag8="dishonest"]').innerText() : ''; log('FLAG:', fl.slice(0, 200));
  expect(/NOT AN HONEST TEST ANY MORE/.test(fl) && /model weights/.test(fl), '8b after a re-run tuning cell changed the model: “not an honest test any more” flag'); await top(); await shot('8b_flag');
  await open('8c'); await page.waitForTimeout(1500); expect(await F.locator('[data-flag8="dishonest"]').count() === 1, '8c shows the same flag');
  await open('8g'); await page.waitForTimeout(1500); expect(await F.locator('#out [data-flag8="dishonest"]').count() === 1, '8g shows the same flag');
}
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length, fails.length ? JSON.stringify(fails) : '');
await browser.close(); process.exit(fails.length ? 1 : 0);
