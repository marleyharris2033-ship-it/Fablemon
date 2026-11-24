/* ============================================================ Gloamhollow: "The Long Dark" (Act 4, part 2). Plan: claude/gloamhollow-plan.md
   After the Wild Crest, Tansy follows the haul road into the mountain: Greenline's rootwood goes to Site G, under the
   hollow on the far side. Brask knows the old miners' tunnels.
     undercroft   The Undercroft   the haul tunnel from the timber camp: dark, night convoys on the rails, Brask's split
     gloamhollow  Gloamhollow      the lamp-lit village in the hollow; sun only from noon to one; Warden Isolde
     lanternmere  Lanternmere      the misty marsh south of the village: five great lanterns to relight
     glimmerdeep  Glimmerdeep      crystal caves and a black lake under the Mill Pool well: a light-beam puzzle, a siphon
     siteg        Site G           inside the mountain: the Taproot drill, and Morwenna Vale
   The story: find Brask → the Undercroft (returned his pages: he opens the maintenance door; kept them: the long way
   round, and his three lost tools) → Gloamhollow → Isolde → relight the lanterns → down the well → shut the three
   light siphons → all five lanterns → Site G (Vale, two phases; she escapes) → the Shade Crest → Rowan sends for you.
   Side: the Lamplighter's Round, the Night Market (with Gleam's gossip), Lost in the Undercroft, Noon Bloom (the
   Noonbell crop), the Old Church bells, Monty's mount time trials, and the Elderwood Cup.
   ART: every building, prop and person here is a stand-in from another town (recoloured trees, bog plants, Beaconreach's
   lighthouse for the lamp tower) until the user's Gloamhollow art arrives. No new Fablemon yet: the wild ones and the
   teams are existing species until the user's six lines (and the legendary) are drawn.
   State: S.gh = { met, guide, door, tools{}, toolsBack, town, isolde, lit{}, mir{}, beam, siph{}, round{}, rounds,
                   market, secrets{}, bridge, lostAsk, lostFound, lostHome, blooms{}, bells[], crypt, cryptLoot,
                   valeP1, home, trial{} } */
const gh = () => {
  const G = S.gh = S.gh || {};
  for (const k of ['tools', 'lit', 'mir', 'siph', 'round', 'secrets', 'blooms', 'trial']) G[k] = G[k] || {};
  G.bells = G.bells || []; return G;
};
const ghNoon = () => S.time >= 720 && S.time < 780;            // the sun clears the mountain from noon till one
const ghNight = () => S.time >= 1140 || S.time < 360;
const ghEve = () => S.time >= 1080 && S.time < 1260;           // the lamplighter's hours, six till nine
const ghTrust = () => !(S.vd && S.vd.brask === 'keep');         // older saves never chose: Brask trusts you
const ghLit = () => Object.keys(gh().lit).length;
const ghSiph = () => Object.keys(gh().siph).length;
const ghTools = () => Object.keys(gh().tools).length;
const ghFree = () => !!(S.vd && S.vd.shut && S.vd.shut.gloam);  // Site G stopped
const ghSiteOpen = () => ghSiph() >= 3 && ghLit() >= 5;
const ghHas = t => team().some(m => m.hp > 0 && (SPECIES[m.sp].type === t || SPECIES[m.sp].type2 === t));
const ghXa = f => !!(HDW.xa && HDW.xa.frames && HDW.xa.frames[f]);   // (rootway.js, which loads the xa atlas, comes after this file)
const ghSay = (lines, cb) => { Talk.say(lines, cb); return true; };

/* ---------- Gloamhollow's own art (the user's sheets, 24 Nov 2026; tools/art/cut_gharts.py): atlas 'gh', 3x, shown at a
   third, loaded with each Gloamhollow area. ghA(frame, stand-in) falls back to the old stand-in if it's missing. */
const ghA = (f, alt) => HDW.gh && HDW.gh.frames && HDW.gh.frames[f] ? ['gh', f] : alt;
if (HDW.gh) {
  ASSET.ghJson = { frames: Object.fromEntries(Object.entries(HDW.gh.frames).map(([k, f]) => [k, { frame: { x: 0, y: 0, w: Math.round(f.w / 3), h: Math.round(f.h / 3) } }])) };
  const ld = hdWorldLoad; hdWorldLoad = function (loader, snow) { ld(loader, snow); if (!game.textures.exists('gh')) loader.image('gh', HDW.gh.img); };
  const sw = hdWorldSwap; hdWorldSwap = function (sc) { sw(sc); const t = sc.textures.exists('gh') && sc.textures.get('gh'); if (t && !t._shrunk) { for (const [k, f] of Object.entries(HDW.gh.frames)) t.add(k, 0, f.x, f.y, f.w, f.h); hdShrinkTexture(t, 3); t._shrunk = 1; } };
}
// the painted grounds cut from the sheet (stones sit at a believable size)
Object.assign(GPERIOD, { ghg_cobble: 4, ghg_moss: 6, ghg_rock: 5, ghg_crystal: 5, ghg_board: 4, ghg_planks: 4, ghg_rail: 4 });

/* ---------- people (stand-in art: Isolde and Vale have their own; the villagers borrow other trades' looks) */
// Gloamhollow folk borrow other trainers' looks, recoloured (hue-rotated), until they have art of their own
const GH_FOLK = { wren: ['wispwatcher', 140], tobin: ['busker', 200], mags: ['allotment', 90], seeds: ['forager', 250], barter: ['reedcutter', 170] };
const ghPicCache = {};
// turn the clothes' colours round the colour wheel, but leave skin, hair and leather (the warm browns and peaches) alone
function ghRecolour(img, hue) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data, rot = hue / 360;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 8) continue;
    const r = p[i] / 255, gg = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
    if (dd < .08) continue;   // greys, blacks and whites stay
    const sat = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    let h = mx === r ? ((gg - b) / dd + (gg < b ? 6 : 0)) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6;
    if (h < .14 || h > .93) continue;   // skin, hair, leather (pinks and peaches through to browns)
    h = (h + rot) % 1;
    const q = l < .5 ? l * (1 + sat) : l + sat - l * sat, pp = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < .5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    p[i] = f(h + 1 / 3) * 255; p[i + 1] = f(h) * 255; p[i + 2] = f(h - 1 / 3) * 255;
  }
  g.putImageData(d, 0, 0); return c;
}
function ghPic(kind, hue, f = 0) {
  const k = kind + hue + '_' + f, src = trainerPic(kind, f);
  if (k in ghPicCache) return ghPicCache[k] || src;
  ghPicCache[k] = null; if (!src) return '';
  const im = new Image(); im.onload = () => { ghPicCache[k] = ghRecolour(im, hue).toDataURL(); }; im.src = src;
  return src;
}
function ghFolkTex(sc) {
  for (const [who, [kind, hue]] of Object.entries(GH_FOLK)) {
    const key = 'gh_tr_' + who, from = 'tr_' + trArt(kind); ghPic(kind, hue, 0); ghPic(kind, hue, 1);
    if (sc.textures.exists(key) || !sc.textures.exists(from)) continue;
    const img = sc.textures.get(from).getSourceImage(), c = ghRecolour(img, hue);
    const T0 = sc.textures.get(from), k = T0.source[0].resolution || 1;
    const NT = sc.textures.addSpriteSheet(key, c, { frameWidth: img.width / 4, frameHeight: img.height / 4 });
    if (k > 1 && NT) hdShrinkTexture(NT, k);   // HD sheets show at a third of their size, like the originals
  }
}
const ghFolkKey = who => (scene && scene.textures && scene.textures.exists('gh_tr_' + who)) ? 'gh_tr_' + who : 'tr_' + trArt(GH_FOLK[who][0]);
const GHP = (kind, name, hue) => (t, f = 0) => ({ who: 'trainer', name, img: hue ? ghPic(kind, hue, f) : trainerPic(kind, f), t });
const GH = {
  brask: GHP('brask', 'Brask'), isolde: GHP('isolde', 'Warden Isolde'), wren: GHP('wispwatcher', 'Wren', 140),
  tobin: GHP('busker', 'Tobin the lamplighter', 200), gleam: GHP('gleam', 'Tobias Gleam'), tansy: GHP('tansy', 'Tansy'),
  sys: t => ({ ...vdSys(''), t }), tech: GHP('vtech', 'Convoy guard'),
};

/* ---------- items */
Object.assign(ITEMS, {
  brask_pick: { name: "Brask's Pick", stack: 1, sell: 0, desc: "A miner's pick with 'R.B.' burnt into the handle. Brask must have dropped it in the Undercroft." },
  brask_lamp: { name: "Brask's Lamp", stack: 1, sell: 0, desc: "A dented brass safety lamp. It still has oil in it." },
  brask_gauge: { name: "Brask's Gas Gauge", stack: 1, sell: 0, desc: "A brass gauge for testing tunnel air. The needle's stuck on 'SAFE', which is worrying." },
  noonbell_seed: { name: 'Noonbell Seeds', stack: 999, seed: 'noonbell', sell: 90, desc: 'Any season. A pale flower from Gloamhollow that drinks in the noon light and glows after dark. Ready in 7 days.' },
  noonbell: { name: 'Noonbell', stack: 999, sell: 520, desc: 'A pale bell of a flower that holds the noon light. It glows softly after dark. Sells for 520g.' },
});
// the Noonbell grows from the cranberry's pictures until its own art arrives; it lights up at night like the lantern gourd
CROPS.noonbell = cvCrop('cranberry', 7, [0, 1, 2, 3], { item: 'noonbell', glow: 1 });
const _ghItems = hdItems;
hdItems = async function () {
  await _ghItems();
  // the Noonbell crop's four stages and some bag icons, from Gloamhollow's own sheet
  if (HDW.gh) try {
    const img = await loadImg(HDW.gh.img), F = HDW.gh.frames;
    const piece = f => { const r = F[f], c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); c._hdk = 3; return c; };
    if (F.gh_nb1) { for (let i = 1; i <= 4; i++) SAP_CANVAS['noonbell' + i] = piece('gh_nb' + i); CROPS.noonbell.frames = [1, 2, 3, 4].map(i => 'cv:noonbell' + i); }
    const icon = f => { const r = F[f], c = document.createElement('canvas'); c.width = c.height = 72; const k = Math.min(66 / r.w, 66 / r.h), w = r.w * k, h = r.h * k; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, (72 - w) / 2, (72 - h) / 2, w, h); return c; };
    for (const [id, f] of [['brask_pick', 'gh_pick'], ['brask_lamp', 'gh_lamp'], ['brask_gauge', 'gh_gauge'], ['noonbell', 'gh_bloom_open']]) if (F[f]) { const c = icon(f), u = c.toDataURL(); ICONS[id] = u; ICON_CANVAS[id] = c; HD_SMOOTH.add(u); }
  } catch (e) { console.warn('gh art', e); }
  for (const [id, f] of [['brask_pick', 'stone'], ['brask_lamp', 'lantern'], ['brask_gauge', 'stone'], ['noonbell_seed', 'lanterngourd_seeds'], ['noonbell', 'lantern_gourd']])
    if ((!ICONS[id] || ICONS[id] === ICONS.wood) && ICONS[f]) { ICONS[id] = ICONS[f]; ICON_CANVAS[id] = ICON_CANVAS[f]; }
};
// the hollow's colours: a cold violet dusk on the ground and the long grass
GTWEAK.gloam = (r, g, b) => { const l = (r + g + b) / 3; return [l * .42 + r * .16 + 12, l * .42 + g * .18 + 14, l * .5 + b * .24 + 34]; };
EGRASS_TINT.gloam = (r, g, b) => { const l = (r + g + b) / 3; return [l * .45 + 26, l * .55 + 30, l * .55 + 52]; };

/* ---------- wild Fablemon: existing species until the user's six Gloamhollow lines arrive */
// the Gloamhollow lines (ghmons.js) first, then the darker Fablemon from elsewhere that would live down here
const UNDER_ENC = ewEnc([['vespyre', 16], ['tricoil', 14], ['duskwyrm', 8], ['flintcairn', 8], ['mortarmour', 6], ['murkhowl', 6], ['clinkit_3', 5], ['inkwick_3', 4], ['lintroll', 4], ['hollowbark_3', 4]],
  [['vespyre', 20], ['tricoil', 14], ['murkhowl', 8], ['duskwyrm', 8], ['inkwick_3', 6], ['flintcairn', 6], ['clinkit_3', 4], ['hollowbark_3', 4]]);
const MERE_ENC = ewEnc([['grubble', 16], ['lumispin', 10], ['marshviper', 10], ['hollowbark_3', 8], ['lotveil_3', 8], ['mirebellows_3', 6], ['solwick', 6], ['yawnox_3', 5], ['brimbramble_3', 4], ['tricoil', 4]],
  [['lumispin', 16], ['grubble', 12], ['marshviper', 10], ['murkhowl', 8], ['duskwyrm', 8], ['inkwick_3', 8], ['solwick', 8], ['brimbramble_3', 6], ['jinglynx', 4], ['nipshade_3', 3]]);
const DEEP_ENC = ewEnc([['lintroll', 16], ['jinglynx', 12], ['craglet_3', 10], ['clinkit_3', 10], ['floecalf_2', 8], ['mirebellows_3', 6], ['flurrowl_3', 6], ['wishling_3', 6], ['lumispin', 4]],
  [['lintroll', 14], ['jinglynx', 14], ['clinkit_3', 10], ['inkwick_3', 8], ['moonspark', 8], ['floecalf_2', 8], ['craglet_3', 6], ['mirebellows_3', 6], ['flurrowl_3', 4]]);

/* ---------- trees: Elderwood's ancient trees recoloured for the dusk, and the bog's dead trees */
const ghTreeTown = (x, y) => {
  const h = hash(x * 11 + 3, y * 23 + 7);
  if (!ghXa('ewt_birch') || h < .16) return { tex: 'bog', fr: 'dead_tree', f: 'tree' };
  return { tex: 'xa', fr: h < .45 ? 'ewt_pine2' : h < .7 ? 'ewt_birch' : h < .85 ? 'ewt_pine1' : 'ewt_hollow', f: 'tree' };
};
const ghTreeMere = (x, y) => {
  const h = hash(x * 7 + 3, y * 13 + 1);
  if (!ghXa('ewt_birch') || h < .62) return { tex: 'bog', fr: 'dead_tree', f: 'tree' };
  return { tex: 'xa', fr: h < .82 ? 'ewt_birch' : 'ewt_hollow', f: 'tree' };
};

/* ---------- the maps */
const GHM = GH_MAPS;
const GH_ASC = { gh: true, crag: true, quiet: true, paths: [], ponds: [], bridge: null, open: [], clear: [], props: [] };
const GH_DARK_PAL = { floor: ASSET.ground && ASSET.ground.ghg_rock ? 'ghg_rock' : 'crag_dirt@dull', path: ASSET.ground && ASSET.ground.ghg_planks ? 'ghg_planks' : 'crag_gravel@dull', rock: 'crag_rock@dull', wild: 'crag_dirt_grass@gloam', water: 'water@gloam' };
const GH_DEEP_PAL = { floor: ASSET.ground && ASSET.ground.ghg_rock ? 'ghg_rock' : 'crag_dirt@gloam', path: ASSET.ground && ASSET.ground.ghg_crystal ? 'ghg_crystal' : 'crag_gravel@gloam', rock: 'crag_rock@gloam', wild: 'crag_dirt_grass@gloam', water: 'water@gloam' };
const GH_TRAIL_STEPS = GHM.undercroft.trail;
const GH_TOOL_IDS = ['brask_pick', 'brask_lamp', 'brask_gauge'];
const GH_MIR0 = { A: '\\', B: '\\', C: '/', D: '/' };   // the mirrors as you find them: all wrong

