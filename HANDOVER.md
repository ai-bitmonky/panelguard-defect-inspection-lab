# PanelGuard — builder handover (state at v0.7, Steps 0–6 built)

Browser-only course app. No server code. `site/` is the app; `dist/PanelGuard_Defect_Inspection_Lab_vX.Y.html` is the same app as one file.
Repo: `/home/claude/panelguard` (git, no remote). Commit after every milestone.

## 1. Files

| file | what |
|---|---|
| `site/index.html` | layout + CSS + `<script src="js/…">` list (order matters, see below). Version in `<title>`, brand `<span>`, footer. |
| `site/js/engine.js` | everything generic: nav, strip, editor, Python kernel (Pyodide worker), JS kernel, run/check, predictions, review mode, storage, `pgFetch`. |
| `site/js/jskernel.js` | JS cell kernel (`window.PGJS`): notebook scope, `friendly()` errors (incl. `lgFriendly` for LangGraph), TF.js training helpers, metrics (`auc`, `cutAt`, `twoGates`…). |
| `site/js/pyworker.js` | Pyodide kernel core (worker or page thread). |
| `site/js/steps.js` | Steps 0–2 content + `PG_STEPS` (Steps 3–8 as `{locked:true}` placeholders) + `PG_PY_HELP`. |
| `site/js/stepN.js` | Step N content (3, 4, 5, 6). Each replaces its placeholder in `PG_STEPS` and chains `PG_PG_EXTRA`. |
| `site/js/crew.js` | **MiniCrew** (`window.MiniCrew`): the CrewAI-style runner used by Step 6 (section 5b). Reusable, no PanelGuard code inside. |
| `site/js/viz.js` / `viz3.js` … `viz6.js` | visuals + hands-on mechanics per step (`window.PGViz`, `PGViz3`…). `viz.js` `scene()` dispatches scene names to `PGViz3/4/5/6` — add `PGViz7` there. |
| `site/js/art.js` | banner art; per-step monitor text in `MON` (add an entry for each new step). |
| `site/js/tf.min.js` | TensorFlow.js 4.22.0 (self-hosted). |
| `site/js/langgraph.min.js` | @langchain/langgraph 1.7.5, browser entry, esbuild IIFE → `window.LangGraph` (1.4 MB, 355 KB gz). Built by `tools/lg/build.sh`. |
| `site/data/` | `labels.json` (rows `[cell_id, expert_prob, 'mono'|'poly']`), `cells64_atlas.png` (2,624 photos 64×64), `full/` (a few full-res PNGs), `LICENSE.md`. |
| `tools/build_single.py` | single-file build. |
| `tools/tests/` | tests (section 9). `tools/research/` Python twins + logs. |

Script order in index.html: `tf.min.js, steps.js, step3.js, step4.js, step5.js, crew.js, step6.js, langgraph.min.js, jskernel.js, art.js, viz.js, viz3.js, viz4.js, viz5.js, viz6.js, engine.js`. New `stepN.js` goes after `step6.js`; `vizN.js` after `viz6.js`; `engine.js` last.

## 2. Adding a step (copy step5.js / viz5.js)

```js
(function (G) {
var stepN = { id: N, title: '…', short: '…(nav subtitle)', story: '…(one or two lines under the title)', substeps: [sNa, sNb, …] };
var REFN = { 'Nb': ['answer1', 'answer2'], … };            // reference answers, one per ____ in order
stepN.substeps.forEach(function (s) { if (REFN[s.id]) s.ref = REFN[s.id]; });
G.PG_STEPN = stepN;
var prev = G.PG_PG_EXTRA; G.PG_PG_EXTRA = function (pg) { return Object.assign(prev ? prev(pg) : {}, extra(pg)); };   // pg.* helpers
if (G.PG_STEPS) { var i = G.PG_STEPS.findIndex(function (s) { return s.id === N; }); if (i >= 0) G.PG_STEPS[i] = stepN; }
})(typeof window !== 'undefined' ? window : globalThis);
```
Replacing the placeholder unlocks the step in the nav; later placeholders stay locked ("FULL PLAN — COMING NEXT"). Substep ids are `'<step><letter>'`; ORDER is global and every lock/“Run up to here” follows it.

