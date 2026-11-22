"""PanelGuard Step 6 — the same quality crew in REAL Python CrewAI (verified with crewai 1.15.44).

Reads tools/research/step6_inputs.json (written by tools/tests/js_cells6.test.mjs: the real lab state — Step 5 logbook,
Step 4e slices, labels, Step 4f action boxes — plus what the JavaScript MiniCrew produced), rebuilds the 4 tools in
Python over that state, runs the crew in CrewAI with a SCRIPTED custom LLM (a BaseLLM subclass: rules, not a language
model, so no key and no network), and compares tools, prompts, reports and guardrail results with the JavaScript run.
Run:  python -I tools/research/step6_twin.py [inputs.json]     (needs: pip install crewai)
Prints TWIN MATCHES when every compared item is equal."""
import json, math, os, re, sys

os.environ.setdefault("CREWAI_DISABLE_TELEMETRY", "true"); os.environ.setdefault("OTEL_SDK_DISABLED", "true"); os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
import crewai
from crewai import Agent, Task, Crew, Process
from crewai.llms.base_llm import BaseLLM
from crewai.tools import tool

HERE = os.path.dirname(os.path.abspath(__file__))
IN = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "step6_inputs.json")))
JS = IN["js"]
LABEL = {c: y for c, y in zip(IN["cell_val"], IN["y_val"])}
PROB = {c: p for c, p in zip(IN["cell_val"], IN["prob_val"])}


def js_round(x):            # JavaScript Math.round (half up), not Python's banker's rounding
    return math.floor(x + 0.5)


def num(x):                 # JavaScript prints 7.0 as 7
    return int(x) if isinstance(x, float) and x.is_integer() else x


def js(x):                  # String(x) in JavaScript, for the numbers used here
    return str(num(x))


def per100(a, b):
    return num(js_round(1000 * a / b) / 10) if b else 0


# ---------- the Step 5 counter (pg.shiftReport), ported ----------
def shift_report(rows):
    def group():
        return dict(n=0, defs=0, defPassed=0, good=0, goodStopped=0, person=0, personWrong=0)
    R = dict(n=len(rows), lanes=dict(pass_=0, person=0, stop=0), reshoots=0, all=group(), mono=group(), poly=group(), escapes=[], rows=[])
    for r in rows:
        y = LABEL.get(r["id"])
        R["lanes"][("pass_" if r["lane"] == "pass" else r["lane"])] += 1
        R["reshoots"] += max(0, (r.get("tries") or 1) - 1)
        for g in (R["all"], R.get(r["kind"], group())):
            g["n"] += 1
            if r["lane"] == "person":
                g["person"] += 1
                if (r["decision"] == "stop") != (y == 1): g["personWrong"] += 1
            if y == 1:
                g["defs"] += 1
                if r["decision"] == "pass": g["defPassed"] += 1
            else:
                g["good"] += 1
                if r["decision"] == "stop": g["goodStopped"] += 1
        if y == 1 and r["decision"] == "pass": R["escapes"].append(r["id"])
        R["rows"].append([r["id"], r["lane"], r["decision"], y, r["kind"], r.get("tries") or 1, None if r.get("p") is None else num(js_round(r["p"] * 1e4) / 1e4)])
    R["per1000"] = {k: 1000 * R["lanes"][k2] / R["n"] for k, k2 in (("pass", "pass_"), ("person", "person"), ("stop", "stop"))}
    return R


AUDIT = IN["audit_log"]
DESC = {
    "shift_stats": "Facts of the last shift from the Step 5 logbook: cells, lanes per 1,000 cells, defects passed, good cells stopped, person checks, reshoots.",
    "slice_table": "Defects passed and good cells stopped per group (mono / poly, expert sure / unsure), from the Step 4e slices.",
    "worst_cases": "The missed defects and the worst false alarms of the last shift: cell id, score, expert score, cell type.",
    "action_list": "Your Step 4f action boxes: which mistakes need more photos, a label re-check, a sharper photo, or a model fix.",
}
BOX = [("more", "Need more photos like this"), ("label", "Ask the expert to re-check the label"), ("sharp", "Needs a sharper photo"), ("wrong", "Model looked at the wrong place")]


