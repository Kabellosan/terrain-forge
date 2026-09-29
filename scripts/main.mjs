import * as L from "./lib.mjs";
import { STARTER_TABLES } from "./starter-tables.mjs";

const MOD = "terrain-forge";
const log = (...a) => console.log("Terrain Forge |", ...a);

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  game.settings.register(MOD, "falKey", {
    name: "fal.ai API key",
    hint: "Saved on the server with your world so it survives reloads. Only GMs can change it, but players could technically read it from the browser console. Get one at fal.ai → Dashboard → Keys.",
    scope: "world", config: true, restricted: true, type: String, default: ""
  });
  game.settings.register(MOD, "endpoint", {
    name: "Image endpoint",
    hint: "Leave as https://fal.run for direct calls. Point this at your own proxy (e.g. on your VPS) if you'd rather the key never sits in a browser.",
    scope: "world", config: true, type: String, default: "https://fal.run"
  });
  game.settings.register(MOD, "model", {
    name: "Default image model",
    scope: "world", config: true, type: String, choices: L.MODELS, default: "fal-ai/flux-2/flash"
  });
  game.settings.register(MOD, "style", {
    name: "Campaign art style",
    hint: "Added to every prompt, so every map in the campaign shares one look. Change it once, not per map.",
    scope: "world", config: true, type: String,
    default: "hand-painted top-down fantasy battle map, muted natural colours, soft ambient shadows, rich ground texture, consistent painterly detail"
  });
  game.settings.register(MOD, "framing", {
    name: "Camera and framing",
    hint: "The opening of every prompt: how the map is viewed. Edit this if maps come out tilted or isometric. Clear it to restore the default.",
    scope: "world", config: true, type: String, default: L.DEFAULT_FRAMING
  });
  game.settings.register(MOD, "gridDistance", {
    name: "Grid distance per square",
    hint: "Dragonbane uses 2 metres per square.",
    scope: "world", config: true, type: Number, default: 2
  });
  game.settings.register(MOD, "gridUnits", {
    name: "Grid units", scope: "world", config: true, type: String, default: "m"
  });
});

Hooks.once("ready", () => {
  const mod = game.modules.get(MOD);
  mod.api = {
    open: (scene) => ForgeApp.open(scene),
    createStarterTables,
    importTables
  };
  log("ready — open with game.modules.get('terrain-forge').api.open()");
});

// A "Terrain Forge" button in the Scenes sidebar, GM only.
Hooks.on("renderSceneDirectory", (app, html) => {
  if (!game.user.isGM) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".tf-open")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tf-open";
  btn.innerHTML = `<i class="fa-solid fa-mountain-sun"></i> Terrain Forge`;
  btn.addEventListener("click", () => ForgeApp.open());
  const target = root.querySelector(".header-actions") ?? root.querySelector(".directory-header") ?? root;
  target.append(btn);
});

// Right-click a forged scene in the sidebar → "Reforge".
function sceneFromLi(li) {
  const el = li instanceof HTMLElement ? li : li?.[0];
  const id = el?.dataset?.entryId ?? el?.dataset?.documentId;
  return id ? game.scenes.get(id) : null;
}
const reforgeOption = {
  name: "Reforge with Terrain Forge",
  label: "Reforge with Terrain Forge",
  icon: '<i class="fa-solid fa-hammer"></i>',
  condition: (li) => game.user.isGM && !!sceneFromLi(li)?.getFlag(MOD, "prompt"),
  callback: (li) => { const scene = sceneFromLi(li); if (scene) ForgeApp.open(scene); }
};
Hooks.on("getSceneContextOptions", (app, options) => options.push(reforgeOption));          // v13+
Hooks.on("getSceneDirectoryEntryContext", (html, options) => options.push(reforgeOption)); // v12

function reportError(what, err) {
  console.error("Terrain Forge |", what, err);
  ui.notifications?.error(`Terrain Forge: ${what}. ${err?.message ?? err} (details in the F12 console)`);
}

/* ------------------------------------------------------------------ */
/*  Tables                                                             */
/* ------------------------------------------------------------------ */

function inForgeFolder(folder) {
  while (folder) {
    if (folder.name === L.FORGE_FOLDER) return true;
    folder = folder.folder;
  }
  return false;
}

