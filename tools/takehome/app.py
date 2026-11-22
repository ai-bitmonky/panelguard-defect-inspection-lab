"""PanelGuard · app.py — Step 7: the operator console in Gradio, on your frozen models and the Step 5 flow.

    python app.py --elpv <folder with labels.csv>              # opens the console on the VALIDATION tray
    python app.py --elpv <folder> --photos <folder of 64x64 or bigger EL photos>   # your own photos (no labels needed)
    python app.py --elpv <folder> --smoke                      # builds the app, runs 5 cells + the fault drill + the board, no server
Unknown, missing or broken = NO VERDICT, and a person looks. Never PASS.
"""
import argparse, json, pathlib
import numpy as np
import joblib
from PIL import Image
from langgraph.types import Command
from train import load_elpv, features
from flow import make_line

HERE = pathlib.Path(__file__).resolve().parent
LAMPS = {'pass': ('PASS', '●', '#2ee07a'), 'person': ('CHECK', '▲', '#ffb21e'), 'stop': ('STOP', '■', '#ff5050'), 'none': ('NO VERDICT', '◌', '#a3afbf')}


def lamp_html(key):
    w, s, c = LAMPS[key]
    return f"<div style='border:6px solid {c};border-radius:12px;padding:18px;text-align:center;color:{c};font:700 64px Arial'>{s}<br>{w}</div>"