def f_shift_stats():
    R = shift_report(AUDIT)
    a = R["all"]
    return {"cells": R["n"], "per_1000": {k: js_round(v) for k, v in R["per1000"].items()}, "defects": a["defs"], "defects_passed": a["defPassed"],
            "defects_passed_per_100": num(js_round(1000 * a["defPassed"] / a["defs"]) / 10), "target_max_per_100": 5, "good_cells": a["good"],
            "good_cells_stopped": a["goodStopped"], "person_checks": R["lanes"]["person"], "reshoots": R["reshoots"],
            "person_answers": "a perfect checker: the expert label answered every paused cell"}


def f_slice_table():
    def one(x):
        return {"cells": x["n"], "defects": x["def"], "defects_passed": x["defPass"], "passed_per_100": per100(x["defPass"], x["def"]), "good": x["ok"], "good_stopped": x["okStop"], "to_person": x["person"]}
    S = IN["slices"]
    return {"source": "Step 4e slices: validation tray at the Step 3 gates (no poly gate)", "groups": {"mono": one(S["mono"]), "poly": one(S["poly"]), "expert_sure": one(S["sure"]), "expert_unsure": one(S["unsure"])}}


def f_worst_cases(k=3):
    rows = shift_report(AUDIT)["rows"]
    case = lambda x: {"cell": x[0], "score": x[6], "expert_score": PROB.get(x[0]), "type": x[4], "lane": x[1]}
    missed = sorted([x for x in rows if x[3] == 1 and x[2] == "pass"], key=lambda x: (x[6], x[0]))
    fa_all = [x for x in rows if x[3] == 0 and x[2] == "stop"]
    fa = sorted(fa_all, key=lambda x: (-x[6], x[0]))[:k]
    return {"missed_count": len(missed), "missed_defects": [case(x) for x in missed], "false_alarm_count": len(fa_all), "worst_false_alarms": [case(x) for x in fa]}


def f_action_list():
    a, boxes, tot = IN["actions"], [], 0
    for key, lab in BOX:
        c = list(a.get(key, [])); tot += len(c); boxes.append({"box": lab, "count": len(c), "cells": c})
    return {"source": "your Step 4f action boxes", "sorted": tot, "boxes": boxes}


def make_tool(name, fn):
    def run() -> str:
        return json.dumps(fn(), ensure_ascii=False)
    run.__doc__ = DESC[name]
    run.__name__ = name
    return tool(name)(run)


shift_stats, slice_table, worst_cases, action_list = (make_tool("shift_stats", f_shift_stats), make_tool("slice_table", f_slice_table),
                                                      make_tool("worst_cases", f_worst_cases), make_tool("action_list", f_action_list))


# ---------- the scripted brain (same rules as site/js/crew.js + step6.js) ----------
def nums_in(s):
    s = re.sub(r"(\d),(\d{3})", r"\1\2", str(s))
    return [float(m) for m in re.findall(r"\d+(?:\.\d+)?", s)]


def slip(text, count, seen):
    known, lines, done = nums_in(seen), text.split("\n"), 0
    order = [i for i, l in enumerate(lines) if re.match(r"^(RESULT|COST):", l)]
    order += [i for i in range(len(lines)) if i not in order]
    for i in order:
        if done >= count: break
        m = re.search(r"(?<![\d.,])(?<!per )(\d+)(?!\d|[.,]\d)", lines[i])
        if not m: continue
        c = int(m.group(1)) + 2
        while any(abs(k - c) <= 0.5 for k in known): c += 1
        lines[i] = lines[i][:m.start(1)] + str(c) + lines[i][m.end(1):]
        done += 1
    return "\n".join(lines)


