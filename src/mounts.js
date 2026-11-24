/* ============================================================ Mounts and running boots (23 Nov 2026)
   Beat Mabel and she sends a pair of running boots: you walk 1.4x faster, everywhere, from then on.
   Beat Granger and he gives you Ridgeram, a saddled Rambastion, to ride. Every mount is a special variant of a
   Fablemon already in the game: a gift or a prize, never used in battle.

   Each mount has four stats from 1 to 100, all with the same ceiling, so a mount you've had for ages can beat a new
   one that only starts higher:
     Speed   how fast it runs                      (rises as you ride along paths)
     Footing how little rough ground slows it      (rises as you ride off the paths)
     Stamina how much breath it has for its perk   (rises each time it uses its perk)
     Bond    how strong its perk is                (rises with riding, and with feeding and brushing at the stable)
   Each mount has one perk, a way of moving only it can do, paid for with breath that refills as you go:
     Ridgeram     (Granger)              Leap      two tiles ahead over a fence, rock, ledge or stream (three at Bond 50)
     Blazemane    (Monty, the Quarry Cup) Boost    a burst at double speed (longer with Bond)
     Tidestrider  (Orrin)                Momentum  speed builds the longer you keep moving, up to +60%; turning doesn't lose it
     Galeheath    (Tamsin)               Glide     a float you steer, up to three tiles (four at Bond 50)
     Elderhart    (Alder)                Charge    shoulder through bushes and small rocks; grass doesn't stir up wild Fablemon
   Away from your farm, Leap, Glide and Charge only ever land you somewhere you could also walk to, so they are
   shortcuts and never a way past something the story keeps shut. All mounts arrive after Granger (the third Warden).

   You ride outdoors only; you hop down by yourself indoors and back up when you step out again.
   The rider is drawn in code: the farmer's top half (any outfit, any look) sits on the mount's own walk sheet,
   with its saddle and blanket drawn over the join. When you're not riding, your mount waits at its post on the farm. */

const MOUNTS = {
  ridgeram: {
    name: 'Ridgeram', sp: 'ramruff_2', perk: 'leap', from: 'Granger', scale: 1.2,
    start: { spd: 20, foot: 40, sta: 25, bond: 10 },
    tint: { hue: 172, sat: .5, glow: 1.15 },   // its hide turns slate and its runes teal; the pale fleece stays pale
    tack: { cloth: '#2c6a5c', clothDk: '#1d4a40', trim: '#e9c35a', leather: '#6e4024', leatherDk: '#42240f', leatherLt: '#9a6238' },
    // where the rider's waist sits (in the walk sheet's own pixels, a 120 frame): facing you, facing left, facing away
    seat: { down: [60, 16], left: [78, 63], up: [60, 50] },
    desc: 'A saddled Rambastion from the Quarrydown pits. Sure-footed on rock and scree, and it never met a fence it couldn\'t clear.',
  },
  blazemane: {
    name: 'Blazemane', sp: 'fleecebolt', perk: 'boost', from: 'Monty', scale: 1.3, stallUp: 11,   // its face sits low: lift it over the stall door
    start: { spd: 35, foot: 30, sta: 30, bond: 15 },
    tint: { hue: 198, sat: .32, glow: 1.2 },   // a cold blue flame for a crest; the fleece stays white
    tack: { cloth: '#7a1f2a', clothDk: '#561520', trim: '#f2d27a', leather: '#5a3420', leatherDk: '#36200f', leatherLt: '#8a5a38' },
    seat: { down: [60, 50], left: [64, 52], up: [60, 52] }, frontSeat: true,
    desc: 'The Derby\'s fastest Fleecebolt, its crest burning blue. Give it its head on a straight and it\'s gone.',
  },
  tidestrider: {
    name: 'Tidestrider', sp: 'brookstride', perk: 'momentum', from: 'Orrin', scale: 1.3,
    start: { spd: 40, foot: 45, sta: 40, bond: 15 },
    tint: { hue: 190, sat: .45, glow: .7 },   // a deep-sea coat with coral fins
    tack: { cloth: '#e8e0c8', clothDk: '#b8ae94', trim: '#2f7fa8', leather: '#3e4a56', leatherDk: '#232b33', leatherLt: '#62707e' },
    seat: { down: [60, 50], left: [72, 70], up: [60, 46] }, frontLegs: { cut: 44, feet: [[37, 92], [80, 92]], flaps: [] },
    desc: 'A Brookstride raised on the Beaconreach tide-flats. Slow to get going, but once it\'s running it doesn\'t want to stop.',
  },
  galeheath: {
    name: 'Galeheath', sp: 'heathfoal_2', perk: 'glide', from: 'Tamsin', scale: 1.15,
    start: { spd: 45, foot: 45, sta: 45, bond: 20 },
    tint: { hue: 205, sat: .5, glow: 1.15 },   // storm-grey with violet streamers
    tack: { cloth: '#4a3a6a', clothDk: '#33284a', trim: '#d8d0f0', leather: '#4e3a2a', leatherDk: '#2e2116', leatherLt: '#7a5e44' },
    seat: { down: [66, 52], left: [66, 80], up: [66, 64] },
    desc: 'A Moorgale from the Highmoor winds. Its streamers catch the air, and with a run-up it will carry you across a gap.',
  },
  elderhart: {
    name: 'Elderhart of the Herd', short: 'Elderhart', sp: 'elderhart', perk: 'charge', from: 'Alder', scale: 1.08,
    start: { spd: 50, foot: 60, sta: 50, bond: 20 },
    tint: { hue: 300, sat: .38, glow: 1.05 },   // blossom-pink crowns on a plum coat
    tack: { cloth: '#3e5a2a', clothDk: '#2a3e1c', trim: '#e8c35a', leather: '#5a3a22', leatherDk: '#34200e', leatherLt: '#8a6040' },
    seat: { down: [72, 44], left: [80, 66], up: [72, 62] },
    desc: 'An old hart of Alder\'s herd, its crown in blossom. Nothing in the undergrowth stands in its way.',
  },
};
const mtName = id => MOUNTS[id].short || MOUNTS[id].name;
const MT_PERKS = {
  leap: { name: 'Leap', icon: '⤴', desc: 'Jump two tiles ahead, clean over a fence, rock, ledge or narrow stream. Three tiles once its Bond reaches 50.' },
  boost: { name: 'Boost', icon: '⚡', desc: 'A burst at double speed: 1.5 seconds, up to 3 seconds as your Bond grows.' },
  momentum: { name: 'Momentum', icon: '🌊', desc: 'For a while, speed builds the longer you keep moving, up to +60%. Turning doesn\'t lose it; stopping does. It lasts longer and builds faster as your Bond grows.' },
  glide: { name: 'Glide', icon: '🪶', desc: 'Float forward and steer as you go: up to three tiles, four once its Bond reaches 50. Over water, ledges and fences.' },
  charge: { name: 'Charge', icon: '💨', desc: 'For a few seconds, shoulder straight through bushes and small rocks, and run through tall grass without stirring up wild Fablemon. Longer as your Bond grows.' },
};
const MT_STATS = [['spd', 'Speed', 'Rises as you ride along paths.'], ['foot', 'Footing', 'Rises as you ride over rough ground.'], ['sta', 'Stamina', 'Rises each time it uses its perk.'], ['bond', 'Bond', 'Rises as you ride, and when you feed and brush it at the stable.']];
const MT = { st: 100, out: false, uiT: 0, cache: {}, boost: 0, mom: null, charge: null };   // st: the current mount's breath right now

function mtS() { if (!S) return null; S.mt = S.mt || { boots: 0, list: [], ride: 0, cur: null }; if (S.mt.bootsOff === undefined) S.mt.bootsOff = 0; return S.mt; }
const mtCur = () => { const M = S && S.mt; if (!M || !M.list.length) return null; return M.list.find(m => m.id === M.cur) || M.list[0]; };
const mtMaxSt = m => Math.round(50 + m.sta / 2);
const mtPerkCost = m => Math.round(40 - m.bond * .2);
function mtRaise(m, k, n = 1, quiet) {
  const was = m[k]; m[k] = Math.min(100, m[k] + n); if (m[k] === was) return;
  if (!quiet && Math.floor(m[k] / 5) !== Math.floor(was / 5)) toast(`${mtName(m.id)}'s ${MT_STATS.find(s => s[0] === k)[1]} rose to ${m[k]}!`, 1800);
}
function mtGive(id) {
  const M = mtS(), D = MOUNTS[id]; if (M.list.some(m => m.id === id)) return;
  M.list.push({ id, ...D.start, rp: 0, rr: 0, uses: 0, fed: -1, brushed: -1 }); if (!M.cur) M.cur = id;
}

