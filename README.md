# Terrain Forge

Roll biome tables → get an AI-painted battlemap as a ready Foundry scene → get a GM journal listing every feature and its Dragonbane effect. Hidden hazards never go into the image; you place them as GM-only markers.

Works on Foundry v13 and v14. System-agnostic, starter tables written for Dragonbane.

## Install

1. In Foundry (or Sqyre's Module Manager) choose **Install by manifest URL** and paste:
   `https://github.com/Kabellosan/terrain-forge/releases/latest/download/module.json`
2. Restart Foundry, enable **Terrain Forge** in *Manage Modules*.
3. *Configure Settings → Terrain Forge*: paste your **fal.ai API key** (fal.ai → Dashboard → Keys, add a few dollars of credit). Set your **campaign art style** once and leave it.

## Use

1. Scenes sidebar → **Terrain Forge** button (or macro: `game.modules.get("terrain-forge").api.open()`).
2. First time: click **Create starter tables** (Forest and Cave).
3. Pick biome and size, set rolls per table, **Roll**. Reroll or drop any line. Tweak the prompt if you like.
4. **Forge scene**. After 10–40 seconds you get:
   - a new scene in the *Terrain Forge* scene folder, gridded at 2 m per square, fully lit, no walls
   - a GM-only journal *Forge: <name>* with every rolled feature and its effect, linked to the scene
   - a small window to click-place each hidden hazard as a map note (players can't see these)

Use Simple Fog for hiding parts of the map.

## Reforging

Every forged scene remembers its biome, rolls, prompt and model.

- Right-click a forged scene in the Scenes sidebar → **Reforge with Terrain Forge**, or open the dialog while viewing it and click **Load rolls and prompt from the current scene**.
- Tick **Replace this scene's map** to swap the image on the same scene (tokens, markers and journal stay; the journal is updated). Untick it to forge a separate new scene.
- Closing the dialog keeps your current rolls and prompt; **New** starts fresh.

## Your own tables

Any RollTable inside the **Terrain Forge** folder (any subfolder) named `Biome: Category` is picked up.

- **Result name** = what goes into the image prompt ("a moss-covered shrine"). Write it as a visual description.
- **Result description** = the rule effect for the GM journal.
- Add `(hidden)` to the table name (`Swamp: Traps (hidden)`) to keep it out of the prompt.
- Put `Rolls: 2` in the table description to set the default number of rolls.

New biome = new tables with a new biome name. That's it.

## Cost

About 1.5¢ per map on FLUX.2 flash, 6–8¢ on FLUX.2 pro. The dialog shows an estimate before you forge.

## If forging fails with a network/CORS error

The module calls fal.ai straight from your browser. If your browser or fal ever blocks that, run a tiny proxy on your VPS (fal documents one: fal.ai/docs → server-side proxy) and set **Image endpoint** to its URL. A proxy is also the tidier option security-wise, since the key then lives on the server instead of in your browser.

## Known limits (v0.1)

- No walls or vision by design.
- The image model sometimes leaves out a rolled feature, especially with many rolls. Keep visible rolls to about 3–5 per map, and check the map against the journal.
- Scene images are ~2048 px wide, so large maps look soft when zoomed far in.
