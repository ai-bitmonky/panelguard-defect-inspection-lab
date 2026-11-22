"""PanelGuard · train.py — Steps 1 to 3 outside the browser.

Loads the ELPV photos, splits them like Step 1 (train / validation / test, by cell), builds the Step 2 features and the
scikit-learn inspector, trains the Step 3 CNN with Keras, finds the blend weight and the gates on VALIDATION ONLY,
and writes everything the line needs: svc.joblib, cnn.keras, settings.json. The test tray is not touched here.

    git clone https://github.com/zae-bayern/elpv-dataset
    pip install -r requirements.txt
    python train.py --elpv elpv-dataset/src/elpv_dataset/data --epochs 30      (--epochs 2 for a quick check)
"""
import argparse, json, pathlib, time
import numpy as np
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
import joblib

HERE = pathlib.Path(__file__).resolve().parent


# ---------- Step 1: photos, labels, the three trays ----------
def load_elpv(folder):
    """ELPV labels.csv: path, expert probability, mono/poly. Photos -> 64 x 64 grey (LANCZOS, as in the course)."""
    folder = pathlib.Path(folder)
    rows = [l.split() for l in (folder / 'labels.csv').read_text().splitlines() if l.strip()]
    X = np.stack([np.asarray(Image.open(folder / p).convert('L').resize((64, 64), Image.LANCZOS)) for p, _, _ in rows])
    prob = np.array([float(r[1]) for r in rows]); kind = np.array([r[2] for r in rows])
    cell_id = np.array([int(pathlib.Path(r[0]).stem.replace('cell', '')) for r in rows])
    return X, prob, kind, cell_id


def split(y):
    idx = np.arange(len(y))
    idx_train, idx_rest = train_test_split(idx, test_size=0.4, stratify=y, random_state=42)
    idx_val, idx_test = train_test_split(idx_rest, test_size=0.5, stratify=y[idx_rest], random_state=42)
    return idx_train, idx_val, idx_test


# ---------- Step 2: features + the scikit-learn inspector ----------
def line_finder(imgs, box=16, bins=9):
    gx = np.zeros_like(imgs); gy = np.zeros_like(imgs)
    gx[:, :, 1:-1] = imgs[:, :, 2:] - imgs[:, :, :-2]
    gy[:, 1:-1, :] = imgs[:, 2:, :] - imgs[:, :-2, :]
    strength = np.hypot(gx, gy)
    angle = np.minimum((np.arctan2(gy, gx) % np.pi) / np.pi * bins, bins - 1).astype(int)
    n, h, w = imgs.shape; g = h // box
    H = np.stack([np.where(angle == k, strength, 0).reshape(n, g, box, g, box).sum(axis=(2, 4)) for k in range(bins)], axis=-1)
    H /= np.linalg.norm(H, axis=3, keepdims=True) + 1e-3
    return H.reshape(n, -1)


def dark_map(imgs):
    n = len(imgs)
    dark = imgs < imgs.mean(axis=(1, 2), keepdims=True) - 0.15
    return np.hstack([imgs.mean(axis=2), imgs.mean(axis=1), dark.reshape(n, 8, 8, 8, 8).mean(axis=(2, 4)).reshape(n, -1), imgs.std(axis=(1, 2))[:, None]])


def small32(imgs):
    return imgs.reshape(len(imgs), 32, 2, 32, 2).mean(axis=(2, 4)).reshape(len(imgs), -1)


def features(imgs, pca):
    """imgs: (n, 64, 64) float 0..1 -> line finder + dark map + pixel summary (the Step 2 mix A + B + C)."""
    return np.hstack([line_finder(imgs), dark_map(imgs), pca.transform(small32(imgs))])


# ---------- Step 3: the CNN ----------
def build_cnn():
    import keras
    from keras import layers
    m = keras.Sequential([keras.Input((64, 64, 1))])
    for f in (16, 32, 64, 128):
        m.add(layers.Conv2D(f, 3, padding='same', use_bias=False)); m.add(layers.BatchNormalization())
        m.add(layers.Activation('relu')); m.add(layers.MaxPooling2D(2))
    m.add(layers.GlobalAveragePooling2D()); m.add(layers.Dropout(0.3)); m.add(layers.Dense(1, activation='sigmoid'))
    return m


def false_alarms_at_95(y, s):
    d = np.sort(s[y == 1]); cut = d[int(0.05 * len(d))]
    return float((s[y == 0] >= cut).mean())


