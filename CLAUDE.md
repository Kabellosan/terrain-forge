# Terrain Forge — context for Claude

Foundry VTT module for Captain's Dragonbane campaign. Roll biome tables → build an image prompt from the visible results → generate a battlemap on fal.ai → create a gridded Foundry scene + GM-only journal → click-place hidden hazards as GM-only map notes.

## Design decisions (and why)

- **Everything happens inside Foundry.** Hard constraint: no context switching during play.
- **Consistency over peak quality.** Players read production values as information, so every map goes through the same pipeline and one campaign style setting. Don't make "special" maps look better.
- **No walls, no token vision.** Auto-wall detection isn't reliable across map types, and walls on some maps but not others is itself a tell. Scenes are fully lit; the GM hides areas with Simple Fog.
- **Hidden tables never reach the prompt**, so traps are never painted into the art.
- **fal.ai** for images (the Claude API can't generate images). A side-by-side test on 2026-09-29 (8 models × 2 Magna prompts) found only **GPT Image 1.5** (~5¢, clean/literal, max 1536 px) and **Nano Banana 2** (~12¢, richest, 2K) truly top-down; FLUX.2 tilts, Seedream/Qwen go isometric, the `Dnd_maps` FLUX LoRA is flat but clip-art. Captain chose to offer both; GPT is the default. They take shapes, not pixels: `L.imageRequest` picks the nearest shape and `cropToScene` trims to the grid.
- **Consistency caveat:** two models means two looks, which cuts against "consistency over peak quality". Captain chose that knowingly ("both options for now"); revisit once he's played with them.
- **Table results are written as seen from above** (result name = prompt fragment, description = Dragonbane effect). Side-view words ("trunks", "doors", "tall") make FLUX tilt the camera.
- **A biome's `Setting:` line is what the image model sees**, not the biome name. Place names ("Magna Woods") mean nothing to FLUX. Keep the setting line neutral; biome flavour like blight or mist goes in individual results, so it only appears when rolled, never on every map.
- **Campaign tables live in a secret gist, not this repo.** The repo is public; the Misty Vale tables (and anything Free League-derived) go in Captain's secret gist, one `.json` file per region. Working clone: `~/terrain-forge-vale` (gist `aeee2777f3917151ed9d4580c4fdc578`; pushes over SSH using `~/.ssh/github`, set in that clone's `core.sshCommand`). Pushing the gist is enough: no module release needed. The module reads it via `api.github.com/gists/<id>` (CORS-open, never stale; 60 unauthenticated calls/hour, one per world load). Raw source material stays in `private/` (gitignored).
- **Built-in and gist tables install and update themselves** (`syncBuiltinTables`, on ready, active GM only). Each installed table carries a fingerprint flag; an unedited one updates when its source changes, an edited one is never touched. So change table content at the source (starter `.mjs` or the gist), never tell Captain to re-import.

## Layout

- `scripts/lib.mjs` – pure logic (sizes, prompt, cost, parsing). No Foundry globals.
- `scripts/main.mjs` – Foundry glue: settings, ForgeApp dialog, PlaceHiddenApp, fal call, scene/journal creation, reforge, JSON table import.
- `scripts/starter-tables.mjs` – generic Forest and Cave tables (public, original content).
- `tests/lib.test.mjs`, `tests/smoke.test.mjs` – run with `cd tests && node lib.test.mjs && node smoke.test.mjs`. The smoke test mocks ApplicationV2 incl. its read-only `state` getter.

## Gotchas already hit

- ApplicationV2 has a read-only `state` getter. Dialog data lives in `this.tf`, never `this.state`.
- Foundry v14 moved scene backgrounds onto Level documents; `setBackground()` handles v13 and v14.
- Sqyre (the host) loses client-scope settings on reload, so the fal key is a world setting.
- Sqyre installs modules by manifest URL only; zips must have module.json at the root.

## Environment

- Foundry v14 (build 368), Dragonbane system 4.1.1, hosted on Sqyre (sqyre.app).
- Manifest: https://github.com/Kabellosan/terrain-forge/releases/latest/download/module.json

## Release flow

1. Run the tests.
2. Bump `version` in module.json and the version in its `download` URL.
3. Push to main. `.github/workflows/release.yml` builds module.zip and publishes the release.
4. Captain updates the module in Sqyre and restarts the world.

## Open threads (as of v0.1.9)

- v0.1.5 fixed the dialog not opening; not yet confirmed live.
- Top-down framing: solved by switching models (v0.1.9), not by prompt wording. The flash-vs-pro comparison is moot.
- Right-click "Reforge" uses hooks `getSceneContextOptions` (v13+) and `getSceneDirectoryEntryContext` (v12); unverified on v14. Fallback: "Load rolls and prompt from the current scene" button in the dialog.
- v0.1.6 added JSON table import + `Setting:` lines; v0.1.7 made built-in tables install automatically; v0.1.8 moved the Vale tables to the secret gist ("Private tables link" setting). Import stays for one-off tables. v0.1.7 shipped Magna Woods publicly for a few hours; it's still in git history, which is fine (original text only).
- Misty Vale regions: Magna Woods drafted (pilot, not yet forged live; check the auto-install and fingerprint updates on real Foundry v14). Still to do: Around Outskirt, Iron Forest, Haunted Marshes, Foot of the Mountains. Plus generic fantasy biomes (public, original content) alongside Forest/Cave.
- Later ideas: Claude API to polish prompts or check which rolled features appear in the image; VPS proxy so the fal key isn't in the browser.
