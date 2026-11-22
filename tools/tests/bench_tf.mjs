// Measures TF.js training speed of the Step 3 model in headless Chrome (WebGL and CPU backends).
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const tfjs = path.resolve(here, '../../site/js/tf.min.js');
const args = (process.env.GPUARGS || '').split(' ').filter(Boolean);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args });
const p = await b.newPage();
p.on('console', (m) => console.log('[page]', m.text()));
await p.goto('about:blank'); await p.addScriptTag({ path: tfjs });
for (const be of (process.env.BE || 'webgl,cpu').split(',')) {
  const r = await p.evaluate(async ([be, n]) => {
    const ok = await tf.setBackend(be); await tf.ready();
    let info = '';
    if (be === 'webgl') { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); info = gl ? (d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : 'no webgl2'; }
    const m = tf.sequential(); m.add(tf.layers.inputLayer({ inputShape: [64, 64, 1] }));
    for (const f of [16, 32, 64, 128]) { m.add(tf.layers.conv2d({ filters: f, kernelSize: 3, padding: 'same', useBias: false })); m.add(tf.layers.batchNormalization()); m.add(tf.layers.activation({ activation: 'relu' })); m.add(tf.layers.maxPooling2d({ poolSize: 2 })); }
    m.add(tf.layers.globalAveragePooling2d({})); m.add(tf.layers.dropout({ rate: 0.3 })); m.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    m.compile({ optimizer: tf.train.adam(0.001), loss: 'binaryCrossentropy' });
    const x = tf.randomUniform([n, 64, 64, 1]), y = tf.randomUniform([n]).greater(0.7).toFloat();
    const t0 = performance.now(); await m.fit(x, y, { epochs: 1, batchSize: 32, verbose: 0 }); const t1 = performance.now();
    await m.fit(x, y, { epochs: 1, batchSize: 32, verbose: 0 }); const t2 = performance.now();
    const t3 = performance.now(); const pv = m.predict(x.slice(0, Math.min(n, 525))); await pv.data(); const t4 = performance.now();
    return { be: tf.getBackend(), ok, info, params: m.countParams(), n, first: ((t1 - t0) / 1000).toFixed(1), second: ((t2 - t1) / 1000).toFixed(1), predict525: ((t4 - t3) / 1000).toFixed(2) };
  }, [be, +(process.env.N || 320)]);
  console.log(JSON.stringify(r));
}
await b.close();
