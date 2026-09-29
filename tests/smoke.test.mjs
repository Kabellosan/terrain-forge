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
// Just enough document API for importTables: folders, table create/update.
const folders = [folder];
globalThis.Folder = { create: async (d) => { const f = { id: `f${folders.length}`, name: d.name, type: d.type, folder: folders.find((x) => x.id === d.folder) ?? null }; folders.push(f); return f; } };
folder.type = "RollTable"; folder.id = "f0";
const mkDoc = (d) => {
  const t = { id: `t${tables.length + 1}`, ...d, folder: folders.find((f) => f.id === d.folder),
    results: d.results.map((r, i) => ({ ...r, id: `r${i}` })) };
  t.roll = async () => ({ results: [t.results[0]] });
  t.update = async (u) => Object.assign(t, u);
  t.deleteEmbeddedDocuments = async (type, ids) => { t.results = t.results.filter((r) => !ids.includes(r.id)); };
  t.createEmbeddedDocuments = async (type, rs) => { t.results.push(...rs.map((r, i) => ({ ...r, id: `n${i}` }))); };
  return t;
};
globalThis.RollTable = { create: async (d) => { const t = mkDoc(d); tables.push(t); return t; } };
globalThis.game = {
  folders,
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
// Import: creates the biome, re-import rewrites in place, the Setting line reaches the prompt.
const vale = { tables: [{ biome: "Vale", category: "Cover", rolls: 1, setting: "an ancient oak forest", results: [{ name: "a mossy log", effect: "Cover." }] }] };
if ((await api.importTables(JSON.stringify(vale)))?.made !== 1) throw new Error("import did not create");
const valeTable = tables.find((t) => t.name === "Vale: Cover");
vale.tables[0].results = [{ name: "a split boulder", effect: "Cover." }];
const again2 = await api.importTables(vale);
if (again2?.updated !== 1 || tables.filter((t) => t.name === "Vale: Cover").length !== 1) throw new Error("re-import duplicated");
if (valeTable.results.length !== 1 || valeTable.results[0].name !== "a split boulder") throw new Error("re-import did not replace results");
again.tf.biome = "Vale"; again.tf.counts = {};
await Forge.onRoll.call(again);
if (!again.tf.prompt.includes("Setting: an ancient oak forest.") || !again.tf.prompt.includes("a split boulder")) throw new Error("setting/result missing from prompt: " + again.tf.prompt);
const errCount = errors.length;
if ((await api.importTables("{ nope")) !== null || errors.length !== errCount + 1) throw new Error("bad JSON not reported");
errors.length = errCount;
if (errors.length) throw new Error("errors: " + errors.join(" | "));
console.log("smoke test passes: open, roll, hidden-stays-out, remember, reforge-load, fresh, import, re-import, setting");
