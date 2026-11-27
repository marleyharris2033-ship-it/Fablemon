/* ============================================================ Character creator
   Choose which farmer you are (six drawn farmers: tools/art/cut_farmer.py and cut_presets.py) and the colour of
   their outfit, at the start of a new game and later from Menu → Wardrobe (at home). S.look = { p, c }.
   The outfit colour is a recolour of one band of hues (the farmer's main garment), done on a canvas before the game
   boots, with the head of every frame left alone so faces and hair keep their colours. Old saves are the straw-hat
   farmer in his own colours. Loaded last. */
// band: the garment the outfit colour changes, as [hue from, hue to, min saturation, min value, max value, max saturation?, not on the boots?] ranges
// (hues wrap past 1); head: how far down each frame the head reaches (6x pixels), so faces and hair are never touched
const LOOKS = {
  straw: { name: 'Straw Hat', walk: 'farmer_walk', tools: 'farmer_tools', port: 'player', band: [[.58, .86, .18, 0, 1]], head: 74 },
  olive: { name: 'Olive Vest', walk: 'farmer_olive_walk', tools: 'farmer_olive_tools', port: 'olive', band: [[.53, .72, .12, 0, 1]], head: 50 },
  teal: { name: 'Teal', walk: 'farmer_teal_walk', tools: 'farmer_teal_tools', port: 'teal', band: [[.38, .62, .07, 0, 1]], head: 74 },
  rust: { name: 'Rust', walk: 'farmer_rust_walk', tools: 'farmer_rust_tools', port: 'rust', band: [[.96, 1.045, .55, 0, .85]], head: 74 },
  jacket: { name: 'Green Jacket', walk: 'farmer_jacket_walk', tools: 'farmer_jacket_tools', port: 'jacket', band: [[.075, .24, .25, 0, .8]], head: 44 },
  cap: { name: 'Cap', walk: 'farmer_cap_walk', tools: 'farmer_cap_tools', port: 'cap', band: [[.16, .85, 0, .14, 1], [0, .16, 0, .15, .62, .5, 1]], head: 74 }   // the second band: the worn brown patches on the denim, not the boots,
};
const LOOK_COLOURS = [{ n: 'Original' }, { n: 'Navy', sw: '#2f437e' }, { n: 'Forest', sw: '#3c7a35' }, { n: 'Plum', sw: '#7b3c7a' }, { n: 'Brick', sw: '#a33d27' },
  { n: 'Mustard', sw: '#c9982a' }, { n: 'Sky', sw: '#4b9ed2' }, { n: 'Charcoal', sw: '#45474e' }, { n: 'Rose', sw: '#cf6f8c' }, { n: 'Cream', sw: '#d9cba8' }];
const lookOk = p => !!(LOOKS[p] && HDW[LOOKS[p].walk] && HDW[LOOKS[p].tools]);
const look = () => { S.look = S.look || { p: 'straw', c: 0 }; if (!lookOk(S.look.p)) S.look.p = 'straw'; return S.look; };
let LOOK_SRC = null, PENDING_LOOK = null;
const LOOK_CACHE = {};

