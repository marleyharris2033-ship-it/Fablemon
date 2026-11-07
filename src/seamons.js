/* ============================================================ Sea Fablemon (Glimmer Sea, Tidewrack Shoals, Stormwatch Strait)
   Five lines from the user's art: the storm shark, the lantern kraken, the kiln turtle, the swordfish and the iceberg whale.
   Art cut by tools/art/cut_seamons.py; their rows in mon_battle.png / mon_icons.png follow the MON_ORDER push below,
   so this file loads after tidemons.js and sea.js. Floecalf's line brings the first Frost moves into the game. */
Object.assign(SPECIES, {
  riftshear: { name: 'Riftshear', type: 'Tide', type2: 'Spark', evo: ['riftshear_2', 44], base: { hp: 55, atk: 72, def: 48, spd: 80 }, exp: 70, rate: 90,
    desc: 'A young shark made of curling surf. Its fins crackle when a storm is near, and it rides the front of breaking waves for fun.' },
  riftshear_2: { name: 'Squalljaw', type: 'Tide', type2: 'Spark', evo: ['riftshear_3', 54], base: { hp: 72, atk: 96, def: 62, spd: 102 }, exp: 160, rate: 60,
    desc: 'Its body has split into twin rip currents trailing lightning. Schools of fish scatter the moment its golden fins break the water.' },
  riftshear_3: { name: 'Maelstromaw', type: 'Tide', type2: 'Spark', base: { hp: 90, atk: 122, def: 78, spd: 118 }, exp: 250, rate: 45,
    desc: 'A living waterspout coiled around a core of lightning. Sailors who see it rise in Stormwatch Strait turn for home and do not argue about it.' },
  inkwick: { name: 'Inkwick', type: 'Shade', type2: 'Glow', evo: ['inkwick_2', 42], base: { hp: 52, atk: 68, def: 54, spd: 66 }, exp: 68, rate: 90,
    desc: 'A paper-lantern squid that drifts up from the deep on dark nights. The warm glow in its folds lures curious fish, and curious sailors.' },
  inkwick_2: { name: 'Gloamwick', type: 'Shade', type2: 'Glow', evo: ['inkwick_3', 52], base: { hp: 70, atk: 90, def: 72, spd: 86 }, exp: 158, rate: 60,
    desc: 'It snaps open a great painted fan covered in glowing eyes. Whatever it is staring at, it is staring with all of them.' },
  inkwick_3: { name: 'Umbraclipse', type: 'Shade', type2: 'Glow', base: { hp: 92, atk: 112, def: 92, spd: 98 }, exp: 248, rate: 45,
    desc: 'A towering lantern-kraken crowned by a black sun. When it spreads its fans the moon goes dark, and the only light on the sea is its own.' },
  kilnback: { name: 'Kilnback', type: 'Tide', type2: 'Ember', evo: ['kilnback_2', 42], base: { hp: 68, atk: 62, def: 82, spd: 38 }, exp: 70, rate: 90,
    desc: 'A sea turtle whose shell is a little brick kiln. It basks on hot vents in the shoals, and a cosy fire flickers in its doorway.' },
  kilnback_2: { name: 'Brineforge', type: 'Tide', type2: 'Ember', evo: ['kilnback_3', 53], base: { hp: 88, atk: 90, def: 108, spd: 48 }, exp: 158, rate: 60,
    desc: 'It stood up one day and never sat back down. Its arms are furnace barrels that fire scalding steam; it hisses whenever a wave hits it.' },
  kilnback_3: { name: 'Breakbastion', type: 'Tide', type2: 'Ember', base: { hp: 112, atk: 112, def: 138, spd: 46 }, exp: 252, rate: 45,
    desc: 'A walking sea fortress with waterfalls pouring through its furnace arches. Old harbour walls were said to be built around sleeping ones.' },
  foilfin: { name: 'Foilfin', type: 'Tide', type2: 'Gale', evo: ['foilfin_2', 41], base: { hp: 50, atk: 74, def: 46, spd: 84 }, exp: 68, rate: 90,
    desc: 'A ribbon-thin swordfish that loops through the air between waves. It practises fencing with driftwood and always wins.' },
  foilfin_2: { name: 'Sabresail', type: 'Tide', type2: 'Gale', evo: ['foilfin_3', 52], base: { hp: 66, atk: 96, def: 58, spd: 108 }, exp: 158, rate: 60,
    desc: 'Its fins have spread into sails. It glides for miles on the sea wind, then folds them and drops like a thrown spear.' },
  foilfin_3: { name: 'Galleolance', type: 'Tide', type2: 'Gale', base: { hp: 84, atk: 124, def: 76, spd: 122 }, exp: 250, rate: 45,
    desc: 'A sea dragon rigged like a war galleon. It charges sail-first into the wind with its great lance lowered, and nothing stays in its way.' },
  floecalf: { name: 'Floecalf', type: 'Tide', type2: 'Frost', evo: ['floecalf_2', 46], base: { hp: 90, atk: 60, def: 70, spd: 40 }, exp: 74, rate: 70,
    desc: 'A chubby whale calf with a little ice floe stuck on its back. It puffs out snowflakes instead of spray, and loves to be scratched under the chin.' },
  floecalf_2: { name: 'Rimeback', type: 'Tide', type2: 'Frost', base: { hp: 140, atk: 104, def: 112, spd: 52 }, exp: 255, rate: 35,
    desc: "A gentle giant whose back has grown into a snowy iceberg, arches and all. Sailors steer by the white plume of its freezing breath." },
});
Object.assign(MOVES, {
  // ---- the first Frost moves
  frostnip: { name: 'Frost Nip', type: 'Frost', pow: 40, acc: 100 },
  icicledart: { name: 'Icicle Dart', type: 'Frost', pow: 25, acc: 95, hits: [2, 4] },
  chillmist: { name: 'Chill Mist', type: 'Frost', stat: ['foe', 'spd', -2] },
  rimewave: { name: 'Rime Wave', type: 'Frost', pow: 80, acc: 100, boost: ['foe', 'spd', -1, 30] },
  glacierfall: { name: 'Glacierfall', type: 'Frost', pow: 110, acc: 85 },
  // ---- signatures
  maelstrommaw: { name: 'Maelstrom Maw', type: 'Tide', pow: 100, acc: 90, st: ['par', 30] },
  umbralcorona: { name: 'Umbral Corona', type: 'Glow', pow: 100, acc: 90, flinch: .2 },
  steambreaker: { name: 'Steam Breaker', type: 'Ember', pow: 95, acc: 100, useDef: 1 },
  galleonlance: { name: 'Galleon Lance', type: 'Gale', pow: 100, acc: 95, crit: 1 },
  icebergbreach: { name: 'Iceberg Breach', type: 'Frost', pow: 100, acc: 90, flinch: .3 },
});
const seaLine = (ids, base, extra) => { LEARN[ids[0]] = base; let acc = base; ids.slice(1).forEach((id, i) => { acc = [...acc, ...(extra[i] || [])].sort((a, b) => a[0] - b[0]); LEARN[id] = acc; }); };
seaLine(['riftshear', 'riftshear_2', 'riftshear_3'], [[1, 'splashjet'], [1, 'staticbuzz'], [1, 'aquaflick'], [1, 'sparkdash'], [38, 'undertow'], [41, 'arclash'], [47, 'millrace'], [50, 'boltwing'], [56, 'voltcrash'], [60, 'tidalcrash']],
  [[[44, 'stormlash']], [[54, 'maelstrommaw']]]);
