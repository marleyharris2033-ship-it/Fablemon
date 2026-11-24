/* ============================================================ Gloamhollow Fablemon (the user's art, 24 Nov 2026)
   Six lines for the Undercroft, Lanternmere and Glimmerdeep. They turn up wild at 66–72 in their first forms and
   evolve late: the second form at 70 (72 for Hydrarch), the third at 77, after Isolde.
   Trainers' aces are still third forms (Isolde's Carillion, Vale's Vespereign).
     Vespyre → Vesperax (70) → Vespereign (77)          Shade/Gale  the cave bat of the Undercroft
     Grubble → Clutchtoad (70) → Bogbastion (77)        Tide/Stone  the grasping toad of Lanternmere (a ruin grows on its back)
     Tricoil → Hydrarch (72)                            Shade/Wild  the three-headed snake of the Undercroft
     Lumispin → Lanternweave (70) → Vigilarach (77)     Glow/Ember  the lantern spider of Lanternmere
     Lintroll → Cairnbrute (70) → Bridgegrim (77)       Stone/Wild  the troll of Glimmerdeep, carrying stone
     Jinglynx → Knellynx (70) → Carillion (77)          Shade/Glow  the bell cat of Glimmerdeep (Isolde's ace)
   Art: tools/art/cut_ghmons.py (battle pairs and walk sheets) and tools/art/cut_hd.py.
   Their rows in mon_battle.png / mon_icons.png follow the MON_ORDER push below (rows 129+). */