// recolour the garment to the swatch's colour: every pixel takes the swatch's hue, and its saturation and brightness
// are moved so the garment's average matches the swatch while its own shading (folds, seams, stitching) stays
const hexHsv = hx => { const n = parseInt(hx.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; if (h < 0) h += 1; return [h, mx ? d / mx : 0, mx]; };
async function lookRecolour(url, L, col, cw, ch) {
  const key = url.length + ':' + url.slice(-40) + ':' + L.name + ':' + col.n; if (LOOK_CACHE[key]) return LOOK_CACHE[key];
  const im = await loadImg(url), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0); const D = g.getImageData(0, 0, c.width, c.height), d = D.data, W = c.width;
  const hsv = new Float32Array(W * c.height * 3), sel = new Uint8Array(W * c.height); let sS = 0, sV = 0, n = 0;
  for (let cy = 0; cy < c.height; cy += ch) for (let cx = 0; cx < W; cx += cw) {
    let top = -1; for (let y = cy; y < cy + ch && top < 0; y++) for (let x = cx; x < cx + cw; x += 2) if (d[(y * W + x) * 4 + 3] > 40) { top = y; break; }
    if (top < 0) continue;
    let bot = cy + ch - 1; while (bot > top) { let any = 0; for (let x = cx; x < cx + cw; x += 2) if (d[(bot * W + x) * 4 + 3] > 40) { any = 1; break; } if (any) break; bot--; }
    const feet = bot - 32;
    for (let y = top + L.head; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
      const p = y * W + x, i = p * 4; if (d[i + 3] < 26) continue;
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dd = mx - mn, s = mx ? dd / mx : 0;
      let h = !dd ? 0 : mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6; if (h < 0) h += 1;
      if (!L.band.some(([lo, hi, smin, vmin, vmax, smax = 1, noFeet]) => { const hh = h < lo ? h + 1 : h; return hh >= lo && hh < hi && s >= smin && s <= smax && mx >= vmin && mx <= vmax && !(noFeet && y > feet); })) continue;
      sel[p] = 1; hsv[p * 3] = h; hsv[p * 3 + 1] = s; hsv[p * 3 + 2] = mx; sS += s; sV += mx; n++;
    }
  }
  const [TH, TS, TV] = hexHsv(col.sw), kS = n ? TS / (sS / n) : 1, kV = n ? TV / (sV / n) : 1;
  for (let p = 0; p < sel.length; p++) if (sel[p]) {
    const S2 = Math.min(1, hsv[p * 3 + 1] * kS), V = Math.min(1, hsv[p * 3 + 2] * kV), i = p * 4;
    const k = n2 => { const kk = (n2 + TH * 6) % 6; return V - V * S2 * Math.max(0, Math.min(kk, 4 - kk, 1)); };
    d[i] = k(5) * 255; d[i + 1] = k(3) * 255; d[i + 2] = k(1) * 255;
  }
  g.putImageData(D, 0, 0); const u = c.toDataURL('image/webp', .92); LOOK_CACHE[key] = u; return u;
}
async function lookSheets(lk) {
  const L = LOOKS[lk.p], col = LOOK_COLOURS[lk.c || 0] || LOOK_COLOURS[0];
  const walk = HDW[L.walk].img, tools = HDW[L.tools].img;
  if (!col.sw) return { walk, tools };
  return { walk: await lookRecolour(walk, L, col, 24 * 6, 32 * 6), tools: await lookRecolour(tools, L, col, 40 * 6, 48 * 6) };
}
async function lookPrepare() {
  if (!S || !HD_FARMER) return;
  if (PENDING_LOOK) S.look = PENDING_LOOK;   // a new game boots before startFrom returns when the intro is skipped
  const lk = look(); LOOK_SRC = await lookSheets(lk);
  const P = HD['port_' + LOOKS[lk.p].port]; if (P) PLAYER_PIC = [P[0], P[1]];
}
const _lookBoot = bootGame;
bootGame = async function () { try { await lookPrepare(); } catch (e) { LOOK_SRC = null; } return _lookBoot(); };

// a new game: pick your farmer before the intro
const _lookStart = startFrom;
startFrom = function (n, fresh, name) {
  const r = _lookStart(n, fresh, name);
  if (fresh && PENDING_LOOK) { S.look = PENDING_LOOK; PENDING_LOOK = null; save(); }
  return r;
};