/** Every RollTable inside the "Terrain Forge" folder (any depth) named "Biome: Category". */
function forgeTables() {
  const out = [];
  for (const table of game.tables) {
    if (!inForgeFolder(table.folder)) continue;
    const parsed = L.parseTableName(table.name);
    if (!parsed) continue;
    out.push({
      table, id: table.id, ...parsed,
      rolls: L.parseRolls(L.stripHTML(table.description)),
      setting: L.parseSetting(table.description)
    });
  }
  return out.sort((a, b) => Number(a.hidden) - Number(b.hidden) || a.category.localeCompare(b.category));
}

async function drawOne(entry, avoid = []) {
  for (let i = 0; i < 4; i++) {
    const { results } = await entry.table.roll();
    const r = results?.[0];
    if (!r) return null;
    const name = (r.name || r.text || "").trim();
    const effect = L.stripHTML(r.description ?? "");
    if (!avoid.includes(name) || i === 3) {
      return { tableId: entry.id, category: entry.category, hidden: entry.hidden, name, effect };
    }
  }
  return null;
}

async function ensureFolder(type, name = L.FORGE_FOLDER, parent = null) {
  const existing = game.folders.find((f) => f.type === type && f.name === name && (f.folder?.id ?? null) === (parent?.id ?? null));
  return existing ?? Folder.create({ name, type, folder: parent?.id ?? null });
}

/**
 * Create tables from definitions, one subfolder per biome. An existing table
 * with the same name is skipped, or with `replace` rewritten in place (same id,
 * so saved scenes can still reroll from it).
 */
async function writeTables(defs, { replace = false } = {}) {
  const root = await ensureFolder("RollTable");
  const resultType = CONST.TABLE_RESULT_TYPES?.TEXT ?? "text";
  let made = 0, updated = 0;
  for (const def of defs) {
    const sub = await ensureFolder("RollTable", def.biome, root);
    const name = L.tableName(def);
    const data = { description: L.tableDescription(def), formula: `1d${def.results.length}` };
    const results = def.results.map((r, i) => ({
      type: resultType, name: r.name, description: r.effect, range: [i + 1, i + 1], weight: 1
    }));
    const existing = game.tables.find((t) => t.name === name && t.folder?.id === sub.id);
    if (existing) {
      if (!replace) continue;
      await existing.update(data);
      await existing.deleteEmbeddedDocuments("TableResult", existing.results.map((r) => r.id));
      await existing.createEmbeddedDocuments("TableResult", results);
      updated++;
    } else {
      await RollTable.create({ name, folder: sub.id, ...data, replacement: true, displayRoll: false, results });
      made++;
    }
  }
  return { made, updated };
}

async function createStarterTables() {
  const { made } = await writeTables(L.normalizeTableDefs(STARTER_TABLES));
  ui.notifications.info(`Terrain Forge: created ${made} starter table${made === 1 ? "" : "s"}.`);
}

/**
 * Import tables from JSON (a string, an array, or { tables: [...] }), in the
 * same shape as the starter tables. Re-importing updates tables in place.
 */
async function importTables(data) {
  try {
    const defs = L.normalizeTableDefs(typeof data === "string" ? JSON.parse(data) : data);
    const { made, updated } = await writeTables(defs, { replace: true });
    const biomes = [...new Set(defs.map((d) => d.biome))].join(", ");
    ui.notifications.info(`Terrain Forge: ${biomes}: ${made} new table${made === 1 ? "" : "s"}, ${updated} updated.`);
    return { made, updated };
  } catch (err) {
    reportError("could not import tables", err);
    return null;
  }
}

/** Let the GM pick a .json file and import it. */
function pickTableFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      resolve(file ? await importTables(await file.text()) : null);
    });
    input.click();
  });
}

/* ------------------------------------------------------------------ */
/*  Image generation, upload, scene + journal                          */
/* ------------------------------------------------------------------ */

function filePicker() {
  return foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
}

async function ensureDir(path) {
  const FP = filePicker();
  const parts = path.split("/");
  for (let i = 1; i <= parts.length; i++) {
    const partial = parts.slice(0, i).join("/");
    try { await FP.createDirectory("data", partial); } catch { /* already exists */ }
  }
}