Object.assign(ROUTES, {
  // the haul tunnel: walkways either side of the rails, a collapse in the middle, the maintenance passage over it
  // (Brask's door), and the flooded galleries round underneath (the long way, where his tools are)
  undercroft: { ...GH_ASC, name: 'The Undercroft', w: 60, h: 30, ascii: GHM.undercroft.rows, gpal: GH_DARK_PAL, egrass: 'gloam',
    dark: { r: 54, a: .93 }, convoy: true,
    zones: [[0, 0, 0, 0, 66, 67], [0, 0, 0, 0, 66, 68], [0, 0, 0, 0, 67, 68], [0, 0, 0, 0, 67, 68]],
    pickups: [{ id: 'uc1', x: 4, y: 6, item: 'tonic', n: 4 }, { id: 'uc2', x: 31, y: 24, gold: 9000 }, { id: 'uc3', x: 54, y: 10, item: 'mon_treat', n: 3 }],
    signs: { '4,13': "The Undercroft: the old miners' haul tunnel under the mountain. Greenline's convoys still run the rails. When you hear one coming, duck into a side alcove!",
      '57,13': 'East: Gloamhollow.', '26,17': "Old miners' gallery. Flooded in places. 'NO ENTRY WITHOUT A LAMP.'" },
    trainers: [
      { id: 'uc_t1', kind: 'miner', name: 'Gethin', x: 10, y: 7, dir: 'down', sight: 3, team: [['lintroll', 67], ['flintcairn', 67], ['clinkit_3', 68]] },
      { id: 'uc_t2', kind: 'climber', name: 'Nia', x: 46, y: 9, dir: 'left', sight: 3, team: [['vespyre', 68], ['duskwyrm', 68]] },
      { id: 'uc_t3', kind: 'miner', name: 'Dewi', x: 26, y: 23, dir: 'right', sight: 3, team: [['mortarmour', 68], ['tricoil', 68], ['cairnbrute', 69]] },
    ],
    cgprops: [['cg_lamp_post', 5, 13], ['cg_lamp_post', 17, 13], ['cg_lamp_post', 39, 13], ['cg_lamp_post', 51, 13], ['cg_lamp_post', 32, 17], ['cg_crate', 3, 17], ['cg_cart_broken', 22, 13], ['cg_crate', 56, 17]],
    ghBlocks: [{ area: [30, 9, 31, 9], ok: () => !!gh().door, fr: 'qd_barrier' }],
    exits: [{ r: [0, 14, 0, 16], to: () => ['ewcamp', { x: 38, y: 15, dir: 'left' }] }, { r: [59, 14, 59, 16], to: () => ['gloamhollow', { x: 1, y: 31, dir: 'right' }] }],
    spawn: { x: 1, y: 14, dir: 'right' }, enc: UNDER_ENC },

  // the village: the lamp tower north of the square, the church west, the mill and its pool east, homes south
  // 24 Nov: rebuilt at 80 x 64 so every building has room round it
  gloamhollow: { ...EW_BASE, gh: true, phased: true, name: 'Gloamhollow', w: 80, h: 64, town: true, forest: .36, ghTree: ghTreeTown, treeTint: 0x9890d0,
    tint: () => ghNoon() ? [0x2a2448, .06] : [0x1a1838, ghFree() ? .2 : .34],
    gpal: { floor: ASSET.ground && ASSET.ground.ghg_moss ? 'ghg_moss' : 'forest_moss@gloam', path: ASSET.ground && ASSET.ground.ghg_cobble ? 'ghg_cobble' : 'slab@gloam', wild: 'forest_floor_grass@gloam', mudk: 'mud@gloam', water: 'water@gloam', shallow: 'shallow@gloam' },
    paths: [[0, 30, 79, 32], [30, 24, 50, 40], [26, 21, 54, 23], [38, 15, 42, 23], [38, 40, 42, 63], [12, 19, 15, 30], [65, 19, 67, 30], [74, 0, 76, 30],
      [5, 44, 75, 46], [5, 56, 75, 58], [5, 32, 6, 58], [74, 32, 75, 58]],
    ponds: [[60, 24, 2.8, 1.9]],
    open: [[0, 29, 3, 33], [37, 60, 43, 63], [74, 0, 76, 3]], clear: [[4, 4, 76, 60], [0, 29, 4, 33]],
    buildings: [
      { id: 'gh_tower', atlas: 'br', frame: 'br_lighthouse', cx: 40, by: 14, door: 0, name: "Isolde's Lamp Tower" },
      { id: 'gh_church', atlas: 'town', frame: 'hall', cx: 14, by: 18, door: 0, name: 'The Old Church' },
      { id: 'gh_inn', atlas: 'ewb', frame: 'ewb_inn', cx: 30, by: 20, door: 0, name: 'The Glimmer Inn' },
      { id: 'gh_store', atlas: 'ewb', frame: 'ewb_store', cx: 50, by: 20, door: 0, name: 'Hollow Stores' },
      { id: 'gh_mill', atlas: 'bh', frame: 'bh_mill', cx: 66, by: 18, door: 0, name: 'The Old Mill' },
      { id: 'gh_h1', atlas: 'ewb', frame: 'ewb_moss', cx: 12, by: 43, door: 0, name: 'Moss-roofed house' },
      { id: 'gh_h2', atlas: 'ewb', frame: 'ewb_oldcottage', cx: 24, by: 43, door: 0, name: 'Old cottage' },
      { id: 'gh_h3', atlas: 'ewb', frame: 'ewb_stone', cx: 56, by: 43, door: 0, name: 'Stone house' },
      { id: 'gh_h4', atlas: 'ewb', frame: 'ewb_tall', cx: 68, by: 43, door: 0, name: 'Tall house' },
      { id: 'gh_h5', atlas: 'ewb', frame: 'ewb_timber', cx: 12, by: 55, door: 0, name: 'Timber house' },
      { id: 'gh_h6', atlas: 'ewb', frame: 'ewb_riverside', cx: 24, by: 55, door: 0, name: "Wren's house" },
      { id: 'gh_h7', atlas: 'ewb', frame: 'ewb_hunters', cx: 56, by: 55, door: 0, name: 'Lamp-maker\'s house' },
      { id: 'gh_h8', atlas: 'ewb', frame: 'ewb_tree', cx: 68, by: 55, door: 1, name: 'Tree house' },
    ],
    ewdecor: [[...ghA('gh_stall_lamps', ['town', 'stall']), 32, 27, 3], [...ghA('gh_stall_crops', ['town', 'stall']), 32, 35, 3], [...ghA('gh_stall_crops', ['town', 'stall']), 46, 27, 3], [...ghA('gh_stall_lamps', ['town', 'stall']), 46, 35, 3],
      ['qd', 'qd_stone_lantern', 37, 24], ['qd', 'qd_stone_lantern', 43, 24], ['br', 'br_bench', 35, 39, 2], ['br', 'br_bench', 44, 39, 2], ['br', 'br_planter', 39, 33, 2],
      ['bog', 'dead_tree', 8, 36], ['bog', 'dead_tree', 72, 38], ['bog', 'dead_tree', 27, 8], ['bog', 'dead_tree', 47, 50], ['bog', 'post', 56, 22], ['bog', 'post', 64, 26], ['bog', 'cattail', 57, 25], ['bog', 'cattail', 63, 22],
      ...(HDW.gh ? [['gh', 'gh_reeds2', 58, 21], ['gh', 'gh_lily1', 60, 24], ['gh', 'gh_fungus2', 34, 50], ['gh', 'gh_fungus3', 46, 52], ['gh', 'gh_moss1', 20, 12]] : []),
      ...(ghXa('ewt_birch') ? [['xa', 'ewt_birch', 6, 12], ['xa', 'ewt_pine2', 72, 12], ['xa', 'ewt_birch', 56, 9], ['xa', 'ewt_hollow', 25, 10], ['xa', 'ewt_pine2', 32, 50], ['xa', 'ewt_birch', 48, 52],
        ['xa', 'ewt_birch', 18, 49], ['xa', 'ewt_pine2', 62, 50], ['xa', 'ewt_hollow', 28, 52], ['xa', 'ewt_birch', 52, 50], ['xa', 'ewt_pine1', 9, 26], ['xa', 'ewt_pine1', 71, 26]] : [])],
    signs: { '2,28': "Gloamhollow. The sun only clears the mountain from noon till one, so the lamps burn all day. Please mind the Shade Fablemon: they're friendly, mostly.",
      '17,19': "Four carvings run along the church lintel, west to east: a lantern, a moon, an owl and a key. Cut underneath: 'RING AS THE SUN WALKS.'",
      '73,9': "The old mine road north. A Verdance fence across it, and a sign: 'SITE G. NO ENTRY.' Beyond it, a deep hum." },
    blocks: [{ area: [74, 6, 76, 7], ok: () => ghSiteOpen() || ghFree(), f: 'crate' }],
    left: y => ['undercroft', { x: 58, y: 14, dir: 'left' }],
    down: x => ['lanternmere', { x: Math.max(26, Math.min(29, x - 12)), y: 1, dir: 'down' }],
    up: x => ['siteg', { x: 20, y: 30, dir: 'up' }],
    spawn: { x: 1, y: 31, dir: 'right' }, enc: NO_ENC },

  // the misty marsh: boardwalks out to the five great lanterns
  lanternmere: { ...EW_BASE, gh: true, phased: true, bog: true, name: 'Lanternmere', w: 56, h: 44, forest: .3, ghTree: ghTreeMere, treeTint: 0x8c9cc0,
    tint: () => [0x14243a, Math.max(.1, .3 - ghLit() * .04)],
    gpal: { floor: 'moss@bog', path: ASSET.ground && ASSET.ground.ghg_board ? 'ghg_board' : 'board', wild: 'forest_floor_grass@gloam', mudk: 'peat', water: 'water@bog', shallow: 'shallow@bog' },
    paths: [[26, 0, 29, 40], [4, 20, 52, 22], [8, 8, 12, 10], [10, 10, 11, 20], [44, 8, 47, 10], [45, 10, 46, 20], [9, 22, 10, 33], [8, 32, 12, 34], [45, 22, 46, 33], [44, 32, 48, 34], [24, 36, 32, 40]],
    ponds: [[18, 13, 4, 3], [38, 13, 4, 3], [18, 29, 3.6, 2.6], [38, 29, 3.6, 2.6], [15, 40, 3, 1.6], [42, 40, 3, 1.6]],
    open: [[26, 0, 29, 3]],
    zones: [[14, 3, 22, 7, 68, 70], [33, 3, 41, 7, 68, 70], [13, 23, 22, 25, 69, 70], [33, 23, 42, 25, 69, 70], [3, 36, 8, 41, 69, 70], [48, 36, 53, 41, 69, 70]],
    pickups: [{ id: 'lm1', x: 3, y: 9, item: 'tonic', n: 4 }, { id: 'lm2', x: 52, y: 15, gold: 10000 }, { id: 'lm3', x: 34, y: 39, item: 'starpetal_charm', n: 1 }],
    signs: { '25,2': "Lanternmere. Five great lanterns once kept the marsh calm: an ember, a spark, a gourd, a mirror and the moths. When they're out, the Shade Fablemon get restless." },
    ewdecor: [...(HDW.gh ? [['gh', 'gh_reeds3', 14, 9], ['gh', 'gh_reeds2', 22, 16], ['gh', 'gh_reeds2', 34, 10], ['gh', 'gh_reeds3', 42, 16], ['gh', 'gh_reeds1', 15, 32], ['gh', 'gh_reeds2', 41, 26], ['gh', 'gh_lily2', 18, 13], ['gh', 'gh_lily1', 38, 12], ['gh', 'gh_lily1', 18, 29], ['gh', 'gh_lily2', 38, 30], ['gh', 'gh_moss2', 5, 12], ['gh', 'gh_moss1', 50, 13]] : [['br', 'br_lens', 48, 31]]), ['bog', 'post', 25, 4], ['bog', 'post', 30, 4], ['bog', 'post', 25, 19], ['bog', 'post', 30, 19], ['bog', 'log', 6, 24], ['bog', 'stump', 50, 24]],
    trainers: [
      { id: 'lm_t1', kind: 'wispwatcher', name: 'Ottilie', x: 29, y: 9, dir: 'left', sight: 4, team: [['lumispin', 69], ['solwick', 70]] },
      { id: 'lm_t2', kind: 'reedcutter', name: 'Haydn', x: 18, y: 20, dir: 'right', sight: 4, team: [['marshviper', 69], ['grubble', 70], ['lotveil_3', 70]] },
      { id: 'lm_t3', kind: 'ponddipper', name: 'Bryn', x: 38, y: 22, dir: 'left', sight: 4, team: [['clutchtoad', 70], ['mirebellows_3', 70]] },
      { id: 'lm_t4', kind: 'forager', name: 'Mabyn', x: 26, y: 30, dir: 'right', sight: 3, team: [['hollowbark_3', 70], ['lanternweave', 70], ['gloamfang', 71]] },
    ],
    up: x => ['gloamhollow', { x: Math.max(38, Math.min(42, x + 12)), y: 62, dir: 'up' }],
    spawn: { x: 27, y: 1, dir: 'down' }, enc: MERE_ENC },

  // under the Mill Pool well: a ring path round a black lake, an island, a crystal grotto, the siphon niche, and the
  // mirror chamber in the south
  glimmerdeep: { ...GH_ASC, phased: true, name: 'Glimmerdeep', w: 48, h: 36, gpal: GH_DEEP_PAL, egrass: 'gloam', dark: { r: 88, a: .74 }, crystals: true,
    get ascii() { const rows = GHM.glimmerdeep.rows.slice(); if (S && S.gh && S.gh.bridge) rows[11] = rows[11].slice(0, 24) + '.' + rows[11].slice(25); return rows; },
    zones: [[], [], [], [], [0, 0, 0, 0, 70, 71], [0, 0, 0, 0, 70, 72], [0, 0, 0, 0, 71, 72, 'isle'], [0, 0, 0, 0, 71, 72]],
    isle: [['moonspark', 16], ['knellynx', 6], ['wishling_3', 6], ['solwick', 4]].filter(([s]) => SPECIES[s]),
    signs: { '21,3': '__heal', '27,3': "Glimmerdeep. The crystals here drink light and give it back. Somewhere south, a beam of it once ran all the way up to the marsh." },
    trainers: [
      { id: 'gd_t1', kind: 'climber', name: 'Ceri', x: 12, y: 8, dir: 'right', sight: 4, team: [['flurrowl_3', 71], ['craglet_3', 72], ['knellynx', 72]] },
      { id: 'gd_t2', kind: 'miner', name: 'Idris', x: 43, y: 25, dir: 'up', sight: 3, team: [['cairnbrute', 72], ['clinkit_3', 72]] },
    ],
    exits: [{ r: [23, 1, 24, 1], to: () => ['gloamhollow', { x: 56, y: 29, dir: 'down' }] }],
    spawn: { x: 23, y: 2, dir: 'down' }, enc: DEEP_ENC },

  // inside the mountain: a hall of beam stacks and pillars, the Taproot drill at the far end
  siteg: { ...GH_ASC, name: 'Site G', w: 40, h: 32, ascii: GHM.siteg.rows, egrass: 'gloam', dark: { r: 84, a: .8 },
    gpal: { floor: 'quarry_flags@dull', path: 'crag_gravel@dull', rock: 'crag_rock@dull', wild: 'crag_dirt@dull' },
    zones: [],
    pickups: [{ id: 'sg1', x: 6, y: 5, item: 'tonic', n: 5 }, { id: 'sg2', x: 33, y: 27, gold: 12000 }, { id: 'sg3', x: 33, y: 5, item: 'heartwood_charm', n: 1 }],
    signs: { '17,28': '__heal', '22,28': "SITE G. TAPROOT ASSEMBLY. Hard hats. Hi-vis. 'Every beam brings the future closer.'" },
    ewdecor: GHM.siteg.stacks.filter((p, i) => !HDW.gh || i % 3 === 0).map(([x, y]) => [...ghA('gh_beams', ['bog', 'log']), x, y]),
    trainers: [],
    exits: [{ r: [18, 31, 21, 31], to: () => ['gloamhollow', { x: 75, y: 1, dir: 'down' }] }],
    spawn: { x: 20, y: 29, dir: 'up' }, enc: NO_ENC },
});
if (HDW.gh) {
  const M = { gh_tower: ['gh_tower', 0], gh_church: ['gh_church', 0], gh_inn: ['gh_inn', 0], gh_store: ['gh_store', 0], gh_mill: ['gh_mill', -2],
    gh_h1: ['gh_h1', 0], gh_h2: ['gh_h2', 0], gh_h3: ['gh_h3', 0], gh_h4: ['gh_h4', 1], gh_h5: ['gh_h5', 0], gh_h6: ['gh_h6', 0], gh_h7: ['gh_h7', 1], gh_h8: ['gh_h8', 0] };
  for (const b of ROUTES.gloamhollow.buildings) { const m = M[b.id]; if (m) { b.atlas = 'gh'; b.frame = m[0]; b.door = m[1]; } }
} else if (!ASSET.ewbJson) for (const b of ROUTES.gloamhollow.buildings) if (b.atlas === 'ewb') { b.atlas = 'town'; b.frame = { ewb_inn: 'tavern', ewb_store: 'store' }[b.frame] || (b.by > 40 ? 'homeB' : 'homeA'); b.door = 0; }
// secrets bought from Gleam: things only there once you know where to look
const GH_SECRET_PICKUPS = { undercroft: [0, { id: 'ghs0', x: 54, y: 7, item: 'heartwood_charm', n: 1 }], lanternmere: [1, { id: 'ghs1', x: 12, y: 34, gold: 9000 }] };
for (const [key, [k, p]] of Object.entries(GH_SECRET_PICKUPS)) {
  const base = ROUTES[key].pickups || [];
  Object.defineProperty(ROUTES[key], 'pickups', { get() { return S && S.gh && S.gh.secrets[k] ? [...base, p] : base; }, configurable: true });
}
ROUTES.glimmerdeep.pickups = GHM.glimmerdeep.pickups.map(([x, y], k) => [{ id: 'gd1', x, y, item: 'mon_treat', n: 3 }, { id: 'gd2', x, y, item: 'mossveil_charm', n: 1 }, { id: 'gd3', x, y, gold: 11000 }][k]);
const GH_KEYS = ['undercroft', 'gloamhollow', 'lanternmere', 'glimmerdeep', 'siteg'];