/* ---------- gifts: checked whenever a place opens, so saves from before mounts existed get theirs too */
function mtGifts(sc) {
  const M = mtS(); if (!M) return;
  const cr = S.crests || {};
  if (cr.root && !M.boots) {
    M.boots = 1;
    postSend('mt_boots', { from: 'Warden Mabel', subj: 'Something for your feet', body: n => `Dear ${n},\n\nYou fought well. Rootfolk who travel as far as you will need to cover ground, so I've sent you a pair of my running boots. They're broken in already: the leather's soft and the soles have plenty of spring.\n\nPut them on and you'll walk a good deal faster, wherever you go.\n\nWarden Mabel`, }, true);
    sc.time.delayedCall(900, () => toast('👢 Mabel sent you her running boots! You walk faster now.', 3200));
  }
  if (cr.stone && !M.list.some(m => m.id === 'ridgeram')) {
    mtGive('ridgeram');
    postSend('mt_ridgeram', { from: 'Warden Granger', subj: 'A ram for the road', body: n => `${n},\n\nYou beat me fair. A Warden who can do that shouldn't be walking everywhere, so I've sent you Ridgeram. He's one of the pit rams, a Rambastion raised to the saddle, and he'll carry you anywhere outdoors.\n\nRobin's built you a stable for him; tap him at his post by your house to choose where it goes. Feed him and give him a brush when you're home, and the two of you will get on. Ride him plenty: he gets quicker and surer the more ground you cover together.\n\nOne more thing. He can leap. Fences, rocks, streams. Find out for yourself.\n\nGranger`, }, true);
    sc.time.delayedCall(1500, () => toast('🐏 Granger sent you Ridgeram, a mount! Tap his button to ride.', 3800));
  }
  if (M.list.length && !M.stable && !M.stbTold && HDW.xa && typeof Farm !== 'undefined' && sc instanceof Farm) { M.stbTold = 1; sc.time.delayedCall(2600, () => toast('🐴 Robin has built you a stable! Tap your mount to choose where it goes.', 3800)); }
  if (!cr.stone) return;   // the rest come once you can ride
  const gift = (id, ok, L, note) => { if (!ok || M.list.some(m => m.id === id)) return; mtGive(id); postSend('mt_' + id, L, true); sc.time.delayedCall(2100, () => toast(note, 3800)); };
  gift('blazemane', typeof derbyWon === 'function' && derbyWon('quarry'), { from: 'Monty', subj: 'Your Quarry Cup prize (the real one)', body: n => `${n}!\n\nWhat a race. I've seen a lot of cups won on that gravel and not many like that.\n\nThe purse was the official prize. This is mine. Blazemane's the quickest Fleecebolt I've ever had in the stables, and he's wasted standing about waiting for race days. He wants to run, and you clearly know how to let a Fablemon run.\n\nHe'll be at your farm. Give him a straight and see what happens.\n\nMonty\nSmallroot Derby` }, '🔥 Monty sent you Blazemane, a mount! Switch mounts in the Stable.');
  gift('tidestrider', cr.spark, { from: 'Warden Orrin', subj: 'From the tide-flats', body: n => `Dear ${n},\n\nThe beacon burns a little brighter for that battle. Thank you for it.\n\nThe keepers here raise Brookstride to carry the lamp oil across the flats when the tide's out. Tidestrider is the best of them. She's slow off the mark, but give her a long way to go and she'll keep picking up pace until the wind can't catch her.\n\nShe's waiting at your farm.\n\nOrrin, Keeper of Beaconreach` }, '🌊 Orrin sent you Tidestrider, a mount! Switch mounts in the Stable.');
  gift('galeheath', cr.gale, { from: 'Warden Tamsin', subj: 'Something with wings, nearly', body: n => `${n},\n\nYou climbed all the way up here and then beat me in my own wind. I'd call that earning it.\n\nGaleheath was born on the high moor. Her streamers catch the air like sails: get her running and she'll lift you clean over a gap, and you can lean her where you want to land.\n\nShe's at your farm. Don't let her near the washing line.\n\nTamsin` }, '🪶 Tamsin sent you Galeheath, a mount! Switch mounts in the Stable.');
  gift('elderhart', cr.wild, { from: 'Warden Alder', subj: 'One of the herd', body: n => `${n},\n\nThe herd has watched you since you first came into the wood. They chose you before I did.\n\nThis is the oldest of them who will still carry a rider. The Elderhart do not go around things. Briar, scrub, loose stone: it walks through and the forest closes behind it. Keep its crown tended.\n\nIt will be waiting at your farm, under the trees if you have any.\n\nAlder` }, '🦌 Alder sent you Elderhart of the Herd, a mount! Switch mounts in the Stable.');
}

/* ---------- where you can ride: out in the open, not indoors, not at sea, not down a mine */
function mtOutdoor(sc) {
  if (!sc || !sc.p || sc.boatSpr || sc.halo) return false;
  return (typeof Farm !== 'undefined' && sc instanceof Farm) || (typeof Town !== 'undefined' && sc instanceof Town) || (typeof Route !== 'undefined' && sc instanceof Route);
}

/* ---------- speed: called by World.update for each step */
function mtSpeed(sc, fast) {
  const M = S && S.mt; if (!M) return 1;
  if (sc.rideKey) {
    const m = mtCur(); if (!m) return 1;
    const top = 1.75 + .85 * m.spd / 100, ground = fast ? 1.1 : .82 + .18 * m.foot / 100;   // 1.7x to 2.6x off the paths
    const perk = (MT.boost > 0 ? 2 : 1) * (MT.mom ? 1 + MT.mom.ramp : 1);
    return top * ground * perk / (fast ? 1.25 : 1);
  }
  return M.boots && !M.bootsOff ? 1.4 : 1;
}
// each tile ridden trains it a little
function mtStep(sc, x, y) {
  if (!sc.rideKey) return; const m = mtCur(); if (!m) return;
  const fast = sc.fastAt && sc.fastAt(x, y);
  if (fast) { if (++m.rp >= 140) { m.rp = 0; mtRaise(m, 'spd'); } }
  else if (++m.rr >= 140) { m.rr = 0; mtRaise(m, 'foot'); }
  m.ridden = (m.ridden || 0) + 1; if (m.ridden % 260 === 0) mtRaise(m, 'bond');
  if (MT.charge) { const o = mtObstacle(sc, x, y); if (o) mtShove(sc, o, x, y); }
}

