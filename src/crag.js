/* ============================================================ Cragside Pass
   The mountain road north of Brookholt, in three parts and a mine:
     crag1  Cragside Pass     an ordinary route (grass, trainers, items)
     crag2  Cragside Heights  boulder puzzles: push boulders into crevasses to fill them
     crag3  Old Rail Cutting  mine-cart rides: pull levers to set the points, ride to the old mine
     cragmine  the Old Mine   the chamber of Fulgarok, the first legendary Fablemon
   Maps are text (crag_maps.json, made by work/crag/gen.py, which also checks every puzzle can be solved):
     #  rock          .  ground        ,  gravel path     0-9  long grass (zone)
     T  pine tree     o  small rocks   O  big boulder     B    boulder you can push
     C  crevasse      =  plank bridge  rails: ─ │ ┌ ┐ └ ┘ ┬ ┴ ├ ┤ ┼ and ■ (a buffer stop where carts wait) */
const crag = () => (S.crag = S.crag || { filled: {}, used: {}, sw: { W1: 0, W2: 0, W3: 0 }, legendDay: -1 });
const RAILS = '─│┌┐└┘┬┴├┤┼■';
const RAIL_CONN = { '─': 'EW', '│': 'NS', '┌': 'ES', '┐': 'WS', '└': 'NE', '┘': 'NW', '┬': 'WES', '┴': 'WEN', '├': 'NSE', '┤': 'NSW', '┼': 'NSEW' };
const CDV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }, OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

/* ---------- the legend: Fulgarok, the Geode Storm Fablemon (Stone/Spark, level 40, very hard to catch) */
SPECIES.fulgarok = { name: 'Fulgarok', title: 'Geode Storm Fablemon', type: 'Stone', type2: 'Spark', legend: true, base: { hp: 108, atk: 115, def: 120, spd: 78 }, exp: 290, rate: 10,
  desc: 'The Geode Storm Fablemon. It sleeps coiled beneath the mountains, storing lightning within its crystals. When it stirs, thunder echoes through the mines.' };
MOVES.geodestorm = { name: 'Geode Storm', type: 'Spark', pow: 95, acc: 90, boost: ['foe', 'def', -1, 100], pp: 5 };   // crystal shards crack the target's guard; only 5 uses
LEARN.fulgarok = [[1, 'rockroll'], [1, 'sparkdash'], [1, 'harden'], [30, 'slateslam'], [34, 'boltwing'], [38, 'geodestorm'], [44, 'rampartcrush']];
MON_ORDER.push('fulgarok'); MON_STAGE.fulgarok = 3;
const LEGEND = { sp: 'fulgarok', lv: 40 };

