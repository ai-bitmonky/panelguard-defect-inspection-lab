"""Step 7 twin: the operator console as ONE Gradio app (gr.Blocks), around the Keras model (the Step 3 architecture with the
Keras-trained test-fixture weights) and the Python LangGraph flow of the Step 5 twin, with the score station LIVE from the model.
Same rules as the JavaScript console: word + shape + colour, the safe default (NO VERDICT), big buttons + keys P / S / H,
the reason on demand, one count per cell.

  python -I tools/research/step7_gradio_app.py --smoke   # build the Blocks, call the handlers on real cells, start + stop the server
  python -I tools/research/step7_gradio_app.py           # serve on http://127.0.0.1:7860

Needs: pip install gradio keras tensorflow langgraph crewai (verified: gradio 6.32.0, keras 3.15.1, langgraph 1.2.24, crewai 1.15.44).
Validation tray only; the test tray stays sealed.
"""
import base64, json, os, re, operator, pathlib, socket, sys, time, urllib.request
from importlib.metadata import version
from typing import Annotated, Optional, TypedDict

import numpy as np
import keras
from keras import layers
import gradio as gr
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

ROOT = pathlib.Path(__file__).resolve().parents[2]
rows = json.loads((ROOT / 'site/data/labels.json').read_text())['rows']
ID2I = {r[0]: i for i, r in enumerate(rows)}
X = np.fromfile(ROOT / 'tools/ref/cells64.u8', dtype=np.uint8).reshape(-1, 4096)
B = json.loads((ROOT / 'tools/tests/bridge_fixture.json').read_text())          # Step 2: val ids, labels, SVC scores
S5 = json.loads((ROOT / 'tools/research/step5_inputs.json').read_text())       # Step 3 gates + blend, Step 5 shift
val_ids, y_val, p_svc = B['cell_val'], np.array(B['y_val']), np.array(B['p_val'])
VAL = {c: i for i, c in enumerate(val_ids)}
low, high, low_poly, p_blend = S5['low'], S5['high'], S5['low_poly'], np.array(S5['p_blend'])

# ---------- the Keras model: Step 3 architecture + the fixture weights (same file the browser tests load) ----------
def build_model():
    m = keras.Sequential([keras.Input((64, 64, 1))])
    for f in (16, 32, 64, 128):
        m.add(layers.Conv2D(f, 3, padding='same', use_bias=False)); m.add(layers.BatchNormalization())
        m.add(layers.Activation('relu')); m.add(layers.MaxPooling2D(2))
    m.add(layers.GlobalAveragePooling2D()); m.add(layers.Dropout(0.3)); m.add(layers.Dense(1, activation='sigmoid'))
    F = json.loads((ROOT / 'tools/tests/fixture_cnn.json').read_text())
    f32 = np.frombuffer(base64.b64decode(F['b64']), dtype='<f4'); W, o = [], 0
    for s in F['shapes']:
        n = int(np.prod(s)); W.append(f32[o:o + n].reshape(s)); o += n
    k = 0
    for l in m.layers:
        n = len(l.weights)
        if n: l.set_weights(W[k:k + n]); k += n
    assert k == len(W), 'fixture weights left over'
    return m
model = build_model()
x_val = X[[ID2I[c] for c in val_ids]].reshape(-1, 64, 64, 1).astype('float32') / 255.0
p_cnn = model.predict(x_val, verbose=0).ravel()
# the 3f weight is one of 0.0, 0.1 ... 1.0: recover it from the JS blend scores, then check the blend reproduces them
_mask = np.abs(p_cnn - p_svc) > 1e-3
best_w = float(np.round(np.median((p_blend - p_svc)[_mask] / (p_cnn - p_svc)[_mask]), 1))
BLEND_DIFF = float(np.max(np.abs(best_w * p_cnn + (1 - best_w) * p_svc - p_blend)))

