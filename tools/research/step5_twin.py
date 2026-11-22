"""Step 5 twin: the SAME inspection flow in Python LangGraph (StateGraph, TypedDict + Annotated reducer, add_conditional_edges,
MemorySaver, interrupt, Command). Runs on the same scores and gates as the JS run (tools/research/step5_inputs.json, written by
tools/tests/js_cells5.test.mjs or by the browser e2e) and checks that every lane count matches the JavaScript LangGraph run.
Usage: python3 tools/research/step5_twin.py [inputs.json]
"""
import json, operator, pathlib, sys, time
from importlib.metadata import version
from typing import Annotated, Optional, TypedDict

import numpy as np
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from langgraph.errors import GraphRecursionError

ROOT = pathlib.Path(__file__).resolve().parents[2]
INP = json.loads(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'tools/research/step5_inputs.json').read_text())
rows = json.loads((ROOT / 'site/data/labels.json').read_text())['rows']
ID2I = {r[0]: i for i, r in enumerate(rows)}
X = np.fromfile(ROOT / 'tools/ref/cells64.u8', dtype=np.uint8).reshape(-1, 4096)
val_ids, y_val, kind_v = INP['cell_val'], np.array(INP['y_val']), np.array(INP['kind_val'])
p_blend, low, high = np.array(INP['p_blend']), INP['low'], INP['high']
VAL = {c: i for i, c in enumerate(val_ids)}


class Cell(TypedDict, total=False):
    id: object
    kind: str
    photo: list
    problem: Optional[str]
    tries: int
    p: float
    lane: str
    decision: str
    log: Annotated[list, operator.add]          # each station ADDS one line


DARK, BLANK, FLAT = 20, 3, 12
def stats(photo):
    a = np.asarray(photo, dtype=float); s = np.sort(a)
    return a.mean(), a.std(), s[int(np.floor(0.95 * a.size))] - s[int(np.floor(0.05 * a.size))]
def photo_problem(photo):
    mean, spread, contrast = stats(photo)
    if mean < DARK: return 'too dark'
    if spread < BLANK: return 'almost blank'
    if contrast < FLAT: return 'low contrast'
    return None

FAULTS = [('F1', 2567, 'too dark'), ('F2', 2187, 'almost blank'), ('F3', 1620, 'low contrast')]
def spoil(px, rule):
    m, sd, ct = stats(px); px = np.asarray(px, dtype=float)
    if rule == 'too dark': x = px * 0.08
    else: x = m + (px - m) * (0.02 if rule == 'almost blank' else 10.5 / ct)
    return [int(v) for v in np.clip(np.floor(x + 0.5), 0, 255)]          # JS Math.round = floor(x + 0.5)
FAULT_PHOTO = {f: spoil(X[ID2I[o]], r) for f, o, r in FAULTS}
FAULT_OF = {f: o for f, o, r in FAULTS}
def kind_of(cid): return rows[ID2I[FAULT_OF.get(cid, cid)]][2]
def shoot(cid): return list(FAULT_PHOTO[cid]) if cid in FAULT_PHOTO else [int(v) for v in X[ID2I[cid]]]
def card(cid): return {'id': cid, 'kind': kind_of(cid), 'photo': shoot(cid), 'tries': 1}
def label_of(cid): cid = FAULT_OF.get(cid, cid); return int(y_val[VAL[cid]]) if cid in VAL else None

# ---- stations (each returns ONLY what it changes) ----
def check_photo(state: Cell) -> dict:
    problem = photo_problem(state['photo'])
    return {'problem': problem, 'log': ['check_photo: ' + (problem or 'photo ok')]}
def score(state: Cell) -> dict:
    p = float(p_blend[VAL[state['id']]])
    return {'p': p, 'log': [f'score: {p:.3f}']}
def route(state: Cell) -> dict:
    lane = 'pass' if state['p'] < low else 'stop' if state['p'] >= high else 'person'
    return {'lane': lane, 'log': ['route: ' + lane]}
audit_log = []
def record(state: Cell) -> dict:
    decision = state.get('decision') or state.get('lane')
    audit_log.append({'id': state['id'], 'kind': state['kind'], 'p': state.get('p'), 'lane': state.get('lane'), 'decision': decision, 'tries': state['tries']})
    return {'decision': decision, 'log': ['record: ' + str(decision)]}
MAX_TRIES = 2
def reshoot(state: Cell) -> dict:
    return {'photo': shoot(state['id']), 'tries': state['tries'] + 1, 'log': [f"reshoot: photo {state['tries'] + 1}"]}
def after_check(state: Cell) -> str:
    if not state.get('problem'): return 'score'
    if state['tries'] >= MAX_TRIES: return 'human_check'
    return 'reshoot'
def human_check(state: Cell) -> dict:                   # the flow PAUSES here
    answer = interrupt({'id': state['id'], 'p': state.get('p'), 'problem': state.get('problem')})
    return {'lane': state.get('lane') or 'person', 'decision': answer, 'log': ['human_check: a person said ' + answer]}

def build_line(route_station, saver, after=after_check, human=human_check):
    g = StateGraph(Cell)
    for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', score), ('route', route_station), ('human_check', human), ('record', record)]:
        g.add_node(name, fn)
    g.add_edge(START, 'check_photo')
    g.add_conditional_edges('check_photo', after, ['score', 'reshoot', 'human_check'])
    g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')
    g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})
    g.add_edge('human_check', 'record'); g.add_edge('record', END)
    return g.compile(checkpointer=saver)