/* ---------- the Fablemon of the pass (first stages; their evolutions arrive with their art) */
Object.assign(MOVES, {
  glint: { name: 'Glint', type: 'Glow', pow: 40, acc: 100 },
  dazzle: { name: 'Dazzle', type: 'Glow', stat: ['foe', 'atk', -1] },
  lumenpulse: { name: 'Lumen Pulse', type: 'Glow', pow: 60, acc: 100 },
  prismbeam: { name: 'Prism Beam', type: 'Glow', pow: 80, acc: 95, boost: ['foe', 'spd', -1, 30] },
  radiance: { name: 'Radiance', type: 'Glow', pow: 110, acc: 85 },
});
Object.assign(SPECIES, {
  craglet: { name: 'Craglet', type: 'Stone', evo: ['craglet_2', 30], base: { hp: 45, atk: 62, def: 58, spd: 52 }, exp: 62, rate: 120, desc: 'A griffin chick with feathers of split slate. It nests on narrow cliff ledges and sharpens its beak by pecking at the rock face.' },
  cindhop: { name: 'Cindhop', type: 'Ember', type2: 'Stone', evo: ['cindhop_2', 28], base: { hp: 46, atk: 64, def: 50, spd: 64 }, exp: 64, rate: 120, desc: 'A hare of cooled lava. Glowing cracks open along its body when it gets excited, and its tail is a smouldering ember that never quite goes out.' },
  bristlecone: { name: 'Bristlecone', type: 'Leaf', type2: 'Gale', evo: ['bristlecone_2', 26], base: { hp: 52, atk: 56, def: 62, spd: 40 }, exp: 60, rate: 140, desc: 'It curls up and rolls down mountain slopes like a pinecone. Wherever it finally stops, it shakes loose a few seeds, and in time a young pine grows there.' },
  clinkit: { name: 'Clinkit', type: 'Stone', type2: 'Glow', evo: ['clinkit_2', 32], base: { hp: 50, atk: 44, def: 74, spd: 30 }, exp: 68, rate: 90, desc: 'It hides under a bell of stone threaded with golden light. On still nights in the mountains you can hear it chime softly as it shuffles about.' },
  ramruff: { name: 'Ramruff', type: 'Wild', evo: ['ramruff_2', 40], base: { hp: 66, atk: 74, def: 58, spd: 52 }, exp: 92, rate: 100, desc: 'A shaggy mountain goat that settles every argument by headbutting it. It leaps between ledges that look far too far apart.' },
});
Object.assign(LEARN, {
  craglet: [[1, 'tackle'], [1, 'harden'], [5, 'peck'], [9, 'pebbletoss'], [13, 'gust'], [17, 'rockroll'], [21, 'scree'], [25, 'swiftwing'], [29, 'slateslam'], [34, 'rockslide'], [40, 'galeforce'], [46, 'flintedge'], [52, 'landslide']],
  cindhop: [[1, 'tackle'], [1, 'tailwhip'], [5, 'emberpuff'], [9, 'quickhop'], [13, 'pebbletoss'], [17, 'emberdash'], [21, 'rockroll'], [25, 'cinderslam'], [29, 'bonfirekick'], [34, 'slateslam'], [40, 'furnacefist'], [46, 'rampartbash'], [52, 'flarerush']],
  bristlecone: [[1, 'tackle'], [1, 'harden'], [5, 'leafflick'], [9, 'bramblecurl'], [13, 'thornvolley'], [17, 'rockroll'], [21, 'bramblespikes'], [25, 'sapsip'], [29, 'hedgecrash'], [34, 'rootdrain'], [40, 'overgrow'], [46, 'landslide'], [52, 'bloomburst']],
  clinkit: [[1, 'tackle'], [1, 'harden'], [5, 'glint'], [9, 'pebbletoss'], [13, 'dazzle'], [17, 'lumenpulse'], [21, 'bulwark'], [25, 'rockroll'], [29, 'prismbeam'], [34, 'slateslam'], [40, 'fortify'], [46, 'radiance'], [52, 'rampartcrush']],
  ramruff: [[1, 'tackle'], [1, 'growl'], [5, 'headbutt'], [9, 'quickhop'], [13, 'pebbletoss'], [17, 'brace'], [21, 'stampede'], [25, 'rockroll'], [29, 'battlecry'], [34, 'pounce'], [40, 'rampartbash'], [46, 'laststand'], [52, 'wildrush']],
});
// their evolutions: the middle stage of the three-stage lines, and Ramruff's final form
Object.assign(SPECIES, {
  craglet_2: { name: 'Cragryph', type: 'Stone', type2: 'Gale', evo: ['craglet_3', 46], base: { hp: 68, atk: 86, def: 74, spd: 78 }, exp: 150, rate: 60, desc: 'Its slate wings have grown strong enough to ride the mountain winds. It circles the high peaks for hours, then drops like a falling rock onto its prey.' },
  cindhop_2: { name: 'Cinderhare', type: 'Ember', type2: 'Stone', evo: ['cindhop_3', 44], base: { hp: 64, atk: 88, def: 64, spd: 90 }, exp: 150, rate: 60, desc: 'Molten light runs through the cracks in its stony coat, and its tail has become a roaring flame. It bounds across hot scree faster than the eye can follow.' },
  bristlecone_2: { name: 'Bristlestag', type: 'Leaf', type2: 'Gale', evo: ['bristlecone_3', 42], base: { hp: 76, atk: 78, def: 86, spd: 52 }, exp: 148, rate: 60, desc: 'Its antlers are living branches, and flowers bloom in its pine-scale coat each spring. Saplings are said to spring up along the paths it walks.' },
  clinkit_2: { name: 'Chimestone', type: 'Stone', type2: 'Glow', evo: ['clinkit_3', 48], base: { hp: 72, atk: 62, def: 104, spd: 36 }, exp: 155, rate: 50, desc: 'Golden crystals crown its heavy shell. When it rings, the sound carries through the whole mountain, and miners once used its chime to find their way out.' },
  ramruff_2: { name: 'Rambastion', type: 'Wild', base: { hp: 98, atk: 110, def: 90, spd: 68 }, exp: 230, rate: 45, desc: 'Its great curled horns are hard as granite and glow faintly when it charges. A single headbutt can split a boulder clean in two.' },
});
for (const sp of ['craglet', 'cindhop', 'bristlecone', 'clinkit', 'ramruff']) LEARN[sp + '_2'] = LEARN[sp];
LEARN.bristlecone = [...LEARN.bristlecone, [11, 'gust'], [31, 'windslice']].sort((a, b) => a[0] - b[0]); LEARN.bristlecone_2 = LEARN.bristlecone;
LEARN.craglet_2 = [...LEARN.craglet, [30, 'windslice'], [50, 'skydive']].sort((a, b) => a[0] - b[0]);
MON_ORDER.push('craglet', 'cindhop', 'bristlecone', 'clinkit', 'ramruff', 'craglet_2', 'cindhop_2', 'bristlecone_2', 'clinkit_2', 'ramruff_2');
Object.assign(MON_STAGE, { craglet_2: 2, cindhop_2: 2, bristlecone_2: 2, clinkit_2: 2, ramruff_2: 2 });
Object.assign(EXTRA_HABITAT, {
  craglet: 'Cragside Pass and Cragside Heights long grass', cindhop: 'Cragside Pass and Cragside Heights long grass',
  bristlecone: 'Cragside Pass long grass, in the daytime', ramruff: 'Cragside Pass and Cragside Heights long grass',
  clinkit: 'Cragside Pass and Cragside Heights long grass, mostly after dark', fulgarok: 'Asleep deep inside the Old Mine, beyond the Old Rail Cutting',
});

/* ---------- trainers of the pass */
TRAINER_ROW.miner = 9; TRAINER_ROW.climber = 10;
TRAINER_TYPES.climber = { label: 'Climber', challenge: ["You don't get views like this down in the bog! Let's battle up here!", "Every peak's better with a battle at the top!"], lose: ["I'll stick to climbing, I think.", "Fell at the last handhold. Well played!"], after: ["The boulders up the Heights move if you put your back into them.", "Watch your footing near the crevasses."] };
TRAINER_TYPES.miner = { label: 'Miner', challenge: ["Oi! This is a working cutting. Well, it was. Fancy a scrap?", "Forty years down the seams. Let's see what you've got!"], lose: ["Struck rock bottom there.", "You dig deep, I'll give you that."], after: ["Change the points before you ride, or you'll end up somewhere daft.", "There's something in the old mine. Hums all night, it does."] };

