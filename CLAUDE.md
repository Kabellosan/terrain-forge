# Terrain Forge — context for Claude

Foundry VTT module for Captain's Dragonbane campaign. Roll biome tables → build an image prompt from the visible results → generate a battlemap on fal.ai → create a gridded Foundry scene + GM-only journal → click-place hidden hazards as GM-only map notes.

## Design decisions (and why)

- **Everything happens inside Foundry.** Hard constraint: no context switching during play.
- **Consistency over peak quality.** Players read production values as information, so every map goes through the same pipeline and one campaign style setting. Don't make "special" maps look better.
- **No walls, no token vision.** Auto-wall detection isn't reliable across map types, and walls on some maps but not others is itself a tell. Scenes are fully lit; the GM hides areas with Simple Fog.
- **Hidden tables never reach the prompt**, so traps are never painted into the art.
- **fal.ai (FLUX.2)** for images. The Claude API can't generate images. Flash ≈1.5¢/map, pro ≈6–8¢.
- **Table results are written as seen from above** (result name = prompt fragment, description = Dragonbane effect). Side-view words ("trunks", "doors", "tall") make FLUX tilt the camera.
- **A biome's `Setting:` line is what the image model sees**, not the biome name. Place names ("Magna Woods") mean nothing to FLUX. Keep the setting line neutral; biome flavour like blight or mist goes in individual results, so it only appears when rolled, never on every map.
- **Book text stays private; original tables ship.** The repo is public. Free League text (primers, book excerpts, boxed text, paraphrased entries) must NOT be committed; source material goes in `private/` (gitignored). Tables written from scratch that only borrow setting *names* (Magna road, Dragon Empire) are fine and ship built in (`scripts/vale-tables.mjs`), because Captain doesn't want an import step.
- **Built-in tables install and update themselves** (`syncBuiltinTables`, on ready, active GM only). Each installed table carries a fingerprint flag; an unedited one updates when the module changes, an edited one is never touched. So edit table content in the `.mjs` files and ship a release, never tell Captain to re-import.

## Layout

- `scripts/lib.mjs` – pure logic (sizes, prompt, cost, parsing). No Foundry globals.
- `scripts/main.mjs` – Foundry glue: settings, ForgeApp dialog, PlaceHiddenApp, fal call, scene/journal creation, reforge, JSON table import.
- `scripts/starter-tables.mjs` – generic Forest and Cave tables (public, original content).
- `scripts/vale-tables.mjs` – Misty Vale region tables (`folder: "Misty Vale"`), original content.
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

## Open threads (as of v0.1.6)

- v0.1.5 fixed the dialog not opening; not yet confirmed live.
- Top-down framing: v0.1.3 rewrote side-view table entries. Captain still to compare flash vs pro on the same prompt via Reforge.
- Right-click "Reforge" uses hooks `getSceneContextOptions` (v13+) and `getSceneDirectoryEntryContext` (v12); unverified on v14. Fallback: "Load rolls and prompt from the current scene" button in the dialog.
- v0.1.6 added JSON table import + `Setting:` lines; v0.1.7 made built-in tables install automatically (Misty Vale included). Import stays for one-off tables.
- Misty Vale regions: Magna Woods drafted (pilot, not yet forged live; check the auto-install and fingerprint updates on real Foundry v14). Still to do: Around Outskirt, Iron Forest, Haunted Marshes, Foot of the Mountains. Plus generic fantasy biomes (public, original content) alongside Forest/Cave.
- Later ideas: Claude API to polish prompts or check which rolled features appear in the image; VPS proxy so the fal key isn't in the browser.