### Substep kinds
- **scene** (no code): `{ id, name, kind:'scene', scene:'<name in PGVizN>', goal, needText }`. Renderer `PGVizN[scene](s, stage, out, api)`; it is done when it calls `api.setMech({ done: 1 })` (pending text = `needText`).
- **code**: `{ id, name, kind:'code', lang:'js'|(absent = Python), goal, task:[…], code, twin, probe, check, example, render, explain, ref }` plus optional:
  - `pre: { need(mech) → null | 'what is still to do', render(box, api) }` — hands-on before RUN (RUN disabled until `need` is null; review mode ignores it).
  - `predict: {…}` — one-try prediction before RUN (section 4).
  - `mechNeed(mech) → null | text` — hands-on AFTER the check passes (e.g. 5c token, 5f decide, 5g logbook hunt).
  - `endCard(box, api)` — shown in the output when the substep is passed (generic hook, used by 5g).
  - `twinTitle`, `twinNote` (default “Same thing in Python Keras · read-only · Keras 3”), `edLabel` (default “JavaScript · TensorFlow.js”).
  - `long:true` (training-length card, 3e only), `restore`, `live` (3e only).
- **task** lines: one per gap, saying EXACTLY what to type. A line starting with `Then ` is drawn as a hands-on (✋) item.
- **code**: written code with 1–3 gaps `____`. Blank check: any `__`+ not touching a letter outside comments blocks RUN with a plain message (so a gap may sit in a comment, e.g. 5e trick: first run with `Infinity`, then `2`).
- **probe(NS, pg, tf)** (JS; may be async) → plain JSON-able object. Throw `PGJS.CheckError('plain msg')` for "do X first". Return `{missing:[…]}` if the cell's own names are absent.
- **check(r)** → `{ pass, msg }`; one plain message per plausible mistake (list them in `tools/tests/fills.mjs`).
- **render(r, el, api)** draws the result card; called after every run (pass or not). `explain(r, mech)` → `{ asked, steps:[…], trap, remember }` (shown collapsed “WHY THIS WORKS” after pass).
- **example**: HTML, same idea with DIFFERENT values; must not reveal the gap answers.
- Python cells: `probe` is a Python snippet string evaluated after the code (see steps.js for the pattern with `_pg_has`, `_r`).

### makeApi(id) (what renderers get)
`api.mech` (saved per substep, student mode → localStorage; review → memory), `api.setMech(patch)` (saves + refreshes status), `api.res(id)` (RES of any substep), `api.getMech(id)`, `api.canvas(cellId)` (64×64 canvas), `api.full(id)` (promise of full-res URL or null), `api.draw`, `api.meta(id)`, `api.jsEval(async (NS, pg, tf) => …)` (run against the JS notebook; returns null on error), `api.py(code)` (Python eval), `api.cmd`, `api.review` (bool), `api.h`, `api.esc`, `api.tipOn`.

### Mechanics helpers (reuse, but every substep needs a DIFFERENT mechanic)
`PGViz._h`: `el, card(parent,title,sub), tiles(parent,[[value,label,'g'|'r'|'a'|'c']]), pct, zoomIn, probCol`. `PGViz3._dragTok(el, onDrop(dropName), onTap)` (targets carry `data-drop`). `PGViz4.heatCanvas(api, cellId, grid16x16, 16, size)`. `PGViz5.lineSVG(nodes, edges, opts)` (draws a LangGraph graph from `getGraph()`; positions table `POS`).
Mechanics already used (do not repeat): tap-to-open wall, drag patch, paint, tile ordering, chip-into-table (4e, 5b), sorting into boxes (4f), hold-to-peek, two-gate drag (3g), arrow wiring (5a), token stepping (5c), cells into lanes (5d), run-broken-then-fix (5e, 6d), be-the-checker buttons (5f), logbook hunt (5g), cards onto workers in a room (6a), call panel (6b), ID badge → prompt (6c), tap-through speech-bubble trace (6e), proof-read planted numbers (6f), key slot (6g).
`PGViz6`: `roomSVG(opts)` (control room: 3 workers, tool wall, wall screen, report tray; `active`, `tap`, `tool`, `report`), `reportSheet(text, {mark})` (paper report; “not known” lines red).

