// Step 8 test start state: Steps 0-7 passed (s7seed state + the Step 7 mech below); Step 3 model = the Keras-trained TEST FIXTURE.
// Everything replays for real on load (Steps 1-7 cells). The 7d checker rate below is a TEST SEED (in real use: measured by the student in 7d).
import { SUBS, putFixture, state7, KEY, FIX } from './s7seed.mjs'; import { fill } from './fills.mjs';
export { SUBS, putFixture, KEY, FIX };
export const RATE_SEED = { answered: 10, medianSeconds: 2.4, perHour: 1500, share: 0.541, perMinute: 30, neededPerHour: 974, keepsUp: true, checkers: 1 };
export function state8(cur = '8a', extra = {}) {
  const st = JSON.parse(state7(cur));
  const M = { '7a': { done: 1, put: {}, sawFar: 1 }, '7b': { views: { gray: 1, far: 1 } }, '7c': { knob: 'MAX', ran: 30 }, '7d': { answered: 10, rate: RATE_SEED },
    '7e': {}, '7f': { reported: 1, copied: 1 }, '7g': { fixed: { camera: 1, model: 1, empty: 1, flow: 1 } } };
  for (const id of Object.keys(M)) {
    const s = SUBS[id]; st.subs[id] = { mech: M[id], pred: s.predict ? { locked: true, val: { busy: 'lanes', target: 'bullet', poly: 'pair' }, good: 1, nRight: 3 } : {} };
    if (s.kind === 'code') { st.subs[id].codePass = true; let c = fill(s.code, s.ref || []); for (const f of s.fixes || []) c = c.split(f[0]).join(f[1]); st.subs[id].code = c; }
  }
  Object.assign(st.subs, extra);
  st.cur = cur;
  return JSON.stringify(st);
}