/* ---------- the timber camp's back gate: the haul road runs into the mountain */
Object.assign(ROUTES.ewcamp, {
  right: y => ['undercroft', { x: 1, y: Math.max(14, Math.min(16, y - 1)), dir: 'right' }],
  blocks: [...(ROUTES.ewcamp.blocks || []), { area: [37, 14, 38, 17], ok: () => !!gh().met, f: 'crate' }],
});
ROUTES.ewcamp.open = [...ROUTES.ewcamp.open, [36, 13, 39, 18]];
ROUTES.ewcamp.ewdecor = [...ROUTES.ewcamp.ewdecor, [...ghA('gh_tunnel', ['qd', 'qd_winch']), 38, 12], ['qd', 'qd_stone_lantern', 36, 12]];
ROUTES.ewcamp.signs['35,18'] = "The haul road runs straight into the mountain here: the old miners' tunnel. Boards are nailed across the mouth. 'GREENLINE TIMBER. CONVOYS ONLY.'";

/* ---------- Verdance in the hollow: siphon guards and Site G's crews (they go once Site G is stopped) */
Object.assign(VD_REGION, { gloamhollow: 'gloam', glimmerdeep: 'gloam', siteg: 'gloam' });
Object.assign(VD_PLACES, {
  gloamhollow: [{ k: 'tech', id: 'vd_gh1', kind: 'vtech', name: 'Lyle', at: [53, 37], team: vdTeam(['duskwyrm', 70], ['clinkit_3', 70], ['nipshade_3', 71]) },
    { k: 'tech', id: 'vd_gh2', kind: 'vtech2', name: 'Fay', at: [18, 26], team: vdTeam(['hollowbark_3', 70], ['inkwick_3', 71], ['mortarmour', 71]) },
    { k: 'board', at: [60, 38], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Gloamhollow Light Efficiency Scheme. Your lamps, managed for you." }],
  glimmerdeep: [{ k: 'tech', id: 'vd_gd1', kind: 'vtech2', name: 'Rook', at: [44, 20], team: vdTeam(['floecalf_2', 71], ['wishling_3', 72], ['tricoil', 72]) }],
  siteg: [{ k: 'tech', id: 'vd_sg1', kind: 'vtech', name: 'Marsh', at: [10, 25], team: vdTeam(['mortarmour', 71], ['vespyre', 72]) },
    { k: 'tech', id: 'vd_sg2', kind: 'vtech2', name: 'Dee', at: [29, 25], team: vdTeam(['ursylvane', 72], ['cairnbrute', 72]) },
    { k: 'tech', id: 'vd_sg3', kind: 'vtech', name: 'Holt', at: [10, 15], team: vdTeam(['nipshade_3', 72], ['hydrarch', 73]) },
    { k: 'tech', id: 'vd_sg4', kind: 'vtech2', name: 'Sable', at: [29, 15], team: vdTeam(['lanternweave', 72], ['hollowbark_3', 73]) },
    { k: 'memo', id: 'gh_drill', at: [7, 7] }, { k: 'memo', id: 'gh_light', at: [32, 7] }],
});
Object.assign(VD_MEMOS, {
  gh_drill: { title: 'Site G: assembly report', from: 'Dr C. Ash, Head of Research', body: `TAPROOT DRILL HEAD. Assembly complete.

Rootwood lining fitted to sections 1–380. The remaining sections will follow the head down the bore.

Note: the drill head does not need Site G once it is in the bore. It cuts its own way, and it does not stop.

Recommend lowering it at once.` },
  gh_light: { title: 'Light siphons: Gloamhollow', from: 'Verdance Land & Acquisitions', body: `Three siphons draw the root's light from the hollow to power the assembly lamps.

Side effects reported by locals: lamps failing, Shade Fablemon "restless", one complaint about a church bell.

Response: none required. The village will be relocated in phase two.` },
});
VD_MEMO_ORDER.push('gh_drill', 'gh_light');

/* ---------- the story's actors */
const GH_LAMPS = [[7, 29], [22, 29], [29, 26], [51, 26], [29, 38], [51, 38], [37, 48], [43, 54]];
const GH_BLOOMS = { gloamhollow: [[8, 40], [76, 41], [28, 8]], lanternmere: [[4, 15], [51, 28]], glimmerdeep: [GHM.glimmerdeep.bloom] };
const GH_BLOOM_KEYS = Object.entries(GH_BLOOMS).flatMap(([k, L]) => L.map((p, i) => k + i));
const GH_BELLS = [['owl', 7, 21], ['moon', 7, 25], ['key', 21, 21], ['lantern', 21, 25]];
const GH_BELL_ORDER = ['key', 'owl', 'moon', 'lantern'];   // as the sun walks: east to west along the lintel
const GH_LANTERNS = { ember: [10, 9], spark: [45, 9], gourd: [9, 33], mirror: [46, 33], moth: [28, 38] };
const GH_LANTERN_NAME = { ember: 'Ember Lantern', spark: 'Spark Lantern', gourd: 'Gourd Lantern', mirror: 'Mirror Lantern', moth: 'Moth Lantern' };
const GH_SIPHONS = { lamp: ['gloamhollow', 55, 36, 'vd_gh1', [62, 88, 35]], church: ['gloamhollow', 20, 28, 'vd_gh2', [41, 17, 76]], deep: ['glimmerdeep', 45, 18, 'vd_gd1', [55, 91, 23]] };
const ghSiphonImg = k => gh().siph[k] ? ghA('gh_siphon_off', ['vd', 'vd_siphon_off']) : ghA('gh_siphon', ['vd', 'vd_siphon']);
const ghBloomOut = key => (GH_BLOOMS[key] || []).map(([x, y], i) => ({ k: key + i, x, y })).filter(b => ghNoon() && !gh().blooms[b.k]);

ROUTES.undercroft.actors = () => {
  const G = gh(), out = [];
  if (G.met && ghTrust() && !G.door) out.push({ id: 'gh_brask', x: 28, y: 13, tex: 'tr_brask', dir: 'down' });
  if (G.met && !ghTrust() && !G.toolsBack) {
    GHM.undercroft.tools.forEach(([x, y], k) => { if (!G.tools[k]) out.push({ id: 'gh_tool' + k, x, y, img: ghA(['gh_pick', 'gh_lamp', 'gh_gauge'][k], ['qd', 'qd_tool_rack']), glow: true }); });
    if (ghTools() >= 3) out.push({ id: 'gh_brask', x: 57, y: 16, tex: 'tr_brask', dir: 'left' });
  }
  if (G.lostAsk && !G.lostFound) {
    GH_TRAIL_STEPS.forEach(([x, y], k) => out.push({ id: 'gh_paw' + k, x, y, print: true, walk: true }));
    out.push({ id: 'gh_lost', x: GHM.undercroft.lost[0], y: GHM.undercroft.lost[1], mon: 'jinglynx' });
  }
  return out;
};
ROUTES.gloamhollow.actors = () => {
  const G = gh(), out = [];
  if (!(S.crests && S.crests.shade)) out.push({ id: 'gh_isolde', x: 37, y: 16, tex: 'tr_isolde', dir: 'down' });
  if (G.town) out.push({ id: 'gh_brask', x: 34, y: 22, tex: 'tr_brask', dir: 'down' });
  out.push({ id: 'gh_tobin', x: 45, y: 22, tex: ghFolkKey('tobin'), dir: 'down' });
  if (!G.lostHome) out.push({ id: 'gh_wren', x: 30, y: 49, tex: ghFolkKey('wren'), dir: 'down' });
  else out.push({ id: 'gh_pip', x: 31, y: 49, mon: 'jinglynx' });
  GH_LAMPS.forEach(([x, y], k) => out.push(HDW.gh ? { id: 'gh_lamp' + k, x, y, img: ['gh', ghLampLit(k) ? 'gh_streetlamp_lit' : 'gh_streetlamp'] } : { id: 'gh_lamp' + k, x, y, lamp: true, lit: ghLampLit(k) }));
  GH_BELLS.forEach(([b, x, y]) => out.push({ id: 'gh_bell_' + b, x, y, img: ghA('gh_bell_' + b, ['br', 'br_bell_frame']) }));
  out.push({ id: 'gh_crypt', x: 8, y: 28, img: G.crypt ? ghA('gh_crypt_open', ['qd', 'qd_rubble']) : ghA('gh_crypt', ['qd', 'qd_column']) });
  for (const [k, [key, x, y]] of Object.entries(GH_SIPHONS)) if (key === 'gloamhollow') out.push({ id: 'gh_siph_' + k, x, y, img: ghSiphonImg(k) });
  out.push({ id: 'gh_well', x: 56, y: 27, img: ghA('gh_well', ['br', 'br_well']) });
  if (ghNight()) out.push({ id: 'gh_stall_shop', x: 33, y: 29, tex: ghFolkKey('mags'), dir: 'down' }, { id: 'gh_stall_seed', x: 33, y: 37, tex: ghFolkKey('seeds'), dir: 'down' },
    { id: 'gh_stall_barter', x: 47, y: 29, tex: ghFolkKey('barter'), dir: 'down' }, { id: 'gh_gleam', x: 47, y: 37, tex: 'tr_gleam', dir: 'down' });
  for (const b of ghBloomOut('gloamhollow')) out.push({ id: 'gh_bloom_' + b.k, x: b.x, y: b.y, img: ghA('gh_bloom_open', ['objects', 'wildflowers']), glow: true });
  return out;
};
ROUTES.lanternmere.actors = () => {
  const out = [];
  for (const [k, [x, y]] of Object.entries(GH_LANTERNS)) out.push({ id: 'gh_lan_' + k, x, y, ...(HDW.gh ? { img: ['gh', 'gh_lan_' + k + (gh().lit[k] ? '_lit' : '')] } : { img: ['br', 'br_lantern_post'], scale: 1.7 }) });
  for (const b of ghBloomOut('lanternmere')) out.push({ id: 'gh_bloom_' + b.k, x: b.x, y: b.y, img: ghA('gh_bloom_open', ['objects', 'wildflowers']), glow: true });
  return out;
};
ROUTES.glimmerdeep.actors = () => {
  const M = GHM.glimmerdeep, out = [];
  out.push({ id: 'gh_beamsrc', x: M.src[0], y: M.src[1], img: ghA('gh_beamlamp', ['br', 'br_lantern_post']) });
  for (const [k, [x, y]] of Object.entries(M.mirrors)) out.push({ id: 'gh_mir_' + k, x, y, img: ghA(ghMirFrame(k), ['br', 'br_lens']) });
  out.push({ id: 'gh_beamcrystal', x: M.target[0], y: M.target[1], img: ghA(gh().beam ? 'gh_crystal_lit' : 'gh_crystal', ['qd', 'qd_slate_spikes']) });
  out.push({ id: 'gh_siph_deep', x: M.siphon[0], y: M.siphon[1], img: ghSiphonImg('deep') });
  out.push({ id: 'gh_legend', x: M.legend[0], y: M.legend[1], img: ghA(S.crests && S.crests.shade ? 'gh_door_open' : 'gh_door', ['qd', 'qd_column']) });
  if (S.crests && S.crests.shade && typeof ghLegendHere === 'function' && ghLegendHere('vespereign')) out.push({ id: 'gh_vespereign', x: 37, y: 4, mon: 'vespereign', scale: 1.7 });   // the alpha: drawn bigger
  if (!gh().bridge) out.push({ id: 'gh_crystalgap', x: 24, y: 10, img: ghA('gh_xtal_b1', ['qd', 'qd_slate_spikes']) });
  for (const b of ghBloomOut('glimmerdeep')) out.push({ id: 'gh_bloom_' + b.k, x: b.x, y: b.y, img: ghA('gh_bloom_open', ['objects', 'wildflowers']), glow: true });
  return out;
};
ROUTES.siteg.actors = () => {
  const M = GHM.siteg, out = [{ id: 'gh_drill', x: M.drill[0], y: M.drill[1], ...(HDW.gh ? { img: ['gh', ghFree() ? 'gh_drill_off' : 'gh_drill'] } : { img: ['vd', ghFree() ? 'vd_drill_off' : 'vd_drill'], scale: 1.3 }) }];
  if (!ghFree()) out.push({ id: 'gh_vale', x: M.vale[0], y: M.vale[1], tex: 'tr_vale', dir: 'down' });
  return out;
};
// the lost Nipshade's sheet comes with the area
const GH_MON_NEED = { undercroft: ['jinglynx'], gloamhollow: ['jinglynx'], glimmerdeep: ['vespereign'] };
const _ghNeed = monNeed;
monNeed = function (key) { const o = _ghNeed(key); for (const sp of GH_MON_NEED[key] || []) if (SPECIES[sp]) o.add(walkSp(sp)); return o; };

/* ---------- ascii maps: doors that open, and the actors' tiles (the forest maps use RC.blocks) */
const _ghBuild = buildRoute;
buildRoute = function () {
  const R = _ghBuild();
  if (!RC.gh || !RC.ascii) return R;
  for (const b of RC.ghBlocks || []) if (!b.ok()) { const [a, bb, c, d] = b.area; for (let y = bb; y <= d; y++) for (let x = a; x <= c; x++) { const i = y * RW + x; R.blocked[i] = 1; R.grass[i] = -1; const [tx, fr] = ghA('gh_mdoor', ['qd', b.fr || 'qd_barrier']); if (tx === 'qd' || (x === a && y === bb)) R.deco.push({ x, y, tex: tx, fr, gate: 1 }); } }
  return R;
};

/* ---------- light and dark: underground, everything outside a light is pitch black. You see a circle round you (wider
   with a Glow or Ember Fablemon on your team, or once Site G is stopped); lamps, crystals, fungi, lit lanterns and
   the convoys' headlamps light their own patches. The dark is a render texture over the whole map: the still lights
   are cut out of it once (ghDarkBase), and each frame that is copied in and the player's and headlamps' light cut out. */
function ghHoleTex(sc) {
  if (sc.textures.exists('gh_hole')) return;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.9)'); gr.addColorStop(.8, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); sc.textures.addCanvas('gh_hole', c);
}
function ghGlowTex(sc) {
  if (sc.textures.exists('gh_glow')) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sc.textures.addCanvas('gh_glow', c);
}
// a soft pool of light (additive, above the dark); in the dark it also lights the ground round it
const ghGlow = (sc, x, y, r, col, a) => {
  ghGlowTex(sc); a *= 2;
  const g = sc.add.image(x, y, 'gh_glow').setScale(r / 16).setTint(col).setAlpha(a).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 24);
  sc.tweens.add({ targets: g, alpha: a * .5, yoyo: true, repeat: -1, duration: 900 + Math.random() * 900 });
  if (RC.dark) { (sc.ghLights = sc.ghLights || []).push([x, y, r * 1.6]); sc.ghDarkDirty = 1; }
  return g;
};
const ghLightR = () => RC.dark.r + (ghHas('Glow') || ghHas('Ember') ? 30 : 0) + (ghFree() ? 16 : 0);
function ghDarkness(sc) {
  const D = RC.dark; if (!D) return;
  ghHoleTex(sc);
  const W = RW * T, H = RH * T;
  sc.ghDark = sc.add.renderTexture(0, 0, W, H).setOrigin(0).setDepth(9e6 - 26);
  sc.ghDarkBase = sc.add.renderTexture(0, 0, W, H).setOrigin(0).setVisible(false);
  sc.ghHole = sc.make.image({ key: 'gh_hole', add: false });
  sc.ghLightR = ghLightR(); sc.ghDarkDirty = 1;
  sc.halo = sc.add.zone(0, 0, 1, 1);   // Crag scenes move the halo with the player; mounts refuse to be ridden where there is one
  sc.cameras.main.setBackgroundColor(0x000000);
  FX.set(S.weather, true); FX.ambient(null);
  if ((ghHas('Glow') || ghHas('Ember')) && !sc.ghLightToast) { sc.ghLightToast = 1; setTimeout(() => toast('Your Glow and Ember Fablemon light the way.', 2000), 700); }
}
const ghErase = (rt, hole, x, y, r) => { hole.setScale(r / 64); rt.erase(hole, x, y); };
function ghDarkFrame(sc) {
  if (!sc.ghDark || !sc.player) return;
  if (sc.ghDarkDirty) {   // the still lights: cut out once (again when one is added)
    sc.ghDarkDirty = 0; const B = sc.ghDarkBase; B.clear(); B.fill(0x000000, 1);
    for (const [x, y, r] of sc.ghLights || []) ghErase(B, sc.ghHole, x, y, r);
    if (B.render) B.render();   // Phaser 4 queues drawing on a render texture until render()
  }
  const rt = sc.ghDark; rt.clear(); rt.draw(sc.ghDarkBase, 0, 0);
  ghErase(rt, sc.ghHole, sc.player.x, sc.player.y - 6, sc.ghLightR * 1.25);
  const o = sc.ghCv && sc.ghCv.on;   // a convoy's headlamp lights the rails ahead of it
  if (o) { const d = sc.ghCv.dir; for (let k = 0; k < 4; k++) ghErase(rt, sc.ghHole, (o.x + d * (1 + k * 1.4)) * T + 8, GH_CV_ROW * T + 6, 18 + k * 8); }
  if (rt.render) rt.render();
}

