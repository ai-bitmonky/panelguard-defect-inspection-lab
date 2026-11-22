// AUDIT (independent): the whole course as a STUDENT, single file via file://, fresh browser, ONE session, in course order.
// Scope A (every code cell: blank / wrong / right / card), B (live-trained model, NO fixture), C (every hands-on, prediction, final test, reloads).
// Env: PROFILE=dir (persistent browser profile, default /tmp/audit_prof), FROM=id (resume after a crash: earlier ids are taken as already done),
//      EPOCHS=n (use ?pgEpochs=n test setting instead of the app's Quick setting), FRESH=1 (delete the profile first).
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { FILLS, fill } from '../tests/fills.mjs'; import { loadSteps } from '../tests/seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const shots = path.resolve(here, 'shots'); fs.mkdirSync(shots, { recursive: true });
const { SUBS } = loadSteps();
const DIST = process.env.DIST || path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.0.html');
const PROFILE = process.env.PROFILE || '/tmp/audit_prof', FROM = process.env.FROM || '0a', EPOCHS = process.env.EPOCHS ? +process.env.EPOCHS : 0;
if (process.env.FRESH === '1') fs.rmSync(PROFILE, { recursive: true, force: true });
const OUTJ = path.resolve(here, process.env.OUTJ || 'a_student_results.json');
const R = fs.existsSync(OUTJ) && FROM !== '0a' ? JSON.parse(fs.readFileSync(OUTJ, 'utf8')) : { cells: {}, mech: {}, fails: [], notes: [], live: {}, errors: [] };
const saveR = () => fs.writeFileSync(OUTJ, JSON.stringify(R, null, 1));
const W = 1366, H = 768;
const ctx = await chromium.launchPersistentContext(PROFILE, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: W, height: H } });
await mirrorCDN(ctx);
await ctx.addInitScript(() => { window.addEventListener('unhandledrejection', (e) => { try { console.error('UNHANDLED REJECTION ' + String(e.reason && (e.reason.stack || e.reason.message) || e.reason)); } catch (x) {} }); });
const page = ctx.pages()[0] || await ctx.newPage();
const SECRET = 'sk-test-AUDIT-' + 'Qx81zLm4Vt7Rk2Wd9';
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
page.on('console', (m) => { if (m.type() === 'error') { const t = m.text().slice(0, 400); R.errors.push(t); log('CONSOLE ERROR', t); } });
page.on('pageerror', (e) => { R.errors.push('PAGEERROR ' + e.message); log('PAGEERROR', e.message); });
const F = page, ev = (f, a) => F.evaluate(f, a);
const expect = (ok, what, id) => { log(ok ? 'OK  ' : 'FAIL', what); if (!ok) R.fails.push((id ? id + ': ' : '') + what); saveR(); return ok; };
const note = (s) => { log('NOTE', s); R.notes.push(s); saveR(); };
let n = 0; const shot = async (nm) => { await page.screenshot({ path: `${shots}/st_${String(++n).padStart(3, '0')}_${nm}.png` }); };
const open = async (id) => { await ev((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(100); await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(700); };
const mech = (id) => ev((i) => (window.PG.S.subs[i] || {}).mech || {}, id);
const pend = (id) => ev((i) => window.PG.pendingOf(i), id);
const top = async () => { await F.locator('#out').evaluate((e) => { e.scrollTop = 0; }); };
const tap = async (loc) => { await loc.click(); await page.waitForTimeout(90); };
const drag = async (x0, y0, x1, y1, steps = 10) => { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move(x1, y1, { steps }); await page.mouse.up(); };
const dragLoc = async (loc, dx, dy, at = [0.5, 0.5]) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); const x = b.x + b.width * at[0], y = b.y + b.height * at[1]; await drag(x, y, x + dx, y + dy, 8); };
const refCode = (id) => { let c = fill(SUBS[id].code, SUBS[id].ref || []); for (const f of SUBS[id].fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const setCode = async (c) => { await F.locator('.edw textarea').first().fill(c); await F.locator('.ed').first().evaluate((e) => { e.scrollTop = 0; e.scrollLeft = 0; }); };
const BAD = /\bNaN\b|\bundefined\b|\[object Object\]|\bnull\b(?! *\))/;
const cardText = () => ev(() => ({ viz: (document.getElementById('vizbox') || {}).innerText || '', err: (document.getElementById('errbox') || {}).innerText || '', chk: (document.getElementById('chkbox') || {}).innerText || '', out: (document.getElementById('out') || {}).innerText || '', con: (document.querySelector('#out .con, #con') || {}).innerText || '' }));
const run = async (id, timeout = 900000) => { const t = Date.now(); await F.locator('#runbtn').click({ noWaitAfter: true }); await F.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout }); await page.waitForTimeout(250);
  const v = await ev((i) => window.PG.VERD[i], id); const c = await cardText(); log(id, 'run', ((Date.now() - t) / 1000).toFixed(1) + 's', v.pass ? 'PASS' : 'fail', '|', v.msg.slice(0, 200), c.err ? '| ERRBOX: ' + c.err.replace(/\n/g, ' / ').slice(0, 300) : ''); return { v, c, sec: (Date.now() - t) / 1000 }; };
