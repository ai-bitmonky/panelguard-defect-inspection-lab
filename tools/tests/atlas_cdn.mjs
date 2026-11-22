// 1) PNG atlas decoded in Chrome must be byte-identical to the old cells64.u8.  2) Python loads via the CDN constant URL (mirrored).
// 3) With the CDN unreachable, the page shows a plain error naming the failing URL.
import { chromium } from 'playwright'; import { spawn } from 'child_process'; import crypto from 'crypto'; import fs from 'fs';
import { mirrorCDN, hits, CDN } from './cdn.mjs';
const ref = crypto.createHash('sha256').update(fs.readFileSync('../ref/cells64.u8')).digest('hex');
const srv = spawn('node', ['../serve.mjs', '../../site', '8771']); await new Promise((r) => srv.stdout.once('data', r));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
let bad = 0;
{ const p = await b.newPage(); await mirrorCDN(p.context()); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8771/index.html');
  await p.waitForFunction(() => window.PG && window.PG.pack(), null, { timeout: 60000 });
  const got = await p.evaluate(async () => { const u = window.PG.pack(); const h = await crypto.subtle.digest('SHA-256', u); return { len: u.length, hex: [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('') }; });
  console.log('reference .u8 sha256 ', ref); console.log('decoded atlas sha256', got.hex, 'bytes', got.len, got.hex === ref ? 'IDENTICAL' : 'DIFFERENT');
  if (got.hex !== ref) bad++;
  await p.waitForFunction(() => window.PG.ready(), null, { timeout: 120000 });
  const k = await p.evaluate(() => ({ mode: window.PG.K.mode, base: window.PG.PYODIDE_BASE, txt: document.querySelector('#ktext').innerText }));
  const py = await p.evaluate(() => window.PG.kEval('import numpy as np, hashlib\n_r = {"sha": hashlib.sha256(open("/data/cells64.u8","rb").read()).hexdigest()}'));
  console.log('kernel', JSON.stringify(k), '| sha256 of bytes inside Python:', py.sha === ref ? 'IDENTICAL' : py.sha);
  console.log('CDN files requested:', [...new Set(hits)].join(', '));
  if (py.sha !== ref || k.mode !== 'file') bad++;
  console.log('errors:', errs.length ? errs : 'none'); if (errs.length) bad++;
  await p.close(); }
{ const c = await b.newContext(); await mirrorCDN(c, { block: true }); const p = await c.newPage();
  await p.goto('http://localhost:8771/index.html');
  await p.waitForFunction(() => document.querySelector('#lerr').classList.contains('show'), null, { timeout: 60000 });
  const t = await p.locator('#lerr').innerText(); console.log('CDN blocked ->', JSON.stringify(t), '| mode reached:', await p.evaluate(() => window.PG.K.mode));
  if (!t.includes(CDN)) bad++;
  await p.screenshot({ path: '../shots/cdn_blocked.png' }); await c.close(); }
await b.close(); srv.kill(); console.log(bad ? 'FAIL ' + bad : 'ALL OK'); process.exit(bad ? 1 : 0);