def fix_draft(prev, err):
    out = prev
    for tok in re.findall(r"\d+(?:\.\d+)?", ":".join(err.split(":")[1:])):
        out = re.sub(r"(^|[^\d.,])" + re.escape(tok) + r"(?!\d|\.\d|,\d)", lambda m: m.group(1) + "[removed]", out, count=1)
    return out + "\nCHECK: numbers the checker could not find in the tool results were removed."


def w_inspector(facts, ctx):
    F = facts.get("shift_stats")
    if not isinstance(F, dict): return "SHIFT FACTS — not known: I have no logbook tool, so I have no numbers."
    p = F["per_1000"]
    return "\n".join(["SHIFT FACTS — last shift in the logbook", "• Cells checked: " + js(F["cells"]),
        "• Lanes per 1,000 cells: %s auto-pass, %s to a person, %s auto-stop" % (js(p["pass"]), js(p["person"]), js(p["stop"])),
        "• Defects passed: %s of %s (%s per 100; target: at most %s per 100)" % (js(F["defects_passed"]), js(F["defects"]), js(F["defects_passed_per_100"]), js(F["target_max_per_100"])),
        "• Good cells stopped: %s of %s" % (js(F["good_cells_stopped"]), js(F["good_cells"])),
        "• Person checks: %s · Reshoots: %s" % (js(F["person_checks"]), js(F["reshoots"])), "• Person answers: " + F["person_answers"]])


def w_analyst(facts, ctx):
    S, W, L = facts.get("slice_table"), facts.get("worst_cases"), ["WHERE FAILURES CLUSTER — slices of the validation tray at the first gates (before the poly gate)"]

    def pair(lab, an, A, bn, B):
        same = A["passed_per_100"] == B["passed_per_100"]
        w = [an, A, bn, B] if A["passed_per_100"] >= B["passed_per_100"] else [bn, B, an, A]
        return "• %s: %s — %s %s of %s defects passed (%s per 100); %s %s of %s (%s per 100)" % (lab, "no difference" if same else w[0] + " is weaker", w[0], js(w[1]["defects_passed"]), js(w[1]["defects"]), js(w[1]["passed_per_100"]), w[2], js(w[3]["defects_passed"]), js(w[3]["defects"]), js(w[3]["passed_per_100"]))
    c = lambda z: "cell %s (score %s, expert %s, %s)" % (js(z["cell"]), js(z["score"]), js(z["expert_score"]), z["type"])
    if isinstance(S, dict) and S.get("groups"):
        g = S["groups"]; L.append(pair("Cell type", "poly", g["poly"], "mono", g["mono"])); L.append(pair("Expert labels", "unsure", g["expert_unsure"], "sure", g["expert_sure"]))
    else: L.append("• Groups: not known — I have no slice tool.")
    if isinstance(W, dict) and "missed_defects" in W:
        L.append("• Missed defects this shift: " + js(W["missed_count"]) + (" — " + "; ".join(c(z) for z in W["missed_defects"]) if W["missed_defects"] else ""))
        L.append("• Worst false alarms: " + ("; ".join(c(z) for z in W["worst_false_alarms"]) if W["worst_false_alarms"] else "none"))
    else: L.append("• Missed defects: not known — I have no worst-case tool.")
    return "\n".join(L)