/* ---------- after each Gloamhollow area is built: colours, glows, and its own bits */
const _ghCreate = Route.prototype.create;
Route.prototype.create = function () {
  if ((ROUTES[this.scene.key] || {}).gh) try { ghFolkTex(this); } catch (e) { console.warn('folk', e); }
  _ghCreate.call(this);
  if (!RC.gh) return;
  this.events.once('create', () => { try { ghAfter(this); } catch (e) { console.warn('gloam', e); } });
};
function ghAfter(sc) {
  const key = sc.scene.key;
  // recoloured trees and long grass
  if (RC.treeTint) for (const o of sc.children.list) if (o.texture && ((o.texture.key === 'xa' && /^ewt_/.test(o.frame.name)) || (o.texture.key === 'bog' && o.frame.name === 'dead_tree'))) o.setTint(o.texture.key === 'bog' ? 0xb0a8c8 : RC.treeTint);
  for (const s of Object.values(sc.grassSpr || {})) s.setTint(RC.dark ? 0x9aa0d0 : 0xb8c0e0);
  ghDarkness(sc);
  if (RC.dark) for (const [tx, x, y] of RC.cgprops || []) if (tx === 'cg_lamp_post') ghGlow(sc, x * T + 12, y * T - 2, 14, 0xffc870, .22);
  if (key === 'undercroft') ghFungi(sc);
  // things that glow on their own show in the dark: Brask's tools, Pip's pawprints, the siphons, the beam lamp, the drill
  if (RC.dark) for (const a of sc.R.actors || []) {
    const r = /^gh_paw/.test(a.id) ? 12 : /^gh_tool|^gh_lost/.test(a.id) ? 16 : /^gh_siph|^gh_beamsrc|^gh_drill|^gh_legend|^gh_vespereign|^gh_mir_|^gh_beamcrystal/.test(a.id) ? 30 : 0;
    if (r) { (sc.ghLights = sc.ghLights || []).push([a.x * T + 8, a.y * T + 4, r]); sc.ghDarkDirty = 1; }
  }
  const A = sc.ewSpr || {};
  if (key === 'gloamhollow') {
    for (const [k, im] of Object.entries(A)) if (/^gh_lamp\d/.test(k) && im.texture.key === 'gh' && ghLampLit(+k.slice(7))) ghGlow(sc, im.x, im.y - 26, 15, 0xffd070, .3);
    for (const b of RC.buildings) if (b.id === 'gh_tower') ghGlow(sc, b.cx * T + 8, b.by * T + 16 - (b.atlas === 'gh' ? 124 : 166), 26, ghFree() ? 0xfff0b0 : 0xb0a0ff, ghFree() ? .45 : .2);
    for (const k of ['lamp', 'church']) if (!gh().siph[k] && A['gh_siph_' + k]) vdHum(sc, A['gh_siph_' + k], {});
    if (ghNoon()) { const sun = sc.add.rectangle(0, 0, RW * T, RH * T, 0xfff0c0, .08).setOrigin(0).setDepth(9e6 - 30).setBlendMode(Phaser.BlendModes.ADD); sc.tweens.add({ targets: sun, alpha: .14, yoyo: true, repeat: -1, duration: 2400 }); }
  }
  if (key === 'lanternmere') for (const k of Object.keys(GH_LANTERNS)) { const im = A['gh_lan_' + k]; if (!im) continue; if (gh().lit[k]) { ghGlow(sc, im.x, im.y - (im.texture.key === 'gh' ? 48 : 38), 22, k === 'moth' ? 0xb8ffd0 : k === 'mirror' ? 0xfff6d0 : 0xffc060, .38); if (k === 'moth') ghMoths(sc, im.x, im.y - 34); } else if (im.texture.key !== 'gh') im.setTint(0x6a6a80); }
  if (key === 'glimmerdeep') {
    ghCrystals(sc); ghFungi(sc); ghBeamDraw(sc);
    if (!gh().siph.deep && A.gh_siph_deep) vdHum(sc, A.gh_siph_deep, {});
    if (A.gh_beamcrystal && A.gh_beamcrystal.texture.key !== 'gh') A.gh_beamcrystal.setTint(gh().beam ? 0xfff6c0 : 0x9adfff);
    if (A.gh_beamcrystal && gh().beam) ghGlow(sc, A.gh_beamcrystal.x, A.gh_beamcrystal.y - 18, 26, 0xbfe8ff, .4);
    if (A.gh_crystalgap && A.gh_crystalgap.texture.key !== 'gh') A.gh_crystalgap.setTint(0x9adfff);
    if (A.gh_legend && A.gh_legend.texture.key !== 'gh') A.gh_legend.setTint(0x40305a);
    if (A.gh_beamsrc) ghGlow(sc, A.gh_beamsrc.x, A.gh_beamsrc.y - 22, 14, 0xfff0b0, .45);
  }
  if (key === 'siteg') {
    for (let y = 6; y < 28; y += 6) for (const x of [6, 33]) ghGlow(sc, x * T + 8, y * T, 20, 0xc8ff9a, .16);
    if (A.gh_drill && !ghFree()) { const g = ghGlow(sc, A.gh_drill.x, A.gh_drill.y - 30, 34, 0xb8ff6a, .3); sc.tweens.add({ targets: A.gh_drill, x: A.gh_drill.x + 1, yoyo: true, repeat: -1, duration: 60 }); }
  }
  if (key === 'undercroft' && !S.flags.ghUnder) { S.flags.ghUnder = 1; setTimeout(() => toast('The Undercroft. Your eyes adjust... slowly. Somewhere ahead, rails are humming.', 3200), 700); }
  if (key === 'gloamhollow' && !gh().town) { gh().town = 1; setTimeout(() => { toast('Gloamhollow: a village of lamps in the bottom of the hollow. It is never quite day here.', 3600); checkQuests(); }, 700); }
  if (key === 'glimmerdeep' && !S.flags.ghDeep) { S.flags.ghDeep = 1; setTimeout(() => { toast('Glimmerdeep. Crystals glow in the walls, and a black lake fills the cave.', 3200); checkQuests(); }, 700); }
  if (key === 'siteg' && !S.flags.ghSiteG) { S.flags.ghSiteG = 1; setTimeout(() => toast('Site G. A cavern the size of a cathedral, and at the far end, the Taproot drill.', 3200), 700); }
  sc.ghPhase = RC.phased ? ghPhase() : null; sc.ghRefreshing = 0;
}
const ghPhase = () => `${ghNoon() ? 1 : 0}${ghNight() ? 1 : 0}${ghEve() ? 1 : 0}`;
function ghCrystals(sc) {
  const R = sc.R;
  for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
    if (R.kind[y * RW + x] !== '#') continue;
    const open = [[0, 1], [1, 0], [-1, 0]].some(([dx, dy]) => { const k = R.kind[(y + dy) * RW + x + dx]; return k && k !== '#'; });
    const h = hash(x * 17 + 5, y * 31 + 9); if (!open || h > .09) continue;
    if (HDW.gh && sc.textures.exists('gh')) sc.add.image(x * T + 8, y * T + 16, 'gh', (h < .045 ? 'gh_xtal_b' : 'gh_xtal_v') + (1 + Math.floor(h * 1000) % 3)).setOrigin(.5, 1).setDepth(y * T + 15);
    else sc.add.image(x * T + 8, y * T + 16, 'qd', 'qd_slate_spikes').setOrigin(.5, 1).setDepth(y * T + 15).setTint(h < .045 ? 0x9adfff : 0xd0a0ff).setScale(.8);
    ghGlow(sc, x * T + 8, y * T + 6, 12, h < .045 ? 0x7ad0ff : 0xc090ff, .2);
  }
}
function ghFungi(sc) {
  if (!HDW.gh || !sc.textures.exists('gh')) return;
  const R = sc.R;
  for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
    const i = y * RW + x; if (R.blocked[i] || R.kind[i] === '#' || R.grass[i] > 0 || R.kind[(y - 1) * RW + x] !== '#') continue;
    const h = hash(x * 29 + 3, y * 7 + 11); if (h > .07) continue;
    sc.add.image(x * T + 8, y * T + 14, 'gh', 'gh_fungus' + (h < .015 ? 1 : h < .04 ? 2 : 3)).setOrigin(.5, 1).setDepth(y * T + 2);
    ghGlow(sc, x * T + 8, y * T + 6, 10, 0x7ab8ff, .18);
  }
}
function ghMoths(sc, x, y) {
  for (let k = 0; k < 6; k++) {
    const m = sc.add.circle(x + (Math.random() - .5) * 30, y + (Math.random() - .5) * 20, 1.6, 0xd8ffd0, .9).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 23);
    sc.tweens.add({ targets: m, x: m.x + (Math.random() - .5) * 30, y: m.y + (Math.random() - .5) * 24, alpha: .3, yoyo: true, repeat: -1, duration: 900 + Math.random() * 900, ease: 'Sine.inOut' });
  }
}

/* ---------- every frame: the convoys, and the village changing with the hour */
const _ghFrame = Route.prototype.frameHook;
Route.prototype.frameHook = function (dt) {
  _ghFrame.call(this, dt);
  if (!RC.gh || !this.p) return;
  if (RC.convoy && !ghFree()) ghConvoy(this, dt);
  if (this.ghDark) ghDarkFrame(this);
  if (this.ghPhase && this.ghPhase !== ghPhase() && !this.paused && !Battle.active && !this.ghRefreshing) { this.ghRefreshing = 1; ewRefresh(this); }
};
const GH_CV_ROW = 15;
function ghConvoy(sc, dt) {
  const C = sc.ghCv || (sc.ghCv = { t: 5, on: null, dir: 1 });
  if (sc.paused || Battle.active) return;
  if (!C.on) {
    C.t -= dt; if (C.t > 0) return;
    const x = C.dir > 0 ? -3 : RW + 2, carts = [];
    for (let k = 0; k < 3; k++) carts.push(HDW.gh && sc.textures.exists('gh') ? sc.add.image(0, GH_CV_ROW * T + 15, 'gh', 'gh_cart').setOrigin(.5, 1).setDepth(GH_CV_ROW * T + 14).setFlipX(C.dir < 0) : sc.add.image(0, GH_CV_ROW * T + 15, C.dir > 0 ? 'cg_cart_right' : 'cg_cart_left').setOrigin(.5, 1).setDepth(GH_CV_ROW * T + 14));
    const lamp = sc.add.graphics().setDepth(9e6 - 24).setBlendMode(Phaser.BlendModes.ADD);
    C.on = { x, carts, lamp, caught: 0 };
    Sound.play('thud'); sc.cameras.main.shake(300, .002);
    if (!S.flags.ghConvoy) { S.flags.ghConvoy = 1; toast('The rails start to hum... a convoy is coming! Get into a side alcove!', 3000); }
    return;
  }
  const o = C.on; o.x += C.dir * 7 * dt;
  o.carts.forEach((c, k) => c.setPosition((o.x - C.dir * k * 2.4) * T + 8, GH_CV_ROW * T + 15));
  // the headlamp: a cone of light along both walkways
  const fx = (o.x + C.dir * .6) * T + 8, L = 5.5 * T * C.dir;
  o.lamp.clear(); o.lamp.fillStyle(0xfff0a0, .22); o.lamp.fillTriangle(fx, GH_CV_ROW * T + 8, fx + L, (GH_CV_ROW - 1.5) * T, fx + L, (GH_CV_ROW + 2.5) * T);
  o.lamp.fillStyle(0xfff0a0, .35); o.lamp.fillCircle(fx, GH_CV_ROW * T + 6, 5);
  if (o.x < -6 || o.x > RW + 6) { o.carts.forEach(c => c.destroy()); o.lamp.destroy(); C.on = null; C.t = 6 + Math.random() * 4; C.dir *= -1; return; }
  if (o.caught) return;
  const px = sc.player.x / T - .5, py = Math.floor((sc.player.y - 1) / T);
  if (py < GH_CV_ROW - 1 || py > GH_CV_ROW + 1) return;
  const ahead = (px - o.x) * C.dir;
  if (ahead > -3.6 && ahead < 5.4) { o.caught = 1; ghCaught(sc); }
}
function ghCaught(sc) {
  sc.p.path = []; sc.p.pending = null; Sound.play('error');
  if (!team().some(m => m.hp > 0)) { toast('The convoy guards shout at you to clear the tracks, and thunder past.', 2600); return; }
  const lv = 67 + (Math.random() < .5 ? 1 : 0), pool = [['mortarmour', lv], ['clinkit_3', lv], ['duskwyrm', lv + 1], ['flintcairn', lv]];
  const tm = [pool[Math.floor(Math.random() * 2)], pool[2 + Math.floor(Math.random() * 2)]].map(([s, l]) => { const m = trainerMon(s, l); m.collar = 1; return m; });
  sc.paused = true;
  Talk.say([GH.tech("OI! What are you doing on the line? Nobody's allowed in the tunnel!", 0), GH.tech("Right. You're coming with me. After I've dealt with your team.", 0)], async () => {
    await vdCollarPics(tm);
    Battle.start(tm[0], { label: 'Field Tech', name: 'Convoy guard', team: tm, prize: 2000, intro: ['A convoy guard wants to battle!', `${SPECIES[tm[0].sp].name} is hooked up to a Verdance drain!`], lose: 'Tracks are no place for farmers.',
      onWin: () => setTimeout(() => toast('The guard scrambles back onto the convoy as it rumbles off into the dark.', 2600), 400) });
  });
}

