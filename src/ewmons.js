/* ============================================================ Elderwood Fablemon (the user's art, 16 Nov 2026)
   Six lines for Fernwalk and the Elder Glade. Late-game lines, so like Highmoor's they evolve late and turn up in the
   long grass at 59–65 still in their first forms.
     Sprigfawn → Stumpstag (58) → Elderhart (66)        Wild/Leaf   the silver stag of Alder's herd
     Hollowcub → Tanglebruin (59) → Ursylvane (67)      Wild/Shade  the bear matriarch
     Snarlwisp → Murkhowl (59) → Gloamfang (68)         Shade/Wild  the night wolf at the Eldest Tree
     Tappit → Drummajor (60)                            Gale/Spark
     Pebblouse → Cobblerollie (57) → Mortarmour (65)    Stone/Wild  the clear-cuts
     Simmerkit → Thermadam (61)                         Tide/Ember  the river and the log pond
   Art: tools/art/cut_ewmons.py (battle pairs; walk sheets are built from the battle art until real ones arrive).
   Their rows in mon_battle.png / mon_icons.png follow the MON_ORDER push below (rows 113+). */
Object.assign(SPECIES, {
  sprigfawn: { name: 'Sprigfawn', type: 'Wild', type2: 'Leaf', evo: ['stumpstag', 58], base: { hp: 58, atk: 68, def: 54, spd: 72, eatk: 52, edef: 56 }, exp: 72, rate: 90,
    desc: 'Its antlers are two little tree stumps, and fresh shoots sprout from them every spring. Fawns follow the herd through the Elder Glade, nibbling moss.' },
  stumpstag: { name: 'Stumpstag', type: 'Wild', type2: 'Leaf', evo: ['elderhart', 66], base: { hp: 76, atk: 92, def: 72, spd: 96, eatk: 64, edef: 72 }, exp: 158, rate: 60,
    desc: 'Proud green antlers have grown up out of its stumps. It clashes them with rivals until the leaves fly, then calmly grows new ones.' },
  elderhart: { name: 'Elderhart', type: 'Wild', type2: 'Leaf', base: { hp: 96, atk: 124, def: 94, spd: 110, eatk: 84, edef: 96 }, exp: 252, rate: 45,
    desc: 'Two whole trees grow from its head, and birds nest in its antlers. Elderwood folk say wherever an Elderhart lies down to sleep, a new wood begins.' },
  hollowcub: { name: 'Hollowcub', type: 'Wild', type2: 'Shade', evo: ['tanglebruin', 59], base: { hp: 66, atk: 70, def: 62, spd: 46, eatk: 50, edef: 58 }, exp: 72, rate: 90,
    desc: 'A grumpy cub with a hollow stump growing on its back. Something with glowing eyes lives in the hollow, and the cub takes it everywhere.' },
  tanglebruin: { name: 'Tanglebruin', type: 'Wild', type2: 'Shade', evo: ['ursylvane', 67], base: { hp: 92, atk: 98, def: 90, spd: 56, eatk: 66, edef: 84 }, exp: 160, rate: 60,
    desc: "Roots have wound all over its back, full of little hollows. Many small creatures shelter in them, peering out with bright eyes. It's very protective of its lodgers." },
  ursylvane: { name: 'Ursylvane', type: 'Wild', type2: 'Shade', base: { hp: 118, atk: 128, def: 118, spd: 62, eatk: 86, edef: 106 }, exp: 254, rate: 40,
    desc: 'A walking forest. A whole grove grows on its back, its hollows full of watching eyes, and a great spirit-bear rises from the canopy when it roars.' },
  snarlwisp: { name: 'Snarlwisp', type: 'Shade', type2: 'Wild', evo: ['murkhowl', 59], base: { hp: 52, atk: 72, def: 46, spd: 84, eatk: 68, edef: 48 }, exp: 72, rate: 85,
    desc: "A lean night wolf with a tail of shadow shaped like a second, much bigger wolf's head. Travellers who hear it snarl in the dark usually run from the wrong one." },
  murkhowl: { name: 'Murkhowl', type: 'Shade', type2: 'Wild', evo: ['gloamfang', 68], base: { hp: 70, atk: 98, def: 62, spd: 106, eatk: 92, edef: 64 }, exp: 160, rate: 55,
    desc: 'Its shadow-tail has grown teeth and eyes of its own. When it howls, the tail howls too, half a beat later, and the whole forest goes quiet.' },
  gloamfang: { name: 'Gloamfang', type: 'Shade', type2: 'Wild', base: { hp: 86, atk: 130, def: 76, spd: 122, eatk: 118, edef: 78 }, exp: 254, rate: 40,
    desc: 'It walks on two legs now, and the great maw of its tail moves on its own. It hunts only at dusk, in the hour between the lanterns lighting and the dark.' },
  tappit: { name: 'Tappit', type: 'Gale', type2: 'Spark', evo: ['drummajor', 60], base: { hp: 52, atk: 66, def: 48, spd: 88, eatk: 72, edef: 50 }, exp: 72, rate: 90,
    desc: 'A woodpecker with a wooden drum for a chest. Its beak crackles with static, and it taps out rhythms on tree trunks that you can hear across the Glade.' },
  drummajor: { name: 'Drummajor', type: 'Gale', type2: 'Spark', base: { hp: 84, atk: 106, def: 78, spd: 126, eatk: 118, edef: 80 }, exp: 252, rate: 45,
    desc: "It leads the forest's dawn chorus, swinging its crest like a conductor's baton. Every drumroll on its chest sends lightning crackling down its beak." },
  pebblouse: { name: 'Pebblouse', type: 'Stone', type2: 'Wild', evo: ['cobblerollie', 57], base: { hp: 60, atk: 58, def: 92, spd: 30, eatk: 40, edef: 70 }, exp: 70, rate: 100,
    desc: 'A woodlouse with a shell of carved blue stone. It curls into a perfect ball when startled, and woodcutters often trip over them in the clear-cuts.' },
  cobblerollie: { name: 'Cobblerollie', type: 'Stone', type2: 'Wild', evo: ['mortarmour', 65], base: { hp: 78, atk: 82, def: 124, spd: 40, eatk: 52, edef: 92 }, exp: 156, rate: 60,
    desc: "Its stone plates are etched with spirals like old standing stones. It rolls downhill at terrifying speed and doesn't know how to stop." },
  mortarmour: { name: 'Mortarmour', type: 'Stone', type2: 'Wild', base: { hp: 100, atk: 112, def: 150, spd: 44, eatk: 70, edef: 112 }, exp: 252, rate: 40,
    desc: 'A living fortress. A stone barrel on its back glows like a forge, and it lobs boulders from it with a boom that shakes the leaves off the trees.' },
  simmerkit: { name: 'Simmerkit', type: 'Tide', type2: 'Ember', evo: ['thermadam', 61], base: { hp: 64, atk: 60, def: 62, spd: 56, eatk: 68, edef: 60 }, exp: 72, rate: 90,
    desc: 'A beaver whose tail is warm stone with hot springs bubbling in it. It builds its dams where warm water rises, and the pools steam all winter.' },
  thermadam: { name: 'Thermadam', type: 'Tide', type2: 'Ember', base: { hp: 104, atk: 96, def: 98, spd: 82, eatk: 116, edef: 96 }, exp: 252, rate: 45,
    desc: 'A waterfall pours through the stone terraces of its great tail, and its teeth glow like embers. Thermadam dams make the warmest bathing pools in the valley.' },
});
Object.assign(MOVES, {
  grovecharge: { name: 'Grove Charge', type: 'Wild', pow: 105, acc: 95, boost: ['self', 'def', 1, 50] },
  hollowhost: { name: 'Hollow Host', type: 'Shade', pow: 95, acc: 100, drain: .3 },
  twinmaw: { name: 'Twin Maw', type: 'Shade', pow: 55, acc: 95, hits: [2, 2] },
  drumroll: { name: 'Thunder Drumroll', type: 'Spark', pow: 25, acc: 95, hits: [3, 5], st: ['par', 10] },
  bouldermortar: { name: 'Boulder Mortar', type: 'Stone', pow: 115, acc: 85 },
  geyserdam: { name: 'Geyser Dam', type: 'Tide', pow: 100, acc: 95, boost: ['self', 'edef', 1, 100] },
});
Object.assign(MOVE_CAT, { hollowhost: 'e', drumroll: 'e', geyserdam: 'e' });
hmLine(['sprigfawn', 'stumpstag', 'elderhart'], [[1, 'tackle'], [1, 'leafflick'], [1, 'quickhop'], [1, 'sharpen'], [40, 'thornvolley'], [44, 'stampede'], [48, 'hedgecrash'], [52, 'gallop'], [56, 'pounce'], [60, 'rootdrain'], [64, 'wildrush'], [70, 'bloomburst']],
  [[], [[66, 'grovecharge']]]);
