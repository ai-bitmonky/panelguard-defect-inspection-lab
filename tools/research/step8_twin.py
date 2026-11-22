"""Step 8 twin: the same line trial, interval, drift alarms and learning curve in REAL Python
(scikit-learn + Keras 3 + LangGraph + statsmodels), compared with what the browser computed.

Input: tools/research/step8_inputs.json (exported from the browser after 8b-8e ran; written by tools/tests/s8_e2e.mjs).
The Step 3 model is the Keras-trained TEST FIXTURE (tools/tests/fixture_cnn.json), the same weights the browser test loads.
Run:  /home/claude/gr-venv/bin/python -I tools/research/step8_twin.py [inputs.json]      -> prints TWIN MATCHES
"""
import base64, json, operator, pathlib, sys
from typing import Annotated, Optional, TypedDict
import numpy as np
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.base import clone
from sklearn.metrics import roc_auc_score
from statsmodels.stats.proportion import proportion_confint
import keras
from keras import layers
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

ROOT = pathlib.Path(__file__).resolve().parents[2]
IN = json.loads(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'tools/research/step8_inputs.json').read_text())
rows = json.loads((ROOT / 'site/data/labels.json').read_text())['rows']
X = np.fromfile(ROOT / 'tools/ref/cells64.u8', dtype=np.uint8).reshape(-1, 64, 64)
prob = np.array([r[1] for r in rows]); kind = np.array([r[2] for r in rows]); cell_id = np.array([r[0] for r in rows]); y = (prob >= 0.5).astype(int)
fails = []
def same(what, ok, detail=''):
    print(('OK   ' if ok else 'FAIL ') + what + (' · ' + detail if detail else '')); ok or fails.append(what)

# ---------- Step 1 split + Step 2 features and inspector (same code as the course cells 1c, 2a, 2b) ----------
from sklearn.model_selection import train_test_split
idx = np.arange(len(y)); idx_train, idx_rest = train_test_split(idx, test_size=0.4, stratify=y, random_state=42)
idx_val, idx_test = train_test_split(idx_rest, test_size=0.5, stratify=y[idx_rest], random_state=42)
same('split: same test tray as the browser', idx_test.tolist() == IN['idx_test'], f'{len(idx_test)} cells')
Xs = X.astype(np.float32) / 255; Xflat = Xs.reshape(len(Xs), -1)
def line_finder(imgs, box=16, bins=9):
    gx = np.zeros_like(imgs); gy = np.zeros_like(imgs)
    gx[:, :, 1:-1] = imgs[:, :, 2:] - imgs[:, :, :-2]; gy[:, 1:-1, :] = imgs[:, 2:, :] - imgs[:, :-2, :]
    strength = np.hypot(gx, gy); angle = np.minimum((np.arctan2(gy, gx) % np.pi) / np.pi * bins, bins - 1).astype(int)
    n, h, w = imgs.shape; g = h // box
    H = np.stack([np.where(angle == k, strength, 0).reshape(n, g, box, g, box).sum(axis=(2, 4)) for k in range(bins)], axis=-1)
    H /= np.linalg.norm(H, axis=3, keepdims=True) + 1e-3; return H.reshape(n, -1)
def dark_map(imgs):
    n = len(imgs); dark = imgs < imgs.mean(axis=(1, 2), keepdims=True) - 0.15
    return np.hstack([imgs.mean(axis=2), imgs.mean(axis=1), dark.reshape(n, 8, 8, 8, 8).mean(axis=(2, 4)).reshape(n, -1), imgs.std(axis=(1, 2))[:, None]])
small = Xflat.reshape(len(Xflat), 32, 2, 32, 2).mean(axis=(2, 4)).reshape(len(Xflat), -1)
pca = PCA(n_components=40, svd_solver='full', random_state=0).fit(small[idx_train])
F = np.hstack([line_finder(Xs), dark_map(Xs), pca.transform(small)])
best = Pipeline([('scale', StandardScaler()), ('model', SVC(C=3, probability=True, random_state=0))]).fit(F[idx_train], y[idx_train])
p_svc_test = best.predict_proba(F[idx_test])[:, 1]
d = np.abs(p_svc_test - np.array(IN['pSvcTest'])).max()
same('8b Step 2 score of the test cells (Python sklearn vs browser Pyodide)', d < 2e-3, f'max difference {d:.2e}')