/* ---------- the lamps of the village: the Lamplighter's Round */
function ghLampLit(k) {
  const R = gh().round;
  if (R.day === S.day && (R.lit || []).includes(k)) return true;
  return R.done === S.day && ghNight();
}
function ghLamp(sc, k) {
  const R = gh().round;
  if (!ghEve()) return ghSay([GH.sys(ghLampLit(k) ? 'The street lamp burns warm and steady.' : "A street lamp, cold and dark. Tobin the lamplighter lights them between six and nine in the evening.")]);
  if (R.day !== S.day) { R.day = S.day; R.lit = []; }
  if (R.lit.includes(k)) return ghSay([GH.sys('This one is already lit.')]);
  R.lit.push(k); Sound.play('pick');
  const im = (sc.ewSpr || {})['gh_lamp' + k]; if (im) { if (im.texture.key === 'gh') im.setFrame('gh_streetlamp_lit'); else im.clearTint(); ghGlow(sc, im.x, im.y - 26, 15, 0xffd070, .3); }
  if (R.lit.length < GH_LAMPS.length) { toast(`Lamp lit! (${R.lit.length}/${GH_LAMPS.length})`, 1400); return true; }
  R.done = S.day; gh().rounds = (gh().rounds || 0) + 1; S.gold += 1500; updateHUD(); Sound.play('levelup');
  toast('Every lamp in Gloamhollow is lit! Tobin pays you 1500g.', 3000); checkQuests(); return true;
}

/* ---------- the doors and the people */
function ghDoor(sc, id) {
  const G = gh();
  if (id.startsWith('gh_lamp')) return ghLamp(sc, +id.slice(7));
  if (id.startsWith('gh_tool')) {
    const k = +id.slice(7); if (G.tools[k]) return true;
    G.tools[k] = 1; inv.add(GH_TOOL_IDS[k], 1); renderHotbar(); Sound.play('pick');
    toast(`You found ${ITEMS[GH_TOOL_IDS[k]].name}! (${ghTools()}/3)`, 2400); checkQuests(); ewRefresh(sc); return true;
  }
  if (id.startsWith('gh_paw')) return true;
  if (id === 'gh_lost') return ghSay([{ who: 'trainer', name: 'A lost Jinglynx', img: monPic('jinglynx', 'front'), t: "A little Jinglynx is curled up in the dark, shivering. It sniffs your hand... then hops up onto your shoulder and won't get down." }],
    () => { G.lostFound = 1; Sound.play('gotcha'); toast('You found the lost Jinglynx! Take it home to Wren in Gloamhollow.', 3000); ewRefresh(sc); });
  if (id === 'gh_brask') return ghBraskTalk(sc);
  if (id === 'gh_isolde' || id === 'gh_tower') return ghIsolde(sc, id);
  if (id === 'gh_tobin') return ghSay(ghEve() ? [GH.tobin("Evening! Eight lamps and three hours to light them, and my knees aren't what they were.", 0), GH.tobin(`Light every one before nine and I'll pay you 1500g. ${(G.round.day === S.day ? (G.round.lit || []).length : 0)} lit so far.`, 1)]
    : [GH.tobin(ghNoon() ? "Look at that: sunshine! Make the most of it. Gone by one." : 'Lamps all day, every day. I light the street ones at six. Come and help if you like: it pays.', 0)]);
  if (id === 'gh_wren' || id === 'gh_pip') return ghWren(sc, id);
  if (id.startsWith('gh_bell_')) return ghBell(sc, id.slice(8));
  if (id === 'gh_crypt') return ghCrypt(sc);
  if (id === 'gh_church') return ghSay([GH.sys(G.crypt ? 'The Old Church. The bells hum faintly for a long while after they are rung.' : "The Old Church. Inside, rows of candles, most of them out. A note on the bell rope: 'Bells to be rung in the proper order ONLY.'")]);
  if (id.startsWith('gh_siph_')) return ghSiphon(sc, id.slice(8));
  if (id === 'gh_well') {
    if (ghLit() < 3) return ghSay([GH.sys("An old well by the Mill Pool. A cold draught comes up it, and far below, something glitters. It's far too dark to climb down. (Relight at least 3 of Lanternmere's lanterns.)")]);
    return ghSay([GH.sys(S.visited && S.visited.glimmerdeep ? 'Climb down the well into Glimmerdeep?' : 'With the lanterns lit, light glows faintly up the well shaft: there are rungs going down. You climb into the dark...')], () => travel(sc, 'glimmerdeep', { x: 23, y: 2, dir: 'down' }));
  }
  if (id === 'gh_inn') {
    openModal('The Glimmer Inn', `<p><b>Mags</b>: "In you come, out of the dark. Sit by the fire. Your Fablemon can sleep in the snug."</p><div class="row"><button class="btn gold" data-a="heal">Rest by the fire (heal my team)</button></div>`, a => {
      if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
    });
    return true;
  }
  if (id === 'gh_store') {
    const render = () => `<p class="hint">"Candles, oil and charms. Everything for a place the sun forgot."</p><div class="mlist">${GH_STORE.filter(([i]) => ITEMS[i]).map(([i, p]) => shopRow(i, p, 0, 1)).join('')}</div>`;
    openModal('Hollow Stores', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
    return true;
  }
  if (id === 'gh_stall_shop' || id === 'gh_stall_seed' || id === 'gh_stall_barter' || id === 'gh_gleam') return ghMarket(sc, id);
  if (id.startsWith('gh_bloom_')) {
    const k = id.slice(9); if (G.blooms[k]) return true;
    G.blooms[k] = S.day; Sound.play('pick'); const n = Object.keys(G.blooms).length;
    if (n >= GH_BLOOM_KEYS.length) { inv.add('noonbell_seed', 6); renderHotbar(); Sound.play('levelup'); toast('The sixth Noon Bloom! As it opens, it drops a handful of seeds: 6 Noonbell Seeds.', 3600); }
    else toast(`A Noon Bloom opens in the sunlight, and you note where it grows. (${n}/${GH_BLOOM_KEYS.length})`, 2600);
    checkQuests(); ewRefresh(sc); return true;
  }
  if (id.startsWith('gh_lan_')) return ghLantern(sc, id.slice(7));
  if (id.startsWith('gh_mir_')) return ghMirror(sc, id.slice(7));
  if (id === 'gh_beamsrc') return ghSay([GH.sys('An old miners\' lamp, bolted to the rock and still burning. Its beam runs off east across the chamber.')]);
  if (id === 'gh_beamcrystal') return ghSay([GH.sys(G.beam ? 'The great crystal blazes with light. A shaft of it shoots straight up through the cave roof, towards the marsh.' : 'A great crystal under a shaft in the roof. If light reached it, it would carry it all the way up.')]);
  if (id === 'gh_crystalgap') return ghSay([GH.sys('Crystal pillars stand at the edge of the lake. One of them looks loose, but you can\'t see how to move it.')]);
  if (id === 'gh_vespereign') return ghLegend(sc, 'vespereign');
  if (id === 'gh_legend') return ghSay([GH.sys(S.crests && S.crests.shade ? (S.flags.vrCaught ? 'The black crystal door stands open on an empty throne of bone.' : 'The black crystal door stands open. In the dark beyond it, something enormous is hanging from the roof...') : 'A sealed door of black crystal, carved with a great crowned bat. It is cold to touch. Something on the far side is breathing, very slowly.')]);
  if (id === 'gh_drill') return ghSay([GH.sys(ghFree() ? 'The Taproot assembly is dark and silent. Its great cradle is empty: the drill head is gone.' : "The Taproot drill: a machine the size of a church, lined with pale rootwood beams from Alder's forest. It's humming.")]);
  if (id === 'gh_vale') { ghVale(sc); return true; }
  if (id === 'gh_mill') return ghSay([GH.sys("The Old Mill. The wheel turns slowly in the Mill Pool. Inside, the miller is grinding barley by lamplight.")]);
  const homes = { gh_h1: 'A moss-roofed house. A row of lanterns hangs from the gutter.', gh_h2: 'An old cottage. Someone is singing to a Shade Fablemon to get it to sleep.',
    gh_h3: 'A stone house. Through the window: a family playing cards by candlelight.', gh_h4: "A tall house with a lamp in every window. 'We'll not be the house that goes dark,' says a sign.",
    gh_h5: 'A timber house. Smells of woodsmoke and toast.', gh_h6: "Wren's house. Paper lanterns and a little drawing of a Jinglynx on the door.",
    gh_h7: "The lamp-maker's house. Glass shades of every colour in the window.", gh_h8: 'A house built into an old tree. The roots hold up the porch.' };
  if (homes[id]) return ghSay([GH.sys(homes[id])]);
  return false;
}
const _ghBh = bhDoor;
bhDoor = function (sc, id) { return id && id.startsWith('gh_') ? ghDoor(sc, id) : _ghBh(sc, id); };
const GH_STORE = [['tonic', 110], ['mon_treat', 250], ['sturdy_charm', 130], ['starpetal_charm', 900], ['mossveil_charm', 900], ['lantern', 400], ['stone_lantern', 650]];

/* ---------- Brask: in Quarrydown, in the tunnel, in the village */
const _ghTalk = Route.prototype.talkTrainer;
Route.prototype.talkTrainer = function (t) {
  if (t.id === 'vd_brask_qd' && S.crests && S.crests.wild && !gh().met) {
    const p0 = this.p; t.spr.setFrame(DIRS.indexOf(p0.x > t.cx ? 'right' : p0.x < t.cx ? 'left' : p0.y > t.cy ? 'down' : 'up') * 4);
    return ghBraskQD(this);
  }
  return _ghTalk.call(this, t);
};
function ghBraskQD(sc) {
  const G = gh();
  if (ghTrust()) return ghSay([GH.brask('The haul road goes into the mountain? Course it does. That\'s the old miners\' tunnel. The Undercroft, we called it.', 0),
    GH.brask("I know that tunnel. I dug half of it, back when I was younger than you.", 1),
    GH.brask("There's a maintenance passage over the bad stretch. Locked, and I've still got the key. Never did hand it back.", 0),
    GH.brask('Go through the timber camp, past the sawmill. I\'ll meet you at the passage door. And keep off the rails.', 1)],
    () => { G.met = 1; G.guide = 1; Sound.play('levelup'); toast("Brask will meet you in the Undercroft. The tunnel's at the back of the timber camp.", 3200); checkQuests(); });
  return ghSay([GH.brask('The tunnel. Under the mountain. You want me to take you down there.', 0),
    GH.brask("You kept my pages. Took them to Rowan. Fair enough. But don't expect me to hold your hand through the dark as well.", 0),
    GH.brask("The boards on the mouth come off easy. The passage over the bad stretch is locked, and the key stays with me. So it's the long way round for you, through the flooded galleries.", 0),
    GH.brask("...Mind the convoys. And if you find a pick, a lamp and a gauge down there, they're mine. I lost them the night I walked out.", 1)],
    () => { G.met = 1; G.guide = 0; toast("The tunnel's at the back of the timber camp. You'll have to take the long way.", 3200); checkQuests(); });
}
function ghBraskTalk(sc) {
  const G = gh();
  if (sc.scene.key === 'undercroft') {
    if (ghTrust() && !G.door) return ghSay([GH.brask("There you are. Hear that hum? Convoys. They run all night, and it's always night down here.", 0),
      GH.brask("Ahead, the roof's down across both walkways. This passage goes up and over it.", 0),
      GH.brask('There.', 1), GH.brask("I'll go on ahead and find us somewhere to stay in the hollow. Gloamhollow. Nice folk. Odd hours.", 1)],
      () => { G.door = 1; Sound.play('door'); toast('Brask unlocks the maintenance door!', 2400); checkQuests(); ewRefresh(sc); });
    if (!ghTrust() && ghTools() >= 3 && !G.toolsBack) return ghSay([GH.brask("...Followed you in. Couldn't let you do the long way alone. Not with the galleries flooded.", 0),
      GH.brask('My pick. My lamp. My gauge. You found them all.', 1),
      GH.brask("I've been hard on you. You kept the pages because you thought it was right. That's more than I did for twenty years.", 0),
      GH.brask("Come on. Gloamhollow's just ahead. I'll stand you a drink at the Glimmer Inn.", 1)],
      () => { for (const id of GH_TOOL_IDS) inv.remove(id, inv.count(id)); renderHotbar(); G.toolsBack = 1; G.door = 1; Sound.play('levelup'); toast('Brask has joined you! He opens the maintenance door for next time.', 3000); checkQuests(); ewRefresh(sc); });
  }
  if (!G.isolde) return ghSay([GH.brask("The Warden here's Isolde. She keeps the lamp tower, north of the square. Go and see her. I'll be at the inn.", 0)]);
  if (!ghFree()) return ghSay([GH.brask(ghSiteOpen() ? "Site G's up the old mine road, north-east. I'll keep the inn warm. Come back in one piece." : 'The convoys come out up the old mine road, north-east. Verdance have fenced it. The lamps going out is them, I\'d bet my pick on it.', 0)]);
  return ghSay([GH.brask("The drill's gone down the bore, then. Under Smallroot.", 0), GH.brask("You'd best get home, farmer. I'll follow when I can.", 1)]);
}

/* ---------- Isolde: the lamp tower */
// a Warden's or a director's third forms know their signature move, even below the level the line evolves at
const ghSig = m => { const g = SIGNATURE[m.sp]; if (g && !m.moves.includes(g[1])) { if (m.moves.length < 4) m.moves.push(g[1]); else m.moves[m.moves.length - 1] = g[1]; } return m; };
const ISOLDE_TEAM = [['moonspark', 70], ['clinkit_3', 71], ['vigilarach', 72], ['inkwick_3', 72], ['gloamfang', 73], ['carillion', 74]].filter(([s]) => SPECIES[s]);
function ghIsolde(sc, id) {
  const G = gh();
  if (S.crests && S.crests.shade) return ghSay([GH.isolde(ghNoon() ? "Noon. My favourite hour. Not because of the light: because of the shadows it makes." : 'The tower burns bright again. Thank you, farmer.', 1)]);
  if (!G.isolde) return ghSay([GH.isolde("A farmer, all the way from Smallroot. Through the Undercroft, by the look of your boots.", 0),
    GH.isolde("I am Isolde. I keep the lamp tower, and I am the Warden here. For now.", 0),
    GH.isolde("You'll want my Crest. You won't have it. Not while my village goes dark.", 0),
    GH.isolde('Every week the lamps burn lower. The Shade Fablemon are restless: they need the light as much as we need the dark. Something is drinking it.', 0),
    GH.isolde("Start with Lanternmere, south of the village. Five great lanterns keep the marsh calm. They've all gone out.", 0),
    GH.isolde('An ember, a spark, a gourd from a farm, the old mirror and the moths. Relight what you can.', 1)],
    () => { G.isolde = 1; checkQuests(); });
  if (ghLit() >= 3 && !(S.visited && S.visited.glimmerdeep)) return ghSay([GH.isolde("Three lanterns. I could see them from the tower. The marsh is quieter already.", 1),
    GH.isolde("Now the hard part. Light comes up the Mill Pool well again, so there's light enough to climb down. Glimmerdeep is under us: the crystal caves.", 0),
    GH.isolde("The mirror lantern's beam came from down there once. And if something is drinking our light, it's down there, or in the village.", 0)]);
  if (S.visited && S.visited.glimmerdeep && ghSiph() < 3) return ghSay([GH.isolde(`Siphons. Three of them: one by the lamp-maker's in the Lamp Quarter, one in the churchyard, one in Glimmerdeep. ${ghSiph()} shut.`, 0),
    GH.isolde("They've been drinking the root's light to light Verdance's work under the mountain. Shut them all.", 0)]);
  if (ghSiph() >= 3 && ghLit() < 5) return ghSay([GH.isolde(`The siphons are shut. Now the lanterns: ${ghLit()} of 5. The mirror wants the noon sun and a beam from below; the moths come once the other four burn.`, 0)]);
  if (ghSiteOpen() && !ghFree()) return ghSay([GH.isolde("Every lantern lit, every siphon shut. And the hum under the mountain is louder than ever.", 0),
    GH.isolde("The old mine road, north-east. The fence is down: the lights came back on and the guards ran. Site G is at the end of it.", 0),
    GH.isolde('Go. Stop whatever they are building. Then come back, and I will battle you.', 1)]);
  if (!ghFree()) return ghSay([GH.isolde(ghLit() < 3 ? `Lanternmere's lanterns, farmer. ${ghLit()} of 5 burning.` : 'Keep going. The village is watching the marsh light up.', 0)]);
  // Site G is stopped: the Crest battle
  openModal("Isolde's Lamp Tower", `<p>Warden Isolde turns up the great lamp, and the room fills with long, moving shadows. Her Shade team is around <b>level 70–74</b>. Your team will be fully healed before the battle.</p><div class="row"><button class="btn gold" data-a="go">Challenge Warden Isolde</button><button class="btn" data-a="no">Not yet</button></div>`, a => {
    closeModal(); if (a !== 'go') return;
    S.mons.forEach(restMon); refreshTeamBtn && refreshTeamBtn();
    Talk.say([GH.isolde("The light is back. The shadows have somewhere to fall again.", 0), GH.isolde('Now. Let us see what your light shows in the dark.', 0)], () => {
      const tm = ISOLDE_TEAM.map(([s, l]) => ghSig(wardenMon([s, l])));
      Battle.start(tm[0], { label: 'Warden', name: 'Isolde', team: tm, prize: 14000, boss: true, smart: true, heals: 2, lose: 'Mind the shadows on your way home. Come back when your lantern burns brighter.', onWin: () => {
        S.crests.shade = 1;
        setTimeout(() => { Sound.play('gotcha'); Talk.say([GH.isolde('There. Your lantern burns true.', 1),
          GH.isolde('The Shade Crest. Seven, now. Only Smallroot\'s is left.', 1),
          GH.isolde("And something else. In Glimmerdeep, the black crystal door has opened. I felt it go. Whatever sleeps behind it will want to meet you, one day.", 0),
          GH.sys('Somewhere far away, under Smallroot, the ground gives a long, low shudder.'),
          GH.isolde("...You felt that too. The drill head. It's reached something.", 0),
          GH.isolde('Go home, farmer. Run.', 0)], () => { toast('You received the Shade Crest! 🏮', 3200); postSend('gh_rowan', GH_ROWAN_LETTER, true); checkQuests(); }); }, 400);
      } });
    });
  });
  return true;
}
const GH_ROWAN_LETTER = { from: 'Rowan', subj: 'Come home', body: n => `${n},\n\nThe Hearthroot is flickering. Like a candle in a draught. Bramble hasn't slept.\n\nThe ground shook last night, under the square. Whatever Verdance sent down that bore, it's close.\n\nCome home. Now, please.\n\nRowan` };

/* ---------- Lanternmere's five lanterns */
function ghLantern(sc, k) {
  const G = gh(), nm = GH_LANTERN_NAME[k];
  if (G.lit[k]) return ghSay([GH.sys(`The ${nm} burns bright. The water round it is calm and still.`)]);
  const light = msg => { G.lit[k] = S.day; Sound.play('levelup'); toast(`${msg} (${ghLit()}/5 lit)`, 3200); if (ghLit() === 3) setTimeout(() => toast('Three lanterns! Back in Gloamhollow, light glows up the Mill Pool well...', 3400), 3300); checkQuests(); ewRefresh(sc); return true; };
  if (k === 'ember') return ghHas('Ember') ? light('Your Ember Fablemon breathes a flame into the great lantern, and it roars into life!') : ghSay([GH.sys('The Ember Lantern: a great iron brazier, cold and black. It needs real fire. An Ember Fablemon on your team could light it.')]);
  if (k === 'spark') return ghHas('Spark') ? light('Your Spark Fablemon sends a crackle of lightning into the lantern\'s coils. It flickers, then blazes!') : ghSay([GH.sys('The Spark Lantern: glass coils round a copper rod. It needs a jolt. A Spark Fablemon on your team could do it.')]);
  if (k === 'gourd') {
    if (!inv.count('lantern_gourd')) return ghSay([GH.sys("The Gourd Lantern: an empty cradle where a glowing gourd once sat. A Lantern Gourd from a farm would fit it. (They grow from Lantern Gourd Seeds in autumn.)")]);
    inv.remove('lantern_gourd', 1); renderHotbar(); return light('You set a Lantern Gourd in the cradle. It glows brighter and brighter until the whole lantern shines.');
  }
  if (k === 'mirror') {
    if (!G.beam) return ghSay([GH.sys("The Mirror Lantern: a great polished mirror, angled at a shaft in the ground. Isolde said its beam once came up from below. Nothing's coming up now.")]);
    if (!ghNoon()) return ghSay([GH.sys('Light rises up the shaft from Glimmerdeep, but it\'s faint. The mirror wants the noon sun as well. Come back between noon and one.')]);
    return light('Noon sun from above, crystal light from below. You turn the old mirror, and both beams meet in the lantern. It blazes white!');
  }
  if (k === 'moth') {
    const others = ['ember', 'spark', 'gourd', 'mirror'].filter(o => G.lit[o]).length;
    if (others < 4) return ghSay([GH.sys(`The Moth Lantern: an empty glass cage, its door open. Glow-moths used to live in it. They'll only come back when the other four lanterns burn. (${others}/4)`)]);
    return light('From every corner of the marsh, glow-moths come drifting in, hundreds of them, and settle in the cage. The last lantern shines green-gold!');
  }
  return true;
}
// restless Shade Fablemon: more of them in the long grass while the lanterns are out
const _ghOdds = vdEncOdds;
vdEncOdds = function (sc) { const o = _ghOdds(sc); return sc && sc.scene && sc.scene.key === 'lanternmere' ? o * (1 + (5 - ghLit()) * .12) : o; };

/* ---------- Glimmerdeep's mirrors: carry the beam across the chamber to the great crystal */
function ghTrace(sc) {
  const M = GHM.glimmerdeep, st = gh().mir, at = {};
  for (const [k, [x, y]] of Object.entries(M.mirrors)) at[x + ',' + y] = st[k] || GH_MIR0[k];
  let [x, y] = M.src, dx = 1, dy = 0; const pts = [[x, y]];
  for (let n = 0; n < 200; n++) {
    x += dx; y += dy;
    if (x < 0 || y < 0 || x >= RW || y >= RH) break;
    if (x === M.target[0] && y === M.target[1]) { pts.push([x, y]); return { pts, hit: true }; }
    const m = at[x + ',' + y];
    if (m) { pts.push([x, y]); if (m === '/') [dx, dy] = [-dy, -dx]; else [dx, dy] = [dy, dx]; continue; }
    if (sc.R.kind[y * RW + x] === '#') { pts.push([x - dx * .5, y - dy * .5]); break; }
  }
  return { pts, hit: false };
}
function ghBeamDraw(sc) {
  if (sc.ghBeam) sc.ghBeam.destroy();
  const { pts } = ghTrace(sc), g = sc.ghBeam = sc.add.graphics().setDepth(9e6 - 23).setBlendMode(Phaser.BlendModes.ADD);
  for (const [w, a] of [[5, .18], [2, .7]]) { g.lineStyle(w, 0xfff2b0, a); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * T + 8, y * T + 8) : g.moveTo(x * T + 8, y * T + 8)); g.strokePath(); }
}
const ghMirFrame = k => (gh().mir[k] || GH_MIR0[k]) === '/' ? 'gh_mirror_r' : 'gh_mirror_l';
function ghMirror(sc, k) {
  const G = gh();
  if (G.beam) return ghSay([GH.sys('The crystal mirror is locked in place by the light pouring through it.')]);
  G.mir[k] = (G.mir[k] || GH_MIR0[k]) === '/' ? '\\' : '/';
  Sound.play('door'); const im = (sc.ewSpr || {})['gh_mir_' + k]; if (im) { if (im.texture.key === 'gh') im.setFrame(ghMirFrame(k)); else sc.tweens.add({ targets: im, scaleX: { from: -im.scaleX, to: im.scaleX }, duration: 200 }); }
  ghBeamDraw(sc);
  if (ghTrace(sc).hit) {
    G.beam = 1; Sound.play('levelup'); sc.cameras.main.flash(500, 255, 246, 200);
    toast('The beam strikes the great crystal! It blazes, and a shaft of light shoots up through the cave roof, towards Lanternmere.', 4000);
    const c = (sc.ewSpr || {}).gh_beamcrystal; if (c) { if (c.texture.key === 'gh') c.setFrame('gh_crystal_lit'); else c.setTint(0xfff6c0); }
    checkQuests();
  }
  return true;
}

