"""PanelGuard · app.py — Step 7: the operator console in Gradio, on your frozen models and the Step 5 flow.

    python app.py --elpv <folder with labels.csv>              # opens the console on the VALIDATION tray
    python app.py --elpv <folder> --photos <folder of 64x64 or bigger EL photos>   # your own photos (no labels needed)
    python app.py --elpv <folder> --smoke                      # builds the app, runs 5 cells, does not open a server
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
    P = {}
    def score_of(cid):                                   # LIVE: both models look at this photo now
        c = next(c for c in cells if c['id'] == cid); x = np.asarray(c['photo'], dtype=np.float32).reshape(1, 64, 64) / 255
        return S['best_w'] * float(cnn.predict(x[..., None], verbose=0)[0, 0]) + (1 - S['best_w']) * float(M['svc'].predict_proba(features(x, M['pca']))[0, 1])
    log = []; line = make_line(S, score_of, log)

    def decide(i):
        c = dict(cells[i % len(cells)]); config = {'configurable': {'thread_id': f"console-{c['id']}-{i}"}}
        try: out = line.invoke(c, config)
        except Exception as e: out = {'error': str(e)}
        key = 'person' if '__interrupt__' in out else out.get('lane') if out.get('lane') in ('pass', 'stop') else 'none'
        return c, config, out, key

    def next_cell(state):
        state = state or {'i': 0, 'queue': [], 'counts': {k: 0 for k in LAMPS}}
        c, config, out, key = decide(state['i']); state['i'] += 1; state['counts'][key] += 1
        if key in ('person', 'none'): state['queue'].append({'config': config, 'id': c['id'], 'paused': '__interrupt__' in out})
        img = np.asarray(c['photo'], dtype=np.uint8).reshape(64, 64)
        return state, img, lamp_html(key), json.dumps(state['counts']), f"queue: {len(state['queue'])} waiting"

    def answer(state, said):
        if not state or not state['queue']: return state, 'queue: no cells waiting'
        it = state['queue'].pop(0)
        if it['paused']: line.invoke(Command(resume=said), it['config'])
        return state, f"queue: {len(state['queue'])} waiting · cell {it['id']}: {said}"

    with gr.Blocks(title='PanelGuard · operator console') as demo:
        st = gr.State(None)
        with gr.Row():
            photo = gr.Image(type='numpy', height=320, interactive=False, show_label=False); lamp = gr.HTML(lamp_html('none'))
        counts = gr.Textbox(label='counts'); q = gr.Markdown('queue: no cells waiting')
        with gr.Row():
            nxt = gr.Button('NEXT CELL', variant='primary'); pb = gr.Button('● PASS'); sb = gr.Button('■ STOP', variant='stop')
        nxt.click(next_cell, st, [st, photo, lamp, counts, q], api_name='next_cell')
        pb.click(lambda s: answer(s, 'pass'), st, [st, q]); sb.click(lambda s: answer(s, 'stop'), st, [st, q])
    if args.smoke:
        s = None
        for _ in range(5): s, img, lh, cn, qq = next_cell(s)
        s, qq = answer(s, 'stop')
        print('SMOKE OK · 5 real cells · counts', cn, '·', qq, '· logbook rows', len(log)); return
    demo.launch()


if __name__ == '__main__':
    main()
