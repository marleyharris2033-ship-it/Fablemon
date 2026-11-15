/* ============================================================ Character creator
   Choose which farmer you are (five drawn farmers: tools/art/cut_farmer.py and cut_presets.py) and the colour of
   their outfit, at the start of a new game and later from Menu → Wardrobe (at home). S.look = { p, c }.
   The outfit colour is a recolour of one band of hues (the farmer's main garment), done on a canvas before the game
   boots, with the head of every frame left alone so faces and hair keep their colours. Old saves are the straw-hat
   farmer in his own colours. Loaded last. */
const LOOKS = {
  straw: { name: 'Straw Hat', walk: 'farmer_walk', tools: 'farmer_tools', port: 'player', band: [.6, .8, .2] },
  olive: { name: 'Olive Vest', walk: 'farmer_olive_walk', tools: 'farmer_olive_tools', port: 'olive', band: [.13, .23, .25] },
  teal: { name: 'Teal Dungarees', walk: 'farmer_teal_walk', tools: 'farmer_teal_tools', port: 'teal', band: [.42, .58, .2] },
  rust: { name: 'Rust Dungarees', walk: 'farmer_rust_walk', tools: 'farmer_rust_tools', port: 'rust', band: [.955, 1.035, .5] },
  jacket: { name: 'Green Jacket', walk: 'farmer_jacket_walk', tools: 'farmer_jacket_tools', port: 'jacket', band: [.14, .27, .3] },
};
const LOOK_COLOURS = [{ n: 'Original' }, { n: 'Navy', h: .61, sw: '#3b4f86' }, { n: 'Forest', h: .32, sw: '#3f7a3c' }, { n: 'Plum', h: .82, sw: '#7a3f78' },
  { n: 'Brick', h: .015, sw: '#a8452e' }, { n: 'Mustard', h: .115, sw: '#c79a2a' }, { n: 'Sky', h: .55, sw: '#4f9cc8' }, { n: 'Charcoal', h: .6, s: .12, v: .72, sw: '#4a4c52' }];
const lookOk = p => !!(LOOKS[p] && HDW[LOOKS[p].walk] && HDW[LOOKS[p].tools]);
const look = () => { S.look = S.look || { p: 'straw', c: 0 }; if (!lookOk(S.look.p)) S.look.p = 'straw'; return S.look; };
let LOOK_SRC = null, PENDING_LOOK = null;
const LOOK_CACHE = {};

