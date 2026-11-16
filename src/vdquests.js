/* ============================================================ Verdance quest lines (the user asked for bespoke quests, 16 Nov 2026)
   1. Who bought the valley?  Marigold → Gleam's kiosk → Elder Bramble. Greenline Holdings is Verdance.
   2. Grey water.             Nurse Willa → a sample from the grey pool in Sluice Fen → Willa → Warden Delphine →
                              the three old lock wheels, turned in her order, flood the siphon's intake and bring Pell out.
   3. Brask's notebook.       Three torn pages in the Old Mine. Beat Brask, then hand them back (or keep them for Rowan)
                              for the drill's override key.
   4. Lights out.             Orrin's lamp dims while the rig pumps → Hal builds a boarding ladder → board the rig and cut
                              its three valve lines (highest pressure first) before Rig Chief Dunmore catches you.
   5. The petition.           Tamsin starts a petition to revoke the tower's permit → 12 names from friends, Wardens and
                              townsfolk across the valley → Tamsin → the revocation gets you a hearing with Dr Ash.
   Each step is a task on Bramble's list. Saves that already shut a site skip that site's steps (with no reward).
   State: S.vd.q = { gl, fen, wheels, flooded, pages via S.vd.memos, mineKey, rig, ladder, valves, tow, sig: {} }
   Hooks in verdance.js: vqDoor (the pool and wheels), vqBossTalk, vqSiteTalk. */
const vq = () => (vd().q = vd().q || { sig: {} });
const vqSay = (who, name, img) => (t, f = 0) => ({ who, name, img: typeof img === 'function' ? img(f) : img, t });
const VQ = {
  bramble: (t, f = 1) => ({ who: 'bramble', t, f }),
  marigold: (t, f = 1) => ({ who: 'marigold', t, f }),
  willa: (t, f = 0) => ({ who: 'willa', name: VILL.willa.name, img: VPIC['willa' + f], t }),
  gleam: (t, f = 0) => ({ who: 'trainer', name: 'Tobias Gleam', img: trainerPic('gleam', f), t }),
  delphine: (t, f = 0) => ({ who: 'trainer', name: 'Warden Delphine', img: trainerPic('delphine', f), t }),
  pell: (t, f = 0) => ({ who: 'trainer', name: 'Site Supervisor Pell', img: trainerPic('vtech2', f), t }),
  brask: (t, f = 0) => ({ who: 'trainer', name: 'Foreman Brask', img: trainerPic('brask', f), t }),
  orrin: (t, f = 0) => ({ who: 'trainer', name: 'Warden Orrin', img: trainerPic('orrin', f), t }),
  hal: (t, f = 0) => ({ who: 'hal', name: 'Hal the Shipwright', img: VPIC['hal' + f], t }),
  dunmore: (t, f = 0) => ({ who: 'trainer', name: 'Rig Chief Dunmore', img: trainerPic('vtech2', f), t }),
  tamsin: (t, f = 0) => ({ who: 'trainer', name: 'Warden Tamsin', img: trainerPic('tamsin', f), t }),
  ash: (t, f = 0) => ({ who: 'trainer', name: 'Dr Ash', img: trainerPic('ash', f), t }),
};
// a step is live when it's ready and not done, whichever task the HUD is showing
const vqStep = id => { const q = QUESTS.find(x => x.id === id); return !!(q && S && S.vd !== undefined && !q.done() && q.ready()); };
const vqPages = () => ['bpage1', 'bpage2', 'bpage3'].filter(id => vd().memos[id]).length;
const VQ_LADDER = { wood: 60, fiber: 40, stone: 20 };
const VQ_SIGS = 12;
const vqWardens = () => Object.keys(S.crests || {}).filter(k => k !== 'gale' && k !== 'hearth').length;
const vqSigCount = () => Object.keys(vq().sig || {}).length + vqWardens();