async function generateImage({ prompt, model, imgW, imgH }) {
  const key = game.settings.get(MOD, "falKey").trim();
  if (!key) throw new Error("No fal.ai API key set. Add it in Configure Settings → Terrain Forge.");
  const endpoint = game.settings.get(MOD, "endpoint").replace(/\/+$/, "");
  const res = await fetch(`${endpoint}/${model}`, {
    method: "POST",
    headers: { "Authorization": `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_size: { width: imgW, height: imgH },
      output_format: "jpeg",
      sync_mode: true,
      enable_safety_checker: true
    })
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    if (res.status === 401 || res.status === 403) throw new Error(`fal.ai rejected the key (${res.status}). Check it in settings.`);
    throw new Error(`fal.ai error ${res.status}: ${body}`);
  }
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("fal.ai returned no image.");
  if (data?.has_nsfw_concepts?.[0]) throw new Error("fal.ai's safety filter blanked this image. Try rerolling or rewording.");
  // sync_mode returns a data URI; fetch() turns either a data URI or a URL into a blob.
  return (await fetch(url)).blob();
}

async function setBackground(scene, path) {
  const gen = game.release?.generation ?? 13;
  if (gen >= 14 && scene.levels) {
    // v14 moved backgrounds onto Level documents; the old Scene field is ignored.
    const first = scene.levels.contents?.[0];
    if (first) await first.update({ "background.src": path });
    else await scene.createEmbeddedDocuments("Level", [{ name: "Ground", background: { src: path } }]);
  } else {
    await scene.update({ "background.src": path });
  }
}

async function forgeScene(state) {
  const dims = L.computeDims(state.w, state.h);
  const model = state.model;
  const name = state.sceneName?.trim() || `${state.biome} ${new Date().toLocaleDateString()}`;

  const blob = await generateImage({ prompt: state.prompt, model, imgW: dims.imgW, imgH: dims.imgH });

  const dir = `worlds/${game.world.id}/terrain-forge`;
  await ensureDir(dir);
  const fname = `${L.slugify(name)}-${Date.now()}.jpg`;
  const file = new File([blob], fname, { type: blob.type || "image/jpeg" });
  const up = await filePicker().upload("data", dir, file, {}, { notify: false });
  const path = up?.path ?? `${dir}/${fname}`;

  const flags = { [MOD]: { biome: state.biome, prompt: state.prompt, rolled: state.rolled, model, w: dims.w, h: dims.h } };
  const content = L.journalHTML({ biome: state.biome, dims, rolled: state.rolled, prompt: state.prompt, model });
  const grid = {
    type: CONST.GRID_TYPES.SQUARE,
    size: dims.gridPx,
    distance: game.settings.get(MOD, "gridDistance"),
    units: game.settings.get(MOD, "gridUnits")
  };

  // Reforge: swap the map on an existing scene, keep its tokens, notes and journal.
  const target = state.replace && state.targetSceneId ? game.scenes.get(state.targetSceneId) : null;
  if (target) {
    const previous = target.getFlag(MOD, "rolled") ?? [];
    await target.update({ width: dims.sceneW, height: dims.sceneH, grid, flags });
    await setBackground(target, path);
    let entry = target.journal;
    if (typeof entry === "string") entry = game.journal.get(entry);
    if (!entry) {
      const journalFolder = await ensureFolder("JournalEntry");
      entry = await JournalEntry.create({
        name: `Forge: ${target.name}`, folder: journalFolder.id,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE }, flags,
        pages: [{ name: "Scene features", type: "text", text: { content, format: 1 } }]
      });
      await target.update({ journal: entry.id });
    } else {
      const page = entry.pages.contents[0];
      if (page) await page.update({ "text.content": content });
      else await entry.createEmbeddedDocuments("JournalEntryPage", [{ name: "Scene features", type: "text", text: { content, format: 1 } }]);
    }
    await refreshThumb(target);
    const oldHidden = new Set(previous.filter((r) => r.hidden).map((r) => r.name));
    return { scene: target, entry, replaced: true, newHidden: state.rolled.filter((r) => r.hidden && !oldHidden.has(r.name)) };
  }

  const sceneFolder = await ensureFolder("Scene");
  const scene = await Scene.create({
    name,
    folder: sceneFolder.id,
    width: dims.sceneW,
    height: dims.sceneH,
    padding: 0,
    grid,
    // No walls in this workflow, so no token vision: the map is fully lit and
    // you hide things with Simple Fog or by hand.
    tokenVision: false,
    fog: { exploration: false },
    flags
  });
  await setBackground(scene, path);

  const journalFolder = await ensureFolder("JournalEntry");
  const entry = await JournalEntry.create({
    name: `Forge: ${name}`,
    folder: journalFolder.id,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    flags,
    pages: [{ name: "Scene features", type: "text", text: { content, format: 1 } }]
  });
  await scene.update({ journal: entry.id });
  await refreshThumb(scene);

  return { scene, entry, replaced: false, newHidden: state.rolled.filter((r) => r.hidden) };
}

async function refreshThumb(scene) {
  try {
    const t = await scene.createThumbnail();
    if (t?.thumb) await scene.update({ thumb: t.thumb });
  } catch (err) { log("thumbnail skipped", err); }
}

/** Dialog state rebuilt from a forged scene's saved data. */
function stateFromScene(scene) {
  const f = scene.flags?.[MOD] ?? {};
  const gridSize = scene.grid?.size || 100;
  const w = f.w ?? Math.round(scene.width / gridSize);
  const h = f.h ?? Math.round(scene.height / gridSize);
  const preset = Object.entries(L.SIZE_PRESETS).find(([, p]) => p.w === w && p.h === h)?.[0] ?? "custom";
  return {
    ...defaultState(),
    biome: f.biome ?? null, size: preset, w, h,
    rolled: foundry.utils.deepClone(f.rolled ?? []),
    prompt: f.prompt ?? "", promptEdited: true,
    model: f.model ?? game.settings.get(MOD, "model"),
    sceneName: scene.name, targetSceneId: scene.id, replace: true
  };
}

function defaultState() {
  return {
    biome: null, size: "medium", w: 20, h: 15, counts: {},
    rolled: [], prompt: "", promptEdited: false,
    model: game.settings.get(MOD, "model"), sceneName: "",
    targetSceneId: null, replace: false,
    busy: false, status: ""
  };
}

/* ------------------------------------------------------------------ */
/*  Forge dialog                                                       */
/* ------------------------------------------------------------------ */

const { ApplicationV2 } = foundry.applications.api;

class ForgeApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "terrain-forge",
    tag: "div",
    classes: ["terrain-forge"],
    window: { title: "Terrain Forge", icon: "fa-solid fa-mountain-sun", resizable: true },
    position: { width: 600, height: "auto" },
    actions: {
      roll: ForgeApp.onRoll,
      reroll: ForgeApp.onReroll,
      remove: ForgeApp.onRemove,
      rebuild: ForgeApp.onRebuild,
      forge: ForgeApp.onForge,
      starter: ForgeApp.onStarter,
      importFile: ForgeApp.onImportFile,
      loadCurrent: ForgeApp.onLoadCurrent,
      fresh: ForgeApp.onFresh
    }
  };

  /** Last dialog state, kept for the browser session so closing doesn't lose work. */
  static lastState = null;
  static instance = null;

  /** Open the dialog (one shared instance). Pass a scene to reforge it. */
  static open(scene = null) {
    try {
      const state = scene ? stateFromScene(scene) : null;
      if (!ForgeApp.instance) ForgeApp.instance = new ForgeApp({}, state);
      else if (state) ForgeApp.instance.tf = state;
      const app = ForgeApp.instance;
      return Promise.resolve(app.render({ force: true }))
        .then(() => { app.bringToFront?.(); return app; })
        .catch((err) => reportError("could not open the dialog", err));
    } catch (err) {
      reportError("could not open the dialog", err);
    }
  }

  constructor(options = {}, state = null) {
    super(options);
    this.tf = state ?? foundry.utils.deepClone(ForgeApp.lastState ?? defaultState());
    this.tf.busy = false;
    this.tf.status = "";
  }

  async close(options) {
    ForgeApp.lastState = foundry.utils.deepClone({ ...this.tf, busy: false, status: "" });
    return super.close(options);
  }

  get tables() { return forgeTables(); }

  async _renderHTML() {
    try {
      return await this._buildHTML();
    } catch (err) {
      reportError("the dialog failed to draw", err);
      return `<p class="tf-hint">Something went wrong drawing this window: <code>${L.escapeHTML(err?.message ?? err)}</code><br>Click <a data-action="fresh">New</a> to reset, and send the console error to whoever maintains Terrain Forge.</p>`;
    }
  }

  async _buildHTML() {
    const s = this.tf;
    const tables = this.tables;
    const biomes = [...new Set(tables.map((t) => t.biome))].sort();
    if (!biomes.length) {
      return `<section class="tf-empty">
        <p>No forge tables found. Tables live in the <strong>${L.FORGE_FOLDER}</strong> folder and are named <code>Biome: Category</code>. Add <code>(hidden)</code> to keep a table out of the image prompt.</p>
        <button type="button" data-action="starter"><i class="fa-solid fa-seedling"></i> Create starter tables (Forest &amp; Cave)</button>
        <button type="button" data-action="importFile"><i class="fa-solid fa-file-import"></i> Import tables from a JSON file</button>
      </section>`;
    }
    if (!biomes.includes(s.biome)) s.biome = biomes[0];
    const cats = tables.filter((t) => t.biome === s.biome);
    for (const t of cats) if (s.counts[t.id] === undefined) s.counts[t.id] = t.rolls;

    const dims = L.computeDims(s.w, s.h);
    const cost = L.estimateCost(s.model, dims.imgW, dims.imgH);
    const opt = (v, label, sel) => `<option value="${L.escapeHTML(v)}" ${v === sel ? "selected" : ""}>${L.escapeHTML(label)}</option>`;

    const rolledHTML = s.rolled.length
      ? `<ul class="tf-rolled">${s.rolled.map((r, i) => `
          <li class="${r.hidden ? "is-hidden" : ""}">
            <span class="tf-cat">${L.escapeHTML(r.category)}${r.hidden ? ' <i class="fa-solid fa-eye-slash" title="Hidden: not in the prompt"></i>' : ""}</span>
            <span class="tf-text"><strong>${L.escapeHTML(r.name)}</strong>${r.effect ? `<em>${L.escapeHTML(r.effect)}</em>` : ""}</span>
            <a data-action="reroll" data-index="${i}" title="Reroll this line"><i class="fa-solid fa-dice"></i></a>
            <a data-action="remove" data-index="${i}" title="Drop this line"><i class="fa-solid fa-xmark"></i></a>
          </li>`).join("")}</ul>`
      : `<p class="tf-hint">Set how many rolls each table gets, then roll.</p>`;

    const target = s.targetSceneId ? game.scenes.get(s.targetSceneId) : null;
    if (s.targetSceneId && !target) { s.targetSceneId = null; s.replace = false; }
    const current = canvas.scene;
    const canLoadCurrent = current?.getFlag(MOD, "prompt") && current.id !== s.targetSceneId;
    const banner = target
      ? `<div class="tf-banner">
          <span><i class="fa-solid fa-map"></i> Loaded from <strong>${L.escapeHTML(target.name)}</strong></span>
          <label class="tf-check"><input type="checkbox" data-field="replace" ${s.replace ? "checked" : ""}> Replace this scene's map</label>
          <a data-action="fresh" title="Start a fresh forge"><i class="fa-solid fa-file"></i> New</a>
        </div>`
      : canLoadCurrent
        ? `<div class="tf-banner"><a data-action="loadCurrent"><i class="fa-solid fa-download"></i> Load rolls and prompt from the current scene</a></div>`
        : "";
    const forgeLabel = target && s.replace ? "Replace map" : "Forge new scene";

    return `
      ${banner}
      <div class="tf-grid">
        <label>Biome <select data-field="biome">${biomes.map((b) => opt(b, b, s.biome)).join("")}</select></label>
        <label>Size <select data-field="size">
          ${Object.entries(L.SIZE_PRESETS).map(([k, p]) => opt(k, p.label, s.size)).join("")}
          ${opt("custom", "Custom", s.size)}
        </select></label>
        ${s.size === "custom" ? `
          <label>Width <input type="number" min="4" max="${L.MAX_SQUARES}" data-field="w" value="${s.w}"></label>
          <label>Height <input type="number" min="4" max="${L.MAX_SQUARES}" data-field="h" value="${s.h}"></label>` : ""}
      </div>
      <a class="tf-link" data-action="importFile" title="Add or update tables from a JSON file"><i class="fa-solid fa-file-import"></i> Import tables…</a>

      <fieldset class="tf-counts"><legend>Rolls per table</legend>
        ${cats.map((t) => `<label>${L.escapeHTML(t.category)}${t.hidden ? ' <i class="fa-solid fa-eye-slash"></i>' : ""}
          <input type="number" min="0" max="10" data-count="${t.id}" value="${s.counts[t.id]}"></label>`).join("")}
        <button type="button" data-action="roll" ${s.busy ? "disabled" : ""}><i class="fa-solid fa-dice-d20"></i> Roll</button>
      </fieldset>

      ${rolledHTML}

      <label class="tf-prompt">Image prompt
        <textarea data-field="prompt" rows="6">${L.escapeHTML(s.prompt)}</textarea>
      </label>
      ${s.promptEdited ? `<a class="tf-link" data-action="rebuild"><i class="fa-solid fa-rotate"></i> Rebuild prompt from rolls</a>` : ""}

      <div class="tf-grid">
        <label>Scene name <input type="text" data-field="sceneName" value="${L.escapeHTML(s.sceneName)}" placeholder="${L.escapeHTML(s.biome)} encounter"></label>
        <label>Model <select data-field="model">${Object.entries(L.MODELS).map(([k, v]) => opt(k, v, s.model)).join("")}</select></label>
      </div>

      <footer class="tf-footer">
        <span class="tf-status">${L.escapeHTML(s.status || `${dims.w}×${dims.h} squares · ${dims.imgW}×${dims.imgH}px${cost != null ? ` · ~$${cost.toFixed(3)}` : ""}`)}</span>
        <button type="button" data-action="forge" ${s.busy || !s.prompt ? "disabled" : ""}>
          <i class="fa-solid ${s.busy ? "fa-spinner fa-spin" : "fa-hammer"}"></i> ${forgeLabel}
        </button>
      </footer>`;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
    const s = this.tf;
    content.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("change", () => {
        const f = el.dataset.field;
        if (f === "biome") { s.biome = el.value; s.rolled = []; s.counts = {}; s.prompt = ""; s.promptEdited = false; }
        else if (f === "size") {
          s.size = el.value;
          const p = L.SIZE_PRESETS[el.value];
          if (p) { s.w = p.w; s.h = p.h; }
        }
        else if (f === "w" || f === "h") s[f] = Number(el.value) || s[f];
        else if (f === "prompt") { s.prompt = el.value; s.promptEdited = true; }
        else if (el.type === "checkbox") s[f] = el.checked;
        else s[f] = el.value;
        this.render();
      });
    });
    content.querySelectorAll("[data-count]").forEach((el) => {
      el.addEventListener("change", () => { s.counts[el.dataset.count] = Math.max(0, Number(el.value) || 0); });
    });
  }

  rebuildPrompt() {
    const s = this.tf;
    s.prompt = L.buildPrompt({
      biome: s.biome,
      setting: this.tables.find((t) => t.biome === s.biome && t.setting)?.setting,
      features: s.rolled.filter((r) => !r.hidden).map((r) => r.name),
      style: game.settings.get(MOD, "style"),
      framing: game.settings.get(MOD, "framing") || L.DEFAULT_FRAMING
    });
    s.promptEdited = false;
  }

  static async onRoll() {
    const s = this.tf;
    const cats = this.tables.filter((t) => t.biome === s.biome);
    s.rolled = [];
    for (const t of cats) {
      const n = s.counts[t.id] ?? t.rolls;
      for (let i = 0; i < n; i++) {
        const r = await drawOne(t, s.rolled.map((x) => x.name));
        if (r) s.rolled.push(r);
      }
    }
    this.rebuildPrompt();
    this.render();
  }

  static async onReroll(event, target) {
    const s = this.tf;
    const i = Number(target.dataset.index);
    const old = s.rolled[i];
    const t = this.tables.find((x) => x.id === old?.tableId);
    if (!t) return;
    const r = await drawOne(t, s.rolled.map((x) => x.name));
    if (r) s.rolled[i] = r;
    if (!s.promptEdited) this.rebuildPrompt();
    this.render();
  }

  static onRemove(event, target) {
    this.tf.rolled.splice(Number(target.dataset.index), 1);
    if (!this.tf.promptEdited) this.rebuildPrompt();
    this.render();
  }

  static onRebuild() { this.rebuildPrompt(); this.render(); }

  static async onStarter() { await createStarterTables(); this.render(); }

  static async onImportFile() { if (await pickTableFile()) this.render(); }

  static onLoadCurrent() {
    if (!canvas.scene) return;
    this.tf = stateFromScene(canvas.scene);
    this.render();
  }

  static onFresh() {
    this.tf = defaultState();
    this.render();
  }

  static async onForge() {
    const s = this.tf;
    if (s.busy) return;
    s.busy = true;
    s.status = "Painting the map… (10–40 seconds)";
    this.render();
    try {
      const { scene, entry, replaced, newHidden } = await forgeScene(s);
      ui.notifications.info(`Terrain Forge: "${scene.name}" ${replaced ? "has a new map" : "is ready"}.`);
      if (canvas.scene?.id !== scene.id) await scene.view();
      if (newHidden.length) new PlaceHiddenApp({ scene, entry, hidden: newHidden }).render({ force: true });
      if (!replaced) entry.sheet.render(true);
      // Remember this scene so the next open can reforge it (off by default).
      s.targetSceneId = scene.id;
      s.replace = replaced;
      s.busy = false;
      s.status = "";
      this.close();
    } catch (err) {
      console.error(err);
      const msg = err instanceof TypeError
        ? "Couldn't reach the image service (network or CORS). See the README's proxy note."
        : err.message;
      ui.notifications.error(`Terrain Forge: ${msg}`);
      s.busy = false;
      s.status = "";
      this.render();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Placing hidden features as GM-only map notes                       */
/* ------------------------------------------------------------------ */

class PlaceHiddenApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "terrain-forge-place",
    tag: "div",
    classes: ["terrain-forge"],
    window: { title: "Place hidden features", icon: "fa-solid fa-eye-slash" },
    position: { width: 380, height: "auto" },
    actions: { place: PlaceHiddenApp.onPlace }
  };

  constructor({ scene, entry, hidden }) {
    super();
    this.scene = scene;
    this.entry = entry;
    this.items = hidden.map((h) => ({ ...h, placed: false }));
    this.waiting = null;
  }

  async _renderHTML() {
    return `<p class="tf-hint">Click <strong>Place</strong>, then click the map. Markers link to the GM-only journal, so players never see them.</p>
      <ul class="tf-rolled">${this.items.map((h, i) => `
        <li>
          <span class="tf-text"><strong>${L.escapeHTML(h.name)}</strong>${h.effect ? `<em>${L.escapeHTML(h.effect)}</em>` : ""}</span>
          <button type="button" data-action="place" data-index="${i}">
            ${h.placed ? '<i class="fa-solid fa-check"></i> Again' : this.waiting === i ? "Click the map…" : '<i class="fa-solid fa-location-dot"></i> Place'}
          </button>
        </li>`).join("")}</ul>`;
  }

  _replaceHTML(result, content) { content.innerHTML = result; }

  static onPlace(event, target) {
    const i = Number(target.dataset.index);
    const item = this.items[i];
    if (canvas.scene?.id !== this.scene.id) {
      ui.notifications.warn("View the forged scene first.");
      return;
    }
    this.waiting = i;
    this.render();
    // Arm on the next tick so this click doesn't count.
    setTimeout(() => {
      canvas.stage.once("pointerdown", async () => {
        const { x, y } = canvas.mousePosition;
        const page = this.entry.pages.contents[0];
        await this.scene.createEmbeddedDocuments("Note", [{
          x, y,
          entryId: this.entry.id,
          pageId: page?.id,
          text: item.name,
          texture: { src: "icons/svg/trap.svg" },
          iconSize: 40,
          fontSize: 20
        }]);
        item.placed = true;
        this.waiting = null;
        this.render();
      });
    }, 0);
  }
}