def gates(y, s, share=0.05, pile=0.95):
    """low: at most 5% of defects below it; high: the lowest score where the auto-stop pile is still >= 95% defects."""
    d = np.sort(s[y == 1]); low = float(d[int(share * len(d))])
    order = np.argsort(-s); caught = np.cumsum(y[order]); ok = np.where(caught / np.arange(1, len(s) + 1) >= pile)[0]
    high = float(s[order[ok.max()]]) if len(ok) else float('inf')
    return low, high


def main():
    a = argparse.ArgumentParser(); a.add_argument('--elpv', required=True); a.add_argument('--epochs', type=int, default=30); a.add_argument('--out', default=str(HERE))
    args = a.parse_args(); out = pathlib.Path(args.out); out.mkdir(exist_ok=True)
    t0 = time.time()
    X, prob, kind, cell_id = load_elpv(args.elpv)
    y = (prob >= 0.5).astype(int)
    idx_train, idx_val, idx_test = split(y)
    print(f'photos {X.shape} · train {len(idx_train)} · validation {len(idx_val)} · test {len(idx_test)} (sealed)')
    Xs = X.astype(np.float32) / 255
    pca = PCA(n_components=40, svd_solver='full', random_state=0).fit(small32(Xs)[idx_train])     # learn from TRAIN only
    F = features(Xs, pca)
    svc = Pipeline([('scale', StandardScaler()), ('model', SVC(C=3, probability=True, random_state=0))]).fit(F[idx_train], y[idx_train])
    p_svc = svc.predict_proba(F[idx_val])[:, 1]
    print(f'Step 2 SVC · good cells stopped at 95% recall: {100 * false_alarms_at_95(y[idx_val], p_svc):.1f}%')

    import keras
    cnn = build_cnn()
    n_def = int(y[idx_train].sum()); n_ok = len(idx_train) - n_def
    cw = {0: len(idx_train) / (2 * n_ok), 1: len(idx_train) / (2 * n_def)}
    cnn.compile(optimizer=keras.optimizers.Adam(1e-3), loss='binary_crossentropy', metrics=[keras.metrics.AUC(name='auc')])
    flip = keras.Sequential([keras.layers.RandomFlip('horizontal_and_vertical', seed=0)])
    xt = Xs[idx_train][..., None]; xv = Xs[idx_val][..., None]
    ds = __import__('tensorflow').data.Dataset.from_tensor_slices((xt, y[idx_train])).shuffle(2000, seed=0).batch(32).map(lambda a_, b_: (flip(a_, training=True), b_))
    best = keras.callbacks.ModelCheckpoint(str(out / 'cnn.keras'), monitor='val_auc', mode='max', save_best_only=True)
    cnn.fit(ds, validation_data=(xv, y[idx_val]), epochs=args.epochs, class_weight=cw, callbacks=[best], verbose=2)
    cnn = keras.models.load_model(out / 'cnn.keras')
    p_cnn = cnn.predict(xv, verbose=0).ravel()

    # the blend weight and the gates: chosen on VALIDATION only (Step 3f, 3g, 5g)
    yv = y[idx_val]
    best_w = min((round(w, 1) for w in np.arange(0, 1.01, 0.1)), key=lambda w: false_alarms_at_95(yv, w * p_cnn + (1 - w) * p_svc))
    p_blend = best_w * p_cnn + (1 - best_w) * p_svc
    low, high = gates(yv, p_blend)
    pd = np.sort(p_blend[(yv == 1) & (kind[idx_val] == 'poly')]); low_poly = float(pd[int(0.05 * len(pd))])
    settings = {'best_w': best_w, 'low': low, 'high': high, 'low_poly': low_poly, 'max_tries': 2, 'photo_rules': {'dark': 20, 'blank': 3, 'flat': 12},
                'idx_train': idx_train.tolist(), 'idx_val': idx_val.tolist(), 'idx_test': idx_test.tolist(), 'target_per100': 5}
    (out / 'settings.json').write_text(json.dumps(settings))
    joblib.dump({'svc': svc, 'pca': pca}, out / 'svc.joblib')
    print(f'blend weight {best_w} · gates low {low:.3f} (poly {low_poly:.3f}) high {high:.3f} · saved in {out} · {time.time() - t0:.0f} s')
    print('The test tray is still sealed: run  python flow.py --elpv ... --trial  ONCE, after you are done tuning.')


if __name__ == '__main__':
    main()