const CRAG_ENC = { day: [['craglet', 20], ['bristlecone', 18], ['cindhop', 15], ['ramruff', 12], ['flintburrow', 9], ['whirlwyn', 8], ['staticwing', 7], ['mortoad', 5], ['yawnox', 3], ['clinkit', 3]], night: [['clinkit', 22], ['duskcloak', 18], ['craglet', 12], ['ramruff', 12], ['staticwing', 12], ['cindhop', 10], ['flintburrow', 8], ['kilnook', 6]] };
Object.assign(ROUTES, {
  crag1: { name: 'Cragside Pass', w: 36, h: 50, ascii: 'crag1', crag: true,
    zones: [[0, 0, 0, 0, 22, 24], [0, 0, 0, 0, 23, 25], [0, 0, 0, 0, 23, 25], [0, 0, 0, 0, 24, 26], [0, 0, 0, 0, 24, 26]],
    pickups: [{ id: 'c1', x: 31, y: 46, item: 'sturdy_charm', n: 3 }, { id: 'c2', x: 4, y: 25, item: 'tonic', n: 2 }, { id: 'c3', x: 30, y: 2, gold: 1200 }, { id: 'c4', x: 13, y: 8, item: 'mon_treat', n: 2 }],
    signs: { '14,47': 'Cragside Pass. The old mountain road climbs north to the Heights and on to Quarrydown.', '20,7': '__heal', '14,2': 'North: Cragside Heights. Watch out for loose boulders.' },
    trainers: [
      { id: 'cp1', kind: 'climber', name: 'Holly', x: 19, y: 44, dir: 'left', sight: 3, team: [['craglet', 24], ['flintburrow', 25]] },
      { id: 'cp2', kind: 'miner', name: 'Bert', x: 9, y: 30, dir: 'left', sight: 3, team: [['mortoad', 25], ['cindhop', 25], ['flintburrow', 26]] },
      { id: 'cp3', kind: 'climber', name: 'Rhys', x: 22, y: 23, dir: 'down', sight: 3, team: [['staticwing', 26], ['whirlwyn', 26]] },
      { id: 'cp4', kind: 'climber', name: 'Peg', x: 25, y: 14, dir: 'right', sight: 3, team: [['bristlecone', 26], ['ramruff', 26], ['staticwing', 27]] },
    ],
    exits: [{ r: [16, 49, 18, 49], to: x => ['brookholt', { x: x + 5, y: 1, dir: 'down' }] }, { r: [16, 0, 18, 0], to: x => ['crag2', { x: x + 2, y: 42, dir: 'up' }] }],
    spawn: { x: 17, y: 47, dir: 'up' }, enc: CRAG_ENC },
  crag2: { name: 'Cragside Heights', w: 40, h: 44, quiet: true, ascii: 'crag2', crag: true,
    zones: [[0, 0, 0, 0, 26, 28], [0, 0, 0, 0, 27, 29], [0, 0, 0, 0, 28, 30], [0, 0, 0, 0, 29, 31]],
    pickups: [{ id: 'h1', x: 33, y: 25, item: 'root_charm', n: 5 }, { id: 'h2', x: 6, y: 15, item: 'tonic', n: 3 }, { id: 'h3', x: 33, y: 3, gold: 2000 }, { id: 'h4', x: 7, y: 36, item: 'honey', n: 3 }],
    signs: { '15,35': 'A crevasse cuts across the road. That boulder looks loose: walk into it to push it. Fill the gap and you can cross!', '23,31': '__cgcairn', '5,26': 'West: the Old Rail Cutting. The miners rode carts down to the old mine.', '31,19': '__cgcairn', '21,13': '__cgcairn', '17,3': '__heal' },
    trainers: [
      { id: 'ch1', kind: 'climber', name: 'Gwen', x: 26, y: 38, dir: 'left', sight: 4, team: [['staticwing', 28], ['flintburrow', 28], ['whirlwyn', 29]] },
      { id: 'ch2', kind: 'miner', name: 'Dai', x: 31, y: 29, dir: 'left', sight: 4, team: [['clinkit', 29], ['kilnook', 30]] },
      { id: 'ch3', kind: 'climber', name: 'Effie', x: 9, y: 12, dir: 'right', sight: 4, team: [['ramruff', 30], ['craglet_2', 31], ['staticwing', 31]] },
      { id: 'ch4', kind: 'miner', name: 'Morgan', x: 29, y: 6, dir: 'left', sight: 3, team: [['flintburrow', 31], ['duskcloak', 32], ['pyrebrash', 33]] },
    ],
    gate: { area: [18, 0, 20, 1], sign: [21, 2], ok: () => false, text: "The road to Quarrydown is still buried under the landslide. The road crews are digging it out. (Coming soon!)" },
    exits: [{ r: [17, 43, 21, 43], to: x => ['crag1', { x: Math.max(16, Math.min(18, x - 2)), y: 1, dir: 'down' }] }, { r: [0, 25, 0, 27], to: y => ['crag3', { x: 44, y: y + 2, dir: 'left' }], axis: 'y' }],
    spawn: { x: 19, y: 41, dir: 'up' }, enc: CRAG_ENC },
  crag3: { name: 'Old Rail Cutting', w: 46, h: 38, quiet: true, ascii: 'crag3', crag: true, zones: [],
    pickups: [{ id: 'k1', x: 10, y: 17, item: 'sturdy_charm', n: 5 }, { id: 'k2', x: 20, y: 9, gold: 2500 }, { id: 'k3', x: 43, y: 1, item: 'mon_treat', n: 3 }, { id: 'k4', x: 3, y: 4, item: 'tonic', n: 3 }],
    signs: { '38,25': "The Old Rail Cutting. Stand by a cart and press the action button to ride it. Carts run until they reach a buffer stop.", '43,25': '__heal', '23,24': 'Levers set the points at the junction ahead. Pull one, watch which way the rails turn, then ride!',
      '27,24': '__cgpoint:W1', '36,8': '__cgpoint:W2', '43,2': '__cgpoint:W3',
      '22,30': '__cgbell', '10,21': '__cgbell', '39,12': '__cgbell', '44,6': '__cgbell', '20,12': '__cgbell', '3,9': '__cgbell',
      '36,28': '__cgcart:A', '30,28': '__cgcart:B', '25,23': '__cgcart:C', '16,19': '__cgcart:D', '32,14': '__cgcart:E', '34,7': '__cgcart:F', '40,4': '__cgcart:G', '26,10': '__cgcart:H', '9,3': '__cgcart:I' },
    trainers: [
      { id: 'rc1', kind: 'miner', name: 'Ifor', x: 11, y: 19, dir: 'right', sight: 4, team: [['flintburrow', 30], ['rampartoad', 31]] },
      { id: 'rc2', kind: 'climber', name: 'Sian', x: 42, y: 5, dir: 'left', sight: 2, team: [['whirlwyn', 31], ['staticwing', 32]] },
      { id: 'rc3', kind: 'miner', name: 'Huw', x: 22, y: 10, dir: 'right', sight: 3, team: [['cindhop_2', 32], ['clinkit_2', 32], ['rampartoad', 33]] },
    ],
    switches: { W1: { x: 25, y: 19, trunk: 'S', a: 'W', b: 'E' }, W2: { x: 34, y: 4, trunk: 'S', a: 'W', b: 'E' }, W3: { x: 26, y: 4, trunk: 'E', a: 'S', b: 'N' } },
    depot: { x: 40, y: 27, dir: 'left' }, tunnel: { x: 5, y: 2 },
    props: [], cgprops: [['cg_lamp_post', 41, 24], ['cg_crate', 44, 30], ['cg_cart_ore', 42, 30], ['cg_lamp_post', 28, 24], ['cg_cart_broken', 13, 16], ['cg_crate', 2, 10], ['cg_lamp_post', 8, 4], ['cg_cart_gems', 25, 8], ['cg_crate', 44, 1]],
    exits: [{ r: [45, 27, 45, 29], to: y => ['crag2', { x: 1, y: y - 2, dir: 'right' }], axis: 'y' }, { r: [5, 2, 5, 2], to: () => ['cragmine', { x: 11, y: 28, dir: 'up' }] }],
    spawn: { x: 44, y: 28, dir: 'left' }, enc: CRAG_ENC },
  cragmine: { name: 'The Old Mine', w: 24, h: 30, quiet: true, ascii: 'cragmine', crag: true, mine: true, zones: [],
    pickups: [{ id: 'om1', x: 17, y: 12, item: 'sturdy_charm', n: 5 }],
    signs: { '12,4': '__cglegend', '7,22': "A miner's notice, nailed to a prop: 'NO DIGGING PAST THIS POINT. The rock sings at night.'" },
    trainers: [],
    cgprops: [['cg_lamp_post', 10, 24], ['cg_lamp_post', 14, 21], ['cg_cart_ore', 6, 20], ['cg_crate', 17, 19], ['cg_crate', 5, 12], ['cg_lamp_post', 19, 10], ['cg_cart_broken', 18, 11], ['cg_cart_gems', 7, 6], ['cg_ore_rock', 16, 3], ['cg_ore_rock', 8, 3], ['cg_pick_rock', 6, 14], ['cg_lamp_post', 10, 7], ['cg_lamp_post', 14, 7]],
    exits: [{ r: [11, 29, 12, 29], to: () => ['crag3', { x: 5, y: 4, dir: 'down' }] }],
    spawn: { x: 11, y: 28, dir: 'up' }, enc: CRAG_ENC },
});
for (const k of ['crag1', 'crag2', 'crag3', 'cragmine']) Object.assign(ROUTES[k], { paths: [], ponds: [], bridge: null, open: [], clear: [], ascii: ASSET.cragMaps[ROUTES[k].ascii] });