# ---------- Step 3 CNN: the fixture weights in Keras ----------
def build_model():
    m = keras.Sequential([keras.Input((64, 64, 1))])
    for f in (16, 32, 64, 128):
        m.add(layers.Conv2D(f, 3, padding='same', use_bias=False)); m.add(layers.BatchNormalization()); m.add(layers.Activation('relu')); m.add(layers.MaxPooling2D(2))
    m.add(layers.GlobalAveragePooling2D()); m.add(layers.Dropout(0.3)); m.add(layers.Dense(1, activation='sigmoid'))
    FX = json.loads((ROOT / 'tools/tests/fixture_cnn.json').read_text()); f32 = np.frombuffer(base64.b64decode(FX['b64']), dtype='<f4'); W, o = [], 0
    for s in FX['shapes']: n = int(np.prod(s)); W.append(f32[o:o + n].reshape(s)); o += n
    k = 0
    for l in m.layers:
        n = len(l.weights)
        if n: l.set_weights(W[k:k + n]); k += n
    return m
model = build_model()
p_cnn_test = model.predict(Xs[idx_test][..., None], verbose=0).ravel()
d = np.abs(p_cnn_test - np.array(IN['pCnnTest'])).max()
same('8b CNN score of the test cells (Keras vs TensorFlow.js)', d < 1e-4, f'max difference {d:.2e}')
best_w, low, high, low_poly = IN['bestW'], IN['low'], IN['high'], IN['lowPoly']
p_test = best_w * np.array(IN['pCnnTest']) + (1 - best_w) * np.array(IN['pSvcTest'])      # the browser's own scores -> lanes must match exactly
same('8b blend', np.abs(p_test - np.array(IN['pTest'])).max() < 1e-12)

# ---------- Step 5 flow in LangGraph with the frozen gates ----------
class Cell(TypedDict, total=False):
    id: object; kind: str; photo: list; problem: Optional[str]; tries: int; p: float; lane: str; decision: str
    log: Annotated[list, operator.add]
DARK, BLANK, FLAT, MAX_TRIES = 20, 3, 12, 2
def stats(photo):
    a = np.asarray(photo, dtype=float); s = np.sort(a); return a.mean(), a.std(), s[int(np.floor(0.95 * a.size))] - s[int(np.floor(0.05 * a.size))]
def check_photo(state):
    m, sd, ct = stats(state['photo']); pr = 'too dark' if m < DARK else 'almost blank' if sd < BLANK else 'low contrast' if ct < FLAT else None
    return {'problem': pr, 'log': ['check_photo: ' + (pr or 'photo ok')]}
def reshoot(state): return {'tries': state['tries'] + 1, 'log': ['reshoot']}
def after_check(state): return 'score' if not state.get('problem') else 'human_check' if state['tries'] >= MAX_TRIES else 'reshoot'
TEST = {int(c): i for i, c in enumerate(cell_id[idx_test])}; LAB = {int(c): int(v) for c, v in zip(cell_id[idx_test], y[idx_test])}
def trial_score(state): p = float(p_test[TEST[state['id']]]); return {'p': p, 'log': [f'score (test): {p:.3f}']}
def route_poly(state):
    lo = low_poly if state['kind'] == 'poly' else low
    lane = 'pass' if state['p'] < lo else 'stop' if state['p'] >= high else 'person'; return {'lane': lane, 'log': ['route: ' + lane]}
def human_check(state):
    a = interrupt({'id': state['id'], 'p': state.get('p')}); return {'lane': state.get('lane') or 'person', 'decision': a, 'log': ['human_check: ' + a]}
trial_log = []
def trial_record(state):
    dec = state.get('decision') or state.get('lane'); trial_log.append({'id': state['id'], 'kind': state['kind'], 'lane': state['lane'], 'decision': dec}); return {'decision': dec, 'log': ['record: ' + dec]}
