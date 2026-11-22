// writes the start state (Steps 0-7 passed, fixture model) + the fixture-saving script for the WebKit (Selenium) test
import fs from 'fs'; import { state8, KEY } from '../tests/s8seed.mjs'; import { FIX, LOAD_SRC } from '../tests/fixture.mjs';
const MKEY = 'indexeddb://panelguard-cnn-testfixture';
fs.writeFileSync('/tmp/wk_state.json', JSON.stringify({ KEY, state: state8('8a') }));
fs.writeFileSync('/tmp/wk_fix.js', `var done = arguments[arguments.length - 1]; (async function () { try {
  const load = new Function('return ' + ${JSON.stringify(LOAD_SRC)})(), m = tf.sequential(); m.add(tf.layers.inputLayer({ inputShape: [64, 64, 1] }));
  for (const f of [16, 32, 64, 128]) { m.add(tf.layers.conv2d({ filters: f, kernelSize: 3, padding: 'same', useBias: false })); m.add(tf.layers.batchNormalization()); m.add(tf.layers.activation({ activation: 'relu' })); m.add(tf.layers.maxPooling2d({ poolSize: 2 })); }
  m.add(tf.layers.globalAveragePooling2d({})); m.add(tf.layers.dropout({ rate: 0.3 })); m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  load(tf, m, ${JSON.stringify(FIX)}); await m.save(${JSON.stringify(MKEY)}); m.dispose(); done('ok'); } catch (e) { done('ERR ' + e.message); } })();`);
console.log('ok', KEY);