# ---------- the Step 5 flow (stations copied from step5_twin.py), with a LIVE score ----------
class Cell(TypedDict, total=False):
    id: object
    kind: str
    photo: list
    problem: Optional[str]
    tries: int
    p: float
    lane: str
    decision: str
    log: Annotated[list, operator.add]

DARK, BLANK, FLAT, MAX_TRIES = 20, 3, 12, 2
def stats(photo):
    a = np.asarray(photo, dtype=float); s = np.sort(a)
    return a.mean(), a.std(), s[int(np.floor(0.95 * a.size))] - s[int(np.floor(0.05 * a.size))]
def photo_problem(photo):
    mean, spread, contrast = stats(photo)
    return 'too dark' if mean < DARK else 'almost blank' if spread < BLANK else 'low contrast' if contrast < FLAT else None
FAULTS = [('F1', 2567, 'too dark'), ('F2', 2187, 'almost blank'), ('F3', 1620, 'low contrast')]
def spoil(px, rule):
    m, sd, ct = stats(px); px = np.asarray(px, dtype=float)
    x = px * 0.08 if rule == 'too dark' else m + (px - m) * (0.02 if rule == 'almost blank' else 10.5 / ct)
    return [int(v) for v in np.clip(np.floor(x + 0.5), 0, 255)]
FAULT_PHOTO = {f: spoil(X[ID2I[o]], r) for f, o, r in FAULTS}
FAULT_OF = {f: o for f, o, r in FAULTS}
def kind_of(cid): return rows[ID2I[FAULT_OF.get(cid, cid)]][2]
def shoot(cid): return list(FAULT_PHOTO[cid]) if cid in FAULT_PHOTO else [int(v) for v in X[ID2I[cid]]]
def card(cid): return {'id': cid, 'kind': kind_of(cid), 'photo': shoot(cid), 'tries': 1}
def label_of(cid): cid = FAULT_OF.get(cid, cid); return int(y_val[VAL[cid]]) if cid in VAL else None

STATE = {'model': model}                       # the fault drill sets STATE['model'] = None ("model not loaded")
def check_photo(state):
    problem = photo_problem(state['photo'])
    return {'problem': problem, 'log': ['check_photo: ' + (problem or 'photo ok')]}
def live_score(state):                         # the model looks at THIS photo now
    if STATE['model'] is None: raise RuntimeError('model not loaded')
    x = np.asarray(state['photo'], dtype='float32').reshape(1, 64, 64, 1) / 255.0
    cnn = float(STATE['model'](x, training=False).numpy()[0, 0])
    p = best_w * cnn + (1 - best_w) * float(p_svc[VAL[state['id']]])
    return {'p': p, 'log': [f'score (live): {p:.3f}']}
def route_poly(state):
    lo = low_poly if state['kind'] == 'poly' else low
    lane = 'pass' if state['p'] < lo else 'stop' if state['p'] >= high else 'person'
    return {'lane': lane, 'log': ['route: ' + lane]}
console_log = []
def log_row(state):
    decision = state.get('decision') or state.get('lane')
    console_log.append({'id': state['id'], 'kind': state['kind'], 'p': state.get('p'), 'lane': state.get('lane'), 'decision': decision, 'tries': state['tries']})
    return {'decision': decision, 'log': ['record: ' + str(decision)]}
def reshoot(state): return {'photo': shoot(state['id']), 'tries': state['tries'] + 1, 'log': [f"reshoot: photo {state['tries'] + 1}"]}
def after_check(state):
    if not state.get('problem'): return 'score'
    return 'human_check' if state['tries'] >= MAX_TRIES else 'reshoot'
def human_check(state):
    answer = interrupt({'id': state['id'], 'p': state.get('p'), 'problem': state.get('problem')})
    return {'lane': state.get('lane') or 'person', 'decision': answer, 'log': ['human_check: a person said ' + answer]}

g = StateGraph(Cell)
for name, fn in [('check_photo', check_photo), ('reshoot', reshoot), ('score', live_score), ('route', route_poly), ('human_check', human_check), ('record', log_row)]:
    g.add_node(name, fn)
