// Checks the two kernel fallbacks: blob: module worker, and page-thread Pyodide (no Worker at all).
import { chromium } from 'playwright'; import { spawn } from 'child_process';
const srv = spawn('node', ['../serve.mjs', '../../site', '8767']); await new Promise((r) => srv.stdout.once('data', r));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const cases = {
  blob: () => { const W = window.Worker; window.Worker = function (u, o) { if (!String(u).startsWith('blob:')) throw new DOMException('blocked for test', 'SecurityError'); return new W(u, o); }; },
  page: () => { delete window.Worker; window.Worker = undefined; },
};
let bad = 0;
for (const [name, fn] of Object.entries(cases)) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(fn);
  const t = Date.now();
  await p.goto('http://localhost:8767/index.html');
  try { await p.waitForFunction(() => window.PG && window.PG.ready(), null, { timeout: 120000 }); } catch (e) { console.log(name, 'NOT READY', await p.locator('#lerr').innerText()); bad++; continue; }
  const r = await p.evaluate(() => window.PG.kEval('import numpy as np\n_r = {"mode": None, "sum": int(np.arange(10).sum())}'));
  const mode = await p.evaluate(() => window.PG.K.mode);
  console.log(name, 'ready in', ((Date.now() - t) / 1000).toFixed(1), 's; kernel mode =', mode, '; python result', JSON.stringify(r), '; errors', errs);
  if (mode !== (name === 'blob' ? 'blob' : name) || !r || r.sum !== 45) bad++;
  await p.close();
}
await b.close(); srv.kill(); process.exit(bad ? 1 : 0);
