/* ============================================================ Town maps (18 Nov 2026)
   In a town, the Map opens on a map of that town: a live picture of it taken from the game itself (so repairs,
   the season and the time of day are as they are now), every building labelled, and live markers for you and
   the town's key people. Inside a town's building you get the last picture taken of it. "World map" switches over. */
const TOWN_PARENT = { bhgym: 'brookholt', qdpit: 'quarrydown', brlight: 'beaconreach', hmmill: 'highmoor' };
const TOWN_KEYS = ['town', 'brookholt', 'quarrydown', 'driftwood', 'beaconreach', 'highmoor', 'elderwood'];
const TOWN_SNAP = {};   // key -> { url, w, h } (tiles)
const townNameOf = k => k === 'town' ? 'Smallroot' : (ROUTES[k] && ROUTES[k].name) || k;
// the key people, by sprite texture, with how they're named on the map
const TM_PEOPLE = { npc_bramble: 'Elder Bramble', npc_marigold: 'Marigold', tr_delphine: 'Warden Delphine', tr_granger: 'Warden Granger', tr_orrin: 'Warden Orrin',
  tr_tamsin: 'Warden Tamsin', tr_alder: 'Warden Alder', tr_isolde: 'Warden Isolde', npc_shipwright: 'Hal the shipwright', tr_tansy: 'Tansy', tr_dunn: 'Gaffer Dunn',
  tr_stroud: 'Haulmaster Stroud', tr_brask: 'Brask', npc_rowan: 'Rowan' };