g = StateGraph(Cell)
for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', trial_score), ('route', route_poly), ('human_check', human_check), ('record', trial_record)]: g.add_node(name, fn)
g.add_edge(START, 'check_photo'); g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])
g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')
g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})
g.add_edge('human_check', 'record'); g.add_edge('record', END)
trial_line = g.compile(checkpointer=MemorySaver())
for c in cell_id[idx_test]:
    c = int(c); config = {'configurable': {'thread_id': f'trial-{c}'}}
    out = trial_line.invoke({'id': c, 'kind': kind[cell_id == c][0], 'photo': X[cell_id == c][0].ravel().tolist(), 'tries': 1}, config)
    while '__interrupt__' in out: out = trial_line.invoke(Command(resume='stop' if LAB[out['__interrupt__'][0].value['id']] else 'pass'), config)
js_lanes = {r[0]: (r[3], r[4]) for r in IN['scores']}
diff = [r['id'] for r in trial_log if js_lanes.get(r['id']) != (r['lane'], r['decision'])]
same('8b every test cell: same lane and decision (Python LangGraph vs LangGraph JS)', not diff and len(trial_log) == len(IN['scores']), f'{len(trial_log)} cells, {len(diff)} differ')
dp = sum(1 for r in trial_log if LAB[r['id']] == 1 and r['decision'] == 'pass'); nd = sum(LAB.values())
same('8b defects passed', (dp, nd) == (IN['trial']['all']['defPassed'], IN['trial']['all']['def']), f'{dp} of {nd} = {100 * dp / nd:.1f} per 100')

# ---------- 8c: Wilson (statsmodels) + bootstrap ----------
lo, hi = proportion_confint(dp, nd, alpha=0.05, method='wilson')
same('8c Wilson interval (statsmodels, z = 1.95996, vs browser, z = 1.96)', abs(100 * lo - IN['interval'][0]) < 0.01 and abs(100 * hi - IN['interval'][1]) < 0.01, f'{100 * lo:.3f} to {100 * hi:.3f} vs {IN["interval"][0]:.3f} to {IN["interval"][1]:.3f} per 100')
z = 1.96; pp = dp / nd; dn = 1 + z * z / nd; mid = (pp + z * z / (2 * nd)) / dn; half = (z / dn) * np.sqrt(pp * (1 - pp) / nd + z * z / (4 * nd * nd))
same('8c Wilson formula with z = 1.96 (exact)', abs(100 * (mid - half) - IN['interval'][0]) < 1e-9 and abs(100 * (mid + half) - IN['interval'][1]) < 1e-9)
s = 1
def rnd():
    global s; s = (s * 16807) % 2147483647; return (s - 1) / 2147483646
rws = [(LAB[r['id']], r['decision'] == 'pass') for r in sorted(trial_log, key=lambda r: [x[0] for x in IN['scores']].index(r['id']))]
boot = []
for b in range(2000):
    dd = ee = 0
    for i in range(len(rws)):
        yy, pp = rws[int(np.floor(rnd() * len(rws)))]
        if yy == 1: dd += 1; ee += pp
    boot.append(100 * ee / dd)
boot.sort(); bi = [boot[int(np.floor(0.025 * 2000))], boot[int(np.floor(0.975 * 2000))]]
same('8c bootstrap interval (same seeded redraws)', all(abs(a - b) < 1e-9 for a, b in zip(bi, IN['bootInterval'])), f'{bi[0]:.2f} to {bi[1]:.2f}')

# ---------- 8d: PSI drift alarms ----------
def looks(photo):
    p = np.asarray(photo, dtype=float).reshape(64, 64); sv = np.sort(p.ravel())
    return {'bright': p.mean(), 'contrast': sv[int(np.floor(0.95 * 4096))] - sv[int(np.floor(0.05 * 4096))], 'sharp': np.abs(np.diff(p, axis=1)).sum() / (64 * 63)}