/* ---------- pictures: the variant's colouring, its tack, and the rider */
function mtTintCanvas(c, tint) {
  const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, hs = tint.hue / 360;
  for (let i = 0; i < a.length; i += 4) {
    if (!a[i + 3]) continue;
    const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn;
    if (dd < .001) continue;
    const s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn);
    if (s < .2 || l > .62) continue;   // pale fleece and greys stay as they are
    let h = mx === r ? (gg - b) / dd + (gg < b ? 6 : 0) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h /= 6;
    h = (h + hs) % 1; const s2 = Math.min(1, s * (s > .6 && l > .42 ? (tint.glow || 1) : (tint.sat || 1)));   // bright runes keep their glow
    const q = l < .5 ? l * (1 + s2) : l + s2 - l * s2, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    a[i] = f(h + 1 / 3) * 255; a[i + 1] = f(h) * 255; a[i + 2] = f(h - 1 / 3) * 255;
  }
  g.putImageData(d, 0, 0); return c;
}
// the mount's walk sheet in its own colours (once per mount)
function mtSheet(sc, id) {
  const D = MOUNTS[id], k = 'tint:' + id; if (MT.cache[k]) return MT.cache[k];
  const t = sc.textures.get('mon_' + D.sp), src = t.getSourceImage();
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0);
  mtTintCanvas(c, D.tint);
  // how high the top of each frame sits, for the walk bob
  const fw = t.get(0).cutWidth, g = c.getContext('2d'), tops = [];
  for (let n = 0; n < 16; n++) {
    const fx = (n % 4) * fw, fy = Math.floor(n / 4) * fw, d = g.getImageData(fx, fy, fw, fw).data; let top = fw;
    for (let y = 0; y < fw && top === fw; y++) for (let x = 0; x < fw; x++) if (d[(y * fw + x) * 4 + 3] > 100) { top = y; break; }
    tops.push(top);
  }
  return MT.cache[k] = { c, fw, tops };
}
// saddle cloth along the back, with gold trim
function mtBlanket(g, T, cx, cy, w, side, flip) {
  g.save(); g.translate(cx, cy);
  if (side) {
    // seen from the side: a cloth draped over the back, hanging down the near flank
    const pad = () => { g.beginPath(); g.moveTo(-w * .5, -w * .02); g.quadraticCurveTo(0, -w * .12, w * .5, -w * .02); g.quadraticCurveTo(w * .56, w * .3, w * .42, w * .44); g.quadraticCurveTo(0, w * .54, -w * .42, w * .44); g.quadraticCurveTo(-w * .56, w * .3, -w * .5, -w * .02); g.closePath(); };
    g.fillStyle = T.clothDk; g.save(); g.translate(0, w * .03); pad(); g.fill(); g.restore();
    g.fillStyle = T.cloth; pad(); g.fill();
    g.save(); pad(); g.clip(); g.strokeStyle = T.trim; g.lineWidth = Math.max(2, w * .07); g.beginPath(); g.moveTo(-w * .6, w * .38); g.quadraticCurveTo(0, w * .5, w * .6, w * .38); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w * .6, -w * .2, w * 1.2, w * .1); g.restore();
    // girth strap under the belly
    g.fillStyle = T.leatherDk; g.fillRect(-w * .05, w * .4, w * .1, w * .32);
  } else {
    // from behind: the cloth falls over both flanks
    const pad = () => { g.beginPath(); g.moveTo(-w * .46, -w * .04); g.quadraticCurveTo(0, -w * .16, w * .46, -w * .04); g.quadraticCurveTo(w * .6, w * .22, w * .5, w * .34); g.quadraticCurveTo(0, w * .44, -w * .5, w * .34); g.quadraticCurveTo(-w * .6, w * .22, -w * .46, -w * .04); g.closePath(); };
    g.fillStyle = T.clothDk; g.save(); g.translate(0, w * .03); pad(); g.fill(); g.restore();
    g.fillStyle = T.cloth; pad(); g.fill();
    g.save(); pad(); g.clip(); g.strokeStyle = T.trim; g.lineWidth = Math.max(2, w * .07); g.beginPath(); g.moveTo(-w * .7, w * .28); g.quadraticCurveTo(0, w * .42, w * .7, w * .28); g.stroke(); g.restore();
  }
  g.restore();
}
// the saddle's seat: drawn over the rider's waist so the join never shows
function mtSaddle(g, T, cx, cy, w, view, flip) {
  g.save(); g.translate(cx, cy); if (flip) g.scale(-1, 1);
  const lw = Math.max(1.5, w * .045);
  g.lineJoin = 'round';
  if (view === 'side') {
    // seat, a raised pommel at the front (left, facing left) and cantle at the back, a flap and stirrup on the near side
    g.fillStyle = T.leatherDk; g.beginPath(); g.moveTo(-w * .34, -w * .02); g.quadraticCurveTo(-w * .36, -w * .15, -w * .27, -w * .14); g.quadraticCurveTo(0, w * .02, w * .27, -w * .12); g.quadraticCurveTo(w * .38, -w * .14, w * .36, 0); g.quadraticCurveTo(0, w * .12, -w * .34, -w * .02); g.closePath(); g.fill();
    g.fillStyle = T.leather; g.beginPath(); g.moveTo(-w * .31, -w * .02); g.quadraticCurveTo(-w * .33, -w * .11, -w * .26, -w * .1); g.quadraticCurveTo(0, w * .04, w * .26, -w * .08); g.quadraticCurveTo(w * .33, -w * .1, w * .32, -w * .01); g.quadraticCurveTo(0, w * .08, -w * .31, -w * .02); g.closePath(); g.fill();
    // flap
    g.fillStyle = T.leather; g.strokeStyle = T.leatherDk; g.lineWidth = lw; g.beginPath(); g.moveTo(-w * .16, w * .02); g.lineTo(w * .14, w * .02); g.quadraticCurveTo(w * .17, w * .24, w * .08, w * .3); g.lineTo(-w * .12, w * .3); g.quadraticCurveTo(-w * .2, w * .2, -w * .16, w * .02); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = T.leatherLt; g.fillRect(-w * .1, w * .06, w * .03, w * .18);
    // stirrup strap and iron
    g.strokeStyle = T.leatherDk; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(-w * .02, w * .1); g.lineTo(-w * .02, w * .4); g.stroke();
    g.strokeStyle = T.trim; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(-w * .08, w * .4); g.lineTo(w * .04, w * .4); g.stroke();
    // stud
    g.fillStyle = T.trim; g.beginPath(); g.arc(w * .27, -w * .07, w * .03, 0, 7); g.fill();
  } else if (view === 'up') {
    // from behind: the cantle's curve over the rider's seat, flaps either side
    g.fillStyle = T.leather; g.strokeStyle = T.leatherDk; g.lineWidth = lw;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * w * .2, -w * .02); g.lineTo(s * w * .34, 0); g.quadraticCurveTo(s * w * .38, w * .2, s * w * .3, w * .26); g.lineTo(s * w * .18, w * .22); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = T.leatherDk; g.beginPath(); g.ellipse(0, w * .02, w * .27, w * .12, 0, 0, 7); g.fill();
    g.fillStyle = T.leather; g.beginPath(); g.ellipse(0, 0, w * .25, w * .1, 0, Math.PI, 0); g.lineTo(w * .25, w * .03); g.quadraticCurveTo(0, w * .12, -w * .25, w * .03); g.closePath(); g.fill();
    g.fillStyle = T.leatherLt; g.beginPath(); g.ellipse(0, -w * .02, w * .18, w * .045, 0, Math.PI, 0); g.fill();
    g.fillStyle = T.trim; g.beginPath(); g.arc(0, w * .05, w * .028, 0, 7); g.fill();
  }
  g.restore();
}
// the rider's frame on the 'walk' texture: [image, sx, sy, sw, sh, displayed width, displayed height]
function mtRiderFrame(sc, d) {
  const tx = sc.textures.get('walk'), cols = (tx.frameTotal - 1) / 4, f = tx.get(d * cols);
  return [f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, f.width, f.height];
}
const MT_R = 3, MT_FW = 64, MT_FH = 76;   // ride frames: 64 x 76 in the world, drawn at 3x
const MT_WAIST = .56, MT_RIDER = 1.2;                   // how far down the farmer's sprite the waist sits
function mtCompose(sc, id, rider) {
  const D = MOUNTS[id], T = D.tack, sh = mtSheet(sc, id), fw = sh.fw, R = MT_R, FW = MT_FW * R, FH = MT_FH * R;
  const mw = (MON_BIG[D.sp] || 40) * D.scale * R, k = mw / fw, mx = (FW - mw) / 2, my = FH - mw;
  const c = document.createElement('canvas'); c.width = FW * 4; c.height = FH * 4; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  for (let d = 0; d < 4; d++) for (let col = 0; col < 4; col++) {
    const n = d * 4 + col, ox = col * FW, oy = d * FH, bob = (sh.tops[n] - sh.tops[d * 4]) * k;
    g.save(); g.beginPath(); g.rect(ox, oy, FW, FH); g.clip();
    const mount = () => g.drawImage(sh.c, (n % 4) * fw + 1, Math.floor(n / 4) * fw + 1, fw - 2, fw - 2, ox + mx + k, oy + my + k, mw - 2 * k, mw - 2 * k);   // (1px in, so the next frame never bleeds in)
    const view = d === 0 ? 'down' : d === 3 ? 'up' : 'side', flip = d === 2;
    const st = view === 'side' ? D.seat.left : D.seat[view], sx = ox + mx + (flip ? fw - st[0] : st[0]) * k, sy = oy + my + st[1] * k + bob;
    const riderDraw = () => {
      if (!rider) return;
      const [img, cx, cy, cw, ch, dw, dh] = mtRiderFrame(sc, d), rw = dw * R * MT_RIDER, rh = dh * R * MT_RIDER, cut = ch * MT_WAIST;
      g.drawImage(img, cx, cy, cw, cut, sx - rw / 2, sy - rh * MT_WAIST, rw, rh * MT_WAIST);
    };
    const bw = mw * .3;
    // facing you: the rider sits behind the head; for mounts whose head sits low (frontSeat) they sit up on its back, saddle and all
    if (view === 'down' && D.frontSeat) { mount(); if (!rider) { g.restore(); continue; }   // (no saddle facing you without a rider: it'd sit on its head)
      if (D.frontSeat !== 'nopad') mtBlanket(g, T, sx, sy + bw * .1, bw * .85, false); riderDraw(); mtSaddle(g, T, sx, sy, bw * (D.frontSeat === 'nopad' ? .8 : .9), 'up'); }
    // facing you, with a big head in front: the rider sits behind it, and their boots, the saddle flaps and the reins show either side
    else if (view === 'down' && D.frontLegs) {
      // the rider sits in front of its ears but behind its face, with their boots and the saddle flaps showing either side
      const L = D.frontLegs, P = ([x, y]) => [ox + mx + x * k, oy + my + y * k + bob], cutY = oy + my + L.cut * k + bob;
      mount();
      for (const f of L.flaps) { const [fx, fy] = P(f), w = bw * .26, left = fx < sx; g.fillStyle = T.leatherDk; g.beginPath(); g.roundRect(fx - (left ? w : 0) - 1.5, fy - w * .6 - 1.5, w + 3, w * 1.3 + 3, w * .3); g.fill(); g.fillStyle = T.leather; g.beginPath(); g.roundRect(fx - (left ? w : 0), fy - w * .6, w, w * 1.3, w * .26); g.fill(); }
      if (rider) {
        const [img, cx, cy, cw, ch, dw, dh] = mtRiderFrame(sc, d), rw = dw * R * MT_RIDER, rh = dh * R * MT_RIDER, fh = .16;
        L.feet.forEach((f, i) => { const [fx, fy] = P(f), w = rw / 2, x0 = i ? fx : fx - w; g.drawImage(img, cx + (i ? cw / 2 : 0), cy + ch * (1 - fh), cw / 2, ch * fh, x0 + (i ? -w * .35 : w * .35), fy - rh * fh, w, rh * fh); });
      }
      riderDraw();
      // and the head, back over the rider's lap
      const sy0 = (L.cut + 1) * (fw / fw), srcY = Math.floor(n / 4) * fw + 1 + L.cut;
      g.drawImage(sh.c, (n % 4) * fw + 1, srcY, fw - 2, fw - 1 - L.cut - 1, ox + mx + k, cutY + k, mw - 2 * k, (fw - L.cut - 2) * k);
    }
    else if (view === 'down') { riderDraw(); mount(); }
    else if (view === 'up') { mount(); mtBlanket(g, T, sx, sy + bw * .1, bw, false); riderDraw(); mtSaddle(g, T, sx, sy, bw, 'up'); }
    else { mount(); mtBlanket(g, T, sx, sy + bw * .1, bw * .9, true); riderDraw(); mtSaddle(g, T, sx, sy + bw * .04, bw, 'side', flip); }
    g.restore();
  }
  return c;
}
// the ride sheet for the current look (rebuilt if your look changes)
function mtRideTex(sc, id) {
  const img = sc.textures.get('walk').getSourceImage(), C = MT.cache['ride:' + id];
  if (C && C.img === img && sc.textures.exists(C.key)) return C.key;
  MT.n = (MT.n || 0) + 1; const key = `ride_${id}_${MT.n}`;
  sc.textures.addSpriteSheet(key, mtCompose(sc, id, true), { frameWidth: MT_FW * MT_R, frameHeight: MT_FH * MT_R });
  try { sc.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR); } catch (e) { }
  for (let r = 0; r < 4; r++) sc.anims.create({ key: `${key}_${DIRS[r]}`, frames: sc.anims.generateFrameNumbers(key, { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 9, repeat: -1 });
  if (C) { try { for (let r = 0; r < 4; r++) sc.anims.remove(`${C.key}_${DIRS[r]}`); sc.textures.remove(C.key); } catch (e) { } }
  MT.cache['ride:' + id] = { img, key }; return key;
}
// the saddled mount on its own, waiting at its post
function mtTackTex(sc, id) {
  const key = 'mtack_' + id; if (sc.textures.exists(key)) return key;
  sc.textures.addSpriteSheet(key, mtCompose(sc, id, false), { frameWidth: MT_FW * MT_R, frameHeight: MT_FH * MT_R });
  try { sc.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR); } catch (e) { }
  return key;
}
// pictures for menus: the variant's battle art in its colours
function mtPic(id, kind = 'front') {
  const D = MOUNTS[id], k = 'pic:' + id + kind; if (MT.cache[k]) return MT.cache[k];
  const src = monPic(D.sp, kind); if (!src) return '';
  MT.cache[k] = src;   // the normal picture until the recolour is ready
  const im = new Image(); im.onload = () => {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0);
    MT.cache[k] = mtTintCanvas(c, D.tint).toDataURL(); if (im.naturalWidth > 64 && typeof HD_SMOOTH !== 'undefined') HD_SMOOTH.add(MT.cache[k]);
    mtUI(true); if ($('mtList') && $('modal').classList.contains('show')) mtOpen();
  };
  im.src = src; return MT.cache[k];
}