// recolour one band of hues on a sheet, skipping each frame's head (the top 40% of the figure in its cell)
async function lookRecolour(url, band, col, cw, ch) {
  const key = url.length + ':' + url.slice(-40) + ':' + band + ':' + col.n; if (LOOK_CACHE[key]) return LOOK_CACHE[key];
  const im = await loadImg(url), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0); const D = g.getImageData(0, 0, c.width, c.height), d = D.data, W = c.width;
  const headPx = Math.round(31 * 6 * .4);
  for (let cy = 0; cy < c.height; cy += ch) for (let cx = 0; cx < W; cx += cw) {
    let top = -1; for (let y = cy; y < cy + ch && top < 0; y++) for (let x = cx; x < cx + cw; x += 2) if (d[(y * W + x) * 4 + 3] > 40) { top = y; break; }
    if (top < 0) continue;
    for (let y = top + headPx; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
      const i = (y * W + x) * 4; if (d[i + 3] < 8) continue;
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx, s = mx ? (mx - mn) / mx : 0;
      if (s < band[2] || mx === mn) continue;
      let h = mx === r ? ((gg - b) / (mx - mn)) / 6 : mx === gg ? (2 + (b - r) / (mx - mn)) / 6 : (4 + (r - gg) / (mx - mn)) / 6; if (h < 0) h += 1;
      if (!((h >= band[0] && h < band[1]) || (h + 1 >= band[0] && h + 1 < band[1]))) continue;
      const H = col.h, S2 = col.s != null ? col.s : s, V = v * (col.v || 1);
      const k = (n) => { const kk = (n + H * 6) % 6; return V - V * S2 * Math.max(0, Math.min(kk, 4 - kk, 1)); };
      d[i] = k(5) * 255; d[i + 1] = k(3) * 255; d[i + 2] = k(1) * 255;
    }
  }
  g.putImageData(D, 0, 0); const u = c.toDataURL('image/webp', .92); LOOK_CACHE[key] = u; return u;
}
async function lookSheets(lk) {
  const L = LOOKS[lk.p], col = LOOK_COLOURS[lk.c || 0] || LOOK_COLOURS[0];
  const walk = HDW[L.walk].img, tools = HDW[L.tools].img;
  if (!col.h && col.h !== 0) return { walk, tools };
  return { walk: await lookRecolour(walk, L.band, col, 24 * 6, 32 * 6), tools: await lookRecolour(tools, L.band, col, 40 * 6, 48 * 6) };
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
function openLook({ first, name, onDone }) {
  const cur = first ? { p: 'straw', c: 0 } : { ...look() };
  let preview = null, frame = 0, dir = 0, timer = null;
  const presets = Object.keys(LOOKS).filter(lookOk);
  const render = () => `<p class="hint" style="text-align:center">${first ? `Who's heading out to Wild Roots Farm, ${name}?` : 'Change how you look. Your Fablemon will still know you.'}</p>
    <div style="display:flex;gap:10px;align-items:center;justify-content:center;margin:4px 0 8px">
      <div id="lkPrev" style="width:96px;height:128px;background-repeat:no-repeat;background-size:400% 400%;image-rendering:auto;background-color:#cfe3b2;border:3px solid var(--green);border-radius:8px"></div>
      <img src="${(HD['port_' + LOOKS[cur.p].port] || [''])[0]}" style="width:128px;height:128px;border:3px solid var(--green);border-radius:8px">
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">${presets.map(p => `<button class="mtile${p === cur.p ? ' on' : ''}" data-a="p" data-p="${p}" style="padding:4px;aspect-ratio:auto;${p === cur.p ? 'background:#e9f5d0;border-color:var(--gold2)' : ''}"><img src="${(HD['port_' + LOOKS[p].port] || [''])[0]}" style="width:100%;border-radius:6px"><small>${LOOKS[p].name}</small></button>`).join('')}</div>
    <p style="margin:10px 0 4px"><b>Outfit colour</b> <small>${LOOK_COLOURS[cur.c].n}</small></p>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${LOOK_COLOURS.map((c, i) => `<button data-a="c" data-c="${i}" title="${c.n}" style="width:34px;height:34px;border-radius:50%;cursor:pointer;border:3px solid ${i === cur.c ? 'var(--gold2)' : '#fff'};box-shadow:0 0 0 2px var(--green);background:${c.sw || 'conic-gradient(#3b4f86,#3f7a3c,#c79a2a,#a8452e,#7a3f78,#3b4f86)'}"></button>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn gold" data-a="ok">${first ? 'Start farming' : 'Done'}</button></div>`;
  const refresh = async () => {
    $('mBody').innerHTML = render();
    const L = LOOKS[cur.p], col = LOOK_COLOURS[cur.c];
    preview = col.h != null ? await lookRecolour(HDW[L.walk].img, L.band, col, 24 * 6, 32 * 6) : HDW[L.walk].img;
    const el = $('lkPrev'); if (el) el.style.backgroundImage = `url(${preview})`;
  };
  const tick = () => { const el = $('lkPrev'); if (!el) { clearInterval(timer); return; } frame = (frame + 1) % 4; if (frame === 0 && Math.random() < .35) dir = (dir + 1) % 4; el.style.backgroundPosition = `${frame * 100 / 3}% ${[0, 1, 2, 3][dir] * 100 / 3}%`; };
  openModal(first ? 'Your farmer' : 'Wardrobe', render(), (a, d) => {
    if (a === 'p') { cur.p = d.p; refresh(); }
    if (a === 'c') { cur.c = +d.c; refresh(); }
    if (a === 'ok') { clearInterval(timer); closeModal(); onDone({ ...cur }); }
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
