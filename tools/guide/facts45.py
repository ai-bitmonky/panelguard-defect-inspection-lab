"""Facts for the Step 4-5 diagrams, computed with the lab's own logic (site/js/step4.js, step5.js; the same rules as the twins
tools/research/step34_twin.py and step5_twin.py) on the reference CNN = test fixture tools/tests/fixture_cnn.json (Keras twin,
seed 0) and the Step 2 SVC scores (tools/research/svc_val.npy). Merges keys s4 / s5 / photos into tools/guide/src/facts.json.
Exactly like the lab: occlusion = 8 x 8 patch set to the photo mean, 4 px steps (15 x 15 spots); Grad-CAM at the 3rd ReLU
(16 x 16), relu of the weighted sum; deletion = hottest 410 pixels of the bilinear-upsampled map vs pg.randomPixels(410, i)
(the lab's own seeded shuffle, ported); blend = bestW * cnn + (1 - bestW) * svc; gates = 3g rules; shifts = step5.js runShift
(perfect checker, rightNineInTen(perfect, 7), poly gate) and checked against tools/research/step5_twin_run.log.
Run: python3 -I tools/guide/facts45.py   (numpy, keras/tensorflow, pillow; ~1 min)"""
import json, os, base64, io, re
import numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
from sklearn.model_selection import train_test_split
import tensorflow as tf
import keras
from keras import layers

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
rows = json.load(open(os.path.join(root, 'site/data/labels.json')))['rows']
cid = np.array([r[0] for r in rows]); prob = np.array([r[1] for r in rows]); kind = np.array([r[2] for r in rows])
X = np.fromfile(os.path.join(root, 'tools/ref/cells64.u8'), dtype=np.uint8).reshape(2624, 64, 64)
y = (prob >= 0.5).astype(int); idx = np.arange(len(y))
itr, ir = train_test_split(idx, test_size=0.4, stratify=y, random_state=42)
iva, ite = train_test_split(ir, test_size=0.5, stratify=y[ir], random_state=42)
X4 = (X.astype(np.float32) / 255).reshape(-1, 64, 64, 1)
xv, yv, pv, kv, idv = X4[iva], y[iva], prob[iva], kind[iva], cid[iva]
VAL = {int(c): i for i, c in enumerate(idv)}
svc = np.load(os.path.join(root, 'tools/research/svc_val.npy'))

fx = json.load(open(os.path.join(root, 'tools/tests/fixture_cnn.json')))
model = keras.Sequential(); model.add(keras.Input(shape=(64, 64, 1)))
for f in [16, 32, 64, 128]:
    model.add(layers.Conv2D(f, 3, padding='same', use_bias=False)); model.add(layers.BatchNormalization()); model.add(layers.Activation('relu')); model.add(layers.MaxPooling2D(2))
model.add(layers.GlobalAveragePooling2D()); model.add(layers.Dropout(0.3)); model.add(layers.Dense(1, activation='sigmoid'))
flat = np.frombuffer(base64.b64decode(fx['b64']), dtype=np.float32); ws = []; o = 0
for shp in fx['shapes']:
    k = int(np.prod(shp)); ws.append(flat[o:o + k].reshape(shp)); o += k
model.set_weights(ws)
p_cnn = model.predict(xv, batch_size=128, verbose=0).ravel()
assert np.allclose(p_cnn[:5], fx['p_val_check'][:5], atol=1e-4), 'fixture mismatch'
pred = lambda a: model.predict(np.asarray(a, dtype=np.float32), batch_size=128, verbose=0).ravel()

# ---------------- the lab's helpers (step4.js extra) ----------------
def gray_patch(img, r, c, size=8):
    d = img.copy(); d[r:r + size, c:c + size, 0] = img.mean(); return d
def cover_up(img):
    base = float(pred(img[None])[0])
    cov = [gray_patch(img, r * 4, c * 4) for r in range(15) for c in range(15)]
    return base, base - pred(cov)
L = model.layers; acts = [l for l in L if isinstance(l, layers.Activation)]; cut = L.index(acts[2])
front, back = L[:cut + 1], L[cut + 1:]
def run(ls, x):
    for l in ls: x = l(x, training=False)
    return x
