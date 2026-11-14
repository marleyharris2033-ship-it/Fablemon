/* ============================================================ High-detail Fablemon art
   tools/art/cut_hd.py cuts bigger sprites straight from the original drawings into src/hd, and build.py bundles
   them as ASSET.hd[id] = { f, b, i, w } (battle front and back at 256px, icon at 96px, walk sheet at 3x).
   The game uses them wherever they exist and falls back to the old small sprites (mon_battle.png, mon_icons.png,
   mon_<id>.png) for any Fablemon without them. Big pictures are drawn smoothly, small ones stay pixel-sharp. */
const HD = ASSET.hd || {}, WALK_HD = {};
const HD_WALK = 3;
// battle pictures and icons: swap in the big ones after the small ones are cut
function hdPics() { for (const sp in HD) if (HD[sp].f && MONPIC[sp]) MONPIC[sp] = { icon: HD[sp].i || HD[sp].f, front: HD[sp].f, back: HD[sp].b || HD[sp].f }; }
// walk sheets: what to load for a species, and its frame size
function hdWalk(n, fw) { const w = HD[n] && HD[n].w; if (w) WALK_HD[n] = HD_WALK; return [w || ASSET['mon_' + n], w ? fw * HD_WALK : fw]; }
// shrink a sprite made from a big walk sheet back to its size in the world, and draw it smoothly
function hdSpr(spr, id) {
  const k = WALK_HD[String(id).replace(/^F/, '')]; if (!k) return spr;
  spr.setScale(spr.scaleX / k, spr.scaleY / k);
  try { const t = spr.texture; if (!t._smooth) { t._smooth = 1; t.setFilter(Phaser.Textures.FilterMode.LINEAR); } } catch (e) { }
  return spr;
}
// Fabled recolours of big pictures are PNGs made on the fly; these need to be drawn smoothly too
const HD_SMOOTH = new Set();
document.addEventListener('load', e => {
  const t = e.target; if (!t || t.tagName !== 'IMG') return;
  if (HD_SMOOTH.has(t.src)) { t.style.imageRendering = 'auto'; t.dataset.hds = 1; }
  else if (t.dataset.hds) { t.style.imageRendering = ''; delete t.dataset.hds; }
}, true);

/* ---- towns, characters and portraits we have originals for (tools/art/cut_hd_world.py) ----
   Each small texture keeps its frame names and sizes, but its pixels come from a 3x picture, drawn smoothly.
   Atlases: frames are matched by name. Sheets: by grid (frame i = column i % cols, row i / cols). */
const HDW = ASSET.hdWorld || {};
const HDW_ATLAS = { cove: 'cove', qd: 'quarrydown', br: 'beaconreach', hm: 'highmoor', sea: 'sea', town: 'town', houses: 'houses', objects: 'objects', seasonal: 'seasonal', bog: 'bog' };
const HDW_SHEET = ['tr_granger', 'tr_orrin', 'tr_tamsin', 'npc_shipwright', 'npc_monty', 'boat_sail', ...(HDW.farmer_tools ? [] : ['tools']), 'tr_rambler', 'tr_ponddipper', 'tr_birdwatcher', 'tr_forager', 'tr_busker', 'tr_allotment', 'npc_bramble', 'tr_reedcutter', 'tr_wispwatcher', 'tr_delphine'];
function hdWorldLoad(loader, snow = {}) {
  for (const [key, n] of Object.entries(HDW_ATLAS)) if (HDW[n]) loader.image(key + '__hd', snow[n + 'HD'] || HDW[n].img);   // winter: snow-capped copies (social.js)
  for (const n of HDW_SHEET) if (HDW[n]) loader.image(n + '__hd', HDW[n].img);
}
function hdFrame(T, name, x, y, w, h, small) {
  const f = T.add(name, 0, x, y, w, h); if (!f) return;
  f.width = small.width; f.height = small.height; f.realWidth = small.realWidth; f.realHeight = small.realHeight;
  f.halfWidth = small.halfWidth; f.halfHeight = small.halfHeight; f.centerX = small.centerX; f.centerY = small.centerY;
  if (f.data) { f.data.sourceSize.w = small.width; f.data.sourceSize.h = small.height; f.data.spriteSourceSize.w = small.width; f.data.spriteSourceSize.h = small.height; }
}
function hdWorldSwap(sc) {
  const tm = sc.textures, swap = (key, build) => {
    const hk = key + '__hd'; if (!tm.exists(key) || !tm.exists(hk)) return;
    const old = tm.get(key), img = tm.get(hk).getSourceImage(); tm.remove(hk);
    const T = tm.addImage(key + '__new', img); if (!T) return;
    try { build(old, T); } catch (e) { tm.remove(key + '__new'); return; }
    T.source[0].resolution = 3;   // the renderer draws cut size / resolution, so 3x pixels show at the small size
    for (const n of T.getFrameNames()) T.get(n).updateUVs();
    T.setFilter(Phaser.Textures.FilterMode.LINEAR);
    tm.remove(key); tm.renameTexture(key + '__new', key);
  };
  for (const [key, n] of Object.entries(HDW_ATLAS)) swap(key, (old, T) => {
    const fr = HDW[n].frames;
    for (const name of old.getFrameNames()) { const r = fr[name]; if (!r) throw name; hdFrame(T, name, r.x, r.y, r.w, r.h, old.get(name)); }
  });
  for (const n of HDW_SHEET) swap(n, (old, T) => {
    const f0 = old.get(0), src = old.getSourceImage(), cols = Math.round(src.width / f0.width), k = T.getSourceImage().width / src.width;
    for (const name of old.getFrameNames()) { const i = +name, f = old.get(name); hdFrame(T, i, (i % cols) * f0.width * k, Math.floor(i / cols) * f0.height * k, f0.width * k, f0.height * k, f); }
  });
}
// portraits: use the 240px ones where they exist (ASSET.hd.port_<who>_<0|1>)
function hdPortraits() {
  const P = (who, f) => HD['port_' + who] && HD['port_' + who][f];
  for (const who of ['granger', 'orrin', 'tamsin', 'rambler', 'ponddipper', 'birdwatcher', 'forager', 'busker', 'allotment', 'reedcutter', 'wispwatcher', 'delphine']) for (const f of [0, 1]) { const u = P(who, f); if (u) { TRAINER_PIC[who + f] = u; HD_SMOOTH.add(u); } }
  for (const who of ['hal', 'monty']) for (const f of [0, 1]) { const u = P(who, f); if (u) { VPIC[who + f] = u; HD_SMOOTH.add(u); } }
}

