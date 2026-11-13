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
