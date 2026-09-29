// Pure logic with no Foundry dependencies, so it can be tested in Node.

export const FORGE_FOLDER = "Terrain Forge";

export const SIZE_PRESETS = {
  small:  { w: 12, h: 8,  label: "Small (12×8 squares)" },
  medium: { w: 20, h: 15, label: "Medium (20×15 squares)" },
  large:  { w: 30, h: 20, label: "Large (30×20 squares)" },
  huge:   { w: 40, h: 28, label: "Huge (40×28 squares)" }
};

export const MODELS = {
  "fal-ai/flux-2/flash": "FLUX.2 flash — cheap and fast (~2¢)",
  "fal-ai/flux-2-pro": "FLUX.2 pro — best quality (~8¢)"
};

// Foundry's minimum grid size is 50 px; fal.ai accepts 512–2048 px per side.
export const MIN_GRID_PX = 50;
export const MAX_SIDE = 2048;
export const MIN_SIDE = 512;
export const MAX_SQUARES = Math.floor(MAX_SIDE / MIN_GRID_PX); // 40

/**
 * Work out grid pixel size, scene size and requested image size for a map
 * that is `w` by `h` squares. The image is requested at the scene's shape so
 * the art lines up with the grid.
 */
export function computeDims(w, h) {
  w = Math.max(1, Math.min(MAX_SQUARES, Math.round(w)));
  h = Math.max(1, Math.min(MAX_SQUARES, Math.round(h)));
  let gridPx = Math.floor(Math.min(MAX_SIDE / w, MAX_SIDE / h));
  gridPx = Math.max(MIN_GRID_PX, gridPx);
  const sceneW = w * gridPx;
  const sceneH = h * gridPx;
  // Request dimensions rounded down to a multiple of 16 (diffusion models
  // work in 16 px blocks), clamped to the provider's limits.
  const fit = (v) => Math.max(MIN_SIDE, Math.min(MAX_SIDE, Math.floor(v / 16) * 16));
  return { w, h, gridPx, sceneW, sceneH, imgW: fit(sceneW), imgH: fit(sceneH) };
}

/** Rough cost in USD, from fal.ai list prices (flash per MP; pro first MP + extra MP rounded up). */
export function estimateCost(model, imgW, imgH) {
  const mp = (imgW * imgH) / 1e6;
  if (model.includes("flash")) return 0.005 * mp;
  if (model.includes("pro")) return 0.03 + 0.015 * Math.max(0, Math.ceil(mp) - 1);
  return null;
}

/**
 * Parse a table name like "Forest: Cover" or "Cave: Hazards (hidden)".
 * Returns null if the name doesn't follow the "Biome: Category" pattern.
 */
export function parseTableName(name) {
  const m = /^\s*(.+?)\s*[:|]\s*(.+?)\s*$/.exec(name ?? "");
  if (!m) return null;
  const hidden = /[([]\s*hidden\s*[)\]]/i.test(m[2]);
  const category = m[2].replace(/[([]\s*hidden\s*[)\]]/gi, "").trim();
  if (!category) return null;
  return { biome: m[1], category, hidden };
}

/**
 * Read "Setting: …" from a table description (raw HTML): how the biome is
 * described to the image model. Lets a biome named after a place ("Magna Woods")
 * still reach the model as something it can paint. Empty string if absent.
 */
export function parseSetting(html) {
  const m = /setting\s*:\s*([^<\n]+)/i.exec(String(html ?? ""));
  if (!m) return "";
  const text = m[1].replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, e) => ({ nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[e]));
  return text.trim().replace(/\.+$/, "");
}

/** Read "Rolls: N" from a table description. Defaults to 1. */
export function parseRolls(text) {
  const m = /rolls?\s*[:=]\s*(\d+)/i.exec(text ?? "");
  return m ? Math.min(10, Number(m[1])) : 1;
}

export function stripHTML(html) {
  return String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Visible text of an HTML string with common entities decoded, for comparisons. */
export function plainText(html) {
  return stripHTML(html).replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[e]));
}

/**
 * Short fingerprint of a table's content: description plus each result's name
 * and effect, in order. Compared as plain text so Foundry's HTML clean-up on
 * save doesn't count as an edit. Pass either a table definition or
 * { description, results: [{ name, effect }] } read back from Foundry.
 */
