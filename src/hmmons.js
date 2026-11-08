/* ============================================================ Highmoor Fablemon (Windward Sound, Heatherstep Cliffs, Gale Ledges)
   Four lines from the user's art: the kite kestrel, the snowy owl, the dandelion sprite and the heather pony.
   Art cut by tools/art/cut_hmmons.py; their rows in mon_battle.png / mon_icons.png follow the MON_ORDER push below,
   so this file loads after seamons.js. */
Object.assign(SPECIES, {
  kitlet: { name: 'Kitlet', type: 'Gale', evo: ['kitlet_2', 50], base: { hp: 50, atk: 70, def: 44, spd: 88 }, exp: 70, rate: 90,
    desc: 'A young kestrel born with wings like a paper kite, tail ribbons and all. It hangs perfectly still on the cliff updrafts, watching the heather below.' },
  kitlet_2: { name: 'Kestrite', type: 'Gale', evo: ['kitlet_3', 58], base: { hp: 66, atk: 94, def: 58, spd: 114 }, exp: 158, rate: 60,
    desc: 'Its kite-wings have grown a second sail, painted with swirls of wind. Highmoor children fly kites in its shape for luck.' },
  kitlet_3: { name: 'Tempestrel', type: 'Gale', base: { hp: 84, atk: 122, def: 74, spd: 130 }, exp: 250, rate: 45,
    desc: 'A great storm falcon braced on wings of frame and canvas. When it dives from a gale, the wind follows it down like a falling sky.' },
  flurrowl: { name: 'Flurrowl', type: 'Frost', type2: 'Gale', evo: ['flurrowl_2', 51], base: { hp: 64, atk: 62, def: 68, spd: 58 }, exp: 74, rate: 70,
    desc: 'A round, grumpy owlet with frost on its face. It nests in the windmill sails and glares at anyone who wakes it in the daytime.' },
  flurrowl_2: { name: 'Sleethoot', type: 'Frost', type2: 'Gale', evo: ['flurrowl_3', 59], base: { hp: 86, atk: 80, def: 96, spd: 70 }, exp: 160, rate: 50,
    desc: 'A stocky snow owl with bands of clear blue ice across its wings. Each hoot brings a flurry of sleet sweeping over the moor.' },
  flurrowl_3: { name: 'Blizzowl', type: 'Frost', type2: 'Gale', base: { hp: 104, atk: 108, def: 112, spd: 86 }, exp: 252, rate: 40,
    desc: 'Its wings are slabs of glacier ice that crack like thunder when they open. The first snow of the year on Highmoor is said to fall from its feathers.' },
  wishling: { name: 'Wishling', type: 'Gale', type2: 'Glow', evo: ['wishling_2', 49], base: { hp: 48, atk: 62, def: 50, spd: 92 }, exp: 68, rate: 90,
    desc: 'A puff of dandelion fluff with two bright eyes. It drifts wherever the breeze takes it, and its seeds glow softly as they blow away.' },
  wishling_2: { name: 'Wishclock', type: 'Gale', type2: 'Glow', evo: ['wishling_3', 57], base: { hp: 66, atk: 86, def: 72, spd: 108 }, exp: 158, rate: 60,
    desc: 'It has put down roots and grown a full dandelion clock for a head. Blow on it and make a wish: its glowing seeds carry wishes off on the wind.' },
  wishling_3: { name: 'Wishbloom', type: 'Gale', type2: 'Glow', base: { hp: 86, atk: 112, def: 90, spd: 122 }, exp: 250, rate: 45,
    desc: 'A crescent of glowing seeds arcs over its golden bloom. On still summer nights the moor fills with drifting lights wherever one has danced.' },
  heathfoal: { name: 'Heathfoal', type: 'Gale', type2: 'Wild', evo: ['heathfoal_2', 52], base: { hp: 66, atk: 80, def: 56, spd: 76 }, exp: 76, rate: 80,
    desc: 'A shaggy moorland foal whose mane is a tuft of flowering heather. Little whirlwinds spin around its hooves whenever it gets excited.' },
  heathfoal_2: { name: 'Moorgale', type: 'Gale', type2: 'Wild', base: { hp: 92, atk: 118, def: 86, spd: 112 }, exp: 252, rate: 45,
    desc: 'A wild stallion with a mane of heather and long grass streaming like a banner. Herds gallop the clifftops on the gusts, hooves barely touching the ground.' },
});
Object.assign(MOVES, {
  frostfeather: { name: 'Frost Feather', type: 'Frost', pow: 60, acc: 100 },
  seedsquall: { name: 'Seed Squall', type: 'Gale', pow: 25, acc: 95, hits: [2, 4] },
  gallop: { name: 'Gallop', type: 'Wild', pow: 70, acc: 100 },
  // ---- signatures
  tempestwing: { name: 'Tempest Wing', type: 'Gale', pow: 100, acc: 95, crit: 1 },
  whiteout: { name: 'Whiteout', type: 'Frost', pow: 100, acc: 90, boost: ['foe', 'spd', -1, 50] },
  wishwind: { name: 'Wishwind', type: 'Glow', pow: 95, acc: 100, drain: .25 },
  heathergallop: { name: 'Heather Gallop', type: 'Wild', pow: 100, acc: 95, boost: ['self', 'spd', 1, 100] },
});
const hmLine = (ids, base, extra) => { LEARN[ids[0]] = base; let acc = base; ids.slice(1).forEach((id, i) => { acc = [...acc, ...(extra[i] || [])].sort((a, b) => a[0] - b[0]); LEARN[id] = acc; }); };
hmLine(['kitlet', 'kitlet_2', 'kitlet_3'], [[1, 'peck'], [1, 'gust'], [1, 'swiftwing'], [1, 'featherdance'], [40, 'downdraft'], [44, 'windslice'], [47, 'updraft'], [50, 'galeforce'], [54, 'whorlwind'], [60, 'skydive']],
  [[], [[58, 'tempestwing']]]);
