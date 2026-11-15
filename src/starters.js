/* ============================================================ The new starters (the user's Starter Collection, 15 Nov 2026)
   Samarrow (Leaf), Wickid (Ember) and Rillcurl (Tide) are the three Fablemon in the Hearthroot's roots now.
   Each line copies the old starter line it replaces (stats, types, moves, signature move, evolution levels, role),
   so the balance is unchanged; only the creature, its name and its entry are new.
   The old starters (Hedglet, Cindimple, Rillip) are now rare finds in the Meadow Trail's long grass.
   Saves that already chose an old starter keep it. Art cut by tools/art/cut_starters.py (rows follow the push below). */
const STARTER_SWAP = {
  hedglet: ['samarrow', 'Samarrow', 'A playful seed spirit that hangs one-handed beneath a spinning sycamore seed. Its copper scarf streams behind it as it drifts over the hedgerows.'],
  briamble: ['samaslice', 'Samaslice', 'Now light-footed enough to ride the seed, Samaslice crouches over the hub and banks between branches by shifting its weight.'],
  hedgerholt: ['samarazor', 'Samarazor', 'Armoured in seed husks, Samarazor rides a four-bladed propeller and carries twin sycamore sickles. Its autumn-coloured mane folds back as it dives.'],
  cindimple: ['wickid', 'Wickid', 'A sly imp that hides its grin behind a beeswax cape. The golden flame on its braided tail tends to give away its hiding place.'],
  kilnook: ['wickveil', 'Wickveil', 'Wickveil opens its wax cloak like lantern shutters. The golden lining catches the light from its tail, making the little imp loom large at dusk.'],
  hearthrusk: ['solwick', 'Solwick', 'A living beacon crowned with amber reflectors. Solwick plants both feet and turns its wax mantle towards its tail flame, focusing the light through its great chest lens.'],
  rillip: ['rillcurl', 'Rillcurl', 'A cheeky turquoise river drake with webbed feet and two blue stripes. Its tail rises into a foamy wave, and it loves to tumble downstream inside the curl.'],
  weirlet: ['riptwake', 'Riptwake', 'Riptwake braces its forefeet against the riverbed and draws its tail around one shoulder. The hollow breaker shields it until it lunges through the open curl.'],
  merewheel: ['maelstromaw', 'Maelstromaw', 'An estuary guardian with a broad fanged muzzle and whitewater cheek fins. A whirlpool coils through its tail, ready to break forwards in one sweep.'],
};
const NEW_ID = Object.fromEntries(Object.entries(STARTER_SWAP).map(([o, [n]]) => [o, n]));
for (const [old, [id, name, desc]] of Object.entries(STARTER_SWAP)) {
  const s = JSON.parse(JSON.stringify(SPECIES[old]));
  s.name = name; s.desc = desc; if (s.evo) s.evo[0] = NEW_ID[s.evo[0]] || s.evo[0];
  SPECIES[id] = s;
  if (LEARN[old]) LEARN[id] = LEARN[old].map(r => [...r]);
  if (SIGNATURE[old]) SIGNATURE[id] = [...SIGNATURE[old]];
  if (MON_STAGE[old] !== undefined) MON_STAGE[id] = MON_STAGE[old];
  if (LINE_ROLE[old]) LINE_ROLE[id] = LINE_ROLE[old];
}
MON_ORDER.push('samarrow', 'samaslice', 'samarazor', 'wickid', 'wickveil', 'solwick', 'rillcurl', 'riptwake', 'maelstromaw');
STARTERS.splice(0, STARTERS.length, 'samarrow', 'wickid', 'rillcurl');
// the old three, now wild on the Meadow Trail (rare)
for (const [sp, d, n] of [['hedglet', 4, 2], ['cindimple', 4, 2], ['rillip', 4, 3]]) { ROUTES.route1.enc.day.push([sp, d]); ROUTES.route1.enc.night.push([sp, n]); EXTRA_HABITAT[sp] = 'Meadow Trail long grass (rare)'; }