hmLine(['hollowcub', 'tanglebruin', 'ursylvane'], [[1, 'tackle'], [1, 'growl'], [1, 'shadownip'], [1, 'brace'], [40, 'headbutt'], [44, 'hollowknock'], [48, 'stampede'], [52, 'gloomgrip'], [56, 'pounce'], [60, 'phantomclaw'], [64, 'wildrush'], [70, 'dreamsip']],
  [[], [[67, 'hollowhost']]]);
hmLine(['snarlwisp', 'murkhowl', 'gloamfang'], [[1, 'shadownip'], [1, 'tackle'], [1, 'growl'], [1, 'shadestep'], [40, 'haunt'], [44, 'pounce'], [48, 'gloomgrip'], [52, 'nightdrop'], [56, 'phantomclaw'], [60, 'eclipse'], [64, 'wildrush'], [70, 'dreamsip']],
  [[], [[68, 'twinmaw']]]);
hmLine(['tappit', 'drummajor'], [[1, 'peck'], [1, 'staticbuzz'], [1, 'swiftwing'], [1, 'featherdance'], [40, 'zapjab'], [44, 'downdraft'], [48, 'sparkdash'], [52, 'boltwing'], [56, 'windslice'], [60, 'arclash'], [64, 'galeforce'], [70, 'overload']],
  [[[60, 'drumroll']]]);