// a typo answer: first gap's answer with a stray letter (a plausible slip)
const typo = (ref) => { const a = ref.slice(); const g = a[0]; a[0] = /^'.*'$/.test(g) ? g.slice(0, -1) + "x'" : /^[A-Za-z_]\w*$/.test(g) ? g + 'x' : g + 'x'; return a; };
const RAW = /\n\s+at |Traceback \(most recent|File "<exec>"|line \d+, in |TypeError:|ReferenceError:|SyntaxError:|Cannot read prop/;
async function codeCell(id, { timeout = 900000, extraWrong = true } = {}) {
  const s = SUBS[id], rec = R.cells[id] = { id, wrong: [], ref: s.ref, lang: s.lang || 'py' };
  // (1) starter code with gaps
  await setCode(s.code);
  const ran0 = await ev(() => window.PG.JSR && window.PG.JSR.k ? 1 : 1);
  if (s.ref && s.ref.length) {
    await F.locator('#runbtn').click({ noWaitAfter: true }); await page.waitForTimeout(500);
    const v0 = await ev((i) => window.PG.VERD[i], id), busy = await ev(() => window.PG.running());
    rec.blank = v0 && v0.msg; expect(v0 && !v0.pass && /still has a blank ____/.test(v0.msg) && busy == null, 'starter code with gaps does not run: “' + (v0 && v0.msg) + '”', id);
  } else {
    const r0 = await run(id, timeout); rec.blank = 'NO GAPS (planted bugs): ' + r0.v.msg; expect(!r0.v.pass, 'starter code (planted bugs) fails: ' + r0.v.msg.slice(0, 120), id);
  }
  // (3) wrong answers
  const wrongs = (FILLS[id] ? FILLS[id].wrong : []).slice(); if (extraWrong && s.ref && s.ref.length) wrongs.push(typo(s.ref));
  for (const w of wrongs) {
    await setCode(fill(s.code, w)); const r = await run(id, timeout); const msg = r.v.msg + (r.c.err ? ' || ' + r.c.err : '');
    const raw = RAW.test(r.c.err.split('\n').slice(0, 3).join('\n')) && !/details|raw message/i.test(r.c.err);
    rec.wrong.push({ w, pass: r.v.pass, msg: r.v.msg, err: r.c.err.slice(0, 600), sec: r.sec, bad: BAD.test(r.c.viz) ? r.c.viz.match(BAD)[0] : null });
    expect(!r.v.pass, 'wrong ' + JSON.stringify(w) + ' fails: ' + msg.replace(/\n/g, ' / ').slice(0, 260), id);
    if (r.c.err && RAW.test(r.c.err)) note(id + ' wrong ' + JSON.stringify(w) + ' error box text (check plainness): ' + r.c.err.replace(/\n/g, ' / ').slice(0, 400));
    if (BAD.test(r.c.viz)) note(id + ' wrong ' + JSON.stringify(w) + ' card shows “' + r.c.viz.match(BAD)[0] + '”: …' + r.c.viz.slice(Math.max(0, r.c.viz.search(BAD) - 80), r.c.viz.search(BAD) + 40).replace(/\n/g, ' / '));
  }
  // (2) reference answer
  await setCode(refCode(id)); const r = await run(id, timeout); rec.pass = r.v.pass; rec.msg = r.v.msg; rec.sec = r.sec;
  expect(r.v.pass, 'reference answer passes: ' + r.v.msg.slice(0, 200), id);
  // (4) card
  await page.waitForTimeout(600); const c = await cardText(); rec.viz = c.viz.slice(0, 3000); rec.vizLen = c.viz.length;
  const m = c.viz.match(BAD); rec.cardBad = m ? c.viz.slice(Math.max(0, m.index - 120), m.index + 60) : null;
  expect(c.viz.trim().length > 20 && !m, 'output card has real values (' + c.viz.length + ' chars' + (m ? '; shows “' + m[0] + '” near: ' + rec.cardBad.replace(/\n/g, ' / ') : '') + ')', id);
  // worked example + collapsed WHY
  rec.example = await ev(() => { const d = document.querySelector('.ex'); return d ? (d.tagName === 'DETAILS' ? (d.open ? 'open' : 'collapsed') : 'present') : 'none'; });
  rec.why = await ev(() => { const d = document.querySelector('#whybox details'); return d ? (d.open ? 'open' : 'collapsed') : (document.getElementById('whybox') || {}).innerText ? 'present' : 'none'; });
  saveR(); return r;
}
// before a substep is done, the NEXT one must be locked, with a tooltip naming what is pending
async function lockCheck(id) {
  const i = await ev((x) => window.PG.ORDER.indexOf(x), id); const nx = await ev((k) => window.PG.ORDER[k + 1], i); if (!nx) return;
  const p = await pend(id); if (p === null) return;
  await ev((x) => { location.hash = '#sub-' + x; }, nx); await page.waitForTimeout(400);
  const cur = await ev(() => window.PG.S.cur); const ok = cur === id;
  if (cur !== id) await open(id);
  // hover the next node in the strip (same step) or the next step in the nav
  let tip = '';
  try { const sameStep = nx[0] === id[0]; const loc = sameStep ? F.locator('.strip .snode').nth(nx.charCodeAt(1) - 97) : F.locator('#nav .ns').nth(+nx[0]);
    await loc.hover({ timeout: 3000 }); await page.waitForTimeout(250); tip = await F.locator('#tip').innerText(); await page.mouse.move(5, 5); } catch (e) { tip = 'hover failed: ' + e.message.slice(0, 80); }
  (R.mech[id] = R.mech[id] || {}).lock = { next: nx, stayed: ok, tip };
  expect(ok && /Locked\. First finish/.test(tip), 'next part ' + nx + ' locked before ' + id + ' is done; tooltip: “' + tip.slice(0, 160) + '”', id);
}
async function done(id) { const p = await pend(id); (R.mech[id] = R.mech[id] || {}).done = p === null; return expect(p === null, id + ' done' + (p ? ' — STILL PENDING: ' + p : ''), id); }
async function guard(id, fn) { try { await fn(); } catch (e) { expect(false, id + ' driver threw: ' + e.message.split('\n')[0].slice(0, 300), id); await shot(id + '_THROW'); } }
const reloadApp = async (need) => { const t = Date.now(); await page.reload(); await F.waitForFunction((k) => window.PG && window.PG.ready() && window.PG.JSR.ready && (!k || window.PG.RES[k]), need, { timeout: 2400000 }); await page.waitForTimeout(1500); return (Date.now() - t) / 1000; };

// ======================= start =======================
const URL1 = 'file://' + DIST + (EPOCHS ? '?pgEpochs=' + EPOCHS : '');
log('target', URL1, '| profile', PROFILE, '| from', FROM);
await page.goto(URL1);
await F.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
const ORDER = await ev(() => window.PG.ORDER);
R.order = ORDER; R.codeCells = ORDER.filter((i) => SUBS[i].kind === 'code'); saveR();
log('ORDER', ORDER.length, 'substeps;', R.codeCells.length, 'code cells:', R.codeCells.join(' '));
const at = (id) => ORDER.indexOf(id) >= ORDER.indexOf(FROM);
if (FROM === '0a') {
  const st = await ev(() => ({ subs: Object.keys(window.PG.S.subs).length, cur: window.PG.S.cur, locked: document.querySelectorAll('#nav .ns.lock').length, title: document.title }));
  log('first visit:', JSON.stringify(st));
  await ev(() => { location.hash = '#sub-2b'; }); await page.waitForTimeout(500);
  expect(await ev(() => window.PG.S.cur) === '0a', 'first visit (empty storage): a deep link to 2b lands on 0a (lock respected)');
  await shot('first_visit');
}
// ---------- STEP 0 (works while Python loads) ----------
if (at('0a')) await guard('0a', async () => { await open('0a'); await lockCheck('0a'); for (let k = 0; k < 4; k++) { await F.locator('#stage .hot').nth(k).click(); await page.waitForTimeout(150); } await shot('0a'); await done('0a'); });
if (at('0b')) await guard('0b', async () => { await open('0b'); await lockCheck('0b'); await page.waitForTimeout(400); for (let k = 0; k < 6; k++) { await F.locator('#stage button').nth(k).click(); await page.waitForTimeout(120); } await shot('0b'); await done('0b'); });
if (at('0c')) await guard('0c', async () => { await open('0c'); await lockCheck('0c');
  await F.locator('#stage .dragtok').first().click(); await F.locator('[data-bin="recheck"]').click(); await page.waitForTimeout(150);
  await F.locator('.dragtok[data-k="miss"]').click(); await F.locator('[data-bin="warranty"]').click(); await page.waitForTimeout(150);
  { const t = await F.locator('.dragtok[data-k="fa"]').boundingBox(); const b = await F.locator('[data-bin="recheck"]').boundingBox(); await page.mouse.move(t.x + 20, t.y + 20); await page.mouse.down(); await page.mouse.move(t.x + 60, t.y + 80, { steps: 5 }); await page.mouse.move(b.x + 40, b.y + 40, { steps: 8 }); await page.mouse.up(); }
  await page.waitForTimeout(200); await shot('0c'); await done('0c'); });
if (at('0d')) await guard('0d', async () => { await open('0d'); await lockCheck('0d'); for (let k = 0; k < 12; k++) { await F.locator('#stage button', { hasText: k % 3 === 0 ? 'STOP' : 'PASS' }).click(); await page.waitForTimeout(120); } await page.waitForTimeout(400); await shot('0d'); await done('0d'); });
await F.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready, null, { timeout: 2400000 });
log('Python + JS kernels ready after', ((Date.now() - t0) / 1000).toFixed(0), 's | backend', await ev(() => window.PG.JSR.backend + ' | ' + (window.PG.JSR.gpu || {}).name));
// ---------- STEPS 1-2 ----------
const step = async (id, { pre, predict, post, timeout } = {}) => { if (!at(id)) return; await guard(id, async () => {
  await open(id); expect(await ev((i) => window.PG.S.cur === i, id), id + ' opens in order', id); await lockCheck(id);
  if (pre) await pre(); if (predict) await predict();
  if (SUBS[id].predict) { const pr = await ev((i) => (window.PG.S.subs[i] || {}).pred || {}, id); (R.mech[id] = R.mech[id] || {}).pred = { locked: pr.locked, good: pr.good }; expect(!!pr.locked, id + ' prediction checked once and locked (good=' + pr.good + ')', id); }
  if (SUBS[id].kind === 'code') await codeCell(id, { timeout });
  if (post) await post();
  await top(); await shot(id); await done(id); }); };