def group(): return dict(n=0, def_=0, defPassed=0, good=0, goodStopped=0, person=0, personWrong=0)
def shift_report(log):
    R = {'lanes': {'pass': 0, 'person': 0, 'stop': 0}, 'reshoots': 0, 'all': group(), 'mono': group(), 'poly': group()}
    for r in log:
        y = label_of(r['id']); R['lanes'][r['lane']] += 1; R['reshoots'] += max(0, r['tries'] - 1)
        for g in (R['all'], R[r['kind']]):
            g['n'] += 1
            if r['lane'] == 'person':
                g['person'] += 1
                if (r['decision'] == 'stop') != (y == 1): g['personWrong'] += 1
            if y == 1:
                g['def_'] += 1; g['defPassed'] += r['decision'] == 'pass'
            else:
                g['good'] += 1; g['goodStopped'] += r['decision'] == 'stop'
    for k in ('all', 'mono', 'poly'): R[k]['def'] = R[k].pop('def_')
    return R

def run_shift(graph, checker, name):
    audit_log.clear()
    for cid in val_ids:
        config = {'configurable': {'thread_id': f'{name}-{cid}'}}
        out = graph.invoke(card(cid), config)
        while '__interrupt__' in out:
            ask = out['__interrupt__'][0].value
            out = graph.invoke(Command(resume=checker(ask)), config)
    return shift_report(audit_log)

def right_nine_in_ten(base, seed=7):                     # same seeded generator as the JS pg.rightNineInTen
    s = [seed % 233280]
    def ask(a):
        s[0] = (s[0] * 9301 + 49297) % 233280
        ans = base(a)
        return ('pass' if ans == 'stop' else 'stop') if s[0] / 233280 < 0.1 else ans
    return ask
perfect = lambda ask: 'stop' if label_of(ask['id']) == 1 else 'pass'

print('langgraph', version('langgraph'), '| JS run:', INP.get('langgraph_js'), '| source:', INP.get('source'))
ok = True
def same(name, a, b):
    global ok
    good = json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
    ok = ok and good
    print(('MATCH ' if good else 'DIFFER'), name, '' if good else f'\n   py {json.dumps(a, sort_keys=True)}\n   js {json.dumps(b, sort_keys=True)}')

# photo rule on all 2,624 real photos, and on the fault copies
flags = [photo_problem(x) for x in X]
print('real photos flagged:', sum(f is not None for f in flags), [rows[i][0] for i, f in enumerate(flags) if f], '| fault copies:', [photo_problem(FAULT_PHOTO[f]) for f, _, _ in FAULTS])

# 5e: no cap -> recursion limit; cap 2 -> person
def after_nocap(state):
    return 'score' if not state.get('problem') else 'reshoot'
noop_human = lambda s: {'lane': 'person', 'decision': 'waiting', 'log': ['human_check: a person will decide (5f)']}
try:
    build_line(route, None, after_nocap, noop_human).invoke(card('F1'), {'recursion_limit': 25}); print('NO LOOP ERROR (bad)'); ok = False
except GraphRecursionError as e:
    print('no cap -> GraphRecursionError:', str(e).split('\n')[0])
tr = [build_line(route, None, after_check, noop_human).invoke(c) for c in [card(f) for f, _, _ in FAULTS] + [card(1896), card(496)]]
print('cap 2 trails:', [(t['id'], t['tries'], t['decision']) for t in tr])

# 5f: pause and resume one thread
m = MemorySaver(); ln = build_line(route, m); cfg = {'configurable': {'thread_id': 'cell-test'}}
pid = next(c for i, c in enumerate(val_ids) if low <= p_blend[i] < high)
o = ln.invoke(card(pid), cfg); paused = ln.get_state(cfg).next
o2 = ln.invoke(Command(resume='stop'), cfg)
print('pause/resume:', '__interrupt__' in o, paused, '->', o2['decision'], ln.get_state(cfg).next)

t0 = time.time()
shift_line = build_line(route, MemorySaver())
s1 = run_shift(shift_line, perfect, 'shift1')
s2 = run_shift(shift_line, right_nine_in_ten(perfect, 7), 'shift2')
poly_def = np.sort(p_blend[(y_val == 1) & (kind_v == 'poly')])
low_poly = float(poly_def[int(np.floor(0.05 * len(poly_def)))])
def route_poly(state):
    lo = low_poly if state['kind'] == 'poly' else low
    lane = 'pass' if state['p'] < lo else 'stop' if state['p'] >= high else 'person'
    return {'lane': lane, 'log': ['route: ' + lane]}
s3 = run_shift(build_line(route_poly, MemorySaver()), perfect, 'shift3')
print(f'3 shifts x {len(val_ids)} cells in {time.time() - t0:.1f} s')
same('low_poly', round(low_poly, 12), round(INP['low_poly'], 12))
for nm, a in [('shift1', s1), ('shift2', s2), ('shift3', s3)]:
    same(nm, a, INP['js'][nm])
    print('  ', nm, 'lanes', a['lanes'], '| defects passed', a['all']['defPassed'], 'of', a['all']['def'], '| good stopped', a['all']['goodStopped'], '| poly defects passed', a['poly']['defPassed'], 'of', a['poly']['def'], '| person wrong', a['all']['personWrong'])
print('TWIN', 'MATCHES' if ok else 'DIFFERS')
sys.exit(0 if ok else 1)