// the creator itself
function openLook({ first, name, onDone, back }) {
  const cur = first || !(S && S.look && S.look.p) ? { p: 'straw', c: 0 } : { ...look() };   // (a creator farmer starts the classic list on the straw hat)
  let preview = null, frame = 0, dir = 0, timer = null;
  const presets = Object.keys(LOOKS).filter(lookOk);
  const render = () => `<p class="hint" style="text-align:center">${first ? `Who's heading out to Wild Roots Farm, ${name}?` : 'Change how you look. Your Fablemon will still know you.'}</p>
    <div style="display:flex;gap:10px;align-items:center;justify-content:center;margin:4px 0 8px">
      <div id="lkPrev" style="width:96px;height:128px;background-repeat:no-repeat;background-size:400% 400%;image-rendering:auto;background-color:#cfe3b2;border:3px solid var(--green);border-radius:8px"></div>
      <img src="${(HD['port_' + LOOKS[cur.p].port] || [''])[0]}" style="width:128px;height:128px;object-fit:cover;object-position:50% 20%;border:3px solid var(--green);border-radius:8px">
    </div>
    <div style="display:grid;grid-template-columns:repeat(${presets.length},minmax(0,1fr));gap:5px">${presets.map(p => `<button data-a="p" data-p="${p}" style="all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:3px;border-radius:8px;border:3px solid ${p === cur.p ? 'var(--gold2)' : 'var(--green)'};background:${p === cur.p ? '#e9f5d0' : '#fffaea'};min-width:0"><img src="${(HD['port_' + LOOKS[p].port] || [''])[0]}" style="width:100%;aspect-ratio:1;object-fit:cover;object-position:50% 20%;border-radius:5px;display:block"></button>`).join('')}</div>
    <p style="margin:10px 0 4px"><b>Outfit colour</b> <small>${LOOK_COLOURS[cur.c].n}</small></p>
    <div style="display:grid;grid-template-columns:repeat(5,34px);gap:8px;justify-content:center">${LOOK_COLOURS.map((c, i) => `<button data-a="c" data-c="${i}" title="${c.n}" style="width:34px;height:34px;border-radius:50%;cursor:pointer;border:3px solid ${i === cur.c ? 'var(--gold2)' : '#fff'};box-shadow:0 0 0 2px var(--green);background:${c.sw || 'conic-gradient(#2f437e,#3c7a35,#c9982a,#a33d27,#7b3c7a,#2f437e)'}"></button>`).join('')}</div>
    <div class="row" style="margin-top:12px">${back ? '<button class="btn" data-a="back">◀ Back</button>' : ''}<button class="btn gold" data-a="ok">${first ? 'Start farming' : 'Done'}</button></div>`;
  const refresh = async () => {
    $('mBody').innerHTML = render();
    const L = LOOKS[cur.p], col = LOOK_COLOURS[cur.c];
    preview = col.sw ? await lookRecolour(HDW[L.walk].img, L, col, 24 * 6, 32 * 6) : HDW[L.walk].img;
    const el = $('lkPrev'); if (el) el.style.backgroundImage = `url(${preview})`;
  };
  const tick = () => { const el = $('lkPrev'); if (!el) { clearInterval(timer); return; } frame = (frame + 1) % 4; if (frame === 0 && Math.random() < .35) dir = (dir + 1) % 4; el.style.backgroundPosition = `${frame * 100 / 3}% ${[0, 1, 2, 3][dir] * 100 / 3}%`; };
  openModal(first ? 'Your farmer' : 'Wardrobe', render(), (a, d) => {
    if (a === 'p') { cur.p = d.p; refresh(); }
    if (a === 'c') { cur.c = +d.c; refresh(); }
    if (a === 'ok') { clearInterval(timer); closeModal(); onDone({ ...cur }); }
    if (a === 'back' && back) { clearInterval(timer); back(); }
  });
  refresh(); timer = setInterval(tick, 200);
}
function openWardrobe() {
  if (!scene || !['house', 'farm'].includes(scene.scene.key)) return toast('Change your look at home: on the farm or in the farmhouse.', 2600);
  openLook({ first: false, onDone: lk => {
    if (lk.p === look().p && lk.c === look().c) return;
    S.look = lk; const p = scene.p; S.spawn = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir || 'down' }; save(); bootGame();
  } });
}