Object.assign(SPECIES, {
  vespyre: { name: 'Vespyre', type: 'Shade', type2: 'Gale', evo: ['vesperax', 70], base: { hp: 62, atk: 84, def: 54, spd: 92, eatk: 70, edef: 54 }, exp: 80, rate: 80,
    desc: 'A cave bat as big as a dog, with a tail that ends in a pair of bone pincers. It hangs from the Undercroft roof by its tail and drops on anything that passes under it.' },
  vesperax: { name: 'Vesperax', type: 'Shade', type2: 'Gale', evo: ['vespereign', 77], base: { hp: 78, atk: 108, def: 66, spd: 110, eatk: 84, edef: 68 }, exp: 162, rate: 50,
    desc: 'Its tail pincers have grown into a great crescent of bone. It hunts on the wing in total darkness, and miners say you hear the snap before you hear the wings.' },
  vespereign: { name: 'Vespereign', type: 'Shade', type2: 'Gale', base: { hp: 96, atk: 134, def: 84, spd: 128, eatk: 104, edef: 86 }, exp: 260, rate: 30,
    desc: 'A bat king in a mantle of pale fur, with a crown of bone and a tail that ends in a four-bladed star. The whole Undercroft goes silent when it unfolds its wings.' },
  grubble: { name: 'Grubble', type: 'Tide', type2: 'Stone', evo: ['clutchtoad', 70], base: { hp: 74, atk: 66, def: 70, spd: 34, eatk: 58, edef: 62 }, exp: 72, rate: 95,
    desc: "A grumpy marsh toad whose tongue ends in a little hand. It sits very still in the reeds and grabs whatever wanders past: moths, boots, other people's lunches." },
  clutchtoad: { name: 'Clutchtoad', type: 'Tide', type2: 'Stone', evo: ['bogbastion', 77], base: { hp: 100, atk: 92, def: 96, spd: 44, eatk: 76, edef: 84 }, exp: 160, rate: 60,
    desc: 'It carries its long tongue arched over its back, the hand open and waiting. Moss and old stones build up along its ridge as it sleeps in the bog for years at a time.' },
  bogbastion: { name: 'Bogbastion', type: 'Tide', type2: 'Stone', base: { hp: 128, atk: 120, def: 124, spd: 50, eatk: 92, edef: 106 }, exp: 256, rate: 40,
    desc: "A whole ruined chapel has settled on its back. Lanternmere folk say the marsh swallowed a village once, and Bogbastion was what crawled out." },
  tricoil: { name: 'Tricoil', type: 'Shade', type2: 'Wild', evo: ['hydrarch', 72], base: { hp: 68, atk: 80, def: 64, spd: 70, eatk: 74, edef: 62 }, exp: 82, rate: 75,
    desc: "A three-headed snake that lies coiled in the old galleries. The heads never agree, and it's said they argue all night in whispers." },
  hydrarch: { name: 'Hydrarch', type: 'Shade', type2: 'Wild', base: { hp: 98, atk: 118, def: 92, spd: 96, eatk: 108, edef: 90 }, exp: 256, rate: 40,
    desc: 'It has grown legs and a crowned fourth head, and the crowned head is the one in charge now. The other three do the biting.' },
  lumispin: { name: 'Lumispin', type: 'Glow', type2: 'Ember', evo: ['lanternweave', 70], base: { hp: 56, atk: 58, def: 56, spd: 70, eatk: 78, edef: 64 }, exp: 72, rate: 90,
    desc: 'A spider that spins two little lanterns of silk and lights them from inside. Moths come to the light, and Lumispin is very glad to see them.' },
  lanternweave: { name: 'Lanternweave', type: 'Glow', type2: 'Ember', evo: ['vigilarach', 77], base: { hp: 76, atk: 78, def: 74, spd: 92, eatk: 106, edef: 86 }, exp: 160, rate: 55,
    desc: "It weaves a fan of dark web behind its lanterns and strings a tripline between its front legs. Lost travellers who follow its light don't always come back." },
  vigilarach: { name: 'Vigilarach', type: 'Glow', type2: 'Ember', base: { hp: 96, atk: 92, def: 102, spd: 96, eatk: 134, edef: 112 }, exp: 256, rate: 40,
    desc: 'It wears a crown of web like a cathedral window, and keeps watch over the marsh all night. Gloamhollow folk leave candles out for it, just to be safe.' },
  lintroll: { name: 'Lintroll', type: 'Stone', type2: 'Wild', evo: ['cairnbrute', 70], base: { hp: 80, atk: 84, def: 82, spd: 30, eatk: 36, edef: 58 }, exp: 74, rate: 90,
    desc: "A young troll that carries a slab of stone across its shoulders and won't put it down. Nobody knows where it got it. Nobody's brave enough to ask." },
  cairnbrute: { name: 'Cairnbrute', type: 'Stone', type2: 'Wild', evo: ['bridgegrim', 77], base: { hp: 106, atk: 116, def: 112, spd: 38, eatk: 46, edef: 78 }, exp: 162, rate: 55,
    desc: "It builds on its slab with every stone it finds, and straps more round its arms. Its punches land like a cairn falling over." },
  bridgegrim: { name: 'Bridgegrim', type: 'Stone', type2: 'Wild', base: { hp: 132, atk: 146, def: 140, spd: 42, eatk: 56, edef: 96 }, exp: 260, rate: 35,
    desc: 'It carries a whole mossy bridge on its back. It sits down across rivers and chasms so others can cross, and expects a toll.' },
  jinglynx: { name: 'Jinglynx', type: 'Shade', type2: 'Glow', evo: ['knellynx', 70], base: { hp: 58, atk: 72, def: 52, spd: 86, eatk: 68, edef: 56 }, exp: 72, rate: 85,
    desc: "A shadowy lynx with a moon on its flank and a bell on its tail. You hear the bell, but you never see where it came from." },
  knellynx: { name: 'Knellynx', type: 'Shade', type2: 'Glow', evo: ['carillion', 77], base: { hp: 76, atk: 96, def: 68, spd: 112, eatk: 92, edef: 74 }, exp: 160, rate: 50,
    desc: 'Its ears have grown huge and ringed like the inside of a bell, and its two tail bells toll at dusk. It can hear a lamp being lit from across the village.' },
  carillion: { name: 'Carillion', type: 'Shade', type2: 'Glow', base: { hp: 98, atk: 124, def: 96, spd: 118, eatk: 116, edef: 100 }, exp: 258, rate: 35,
    desc: "A great sabre-toothed cat in a mantle like a church roof, with two old church bells on its tails. When it roars, every bell in Gloamhollow rings with it." },
});
Object.assign(MOVES, {
  crescentreap: { name: 'Crescent Reaper', type: 'Shade', pow: 100, acc: 95, drain: .25 },
  gulfgrasp: { name: 'Grasping Gulf', type: 'Tide', pow: 105, acc: 90, boost: ['foe', 'spd', -1, 50] },
  trifang: { name: 'Trifang', type: 'Shade', pow: 35, acc: 95, hits: [3, 3] },
  rosewindow: { name: 'Rose Window', type: 'Glow', pow: 100, acc: 100, boost: ['self', 'edef', 1, 50] },
  tollbridge: { name: 'Toll Bridge', type: 'Stone', pow: 115, acc: 90 },
  vesperbells: { name: 'Vesper Bells', type: 'Shade', pow: 100, acc: 100, flinch: 20 },
});
Object.assign(MOVE_CAT, { rosewindow: 'e' });
hmLine(['vespyre', 'vesperax', 'vespereign'], [[1, 'shadownip'], [1, 'gust'], [1, 'growl'], [1, 'shadestep'], [40, 'nightdrop'], [44, 'swiftwing'], [48, 'gloomgrip'], [52, 'downdraft'], [56, 'phantomclaw'], [60, 'windslice'], [64, 'eclipse'], [70, 'skydive']],
  [[], [[77, 'crescentreap']]]);
