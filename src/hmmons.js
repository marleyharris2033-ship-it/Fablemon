/* ============================================================ Highmoor Fablemon (Windward Sound, Heatherstep Cliffs, Gale Ledges)
   Four lines from the user's art: the kite kestrel, the snowy owl, the dandelion sprite and the heather pony.
   Art cut by tools/art/cut_hmmons.py; their rows in mon_battle.png / mon_icons.png follow the MON_ORDER push below,
   so this file loads after seamons.js. */
Object.assign(SPECIES, {
  kitlet: { name: 'Kitlet', type: 'Gale', evo: ['kitlet_2', 53], base: { hp: 50, atk: 70, def: 44, spd: 88 }, exp: 70, rate: 90,
    desc: 'A young kestrel born with wings like a paper kite, tail ribbons and all. It hangs perfectly still on the cliff updrafts, watching the heather below.' },
  kitlet_2: { name: 'Kestrite', type: 'Gale', evo: ['kitlet_3', 61], base: { hp: 66, atk: 94, def: 58, spd: 114 }, exp: 158, rate: 60,
    desc: 'Its kite-wings have grown a second sail, painted with swirls of wind. Highmoor children fly kites in its shape for luck.' },
  kitlet_3: { name: 'Tempestrel', type: 'Gale', base: { hp: 84, atk: 122, def: 74, spd: 130 }, exp: 250, rate: 45,
    desc: 'A great storm falcon braced on wings of frame and canvas. When it dives from a gale, the wind follows it down like a falling sky.' },
  flurrowl: { name: 'Flurrowl', type: 'Frost', type2: 'Gale', evo: ['flurrowl_2', 54], base: { hp: 64, atk: 62, def: 68, spd: 58 }, exp: 74, rate: 70,
    desc: 'A round, grumpy owlet with frost on its face. It nests in the windmill sails and glares at anyone who wakes it in the daytime.' },
  flurrowl_2: { name: 'Sleethoot', type: 'Frost', type2: 'Gale', evo: ['flurrowl_3', 62], base: { hp: 86, atk: 80, def: 96, spd: 70 }, exp: 160, rate: 50,
    desc: 'A stocky snow owl with bands of clear blue ice across its wings. Each hoot brings a flurry of sleet sweeping over the moor.' },
  flurrowl_3: { name: 'Blizzowl', type: 'Frost', type2: 'Gale', base: { hp: 104, atk: 108, def: 112, spd: 86 }, exp: 252, rate: 40,
    desc: 'Its wings are slabs of glacier ice that crack like thunder when they open. The first snow of the year on Highmoor is said to fall from its feathers.' },
  wishling: { name: 'Wishling', type: 'Gale', type2: 'Glow', evo: ['wishling_2', 52], base: { hp: 48, atk: 62, def: 50, spd: 92 }, exp: 68, rate: 90,
    desc: 'A puff of dandelion fluff with two bright eyes. It drifts wherever the breeze takes it, and its seeds glow softly as they blow away.' },
  wishling_2: { name: 'Wishclock', type: 'Gale', type2: 'Glow', evo: ['wishling_3', 60], base: { hp: 66, atk: 86, def: 72, spd: 108 }, exp: 158, rate: 60,
    desc: 'It has put down roots and grown a full dandelion clock for a head. Blow on it and make a wish: its glowing seeds carry wishes off on the wind.' },
  wishling_3: { name: 'Wishbloom', type: 'Gale', type2: 'Glow', base: { hp: 86, atk: 112, def: 90, spd: 122 }, exp: 250, rate: 45,
    desc: 'A crescent of glowing seeds arcs over its golden bloom. On still summer nights the moor fills with drifting lights wherever one has danced.' },
  heathfoal: { name: 'Heathfoal', type: 'Gale', type2: 'Wild', evo: ['heathfoal_2', 55], base: { hp: 66, atk: 80, def: 56, spd: 76 }, exp: 76, rate: 80,
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
hmLine(['kitlet', 'kitlet_2', 'kitlet_3'], [[1, 'peck'], [1, 'gust'], [1, 'swiftwing'], [1, 'featherdance'], [40, 'downdraft'], [44, 'windslice'], [47, 'updraft'], [50, 'galeforce'], [56, 'whorlwind'], [64, 'skydive']],
  [[], [[61, 'tempestwing']]]);
hmLine(['flurrowl', 'flurrowl_2', 'flurrowl_3'], [[1, 'peck'], [1, 'frostnip'], [1, 'gust'], [1, 'chillmist'], [40, 'frostfeather'], [44, 'icicledart'], [47, 'downdraft'], [50, 'rimewave'], [54, 'windslice'], [58, 'galeforce'], [64, 'glacierfall']],
  [[], [[62, 'whiteout']]]);
hmLine(['wishling', 'wishling_2', 'wishling_3'], [[1, 'gust'], [1, 'glint'], [1, 'dazzle'], [1, 'updraft'], [40, 'seedsquall'], [43, 'lumenpulse'], [47, 'windslice'], [50, 'prismbeam'], [54, 'galeforce'], [60, 'radiance']],
  [[], [[60, 'wishwind']]]);
hmLine(['heathfoal', 'heathfoal_2'], [[1, 'tackle'], [1, 'gust'], [1, 'tailwhip'], [1, 'quickhop'], [40, 'gallop'], [44, 'downdraft'], [47, 'stampede'], [50, 'windslice'], [55, 'pounce'], [59, 'galeforce'], [64, 'wildrush']],
  [[[55, 'heathergallop']]]);
Object.assign(SIGNATURE, { kitlet_3: [61, 'tempestwing'], flurrowl_3: [62, 'whiteout'], wishling_3: [60, 'wishwind'], heathfoal_2: [55, 'heathergallop'] });
const HM_MONS = ['kitlet', 'kitlet_2', 'kitlet_3', 'flurrowl', 'flurrowl_2', 'flurrowl_3', 'wishling', 'wishling_2', 'wishling_3', 'heathfoal', 'heathfoal_2'];
MON_ORDER.push(...HM_MONS);
Object.assign(MON_STAGE, { kitlet_2: 2, kitlet_3: 3, flurrowl_2: 2, flurrowl_3: 3, wishling_2: 2, wishling_3: 3, heathfoal_2: 2 });
Object.assign(EXTRA_HABITAT, {
  kitlet: 'Heatherstep Cliffs and Gale Ledges (sometimes over Windward Sound)', flurrowl: 'Rare: Heatherstep Cliffs and Gale Ledges, mostly at night. Far more of them come down with the winter snow',
  wishling: 'Heatherstep Cliffs and Gale Ledges (glows brightest at night)', heathfoal: 'Heatherstep Cliffs (sometimes Gale Ledges), in the daytime',
});
// where they live: the routes to Highmoor get their own wild tables, with the moorland Fablemon from earlier routes mixed in
WINDWARD_ENC.day.push(['kitlet', 10], ['whorlcrest', 3]); WINDWARD_ENC.night.push(['flurrowl', 3]);
ROUTES.heatherstep.zones = [[0, 0, 0, 0, 47, 49], [0, 0, 0, 0, 48, 50], [0, 0, 0, 0, 49, 51]];
ROUTES.galeledges.zones = [[0, 0, 0, 0, 50, 52], [0, 0, 0, 0, 50, 52], [0, 0, 0, 0, 50, 52], [0, 0, 0, 0, 50, 52], [0, 0, 0, 0, 51, 53], [0, 0, 0, 0, 52, 54]];
ROUTES.heatherstep.enc = {
  day: [['heathfoal', 16], ['kitlet', 14], ['wishling', 10], ['bristlecone_2', 8], ['craglet_2', 8], ['whirlwyn', 7], ['fleecebolt', 6], ['ramruff', 6], ['cloverguard', 5], ['flintburrow', 5], ['flurrowl', 3], ['ramruff_2', 2]],
  night: [['wishling', 16], ['flurrowl', 9], ['duskcloak', 10], ['staticwing', 9], ['clinkit_2', 8], ['kitlet', 6], ['craglet_2', 6], ['hollowbark', 5]],
};
ROUTES.galeledges.enc = {
  day: [['kitlet', 16], ['wishling', 12], ['heathfoal', 10], ['craglet_2', 10], ['whirlwyn', 7], ['staticwing', 6], ['bristlecone_2', 6], ['ramruff_2', 4], ['flurrowl', 5], ['craglet_3', 2], ['whorlcrest', 2]],
  night: [['wishling', 16], ['flurrowl', 12], ['kitlet', 8], ['duskcloak', 8], ['clinkit_2', 8], ['staticwing', 6], ['duskwyrm', 2], ['clinkit_3', 2]],
};
// Highmoor gets the first snow: three times as many Flurrowl in winter
for (const k of ['windward', 'heatherstep', 'galeledges']) ROUTES[k].winter = { flurrowl: 3 };
// two sailors on the islands of Windward Sound (easy to sail round)
ROUTES.windward.trainers = [
  { id: 'ws_t1', kind: 'rambler', name: 'Cormac', x: 36, y: 43, dir: 'left', sight: 4, team: [['foilfin_2', 46], ['stormveil_3', 46], ['riftshear_2', 47]] },
  { id: 'ws_t2', kind: 'birdwatcher', name: 'Petra', x: 8, y: 28, dir: 'right', sight: 4, team: [['kitlet', 46], ['staticwing', 47], ['whorlcrest', 47], ['kilnback_2', 48]] },
];
// trainers on the cliffs and the pillars: the new Fablemon alongside old mountain and moorland faces
ROUTES.heatherstep.trainers = [
  { id: 'hs_t1', kind: 'climber', name: 'Ffion', x: 24, y: 44, dir: 'left', sight: 4, team: [['craglet_2', 48], ['kitlet', 48], ['ramruff_2', 49], ['heathfoal', 49]] },
  { id: 'hs_t2', kind: 'birdwatcher', name: 'Merlin', x: 22, y: 32, dir: 'down', sight: 3, team: [['flurrowl', 49], ['whorlcrest', 49], ['staticwing', 49], ['kitlet', 50]] },
  { id: 'hs_t3', kind: 'rambler', name: 'Heather', x: 10, y: 27, dir: 'right', sight: 4, team: [['wishling', 50], ['bristlecone_3', 50], ['cloverlegion', 50], ['fleecebolt', 50], ['heathfoal', 51]] },
  { id: 'hs_t4', kind: 'climber', name: 'Bryony', x: 25, y: 12, dir: 'left', sight: 4, team: [['craglet_3', 51], ['flintcairn', 51], ['kitlet', 51], ['wishling_2', 52], ['heathfoal', 52]] },
];
ROUTES.galeledges.trainers = [
  { id: 'gl_t1', kind: 'climber', name: 'Cai', x: 30, y: 46, dir: 'left', sight: 4, team: [['craglet_3', 52], ['ramruff_2', 52], ['heathfoal', 53], ['kitlet_2', 53]] },
  { id: 'gl_t2', kind: 'birdwatcher', name: 'Linnet', x: 17, y: 31, dir: 'down', sight: 3, team: [['whorlcrest', 53], ['duskwyrm', 53], ['flurrowl', 53], ['moonspark', 53], ['wishling_2', 54]] },
  { id: 'gl_t3', kind: 'rambler', name: 'Hamish', x: 30, y: 28, dir: 'down', sight: 3, team: [['plumevix', 54], ['bristlecone_3', 54], ['heathfoal', 54], ['kitlet_2', 54], ['flurrowl_2', 54]] },
  { id: 'gl_t4', kind: 'climber', name: 'Isla', x: 30, y: 4, dir: 'left', sight: 4, team: [['craglet_3', 54], ['clinkit_3', 54], ['wishling_2', 55], ['flurrowl_2', 55], ['heathfoal_2', 55]] },
];
