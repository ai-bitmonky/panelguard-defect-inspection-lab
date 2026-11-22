// TEST FIXTURE ONLY: Step 3 architecture trained in real Keras (tools/research/step4_research.py, seed 0, 30 epochs).
// Loaded into the browser/Node model with setWeights, so Step 4 tests run on a well-trained model without hours of software-WebGL training.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const FIX = JSON.parse(fs.readFileSync(path.resolve(here, 'fixture_cnn.json'), 'utf8'));
// Per-layer load (Keras keeps each layer's weights together; tfjs model.getWeights() puts BN running stats last).
// Same source runs in Node and, as a string, inside the page.
export const LOAD_SRC = `function pgLoadFixture(tf, model, F) {
  var bin = typeof atob === 'function' ? atob(F.b64) : Buffer.from(F.b64, 'base64').toString('binary');
  var u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  var f32 = new Float32Array(u8.buffer), o = 0, k = 0;
  var W = F.shapes.map(function (s) { var n = s.reduce(function (a, b) { return a * b; }, 1); var t = tf.tensor(f32.slice(o, o + n), s); o += n; return t; });
  model.layers.forEach(function (l) { var n = l.weights.length; if (!n) return; l.setWeights(W.slice(k, k + n)); k += n; });
  if (k !== W.length) throw new Error('fixture weights left over: ' + (W.length - k));
}`;