def psi(ref, now, bins=10):
    r = np.sort(ref); edges = r[[int(np.floor((k + 1) * len(r) / bins)) for k in range(bins - 1)]]
    share = lambda xs: np.maximum(np.bincount(np.searchsorted(edges, xs, side='right'), minlength=bins) / len(xs), 1e-4)
    R, N = share(np.asarray(ref)), share(np.asarray(now)); return float(((N - R) * np.log(N / R)).sum())
ref_ids = IN['cell_val']; ID2I = {int(c): i for i, c in enumerate(cell_id)}
ref_photos = [X[ID2I[c]] for c in ref_ids]; ref_l = [looks(p) for p in ref_photos]; ref_score = np.array(IN['pCnnVal'])
def drift(photos, scores):
    L = [looks(p) for p in photos]; out = {'score': psi(ref_score, scores)}
    for k in ('bright', 'contrast', 'sharp'): out[k] = psi([x[k] for x in ref_l], [x[k] for x in L])
    return out
test_photos = [X[ID2I[c]] for c in IN['cell_test']]
today = drift(test_photos, np.array(IN['pCnnTest']))
same('8d today (test tray) PSI, 4 alarms', all(abs(today[k] - IN['today'][k]) < 6e-5 for k in today), json.dumps({k: round(v, 4) for k, v in today.items()}))
jsr = lambda x: np.floor(np.asarray(x, dtype=float) + 0.5)                                   # JavaScript Math.round
def blur(p):
    q = np.pad(np.asarray(p, dtype=float).reshape(64, 64), 1); n = np.pad(np.ones((64, 64)), 1)
    S = sum(q[1 + a:65 + a, 1 + b:65 + b] for a in (-1, 0, 1) for b in (-1, 0, 1)); N = sum(n[1 + a:65 + a, 1 + b:65 + b] for a in (-1, 0, 1) for b in (-1, 0, 1))
    return jsr(S / N)
s = 11
cells = IN['cell_test'][:260]; P = [X[ID2I[c]].astype(float) for c in cells]
fault = []
for p in P:
    if rnd() < 0.25: m = p.mean(); fault.append(np.clip(jsr(m + (p - m) * 0.25), 0, 255))
    else: fault.append(p)
sims = {'dark': [jsr(0.65 * p) for p in P], 'blur': [blur(blur(p)) for p in P], 'poly': [p for p, c in zip(P, cells) if kind[ID2I[c]] == 'poly'], 'fault': fault}
for k, ph in sims.items():
    sc = model.predict(np.stack(ph).reshape(-1, 64, 64, 1).astype('float32') / 255.0, verbose=0).ravel()
    dd = drift(ph, sc); js = IN['alarms'][k]
    ok = all(abs(dd[a] - js[a]) < max(2e-3, 0.02 * js[a]) for a in dd) and sorted(a for a in dd if dd[a] > 0.25) == sorted(js['ring'])
    same(f'8d simulated "{k}" PSI and which alarms ring', ok, json.dumps({a: round(v, 3) for a, v in dd.items()}))

# ---------- 8e: learning curve ----------
order = np.random.RandomState(0).permutation(idx_train); curve = []
def far95(yt, sc): dd = np.sort(sc[yt == 1]); cut = dd[int(0.05 * len(dd))]; return float((sc[yt == 0] >= cut).mean())
for share in [0.1, 0.25, 0.5, 1.0]:
    part = order[:int(share * len(order))]; m = clone(SVC(C=3, probability=True, random_state=0)); m.set_params(probability=False)
    pipe = Pipeline([('scale', StandardScaler()), ('model', m)]).fit(F[part], y[part]); sc = pipe.decision_function(F[idx_val])
    curve.append((len(part), round(float(roc_auc_score(y[idx_val], sc)), 4), round(far95(y[idx_val], sc), 4)))
jc = [(c['photos'], c['auc'], c['far']) for c in IN['curve']]
same('8e learning curve (photos, ranking score, false alarms)', all(a[0] == b[0] and abs(a[1] - b[1]) < 2e-3 and abs(a[2] - b[2]) < 0.01 for a, b in zip(curve, jc)), str(curve))
print('TWIN MATCHES' if not fails else 'TWIN DIFFERS: ' + ', '.join(fails))