def grad_cam(img, parts=False):
    A = run(front, tf.constant(img[None]))
    with tf.GradientTape() as tape:
        tape.watch(A); s = tf.reduce_sum(run(back, A))
    g = tape.gradient(s, A); w = tf.reduce_mean(g, axis=(0, 1, 2)); cam = tf.reduce_sum(A * w, axis=-1)[0]
    if parts: return A.numpy()[0], w.numpy(), cam.numpy()
    return tf.nn.relu(cam).numpy()
def upsample(cam):    # tf.image.resizeBilinear(alignCorners=false, halfPixelCenters=true) == TF2 tf.image.resize bilinear
    return tf.image.resize(cam[..., None], (64, 64), method='bilinear').numpy().ravel()
def random_pixels(k, seed):   # pg.randomPixels, the lab's seeded shuffle (exact port)
    s = (seed * 9301 + 49297) % 233280 + 1; a = list(range(4096))
    for i in range(4095, 0, -1):
        s = (s * 9301 + 49297) % 233280; j = int(np.floor(s / 233280 * (i + 1))); a[i], a[j] = a[j], a[i]
    return a[:k]
def gray_out(img, pix):
    d = img.ravel().copy(); d[pix] = img.mean(); return d.reshape(64, 64, 1)
def hot_order(cam):
    up = upsample(cam); return np.argsort(-up, kind='stable'), up
def cut_at(yy, s, r=0.95):
    d = np.sort(s[yy == 1])[::-1]; k = int(np.ceil(r * len(d) - 1e-9)); return d[max(0, k - 1)]
r3 = lambda a: [round(float(v), 3) for v in np.ravel(a)]
r4 = lambda a: [round(float(v), 4) for v in np.ravel(a)]
r6 = lambda a: [float('%.4g' % v) for v in np.ravel(a)]

S4 = {}
PAINT = [496, 1088, 379]
S4['paint'] = []
for c in PAINT:
    img = xv[VAL[c]]; base, cov = cover_up(img); cam = grad_cam(img); order, up = hot_order(cam)
    S4['paint'].append({'id': c, 'score': round(base, 4), 'cover': r3(cov), 'cam': r6(cam), 'hot': [int(v) for v in order[:410]], 'prob': float(pv[VAL[c]]), 'kind': str(kv[VAL[c]])})
    print('paint', c, 'score', round(base, 3), 'max drop', round(float(cov.max()), 3), 'cam max', round(float(cam.max()), 4))
# 4c: Grad-CAM parts for cell 496 (the 64 block-3 maps and their weights)
A, w, raw = grad_cam(xv[VAL[496]], parts=True)
contrib = (A * w).sum(axis=(0, 1))
top = np.argsort(-np.abs(contrib))[:6]
hr, hc = np.unravel_index(np.argmax(np.maximum(raw, 0)), raw.shape)
S4['parts'] = {'id': 496, 'w': r6(w), 'top': [int(k) for k in top], 'maps': [r3(A[:, :, k]) for k in top], 'raw': r6(raw), 'hot': [int(hr), int(hc)],
               'terms': sorted([[int(k), round(float(A[hr, hc, k]), 4), float('%.4g' % w[k])] for k in range(64)], key=lambda q: -abs(q[1] * q[2])),
               'nPos': int((w > 0).sum()), 'nNeg': int((w < 0).sum()), 'shape': [16, 16, 64]}
# 4c picks (the lab's probe: CNN score, cut at 95% recall)
cutv = float(cut_at(yv, p_cnn)); D = np.where(yv == 1)[0]
caught = sorted([i for i in D if p_cnn[i] >= cutv and int(idv[i]) not in PAINT], key=lambda i: -p_cnn[i])
missed = sorted([i for i in D if p_cnn[i] < cutv], key=lambda i: (-pv[i], p_cnn[i]))
fa = sorted(np.where(yv == 0)[0], key=lambda i: -p_cnn[i])
S4['cut'] = round(cutv, 4); S4['picks'] = []
for tag, i in (('caught defect', caught[0]), ('missed defect', missed[0]), ('false alarm', fa[0])):
    img = xv[i]; base, cov = cover_up(img); cam = grad_cam(img)
    S4['picks'].append({'id': int(idv[i]), 'tag': tag, 'score': round(float(p_cnn[i]), 4), 'y': int(yv[i]), 'prob': float(pv[i]), 'kind': str(kv[i]), 'cam': r6(cam), 'cover': r3(cov)})
    print('pick', tag, int(idv[i]), round(float(p_cnn[i]), 3))
