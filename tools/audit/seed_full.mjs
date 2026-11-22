// Seed a persistent profile for the FULL (30-epoch) live run: Steps 0-2 + 3a-3d passed (reference code, replayed for real on load).
import { chromium } from 'playwright'; import { mirrorCDN } from '../tests/cdn.mjs'; import { loadSteps, seedState, KEY } from '../tests/seed.mjs'; import { fill } from '../tests/fills.mjs';
const { SUBS } = loadSteps(); const PROFILE = process.env.PROFILE || '/tmp/audit_full'; const DIST = process.env.DIST;
const st = JSON.parse(seedState(SUBS, { epochsMode: 'full' }));
const M3 = { '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 } };
for (const id of ['3a', '3b', '3c', '3d']) { const s = SUBS[id]; st.subs[id] = { mech: M3[id], pred: {} }; if (s.kind === 'code') { st.subs[id].codePass = true; st.subs[id].code = fill(s.code, s.ref); } }
st.cur = '3e';
const ctx = await chromium.launchPersistentContext(PROFILE, { executablePath: '/usr/bin/google-chrome', headless: true }); await mirrorCDN(ctx);
const p = ctx.pages()[0] || await ctx.newPage(); await p.goto('file://' + DIST); await p.waitForFunction(() => window.PG && window.PG.S, null, { timeout: 120000 });
await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(st)]); await ctx.close(); console.log('seeded', PROFILE);