/* ---------- getting on and off */
function mtApply(sc, on) {
  if (!sc.player || !sc.p) return;
  const sh = (sc.shadows || []).find(s => s.spr === sc.player);
  if (on) {
    const m = mtCur(); if (!m) return;
    const D = MOUNTS[m.id];
    if (!monReady(sc, D.sp, () => { if (sc.sys && sc.sys.isActive()) sc.rideWant = null; })) return;   // its sheet is on the way
    const key = mtRideTex(sc, m.id);
    sc.rideKey = key + '_'; sc.rideId = m.id;
    sc.player.stop(); sc.player.setTexture(key, DIRS.indexOf(sc.p.dir) * 4).setScale(1 / MT_R);
    if (sh) { sh.e.width = 30; sh.e.height = 9; sh.e.setSize && sh.e.setSize(30, 9); }
  } else {
    sc.rideKey = null; sc.rideId = null;
    sc.player.stop(); sc.player.setTexture('walk', sc.standF(sc.p.dir)).setScale(1);
    if (sh) { sh.e.setSize && sh.e.setSize(14, 6); }
  }
  sc.placePlayer(); mtPost(sc);
}
function mtToggle() {
  const sc = scene, M = S && S.mt, m = mtCur(); if (!sc || !M || !m || sc.paused || sc.sleeping || (sc.p && sc.p.busy > 0)) return;
  if (!M.ride && !mtOutdoor(sc)) return toast('You can only ride outdoors.', 1800);
  M.ride = M.ride ? 0 : 1; Sound.play(M.ride ? 'pop' : 'step', 0);
  if (M.ride) MT.st = Math.min(MT.st, mtMaxSt(m));
  sc.rideWant = null; mtUI(true);
}

