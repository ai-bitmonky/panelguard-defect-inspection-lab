"""PanelGuard · crew.py — Step 6: the quality crew (CrewAI) writes the shift report from the trial logbook.

    python crew.py --dry                         # no language model: runs the tools and prints the facts and the tasks
    PANELGUARD_LLM=<provider/model> python crew.py   # a real model through CrewAI (needs that provider's API key in the environment)
Every number in the report is checked against the tool facts (the guardrail); a wrong number sends the report back.
"""
import argparse, json, os, pathlib, re
os.environ.setdefault('CREWAI_DISABLE_TELEMETRY', 'true'); os.environ.setdefault('OTEL_SDK_DISABLED', 'true')
HERE = pathlib.Path(__file__).resolve().parent


def load(d):
    T = json.loads((d / 'trial.json').read_text())
    return T['report'], T['log'], T['interval']


def facts_of(R, log, iv):
    worst = sorted([r for r in log if r['decision'] == 'pass' and r['lane'] == 'pass'], key=lambda r: r['p'] or 0)[:3]
    return {'shift_stats': {'cells': R['n'], 'pass': R['lanes']['pass'], 'person': R['lanes']['person'], 'stop': R['lanes']['stop'],
                            'defects': R['all']['defects'], 'defects_passed': R['all']['passed'], 'per100': round(R['all']['per100'], 1), 'interval': [round(iv[0], 1), round(iv[1], 1)]},
            'slice_table': {'mono_per100': round(R['mono']['per100'], 1), 'poly_per100': round(R['poly']['per100'], 1)},
            'worst_cases': [{'cell': r['id'], 'score': round(r['p'], 3), 'type': r['kind']} for r in worst]}


def numbers(text): return [float(x.replace(',', '')) for x in re.findall(r'\d[\d,]*\.?\d*', text)]


def check_report(text, facts):
    known = set(numbers(json.dumps(facts)))
    wrong = [n for n in numbers(text) if not any(abs(n - k) < 0.051 for k in known) and n not in (95, 100, 1000)]
    return (True, text) if not wrong else (False, 'These numbers are not in any tool result: ' + ', '.join(map(str, wrong)) + '. Use only tool numbers.')


def main():
    a = argparse.ArgumentParser(); a.add_argument('--dry', action='store_true'); a.add_argument('--dir', default=str(HERE))
    args = a.parse_args(); R, log, iv = load(pathlib.Path(args.dir)); F = facts_of(R, log, iv)
    from crewai import Agent, Task, Crew, Process
    from crewai.tools import tool

    @tool('shift_stats')
    def shift_stats() -> str:
        """Counts of the trial shift: lanes, defects, defects passed, per 100 and its 95% interval."""
        return json.dumps(F['shift_stats'])

    @tool('slice_table')
    def slice_table() -> str:
        """Defects passed per 100 for mono and for poly cells."""
        return json.dumps(F['slice_table'])

    @tool('worst_cases')
    def worst_cases() -> str:
        """The defects that passed with the lowest scores."""
        return json.dumps(F['worst_cases'])

    if args.dry:
        print('TOOLS (no language model called):'); [print(' ', k, '->', json.dumps(v)) for k, v in F.items()]
        print('guardrail on a sample line:', check_report(f"{F['shift_stats']['defects_passed']} of {F['shift_stats']['defects']} defects passed.", F)[0])
        print('guardrail on a wrong line :', check_report('9 of 99 defects passed.', F)[0]); return
    llm = os.environ.get('PANELGUARD_LLM')
    if not llm: raise SystemExit('Set PANELGUARD_LLM to a CrewAI model string (and that provider\'s key), or run with --dry.')
    inspector = Agent(role='Shift Inspector', goal='Report the shift numbers exactly as the tools give them.', backstory='You read the line logbook every shift.', tools=[shift_stats], llm=llm)
    analyst = Agent(role='Root-cause Analyst', goal='Find why defects passed.', backstory='You compare slices and look at the worst cases.', tools=[slice_table, worst_cases], llm=llm)
    writer = Agent(role='Report Writer', goal='Write a short shift report for the plant manager.', backstory='Plain words. Only numbers from the team.', llm=llm)
    t1 = Task(description='Get the shift numbers with shift_stats.', expected_output='The counts, per 100 and the interval.', agent=inspector)
    t2 = Task(description='Explain where the defects that passed came from (mono vs poly, worst cases).', expected_output='Two or three causes with numbers.', agent=analyst, context=[t1])
    t3 = Task(description='Write the report: RESULT, CAUSES, ACTIONS. Use only numbers from the context.', expected_output='A short report.', agent=writer, context=[t1, t2],
              guardrail=lambda out: check_report(out.raw, F), guardrail_max_retries=3)
    print(Crew(agents=[inspector, analyst, writer], tasks=[t1, t2, t3], process=Process.sequential).kickoff().raw)


if __name__ == '__main__':
    main()
