"""PanelGuard · flow.py — Steps 5 and 8: the inspection flow in LangGraph, the ONE line trial, its interval, drift alarms.

    python flow.py --elpv <folder with labels.csv>            # a validation shift (safe to run any time)
    python flow.py --elpv <folder> --trial                    # the sealed test tray, ONCE (writes trial.json)
The trial refuses to run a second time: a second look at the same test cells is not an honest test any more.
"""
import argparse, json, operator, pathlib
from typing import Annotated, Optional, TypedDict
import numpy as np
import joblib
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from train import load_elpv, features

HERE = pathlib.Path(__file__).resolve().parent


class Cell(TypedDict, total=False):
    id: int
    kind: str
    photo: list
    problem: Optional[str]
    tries: int
    p: float
    lane: str
    decision: str
    log: Annotated[list, operator.add]          # each station ADDS one line


def photo_stats(photo):
    a = np.asarray(photo, dtype=float); s = np.sort(a)
    return a.mean(), a.std(), s[int(0.95 * a.size)] - s[int(0.05 * a.size)]


def make_line(S, score_of, log):
    """The Step 5 line with frozen settings S; score_of(cell_id) gives the blend score; rows go into log."""
    dark, blank, flat = S['photo_rules']['dark'], S['photo_rules']['blank'], S['photo_rules']['flat']

    def check_photo(state):
        m, sd, ct = photo_stats(state['photo'])
        problem = 'too dark' if m < dark else 'almost blank' if sd < blank else 'low contrast' if ct < flat else None
        return {'problem': problem, 'log': ['check_photo: ' + (problem or 'photo ok')]}

    def reshoot(state):                          # one photo per cell here: a reshoot gives the same photo back
        return {'tries': state['tries'] + 1, 'log': [f"reshoot: photo {state['tries'] + 1}"]}

    def after_check(state):
        if not state.get('problem'): return 'score'
        return 'human_check' if state['tries'] >= S['max_tries'] else 'reshoot'

    def score(state):
        p = float(score_of(state['id']))
        return {'p': p, 'log': [f'score: {p:.3f}']}

    def route_poly(state):                       # the frozen gates, with the poly gate
        lo = S['low_poly'] if state['kind'] == 'poly' else S['low']
        lane = 'pass' if state['p'] < lo else 'stop' if state['p'] >= S['high'] else 'person'
        return {'lane': lane, 'log': ['route: ' + lane]}

    def human_check(state):                      # the flow PAUSES here until a person answers
        answer = interrupt({'id': state['id'], 'p': state.get('p'), 'problem': state.get('problem')})
        return {'lane': state.get('lane') or 'person', 'decision': answer, 'log': ['human_check: a person said ' + answer]}

    def record(state):
        decision = state.get('decision') or state.get('lane')
        log.append({'id': int(state['id']), 'kind': state['kind'], 'p': state.get('p'), 'lane': state.get('lane'), 'decision': decision, 'tries': state['tries']})
        return {'decision': decision, 'log': ['record: ' + str(decision)]}

    g = StateGraph(Cell)
    for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', score), ('route', route_poly), ('human_check', human_check), ('record', record)]:
        g.add_node(name, fn)
    g.add_edge(START, 'check_photo')
    g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])
    g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')
    g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})
    g.add_edge('human_check', 'record'); g.add_edge('record', END)
    return g.compile(checkpointer=MemorySaver())


def run_shift(line, cells, checker, name):
    for c in cells:
        config = {'configurable': {'thread_id': f"{name}-{c['id']}"}}
        out = line.invoke(c, config)
        while '__interrupt__' in out:
            out = line.invoke(Command(resume=checker(out['__interrupt__'][0].value)), config)


def report(log, label):
    R = {'n': len(log), 'lanes': {'pass': 0, 'person': 0, 'stop': 0}}
    for k in ('all', 'mono', 'poly'): R[k] = {'defects': 0, 'passed': 0, 'good': 0, 'good_stopped': 0}
    for r in log:
        R['lanes'][r['lane']] += 1; y = label[r['id']]
        for g in (R['all'], R[r['kind']]):
            if y: g['defects'] += 1; g['passed'] += r['decision'] == 'pass'
            else: g['good'] += 1; g['good_stopped'] += r['decision'] == 'stop'
    for k in ('all', 'mono', 'poly'): R[k]['per100'] = 100 * R[k]['passed'] / max(1, R[k]['defects'])
    return R


