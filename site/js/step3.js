/* PanelGuard — Step 3 content: Train a CNN with Keras + TensorFlow (TensorFlow.js in the browser).
   Student cells are JavaScript (lang 'js'). Each one shows a "Same thing in Python Keras" twin.
   Every number on screen is computed live from the student's own tensors and model. */
(function (G) {
'use strict';
var V = function () { return G.PGViz3; };
var J = function () { return G.PGJS; };
function isT(v) { return v && typeof v.dataSync === 'function' && v.shape; }
function same(a, b) { return a && b && a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }
function f3(x) { return x == null || isNaN(x) ? '—' : (+x).toFixed(3); }
function pc(x, d) { return (100 * x).toFixed(d == null ? 1 : d) + '%'; }
function n0(x) { return Math.round(x).toLocaleString('en-US'); }

/* ---------- Python data bridge: one source of truth (Step 1 split + labels, Step 2 scores) ---------- */
var BRIDGE = [
'_m = _pg_has("idx_train", "idx_val", "y", "p_val", "cell_id", "prob", "kind")',
'if _m: _r = {"missing": _m}',
'else:',
'    _r = {"n": int(len(y)), "idx_train": [int(i) for i in idx_train], "idx_val": [int(i) for i in idx_val],',
'          "y_train": [int(v) for v in y[idx_train]], "y_val": [int(v) for v in y[idx_val]],',
'          "p_val": [float(v) for v in p_val], "cell_val": [int(cell_id[i]) for i in idx_val],',
'          "prob_val": [float(prob[i]) for i in idx_val], "kind_val": [str(kind[i]) for i in idx_val],',
'          "baseline": str(globals().get("best_name", "Step 2 model"))}'
].join('\n');

/* ---------- 3e: one trained model per browser, stored under a unique key ---------- */
var MODEL_KEY = 'indexeddb://panelguard-cnn-';

/* ================= 3a ================= */
var s3a = { id: '3a', name: 'Shape the photos', kind: 'code', lang: 'js',
  goal: 'Turn the 2,624 photos into one tensor that TensorFlow can read: 4 numbers in its shape, values 0 to 1.',
  pre: { need: function (m) { return m.tilesDone ? null : 'drag the 4 tiles into the order TensorFlow reads'; }, render: function (box, api) { V().tiles(box, api); } },
  task: [
    'Gap 1: type the shape as a list of 4 whole numbers, in the order you built with the tiles. Write it with square brackets.',
    'Gap 2: type the number to divide by so that the brightest pixel (255) becomes 1.0.'
  ],
  code: [
'// pg.pixels: all 2,624 photos as one long list of bytes (0..255), from Step 1',
'// Shape order: [photos, rows, columns, channels]',
"const X = tf.tensor(pg.pixels, ____, 'float32').div(____);",
'',
'// The same trays as Step 1 (the cell numbers come from Python)',
'const xTrain = tf.gather(X, pg.idx_train);',
"const yTrain = tf.tensor1d(pg.y_train, 'float32');",
'const xVal = tf.gather(X, pg.idx_val);',
'const yVal = pg.y_val;                       // plain list of 0 / 1',
'',
"console.log('X', X.shape, '  xTrain', xTrain.shape, '  xVal', xVal.shape);",
"console.log('smallest', X.min().dataSync()[0], '  largest', X.max().dataSync()[0]);"
  ].join('\n'),
  twin: [
'import numpy as np',
'import keras',
'from keras import layers',
'',
'# [photos, rows, columns, channels], floats 0..1',
"X4 = X.reshape(2624, 64, 64, 1).astype('float32') / 255.0",
'',
"x_train, y_train = X4[idx_train], y[idx_train].astype('float32')",
'x_val, y_val = X4[idx_val], y[idx_val]',
"print('X4', X4.shape, '  x_train', x_train.shape, '  x_val', x_val.shape)",
"print('smallest', X4.min(), '  largest', X4.max())"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    var miss = ['X', 'xTrain', 'yTrain', 'xVal', 'yVal'].filter(function (k) { return !(k in NS); });
    if (miss.length) return { missing: miss };
    var X = NS.X; if (!isT(X)) return { notTensor: true };
    var r = { shape: X.shape.slice(), dtype: X.dtype, train: isT(NS.xTrain) ? NS.xTrain.shape.slice() : null, val: isT(NS.xVal) ? NS.xVal.shape.slice() : null,
      nTrain: pg.idx_train.length, nVal: pg.idx_val.length, nyVal: NS.yVal && NS.yVal.length, n: pg.n };
    var mn = X.min(), mx = X.max(); r.min = (await mn.data())[0]; r.max = (await mx.data())[0]; mn.dispose(); mx.dispose();
    if (same(r.shape, [pg.n, 64, 64, 1])) {
      var k = pg.cellIndex(6), sl = X.slice([k, 0, 0, 0], [1, 64, 64, 1]);
      r.sample = Array.prototype.map.call(await sl.data(), function (v) { return Math.round(v * 100) / 100; }); sl.dispose(); r.sampleId = 6;
    }
    return r;
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'These names are missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (r.notTensor) return { pass: false, msg: 'X is not a tensor. Keep tf.tensor(...) on the first line.' };
    var s = r.shape;
    if (s.length !== 4) return { pass: false, msg: 'X has shape [' + s.join(', ') + '] — ' + s.length + ' numbers. TensorFlow wants 4: photos, rows, columns, channels.' };
    if (s[0] !== r.n) return { pass: false, msg: 'X has shape [' + s.join(', ') + ']. The first number must count the photos (' + r.n + '). Look at your tile order.' };
    if (s[3] !== 1) return { pass: false, msg: 'X has shape [' + s.join(', ') + ']. The last number is the channels: a gray photo has 1.' };
    if (s[1] !== 64 || s[2] !== 64) return { pass: false, msg: 'X has shape [' + s.join(', ') + ']. Rows and columns are 64 each.' };
    if (Math.abs(r.max - 1) > 1e-6) return { pass: false, msg: 'The largest value is ' + r.max.toFixed(4) + '. It must be exactly 1.0. 255 ÷ ? = 1.' };
    if (r.min < 0) return { pass: false, msg: 'Some values are below 0. Pixels are never negative.' };
    if (!r.train || r.train[0] !== r.nTrain || !r.val || r.val[0] !== r.nVal) return { pass: false, msg: 'xTrain / xVal do not hold the Step 1 trays. Keep the tf.gather lines as they are.' };
    return { pass: true, msg: 'X is [' + s.join(', ') + '], values 0 to 1. Train tray ' + r.nTrain + ' photos, validation ' + r.nVal + '.' };
  },
  example: '<p>A thermal camera shoots <b>10 colour photos</b> of <b>32 × 48</b> pixels (rows × columns), 3 colour channels, and stores each value as a 16-bit number from 0 to 65,535:</p>' +
    '<pre>const P = tf.tensor(values, [10, 32, 48, 3], \'float32\').div(65535);\n// 10 × 32 × 48 × 3 = 46,080 values</pre><p>The 4 numbers multiply to the length of the list. Dividing by the largest possible value puts every value on 0..1.</p>',
  render: function (r, el, api) { V().stack(r, el, api); },
  explain: function (r) { return {
    asked: 'Build one 4-D tensor of all photos with values 0..1, then pick the Step 1 trays.',
    steps: ['TensorFlow reads image batches as [photos, rows, columns, channels].',
            r.n + ' × 64 × 64 × 1 = ' + n0(r.n * 4096) + ' values — exactly the length of pg.pixels.',
            'Brightest byte 255 ÷ <b>255</b> = 1.0, so every value sits in 0..1. Small, even numbers help training.',
            'tf.gather picks the same cells as Python’s idx_train (' + r.nTrain + ') and idx_val (' + r.nVal + '). The test tray stays sealed.'],
    trap: '[2624, 64, 64] (no channel) builds a tensor, but conv layers refuse it: they need 4 numbers. [64, 64, 2624, 1] has the right size but scrambles every photo.',
    remember: 'Images in TensorFlow: [photos, rows, columns, channels].' }; }
};

/* ================= 3b (no code: hands-on filter) ================= */
var s3b = { id: '3b', name: 'See what a filter sees', kind: 'scene', scene: 'filter',
  goal: 'A CNN layer is a stack of tiny 3 × 3 filters. Build one by hand.',
  needText: 'make a filter that lights up the crack but not the busbars',
  scenes3: true };

/* ================= 3c ================= */
var s3c = { id: '3c', name: 'Build the network', kind: 'code', lang: 'js',
  goal: 'Stack 4 blocks of filters, then one score per cell. This is the model you will train.',
  task: [
    'Gap 1: type how many channels one photo has (gray).',
    'Gap 2: each block has twice the filters of the one before it: 16, 32, ?, 128. Type the missing number.',
    'Gap 3: type how many numbers the last layer gives per cell (one defect score).',
    'Then tap the block in the diagram that holds the most weights.'
  ],
  code: [
'const model = tf.sequential();',
'model.add(tf.layers.inputLayer({ inputShape: [64, 64, ____] }));',
'',
'// 4 blocks: filters look at 3 x 3 patches, then the photo is halved',
'for (const filters of [16, 32, ____, 128]) {',
"  model.add(tf.layers.conv2d({ filters, kernelSize: 3, padding: 'same', useBias: false }));",
'  model.add(tf.layers.batchNormalization());',
"  model.add(tf.layers.activation({ activation: 'relu' }));",
'  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));',
'}',
'',
'model.add(tf.layers.globalAveragePooling2d({}));   // one average per filter',
'model.add(tf.layers.dropout({ rate: 0.3 }));',
"model.add(tf.layers.dense({ units: ____, activation: 'sigmoid' }));   // defect score 0..1",
'',
'model.summary();'
  ].join('\n'),
  twin: [
'model = keras.Sequential()',
'model.add(keras.Input(shape=(64, 64, 1)))',
'',
'for filters in [16, 32, 64, 128]:',
"    model.add(layers.Conv2D(filters, 3, padding='same', use_bias=False))",
'    model.add(layers.BatchNormalization())',
"    model.add(layers.Activation('relu'))",
'    model.add(layers.MaxPooling2D(2))',
'',
'model.add(layers.GlobalAveragePooling2D())',
'model.add(layers.Dropout(0.3))',
"model.add(layers.Dense(1, activation='sigmoid'))",
'',
'model.summary()'
  ].join('\n'),
  probe: async function (NS) {
    var m = NS.model; if (!m || !m.layers) return { missing: ['model'] };
    var L = m.layers.filter(function (l) { return l.getClassName() !== 'InputLayer'; }).map(function (l) {
      var c = l.getConfig ? l.getConfig() : {};
      return { name: l.name, cls: l.getClassName(), out: (l.outputShape || []).slice(), params: l.countParams(), filters: c.filters, act: c.activation, units: c.units };
    });
    return { layers: L, total: m.countParams(), inShape: m.inputs[0].shape.slice(), outShape: m.outputs[0].shape.slice(),
      filters: L.filter(function (l) { return l.cls === 'Conv2D'; }).map(function (l) { return l.filters; }),
      lastAct: L.length ? L[L.length - 1].act : null };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'There is no model yet. Run the whole cell.' };
    if (r.inShape[3] !== 1) return { pass: false, msg: 'The input is 64 × 64 × ' + r.inShape[3] + ', but our photos have 1 channel (gray). Gap 1 must match the last number of xTrain’s shape.' };
    if (r.filters.join() !== '16,32,64,128') return { pass: false, msg: 'Filters per block: ' + r.filters.join(', ') + '. Each block doubles the one before: 16, 32, …, 128.' };
    if (r.outShape[1] !== 1) return { pass: false, msg: 'The last layer gives ' + r.outShape[1] + ' numbers per cell. We want ONE defect score: 1 unit with a sigmoid.' };
    if (r.lastAct !== 'sigmoid') return { pass: false, msg: 'Keep the sigmoid on the last layer: it squeezes the score into 0..1.' };
    return { pass: true, msg: 'Model built: ' + r.layers.length + ' layers, ' + n0(r.total) + ' weights. Input [64, 64, 1] → one score.' };
  },
  example: '<p>A smaller network for <b>28 × 28 colour</b> stamps that sorts them into <b>3</b> kinds:</p><pre>const m = tf.sequential();\nm.add(tf.layers.inputLayer({ inputShape: [28, 28, 3] }));\nfor (const f of [8, 16]) { /* conv + pool */ }\nm.add(tf.layers.dense({ units: 3, activation: \'softmax\' }));</pre><p>The input shape is one photo (no photo count). The last layer has one unit per answer you want.</p>',
  render: function (r, el, api) { V().layers(r, el, api); },
  mechNeed: function (m) { return m && m.tapBig ? null : 'tap the block in the diagram that holds the most weights'; },
  explain: function (r) { var c = r.layers.filter(function (l) { return l.cls === 'Conv2D'; }); return {
    asked: 'Build the 4-block CNN: input 64 × 64 × 1, filters 16 → 32 → 64 → 128, one sigmoid output.',
    steps: ['Each conv filter has 3 × 3 × (channels coming in) weights. Block 1: 3 × 3 × 1 × 16 = ' + c[0].params + '.',
            'Block 4: 3 × 3 × 64 × 128 = <b>' + n0(c[3].params) + '</b> — the biggest, because 64 channels come in and 128 filters go out.',
            'Batch norm adds 4 numbers per filter (2 learned, 2 running averages). Pooling and ReLU have none.',
            'Global average pooling turns 4 × 4 × 128 into 128 numbers; the last layer has 128 + 1 = 129 weights.',
            'Total: <b>' + n0(r.total) + '</b> weights. The Step 2 features were made by hand; these are learned.'],
    trap: 'units: 2 with a sigmoid gives two unrelated scores per cell. For one yes/no answer, use 1 unit.',
    remember: 'Weights per conv = 3 × 3 × channels in × filters out.' }; }
};

/* ================= 3d ================= */
var s3d = { id: '3d', name: 'Make more photos for free', kind: 'code', lang: 'js',
  goal: 'Show the network each photo flipped at random. A flipped crack is still a crack.',
  pre: { need: function (m) { return m.sortOk ? null : 'sort all 5 changed photos, then tap “Check my sort”'; }, render: function (box, api) { V().sortAug(box, api); } },
  task: [
    'Gap 1: in a batch, axis 0 = photo, 1 = rows, 2 = columns, 3 = channel. Type the axis to reverse for a LEFT-RIGHT flip.',
  ],
  code: [
'// Flip some photos at random. A new choice each time it is called.',
'function flipSome(batch) {',
'  return tf.tidy(() => {',
'    const n = batch.shape[0];',
'    const coinLR = tf.randomUniform([n, 1, 1, 1]).less(0.5);      // one coin per photo',
'    let out = tf.where(coinLR, tf.reverse(batch, ____), batch);   // left-right',
'    const coinUD = tf.randomUniform([n, 1, 1, 1]).less(0.5);',
'    out = tf.where(coinUD, tf.reverse(out, 1), out);            // up-down',
'    return out;',
'  });',
'}',
'',
'const demo = flipSome(xTrain.slice([0, 0, 0, 0], [8, 64, 64, 1]));',
"console.log('demo batch', demo.shape);"
  ].join('\n'),
  twin: [
'rng = np.random.default_rng(0)',
'',
'def flip_some(batch):',
'    n = len(batch)',
'    lr = rng.random(n) < 0.5',
'    out = np.where(lr[:, None, None, None], np.flip(batch, axis=2), batch)   # left-right',
'    ud = rng.random(n) < 0.5',
'    out = np.where(ud[:, None, None, None], np.flip(out, axis=1), out)       # up-down',
'    return out',
'',
'demo = flip_some(x_train[:8])',
"print('demo batch', demo.shape)"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    if (typeof NS.flipSome !== 'function') return { missing: ['flipSome'] };
    var ids = [6, 447, 1, 23, 74, 245].map(pg.cellIndex), X = NS.X;
    if (!isT(X)) return { missing: ['X (run 3a)'] };
    var b = tf.gather(X, ids), V4 = tf.tidy(function () { var lr = tf.reverse(b, 2), ud = tf.reverse(b, 1); return [b, lr, ud, tf.reverse(lr, 1)]; });
    var vars = []; for (var q = 0; q < 4; q++) vars.push(await V4[q].data());
    var cnt = { orig: 0, lr: 0, ud: 0, both: 0, swapped: 0, other: 0 }, shapeOk = true, demo = null;
    for (var t = 0; t < 12; t++) {
      var o; try { o = NS.flipSome(b); } catch (e) { b.dispose(); V4.forEach(function (x) { x.dispose(); }); throw e; }
      if (!isT(o) || o.shape.join() !== b.shape.join()) { shapeOk = false; if (isT(o)) o.dispose(); break; }
      var d = await o.data(); if (!demo) demo = Array.prototype.slice.call(d); o.dispose();
      for (var i = 0; i < ids.length; i++) {
        var hit = null;
        ['orig', 'lr', 'ud', 'both'].forEach(function (nm, vi) { if (hit) return; var ok = true; for (var p = 0; p < 4096 && ok; p += 7) if (Math.abs(d[i * 4096 + p] - vars[vi][i * 4096 + p]) > 1e-5) ok = false; if (ok) hit = nm; });
        if (!hit) { for (var j = 0; j < ids.length && !hit; j++) if (j !== i) for (var vi = 0; vi < 4 && !hit; vi++) { var ok2 = true; for (var p2 = 0; p2 < 4096 && ok2; p2 += 7) if (Math.abs(d[i * 4096 + p2] - vars[vi][j * 4096 + p2]) > 1e-5) ok2 = false; if (ok2) hit = 'swapped'; } }
        cnt[hit || 'other']++;
      }
    }
    var origBytes = Array.prototype.map.call(vars[0], function (v) { return Math.round(v * 255); });
    b.dispose(); V4.forEach(function (x) { x.dispose(); });
    return { cnt: cnt, shapeOk: shapeOk, ids: [6, 447, 1, 23, 74, 245], orig: origBytes, demo: demo ? demo.map(function (v) { return Math.round(v * 255); }) : null };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (!r.shapeOk) return { pass: false, msg: 'flipSome must give back a batch of the same shape it got.' };
    var c = r.cnt;
    if (c.swapped || c.other) return { pass: false, msg: 'Photos swapped places or got mixed up. Axis 0 counts the photos, so reversing it shuffles the batch instead of flipping a photo.' };
    if (!c.lr && !c.both) return { pass: false, msg: 'No photo was flipped left-right (only up-down or unchanged). Axis 1 runs top to bottom, axis 3 is the one gray channel. Which axis runs left to right?' };
    return { pass: true, msg: 'flipSome works: in 12 tries on 6 real cells it gave ' + c.orig + ' unchanged, ' + c.lr + ' left-right, ' + c.ud + ' up-down, ' + c.both + ' both.' };
  },
  example: '<p>A batch of <b>video frames</b> shaped [frames, height, width, colour]. To mirror them top-to-bottom:</p><pre>const mirrored = tf.reverse(frames, 1);   // axis 1 = height</pre><p>Pick the axis that runs in the direction you want to flip.</p>',
  render: function (r, el, api) { V().flips(r, el, api); },
  explain: function (r) { return {
    asked: 'Flip each photo left-right with chance 1/2 (and up-down with chance 1/2).',
    steps: ['Batch axes: 0 photo, 1 rows (top→bottom), 2 columns (left→right), 3 channel.',
            'tf.reverse(batch, <b>2</b>) reverses the columns: every photo is mirrored left-right.',
            'tf.where(coin, flipped, batch) keeps the flip only where the coin says yes.',
            'In 12 test calls on 6 real cells: ' + r.cnt.orig + ' unchanged, ' + r.cnt.lr + ' left-right, ' + r.cnt.ud + ' up-down, ' + r.cnt.both + ' both. Labels never change.'],
    trap: 'Axis 0 reverses the ORDER of photos: photos and labels no longer match. Axis 3 does nothing on a 1-channel photo.',
    remember: 'Only make changes that the camera could really produce.' }; }
};

/* ================= 3e ================= */
var s3e = { id: '3e', name: 'Train it', kind: 'code', lang: 'js', long: true,
  goal: 'Train the network on the train tray. After every epoch, score the validation tray and keep the best epoch.',
  predict: { format: 'draw',
    q: 'Before you train: what does the <b>validation score</b> do if training goes on for too long? <b>Draw the line</b> from epoch 1 to epoch 30 on the chart (press and drag from left to right), then tap <b>Check</b>. One try.',
    judge: function (pts) {          // pts: 30 values 0..1 (validation ranking score, sketched)
      var mx = -1, at = 0; pts.forEach(function (v, i) { if (v > mx) { mx = v; at = i; } });
      var rise = mx - pts[0], drop = mx - pts[pts.length - 1];
      return rise > 0.08 && at <= 24 && drop >= 0.06;
    },
    answer: [0.15, 0.32, 0.45, 0.55, 0.62, 0.68, 0.72, 0.75, 0.77, 0.79, 0.8, 0.81, 0.815, 0.82, 0.82, 0.815, 0.81, 0.8, 0.79, 0.78, 0.77, 0.76, 0.75, 0.74, 0.73, 0.72, 0.71, 0.7, 0.69, 0.68],
    reveal: { asked: 'How the validation score moves when a network trains for too many epochs.',
      steps: ['Early epochs: the network learns shapes that are true for all cells, so the validation score rises.',
              'Later: it starts to remember the exact train photos (their noise, their odd marks). The train loss keeps falling…',
              '…but on photos it has never seen, the score stops rising, wobbles, and slides down. That is <b>overfitting</b>.',
              'So we score validation after every epoch and keep the weights of the best epoch, not the last one.'],
      trap: 'Thinking “more epochs = always better”. The train loss always improves; only the validation tray tells the truth.',
      remember: 'Keep the best epoch on validation, not the last one.' } },
  task: [
    'Gap 1: type the TensorFlow.js loss for yes/no answers. Its name joins the words “binary” and “crossentropy” into one word, with a capital C.',
    'Gap 2: the weight for defects = all train cells ÷ (2 × number of defects). Type the name of the variable that holds the number of defects.',
    'Then press RUN and watch the curves. Pick “Quick” or “Full” training length above the code.'
  ],
  code: [
"// 1. How the network learns: Adam optimizer, a loss for yes/no answers",
"model.compile({ optimizer: tf.train.adam(0.001), loss: '____' });",
'',
'// 2. Defects are rare: make each defect count more',
'const nDef = pg.y_train.filter((v) => v === 1).length;',
'const nOk = pg.y_train.length - nDef;',
'const classWeight = { 0: pg.y_train.length / (2 * nOk), 1: pg.y_train.length / (2 * ____) };',
'',
'// 3. Train one epoch at a time with fresh flips; score validation after each epoch',
'const keeper = pg.trainingWatch({ model, classWeight, xVal, yVal });',
'for (let epoch = 1; epoch <= pg.epochs; epoch++) {',
'  const xAug = flipSome(xTrain);',
'  await model.fit(xAug, yTrain, { epochs: 1, batchSize: 32, shuffle: true, classWeight, callbacks: pg.live });',
'  xAug.dispose();',
'  await keeper.endEpoch(epoch);',
'}',
'keeper.restoreBest();                         // put back the weights of the best epoch',
"console.log('best epoch:', keeper.bestEpoch, '  validation ranking score:', keeper.bestAuc.toFixed(3));"
  ].join('\n'),
  twin: [
'from sklearn.metrics import roc_auc_score',
'',
"model.compile(optimizer=keras.optimizers.Adam(0.001), loss='binary_crossentropy')",
'',
'n_def = int(y_train.sum())',
'n_ok = len(y_train) - n_def',
'class_weight = {0: len(y_train) / (2 * n_ok), 1: len(y_train) / (2 * n_def)}',
'',
'EPOCHS = 30',
'best_auc, best_epoch, best_weights = -1, 0, None',
'for epoch in range(1, EPOCHS + 1):',
'    x_aug = flip_some(x_train)',
'    hist = model.fit(x_aug, y_train, epochs=1, batch_size=32, shuffle=True, class_weight=class_weight, verbose=0)',
'    p = model.predict(x_val, batch_size=128, verbose=0).ravel()',
'    auc = roc_auc_score(y_val, p)',
"    print(f'epoch {epoch:2d}  train loss {hist.history[\"loss\"][0]:.3f}  validation ranking score {auc:.3f}')",
'    if auc > best_auc:',
'        best_auc, best_epoch, best_weights = auc, epoch, model.get_weights()',
'model.set_weights(best_weights)',
"print('best epoch:', best_epoch, '  validation ranking score:', round(best_auc, 3))"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    var s = pg.trainState();
    if (!s) return { missing: ['keeper (pg.trainingWatch)'] };
    var r = { epochs: s.epochs, done: s.done, hist: s.hist, best: s.best, restored: s.restored, sec: (Date.now() - s.t0) / 1000, backend: s.backend, gpu: pg.gpu, nTrain: s.nTrain, nDef: s.nDef, cw: s.cw, quick: pg.epochsMode };
    if (r.done === r.epochs && r.restored != null) r.saved = await pg.saveModel(NS.model);
    return r;
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Keep the keeper line.' };
    if (r.done < r.epochs) return { pass: false, msg: 'Training stopped after ' + r.done + ' of ' + r.epochs + ' epochs. Run it again to the end.' };
    if (r.restored == null) return { pass: false, msg: 'Training ran, but the best epoch was not put back. Keep the line keeper.restoreBest().' };
    return { pass: true, msg: 'Trained ' + r.epochs + (r.epochs === 1 ? ' epoch' : ' epochs') + ' in ' + (r.sec / 60).toFixed(1) + ' min on ' + r.backend.toUpperCase() + '. Best epoch ' + r.best.epoch + ': validation ranking score ' + f3(r.best.valAuc) + ' (kept).' };
  },
  example: '<p>A fruit sorter has <b>3 kinds</b> (softmax output, so its loss is <code>categoricalCrossentropy</code>). It saw <b>600 apples</b>, <b>300 pears</b> and <b>100 plums</b>:</p><pre>m.compile({ optimizer: tf.train.adam(0.01), loss: \'categoricalCrossentropy\' });\nconst w = { 0: 1000 / (3 * 600), 1: 1000 / (3 * 300), 2: 1000 / (3 * 100) };   // 0.56, 1.11, 3.33</pre><p>Weight = all items ÷ (number of kinds × items of that kind). The rare kind gets the big weight. A yes/no task has 2 kinds.</p>',
  render: function (r, el, api) { V().curves(r, el, api); },
  live: function (el, api) { V().curvesLive(el, api); },
  restore: true,
  explain: function (r) { var last = r.hist[r.hist.length - 1]; return {
    asked: 'Compile with a yes/no loss, weight the rare defects, train, and keep the best validation epoch.',
    steps: ['One sigmoid output + yes/no labels → <code>binaryCrossentropy</code>.',
            'Train tray: ' + r.nTrain + ' cells, ' + r.nDef + ' defects. Defect weight = ' + r.nTrain + ' / (2 × ' + r.nDef + ') = ' + r.cw[1].toFixed(2) + '; good weight = ' + r.cw[0].toFixed(2) + '.',
            'Each epoch: ' + Math.ceil(r.nTrain / 32) + ' batches of 32 flipped photos, then a validation score (ranking score, 1.0 = perfect).',
            'Best epoch: <b>' + r.best.epoch + '</b> (score ' + f3(r.best.valAuc) + '). Last epoch: ' + last.epoch + ' (score ' + f3(last.valAuc) + '). The best weights were put back.'],
    trap: 'Keeping the LAST epoch. Validation can drop while the train loss keeps falling.',
    remember: 'Train on train. Choose on validation. Never look at test.' }; }
};

/* ================= 3f ================= */
var s3f = { id: '3f', name: 'Score it and blend it', kind: 'code', lang: 'js',
  goal: 'Score every validation cell with the CNN. Then mix the CNN score with the Step 2 score and keep the mix with the fewest false alarms.',
  task: [
    'Gap 1: the blend takes the Step 2 score of the SAME cell. Type the index variable that the map gives you for that cell.',
    'Gap 2: keep a weight only when its false-alarm rate is lower than the best one so far. Type that variable name.',
    'Then drag the gate on the CNN scores until 95% of defects are stopped.'
  ],
  code: [
'// 1. CNN defect score for every validation cell',
'const pCnn = Array.from(model.predict(xVal).dataSync());',
'',
'// 2. Step 2 scores for the same cells, same order (from Python)',
'const pSvc = pg.p_val;',
'',
'// 3. Try CNN weights 0, 0.1, ... 1 and keep the one with the fewest false alarms at 95% recall',
'let bestW = 0, bestFar = 1;',
'for (let k = 0; k <= 10; k++) {',
'  const w = k / 10;',
'  const blend = pCnn.map((c, i) => w * c + (1 - w) * pSvc[____]);',
'  const far = pg.falseAlarmAt95(yVal, blend);',
'  if (far < ____) { bestFar = far; bestW = w; }',
'}',
'const pBlend = pCnn.map((c, i) => bestW * c + (1 - bestW) * pSvc[i]);',
"console.log('CNN weight:', bestW, '  false-alarm rate at 95% recall:', bestFar.toFixed(3));"
  ].join('\n'),
  twin: [
'from sklearn.metrics import precision_recall_curve',
'',
'def false_alarm_at_95(y_true, score):',
'    pr, rc, cut = precision_recall_curve(y_true, score)',
'    c = cut[rc[:-1] >= 0.95].max()',
'    stop = score >= c',
'    return float((stop & (y_true == 0)).sum() / (y_true == 0).sum())',
'',
'p_cnn = model.predict(x_val, batch_size=128, verbose=0).ravel()',
'p_svc = p_val                     # Step 2 scores, same cells, same order',
'',
'best_w, best_far = 0, 1',
'for k in range(11):',
'    w = k / 10',
'    blend = w * p_cnn + (1 - w) * p_svc',
'    far = false_alarm_at_95(y_val, blend)',
'    if far < best_far:',
'        best_far, best_w = far, w',
'p_blend = best_w * p_cnn + (1 - best_w) * p_svc',
"print('CNN weight:', best_w, '  false-alarm rate at 95% recall:', round(best_far, 3))"
  ].join('\n'),
  probe: async function (NS, pg, tf) {
    var miss = ['pCnn', 'pBlend', 'bestW', 'bestFar'].filter(function (k) { return !(k in NS); });
    if (miss.length) return { missing: miss };
    var P = J(), y = pg.y_val, ps = pg.p_val;
    var pv = NS.model.predict(NS.xVal), ref = Array.prototype.slice.call(await pv.data()); pv.dispose();
    var cnnOk = NS.pCnn.length === ref.length && NS.pCnn.every(function (v, i) { return Math.abs(v - ref[i]) < 1e-5; });
    var ws = [], bw = 0, bf = 1;
    for (var k = 0; k <= 10; k++) { var w = k / 10, bl = ref.map(function (c, i) { return w * c + (1 - w) * ps[i]; }), f = P.falseAlarmAt95(y, bl); ws.push([w, f]); if (f < bf) { bf = f; bw = w; } }
    var pb = ref.map(function (c, i) { return bw * c + (1 - bw) * ps[i]; });
    var blendOk = NS.pBlend.length === pb.length && NS.pBlend.every(function (v, i) { return Math.abs(v - pb[i]) < 1e-9; });
    function row(name, s) { var r = P.rates(y, s, P.cutAt(y, s, 0.95)); r.name = name; r.auc = P.auc(y, s); return r; }
    var bl = row('Blend', pb), pick = function (t, p) { var o = []; for (var i = 0; i < y.length; i++) if (y[i] === t && (pb[i] >= bl.cut ? 1 : 0) === p) o.push([pg.cell_val[i], pg.prob_val[i], pg.kind_val[i], Math.round(pb[i] * 1000) / 1000]); return o; };
    var card = { tp: bl.tp, fn: bl.fn, fp: bl.fp, tn: bl.tn, rec: bl.rec, far: bl.far, cut: bl.cut, n: y.length, TP: pick(1, 1), FN: pick(1, 0), FP: pick(0, 1), TN: pick(0, 0) };
    return { blendScores: pb, y: y.slice(), cnnOk: cnnOk, blendOk: blendOk, wOk: Math.abs(NS.bestW - bw) < 1e-9, bestW: NS.bestW, refW: bw, refFar: bf, ws: ws, n: y.length, nTrain: pg.idx_train.length,
      base: row(pg.baseline, ps), cnn: row('CNN', ref), blend: bl, card: card, baseline: pg.baseline,
      cells: pg.cell_val.map(function (id, i) { return [id, Math.round(ref[i] * 1e4) / 1e4, y[i], pg.prob_val[i], pg.kind_val[i]]; }) };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run the whole cell.' };
    if (!r.cnnOk) return { pass: false, msg: 'pCnn is not the CNN’s score for each validation cell. Keep line 2 as it is.' };
    if (!r.wOk || !r.blendOk) return { pass: false, msg: 'Your loop kept CNN weight ' + r.bestW + ', but the fewest false alarms come at weight ' + r.refW + ' (' + pc(r.refFar) + '). Mix each CNN score with the Step 2 score of the same cell, and keep a weight only when it beats the best so far.' };
    return { pass: true, msg: 'Blend found: CNN weight ' + r.bestW + '. False-alarm rate at 95% recall: Step 2 ' + pc(r.base.far) + ', CNN ' + pc(r.cnn.far) + ', blend ' + pc(r.blend.far) + '.' };
  },
  example: '<p>Two thermometers, A and B, read the same 4 rooms. Mix them 30% / 70%, and keep the lowest error seen so far:</p><pre>const mix = a.map((t, room) => 0.3 * t + 0.7 * b[room]);\nif (err < lowestErr) { lowestErr = err; bestMix = 0.3; }</pre><p>The second argument of map is the position, so both readings come from the same room.</p>',
  render: function (r, el, api) { V().blend(r, el, api); },
  mechNeed: function (m) { return m && m.hit ? null : 'drag the gate on the CNN scores until recall reaches 95% or more'; },
  explain: function (r) { return {
    asked: 'Score validation with the CNN, then mix it with the Step 2 score and keep the mix with the fewest false alarms at 95% recall.',
    steps: ['CNN alone at 95% recall: false-alarm rate ' + pc(r.cnn.far) + ' (Step 2: ' + pc(r.base.far) + ').',
            'Tried 11 weights. Best CNN weight: <b>' + r.bestW + '</b> → false-alarm rate ' + pc(r.blend.far) + '.',
            'Per 1,000 cells, good cells stopped: Step 2 ' + n0(1000 * r.base.fp / r.n) + ', CNN ' + n0(1000 * r.cnn.fp / r.n) + ', blend ' + n0(1000 * r.blend.fp / r.n) + '.',
            'The weight was picked on validation, so the blend number is a little hopeful. Step 8 checks it once on the sealed test tray.'],
    trap: '<code>pSvc[0]</code> mixes every cell with the FIRST cell’s score: the blend is then just a shifted CNN score.',
    remember: 'Two different inspectors make different mistakes. Averaging them can cancel some.' }; }
};

/* ================= 3g ================= */
var GOAL2 = 'Let at most <b>5 of every 100</b> defects pass. Stop the sure ones. Send the unsure ones to a person.';
var s3g = { id: '3g', name: 'Two gates, not one', kind: 'code', lang: 'js', goal2: true,
  goal: 'One gate must choose PASS or STOP for every cell. Two gates make three lanes: sure-good pass, sure-bad stop, and a middle lane where a person looks.',
  pre: { need: function (m) { return m.twoDone ? null : 'drag both gates until at most 5% of defects pass (and move each gate at least once)'; }, render: function (box, api) { V().twoGatePlay(box, api); } },
  task: [
    'Gap 1: the share of defects that may score below the low gate, as a fraction (5% of 1).',
    'Gap 2: the share of real defects the auto-stop pile must have at least, as a fraction (95% of 1).',
    'Then do the challenge on the right: set the gates for a line with one human checker.'
  ],
  code: [
'// LOW gate: at most 5% of real defects may score below it (they pass with no check)',
'const defScores = pBlend.filter((s, i) => yVal[i] === 1).sort((a, b) => a - b);',
'const low = defScores[Math.floor(____ * defScores.length)];',
'',
'// HIGH gate: the lowest score where the auto-stop pile is still at least 95% real defects',
'const order = pBlend.map((s, i) => i).sort((a, b) => pBlend[b] - pBlend[a]);   // highest first',
'let high = Infinity, caught = 0;',
'order.forEach((i, n) => {',
'  caught += yVal[i];',
'  if (caught / (n + 1) >= ____) high = pBlend[i];',
'});',
'',
'const lanes = pg.twoGates(yVal, pBlend, low, high);',
"console.log('low gate', low, '  high gate', high);",
"console.log('defects passed by mistake:', lanes.defPass, 'of', lanes.nDef);",
"console.log('per 1,000 cells: auto-pass', Math.round(1000 * lanes.autoPass), '  person', Math.round(1000 * lanes.human), '  auto-stop', Math.round(1000 * lanes.autoStop));"
  ].join('\n'),
  twin: [
'def_scores = np.sort(p_blend[y_val == 1])',
'low = def_scores[int(np.floor(0.05 * len(def_scores)))]',
'',
'order = np.argsort(-p_blend)                          # highest first',
'caught = np.cumsum(y_val[order])',
'share_real = caught / np.arange(1, len(order) + 1)',
'ok = np.where(share_real >= 0.95)[0]',
'high = p_blend[order[ok.max()]] if len(ok) else np.inf',
'',
'auto_pass = p_blend < low',
'auto_stop = p_blend >= max(high, low)',
'person = ~auto_pass & ~auto_stop',
"print(f'low gate {low:.3f}   high gate {high:.3f}')",
"print('defects passed by mistake:', int((auto_pass & (y_val == 1)).sum()), 'of', int((y_val == 1).sum()))",
"print(f'per 1,000 cells: auto-pass {1000 * auto_pass.mean():.0f}   person {1000 * person.mean():.0f}   auto-stop {1000 * auto_stop.mean():.0f}')"
  ].join('\n'),
  probe: async function (NS, pg) {
    var miss = ['low', 'high', 'pBlend'].filter(function (k) { return !(k in NS); });
    if (miss.length) return { missing: miss };
    var P = J(), y = pg.y_val, s = NS.pBlend, ref = pg.gatesFor(y, s), refB = pg.gatesFor(y, pg.p_val);
    return { low: NS.low, high: NS.high, ref: ref, lanes: P.twoGates(y, s, ref.low, ref.high), base: P.twoGates(y, pg.p_val, refB.low, refB.high), baseGates: refB,
      oneGate: { blend: P.rates(y, s, P.cutAt(y, s, 0.95)), base: P.rates(y, pg.p_val, P.cutAt(y, pg.p_val, 0.95)) }, n: y.length, baseline: pg.baseline,
      cells: pg.cell_val.map(function (id, i) { return [id, Math.round(s[i] * 1e4) / 1e4, y[i], pg.prob_val[i], pg.kind_val[i]]; }), scores: s.slice(), y: y.slice() };
  },
  check: function (r) {
    if (r.missing) return { pass: false, msg: 'Missing: ' + r.missing.join(', ') + '. Run 3f first, then this whole cell.' };
    if (r.low === undefined || r.low === null || isNaN(r.low)) return { pass: false, msg: 'low is empty: the list position is past the end. 5% must be written as a fraction of 1.' };
    if (Math.abs(r.low - r.ref.low) > 1e-12) { var t = J().twoGates(r.y, r.scores, r.low, Infinity); return { pass: false, msg: 'With your low gate ' + f3(r.low) + ', ' + t.defPass + ' of ' + t.nDef + ' defects (' + pc(t.passRate) + ') would pass unchecked. The rule is at most 5%: write it as a fraction.' }; }
    if (r.high !== r.ref.high) return { pass: false, msg: 'Your high gate is ' + f3(r.high) + '. The lowest gate where the auto-stop pile is still at least 95% real defects is ' + f3(r.ref.high) + '. Write 95% as a fraction of 1.' };
    var L = r.lanes;
    return { pass: true, msg: 'Gates ' + f3(r.low) + ' and ' + f3(r.high) + ': ' + L.defPass + ' of ' + L.nDef + ' defects pass (' + pc(L.passRate) + '); ' + n0(1000 * L.human) + ' of every 1,000 cells go to a person.' };
  },
  example: '<p>Airport bags get a risk score. Rule: at most 2% of truly dangerous bags may get through, and the “open it now” pile must be at least 90% truly dangerous:</p><pre>const lowGate = dangerScores[Math.floor(0.02 * dangerScores.length)];\nif (found / (n + 1) >= 0.90) highGate = score[i];</pre><p>Percentages go in as fractions of 1.</p>',
  render: function (r, el, api) { V().twoGateResult(r, el, api); },
  mechNeed: function (m) { return m && m.capOk ? null : 'solve the one-checker challenge: set both gates, then tap “Check my gates”'; },
  explain: function (r) { var L = r.lanes; return {
    asked: 'Find the two gates by rule: at most 5% of defects below the low gate; the auto-stop pile at least 95% real defects.',
    steps: [r.ref.nDef + ' real defects on validation. 5% of ' + r.ref.nDef + ' = ' + (0.05 * r.ref.nDef).toFixed(2) + ' → position ' + Math.floor(0.05 * r.ref.nDef) + ' in the sorted list → low gate ' + f3(r.low) + '.',
            'Walk down from the highest score. The last place where the pile is still ≥ 95% real defects is score ' + f3(r.high) + ' → high gate.',
            'Lanes per 1,000 cells: auto-pass ' + n0(1000 * L.autoPass) + ', person ' + n0(1000 * L.human) + ', auto-stop ' + n0(1000 * L.autoStop) + '.',
            'Defects passed by mistake: ' + L.defPass + ' of ' + L.nDef + ' (' + pc(L.passRate) + '). Auto-stop pile: ' + (L.stopPrec == null ? 'empty' : pc(L.stopPrec) + ' real defects') + '.'],
    trap: 'Typing 5 instead of 0.05 asks for position 5 × ' + r.ref.nDef + ', past the end of the list, so low is undefined.',
    remember: 'The model decides the sure cells. People decide the unsure ones.' }; }
};

var step3 = { id: 3, title: 'Train a CNN with Keras + TensorFlow', short: 'TensorFlow.js: tensors, filters, train, blend, two gates',
  story: 'Hand-made features missed thin cracks. Now a convolutional network learns its own filters from the pixels — trained right here in your browser.',
  substeps: [s3a, s3b, s3c, s3d, s3e, s3f, s3g] };

/* reference gates (same rules as the 3g code) */
function gatesFor(y, s) {
  var d = []; for (var i = 0; i < y.length; i++) if (y[i] === 1) d.push(s[i]);
  d.sort(function (a, b) { return a - b; });
  var low = d[Math.floor(0.05 * d.length)];
  var order = s.map(function (v, i) { return i; }).sort(function (a, b) { return s[b] - s[a]; });
  var high = Infinity, caught = 0;
  order.forEach(function (i, n) { caught += y[i]; if (caught / (n + 1) >= 0.95) high = s[i]; });
  return { low: low, high: high, nDef: d.length };
}

G.PG_STEP3 = step3;
G.PG_STEP3_BRIDGE = BRIDGE;
G.PG_STEP3_GOAL2 = GOAL2;
G.PG_STEP3_MODEL_KEY = MODEL_KEY;
G.PG_STEP3_gatesFor = gatesFor;
if (G.PG_STEPS) {
  var i3 = G.PG_STEPS.findIndex(function (s) { return s.id === 3; });
  if (i3 >= 0) G.PG_STEPS[i3] = step3;
}
})(typeof window !== 'undefined' ? window : globalThis);
