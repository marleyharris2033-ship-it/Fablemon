/* ============================================================ Third forms
   The final stage of every three-stage line: the three starters, the seven Meadow lines that used to stop at
   their second form, the eight Bog lines and four Crag lines. Art is cut by tools/art/cut_thirds.py; the rows of
   mon_battle.png / mon_icons.png follow THIRDS order, so keep the two lists in step.
   Each third form keeps its line's learnset and gets a signature move on evolving. */
const THIRDS = ['hedgerholt', 'hearthrusk', 'merewheel', 'plumevix', 'whorlcrest', 'cloverlegion', 'flintcairn', 'moonspark', 'duskwyrm', 'torrentail',
  'reefarer_3', 'reefarer_cotton_3', 'mirebellows_3', 'lotveil_3', 'yawnox_3', 'brimbramble_3', 'stormveil_3', 'hollowbark_3',
  'cindhop_3', 'bristlecone_3', 'clinkit_3', 'craglet_3'];

Object.assign(SPECIES, {
  // ---- starters (evolve at 36)
  hedgerholt: { name: 'Hedgerholt', type: 'Leaf', base: { hp: 85, atk: 80, def: 100, spd: 60 }, exp: 220, rate: 45,
    desc: 'Its bramble has grown into a walking thicket crowned with twisting branches. Seed pods glow like lanterns in its leaves, lighting the way for lost travellers.' },
  hearthrusk: { name: 'Hearthrusk', type: 'Ember', type2: 'Stone', base: { hp: 90, atk: 105, def: 80, spd: 55 }, exp: 220, rate: 45,
    desc: 'A towering kiln of molten rock with a crest of glowing crystals. Its fists burn hot enough to fire clay, and its footsteps leave warm prints for hours.' },
  merewheel: { name: 'Merewheel', type: 'Tide', base: { hp: 85, atk: 80, def: 80, spd: 100 }, exp: 220, rate: 45,
    desc: 'The spring on its back has become a brimming fountain, and its flower tail turns like a golden mill wheel. Wherever it rests, a fresh spring bubbles up.' },
  // ---- Meadow lines
  plumevix: { name: 'Plumevix', type: 'Wild', type2: 'Ember', base: { hp: 78, atk: 92, def: 66, spd: 104 }, exp: 215, rate: 45,
    desc: 'Its plumes have split into a great fan of fiery tails. Glowing swirls light up along its legs as it runs, and it can outpace a summer grass fire.' },
  whorlcrest: { name: 'Whorlcrest', type: 'Gale', type2: 'Tide', base: { hp: 74, atk: 86, def: 70, spd: 108 }, exp: 215, rate: 45,
    desc: 'Its tail feathers curl like breaking waves. With one beat of its wings it can whip a calm pond into a storm, and sailors take its call as a warning.' },
  cloverlegion: { name: 'Cloverlegion', type: 'Leaf', base: { hp: 90, atk: 78, def: 110, spd: 52 }, exp: 215, rate: 45,
    desc: 'A long armoured crawler with a hundred clawed legs and a back of glowing clover leaves. A field it guards is said to stay lucky for seven harvests.' },
  flintcairn: { name: 'Flintcairn', type: 'Stone', base: { hp: 95, atk: 92, def: 118, spd: 32 }, exp: 220, rate: 45,
    desc: 'Its flint ridge has grown into a cairn of amber crystals that glow with stored warmth. It rests in one spot for so long that hills form around it.' },
  moonspark: { name: 'Moonspark', type: 'Spark', type2: 'Glow', base: { hp: 74, atk: 100, def: 64, spd: 102 }, exp: 215, rate: 45,
    desc: 'Crescent moons shine on its velvet wings, and lantern crystals hang from its antennae. It gathers moonlight by day and lets it crackle loose at night.' },
  duskwyrm: { name: 'Duskwyrm', type: 'Shade', type2: 'Gale', base: { hp: 88, atk: 104, def: 84, spd: 80 }, exp: 230, rate: 30,
    desc: 'Its striped cloak has unfurled into vast wings of shadow. It glides over the fields at nightfall, and its shell-fan tail hums as it turns.' },
  torrentail: { name: 'Torrentail', type: 'Tide', base: { hp: 80, atk: 88, def: 72, spd: 104 }, exp: 215, rate: 45,
    desc: 'Its tails have become two crashing waves. It surfs the swollen river after a storm, and the pendant on its chest shines brighter in fast water.' },
  // ---- Mossmere Bog lines (evolve at 38)
  reefarer_3: { form: 'Reed Form', name: 'Deepfarer', type: 'Tide', type2: 'Gale', base: { hp: 76, atk: 92, def: 64, spd: 106 }, exp: 225, rate: 45,
    desc: 'A lean deep-water diver with scythe-like leaf fins, goggles and a long brass snorkel. It slices through the reeds faster than the eye can follow.' },
  reefarer_cotton_3: { form: 'Cotton Form', name: 'Deepfarer', type: 'Leaf', type2: 'Gale', base: { hp: 92, atk: 72, def: 96, spd: 76 }, exp: 225, rate: 45,
    desc: 'It wears a heavy brass diving helmet and air tanks under a thick cotton mane. It walks along the bottom of the deepest pools as if out for a stroll.' },
  mirebellows_3: { name: 'Mirelure', type: 'Tide', type2: 'Stone', base: { hp: 98, atk: 84, def: 104, spd: 48 }, exp: 225, rate: 45,
    desc: 'A great armoured angler with a fan-like sail. It dangles a swirling water orb in the murky bog to draw the curious close.' },
  lotveil_3: { name: 'Lotmancer', type: 'Tide', type2: 'Leaf', base: { hp: 78, atk: 80, def: 76, spd: 100 }, exp: 225, rate: 45,
    desc: 'Its petals have opened into a sweeping robe and a wide bloom of a hat. It carries a staff tipped with a drop of spring water that never dries.' },
  yawnox_3: { name: 'Slumberdew', type: 'Leaf', type2: 'Stone', base: { hp: 112, atk: 76, def: 104, spd: 40 }, exp: 225, rate: 45,
    desc: 'A hulking moss giant studded with sticky red sundews. The sweet dew on its flowers can lull a whole herd to sleep.' },
  brimbramble_3: { name: 'Pitchfiend', type: 'Leaf', type2: 'Shade', base: { hp: 80, atk: 104, def: 72, spd: 78 }, exp: 225, rate: 45,
    desc: 'A tall, grinning pitcher plant that stalks on twisted roots. Glowing drops of nectar hang from its claws, and its hood snaps shut on anything that gets too close.' },
  stormveil_3: { name: 'Stormcrown', type: 'Spark', type2: 'Tide', base: { hp: 76, atk: 104, def: 66, spd: 92 }, exp: 225, rate: 45,
    desc: 'A great marsh jelly with a dome full of branching lightning. Its glowing beads link into a crackling chain that lights up the bog in a storm.' },
  hollowbark_3: { name: 'Grimbark', type: 'Shade', type2: 'Leaf', base: { hp: 90, atk: 94, def: 112, spd: 40 }, exp: 225, rate: 45,
    desc: 'An ancient tree split by lightning, with shelf mushrooms up its trunk and purple claws for roots. A pair of glowing eyes watches from the crack.' },
  // ---- Cragside lines (evolve at 42 to 48)
  cindhop_3: { name: 'Blazejack', type: 'Ember', type2: 'Stone', base: { hp: 80, atk: 110, def: 76, spd: 106 }, exp: 235, rate: 45,
    desc: 'A powerful hare of cooled lava with a mane of roaring flame. Vents on its legs blast fire when it jumps, sending it clean over ravines.' },
  bristlecone_3: { name: 'Pinewarden', type: 'Leaf', type2: 'Gale', base: { hp: 96, atk: 96, def: 108, spd: 64 }, exp: 235, rate: 45,
    desc: 'Its antlers have grown into a living pine bough hung with cones, and its tail is one enormous pinecone. It guards the old forests on the mountain slopes.' },
  clinkit_3: { name: 'Belfrock', type: 'Stone', type2: 'Glow', base: { hp: 98, atk: 82, def: 134, spd: 48 }, exp: 240, rate: 45,
    desc: 'Its shell has risen into a stone belfry with a golden bell inside. When it rings, the sound carries over the whole mountain and every rockfall stops.' },
  craglet_3: { name: 'Shardgryph', type: 'Stone', type2: 'Gale', base: { hp: 84, atk: 106, def: 88, spd: 94 }, exp: 240, rate: 45,
    desc: 'Molten light runs through the cracks in its slate wings, and amber crystals grow from its shoulders and tail. It rules the highest peaks of Cragside.' },
});

