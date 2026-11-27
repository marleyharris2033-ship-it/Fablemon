/* ============================================================ Character creator (v2)
   The farmer is built from layers (tools/art/build_creator.py): an outfit (which brings its body shape), a face, skin
   colour, a hairstyle and colour, and a beard. Everything can be recoloured. At boot the chosen look is composed into
   the same two sheets the game always used: a 4x4 walk sheet and a 64-frame tool sheet (the tools are drawn here).
   S.look = { cc: { o: outfit name, oc: outfit dye (-1 = as drawn), f: face, sk: skin, h: hair name ('' = bald), hc,
   b: beard (-1 none), bc: beard colour (-1 = same as hair) } }. Saves from before keep their old farmer ({ p, c },
   look.js) until they change it at the Wardrobe. Loaded after look.js and replaces its creator. */
const CCX = (() => {
  const CC = ASSET.cc, SHEETS = ASSET.ccSheets;
  if (!CC || !SHEETS) return null;
  const SKIN = [['Porcelain', '#f4d2b6'], ['Fair', '#eebf98'], ['Light', '#e2a679'], ['Medium', '#c98a5c'], ['Tan', '#b37244'], ['Brown', '#8d5531'], ['Dark', '#6a3d23'], ['Deep', '#4a2a18']];
  const HAIRC = [['Black', '#2b2427'], ['Dark brown', '#4a3022'], ['Brown', '#6e4428'], ['Chestnut', '#8b4a2b'], ['Auburn', '#9c3e22'], ['Ginger', '#c8642a'], ['Blonde', '#dfb35a'], ['Platinum', '#ece0b8'], ['Grey', '#9a9a9e'], ['White', '#ececea'], ['Plum', '#6a3a7a'], ['Blue', '#3e5f9e'], ['Green', '#4e8a4a'], ['Pink', '#d0708e']];
  const CLOTHC = [['Red', '#a83a30'], ['Orange', '#c8662a'], ['Gold', '#c9a03a'], ['Green', '#4f8a3a'], ['Teal', '#2f8080'], ['Blue', '#3a64a8'], ['Purple', '#6a4a9a'], ['Pink', '#c25a86']];
  const nice = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const DEF = { o: 'Brookholt Farmer', oc: -1, f: 0, sk: 2, h: 'swept', hc: 2, b: -1, bc: -1 };
  // a saved look with anything missing or no longer in the art falls back to the default for that part
  const fix = L => { L = { ...DEF, ...(L || {}) };
    if (!CC.outfits.some(o => o.name === L.o)) L.o = DEF.o; if (L.h && !CC.hair.includes(L.h)) L.h = DEF.h;
    L.f = Math.max(0, Math.min(CC.heads - 1, L.f | 0)); L.sk = Math.max(0, Math.min(SKIN.length - 1, L.sk | 0)); L.hc = Math.max(0, Math.min(HAIRC.length - 1, L.hc | 0));
    if (L.b >= CC.beards) L.b = -1; if (L.bc >= HAIRC.length) L.bc = -1; if (L.oc >= CLOTHC.length) L.oc = -1; return L; };

  // ---- sheets: decoded only when needed (the shared one, and the worn outfit's)
  const SH = [], loadI = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });
  const sheet = i => SH[i] = SH[i] || Promise.all(SHEETS[i].map(loadI)).then(([img, m]) => {
    const c = document.createElement('canvas'); c.width = m.width; c.height = m.height; const g = c.getContext('2d'); g.drawImage(m, 0, 0);
    const md = g.getImageData(0, 0, m.width, m.height).data, mat = new Uint8Array(m.width * m.height); for (let k = 0; k < mat.length; k++) mat[k] = Math.round(md[k * 4] / 40);
    return SH[i] = { img, mat, w: m.width };
  });
  const oIdx = L => CC.outfits.findIndex(o => o.name === L.o);
  const ready = L => Promise.all([sheet(0), sheet(CC.pieces[`outfit${oIdx(L)}_0`].s)]);

  // ---- recolouring (the same rules as the preview the art was checked in)
  const hexHsv = hx => { const n = parseInt(hx.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; if (h < 0) h += 1; return [h, mx ? d / mx : 0, mx]; };
  const hsv2rgb = (h, s, v) => { const k = n => { const kk = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(kk, 4 - kk, 1)); }; return [k(5), k(3), k(1)]; };
  const lin = c => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4), unlin = c => c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055;
  const fL = t => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116, fLi = t => t > .206893 ? t * t * t : (t - 16 / 116) / 7.787;
  const rgb2lab = (r, g, b) => { r = lin(r / 255); g = lin(g / 255); b = lin(b / 255);
    const x = fL((r * .4124 + g * .3576 + b * .1805) / .95047), y = fL(r * .2126 + g * .7152 + b * .0722), z = fL((r * .0193 + g * .1192 + b * .9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
  const lab2rgb = (L, a, bb) => { const y = (L + 16) / 116, x = fLi(a / 500 + y) * .95047, yy = fLi(y), z = fLi(y - bb / 200) * 1.08883;
    const r = 3.2406 * x - 1.5372 * yy - .4986 * z, g = -.9689 * x + 1.8758 * yy + .0415 * z, b = .0557 * x - .2040 * yy + 1.0570 * z;
    return [r, g, b].map(c => Math.round(255 * Math.max(0, Math.min(1, unlin(Math.max(0, c)))))); };
  const hexLab = hx => { const n = parseInt(hx.slice(1), 16); return rgb2lab(n >> 16 & 255, n >> 8 & 255, n & 255); };
  const cache = {};
  function piece(key, cols) {
    const ck = key + '|' + cols.join(','); if (cache[ck]) return cache[ck];
    const P = CC.pieces[key]; if (!P) return null; const Q = SH[P.s]; if (!Q || Q.then) return null; const [x, y, w, h] = P.f;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(Q.img, x, y, w, h, 0, 0, w, h);
    if (cols.some(Boolean)) {
      const id = g.getImageData(0, 0, w, h), d = id.data, mats = new Uint8Array(w * h);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) mats[yy * w + xx] = Q.mat[(y + yy) * Q.w + x + xx];
      const d0 = d.slice();
      for (let m = 1; m <= 4; m++) {
        const hex = cols[m - 1]; if (!hex) continue; const [th, ts, tv] = hexHsv(hex);
        if (m === 4) {   // clothes are re-dyed: every colour turns by the same amount round the colour wheel
          const C = CC.outfits[+(/^outfit(\d+)_/.exec(key) || [])[1]]?.cloth?.[0]; if (!C) continue;
          const [Lc, ac, bc] = [C[0] * 100 / 255, C[1] - 128, C[2] - 128], [Lt, at, bt] = hexLab(hex), cc = Math.hypot(ac, bc), ct = Math.hypot(at, bt);
          const turn = Math.atan2(bt, at) - Math.atan2(bc, ac), cs = Math.cos(turn), sn = Math.sin(turn), gain = Math.max(.7, Math.min(2.2, ct / Math.max(cc, 1)));
          for (let i = 0; i < mats.length; i++) {
            if (mats[i] !== 4 || !d[i * 4 + 3]) continue;
            let [L, a, b] = rgb2lab(d0[i * 4], d0[i * 4 + 1], d0[i * 4 + 2]);
            if (cc < 10) { const wgt = Math.min(1, 1 - Math.hypot(a, b) / 40); a += at * .6 * wgt; b += bt * .6 * wgt; }
            else { const na = (a * cs - b * sn) * gain, nb = (a * sn + b * cs) * gain, chr = Math.hypot(na, nb), tht = Math.atan2(bt, at);
              let dh = Math.atan2(nb, na) - tht; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); const hh = tht + dh * .6; a = chr * Math.cos(hh); b = chr * Math.sin(hh); }
            L = L + (Lt - Lc) * .3; const [r, gg, bb] = lab2rgb(Math.max(2, Math.min(97, L)), a, b); d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = bb;
          }
          continue;
        }
        const vs = []; for (let i = 0; i < mats.length; i++) if (mats[i] === m && d[i * 4 + 3] > 0) vs.push(Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255);
        if (!vs.length) continue; vs.sort((a, b) => a - b);
        const q = f => vs[Math.min(vs.length - 1, Math.floor(vs.length * f))], lo = q(.05), med = q(.5) || .5, hi = Math.max(q(.95), med + .01);
        const soft = m === 3, vLo = tv * (soft ? .55 : .38), vHi = Math.min(.97, soft ? tv * 1.22 + .06 : tv * 1.4 + .1);
        for (let i = 0; i < mats.length; i++) {
          if (mats[i] !== m || !d[i * 4 + 3]) continue;
          const v = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) / 255; if (m !== 3 && v < (m === 1 ? .16 : .12)) continue;
          if (m === 1) { const k = v / med, nv = Math.min(1, tv * Math.pow(k, 1.05)), ns = Math.min(1, ts * (k < 1 ? 1 + (1 - k) * .45 : 1 - (k - 1) * .5)), nh = th + (k < 1 ? -(1 - k) * .03 : (k - 1) * .02);
            const [r, gg, b] = hsv2rgb(nh, Math.max(0, ns), nv); d[i * 4] = r * 255; d[i * 4 + 1] = gg * 255; d[i * 4 + 2] = b * 255; continue; }
          let vv = v;
          if (soft) { let sum = 0, n = 0; const px = i % w, py = (i / w) | 0;
            for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const xx = px + ox, yy = py + oy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (mats[j] !== m || !d0[j * 4 + 3]) continue; sum += Math.max(d0[j * 4], d0[j * 4 + 1], d0[j * 4 + 2]) / 255; n++; }
            if (n) vv = (v + sum / n) / 2; }
          const t = vv < med ? (vv - med) / Math.max(med - lo, .01) : (vv - med) / (hi - med);
          const nv = Math.max(0, Math.min(1, t < 0 ? tv + t * (tv - vLo) : tv + Math.min(t, 1.3) * (vHi - tv)));
          const ns = Math.max(0, Math.min(1, ts * (t < 0 ? 1 - t * .15 : 1 - Math.min(t, 1.3) * .22))), nh = th + (t < 0 ? t * .012 : t * .01);
          const [r, gg, b] = hsv2rgb(nh, ns, nv); d[i * 4] = r * 255; d[i * 4 + 1] = gg * 255; d[i * 4 + 2] = b * 255;
        }
      }
      g.putImageData(id, 0, 0);
    }
    return cache[ck] = c;
  }

  // ---- one figure: frame f (dir * 4 + step), drawn into g with the cell's origin at (ox0, oy0)
  function drawFig(g, L, d, step, ox0, oy0) {
    const oi = oIdx(L), O = CC.outfits[oi], f = d * 4 + step, [ax, ay0] = CC.anchors[f], ay = ay0 + (CC.bob || [0, 0, 0, 0])[step];
    const skin = SKIN[L.sk][1], hc = HAIRC[L.hc][1], bc = L.bc < 0 ? hc : HAIRC[L.bc][1], [ox, oy] = O.offs[f];
    const put = (key, cols, dx, dy) => { const P = CC.pieces[key], im = piece(key, cols); if (im) g.drawImage(im, Math.round(ox0 + P.at[0] + dx), Math.round(oy0 + P.at[1] + dy)); };
    put(`neck${O.body}_${f}`, [skin], O.neck[f][0], O.neck[f][1] + ay);
    put(`outfit${oi}_${f}`, [skin, null, null, L.oc < 0 ? null : CLOTHC[L.oc][1]], 0, ay);
    put(`head${L.f}_${d}`, [skin], ax + ox, ay + oy);
    if (L.b >= 0 && d !== 3) { const [fx, fy] = (CC.beardOff || [])[L.f]?.[d] || [0, 0]; put(`beard${L.b}_${d}`, [null, null, bc], ax + ox + fx, ay + oy + fy); }
    if (L.h) put(`hair_${L.h}_${d}`, [null, hc], ax + ox, ay + oy);
  }
  // the box every look fits in (any outfit, any hair), in cell coordinates; feet at the bottom
  let BOX = null;
  function box() {
    if (BOX) return BOX; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (x, y, w, h) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h); };
    CC.outfits.forEach((O, i) => { for (let f = 0; f < 16; f++) {
      const P = CC.pieces[`outfit${i}_${f}`]; grow(P.at[0], P.at[1] + CC.bob[f % 4], P.f[2], P.f[3]);
      for (const h of CC.hair) { const H = CC.pieces[`hair_${h}_${f >> 2}`]; grow(H.at[0] + O.offs[f][0], H.at[1] + O.offs[f][1] + CC.bob[f % 4], H.f[2], H.f[3]); }
    } });
    const cx = CC.cell / 2, half = Math.ceil(Math.max(cx - x0, x1 - cx)) + 2;
    let feet = 0; CC.outfits.forEach((O, i) => { const P = CC.pieces[`outfit${i}_1`]; feet = Math.max(feet, P.at[1] + P.f[3]); });
    return BOX = { x: cx - half, y: Math.floor(y0) - 2, w: half * 2, h: Math.ceil(feet - y0) + 6, feet };
  }

  // ---- tools, drawn in code: grip at (0, 0), the tool pointing up (head at the far end), at the game's 6x detail
  const OUT = '#2a1a12';
  function drawTool(g, t, L) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    const shaft = (len, w) => { g.lineWidth = w + 6; g.strokeStyle = OUT; g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -len); g.stroke();
      g.lineWidth = w; g.strokeStyle = '#9a6634'; g.stroke(); g.lineWidth = w * .35; g.strokeStyle = '#c38d52'; g.beginPath(); g.moveTo(-w * .2, 4); g.lineTo(-w * .2, -len + 4); g.stroke(); };
    const metal = path => { g.lineWidth = 5; g.strokeStyle = OUT; g.fillStyle = '#9ea6b2'; g.beginPath(); path(); g.closePath(); g.fill(); g.stroke(); };
    if (t === 'hoe') { shaft(L, 9); metal(() => { g.moveTo(-3, -L - 6); g.lineTo(26, -L - 6); g.lineTo(30, -L + 16); g.lineTo(16, -L + 16); g.lineTo(14, -L + 2); g.lineTo(-3, -L + 2); });
      g.fillStyle = '#d3d8df'; g.fillRect(16, -L - 3, 10, 4); }
    if (t === 'axe') { shaft(L * .9, 9); metal(() => { g.moveTo(-4, -L * .9 - 8); g.lineTo(18, -L * .9 - 18); g.quadraticCurveTo(30, -L * .9 + 4, 18, -L * .9 + 22); g.lineTo(-4, -L * .9 + 10); });
      g.fillStyle = '#d3d8df'; g.beginPath(); g.moveTo(18, -L * .9 - 12); g.quadraticCurveTo(25, -L * .9 + 3, 18, -L * .9 + 16); g.lineTo(14, -L * .9 + 4); g.closePath(); g.fill(); }
    if (t === 'pickaxe') { shaft(L * .9, 9); metal(() => { g.moveTo(-34, -L * .9 + 10); g.quadraticCurveTo(-14, -L * .9 - 14, 0, -L * .9 - 12); g.quadraticCurveTo(14, -L * .9 - 14, 34, -L * .9 + 10); g.quadraticCurveTo(12, -L * .9 - 2, 0, -L * .9 - 2); g.quadraticCurveTo(-12, -L * .9 - 2, -34, -L * .9 + 10); }); }
  }
  function drawCan(g, flip, tilt, pour) {   // grip at (0, 0); the spout points the way the farmer faces (flip: left)
    g.save(); if (flip) g.scale(-1, 1); g.rotate(tilt);
    g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = OUT;
    g.fillStyle = '#5f8f7e'; g.beginPath(); g.moveTo(-18, -6); g.lineTo(18, -6); g.lineTo(16, 30); g.lineTo(-16, 30); g.closePath(); g.fill(); g.stroke();   // body
    g.fillStyle = '#7fb3a0'; g.fillRect(-12, -2, 7, 28);
    g.beginPath(); g.moveTo(14, 8); g.lineTo(44, -16); g.lineTo(48, -10); g.lineTo(18, 16); g.closePath(); g.fillStyle = '#5f8f7e'; g.fill(); g.stroke();   // spout
    g.beginPath(); g.ellipse(48, -14, 6, 8, -.8, 0, 7); g.fillStyle = '#4c7566'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-14, -6); g.quadraticCurveTo(0, -30, 14, -6); g.lineWidth = 9; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#7fb3a0'; g.stroke();   // handle
    if (pour) { g.fillStyle = '#9fd3f0'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(54 + i * 3, -6 + i * 9, 3.5, 0, 7); g.fill(); } }
    g.restore();
  }
  /* ---- the tool rig (23 Nov 2026): each outfit's standing pose has its arms cut out (build_creator.py: rig pieces with
     a shoulder pivot and the hand), so a swing turns the arms from the shoulder and the tool sits in the hand.
     Angles in degrees: 0 = hanging down, 90 = held out in front, 180 = straight up (side on, "front" is the way
     the farmer faces). Per phase: ready, raise, strike, follow-through. */
  const SWING = { arm: [30, 190, 75, 50], tool: [65, 215, 45, 15], dip: [0, -3, 3, 1] };
  const R = a => a * Math.PI / 180;
  function rigParts(L, d) {
    const oi = oIdx(L), O = CC.outfits[oi], rig = O.rig && O.rig[d]; if (!rig || !rig.length) return null;
    return { oi, O, arms: rig.map(a => ({ ...a, P: CC.pieces[a.k] })), torso: CC.pieces[`rig${oi}_${d}_t`] };
  }
  // draws the farmer in the standing pose of direction d with the arms turned by ang[k] (canvas radians, clockwise),
  // calling tool(hand) behind or in front; returns false if this outfit has no rig
  function drawRig(g, L, d, ox0, oy0, ang, tool, toolBehind) {
    const rp = rigParts(L, d); if (!rp) return false;
    const f = d * 4 + 1, [ax, ay] = CC.anchors[f], skin = SKIN[L.sk][1], hc = HAIRC[L.hc][1], bc = L.bc < 0 ? hc : HAIRC[L.bc][1], [ox, oy] = rp.O.offs[f];
    const oc = L.oc < 0 ? null : CLOTHC[L.oc][1];
    const put = (key, cols, dx, dy) => { const P = CC.pieces[key], im = piece(key, cols); if (im) g.drawImage(im, Math.round(ox0 + P.at[0] + dx), Math.round(oy0 + P.at[1] + dy)); };
    const hands = rp.arms.map((a, k) => { const t = ang[k] || 0, vx = a.hand[0] - a.piv[0], vy = a.hand[1] - a.piv[1];
      return [ox0 + a.piv[0] + vx * Math.cos(t) - vy * Math.sin(t), oy0 + a.piv[1] + ay + vx * Math.sin(t) + vy * Math.cos(t)]; });
    const arms = () => rp.arms.forEach((a, k) => { const im = piece(a.k, [skin, null, null, oc]); if (!im) return;
      g.save(); g.translate(ox0 + a.piv[0], oy0 + a.piv[1] + ay); g.rotate(ang[k] || 0); g.drawImage(im, Math.round(a.P.at[0] - a.piv[0]), Math.round(a.P.at[1] - a.piv[1])); g.restore(); });
    const head = () => { put(`head${L.f}_${d}`, [skin], ax + ox, ay + oy);
      if (L.b >= 0 && d !== 3) { const [fx, fy] = (CC.beardOff || [])[L.f]?.[d] || [0, 0]; put(`beard${L.b}_${d}`, [null, null, bc], ax + ox + fx, ay + oy + fy); }
      if (L.h) put(`hair_${L.h}_${d}`, [null, hc], ax + ox, ay + oy); };
    if (toolBehind) tool(hands);
    put(`neck${rp.O.body}_${f}`, [skin], rp.O.neck[f][0], rp.O.neck[f][1] + ay);
    put(`rig${rp.oi}_${d}_t`, [skin, null, null, oc], 0, ay);
    if (d === 0) { if (!toolBehind) tool(hands); arms(); head(); }          // facing you: hands in front, head over raised arms
    else if (d === 3) { head(); if (!toolBehind) tool(hands); arms(); }   // facing away
    else { head(); if (!toolBehind) tool(hands); arms(); }                 // side on: the near arm over everything, glove over the handle
    return true;
  }
  // front and back: aim both hands at a point (cell coordinates), each arm turning from its own shoulder
  function aimArms(rp, tx, ty) { return rp.arms.map(a => { const h = Math.atan2(a.hand[1] - a.piv[1], a.hand[0] - a.piv[0]), t = Math.atan2(ty - a.piv[1], tx - a.piv[0]); return t - h; }); }
  async function sheets(L) {
    L = fix(L); await ready(L);
    const B = box(), W = B.w, H = B.h;
    const fig = (d, st, dy = 0) => { const c = document.createElement('canvas'); c.width = W; c.height = H; drawFig(c.getContext('2d'), L, d, st, -B.x, -B.y + dy); return c; };
    // walk: columns stand, step, stand, step (the game's order); the art's own order is step, stand, step, stand
    const walk = document.createElement('canvas'); walk.width = W * 4; walk.height = H * 4; const wg = walk.getContext('2d');
    for (let d = 0; d < 4; d++) [1, 0, 3, 2].forEach((st, col) => wg.drawImage(fig(d, st), col * W, d * H));
    // tools: 64 frames, 8 a row, frame (tool * 4 + dir) * 4 + phase; tools hoe, can, axe, pickaxe. Feet sit at 46/48 down.
    const TW = W + 200, TH = Math.ceil((H + 120) * 48 / 46), feetY = Math.round(TH * 46 / 48), top = feetY - (B.feet - B.y), left = 100;
    const tools = document.createElement('canvas'); tools.width = TW * 8; tools.height = TH * 8; const tg = tools.getContext('2d');
    const len = Math.round((B.feet - B.y) * .42), oi = oIdx(L), OF = CC.outfits[oi];
    // the figure's shoulders, waist and head top (cell coordinates) for aiming the hands, facing you
    const P1 = CC.pieces[`outfit${oi}_1`], cx = CC.cell / 2, fTop = P1.at[1], fH = P1.f[3], waist = fTop + fH * .5, headTop = Math.min(...[0, 1, 2, 3].map(d => CC.pieces[`head${L.f}_${d}`].at[1] + OF.offs[d * 4 + 1][1]));
    ['hoe', 'can', 'axe', 'pickaxe'].forEach((t, ti) => { for (let d = 0; d < 4; d++) for (let ph = 0; ph < 4; ph++) {
      const n = (ti * 4 + d) * 4 + ph, fx = (n % 8) * TW, fy = Math.floor(n / 8) * TH, ox0 = fx + left - B.x, dip = t === 'can' ? 0 : SWING.dip[ph], oy0 = fy + top - B.y + dip;
      const rp = rigParts(L, d), side = d === 1 || d === 2, sg = d === 1 ? 1 : -1;
      tg.save(); tg.beginPath(); tg.rect(fx, fy, TW, TH); tg.clip();
      let ok = false;
      if (rp && t === 'can') {
        if (side) { const near = rp.arms.length - 1, ang = rp.arms.map((_, k) => k === near ? R(65) * sg : 0);
          ok = drawRig(tg, L, d, ox0, oy0, ang, hs => { const [hx, hy] = hs[near]; tg.save(); tg.translate(hx, hy + 4); drawCan(tg, d === 1, [0, .25, .9, .6][ph], ph >= 2); tg.restore(); }, false); }
        else { const k = d === 0 ? rp.arms.length - 1 : 0, a = aimArms(rp, cx + (d === 0 ? 1 : -1) * 6, waist + 4), ang = rp.arms.map((_, j) => j === k ? a[j] : 0);
          ok = drawRig(tg, L, d, ox0, oy0, ang, hs => { const [hx, hy] = hs[k]; tg.save(); tg.translate(hx, hy + 4); drawCan(tg, false, [0, .25, .9, .6][ph] * .6, ph >= 2); tg.restore(); }, d === 3); }
      } else if (rp) {
        if (side) {   // both arms move together; the tool runs on from the near hand
          const ang = rp.arms.map(() => R(SWING.arm[ph]) * sg), near = rp.arms.length - 1;
          ok = drawRig(tg, L, d, ox0, oy0, ang, hs => { const [hx, hy] = hs[near]; tg.save(); tg.translate(hx, hy); tg.rotate(R(SWING.tool[ph] - 180) * sg); drawTool(tg, t, len); tg.restore(); }, ph === 1);
        } else {      // facing you or away: both hands meet on the handle
          const tgt = [[cx, waist - 2], [cx, headTop - 6], [cx, waist + 10], [cx, waist + 4]][ph], ang = aimArms(rp, tgt[0], tgt[1]);
          const rot = d === 0 ? [28, 0, 180, 165][ph] : [-28, 0, 180, 195][ph], behind = d === 0 ? ph === 1 : ph !== 1;
          ok = drawRig(tg, L, d, ox0, oy0, ang, hs => { const hx = (hs[0][0] + hs[hs.length - 1][0]) / 2, hy = (hs[0][1] + hs[hs.length - 1][1]) / 2;
            tg.save(); tg.translate(hx, hy); tg.rotate(R(rot)); if (ph >= 2) tg.scale(1, .72); drawTool(tg, t, len); tg.restore(); }, behind);
        }
      }
      if (!ok) tg.drawImage(fig(d, 1), fx + left, fy + top);   // no rig for this outfit: just stand
      tg.restore();
    } });
    // portrait: the head from the front
    const pc = document.createElement('canvas'); pc.width = pc.height = 240; const pg = pc.getContext('2d'), H0 = CC.pieces[`head${L.f}_0`], O = CC.outfits[oIdx(L)];
    const hx = H0.at[0] + O.offs[1][0] + H0.f[2] / 2, hy = H0.at[1] + O.offs[1][1] + H0.f[3] * .55, k = 240 / (H0.f[2] * 1.9);
    pg.fillStyle = '#cfe3b2'; pg.fillRect(0, 0, 240, 240); pg.imageSmoothingQuality = 'high';
    pg.save(); pg.translate(120, 120); pg.scale(k, k); drawFig(pg, L, 0, 1, -hx, -hy); pg.restore();
    return { walk: walk.toDataURL('image/png'), tools: tools.toDataURL('image/png'), port: pc.toDataURL('image/webp', .92), fw: W, fh: H, tw: TW, th: TH };
  }

  // ---- the creator screen (a new game, and the Wardrobe)
  function open({ first, name, start, onDone, back }) {
    const L = fix(start), st = { dir: 0, step: 1, play: true };
    const ROWS = [
      ['Outfit', 'o', () => CC.outfits.length, () => CC.outfits.findIndex(o => o.name === L.o), i => { L.o = CC.outfits[i].name; }, i => CC.outfits[i].name],
      ['Outfit colour', 'oc', () => CLOTHC.length + 1, () => L.oc + 1, i => { L.oc = i - 1; }, i => i ? CLOTHC[i - 1][0] : 'Original', i => i ? CLOTHC[i - 1][1] : null],
      ['Face', 'f', () => CC.heads, () => L.f, i => { L.f = i; }, i => `Face ${i + 1}`],
      ['Skin', 'sk', () => SKIN.length, () => L.sk, i => { L.sk = i; }, i => SKIN[i][0], i => SKIN[i][1]],
      ['Hair', 'h', () => CC.hair.length + 1, () => L.h ? CC.hair.indexOf(L.h) + 1 : 0, i => { L.h = i ? CC.hair[i - 1] : ''; }, i => i ? nice(CC.hair[i - 1]) : 'Bald'],
      ['Hair colour', 'hc', () => HAIRC.length, () => L.hc, i => { L.hc = i; }, i => HAIRC[i][0], i => HAIRC[i][1]],
      ['Beard', 'b', () => CC.beards + 1, () => L.b + 1, i => { L.b = i - 1; }, i => i ? `Beard ${i}` : 'None'],
      ['Beard colour', 'bc', () => HAIRC.length + 1, () => L.bc + 1, i => { L.bc = i - 1; }, i => i ? HAIRC[i - 1][0] : 'Same as hair', i => i ? HAIRC[i - 1][1] : null]
    ];
    const row = r => { const i = r[3](), nm = String(r[5](i)), c = r[6] && r[6](i);
      return `<div class="ccrow"><span class="ccl">${r[0]}</span><button class="ccarr" data-a="arr" data-k="${r[1]}" data-d="-1">◀</button><div class="ccv">${c ? `<i style="background:${c}"></i>` : ''}<span${nm.length > 17 ? ' class="long"' : ''}>${nm}</span></div><button class="ccarr" data-a="arr" data-k="${r[1]}" data-d="1">▶</button></div>`; };
    const css = `<style>.ccwrap{display:flex;flex-direction:column;gap:6px}.ccstage{position:sticky;top:-2px;z-index:2;background:#b9d6b8;border:3px solid var(--green);border-radius:10px;height:230px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
      .ccstage canvas{height:212px;image-rendering:auto}.ccbtn{position:absolute;border:3px solid #7a4a28;background:#fdf3dc;border-radius:50%;width:38px;height:38px;font-size:18px;cursor:pointer;padding:0}
      .ccrow{display:flex;align-items:center;gap:5px}.ccl{flex:0 0 92px;font-weight:800;font-size:13px}.ccarr{flex:0 0 34px;height:34px;border:0;border-radius:8px;background:#7a4a28;color:#fff;font-size:14px;cursor:pointer}
      .ccv{flex:1;min-width:0;height:34px;border:3px solid #c9a24a;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:13px;overflow:hidden;padding:0 4px}
      .ccv i{width:16px;height:16px;border-radius:50%;flex:0 0 auto;border:2px solid #0003}.ccv span{text-align:center;line-height:1.05}.ccv span.long{font-size:11px}</style>`;
    const render = () => `${css}<div class="ccwrap">${first ? `<p class="hint" style="text-align:center;margin:0">Who's heading out to Wild Roots Farm, ${name}?</p>` : ''}
      <div class="ccstage" style="position:sticky"><canvas id="ccCv"></canvas>
        <button class="ccbtn" data-a="turn" data-d="-1" style="left:8px;bottom:8px">⟲</button><button class="ccbtn" data-a="turn" data-d="1" style="right:8px;bottom:8px">⟳</button>
        <button class="ccbtn" data-a="dice" style="right:8px;top:8px">🎲</button><button class="ccbtn" data-a="walk" style="left:8px;top:8px">${st.play ? '⏸' : '▶'}</button></div>
      ${ROWS.map(row).join('')}
      <div class="row">${back ? '<button class="btn" data-a="back">◀ Back</button>' : ''}<button class="btn gold" data-a="ok">${first ? 'Start farming' : 'Done'}</button></div></div>`;
    let timer = null, drawn = 0;
    const draw = async () => {
      const my = ++drawn; await ready(L); if (my !== drawn) return; const cv = $('ccCv'); if (!cv) return;
      const B = box(); cv.width = B.w; cv.height = B.h; const g = cv.getContext('2d'); g.clearRect(0, 0, B.w, B.h);
      g.fillStyle = '#0002'; g.beginPath(); g.ellipse(B.w / 2, B.feet - B.y - 4, B.w * .22, 7, 0, 0, 7); g.fill();
      drawFig(g, L, st.dir, st.step % 4, -B.x, -B.y);
    };
    const refresh = () => { $('mBody').innerHTML = render(); draw(); };
    const rand = () => { const r = n => Math.floor(Math.random() * n);
      L.o = CC.outfits[r(CC.outfits.length)].name; L.oc = Math.random() < .5 ? -1 : r(CLOTHC.length); L.f = r(CC.heads); L.sk = r(SKIN.length);
      L.h = Math.random() < .07 ? '' : CC.hair[r(CC.hair.length)]; L.hc = r(10); L.b = L.f < 4 && Math.random() < .35 ? r(CC.beards) : -1; L.bc = -1; };
    openModal(first ? 'Your farmer' : 'Wardrobe', render(), (a, d) => {
      if (a === 'arr') { const R = ROWS.find(r => r[1] === d.k), n = R[2](); R[4]((R[3]() + +d.d + n) % n); refresh(); }
      if (a === 'turn') { st.dir = [0, 2, 3, 1][([0, 3, 1, 2][st.dir] + +d.d + 4) % 4]; draw(); }
      if (a === 'walk') { st.play = !st.play; if (!st.play) st.step = 1; refresh(); }
      if (a === 'dice') { rand(); refresh(); }
      if (a === 'ok') { clearInterval(timer); closeModal(); onDone({ cc: { ...L } }); }
      if (a === 'back' && back) { clearInterval(timer); back(); }
    }, () => clearInterval(timer));
    draw(); timer = setInterval(() => { if (!$('ccCv')) return clearInterval(timer); if (st.play) { st.step = (st.step + 1) % 4; draw(); } }, 170);
  }
  return { sheets, open, fix, DEF };
})();

if (CCX) {
  let CC_FRAME = null;   // the composed sheets' frame sizes, when the farmer is a creator look
  lookPrepare = async function () {
    if (!S || !HD_FARMER) return;
    if (PENDING_LOOK) S.look = PENDING_LOOK;
    CC_FRAME = null;
    if (S.look && S.look.cc) {
      const r = await CCX.sheets(S.look.cc); LOOK_SRC = { walk: r.walk, tools: r.tools }; CC_FRAME = r; PLAYER_PIC = [r.port, r.port]; return;
    }
    const lk = look(); LOOK_SRC = await lookSheets(lk);
    const P = HD['port_' + LOOKS[lk.p].port]; if (P) PLAYER_PIC = [P[0], P[1]];
  };
  const _hdLoad = hdFarmerLoad;
  hdFarmerLoad = function (loader) {
    if (!CC_FRAME || !LOOK_SRC) return _hdLoad(loader);
    loader.spritesheet('walk', LOOK_SRC.walk, { frameWidth: CC_FRAME.fw, frameHeight: CC_FRAME.fh });
    loader.spritesheet('tools', LOOK_SRC.tools, { frameWidth: CC_FRAME.tw, frameHeight: CC_FRAME.th });
    return true;
  };
  // 27 Nov: choose a classic farmer (the six drawn ones, look.js) or build your own in the creator
  const _classicLook = openLook;
  openLook = function lookChooser({ first, name, onDone }) {
    const again = () => lookChooser({ first, name, onDone });
    const wasClassic = !first && S && S.look && !S.look.cc;
    const portOf = p => (HD['port_' + LOOKS[p].port] || [''])[0];
    const classics = Object.keys(LOOKS).filter(lookOk);
    const card = (a, title, sub, pics, on) => `<button data-a="${a}" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;margin:6px 0;padding:10px;border:3px solid ${on ? 'var(--gold,#d9a62e)' : '#c9a24a'};border-radius:12px;background:${on ? '#fff4d2' : '#fffaf0'}">
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:6px">${pics}</div><b style="display:block;text-align:center;font-size:16px">${title}</b><small style="display:block;text-align:center;opacity:.8">${sub}</small></button>`;
    const pic = src => `<img src="${src}" style="width:52px;height:52px;object-fit:cover;object-position:50% 20%;border-radius:8px;border:2px solid #0002;background:#cfe3b2">`;
    const ccPic = `<div style="width:52px;height:52px;border-radius:8px;border:2px solid #0002;background:#cfe3b2;display:flex;align-items:center;justify-content:center;font-size:30px">🎨</div>`;
    openModal(first ? 'Your farmer' : 'Wardrobe', `${first ? `<p class="hint" style="text-align:center;margin:0 0 4px">Who's heading out to Wild Roots Farm, ${name}?</p>` : ''}
      ${card('classic', 'Classic farmer', 'Pick one of the six original farmers, in any outfit colour', classics.slice(0, 6).map(p => pic(portOf(p))).join(''), wasClassic)}
      ${card('create', 'Create your own', '24 outfits, faces, skin, hair and beards, in any colours', ccPic, !first && !wasClassic)}`,
      a => {
        if (a === 'classic') _classicLook({ first, name, onDone, back: again });
        if (a === 'create') CCX.open({ first, name, start: !first && S && S.look && S.look.cc, onDone, back: again });
      });
  };
  openWardrobe = function () {
    if (!scene || !['house', 'farm'].includes(scene.scene.key)) return toast('Change your look at home: on the farm or in the farmhouse.', 2600);
    openLook({ first: false, onDone: lk => {
      if (JSON.stringify(lk) === JSON.stringify(S.look)) return;
      S.look = lk; const p = scene.p; S.spawn = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir || 'down' }; save(); bootGame();
    } });
  };
}
