# PanelGuard — your solar-cell defect inspection station (Python version)

What you built in the browser, as a small Python project. Same steps, same rules.

1. Get the photos: `git clone https://github.com/zae-bayern/elpv-dataset` (licence CC BY-NC-SA 4.0: learning and research only, not for a product).
   The folder you need holds `labels.csv` and `images/` (in the repository: `src/elpv_dataset/data`).
2. `pip install -r requirements.txt` (Python 3.13; the versions there are the ones this project was run with. scikit-learn must stay below 1.11: it removes `SVC(probability=True)`, which `train.py` uses.)
3. `python train.py --elpv <that folder>` — Steps 1-3: split by cell, features + scikit-learn, Keras CNN, blend weight and gates chosen on VALIDATION only. Writes `svc.joblib`, `cnn.keras`, `settings.json`. Use `--epochs 2` for a quick check.
4. `python flow.py --elpv <folder>` — Step 5: a validation shift through the LangGraph flow (a person answers the unsure cells).
5. When you are done tuning: `python flow.py --elpv <folder> --trial` — Step 8: the sealed test tray, ONCE. It prints defects passed per 100 with a 95% Wilson interval and drift alarms, and refuses to run twice.
6. `python crew.py --dry` — Step 6: the crew's tools on the trial logbook (set `PANELGUARD_LLM` for a real model; the guardrail checks every number).
7. `python app.py --elpv <folder>` — Step 7: the operator console (Gradio). `--photos <folder>` runs it on your own photos.

The honest rules: learn on train, choose on validation, test once. Unknown, missing or broken = NO VERDICT, and a person looks.
Limits: split by cell (not by module), 64 x 64 photos, noisy labels (experts unsure on some cells), a perfect checker in the trial, one small test tray.

## No Python on your laptop? Run it in the browser with GitHub Codespaces
vscode.dev alone cannot run this project (it has no terminal). GitHub Codespaces can: it is VS Code in a browser tab on a cloud computer.
1. Make a new GitHub repository. Add these files. Put `devcontainer.json` in a folder named `.devcontainer`.
2. On the repository page: Code → Codespaces → Create codespace. The first start installs everything and gets the photos (several minutes).
3. In the terminal, run steps 3 to 7 above in the same order. The photo folder is already there: use `--elpv elpv-dataset/src/elpv_dataset/data`.
   Example: `python train.py --elpv elpv-dataset/src/elpv_dataset/data`
4. `python app.py --elpv elpv-dataset/src/elpv_dataset/data` opens the console in a new browser tab (port 7860).
Use your own personal GitHub account: it has free Codespaces hours each month. Stop the codespace when you are done.