g.add_edge(START, 'check_photo')
g.add_conditional_edges('check_photo', after_check, ['score', 'reshoot', 'human_check'])
g.add_edge('reshoot', 'check_photo'); g.add_edge('score', 'route')
g.add_conditional_edges('route', lambda s: s['lane'], {'pass': 'record', 'person': 'human_check', 'stop': 'record'})
g.add_edge('human_check', 'record'); g.add_edge('record', END)
console_line = g.compile(checkpointer=MemorySaver())

# ---------- 7b: the lamp (word + shape + colour) and the safe default ----------
LAMPS = {'pass': ('PASS', 'circle', '#2ee07a'), 'person': ('CHECK', 'triangle', '#ffb21e'), 'stop': ('STOP', 'square', '#ff5050'), 'none': ('NO VERDICT', 'ring', '#a3afbf')}
SHAPES = {'circle': "<circle cx='50' cy='50' r='44'/>", 'triangle': "<path d='M50 6 L96 92 H4 Z'/>", 'square': "<rect x='8' y='8' width='84' height='84'/>",
          'ring': "<circle cx='50' cy='50' r='40' fill='none' stroke-width='9' stroke-dasharray='14 10'/>"}
def lamp_of(out):
    if out and '__interrupt__' in out: return 'person'            # paused: a person decides
    lane = out.get('lane') if out and 'error' not in out else None
    return lane if lane in ('pass', 'person', 'stop') else 'none'  # unknown, missing or broken -> NO VERDICT
def lamp_html(key):
    word, shape, col = LAMPS[key]
    return (f"<div class='lamp' data-key='{key}' style='color:{col};border-color:{col}'>"
            f"<svg viewBox='0 0 100 100' style='width:5em;height:5em;fill:currentColor;stroke:currentColor'>{SHAPES[shape]}</svg><b>{word}</b></div>")
n_thread = [0]
def decide_cell(c):                            # ONE real decision, timed
    n_thread[0] += 1; config = {'configurable': {'thread_id': f"console-{c['id']}-{n_thread[0]}"}}
    t0 = time.perf_counter()
    try: out = console_line.invoke(c, config)
    except Exception as e: out = {'error': str(e)}                    # a broken flow is a result too
    return {'card': c, 'config': config, 'out': out, 'lamp': lamp_of(out), 'ms': 1000 * (time.perf_counter() - t0)}
def photo_img(photo, cam=None):
    if photo is None or len(photo) != 4096: return np.zeros((256, 256, 3), dtype=np.uint8)
    a = np.asarray(photo, dtype=np.uint8).reshape(64, 64).repeat(4, 0).repeat(4, 1)
    rgb = np.stack([a, a, a], -1).astype(float)
    if cam is not None:
        h = np.clip(np.asarray(cam, dtype=float).reshape(16, 16) / (max(cam) or 1), 0, 1).repeat(16, 0).repeat(16, 1)[..., None] * 0.65
        rgb = rgb * (1 - h) + np.array([255, 110, 0]) * h
    return rgb.astype(np.uint8)

# ---------- 7c / 7d: counters, line runner, queue ----------
def new_session(): return {'counts': {'pass': 0, 'person': 0, 'stop': 0, 'none': 0, 'total': 0, 'byPerson': 0}, 'queue': [], 'answers': [], 'next': 0, 'times': [], 'shown_at': None}
def on_result(S, r):                           # ONCE per arriving cell, under its lamp
    S['counts'][r['lamp']] += 1; S['counts']['total'] += 1; S['times'].append(r['ms'])
    if '__interrupt__' in (r['out'] or {}) or r['lamp'] == 'none': S['queue'].append(r)
def counters_html(S):
    c = S['counts']
    return "<div class='ctrs'>" + ''.join(f"<span data-key='{k}' style='color:{LAMPS[k][2]}'>{LAMPS[k][0]} <b>{c[k]}</b></span>" for k in LAMPS) + f"<span>CELLS <b>{c['total']}</b></span><span>BY PERSON <b>{c['byPerson']}</b></span></div>"