## 3. Kernels and the bridge
- **Python** (Pyodide 314.0.8 from the ONE constant `PYODIDE_BASE` in engine.js = jsdelivr; never change it). Python cells share one global namespace; passed cells are replayed on load (`replay()`).
- **JS kernel** (`PGJS.create`): code runs as `with(NotebookScope){…}` inside an AsyncFunction (top-level `await` OK). Only top-level lines starting at column 0 with `const|let|var name =` / `function name` become notebook names (`NS.name`); destructuring (`const { A } = LangGraph;`) stays local to the cell. No top-level `class`. `console.log` → output panel. Unknown names fall back to `window` (so `tf`, `LangGraph` work). `PG_NAME_FROM` (in step5.js) maps notebook names → the substep that makes them, giving “Run 5b first” messages; add your step's names.
- **Bridge** (`refreshBridge`, before every JS run): Python `PG_STEP3_BRIDGE` → `pg` = `{ pixels (Uint8Array 2624×4096), n, idx_train, idx_val, y_train, y_val, p_val (Step 2 val scores), cell_val (val cell ids), prob_val, kind_val, baseline, cellIndex(id), kindOf(id), epochs, live, trainingWatch, falseAlarmAt95, twoGates, gatesFor, auc, saveModel, rough }` + every `PG_PG_EXTRA` helper.
- JS replay: all passed JS cells re-run in ORDER on load (`replayJS`); 3e restores the saved model from IndexedDB instead of training. Long cells (5g: 3 shifts ≈ 10 s) make reload slower — keep later steps' replay cheap.

## 4. Prediction formats (one check, then lock + answer + collapsed `reveal`)
Used: `number` (1b), `bet` (2b), `chart` (2d), `draw` (3e), `tokens` (4d), `lanes` (5d), `blanks` (6d: tap each report line FILLED / MISSING). A new format needs no engine change: give `predict.render = function (body, api, pr, lock, whyBox) {…}`; store choices in `pr`, call `lock(value)` once (set `pr.good` first); when `pr.locked` draw the verdict + `whyBox(predict.reveal)`. `reveal` = `{asked, steps, trap, remember}`.

## 5. State each step leaves (validation tray only; test tray `idx_test` is SEALED until Step 8)
- **Python** (Steps 1–2): `X` (2624,64,64) uint8, `y` (prob ≥ 0.5), `prob`, `kind`, `cell_id`, `idx_train` (1574) / `idx_val` (525) / `idx_test` (sealed), `Xs`/features, `models`, `best_name`, `p_val` (Step 2 val scores), `cut` (Step 2 95%-recall cutoff).
- **JS Step 3**: `X` tensor [2624,64,64,1], `xTrain`, `xVal`, `yVal` (list 0/1, val order), `model` (tf.LayersModel; saved in IndexedDB key `PG.S.subs['3e'].mech.modelKey`), `pCnn`, `pSvc`(= pg.p_val), `bestW`, `pBlend` (blend scores, val order), `low`, `high` (gates: < low pass, ≥ high stop, else person), `lanes` (`twoGates` result). Fixture numbers: low 0.1908, high 0.7066.
- **JS Step 4**: `coverUp(img)`, `coverMap`, `first`, `gradCam(img)` → tf [16,16] (block 3), `cam0`, `dropHot/dropRand`, slices `mono/poly/sure/unsure` (`{n,def,defPass,ok,okStop,person}`); `pg.refGradCam(model,img)`, `pg.upsample`, `pg.valIndex(id)`. Saved mech: `PG.S.subs['4a'].mech.paint[cellId]` (pixel lists), `PG.S.subs['4f'].mech.actions = {more,label,sharp,wrong: [cellIds]}` (action list for Step 8).
- **JS Step 5** (LangGraph): `Cell` (Annotation.Root: `id, kind, photo, problem, tries, p, lane, decision, log`(concat reducer)), stations `checkPhoto, score, route, humanCheck` (interrupt), `record`, `reshoot`, `afterCheck`, `byLane`, `MAX_TRIES=2`, `DARK/BLANK/FLAT` = 20/3/12, `buildLine(routeStation, saver)` → compiled graph, `memory`, `line`, `threads`, `decide(config, answer)`, `runShift(graph, checker, name)`, `perfect`, `shiftLine`, `lowPoly`, `routePoly`, `shift1/shift2/shift3`.
  - **Audit log** `auditLog`: array of `{ id, kind, p, lane:'pass'|'person'|'stop', decision:'pass'|'stop', tries }`, one row per cell; holds the LAST shift run (shift3 = poly gate). `pg.shiftReport(rows)` → `{ n, lanes, per1000, reshoots, all/mono/poly: {n,def,defPassed,good,goodStopped,person,personWrong}, escapes:[ids], rows:[[id,lane,decision,y,kind,tries,p]] }`. `PG.RES['5g'].s1/s2/s3` hold perfect / right-9-in-10 / poly-gate reports with rows. Step 6's crew should read `RES['5g'].s1.rows` (or rerun `runShift`).
  - pg helpers: `card(id)`, `shoot(id)`, `faultCards()` (F1–F3: spoiled copies of cells 2567, 2187, 1620), `photoStats`, `labelOf(id)`, `sample(n)`, `unsureCells(s,lo,hi,k)`, `rightNineInTen(base, seed)`, `laneOf`.
  - Live numbers (fixture model): shift1 199/240/86 pass/person/stop, defects passed 8/165, good stopped 4/360; 9-in-10 checker: 16 passed, 26 good stopped; poly gate 0.1358: poly defects passed 6→4 of 84, person 240→284. Python twin matches.
  - pg (engine bridge): `mechOf(id)` → read-only copy of a substep's saved mech (respects review mode). Step 6's action_list reads `mechOf('4f').actions`.