/* ---------- the papers you pick up along the way (they show in Files) */
Object.assign(VD_MEMOS, {
  glcard: { title: 'Business card', from: 'Dropped by Tobias Gleam', body: `<b>GREENLINE HOLDINGS LTD</b>
Land · Leases · Long-term partnerships

Registered office: Level 40, The Spire, City

<small>On the back, in pencil: "Parcels 1–41 done. Wild Roots still holding out. – T."</small>` },
  bpage1: { title: "Brask's notebook, page 1", from: 'R. Brask', body: `Day 12. Drill's in. Lads are glad of the work. Overtime till spring, Ash says.

Day 19. Found a seam of blue crystal. Pretty. It hums when the drill's running. Never heard rock hum before.

Locked the override key on my belt like head office wants. Nobody switches off my drill but me.` },
  bpage2: { title: "Brask's notebook, page 2", from: 'R. Brask', body: `Day 27. The Clinkits have stopped coming down to the lamps. They used to sit on my boots at lunch.

Day 30. Asked Ash what the drill's actually for. He laughed. "Energy, Mr Brask. What else is there?"

Day 33. Wrote to my sister. Told her I'm proud of the work. Tore it up.` },
  bpage3: { title: "Brask's notebook, page 3", from: 'R. Brask', body: `Day 58. Someone's been switching off our sites. A farmer, they say. A kid with a jam jar.

If they come down here, I'll have to fight them. That's the job.

But if they win... I hope they ask me for the key. I don't think I could say no.` },
  valves: { title: 'Valve schedule: Stormwatch rig', from: 'Rig Chief Dunmore', body: `SAFETY NOTICE: If the drill must ever be stopped, isolate the valve lines in order of pressure, <b>highest first</b>. Cutting a low line first sets off the alarm.

Nobody is to touch the valves. Nobody is to come aboard. That ladder was taken down for a reason.` },
});

/* ---------- the tasks */
const vqTask = (id, name, hint, flag, skip, reward, place) => ({ id, get name() { return typeof name === 'function' ? name() : name; }, get hint() { return typeof hint === 'function' ? hint() : hint; },
  done: () => !!(S.vd && (flag() || skip())), get reward() { return S.vd && skip() && !flag() ? {} : reward; }, _place: place });