/* ---------- the light siphons: beat the guard, then bleed the valves in the right order */
function ghSiphon(sc, k) {
  const G = gh(), [, , , guard, gauges] = GH_SIPHONS[k];
  if (G.siph[k]) return ghSay([GH.sys('The siphon is shut down. Light trickles back out of it and into the ground, like water finding its level.')]);
  if (!G.isolde) return ghSay([GH.sys("A humming Verdance machine with a pipe running into the ground. A label: 'LIGHT EFFICIENCY UNIT.' You don't like the look of it.")]);
  if (!beatTrainer(guard)) return ghSay([GH.sys("A Verdance light siphon. A Field Tech is guarding it: they won't let you near it until you've battled them.")]);
  const done = [];
  const render = () => `<p>The siphon's three valves each have a pressure gauge. A safety plate is riveted on: <b>"BLEED THE HIGHEST PRESSURE FIRST. NEVER ANY OTHER WAY."</b></p>
    <div class="row" style="display:flex;gap:8px;justify-content:center">${gauges.map((p, i) => `<button class="btn${done.includes(i) ? '' : ' gold'}" data-a="v" data-i="${i}" ${done.includes(i) ? 'disabled' : ''} style="flex:1;min-width:0">Valve ${'ABC'[i]}<br><small>${done.includes(i) ? 'closed' : p + ' psi'}</small>
    <div style="height:6px;background:#333;border-radius:3px;margin-top:4px"><div style="height:6px;width:${done.includes(i) ? 0 : p}%;background:${p > 70 ? '#e05a4a' : p > 40 ? '#e0b04a' : '#6ac04a'};border-radius:3px"></div></div></button>`).join('')}</div>`;
  openModal('Light siphon', render(), (a, d) => {
    if (a !== 'v') return; const i = +d.i, left = gauges.map((p, j) => [p, j]).filter(([, j]) => !done.includes(j)), top = left.sort((p, q) => q[0] - p[0])[0][1];
    if (i !== top) { done.length = 0; Sound.play('error'); toast('The siphon shudders and every valve blows open again with a hiss!', 2200); $('mBody').innerHTML = render(); return; }
    done.push(i); Sound.play('door');
    if (done.length < 3) { $('mBody').innerHTML = render(); return; }
    closeModal(); G.siph[k] = S.day; Sound.play('thud'); sc.cameras.main.shake(300, .006);
    setTimeout(() => { Sound.play('levelup'); toast(`The siphon grinds to a halt! (${ghSiph()}/3 shut)`, 3000); checkQuests(); ewRefresh(sc); }, 500);
  });
  return true;
}

/* ---------- Site G: Morwenna Vale, in two parts. She gets away. */
const VALE_P1 = [['hollowbark_3', 72], ['bogbastion', 73], ['brimbramble_3', 73]].filter(([s]) => SPECIES[s]);
const VALE_P2 = [['hydrarch', 74], ['ursylvane', 74], ['vespereign', 75]].filter(([s]) => SPECIES[s]);
async function ghVale(sc) {
  const G = gh(), D = (sc.ewSpr || {}).gh_drill, V = (sc.ewSpr || {}).gh_vale;
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  if (!G.valeP1) await csMoment(sc, async () => {
    if (D) await csPan(sc, D.x, D.y - 20, 900);
    await csSay([VS.vale('Hello, little farmer. You found us. Of course you did.', 0),
      VS.vale("Isn't it beautiful? Twelve thousand beams of the oldest wood in the world, and every one of them can touch the root without dying.", 0),
      VS.vale("You shut my siphons and the lamps came back on. How touching. They'll be dark again by the spring.", 0),
      VS.vale('Shall we?', 1)]);
  });
  const fight = (list, phase, heal = true) => {
    if (heal) { S.mons.forEach(restMon); refreshTeamBtn && refreshTeamBtn(); }
    const tm = list.map(([s, l]) => ghSig(trainerMon(s, l)));
    Battle.start(tm[0], { label: 'Director', name: 'Vale', team: tm, prize: phase === 2 ? 16000 : 6000, boss: true, smart: true, heals: phase === 2 ? 2 : 1,
      intro: [phase === 2 ? 'Morwenna Vale sends out her best!' : 'Director Vale wants to battle!'], lose: 'Mm. Run home, little farmer.',
      onWin: () => setTimeout(() => phase === 1 ? phase2() : ghValeWin(sc), 400) });
  };
  const phase2 = () => { G.valeP1 = 1; Talk.say([VS.vale('...', 0), VS.vale('Ash was right about you. Irritating.', 0), VS.vale('Fine. No more playing.', 1)], () => fight(VALE_P2, 2, false)); };
  if (G.valeP1) Talk.say([VS.vale('Back again? Then let us finish this.', 0)], () => fight(VALE_P2, 2));
  else fight(VALE_P1, 1);
}
function ghValeWin(sc) {
  csMoment(sc, async () => {
    const D = (sc.ewSpr || {}).gh_drill, V = (sc.ewSpr || {}).gh_vale;
    await csSay([VS.vale('...Well.', 0), GH.sys('Every lamp in Site G flickers. The drill\'s hum drops lower, and lower, and stops.')]);
    if (D) { await csPan(sc, D.x, D.y - 20, 700); sc.cameras.main.shake(700, .006); Sound.play('thud'); D.setTint(0x777777); await csWait(800); }
    await csSay([{ who: 'trainer', name: 'Radio', img: trainerPic('ash', 0), t: "Morwenna. Morwenna, do you copy? The head's away. It's in the bore. It doesn't need Site G any more." },
      { who: 'trainer', name: 'Radio', img: trainerPic('ash', 0), t: 'At this rate it reaches the root under Smallroot in days.' },
      VS.vale('Did you hear that, little farmer? You stopped the factory. The product shipped yesterday.', 1),
      VS.vale("I'd love to stay. Do give my regards to Rowan.", 1)]);
    if (V) { sc.tweens.add({ targets: V, alpha: 0, duration: 900 }); await csWait(900); }
    await csSay([GH.sys('Vale steps into a lift cage at the back of the cavern, and it rattles away up into the dark. She\'s gone.'),
      GH.sys('All round the cavern, the stolen light drains back out of the machines. Far above, in Gloamhollow, every lamp blazes up at once.')]);
  }).then(() => {
    vd().shut.gloam = S.day; S.trainers = S.trainers || {}; S.trainers.gh_vale = 1;
    Sound.play('levelup'); toast('Site G is stopped! The light is back in Gloamhollow. Go and see Isolde.', 3600); checkQuests(); ewRefresh(sc);
  });
}