- **JS Step 6** (MiniCrew): tools `shiftStats` (reads `auditLog` = the LAST 5g shift: poly-gate line, perfect checker), `sliceTable` (4e slices), `worstCases` (`pg.worstCases(auditLog, 3)`), `actionList` (`pg.actionFacts()`); `brain` (ScriptedLLM); agents `inspector`, `analyst`, `writer`; tasks `inspectShift`, `findCauses` (context [inspectShift]), `writeReport` (context [inspectShift, findCauses]); `orderCrew`/`orderResult` (6d); `qualityCrew`, `trace` (step_callback events), **`shiftResult`** (6e kickoff: `.raw` = the report, `.tasks_output[i].raw`, `.trace`); `facts()` (all 4 tool results now), `factNumbers`, **`checkReport(text, facts)`** → `{ok, wrong:[tokens]}`, `planted`, `onPlanted`, `onReal`, `sloppyWriter`, `checkedReport` (guardrail task), `guarded` (6f).
  - pg helpers: `sliceFacts(groups)`, `worstCases(log, k)`, `actionFacts()`, `plantedCopy(text, facts)` → `{text, planted:[{was,now,at}], tokens}`, `numberTokens(text)`. `PG_STEP6_UTIL`: `fieldsOf(report)` (which report lines are filled), `FIELDS`, `factList`, `slimTrace`, `outsOf`.
  - **What a UI step needs**: the report = `NS.shiftResult.raw`; the facts = `NS.facts()`; the trace = `PG.RES['6e'].trace` (`{n,type: task_start|thought|tool_call|tool_result|answer|guardrail|sent_back|note, agent, task, text, tool?, result?, ok?}`); a check = `NS.checkReport(text, NS.facts())`. Always re-run `checkReport` on any report you show an operator.
  - Live numbers (fixture model): shift_stats 525 cells, per 1,000: 295 / 541 / 164 pass / person / stop, defects passed 6 of 165 = 3.6 per 100 (target ≤ 5 → MET), good cells stopped 4 of 360, person checks 284, reshoots 0; 4e slices (first gates, before the poly gate) poly 6 of 84 (7.1 per 100) vs mono 2 of 81 (2.5); experts unsure 2 of 17 (11.8) vs sure 6 of 148 (4.1); missed defects 6, false alarms 4. Scripted trace: 21 steps, 4 tool calls. Python twin matches.