def queue_view(S):
    q = S['queue']
    if not q: return 'QUEUE · no cells waiting', photo_img(None), gr.update(interactive=False), gr.update(interactive=False)
    if S['shown_at'] is None: S['shown_at'] = time.perf_counter()     # the clock starts when the person sees it
    it = q[0]
    return f"QUEUE · {len(q)} waiting · cell {it['card']['id']} ({it['card']['kind']})", photo_img(it['card']['photo']), gr.update(interactive=True), gr.update(interactive=True)
def next_cell(S):                              # the line: one cell from the validation tray (the Timer calls it)
    S = S or new_session()
    r = decide_cell(card(val_ids[S['next'] % len(val_ids)])); S['next'] += 1
    on_result(S, r); o = r['out'] or {}
    meta = f"cell {r['card']['id']} · {r['card']['kind']} · {r['ms']:.0f} ms" + (f" · fault: {o['error']}" if 'error' in o else f" · photo: {o['problem']}" if o.get('problem') else '')
    return (S, photo_img(r['card']['photo']), lamp_html(r['lamp']), meta, counters_html(S)) + queue_view(S)
def answer(S, said):                           # the person's answer resumes the paused flow (same thread id)
    S = S or new_session()
    if not S['queue']: return (S, counters_html(S)) + queue_view(S)                # empty queue: a key press does nothing
    it = S['queue'].pop(0)
    secs = time.perf_counter() - S['shown_at'] if S['shown_at'] else None; S['shown_at'] = None
    if '__interrupt__' in (it['out'] or {}): console_line.invoke(Command(resume=said), it['config'])
    else: console_log.append({'id': it['card']['id'], 'kind': it['card']['kind'], 'p': None, 'lane': 'none', 'decision': said, 'tries': it['card']['tries']})
    S['counts']['byPerson'] += 1                                    # NOT total: the cell was counted when it arrived
    S['answers'].append({'id': it['card']['id'], 'said': said, 'expert': label_of(it['card']['id']), 'seconds': secs})
    return (S, counters_html(S)) + queue_view(S)
def why(S):
    S = S or new_session()
    if not S['queue']: return gr.update(visible=False, value=''), photo_img(None)
    it = S['queue'][0]; o = it['out'] or {}
    if 'error' in o: return gr.update(visible=True, value=f"<b>Fault:</b> {o['error']}. No score."), photo_img(it['card']['photo'])
    if o.get('problem'): return gr.update(visible=True, value=f"<b>Photo problem:</b> {o['problem']}. No score."), photo_img(it['card']['photo'])
    lo = low_poly if it['card']['kind'] == 'poly' else low
    return gr.update(visible=True, value=f"<b>Score {o['p']:.3f}</b> · pass below {lo:.3f} · stop from {high:.3f}"), photo_img(it['card']['photo'], grad_cam(it['card']['photo']))
import tensorflow as tf
_acts = [l for l in model.layers if isinstance(l, layers.Activation)]
_cut = model.layers.index(_acts[2])
def grad_cam(photo):                           # the Step 4 Grad-CAM at block 3 (16 x 16)
    x = tf.constant(np.asarray(photo, dtype='float32').reshape(1, 64, 64, 1) / 255.0)
    with tf.GradientTape() as tape:
        a = x
        for l in model.layers[:_cut + 1]: a = l(a, training=False)
        tape.watch(a); y = a
        for l in model.layers[_cut + 1:]: y = l(y, training=False)
        s = tf.reduce_sum(y)
    gr_ = tape.gradient(s, a); w = tf.reduce_mean(gr_, axis=(0, 1, 2))
    return list(np.maximum(tf.reduce_sum(a * w, -1).numpy()[0].ravel(), 0))