/* ---------- Leap */
function mtPerk() {
  const sc = scene, m = mtCur(); if (!sc || !m || !sc.rideKey || sc.paused || sc.sleeping) return;
  const p = sc.p; if (p.moving || p.busy > 0 || sc.hopping) return;
  const D = MOUNTS[m.id], cost = mtPerkCost(m);
  if (MT.boost > 0 || MT.mom || MT.charge) return;   // one at a time
  if (MT.st < cost) { toast(`${mtName(m.id)} needs to catch its breath.`, 1500); return; }
  if (D.perk === 'leap') return mtLeap(sc, m, cost);
  if (D.perk === 'glide') return mtGlide(sc, m, cost);
  MT.st -= cost; if (++m.uses % 3 === 0) mtRaise(m, 'sta');
  if (D.perk === 'boost') { MT.boost = 1.5 + 1.5 * m.bond / 100; MT.boostMax = MT.boost; Sound.play('pop', 0); mtPuff(sc, 0x8ac8ff); }
  if (D.perk === 'momentum') { MT.mom = { t: 5 + 5 * m.bond / 100, t0: 5 + 5 * m.bond / 100, ramp: 0, rate: .3 + .3 * m.bond / 100 }; Sound.play('water', 0); }
  if (D.perk === 'charge') mtChargeStart(sc, m);
  mtUI(true);
}
// a puff of dust behind you
function mtPuff(sc, col) {
  const p = sc.p; if (!p) return; const [dx, dy] = DV[p.dir];
  for (let i = 0; i < 7; i++) {
    const c = sc.add.circle(sc.player.x - dx * 10 + (Math.random() - .5) * 12, sc.player.y - 3 + (Math.random() - .5) * 6, 2 + Math.random() * 3, col || 0xd8c8a0, .7).setDepth(sc.player.depth - 1);
    sc.tweens.add({ targets: c, x: c.x - dx * (10 + Math.random() * 14), y: c.y - 4 - Math.random() * 6, alpha: 0, scale: 1.8, duration: 380 + Math.random() * 200, onComplete: () => c.destroy() });
  }
}
// can you land here? Open ground, and (away from your farm) somewhere you could also walk to
function mtLandOk(sc, x, y) {
  if (!sc.passable(x, y)) return false;
  if (typeof Farm !== 'undefined' && sc instanceof Farm) return true;
  return !!sc.path((a, b) => a === x && b === y);
}
function mtLeap(sc, m, cost) {
  const p = sc.p, [dx, dy] = DV[p.dir], reach = m.bond >= 50 ? 3 : 2;
  let land = null;
  for (let n = 2; n <= reach && !land; n++) {
    const x = p.x + dx * n, y = p.y + dy * n;
    if (mtLandOk(sc, x, y)) land = { x, y };   // (a shortcut, never a way past something the story keeps shut)
  }
  if (!land) { toast('Nowhere to land there.', 1300); return; }
  MT.st -= cost; if (++m.uses % 3 === 0) mtRaise(m, 'sta');
  const x0 = p.px ?? p.x * T + 8, y0 = p.py ?? p.y * T + 8, x1 = land.x * T + 8, y1 = land.y * T + 8, H = 12 + 4 * Math.hypot(land.x - p.x, land.y - p.y);
  const sh = (sc.shadows || []).find(s => s.spr === sc.player), ghost = { x: sc.player.x, y: sc.player.y, active: true, visible: true };
  if (sh) sh.spr = ghost;
  sc.hopping = true; p.path = []; p.pending = null; p.busy = 9; sc.player.stop(); sc.player.setFrame(DIRS.indexOf(p.dir) * 4 + 1);
  Sound.play('pop', 0);
  const o = { t: 0 };
  sc.tweens.add({ targets: o, t: 1, duration: 300 + 50 * Math.hypot(land.x - p.x, land.y - p.y), ease: 'Sine.inOut',
    onUpdate: () => {
      p.px = x0 + (x1 - x0) * o.t; p.py = y0 + (y1 - y0) * o.t; sc.placePlayer();
      ghost.x = sc.player.x; ghost.y = sc.player.y; sc.player.y -= Math.sin(Math.PI * o.t) * H; sc.player.setDepth(ghost.y + 20);
    },
    onComplete: () => {
      if (sh) sh.spr = sc.player;
      p.x = land.x; p.y = land.y; p.px = x1; p.py = y1; sc.placePlayer(); sc.player.setFrame(DIRS.indexOf(p.dir) * 4);
      sc.hopping = false; p.busy = 0; Sound.play('step', 1); sc.cameras.main.shake(70, .003);
      // your Fablemon catches up
      const f = sc.fol; if (f) { const bx = land.x - dx, by = land.y - dy, ok = sc.passable(bx, by); f.x = ok ? bx : land.x; f.y = ok ? by : land.y; f.px = f.x * T + 8; f.py = f.y * T + 8; f.trail = []; f.moving = false; sc.drawFollower(); }
      if (m.ridden !== undefined && ++m.ridden % 260 === 0) mtRaise(m, 'bond');
      sc.arriveHook && sc.arriveHook(p.x, p.y);
    } });
}

/* ---------- Glide: a float you steer, tile by tile */
function mtInputDir(sc) {
  const k = sc.keys;
  if (k) { if (k.W.isDown || k.UP.isDown) return 'up'; if (k.S.isDown || k.DOWN.isDown) return 'down'; if (k.A.isDown || k.LEFT.isDown) return 'left'; if (k.D.isDown || k.RIGHT.isDown) return 'right'; }
  const jd = typeof joyDirs === 'function' && joyDirs(); return jd ? jd[0] : null;
}
function mtGlide(sc, m, cost) {
  const p = sc.p, max = m.bond >= 50 ? 4 : 3, start = { x: p.x, y: p.y };
  let dir = p.dir; { const [dx, dy] = DV[dir], nx = p.x + dx, ny = p.y + dy; if (nx < 0 || ny < 0 || nx >= sc.mw || ny >= sc.mh) { toast('No room to glide there.', 1300); return; } }
  MT.st -= cost; if (++m.uses % 3 === 0) mtRaise(m, 'sta');
  const sh = (sc.shadows || []).find(s => s.spr === sc.player), ghost = { x: sc.player.x, y: sc.player.y, active: true, visible: true }; if (sh) sh.spr = ghost;
  sc.hopping = true; p.path = []; p.pending = null; p.busy = 99; sc.player.stop();
  const trail = [{ x: p.x, y: p.y }]; let steps = 0, lift = 0, cur = { x: p.x, y: p.y };
  Sound.play('pop', 1); mtPuff(sc, 0xe8e0ff);
  const draw = () => { sc.placePlayer(); ghost.x = sc.player.x; ghost.y = sc.player.y; sc.player.y -= lift + Math.sin(sc.time.now / 120) * 1.2; sc.player.setDepth(ghost.y + 20); };
  const fly = (to, ms, then) => { const x0 = p.px, y0 = p.py, x1 = to.x * T + 8, y1 = to.y * T + 8, o = { t: 0 };
    sc.tweens.add({ targets: o, t: 1, duration: ms, onUpdate: () => { p.px = x0 + (x1 - x0) * o.t; p.py = y0 + (y1 - y0) * o.t; draw(); }, onComplete: then }); };
  const finish = at => {
    const up = { v: lift }; sc.tweens.add({ targets: up, v: 0, duration: 140, onUpdate: () => { lift = up.v; draw(); }, onComplete: () => {
      if (sh) sh.spr = sc.player; p.x = at.x; p.y = at.y; p.px = at.x * T + 8; p.py = at.y * T + 8; sc.placePlayer(); sc.player.setFrame(DIRS.indexOf(p.dir) * 4);
      sc.hopping = false; p.busy = 0; Sound.play('step', 1);
      const f = sc.fol; if (f) { const [dx, dy] = DV[p.dir], bx = at.x - dx, by = at.y - dy, ok = sc.passable(bx, by); f.x = ok ? bx : at.x; f.y = ok ? by : at.y; f.px = f.x * T + 8; f.py = f.y * T + 8; f.trail = []; f.moving = false; sc.drawFollower(); }
      if (at.x !== start.x || at.y !== start.y) sc.arriveHook && sc.arriveHook(p.x, p.y);
    } });
  };
  const land = () => {
    // come down on the last open tile along the way (back to where you started, if none)
    let at = null; for (let i = trail.length - 1; i > 0 && !at; i--) if (mtLandOk(sc, trail[i].x, trail[i].y)) at = trail[i];
    at = at || start;
    if (at.x === cur.x && at.y === cur.y) return finish(at);
    fly(at, 120 + 60 * Math.hypot(at.x - cur.x, at.y - cur.y), () => finish(at));
  };
  const step = () => {
    const want = mtInputDir(sc), back = want && DV[want][0] === -DV[dir][0] && DV[want][1] === -DV[dir][1]; if (want && !back) dir = want;   // steer, but no doubling back
    const [dx, dy] = DV[dir], nx = cur.x + dx, ny = cur.y + dy;
    if (steps >= max || nx < 0 || ny < 0 || nx >= sc.mw || ny >= sc.mh) return land();
    steps++; p.dir = dir; sc.player.setFrame(DIRS.indexOf(dir) * 4 + 1);
    fly({ x: nx, y: ny }, 190, () => { cur = { x: nx, y: ny }; trail.push(cur); step(); });
  };
  const up = { v: 0 }; sc.tweens.add({ targets: up, v: 9, duration: 140, onUpdate: () => { lift = up.v; draw(); }, onComplete: step });
}