# 4d: deletion check on every real validation defect
K = round(0.1 * 4096); hot_imgs, rand_imgs = [], []
for i in D:
    img = xv[i]; order, _ = hot_order(grad_cam(img))
    hot_imgs.append(gray_out(img, order[:K])); rand_imgs.append(gray_out(img, random_pixels(K, int(i))))
s0 = p_cnn[D]; sh = pred(hot_imgs); sr = pred(rand_imgs); dh = s0 - sh; dr = s0 - sr
S4['del'] = {'K': K, 'n': int(len(D)), 's0': round(float(s0.mean()), 4), 'dropHot': round(float(dh.mean()), 4), 'dropRand': round(float(dr.mean()), 4), 'wins': int((dh > dr).sum()),
             'dh': r3(dh), 'dr': r3(dr), 'ids': [int(idv[i]) for i in D]}
print('deletion', S4['del']['n'], 'hot', S4['del']['dropHot'], 'rand', S4['del']['dropRand'], 'wins', S4['del']['wins'])
# the example cell, punched 2% at a time on both copies (hottest-first list and the seeded random list are both nested)
img = xv[VAL[496]]; order, _ = hot_order(grad_cam(img)); rnd = random_pixels(K, VAL[496]); stages = [82, 164, 246, 328, 410]
S4['punch'] = {'id': 496, 'k': stages, 's0': round(float(pred(img[None])[0]), 4),
               'hot': r4(pred([gray_out(img, order[:k]) for k in stages])), 'rand': r4(pred([gray_out(img, rnd[:k]) for k in stages])),
               'hotPix': [int(v) for v in order[:K]], 'randPix': [int(v) for v in rnd]}
print('punch', S4['punch']['hot'], S4['punch']['rand'])
# 4f: the real mistakes at the 3g gates (blend), with their Grad-CAM maps
F3 = json.load(open(os.path.join(here, 'src/facts.json')))['s3']; bw = F3['bestW']
b = bw * p_cnn + (1 - bw) * svc
dd = np.sort(b[yv == 1]); low = float(dd[int(np.floor(0.05 * len(dd)))])
orderb = np.argsort(-b, kind='stable'); caughtc = np.cumsum(yv[orderb]); okk = np.where(caughtc / np.arange(1, len(b) + 1) >= 0.95)[0]; high = float(b[orderb[okk.max()]])
miss_b = [i for i in np.argsort(b, kind='stable') if yv[i] == 1 and b[i] < low]
fa_b = [i for i in np.argsort(-b, kind='stable') if yv[i] == 0][:6]
S4['gates'] = [round(low, 4), round(high, 4)]
S4['todo'] = []
for kd, lst in (('missed', miss_b), ('fa', fa_b)):
    for i in lst:
        cam = grad_cam(xv[i]); mx = float(cam.max()) or 1
        S4['todo'].append({'id': int(idv[i]), 'kind': kd, 'b': round(float(b[i]), 4), 'prob': float(pv[i]), 'type': str(kv[i]), 'cam': [int(round(99 * v / mx)) for v in cam.ravel()]})
print('todo', [(t['id'], t['kind'], t['b']) for t in S4['todo']])

# ---------------- Step 5 ----------------
S5 = {'rules': {'dark': 20, 'blank': 3, 'flat': 12}, 'faults': [['F1', 2567, 'lens cap left on (no light)', 'too dark'], ['F2', 2187, 'glare: washed out', 'almost blank'], ['F3', 1620, 'fogged lens', 'low contrast']],
      'dead': 1896, 'one': 496, 'recursionLimit': 25}
