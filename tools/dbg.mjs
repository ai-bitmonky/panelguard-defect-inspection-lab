import { chromium } from 'playwright'; import { spawn } from 'child_process';
const srv = spawn('node', ['serve.mjs', '../site', '8766']); await new Promise((r) => srv.stdout.once('data', r));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
p.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('PAGEERR', e.message));
p.on('requestfailed', (r) => console.log('REQFAIL', r.url(), r.failure().errorText));
await p.goto('http://localhost:8766/index.html');
for (let i = 0; i < 12; i++) { await p.waitForTimeout(5000); console.log(i, await p.evaluate(() => [document.querySelector('#ltext').innerText, document.querySelector('#ktext').innerText, document.querySelector('#lerr').innerText, window.PG.K.mode, window.PG.K.ready])); if (await p.evaluate(() => window.PG.K.ready)) break; }
await p.screenshot({ path: 'shots/dbg.png' });
await b.close(); srv.kill();