const QV = [
  // 1. Who bought the valley?
  ['repair', [
    vqTask('vdq_gl1', 'Find out who bought the fields around your farm', 'Bramble said men in grey-green jackets bought up every field for miles. Marigold at the general store has lived in Smallroot all her life.', () => (vq().gl || 0) >= 1, () => vdReveal(), {}, { k: 'town', ready: () => S.vd && vd().mail.offer }),
    vqTask('vdq_gl2', 'Ask Tobias Gleam who Greenline Holdings are', 'Gleam has a kiosk in the Smallroot square. Ask him about Greenline Holdings and watch his face.', () => (vq().gl || 0) >= 2, () => vdReveal(), {}, { k: 'town' }),
    vqTask('vdq_gl3', 'Show Elder Bramble the business card', 'Gleam dropped a Greenline business card. Elder Bramble wanders the Smallroot square in the daytime.', () => (vq().gl || 0) >= 3, () => vdReveal(), { gold: 800 }, { k: 'town' }),
  ]],
  // 2. Grey water
  ['fen', [
    vqTask('vdq_fen1', 'Ask Nurse Willa about the sick Fablemon from the fen', "Willa's clinic is in Smallroot. She's been treating Fablemon with grey patches in their fur.", () => (vq().fen || 0) >= 1, () => vdShut('fen'), {}, { k: 'town', ready: () => (S.visited || {}).route4 }),
    vqTask('vdq_fen2', "Fill Willa's sample jar at the grey pool in Sluice Fen", 'Look for a pool of grey, filmy water near the Verdance pipe, by the way to Brookholt.', () => (vq().fen || 0) >= 2, () => vdShut('fen'), {}, { k: 'route4' }),
    vqTask('vdq_fen3', 'Take the fen sample back to Nurse Willa', 'Back to the clinic in Smallroot.', () => (vq().fen || 0) >= 3, () => vdShut('fen'), { items: { tonic: 2 } }, { k: 'town' }),
    vqTask('vdq_fen4', 'Ask Warden Delphine about the old fen locks', 'Delphine keeps the locks at Brookholt. Knock at the Lock House.', () => (vq().fen || 0) >= 4, () => vdShut('fen'), {}, { k: 'brookholt' }),
    vqTask('vdq_fen5', 'Turn the three old lock wheels in Sluice Fen', "Delphine's order: the heron wakes, the otter swims, the eel slips home. The wheels are near the siphon.", () => !!vq().flooded, () => vdShut('fen') || beatTrainer('vd_fen_boss'), { gold: 1000 }, { k: 'route4' }),
  ]],
  // 3. Brask's notebook
  ['stone', [
    vqTask('vdq_mine1', () => `Find the torn pages of Brask's notebook (${vqPages()}/3)`, 'Torn pages are scattered through the tunnels of the Old Mine.', () => vqPages() >= 3, () => vdShut('mine'), {}, { k: 'crag3', ready: () => (S.visited || {}).cragmine }),
    vqTask('vdq_mine2', 'Beat Foreman Brask, then talk to him about his notebook', 'Brask guards the drill at the top of the Old Mine. The drill only stops with the override key on his belt.', () => !!vq().mineKey, () => vdShut('mine'), { gold: 1500 }, { k: 'crag3' }),
  ]],
  // 4. Lights out
  ['whale', [
    vqTask('vdq_rig1', 'Ask Warden Orrin why the lighthouse lamp keeps dimming', 'Orrin keeps the lamp in Beaconreach.', () => (vq().rig || 0) >= 1, () => vdShut('rig'), {}, { k: 'beaconreach', ready: () => S.flags.whaleBeaten }),
    vqTask('vdq_rig2', `Bring Hal ${VQ_LADDER.wood} wood, ${VQ_LADDER.fiber} fiber and ${VQ_LADDER.stone} stone for a boarding ladder`, "Hal's shipyard is in Driftwood Cove.", () => !!vq().ladder, () => vdShut('rig'), {}, { k: 'driftwood' }),
    vqTask('vdq_rig3', "Board the rig in Stormwatch Strait and cut its valve lines", 'Sail up to the rig and climb aboard. Cut the valve lines from the highest pressure to the lowest.', () => !!vq().valves, () => vdShut('rig') || beatTrainer('vd_rigchief'), { gold: 1500 }, { k: 'stormwatch' }),
  ]],
  // 5. The petition
  ['millwind', [
    vqTask('vdq_tow1', 'Ask Warden Tamsin about the tower on Windcrown Peak', 'Tamsin is in Highmoor, by her mill.', () => (vq().tow || 0) >= 1, () => vdShut('tower'), {}, { k: 'highmoor', ready: () => typeof millFixed === 'function' && millFixed() }),
    vqTask('vdq_tow2', () => `Gather names for Tamsin's petition (${Math.min(VQ_SIGS, vqSigCount())}/${VQ_SIGS})`, () => `Villagers you're friends with (2 hearts or more) and townsfolk in Quarrydown, Beaconreach, Driftwood Cove and Highmoor will sign if you talk to them. Every Warden whose Crest you hold has already signed (${vqWardens()}).`, () => vqSigCount() >= VQ_SIGS || (vq().tow || 0) >= 3, () => vdShut('tower'), {}, { k: 'highmoor' }),
    vqTask('vdq_tow3', 'Take the petition back to Tamsin', 'Tamsin is in Highmoor.', () => (vq().tow || 0) >= 3, () => vdShut('tower') || beatTrainer('vd_ash'), { gold: 2000 }, { k: 'highmoor' }),
  ]],
];
for (const [before, steps] of QV) {
  const i = QUESTS.findIndex(q => q.id === before);
  QUESTS.splice(before === 'millwind' ? QUESTS.findIndex(q => q.id === 'vd_tower') : i + 1, 0, ...steps);
  // a step only becomes the current task once it can be started: the first when its place says so, the rest after the step before
  steps.forEach((q, k) => { QUEST_PLACE[q.id] = q._place.k; q.ready = k ? () => steps[k - 1].done() : () => !!(S && q._place.ready && q._place.ready()); });
}
activeQuest = () => QUESTS.find(q => !questDone(q) && (!q.ready || q.ready()));