await step('1a', { post: async () => { const c = F.locator('#vizbox canvas'); await c.nth(5).click(); await page.waitForTimeout(300); await F.locator('.zoom button').click(); await c.nth(40).click(); await F.locator('.zoom button').click(); } });
await step('1b', { predict: async () => { await F.locator('#predbox input').fill('69'); await F.locator('#predbox button').first().click(); await page.waitForTimeout(200); } });
await step('1c', { post: async () => { const s = F.locator('#vizbox svg').first(); const b = await s.boundingBox(); for (const fx of [0.05, 0.95, 0.27, 0.5]) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.4); await page.waitForTimeout(100); } } });
await step('1d', { post: async () => { for (let k = 0; k < 3; k++) { await F.locator('button', { hasText: 'Shuffle without stratify' }).click(); await F.waitForFunction((c) => ((window.PG.S.subs['1d'].mech || {}).rolls || 0) >= c, k + 1, { timeout: 60000 }); } } });
await step('1e', { post: async () => { const c = F.locator('#vizbox canvas').first(); const b = await c.boundingBox(); for (let y = 0.05; y < 1 && !(await mech('1e')).found; y += 0.06) for (let x = 0.1; x < 1; x += 0.2) await page.mouse.click(b.x + b.width * x, b.y + b.height * y); } });
await step('2a', { timeout: 1200000, post: async () => {
  const measure = async () => { const before = ((await mech('2a')).results || []).length; await F.locator('button', { hasText: 'MEASURE THIS MIX' }).click(); await F.waitForFunction((c) => ((window.PG.S.subs['2a'].mech || {}).results || []).length > c, before, { timeout: 300000 }); };
  await measure(); await F.locator('#vizbox button', { hasText: 'B · DARK MAP' }).click(); await measure(); await F.locator('#vizbox button', { hasText: 'C · PIXEL SUMMARY' }).click(); await measure();
  const res = (await mech('2a')).results; R.live['2a'] = res.map((x) => [x.keys.join('+'), x.auc]);
  await F.locator('#vizbox button', { hasText: 'Use this mix' }).first().click(); await F.waitForFunction(() => !!(window.PG.S.subs['2a'].mech || {}).kept, null, { timeout: 120000 }); R.live['2a_kept'] = (await mech('2a')).kept; } });