hmLine(['grubble', 'clutchtoad', 'bogbastion'], [[1, 'splashjet'], [1, 'tackle'], [1, 'harden'], [1, 'mudslick'], [40, 'bogbubble'], [44, 'rockroll'], [48, 'mirejet'], [52, 'slateslam'], [56, 'undertow'], [60, 'rampartbash'], [64, 'millrace'], [70, 'landslide']],
  [[], [[77, 'gulfgrasp']]]);
hmLine(['tricoil', 'hydrarch'], [[1, 'shadownip'], [1, 'tackle'], [1, 'growl'], [1, 'sharpen'], [40, 'haunt'], [44, 'pounce'], [48, 'gloomgrip'], [52, 'stampede'], [56, 'phantomclaw'], [60, 'eclipse'], [64, 'wildrush'], [70, 'dreamsip']],
  [[[72, 'trifang']]]);
hmLine(['lumispin', 'lanternweave', 'vigilarach'], [[1, 'glint'], [1, 'emberpuff'], [1, 'dazzle'], [1, 'kindle'], [40, 'lumenpulse'], [44, 'smoulder'], [48, 'sunbeam'], [52, 'cinderslam'], [56, 'prismbeam'], [60, 'heatwave'], [64, 'haloburst'], [70, 'starfall']],
  [[], [[77, 'rosewindow']]]);
hmLine(['lintroll', 'cairnbrute', 'bridgegrim'], [[1, 'tackle'], [1, 'harden'], [1, 'pebbletoss'], [1, 'brace'], [40, 'headbutt'], [44, 'rockroll'], [48, 'slateslam'], [52, 'stampede'], [56, 'rockslide'], [60, 'rampartbash'], [64, 'landslide'], [70, 'laststand']],
  [[], [[77, 'tollbridge']]]);
hmLine(['jinglynx', 'knellynx', 'carillion'], [[1, 'shadownip'], [1, 'glint'], [1, 'growl'], [1, 'shadestep'], [40, 'haunt'], [44, 'pounce'], [48, 'lumenpulse'], [52, 'gloomgrip'], [56, 'phantomclaw'], [60, 'prismbeam'], [64, 'eclipse'], [70, 'haloburst']],
  [[], [[77, 'vesperbells']]]);
Object.assign(SIGNATURE, { vespereign: [77, 'crescentreap'], bogbastion: [77, 'gulfgrasp'], hydrarch: [72, 'trifang'], vigilarach: [77, 'rosewindow'], bridgegrim: [77, 'tollbridge'], carillion: [77, 'vesperbells'] });
const GH_MONS = ['vespyre', 'vesperax', 'grubble', 'clutchtoad', 'bogbastion', 'tricoil', 'hydrarch', 'lumispin', 'lanternweave', 'vigilarach', 'lintroll', 'cairnbrute', 'bridgegrim', 'jinglynx', 'knellynx', 'carillion', 'vespereign'];
if (MON_ORDER.length !== 129) console.warn('ghmons: MON_ORDER is', MON_ORDER.length, 'not 129: battle rows will be off');
MON_ORDER.push(...GH_MONS);
Object.assign(MON_STAGE, { vesperax: 2, vespereign: 3, clutchtoad: 2, bogbastion: 3, hydrarch: 2, lanternweave: 2, vigilarach: 3, cairnbrute: 2, bridgegrim: 3, knellynx: 2, carillion: 3 });
Object.assign(MON_BIG, { vespyre: 40, vesperax: 48, vespereign: 48, grubble: 32, clutchtoad: 40, bogbastion: 46, tricoil: 38, hydrarch: 46, lumispin: 32, lanternweave: 40, vigilarach: 46, lintroll: 36, cairnbrute: 44, bridgegrim: 48, jinglynx: 32, knellynx: 40, carillion: 46 });
Object.assign(EXTRA_HABITAT, {
  vespyre: 'The Undercroft, the tunnel under the mountain', tricoil: "The Undercroft's old galleries", grubble: 'Lanternmere, in the marsh grass',
  lumispin: 'Lanternmere, mostly at night', lintroll: 'Glimmerdeep, round the black lake', jinglynx: 'Glimmerdeep, and Lanternmere at night',
});

