import { chromium } from 'playwright';
import fs from 'fs';
const html = fs.readFileSync('../dist/PanelGuard_Defect_Inspection_Lab_v0.3.html','utf8');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true }); const p = await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,200))});
for (const sb of ['allow-scripts','allow-scripts allow-same-origin', null]) {
  errs.length=0;
  await p.setContent('<iframe id=f style="width:1300px;height:700px"></iframe>');
  await p.evaluate(([h,sb])=>{const f=document.getElementById('f'); if(sb!==null)f.setAttribute('sandbox',sb); f.srcdoc=h;},[html,sb]);
  await p.waitForTimeout(6000);
  const fr = p.frames()[1];
  const txt = await fr.evaluate(()=>document.body.innerText.slice(0,160).replace(/\n/g,' | ')).catch(e=>'EVALFAIL '+e.message);
  console.log('sandbox=',sb,'\n  text:',txt,'\n  errs:',errs.slice(0,4));
}
await b.close();