/* ---------- the map is read straight from text */
function buildAscii() {
  const rows = RC.ascii, N = RW * RH, tiles = new Int32Array(N), blocked = new Uint8Array(N), dirtish = new Uint8Array(N), waterish = new Uint8Array(N), grass = new Int8Array(N).fill(-1), deco = [], kind = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = y * RW + x, c = rows[y][x], h = hash(x * 5 + 1, y * 7 + 2); kind[i] = c;
    if (c === '#' || c === 'C' || c === '~' || RAILS.includes(c)) blocked[i] = 1;
    else if (c === ',') dirtish[i] = 1;
    else if (c >= '0' && c <= '9') grass[i] = +c;
    else if (c === 'T') { blocked[i] = 1; deco.push({ x, y, f: 'tree_pine', tall: true }); }
    else if (c === 'o') { blocked[i] = 1; deco.push({ x, y, tex: 'cg_rock_pile' }); }
    else if (c === 'O') { blocked[i] = 1; deco.push({ x, y, tex: h < .45 ? 'cg_ore_rock' : 'cg_rock_pile' }); }
  }
  for (const t of ROUTE_TRAINERS) { const i = t.y * RW + t.x; blocked[i] = 1; grass[i] = -1; }
  for (const k of Object.keys(ROUTE_SIGNS)) { const [x, y] = k.split(',').map(Number); blocked[y * RW + x] = 1; grass[y * RW + x] = -1; }
  for (const [, x, y] of RC.cgprops || []) blocked[y * RW + x] = 1;
  for (const [, x, y, ok] of RC.qdprops || []) if (!ok || ok()) blocked[y * RW + x] = 1;
  for (const [, x, y] of RC.cvprops || []) blocked[y * RW + x] = 1;
  for (const [, x, y] of RC.brprops || []) blocked[y * RW + x] = 1;
  for (const [, , x, y] of RC.decor || []) blocked[y * RW + x] = 1;
  if (RC.sail) for (let i = 0; i < N; i++) blocked[i] = (kind[i] === '~' || grass[i] >= 0 || '<>^v'.includes(kind[i])) ? 0 : 1;   // at sea the water is the road
  if (RC.sail) { for (const t of ROUTE_TRAINERS) blocked[t.y * RW + t.x] = 1; for (const k of Object.keys(ROUTE_SIGNS)) { const [x, y] = k.split(',').map(Number); blocked[y * RW + x] = 1; } }
  for (const [f, x, y] of RC.seaprops || []) for (const [a, b] of seaFoot(f, x, y)) if (a >= 0 && b >= 0 && a < RW && b < RH) { blocked[b * RW + a] = 1; grass[b * RW + a] = -1; }
  if (RC === ROUTES.driftwood && cove().stage && !boatReady()) for (const [x, y] of BOAT_TILES) blocked[y * RW + x] = 1;
  for (const [, x, y, w] of RC.props || []) for (let k = 0; k < (w || 1); k++) blocked[y * RW + x + k] = 1;
  for (const b of RC.buildings || []) for (const [x, y] of bldTiles(b)) blocked[y * RW + x] = 1;
  if (RC.gate && !RC.gate.ok()) { const [a, b, c, d] = RC.gate.area; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) { blocked[y * RW + x] = 1; deco.push({ x, y, tex: (x + y) % 2 ? 'cg_boulder2' : 'cg_rock_pile', gate: 1 }); } }
  return { tiles, blocked, dirtish, waterish, grass, water: [], border: [], deco, kind };
}

