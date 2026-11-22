// Embeds the site in sandboxed iframes like an artifact host would, then loads Python and runs one real cell.
import { chromium } from 'playwright'; import { spawn } from 'child_process'; import http from 'http';
const site = spawn('node', ['../serve.mjs', '../../site', '8768'], { env: { ...process.env, CORS: '1' } }); await new Promise((r) => site.stdout.once('data', r));
const cfgs = { 'allow-scripts allow-same-origin': 'same-origin sandbox', 'allow-scripts': 'opaque-origin sandbox (no allow-same-origin)' };
let port = 8790; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
for (const [sb, label] of Object.entries(cfgs)) {
  const html = `<!doctype html><body style="margin:0"><iframe id=f sandbox="${sb}" src="http://localhost:8768/index.html" style="width:1366px;height:768px;border:0"></iframe>`;
  const hostSrv = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end(html); }).listen(++port);
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } }); const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto(`http://127.0.0.1:${port}/`);
  const f = p.frameLocator('#f'); const fr = p.frames().find((x) => x.url().includes('8768'));
  let ready = false; const t = Date.now();
  for (let i = 0; i < 60 && !ready; i++) { await p.waitForTimeout(2000); ready = await fr.evaluate(() => !!(window.PG && window.PG.ready())).catch(() => false); if (await fr.evaluate(() => document.querySelector('#lerr').classList.contains('show'))) break; }
  const st = await fr.evaluate(() => ({ mode: window.PG.K.mode, k: document.querySelector('#ktext').innerText, err: document.querySelector('#lerr').innerText, ls: (() => { try { localStorage.setItem('x', '1'); return 'localStorage ok'; } catch (e) { return 'localStorage blocked: ' + e.name; } })() }));
  let res = null; if (ready) res = await fr.evaluate(() => window.PG.kEval('import numpy as np, json\n_r = {"shape": list(np.fromfile("/data/cells64.u8", dtype=np.uint8).reshape(-1, 64, 64).shape)}'));
  console.log(`[${label}] ready=${ready} in ${((Date.now() - t) / 1000).toFixed(0)}s`, JSON.stringify(st), 'python:', JSON.stringify(res), 'errors:', errs);
  await p.screenshot({ path: `../shots/sandbox_${sb.replace(/ /g, '_')}.png` });
  await p.close(); hostSrv.close();
}
await b.close(); site.kill();