await step('2b', { timeout: 1800000, predict: async () => { await F.locator('#predbox .bet').nth(2).click(); await page.waitForTimeout(200); } });
await step('2c', { post: async () => { const c = F.locator('#vizbox canvas').first(); const b = await c.boundingBox(); for (const fx of [0.9, 0.6, 0.45, 0.35, 0.3, 0.27, 0.25, 0.22, 0.2, 0.17, 0.14, 0.1]) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.5); await page.waitForTimeout(80); if ((await mech('2c')).hit) break; } } });
await step('2d', { predict: async () => { await F.locator('#predbox svg').waitFor({ timeout: 120000 }); const s = F.locator('#predbox svg'); const b = await s.boundingBox(); await page.mouse.click(b.x + b.width * 0.35, b.y + b.height * 0.5); await F.locator('#predbox button', { hasText: 'Lock my guess' }).click(); await page.waitForTimeout(200); } });
await step('2e', { post: async () => { const fnN = await ev(() => window.PG.RES['2e'].FN.length); for (let k = 0; k < fnN; k++) { const tile = F.locator('#vizbox .vc').last().locator('canvas.dragtok').first(); await tile.click(); await page.waitForTimeout(60); await F.locator('[data-reason]').nth(k % 3).click(); await page.waitForTimeout(60); } await F.locator('button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(300);
  R.live['2e'] = await ev(() => { const r = window.PG.RES['2e']; return { tp: r.tp, fn: r.fn, fp: r.fp, tn: r.tn, rec: r.rec, far: r.far, cut: r.cut }; }); } });
// ---------- STEP 3 ----------
await step('3a', { pre: async () => {
  await tap(F.locator('[data-tile="chan"]')); await tap(F.locator('[data-drop="0"]'));
  { const t = await F.locator('[data-tile="photos"]').boundingBox(), s = await F.locator('[data-drop="0"]').boundingBox(); await page.mouse.move(t.x + 20, t.y + 15); await page.mouse.down(); await page.mouse.move(t.x + 60, t.y - 20, { steps: 5 }); await page.mouse.move(s.x + 30, s.y + 20, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(150); }
  await tap(F.locator('[data-tile="rows"]')); await tap(F.locator('[data-drop="1"]')); await tap(F.locator('[data-tile="cols"]')); await tap(F.locator('[data-drop="2"]')); await tap(F.locator('[data-tile="chan"]')); await tap(F.locator('[data-drop="3"]'));
  await F.locator('.ex summary').first().click(); } });
await step('3b', { pre: async () => { await page.waitForTimeout(800); const kbtn = (j) => F.locator('#stage button[aria-label^="filter weight ' + (j + 1) + ':"]');
  const setK = async (target) => { const cur = (await mech('3b')).k || [0, 0, 0, 0, 1, 0, 0, 0, 0], ord = [0, 1, -1]; for (let j = 0; j < 9; j++) { const t = (ord.indexOf(target[j]) - ord.indexOf(cur[j]) + 3) % 3; for (let q = 0; q < t; q++) await tap(kbtn(j)); } };
  await setK([1, 1, 1, 0, 0, 0, -1, -1, -1]); expect(!(await mech('3b')).done, '3b top-minus-bottom filter (busbars) does not solve it', '3b'); await setK([1, 0, -1, 1, 0, -1, 1, 0, -1]); } });
await step('3c', { post: async () => { await F.locator('#vizbox [data-b="0"]').click(); await page.waitForTimeout(100); await F.locator('#vizbox [data-b="3"]').click(); await page.waitForTimeout(150); } });
await step('3d', { pre: async () => { const put = async (k, bin) => { await tap(F.locator(`#prebox [data-aug="${k}"]`)); await tap(F.locator(`#prebox [data-drop="${bin}"]`)); };
  await put('lr', 'real'); await put('ud', 'real'); await put('rot', 'real'); await put('bright', 'real'); await put('blur', 'fake');
  await F.locator('#prebox button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(150); await put('rot', 'fake'); await F.locator('#prebox button', { hasText: 'Check my sort' }).click(); await page.waitForTimeout(150); },
  post: async () => { await F.locator('#vizbox button', { hasText: 'Call flipSome again' }).click(); await page.waitForTimeout(800); } });
// 3e: the LIVE training (no fixture anywhere in this script)
if (at('3e')) await guard('3e', async () => {
  await open('3e'); await lockCheck('3e');
  if (!(await ev(() => !!(window.PG.S.subs['3e'].pred || {}).locked))) { const s = F.locator('#predbox svg'); await s.scrollIntoViewIfNeeded(); const b = await s.boundingBox(); const pts = [];
    for (let i = 0; i <= 30; i++) { const x = b.x + b.width * (0.1 + 0.88 * i / 30); const v = i < 15 ? 0.2 + 0.6 * i / 15 : 0.8 - 0.3 * (i - 15) / 15; pts.push([x, b.y + b.height * (0.06 + 0.78 * (1 - v))]); }
    await page.mouse.move(...pts[0]); await page.mouse.down(); for (const p of pts) await page.mouse.move(p[0], p[1], { steps: 2 }); await page.mouse.up();
  await F.locator('#predbox button', { hasText: 'Check' }).first().click(); await page.waitForTimeout(300); }
  expect(await ev(() => !!window.PG.S.subs['3e'].pred.locked), '3e draw prediction locked', '3e');
  if (!EPOCHS) { await F.locator('.card.epochs button', { hasText: process.env.FULL === '1' ? 'Full' : 'Quick' }).click(); await page.waitForTimeout(300); }
  const mode = await ev(() => ({ mode: window.PG.S.epochsMode, epochs: window.PG.epochs() })); log('3e training length:', JSON.stringify(mode)); R.live.epochSetting = mode;
  await shot('3e_setting');
  // blank + wrong answers
  const s = SUBS['3e'], rec = R.cells['3e'] = { id: '3e', wrong: [], ref: s.ref, lang: 'js' };
  await setCode(s.code); await F.locator('#runbtn').click({ noWaitAfter: true }); await page.waitForTimeout(400);
  { const v0 = await ev(() => window.PG.VERD['3e']); rec.blank = v0 && v0.msg; expect(v0 && /still has a blank/.test(v0.msg), 'starter code with gaps does not run: “' + (v0 && v0.msg) + '”', '3e'); }
  for (const w of [...FILLS['3e'].wrong, typo(s.ref)]) { await setCode(fill(s.code, w)); const r = await run('3e', 1200000); rec.wrong.push({ w, pass: r.v.pass, msg: r.v.msg, err: r.c.err.slice(0, 600), sec: r.sec }); expect(!r.v.pass, 'wrong ' + JSON.stringify(w) + ' fails: ' + (r.v.msg + ' || ' + r.c.err).replace(/\n/g, ' / ').slice(0, 260) + ' (' + r.sec.toFixed(0) + ' s)', '3e'); }
  // Stop during training
  await setCode(refCode('3e'));
  await F.locator('#runbtn').click({ noWaitAfter: true }); await F.waitForFunction(() => { const s = window.PG.JSR.T && window.PG.JSR.T.state; return s && s.batch >= 2; }, null, { timeout: 600000 });
  await F.locator('.btn.stop').click(); await F.waitForFunction(() => window.PG.running() == null, null, { timeout: 600000 });
  { const v = await ev(() => window.PG.VERD['3e']); expect(!v.pass && /stopped/i.test(v.msg), '3e Stop during training: plain message “' + v.msg.slice(0, 140) + '”', '3e'); }
  // the real training
  const tt = Date.now(); await F.locator('#runbtn').click({ noWaitAfter: true });
  await F.waitForFunction(() => { const s = window.PG.JSR.T && window.PG.JSR.T.state; return s && s.batch >= 5; }, null, { timeout: 600000 }); await shot('3e_live');
  let last = -1; while (true) { const st = await ev(() => ({ r: window.PG.running(), d: window.PG.JSR.T && window.PG.JSR.T.state ? window.PG.JSR.T.state.done : 0, v: window.PG.VERD['3e'] })); if (st.r == null && st.v) break; if (st.d !== last) { last = st.d; log('3e epochs done', st.d, ((Date.now() - tt) / 60000).toFixed(1) + ' min'); } await page.waitForTimeout(15000); }
  const v = await ev(() => window.PG.VERD['3e']); const r3e = await ev(() => { const r = window.PG.RES['3e']; return { epochs: r.epochs, done: r.done, best: r.best, restored: r.restored, sec: r.sec, saved: r.saved, hist: r.hist.map((h) => ({ e: h.epoch, loss: +(h.loss || 0).toFixed(4), valLoss: +(h.valLoss || 0).toFixed(4), valAuc: +(h.valAuc || 0).toFixed(4), sec: +(h.sec || 0).toFixed(1) })) }; });
  R.live['3e'] = r3e; rec.pass = v.pass; rec.msg = v.msg; rec.sec = (Date.now() - tt) / 1000;
  expect(v.pass, '3e LIVE training passes: ' + v.msg, '3e');
  await page.waitForTimeout(800); const c = await cardText(); const m = c.viz.match(BAD); rec.viz = c.viz.slice(0, 3000); rec.cardBad = m ? c.viz.slice(Math.max(0, m.index - 120), m.index + 60) : null;
  expect(c.viz.trim().length > 20 && !m, '3e output card has real values' + (m ? ' (shows “' + m[0] + '”: ' + rec.cardBad + ')' : ''), '3e');
  rec.why = await ev(() => { const d = document.querySelector('#whybox details'); return d ? (d.open ? 'open' : 'collapsed') : 'none'; });
  await top(); await shot('3e'); await done('3e'); saveR(); });
await step('3f', { post: async () => { const c = F.locator('#vizbox canvas').first(); await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); for (let fx = 0.95; fx > 0.01 && !(await mech('3f')).hit; fx -= 0.02) { await page.mouse.click(b.x + b.width * fx, b.y + b.height * 0.5); await page.waitForTimeout(40); }
  R.live['3f'] = await ev(() => { const r = window.PG.RES['3f']; return { w: r.bestW, base: [r.base.auc, r.base.far, r.base.fp, r.base.fn], cnn: [r.cnn.auc, r.cnn.far, r.cnn.fp, r.cnn.fn], blend: [r.blend.auc, r.blend.far, r.blend.fp, r.blend.fn], n: r.n }; }); log('3f LIVE', JSON.stringify(R.live['3f'])); } });
// ---- reload in the MIDDLE of Step 3 (3f passed, 3g not yet): the live model must come back from IndexedDB ----
if (at('3g') && FROM !== '3g') await guard('reload3', async () => { const sec = await reloadApp('3f');
  const st = await ev(() => ({ e: window.PG.passed('3e'), f: window.PG.passed('3f'), from: window.PG.RES['3e'] && window.PG.RES['3e'].restoredFrom, g: window.PG.pendingOf('3g'), cur: window.PG.S.cur, w: window.PG.RES['3f'] && window.PG.RES['3f'].bestW }));
  expect(st.e && st.f && st.w === R.live['3f'].w, 'reload mid-Step 3 (' + sec.toFixed(0) + ' s): 3e+3f still passed, model restored (' + st.from + '), same blend weight ' + st.w + ', lands on ' + st.cur, 'reload3'); });
const gateMap = async (c) => { await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); const a = await c.evaluate((e) => ({ lo: +e.dataset.lo, hi: +e.dataset.hi, l: +e.dataset.l, r: +e.dataset.r, w: +e.dataset.w, st: { low: e.__st.low, high: e.__st.high } }));
  return { b, a, X: (v) => b.x + b.width * (a.l + (a.r - a.l) * (Math.max(a.lo, Math.min(a.hi, v)) - a.lo) / (a.hi - a.lo)) / a.w }; };
const dragGate = async (G, from, to) => { const y = G.b.y + 100; await page.mouse.move(G.X(from), y); await page.mouse.down(); await page.mouse.move(G.X(to), y, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(120); };
await step('3g', { pre: async () => { const G = await gateMap(F.locator('#prebox canvas').first()); const lowV = await ev(() => { const r = window.PG.RES['3f']; return window.PG_STEP3_gatesFor(r.y, r.blendScores).low; });
    await dragGate(G, G.a.st.low, lowV - (G.a.hi - G.a.lo) * 0.004); await dragGate(G, G.a.st.high, G.a.st.high + (G.a.hi - G.a.st.high) * 0.5); },
  post: async () => { R.live['3g'] = await ev(() => { const r = window.PG.RES['3g'], L = r.lanes; return { low: r.low, high: r.high, defPass: L.defPass, nDef: L.nDef, human: L.human, autoPass: L.autoPass, autoStop: L.autoStop, stopPrec: L.stopPrec, okStop: L.okStop }; }); log('3g LIVE', JSON.stringify(R.live['3g']));
    const chk = async () => { await F.locator('#vizbox button', { hasText: 'Check my gates' }).click(); await page.waitForTimeout(150); return (await F.locator('#vizbox .vc').last().locator('.verdict').last().innerText()).slice(0, 160); };
    let msg = await chk(); const G = await gateMap(F.locator('#vizbox .vc').last().locator('canvas').first()); let hi = G.a.st.high > G.a.hi ? G.a.hi : G.a.st.high;
    for (let k = 0; k < 200 && !(await mech('3g')).capOk; k++) { const to = Math.max(G.a.st.low, hi - (G.a.hi - G.a.lo) * 0.006); await dragGate(G, hi, to); hi = to; msg = await chk(); }
    (R.mech['3g'] = R.mech['3g'] || {}).challenge = msg; log('3g challenge ->', msg); } });
// ---------- STEP 4 (live model) ----------
await step('4a', { pre: async () => { const ids = await ev(() => [...document.querySelectorAll('canvas[data-paint]')].map((c) => c.dataset.paint)); R.live['4a_cells'] = ids;
  for (const id of ids) { const c = F.locator(`canvas[data-paint="${id}"]`); await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); await drag(b.x + b.width * 0.3, b.y + b.height * 0.3, b.x + b.width * 0.7, b.y + b.height * 0.7, 14); await drag(b.x + b.width * 0.7, b.y + b.height * 0.3, b.x + b.width * 0.3, b.y + b.height * 0.7, 14); } } });
await step('4b', { pre: async () => { expect(/First do the hands-on part/.test(await ev(() => document.getElementById('runbtn').dataset.why)), '4b Run waits for the hand patch', '4b');
  await F.locator('#patch4b').waitFor({ timeout: 300000 }); const st2 = F.locator('#patch4b').locator('xpath=..'); await st2.scrollIntoViewIfNeeded(); const b = await st2.boundingBox();
  for (let gy = 0.05; gy < 0.97 && !(await mech('4b')).patchOk; gy += 0.06) { await drag(b.x + b.width * 0.03, b.y + b.height * gy, b.x + b.width * 0.97, b.y + b.height * gy, 14); await page.waitForTimeout(400); }
  R.live['4b_hand'] = (await mech('4b')).bestDrop; } });
await step('4c', { post: async () => { for (let k = 0; k < 3; k++) { const c = F.locator('[data-peek]').nth(k * 2); await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); await page.mouse.move(b.x + 30, b.y + 30); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up(); }
  R.live['4c'] = await ev(() => window.PG.RES['4c'].cells.map((c) => [c.tag, c.id, +c.score.toFixed(3)])); } });
await step('4d', { predict: async () => { for (let k = 0; k < 7; k++) await F.locator('#tokp0').click(); for (let k = 0; k < 3; k++) await F.locator('#tokp1').click(); await F.locator('#tokcheck').click(); await page.waitForTimeout(300); },
  post: async () => { R.live['4d'] = await ev(() => { const r = window.PG.RES['4d']; return { n: r.n, dropHot: +r.dropHot.toFixed(3), dropRand: +r.dropRand.toFixed(3), wins: r.wins, s0: +r.s0.toFixed(3) }; }); } });
await step('4e', { pre: async () => { await F.locator('[data-chip="id"]').click(); await F.locator('[data-drop="table"]').click(); await page.waitForTimeout(150);
  expect(/525 groups/.test(await F.locator('#prebox .verdict').last().innerText()), '4e useless chip refused with a reason', '4e');
  await F.locator('[data-chip="kind"]').click(); await F.locator('[data-drop="table"]').click(); await F.locator('[data-chip="prob"]').click(); await F.locator('[data-drop="table"]').click(); await page.waitForTimeout(150); },
  post: async () => { R.live['4e'] = await ev(() => { const R2 = window.PG.RES['4e'].R; const f = (g) => [g.defPass, g.def, g.okStop, g.ok, g.person, g.n]; return { mono: f(R2.mono), poly: f(R2.poly), sure: f(R2.sure), unsure: f(R2.unsure) }; }); } });
await step('4f', { pre: async () => { await F.locator('[data-todo]').first().waitFor({ timeout: 300000 }); const nT = await F.locator('[data-todo]').count(); const boxes = ['more', 'label', 'sharp', 'wrong'];
  for (let k = 0; k < nT; k++) { await F.locator('[data-todo]').first().click(); await F.locator(`[data-drop="${boxes[k % 4]}"]`).click(); await page.waitForTimeout(80); } await F.locator('#todoDone').click(); await page.waitForTimeout(400);
  R.live['4f'] = (await mech('4f')).actions; } });
// ---------- STEP 5 ----------
const clickNode = async (nn) => { await F.locator(`#wire5 [data-node="${nn}"]`).click(); await page.waitForTimeout(120); };
await step('5a', { pre: async () => { await clickNode('__start__'); await clickNode('score'); expect(((await mech('5a')).wires || []).length === 0, '5a wrong arrow START → score refused', '5a');
  for (const [x, y] of [['__start__', 'check_photo'], ['check_photo', 'score'], ['score', 'route'], ['route', 'human_check'], ['route', 'record'], ['human_check', 'record'], ['record', '__end__']]) { await clickNode(x); await clickNode(y); } } });
await step('5b', { pre: async () => { await F.locator('[data-chip5="label"]').click(); await page.waitForTimeout(150); for (const k of ['id', 'kind', 'photo', 'p', 'lane', 'log']) { await F.locator(`[data-chip5="${k}"]`).click(); await page.waitForTimeout(80); } } });
await step('5c', { post: async () => { for (let k = 0; k < 8 && !(await mech('5c')).tokenEnd; k++) { await F.locator('#tok5next').click(); await page.waitForTimeout(550); } } });
await step('5d', { predict: async () => { await F.locator('[data-cell5d]').first().waitFor({ timeout: 300000 }); const cells = await ev(() => window.PG.S.subs['5d'].pred.cells); R.live['5d_cells'] = cells.map((c) => [c.id, +c.p.toFixed(4), c.lane, c.y]);
  for (const c of cells) { await F.locator(`[data-cell5d="${c.id}"]`).click(); await F.locator(`#predbox [data-drop="${c.lane}"]`).click({ position: { x: 12, y: 10 } }); await page.waitForTimeout(100); }
  await F.locator('#lanecheck').click(); await page.waitForTimeout(300); (R.mech['5d'] = R.mech['5d'] || {}).verdict = await F.locator('#predbox .verdict').innerText(); } , post: async () => { await page.waitForTimeout(3500); } });
// ---- reload in the MIDDLE of Step 5 (5d passed) ----
if (at('5e') && FROM !== '5e') await guard('reload5', async () => { const sec = await reloadApp('5d'); const st = await ev(() => ({ ok: window.PG.ORDER.filter((i) => i <= '5d' && !window.PG.passed(i)), cur: window.PG.S.cur, low: window.PG.RES['3g'].low }));
  expect(st.ok.length === 0 && st.low === R.live['3g'].low, 'reload mid-Step 5 (' + sec.toFixed(0) + ' s): 0a-5d still passed, same live gates; lands on ' + st.cur + ' ' + JSON.stringify(st.ok), 'reload5'); });
await step('5e', { pre: async () => { await setCode(fill(SUBS['5e'].code, ['Infinity', "'human_check'"])); const r = await run('5e'); expect(!r.v.pass && /recursion limit/.test(r.v.msg), '5e no cap: recursion-limit error in plain words', '5e'); } });
await step('5f', { post: async () => { await F.locator('[data-dec]').first().waitFor({ timeout: 120000 }); for (let k = 0; k < 5; k++) { const b = F.locator('[data-dec]').nth(k % 2); await b.click(); await page.waitForTimeout(1200); }
  await F.waitForFunction(() => window.PG.pendingOf('5f') === null, null, { timeout: 60000 }).catch(() => {}); } });
await step('5g', { post: async () => { R.live['5g'] = await ev(() => { const r = window.PG.RES['5g']; const f = (Q) => ({ lanes: Q.lanes, defPassed: Q.all.defPassed, def: Q.all.def, goodStopped: Q.all.goodStopped, good: Q.all.good, person: Q.all.person, poly: [Q.poly.defPassed, Q.poly.def], mono: [Q.mono.defPassed, Q.mono.def] }); return { lowPoly: r.lowPoly, low: r.low, high: r.high, s1: f(r.s1), s2: f(r.s2), s3: f(r.s3), esc: r.s1.escapes }; });
  log('5g LIVE', JSON.stringify(R.live['5g'])); for (const id of R.live['5g'].esc) { await F.locator(`#logbook5 [data-row="${id}"]`).click(); await page.waitForTimeout(80); } } });
// ---------- STEP 6 ----------
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
let calls = 0;
await ctx.route('https://api.anthropic.com/v1/messages', async (route) => { const rq = route.request(); if (rq.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS }); calls++;
  const b = JSON.parse(rq.postData()), names = {}, results = {}; b.messages.forEach((m) => (Array.isArray(m.content) ? m.content : []).forEach((c) => { if (c.type === 'tool_use') names[c.id] = c.name; if (c.type === 'tool_result') results[names[c.tool_use_id]] = JSON.parse(c.content); }));
  const next = (b.tools || []).map((t) => t.name).find((t) => !(t in results)); const userText = b.messages[0].content.map((c) => c.text || '').join('');
  const prev = /Previous attempt failed validation/.test(userText) ? userText.split('### Previous result:\n')[1].split('\n\n\nTry again')[0] : null;
  const text = prev ? prev.split('\n').filter((l) => !/yield loss/.test(l)).join('\n') : (userText.split("This is the context you're working with:\n")[1] || 'Facts: ' + JSON.stringify(results).replace(/[0-9.]+/g, (x) => x)).slice(0, 1500) + '\nEstimated yield loss: 12.34 panels.';
  const body = next ? { content: [{ type: 'text', text: 'I will look up ' + next + '.' }, { type: 'tool_use', id: 'tu_' + calls, name: next, input: {} }], stop_reason: 'tool_use' } : { content: [{ type: 'text', text }], stop_reason: 'end_turn' };
  return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'msg_mock', type: 'message', role: 'assistant', model: b.model, ...body }) }); });
