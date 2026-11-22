// DEV harness (not a test): Chrome with Steps 0-6 seeded; then evaluates /tmp/dev7/cmd.mjs (an async function body
// run in Node with { page, F, ev, shot, log }) whenever it appears, writing /tmp/dev7/out.txt.
import { chromium } from 'playwright'; import { mirrorCDN } from './cdn.mjs'; import { spawn } from 'child_process';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { putFixture, state7, KEY } from './s7seed.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site');
const W = +(process.env.W || 1366), H = +(process.env.H || 768);
const srv = spawn('node', [path.resolve(here, '../serve.mjs'), site, '8779'], { stdio: 'pipe' }); await new Promise((r) => srv.stdout.once('data', r));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H } }); await mirrorCDN(ctx); const page = await ctx.newPage();
const errors = []; page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 300)); }); page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const ev = (f, a) => page.evaluate(f, a); const log = (...a) => fs.appendFileSync('/tmp/dev7/log.txt', a.join(' ') + '\n');
let n = 0; const shot = async (nm) => { const p = `/tmp/dev7/${String(++n).padStart(2, '0')}_${nm}.png`; await page.screenshot({ path: p }); return p; };
await page.goto('http://localhost:8779/index.html');
await page.waitForFunction(() => window.PG && window.PG.JSR.ready, null, { timeout: 300000 });
await putFixture(ev);
await ev(([k, v]) => localStorage.setItem(k, v), [KEY, state7('7a')]);
await page.reload();
for (let i = 0; ; i++) {
  const st = await ev(() => ({ ready: !!(window.PG && window.PG.ready && window.PG.ready()), js: !!(window.PG && window.PG.JSR.ready), res: window.PG ? Object.keys(window.PG.RES).join(',') : '' })).catch((e) => ({ err: String(e) }));
  log('wait', i, JSON.stringify(st), errors.slice(-3).join(' | '));
  if (st.ready && st.js && /6f/.test(st.res)) break;
  await new Promise((r) => setTimeout(r, 20000));
}
log('READY'); fs.writeFileSync('/tmp/dev7/ready', '1');
for (;;) {
  if (fs.existsSync('/tmp/dev7/cmd.mjs')) {
    const src = fs.readFileSync('/tmp/dev7/cmd.mjs', 'utf8'); fs.unlinkSync('/tmp/dev7/cmd.mjs');
    let out; errors.length = 0;
    try { out = await new (Object.getPrototypeOf(async function () {}).constructor)('page', 'ev', 'shot', 'log', src)(page, ev, shot, log); } catch (e) { out = 'HARNESS ERROR ' + (e.stack || e); }
    fs.writeFileSync('/tmp/dev7/out.txt', (typeof out === 'string' ? out : JSON.stringify(out, null, 1)) + '\n--- console errors/warnings:\n' + errors.join('\n'));
  }
  await new Promise((r) => setTimeout(r, 300));
}