/* ---------- the two legendaries of the forest (the user's art, 24 Nov 2026)
   Samaradrake: the seed-dragon that has been regrowing the Elder Glade. Found at the Eldest Tree once the replanted
     clear-cut has grown back (gloam.js), level 70, like Cirrovale on Windcrown Peak.
   Weavewyrm: the serpent that sleeps in the Rootweave under the valley. Verdance's drill head wakes it after Site G:
     you see it rise at the Eldest Tree and feel it under the farm. It turns the finale (down the bore, under
     Smallroot), and is caught after Rowan. Not catchable yet: see claude/finale-plan.md. */
Object.assign(SPECIES, {
  samaradrake: { name: 'Samaradrake', title: 'Seed Dragon Fablemon', type: 'Leaf', type2: 'Gale', legend: true, base: { hp: 100, atk: 104, def: 96, eatk: 120, edef: 104, spd: 112 }, exp: 300, rate: 8,
    desc: 'The Seed Dragon Fablemon. A sapling grows from the cracked acorn of its body, and its wings are two great maple seeds. Wherever it spirals down to land, a new wood begins. Elderwood folk say it planted the Elder Glade in the first place.' },
  weavewyrm: { name: 'Weavewyrm', title: 'Rootweave Fablemon', type: 'Leaf', type2: 'Shade', legend: true, base: { hp: 112, atk: 122, def: 106, eatk: 110, edef: 108, spd: 88 }, exp: 310, rate: 5,
    desc: "The Rootweave Fablemon. It sleeps coiled through the roots under the whole valley, and the green light of the Rootweave runs in its veins. When it stirs, every tree from Elderwood to Smallroot shivers." },
});
Object.assign(MOVES, {
  samarastorm: { name: 'Samara Storm', type: 'Leaf', pow: 95, acc: 95, boost: ['self', 'spd', 1, 30], pp: 5 },
  rootweavecoil: { name: 'Rootweave Coil', type: 'Leaf', pow: 110, acc: 90, drain: .3, pp: 5 },
});
Object.assign(MOVE_CAT, { samarastorm: 'e' });
LEARN.samaradrake = [[1, 'gust'], [1, 'leafflick'], [1, 'seedsquall'], [1, 'updraft'], [50, 'thornvolley'], [55, 'galeforce'], [60, 'samarastorm'], [64, 'hedgecrash'], [68, 'tempestwing'], [72, 'bloomburst']];
LEARN.weavewyrm = [[1, 'leafflick'], [1, 'shadownip'], [1, 'bramblecurl'], [1, 'gloomgrip'], [55, 'rootdrain'], [60, 'hedgecrash'], [65, 'rootweavecoil'], [70, 'grimroots'], [74, 'eclipse'], [78, 'dreamsip']];
for (const sp of ['samaradrake', 'weavewyrm']) LEARN[sp] = LEARN[sp].filter(([, id]) => MOVES[id]);
MON_ORDER.push('samaradrake', 'weavewyrm');
Object.assign(MON_STAGE, { samaradrake: 3, weavewyrm: 3 });
Object.assign(MON_BIG, { samaradrake: 48, weavewyrm: 48 });
Object.assign(EXTRA_HABITAT, { samaradrake: 'The Eldest Tree, once the Elder Glade has grown back', weavewyrm: 'Asleep in the Rootweave, deep under the valley' });