seaLine(['inkwick', 'inkwick_2', 'inkwick_3'], [[1, 'shadownip'], [1, 'glint'], [1, 'dazzle'], [1, 'lumenpulse'], [38, 'haunt'], [40, 'nightdrop'], [43, 'prismbeam'], [46, 'gloomgrip'], [50, 'eclipse'], [55, 'phantomclaw'], [60, 'radiance']],
  [[], [[52, 'umbralcorona']]]);
seaLine(['kilnback', 'kilnback_2', 'kilnback_3'], [[1, 'tackle'], [1, 'harden'], [1, 'emberpuff'], [1, 'splashjet'], [38, 'boilspout'], [40, 'cinderslam'], [43, 'kilnguard'], [46, 'smoulder'], [49, 'scaldspout'], [54, 'furnacefist'], [60, 'wildfire']],
  [[], [[53, 'steambreaker']]]);
seaLine(['foilfin', 'foilfin_2', 'foilfin_3'], [[1, 'peck'], [1, 'aquaflick'], [1, 'gust'], [1, 'swiftwing'], [38, 'weirwave'], [40, 'windslice'], [43, 'undertow'], [46, 'galeforce'], [50, 'millrace'], [55, 'skydive'], [60, 'tidalcrash']],
  [[], [[52, 'galleonlance']]]);