hmLine(['pebblouse', 'cobblerollie', 'mortarmour'], [[1, 'harden'], [1, 'pebbletoss'], [1, 'tackle'], [1, 'curlnap'], [40, 'rockroll'], [44, 'headbutt'], [48, 'slateslam'], [52, 'fortify'], [56, 'rockslide'], [60, 'rampartbash'], [64, 'landslide'], [70, 'laststand']],
  [[], [[65, 'bouldermortar']]]);
hmLine(['simmerkit', 'thermadam'], [[1, 'splashjet'], [1, 'emberpuff'], [1, 'tackle'], [1, 'springsip'], [40, 'weirwave'], [44, 'smoulder'], [48, 'boilspout'], [52, 'millrace'], [56, 'heatwave'], [60, 'tidalcrash'], [64, 'wildfire']],
  [[[61, 'geyserdam']]]);
Object.assign(SIGNATURE, { elderhart: [66, 'grovecharge'], ursylvane: [67, 'hollowhost'], gloamfang: [68, 'twinmaw'], drummajor: [60, 'drumroll'], mortarmour: [65, 'bouldermortar'], thermadam: [61, 'geyserdam'] });
const EW_MONS = ['sprigfawn', 'stumpstag', 'elderhart', 'hollowcub', 'tanglebruin', 'ursylvane', 'snarlwisp', 'murkhowl', 'gloamfang', 'tappit', 'drummajor', 'pebblouse', 'cobblerollie', 'mortarmour', 'simmerkit', 'thermadam'];
if (MON_ORDER.length !== 113) console.warn('ewmons: MON_ORDER is', MON_ORDER.length, 'not 113: battle rows will be off');
MON_ORDER.push(...EW_MONS);
Object.assign(MON_STAGE, { stumpstag: 2, elderhart: 3, tanglebruin: 2, ursylvane: 3, murkhowl: 2, gloamfang: 3, drummajor: 2, cobblerollie: 2, mortarmour: 3, thermadam: 2 });
Object.assign(EXTRA_HABITAT, {
  sprigfawn: 'Fernwalk and the Elder Glade, in the daytime', hollowcub: 'Fernwalk and the Elder Glade', snarlwisp: 'Fernwalk and the Elder Glade, at night',
  tappit: 'Fernwalk and the Elder Glade, in the daytime', pebblouse: 'Fernwalk, and the clear-cuts in the Elder Glade', simmerkit: 'By the river on Fernwalk, and the Elder Glade',
});
