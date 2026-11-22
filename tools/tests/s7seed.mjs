// Step 7 test start state: Steps 0-6 passed (seed.mjs + the mech below); Step 3 model = the Keras-trained TEST FIXTURE in IndexedDB.
// Everything replays for real on load (Steps 3-6 cells). Shared by s7_e2e.mjs and dev7.mjs.
import { fill } from './fills.mjs'; import { loadSteps, seedState, KEY } from './seed.mjs'; import { FIX, LOAD_SRC } from './fixture.mjs';
export const { SUBS } = loadSteps();
export const MKEY = 'indexeddb://panelguard-cnn-testfixture';
export async function putFixture(ev) {
  await ev(async ([src, F2, key]) => {
    const load = new Function('return ' + src)(), m = tf.sequential(); m.add(tf.layers.inputLayer({ inputShape: [64, 64, 1] }));
    for (const f of [16, 32, 64, 128]) { m.add(tf.layers.conv2d({ filters: f, kernelSize: 3, padding: 'same', useBias: false })); m.add(tf.layers.batchNormalization()); m.add(tf.layers.activation({ activation: 'relu' })); m.add(tf.layers.maxPooling2d({ poolSize: 2 })); }
    m.add(tf.layers.globalAveragePooling2d({})); m.add(tf.layers.dropout({ rate: 0.3 })); m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    load(tf, m, F2); await m.save(key); m.dispose();
  }, [LOAD_SRC, FIX, MKEY]);
}
export function state7(cur = '7a') {
  const st = JSON.parse(seedState(SUBS, { epochsMode: 'full' }));
  const M = { '3a': { tilesDone: 1 }, '3b': { done: 1 }, '3c': { tapBig: 1 }, '3d': { sortOk: 1 }, '3e': { modelKey: MKEY, savedAt: 'TEST FIXTURE (Keras-trained)', lastRes: { epochs: 30, done: 30, hist: [{ epoch: FIX.best_epoch, loss: null, valLoss: 0.5, valAuc: FIX.best_auc, sec: 0 }], best: { epoch: FIX.best_epoch, valAuc: FIX.best_auc }, restored: FIX.best_epoch, sec: 0, backend: 'webgl', gpu: null, nTrain: 1574, nDef: 492, cw: [0.7, 1.6], quick: 'full' } }, '3f': { hit: 1 }, '3g': { twoDone: 1, capOk: 1 },
    '4a': { paint: { 496: [1], 1088: [1], 379: [1] }, done: true }, '4b': { patchOk: 1, bestDrop: 0.5 }, '4c': { peek: 3 }, '4d': {}, '4e': { rows: ['kind', 'prob'] },
    '4f': { done: 1, box: {}, actions: { more: [2166, 2456], label: [593, 1222], sharp: [2089], wrong: [1761] } },       // a sorted action list (in real use: the student's own boxes)
    '5a': { done: 1, wires: [] }, '5b': { cardOk: 1 }, '5c': { tokenEnd: 1 }, '5d': {}, '5e': { sawLoop: 1 }, '5f': { dec: { a: 'pass', b: 'pass', c: 'stop', d: 'pass', e: 'stop' } }, '5g': { need: 0, found: 0 } };
  Object.assign(M, { '6a': { done: 1, put: {} }, '6b': { called: { shift_stats: 1, slice_table: 1, worst_cases: 1, action_list: 1 } }, '6c': { read: { 0: 1, 1: 1, 2: 1 } }, '6d': { sawPoor: 1 }, '6e': { traceEnd: 1, tk: 0 }, '6f': { huntDone: 1, found: 2 }, '6g': { skipped: 1, done: 1 } });
  const PRED = { lanes: { locked: true, val: { place: {} }, good: 1, cells: [] } };
  for (const id of Object.keys(M)) { const s = SUBS[id]; st.subs[id] = { mech: M[id], pred: s.predict ? (s.predict.format === 'lanes' ? PRED.lanes : { locked: true, val: s.predict.format === 'draw' ? new Array(30).fill(0.5) : 1, good: 1 }) : {} }; if (s.kind === 'code') { st.subs[id].codePass = true; st.subs[id].code = fill(s.code, s.ref); } }
  st.cur = cur;
  return JSON.stringify(st);
}
export { KEY, FIX };