# ---------- 7e: the shift board from the logbook (the Step 5 twin's poly-gate shift) ----------
def shift_board(log, size=50):
    blocks = []
    for i in range(0, len(log), size):
        b = {'pass': 0, 'person': 0, 'stop': 0}
        for row in log[i:i + size]: b[row['lane']] += 1
        blocks.append(b)
    def group(rs):
        d = [r for r in rs if label_of(r['id']) == 1]; e = [r for r in d if r['decision'] == 'pass']
        return {'defects': len(d), 'passed': len(e), 'per100': round(1000 * len(e) / len(d)) / 10 if d else 0}
    return {'cells': len(log), 'blocks': blocks, 'all': group(log), 'target': 5, 'mono': group([r for r in log if r['kind'] == 'mono']), 'poly': group([r for r in log if r['kind'] == 'poly'])}
SHIFT_LOG = json.loads((ROOT / 'tools/research/step6_inputs.json').read_text())['audit_log']   # the JS logbook of the poly-gate shift
def board_html():
    b = shift_board(SHIFT_LOG); w = 300 / len(b['blocks']); C = {'pass': '#2ee07a', 'person': '#ffb21e', 'stop': '#ff5050'}; bars = ''
    for i, x in enumerate(b['blocks']):
        y, n = 120, sum(x.values())
        for k in ('pass', 'person', 'stop'):
            h = 120 * x[k] / n; y -= h; bars += f"<rect x='{i * w + 1:.1f}' y='{y:.1f}' width='{w - 2:.1f}' height='{h:.1f}' fill='{C[k]}'/>"
    met = b['all']['per100'] <= b['target']
    return (f"<div class='board'><div>LANES OVER THE SHIFT<svg viewBox='0 0 300 120'>{bars}</svg>● pass (bottom) ▲ check ■ stop (top)</div>"
            f"<div>DEFECTS PASSED: {b['all']['passed']} of {b['all']['defects']} = {b['all']['per100']} per 100 · target ≤ {b['target']} → <b>{'● TARGET MET' if met else '■ TARGET MISSED'}</b></div>"
            f"<div>MONO {b['mono']['per100']} vs POLY {b['poly']['per100']} per 100</div></div>"), b

# ---------- 7f: one button, one report (the Step 6 CrewAI crew) ----------
_CREW = {}
def load_crew():                               # the Step 6 CrewAI twin's definitions (tools, scripted brain, workers, tasks, checker), not its test run
    if not _CREW:
        path = ROOT / 'tools/research/step6_twin.py'; src = path.read_text()
        ns = {'__file__': str(path), '__name__': 'step6_defs'}; argv = sys.argv; sys.argv = [argv[0]]
        try: exec(compile(src[:src.index('\nOK = []')], str(path), 'exec'), ns)
        finally: sys.argv = argv
        _CREW.update(ns)
    return _CREW
def make_report():                             # one button: the crew (6f guardrail), then check AGAIN, then show or hold
    try: C = load_crew()
    except ImportError as e: return f"<b style='color:#ff5050'>■ REPORT HELD BACK: {e}</b>", ''
    drafts = []
    def guard(output):
        r = C['report_guardrail'](output); drafts.append(r); return r
    w = C['writer']
    sloppy = C['Agent'](role=w.role, goal=w.goal, backstory=w.backstory, tools=w.tools, llm=C['ScriptedLLM'](model='scripted-rules', slips=2))
    t1, t2, t3 = C['tasks'](lambda a, b: [a, b], writer_agent=sloppy, guardrail=guard)
    try: result = C['Crew'](agents=[C['inspector'], C['analyst'], sloppy], tasks=[t1, t2, t3], process=C['Process'].sequential).kickoff()
    except Exception as e: return f"<b style='color:#ff5050'>■ REPORT HELD BACK: {str(e)[:160]}</b>", ''
    check = C['check_report'](result.raw, C['facts']())
    if not check['ok']: return "<b style='color:#ff5050'>■ REPORT HELD BACK: numbers not in the tool results: " + ', '.join(check['wrong']) + '</b>', ''
    removed = [n for ok, msg in drafts if not ok for n in msg.split(': ')[-1].split(', ')]
    return "<b style='color:#2ee07a'>● EVERY NUMBER CHECKED</b>" + (f" · the checker removed {', '.join(removed)} from draft 1" if removed else ''), result.raw