/* ---------- side: Lost in the Undercroft */
function ghWren(sc, id) {
  const G = gh();
  if (G.lostHome) return ghSay([GH.wren("Pip hasn't left my side since. Look at him! He's sleeping on my feet.", 1)]);
  if (G.lostFound) return ghSay([GH.wren('PIP!', 1), GH.sys('Pip leaps off your shoulder and into Wren\'s arms.'),
    GH.wren("You found him! Thank you, thank you! He's terrified of the convoys. Here: my savings. And these: Pip loves them, so they must be good.", 1)],
    () => { G.lostHome = 1; S.gold += 3000; inv.add('mon_treat', 5); updateHUD(); renderHotbar(); Sound.play('levelup'); toast('Wren gave you 3000g and 5 Treats!', 2800); checkQuests(); ewRefresh(sc); });
  if (G.lostAsk) return ghSay([GH.wren("Pip ran into the tunnel when the last convoy went through. He leaves glowing pawprints when he's scared. Down in the old galleries, maybe?", 0)]);
  return ghSay([GH.wren('Have you seen a Jinglynx? Little, purple, with a bell on his tail? His name\'s Pip.', 0),
    GH.wren('A convoy came through and he bolted. Into the Undercroft! I\'m not allowed in there.', 0),
    GH.wren("When he's scared his paws glow. If you go back through the tunnel, look for glowing pawprints. Please?", 0)],
    () => { G.lostAsk = 1; checkQuests(); });
}

/* ---------- side: the Old Church bells */
function ghBell(sc, b) {
  const G = gh(), carving = { owl: 'an owl', moon: 'a crescent moon', key: 'a key', lantern: 'a lantern' }[b];
  if (G.crypt) return ghSay([GH.sys(`A church bell carved with ${carving}. It hums softly.`)]);
  Sound.play('coin'); sc.cameras.main.shake(120, .002);
  if (GH_BELL_ORDER[G.bells.length] !== b) { const had = G.bells.length; G.bells = []; toast(had ? `You ring the bell carved with ${carving}. The others fall silent mid-ring. Wrong order...` : `You ring the bell carved with ${carving}. It clangs, flat and dull.`, 2600); return true; }
  G.bells.push(b);
  if (G.bells.length < 4) { toast(`You ring the bell carved with ${carving}. It rings out clear, and hums on.`, 2200); return true; }
  G.crypt = 1; Sound.play('levelup'); sc.cameras.main.shake(500, .006);
  toast('All four bells ring together in one long chord... and with a grinding of stone, the old crypt in the churchyard swings open!', 3800); checkQuests(); ewRefresh(sc); return true;
}
function ghCrypt(sc) {
  const G = gh();
  if (!G.crypt) return ghSay([GH.sys("An old stone crypt, sealed tight. Carved on the door: a bell.")]);
  if (G.cryptLoot) return ghSay([GH.sys('The crypt is empty now, apart from a lot of dust and one very old spider.')]);
  G.cryptLoot = 1; S.gold += 15000; inv.add('heartwood_charm', 1); inv.add('starpetal_charm', 1); updateHUD(); renderHotbar(); Sound.play('gotcha');
  return ghSay([GH.sys("Inside the crypt: a lamplighter's old strongbox. 15000g, a Heartwood Charm and a Starpetal Charm!")], () => checkQuests());
}

/* ---------- side: the Night Market (after dark in the square), and Gleam's gossip */
const GH_SEEDS = ['lanterngourd_seeds', 'geodemelon_seeds', 'lotus_seeds', 'emberbeet_seeds', 'moorberry_seeds', 'noonbell_seed'];
const GH_BARTER = [[['pumpkin', 6], ['starpetal_charm', 1]], [['potato', 10], ['stone_lantern', 1]], [['lantern_gourd', 4], ['heartwood_charm', 1]], [['corn', 8], ['mon_treat', 3]], [['tomato', 10], ['mossveil_charm', 1]]];
const GH_GOSSIP = [
  { price: 2500, t: "One of the convoy guards dropped a crate of 'confiscated goods' in the Undercroft's north-east chamber, and never went back for it. Silly man." },
  { price: 2500, t: "There's a smuggler's tin tucked under the boardwalk in Lanternmere, by the Gourd Lantern. Verdance money. Finders keepers, I always say." },
  { price: 3000, t: "In Glimmerdeep there's a loose crystal pillar by the lake, north of the island. Tap it at the base and it falls across the gap. Our survey team used it as a bridge." },
];
function ghMarket(sc, id) {
  const G = gh(); G.market = 1; checkQuests();
  if (id === 'gh_stall_shop') {
    const render = () => `<p class="hint">"Shade and Glow goods, lanterns for your farm. Only after dark, dear."</p><div class="mlist">${[['starpetal_charm', 850], ['mossveil_charm', 850], ['heartwood_charm', 2400], ['lantern', 350], ['stone_lantern', 600], ['hearth_lantern', 1400]].filter(([i]) => ITEMS[i]).map(([i, p]) => shopRow(i, p, 0, 1)).join('')}</div>`;
    openModal('Night Market: lamps and charms', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
    return true;
  }
  if (id === 'gh_stall_seed') {
    const list = GH_SEEDS.filter(i => ITEMS[i] && (i !== 'noonbell_seed' || Object.keys(G.blooms).length >= GH_BLOOM_KEYS.length)), seed = list[S.day % list.length];
    const render = () => `<p class="hint">"A different rare seed every night. Tonight's is ${ITEMS[seed].name}."</p><div class="mlist">${shopRow(seed, Math.max(300, (ITEMS[seed].sell || 50) * 6), 0, 1)}</div>`;
    openModal('Night Market: rare seeds', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
    return true;
  }
  if (id === 'gh_stall_barter') {
    const render = () => `<p class="hint">"No coin? No bother. Fresh crops for my wares. There's no sun for growing here."</p><div class="mlist">${GH_BARTER.filter(([[c], [o]]) => ITEMS[c] && ITEMS[o]).map(([[c, n], [o, m]], i) =>
      `<div class="shoprow"><img src="${iconFor(c)}"><div class="g"><b>${n} ${ITEMS[c].name}</b> → <b>${m} ${ITEMS[o].name}</b><br><small>You have ${inv.count(c)}</small></div><button class="btn gold" data-a="trade" data-i="${i}" ${inv.count(c) >= n ? '' : 'disabled'}>Trade</button></div>`).join('')}</div>`;
    openModal('Night Market: barter', render(), (a, d) => {
      if (a !== 'trade') return; const [[c, n], [o, m]] = GH_BARTER[+d.i]; if (inv.count(c) < n) return Sound.play('error');
      inv.remove(c, n); inv.add(o, m); renderHotbar(); Sound.play('coin'); $('mBody').innerHTML = render();
    });
    return true;
  }
  // Gleam: Verdance's man, selling Verdance's secrets
  const render = () => `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><img src="${trainerPic('gleam', 1)}" style="width:72px;height:72px;object-fit:contain"><p style="margin:0"><b>Tobias Gleam</b><br>"Our favourite neighbour! I'm between jobs. Community relations, but freelance. Secrets, fairly priced."</p></div>
    <div class="mlist">${GH_GOSSIP.map((s, i) => `<div class="shoprow"><div class="g">${G.secrets[i] ? `<small>${s.t}</small>` : `<b>A Verdance secret</b><br><small>${s.price}g</small>`}</div>${G.secrets[i] ? '' : `<button class="btn gold" data-a="g" data-i="${i}" ${S.gold >= s.price ? '' : 'disabled'}>Buy</button>`}</div>`).join('')}</div>`;
  openModal('Night Market: Gleam', render(), (a, d) => {
    if (a !== 'g') return; const i = +d.i, s = GH_GOSSIP[i]; if (G.secrets[i] || S.gold < s.price) return Sound.play('error');
    S.gold -= s.price; G.secrets[i] = S.day; if (i === 2) G.bridge = 1; updateHUD(); Sound.play('coin'); $('mBody').innerHTML = render(); checkQuests();
  });
  return true;
}

/* ---------- the quests */
const GH_Q = [
  ewTask('gh_brask', 'Find Brask in Quarrydown', "Alder said Brask, the old foreman from the Old Mine, knows the tunnels. He's been sitting outside Quarrydown station since he quit Verdance.", () => gh().met, {}, 'quarrydown'),
  ewTask('gh_under', () => ghTrust() ? 'Meet Brask at the maintenance door' : `Take the long way through the Undercroft (Brask's tools ${ghTools()}/3)`,
    () => ghTrust() ? "The tunnel is at the back of the Greenline timber camp. Brask is waiting where the roof has come down. Keep clear of the convoys on the rails!"
      : "The tunnel is at the back of the Greenline timber camp. Go round the collapse through the flooded galleries, and look out for Brask's pick, lamp and gauge.",
    () => !!(gh().door || gh().toolsBack), { gold: 4000 }, 'undercroft'),
  ewTask('gh_town', 'Reach Gloamhollow', 'The far end of the Undercroft opens into the hollow.', () => gh().town, { gold: 3000, items: { tonic: 3 } }, 'undercroft'),
  ewTask('gh_isolde1', 'Visit Warden Isolde at the lamp tower', "The lamp tower is north of Gloamhollow's square.", () => gh().isolde, {}, 'gloamhollow'),
  ewTask('gh_lanterns', () => `Relight Lanternmere's great lanterns (${Math.min(3, ghLit())}/3)`, "Lanternmere is south of the village. The Ember Lantern needs an Ember Fablemon; the Spark Lantern a Spark Fablemon; the Gourd Lantern a Lantern Gourd from your farm.", () => ghLit() >= 3, { gold: 5000 }, 'lanternmere'),
  ewTask('gh_deep', 'Climb down the Mill Pool well into Glimmerdeep', "The well is by the Mill Pool, on the east side of Gloamhollow.", () => S.visited && S.visited.glimmerdeep, {}, 'gloamhollow'),
  ewTask('gh_siphons', () => `Shut down the three light siphons (${ghSiph()}/3)`, "Isolde says: one in the Lamp Quarter, one in the churchyard, one in Glimmerdeep. Each has a Field Tech on guard.", () => ghSiph() >= 3, { gold: 8000, items: { sturdy_charm: 5 } }, 'gloamhollow'),
  ewTask('gh_lights', () => `Relight all five lanterns (${ghLit()}/5)`, "The Mirror Lantern needs a beam from Glimmerdeep's crystals, and the noon sun. The glow-moths come once the other four are lit.", () => ghLit() >= 5, { gold: 6000 }, 'lanternmere'),
  ewTask('gh_siteg', 'Stop the Taproot assembly at Site G', "The old mine road runs north-east out of Gloamhollow. Verdance's Field Techs guard it. Rest first.", () => ghFree(), { gold: 10000, items: { mon_treat: 3 } }, 'siteg'),
  ewTask('gh_crest', 'Earn the Shade Crest from Warden Isolde', 'Isolde is at her lamp tower. Her team is level 70–74.', () => S.crests && S.crests.shade, { gold: 8000, items: { mon_treat: 3 } }, 'gloamhollow'),
  ewTask('gh_home', 'Go home: Rowan has sent for you', "Rowan's letter says the Hearthroot is flickering. Go back to Smallroot.", () => gh().home, {}, 'town'),
];
const GH_SIDE = [
  ewTask('gh_round', "The Lamplighter's Round", "Help Tobin light Gloamhollow's 8 street lamps between 6pm and 9pm. He pays every evening you finish.", () => (gh().rounds || 0) >= 1, { gold: 1000 }, 'gloamhollow'),
  ewTask('gh_market', 'Visit the Night Market', "After 7pm, stalls open in Gloamhollow's square: charms, lamps, a rare seed every night, and crops bartered for goods.", () => gh().market, {}, 'gloamhollow'),
  ewTask('gh_lost', 'Lost in the Undercroft', "Wren's Jinglynx, Pip, bolted into the tunnel. Follow his glowing pawprints through the old galleries.", () => gh().lostHome, {}, 'undercroft'),
  ewTask('gh_noon', () => `Noon Bloom (${Math.min(GH_BLOOM_KEYS.length, Object.keys(gh().blooms).length)}/${GH_BLOOM_KEYS.length})`, 'Rare flowers that only open from noon till one: three round Gloamhollow, two in Lanternmere, one in Glimmerdeep.', () => Object.keys(gh().blooms).length >= GH_BLOOM_KEYS.length, { gold: 3000 }, 'gloamhollow'),
  ewTask('gh_bells', 'The Old Church bells', 'Ring the four churchyard bells in the order the carvings on the church show.', () => !!gh().cryptLoot, {}, 'gloamhollow'),
  ewTask('gh_gossip', () => `Gleam's gossip (${Object.keys(gh().secrets).length}/3)`, 'Tobias Gleam has a stall at the Night Market. He sells Verdance secrets.', () => Object.keys(gh().secrets).length >= 3, {}, 'gloamhollow'),
  ewTask('gh_trials', () => `Monty's mount time trials (${ghTrialsDone()}/5)`, "Monty has marked out five courses for mounts: ride onto a red start flag and race to the green one. Meadow Trail, Cragside Pass, Fernwalk, Heatherstep Cliffs and the Elder Glade.", () => ghTrialsDone() >= 5, { gold: 5000 }, 'route2'),
  ewTask('gh_cup', 'Win the Elderwood Cup', 'A new Derby cup for third forms, on the Rootway. Talk to Monty at the Derby in Smallroot.', () => typeof derbyWon === 'function' && derbyWon('elderwood'), {}, 'town'),
];
{
  const i = QUESTS.findIndex(q => q.id === 'ew_crest');
  QUESTS.splice(i + 1, 0, ...GH_Q, ...GH_SIDE);
  GH_Q.forEach((q, k) => { QUEST_PLACE[q.id] = q._place; q.ready = k ? () => GH_Q[k - 1].done() : () => !!(S && S.crests && S.crests.wild); });
  GH_SIDE.forEach(q => { QUEST_PLACE[q.id] = q._place; });
  Object.assign(QUEST_SIDE, { gh_round: { after: 'gh_town' }, gh_market: { after: 'gh_town' }, gh_lost: { after: 'gh_town' }, gh_noon: { after: 'gh_town' }, gh_bells: { after: 'gh_town' }, gh_gossip: { after: 'gh_town' },
    gh_trials: { after: 'ew_crest' }, gh_cup: { after: 'ew_crest' } });
}
// home: entering Smallroot with the Shade Crest
(function () {
  const mk = World.prototype.makePlayer;
  World.prototype.makePlayer = function (sp) {
    mk.call(this, sp);
    try { if (this.scene.key === 'town' && S.crests && S.crests.shade && !gh().home) { gh().home = 1; setTimeout(() => { toast('Smallroot. The Hearthroot\'s glow is flickering, on and off, like a candle in a draught...', 3600); checkQuests(); }, 800); } } catch (e) { }
  };
})();

/* ---------- the Shade Crest */
CREST_INFO.shade = ['🏮 Shade Crest', '#5a4a9a'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last
WARDEN_ORDER.splice(WARDEN_ORDER.indexOf('hearth'), 0, 'shade'); WARDEN_ACE.shade = 74;

/* ---------- Meanwhile, at the Spire */
CUTAWAYS.push(
  { id: 'gh_hollow', when: () => !!(S.gh && S.gh.town), lines: () => [
    VS.ash('The farmer is in Gloamhollow. They came through the Undercroft.', 0),
    VS.vale('Of course they did. Is the head assembled?', 0),
    VS.ash('Within the week. But the siphons are drawing hard. The village lamps are failing, and the locals are noticing.', 0),
    VS.vale('Then let the lamps go out, Corvin. People in the dark keep their heads down.', 1)] },
  { id: 'gh_bore', when: () => ghFree(), lines: () => [
    VS.thorne('Site G is dark. And Morwenna came back up the lift shaft looking like she had swallowed a wasp.'),
    VS.ash("It doesn't matter. The head is in the bore. It cuts on its own now. Four hundred metres to the mother root.", 0),
    VS.vale('Then it is a race, and we are winning it.', 1),
    VS.thorne('And the farmer?'),
    VS.vale('The farmer is going home. Exactly where I want them.', 1)] },
);

/* ---------- the map */
{
  const P = MAP_PLACES.find(p => p.k === 'gloamhollow');
  if (P) {
    Object.assign(P, { soon: 0, route: 1, warden: ['Isolde', 'shade', 7], notes: () => [ghFree() ? '✔ The lamps burn bright again' : '🏮 The lamps are failing', '🌙 Night Market after 7pm', '☀ Sun from noon till one'] });
    MAP_PLACES.splice(MAP_PLACES.indexOf(P) + 1, 0,
      { k: 'undercroft', name: 'The Undercroft', al: 'r', x: P.x + .05, y: P.y + .02, route: 1, notes: () => [ghFree() ? '✔ The convoys have stopped' : '🚃 Night convoys on the rails'] },
      { k: 'lanternmere', name: 'Lanternmere', al: 'b', x: P.x, y: P.y + .06, route: 1, notes: () => [`🏮 ${ghLit()} of 5 great lanterns lit`] });
  }
}

/* ============================================================ anywhere: Monty's mount time trials
   Five courses, one for each mount's perk (any mount can ride any of them). Ride onto the red start flag: the clock
   starts. Reach the green flag at the far end. Gold, silver and bronze times come from the course's length, and each
   new medal pays out (gold also raises your mount's Speed). The flags show once you have a mount. */
const GH_TRIALS = { route2: ['Meadow Dash', 'boost'], crag1: ['Cragside Climb', 'leap'], fernwalk: ['Fernwalk Run', 'momentum'], heatherstep: ['Cliff-top Glide', 'glide'], eldglade: ['Glade Charge', 'charge'] };
const ghTrialsDone = () => Object.keys(GH_TRIALS).filter(k => (S.gh && S.gh.trial || {})[k]).length;
const ghMedal = (sec, d) => sec <= d / 11 ? 3 : sec <= d / 9 ? 2 : sec <= d / 7 ? 1 : 0;
const GH_MEDAL = ['', '🥉 bronze', '🥈 silver', '🥇 gold'];
function ghTrialCourse(sc) {
  const R = sc.R, sp = RC.spawn, N = RW * RH, dist = new Int32Array(N).fill(-1), q = [sp.y * RW + sp.x]; dist[q[0]] = 0;
  let far = q[0];
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % RW, y = (i / RW) | 0;
    if (dist[i] > dist[far] && R.dirtish && R.dirtish[i]) far = i;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a < 1 || b < 1 || a >= RW - 1 || b >= RH - 1) continue; const j = b * RW + a; if (dist[j] >= 0 || R.blocked[j]) continue; dist[j] = dist[i] + 1; q.push(j); }
  }
  if (dist[far] < 12) return null;
  return { sx: sp.x, sy: sp.y, fx: far % RW, fy: (far / RW) | 0, d: dist[far] };
}
const ghFlag = (sc, x, y, col) => { const g = sc.add.graphics().setDepth(y * T + 15); g.fillStyle(0x5a3a20, 1); g.fillRect(x * T + 7, y * T - 8, 2, 22); g.fillStyle(col, 1); g.fillTriangle(x * T + 9, y * T - 8, x * T + 18, y * T - 4, x * T + 9, y * T); return g; };
const _ghTrialCreate = Route.prototype.create;
Route.prototype.create = function () {
  _ghTrialCreate.call(this);
  const key = this.scene.key; this.ghTrial = null;
  if (!GH_TRIALS[key] || !(S.mt && S.mt.list && S.mt.list.length)) return;
  try { const c = ghTrialCourse(this); if (!c) return; this.ghTrial = c; ghFlag(this, c.sx + 1, c.sy, 0xd03a3a); ghFlag(this, c.fx, c.fy, 0x3ac04a); } catch (e) { console.warn('trial', e); }
};
const _ghTrialArrive = Route.prototype.arriveHook;
Route.prototype.arriveHook = function (x, y) {
  const c = this.ghTrial;
  if (c) {
    if (Math.abs(x - c.sx - 1) + Math.abs(y - c.sy) <= 1 && this.rideKey && !this.ghRun) { this.ghRun = Date.now(); Sound.play('pick'); toast(`${GH_TRIALS[this.scene.key][0]}: GO! Race to the green flag!`, 1800); }
    else if (this.ghRun && !this.rideKey) { this.ghRun = 0; toast('You got down: the time trial is off.', 1800); }
    else if (this.ghRun && x === c.fx && y === c.fy) {
      const sec = (Date.now() - this.ghRun) / 1000, m = ghMedal(sec, c.d), T0 = gh().trial, best = T0[this.scene.key] || 0; this.ghRun = 0;
      const was = T0['t_' + this.scene.key]; if (!was || sec < was) T0['t_' + this.scene.key] = Math.round(sec * 10) / 10;
      if (m > best) {
        T0[this.scene.key] = m; const pay = [0, 600, 1200, 2500][m]; S.gold += pay; updateHUD(); Sound.play('levelup');
        if (m === 3) { const mt = mtCur(); if (mt) mtRaise(mt, 'spd', 3); }
        toast(`${sec.toFixed(1)}s: ${GH_MEDAL[m]}! Monty sends ${pay}g.${m === 3 ? ' Your mount\'s Speed rose!' : ''}`, 3400); checkQuests();
      } else toast(`${sec.toFixed(1)}s.${m ? ' ' + GH_MEDAL[m] + '.' : ''} Gold is under ${(c.d / 11).toFixed(1)}s.`, 3000);
    }
  }
  return _ghTrialArrive.call(this, x, y);
};
const GH_MONTY = { from: 'Monty Quickstep, Smallroot Derby', subj: 'Time trials!', body: n => `${n}!\n\nA mount! Lucky you. I've marked out five time-trial courses with flags: the Meadow Trail, Cragside Pass, Fernwalk, Heatherstep Cliffs and the Elder Glade.\n\nRide onto the red flag to start the clock, and get to the green flag as fast as you can. Medals and prizes for good times.\n\nAnd when you've the Wild Crest, there's a new cup at the Derby: the Elderwood Cup, on the Rootway.\n\nMonty` };
const _ghNightly = nightly;
nightly = function (passedOut) { const r = _ghNightly(passedOut); try { if (S.mt && S.mt.list && S.mt.list.length && S.crests && S.crests.wild) postSend('gh_monty', GH_MONTY); } catch (e) { } return r; };