def main():
    a = argparse.ArgumentParser(); a.add_argument('--elpv', required=True); a.add_argument('--photos'); a.add_argument('--smoke', action='store_true'); a.add_argument('--dir', default=str(HERE))
    args = a.parse_args(); D = pathlib.Path(args.dir)
    S = json.loads((D / 'settings.json').read_text()); M = joblib.load(D / 'svc.joblib')
    import keras, gradio as gr
    cnn = keras.models.load_model(D / 'cnn.keras')
    if args.photos:
        files = sorted(p for p in pathlib.Path(args.photos).iterdir() if p.suffix.lower() in ('.png', '.jpg', '.jpeg'))
        cells = [{'id': i, 'kind': 'mono', 'photo': np.asarray(Image.open(f).convert('L').resize((64, 64), Image.LANCZOS)).ravel().tolist(), 'tries': 1} for i, f in enumerate(files)]
    else:
        X, prob, kind, cell_id = load_elpv(args.elpv)
        cells = [{'id': int(cell_id[i]), 'kind': str(kind[i]), 'photo': X[i].ravel().tolist(), 'tries': 1} for i in S['idx_val']]
    LABEL = {}
    if not args.photos: LABEL = {int(cell_id[i]): int(prob[i] >= 0.5) for i in S['idx_val']}
    STATE = {'model': cnn}                               # the fault drill sets STATE['model'] = None ("model not loaded")
    by_id = {c['id']: c for c in cells}
    def score_of(cid):                                   # LIVE: both models look at this photo now
        if STATE['model'] is None: raise RuntimeError('model not loaded')
        x = np.asarray(by_id[cid]['photo'], dtype=np.float32).reshape(1, 64, 64) / 255
        return S['best_w'] * float(STATE['model'].predict(x[..., None], verbose=0)[0, 0]) + (1 - S['best_w']) * float(M['svc'].predict_proba(features(x, M['pca']))[0, 1])
    log = []; line = make_line(S, score_of, log)
    n_thread = [0]

    def decide_cell(c):                                  # 7b: ONE real decision; unknown, missing or broken -> NO VERDICT
        n_thread[0] += 1; config = {'configurable': {'thread_id': f"console-{c['id']}-{n_thread[0]}"}}
        try: out = line.invoke(c, config)
        except Exception as e: out = {'error': str(e)}
        key = 'person' if '__interrupt__' in out else out.get('lane') if out.get('lane') in ('pass', 'person', 'stop') else 'none'
        return c, config, out, key

    def new_session(): return {'i': 0, 'queue': [], 'counts': {'pass': 0, 'person': 0, 'stop': 0, 'none': 0, 'total': 0, 'byPerson': 0}}

    def on_result(state, c, config, out, key):           # 7c: ONCE per arriving cell, under its lamp
        state['counts'][key] += 1; state['counts']['total'] += 1
        if key in ('person', 'none'): state['queue'].append({'config': config, 'id': c['id'], 'kind': c['kind'], 'paused': '__interrupt__' in out})

    def next_cell(state):                                # 7c: the line runner (the Timer calls it every 2 s = 30 cells per minute)
        state = state or new_session()
        c, config, out, key = decide_cell(dict(cells[state['i'] % len(cells)])); state['i'] += 1
        on_result(state, c, config, out, key)
        img = np.asarray(c['photo'], dtype=np.uint8).reshape(64, 64)
        return state, img, lamp_html(key), json.dumps(state['counts']), f"queue: {len(state['queue'])} waiting"

    def answer(state, said):                             # 7d: resume the SAME paused flow; BY PERSON, never total again
        if not state or not state['queue']: return state, 'queue: no cells waiting'
        it = state['queue'].pop(0)
        if it['paused']: line.invoke(Command(resume=said), it['config'])
        else: log.append({'id': it['id'], 'kind': it['kind'], 'p': None, 'lane': 'none', 'decision': said, 'tries': 1})
        state['counts']['byPerson'] += 1
        return state, f"queue: {len(state['queue'])} waiting · cell {it['id']}: {said}"

    def shift_board(rows, size=50):                      # 7e: lanes per block of 50 cells + defects passed per 100 (expert labels)
        blocks = []
        for i in range(0, len(rows), size):
            b = {'pass': 0, 'person': 0, 'stop': 0, 'none': 0}
            for r in rows[i:i + size]: b[r['lane'] if r['lane'] in b else 'person'] += 1
            blocks.append(b)
        def group(rs):
            d = [r for r in rs if LABEL.get(r['id']) == 1]; e = [r for r in d if r['decision'] == 'pass']
            return {'defects': len(d), 'passed': len(e), 'per100': round(1000 * len(e) / len(d)) / 10 if d else 0}
        return {'cells': len(rows), 'blocks': blocks, 'all': group(rows), 'target': 5,
                'mono': group([r for r in rows if r['kind'] == 'mono']), 'poly': group([r for r in rows if r['kind'] == 'poly'])}

    def board_html():
        b = shift_board(log)
        if not LABEL: return f"{b['cells']} cells in the logbook · no expert labels for your own photos, so no defects-passed number"
        return (f"{b['cells']} cells · defects passed {b['all']['passed']} of {b['all']['defects']} = {b['all']['per100']} per 100 (target at most 5)"
                f" · mono {b['mono']['per100']} · poly {b['poly']['per100']} · lanes per block of 50: " + ' | '.join(f"{x['pass']}/{x['person']}/{x['stop']}" for x in b['blocks']))

    with gr.Blocks(title='PanelGuard · operator console') as demo:
        st = gr.State(None)
        with gr.Row():
            photo = gr.Image(type='numpy', height=320, interactive=False, show_label=False); lamp = gr.HTML(lamp_html('none'))
        counts = gr.Textbox(label='counts'); q = gr.Markdown('queue: no cells waiting')
        with gr.Row():
            start = gr.Button('▶ START', variant='primary'); halt = gr.Button('■ STOP LINE'); nxt = gr.Button('NEXT CELL')
            pb = gr.Button('● PASS'); sb = gr.Button('■ STOP', variant='stop'); bb = gr.Button('SHIFT BOARD')
        board = gr.Markdown()
        timer = gr.Timer(2.0, active=False)               # 2 s per cell = 30 cells per minute
        timer.tick(next_cell, st, [st, photo, lamp, counts, q])
        start.click(lambda: gr.Timer(active=True), None, timer); halt.click(lambda: gr.Timer(active=False), None, timer)
        nxt.click(next_cell, st, [st, photo, lamp, counts, q], api_name='next_cell')
        pb.click(lambda s: answer(s, 'pass'), st, [st, q]); sb.click(lambda s: answer(s, 'stop'), st, [st, q])
        bb.click(board_html, None, board, api_name='board')
    if args.smoke:
        s = None
        for _ in range(5): s, img, lh, cn, qq = next_cell(s)
        tot = s['counts']['total']; s, qq = answer(s, 'stop'); assert s['counts']['total'] == tot
        print('SMOKE OK · 5 real cells · counts', json.dumps(s['counts']), '·', qq, '· logbook rows', len(log))
        # 7g: the fault drill, for real
        cam = dict(cells[0]); cam['id'] = 900000 + int(cam['id']); cam['photo'] = [int(v * 0.08) for v in cam['photo']]     # lens cap on
        f1 = decide_cell(cam)[3]
        STATE['model'] = None; nm = decide_cell(dict(cells[1]))[3]; STATE['model'] = cnn
        fe = decide_cell({'id': 900001, 'kind': 'mono', 'tries': 1, 'photo': None})[3]
        e = new_session(); before = json.dumps(e['counts']); answer(e, 'pass'); same = json.dumps(e['counts']) == before
        print('FAULT DRILL · camera fault ->', LAMPS[f1][0], '· model not loaded ->', LAMPS[nm][0], '· flow error ->', LAMPS[fe][0], '· empty queue: counts unchanged', same)
        assert (f1, nm, fe, same) == ('person', 'none', 'none', True), 'fault drill failed'
        print('BOARD ·', board_html()); return
    demo.launch()


if __name__ == '__main__':
    main()