function tmPeople(sc) {
  const out = [];
  if (sc.npcs && sc.scene.key === 'town') for (const n of sc.npcs) {
    const name = n.id === 'bramble' ? 'Elder Bramble' : n.id === 'marigold' ? 'Marigold' : (VILL[n.id] && VILL[n.id].name) || n.id;
    out.push({ name, x: n.spr.x / T, y: n.spr.y / T, inside: !!n.home, pic: n.id === 'bramble' || n.id === 'marigold' ? null : VPIC[n.id + '0'] });
  } else for (const o of sc.children.list) {
    if (o.type !== 'Sprite' || !o.texture || !TM_PEOPLE[o.texture.key] || o === sc.player) continue;
    out.push({ name: TM_PEOPLE[o.texture.key], x: o.x / T, y: o.y / T, inside: !o.visible });
  }
  return out;
}
const tmShort = n => n.replace(/^(Smallroot|Brookholt|Elderwood|Highmoor|Quarrydown|Beaconreach) /, '').replace(/^The /, '').replace(/^Warden's /, "Warden's ").replace(/ house$/i, '').slice(0, 16);
function tmBuildings(key) {
  const list = key === 'town' ? Object.entries(BUILDINGS).map(([id, b]) => ({ ...b, id, atlas: 'town', name: (typeof isOpen === 'function' && !isOpen(id) && id !== 'bramble' && id !== 'derby' ? '🔨 ' : '') + b.name })) : (ROUTES[key].buildings || []);
  return list.map(b => { const J = ASSET[(b.atlas || 'town') + 'Json'], F = J && J.frames[b.frame] && J.frames[b.frame].frame; const h = F ? F.h : 64;
    return { name: b.name, short: tmShort(b.name), x: b.cx + .5, y: b.by + 1 - Math.min(h / 16, 7) * .55 }; });
}
// take the picture: frame the whole town in the camera for one frame, with the moving people hidden
function tmSnap(sc, done) {
  const cam = sc.cameras.main, B = cam._bounds, bx = B.x, by = B.y, bw = B.width, bh = B.height;
  if (!bw || !bh || !sc.game.renderer.snapshot) return done(null);
  const was = { zoom: cam.zoom, sx: cam.scrollX, sy: cam.scrollY, follow: cam._follow, lx: cam.lerp.x, ly: cam.lerp.y, rp: cam.roundPixels }, hid = [];
  for (const o of sc.children.list) if (o.visible && o.type === 'Sprite' && o.texture && /^(npc_|tr_|walk|farmer|mon_|an_)/.test(o.texture.key)) { hid.push(o); o.setVisible(false); }
  if (sc.syncShadows) sc.syncShadows();
  cam.stopFollow(); cam.setBounds(); const z = Math.min(cam.width / bw, cam.height / bh); cam.setZoom(z); cam.centerOn(bx + bw / 2, by + bh / 2);
  sc.game.events.once('postrender', () => sc.game.renderer.snapshot(img => {
    for (const o of hid) if (o.active) o.setVisible(true); if (sc.syncShadows) sc.syncShadows();
    cam.setBounds(bx, by, bw, bh); cam.setZoom(was.zoom); cam.setScroll(was.sx, was.sy); if (was.follow && was.follow.active) cam.startFollow(was.follow, was.rp, was.lx, was.ly);
    try {
      const k = img.width / cam.width, mw = bw * z * k, mh = bh * z * k, c = document.createElement('canvas');
      c.width = Math.round(mw); c.height = Math.round(mh);
      c.getContext('2d').drawImage(img, (img.width - mw) / 2, (img.height - mh) / 2, mw, mh, 0, 0, mw, mh);
      done({ url: c.toDataURL('image/jpeg', .86), w: bw / T, h: bh / T });
    } catch (e) { console.warn('townmap', e); done(null); }
  }));
}
let tmTimer = null, tmZoom = 2.2;
function openTownMap(key, live) {
  const P = TOWN_SNAP[key]; if (!P) return false;
  const B = tmBuildings(key);
  const render = () => `<div class="tmtabs"><button class="btn gold">🏘️ ${townNameOf(key)}</button><button class="btn" data-a="world">🗺️ World map</button><button class="btn sm" data-a="zoom">${tmZoom > 1 ? '➖' : '➕'}</button></div>
    <div class="tmwrap" style="${tmZoom > 1 ? "" : "height:auto"}"><div class="tmap" style="width:${tmZoom * 100}%"><img src="${P.url}" alt="">${B.map((b, i) => `<button class="tmlbl" data-a="b" data-i="${i}" style="left:${100 * b.x / P.w}%;top:${100 * b.y / P.h}%">${b.short}</button>`).join('')}<div id="tmLive"></div></div></div>
    <div id="tmInfo" class="hint">${live ? 'You are the <b style="color:#d03a2a">red</b> marker. The other markers are the town\'s key people, where they are right now.' : 'You\'re indoors: this is the town as you last saw it.'}</div><div id="tmWho" class="tmwho"></div>`;
  const tick = () => {
    const L = $('tmLive'); if (!L) return stop();
    const sc = scene, here = live && sc && sc.scene && sc.scene.key === key;
    let h = '';
    if (here && sc.player) h += `<i class="tmme" style="left:${100 * sc.player.x / T / P.w}%;top:${100 * (sc.player.y / T - .5) / P.h}%"></i>`;
    const ppl = here ? tmPeople(sc) : [];
    for (const p of ppl) h += `<i class="tmnpc ${p.inside ? 'in' : ''}" style="left:${100 * p.x / P.w}%;top:${100 * (p.y - .5) / P.h}%" title="${p.name}"><b>${p.name.split(' ').slice(-1)[0]}</b></i>`;
    L.innerHTML = h;
    const W = $('tmWho'); if (W) W.innerHTML = ppl.length ? ppl.map(p => `<span>${p.pic ? `<img src="${p.pic}">` : '•'} ${p.name}${p.inside ? ' <small>(indoors)</small>' : ''}</span>`).join('') : '';
  };
  const stop = () => { if (tmTimer) clearInterval(tmTimer); tmTimer = null; };
  openModal('Map', render(), (a, d) => {
    if (a === 'world') { stop(); return _tmWorld(); }
    if (a === 'zoom') { tmZoom = tmZoom > 1 ? 1 : 2.2; $('mBody').innerHTML = render(); tick(); setTimeout(centre, 30); return; }
    if (a === 'b') { const b = B[+d.i]; $('tmInfo').innerHTML = `<b>${b.name}</b>`; }
  }, stop);
  const centre = () => { const Wr = document.querySelector('.tmwrap'), sc = scene; if (!Wr || !live || !sc || !sc.player) return; const M = Wr.firstElementChild; Wr.scrollLeft = sc.player.x / T / P.w * M.offsetWidth - Wr.clientWidth / 2; Wr.scrollTop = sc.player.y / T / P.h * M.offsetHeight - Wr.clientHeight / 2; };
  tick(); stop(); tmTimer = setInterval(tick, 400); setTimeout(centre, 30);
  return true;
}
// the Map: in a town (or one of its buildings), start with the town map
const _tmWorld = openMap;
openMap = function () {
  const sc = scene, k0 = sc && sc.scene && sc.scene.key, key = TOWN_KEYS.includes(k0) ? k0 : TOWN_PARENT[k0];
  if (!key) return _tmWorld.apply(this, arguments);
  if (key === k0) { if (sc.paused === undefined) {} tmSnap(sc, P => { if (P) TOWN_SNAP[key] = P; if (!openTownMap(key, true)) _tmWorld(); }); return; }
  if (!openTownMap(key, false)) _tmWorld.apply(this, arguments);
};