/* ---------- art */
const CRAG_TEX = {}; let CRAG_ACROSS = () => false;
function cragArt(sc) {
  if (!CRAG_TEX.ready) { for (const [k, v] of Object.entries(ASSET.crag.ground)) CRAG_TEX[k] = rgbaCanvas(v); CRAG_TEX.ready = 1; }
  for (const [k, v] of Object.entries(ASSET.crag.objs)) if (!sc.textures.exists('cg_' + k)) sc.textures.addCanvas('cg_' + k, rgbaCanvas(v));
  if (!sc.textures.exists('cgg_crack_boulder')) for (const k of ['crack_boulder', 'crack_bridge']) sc.textures.addCanvas('cgg_' + k, CRAG_TEX[k]);
}
// the ground is painted once into one picture: rocky earth, gravel paths, cliffs with faces, crevasses
function cragGround(sc, R) {
  cragArt(sc);
  const key = 'cragGround_' + sc.scene.key; if (sc.textures.exists(key)) sc.textures.remove(key);
  const c = document.createElement('canvas'); c.width = RW * T; c.height = RH * T;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const K = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH) ? '#' : R.kind[y * RW + x], wall = (x, y) => K(x, y) === '#';
  // crevasse pieces are drawn running north-south; turn them when the crevasse runs east-west
  const across = (x, y) => 'C='.includes(K(x - 1, y)) || 'C='.includes(K(x + 1, y));
  const rot = (n, x, y) => { g.save(); g.translate(x * T + 8, y * T + 8); if (across(x, y)) g.rotate(Math.PI / 2); g.drawImage(CRAG_TEX[n], -8, -8); g.restore(); };
  CRAG_ACROSS = across;
  // a crevasse: a dark gap with ragged rocky lips, deepest in the middle
  const chasm = (x, y) => {
    const ac = across(x, y), cx = x * T, cy = y * T;
    for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
      const along = ac ? u : v, side = ac ? v : u, e = 1 + Math.floor(hash(x * 16 + along, y * 16 + along * 3 + (ac ? 1 : 7)) * 2.6), e2 = T - 2 - Math.floor(hash(x * 16 + along * 5, y * 16 + 2) * 2.6);
      if (side < e || side > e2) continue;
      const dpt = Math.min(side - e, e2 - side) / ((e2 - e) / 2);
      const px = ac ? cx + u : cx + u, py = ac ? cy + v : cy + v;
      g.fillStyle = side === e ? '#c9a27a' : side === e2 ? '#4a3020' : `rgb(${Math.round(70 - dpt * 58)},${Math.round(46 - dpt * 40)},${Math.round(30 - dpt * 26)})`;
      g.fillRect(px, py, 1, 1);
    }
  };
  const tex = (n, x, y) => g.drawImage(CRAG_TEX[n], (x & 1) * T, (y & 1) * T, T, T, x * T, y * T, T, T);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K(x, y), h = hash(x >> 1, y >> 1);
    if (k === '#') { tex(h < .5 ? 'cobble' : 'cobble_moss2', x, y); g.fillStyle = RC.mine ? 'rgba(14,8,18,.6)' : 'rgba(46,34,30,.42)'; g.fillRect(x * T, y * T, T, T); continue; }
    if (k === ',') tex('slab', x, y);
    else if (RAILS.includes(k)) tex('dirt_pebble', x, y);
    else if (k >= '0' && k <= '9') tex('cobble_dry', x, y);
    else tex(h < .55 ? 'dirt_pebble' : 'dirt_patch', x, y);
    if (k === 'C') chasm(x, y);
    if (k === '=') { chasm(x, y); rot('crack_bridge', x, y); }
  }
  // raised rock: a cliff face wherever rock meets open ground below it, shadows down the sides
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    if (!wall(x, y)) continue;
    if (!wall(x, y + 1)) { g.drawImage(CRAG_TEX.ledge, (x & 1) * T, 14, T, 18, x * T, y * T - 2, T, 18); g.fillStyle = 'rgba(20,12,6,.35)'; g.fillRect(x * T, y * T + T, T, 2); }
    g.fillStyle = 'rgba(20,12,6,.55)';
    if (!wall(x - 1, y)) g.fillRect(x * T, y * T, 1, T);
    if (!wall(x + 1, y)) g.fillRect(x * T + T - 1, y * T, 1, T);
    if (!wall(x, y - 1)) { g.fillStyle = 'rgba(255,240,210,.25)'; g.fillRect(x * T, y * T, T, 1); }
  }
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {     // soft shadow cast on the ground beside rock
    if (wall(x, y)) continue; g.fillStyle = 'rgba(30,18,8,.18)';
    if (wall(x - 1, y)) g.fillRect(x * T, y * T, 3, T);
    if (wall(x + 1, y)) g.fillRect(x * T + T - 3, y * T, 3, T);
  }
  if (RC.mine) { g.fillStyle = 'rgba(12,8,20,.35)'; g.fillRect(0, 0, c.width, c.height); }
  sc.textures.addCanvas(key, c); sc.add.image(0, 0, key).setOrigin(0).setDepth(0);
}

/* ---------- rails, drawn pixel by pixel so the curves stay crisp */
function railTile(conns, opts = {}) {
  const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d'), img = g.createImageData(T, T), d = img.data;
  const segs = [];
  const cs = conns.split('');
  if (opts.pair) segs.push(opts.pair); else if (cs.length === 2) segs.push(cs); else if (cs.length === 1) segs.push([cs[0], 'C']); else { segs.push(['N', 'S'], ['E', 'W']); }
  const put = (x, y, col, a = 255) => { const i = (y * T + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a; };
  const TIE = [150, 92, 50], TIE_D = [92, 54, 26], RAIL = [176, 178, 184], RAIL_H = [226, 228, 232], RAIL_D = [70, 72, 80];
  const dim = opts.dim;
  const pts = [];
  for (const [a, b] of segs) for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const px = x + .5, py = y + .5; let s, t;
    const straight = (b === 'C') || OPP[a] === b;
    if (straight) {
      const vert = a === 'N' || a === 'S';
      s = vert ? px - 8 : py - 8; t = vert ? py : px;
      if (b === 'C') { const far = { N: py, S: T - py, W: px, E: T - px }[a]; if (far > 11) continue; }
    } else {
      const cx = (a === 'E' || b === 'E') ? T : 0, cy = (a === 'S' || b === 'S') ? T : 0, dd = Math.hypot(px - cx, py - cy);
      s = dd - 8; t = Math.atan2(Math.abs(py - cy), Math.abs(px - cx)) * 8;
    }
    const as = Math.abs(s);
    if (as >= 2 && as < 3.4) pts.push([x, y, as < 2.7 ? (s < 0 ? RAIL_H : RAIL) : RAIL_D, 1]);
    else if (as <= 5.6 && ((t % 4) + 4) % 4 < 2) pts.push([x, y, as > 4.6 ? TIE_D : TIE, 0]);
  }
  pts.sort((p, q) => p[3] - q[3]);
  for (const [x, y, col] of pts) put(x, y, dim && col !== TIE && col !== TIE_D ? col.map(v => v * .55) : col, dim ? 110 : 255);
  g.putImageData(img, 0, 0);
  if (cs.length === 1 && !opts.pair) {            // the buffer stop: a timber beam with iron caps at the dead end
    const R = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
    const e = OPP[cs[0]];
    if (e === 'N' || e === 'S') { const y = e === 'N' ? 3 : 10; R(2, y, 12, 4, '#3a2416'); R(3, y + 1, 10, 2, '#a8673a'); R(2, y, 2, 4, '#56575e'); R(12, y, 2, 4, '#56575e'); }
    else { const x = e === 'W' ? 3 : 10; R(x, 2, 4, 12, '#3a2416'); R(x + 1, 3, 2, 10, '#a8673a'); R(x, 2, 4, 2, '#56575e'); R(x, 12, 4, 2, '#56575e'); }
  }
  return c;
}
function switchTex(sc, id, state) {
  const sw = RC.switches[id], key = `cgsw_${sc.scene.key}_${id}_${state}`;
  if (!sc.textures.exists(key)) {
    const on = state ? sw.b : sw.a, off = state ? sw.a : sw.b, c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d');
    g.drawImage(railTile('', { pair: [sw.trunk, off], dim: 1 }), 0, 0); g.drawImage(railTile('', { pair: [sw.trunk, on] }), 0, 0);
    sc.textures.addCanvas(key, c);
  }
  return key;
}