/* ---------- 1. Who bought the valley? */
const _vqMarigold = marigoldLines;
marigoldLines = function (open) {
  if (vqStep('vdq_gl1') && S.town.met.marigold) {
    vq().gl = 1;
    return [VQ.marigold("Who bought the fields? A company called Greenline Holdings. Every farm from here to the Meadow Trail, one after another.", 0),
      VQ.marigold("My mother sold them her top field when she was ill. Cash on the table, papers already drawn up. The man who signed had a little leaf pin on his lapel."),
      VQ.marigold("Same pin that Gleam fellow wears at his kiosk. Go and ask him who Greenline are. And watch his face when you do.", 0)];
  }
  return _vqMarigold(open);
};
const _vqKiosk = vdKiosk;
vdKiosk = function () {
  if (vqStep('vdq_gl2') && !vdReveal()) {
    return Talk.say([VQ.gleam("Back again! Verdance Grow? Twice the crop, half the wa... sorry, who?", 1), VQ.gleam("Greenline Holdings. Hmm. Never heard of them. Well, a valued partner. A very distant partner. Barely a partner at all."),
      VQ.gleam("Is that the time? I have a, ah, a meeting. With the... grass. Good day!", 1),
      vdSys('Gleam bustles off round the back of the kiosk. A small card flutters out of his pocket onto the cobbles.')], () => {
      vq().gl = 2; vd().memos.glcard = 1; Sound.play('pop'); toast('🗂️ Picked up a business card: Greenline Holdings. Read it in Menu → Files.', 3400);
    });
  }
  return _vqKiosk();
};
const _vqBramble = brambleLines;
brambleLines = function () {
  if (vqStep('vdq_gl3') && S.town.met.bramble) {
    vq().gl = 3;
    return [VQ.bramble("A card from Gleam's pocket? Let me see... Greenline Holdings. Level 40, The Spire.", 0), VQ.bramble("The Spire. That's Verdance's headquarters, in the city. Their name's on the top of it in letters taller than a house.", 2),
      VQ.bramble("So it was them all along. Every field around your farm, bought through a company with a nice green name so nobody would ask questions.", 1),
      VQ.bramble("Your gran knew, I think. That's why she never sold, no matter what they offered.", 0),
      VQ.bramble("Keep that card safe, {name}. And keep your eyes open. A company doesn't buy a whole valley for the view.", 2)];
  }
  return _vqBramble();
};