/* ---------- the Elderwood Cup: third forms on the Rootway */
DERBY_CUPS.push({ id: 'elderwood', name: 'Elderwood Cup', icon: '🦌', track: 'rootway', stage: 3, cap: 70, fee: 500,
  unlock: () => derbyWon('quarry') && !!(S.crests || {}).wild, lockText: 'Win the Quarry Cup and earn the Wild Crest.',
  prize: [8000, [['swift_feather', 1], ['mon_treat', 5]]], replay: [1800, []],
  races: [
    [R_('Kit', 'cindhop_3', 66, .94), R_('Alf', 'craglet_3', 67, .94), R_('Nell', 'kitlet_3', 66, .94)],
    [R_('Bea', 'flurrowl_3', 68, .95), R_('Ollie', 'riftshear_3', 68, .95), R_('Kit', 'cindhop_3', 68, .95)],
    [R_('Tansy', 'bristlecone_3', 70, 1.18, 10, 'swift_feather'), R_('Bea', 'flurrowl_3', 70, .97), R_('Ollie', 'riftshear_3', 70, .97)],
  ], champ: 'Tansy', champLine: "Alder's apprentice has entered! Tansy knows every root on the Rootway, and she's been practising on the old haul road." });

/* ============================================================ the forest's legendaries (ghmons.js)
   Samaradrake, the seed-dragon, waits at the Eldest Tree once the replanted Glade has grown back (after the Wild
   Crest): level 70, catch it like Cirrovale. Knocked out, it's back the next day.
   Weavewyrm, the Rootweave serpent, wakes when the drill head goes down the bore (Site G): it rises once at the Eldest
   Tree, Tansy writes about the Glade, and the farm shakes. It turns the finale and is caught after Rowan (not built). */
const SD_LV = 70;
const sdHere = () => S.ew && S.ew.regrow >= 2 && S.crests && S.crests.wild && ghLegendHere('samaradrake');
GH_MON_NEED.eldest = ['samaradrake', 'weavewyrm'];
{
  const prev = ROUTES.eldest.actors;
  ROUTES.eldest.actors = () => { const out = prev(); if (sdHere()) out.push({ id: 'gh_samara', x: 19, y: 12, mon: 'samaradrake', scale: 1.4 }); return out; };
  const enter = ROUTES.eldest.onEnter;
  ROUTES.eldest.onEnter = sc => { if (enter) enter(sc); if (ghFree() && !S.flags.wwSeen && SPECIES.weavewyrm && sc.textures.exists('mon_weavewyrm')) setTimeout(() => ghWyrmRise(sc), 600); };
}
// the legend battles: Samaradrake at the Eldest Tree, Vespereign behind Glimmerdeep's black crystal door
const GH_LEGENDS = {
  samaradrake: { lv: 70, caught: 'sdCaught', day: 'sdDay', intro: ['Seeds are spinning down out of nowhere, hundreds of them, settling in the new grass round the Eldest Tree.',
    'High in the branches, something unfolds two great wings shaped like maple seeds...', 'Samaradrake spirals down! A sapling grows from its back. It has been planting the Glade all along.'],
    still: 'Samaradrake is still circling the Eldest Tree.', got: 'Samaradrake has joined your team! As it lands on your shoulder, the whole Glade seems to breathe out.',
    gone: 'Samaradrake spirals up into the canopy in a storm of seeds. It may come back to the Eldest Tree tomorrow.' },
  // not a legendary: an alpha, the oldest and biggest Vespereign of all, the king the Undercroft's bats answer to
  vespereign: { lv: 78, alpha: 1, caught: 'vrCaught', day: 'vrDay', intro: ['Beyond the black crystal door, the dark is total. Then, high above, two red eyes open.',
    'Wings unfold, wider than the cave, and something drops from the roof on a crown of bone...', "An alpha Vespereign! It's far bigger than any other, and every bat in Glimmerdeep screams at once."],
    still: 'The alpha Vespereign hangs from the roof of its chamber, watching you.', got: 'The alpha Vespereign has joined your team! Somewhere above, every bat in the Undercroft falls silent.',
    gone: 'The alpha Vespereign folds its wings and vanishes into the dark of the roof. It will be back on its throne tomorrow.' },
};
const ghLegendHere = sp => { const L = GH_LEGENDS[sp]; return SPECIES[sp] && MON_ORDER.includes(sp) && !S.flags[L.caught] && S.flags[L.day] !== S.day; };
function ghLegend(sc, sp) {
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  const L = GH_LEGENDS[sp], img = monPic(sp, 'front'), say = t => ({ who: 'trainer', name: '???', img, t });
  S.seen[sp] = 1;
  Talk.say(L.intro.map(say), () => {
    const m = wildMon(sp, L.lv); m.iv = { hp: 9, atk: 9, def: 9, eatk: 9, edef: 9, spd: 9 }; if (L.alpha) { m.alpha = 1; ghSig(m); } m.hp = monStat(m, 'hp');
    sc.ghLeg = { m, sp, at: Date.now() }; sc.cameras.main.shake(300, .006); Battle.start(m);
  });
  return true;
}
const ghSamara = sc => ghLegend(sc, 'samaradrake');
function ghLegendDone(sc) {
  const { m, sp } = sc.ghLeg, L = GH_LEGENDS[sp]; sc.ghLeg = null;
  const caught = S.mons.some(q => q.sp === sp);
  if (!caught && m.hp > 0) return toast(L.still, 2400);
  if (caught) S.flags[L.caught] = 1; else S.flags[L.day] = S.day;
  toast(caught ? L.got : L.gone, 4000);
  ewRefresh(sc);
}
// the legend battles are checked once the battle is over (this scene's clock stops during it, so time it by the wall clock)
{
  const fh = Route.prototype.frameHook;
  Route.prototype.frameHook = function (dt) { fh.call(this, dt); if (this.ghLeg && !Battle.active && !this.paused && Date.now() - this.ghLeg.at > 1500) ghLegendDone(this); };
  const bd = bhDoor;
  bhDoor = function (sc, id) { return id === 'gh_samara' ? ghLegend(sc, 'samaradrake') : bd(sc, id); };
}
function ghWyrmRise(sc) {
  S.flags.wwSeen = 1; S.seen.weavewyrm = 1;
  csMoment(sc, async () => {
    const x = 15 * T + 8, y = 16 * T + 16;
    await csPan(sc, x, y - 30, 700);
    sc.cameras.main.shake(1400, .01); Sound.play('thud');
    const glow = sc.add.circle(x, y - 6, 30, 0x8aff6a, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 1);
    sc.tweens.add({ targets: glow, fillAlpha: .35, duration: 900 });
    const w = hdSpr(sc.add.sprite(x, y + 40, 'mon_weavewyrm', 0).setOrigin(.5, 1).setScale(2).setAlpha(0).setDepth(y + 2), 'weavewyrm');
    sc.tweens.add({ targets: w, y, alpha: 1, duration: 1600, ease: 'Sine.out' });
    await csWait(1700);
    await csSay([GH.sys('The ground round the Eldest Tree splits open. Roots as thick as a house heave up out of the earth, glowing green...'),
      GH.sys("...and they're not roots. It's a serpent, made of them. It rears up over the Glade, and every tree in the forest shivers."),
      GH.sys('It turns its head south, towards Smallroot, and lets out a long, grinding cry, like a tree splitting in a storm.'),
      GH.sys('Then it sinks back down into the Rootweave, and the ground closes over it.')]);
    sc.cameras.main.shake(800, .006);
    sc.tweens.add({ targets: [w, glow], y: '+=40', alpha: 0, duration: 1400, ease: 'Sine.in' });
    await csWait(1500); w.destroy(); glow.destroy();
  }).then(() => { toast("Something ancient is awake under the valley. The drill head must have woken it...", 3600); });
}
const GH_TANSY_ROOTS = { from: 'Tansy, Elderwood', subj: 'The Glade split open', body: n => `${n},\n\nThe ground at the Eldest Tree split open last night. Alder says he saw roots rise up out of it, glowing, as tall as the Lodge. Then they went back down.\n\nHe says it isn't roots. He says it's the thing the carvings are about, the one at the very bottom, under the stag and the bear and the wolf. The one that holds the whole valley together.\n\nHe says Verdance's drill must have woken it. He's never looked so frightened.\n\nTansy` };
(function () {
  const mk = World.prototype.makePlayer;
  World.prototype.makePlayer = function (sp) {
    mk.call(this, sp);
    try {
      if (!ghFree()) return;
      postSend('gh_tansy_roots', GH_TANSY_ROOTS);
      if (this.scene.key === 'farm' && !S.flags.wwFarm && S.day > (S.vd.shut.gloam || 0)) {
        S.flags.wwFarm = 1;
        setTimeout(() => { this.cameras.main.shake(1200, .008); Sound.play('thud'); toast('The ground under the farm rolls like a wave... something huge moved, deep under the fields. The Hearthroot\'s glow flickers.', 4200); }, 1200);
      }
    } catch (e) { }
  };
})();

var EXTRA_SCENES = (typeof EXTRA_SCENES !== 'undefined' ? EXTRA_SCENES : []).concat(GH_KEYS.map(k => {
  const C = k !== 'gloamhollow' && k !== 'lanternmere' ? class extends Crag { constructor() { super(k); } } : class extends Route { constructor() { super(k); } }; C.KEY = k; return C;
}));
