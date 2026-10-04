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
const mkTable = (id, name, results) => ({ id, name, folder, results, description: "<p>Rolls: 1</p>", roll: async () => ({ results: [results[Math.floor(Math.random() * results.length)]] }) });
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
  settings: { register: (m, k, o) => (settings[k] = o.default), get: (m, k) => settings[k], set: async (m, k, v) => (settings[k] = v) },
  modules: new Map([["terrain-forge", {}]]),
  user: { id: "me", isGM: true }, users: { activeGM: { id: "other-gm" } }, tables, scenes: { get: (id) => (id === "s1" ? scene : null) }
};
globalThis.canvas = { scene };
// The private tables gist, served through a mocked GitHub API.
const GIST = "https://gist.github.com/Someone/0123456789abcdef0123";
const valeGist = { tables: [
  { folder: "Misty Vale", biome: "Magna Woods", category: "Terrain", rolls: 1, setting: "an ancient old-growth forest of oak crowns",
    results: [{ name: "a leafy forest floor", effect: "Open ground." }, { name: "an old paved road", effect: "The Magna road." }] }
] };
const gistFiles = () => ({
  "a-placeholder.json": { filename: "a-placeholder.json", content: "[]" },
  "magna-woods.json": { filename: "magna-woods.json", content: JSON.stringify(valeGist) },
  "notes.md": { filename: "notes.md", content: "not a table" }
});
let fetched = [];
globalThis.fetch = async (url) => {
  fetched.push(url);
  if (url === "https://api.github.com/gists/0123456789abcdef0123") return { ok: true, json: async () => ({ files: gistFiles() }) };
  return { ok: false, status: 404, text: async () => "" };
};
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
if (again.tf.model !== "fal-ai/gpt-image-1.5") throw new Error("a FLUX scene should reforge with the default model, got " + again.tf.model);
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
// Built-in + private tables: install, stay put, update when unedited, never clobber edits.
settings.privateTables = GIST;
const sync1 = await api.syncBuiltinTables();
if (!fetched.includes("https://api.github.com/gists/0123456789abcdef0123")) throw new Error("gist not fetched via the API");
const magna = tables.find((t) => t.name === "Magna Woods: Terrain");
if (!magna || magna.folder?.name !== "Magna Woods" || magna.folder.folder?.name !== "Misty Vale") throw new Error("Vale table not in Misty Vale/Magna Woods");
if (!sync1.kept.includes("Forest: Cover") || tables.filter((t) => t.name === "Forest: Cover").length !== 1) throw new Error("hand-made table not left alone");
if (sync1.made !== tables.filter((t) => t.flags?.["terrain-forge"]?.builtin).length) throw new Error("installed tables not flagged");
const sync2 = await api.syncBuiltinTables();
if (sync2.made || sync2.updated) throw new Error("second sync was not a no-op");
valeGist.tables[0].results[0].effect = "Open ground. Changed upstream.";
const sync3 = await api.syncBuiltinTables();
if (sync3.updated !== 1 || magna.results[0].description !== "Open ground. Changed upstream.") throw new Error("unedited table not updated");
magna.results[1].name = "the GM's own road";
valeGist.tables[0].results[0].effect = "Open ground. Changed again.";
const sync4 = await api.syncBuiltinTables();
if (sync4.updated || !sync4.kept.includes("Magna Woods: Terrain") || magna.results[1].name !== "the GM's own road") throw new Error("GM edit was overwritten");
again.tf.biome = "Magna Woods"; again.tf.counts = {};
await Forge.onRoll.call(again); await again.render();
if (!again.tf.prompt.includes("Setting: an ancient old-growth forest") || /magna/i.test(again.tf.prompt)) throw new Error("Vale prompt wrong: " + again.tf.prompt);
if (!again.lastHTML.includes('<optgroup label="Misty Vale">')) throw new Error("Misty Vale group missing from dropdown");
// A broken gist file is reported but doesn't stop the rest; no link means no fetch.
const before = errors.length;
const brokenFiles = gistFiles(); brokenFiles["zz-broken.json"] = { filename: "zz-broken.json", content: "{ nope" };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => ({ ok: true, json: async () => ({ files: brokenFiles }) });
const sync5 = await api.syncBuiltinTables();
if (!sync5 || errors.length !== before + 1 || !errors.at(-1).includes("zz-broken.json")) throw new Error("broken gist file not reported: " + errors.slice(before).join(" | "));
errors.length = before;
globalThis.fetch = realFetch; fetched = []; settings.privateTables = "";
await api.syncBuiltinTables();
if (fetched.length) throw new Error("fetched with no private link set");
// A world that saved FLUX (pre-v0.1.9 default) moves to GPT Image once; a later pick sticks.
settings.model = "fal-ai/flux-2/flash"; settings.modelMigration = 0; settings.autoTables = false;
game.users.activeGM.id = "me";
hooks.ready.forEach((f) => f()); await new Promise((r) => setTimeout(r, 0));
if (settings.model !== "fal-ai/gpt-image-1.5" || settings.modelMigration !== 1) throw new Error("model not migrated: " + settings.model);
settings.model = "fal-ai/flux-2-pro";
hooks.ready.forEach((f) => f()); await new Promise((r) => setTimeout(r, 0));
if (settings.model !== "fal-ai/flux-2-pro") throw new Error("migration ran twice");
if (errors.length) throw new Error("errors: " + errors.join(" | "));
console.log("smoke test passes: open, roll, hidden-stays-out, remember, reforge-load, fresh, import, re-import, setting, builtin + gist install/update/keep-edits, broken gist file, grouped biomes, model migration");