def wilson(k, n, z=1.96):                        # the 95% interval of 8c (same as statsmodels method='wilson')
    p = k / n; d = 1 + z * z / n; mid = (p + z * z / (2 * n)) / d; half = (z / d) * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return 100 * max(0.0, mid - half), 100 * min(1.0, mid + half)


def looks(photo):                                # 8d: what a photo looks like, no label needed
    p = np.asarray(photo, dtype=float).reshape(64, 64)
    m, sd, ct = photo_stats(p.ravel())
    return {'bright': m, 'contrast': ct, 'sharp': np.abs(np.diff(p, axis=1)).mean()}


def psi(ref, now, bins=10):                      # 8d: population stability index
    r = np.sort(ref); edges = r[[int((k + 1) * len(r) / bins) for k in range(bins - 1)]]
    share = lambda xs: np.maximum(np.bincount(np.searchsorted(edges, xs, side='right'), minlength=bins) / len(xs), 1e-4)
    R, N = share(np.asarray(ref)), share(np.asarray(now))
    return float(((N - R) * np.log(N / R)).sum())


def main():
    a = argparse.ArgumentParser(); a.add_argument('--elpv', required=True); a.add_argument('--trial', action='store_true'); a.add_argument('--dir', default=str(HERE))
    args = a.parse_args(); D = pathlib.Path(args.dir)
    S = json.loads((D / 'settings.json').read_text()); M = joblib.load(D / 'svc.joblib')
    import keras
    cnn = keras.models.load_model(D / 'cnn.keras')
    X, prob, kind, cell_id = load_elpv(args.elpv); y = (prob >= 0.5).astype(int)
    tray = np.array(S['idx_test'] if args.trial else S['idx_val'])
    if args.trial and (D / 'trial.json').exists():
        raise SystemExit('The test tray was already opened (trial.json exists). A second run is not an honest test any more: report the first result.')
    Xs = X[tray].astype(np.float32) / 255
    p = S['best_w'] * cnn.predict(Xs[..., None], verbose=0).ravel() + (1 - S['best_w']) * M['svc'].predict_proba(features(Xs, M['pca']))[:, 1]
    at = {int(c): i for i, c in enumerate(cell_id[tray])}; label = {int(c): int(v) for c, v in zip(cell_id[tray], y[tray])}
    log = []
    line = make_line(S, lambda cid: p[at[cid]], log)
    cells = [{'id': int(cell_id[i]), 'kind': str(kind[i]), 'photo': X[i].ravel().tolist(), 'tries': 1} for i in tray]
    run_shift(line, cells, lambda ask: 'stop' if label[ask['id']] else 'pass', 'trial' if args.trial else 'val')   # perfect checker (an assumption)
    R = report(log, label); k, n = R['all']['passed'], R['all']['defects']; lo, hi = wilson(k, n)
    name = 'TEST TRAY (sealed, once)' if args.trial else 'validation (gates tuned here: a little hopeful)'
    print(f"{name}: {k} of {n} defects passed = {R['all']['per100']:.1f} per 100 · 95% interval {lo:.1f} to {hi:.1f} · target at most {S['target_per100']}")
    print(f"lanes per 1,000: pass {1000 * R['lanes']['pass'] / R['n']:.0f} · person {1000 * R['lanes']['person'] / R['n']:.0f} · stop {1000 * R['lanes']['stop'] / R['n']:.0f} · mono {R['mono']['per100']:.1f} vs poly {R['poly']['per100']:.1f} per 100")
    if args.trial:
        ref = np.array(S['idx_val']); rl = [looks(X[i]) for i in ref]; tl = [looks(X[i]) for i in tray]
        drift = {k2: psi([x[k2] for x in rl], [x[k2] for x in tl]) for k2 in ('bright', 'contrast', 'sharp')}
        (D / 'trial.json').write_text(json.dumps({'report': R, 'interval': [lo, hi], 'drift_psi': drift, 'log': log}))
        print('drift PSI vs validation (act above 0.25, a rule of thumb):', {k2: round(v, 3) for k2, v in drift.items()})
        print('Wrote trial.json. Do NOT re-tune on these results; change things on train/validation and test on NEW sealed cells.')


if __name__ == '__main__':
    main()
