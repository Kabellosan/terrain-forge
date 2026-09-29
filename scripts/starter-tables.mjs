// Starter tables. Each result's `name` is the prompt fragment the image model
// sees; `effect` is the Dragonbane ruling that goes in the GM journal.
// Hidden tables never reach the prompt. Edit freely in Foundry once imported.

export const STARTER_TABLES = [
  /* ------------------------------ FOREST ------------------------------ */
  {
    biome: "Forest", category: "Terrain", hidden: false, rolls: 1,
    blurb: "The ground the whole map sits on.",
    results: [
      { name: "an old-growth forest floor of moss, ferns and fallen needles", effect: "Open ground. No special rules." },
      { name: "a narrow winding game trail through dense undergrowth", effect: "Off the trail counts as rough terrain: half movement." },
      { name: "a shallow stream cutting across the map with stony banks", effect: "Wading the stream: half movement. Fighting while standing in it: bane on EVADE." },
      { name: "a sunlit clearing ringed by tall birch trees", effect: "Open centre, cover only at the edges. Great for archers." },
      { name: "a steep wooded hillside with exposed roots and ledges", effect: "Uphill combatant gets a boon on melee attacks against someone below." },
      { name: "a boggy hollow of black mud and reeds", effect: "Mud is rough terrain. A dragon roll on EVADE means the target slips prone." }
    ]
  },
  {
    biome: "Forest", category: "Cover", hidden: false, rolls: 2,
    blurb: "Things to hide behind and fight around.",
    results: [
      { name: "a huge fallen oak lying across the ground", effect: "Cover. Ranged attacks at someone behind it get a bane. Climbing over costs 2 m of movement." },
      { name: "a cluster of mossy standing stones", effect: "Full cover from one direction. Can't be shot through." },
      { name: "thick bramble thickets", effect: "Blocks sight. Pushing through: half movement and D4 damage (armour protects)." },
      { name: "a ring of huge ancient beech trees with broad overlapping crowns", effect: "Cover. Someone tucked between trunks can't be flanked." },
      { name: "a collapsed woodcutter's lean-to and a stack of logs", effect: "Cover. A STR roll topples the logs: D6 damage to anyone in the 2 m in front." },
      { name: "a large boulder cracked in two, a small tree crown growing from the crack", effect: "Cover. Climbing on top gives height: boon on ranged attacks, but no cover up there." },
      { name: "a dense patch of young spruce, tightly packed small dark-green crowns", effect: "Blocks sight beyond 4 m. SNEAKING gets a boon here." },
      { name: "a fallen tree's upturned root plate, a crater of torn earth beside it", effect: "Cover for anyone crouched behind it." }
    ]
  },
  {
    biome: "Forest", category: "Features", hidden: false, rolls: 1,
    blurb: "Something interesting to look at, use, or wonder about.",
    results: [
      { name: "a round half-collapsed charcoal kiln mound with thin smoke rising from its top", effect: "Knock it over (STR roll) to scatter embers in a 4 m area: D6 fire damage to anyone caught." },
      { name: "a small wooden shrine roof surrounded by offerings of bread and coloured ribbons", effect: "Taking an offering could anger something. Leaving one might earn a favour." },
      { name: "a square wooden hunter's platform nestled inside a large tree crown", effect: "Reach it with an ACROBATICS roll. Up top: boon on ranged attacks, cover from below." },
      { name: "a wide ring of pale toadstool caps on the grass", effect: "Stepping inside: WIL roll or become Dazed until you step out." },
      { name: "a small pond with a rotting rowboat", effect: "Deep water: SWIMMING rolls needed. The boat sinks after a round of use." },
      { name: "the skeleton of a large beast lying flat on the ground", effect: "BUSHCRAFT reveals what killed it, and that it's still around." },
      { name: "an abandoned campfire with scattered gear", effect: "Search: roll once on a loot table of your choice." },
      { name: "a massive hollow tree stump with a dark open centre", effect: "One person can hide inside. Full cover, but they can't attack out of it." }
    ]
  },
  {
    biome: "Forest", category: "Hazards", hidden: true, rolls: 1,
    blurb: "Never shown in the image. Place a GM marker after forging.",
    results: [
      { name: "Snare trap", effect: "SPOT HIDDEN to notice. Otherwise EVADE or be yanked prone and stuck until a STR roll frees you." },
      { name: "Wasp nest in a hollow log", effect: "Disturbed by any fighting nearby. Everyone within 4 m: D4 damage per round and a bane on all rolls until they leave." },
      { name: "Rotten branch overhead", effect: "Falls when something heavy hits the tree. EVADE or take D8 damage and be knocked prone." },
      { name: "Hidden sinkhole under leaves", effect: "SPOT HIDDEN to notice. Otherwise AGL roll or fall in: D6 damage and a round to climb out." },
      { name: "Poisonous nettle patch", effect: "Anyone entering: CON roll or become Sickly until the next stretch of rest." },
      { name: "Territorial boar in the underbrush", effect: "Charges into the fight on round 3, attacking whoever is nearest. Uses the boar stats of your choice." }
    ]
  },

  /* ------------------------------- CAVE ------------------------------- */
  {
    biome: "Cave", category: "Terrain", hidden: false, rolls: 1,
    blurb: "The shape of the underground space.",
    results: [
      { name: "a wide natural cavern with an uneven rock floor", effect: "Open ground. No special rules." },
      { name: "a twisting tunnel that opens into two connected chambers", effect: "The tunnel only fits one person abreast." },
      { name: "a cavern split by an underground stream", effect: "Crossing the stream: half movement. Deep spots require SWIMMING." },
      { name: "a cavern of stepped rock terraces at different heights", effect: "Climbing a terrace costs 2 m of movement. The higher combatant gets a boon in melee." },
      { name: "a damp grotto with a still black pool in the centre", effect: "The pool is deep and cold: SWIMMING, and a CON roll each round or become Exhausted." },
      { name: "a collapsed mine gallery with timber supports", effect: "Rough terrain around the rubble: half movement." }
    ]
  },
  {
    biome: "Cave", category: "Cover", hidden: false, rolls: 2,
    blurb: "Rock to hide behind.",
    results: [
      { name: "clusters of thick round stalagmites", effect: "Cover. A dragon roll on a heavy attack can shatter one." },
      { name: "a heap of fallen rubble", effect: "Cover. Rough terrain to cross." },
      { name: "a low natural rock wall across part of the cavern", effect: "Cover for anyone crouched behind it. Vaulting it costs 2 m." },
      { name: "a narrow crevice in the wall big enough for one person", effect: "Full cover. Attacks out of it get a bane." },
      { name: "an abandoned ore cart on broken rails", effect: "Cover. Can be pushed (STR roll) 10 m along the rails as a D8 ram." },
      { name: "large clusters of pale crystals spread across the floor", effect: "Cover. Light sources reflect off them: bane on SNEAKING nearby." }
    ]
  },
  {
    biome: "Cave", category: "Features", hidden: false, rolls: 1,
    blurb: "Something to use or wonder about.",
    results: [
      { name: "glowing blue fungus on the walls", effect: "Dim light around it. Eating it: CON roll or become Sickly. Pass and see in darkness for an hour." },
      { name: "an old rope bridge over a narrow chasm", effect: "ACROBATICS to cross in combat. Cutting it takes one action." },
      { name: "a flat carved stone altar slab stained dark", effect: "Something was worshipped here. Touching it could wake it." },
      { name: "a pile of bones and rusted weapons", effect: "Scavenge a basic weapon. Also a clue about what lairs here." },
      { name: "a patch of daylight and fallen roots on the floor beneath a hole in the cave ceiling", effect: "A way up to the surface, for a STR or ACROBATICS roll." },
      { name: "a round stone basin of splashing water fed by a trickle from the cave wall", effect: "Loud: bane on AWARENESS within 6 m, and a boon on SNEAKING." }
    ]
  },
  {
    biome: "Cave", category: "Hazards", hidden: true, rolls: 1,
    blurb: "Never shown in the image. Place a GM marker after forging.",
    results: [
      { name: "Unstable ceiling", effect: "Loud noise or a heavy blow nearby: everyone in a 4 m area must EVADE or take 2D6 damage." },
      { name: "Pit trap under loose stones", effect: "SPOT HIDDEN to notice. Otherwise AGL roll or fall 4 m (falling damage per the core rules)." },
      { name: "Pocket of bad air", effect: "Anyone in the area: CON roll each round or become Exhausted." },
      { name: "Slick wet rock", effect: "Moving faster than half speed: AGL roll or fall prone." },
      { name: "Bat colony overhead", effect: "Disturbed by light or noise: the swarm blocks sight in the cavern for D4 rounds." },
      { name: "Something sleeping in a side passage", effect: "Wakes after 3 rounds of fighting and joins in. Choose from the Bestiary." }
    ]
  }
];
