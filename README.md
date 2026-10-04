# Terrain Forge

Roll biome tables → get an AI-painted battlemap as a ready Foundry scene → get a GM journal listing every feature and its Dragonbane effect. Hidden hazards never go into the image; you place them as GM-only markers.

Works on Foundry v13 and v14. System-agnostic, starter tables written for Dragonbane. Campaign tables can load from a private link (see *Private tables*).

## Install

1. In Foundry (or Sqyre's Module Manager) choose **Install by manifest URL** and paste:
   `https://github.com/Kabellosan/terrain-forge/releases/latest/download/module.json`
2. Restart Foundry, enable **Terrain Forge** in *Manage Modules*.
3. *Configure Settings → Terrain Forge*: paste your **fal.ai API key** (fal.ai → Dashboard → Keys, add a few dollars of credit). Set your **campaign art style** once and leave it.

## Use

1. Scenes sidebar → **Terrain Forge** button (or macro: `game.modules.get("terrain-forge").api.open()`).
2. The built-in tables install themselves when the world loads (see below).
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

## Built-in tables

When a GM loads the world, Terrain Forge adds the generic **Forest** and **Cave** tables into the *Terrain Forge* table folder, plus any tables from your private tables link.

When the module or your private tables change, tables you haven't touched update too. **If you edit a built-in table, it's yours**: Terrain Forge never overwrites it again. To get the shipped version back, delete the table and reload the world. To manage all tables by hand, untick *Install built-in tables automatically* in the settings.

## Private tables

Tables based on a published campaign shouldn't go in a public module. Keep them in a **secret GitHub gist** instead:

1. Make a secret gist with one or more `.json` files, each in the import format below. Add `"folder": "Misty Vale"` to a table to group its biomes.
2. Paste the gist's page link into *Configure Settings → Terrain Forge → Private tables link*.
3. Reload the world. The tables install and stay in sync from then on, same rules as the built-in ones.

A secret gist is unlisted, not locked: anyone with the link can read it, and players could find the link in the browser console. Fine for a home game. Any other URL that serves the JSON works too.

A biome folder inside another folder (like *Misty Vale/Magna Woods*) shows up grouped in the biome dropdown.

## Your own tables

Any RollTable inside the **Terrain Forge** folder (any subfolder) named `Biome: Category` is picked up.

- **Result name** = what goes into the image prompt ("a moss-covered shrine"). Write it as a visual description.
- **Result description** = the rule effect for the GM journal.
- Add `(hidden)` to the table name (`Swamp: Traps (hidden)`) to keep it out of the prompt.
- Put `Rolls: 2` in the table description to set the default number of rolls.

- Put `Setting: …` in a table description to describe the biome to the image model (e.g. `Setting: an ancient old-growth forest of oak and beech crowns`). Handy when the biome is named after a place the model has never heard of. Without it, the biome name is used.

New biome = new tables with a new biome name. That's it.

## Importing tables from a file

**Import tables…** in the dialog (or `game.modules.get("terrain-forge").api.importTables(json)`) loads a JSON file of tables in the same shape as `scripts/starter-tables.mjs`:

```json
{ "tables": [
  { "biome": "Swamp", "category": "Cover", "rolls": 2, "hidden": false,
    "setting": "a misty reed swamp of black pools and hummocks",
    "blurb": "Things to hide behind.",
    "results": [ { "name": "a half-sunk rowboat", "effect": "Cover. Rough terrain around it." } ] }
] }
```

Importing the same file again updates those tables in place, so you can edit the file and re-import.

## Cost

Pick the model in the dialog (default set in the module settings):

| Model | Per map | Notes |
|---|---|---|
| **GPT Image 1.5** (default) | ~5¢ | Truly top-down, clean, follows the rolls closely. Max 1536 px, so large maps look soft zoomed in. |
| **Nano Banana 2** | ~12¢ | Truly top-down, richest painterly detail, 2K. Busier; a little looser with the rolls. |
| FLUX.2 flash | ~1.5¢ | Cheapest, but the camera often tilts (visible trunks, leaning statues). |
| FLUX.2 pro | 6–8¢ | Same tilt problem as flash. |

Worlds still set to a FLUX model switch to GPT Image 1.5 once when updating to v0.1.10, and reforging a FLUX map uses the default model. You can still pick FLUX in the dialog for one map.

The dialog shows an estimate before you forge. GPT Image and Nano Banana take a shape (like 4:3) rather than exact pixels, so the image is trimmed at the edges to fit the scene's grid exactly.

## If forging fails with a network/CORS error

The module calls fal.ai straight from your browser. If your browser or fal ever blocks that, run a tiny proxy on your VPS (fal documents one: fal.ai/docs → server-side proxy) and set **Image endpoint** to its URL. A proxy is also the tidier option security-wise, since the key then lives on the server instead of in your browser.

## Known limits (v0.1)

- No walls or vision by design.
- The image model sometimes leaves out a rolled feature, especially with many rolls. Keep visible rolls to about 3–5 per map, and check the map against the journal.
- Scene images are 1536–2400 px wide depending on the model, so large maps look soft when zoomed far in.