# ---------- the app ----------
CSS = """
body, .gradio-container { background: #0a0e13 !important; color: #e9eff6; }
.lamp { display:flex; flex-direction:column; align-items:center; gap:.2em; border:.3em solid; border-radius:.5em; padding:.5em; background:#0a0f15; }
.lamp b { font-size: 5em; line-height: 1; }
.lamp[data-key=none] { border-style: dashed; }
.ctrs { display:flex; gap:1em; font-size:1.3em; } .ctrs b { color:#fff; }
#pass-btn, #stop-btn { font-size: 1.6em; min-height: 2.6em; }
"""
KEYS_JS = """<script>
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const id = { p: 'pass-btn', s: 'stop-btn', h: 'why-btn' }[e.key.toLowerCase()];
  const b = id && document.querySelector('#' + id); if (b && !b.disabled) { e.preventDefault(); b.click(); }
});
</script>"""

def build():
    with gr.Blocks(title='PanelGuard · operator console') as demo:
        S = gr.State(None)
        counters = gr.HTML(counters_html(new_session()))
        with gr.Row():
            with gr.Column(scale=3):
                with gr.Row():
                    photo = gr.Image(type='numpy', height=300, interactive=False, show_label=False)
                    lamp = gr.HTML(lamp_html('none'))
                meta = gr.Markdown('waiting for the first cell')
            with gr.Column(scale=2):
                qhead = gr.Markdown('QUEUE · no cells waiting')
                qphoto = gr.Image(type='numpy', height=220, interactive=False, show_label=False)
                reason = gr.HTML(visible=False)
                with gr.Row():
                    pass_b = gr.Button('● PASS  [P]', elem_id='pass-btn', interactive=False)
                    stop_b = gr.Button('■ STOP  [S]', elem_id='stop-btn', variant='stop', interactive=False)
                    why_b = gr.Button('WHY?  [H]', elem_id='why-btn')
        with gr.Row():
            start = gr.Button('▶ START LINE', variant='primary'); halt = gr.Button('■ STOP LINE', variant='stop')
            board_b = gr.Button('SHIFT BOARD'); report_b = gr.Button('REPORT')
        board = gr.HTML(); badge = gr.HTML(); paper = gr.Textbox(label='report', lines=8, interactive=False)
        timer = gr.Timer(2.0, active=False)                               # 30 cells per minute
        cell_out = [S, photo, lamp, meta, counters, qhead, qphoto, pass_b, stop_b]
        timer.tick(next_cell, S, cell_out, api_name='next_cell')
        start.click(lambda: gr.Timer(active=True), None, timer, api_visibility='private')
        halt.click(lambda: gr.Timer(active=False), None, timer, api_visibility='private')
        q_out = [S, counters, qhead, qphoto, pass_b, stop_b]
        pass_b.click(lambda s: answer(s, 'pass'), S, q_out, api_name='answer_pass')
        stop_b.click(lambda s: answer(s, 'stop'), S, q_out, api_name='answer_stop')
        why_b.click(why, S, [reason, qphoto], api_name='why')
        board_b.click(lambda: board_html()[0], None, board, api_name='board')
        report_b.click(make_report, None, [badge, paper], api_name='report')
    return demo