/* ---------- 2. Grey water */
function vqWilla(after) {
  if (vqStep('vdq_fen1')) return Talk.say([VQ.willa("Oh, you've been out by the fen? Then maybe you can help me.", 0),
    VQ.willa("I've had five Fablemon in this week from Sluice Fen. Grey patches in their fur, no appetite, sleeping all day. It isn't any sickness I know.", 1),
    VQ.willa("Something's in the water. Here: take this sample jar. Fill it from the worst-looking water you can find out there and bring it straight back to me.", 0)], () => { vq().fen = 1; toast("Got Willa's sample jar.", 2000); });
  if (vqStep('vdq_fen2')) return Talk.say([VQ.willa("The jar's for the fen water, love. Look for the worst of it, out by those Verdance pipes.", 0)], after);
  if (vqStep('vdq_fen3')) return Talk.say([VQ.willa("You got it? Let me have a look under the lens...", 0), VQ.willa("Ugh. Look at that film on the top. There's something in here that doesn't belong in any fen: a drainage additive. The drum it came from will say DX-7 on the side, I'd bet my stethoscope.", 1),
    VQ.willa("Someone's pouring it in to keep the water moving towards that siphon of theirs. It's poisoning everything that drinks there.", 1),
    VQ.willa("You'll not get those pumps switched off, they'll be locked tight. But Delphine at Brookholt has kept the old fen locks for forty years. If anyone knows how to flood that siphon, it's her.", 0)], () => { vq().fen = 3; });
  return false;
}
const _vqClinic = SERVICE.clinic;
SERVICE.clinic = function () { if (vqWilla(_vqClinic) === false) return _vqClinic(); };
function vqDoor(sc, o) {
  if (o.k === 'pool') {
    if (vqStep('vdq_fen2')) { vq().fen = 2; Sound.play('pop'); return Talk.say([vdSys('The water here is grey and filmy, with a rainbow sheen on top. Nothing lives in it.'), vdSys("You fill Willa's sample jar and screw the lid on tight. Better get it back to the clinic.")]); }
    return Talk.say([vdSys('A pool of grey, filmy water by the Verdance pipe. It smells of chemicals. Nothing lives in it.')]);
  }
  // the old lock wheels: heron, otter, eel
  const order = ['Heron', 'Otter', 'Eel'], q = vq();
  if (!((q.fen || 0) >= 4) && !q.flooded) return Talk.say([vdSys(`An old iron lock wheel, rusted stiff. A worn plate reads: ${o.lock.toUpperCase()} LOCK. It must open one of the old fen channels.`), vdSys("You'd better not touch it without knowing what it does.")]);
  if (q.flooded) return Talk.say([vdSys(`The ${o.lock} Lock wheel is wide open. Clean water runs through the channel below.`)]);
  q.wheels = q.wheels || [];
  if (q.wheels.includes(o.lock)) return toast(`The ${o.lock} Lock is already open.`, 1600);
  const want = order[q.wheels.length];
  sc.cameras.main.shake(150, .003); Sound.play('thud');
  if (o.lock !== want) {
    q.wheels = []; return Talk.say([vdSys(`You heave the ${o.lock} Lock wheel round. Water gushes... then drains away with a sad gurgle. Every wheel clanks shut again.`), vdSys("Wrong order. What was it Delphine said? The heron wakes, the otter swims, the eel slips home.")]);
  }
  q.wheels.push(o.lock);
  if (q.wheels.length < 3) return toast(`💧 The ${o.lock} Lock opens with a groan. Water starts to move in the old channel. (${q.wheels.length}/3)`, 2600);
  q.flooded = S.day;
  sc.cameras.main.shake(500, .008);
  const site = (VD_POS[sc.scene.key] || []).find(q2 => q2.k === 'site'), im = site && sc.vdSpr[site.idx];
  if (im) for (let i = 0; i < 26; i++) { const p = sc.add.circle(im.x + (Math.random() - .5) * 50, im.y - Math.random() * 30, 2.5, 0x8fd0ff, .9).setDepth(9e6); sc.tweens.add({ targets: p, y: p.y + 12, x: p.x + (Math.random() - .5) * 20, alpha: 0, duration: 900 + Math.random() * 700, onComplete: () => p.destroy() }); }
  Talk.say([vdSys('The Eel Lock opens. With a roar, the old channels fill, and water floods down into the siphon\'s intake!'), vdSys('The pump chokes, coughs and sputters. Somewhere a siren starts to wail...')], () => {
    const t = (sc.trainers || []).find(x => x.id === 'vd_fen_boss');
    if (!t || beatTrainer(t.id)) return;
    t.meetLines = ["WHAT?! Who opened the locks? My intake's full of water! The pumps are drowning!", "You! The kid with the jam jar! You've cost me a week's output!", "Right. Site Supervisor Pell. Verdance Energy. Nobody floods my siphon and walks away."];
    if (!team().some(m => m.hp > 0)) return toast('Pell is storming over! Rest your Fablemon, then talk to Pell.', 2600);
    sc.startTrainerBattle(t);
  });
}
const _vqBh = bhDoor;
bhDoor = function (sc, id) {
  if (id === 'bh_lock' && vqStep('vdq_fen4')) {
    return Talk.say([VQ.delphine("Willa sent you? About the fen? Come in out of the wind.", 0), VQ.delphine("A drainage additive. In MY fen. Forty years I've kept that water, and they think they can pour chemicals in it and call it a study.", 1),
      VQ.delphine("Right. Listen. There are three old lock wheels round that siphon, from before the canal was cut: the Heron, the Eel and the Otter.", 0),
      VQ.delphine("Open them in the right order and every channel in the fen runs straight into their intake. Wrong order, and the water just drains away.", 0),
      VQ.delphine("The old lock-keepers had a rhyme for it: the heron wakes, the otter swims, the eel slips home. Heron, then Otter, then Eel.", 1),
      VQ.delphine("Go and drown their pumps. And give that supervisor my regards.", 1)], () => { vq().fen = 4; });
  }
  return _vqBh(sc, id);
};

/* ---------- the bosses: Pell waits for the flood, Brask has his key, Ash wants the revocation */
function vqBossTalk(sc, t) {
  const q = vq();
  if (t.id === 'vd_fen_boss' && !beatTrainer(t.id) && !q.flooded && !vdShut('fen')) {
    Talk.say([VQ.pell("Oi. This site's sealed. The pumps are locked and so's my mouth. Off you go, back to your turnips.", 0)], () => {
      const a = activeQuest(); if (a && a.id.startsWith('vdq_fen')) toast(`Pell won't budge. ${a.name}.`, 2800); else toast("Pell won't budge. Nurse Willa in Smallroot has been asking about the fen.", 3000);
    });
    return true;
  }
  if (t.id === 'vd_brask' && beatTrainer(t.id) && !vdShut('mine') && !q.mineKey) { vqBrask(sc); return true; }
  if (t.id === 'vd_ash' && !beatTrainer(t.id) && !vdShut('tower')) {
    if ((q.tow || 0) < 3) {
      Talk.say([VQ.ash("Ah. The farmer. I'm afraid I'm terribly busy. Unless you have some authority to be on my summit, do run along.", 0)], () => toast((q.tow || 0) ? 'Ash won\'t listen. Finish Tamsin\'s petition.' : 'Ash won\'t listen. Warden Tamsin in Highmoor might know a way.', 2800));
      return true;
    }
    t.meetLines = ['A council order? "The permit for the Windcrown weather station is hereby revoked." How quaint.', ...VD_BOSS_LINES.tower.meet.slice(1)];
    sc.startTrainerBattle(t); return true;
  }
  return false;
}