/* ---- bag icons and placed farm objects (hd_world/items: i_<item> 72px icons, o_<obj> 3x pictures) ----
   Each becomes a canvas marked _hdk = 3. Canvases go into the game through textures.addCanvas, which is
   wrapped below so a marked canvas shows at a third of its size, drawn smoothly. */
function hdShrinkTexture(T, k) {
  T.source[0].resolution = k;
  for (const n of T.getFrameNames(true)) {
    const f = T.get(n), w = f.cutWidth / k, h = f.cutHeight / k;
    f.width = f.realWidth = w; f.height = f.realHeight = h; f.halfWidth = Math.floor(w / 2); f.halfHeight = Math.floor(h / 2); f.centerX = Math.floor(w / 2); f.centerY = Math.floor(h / 2);
    if (f.data) { f.data.sourceSize.w = f.data.spriteSourceSize.w = w; f.data.sourceSize.h = f.data.spriteSourceSize.h = h; }
    f.updateUVs();
  }
  T.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
(function () {
  const P = Phaser.Textures.TextureManager.prototype, add = P.addCanvas;
  P.addCanvas = function (key, source, skipCache) { const T = add.call(this, key, source, skipCache); if (T && source && source._hdk) hdShrinkTexture(T, source._hdk); return T; };
})();
async function hdItems() {
  const E = HDW.items; if (!E) return;
  const img = await loadImg(E.img);
  for (const [n, r] of Object.entries(E.frames)) {
    const c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); c._hdk = 3;
    const id = n.slice(2);
    if (n[0] === 'i') { const u = c.toDataURL(); ICONS[id] = u; ICON_CANVAS[id] = c; HD_SMOOTH.add(u); }
    else SAP_CANVAS[id] = c;
  }
}

/* ---- the farmer at 6x (tools/art/cut_farmer.py): walk 4x4 of 24x32, tools 64 frames of 40x48 ---- */
const HD_FARMER = !!(HDW.farmer_walk && HDW.farmer_tools);
function hdFarmerLoad(loader) {
  if (!HD_FARMER) return false;
  loader.spritesheet('walk', HDW.farmer_walk.img, { frameWidth: 24 * 6, frameHeight: 32 * 6 });
  loader.spritesheet('tools', HDW.farmer_tools.img, { frameWidth: 40 * 6, frameHeight: 48 * 6 });
  return true;
}
function hdFarmerSwap(sc) { if (HD_FARMER) for (const k of ['walk', 'tools']) hdShrinkTexture(sc.textures.get(k), 6); }
// player portrait (not used in dialogue yet)
const PLAYER_PIC = HD.port_player ? [HD.port_player[0], HD.port_player[1]] : null;
