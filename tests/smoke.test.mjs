// Minimal Foundry mock: enough to open, roll and render the dialog.
const hooks = {};
globalThis.Hooks = { once: (n, f) => (hooks[n] ??= []).push(f), on: (n, f) => (hooks[n] ??= []).push(f) };
const settings = {};
const errors = [];
globalThis.ui = { notifications: { info: () => {}, warn: (m) => errors.push(m), error: (m) => errors.push(m) } };
globalThis.CONST = { GRID_TYPES: { SQUARE: 1 }, DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0 }, TABLE_RESULT_TYPES: { TEXT: "text" } };
class ApplicationV2 {
  #s = 0;
  constructor(o = {}) { this.options = { ...this.constructor.DEFAULT_OPTIONS, ...o }; }
  get state() { return this.#s; }          // read-only, like Foundry
  get rendered() { return this.#s === 2; }
  async render() { const html = await this._renderHTML(); this._replaceHTML(html, { set innerHTML(v) { this.v = v; }, querySelectorAll: () => [] }); this.#s = 2; this.lastHTML = html; return this; }
  async close() { this.#s = 0; }
}
globalThis.foundry = { applications: { api: { ApplicationV2 } }, utils: { deepClone: (x) => structuredClone(x) } };
const folder = { name: "Terrain Forge", folder: null };
const mkTable = (id, name, results) => ({ id, name, folder, description: "<p>Rolls: 1</p>", roll: async () => ({ results: [results[Math.floor(Math.random() * results.length)]] }) });
const tables = [
  mkTable("t1", "Forest: Cover", [{ name: "a fallen oak", description: "Cover." }]),
  mkTable("t2", "Forest: Hazards (hidden)", [{ name: "Snare", description: "Trap." }])
];
const scene = { id: "s1", name: "Forest test", width: 2040, height: 1530, grid: { size: 102 }, flags: { "terrain-forge": { biome: "Forest", prompt: "p", rolled: [], model: "fal-ai/flux-2-pro" } }, getFlag(m, k) { return this.flags[m]?.[k]; } };
globalThis.game = {
  settings: { register: (m, k, o) => (settings[k] = o.default), get: (m, k) => settings[k] },
  modules: new Map([["terrain-forge", {}]]),
  user: { isGM: true }, tables, scenes: { get: (id) => (id === "s1" ? scene : null) }
};
globalThis.canvas = { scene };
await import("../scripts/main.mjs");
hooks.init.forEach((f) => f()); hooks.ready.forEach((f) => f());
const api = game.modules.get("terrain-forge").api;

const app = await api.open();
if (!app?.lastHTML?.includes("Roll")) throw new Error("dialog did not render: " + errors.join(" | "));
const Forge = app.constructor;
await Forge.onRoll.call(app);
if (app.tf.rolled.length !== 2 || app.tf.prompt.includes("Snare")) throw new Error("roll/prompt wrong");
await app.close(); const again = await api.open();
if (again.tf.rolled.length !== 2) throw new Error("state not remembered");
await api.open(scene);
if (!again.lastHTML.includes("Loaded from") || again.tf.targetSceneId !== "s1") throw new Error("reforge load failed");
if (!again.lastHTML.includes("Replace map")) throw new Error("replace label missing");
Forge.onFresh.call(again); await again.render();
if (again.tf.targetSceneId) throw new Error("fresh did not reset");
if (errors.length) throw new Error("errors: " + errors.join(" | "));
console.log("smoke test passes: open, roll, hidden-stays-out, remember, reforge-load, fresh");
