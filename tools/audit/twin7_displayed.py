"""AUDIT: the Step 7 Gradio twins as displayed. They are excerpts (they contain `...` and use helpers from the app), so they
cannot run alone. Test 1: load the verified app's helpers (tools/research/step7_gradio_app.py, not its __main__), then define
the DISPLAYED functions on top and drive them like the JS cells (30 cells, queue answers, 4 faults, board, report).
Test 2: the displayed gradio wiring lines (Timer / tick / click outputs) in a tiny real gr.Blocks served on 127.0.0.1."""
import ast, json, pathlib, sys, io, contextlib, linecache, traceback, time
HERE = pathlib.Path(__file__).resolve().parent; RES = HERE.parent / 'research'
T = json.load(open(HERE / 'twins.json'))
APP = RES / 'step7_gradio_app.py'
NS = {'__name__': 'app', '__file__': str(APP)}; sys.argv = ['x']
with contextlib.redirect_stdout(io.StringIO()): exec(compile(APP.read_text(), str(APP), 'exec'), NS)
ok = True; undefined = set()
def displayed_defs(cid):
    src = T[cid]['twin']; tree = ast.parse(src); out = []
    for n in tree.body:
        if isinstance(n, (ast.FunctionDef, ast.Import, ast.ImportFrom)) or (isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name) and n.targets[0].id in ('LAMPS', 'KEYS_JS')):
            seg = ast.get_source_segment(src, n)
            if '...' in seg.split('#')[0] and isinstance(n, ast.FunctionDef): print('  skip', cid, n.name, '(body abbreviated with ...)'); continue
            out.append((getattr(n, 'name', None) or type(n).__name__, seg))
    return out
C = NS['load_crew']()
for k in ['Agent', 'Crew', 'Task', 'Process', 'report_guardrail', 'check_report', 'facts', 'shift_stats', 'slice_table', 'worst_cases', 'action_list', 'ScriptedLLM', 'brain']: NS[k] = C[k]
for cid6, nm in [('6c', 'hire'), ('6d', 'jobs')]:
    src6 = T[cid6]['twin']; t6 = ast.parse(src6)
    for n in t6.body:
        if isinstance(n, ast.FunctionDef) and n.name == nm: exec(compile(ast.get_source_segment(src6, n), 'twin' + cid6, 'exec'), NS)
for cid in ['7b', '7c', '7d', '7e', '7f', '7g']:
    for name, seg in displayed_defs(cid):
        fn = f'/tmp/tw7_{cid}_{name}.py'; open(fn, 'w').write(seg); linecache.checkcache(fn)
        exec(compile(seg, fn, 'exec'), NS)
    print('defined from', cid, [n for n, _ in displayed_defs(cid)])
import os
if os.environ.get('SUPPLY') == '1':
    exec("def next_no():\n    n_thread[0] += 1; return n_thread[0]\n", NS)
    NS['report_crew'] = None
    print('SUPPLIED next_no() (and nothing else)')
def tryit(what, f):
    global ok
    try: r = f(); print('OK   ', what, '->', str(r)[:300]); return r
    except NameError as e: ok = False; undefined.add(str(e)); print('ERROR', what, 'NameError', e)
    except Exception as e: ok = False; print('ERROR', what, type(e).__name__, str(e)[:300])
# 30 cells through the displayed next_cell / on_result / decide_cell
S = None
def thirty():
    global S
    for _ in range(30): S = NS['next_cell'](S)[0]
    c = S['counts']; return dict(c), 'lamps add up' if sum(c[k] for k in ('pass', 'person', 'stop', 'none')) == c['total'] else 'DO NOT ADD UP', 'queue', len(S['queue'])
tryit('7c 30 cells (displayed next_cell)', thirty)
tryit('7b faults: F1 camera', lambda: NS['decide_cell'](NS['card']('F1'))['lamp'])
def model_none():
    NS['STATE']['model'] = None
    try: return NS['decide_cell'](NS['card'](NS['val_ids'][3]))['lamp']
    finally: NS['STATE']['model'] = NS['model']
