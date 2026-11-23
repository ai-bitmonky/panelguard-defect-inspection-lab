// Student guide v2: fresh screenshots of every lab page (0a-8g) in STUDENT mode, as a student first sees it
// (gaps still ____ , prediction not answered, hands-on not done). Earlier pages are passed in the same session with the
// reference answers (like tests/full_smoke.mjs). 3e: instead of training here (software WebGL), the Keras-trained test
// fixture is saved as the student's model and the page is reloaded once, so the app restores it like a saved model.
// Output: tools/video/p1/<id>_a.jpg (page top), _b.jpg (editor), _c.jpg (RUN), extra shots for the "how a page works" part.
// Run: cd tools && node video/capture_v2.mjs   (about 30-45 min)
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { SUBS, FIX, RATE_SEED } from '../tests/s8seed.mjs'; import { MKEY, putFixture } from '../tests/s7seed.mjs'; import { FILLS } from '../tests/fills.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const OUT = path.resolve(here, 'p1'); fs.mkdirSync(OUT, { recursive: true });
const DIST = path.resolve(here, '../../dist/PanelGuard_Defect_Inspection_Lab_v1.3.html');
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const ev = (f, a) => page.evaluate(f, a);
const snap = async (nm) => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${nm}.jpg`, type: 'jpeg', quality: 92 }); };
const top = () => ev(() => { for (const s of ['#work', '#out']) { const e = document.querySelector(s); if (e) e.scrollTop = 0; } });
const into = (sel, block = 'start') => ev(([s, b]) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: b }); return true; }, [sel, block]);
const M = { '0a': { done: 1 }, '0b': { done: 1 }, '0c': { done: 1 }, '0d': { done: 1 }, '1a': { opened: 2 }, '1c': { moves: 2 }, '1d': { rolls: 3 }, '1e': { found: true },
  '2a': { mixes: 3, kept: ['A', 'B', 'C'], best: { keys: ['A', 'B', 'C'], auc: 0.9 } }, '2c': { hit: 1, hitAt: 0.2 }, '2e': { sorted: 1, sort: {} },
  '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 }, '3f': { hit: 1 }, '3g': { twoDone: 1, capOk: 1 },
  '4a': { paint: { 496: [1], 1088: [1], 379: [1] }, done: true }, '4b': { patchOk: 1, bestDrop: 0.5 }, '4c': { peek: 3 }, '4e': { rows: ['kind', 'prob'] },
  '4f': { done: 1, box: {}, actions: { more: [2166, 2456], label: [593, 1222], sharp: [2089], wrong: [1761] } },
  '5a': { done: 1, wires: [] }, '5b': { cardOk: 1 }, '5c': { tokenEnd: 1 }, '5e': { sawLoop: 1 }, '5f': { dec: { a: 'pass', b: 'pass', c: 'stop', d: 'pass', e: 'stop' } }, '5g': { need: 0, found: 0 },
  '6a': { done: 1, put: {} }, '6b': { called: { shift_stats: 1, slice_table: 1, worst_cases: 1, action_list: 1 } }, '6c': { read: { 0: 1, 1: 1, 2: 1 } }, '6d': { sawPoor: 1 }, '6e': { traceEnd: 1, tk: 0 }, '6f': { huntDone: 1, found: 2 }, '6g': { skipped: 1, done: 1 },
  '7a': { done: 1, put: {}, sawFar: 1 }, '7b': { views: { gray: 1, far: 1 } }, '7c': { knob: 'MAX', ran: 30 }, '7d': { answered: 10, rate: RATE_SEED }, '7f': { reported: 1, copied: 1 }, '7g': { fixed: { camera: 1, model: 1, empty: 1, flow: 1 } } };
const put = (id) => ev(([i, m]) => { const s = window.PG.SSs(i); Object.assign(s.mech, m); }, [id, M[id] || {}]);
const pred = (id) => { const f = SUBS[id].predict.format; const val = f === 'draw' ? new Array(30).fill(0.5) : f === 'lanes' ? { place: {} } : f === 'match' ? { busy: 'lanes', target: 'bullet', poly: 'pair' } : f === 'tokens' ? [6, 2, 2] : f === 'bet' ? 'SVC (RBF)' : 1;
  return ev(([i, v]) => { window.PG.SSs(i).pred = { locked: true, val: v, good: 1, cells: [] }; }, [id, val]); };
const open = async (id, wait = 600) => { await ev((i) => { if (location.hash === '#sub-' + i) location.hash = '#x'; }, id); await page.waitForTimeout(80); await ev((i) => { location.hash = '#sub-' + i; }, id); await page.waitForTimeout(wait); };
const refCode = (s) => { let i = 0, c = s.code.replace(/____/g, () => s.ref[i++]); for (const f of s.fixes || []) c = c.split(f[0]).join(f[1]); return c; };
const fillCode = (s, vals) => { let i = 0; return s.code.replace(/____/g, () => vals[i++]); };
const runCode = async (id, code) => { await page.locator('.edw textarea').first().fill(code); await page.locator('#runbtn').click({ noWaitAfter: true });
  await page.waitForFunction((i) => window.PG.VERD[i] != null && window.PG.running() == null, id, { timeout: 1800000 }); return ev((i) => window.PG.VERD[i], id); };
const ready = (extra) => page.waitForFunction((x) => window.PG && window.PG.ready() && window.PG.JSR.ready && (!x || x.every((k) => window.PG.RES[k])), extra || null, { timeout: 1800000 });
const NOTES = {}; const claudeCheck = async (id) => { const hit = await ev(() => { const t = document.body.innerText; const v = [...document.querySelectorAll('input,textarea')].map((e) => e.value + ' ' + (e.placeholder || '')).join(' ');
  return /claude/i.test(t) || /claude/i.test(v); }); if (hit) { NOTES[id] = 'claude-text'; log('NOTE: the word appears on', id); } };
const shoot = async (id) => {
  await top(); await claudeCheck(id); await snap(id + '_a');
  const code = SUBS[id].kind === 'code';
  if (code) { await into('.edw', 'start'); await snap(id + '_b'); await into('#runbtn', 'center'); await snap(id + '_c'); }
  else { await ev(() => { const e = document.querySelector('#work'); if (e) e.scrollTop = e.scrollHeight; }); await snap(id + '_b'); }
  await top();
};

// ---------- boot ----------
await page.goto('file://' + DIST); await page.waitForTimeout(1800); await snap('boot_loading');
await ready(); await page.waitForTimeout(800); await snap('boot_ready'); log('ready');
const ORDER = await ev(() => window.PG.ORDER);
const AFTER = ['0d', '2c', '3e', '3g', '4c', '5c', '5g', '6e', '7c', '7g', '8b', '8c', '8d', '8f'];
for (const id of ORDER) {
  const s = SUBS[id];
  await open(id, s.kind === 'scene' ? 1800 : 900);
  const cur = await ev(() => window.PG.S.cur); if (cur !== id) log('WARN', id, 'opened', cur);
  if (s.kind === 'code') { const blank = await ev(() => (document.querySelector('.edw textarea') || {}).value || ''); if (!/____/.test(blank) && (s.ref || []).length) log('WARN', id, 'editor has no blank'); }
  await shoot(id); log('shot', id);
  if (id === '1a') {   // how a page works: worked example, a blank left in, a wrong answer
    await page.locator('details.ex summary').first().click(); await page.waitForTimeout(300); await into('details.ex', 'start'); await snap('how_example');
    await page.locator('details.ex summary').first().click(); await top();
    await page.locator('#runbtn').click({ noWaitAfter: true }); await page.waitForTimeout(1500); await into('#runbtn', 'center'); await snap('how_blank_work'); await top(); await snap('how_blank_top');
    const v = await runCode('1a', fillCode(s, FILLS['1a'].wrong[1])); log('wrong 1a:', v.msg); await top(); await snap('how_wrong_top'); await into('#runbtn', 'center'); await snap('how_wrong_work');
  }
  if (id === '1b') { await into('.pred, .predict, [class*=pred]', 'start'); await snap('how_predict'); await top(); }
  // ---- complete the page ----
  await put(id); if (s.predict) await pred(id);
  if (id === '3e') {
    // the student's saved model = the Keras-trained fixture; reload once; the app restores it on replay
    await putFixture(ev);
    await ev(([key, F]) => { const ss = window.PG.SSs('3e'); ss.mech.modelKey = key; ss.mech.savedAt = new Date().toLocaleString();
      ss.mech.lastRes = { epochs: 30, done: 30, hist: [{ epoch: F.best_epoch, loss: null, valLoss: 0.5, valAuc: F.best_auc, sec: 0 }], best: { epoch: F.best_epoch, valAuc: F.best_auc }, restored: F.best_epoch, sec: 0, backend: 'webgl', gpu: null, nTrain: 1574, nDef: 492, cw: [0.7, 1.6], quick: 'full' }; }, [MKEY, { best_epoch: FIX.best_epoch, best_auc: FIX.best_auc }]);
    await ev(([c]) => { const ss = window.PG.SSs('3e'); ss.codePass = true; ss.code = c; localStorage.setItem('panelguard.v0.1', JSON.stringify(window.PG.S)); }, [refCode(s)]);
    const saved = await ev(() => { try { return JSON.parse(localStorage.getItem('panelguard.v0.1')).subs['3e'].codePass; } catch (e) { return 'ERR ' + e.message; } }); log('3e saved state', saved);
    await page.reload(); await ready(['3e']); log('3e restored after reload'); await open('3e', 1500); await top(); await snap('3e_after');
    continue;
  }
  if (id === '8a') { for (const k of ['model', 'bestW', 'low', 'lowPoly', 'high', 'flow']) await page.locator(`[data-lock8="${k}"]`).click(); await page.locator('#lockrange8').click();
    await page.locator('#seal8').scrollIntoViewIfNeeded(); const b = await page.locator('#seal8').boundingBox(); await page.mouse.move(b.x + 20, b.y + 10); await page.mouse.down(); await page.waitForTimeout(2500); await page.mouse.up(); await page.waitForTimeout(1200); await top(); await snap('8a_after'); }
  if (id === '8c') { await page.waitForTimeout(1500); for (let i = 0; i < 10; i++) { await page.locator('#lever8').scrollIntoViewIfNeeded(); const b = await page.locator('#lever8').boundingBox(); await page.mouse.move(b.x + b.width * 0.71, b.y + 30); await page.mouse.down(); await page.mouse.move(b.x + b.width * 0.71, b.y + 110, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(200); } for (let i = 0; i < 3; i++) await page.locator('#lever8x10').click(); await top(); await snap('8c_lever'); }
  if (id === '8g') {
    await into('#final8', 'start'); await snap('8g_test'); await into('#submit8', 'center'); await snap('8g_submit');
    await ev(() => { const o = document.querySelector('#score8'); if (o) o.scrollIntoView({ block: 'start' }); }); await snap('8g_score');
    await ev(() => { const o = [...document.querySelectorAll('#out .card, #out div')].find((e) => /TAKE IT HOME/.test(e.textContent) && e.textContent.length < 3000); if (o) o.scrollIntoView({ block: 'start' }); }); await snap('8g_takehome'); await top();
  }
  if (s.kind === 'code') { const v = await runCode(id, refCode(s)); log(id, v.pass ? 'PASS' : 'FAIL', v.msg.slice(0, 140)); if (!v.pass) NOTES[id] = 'FAIL ' + v.msg; await put(id); await open(id, 900); }
  if (id === '8d') { for (const k of ['dark|bright', 'blur|sharp']) await page.locator(`[data-cell8="${k}"]`).click(); await page.locator('#matrixcheck8').click(); await page.waitForTimeout(300); }
  if (id === '8e') { await page.locator('#own8sky').click(); await page.waitForFunction(() => /drawing/.test((document.querySelector('#own8res') || {}).innerText || ''), null, { timeout: 120000 }); for (const k of ['more', 'label', 'sharp', 'wrong']) await page.locator(`[data-box8="${k}"] button`).click(); }
  if (id === '8f') { await page.locator('#sheet8').waitFor(); await page.locator('[data-dec8="nogo"]').click(); await page.locator('#stamp8').click(); await page.waitForTimeout(400); }
  if (id === '8g') { for (const k of ['photos', 'svc', 'cnn', 'blend', 'why', 'flow', 'crew', 'console', 'trial', 'drift']) await page.locator(`[data-stage8="${k}"]`).click();
    await page.locator('#submit8').click(); await page.locator('#submit8').click(); await page.waitForTimeout(600);
    await into('#retake8', 'start'); await snap('8g_retake'); await top(); }
  if (s.kind === 'scene') await open(id, 900);
  let p = await ev((i) => window.PG.pendingOf(i), id);
  if (p) { await ev((i) => { const m = window.PG.SSs(i).mech; if (m.need != null) m.found = m.need; }, id); await put(id); await open(id, 900); await ev((i) => { const m = window.PG.SSs(i).mech; if (m.need != null) m.found = m.need; }, id); await open(id, 900); p = await ev((i) => window.PG.pendingOf(i), id); }
  if (p) { log('PENDING', id, p); NOTES[id] = (NOTES[id] || '') + ' pending: ' + p; throw new Error('stuck at ' + id + ': ' + p); }
  if (AFTER.includes(id)) { await top(); await snap(id + '_after'); }
}
fs.writeFileSync(`${OUT}/notes.json`, JSON.stringify(NOTES, null, 1));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(NOTES));
await browser.close();
