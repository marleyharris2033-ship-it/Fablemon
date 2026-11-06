/* ============================================================ The Nipshade line (Saltgrass Dunes)
   A shadowy hermit crab found only on the route to Driftwood Cove. Art cut by tools/art/cut_tidemons.py;
   its rows in mon_battle.png / mon_icons.png come straight after the third forms, so this file must load after thirds.js. */
Object.assign(SPECIES, {
  nipshade: { name: 'Nipshade', type: 'Tide', type2: 'Shade', evo: ['nipshade_2', 38], base: { hp: 52, atk: 66, def: 72, spd: 44 }, exp: 66, rate: 90,
    desc: 'A mischievous hermit crab that hides in the shade of driftwood and nips at bare toes. Only its grin and two glowing eyes show from under its shell.' },
  nipshade_2: { name: 'Dreadclaw', type: 'Tide', type2: 'Shade', evo: ['nipshade_3', 50], base: { hp: 74, atk: 90, def: 104, spd: 48 }, exp: 155, rate: 60,
    desc: 'Its shell has grown into spiked armour crusted with barnacles. It lurks in rock pools at low tide, and its great hooked claw can snap an oar in two.' },
  nipshade_3: { name: 'Wreckraken', type: 'Tide', type2: 'Shade', base: { hp: 98, atk: 110, def: 126, spd: 44 }, exp: 245, rate: 45,
    desc: 'It has outgrown every shell on the shore and now wears a sunken ship. Sailors say the tattered sail rising out of the fog is the last thing a careless crew ever sees.' },
});
Object.assign(MOVES, {
  dreadpincer: { name: 'Dread Pincer', type: 'Shade', pow: 80, acc: 95, crit: 1 },
  shipwreck: { name: 'Shipwreck', type: 'Tide', pow: 100, acc: 95, useDef: 1 },
});
LEARN.nipshade = [[1, 'tackle'], [1, 'harden'], [1, 'shadownip'], [1, 'aquaflick'], [31, 'weirwave'], [33, 'gloomgrip'], [36, 'undertow'], [40, 'rampartbash'], [44, 'phantomclaw'], [48, 'fortify'], [54, 'tidalcrash']];
LEARN.nipshade_2 = [...LEARN.nipshade, [38, 'dreadpincer']].sort((a, b) => a[0] - b[0]);
Object.assign(SIGNATURE, { nipshade_3: [50, 'shipwreck'] });
LEARN.nipshade_3 = [...LEARN.nipshade_2, SIGNATURE.nipshade_3].sort((a, b) => a[0] - b[0]);
MON_ORDER.push('nipshade', 'nipshade_2', 'nipshade_3');
Object.assign(MON_STAGE, { nipshade_2: 2, nipshade_3: 3 });
Object.assign(EXTRA_HABITAT, { nipshade: 'Saltgrass Dunes grass, on the way to Driftwood Cove (more after dark)' });
DUNE_ENC.day.push(['nipshade', 8]); DUNE_ENC.night.push(['nipshade', 16]);