/* ---------- 3. Brask's notebook */
function vqBrask(sc) {
  if (vqPages() < 3) return Talk.say([VQ.brask("The drill? Locked. Override key's on my belt, and I'm not handing it to anyone.", 0),
    VQ.brask("...Look. I've lost my notebook. Pages all over the tunnels. There's things in it head office can't see. Find them for me and we'll talk.", 1)]);
  Talk.say([VQ.brask("Those are my pages. You found all three?", 0), VQ.brask("Then you've read them. You know what I am. A man who kept drilling after the Clinkits died.", 1),
    VQ.brask("So. What happens now? You give them back, or you keep them. Rowan in Smallroot would find them very interesting, I'd think.", 0)], () => {
    openModal("Brask's notebook", `<p>Brask holds out his hand for the pages. His other hand is on the override key.</p>
      <div class="row" style="display:flex;flex-direction:column;gap:6px"><button class="btn gold" data-a="trust">Give him his notebook back</button><button class="btn" data-a="keep">Keep the pages as evidence</button></div>`, a => {
      if (a !== 'trust' && a !== 'keep') return; closeModal();
      vq().mineKey = S.day; vd().brask = a;
      if (a === 'trust') Talk.say([VQ.brask("...You didn't have to do that.", 1), VQ.brask("Here. The override key. Turn it in the slot on the side, then pull the red lever.", 0),
        VQ.brask("And this. My old lucky charm. Kept me safe down here for twenty years. Reckon you need it more than me now.", 1)], () => { inv.add('heartwood_charm', 1); renderHotbar(); toast('Got the drill override key, and a Heartwood Charm from Brask.', 3000); });
      else Talk.say([VQ.brask("Fair enough. I'd have done the same.", 0), VQ.brask("Here. The override key. Turn it in the slot on the side, then pull the red lever.", 0),
        VQ.brask("Tell Rowan I'm sorry. Tell him I mean it.", 1)], () => toast('Got the drill override key. The pages are yours to keep.', 2800));
    });
  });
}
const VQ_BRASK_EVIDENCE = "You kept my pages. Fair enough. Rowan came by last week. Read every word. Didn't say much. Didn't need to.";
const _vqBraskQD = VD_BRASK_QD[0];
Object.defineProperty(VD_BRASK_QD, 0, { get() { return S && S.vd && vd().brask === 'keep' ? VQ_BRASK_EVIDENCE : _vqBraskQD; } });