st = open(os.path.join(root, 'tools/research/step5_photo_stats.txt')).read()
S5['photoStats'] = {k: [float(v) for v in re.search(k + r'\s+min\s+([\d.]+)\s+p1\s+([\d.]+)\s+p50\s+([\d.]+)\s+max\s+([\d.]+)', st).groups()] for k in ('mean brightness', 'spread \\(std\\)', 'contrast \\(p95-p5\\)')}
S5['photoStats'] = dict(zip(['mean', 'spread', 'contrast'], S5['photoStats'].values()))
lg = open(os.path.join(root, 'tools/research/step5_twin_run.log')).read()
S5['recursionMsg'] = re.search(r'(Recursion limit of \d+ reached[^.]*)', lg).group(1)
S5['lgVersion'] = re.search(r'langgraph ([\d.]+)', lg).group(1); S5['lgJs'] = re.search(r'JS run: ([\d.]+)', lg).group(1)
ref = {}
for nm in ('shift1', 'shift2', 'shift3'):
    m = re.search(nm + r" lanes \{'pass': (\d+), 'person': (\d+), 'stop': (\d+)\} \| defects passed (\d+) of (\d+) \| good stopped (\d+) \| poly defects passed (\d+) of (\d+) \| person wrong (\d+)", lg)
    ref[nm] = [int(v) for v in m.groups()]
S5['twin'] = ref
# recompute the three shifts exactly like step5.js (val order; person lane asks the checker; lcg(7) for 9 in 10)
def lcg(seed):
    s = [seed % 233280]
    def r():
        s[0] = (s[0] * 9301 + 49297) % 233280; return s[0] / 233280
    return r
pd_ = np.sort(b[(yv == 1) & (kv == 'poly')]); low_poly = float(pd_[int(np.floor(0.05 * len(pd_)))])
def shift(nine=False, poly=False):
    r = lcg(7); out = {'pass': 0, 'person': 0, 'stop': 0, 'dp': 0, 'gs': 0, 'pdp': 0, 'pw': 0}
    for i in range(len(b)):
        lo = low_poly if (poly and kv[i] == 'poly') else low
        lane = 'pass' if b[i] < lo else 'stop' if b[i] >= high else 'person'; out[lane] += 1; dec = lane
        if lane == 'person':
            a = 'stop' if yv[i] == 1 else 'pass'
            if nine and r() < 0.1: a = 'pass' if a == 'stop' else 'stop'
            dec = a; out['pw'] += (a == 'stop') != (yv[i] == 1)
        if yv[i] == 1 and dec == 'pass': out['dp'] += 1; out['pdp'] += kv[i] == 'poly'
        if yv[i] == 0 and dec == 'stop': out['gs'] += 1
    return [out['pass'], out['person'], out['stop'], out['dp'], int(yv.sum()), out['gs'], int(out['pdp']), int(((yv == 1) & (kv == 'poly')).sum()), int(out['pw'])]
mine = {'shift1': shift(), 'shift2': shift(nine=True), 'shift3': shift(poly=True)}
for k in mine: print(k, mine[k], 'twin', ref[k], 'MATCH' if mine[k] == ref[k] else 'DIFF')
S5['shifts'] = mine; S5['lowPoly'] = round(low_poly, 4)

# ---------------- real 300 px photos of the cells these diagrams show (ELPV images, as the lab's data/full) ----------------
from PIL import Image
ELPV = next((p for p in ['/tmp/elpv/src/elpv_dataset/data/images', '/home/claude/dl/x/elpv_dataset/data/images'] if os.path.isdir(p)), None)
want = PAINT + [p['id'] for p in S4['picks']] + [t['id'] for t in S4['todo']] + [2567, 2187, 1620, 1896]
photos = {}
if ELPV:
    for c in dict.fromkeys(want):
        im = Image.open(os.path.join(ELPV, 'cell%04d.png' % c)).convert('L').resize((240, 240), Image.LANCZOS)
        bio = io.BytesIO(); im.save(bio, 'JPEG', quality=80, optimize=True); photos[str(c)] = base64.b64encode(bio.getvalue()).decode()
    print('photos', len(photos), sum(len(v) for v in photos.values()), 'b64 bytes')
FJ = os.path.join(here, 'src/facts.json')
facts = json.load(open(FJ)); facts['s4'] = S4; facts['s5'] = S5
if photos: facts['photos'] = photos
txt = json.dumps(facts, separators=(',', ':'))
open(FJ, 'w').write(txt)
print('wrote', FJ, os.path.getsize(FJ), 'bytes')
