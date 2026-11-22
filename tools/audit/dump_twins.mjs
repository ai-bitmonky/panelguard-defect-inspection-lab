import { loadSteps } from '../tests/seed.mjs'; import fs from 'fs';
const { SUBS } = loadSteps(); const out = {};
for (const [id, s] of Object.entries(SUBS)) if (s.kind === 'code') out[id] = { lang: s.lang || 'py', twin: s.twin || null, twinTitle: s.twinTitle || null, twinNote: s.twinNote || null, code: s.code, ref: s.ref, fixes: s.fixes || null };
fs.writeFileSync(new URL('./twins.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(Object.entries(out).map(([k, v]) => k + ':' + (v.twin ? v.twin.split('\n').length + 'L' : '-') + (v.twinTitle ? '(' + v.twinTitle + ')' : '')).join('  '));