/* ---------- Charge: bushes and small rocks are shoved aside as you go */
const MT_SMALL = /bush|rock|stump|pile|pebble|weed|log/;
function mtObstacle(sc, x, y) {
  if (typeof Farm !== 'undefined' && sc instanceof Farm) {
    if (typeof farm === 'undefined' || !farm) return null; const id = farm.occ[y * sc.mw + x]; if (id < 0 || id === undefined) return null;
    const d = farm.debris[id], D = d && DEBRIS[d.kind]; if (!D || D.tree || D.wide) return null; return { spr: sc.sprites && sc.sprites[id] };
  }
  const C = MT.charge && MT.charge.small; if (!C) return null; return C.get(y * sc.mw + x) || null;
}
function mtChargeStart(sc, m) {
  const dur = 3 + 3 * m.bond / 100, small = new Map(), W = sc.mw, H = sc.mh, farmHere = typeof Farm !== 'undefined' && sc instanceof Farm;
  if (!farmHere && sc.R && sc.R.deco) {
    const at = new Map(); for (const o of sc.children.list) if (o.type === 'Image') at.set(o.x + ',' + o.y, o);
    for (const d of sc.R.deco) {
      if (d.gate || d.tall || d.flat || !MT_SMALL.test(d.f || d.tex || '')) continue;
      const i = d.y * W + d.x; if (!sc.R.blocked[i]) continue;
      small.set(i, { spr: at.get((d.x * T + 8) + ',' + (d.y * T + 15)) });
    }
  }
  // where you can walk to now: you can charge through something only between two such places
  let reach = null;
  if (!farmHere) {
    reach = new Uint8Array(W * H); const q = [sc.p.y * W + sc.p.x]; reach[q[0]] = 1;
    while (q.length) { const c = q.pop(), x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, n = ny * W + nx; if (nx < 0 || ny < 0 || nx >= W || ny >= H || reach[n] || !sc.passable(nx, ny)) continue; reach[n] = 1; q.push(n); } }
  }
  const hadOwn = Object.prototype.hasOwnProperty.call(sc, 'passable'), orig = sc.passable;
  MT.charge = { t: dur, t0: dur, small, sc, hadOwn, orig };
  sc.passable = function (x, y) {
    if (orig.call(this, x, y)) return true;
    if (!MT.charge || x < 0 || y < 0 || x >= W || y >= H || !mtObstacle(this, x, y)) return false;
    if (farmHere) return true;
    const ok = (a, b) => a >= 0 && b >= 0 && a < W && b < H && reach[b * W + a];
    return (ok(x - 1, y) && ok(x + 1, y)) || (ok(x, y - 1) && ok(x, y + 1));
  };
  sc.stepsSafe = 999; Sound.play('chop', 0); mtPuff(sc, 0xc8b890); sc.cameras.main.shake(90, .002);
}
function mtChargeEnd() {
  const C = MT.charge; if (!C) return; MT.charge = null;
  const sc = C.sc; if (C.hadOwn) sc.passable = C.orig; else delete sc.passable;
  sc.stepsSafe = 3;
}
function mtShove(sc, o, x, y) {
  Sound.play(Math.random() < .5 ? 'rustle' : 'chop', 0); sc.cameras.main.shake(60, .0025); mtPuff(sc, 0x9a8a60);
  const s = o.spr; if (!s || !s.active || s.mtShoved) return; s.mtShoved = 1;
  const [dx] = DV[sc.p.dir], side = dx ? 0 : (Math.random() < .5 ? -1 : 1);
  sc.tweens.add({ targets: s, angle: (dx || side) * 16, x: s.x + (dx || side) * 3, duration: 110, yoyo: true, ease: 'Quad.out', onComplete: () => { s.mtShoved = 0; s.angle = 0; } });
}

