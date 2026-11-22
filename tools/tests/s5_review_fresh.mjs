// Review mode from a FRESH browser (nothing passed, no saved model): open 5g and press "Run up to here".
// Every earlier code cell runs for real with its reference answer (3e trains with the review setting: 1 epoch, rough numbers).
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site'); const shots = path.resolve(here, '../shots');
const srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8772'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r));
process.on('exit', () => { try { srv.kill(); } catch (e) {} });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = [], hosts = new Set(); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('request', (q) => { try { hosts.add(new URL(q.url()).host || q.url().slice(0, 12)); } catch (e) {} });
const t0 = Date.now(), log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a); const fails = []; const expect = (ok, w) => { log(ok ? 'OK  ' : 'FAIL', w); if (!ok) fails.push(w); };
await page.goto('http://localhost:8772/index.html?review=1#sub-5g');
await page.waitForFunction(() => window.PG && window.PG.ready() && window.PG.JSR.ready, null, { timeout: 300000 });
expect(await page.evaluate(() => window.PG.review() && window.PG.S.cur === '5g'), 'fresh visit in review mode lands on 5g');
await page.click('#runupto');
let last = '';
while (await page.evaluate(() => window.PG.runningUpTo())) { const s = await page.evaluate(() => (document.getElementById('rvstat') || {}).textContent || ''); if (s !== last) { log(s); last = s; } await page.waitForTimeout(3000); }
await page.waitForTimeout(800);
const v = await page.evaluate(() => window.PG.VERD['5g']);
expect(v && v.pass, 'Run up to here on 5g from nothing: ' + (v && v.msg) + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + 's)');
await page.screenshot({ path: shots + '/s5_review_fresh_5g.png' });
expect(await page.evaluate(() => { try { return !localStorage.getItem('panelguard.v0.1') || !JSON.parse(localStorage.getItem('panelguard.v0.1')).subs['5g']; } catch (e) { return true; } }), 'nothing saved as student progress');
log('hosts contacted:', [...hosts].join(', '));
expect([...hosts].every((h) => /^localhost|^cdn\.jsdelivr\.net$|^fonts\.(googleapis|gstatic)\.com$|^data:|^blob:/.test(h) || h === ''), 'no requests to other hosts (LangGraph/langsmith make no calls)');
expect(errors.length === 0, 'zero console errors' + (errors.length ? ': ' + JSON.stringify(errors.slice(0, 5)) : ''));
log('TOTAL', ((Date.now() - t0) / 1000).toFixed(0) + 's | FAILS:', fails.length);
await browser.close(); process.exit(fails.length ? 1 : 0);