### 5b. MiniCrew (site/js/crew.js) — the runner
Real CrewAI is Python and cannot run in a browser; MiniCrew keeps CrewAI's names and prompt text (copied from crewai 1.15 `translations/en.json`).
- `tool({ name, description, run, args? })` → tool (`.run(args)`, `.formatted` = CrewAI's “Tool Name / Tool Arguments / Tool Description” block).
- `new Agent({ role, goal, backstory, tools, llm?, max_iter? })`; `agent.systemPrompt(native)` = the exact system message (ReAct tool block unless `native`).
- `new Task({ description, expected_output, agent, context?, guardrail?, guardrail_max_retries? (default 3), name? })`. `context` undefined = all earlier outputs (CrewAI NOT_SPECIFIED); `[]` = none.
- `new Crew({ agents, tasks, process: Process.sequential, step_callback?, task_callback? })` — refuses a context task that runs later (same message as CrewAI's `validate_context_no_future_tasks`). `await crew.kickoff()` → `{ raw, tasks_output:[{agent, description, raw, attempts}], trace, ms }`.
- Agent loop: `llm.call(messages, tools, {agent, task})` → `{thought, toolCalls:[{id,name,args}]}` or `{thought, final}`; tool results go back as `{role:'tool'}` + CrewAI's post-tool line; max_iter then one no-tool call.
- Guardrail: `(output) => [true, result] | [false, 'why']`; on fail the agent is re-run with CrewAI's validation text as its ONLY context (error + previous result); after `guardrail_max_retries` it throws `Task failed guardrail validation after N retries. Last error: …`.
- Brains: `new ScriptedLLM({ slips })` (rules: call each tool once, then the sentence pattern registered for the role with `ScriptedLLM.register(/role/i, fn({facts, context, role}))`; `slips: n` changes n numbers in a first draft on purpose; after a send-back it removes the numbers the error names). `new AnthropicLLM({ apiKey, model, baseURL? })` (Messages API, `anthropic-version: 2026-10-21` from @anthropic-ai/sdk 1.12.0, `anthropic-dangerous-direct-browser-access: true`), `new OpenAILLM({ apiKey, model, baseURL })` (chat completions + tools). The key lives in a closure only; provider errors are redacted. `MiniCrew.fetch` can be set to a stand-in fetch. `withLLM(crew, llm, lastTaskOverride?)` → a copy of the crew with another brain.
- Errors are `CrewError` (plain text); `PGJS.friendly` maps them (`crewFriendly`).
- Differences from CrewAI worth knowing: Python ignores unknown Agent options silently (MiniCrew refuses them); in crewai 1.15.44 a crew's `step_callback` got no steps when the same Agent objects had already run in an earlier crew (the twin hires fresh agents for 6e; MiniCrew always calls the crew's callback); hierarchical process is not built; Python's step_callback gets AgentAction/ToolResult objects, MiniCrew gets plain event objects (more types).

## 6. Review mode (generic)
Top-bar button / `#review` / `?review=1`. All pages open; work goes to `RV` (memory), never to the student's progress. Code cells with `ref` get “Fill reference answer” and “Run up to here” (runs every earlier code cell with `ref` that has no passing result, then this one; 3e trains 1 epoch, numbers marked rough via `pg.rough`). Renderers must show the plain “press Run up to here” text when data is missing (`api.review`). Every code cell MUST have `ref`, or Run up to here skips it and later cells fail.

## 7. Hosting rules (all enforced so far)
Only own files, fetched through `pgFetch` (reads `window.PG_EMBED` in the single file). Allowed extensions only (.html .css .js .mjs .wasm .json .csv .txt .md .png .jpg .webp .svg .woff2). No alert/confirm/prompt, downloads, window.open. Storage only inside try/catch (srcdoc `allow-scripts` frames block localStorage). Must work on the site, via file://, and in about:srcdoc frames.

## 8. Build + version bump
1. Bump `vX.Y` in `site/index.html` (title, brand span, footer). 2. `python3 tools/build_single.py` → `dist/PanelGuard_Defect_Inspection_Lab_vX.Y.html` (name from the title; inlines every `js/*.js`, embeds data). 3. Update the `DIST` path / version regex in the tests you run (`s6_e2e.mjs` uses v0.7, `srcdoc_test.mjs` matches `/v0.7.html$/`; older `s5_e2e.mjs` still says v0.6). 4. Commit site + dist.
LangGraph bundle: `cd tools/lg && npm ci && sh build.sh`. `entry.mjs` exports only the names used (Annotation, StateGraph, START, END, MemorySaver, interrupt, Command, GraphRecursionError, INTERRUPT, isInterrupted) — add exports there if needed and rebuild.

## 9. Tests (Chrome at `/usr/bin/google-chrome`; run only what your change touches)
- Node cell checks (real kernel/probes/checks, TF.js CPU, fixture model): `cd tools && node tests/js_cells4.test.mjs` / `node tests/js_cells5.test.mjs [5b,5e]` (arg = only those substeps get wrong-answer runs). Right + wrong answers per gap live in `tests/fills.mjs` (`FILLS[id] = {right, wrong:[…]}`; `right` must equal `ref`). js_cells5 also writes `tools/research/step5_inputs.json`.
- Browser e2e: `TARGET=site|file|srcdoc node tests/s5_e2e.mjs` (env `RELOAD=0`, `REVIEW=0` skip those parts). ~4–9 min each: start state = Steps 0–4 passed (`seed.mjs` + the `M3/M4` mech in the test), Step 3 model = the **fixture** (`fixture.mjs` + `fixture_cnn.json`: Step 3 architecture trained in real Keras) saved into IndexedDB so the app restores it like a student's model; everything else replays for real. Screenshots → `tools/shots/` (1366×768; look at them).
- `node tests/s5_review_fresh.mjs` — fresh browser, review mode, Run up to here on 5g from nothing (trains 3e for 1 epoch; slow).
- `node tests/wasm_block.mjs` — site + single file served with a CSP that blocks WebAssembly (`CSP` env of `serve.mjs`): plain message, no Pyodide request, Step 0 / no-Python pages work, zero uncaught errors.
- `node srcdoc_test.mjs` — single file in 3 sandbox variants: Python + TF.js ready, LangGraph pause/resume + recursion limit, zero console errors.
- Python twin: `python3 tools/research/step5_twin.py [inputs.json]` (needs `pip install langgraph`); must print `TWIN MATCHES`.
- Step 6: `node tests/js_cells6.test.mjs [6d,6f]` (writes `tools/research/step6_inputs.json`), then the CrewAI twin `python -I tools/research/step6_twin.py` in a venv with `pip install crewai` (verified 1.15.44; run it from outside the crewai folder: crewai has a `types` package) → `TWIN MATCHES`. Browser: `TARGET=site|file|srcdoc node tests/s6_e2e.mjs` (port 8773; the real-model path uses Playwright routes as mocked providers — no real provider is ever called; srcdoc mode tests the honest skip).
- **CDN mirror**: jsdelivr is NOT reachable here. `tests/cdn.mjs` `mirrorCDN(ctx)` answers the exact `PYODIDE_BASE` URL from `tools/cdn-mirror` with CORS headers. Keep it; never change the constant. Chrome's own background calls to google.com show as proxy refusals in the Bash output — harmless.
- Local server for site mode: `node tools/serve.mjs <site dir> <port>` (each test uses its own port: s4 8769, s5 8771, fresh review 8772).

## 10. Known traps
- Boot runs a tiny WebAssembly probe (page: `wasmProbe`, worker: `PGWasmWorks` in pyworker.js) before Pyodide. If blocked: `K.blocked`, message in `#lerr`, RUN disabled with the reason; Python never starts. Never `console.warn/error` raw Error/URL objects (host console relays fail to clone them) — log strings only.
- Replay filters must not create `S.subs[id]` entries (read `S.subs[id]` directly, not `SSs(id)`).
- **LangGraph in the browser**: the web entry has no AsyncLocalStorage, so `interrupt()` and `getConfig()` cannot find the running node. `tools/lg/entry.mjs` installs a tiny synchronous stand-in: `interrupt()` works only if called at the top of a node, BEFORE any `await`. Pass `config` (2nd node argument) explicitly for anything else.
- A node name may not equal a state key (`score` node vs `score` field → error). That is why the score field is `p`.
- Conditional edges with a list (`['score','reshoot','human_check']`) throw “Branch condition returned unknown or null destination” for any other return value; an unreachable node fails at `compile()`.
- Re-invoking a finished thread id keeps old plain fields (e.g. `decision`): use fresh thread ids or a fresh `MemorySaver` per shift.
- `invoke` of a paused flow returns `__interrupt__: [{id, value}]`; resume with `invoke(new Command({ resume }), sameConfig)`.
- MemorySaver keeps every checkpoint (photo arrays included) in memory; fine for 3×525 cells, watch it for bigger loops.
- JS notebook: `with` scope means a misspelled name is silently assigned globally; destructured names are cell-local; avoid top-level `class`.
- Scores at a gate: `low` IS a defect's score; `p < low` passes, so that defect goes to a person. Show 4 decimals when that matters.
- `pg.pixels` is the whole pack (train+val+test). Use `pg.cell_val` / `idx_val` only; the test tray stays sealed until Step 8.
- 4d's seeded prediction value in tests is a placeholder (`val: 1`); opening 4d in a seeded test shows a broken token row — harmless.
- Step 6 keys: never put a key in code (code and drafts are saved to localStorage). The 6g key slot keeps it in a viz6 closure variable (`KEY6`) only. The published page blocks outside network calls (CSP); a real model works only in the downloaded single file (file://) in Chrome. 6g detects `securitypolicyviolation` / network failure and says so.
- Software WebGL here: replay of Steps 3–4 on load takes ~3.5–6 min in tests; set generous timeouts.