await step('6a', { pre: async () => { await F.locator('[data-card6="make_up"]').click(); await F.locator('#drop6a-writer').click(); await page.waitForTimeout(150);
  expect(/never from the model/.test(await F.locator('#hiremsg').innerText()), '6a decoy card refused with the rule', '6a');
  for (const [c, w] of [['shift_stats', 'inspector'], ['slice_table', 'analyst'], ['worst_cases', 'analyst'], ['action_list', 'writer'], ['job_facts', 'inspector'], ['job_causes', 'analyst'], ['job_report', 'writer']]) { await F.locator(`[data-card6="${c}"]`).click(); await F.locator('#drop6a-' + w).click(); await page.waitForTimeout(100); } } });
await step('6b', { post: async () => { for (const t of ['shift_stats', 'slice_table', 'worst_cases', 'action_list']) { await F.locator(`[data-call6="${t}"]`).click(); await page.waitForTimeout(400); } } });
await step('6c', { post: async () => { for (let i = 0; i < 3; i++) { await F.locator(`[data-badge6="${i}"]`).click(); await page.waitForTimeout(250); } } });
await step('6d', { predict: async () => { await F.locator('[data-line6]').first().waitFor({ timeout: 120000 }); const truth = await ev(() => window.PG.S.subs['6d'].pred.truth);
  for (const k of Object.keys(truth)) { await F.locator(`[data-line6="${k}"]`).click(); if (!truth[k]) await F.locator(`[data-line6="${k}"]`).click(); await page.waitForTimeout(60); } await F.locator('#blankcheck').click(); await page.waitForTimeout(300); } });
