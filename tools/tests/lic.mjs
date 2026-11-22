import { chromium } from 'playwright'; import { mirrorCDN, hits } from './cdn.mjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true }); const p = await b.newPage(); await mirrorCDN(p.context());
const ext = []; p.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) ext.push(r.url().split('?')[0]); });
await p.goto('file:///home/claude/panelguard/dist/PanelGuard_Defect_Inspection_Lab_v0.1.html'); await p.waitForTimeout(1500);
await p.locator('#lic').click(); await p.waitForTimeout(400);
const t = await p.locator('.zoom pre').innerText(); console.log('licence overlay chars:', t.length, '| starts:', JSON.stringify(t.slice(0, 60)), '| hash still', await p.evaluate(() => location.hash));
await p.waitForFunction(() => window.PG.ready(), null, { timeout: 120000 });
console.log('non-file requests:', [...new Set(ext.map((u) => u.replace(/[^/]+$/, '')))]); await b.close();