def w_writer(facts, ctx):
    A, L = facts.get("action_list"), ["SHIFT QUALITY REPORT — for the plant manager"]
    m1 = re.search(r"Defects passed: (\d+) of (\d+) \(([\d.]+) per 100; target: at most ([\d.]+) per 100\)", ctx)
    m2 = re.search(r"Lanes per 1,000 cells: (\d+) auto-pass, (\d+) to a person, (\d+) auto-stop", ctx); m3 = re.search(r"Person checks: (\d+)", ctx)
    m4 = re.search(r"Cell type: (?:\w+ is weaker|no difference) — (\w+) (\d+) of (\d+) defects passed \(([\d.]+) per 100\)", ctx)
    m5 = re.search(r"Expert labels: (?:\w+ is weaker|no difference) — (\w+) (\d+) of (\d+) defects passed \(([\d.]+) per 100\)", ctx)
    m6 = re.search(r"Person answers: (.*)", ctx)
    L.append("RESULT: " + ("%s defects passed per 100 (%s of %s). Target: at most %s per 100 → %s" % (m1[3], m1[1], m1[2], m1[4], "TARGET MET." if float(m1[3]) <= float(m1[4]) else "TARGET MISSED.") if m1 else "not known — no shift facts were given to me."))
    L.append("COST: " + (m2[2] + " person checks per 1,000 cells" + (" (" + m3[1] + " this shift)." if m3 else ".") if m2 else "not known — no shift facts were given to me."))
    L.append("WHERE IT FAILS: " + ("%s cells — %s of %s defects passed (%s per 100) at the first gates, before the poly gate." % (m4[1], m4[2], m4[3], m4[4]) if m4 else "not known — no analysis was given to me."))
    L.append("TOP ACTIONS:")
    L.append("• " + ("More %s defect photos for training (%s of %s %s defects passed)." % (m4[1], m4[2], m4[3], m4[1]) if m4 else "More photos for the weakest group: not known (no analysis)."))
    L.append("• " + ("Expert re-check of the %s labels (%s of %s %s defects passed)." % (m5[1], m5[2], m5[3], m5[1]) if m5 else "Label re-check: not known (no analysis)."))
    if isinstance(A, dict) and "boxes" in A:
        a = ("Work the action list: " + js(A["sorted"]) + " mistakes sorted — " + ", ".join(js(b["count"]) + " “" + b["box"].lower() + "”" for b in A["boxes"]) + ".") if A["sorted"] else "Sort the mistakes into the action boxes first: none sorted yet."
    else: a = "Action list: not known (no action tool)."
    L.append("• " + a)
    if m6: L.append("NOTE: person answers — " + m6[1] + ". Real people make mistakes.")
    return "\n".join(L)


WRITERS = [(re.compile("inspector", re.I), w_inspector), (re.compile("analyst", re.I), w_analyst), (re.compile("writer", re.I), w_writer)]
SYSTEM_PROMPTS, CALLS = {}, []


class ScriptedLLM(BaseLLM):
    """Rules, NOT a language model: 1) call each tool of the agent once, in order; 2) fill the sentence pattern of the
    agent's role from the tool results and the context; 3) with slips=N, change N numbers in the first draft on purpose;
    after a guardrail send-back, remove the numbers the check named."""
    slips: int = 0

    def call(self, messages, tools=None, callbacks=None, available_functions=None, from_task=None, from_agent=None, response_model=None):
        msgs = [{"role": "user", "content": messages}] if isinstance(messages, str) else [dict(m) for m in messages]
        sysm, user = msgs[0]["content"], msgs[1]["content"]
        role = from_agent.role if from_agent is not None else re.match(r"You are (.+?)\. ", sysm).group(1)
        SYSTEM_PROMPTS.setdefault(role, sysm); CALLS.append(role)
        names = re.findall(r"^Tool Name: (\S+)$", sysm, re.M)
        facts = {}
        for m in msgs[2:]:
            for name, obs in re.findall(r"Action: (\S+)\nAction Input: .*?\nObservation: (.*)", str(m.get("content") or ""), re.S):
                try: facts[name] = json.loads(obs.strip())
                except Exception: facts[name] = obs.strip()
        nxt = [n for n in names if n not in facts]
        if nxt:
            return "Thought: I need the facts from %s. I will call it.\nAction: %s\nAction Input: {}" % (nxt[0], nxt[0])
        i = user.find("This is the context you're working with:\n")
        ctx = "" if i < 0 else re.sub(r"\n\nBegin! [\s\S]*$", "", user[i + 41:])
        vi = re.match(r"^### Previous attempt failed validation: ([\s\S]*?)\n\n\n### Previous result:\n([\s\S]*?)\n\n\nTry again, making sure to address the validation error\.$", ctx)
        if vi:
            return "Thought: The check says some numbers are not in the tool results.\nFinal Answer: " + fix_draft(vi.group(2), vi.group(1))
        w = [f for t, f in WRITERS if t.search(role)]
        text = w[0](facts, ctx) if w else role + " — no pattern"
        if self.slips: text = slip(text, self.slips, json.dumps(facts, separators=(",", ":"), ensure_ascii=False) + " " + ctx)
        return "Thought: I now know the final answer.\nFinal Answer: " + text