await step('6e', { post: async () => { const nTr = await ev(() => window.PG.RES['6e'].trace.length); R.live['6e_trace'] = nTr;
  for (let k = 0; k < 4; k++) { const role = await ev(() => { const r = window.PG.RES['6e'], m = window.PG.S.subs['6e'].mech, i = m.tk == null ? 0 : m.tk + 1; return r.trace[i].agent; }); const key = /Inspector/.test(role) ? 'inspector' : /Analyst/.test(role) ? 'analyst' : 'writer'; await F.locator(`#room6e [data-worker="${key}"]`).click(); await page.waitForTimeout(200); }
  for (let k = 0; k < nTr + 2 && !(await mech('6e')).traceEnd; k++) { await F.locator('#next6e').click(); await page.waitForTimeout(60); }
  R.live['6e_report'] = await ev(() => window.PG.RES['6e'].raw); } });
await step('6f', { pre: async () => { if ((await mech('6f')).huntDone) { note('6f hunt already done earlier in this session (kept after reload)'); return; } await F.locator('[data-num6]').first().waitFor({ timeout: 120000 });
  const planted = await ev(() => { const k = window.PG.JSR.k, NS = k.NS; const f = { shift_stats: NS.shiftStats.run(), slice_table: NS.sliceTable.run(), worst_cases: NS.worstCases.run(), action_list: NS.actionList.run() }; return k.pg().plantedCopy(NS.shiftResult.raw, f).planted; });
  for (const p of planted) await F.locator(`[data-num6="${p.at}"]`).click(); await F.locator('#hunt6').click(); await page.waitForTimeout(200); (R.mech['6f'] = R.mech['6f'] || {}).found = (await mech('6f')).found; } });
await step('6g', { pre: async () => {
  await F.locator('#model6').fill('claude-opus-5-5'); await F.locator('#key6').fill(SECRET); await F.locator('#run6g').click();
  await F.waitForFunction(() => /SIDE BY SIDE|blocked|failed/.test(document.getElementById('out').innerText + document.getElementById('stat6g').innerText), null, { timeout: 120000 });
  const t1 = await F.locator('#out').innerText(); const st = await F.locator('#stat6g').innerText(); (R.mech['6g'] = R.mech['6g'] || {}).mock = { calls, stat: st.slice(0, 300), side: /SIDE BY SIDE/.test(t1) };
  expect(/SIDE BY SIDE/.test(t1), '6g (file://, mocked Anthropic) real-model crew ran; status: ' + st.slice(0, 200), '6g');
  if (await pend('6g') !== null) { note('6g still pending after the mocked model run (' + await pend('6g') + '); using Skip'); await F.locator('#skip6g').click(); await page.waitForTimeout(300); }
  const storeTxt = await ev(() => { let s = ''; try { for (let i = 0; i < localStorage.length; i++) s += localStorage.getItem(localStorage.key(i)); } catch (e) {} return s + JSON.stringify(window.PG.S); });
  expect(!storeTxt.includes(SECRET), '6g key never in storage', '6g'); } });
// ---------- STEP 7 ----------
const key = async (k) => { await F.locator('#out').click({ position: { x: 4, y: 4 } }); await page.keyboard.press(k); };
await step('7a', { pre: async () => { await F.locator('[data-block7="dot"]').click(); await F.locator('#zone7a-main').click(); await page.waitForTimeout(120);
  expect(/colour alone/.test(await F.locator('#sketchmsg').innerText()), '7a colour-only dot refused', '7a');
  for (const [b, z] of [['lamp', 'main'], ['photo', 'main'], ['score', 'drawer'], ['heat', 'side'], ['counters', 'top'], ['queue', 'side'], ['stopline', 'bottom'], ['tiny', 'bottom']]) { await F.locator(`[data-block7="${b}"]`).click(); await F.locator('#zone7a-' + z).click(); await page.waitForTimeout(100); }
  await F.locator('#far7a').click(); await page.waitForTimeout(700); } });
