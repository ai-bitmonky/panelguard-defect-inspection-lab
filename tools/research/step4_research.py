# Step 4 research (real Python, Keras 3 / TF 2.21): train the Step 3 twin model, then compare Grad-CAM layers with the
# deletion test, and export the trained weights as a TEST FIXTURE for the browser tests (tools/tests/fixture_cnn.json).
import runpy, json, os, numpy as np, tensorflow as tf
G = runpy.run_path(os.path.join(os.path.dirname(__file__), 'step3_twin.py'))
model, x_val, y_val, layers = G['model'], G['x_val'], G['y_val'], G['layers']
acts = [l for l in model.layers if isinstance(l, layers.Activation)]
p = model.predict(x_val, verbose=0).ravel()
def gradcam(L, imgs):
    Ls = model.layers; cut = Ls.index(L)
    def run(ls, x):
        for l in ls: x = l(x, training=False)
        return x
    A = run(Ls[:cut + 1], tf.constant(imgs))
    with tf.GradientTape() as t:
        t.watch(A); s = tf.reduce_sum(run(Ls[cut + 1:], A))
    g = t.gradient(s, A); w = tf.reduce_mean(g, axis=(1, 2), keepdims=True)
    cam = tf.nn.relu(tf.reduce_sum(A * w, axis=-1))
    return tf.image.resize(cam[..., None], (64, 64), method='bilinear')[..., 0].numpy()
rng = np.random.default_rng(0); dI = np.where(y_val == 1)[0]; K = 410
res = {}
for li in [1, 2, 3]:
    cams = gradcam(acts[li], x_val[dI])
    hot, rnd = [], []
    for j, i in enumerate(dI):
        img = x_val[i, :, :, 0]; m = img.mean()
        o = np.argsort(-cams[j].ravel())[:K]; r = rng.choice(4096, K, replace=False)
        a = img.ravel().copy(); a[o] = m; b = img.ravel().copy(); b[r] = m
        hot.append(a.reshape(64, 64)); rnd.append(b.reshape(64, 64))
    ph = model.predict(np.array(hot)[..., None], verbose=0).ravel(); pr = model.predict(np.array(rnd)[..., None], verbose=0).ravel()
    res[li] = dict(grid=int(acts[li].output.shape[1]), drop_hot=round(float((p[dI] - ph).mean()), 3), drop_rand=round(float((p[dI] - pr).mean()), 3), hot_wins=round(float(((p[dI] - ph) > (p[dI] - pr)).mean()), 3))
print(json.dumps(res))
# fixture: weights in tfjs layer order (Keras 3 and tfjs use the same per-layer order: kernel / gamma, beta, moving mean, moving var / kernel, bias)
W = [w.tolist() for w in model.get_weights()]
json.dump({'note': 'TEST FIXTURE ONLY: Step 3 architecture trained in Keras (step3_twin.py, seed 0, 30 epochs). Never shipped.', 'weights': W, 'p_val_check': [float(v) for v in p[:5]], 'best_epoch': G['best_epoch'], 'best_auc': float(G['best_auc'])},
          open(os.path.join(os.path.dirname(__file__), '../tests/fixture_cnn.json'), 'w'))
print('fixture written; first val scores', p[:5])