def smoke():
    out = {'crewai': version('crewai'), 'gradio': gr.__version__, 'keras': keras.__version__, 'langgraph': version('langgraph'), 'best_w': best_w, 'blend_max_diff_vs_js': BLEND_DIFF}
    demo = build(); out['blocks_built'] = type(demo).__name__ + ' with ' + str(len(demo.fns)) + ' event handlers'
    S = new_session(); lanes = {}
    for _ in range(30):
        r = next_cell(S); S = r[0]
    out['30_cells'] = dict(S['counts']); out['median_ms'] = round(float(np.median(S['times'])), 1)
    out['lamps_add_up'] = sum(S['counts'][k] for k in LAMPS) == S['counts']['total']
    tot = S['counts']['total']; n_q = len(S['queue']); a = answer(S, 'stop'); S = a[0]
    out['answer_resumed'] = {'queue_before': n_q, 'queue_after': len(S['queue']), 'total_before': tot, 'total_after': S['counts']['total'], 'logged': console_log[-1]['decision'] if console_log else None}
    f1 = decide_cell(card('F1')); STATE['model'] = None; nm = decide_cell(card(val_ids[3])); STATE['model'] = model
    fe = decide_cell({'id': 'X9', 'kind': 'mono', 'tries': 1, 'photo': None})
    out['faults'] = {'camera F1': LAMPS[f1['lamp']][0], 'model not loaded': LAMPS[nm['lamp']][0] + ' (' + nm['out'].get('error', '') + ')', 'flow error': LAMPS[fe['lamp']][0]}
    out['odd_answers'] = [LAMPS[lamp_of(x)][0] for x in [None, {}, {'error': 'x'}, {'lane': 'banana'}]]
    e = new_session(); before = json.dumps(e['counts']); answer(e, 'pass'); out['empty_queue_no_change'] = json.dumps(e['counts']) == before
    if S['queue']: w = why(S); out['why'] = w[0]['value'][:80]
    b = board_html()[1]; R = S5['js']['shift3']
    out['board'] = {'passed': b['all']['passed'], 'defects': b['all']['defects'], 'per100': b['all']['per100'], 'matches_js_shift3': b['all']['passed'] == R['all']['defPassed'] and b['all']['defects'] == R['all']['def']}
    rb, rt = make_report(); out['report'] = {'badge': re.sub('<[^>]+>', '', rb), 'lines': len(rt.splitlines()), 'first_line': rt.splitlines()[0] if rt else None}
    with socket.socket() as so: so.bind(('127.0.0.1', 0)); port = so.getsockname()[1]
    t0 = time.time(); demo.launch(server_name='127.0.0.1', server_port=port, prevent_thread_lock=True, quiet=True, css=CSS, head=KEYS_JS)
    html = urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=30).read().decode('utf8', 'replace')
    out['server'] = {'port': port, 'page_ok': 'PanelGuard' in html, 'start_s': round(time.time() - t0, 1)}
    try:
        from gradio_client import Client
        cl = Client(f'http://127.0.0.1:{port}/', verbose=False, download_files=False)
        res = cl.predict(api_name='/next_cell'); out['client_next_cell'] = str(res[3] if isinstance(res, (list, tuple)) and len(res) > 3 else res)[:120]
        out['client_board'] = str(cl.predict(api_name='/board'))[:80]
    except Exception as ex:
        out['client_error'] = type(ex).__name__ + ': ' + str(ex)[:200]
    demo.close(); out['server_closed'] = True
    print(json.dumps(out, indent=1, default=str))
    ok = out['lamps_add_up'] and out['answer_resumed']['total_after'] == out['answer_resumed']['total_before'] and out['faults']['camera F1'] == 'CHECK' \
        and out['faults']['model not loaded'].startswith('NO VERDICT') and out['faults']['flow error'] == 'NO VERDICT' and out['odd_answers'] == ['NO VERDICT'] * 4 \
        and out['empty_queue_no_change'] and out['report']['badge'].startswith('● EVERY NUMBER CHECKED') and out['board']['matches_js_shift3'] and out['server']['page_ok'] and BLEND_DIFF < 1e-3
    print('GRADIO TWIN', 'OK' if ok else 'PROBLEM')
    return ok

if __name__ == '__main__':
    if '--smoke' in sys.argv: sys.exit(0 if smoke() else 1)
    build().launch(server_name='127.0.0.1', server_port=7860, css=CSS, head=KEYS_JS)