hmLine(['flurrowl', 'flurrowl_2', 'flurrowl_3'], [[1, 'peck'], [1, 'frostnip'], [1, 'gust'], [1, 'chillmist'], [40, 'frostfeather'], [44, 'icicledart'], [47, 'downdraft'], [50, 'rimewave'], [54, 'windslice'], [58, 'galeforce'], [63, 'glacierfall']],
  [[], [[59, 'whiteout']]]);
hmLine(['wishling', 'wishling_2', 'wishling_3'], [[1, 'gust'], [1, 'glint'], [1, 'dazzle'], [1, 'updraft'], [40, 'seedsquall'], [43, 'lumenpulse'], [47, 'windslice'], [50, 'prismbeam'], [54, 'galeforce'], [60, 'radiance']],
  [[], [[57, 'wishwind']]]);
hmLine(['heathfoal', 'heathfoal_2'], [[1, 'tackle'], [1, 'gust'], [1, 'tailwhip'], [1, 'quickhop'], [40, 'gallop'], [44, 'downdraft'], [47, 'stampede'], [50, 'windslice'], [55, 'pounce'], [59, 'galeforce'], [64, 'wildrush']],
  [[[52, 'heathergallop']]]);
Object.assign(SIGNATURE, { kitlet_3: [58, 'tempestwing'], flurrowl_3: [59, 'whiteout'], wishling_3: [57, 'wishwind'], heathfoal_2: [52, 'heathergallop'] });
const HM_MONS = ['kitlet', 'kitlet_2', 'kitlet_3', 'flurrowl', 'flurrowl_2', 'flurrowl_3', 'wishling', 'wishling_2', 'wishling_3', 'heathfoal', 'heathfoal_2'];
MON_ORDER.push(...HM_MONS);
Object.assign(MON_STAGE, { kitlet_2: 2, kitlet_3: 3, flurrowl_2: 2, flurrowl_3: 3, wishling_2: 2, wishling_3: 3, heathfoal_2: 2 });
Object.assign(EXTRA_HABITAT, {
  kitlet: 'Heatherstep Cliffs and Gale Ledges (sometimes over Windward Sound)', flurrowl: 'Rare: Heatherstep Cliffs and Gale Ledges, mostly at night',
  wishling: 'Heatherstep Cliffs and Gale Ledges (glows brightest at night)', heathfoal: 'Heatherstep Cliffs (sometimes Gale Ledges), in the daytime',
});
// where they live: the routes to Highmoor get their own wild tables
WINDWARD_ENC.day.push(['kitlet', 10]); WINDWARD_ENC.night.push(['flurrowl', 3]);
ROUTES.heatherstep.enc = {
  day: [['heathfoal', 18], ['kitlet', 16], ['wishling', 12], ['craglet_2', 8], ['whirlwyn', 8], ['bristlecone_2', 8], ['ramruff', 6], ['fleecebolt', 6], ['flurrowl', 3]],
  night: [['wishling', 18], ['flurrowl', 9], ['duskcloak', 12], ['kitlet', 8], ['staticwing', 10], ['clinkit_2', 8], ['craglet_2', 6]],
};
ROUTES.galeledges.enc = {
  day: [['kitlet', 18], ['wishling', 14], ['heathfoal', 10], ['craglet_2', 10], ['staticwing', 8], ['bristlecone_2', 6], ['flurrowl', 5]],
  night: [['wishling', 18], ['flurrowl', 12], ['kitlet', 10], ['duskcloak', 10], ['staticwing', 8], ['clinkit_2', 6]],
};
// trainers on the cliffs and the pillars
ROUTES.heatherstep.trainers = [
  { id: 'hs_t1', kind: 'climber', name: 'Ffion', x: 24, y: 44, dir: 'left', sight: 4, team: [['kitlet', 46], ['ramruff', 46], ['heathfoal', 47]] },
  { id: 'hs_t2', kind: 'birdwatcher', name: 'Merlin', x: 22, y: 32, dir: 'down', sight: 3, team: [['flurrowl', 47], ['kitlet', 47], ['staticwing', 48]] },
  { id: 'hs_t3', kind: 'rambler', name: 'Heather', x: 10, y: 27, dir: 'right', sight: 4, team: [['wishling', 48], ['bristlecone_2', 48], ['heathfoal', 49]] },
  { id: 'hs_t4', kind: 'climber', name: 'Bryony', x: 25, y: 12, dir: 'left', sight: 4, team: [['craglet_2', 49], ['kitlet', 49], ['wishling', 49], ['heathfoal', 50]] },
];
ROUTES.galeledges.trainers = [
  { id: 'gl_t1', kind: 'climber', name: 'Cai', x: 30, y: 46, dir: 'left', sight: 4, team: [['kitlet_2', 50], ['heathfoal', 50], ['craglet_2', 50]] },
  { id: 'gl_t2', kind: 'birdwatcher', name: 'Linnet', x: 17, y: 31, dir: 'down', sight: 3, team: [['flurrowl_2', 51], ['wishling_2', 51], ['kitlet_2', 51]] },
  { id: 'gl_t3', kind: 'rambler', name: 'Hamish', x: 30, y: 28, dir: 'down', sight: 3, team: [['heathfoal_2', 52], ['wishling_2', 51], ['flurrowl', 51]] },
  { id: 'gl_t4', kind: 'climber', name: 'Isla', x: 30, y: 4, dir: 'left', sight: 4, team: [['kitlet_2', 52], ['flurrowl_2', 52], ['heathfoal_2', 52], ['wishling_2', 52]] },
];