tryit('7b fault: model not loaded', model_none)
tryit('7b fault: flow error', lambda: NS['decide_cell']({'id': 'X9', 'kind': 'mono', 'tries': 1, 'photo': None})['lamp'])
tryit('7b odd answers', lambda: [NS['lamp_of'](x) for x in [None, {}, {'error': 'x'}, {'lane': 'banana'}]])
def queue_answer():
    s = NS['new_session']()
    for k in range(40):
        r = NS['decide_cell'](NS['card'](NS['val_ids'][k])); NS['on_result'](s, r)
        if '__interrupt__' in (r['out'] or {}): s['queue'].append(r)       # the JS toQueue (7d) — not in the displayed text
    q, tot = len(s['queue']), s['counts']['total']; s['shown_at'] = time.perf_counter()
    s2 = NS['answer'](s, 'stop'); return {'returns': type(s2).__name__ + str(len(s2) if isinstance(s2, tuple) else ''), 'queue': [q, len(s['queue'])], 'total_same': s['counts']['total'] == tot, 'byPerson': s['counts']['byPerson']}
tryit('7d answer() on a queued cell', queue_answer)
tryit('7d answer() on an empty queue', lambda: (lambda r: (len(r), r[0]['counts']))(NS['answer'](NS['new_session'](), 'pass')))
def board():
    b = NS['shift_board'](NS['SHIFT_LOG']); return b['all'], b['mono'], b['poly'], len(b['blocks'])
tryit('7e shift_board on the JS poly-gate logbook', board)
tryit('7f make_report (displayed)', lambda: NS['make_report']())
print('undefined names used by the displayed text:', sorted(undefined))
# ---- Test 2: the displayed gradio wiring ----
import gradio as gr, socket
from gradio_client import Client
def wiring():
    calls = []
    def nc(s): s = (s or 0) + 1; calls.append(s); return s, 'p', 'l', 'c'
    def ans(s, said): return (s, 'c', 'q', None, gr.update(), gr.update())   # displayed answer() now returns 6 values
    with gr.Blocks() as demo:
        S = gr.State(None); photo, lamp, counters = gr.HTML(), gr.HTML(), gr.HTML()
        start, halt = gr.Button('START'), gr.Button('STOP LINE')
        timer = gr.Timer(2.0, active=False)
        timer.tick(nc, S, [S, photo, lamp, counters], api_name='next_cell')
        start.click(lambda: gr.Timer(active=True), None, timer)
        halt.click(lambda: gr.Timer(active=False), None, timer)
        q_out = [S, counters, gr.HTML(), gr.Image(), gr.Button(), gr.Button()]      # the app's q_out (6 outputs)
        pass_b = gr.Button('● PASS  [P]', elem_id='pass-btn')
        pass_b.click(lambda s: ans(s, 'pass'), S, q_out, api_name='answer_pass')
    with socket.socket() as so: so.bind(('127.0.0.1', 0)); port = so.getsockname()[1]
    demo.launch(server_name='127.0.0.1', server_port=port, prevent_thread_lock=True, quiet=True)
    cl = Client(f'http://127.0.0.1:{port}/', verbose=False)
    r1 = cl.predict(api_name='/next_cell')
    try: r2 = cl.predict(api_name='/answer_pass'); r2 = 'returned ' + str(r2)[:120]
    except Exception as e: r2 = 'ERROR ' + type(e).__name__ + ': ' + str(e)[:200]
    demo.close(); return {'tick next_cell': str(r1)[:80], 'answer wired to 6 outputs, returns S only': r2}
tryit('gradio wiring of the displayed 7c/7d lines', wiring)
print('DISPLAYED TWINS 7', 'LOGIC OK' if ok else 'PROBLEMS')
