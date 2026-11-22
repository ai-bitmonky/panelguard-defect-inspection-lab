// item 2: open a deep link to a LOCKED page, then unlock it and tap that page in the strip: it must open.
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs'; import { loadSteps, seedState, KEY } from '../tests/seed.mjs'; import { fill } from '../tests/fills.mjs';
const { SUBS } = loadSteps(); const DIST = process.env.DIST;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true }); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx);
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const st = JSON.parse(seedState(SUBS)); st.subs['2a'].codePass = false; for (const k of ['2b', '2c', '2d', '2e']) delete st.subs[k]; st.cur = '1e';
await p.goto('file:///tmp/blank.html'); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(st)]);
await p.goto('file://' + DIST + '#sub-2b'); await p.waitForFunction(() => window.PG && window.PG.ready(), null, { timeout: 600000 }); await p.waitForTimeout(800);
const a = await p.evaluate(() => ({ cur: window.PG.S.cur, hash: location.hash })); console.log('deep link to locked 2b ->', JSON.stringify(a));
await p.locator('.edw textarea').first().fill(fill(SUBS['2a'].code, SUBS['2a'].ref)); await p.locator('#runbtn').click(); await p.waitForFunction(() => window.PG.VERD['2a'] && window.PG.running() == null, null, { timeout: 300000 });
// 2a also needs its hands-on (keep a mix): write it as the student would have it after measuring
await p.evaluate(() => { const s = window.PG.S.subs['2a']; s.mech = Object.assign(s.mech || {}, { mixes: 3, kept: ['A', 'B', 'C'], best: { keys: ['A', 'B', 'C'], auc: 0.9 } }); });
await p.evaluate(() => { location.hash = '#sub-1e'; }); await p.waitForTimeout(500); await p.evaluate(() => { location.hash = '#sub-2a'; }); await p.waitForTimeout(500);
console.log('2a passed:', await p.evaluate(() => window.PG.passed('2a')), '| pending', await p.evaluate(() => window.PG.pendingOf('2a')));
await p.evaluate(() => { location.hash = '#sub-2a'; }); await p.waitForTimeout(300);
await p.locator('.strip .snode').nth(1).click(); await p.waitForTimeout(800);
const c = await p.evaluate(() => ({ cur: window.PG.S.cur, hash: location.hash })); console.log('tap 2b in the strip ->', JSON.stringify(c));
console.log(a.cur === '2a' && a.hash === '#sub-2a' && c.cur === '2b' ? 'DEEPLINK OK' : 'DEEPLINK PROBLEM', '| errors', JSON.stringify(errs));
await b.close();