/* ---------- the scenes */
class Crag extends Route {
  create() { super.create(); this.cragSetup(); if (RC.beach) coveSetup(this); folkSetup(this); }
  cragSetup() {
    const st = crag(), key = this.scene.key, R = this.R;
    // crevasses filled on earlier visits stay filled
    for (const k of Object.keys(st.filled)) { const [sk, x, y] = k.split(/[:,]/); if (sk !== key) continue; R.blocked[+y * RW + +x] = 0; this.add.image(+x * T + 8, +y * T + 8, 'cgg_crack_boulder').setDepth(1); }
    // boulders go back where they started each visit (unless they're down a crevasse): leaving is the reset
    this.boulders = [];
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (R.kind[y * RW + x] === 'B' && !st.used[`${key}:${x},${y}`]) {
      const spr = this.add.image(x * T + 8, y * T + 16, 'cg_boulder').setOrigin(.5, 1).setDepth(y * T + 15);
      this.boulders.push({ id: `${key}:${x},${y}`, x, y, spr });
    }
    for (const s of Object.values(this.grassSpr || {})) s.setTint(0xe8dc98);   // dry mountain grass
    // rails
    if (R.kind.some(k => RAILS.includes(k))) {
      const c = document.createElement('canvas'); c.width = RW * T; c.height = RH * T; const g = c.getContext('2d');
      const swAt = {}; for (const [id, s] of Object.entries(RC.switches || {})) swAt[s.x + ',' + s.y] = id;
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
        const k = R.kind[y * RW + x]; if (!RAILS.includes(k) || swAt[x + ',' + y]) continue;
        g.drawImage(railTile(k === '■' ? this.stopDir(x, y) : RAIL_CONN[k]), x * T, y * T);
      }
      const rk = 'cgRails_' + key; if (this.textures.exists(rk)) this.textures.remove(rk); this.textures.addCanvas(rk, c); this.add.image(0, 0, rk).setOrigin(0).setDepth(1);
      this.swImg = {};
      for (const [id, s] of Object.entries(RC.switches || {})) this.swImg[id] = this.add.image(s.x * T, s.y * T, switchTex(this, id, st.sw[id] || 0)).setOrigin(0).setDepth(1.2);
    }
    // carts wait at every buffer stop, levers by the points, bells to call the rail crew
    this.carts = {}; this.levers = {};
    for (const [k, v] of Object.entries(ROUTE_SIGNS)) {
      const [x, y] = k.split(',').map(Number);
      if (v.startsWith('__cgcart:')) this.carts[v.slice(9)] = { x, y, spr: this.cartAt(x, y) };
      else if (v.startsWith('__cgpoint:')) { const id = v.slice(10); this.levers[id] = this.add.image(x * T + 8, y * T + 16, (st.sw[id] ? 'cg_lever_r' : 'cg_lever_l')).setOrigin(.5, 1).setDepth(y * T + 15); }
      else if (v === '__cgbell') this.add.image(x * T + 8, y * T + 16, 'cg_signal').setOrigin(.5, 1).setDepth(y * T + 15);
      else if (v === '__cgcairn') this.add.image(x * T + 8, y * T + 16, 'cg_pick_rock').setOrigin(.5, 1).setDepth(y * T + 15);
      else if (v === '__cglegend') this.makeLegend(x, y);
    }
    for (const [tx, x, y] of RC.cgprops || []) { const im = this.add.image(x * T + 8, y * T + 16, tx).setOrigin(.5, 1).setDepth(y * T + 15); if (tx === 'cg_lamp_post') { this.tall.push(im); this.glow(x * T + 12, y * T - 4); } }
    for (const [f, x, y, ok] of RC.qdprops || []) { if (ok && !ok()) continue; const im = this.add.image(x * T + 8, y * T + 16, 'qd', f).setOrigin(.5, 1).setDepth(y * T + 15); if (f === 'qd_stone_lantern') { this.tall.push(im); this.glow(x * T + 8, y * T - 10); } }
    if (RC.tunnel) { const { x, y } = RC.tunnel; this.add.image(x * T + 8, y * T + 18, 'cg_tunnel').setOrigin(.5, 1).setDepth(2); }
    if (RC.mine) {
      this.cameras.main.setBackgroundColor(0x0a0806);
      this.add.rectangle(0, 0, RW * T, RH * T, 0x0a0614, .38).setOrigin(0).setDepth(9e6 - 31);
      const halo = this.add.circle(0, 0, 46, 0xffe0a0, .1).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 30); this.halo = halo;
      FX.set(S.weather, true); FX.ambient(null);   // no weather, petals or butterflies underground
      if (!S.flags.mineSeen) { S.flags.mineSeen = 1; setTimeout(() => toast('The Old Mine. Somewhere deep inside, the rock is humming.', 3000), 600); }
    }
    if (key === 'crag3' && !S.flags.railSeen) { S.flags.railSeen = 1; setTimeout(() => toast('The Old Rail Cutting. Ride the carts to cross it!', 3000), 900); }
    if (key === 'crag2' && !S.flags.heightsSeen) { S.flags.heightsSeen = 1; setTimeout(() => toast('Cragside Heights. Push boulders into the crevasses to cross them.', 3200), 900); }
  }
  glow(x, y) { const g = this.add.circle(x, y, 16, 0xffc870, .16).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 29); this.tweens.add({ targets: g, alpha: .07, yoyo: true, repeat: -1, duration: 1100 + Math.random() * 700 }); }
  stopDir(x, y) { for (const [d, [dx, dy]] of Object.entries(CDV)) if (RAILS.includes(this.R.kind[(y + dy) * RW + x + dx] || '')) return d; return 'E'; }
  cartTex(d) { return d === 'E' || d === 'W' ? (d === 'E' ? 'cg_cart_right' : 'cg_cart_left') : (d === 'N' ? 'cg_cart_back' : 'cg_cart_front'); }
  cartAt(x, y) { return this.add.image(x * T + 8, y * T + 15, this.cartTex(this.stopDir(x, y))).setOrigin(.5, 1).setDepth(y * T + 14); }
  boulderAt(x, y) { return (this.boulders || []).find(b => b.x === x && b.y === y); }
  passable(x, y) { return super.passable(x, y) && !this.boulderAt(x, y); }
  // Walk into a boulder to push it. It rolls one tile, or drops into a crevasse and fills it.
  bump(x, y) {
    const b = this.boulderAt(x, y), p = this.p; if (!b || this.paused || p.busy > 0) return;
    const dx = x - p.x, dy = y - p.y; if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    const nx = x + dx, ny = y + dy, i = ny * RW + nx, k = this.R.kind[i];
    const crack = k === 'C' && !crag().filled[`${this.scene.key}:${nx},${ny}`];
    if (!crack && (!super.passable(nx, ny) || this.boulderAt(nx, ny) || PICKUPS.some(q => q.x === nx && q.y === ny && !S.picked[q.id]))) { p.busy = .25; Sound.play('error'); return; }
    p.busy = .32; b.x = nx; b.y = ny; Sound.play('thud');
    this.tweens.add({ targets: b.spr, x: nx * T + 8, y: ny * T + 16, duration: 260, ease: 'Sine.inOut', onUpdate: () => b.spr.setDepth(b.spr.y - 1), onComplete: () => {
      if (!crack) return;
      const st = crag(); st.filled[`${this.scene.key}:${nx},${ny}`] = 1; st.used[b.id] = 1; this.R.blocked[i] = 0;
      this.boulders = this.boulders.filter(q => q !== b);
      this.tweens.add({ targets: b.spr, scale: .7, alpha: 0, y: b.spr.y + 6, duration: 240, onComplete: () => b.spr.destroy() });
      const im = this.add.image(nx * T + 8, ny * T + 8, 'cgg_crack_boulder').setDepth(1).setAlpha(0); this.tweens.add({ targets: im, alpha: 1, duration: 300, delay: 120 });
      this.cameras.main.shake(160, .004); Sound.play('fill'); toast('The boulder dropped into the crevasse and filled it!', 1800);
    } });
  }
  cragSign(t, x, y) {
    const st = crag();
    if (t.startsWith('__cgcart:')) return this.ride(t.slice(9));
    if (t.startsWith('__cgpoint:')) {
      const id = t.slice(10); st.sw[id] = st.sw[id] ? 0 : 1; Sound.play('door');
      this.levers[id].setTexture(st.sw[id] ? 'cg_lever_r' : 'cg_lever_l'); this.swImg[id].setTexture(switchTex(this, id, st.sw[id]));
      const s = RC.switches[id], to = st.sw[id] ? s.b : s.a, name = { N: 'north', S: 'south', E: 'east', W: 'west' }[to];
      this.cameras.main.pan(s.x * T + 8, s.y * T + 8, 350, Phaser.Math.Easing.Sine.InOut, false, (c, pr) => { if (pr === 1) this.time.delayedCall(500, () => this.cameras.main.pan(this.player.x, this.player.y, 300, Phaser.Math.Easing.Sine.InOut, false, (c2, p2) => { if (p2 === 1) this.cameras.main.startFollow(this.player, true, 1, 1); })); });
      this.cameras.main.stopFollow();
      return toast(`Clunk! The points now send carts ${name}.`, 2000);
    }
    if (t === '__cgbell') return openModal('Rail bell', '<p>Ring the bell? The old rail crew will haul you back to the depot and set all the points back to how they started.</p><div class="row" style="display:flex;gap:6px"><button class="btn gold" data-a="yes">Ring it</button><button class="btn" data-a="no">Not now</button></div>', a => {
      closeModal(); if (a !== 'yes') return; st.sw = { W1: 0, W2: 0, W3: 0 }; Sound.play('coin'); travel(this, this.scene.key, RC.depot);
    });
    if (t === '__cgcairn') return openModal('Boulder marker', "<p>A miner's marker for this stretch of road. Stuck? The road crew can roll every boulder you haven't dropped into a crevasse back to where it started.</p><div class=\"row\" style=\"display:flex;gap:6px\"><button class=\"btn gold\" data-a=\"yes\">Reset the boulders</button><button class=\"btn\" data-a=\"no\">Not now</button></div>", a => {
      closeModal(); if (a !== 'yes') return; const p = this.p; travel(this, this.scene.key, { x: p.x, y: p.y, dir: p.dir });
    });
    if (t === '__cglegend') return this.meetLegend();
  }
  // a ride: the cart follows the rails from this stop, through the points, to the next buffer stop
  ride(id) {
    const c = this.carts[id], st = crag(), p = this.p; if (!c || this.paused) return;
    const swAt = {}; for (const [sid, s] of Object.entries(RC.switches || {})) swAt[s.x + ',' + s.y] = sid;
    let x = c.x, y = c.y, d = this.stopDir(x, y); const path = [{ x, y, d }];
    for (let n = 0; n < 400; n++) {
      x += CDV[d][0]; y += CDV[d][1]; const k = this.R.kind[y * RW + x], came = OPP[d];
      if (k === '■') { path.push({ x, y, d }); break; }
      const sid = swAt[x + ',' + y];
      if (sid) { const s = RC.switches[sid]; d = came === s.trunk ? (st.sw[sid] ? s.b : s.a) : s.trunk; }
      else d = RAIL_CONN[k].split('').find(q => q !== came);
      path.push({ x, y, d });
    }
    const end = path[path.length - 1], to = Object.entries(this.carts).find(([, v]) => v.x === end.x && v.y === end.y);
    this.paused = true; p.path = []; p.pending = null; Sound.play('door');
    c.spr.setVisible(false); if (to) to[1].spr.setVisible(false);
    if (this.fol) this.fol.spr.setVisible(false);
    const cart = this.add.image(c.x * T + 8, c.y * T + 15, this.cartTex(path[0].d)).setOrigin(.5, 1);
    let i = 0, px = c.x * T + 8, py = c.y * T + 8;
    const setPos = () => { cart.setPosition(Math.round(px), Math.round(py) + 7).setDepth(py + 9); this.player.setPosition(Math.round(px), Math.round(py) + 2).setDepth(py + 8); };
    this.player.setFrame(this.standF(p.dir));
    const step = () => {
      if (++i >= path.length) return arrive();
      const q = path[i], prev = path[i - 1]; cart.setTexture(this.cartTex(prev.d));
      p.dir = { N: 'up', S: 'down', E: 'right', W: 'left' }[prev.d]; this.player.setFrame(this.standF(p.dir));
      if (i % 2) Sound.play('step', i);
      this.tweens.add({ targets: { v: 0 }, v: 1, duration: 95, onUpdate: tw => { const v = tw.getValue(); px = (prev.x + (q.x - prev.x) * v) * T + 8; py = (prev.y + (q.y - prev.y) * v) * T + 8; setPos(); }, onComplete: step });
    };
    const arrive = () => {
      cart.destroy(); c.spr.setVisible(true); if (to) to[1].spr.setVisible(true);
      Sound.play('door'); this.cameras.main.shake(120, .003);
      // step off onto the platform beside the stop
      const off = Object.values(CDV).map(([dx, dy]) => ({ x: end.x + dx, y: end.y + dy })).find(q => this.passable(q.x, q.y) && !RAILS.includes(this.R.kind[q.y * RW + q.x])) || { x: c.x, y: c.y + 1 };
      p.x = off.x; p.y = off.y; p.px = off.x * T + 8; p.py = off.y * T + 8; p.dir = off.x > end.x ? 'right' : off.x < end.x ? 'left' : off.y > end.y ? 'down' : 'up';
      this.placePlayer(); this.player.setFrame(this.standF(p.dir));
      if (this.refreshFollower) this.refreshFollower();
      this.paused = false; p.busy = .3; this.arriveHook(p.x, p.y);
    };
    setPos(); this.time.delayedCall(250, step);
  }
  makeLegend(x, y) {
    if (!this.textures.exists('mon_fulgarok')) return;
    const st = crag(), gone = S.mons.some(m => m.sp === 'fulgarok') || st.legendCaught || st.legendDay === S.day;
    this.add.image(x * T + 8, y * T + 14, 'cg_cart_gems').setOrigin(.5, 1).setDepth(1).setAlpha(.0);
    for (const [dx, dy] of [[-2, 0], [2, 0], [-3, 1], [3, 1], [-1, -1], [1, -1]]) { const g = this.add.circle((x + dx) * T + 8, (y + dy) * T + 6, 10, 0x8a6aff, .14).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 28); this.tweens.add({ targets: g, alpha: .04, yoyo: true, repeat: -1, duration: 900 + Math.random() * 900 }); }
    if (gone) { this.R.blocked[y * RW + x] = 1; return; }
    for (let r = 0; r < 4; r++) { const k = `fulgarok_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('mon_fulgarok', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 3, repeat: -1 }); }
    this.legend = this.add.sprite(x * T + 8, y * T + 16, 'mon_fulgarok', 0).setOrigin(.5, 1).setScale(1.5).setDepth(y * T + 15);
    this.legend.play('fulgarok_down');
    this.tweens.add({ targets: this.legend, y: this.legend.y - 2, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    const aura = this.add.circle(x * T + 8, y * T + 2, 28, 0x9a7aff, .18).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 27);
    this.tweens.add({ targets: aura, scale: 1.25, alpha: .06, yoyo: true, repeat: -1, duration: 1600 });
  }
  meetLegend() {
    const st = crag();
    if (!this.legend) return toast(st.legendDay === S.day ? 'The crystals are dim. Whatever lives here has gone deep into the rock to rest. Come back tomorrow.' : 'Only crystal dust and a faint warmth remain.', 2600);
    if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to face what is down here. Rest them first.', 2600);
    const img = monPic('fulgarok'), L = t => ({ name: '???', img, t });
    S.seen.fulgarok = 1;
    Talk.say([L('The crystals along the walls pulse, brighter and brighter...'), L('The ground shudders. Something vast uncurls from the rock!'), L('Thunder rolls through the mine. Fulgarok, the Geode Storm Fablemon, rises from its sleep!')], () => {
      const m = wildMon(LEGEND.sp, LEGEND.lv); m.iv = { hp: 9, atk: 9, def: 9, spd: 9 }; m.hp = monStat(m, 'hp');
      this.legendFight = m; this.cameras.main.shake(400, .008); Battle.start(m);
    });
  }
  frameHook(dt) {
    if (this.boatSpr) seaFrame(this, dt);
    super.frameHook(dt);
    if (this.halo) this.halo.setPosition(this.player.x, this.player.y - 6);
    // after the legend battle: caught, knocked out (back tomorrow) or fled from (still there)
    if (this.legendFight && Battle.active) this.legendSeen = true;
    if (this.legendFight && this.legendSeen && !Battle.active && !this.paused) {
      this.legendSeen = false;
      const m = this.legendFight, st = crag(); this.legendFight = null;
      if (S.mons.some(q => q.sp === 'fulgarok')) { st.legendCaught = 1; this.legend.destroy(); this.legend = null; toast('The mine falls quiet. The crystals glow softly, as if saying goodbye.', 3200); }
      else if (m.hp <= 0) { st.legendDay = S.day; this.tweens.add({ targets: this.legend, alpha: 0, duration: 900, onComplete: () => { this.legend.destroy(); this.legend = null; } }); toast('Fulgarok sank back into the rock! The crystals dim... It may return tomorrow.', 3500); }
    }
  }
  // exits are exact strips of tiles at the map's edge
  arriveHook(x, y) {
    if (this.boatSpr) seaArrive(this, x, y);
    for (const e of RC.exits || []) { const [a, b, c, d] = e.r; if (x >= a && x <= c && y >= b && y <= d) { const [to, sp] = e.to(e.axis === 'y' ? y : x); if (to === 'cragmine' || to === 'crag3' && RC.mine) Sound.play('door'); return travel(this, to, sp); } }
    super.arriveHook(x, y);
  }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p, b = this.boulderAt(x, y);
    if (b && Math.abs(p.x - x) + Math.abs(p.y - y) === 1) { this.face(x, y); return this.bump(x, y); }
    super.onTap(wx, wy);
  }
}
const CRAG_SCENES = ['crag1', 'crag2', 'crag3', 'cragmine'].map(k => class extends Crag { constructor() { super(k); } });