seaLine(['floecalf', 'floecalf_2'], [[1, 'tackle'], [1, 'splashjet'], [1, 'frostnip'], [1, 'growl'], [38, 'icicledart'], [41, 'rainveil'], [44, 'rimewave'], [48, 'chillmist'], [52, 'millrace'], [56, 'glacierfall'], [62, 'tidalcrash']],
  [[[46, 'icebergbreach']]]);
Object.assign(SIGNATURE, { riftshear_3: [54, 'maelstrommaw'], inkwick_3: [52, 'umbralcorona'], kilnback_3: [53, 'steambreaker'], foilfin_3: [52, 'galleonlance'], floecalf_2: [46, 'icebergbreach'] });
const SEA_MONS = ['riftshear', 'riftshear_2', 'riftshear_3', 'inkwick', 'inkwick_2', 'inkwick_3', 'kilnback', 'kilnback_2', 'kilnback_3', 'foilfin', 'foilfin_2', 'foilfin_3', 'floecalf', 'floecalf_2'];
MON_ORDER.push(...SEA_MONS);
Object.assign(MON_STAGE, { riftshear_2: 2, riftshear_3: 3, inkwick_2: 2, inkwick_3: 3, kilnback_2: 2, kilnback_3: 3, foilfin_2: 2, foilfin_3: 3, floecalf_2: 2 });
Object.assign(EXTRA_HABITAT, {
  riftshear: 'Rough water in Stormwatch Strait', inkwick: 'Any of the three sea routes, only at night', kilnback: 'Tidewrack Shoals (sometimes the Glimmer Sea)',
  foilfin: 'The Glimmer Sea (sometimes Tidewrack Shoals)', floecalf: 'Rare: the Glimmer Sea and Stormwatch Strait',
});
// where they swim
SEA_ENC.day.push(['foilfin', 12], ['kilnback', 6], ['floecalf', 4]); SEA_ENC.night.push(['inkwick', 14], ['floecalf', 3]);
SHOAL_ENC.day.push(['kilnback', 14], ['foilfin', 8]); SHOAL_ENC.night.push(['inkwick', 14], ['kilnback', 8]);
STORM_ENC.day.push(['riftshear', 16], ['floecalf', 5]); STORM_ENC.night.push(['riftshear', 14], ['inkwick', 14]);
// every sea trainer mixes the new sea Fablemon in with the old faces
for (const [rt, id, team] of [
  ['glimmer', 'gs_t1', [['brookstride', 38], ['foilfin', 38], ['inkwick', 39]]],
  ['glimmer', 'gs_t2', [['whirlwyn', 39], ['foilfin', 39], ['staticwing', 40]]],
  ['glimmer', 'gs_t3', [['mirebellows', 40], ['kilnback', 40], ['foilfin_2', 41]]],
  ['shoals', 'ts_t1', [['lotveil', 41], ['kilnback', 41], ['foilfin_2', 42]]],
  ['shoals', 'ts_t2', [['brookstride', 42], ['floecalf', 42], ['kilnback_2', 43], ['marshviper', 43]]],
  ['stormwatch', 'sw_t1', [['staticwing', 41], ['riftshear', 42], ['foilfin_2', 42]]],
  ['stormwatch', 'sw_t2', [['riftshear', 42], ['kilnback_2', 42], ['inkwick_2', 43], ['mirebellows', 43]]]]) {
  const t = ROUTES[rt].trainers.find(q => q.id === id); if (t) t.team = team;
}
