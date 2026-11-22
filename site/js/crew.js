/* PanelGuard — MiniCrew: a small CrewAI-style runner in JavaScript (window.MiniCrew).
   Real CrewAI is a Python library and cannot run in a browser. This file keeps the same ideas and names
   (Agent role/goal/backstory/tools, Task description/expected_output/agent/context/guardrail, Crew agents/tasks/process,
   kickoff, step_callback) and the same prompt text as CrewAI 1.15 (its translations/en.json), so the Python twin
   (tools/research/step6_twin.py) runs the same crew in real CrewAI.
   Agent loop: model decides -> tool call -> tool result -> ... -> final answer. Every step goes into a trace.
   Brains: ScriptedLLM (rules, NOT a language model: it works with no key and no network), AnthropicLLM and OpenAILLM
   (real models, key kept in a closure: never a property, never stored, never logged). */
(function (G) {
'use strict';

var VERSION = '1.0 (CrewAI-style; prompts from crewai 1.15)';
var DIVIDERS = '\n\n----------\n\n';
var P = {   /* prompt slices, copied from crewai 1.15 translations/en.json */
  role: 'You are {role}. {backstory}\nYour personal goal is: {goal}',
  tools: '\nYou ONLY have access to the following tools, and should NEVER make up tools that are not listed here:\n\n{tools}\n\nIMPORTANT: Use the following format in your response:\n\n```\nThought: you should always think about what to do\nAction: the action to take, only one name of [{tool_names}], just the name, exactly as it\'s written.\nAction Input: the input to the action, just a simple JSON object, enclosed in curly braces, using " to wrap keys and values.\nObservation: the result of the action\n```\n\nOnce all necessary information is gathered, return the following format:\n\n```\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n```',
  task: '\nCurrent Task: {input}\n\nBegin! This is VERY important to you, use the tools available and give your best Final Answer, your job depends on it!\n\nThought:',
  nativeTask: '\nCurrent Task: {input}',
  expected: '\nThis is the expected criteria for your final answer: {expected_output}\nyou MUST return the actual complete content as the final answer, not a summary.',
  withContext: "{task}\n\nThis is the context you're working with:\n{context}",
  postTool: 'Analyze the tool result. If requirements are met, provide the Final Answer. Otherwise, call the next tool. Deliver only the answer without meta-commentary.',
  validation: '### Previous attempt failed validation: {err}\n\n\n### Previous result:\n{out}\n\n\nTry again, making sure to address the validation error.'
};
function fill(t, o) { return t.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
function CrewError(msg) { var e = new Error(msg); e.name = 'CrewError'; e.plain = true; return e; }
function str(x) { return typeof x === 'string' ? x : JSON.stringify(x); }
function only(o, allowed, what) {
  if (!o || typeof o !== 'object') throw CrewError(what + ' needs one object: ' + what + '({ ' + allowed.slice(0, 3).join(', ') + ', … }).');
  Object.keys(o).forEach(function (k) { if (allowed.indexOf(k) < 0) throw CrewError(what + ' has no option “' + k + '”. Its options: ' + allowed.join(', ') + '.'); });
}

/* ---------- tool ---------- */
function tool(spec) {
  only(spec, ['name', 'description', 'args', 'run'], 'tool');
  if (typeof spec.name !== 'string' || !/^[a-z][a-z0-9_]*$/.test(spec.name)) throw CrewError('A tool name is text in small letters with _ , in quotes, e.g. \'line_speed\'. Got: ' + (typeof spec.name === 'string' ? '“' + spec.name + '”' : String(spec.name)) + '.');
  if (typeof spec.description !== 'string' || spec.description.trim().length < 10) throw CrewError('Tool ' + spec.name + ' needs a description (a sentence): the model reads it to decide when to use the tool.');
  if (typeof spec.run !== 'function') throw CrewError('Tool ' + spec.name + ' needs run: a function that returns the facts.');
  var args = spec.args || {}, props = {};
  Object.keys(args).forEach(function (k) { props[k] = { type: args[k] }; });
  var schema = { properties: props, type: 'object', additionalProperties: false, required: Object.keys(args) };
  var t = { kind: 'tool', name: spec.name, description: spec.description, args: args, schema: schema, run: spec.run };
  t.formatted = 'Tool Name: ' + spec.name + '\nTool Arguments: ' + JSON.stringify({ properties: props, title: spec.name.split('_').map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('_'), type: 'object', additionalProperties: false, required: Object.keys(args) }, null, 2) + '\nTool Description: ' + spec.description;
  return t;
}
function isTool(t) { return t && t.kind === 'tool' && typeof t.run === 'function'; }

/* ---------- Agent ---------- */
var AGENT_OPTS = ['role', 'goal', 'backstory', 'tools', 'llm', 'max_iter', 'verbose'];
function Agent(o) {
  if (!(this instanceof Agent)) throw CrewError('Write new Agent({ … }).');
  only(o, AGENT_OPTS, 'Agent');
  ['role', 'goal', 'backstory'].forEach(function (k) { if (typeof o[k] !== 'string' || !o[k].trim()) throw CrewError('Agent needs ' + k + ': a piece of text in quotes.'); });
  var tools = o.tools == null ? [] : o.tools;
  if (!Array.isArray(tools)) throw CrewError('Agent “' + o.role + '”: tools must be a list in square brackets, e.g. [shiftStats].');
  tools.forEach(function (t, i) { if (!isTool(t)) throw CrewError('Agent “' + o.role + '”: item ' + (i + 1) + ' in tools is not a tool (' + (t === undefined ? 'undefined — was its cell run?' : typeof t) + ').'); });
  this.role = o.role; this.goal = o.goal; this.backstory = o.backstory; this.tools = tools.slice();
  this.llm = o.llm || null; this.max_iter = o.max_iter || 8; this.verbose = !!o.verbose;
}
Agent.prototype.systemPrompt = function (native) {
  var s = fill(P.role, { role: this.role, backstory: this.backstory, goal: this.goal });
  if (!native && this.tools.length) s += fill(P.tools, { tools: this.tools.map(function (t) { return t.formatted; }).join('\n'), tool_names: this.tools.map(function (t) { return t.name; }).join(', ') });
  return s;
};
Agent.prototype.toString = function () { return 'Agent(' + this.role + ')'; };

/* ---------- Task ---------- */
var TASK_OPTS = ['description', 'expected_output', 'agent', 'context', 'guardrail', 'guardrail_max_retries', 'name'];
function Task(o) {
  if (!(this instanceof Task)) throw CrewError('Write new Task({ … }).');
  only(o, TASK_OPTS, 'Task');
  if (typeof o.description !== 'string' || !o.description.trim()) throw CrewError('Task needs description: what to do, in quotes.');
  if (typeof o.expected_output !== 'string' || !o.expected_output.trim()) throw CrewError('Task needs expected_output: what a good answer looks like, in quotes.');
  if (o.agent != null && !(o.agent instanceof Agent)) throw CrewError('Task agent must be an Agent (got ' + typeof o.agent + ').');
  if (o.context !== undefined && !Array.isArray(o.context)) throw CrewError('Task context must be a list of tasks in square brackets, e.g. [inspectShift] — or [] for none.');
  (o.context || []).forEach(function (c, i) { if (!(c instanceof Task)) throw CrewError('Task context item ' + (i + 1) + ' is not a Task (' + (c === undefined ? 'undefined' : typeof c) + ').'); });
  if (o.guardrail != null && typeof o.guardrail !== 'function') throw CrewError('Task guardrail must be a function: (output) => [true, output.raw] or [false, \'what is wrong\'].');
  this.description = o.description; this.expected_output = o.expected_output; this.agent = o.agent || null; this.name = o.name || null;
  this.context = o.context === undefined ? undefined : o.context.slice();            // undefined = not specified: all earlier outputs
  this.guardrail = o.guardrail || null; this.guardrail_max_retries = o.guardrail_max_retries == null ? 3 : o.guardrail_max_retries;
  this.output = null;
}
Task.prototype.prompt = function (context, native) {
  var t = this.description + fill(P.expected, { expected_output: this.expected_output });
  if (context) t = fill(P.withContext, { task: t, context: context });
  return fill(native ? P.nativeTask : P.task, { input: t });
};
function short(t) { return t.description.length > 60 ? t.description.slice(0, 57) + '…' : t.description; }

/* ---------- Crew ---------- */
var Process = Object.freeze({ sequential: 'sequential', hierarchical: 'hierarchical' });
var CREW_OPTS = ['agents', 'tasks', 'process', 'step_callback', 'task_callback', 'verbose'];
function Crew(o) {
  if (!(this instanceof Crew)) throw CrewError('Write new Crew({ … }).');
  only(o, CREW_OPTS, 'Crew');
  if (!Array.isArray(o.agents) || !o.agents.length) throw CrewError('Crew needs agents: a list of your workers in square brackets.');
  if (!Array.isArray(o.tasks) || !o.tasks.length) throw CrewError('Crew needs tasks: a list of jobs in square brackets, in the order they run.');
  o.agents.forEach(function (a, i) { if (!(a instanceof Agent)) throw CrewError('Crew agents item ' + (i + 1) + ' is not an Agent (' + (a === undefined ? 'undefined' : typeof a) + ').'); });
  o.tasks.forEach(function (t, i) { if (!(t instanceof Task)) throw CrewError('Crew tasks item ' + (i + 1) + ' is not a Task (' + (t === undefined ? 'undefined' : typeof t) + ').'); if (!t.agent) throw CrewError('Task “' + short(t) + '” has no agent.'); });
  if ('process' in o && o.process === undefined) throw CrewError('There is no such process: Process has only sequential (and hierarchical, not built here).');
  var proc = o.process || Process.sequential;
  if (proc === Process.hierarchical) throw CrewError('This lab runs only Process.sequential (jobs one after another). CrewAI also has hierarchical (a manager model hands out jobs); it is not built here.');
  if (proc !== Process.sequential) throw CrewError('Unknown process “' + proc + '”. Use Process.sequential.');
  /* same rule as CrewAI's validate_context_no_future_tasks */
  var idx = new Map(); o.tasks.forEach(function (t, i) { idx.set(t, i); });
  o.tasks.forEach(function (t) { (t.context || []).forEach(function (c) { if (idx.has(c) && idx.get(c) > idx.get(t)) throw CrewError("Task '" + t.description + "' has a context dependency on a future task '" + c.description + "', which is not allowed."); }); });
  if (o.step_callback != null && typeof o.step_callback !== 'function') throw CrewError('step_callback must be a function, e.g. (step) => trace.push(step).');
  this.agents = o.agents.slice(); this.tasks = o.tasks.slice(); this.process = proc;
  this.step_callback = o.step_callback || null; this.task_callback = o.task_callback || null; this.verbose = !!o.verbose;
}
Crew.prototype.kickoff = async function () {
  var self = this, outs = [], trace = [], t0 = Date.now();
  var emit = function (ev) { ev.n = trace.length; ev.ms = Date.now() - t0; trace.push(ev); if (self.step_callback) { try { self.step_callback(Object.assign({}, ev)); } catch (e) { throw CrewError('step_callback failed: ' + (e && e.message || e)); } } };
  this.tasks.forEach(function (t) { t.output = null; });
  for (var i = 0; i < this.tasks.length; i++) {
    var task = this.tasks[i], ctx;
    if (task.context === undefined) ctx = outs.map(function (o) { return o.raw; }).join(DIVIDERS);
    else { var have = task.context.filter(function (c) { return c.output; }); ctx = have.map(function (c) { return c.output.raw; }).join(DIVIDERS);
      task.context.forEach(function (c) { if (!c.output) emit({ type: 'note', agent: task.agent.role, task: i, text: 'Context job “' + short(c) + '” has not run yet: nothing to read from it.' }); }); }
    emit({ type: 'task_start', agent: task.agent.role, task: i, text: task.description, context: ctx });
    var out = await runTask(task, i, ctx, emit);
    outs.push(out); task.output = out;
    if (this.task_callback) this.task_callback(out);
  }
  var last = outs[outs.length - 1];
  return { raw: last.raw, tasks_output: outs, trace: trace, ms: Date.now() - t0, toString: function () { return last.raw; } };
};

async function runTask(task, i, ctx, emit) {
  var agent = task.agent, attempts = [], raw = await runAgent(agent, task, i, ctx, emit), k = 0;
  while (task.guardrail) {
    var out = { raw: raw, description: task.description, agent: agent.role }, g;
    try { g = await task.guardrail(out); } catch (e) { throw CrewError('The guardrail of “' + short(task) + '” crashed: ' + (e && e.message || e)); }
    if (!Array.isArray(g) || g.length !== 2 || typeof g[0] !== 'boolean') throw CrewError('A guardrail must return a pair: [true, result] or [false, \'what is wrong\']. Got: ' + str(g));
    attempts.push({ raw: raw, ok: g[0], feedback: g[0] ? null : String(g[1]) });
    emit({ type: 'guardrail', agent: agent.role, task: i, ok: g[0], text: g[0] ? 'Check passed.' : String(g[1]), attempt: k + 1 });
    if (g[0]) { if (g[1] == null) throw CrewError('Task guardrail returned None as result. This is not allowed.'); raw = typeof g[1] === 'string' ? g[1] : raw; break; }
    if (k >= task.guardrail_max_retries) { var e = CrewError('Task failed guardrail validation after ' + task.guardrail_max_retries + ' retries. Last error: ' + g[1]); e.attempts = attempts; throw e; }
    k++;
    emit({ type: 'sent_back', agent: agent.role, task: i, text: 'Sent back to ' + agent.role + ' (retry ' + k + ' of ' + task.guardrail_max_retries + ').' });
    raw = await runAgent(agent, task, i, fill(P.validation, { err: g[1], out: raw }), emit);    // as in CrewAI: the retry's context is the validation error
  }
  return { description: task.description, expected_output: task.expected_output, agent: agent.role, raw: raw, attempts: attempts };
}

async function runAgent(agent, task, i, ctx, emit) {
  var llm = agent.llm || defaultLLM(), native = llm.kind !== 'scripted';
  var msgs = [{ role: 'system', content: agent.systemPrompt(native) }, { role: 'user', content: task.prompt(ctx, native) }];
  var byName = {}; agent.tools.forEach(function (t) { byName[t.name] = t; });
  for (var it = 0; it < agent.max_iter + 1; it++) {
    var noTools = it >= agent.max_iter, r;
    if (noTools) msgs.push({ role: 'user', content: 'You reached the step limit (' + agent.max_iter + '). Give your best final answer now, without tools.' });
    try { r = await llm.call(msgs, noTools ? [] : agent.tools, { agent: agent, task: task }); }
    catch (e) { var err = CrewError((llm.kind === 'scripted' ? 'The scripted model failed: ' : llm.label + ' call failed: ') + (e && e.message || String(e))); err.llm = true; throw err; }
    if (r.thought) emit({ type: 'thought', agent: agent.role, task: i, text: r.thought });
    var calls = r.toolCalls || [];
    if (!calls.length) {
      var fin = r.final == null ? '' : String(r.final);
      emit({ type: 'answer', agent: agent.role, task: i, text: fin });
      return fin;
    }
    msgs.push({ role: 'assistant', content: r.thought || '', toolCalls: calls });
    for (var c = 0; c < calls.length; c++) {
      var call = calls[c], t = byName[call.name], res;
      emit({ type: 'tool_call', agent: agent.role, task: i, tool: call.name, args: call.args || {}, text: call.name + '(' + JSON.stringify(call.args || {}) + ')' });
      if (!t) res = 'Error: tool “' + call.name + '” does not exist. Use one of [' + agent.tools.map(function (x) { return x.name; }).join(', ') + '].';
      else { try { res = await t.run(call.args || {}); } catch (e2) { res = 'Error: the tool failed: ' + (e2 && e2.message || e2); } }
      var obs = str(res);
      emit({ type: 'tool_result', agent: agent.role, task: i, tool: call.name, result: typeof res === 'string' ? res : JSON.parse(obs), text: obs });
      msgs.push({ role: 'tool', toolCallId: call.id, name: call.name, content: obs });
    }
    msgs.push({ role: 'user', content: P.postTool });
  }
  throw CrewError(agent.role + ' gave no final answer.');
}

/* ---------- the scripted brain (rules, not a language model) ---------- */
var WRITERS = [];
function ScriptedLLM(o) {
  if (!(this instanceof ScriptedLLM)) throw CrewError('Write new ScriptedLLM().');
  o = o || {}; only(o, ['slips'], 'ScriptedLLM');
  this.kind = 'scripted'; this.model = 'scripted-rules'; this.label = 'Scripted model'; this.slips = o.slips || 0;
}
/* Rule 1: call every tool the agent has, once, in order. Rule 2: then fill the sentence pattern registered for the
   agent's role with the tool results and the context. Rule 3 (only with slips): the first draft of a final answer gets
   that many numbers changed on purpose; a draft sent back by a guardrail is written again cleanly. */
ScriptedLLM.prototype.call = async function (msgs, tools, meta) {
  var facts = {}, n = 0;
  msgs.forEach(function (m) { if (m.role === 'tool') { n++; try { facts[m.name] = JSON.parse(m.content); } catch (e) { facts[m.name] = m.content; } } });
  var next = tools.filter(function (t) { return !(t.name in facts); })[0];
  if (next) return { thought: 'I need the facts from ' + next.name + '. I will call it.', toolCalls: [{ id: 'call_' + (n + 1), name: next.name, args: {} }] };
  var user = msgs[1].content, ci = user.indexOf("This is the context you're working with:\n"), context = ci < 0 ? '' : user.slice(ci + 41).replace(/\n\nBegin! [\s\S]*$/, '');
  var vi = context.match(/^### Previous attempt failed validation: ([\s\S]*?)\n\n\n### Previous result:\n([\s\S]*?)\n\n\nTry again, making sure to address the validation error\.$/);
  if (vi) return { thought: 'The check says some numbers are not in the tool results. My tools cannot give those numbers again, so I remove them instead of guessing.', final: fixDraft(vi[2], vi[1]) };
  var role = meta.agent.role, w = WRITERS.filter(function (x) { return x.test.test(role); })[0];
  var text = w ? w.write({ facts: facts, context: context, role: role }) : generic(role, facts, context);
  if (this.slips) text = slip(text, this.slips, JSON.stringify(facts) + ' ' + context);
  return { thought: 'I now know the final answer.', final: text };
};
/* after a send-back (CrewAI gives back only the error and the old draft): remove the numbers the check named */
function fixDraft(prev, err) {
  var list = (err.split(':').slice(1).join(':').match(/\d+(?:\.\d+)?/g) || []), out = prev;
  list.forEach(function (tok) { out = out.replace(new RegExp('(^|[^\\d.,])' + tok.replace('.', '\\.') + '(?![\\d]|\\.\\d|,\\d)'), function (m, a) { return a + '[removed]'; }); });
  return out + '\nCHECK: numbers the checker could not find in the tool results were removed.';
}
function generic(role, facts, context) {
  var k = Object.keys(facts);
  return role + ' — answer (no sentence pattern for this role, so the scripted model lists its tool results):\n' + (k.length ? k.map(function (n) { return '• ' + n + ': ' + JSON.stringify(facts[n]); }).join('\n') : '• no tool results') + (context ? '\n• context received: ' + context.split('\n')[0] : '');
}
/* change `count` numbers on purpose: the first whole numbers after “RESULT:” and “COST:” lines (or the first ones found) */
function numsIn(s) { var o = []; String(s).replace(/(\d),(\d{3})/g, '$1$2').replace(/\d+(?:\.\d+)?/g, function (m) { o.push(+m); return m; }); return o; }
function slip(text, count, seen) {
  var known = numsIn(seen), lines = text.split('\n'), done = 0, order = [];
  lines.forEach(function (l, i) { if (/^(RESULT|COST):/.test(l)) order.push(i); });
  lines.forEach(function (l, i) { if (order.indexOf(i) < 0) order.push(i); });
  for (var q = 0; q < order.length && done < count; q++) {
    var i = order[q], m = /(?<![\d.,])(?<!per )(\d+)(?!\d|[.,]\d)/.exec(lines[i]);
    if (!m) continue;
    var v = +m[1], c = v + 2; while (known.some(function (k) { return Math.abs(k - c) <= 0.5; })) c++;
    lines[i] = lines[i].slice(0, m.index) + c + lines[i].slice(m.index + m[1].length); done++;
  }
  return lines.join('\n');
}
ScriptedLLM.register = function (roleTest, write) { WRITERS = WRITERS.filter(function (w) { return String(w.test) !== String(roleTest); }); WRITERS.push({ test: roleTest, write: write }); };
var DEF = null; function defaultLLM() { return DEF || (DEF = new ScriptedLLM()); }

/* ---------- real models (browser -> provider; key in a closure only) ---------- */
function redactor(key) { return function (s) { s = String(s == null ? '' : s); if (key && key.length > 3) { s = s.split(key).join('[key hidden]'); if (key.length >= 12) s = s.split(key.slice(0, 8)).join('[key hidden]'); } return s; }; }
function netCall(url, init, red) {
  var f = MiniCrew.fetch || G.fetch;
  if (typeof f !== 'function') return Promise.reject(new Error('this page has no fetch()'));
  return f.call(G, url, init).then(function (r) {
    return r.text().then(function (t) {
      if (!r.ok) { var j = null; try { j = JSON.parse(t); } catch (e) {} var m = j && (j.error && (j.error.message || j.error.type) || j.message) || t.slice(0, 200); throw new Error('HTTP ' + r.status + ': ' + red(m)); }
      try { return JSON.parse(t); } catch (e) { throw new Error('the answer was not JSON'); }
    });
  }, function (e) { throw new Error('NETWORK: the call did not reach the provider (' + red(e && e.message || e) + ')'); });
}
function schemaOf(t) { return { type: 'object', properties: t.schema.properties, required: t.schema.required }; }
function AnthropicLLM(o) {
  if (!(this instanceof AnthropicLLM)) throw CrewError('Write new AnthropicLLM({ … }).');
  o = o || {}; var key = String(o.apiKey || ''), red = redactor(key), self = this;
  if (!key) throw CrewError('No key in the key slot.'); if (!o.model) throw CrewError('Type a model name.');
  this.kind = 'anthropic'; this.model = String(o.model); this.label = 'Anthropic ' + this.model; this.maxTokens = o.maxTokens || 1500;
  this.url = o.baseURL ? String(o.baseURL).replace(/\/+$/, '') + '/v1/messages' : 'https://api.anthropic.com/v1/messages';
  this.call = function (msgs, tools) {
    var sys = msgs[0].content, out = [];
    msgs.slice(1).forEach(function (m) {
      var role = m.role === 'assistant' ? 'assistant' : 'user', content;
      if (m.role === 'assistant') { content = []; if (m.content) content.push({ type: 'text', text: m.content }); (m.toolCalls || []).forEach(function (c) { content.push({ type: 'tool_use', id: c.id, name: c.name, input: c.args || {} }); }); }
      else if (m.role === 'tool') content = [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }];
      else content = [{ type: 'text', text: m.content }];
      var last = out[out.length - 1]; if (last && last.role === role) last.content = last.content.concat(content); else out.push({ role: role, content: content });
    });
    var body = { model: self.model, max_tokens: self.maxTokens, system: sys, messages: out };
    if (tools.length) body.tools = tools.map(function (t) { return { name: t.name, description: t.description, input_schema: schemaOf(t) }; });
    return netCall(self.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body) }, red).then(function (j) {
      var blocks = j.content || [], text = blocks.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n').trim();
      var calls = blocks.filter(function (b) { return b.type === 'tool_use'; }).map(function (b) { return { id: b.id, name: b.name, args: b.input || {} }; });
      return calls.length ? { thought: text || 'I will call ' + calls.map(function (c) { return c.name; }).join(', ') + '.', toolCalls: calls } : { thought: null, final: text };
    });
  };
}
function OpenAILLM(o) {
  if (!(this instanceof OpenAILLM)) throw CrewError('Write new OpenAILLM({ … }).');
  o = o || {}; var key = String(o.apiKey || ''), red = redactor(key), self = this;
  if (!key) throw CrewError('No key in the key slot.'); if (!o.model) throw CrewError('Type a model name.');
  this.kind = 'openai'; this.model = String(o.model); this.label = 'OpenAI-compatible ' + this.model;
  this.url = String(o.baseURL || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions';
  this.call = function (msgs, tools) {
    var out = msgs.map(function (m) {
      if (m.role === 'assistant') { var a = { role: 'assistant', content: m.content || null }; if (m.toolCalls && m.toolCalls.length) a.tool_calls = m.toolCalls.map(function (c) { return { id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args || {}) } }; }); return a; }
      if (m.role === 'tool') return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
      return { role: m.role, content: m.content };
    });
    var body = { model: self.model, messages: out };
    if (tools.length) body.tools = tools.map(function (t) { return { type: 'function', function: { name: t.name, description: t.description, parameters: schemaOf(t) } }; });
    return netCall(self.url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify(body) }, red).then(function (j) {
      var m = j.choices && j.choices[0] && j.choices[0].message; if (!m) throw new Error('the answer had no message');
      var calls = (m.tool_calls || []).map(function (c) { var a = {}; try { a = c.function.arguments ? JSON.parse(c.function.arguments) : {}; } catch (e) {} return { id: c.id, name: c.function.name, args: a }; });
      var text = typeof m.content === 'string' ? m.content.trim() : '';
      return calls.length ? { thought: text || 'I will call ' + calls.map(function (c) { return c.name; }).join(', ') + '.', toolCalls: calls } : { thought: null, final: text };
    });
  };
}
/* the same crew with another brain: new Agent and Task objects, same text and tools (the original crew is not changed) */
function withLLM(crew, llm, extraTask) {
  var am = new Map(), tm = new Map();
  crew.agents.forEach(function (a) { am.set(a, new Agent({ role: a.role, goal: a.goal, backstory: a.backstory, tools: a.tools, llm: llm, max_iter: a.max_iter })); });
  crew.tasks.forEach(function (t) {
    var src = extraTask && extraTask.agent && extraTask.agent.role === t.agent.role && t === crew.tasks[crew.tasks.length - 1] ? extraTask : t;
    var ag = am.get(t.agent) || new Agent({ role: src.agent.role, goal: src.agent.goal, backstory: src.agent.backstory, tools: src.agent.tools, llm: llm });
    tm.set(t, new Task({ description: src.description, expected_output: src.expected_output, agent: ag, context: src.context === undefined ? undefined : src.context.map(function (c) { return tm.get(c) || c; }), guardrail: src.guardrail || undefined, guardrail_max_retries: src.guardrail_max_retries }));
  });
  return new Crew({ agents: crew.agents.map(function (a) { return am.get(a); }), tasks: crew.tasks.map(function (t) { return tm.get(t); }), process: crew.process });
}

var MiniCrew = { VERSION: VERSION, tool: tool, Agent: Agent, Task: Task, Crew: Crew, Process: Process, ScriptedLLM: ScriptedLLM, AnthropicLLM: AnthropicLLM, OpenAILLM: OpenAILLM, withLLM: withLLM, CrewError: CrewError, DIVIDERS: DIVIDERS, PROMPTS: P, fetch: null, _numsIn: numsIn };
G.MiniCrew = MiniCrew;
})(typeof window !== 'undefined' ? window : globalThis);
