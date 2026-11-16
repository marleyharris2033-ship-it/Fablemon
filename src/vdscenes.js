/* ============================================================ Verdance cutscenes
   Two kinds (the user asked for short cutscenes that keep you informed, 16 Nov 2026):
   · In-game moments: black bars slide in, the camera moves to show what's happening, a few lines, then back to you.
     Used at the big beats of the quest lines in vdquests.js (the flood, Brask and the drill, the rig going dark,
     Tamsin and the council).
   · "Meanwhile, at the Spire": a short cutaway to Verdance HQ, played the morning after a big win, so you always
     know what they're planning. Silas Thorne (CEO), Morwenna Vale (Director of Acquisitions: she runs Greenline,
     and she is the sinister one), Gleam and Dr Ash.
   Art: the user's Verdance pack, cut by tools/art/cut_vdpack.py (hd_world/vq atlas, hd/cs_office, hd/cs_spire).
   Ms Vale has no art yet: her portrait is a figure in shadow until it arrives. */

/* ---------- the vq atlas (quest props and icons) */
const _vsLoad = hdWorldLoad;
hdWorldLoad = function (loader, snow) {
  _vsLoad(loader, snow);
  if (HDW.vq) loader.atlas('vq', HDW.vq.img, { frames: Object.fromEntries(Object.entries(HDW.vq.frames).map(([k, f]) => [k, { frame: f }])) });
};
const _vsSwap = hdWorldSwap;
hdWorldSwap = function (sc) { _vsSwap(sc); const t = sc.textures.exists('vq') && sc.textures.get('vq'); if (t && !t._shrunk) { hdShrinkTexture(t, 3); t._shrunk = 1; } };
const VS_ICON = {};
function vqIcon(name) {
  if (VS_ICON[name]) return VS_ICON[name];
  const tx = scene && scene.textures.exists('vq') && scene.textures.get('vq'); if (!tx) return '';
  const fr = tx.get(name), c = document.createElement('canvas'); c.width = fr.cutWidth; c.height = fr.cutHeight;
  c.getContext('2d').drawImage(tx.getSourceImage(), fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
  const u = c.toDataURL(); HD_SMOOTH.add(u); return (VS_ICON[name] = u);
}
const vqImg = (name, w = 120) => { const u = vqIcon(name); return u ? `<div style="text-align:center"><img src="${u}" style="width:${w}px;image-rendering:auto"></div>` : ''; };

/* ---------- the pieces of a cutscene */
(function () {
  const st = document.createElement('style');
  st.textContent = `#csBars i{position:fixed;left:0;right:0;height:11vh;background:#000;z-index:31;pointer-events:none;transition:transform .5s ease}
  #csBars i.t{top:0;transform:translateY(-100%)}#csBars i.b{bottom:0;transform:translateY(100%)}#csBars.on i{transform:none}
  #csAway{position:fixed;inset:0;z-index:43;background:#000 center/cover no-repeat;opacity:0;transition:opacity .7s;display:none}
  #csAway.on{opacity:1}#csAway b{position:absolute;left:0;right:0;top:max(12vh,env(safe-area-inset-top));text-align:center;color:#d9f5b0;font:700 18px var(--pix,system-ui);letter-spacing:1px;text-shadow:0 2px 0 #000,0 0 12px rgba(140,204,60,.6);opacity:0;transition:opacity .8s .3s}
  #csAway.on b{opacity:1}#csAway small{display:block;margin-top:6px;font-size:13px;color:#b8c8a8}
  #csCap{position:fixed;inset:0;z-index:43;background:#000;display:none;align-items:center;justify-content:center;color:#fbf3d9;font:700 18px var(--pix,system-ui);opacity:0;transition:opacity .6s}
  #csCap.on{opacity:1}`;
  document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend', '<div id="csBars"><i class="t"></i><i class="b"></i></div><div id="csAway"><b></b></div><div id="csCap"></div>');
})();
const csWait = ms => new Promise(r => setTimeout(r, ms));
const csSay = lines => new Promise(r => Talk.say(lines, r));
function csBars(on) { $('csBars').classList.toggle('on', !!on); }
function csPan(sc, x, y, ms = 900) {
  return new Promise(r => { const cam = sc.cameras.main; cam.stopFollow(); cam.pan(x, y, ms, 'Sine.easeInOut', false, (c, p) => { if (p === 1) r(); }); });
}
async function csBack(sc, ms = 700) {
  const cam = sc.cameras.main, p = sc.player; if (!p) return;
  await csPan(sc, p.x, p.y - 8, ms); cam.startFollow(p, true, 1, 1);
}
async function csCaption(text, ms = 1600) {
  const c = $('csCap'); c.textContent = text; c.style.display = 'flex'; await csWait(30); c.classList.add('on');
  await csWait(ms); c.classList.remove('on'); await csWait(650); c.style.display = 'none';
}
// a whole in-game moment: bars in, run the steps, bars out, camera back
async function csMoment(sc, run) {
  sc.paused = true; csBars(true); await csWait(450);
  try { await run(); } catch (e) { console.warn('cutscene', e); }
  await csBack(sc); csBars(false); await csWait(300); sc.paused = false;
}
const csFlicker = (sc, im, n = 4) => new Promise(r => { let i = 0; sc.time.addEvent({ delay: 160, repeat: n * 2 - 1, callback: () => { i++; if (im.active) (i % 2 ? im.setTint(0x555555) : im.clearTint()); if (i >= n * 2) r(); } }); });

/* ---------- Meanwhile, at the Spire */
const VS = {
  thorne: (t, f = 0) => ({ who: 'trainer', name: 'Silas Thorne', img: trainerPic('thorne', f), t }),
  vale: (t, f = 0) => ({ who: 'trainer', name: 'Morwenna Vale', img: trainerPic('vale', f), t }),
  gleam: (t, f = 0) => ({ who: 'trainer', name: 'Tobias Gleam', img: trainerPic('gleam', f), t }),
  ash: (t, f = 0) => ({ who: 'trainer', name: 'Dr Corvin Ash', img: trainerPic('ash', f), t }),
  news: t => ({ who: 'trainer', name: 'City News', img: '', t }),
};
const CUTAWAYS = [
  { id: 'greenline', when: () => (vq().gl || 0) >= 3, bg: 'spire', lines: () => [
    VS.gleam("Ms Vale. A small thing. Barely worth mentioning. The farmer may have... found one of my business cards.", 1),
    VS.vale("You dropped it. Of course you did."),
    VS.vale("It doesn't matter, Tobias. Every field in that valley is already ours. Every field but one."),
    VS.gleam("Shall I, ah, make them another offer?", 1),
    VS.vale("Be charming. Be patient. And if charming doesn't work, there are other departments.", 1)] },
  { id: 'fen', when: () => vdShut('fen'), lines: () => [
    VS.gleam("Mr Thorne. Sluice Fen. There was an incident. Someone opened the old locks and our intake was, er... drowned.", 1),
    VS.thorne("Drowned."),
    VS.thorne("Raise the offer on the farm, Tobias. Sixty thousand. Everyone has a price."),
    VS.vale("And if they don't, everyone has a weakness. Leave the farmer to me, Silas. I like the stubborn ones.", 1)] },
  { id: 'mine', when: () => vdShut('mine'), lines: () => [
    VS.ash("The Old Mine drill has stopped. Brask reports it 'seized'. Brask has also stopped reporting."),
    VS.vale(vd().brask === 'keep' ? "Brask kept a notebook. Did you know? It's with the Warden of Smallroot now. Such a pity." : "Brask kept a notebook, you know. He thinks nobody knew. I'll make sure he remembers I did.", 1),
    VS.thorne("Find out who this farmer is, Corvin. Everything."),
    VS.vale("Already done. Their gran refused us for twenty years. The grandchild is just as stubborn.", 0),
    VS.vale("How sweet.", 1)] },
  { id: 'rig', when: () => vdShut('rig'), lines: () => [
    VS.news("...and Verdance's Stormwatch rig has gone dark. Fishermen say the strait is calm for the first time this year..."),
    VS.gleam("The papers are calling us 'the company that upset the whale', sir.", 1),
    VS.thorne("Three sites. Three. Shut down by one farmer with a backpack.", 1),
    VS.vale("Let them have their little victories, Silas. Corvin, tell him about Taproot.", 1),
    VS.ash("Gladly. Though I'd rather show him.", 1)] },
  { id: 'tower', when: () => vdShut('tower'), lines: () => [
    VS.ash("The tower is down. It no longer matters. Every hearthtree in that valley drinks from one source."),
    VS.ash("Drill there, and we don't need siphons at all. We take the whole Rootweave at once. Taproot."),
    VS.thorne("Where?"),
    VS.vale("Under Smallroot, Silas. Under the Hearthroot.", 0),
    VS.vale("Right beneath that farmer's feet.", 1),
    VS.thorne("Then let's begin.", 1)] },
];
async function playCutaway(c) {
  const el = $('csAway'), seen = vd().cs = vd().cs || {}, first = !seen._vale;
  seen[c.id] = S.day; seen._vale = 1;
  const show = async (bg, title, sub) => { el.style.backgroundImage = `linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.45)),url(${(HD.cs || {})[bg] || ''})`; el.querySelector('b').innerHTML = title + (sub ? `<small>${sub}</small>` : ''); el.style.display = 'block'; await csWait(30); el.classList.add('on'); };
  if (scene) scene.paused = true;
  if (c.bg === 'spire' || first) { await show('spire', 'Meanwhile, in the city...', 'The Spire · Verdance Energy HQ'); await csWait(2200); el.classList.remove('on'); await csWait(700); }
  await show('office', 'Meanwhile, at the Spire...', first ? 'Morwenna Vale · Director of Acquisitions' : '');
  await csWait(900);
  await csSay(c.lines());
  el.classList.remove('on'); await csWait(700); el.style.display = 'none';
  if (scene) scene.paused = false;
  save();
}
// one a morning: the earliest one that's due and unseen
const csDue = () => S && S.vd && CUTAWAYS.find(c => !(vd().cs || {})[c.id] && c.when());
const _vsHouse = House.prototype.create;
House.prototype.create = function () {
  _vsHouse.call(this);
  const c = csDue(); if (!c || S.time > 9 * 60) return;
  this.time.delayedCall(1100, () => { if (!Talk.open && !$('modal').classList.contains('show')) playCutaway(c); });
};

/* ---------- in-game moments for the quest lines (vdquests.js calls these) */
// 2. the flood: follow the water into the siphon, the pump chokes, Pell comes running
async function csFlood(sc) {
  const site = (VD_POS[sc.scene.key] || []).find(o => o.k === 'site'), im = site && sc.vdSpr[site.idx], t = (sc.trainers || []).find(x => x.id === 'vd_fen_boss');
  await csMoment(sc, async () => {
    if (im) {
      await csPan(sc, im.x, im.y - 20, 1100);
      for (let i = 0; i < 30; i++) { const p = sc.add.circle(im.x + (Math.random() - .5) * 60, im.y - 40 - Math.random() * 20, 2.5, 0x8fd0ff, .9).setDepth(9e6); sc.tweens.add({ targets: p, y: im.y - 4, alpha: 0, duration: 700 + Math.random() * 900, delay: Math.random() * 600, onComplete: () => p.destroy() }); }
      await csSay([vdSys('With a roar, the old channels fill, and water floods down into the siphon\'s intake!')]);
      sc.cameras.main.shake(600, .007); Sound.play('thud'); await csFlicker(sc, im, 3);
      await csSay([vdSys('The pump chokes, coughs and sputters. Somewhere a siren starts to wail...')]);
    }
    if (t && t.spr) {
      await csPan(sc, t.spr.x, t.spr.y - 16, 700);
      const mark = sc.add.text(t.spr.x, t.spr.y - 34, '!', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '15px', color: '#ffe35a', stroke: '#2a1e1a', strokeThickness: 3, resolution: 12 }).setOrigin(.5).setDepth(9e6);
      sc.tweens.add({ targets: t.spr, y: t.spr.y - 5, yoyo: true, repeat: 1, duration: 140 }); Sound.play('encounter');
      await csWait(800); mark.destroy();
    }
  });
}
// 3. Brask and the drill: he looks at it for a long moment
async function csBrask(sc, lines) {
  const site = (VD_POS[sc.scene.key] || []).find(o => o.k === 'site'), im = site && sc.vdSpr[site.idx], t = (sc.trainers || []).find(x => x.id === 'vd_brask');
  await csMoment(sc, async () => {
    if (t && t.spr && im) t.spr.setFrame(DIRS.indexOf(im.x < t.spr.x - 8 ? 'left' : im.x > t.spr.x + 8 ? 'right' : im.y < t.spr.y ? 'up' : 'down') * 4);
    if (im) await csPan(sc, (im.x + (t ? t.spr.x : im.x)) / 2, im.y - 16, 1000);
    await csWait(500);
    await csSay(lines);
  });
}
// 4. the rig: its lights die one by one, and far off the lamp at Beaconreach flares back up
async function csRig(sc) {
  const site = (VD_POS[sc.scene.key] || []).find(o => o.k === 'site'), im = site && sc.vdSpr[site.idx];
  await csMoment(sc, async () => {
    if (im) { await csPan(sc, im.x, im.y - 30, 900); sc.cameras.main.shake(500, .006); await csFlicker(sc, im, 4); im.setTint(0x6a6a6a); }
    await csSay([vdSys('The deck lights flicker and die, one by one. The drill shudders to a stop.'), vdSys('Far away to the north, the great lamp at Beaconreach flares back to full brightness.')]);
  });
}
// 5. Tamsin runs the petition down to the council
async function csCouncil() {
  await csCaption('An hour later...', 1500);
}
