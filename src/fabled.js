/* ============================================================ Fabled Fablemon
   About 1 wild Fablemon in 400 is Fabled: the same creature in rare colours, with a sparkle and a ✦ by its
   name. It also has at least 7 potential in every stat, and stays Fabled when it evolves. The colours are made here in
   code by shifting each sprite's hues, so every Fablemon has a Fabled look with no extra art.
   A mon is Fabled when m.fab is set. S.fab[species] records which Fabled ones you've owned. */
const FAB_ODDS = 1 / 400;
// default hue shift by first type: [degrees, saturation ×, lightness +]
const FAB_TYPE = { Leaf: [-72, 1.05, 0], Ember: [190, 1, 0], Tide: [78, 1, 0], Stone: [170, 1.25, 0], Gale: [135, 1.05, 0], Spark: [128, 1, 0], Shade: [95, 1.05, 0], Glow: [150, 1, 0], Frost: [92, 1.1, 0], Wild: [112, 1.1, 0] };
// hand-tuned lines (keyed by the first stage; the whole line shares it so a family matches)
const FAB_TUNE = {};
function fabTune(sp) { const b = baseOf(sp); return FAB_TUNE[sp] || FAB_TUNE[b] || FAB_TYPE[SPECIES[b].type] || [150, 1, 0]; }
function fabRecolor(cv, sp) {
  const [dh, ds, dl] = fabTune(sp), g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), c = mx - mn; let l = (mx + mn) / 2;
    if (c < .07) continue;                       // outlines, whites and greys stay as they are
    let s = c / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((gg - b) / c) % 6 : mx === gg ? (b - r) / c + 2 : (r - gg) / c + 4;
    h = ((h * 60 + dh) % 360 + 360) % 360; s = Math.min(1, s * ds); l = Math.min(1, Math.max(0, l + dl));
    const C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2, k = Math.floor(h / 60);
    const [R, G, B2] = [[C, X, 0], [X, C, 0], [0, C, X], [0, X, C], [X, 0, C], [C, 0, X]][k % 6];
    d[i] = Math.round((R + m) * 255); d[i + 1] = Math.round((G + m) * 255); d[i + 2] = Math.round((B2 + m) * 255);
  }
  g.putImageData(im, 0, 0); return cv;
}
// pictures: recoloured copies of the normal ones, made the first time they're needed
const FABPIC = {}, FABSRC = {};
function fabPic(sp, k = 'icon') {
  const key = sp + ':' + k; if (FABPIC[key]) return FABPIC[key];
  const im = FABSRC[key]; if (!im) { const src = monPic(sp, k); if (src) { const i2 = new Image(); i2.onload = () => { try { teamBtnKey = null; refreshTeamBtn(); } catch (e) { } }; i2.src = src; FABSRC[key] = i2; } }
  const img = FABSRC[key]; if (!img || !img.complete || !img.naturalWidth) return monPic(sp, k);   // not decoded yet: the normal picture for a moment
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
  const url = fabRecolor(c, sp).toDataURL(); if (img.naturalWidth > 64) HD_SMOOTH.add(url);   // a big picture: draw it smoothly (hd.js)
  return FABPIC[key] = url;
}
function monPicOf(m, k = 'icon') { return m && m.fab ? fabPic(m.sp, k) : monPic(m.sp, k); }
// warm up a Fabled mon's pictures so they're ready by the time they're shown
function fabWarm(sp) { for (const k of ['icon', 'front', 'back']) { const key = sp + ':' + k; if (!FABSRC[key] && monPic(sp, k)) { const i2 = new Image(); i2.src = monPic(sp, k); FABSRC[key] = i2; } } }
// walking sprite: a recoloured copy of the walk sheet. Returns the id used for the texture ('mon_' + id) and anims
function walkId(sc, m) {
  const sp = walkSp(m.sp); if (!m.fab) return sp;
  const id = 'F' + sp, key = 'mon_' + id;
  if (!sc.textures.exists(key)) {
    const t = sc.textures.get('mon_' + sp), src = t.getSourceImage(), fw = t.get(0).width;
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0);
    sc.textures.addSpriteSheet(key, fabRecolor(c, sp), { frameWidth: fw, frameHeight: fw });   // (fw is already the big size for high-detail sheets)
  }
  return id;
}
// turn a wild Fablemon Fabled: rare colours, and every potential is 7 to 10
function fabMake(m) { m.fab = 1; m.iv = m.iv || {}; for (const k of IV_KEYS) m.iv[k] = 7 + Math.floor(Math.random() * 4); m.hp = monStat(m, 'hp'); fabWarm(m.sp); return m; }
function fabNote(sp) { S.fab = S.fab || {}; S.fab[sp] = 1; }
// the sparkle when a Fabled one enters battle
(function () { const st = document.createElement('style'); st.textContent = '.fabstar{position:absolute;pointer-events:none;color:#fff7c0;text-shadow:0 0 6px #ffd84a,0 0 2px #fff;font-size:18px;animation:fabstar .9s ease-out forwards;z-index:5}@keyframes fabstar{0%{transform:scale(0) rotate(0);opacity:0}30%{transform:scale(1.3) rotate(40deg);opacity:1}100%{transform:scale(.2) rotate(120deg) translateY(-14px);opacity:0}}'; document.head.appendChild(st); })();
function fabSparkle(el) {
  const st = el && el.parentElement; if (!st) return;
  const a = el.getBoundingClientRect(), p = st.getBoundingClientRect();
  for (let i = 0; i < 9; i++) setTimeout(() => {
    const s = document.createElement('span'); s.className = 'fabstar'; s.textContent = '✦';
    s.style.left = (a.left - p.left + Math.random() * a.width * .9) + 'px'; s.style.top = (a.top - p.top + Math.random() * a.height * .8) + 'px'; s.style.fontSize = (12 + Math.random() * 14) + 'px';
    st.appendChild(s); setTimeout(() => s.remove(), 950);
  }, i * 90);
  try { Sound.play('coin'); } catch (e) { }
}