/* ---------- 4. Lights out */
function vqOrrin(next) {
  if (!vqStep('vdq_rig1')) return false;
  Talk.say([VQ.orrin("You've noticed it too, then. The lamp. It's been flickering every night since that rig went in.", 0),
    VQ.orrin("The great lamp burns on an old root-crystal, older than the lighthouse. It draws from the sea root under the strait. And that's exactly what the rig's drilling.", 1),
    VQ.orrin("If my light goes out on a stormy night, boats hit the rocks. People drown. I won't have it.", 1),
    VQ.orrin("I can't get aboard that rig, it's a sheer steel wall. But Hal at Driftwood Cove could build a boarding ladder, if anyone can.", 0)], () => { vq().rig = 1; if (next) next(); });
  return true;
}
const _vqOrrinOut = orrinTalk;
orrinTalk = function (sc) { if (S.flags.whaleBeaten && vqOrrin(() => _vqOrrinOut(sc))) return; return _vqOrrinOut(sc); };
const _vqOrrinIn = orrin;
orrin = function (sc) { if (vqOrrin(() => _vqOrrinIn(sc))) return; return _vqOrrinIn(sc); };
const _vqHal = hal;
hal = function (sc) {
  if (!vqStep('vdq_rig2') || !S.flags.halMet) return _vqHal(sc);
  const have = () => Object.entries(VQ_LADDER).every(([id, n]) => inv.count(id) >= n);
  Talk.say([VQ.hal("A boarding ladder? For the Verdance rig?! Ha! Now that's a job I'll do for free!", 1),
    VQ.hal(`Bring me ${VQ_LADDER.wood} wood for the rungs, ${VQ_LADDER.fiber} fiber for rope and ${VQ_LADDER.stone} stone for the grapple weights, and I'll have it done before the kettle boils.`, 0)], () => {
    openModal('A boarding ladder', `<p>Hal needs: ${Object.entries(VQ_LADDER).map(([id, n]) => `${n} ${ITEMS[id].name} <small>(you have ${inv.count(id)})</small>`).join(', ')}.</p><div class="row"><button class="btn gold" data-a="go" ${have() ? '' : 'disabled'}>Give Hal the materials</button><button class="btn" data-a="no">Later</button></div>`, a => {
      closeModal(); if (a !== 'go' || !have()) return;
      for (const [id, n] of Object.entries(VQ_LADDER)) inv.remove(id, n);
      vq().ladder = S.day; renderHotbar(); Sound.play('levelup');
      Talk.say([VQ.hal("Right then! Rungs... rope... grapple... there!", 1), VQ.hal("Hook it over the rig's lower rail and climb. And the rig crew keep a valve chart in a box by the ladder. Cut those lines and the drill stops dead.", 0)], () => toast('Got a boarding ladder. Sail up to the rig in Stormwatch Strait.', 3000));
    });
  });
};
function vqValves(sc, o, then) {
  let gauges, cut = [], strikes = 0;
  const fresh = () => { const v = new Set(); while (v.size < 3) v.add(30 + Math.floor(Math.random() * 14) * 5); gauges = [...v].map((psi, i) => ({ i, psi, col: ['red', 'blue', 'yellow'][i] })); cut = []; };
  fresh();
  const steps = () => '👣'.repeat(strikes) + '·'.repeat(2 - strikes);
  const render = () => `<p>Three valve lines run into the drill, each with a pressure gauge. A chart by the ladder: <b>cut the highest pressure first</b>. Dunmore's footsteps echo somewhere below...</p>
    <p style="font-size:18px;letter-spacing:4px">${steps()}</p>
    <div style="display:flex;gap:6px">${gauges.map(g => `<button class="btn ${cut.includes(g.i) ? '' : 'gold'}" data-a="cut" data-i="${g.i}" ${cut.includes(g.i) ? 'disabled' : ''} style="flex:1;padding:8px 4px"><b style="color:${{ red: '#c0392b', blue: '#2d6fb0', yellow: '#b8860b' }[g.col]}">● ${g.col}</b><br>${g.psi} psi${cut.includes(g.i) ? '<br>✂ cut' : ''}</button>`).join('')}</div>`;
  vd().memos.valves = 1;
  openModal('The rig deck', render(), (a, d) => {
    if (a !== 'cut') return;
    const left = gauges.filter(g => !cut.includes(g.i)), top = left.reduce((m, g) => g.psi > m.psi ? g : m, left[0]);
    if (+d.i !== top.i) {
      strikes++; Sound.play('error'); sc.cameras.main.shake(200, .004);
      if (strikes >= 2) { closeModal(); return Talk.say([vdSys('KLAXON! Red lights flash all over the deck!'), VQ.dunmore("OI! Who's that on my deck?!", 0)], then); }
      toast('A warning bell clangs! The pressure balances back out. Careful...', 2400); fresh(); $('mBody').innerHTML = render(); return;
    }
    cut.push(top.i); Sound.play('pop');
    if (cut.length < 3) { $('mBody').innerHTML = render(); return; }
    closeModal(); vq().valves = S.day; sc.cameras.main.shake(500, .008);
    Talk.say([vdSys('The last line parts with a hiss of steam. Deep in the rig, the drill grinds, shudders, and stops.'), VQ.dunmore("WHAT have you done to my drill?! Get off my rig!", 0)], then);
  });
}
function vqSiteTalk(sc, o) {
  const q = vq();
  if (o.s === 'mine' && !vdShut('mine') && beatTrainer('vd_brask') && !q.mineKey) {
    Talk.say([vdSys('The drill screams on. A steel panel on its side reads OVERRIDE KEY REQUIRED, with an empty slot beside a big red lever.'), vdSys('Brask has the key on his belt.')]); return true;
  }
  if (o.s === 'rig' && !vdShut('rig') && !beatTrainer('vd_rigchief')) {
    if (!q.ladder) {
      Talk.say([vdSys("The rig's legs rise sheer out of the sea, slick with spray. There's no way up from a little boat."), VQ.dunmore("Ahoy, little boat! Go home before you get hurt!", 0)], () => {
        const a = activeQuest(); toast(a && a.id.startsWith('vdq_rig') ? a.name : 'You need a way aboard. Warden Orrin in Beaconreach might know one.', 2800);
      }); return true;
    }
    if (!q.valves) { Talk.say([vdSys("You hook Hal's ladder over the lower rail and climb. Spray, steel and the thump of the drill, right under your feet...")], () => vqValves(sc, o, () => vdRigChief(sc, o))); return true; }
  }
  return false;
}

