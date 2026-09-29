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

/** Read "Rolls: N" from a table description. Defaults to 1. */
export function parseRolls(text) {
  const m = /rolls?\s*[:=]\s*(\d+)/i.exec(text ?? "");
  return m ? Math.min(10, Number(m[1])) : 1;
}

export function stripHTML(html) {
  return String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function slugify(s) {
  return String(s ?? "map").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "map";
}

/**
 * Build the image prompt from the visible rolled features only.
 * Hidden results never reach the prompt, so traps are never painted.
 */
export function buildPrompt({ biome, features, style }) {
  const parts = [
    "Flat top-down tactical battle map for a virtual tabletop, orthographic plan view.",
    "The camera points straight down at the ground at exactly 90 degrees, like a satellite photo or a floor plan: no tilt, no isometric angle, no perspective, no horizon, no sky.",
    "Everything is seen from directly above: trees appear only as round leafy canopies with no visible trunks, rocks and objects show only their top surfaces, nothing is seen from the side.",
    `Setting: ${biome.toLowerCase()}.`
  ];
  if (features.length) parts.push(`Seen from above, the map contains: ${features.join("; ")}.`);
  parts.push("Leave open, walkable ground between the features so figures can move around them.");
  parts.push("No grid lines, no text, no labels, no borders, no people, no creatures.");
  if (style?.trim()) parts.push(`Style: ${style.trim()}`);
  return parts.join(" ");
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
