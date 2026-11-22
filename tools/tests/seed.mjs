// Test-only: a localStorage state where Steps 0-2 are passed (right answers from FILLS), so Step 3 tests start fast.
// On load the app replays every passed Python cell for real (the kernel state is rebuilt, nothing is faked in the app).
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
import { FILLS, fill } from './fills.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)); const site = path.resolve(here, '../../site');
export function loadSteps() {
  const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['steps.js', 'step3.js', 'step4.js', 'step5.js', 'crew.js', 'step6.js', 'step7.js', 'step8.js', 'jskernel.js']) vm.runInContext(fs.readFileSync(site + '/js/' + f, 'utf8'), ctx);
  return { ctx, SUBS: Object.fromEntries(ctx.PG_STEPS.flatMap((s) => s.substeps).map((s) => [s.id, s])) };
}
export const KEY = 'panelguard.v0.1';
export function seedState(SUBS, extra = {}) {
  const M = {
    '0a': { done: true }, '0b': { done: true }, '0c': { done: true }, '0d': { done: true },
    '1a': { opened: 2 }, '1c': { moves: 2 }, '1d': { rolls: 3 }, '1e': { found: true },
    '2a': { mixes: 3, kept: { keys: ['A', 'B', 'C'] }, best: { keys: ['A', 'B', 'C'], auc: 0.9 } }, '2c': { hit: 1, hitAt: 0.2 }, '2e': { sorted: 1, sort: {} },
  };
  const P = { '1b': { locked: true, val: 69 }, '2b': { locked: true, val: 'SVC (RBF)' }, '2d': { locked: true, val: 0.2 } };
  const subs = {};
  for (const id of Object.keys(SUBS)) {
    if (id[0] > '2') continue;
    const s = SUBS[id], st = { mech: M[id] || {}, pred: P[id] || {} };
    if (s.kind === 'code') { st.codePass = true; st.code = fill(s.code, FILLS[id].right); }
    subs[id] = st;
  }
  return JSON.stringify({ cur: '2e', subs, navW: 250, outW: 470, navC: false, ...extra });
}
