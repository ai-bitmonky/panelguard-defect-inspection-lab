# PanelGuard — Solar Panel Defect Inspection Lab

A build-it-yourself course. You build a real solar-cell defect inspection system, step by step, with scikit-learn, Keras + TensorFlow, LangGraph and a CrewAI crew, and an operator screen.

## 1. The lab (runs in your browser, nothing to install)
1. Open this link in Chrome on a laptop (not a phone): https://ai-bitmonky.github.io/panelguard-defect-inspection-lab/
2. Wait until the top right shows Python and TensorFlow.js in green. You need internet.
3. Do Steps 0 to 8 in order. Your progress is saved in that browser on that laptop.

If the link does not open, download the newest file from the `dist` folder (`PanelGuard_Defect_Inspection_Lab_v1.3.html`) and open it in Chrome.

## 2. The Python project (the same system as real Python files)
The files are in `tools/takehome`. Its own `README.md` explains each step.

### Run it in the browser with GitHub Codespaces
1. On this page: Code → Codespaces → Create codespace. The first start installs everything and gets the photos (several minutes).
2. In the terminal:

```
cd tools/takehome
python train.py --elpv elpv-dataset/src/elpv_dataset/data
python flow.py --elpv elpv-dataset/src/elpv_dataset/data
python flow.py --elpv elpv-dataset/src/elpv_dataset/data --trial
python crew.py --dry
python app.py --elpv elpv-dataset/src/elpv_dataset/data
```

- `train.py --epochs 2` is a quick check. The full run is 30 epochs.
- `--trial` opens the sealed test tray. It runs ONCE. Use it only when you are done tuning.
- `app.py` opens the operator console in a new browser tab (port 7860).

### Run it on your own computer (Python 3.13)
```
cd tools/takehome
pip install -r requirements.txt
git clone --depth 1 https://github.com/zae-bayern/elpv-dataset
```
Then the same five commands as above.

## Data and licence
The photos are the ELPV dataset (Buerhop-Lutz et al. 2018; Deitsch et al. 2019, 2021), licence CC BY-NC-SA 4.0: learning and research only, not for a product. See `site/data/LICENSE.md`.

## Limits of this build
Split by cell (not by module), 64 x 64 photos, noisy labels, a perfect human checker in the trial, one small test tray. The machine decides about half the cells alone; a person checks the rest.