/* ---------- the post on the farm, where your mount waits */
const MT_POST = { x: 60, y: 16 };
function mtPostSpot(sc, taken = []) {
  const near = (x, y) => taken.some(a => Math.abs(a.x - x) < 3 && Math.abs(a.y - y) < 2);
  const ok = (x, y) => !near(x, y) && sc._mtPass0.call(sc, x, y) && !(sc.p && sc.p.x === x && sc.p.y === y) && !(x === DOOR.x && y === DOOR.y) && !(S.tilled && S.tilled[x + ',' + y]) && !(S.paths && S.paths[x + ',' + y]) && !(typeof farm !== 'undefined' && farm && farm.dirtish[y * sc.mw + x]);
  for (let r = 0; r < 7; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = MT_POST.x + dx, y = MT_POST.y + dy; if (ok(x, y) && ok(x, y + 1)) return { x, y };
  }
  return null;
}
function mtPost(sc) {
  if (typeof Farm === 'undefined' || !(sc instanceof Farm)) return;
  const M = S && S.mt, ids = (M && M.list || []).map(m => m.id).filter(id => !(sc.rideKey && id === sc.rideId)), key = ids.join(',');
  const stb = M && M.stable && xaReady(sc, 'stb_stable') ? M.stable : null; stbDraw(sc, stb);
  const fullKey = key + (stb ? '@' + stb.cx + ',' + stb.by : '');
  if (sc.mtKey === fullKey) return;
  const need = ids.map(id => MOUNTS[id].sp).filter(sp => !sc.textures.exists('mon_' + sp));
  if (need.length) { if (!sc.mtWait) { sc.mtWait = 1; monFetchAll(sc, need).then(() => { sc.mtWait = 0; if (sc.sys && sc.sys.isActive() && sc.p) mtPost(sc); }); } return; }
  for (const o of sc.mtSprs || []) o.destroy(); sc.mtSprs = []; sc.mtAts = []; sc.mtKey = fullKey;
  sc._mtPass0 = sc._mtPass0 || Farm.prototype._mtPass;
  if (stb) {
    // each in its own stall, looking out over the half-door; the trough is drawn back over their feet
    (M.list || []).forEach((m, n) => {
      if (n >= STB_STALL.length || (sc.rideKey && m.id === sc.rideId)) return;
      const x = stb.cx * T + 8 + STB_STALL[n], y = (stb.by + 1) * T - 10 - (MOUNTS[m.id].stallUp || 0), tx = Math.round((x - 8) / T);
      const spr = sc.add.sprite(x, y, mtTackTex(sc, m.id), 0).setOrigin(.5, 1).setScale(.66 / MT_R).setDepth(stb.by * T + 15.4);
      spr.mid = m.id; spr.at = { x: tx, y: stb.by, id: m.id }; sc.mtSprs.push(spr);
      sc.tweens.add({ targets: spr, scaleY: { from: .66 / MT_R, to: .675 / MT_R }, duration: 1400 + n * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    return;
  }
  ids.forEach((id, n) => {
    const at = mtPostSpot(sc, sc.mtAts); if (!at) return; at.id = id; sc.mtAts.push(at);
    const tex = mtTackTex(sc, id), x = at.x * T + 8, y = at.y * T + 8 + 7;
    const spr = sc.add.sprite(x, y, tex, n % 2 ? 8 : 4).setOrigin(.5, 1).setScale(1 / MT_R).setDepth(y); spr.mid = id; spr.at = at;   // side on, so the saddle shows
    sc.mtSprs.push(spr, sc.add.ellipse(x, y - 1, 30, 9, 0x1a1206, .32).setDepth(1.5));
    sc.tweens.add({ targets: spr, scaleY: { from: 1 / MT_R, to: 1.02 / MT_R }, duration: 1400 + n * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });   // a slow breath
  });
}
/* ---------- the stable (the user's art): Granger had Robin build it; you choose where it stands, and can move it */
const STB_STALL = [-57, -28.5, 0, 28.5, 57], STB_DOOR = .715;   // where the half-doors' tops sit, down the picture   // stall middles, in px from the stable's middle
const stbFoot = (cx, by) => [cx - 6, by - 2, cx + 6, by];
const stbIn = (x, y) => { const b = S && S.mt && S.mt.stable; if (!b) return false; const [x0, y0, x1, y1] = stbFoot(b.cx, b.by); return x >= x0 && x <= x1 && y >= y0 && y <= y1; };
function stbBlock(b, v) { if (!b) return; const [x0, y0, x1, y1] = stbFoot(b.cx, b.by); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) farm.blocked[y * W + x] = v; }
function stbDraw(sc, b) {
  const key = b ? b.cx + ',' + b.by : '';
  if (sc.stbKey === key) return; sc.stbKey = key;
  for (const o of sc.stbObjs || []) o.destroy(); sc.stbObjs = []; sc.stbImg = null;
  if (!b) return;
  stbBlock(b, 1); sc.clearDebrisIn && sc.clearDebrisIn(...stbFoot(b.cx, b.by));
  const x = b.cx * T + 8, y = (b.by + 1) * T, d = b.by * T + 15;
  const im = sc.add.image(x, y, 'xa', 'stb_stable').setOrigin(.5, 1).setDepth(d); sc.stbImg = im; sc.stbObjs.push(im); if (sc.tall) sc.tall.push(im);
  // the half-doors and the trough again, in front of whoever's in the stalls: they look out over the doors
  const xt = sc.textures.get('xa');
  if (!xt.has('stb_doors')) { const f = HDW.xa.frames.stb_stable, top = Math.round(f.h * STB_DOOR); hdShrinkFrame(xt.add('stb_doors', 0, f.x, f.y + top, f.w, f.h - top), 3); }
  sc.stbObjs.push(sc.add.image(x, y, 'xa', 'stb_doors').setOrigin(.5, 1).setDepth(d + .8));
  // hay to one side, tack to the other
  const prop = (f, px, py, dd = 0) => { if (!xaReady(sc, f)) return; const o = sc.add.image(px, py, 'xa', f).setOrigin(.5, 1).setDepth(py + dd); sc.stbObjs.push(o); };
  prop('stb_hay2', x - 92, y - 18); prop('stb_hay', x - 90, y - 1); prop('stb_saddle', x + 92, y - 17); prop('stb_bucket', x + 88, y - 1);
  prop('stb_sign', x - 70, y + 14);
}
// the nearest clear spot to the house, to start the plot on
function stbFreeSpot() {
  const hard = (x, y) => { const k = x + ',' + y, i = y * W + x; return x < 3 || y < 3 || x > W - 4 || y > H - 4 || !!(S.tilled[k] || S.fences[k] || S.paths[k] || S.objs[k] || farm.waterish[i] || farm.dirtish[i] || farm.blocked[i]); };
  const ok = (cx, by) => { const [x0, y0, x1, y1] = stbFoot(cx, by); for (let y = y0; y <= y1 + 1; y++) for (let x = x0; x <= x1; x++) if (hard(x, y)) return false; return true; };
  const c0 = { cx: DOOR.x + 12, by: DOOR.y + 6 };
  for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (ok(c0.cx + dx, c0.by + dy)) return { cx: c0.cx + dx, by: c0.by + dy }; }
  return c0;
}
function stbPlace(moving) {
  const sc = scene, M = mtS(); if (!sc || !(sc instanceof Farm)) return toast('Go out onto your farm to choose where your stable goes.', 2400);
  closeModal(); const old = M.stable;
  if (old) stbBlock(old, 0);   // so it can move over its own old spot
  let done = false;
  sc.buildPreview({
    name: moving ? 'Move your stable' : 'Your stable', desc: 'Room for five mounts. Granger paid Robin to build it.', at: old ? { cx: old.cx, by: old.by } : stbFreeSpot(),
    areaFor: a => { const [x0, y0, x1, y1] = stbFoot(a.cx, a.by); return [x0, y0, x1, y1 + 1]; },
    ghostKey: 'xa', ghostFrame: 'stb_stable', ghostAt: a => [a.cx * T + 8, (a.by + 1) * T],
    cost: {}, gold: 0,
    onBuild: at => {
      done = true; M.stable = { cx: at.cx, by: at.by }; sc.stbKey = null; sc.mtKey = null; mtPost(sc); Sound.play('place'); save();
      toast(moving ? 'Your stable is in its new spot.' : '🐴 Your stable is up! Your mounts have moved in.', 3000);
    },
  });
  // cancelled: put the old one back as it was
  const chk = () => { if (done) return; if ($('buildbar') && $('buildbar').innerHTML && sc.paused) return setTimeout(chk, 300); if (old && !done) stbBlock(old, 1); };
  setTimeout(chk, 300);
}

// hook the farm: the post blocks its tile, and you can tap it or face it to open the stable
(function () {
  if (typeof Farm === 'undefined') return;
  const FP = Farm.prototype, pass = FP.passable, target = FP.targetAt, act = FP.act, face = FP.actFacing;
  FP._mtPass = pass;
  FP.passable = function (x, y) { if (this.mtAts && this.mtAts.some(a => a.x === x && a.y === y)) return false; return pass.call(this, x, y); };
  FP.targetAt = function (wx, wy) {
    for (const o of this.mtSprs || []) if (o.at && o.getBounds().contains(wx, wy)) return { type: 'mtpost', x: o.at.x, y: o.at.y, id: o.mid };
    const b = S.mt && S.mt.stable;
    if (b && this.stbImg && this.stbImg.getBounds().contains(wx, wy)) { const tx = Math.max(b.cx - 6, Math.min(b.cx + 6, Math.floor(wx / T))); return { type: 'mtpost', x: tx, y: b.by }; }
    return target.call(this, wx, wy);
  };
  FP.act = function (t) { if (t && t.type === 'mtpost') { if (this.p.busy > 0) { this.p.queued = t; return; } this.face(t.x, t.y); return mtOpen(true, t.id); } return act.call(this, t); };
  FP.actFacing = function () {
    const p = this.p; if (p && !p.moving && !this.paused) {
      const [dx, dy] = DV[p.dir], a = (this.mtAts || []).find(a => p.x + dx === a.x && p.y + dy === a.y); if (a) return this.act({ type: 'mtpost', x: a.x, y: a.y, id: a.id });
      if (stbIn(p.x + dx, p.y + dy)) return this.act({ type: 'mtpost', x: p.x + dx, y: p.y + dy });
    }
    return face.call(this);
  };
})();

/* ---------- the stable screen: your mounts, their stats, and feeding and brushing */
function mtMenuTile() { const M = S && S.mt; return M && (M.list.length || M.boots) ? [['mounts', M.list.length ? '🐏' : '👢', M.list.length ? 'Mounts' : 'Boots']] : []; }
function mtOpen(atPost, focus) {
  const M = mtS(); if (!M) return;
  if (atPost !== undefined) MT.atPost = !!atPost;
  const here = MT.atPost && scene && typeof Farm !== 'undefined' && scene instanceof Farm;
  const bar = (v, col) => `<div style="flex:1;height:10px;border-radius:5px;background:#0003;overflow:hidden"><div style="width:${v}%;height:100%;background:${col}"></div></div>`;
  const cols = { spd: '#e0743a', foot: '#7a9a3a', sta: '#3a8ad0', bond: '#d04a7a' };
  const cards = M.list.map(m => {
    const D = MOUNTS[m.id], P = MT_PERKS[D.perk], cur = m.id === (mtCur() || {}).id;
    const fedToday = m.fed === S.day, brushedToday = m.brushed === S.day;
    return `<div class="mtcard${cur && M.list.length > 1 ? ' cur' : ''}" id="mtc_${m.id}">
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${mtPic(m.id)}" style="width:84px;height:84px;object-fit:contain">
        <div style="flex:1;min-width:0"><b style="font-size:17px">${D.name}</b>${cur ? ' <span class="hint">(riding)</span>' : ''}<div class="hint" style="margin:2px 0 6px">${D.desc}</div></div>
      </div>
      ${MT_STATS.map(([k, n, why]) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0" title="${why}"><span style="width:64px">${n}</span>${bar(m[k], cols[k])}<b style="width:28px;text-align:right">${m[k]}</b></div>`).join('')}
      <p style="margin:8px 0 4px"><b>${P.icon} ${P.name}</b>: ${P.desc} <span class="hint">Uses ${mtPerkCost(m)} of ${mtMaxSt(m)} breath.</span></p>
      <div class="row" style="flex-wrap:wrap;gap:6px">
        ${M.list.length > 1 && !cur ? `<button class="btn" data-a="pick" data-d="${m.id}">Ride this one</button>` : ''}
        ${here ? `<button class="btn${fedToday ? '' : ' gold'}" data-a="feed" data-d="${m.id}" ${fedToday ? 'disabled' : ''}>🌾 ${fedToday ? 'Fed today' : 'Feed'}</button>
                  <button class="btn${brushedToday ? '' : ' gold'}" data-a="brush" data-d="${m.id}" ${brushedToday ? 'disabled' : ''}>🪮 ${brushedToday ? 'Brushed today' : 'Brush'}</button>` : ''}
      </div>
      ${here ? '' : `<p class="hint" style="margin:6px 0 0">Feed and brush it at the ${M.stable ? 'stable' : 'its post'} on your farm, once a day each, to build your Bond.</p>`}
    </div>`;
  }).join('');
  const boots = M.boots ? `<div class="mtcard" style="display:flex;align-items:center;gap:10px"><span style="font-size:30px">👢</span><div style="flex:1;min-width:0"><b>Running boots</b><div class="hint">From Warden Mabel. You walk 1.4 times as fast while you wear them.</div></div><button class="btn" data-a="boots">${M.bootsOff ? 'Put on' : 'Take off'}</button></div>` : '';
  const onFarm = scene && typeof Farm !== 'undefined' && scene instanceof Farm && HDW.xa;
  const stable = M.list.length && onFarm ? (M.stable ? `<div class="row" style="justify-content:center;margin-top:6px"><button class="btn" data-a="stbmove">Move the stable</button></div>`
    : `<div class="mtcard" style="display:flex;align-items:center;gap:10px"><span style="font-size:30px">🐴</span><div style="flex:1;min-width:0"><b>Your stable is ready</b><div class="hint">Granger paid Robin to build your mounts a stable. Choose where it goes.</div></div><button class="btn gold" data-a="stbplace">Place it</button></div>`) : '';
  const ride = (M.list.length ? `<div class="row" style="justify-content:center;margin-top:6px"><button class="btn gold" data-a="ride">${M.ride ? 'Get down' : 'Ride'}</button></div>` : '') + stable;
  openModal(here ? 'Stable' : 'Mounts', `<div id="mtList">${boots}${cards}</div>${ride}`, (a, d) => {
    const m = M.list.find(x => x.id === (d && d.d));
    if (a === 'boots') { M.bootsOff = M.bootsOff ? 0 : 1; mtOpen(); }
    if (a === 'pick' && m) { M.cur = m.id; if (scene) { scene.rideWant = null; if (scene.rideKey) mtApply(scene, true); } mtUI(true); mtOpen(); }
    if (a === 'feed' && m && m.fed !== S.day) { m.fed = S.day; mtRaise(m, 'bond', 3, true); Sound.play('pop', 0); toast(`${mtName(m.id)} munches happily. Bond +3`, 1800); mtCare(m.id); mtOpen(undefined, m.id); }
    if (a === 'brush' && m && m.brushed !== S.day) { m.brushed = S.day; mtRaise(m, 'bond', 3, true); Sound.play('pop', 1); toast(`${mtName(m.id)} leans into the brush. Bond +3`, 1800); mtCare(m.id); mtOpen(undefined, m.id); }
    if (a === 'ride') { closeModal(); mtToggle(); }
    if (a === 'stbplace') stbPlace(false);
    if (a === 'stbmove') stbPlace(true);
  });
  if (focus) { const el = $('mtc_' + focus); if (el) el.scrollIntoView({ block: 'nearest' }); }
}
// a little happy hop at the post
function mtCare(id) { const sc = scene, s = sc && (sc.mtSprs || []).find(o => o.mid === id); if (!s) return; sc.tweens.add({ targets: s, y: s.y - 5, duration: 120, yoyo: true, repeat: 1 }); }

/* ---------- the buttons: saddle (get on and off) and the perk, with a breath ring */
function mtButtons() {
  if ($('mtRide')) return;
  const st = document.createElement('style');
  st.textContent = `.mtb{position:absolute;width:54px;height:54px;border-radius:50%;background:var(--cream);border:3px solid var(--gold2);box-shadow:0 3px 0 rgba(0,0,0,.35),inset 0 0 0 3px #fff1c6;display:none;align-items:center;justify-content:center;padding:0;font-size:26px;line-height:1;color:#5a3a1a;-webkit-user-select:none;user-select:none;touch-action:manipulation}
  .mtcard{box-sizing:border-box;width:100%;padding:10px;margin:8px 0;border-radius:10px;background:rgba(90,60,20,.08);border:2px solid rgba(90,60,20,.18)}
  .mtcard.cur{border-color:var(--gold2)}
  .mtb img{width:40px;height:40px;object-fit:contain;pointer-events:none}
  .mtb.on{background:#ffe9a8;border-color:#c98a1a}
  .mtb:active{transform:translateY(2px)}
  #mtPerk{--p:100}
  #mtPerk::before{content:'';position:absolute;inset:-7px;border-radius:50%;background:conic-gradient(#3a8ad0 calc(var(--p)*1%),#0002 0);-webkit-mask:radial-gradient(circle,transparent 30px,#000 31px);mask:radial-gradient(circle,transparent 30px,#000 31px)}
  #mtPerk.on::before{background:conic-gradient(#ffb020 calc(var(--p)*1%),#0002 0)}
  #mtPerk.low{filter:grayscale(.7);opacity:.75}
  body.ctlEdit .mtb{display:none !important}`;
  document.head.appendChild(st);
  const host = $('actBtn').parentElement;
  for (const [id, title, fn] of [['mtRide', 'Ride (R)', mtToggle], ['mtPerk', 'Perk (F)', mtPerk]]) {
    const b = document.createElement('button'); b.id = id; b.className = 'mtb'; b.title = title;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    host.appendChild(b);
  }
  window.addEventListener('keydown', e => {
    if (!S || !scene || $('modal').classList.contains('show') || (typeof Talk !== 'undefined' && Talk.open) || /INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'r' || e.key === 'R') mtToggle();
    if (e.key === 'f' || e.key === 'F') mtPerk();
  });
  window.addEventListener('resize', () => mtUI(true));
}
function mtUI(force) {
  const rb = $('mtRide'), pb = $('mtPerk'); if (!rb) return;
  const sc = scene, M = S && S.mt, m = mtCur(), out = !!(sc && m && mtOutdoor(sc));
  rb.style.display = out ? 'flex' : 'none'; pb.style.display = out && sc.rideKey ? 'flex' : 'none';
  if (!out) return;
  const D = MOUNTS[m.id], riding = !!sc.rideKey;
  if (force || rb.dataset.k !== m.id + riding) {
    rb.dataset.k = m.id + riding; rb.classList.toggle('on', riding);
    const ic = HD[D.sp] && HD[D.sp].i ? mtPic(m.id, 'icon') : '';
    rb.innerHTML = ic ? `<img src="${ic}">` : '🐏'; rb.title = riding ? 'Get down (R)' : `Ride ${mtName(m.id)} (R)`;
    pb.textContent = MT_PERKS[D.perk].icon; pb.title = MT_PERKS[D.perk].name + ' (F)';
  }
  const act = MT.boost > 0 ? MT.boost / MT.boostMax : MT.mom ? MT.mom.t / MT.mom.t0 : MT.charge ? MT.charge.t / MT.charge.t0 : 0;
  pb.style.setProperty('--p', Math.round(100 * (act || MT.st / mtMaxSt(m)))); pb.classList.toggle('low', !act && MT.st < mtPerkCost(m)); pb.classList.toggle('on', !!act);
  // sit them beside the action button (wherever you've moved it), or bottom right without one
  const a = $('actBtn').getBoundingClientRect(), touch = a.width > 0;
  const right = touch ? innerWidth - a.left + 14 : 18, bottom = touch ? innerHeight - a.top - 10 : 110;
  rb.style.right = right + 'px'; rb.style.bottom = bottom + 'px';
  pb.style.right = (touch ? innerWidth - a.right + 8 : 18) + 'px'; pb.style.bottom = (touch ? innerHeight - a.top + 16 : 176) + 'px';
}

/* ---------- hooks: each place checks gifts and puts you back in the saddle; each frame keeps it all in step */
(function () {
  const WP = World.prototype, mk = WP.makePlayer, upd = WP.update, sw = WP.swing;
  WP.makePlayer = function (sp) {
    if (MT.charge) mtChargeEnd(); MT.boost = 0; MT.mom = null;
    this.rideKey = null; this.rideWant = null; this.hopping = false; this.mtSprs = null; this.mtAts = null; this.mtKey = null; this.stbKey = null; this.stbObjs = null; this.stbImg = null;
    mk.call(this, sp);
    try { mtButtons(); mtGifts(this); mtPost(this); } catch (e) { console.warn('mounts', e); }
  };
  WP.update = function (time, dms) {
    upd.call(this, time, dms);
    const M = S && S.mt; if (!M || !this.p || !this.player) return;
    const m = mtCur();
    const want = !!(m && M.ride && mtOutdoor(this));
    if (want !== !!this.rideKey && this.rideWant !== want && !this.hopping && !(this.p.busy > 0)) { this.rideWant = want; mtApply(this, want); }
    // your look changed: the rider changes with it
    if (this.rideKey && m && (MT.cache['ride:' + m.id] || {}).img !== this.textures.get('walk').getSourceImage()) mtApply(this, true);
    const dt = Math.min(.05, dms / 1000);
    if (m) MT.st = Math.min(mtMaxSt(m), MT.st + dt * (this.rideKey ? 9 : 14));
    if (MT.boost > 0) { MT.boost -= dt; if (this.p.moving && Math.random() < .35) mtPuff(this, 0x8ac8ff); }
    if (MT.mom) { const mm = MT.mom; mm.t -= dt; if (this.p.moving) { mm.idle = 0; mm.ramp = Math.min(.6, mm.ramp + dt * mm.rate); } else if ((mm.idle = (mm.idle || 0) + dt) > .25) mm.ramp = 0; if (mm.t <= 0) MT.mom = null; }
    if (MT.charge) { MT.charge.t -= dt; this.stepsSafe = 999; if (MT.charge.t <= 0 || !this.rideKey) mtChargeEnd(); }
    MT.uiT -= dms; if (MT.uiT <= 0) { MT.uiT = 150; mtUI(); }
  };
  // tools need both hands: hop down first
  if (sw) WP.swing = function (...a) { if (this.rideKey && S.mt) { S.mt.ride = 0; mtApply(this, false); this.rideWant = null; mtUI(true); } return sw.apply(this, a); };
})();