/* ---------- 5. The petition */
const _vqTamsin = tamsin;
tamsin = function (sc) {
  if (vqStep('vdq_tow1')) return Talk.say([VQ.tamsin("That tower on the summit. Verdance calls it a weather research station. Weather research! It's MAKING the weather!", 1),
    VQ.tamsin("Their permit comes up before the valley council this season. If enough people across the valley sign a petition against it, the council can revoke it.", 0),
    VQ.tamsin("I'll put my name first. You've friends in every town from here to Smallroot, haven't you? Get me twelve names, and I'll take it to the council myself.", 1)], () => { vq().tow = 1; vq().sig = vq().sig || {}; toast('Got the petition. Talk to friends and townsfolk to collect names.', 3000); });
  if (vqStep('vdq_tow2')) return Talk.say([VQ.tamsin(`${Math.min(VQ_SIGS, vqSigCount())} names so far! Keep going. Friends in Smallroot, the folk in every town, the Wardens. ${VQ_SIGS} and we've got them.`, 0)]);
  if (vqStep('vdq_tow3')) return Talk.say([VQ.tamsin("Twelve names? From all over the valley? Let me see!", 1), VQ.tamsin("I'll run it down to the council in the morning... no. I'll run it down right now.", 1),
    vdSys('Tamsin is gone for an hour. When she comes back, she is waving a sheet of paper with a red wax seal.'),
    VQ.tamsin("REVOKED! The council's revoked their permit! The tower has to come down!", 1),
    VQ.tamsin("Ash won't care, mind. People like him never do. But now he has no right to be up there, and you do. Take this up to him.", 0)], () => { vq().tow = 3; S.time = Math.min(S.time + 60, 25 * 60); updateHUD(); });
  return _vqTamsin(sc);
};
function vqSign(name, key, img, line) {
  const q = vq(); if (!vqStep('vdq_tow2') || q.sig[key]) return null;
  q.sig[key] = S.day;
  return [{ ...img, t: line || pick(["A petition against the tower? Give it here. Where do I sign?", "Verdance? I'll sign twice if you let me.", "Course I'll sign. Anything to keep those grey-green jackets out.", "There. Neatest signature on the page, that is."]) }];
}
const _vqVillChat = villChat;
villChat = function (id, after, door) {
  if (id === 'willa' && vqWilla(after) !== false) return;
  if (VILL[id] && heartsOf(id) >= 2 && S.town.met[id]) {
    const L = vqSign(VILL[id].name, 'v_' + id, { who: id, name: VILL[id].name, img: VPIC[id + '1'] });
    if (L) return Talk.say(L, () => toast(`✍ ${VILL[id].name} signed the petition. (${Math.min(VQ_SIGS, vqSigCount())}/${VQ_SIGS})`, 2400));
  }
  return _vqVillChat(id, after, door);
};
const _vqFolk = folkTalk;
folkTalk = function (sc, id) {
  const i = +id.split('_').pop(), o = (sc.folk || []).find(f => f.i === i);
  if (o) {
    const L = vqSign(o.name, 'f_' + sc.scene.key + '_' + o.name, { who: 'trainer', name: o.name, img: trainerPic(o.kind, 0) });
    if (L) { const p = sc.p; o.spr.setFrame(DIRS.indexOf(p.x < o.x ? 'left' : p.x > o.x ? 'right' : p.y < o.y ? 'up' : 'down') * 4); o.talking = 1; return Talk.say(L, () => { o.talking = 0; toast(`✍ ${o.name} signed the petition. (${Math.min(VQ_SIGS, vqSigCount())}/${VQ_SIGS})`, 2400); }); }
  }
  return _vqFolk(sc, id);
};