export function tableFingerprint({ description, results }) {
  const text = [plainText(description), ...results.map((r) => `${plainText(r.name)}|${plainText(r.effect)}`)].join("\n");
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function slugify(s) {
  return String(s ?? "map").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "map";
}

export const DEFAULT_FRAMING = "Flat top-down tactical battle map for a virtual tabletop, orthographic plan view. The camera points straight down at the ground at exactly 90 degrees, like a satellite photo or a floor plan: no tilt, no isometric angle, no perspective, no horizon, no sky. Everything is seen from directly above: trees appear only as round leafy canopies with no visible trunks, rocks and objects show only their top surfaces, nothing is seen from the side.";

/**
 * Build the image prompt from the visible rolled features only.
 * Hidden results never reach the prompt, so traps are never painted.
 */
export function buildPrompt({ biome, setting = "", features, style, framing = DEFAULT_FRAMING }) {
  const parts = [];
  if (framing?.trim()) parts.push(framing.trim());
  parts.push(`Setting: ${setting?.trim() || biome.toLowerCase()}.`);
  if (features.length) parts.push(`Seen from above, the map contains: ${features.join("; ")}.`);
  parts.push("Leave open, walkable ground between the features so figures can move around them.");
  parts.push("No grid lines, no text, no labels, no borders, no people, no creatures.");
  if (style?.trim()) parts.push(`Style: ${style.trim()}`);
  return parts.join(" ");
}

/**
 * Check and tidy table definitions from a starter list or an imported JSON file.
 * Accepts an array or { tables: [...] }. Throws a readable error on the first problem.
 */
export function normalizeTableDefs(data) {
  const list = Array.isArray(data) ? data : data?.tables;
  if (!Array.isArray(list) || !list.length) throw new Error('Expected a list of tables, or { "tables": [...] }.');
  return list.map((t, i) => {
    const biome = String(t?.biome ?? "").trim();
    const category = String(t?.category ?? "").trim();
    const where = `Table ${i + 1}${biome ? ` (${biome}: ${category || "?"})` : ""}`;
    if (!biome || !category) throw new Error(`${where} needs a biome and a category.`);
    if (/[:|]/.test(biome)) throw new Error(`${where}: the biome name can't contain ":" or "|".`);
    if (!Array.isArray(t.results) || !t.results.length) throw new Error(`${where} has no results.`);
    const results = t.results.map((r, j) => {
      const name = String(r?.name ?? "").trim();
      if (!name) throw new Error(`${where}, result ${j + 1} has no name.`);
      return { name, effect: String(r?.effect ?? "").trim() };
    });
    const rolls = Math.max(0, Math.min(10, Math.round(Number(t.rolls ?? 1)) || 0));
    return {
      biome, category, hidden: !!t.hidden, rolls, folder: String(t.folder ?? "").trim(),
      blurb: String(t.blurb ?? "").trim(), setting: String(t.setting ?? "").trim(), results
    };
  });
}

/** The id of a gist page link ("https://gist.github.com/user/abc123…"), or null for any other URL. */
export function gistId(url) {
  const m = /^https?:\/\/gist\.github\.com\/(?:[\w-]+\/)?([0-9a-f]{20,})\/?(?:[#?].*)?$/i.exec(String(url ?? "").trim());
  return m ? m[1] : null;
}

/** True for an empty table list ([] or { tables: [] }), e.g. a placeholder file. */
export function isEmptyTableList(data) {
  const list = Array.isArray(data) ? data : data?.tables;
  return Array.isArray(list) && list.length === 0;
}

export function tableName(def) {
  return `${def.biome}: ${def.category}${def.hidden ? " (hidden)" : ""}`;
}

/** Fingerprint of a table definition, as it will read once written to Foundry. */
export function defFingerprint(def) {
  return tableFingerprint({ description: tableDescription(def), results: def.results });
}

export function tableDescription(def) {
  return [
    `<p>Rolls: ${def.rolls}</p>`,
    def.setting ? `<p>Setting: ${escapeHTML(def.setting)}</p>` : "",
    def.blurb ? `<p>${escapeHTML(def.blurb)}</p>` : ""
  ].join("");
}

/** HTML for the GM journal page that goes with each forged scene. */
export function journalHTML({ biome, dims, rolled, prompt, model }) {
  const item = (r) => `<li><strong>${escapeHTML(r.name)}</strong>${r.effect ? ` — ${escapeHTML(r.effect)}` : ""} <em>(${escapeHTML(r.category)})</em></li>`;
  const visible = rolled.filter((r) => !r.hidden);
  const hidden = rolled.filter((r) => r.hidden);
  return [
    `<p><strong>Biome:</strong> ${escapeHTML(biome)} · <strong>Size:</strong> ${dims.w}×${dims.h} squares</p>`,
    `<h2>On the map</h2>`,
    visible.length ? `<ul>${visible.map(item).join("")}</ul>` : `<p>Nothing rolled.</p>`,
    `<h2>Hidden (GM only)</h2>`,
    hidden.length ? `<ul>${hidden.map(item).join("")}</ul>` : `<p>No hidden features.</p>`,
    `<h3>Prompt</h3><p><em>${escapeHTML(prompt)}</em></p>`,
    `<p><small>Model: ${escapeHTML(model)}</small></p>`
  ].join("\n");
}