# ---------- the crew (same texts as the JavaScript cells) ----------
brain = ScriptedLLM(model="scripted-rules")
def hire():
    """the 3 workers (fresh objects for each crew: CrewAI sets a crew's step_callback only on agents that have none yet)"""
    return (Agent(role="Line Inspector", goal="State the facts of the last shift, with the exact numbers from your tool.",
                  backstory="You watch the solar-cell line every shift. You never guess a number: you read it from the logbook.", tools=[shift_stats], llm=brain),
            Agent(role="Root-cause Analyst", goal="Find where the failures cluster, and give the evidence numbers.",
                  backstory="You compare groups of cells to find the weak spots. Every claim you make has a number from a tool.", tools=[slice_table, worst_cases], llm=brain),
            Agent(role="Report Writer", goal="Write a one-page shift quality report for the plant manager.",
                  backstory="You write short and plain. You use only numbers from your tools and from the other workers.", tools=[action_list], llm=brain))
inspector, analyst, writer = hire()
D = dict(
    i=("Read the facts of the last shift with your tool and state them.", "Cells checked, lanes per 1,000 cells, defects passed (per 100, with the target), good cells stopped, person checks, reshoots."),
    f=("Find where the failures cluster: mono vs poly, expert-sure vs expert-unsure cells. List the missed defects.", "The weaker group in each pair with its numbers, the missed defects and the worst false alarms with ids and scores."),
    w=("Write the shift quality report for the plant manager.", "One page: result vs the target (at most 5 of 100 defects pass), cost in person checks, where it fails, top 3 actions."))


def tasks(writer_context, writer_agent=None, guardrail=None, crew=None):
    ins, ana, wri = crew or (inspector, analyst, writer)
    writer_agent = writer_agent or wri
    t1 = Task(description=D["i"][0], expected_output=D["i"][1], agent=ins)
    t2 = Task(description=D["f"][0], expected_output=D["f"][1], agent=ana, context=[t1])
    kw = dict(guardrail=guardrail, guardrail_max_retries=1) if guardrail else {}
    t3 = Task(description=D["w"][0], expected_output=D["w"][1], agent=writer_agent, context=writer_context(t1, t2), **kw)
    return t1, t2, t3


def fact_numbers(v):
    if isinstance(v, bool): return []
    if isinstance(v, (int, float)): return [v]
    if isinstance(v, dict): v = list(v.values())
    return [x for item in v for x in fact_numbers(item)] if isinstance(v, list) else []


def facts():
    return {n: json.loads(t.run()) for n, t in [("shift_stats", shift_stats), ("slice_table", slice_table), ("worst_cases", worst_cases), ("action_list", action_list)]}


def check_report(text, f):
    known = fact_numbers(f)
    clean = re.sub(r"(\d),(\d{3})", r"\1\2", re.sub(r"per 1,000|per 100", " ", text))
    wrong = []
    for tok in re.findall(r"\d+(?:\.\d+)?", clean):
        dp = len(tok.split(".")[1]) if "." in tok else 0
        if not any(abs(k - float(tok)) <= 0.5 * 10 ** -dp for k in known): wrong.append(tok)
    return {"ok": len(wrong) == 0, "wrong": wrong}


