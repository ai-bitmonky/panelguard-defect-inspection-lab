"""Facts for the Step 2-3 diagrams, computed with the lab's own code (steps.js 2a-2e, step3.js 3a-3g; the same pipeline as
tools/research/prep.py and the Keras twin tools/research/step3_twin.py). Merges keys s2 / s3 into tools/guide/src/facts.json.
CNN numbers come from the reference run: the Step 3 network trained in Keras by step3_twin.py (seed 0, 30 epochs), whose
weights are the test fixture tools/tests/fixture_cnn.json. Run: python3 -I tools/guide/facts23.py  (numpy, scikit-learn, keras)"""
import json, os, re, time, base64
import numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_recall_curve, roc_auc_score

here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(os.path.dirname(here))
rows = json.load(open(os.path.join(root, 'site/data/labels.json')))['rows']
cid = np.array([r[0] for r in rows]); prob = np.array([r[1] for r in rows]); kind = np.array([r[2] for r in rows])
X = np.fromfile(os.path.join(root, 'tools/ref/cells64.u8'), dtype=np.uint8).reshape(2624, 64, 64)
y = (prob >= 0.5).astype(int); idx = np.arange(len(y))
itr, ir = train_test_split(idx, test_size=0.4, stratify=y, random_state=42)
iva, ite = train_test_split(ir, test_size=0.5, stratify=y[ir], random_state=42)
Xs = X.astype(np.float32) / 255; Xflat = Xs.reshape(len(Xs), -1)


def line_finder(imgs, box=16, bins=9):
    gx = np.zeros_like(imgs); gy = np.zeros_like(imgs)
    gx[:, :, 1:-1] = imgs[:, :, 2:] - imgs[:, :, :-2]; gy[:, 1:-1, :] = imgs[:, 2:, :] - imgs[:, :-2, :]
    strength = np.hypot(gx, gy); angle = np.minimum((np.arctan2(gy, gx) % np.pi) / np.pi * bins, bins - 1).astype(int)
    n, h, w = imgs.shape; g = h // box
    H = np.stack([np.where(angle == k, strength, 0).reshape(n, g, box, g, box).sum(axis=(2, 4)) for k in range(bins)], axis=-1)
    H /= np.linalg.norm(H, axis=3, keepdims=True) + 1e-3
    return H.reshape(n, -1)


def dark_map(imgs):
    n = len(imgs); rws = imgs.mean(axis=2); cols = imgs.mean(axis=1)
    dark = imgs < imgs.mean(axis=(1, 2), keepdims=True) - 0.15
    patches = dark.reshape(n, 8, 8, 8, 8).mean(axis=(2, 4)).reshape(n, -1); spread = imgs.std(axis=(1, 2))[:, None]
    return np.hstack([rws, cols, patches, spread])


small = Xflat.reshape(len(Xflat), 32, 2, 32, 2).mean(axis=(2, 4)).reshape(len(Xflat), -1)
pca = PCA(n_components=40, svd_solver='full', random_state=0).fit(small[itr])
A = line_finder(Xs); B = dark_map(Xs); Cc = pca.transform(small); F = np.hstack([A, B, Cc])
S2 = {}
S2['dims'] = {'A': A.shape[1], 'B': B.shape[1], 'C': Cc.shape[1], 'F': F.shape[1]}
S2['pcaVar'] = round(float(pca.explained_variance_ratio_.sum()), 3)
S2['nTrain'] = int(len(itr)); S2['nVal'] = int(len(iva)); S2['defTrain'] = int(y[itr].sum())
# one cracked and one good cell (both mono) on the same features
CR, OK = 6, 447
ci, oi = int(np.where(cid == CR)[0][0]), int(np.where(cid == OK)[0][0])
H4 = A.reshape(-1, 4, 4, 9)
# the 16 x 16 box the crack of cell 6 runs through (rows 0-15, columns 16-31; the same crack zone as the lab's 3b masks)
br, bc = 0, 1
S2['cells'] = {'crack': CR, 'good': OK, 'box': [int(br), int(bc)]}
for nm, k in (('crack', ci), ('good', oi)):
    S2[nm] = {'dirs': [round(float(v), 3) for v in H4[k, br, bc]],
              'patch': [round(float(v), 3) for v in B[k, 128:192]], 'spread': round(float(B[k, 192]), 3),
              'rows': [round(float(v), 3) for v in B[k, 0:64]],
              'pca': [round(float(v), 2) for v in Cc[k, :6]], 'mean': round(float(Xs[k].mean()), 3),
              'darkMax': round(float(B[k, 128:192].max()), 3)}
# quick mix scores (2a chips): 3-fold SVC ROC AUC on train only
def quick(M):
    pipe = make_pipeline(StandardScaler(), SVC(C=3))
    s = cross_val_score(pipe, M[itr], y[itr], scoring='roc_auc', cv=StratifiedKFold(3, shuffle=True, random_state=0))
    return round(float(s.mean()), 3)
BL = {'A': A, 'B': B, 'C': Cc, 'R': Xflat}
mix = []
for keys in (['A'], ['B'], ['C'], ['A', 'B'], ['A', 'B', 'C'], ['R']):
    t = time.time(); M = np.hstack([BL[k] for k in keys]); mix.append({'keys': keys, 'auc': quick(M), 'dims': int(M.shape[1]), 'sec': round(time.time() - t, 1)})
    print('mix', mix[-1])
S2['mix'] = mix
# 2b: three models, 5 folds on the train tray (exactly the 2b code)
models = {'Logistic regression': LogisticRegression(C=0.1, max_iter=2000),
          'Random forest': RandomForestClassifier(n_estimators=100, random_state=0),
          'SVC (RBF)': SVC(C=3, probability=True, random_state=0)}
folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
fold_sizes = [int(len(te)) for _, te in folds.split(F[itr], y[itr])]
S2['foldSizes'] = fold_sizes
S2['models'] = []
for name, m in models.items():
    t = time.time(); s = cross_val_score(Pipeline([('scale', StandardScaler()), ('model', m)]), F[itr], y[itr], cv=folds, scoring='roc_auc')
    S2['models'].append({'name': name, 'folds': [round(float(v), 3) for v in s], 'mean': round(float(s.mean()), 3), 'sd': round(float(s.std()), 3), 'sec': round(time.time() - t, 1)})
    print(S2['models'][-1])
best_name = max(S2['models'], key=lambda d: d['mean'])['name']; S2['best'] = best_name
best = Pipeline([('scale', StandardScaler()), ('model', models[best_name])]).fit(F[itr], y[itr])
p_val = best.predict_proba(F[iva])[:, 1]
ref = np.load(os.path.join(root, 'tools/research/svc_val.npy'))
print('p_val matches tools/research/svc_val.npy:', np.allclose(p_val, ref, atol=1e-6))
y_val = y[iva]
pr, rc, th = precision_recall_curve(y_val, p_val); cut = float(th[rc[:-1] >= 0.95].max())
S2['auc'] = round(float(roc_auc_score(y_val, p_val)), 3); S2['cut'] = round(cut, 4)
print('2d cut', cut, 'auc', S2['auc'])

# ---------------- Step 3: the reference CNN (fixture weights) ----------------
import keras
from keras import layers
fx = json.load(open(os.path.join(root, 'tools/tests/fixture_cnn.json')))
model = keras.Sequential(); model.add(keras.Input(shape=(64, 64, 1)))
for f in [16, 32, 64, 128]:
    model.add(layers.Conv2D(f, 3, padding='same', use_bias=False)); model.add(layers.BatchNormalization()); model.add(layers.Activation('relu')); model.add(layers.MaxPooling2D(2))
model.add(layers.GlobalAveragePooling2D()); model.add(layers.Dropout(0.3)); model.add(layers.Dense(1, activation='sigmoid'))
flat = np.frombuffer(base64.b64decode(fx['b64']), dtype=np.float32); ws = []; o = 0
for shp in fx['shapes']:
    k = int(np.prod(shp)); ws.append(flat[o:o + k].reshape(shp)); o += k
model.set_weights(ws)
X4 = Xs.reshape(-1, 64, 64, 1)
p_cnn = model.predict(X4[iva], batch_size=128, verbose=0).ravel()
print('fixture check', np.round(p_cnn[:5], 4), fx['p_val_check'][:5])
S3 = {}
S3['layers'] = [{'cls': l.__class__.__name__, 'out': [None if v is None else int(v) for v in l.output.shape], 'params': int(l.count_params())} for l in model.layers]
S3['total'] = int(model.count_params())
# feature-map thumbnails of the cracked cell after each block (the channel that answers most), 0..255
sub = keras.Model(model.inputs, [model.layers[i].output for i in (3, 7, 11, 15)])
maps = sub.predict(X4[ci:ci + 1], verbose=0); thumbs = []
for m in maps:
    m = m[0]; ch = np.argsort(-m.reshape(-1, m.shape[-1]).mean(axis=0))[:3]; tt = []
    for c_ in ch:
        a = m[:, :, c_]; a = (a - a.min()) / (a.max() - a.min() + 1e-9) * 255; tt.append({'ch': int(c_), 'size': int(a.shape[0]), 'v': [int(v) for v in a.round().astype(int).ravel()]})
    thumbs.append(tt)
S3['thumbs'] = thumbs
# training history of the reference run (step3_twin_run.log, seed 0)
logt = open(os.path.join(root, 'tools/research/step3_twin_run.log')).read()
S3['hist'] = [[int(e), float(l), float(a)] for e, l, a in re.findall(r'epoch\s+(\d+)\s+train loss ([\d.]+)\s+validation ranking score ([\d.]+)', logt)]
S3['bestEpoch'] = fx['best_epoch']; S3['bestAuc'] = round(fx['best_auc'], 3)


def cut_at(yv, s, r=0.95):
    d = np.sort(s[yv == 1])[::-1]; k = int(np.ceil(r * len(d) - 1e-9)); return d[max(0, k - 1)]


def far(yv, s):
    c = cut_at(yv, s); st = s >= c; return float((st & (yv == 0)).sum() / (yv == 0).sum())
wts = []
for k in range(11):
    w = k / 10; wts.append([w, round(far(y_val, w * p_cnn + (1 - w) * p_val), 4)])
bw = min(wts, key=lambda q: q[1])[0]
for q in wts:
    if q[1] < 1 and q[1] == min(z[1] for z in wts): bw = q[0]; break
S3['ws'] = wts; S3['bestW'] = bw
print('blend weights', wts, 'best', bw)
S3['val'] = {'id': [int(v) for v in cid[iva]], 'y': [int(v) for v in y_val], 'svc': [round(float(v), 4) for v in p_val],
             'cnn': [round(float(v), 4) for v in p_cnn], 'prob': [float(v) for v in prob[iva]], 'kind': [str(v)[0] for v in kind[iva]]}
S3['nTrain'] = int(len(itr)); S3['defTrain'] = int(y[itr].sum())
FJ = os.path.join(here, 'src/facts.json')
facts = json.load(open(FJ)); facts['s2'] = S2; facts['s3'] = S3
json.dump(facts, open(FJ, 'w'), separators=(',', ':'))
print('wrote', FJ, os.path.getsize(FJ), 'bytes')