await step('7b', { post: async () => { await F.locator('#view7b-gray').click(); await F.locator('#view7b-far').click(); await page.waitForTimeout(200); } });
await step('7c', { post: async () => { const k = await F.locator('#knob7c').boundingBox(); await page.mouse.move(k.x + k.width * 0.5, k.y + k.height * 0.45); await page.mouse.down(); await page.mouse.move(k.x + k.width * 0.95, k.y + k.height * 0.85, { steps: 8 }); await page.mouse.up();
  await F.locator('#start7c').click(); await F.waitForFunction(() => (window.PG.S.subs['7c'].mech.ran || 0) >= 30, null, { timeout: 600000 }); await page.waitForTimeout(1500); R.live['7c'] = await ev(() => window.PG.JSR.k.NS.speedReport()); } });
await step('7d', { post: async () => { await key('h'); await page.waitForTimeout(800); const q0 = await ev(() => window.PG.JSR.k.NS.queue.length); R.live['7d_queue'] = q0;
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); if (i === 3) await F.locator('[data-screen="7d"] button[data-say="stop"]').click(); else await key(i % 2 ? 's' : 'p'); }
  await page.waitForTimeout(1500); R.live['7d'] = (await mech('7d')).rate; } });
await step('7e', { predict: async () => { await F.locator('[data-q7]').first().waitFor(); for (const [q, ch] of [['busy', 'lanes'], ['target', 'bullet'], ['poly', 'pair']]) { await F.locator(`[data-q7="${q}"]`).click(); await F.locator(`[data-chart7="${ch}"]`).click(); await page.waitForTimeout(80); } await F.locator('#matchcheck').click(); await page.waitForTimeout(300); },
  post: async () => { R.live['7e'] = await ev(() => { const b = window.PG.JSR.k.NS.board; return { all: b.all, mono: b.mono, poly: b.poly, cells: b.cells }; }); } });
await step('7f', { post: async () => { await F.locator('[data-screen="7f"] .go').click(); await F.waitForFunction(() => /CHECKED|HELD/.test(document.querySelector('[data-screen="7f"] .badge').textContent), null, { timeout: 180000 });
  await F.locator('[data-screen="7f"] .copy').click(); await page.waitForTimeout(500); R.live['7f'] = await F.locator('[data-screen="7f"] .badge').innerText(); } });
await step('7g', { post: async () => {
  for (const f of ['camera', 'model', 'flow', 'empty']) { await F.locator(`[data-fault7="${f}"]`).click(); await F.locator('#say7-right').waitFor({ timeout: 120000 }); await F.locator('#say7-right').click(); await page.waitForTimeout(250); }
  await F.locator('#open7end').click(); await page.waitForTimeout(1500); await shot('7g_full'); await F.locator('#pgc-root .start').click(); await page.waitForTimeout(5000); await F.locator('#pgc-root .halt').click(); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400); } });
// ---------- STEP 8 ----------
await step('8a', { pre: async () => { await F.locator('[data-lock8="flow"]').waitFor({ timeout: 120000 });
  expect(await F.locator('#lockrange8').isDisabled() && await F.locator('#seal8').isDisabled(), '8a range and seal blocked until the sheet is locked', '8a');
  for (const k of ['model', 'bestW', 'low', 'lowPoly', 'high', 'flow']) { await F.locator(`[data-lock8="${k}"]`).click(); await page.waitForTimeout(120); }
  { const svgL = F.locator('#guess8 svg'); await svgL.scrollIntoViewIfNeeded(); const b = await svgL.boundingBox(), X = (v) => b.x + b.width * (24 + 560 * v / 20) / 600, y = b.y + b.height * 0.7; await drag(X(8), y, X(7), y, 6); await page.waitForTimeout(200); }
  await F.locator('#lockrange8').click(); await page.waitForTimeout(300);
  const s = F.locator('#seal8'); await s.scrollIntoViewIfNeeded(); const b = await s.boundingBox(); await page.mouse.move(b.x + 30, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(300);
  expect(!(await mech('8a')).sealOpen, '8a letting go early does not break the seal', '8a'); await page.mouse.down(); await page.waitForTimeout(2600); await page.mouse.up(); await page.waitForTimeout(1200);
  R.live['8a'] = (await mech('8a')).frozen; } });
await step('8b', { timeout: 1800000, post: async () => { R.live['8b'] = await ev(() => { const T = window.PG.RES['8b'].trial; return { all: T.all, mono: T.mono, poly: T.poly, per1000: T.per1000, n: T.n, unsureEscapes: T.unsureEscapes }; }); log('8b LIVE trial', JSON.stringify(R.live['8b'])); } });
await step('8c', { pre: async () => { await page.waitForTimeout(1200); for (let i = 0; i < 10; i++) { await dragLoc(F.locator('#lever8'), 0, 80, [0.71, 0.2]); await page.waitForTimeout(250); } for (let i = 0; i < 3; i++) { await F.locator('#lever8x10').click(); await page.waitForTimeout(100); } },
  post: async () => { R.live['8c'] = await ev(() => ({ wilson: window.PG.RES['8c'].ref, boot: window.PG.RES['8c'].boot, under: window.PG.RES['8c'].refUnder })); log('8c LIVE', JSON.stringify(R.live['8c'])); } });
// ---- reload in the MIDDLE of Step 8 (8c passed) ----
if (at('8d') && FROM !== '8d') await guard('reload8', async () => { const sec = await reloadApp('8c'); const st = await ev(() => ({ ok: window.PG.ORDER.filter((i) => i <= '8c' && !window.PG.passed(i)), cur: window.PG.S.cur, k: window.PG.RES['8b'] && window.PG.RES['8b'].trial.all.defPassed, seal: window.PG.S.subs['8a'].mech.sealOpen }));
  expect(st.ok.length === 0 && st.k === R.live['8b'].all.defPassed && st.seal, 'reload mid-Step 8 (' + sec.toFixed(0) + ' s): 0a-8c still passed, same trial result (' + st.k + '), seal stays open; lands on ' + st.cur + ' ' + JSON.stringify(st.ok), 'reload8');
  const fl = await ev(() => document.querySelectorAll('[data-flag8="dishonest"]').length); await open('8b'); await page.waitForTimeout(1500);
  expect(await F.locator('[data-flag8="dishonest"]').count() === 0, 'after reload no false “not an honest test” flag on 8b', 'reload8'); });
await step('8d', { timeout: 1800000, post: async () => { for (const k of ['dark|bright', 'blur|sharp', 'fault|contrast', 'poly|score']) { await F.locator(`[data-cell8="${k}"]`).click(); await page.waitForTimeout(100); } await F.locator('#matrixcheck8').click(); await page.waitForTimeout(500);
  R.live['8d'] = await ev(() => ({ today: window.PG.RES['8d'].today, alarms: window.PG.RES['8d'].alarms, nRight: window.PG.S.subs['8d'].mech.nRight })); } });
await step('8e', { post: async () => { R.live['8e'] = await ev(() => window.PG.RES['8e'].curve);
  await F.locator('#own8sky').scrollIntoViewIfNeeded(); await F.locator('#own8sky').click(); await F.waitForFunction(() => /drawing/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 180000 });
  const png = path.resolve(shots, 'upload_test.png'); const fullDir = path.resolve(here, '../../site/data/full'); if (!fs.existsSync(png)) fs.copyFileSync(path.resolve(fullDir, fs.readdirSync(fullDir).find((f) => f.endsWith('.png'))), png);
  await F.locator('#own8file').setInputFiles(png); await F.waitForFunction(() => /upload_test/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 180000 }); R.live['8e_own'] = (await F.locator('#own8res').innerText()).slice(0, 300);
  for (const k of ['more', 'label', 'sharp', 'wrong']) { await F.locator(`[data-box8="${k}"] button`).click(); await page.waitForTimeout(120); } } });