// the second forms now lead on to these (the starters and Bog/Crag lines already pointed at them)
Object.assign(SPECIES.fleecebolt, { evo: ['plumevix', 36] });
Object.assign(SPECIES.whirlwyn, { evo: ['whorlcrest', 35] });
Object.assign(SPECIES.cloverguard, { evo: ['cloverlegion', 34] });
Object.assign(SPECIES.flintburrow, { evo: ['flintcairn', 36] });
Object.assign(SPECIES.staticwing, { evo: ['moonspark', 37] });
Object.assign(SPECIES.duskcloak, { evo: ['duskwyrm', 40] });
Object.assign(SPECIES.brookstride, { evo: ['torrentail', 36] });

// signature moves: learned on evolving
Object.assign(MOVES, {
  lanterngrove: { name: 'Lantern Grove', type: 'Leaf', pow: 90, acc: 100, drain: .5 },
  magmafist: { name: 'Magma Fist', type: 'Ember', pow: 100, acc: 95, st: ['brn', 30] },
  millflood: { name: 'Mill Flood', type: 'Tide', pow: 95, acc: 100, boost: ['foe', 'spd', -1, 100] },
  plumeflurry: { name: 'Plume Flurry', type: 'Wild', pow: 25, acc: 95, hits: [2, 5], crit: 1 },
  whorlwind: { name: 'Whorlwind', type: 'Gale', pow: 90, acc: 95, flinch: 20 },
  legionmarch: { name: 'Legion March', type: 'Leaf', pow: 90, acc: 100, useDef: 1 },
  cairnfall: { name: 'Cairnfall', type: 'Stone', pow: 100, acc: 90, flinch: 20 },
  moonbolt: { name: 'Moonbolt', type: 'Spark', pow: 90, acc: 100, st: ['par', 30] },
  duskdive: { name: 'Dusk Dive', type: 'Shade', pow: 100, acc: 95, crit: 1 },
  riptail: { name: 'Riptail', type: 'Tide', pow: 70, acc: 100, prio: 1 },
  abyssdive: { name: 'Abyss Dive', type: 'Tide', pow: 100, acc: 90, crit: 1 },
  fleecebastion: { name: 'Fleece Bastion', type: 'Gale', pow: 95, acc: 100, useDef: 1 },
  lurelight: { name: 'Lure Light', type: 'Tide', pow: 90, acc: 100, st: ['par', 30] },
  petalhex: { name: 'Petal Hex', type: 'Leaf', pow: 80, acc: 100, hex: 1 },
  deepdew: { name: 'Deep Dew', type: 'Leaf', pow: 80, acc: 100, drain: .5 },
  pitfallgulp: { name: 'Pitfall Gulp', type: 'Leaf', pow: 100, acc: 95, st: ['psn', 30] },
  crownstorm: { name: 'Crown Storm', type: 'Spark', pow: 110, acc: 85, st: ['par', 30] },
  grimroots: { name: 'Grim Roots', type: 'Shade', pow: 95, acc: 100, drain: .3 },
  blazekick: { name: 'Blaze Kick', type: 'Ember', pow: 95, acc: 95, crit: 1 },
  pineconestorm: { name: 'Pinecone Storm', type: 'Leaf', pow: 25, acc: 95, hits: [2, 5] },
  belfrypeal: { name: 'Belfry Peal', type: 'Glow', pow: 95, acc: 100, flinch: 30 },
  shardtalon: { name: 'Shard Talon', type: 'Stone', pow: 95, acc: 95, crit: 1 },
});
Object.assign(SIGNATURE, {
  hedgerholt: [36, 'lanterngrove'], hearthrusk: [36, 'magmafist'], merewheel: [36, 'millflood'],
  plumevix: [36, 'plumeflurry'], whorlcrest: [35, 'whorlwind'], cloverlegion: [34, 'legionmarch'], flintcairn: [36, 'cairnfall'],
  moonspark: [37, 'moonbolt'], duskwyrm: [40, 'duskdive'], torrentail: [36, 'riptail'],
  reefarer_3: [38, 'abyssdive'], reefarer_cotton_3: [38, 'fleecebastion'], mirebellows_3: [38, 'lurelight'], lotveil_3: [38, 'petalhex'],
  yawnox_3: [38, 'deepdew'], brimbramble_3: [38, 'pitfallgulp'], stormveil_3: [38, 'crownstorm'], hollowbark_3: [38, 'grimroots'],
  cindhop_3: [44, 'blazekick'], bristlecone_3: [42, 'pineconestorm'], clinkit_3: [48, 'belfrypeal'], craglet_3: [46, 'shardtalon'],
});
// learnsets: everything the form before could learn (its signature move included) plus the new signature move
for (const sp of THIRDS) {
  const prev = Object.keys(SPECIES).find(k => SPECIES[k].evo && SPECIES[k].evo[0] === sp);
  LEARN[sp] = [...(LEARN[prev] || []), SIGNATURE[sp]].sort((a, b) => a[0] - b[0]);
}

MON_ORDER.push(...THIRDS);
for (const sp of THIRDS) MON_STAGE[sp] = 3;