def report_guardrail(output):
    c = check_report(output.raw, facts())
    return (True, output.raw) if c["ok"] else (False, "These numbers are not in the tool results: " + ", ".join(c["wrong"]))


OK = []
def same(what, a, b):
    ok = a == b; OK.append(ok)
    print(("SAME  " if ok else "DIFF  ") + what)
    if not ok:
        print("   python:", json.dumps(a, ensure_ascii=False)[:1500]); print("   js    :", json.dumps(b, ensure_ascii=False)[:1500])


print("crewai", crewai.__version__, "| JS runner:", IN.get("crew_js"), "| inputs:", IN["source"])
F = facts()
same("tool results (4 tools)", F, JS["tools"])

# run 1 of 6d: writer first, no context
t1, t2, t3 = tasks(lambda a, b: [])
poor = Crew(agents=[inspector, analyst, writer], tasks=[t3, t1, t2], process=Process.sequential).kickoff()
same("6d run 1 (writer first, context []): the poor report", [o.raw for o in poor.tasks_output if o.agent == "Report Writer"][0], JS["poor"])

# writer first WITH context of later tasks: refused at Crew(...)
t1, t2, t3 = tasks(lambda a, b: [a, b])
try:
    Crew(agents=[inspector, analyst, writer], tasks=[t3, t1, t2]); err = None
except Exception as e:
    err = str(e)
print("future-task context ->", (err or "NOT REFUSED")[:200])
OK.append(bool(err and "context dependency on a future task" in err))

# 6e: the crew in the right order, with step_callback
SYSTEM_PROMPTS.clear(); steps = []
crew3 = hire()
t1, t2, t3 = tasks(lambda a, b: [a, b], crew=crew3)
res = Crew(agents=list(crew3), tasks=[t1, t2, t3], process=Process.sequential, step_callback=lambda s: steps.append(s)).kickoff()
same("6e task outputs (inspector, analyst, writer)", [o.raw for o in res.tasks_output], JS["outs"])
same("system prompts the model is given (6c badges)", [SYSTEM_PROMPTS.get(r) for r in ("Line Inspector", "Root-cause Analyst", "Report Writer")], JS["prompts"])
tool_calls = [getattr(s, "tool", None) for s in steps if getattr(s, "tool", None)]
same("tool calls in order (step_callback)", tool_calls, [t.split(":")[1] for t in JS["trace_types"] if t.startswith("tool_call")])
print("step_callback got", len(steps), "steps:", sorted(set(type(s).__name__ for s in steps)))

# 6f: the checker on the planted copy and on the real report, then the guardrail with a sloppy scripted writer
same("checker on the planted copy", check_report(JS["planted"], F), JS["on_planted"])
same("checker on the real report", check_report(res.raw, F), JS["on_real"])
sloppy = Agent(role=writer.role, goal=writer.goal, backstory=writer.backstory, tools=writer.tools, llm=ScriptedLLM(model="scripted-rules", slips=2))
drafts = []
def guard(output):
    r = report_guardrail(output); drafts.append({"raw": output.raw, "ok": r[0], "feedback": None if r[0] else r[1]}); return r
t1, t2, t3 = tasks(lambda a, b: [a, b], writer_agent=sloppy, guardrail=guard)
g = Crew(agents=[inspector, analyst, sloppy], tasks=[t1, t2, t3]).kickoff()
same("guardrail drafts (draft 1 sent back, draft 2 passes)", drafts, JS["guarded"])
same("guarded final report", g.raw, JS["guarded_final"])

print("\n=== PYTHON CREWAI REPORT ===\n" + res.raw)
print("\nTWIN MATCHES" if all(OK) else "\nTWIN DIFFERS (%d of %d items)" % (OK.count(False), len(OK)))
sys.exit(0 if all(OK) else 1)