await step('8f', { pre: async () => { await F.locator('#sheet8').waitFor({ timeout: 120000 }); let stamped = false;
  await F.locator('[data-dec8="cond"]').click(); await page.waitForTimeout(200); await F.locator('[data-cond8="x_gates"]').check(); await F.locator('#stamp8').click(); await page.waitForTimeout(300);
  expect(/tunes on the test tray/.test(await F.locator('#stampmsg8').innerText()), '8f trap condition refused', '8f'); await F.locator('[data-cond8="x_gates"]').uncheck();
  await F.locator('[data-dec8="go"]').click(); await page.waitForTimeout(200); await F.locator('#stamp8').click(); await page.waitForTimeout(300); const goMsg = await F.locator('#stampmsg8').innerText(); (R.mech['8f'] = R.mech['8f'] || {}).go = goMsg.slice(0, 300); stamped = /Stamped/.test(goMsg);
  if (!stamped) { await F.locator('[data-dec8="cond"]').click(); await page.waitForTimeout(200); for (const c of ['c_bigger', 'c_second', 'c_poly', 'c_labels', 'c_drift']) await F.locator(`[data-cond8="${c}"]`).check(); await F.locator('#stamp8').click(); await page.waitForTimeout(400); const m2 = await F.locator('#stampmsg8').innerText(); R.mech['8f'].cond = m2.slice(0, 300); stamped = /Stamped/.test(m2); }
  if (!stamped) { await F.locator('[data-dec8="nogo"]').click(); await page.waitForTimeout(200); await F.locator('#stamp8').click(); await page.waitForTimeout(400); R.mech['8f'].nogo = (await F.locator('#stampmsg8').innerText()).slice(0, 300); }
  R.mech['8f'].stamped = (await mech('8f')).stamped; } });
const LBL = { train: 'TRAIN TRAY', validation: 'VALIDATION TRAY', test: 'TEST TRAY', pass: '● PASS', person: '▲ CHECK', stop: '■ STOP', none: '◌ NO VERDICT', yes: 'Yes', no: 'No', calm: 'CALM', watch: 'WATCH', act: 'ACT' };
await step('8g', { pre: async () => { await F.locator('[data-stage8="photos"]').waitFor(); for (const k of ['photos', 'svc', 'cnn', 'blend', 'why', 'flow', 'crew', 'console', 'trial', 'drift']) { await F.locator(`[data-stage8="${k}"]`).click(); await page.waitForTimeout(80); }
  R.live['8g_line'] = (await F.locator('#stage').innerText()).slice(0, 2500);
  const QS = await ev(() => { const D = { t: window.PG.RES['8b'], iv: window.PG.RES['8c'] }; return window.PGViz8._questions(D).map((q) => ({ id: q.id, fmt: q.fmt, q: q.v[0].q, v: q.v.map((v) => ({ ans: v.ans, items: v.items, opts: v.opts, q: v.q })), opts: q.opts })); });
  R.live['8g_qs'] = QS.map((q) => ({ id: q.id, fmt: q.fmt, ans: q.v[0].ans, q: String(q.q).replace(/<[^>]+>/g, '').slice(0, 200) }));
  async function answer(q, vi, right) { const card = F.locator(`[data-q8="${q.id}${vi ? 'b' : ''}"]`), v = q.v[vi]; await card.scrollIntoViewIfNeeded();
    if (q.fmt === 'num' || q.fmt === 'type') await card.locator('input').fill(String(right ? v.ans : (q.fmt === 'num' ? +v.ans + 7 : 'pause')));
    else if (q.fmt === 'order') { const ord = right ? v.items.map((x, i) => i) : v.items.map((x, i) => v.items.length - 1 - i); for (const i of ord) await card.locator('button', { hasText: v.items[i] }).click(); }
    else if (q.fmt === 'tf') { const rows = card.locator('.row').filter({ hasText: 'True' }); for (let i = 0; i < v.items.length; i++) await rows.nth(i).locator('button', { hasText: (right ? v.items[i][1] : !v.items[i][1]) ? 'True' : 'False' }).click(); }
    else if (q.fmt === 'pick') await card.locator('button.bet').nth(right ? v.ans : (v.ans + 1) % v.opts.length).click();
    else { const opts = q.opts || ['yes', 'no']; const a = right ? v.ans : opts.find((o) => o !== v.ans); await card.locator('button.bet', { hasText: LBL[a] }).first().click(); }
    // the worked example button must be there and hidden until tapped
    await card.locator(`[data-check8="${q.id}${vi ? 'b' : ''}"]`).click(); await page.waitForTimeout(150); }
  for (let i = 0; i < QS.length - 3; i++) await answer(QS[i], 0, i !== 4);
  const st1 = await ev(() => window.PG.S.subs['8g'].mech.q);
  expect(QS.slice(0, -3).every((q) => st1[q.id].locked) && st1[QS[4].id].good === 0 && st1[QS[0].id].good === 1, '8g: one check per question, then locked with the answer (' + QS.length + ' questions, ' + new Set(QS.map((q) => q.fmt)).size + ' formats)', '8g');
  expect(await F.locator(`[data-q8="${QS[QS.length - 1].id}"] [data-check8]`).count() === 1, '8g unanswered questions stay open before Submit', '8g');
  await F.locator('#submit8').scrollIntoViewIfNeeded(); await F.locator('#submit8').click(); await page.waitForTimeout(200); await F.locator('#submit8').click(); await page.waitForTimeout(800);
  const m8g = await mech('8g'); expect(m8g.submitted && QS.every((q) => m8g.q[q.id].locked), '8g Submit locks every question', '8g');
  const sc = await F.locator('#score8').innerText(); R.live['8g_score'] = sc.slice(0, 3000);
  expect(await F.locator('#score8 tr').count() === QS.length + 1 && !BAD.test(sc), '8g scorecard lists every question with a final answer' + (BAD.test(sc) ? ' (shows ' + sc.match(BAD)[0] + ')' : ''), '8g');
  const wrongN = QS.filter((q) => !m8g.q[q.id].good).length; expect(await F.locator('#retake8 [data-q8]').count() === wrongN, '8g ' + wrongN + ' solutions + retake of only those', '8g');
  await answer(QS[4], 1, true); const rq = (await mech('8g')).rq[QS[4].id]; expect(rq && rq.locked && rq.good === 1, '8g retake answered and checked', '8g');
  // take-home: the 6 files exactly as the APP shows them (for scope F)
  const files = await ev(() => [...document.querySelectorAll('[data-file8]')].map((d) => ({ name: d.getAttribute('data-file8'), text: (d.querySelector('pre, code, textarea') || {}).textContent || '' })));
  fs.writeFileSync(path.resolve(here, 'takehome_from_app.json'), JSON.stringify(files, null, 1)); R.live['8g_files'] = files.map((f) => [f.name, f.text.length]);
  await F.locator('[data-file8="train.py"]').scrollIntoViewIfNeeded(); await F.locator('[data-file8="train.py"] summary').click(); await page.waitForTimeout(200); await F.locator('[data-file8="train.py"] button').click(); await page.waitForTimeout(400);
  R.mech['8g'] = Object.assign(R.mech['8g'] || {}, { copy: await F.locator('[data-file8="train.py"] button').innerText() }); } });
const np = await ev(() => window.PG.ORDER.filter((i) => !window.PG.passed(i))); expect(np.length === 0, 'Steps 0-8 all passed in one student session with the LIVE model (' + JSON.stringify(np) + ')');
// twins exactly as displayed: open each code cell and read the twin panel text
R.twins = {};
for (const id of R.codeCells) { await open(id); await page.waitForTimeout(300); R.twins[id] = await ev(() => { const c = [...document.querySelectorAll('.twin pre, .twin code, .twin .ed, [class*=twin] pre')]; return c.length ? c[0].innerText : null; }); }
saveR();
log('TOTAL', ((Date.now() - t0) / 60000).toFixed(1) + ' min | FAILS:', R.fails.length, '| console errors:', R.errors.length);
await ctx.close(); process.exit(0);
