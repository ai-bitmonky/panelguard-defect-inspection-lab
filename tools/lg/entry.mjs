// PanelGuard: the real LangGraph JS library, browser entry (no Node async_hooks), bundled into one global: window.LangGraph
import { AsyncLocalStorageProviderSingleton } from "@langchain/core/singletons";
// The browser has no AsyncLocalStorage (a Node.js feature). interrupt() reads the running node's config from it.
// This small stand-in keeps the config while a node's synchronous first part runs, so interrupt() works when it is
// called at the top of a node, before any await. Everything else is LangGraph's own code.
class SyncLocalStorage {
  constructor() { this._s = undefined; }
  getStore() { return this._s; }
  run(store, cb) { const prev = this._s; this._s = store; try { return cb(); } finally { this._s = prev; } }
  enterWith(store) { this._s = store; }
}
AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new SyncLocalStorage());

export { Annotation, StateGraph, START, END, MemorySaver, interrupt, Command, GraphRecursionError, INTERRUPT, isInterrupted } from "@langchain/langgraph/web";
export const VERSION = __LG_VERSION__;
