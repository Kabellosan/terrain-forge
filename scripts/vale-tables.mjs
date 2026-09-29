// Misty Vale tables for the Dragonbane campaign "The Secret of the Dragon
// Emperor". Original text: only the place names come from the setting, no book
// text. Installed automatically in the "Misty Vale" folder and kept up to date
// unless you've edited a table yourself (see syncBuiltinTables in main.mjs).
// Same shape as starter-tables.mjs. `setting` is what the image model sees for
// the biome; keep it neutral and put flavour (blight, mist) in single results.

export const VALE_TABLES = [
  /* ---------------------------- MAGNA WOODS ---------------------------- */
  {
    folder: "Misty Vale", biome: "Magna Woods", category: "Terrain", hidden: false, rolls: 1,
    setting: "an ancient old-growth forest of broad oak, beech and elm crowns",
    blurb: "The ground the map sits on. Old imperial forest. The sick growth only shows up when a sick result is rolled.",
    results: [
      { name: "a forest floor of deep leaf litter and moss under a closed canopy of huge oak crowns", effect: "Open ground. No special rules." },
      { name: "a stretch of ancient paved road crossing the map, its cracked flagstones heaved apart by roots", effect: "The old Magna road. Normal movement on the stones; the undergrowth either side is rough terrain (half movement)." },
      { name: "a slow brown forest stream with root-tangled banks winding across the map", effect: "Wading: half movement. Fighting in the water: bane on EVADE." },
      { name: "a blighted hollow where the undergrowth grows in swollen, knotted tangles with bruise-purple leaves", effect: "The sick wood. Rough terrain (half movement). Anyone who falls prone here: CON roll or become Sickly." },
      { name: "a wooded slope stepped with mossy terraces of fallen ancient masonry", effect: "Climbing a terrace costs 2 m of movement. The higher combatant gets a boon in melee." },
      { name: "a wide clearing of long grass and foxgloves ringed by dense canopy", effect: "Open centre, cover only at the edges. Good ground for archers." },
      { name: "a fern-choked glade with pools of standing water in the hollows", effect: "Ferns block sight to anyone prone. Pools are rough terrain." },
      { name: "a ruined courtyard of cracked mosaic tiles half swallowed by moss and roots", effect: "Remains of the old empire. Open ground; the tiles are slick after rain: AGL roll to dash." }
    ]
  },
  {
    folder: "Misty Vale", biome: "Magna Woods", category: "Cover", hidden: false, rolls: 2,
    blurb: "Things to hide behind and fight around.",
    results: [
      { name: "a huge fallen oak lying across the ground, its crown of dead branches spread wide", effect: "Cover. Ranged attacks at someone behind it get a bane. Climbing over costs 2 m." },
      { name: "a toppled carved stone column lying on its side among ferns", effect: "Cover for anyone crouched behind it. Can't be shot through." },
      { name: "a broken run of ancient stone wall, mossy on top", effect: "Full cover from one direction. Vaulting it costs 2 m." },
      { name: "a cluster of giant pale mushroom caps as wide as tables, seen from above", effect: "Cover. A hit on a cap bursts it: everyone within 2 m makes a CON roll or becomes Dazed until end of next round." },
      { name: "an overturned wooden cart with spilled barrels and sacks", effect: "Cover. A STR roll rolls a barrel 6 m: D6 damage to whoever it hits (EVADE to dodge)." },
      { name: "a dense holly thicket of dark glossy leaves", effect: "Blocks sight. Pushing through: half movement and D4 damage (armour protects)." },
      { name: "several neighbouring tree crowns grown together into one knotted, swollen mass of dark purple leaves", effect: "Blocks sight beyond 2 m under it. SNEAKING gets a boon; AWARENESS a bane." },
      { name: "a lightning-split giant stump, a blackened crater at its centre", effect: "One person can crouch inside the split: full cover, but a bane on their own attacks." }
    ]
  },
  {
    folder: "Misty Vale", biome: "Magna Woods", category: "Features", hidden: false, rolls: 1,
    blurb: "Something to use, read, or be uneasy about.",
    results: [
      { name: "a square stone waymarker, its flat top carved with worn letters", effect: "An imperial milestone. MYTHS & LEGENDS: the distance is to a city nobody has heard of in 800 years." },
      { name: "a ring of leafless dead trees, bare grey branches spreading like cracks, bare earth in the middle", effect: "Nothing grows here and birds avoid it. WIL roll to rest inside the ring; fail and become Scared." },
      { name: "a trampled camp of hide lean-tos around a cold fire pit, gnawed bones scattered", effect: "A goblin camp, 1–2 days old. BUSHCRAFT finds where they went, and how many." },
      { name: "a huge untidy nest of branches and bones in the top of a broad tree crown", effect: "Something winged nests here. ACROBATICS to climb up; D6 silver and trinkets inside. It may come home." },
      { name: "a patch of unnaturally large violet flowers with fleshy petals", effect: "Grown by what leaks from the temple. Eating a petal heals D6 HP, then CON roll or become Sickly." },
      { name: "a sunken grave hollow with pieces of rusted mail half-buried in the earth", effect: "An old soldier's grave. Disturbing it after dark draws the dead that still patrol these woods." },
      { name: "the broken pieces of a large stone dragon statue scattered among the ferns", effect: "A roadside shrine of the Dragon Empire. The head is intact and gives cover. MYTHS & LEGENDS: which dragon it honours." },
      { name: "a round mossy stone well with a broken wooden winch beside it", effect: "Water at 6 m. Anything dropped in echoes far longer than it should." }
    ]
  },
  {
    folder: "Misty Vale", biome: "Magna Woods", category: "Hazards", hidden: true, rolls: 1,
    blurb: "Never shown in the image. Place a GM marker after forging.",
    results: [
      { name: "Rotten floor over a buried cellar", effect: "SPOT HIDDEN to notice. Otherwise AGL roll or fall 3 m into an old imperial cellar: D6 damage." },
      { name: "Spore cloud in the sick growth", effect: "The first fighter to enter the area stirs it up. Everyone within 4 m: CON roll or become Sickly." },
      { name: "Goblin stake pit", effect: "SPOT HIDDEN to notice. Otherwise EVADE or fall in: D8 damage and a round to climb out." },
      { name: "Grasping thornvine", effect: "Lashes at anyone passing: EVADE or be grabbed, D4 damage per round until a STR roll breaks free." },
      { name: "Swollen hornet nest", effect: "Any fighting nearby wakes it. Everyone within 4 m: D4 damage per round and a bane on all rolls until they leave." },
      { name: "Buried sentinel", effect: "An armoured skeleton under the leaves. Rises on round 3 and attacks the nearest living creature. Skeleton stats." },
      { name: "Deadfall tree", effect: "Held up only by vines. A heavy blow or a push (STR) drops it: EVADE or D10 damage and pinned until freed." },
      { name: "Tainted water", effect: "Looks clean. Anyone who drinks it: CON roll or become Sickly until they've slept a shift." }
    ]
  }
];
