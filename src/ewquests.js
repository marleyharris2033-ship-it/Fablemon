/* ============================================================ Elderwood quest line, chapters 1–3 (plan: claude/elderwood-plan.md)
   1. The Haul Road      Bramble hands over Alder's letter (opens Quarrydown's east road) → Fernwalk → Tansy shows you
                         the old deer path round the Verdance checkpoint → Elderwood.
   2. A town split       Alder won't battle while the saws run → Mayor Pruett and the timber lease → fund the footbridge.
   3. The Scattered Herds  Alder asks you to bring home three herd leaders:
                         the stag (follow its hoofprints through the Glade; lose the trail and start again; a salt lick calms it),
                         the bear matriarch (stuck in a logging pit: a Stone or Wild Fablemon clears the rubble and a Gale one
                         lifts the logs; then three truffles, rooted up by her cubs round the Glade),
                         the night wolf (at night, light the five lanterns round the Eldest Tree in the carvings' order).
   State: S.ew = { deer, alder, mayor, herdAsk, trail, stagFound, pitClear, pig: {}, lamps: [], owlFound, herds: {}, herdsHome }
   The herd leaders, cubs and story people use stand-in art until the user's Elderwood Fablemon and characters arrive. */
Object.assign(ITEMS, {
  salt_lick: { name: 'Salt Lick', stack: 99, sell: 50, desc: 'A block of mineral salt. Wild herd Fablemon find it hard to resist.' },
  truffle: { name: 'Forest Truffle', stack: 99, sell: 420, desc: 'A knobbly black truffle that smells wonderful. Hollowcub cubs dig them up in old woods.' },
});
const _ewItems = hdItems;
hdItems = async function () { await _ewItems(); for (const [id, f] of [['salt_lick', 'stone'], ['truffle', 'potato']]) if (!ICONS[id] || ICONS[id] === ICONS.wood) { ICONS[id] = ICONS[f]; ICON_CANVAS[id] = ICON_CANVAS[f]; } };

// the Elderwood people (their own art since 17 Nov: tools/art/cut_ewchars.py)
Object.assign(TRAINER_TYPES, {
  tansy: { label: 'Ranger', challenge: ['Ready?'], lose: ['Aw.'], after: ['Come on!'] },
  pruett: { label: 'Mayor', challenge: ['...'], lose: ['...'], after: ['...'] },
  dunn: { label: 'Logger', challenge: ['...'], lose: ['...'], after: ['...'] },
  stroud: { label: 'Haulmaster', challenge: ['...'], lose: ['...'], after: ['...'] },
  ellis: { label: 'Carver', challenge: ['...'], lose: ['...'], after: ['...'] },
  hazel: { label: 'Landlady', challenge: ['...'], lose: ['...'], after: ['...'] },
  oliver: { label: 'Storekeeper', challenge: ['...'], lose: ['...'], after: ['...'] },
});
// the keeper behind the counter: their portrait and a line
const ewKeeper = (kind, name, line, f = 0) => `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><img src="${trainerPic(kind, f)}" style="width:72px;height:72px;object-fit:contain;flex:0 0 auto"><p style="margin:0"><b>${name}</b><br>"${line}"</p></div>`;
const EWS = (kind, name) => (t, f = 0) => ({ who: 'trainer', name, img: trainerPic(kind, f), t });
const EW = {
  bramble: (t, f = 1) => ({ who: 'bramble', t, f }),
  alder: EWS('alder', 'Warden Alder'), tansy: EWS('tansy', 'Tansy'), pruett: EWS('pruett', 'Mayor Pruett'),
  dunn: EWS('dunn', 'Gaffer Dunn'), stroud: EWS('stroud', 'Haulmaster Stroud'), ellis: EWS('ellis', 'Ellis the carver'),
};
const EW_MON = { stag: 'elderhart', boar: 'ursylvane', cub: 'hollowcub', owl: 'gloamfang' };   // the herd leaders (keys kept from the first draft: boar = the bear, owl = the wolf)
const ewNight = () => S.time >= 1140 || S.time < 360;
const ewHerds = () => ['stag', 'boar', 'owl'].filter(k => ew().herds[k]).length;
const ewHasType = t => team().some(m => m.hp > 0 && (SPECIES[m.sp].type === t || SPECIES[m.sp].type2 === t));

/* ---------- the tasks */
const ewTask = (id, name, hint, done, reward, place) => ({ id, get name() { return typeof name === 'function' ? name() : name; }, get hint() { return typeof hint === 'function' ? hint() : hint; }, done: () => !!(S && done()), reward, _place: place });
const EW_Q = [
  // 1. The Haul Road
  ewTask('ew_letter', 'Hear the news from Elder Bramble', 'Elder Bramble has had a letter from Elderwood, the old forest town north-east of Quarrydown.', () => S.flags.ewOpen, {}, 'town'),
  ewTask('ew_road', 'Take the east road out of Quarrydown', "The barrier on Quarrydown's east road is up. Follow it into the forest.", () => (S.visited || {}).fernwalk, { gold: 2000 }, 'quarrydown'),
  ewTask('ew_deer', 'Find a way past the Verdance checkpoint on Fernwalk', 'Verdance has blocked the road through Fernwalk. Someone in the ferns by the road seems to know the forest well.', () => ew().deer, {}, 'fernwalk'),
  ewTask('ew_town', 'Reach Elderwood', 'Follow the old deer path round the checkpoint, then the trail north through the Elder Glade.', () => (S.visited || {}).elderwood, { gold: 3000, items: { tonic: 3 } }, 'eldglade'),
  // 2. A town split in two
  ewTask('ew_alder1', "Visit Warden Alder at his Lodge", "Alder's Lodge is at the north end of Elderwood's grand avenue, past the market square.", () => ew().alder, {}, 'elderwood'),
  ewTask('ew_mayor', 'Hear Mayor Pruett out', "The grand Town Hall is on the west side of the market square. Tansy says Pruett is at the Antler Inn most days, avoiding everyone.", () => ew().mayor, {}, 'elderwood'),
  ewTask('ew_bridge', 'Fund the paddock footbridge', () => `Use the notice board in Elderwood's market square. The herd paddock is across the river. (${EW_PROJECTS.ew_bridge.gold}g, ${Object.entries(EW_PROJECTS.ew_bridge.need).map(([k, n]) => n + ' ' + ITEMS[k].name).join(', ')})`, () => ewRepaired('ew_bridge'), { gold: 1500 }, 'elderwood'),
  // 3. The Scattered Herds
  ewTask('ew_ask', 'Talk to Alder about the herds', "Now the footbridge is up, Alder wants a word at his Lodge.", () => ew().herdAsk, {}, 'elderwood'),
  ewTask('ew_herds', () => `Bring the herd leaders home (${ewHerds()}/3)`, () => [
    ew().herds.stag ? '✔ the stag' : "The stag: in the Elder Glade's west woods. Follow its hoofprints, and don't stray from them. It loves a salt lick.",
    ew().herds.boar ? '✔ the bear matriarch' : 'The bear matriarch: trapped in a logging pit in the clear-cut, east of the Glade. You\'ll need strong Fablemon, and something tasty.',
    ew().herds.owl ? '✔ the night wolf' : 'The night wolf: only at night, at the Eldest Tree, west of the Glade.'].join('<br>'), () => ewHerds() >= 3, { gold: 4000, items: { mon_treat: 3 } }, 'eldglade'),
  ewTask('ew_home', 'Tell Alder the herds are home', 'Alder is at his Lodge in Elderwood.', () => ew().herdsHome, { gold: 3000 }, 'elderwood'),
];
{
  const i = QUESTS.findIndex(q => q.id === 'galecrest');
  QUESTS.splice(i + 1, 0, ...EW_Q);
  EW_Q.forEach((q, k) => { QUEST_PLACE[q.id] = q._place; q.ready = k ? () => EW_Q[k - 1].done() : () => !!(S && S.crests && S.crests.gale); });
}
const ewStep = id => { const q = QUESTS.find(x => x.id === id); return !!(q && !q.done() && q.ready()); };

/* ---------- Bramble hands over the letter */
const _ewBramble = brambleLines;
brambleLines = function () {
  if (ewStep('ew_letter') && S.town.met.bramble) {
    S.flags.ewOpen = 1; ew();
    return [EW.bramble("Ah, there you are. A letter came for you, by way of me. Carried down from Elderwood by a very tired Spark Fablemon.", 0),
      EW.bramble("It's from Alder, the Warden of Elderwood. Old friend of your gran's. He doesn't write letters. He barely talks.", 2),
      EW.bramble("Three words. 'The saws have come.' And then: 'Bring the farmer.'", 0),
      EW.bramble("Elderwood is the old forest north-east of Quarrydown. The east road out of Quarrydown goes straight there. I've sent word to have the barrier lifted.", 1),
      EW.bramble("Ash's notes talked about a single great drill. I'd wager whatever's happening in that forest has something to do with it. Be careful.", 2)];
  }
  if (ew().herdsHome && !ew().bramble1 && S.flags.ewOpen) { ew().bramble1 = 1; return [EW.bramble("Alder's herds are home? Then the forest still has a chance. Your gran would have been proud.", 1)]; }
  return _ewBramble();
};

/* ---------- who stands where */
const STAG_TRAIL = [[22, 37], [19, 39], [15, 41], [11, 41], [7, 38], [6, 34], [6, 28], [9, 26], [13, 25], [17, 24], [20, 26]];
const PIGLETS = [[9, 7], [40, 6], [16, 44]];
const LAMPS = [['moon', 9, 12], ['stag', 21, 12], ['root', 7, 19], ['wolf', 23, 19], ['bear', 15, 23]];
const LAMP_ORDER = ['root', 'stag', 'bear', 'wolf', 'moon'];
const LAMP_TEXT = { moon: 'a crescent moon', stag: 'a running stag', root: 'a tangle of roots', wolf: 'a wolf with a shadow for a tail', bear: 'a mother bear with her cubs' };

ROUTES.fernwalk.actors = () => ew().deer ? [] : [{ id: 'ew_tansy', x: 15, y: 37, tex: 'tr_' + trArt('tansy'), dir: 'right' }];
ROUTES.elderwood.actors = () => {
  const out = [];
  if (ew().deer) out.push({ id: 'ew_tansy', x: 44, y: 40, tex: 'tr_' + trArt('tansy'), dir: 'down' });
  if (ew().herds.stag) out.push({ id: 'ew_pstag', x: 85, y: 17, mon: EW_MON.stag });
  if (ew().herds.boar) out.push({ id: 'ew_pboar', x: 91, y: 25, mon: EW_MON.boar });
  if (ew().herds.owl) out.push({ id: 'ew_powl', x: 80, y: 21, mon: EW_MON.owl });
  return out;
};
ROUTES.eldglade.actors = () => {
  const W = ew(), out = []; if (!W.herdAsk) return out;
  if (!W.herds.stag) {
    if (W.stagFound) out.push({ id: 'ew_stag', x: 20, y: 25, mon: EW_MON.stag, scale: 1.2 });
    else { const [x, y] = STAG_TRAIL[W.trail || 0]; out.push({ id: 'ew_print', x, y, walk: true, print: true, onStep: ewPrint }); }
  }
  if (!W.herds.boar) {
    out.push({ id: 'ew_boar', x: 47, y: 41, mon: EW_MON.boar, scale: 1.2 });
    PIGLETS.forEach(([x, y], k) => { if (!(W.pig || {})[k]) out.push({ id: 'ew_pig' + k, x, y, mon: EW_MON.cub }); });
  }
  return out;
};
ROUTES.eldest.actors = () => {
  const W = ew(), out = []; if (!W.herdAsk || W.herds.owl) return out;
  const lit = W.lamps || [];
  LAMPS.forEach(([sym, x, y]) => out.push({ id: 'ew_lamp_' + sym, x, y, lamp: true, lit: lit.includes(sym) }));
  if (W.owlFound && ewNight()) out.push({ id: 'ew_owl', x: 15, y: 15, mon: EW_MON.owl, scale: 1.2 });
  return out;
};
ROUTES.eldest.signs['12,18'] = "Carvings run round the roots. Read from the ground up: first the roots, then the stag that runs above them, the bear beneath the stag's hooves, the wolf in the shadows of the branches, and last of all the moon.";

/* ---------- the stag's trail */
function ewPrint(sc, a) {
  const W = ew(); W.trail = (W.trail || 0) + 1; Sound.play('pick');
  if (W.trail >= STAG_TRAIL.length) { W.stagFound = 1; toast('The hoofprints stop. Something huge and silver stands among the trees ahead...', 3200); }
  else toast(['Fresh hoofprints in the moss. They lead on...', 'More prints. Deeper here: something big.', 'The trail bends between the trees.'][W.trail % 3], 1800);
  ewRefresh(sc);
}
ROUTES.eldglade.onWalk = (sc, x, y) => {
  const W = ew(); if (!W.herdAsk || W.herds.stag || W.stagFound || !(W.trail > 0)) return;
  const [px, py] = STAG_TRAIL[W.trail], d = Math.abs(px - x) + Math.abs(py - y);
  if (d > 9) { W.trail = 0; toast("You've lost the trail in the mist. Back to where the prints began...", 3000); ewRefresh(sc); }
};

/* ---------- doors and people */
ewDoorHook = (sc, id) => {
  const W = ew(), say = (lines, cb) => { Talk.say(lines, cb); return true; };
  if (id === 'ew_tansy') {
    if (!W.deer) return say([EW.tansy("Psst! Down here, in the ferns! Don't let the tech on the barrier see you.", 0),
      EW.tansy("I'm Tansy. Warden Alder's apprentice. Well, his only apprentice. Well, his only anything, since the saws came.", 1),
      EW.tansy("You're the farmer, aren't you? Alder said you'd come. You've got that look. Muddy boots and a team that bites.", 1),
      EW.tansy("Verdance shut the road for their timber trucks. But the forest's older than their road.", 0),
      EW.tansy("There's an old deer path round the checkpoint, through the west woods. I'll clear the brush for you. Mind the techs on it: they patrol the path.", 0)],
      () => { W.deer = 1; Sound.play('pick'); toast('Tansy pulls the brush aside: the old deer path is open!', 3000); ewRefresh(sc); });
    if (W.herdAsk && !W.herdsHome) return say([EW.tansy(ewHerds() >= 3 ? "All three home! Go and tell Alder, quick!" : "The stag likes salt. The bear likes truffles. The wolf likes... nobody, really. But it likes the old lanterns.", 1)]);
    return say([EW.tansy(W.alder ? "Alder's been like a thundercloud since the lease was signed. Don't take it personally." : "That's Alder's Lodge, east side of the square. Knock loud. He pretends not to hear.", 0)]);
  }
  if (id === 'ew_lodge') {
    if (!W.alder) return say([EW.alder("...", 0), EW.alder("You're Edie's grandchild. You have her chin. Stubborn.", 0),
      EW.alder("I asked Bramble to send you. Now you're here I don't know what to say to you.", 0),
      EW.alder("If you've come for a Crest, there isn't one. There's no Warden in Elderwood while the saws run. Just an old man who let them in.", 0),
      EW.alder("Go and ask Pruett what he signed. Then you'll understand.", 0)], () => { W.alder = 1; checkQuests(); });
    if (W.mayor && ewRepaired('ew_bridge') && !W.herdAsk) return say([EW.alder("You built the footbridge. Hm.", 0),
      EW.alder("Then I'll ask you something I can't do myself. The herds have scattered. When the big trees come down, the herds lose their way.", 0),
      EW.alder("Three of them lead the rest: the silver stag, the old bear matriarch, and the night wolf. Bring those three home and the herds will follow.", 0),
      EW.alder("The stag is somewhere in the west woods of the Glade. Find its prints and don't lose them. It won't come near you without this.", 0),
      EW.alder("The bear's down by the clear-cut. She'll be angry. The wolf only comes out at night, round the Eldest Tree. Tansy knows the lanterns.", 0)],
      () => { W.herdAsk = 1; inv.add('salt_lick', 1); renderHotbar(); toast('Alder gave you a Salt Lick.', 2400); checkQuests(); });
    if (W.herdAsk && ewHerds() >= 3 && !W.herdsHome) return say([EW.alder("I heard them coming down the north track at dawn. All of them. The whole herd.", 1),
      EW.alder("I stood at the paddock gate like a fool and cried into my beard.", 1),
      EW.alder("Thank you. Your gran would have done the same, and she'd have been smug about it for a month.", 1),
      EW.alder("Now. Those saws. I've a feeling you're about to ask what Verdance actually wants with my trees. So am I.", 0)], () => { W.herdsHome = 1; checkQuests(); });
    if (W.herdAsk && !W.herdsHome) return say([EW.alder(`${ewHerds()} of 3. ${ew().herds.stag ? '' : "The stag's prints are in the west woods. "}${ew().herds.boar ? '' : "The bear's in the clear-cut. "}${ew().herds.owl ? '' : 'The wolf comes out at night, at the Eldest Tree.'}`, 0)]);
    if (W.mayor && !ewRepaired('ew_bridge')) return say([EW.alder("The paddock's across the river, and the footbridge is in the river. Nobody's had the money to fix it. Greenline offered. I said no.", 0)]);
    if (!W.mayor) return say([EW.alder('Pruett. Go on.', 0)]);
  }
  if (id === 'ew_mayor' || id === 'ew_inn') {
    if (W.alder && !W.mayor) return say([EW.pruett("You've been to see Alder, haven't you. I can tell. You've got that look people get after Alder.", 0),
      EW.pruett("Yes. I signed it. A ninety-nine year timber lease on the Elder Glade, to Greenline Timber.", 0),
      EW.pruett("The mill had closed. Half the town was out of work. Greenline said they'd hire everyone, fix the bridge, fix the roads, and only take the dead wood.", 0),
      EW.pruett("Then the trucks came. Then the checkpoint. Then they started on the big trees, the old ones, and the herds ran.", 0),
      EW.pruett("Half the town works for them now. The other half ties ribbons on the trees. Nobody's speaking to anybody.", 0),
      EW.pruett("If you want to help, start with the footbridge to the herd paddock. The notice board's in the square. Folk will chip in once someone goes first.", 0)], () => { W.mayor = 1; checkQuests(); });
  }
  if (id === 'ew_stag') {
    if (!inv.count('salt_lick')) return say([{ who: 'trainer', name: 'The silver stag', img: monPic(EW_MON.stag, 'front'), t: 'The great stag lowers its antlers at you. It won\'t come any closer. (Alder had a salt lick...)' }]);
    inv.remove('salt_lick', 1); renderHotbar();
    return say([{ who: 'trainer', name: 'The silver stag', img: monPic(EW_MON.stag, 'front'), t: 'You hold out the salt lick. The stag watches you for a long moment... then steps forward and licks it, very carefully, like it\'s doing you a favour.' },
      { who: 'trainer', name: 'The silver stag', img: monPic(EW_MON.stag, 'front'), t: 'It shakes its antlers, and turns north towards Elderwood. Behind it, from the mist, other shapes follow.' }],
      () => { W.herds.stag = 1; Sound.play('levelup'); toast('The silver stag is heading home! (' + ewHerds() + '/3)', 3000); checkQuests(); ewRefresh(sc); });
  }
  if (id.startsWith('ew_pig')) {
    const k = +id.slice(6); W.pig = W.pig || {}; if (W.pig[k]) return true;
    W.pig[k] = 1; inv.add('truffle', 1); renderHotbar(); Sound.play('coin');
    toast(['A cub snuffles at the roots and roots up a truffle! It drops it at your feet and trots off.', "This cub's found a truffle too. It looks very pleased with itself.", 'The last cub squeals, digs, and presents a truffle. Then it runs off towards the clear-cut.'][Object.keys(W.pig).length - 1] || 'Another truffle!', 3200);
    ewRefresh(sc); return true;
  }
  if (id === 'ew_boar') {
    if (!W.pitClear) {
      const stone = ewHasType('Stone') || ewHasType('Wild'), gale = ewHasType('Gale');
      if (!stone || !gale) return say([{ who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: "A huge old mother bear is stuck in a pit where a tree's been dragged out, pinned under fallen logs and rubble. She snorts and thrashes." },
        { ...vdSys(''), t: `To get her out you'll need ${stone ? '' : 'a Stone or Wild Fablemon to clear the rubble'}${!stone && !gale ? ', and ' : ''}${gale ? '' : 'a Gale Fablemon to lift the logs'} on your team.` }]);
      W.pitClear = 1;
      return say([{ ...vdSys(''), t: 'Your Fablemon get to work: rubble is shoved aside, and with a great gust the logs lift and roll clear of the pit.' },
        { who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: "The bear scrambles out... and squares up to you, furious and starving. She sniffs the air. Truffles might change her mind. Her cubs are scattered round the Glade." }], () => ewRefresh(sc));
    }
    if (inv.count('truffle') < 3) return say([{ who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: `She snorts at you. You have ${inv.count('truffle')} truffle${inv.count('truffle') === 1 ? '' : 's'}. She looks like she'd want three. Her cubs are rooting about somewhere in the Glade.` }]);
    inv.remove('truffle', 3); renderHotbar();
    return say([{ who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: 'You set down three truffles. The bear eats them in about a second, then leans her whole enormous weight against your legs, grunting happily.' },
      { who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: 'She lumbers off north, and her cubs come running from every direction to follow her home.' }],
      () => { W.herds.boar = 1; Sound.play('levelup'); toast('The bear matriarch is heading home! (' + ewHerds() + '/3)', 3000); checkQuests(); ewRefresh(sc); });
  }
  if (id.startsWith('ew_lamp_')) {
    const sym = id.slice(8); W.lamps = W.lamps || [];
    if (W.lamps.includes(sym)) return say([{ ...vdSys(''), t: `This lantern is carved with ${LAMP_TEXT[sym]}. It's burning softly.` }]);
    if (!ewNight()) return say([{ ...vdSys(''), t: `An old roost lantern, carved with ${LAMP_TEXT[sym]}. Tansy said the wolf only comes at night. It'd be no use lighting it now.` }]);
    if (LAMP_ORDER[W.lamps.length] !== sym) { const had = W.lamps.length; W.lamps = []; Sound.play('error'); toast(had ? 'A cold gust puts every lantern out. That must be the wrong order...' : `You light the lantern carved with ${LAMP_TEXT[sym]}... and it gutters out at once.`, 3000); ewRefresh(sc); return true; }
    W.lamps.push(sym); Sound.play('pick');
    if (W.lamps.length === LAMP_ORDER.length) { W.owlFound = 1; toast('The last lantern catches. High in the Eldest Tree, two great round eyes open...', 3600); }
    else toast(`The lantern carved with ${LAMP_TEXT[sym]} flickers into light.`, 2000);
    ewRefresh(sc); return true;
  }
  if (id === 'ew_owl') return say([{ who: 'trainer', name: 'The night wolf', img: monPic(EW_MON.owl, 'front'), t: 'A great dark wolf pads out from between the roots, its shadow-maw tail swaying behind it. It looks at you for a very long time.' },
    { who: 'trainer', name: 'The night wolf', img: monPic(EW_MON.owl, 'front'), t: 'Then it howls, once, low and soft, and lopes away north towards Elderwood. All around the tree, smaller shapes slip out of the dark to follow.' }],
    () => { W.herds.owl = 1; Sound.play('levelup'); toast('The night wolf is heading home! (' + ewHerds() + '/3)', 3000); checkQuests(); ewRefresh(sc); });
  if (id === 'ew_pstag') return say([{ who: 'trainer', name: 'The silver stag', img: monPic(EW_MON.stag, 'front'), t: 'The stag grazes by the paddock fence. It ignores you magnificently.' }]);
  if (id === 'ew_pboar') return say([{ who: 'trainer', name: 'The bear matriarch', img: monPic(EW_MON.boar, 'front'), t: 'The bear matriarch sniffs your pockets for truffles while her cubs climb all over you.' }]);
  if (id === 'ew_powl') return say([{ who: 'trainer', name: 'The night wolf', img: monPic(EW_MON.owl, 'front'), t: ewNight() ? 'The night wolf prowls the paddock fence, wide awake.' : 'The night wolf is curled up asleep by the fence, one eye very slightly open.' }]);
  return false;
};

/* ============================================================ chapters 4–7
   4. Rootwood        Sneak into the camp after dark (guarded by day) → three Greenline papers → show Alder →
                      fund the town mill → Gaffer Dunn quits Greenline.
   5. Replant         Elder seeds from the felled stumps (2 a stump a day) → grow them on the farm (a 5-day crop that
                      gives an Elder Sapling) → plant 12 in the clear-cut with Dunn's crew. The first clear-cut is a
                      young wood at once; the second follows three nights later.
   6. The Harvester   Tansy brings word: Vale has ordered the Eldest Tree felled. At the tree: Haulmaster Stroud and the
                      Harvester. The herd leaders charge in; beat Stroud (64–66); the Harvester ends up in the log pond.
                      The camp shuts: the techs leave and the Fernwalk checkpoint opens.
   7. The Wild Crest  Alder battles you (63–67) and gives you his horn: blow it on any route to ride the silver stag
                      (faster, and no wild Fablemon while you ride). Tansy finds where the haul road really goes. */
Object.assign(ITEMS, {
  elder_seed: { name: 'Elder Seed', stack: 999, seed: 'elder', sell: 0, desc: 'A winged seed from a felled elder tree. Plant it on your farm and water it: in 5 days it grows into an Elder Sapling.' },
  elder_sapling: { name: 'Elder Sapling', stack: 999, sell: 0, desc: "A young elder tree, ready to be planted back in the Elder Glade. Gaffer Dunn's crew will plant it with you." },
  alders_horn: { name: "Alder's Horn", stack: 1, sell: 0, desc: "A carved herder's horn. Hold it and press use on any route to call the silver stag and ride it: faster, and no wild Fablemon bother you. Blow it again to get down." },
});
CROPS.elder = { days: 5, item: 'elder_sapling', seasons: [0, 1, 2, 3], home: [0, 1, 2, 3], frames: ['cv:sap_pine', 'cv:sap_pine', 'cv:sap_oak', 'cv:sap_oak'] };
const _ewItems2 = hdItems;
hdItems = async function () { await _ewItems2(); for (const [id, f] of [['elder_seed', 'pine_sapling'], ['elder_sapling', 'oak_sapling'], ['alders_horn', 'lantern']]) if (!ICONS[id] || ICONS[id] === ICONS.wood) { ICONS[id] = ICONS[f]; ICON_CANVAS[id] = ICON_CANVAS[f]; } };

Object.assign(VD_MEMOS, {
  ew_fell: { title: 'Felling order: the Elder Glade', from: 'M. Vale, Director of Acquisitions', body: `To: E. Stroud, Haulmaster, Elderwood

Fell every elder in the Glade over 200 years old. The young ones are no use to us: only the old trees carry enough of the root.

Do not discuss the purpose of the timber with local staff.

<small>Handwritten underneath: "All of it, Ewan. – M."</small>` },
  ew_rootwood: { title: 'Specification: bore lining', from: 'Dr C. Ash, Head of Research', body: `PROJECT TAPROOT. Bore lining, sections 1–400.

Steel fails within hours of contact with the Rootweave. Every alloy tested has withered.

Only one material survives: elder heartwood ("rootwood"), grown from the Rootweave itself. It does not burn, and it does not drain.

We need 12,000 beams. There is one forest in the world old enough.` },
  ew_haul: { title: 'Haul schedule', from: 'Greenline Timber, Elderwood camp', body: `All rootwood to SITE G by the old miners' tunnel.

Night convoys only. No lights past the quarry.

Site G assembly begins when the beam count reaches 12,000.

Current count: 9,450.` },
});
VD_MEMO_ORDER.push('ew_fell', 'ew_rootwood', 'ew_haul');
VD_PLACES.ewcamp.push({ k: 'memo', id: 'ew_fell', at: [14, 24] }, { k: 'memo', id: 'ew_rootwood', at: [29, 9] }, { k: 'memo', id: 'ew_haul', at: [33, 16] });
const ewPapers = () => ['ew_fell', 'ew_rootwood', 'ew_haul'].filter(id => vd().memos[id]).length;
const ewHaveSaplings = () => inv.count('elder_sapling') + (ew().planted || 0);
const EW_SEED_STUMPS = [[36, 22], [44, 24], [51, 21], [35, 38], [43, 42], [50, 37]];

const EW_Q2 = [
  // 4. Rootwood
  ewTask('ew_night', 'Sneak into the timber camp after dark', "The camp is at the east end of the haul road through the Elder Glade. Greenline guards it in the day. Tansy says the night shift is lazy.", () => ew().inCamp, {}, 'eldglade'),
  ewTask('ew_papers', () => `Find Greenline's papers in the camp (${ewPapers()}/3)`, 'Look round the camp for dropped papers. Mind the Field Techs.', () => ewPapers() >= 3, { gold: 3000 }, 'ewcamp'),
  ewTask('ew_alder2', 'Show Alder the papers', 'Alder is at his Lodge in Elderwood.', () => ew().papers, {}, 'elderwood'),
  ewTask('ew_mill', 'Fund the Old Town Mill', () => `On Elderwood's notice board. With the mill working, locals won't need Greenline's wages. (${EW_PROJECTS.ew_mill.gold}g, ${Object.entries(EW_PROJECTS.ew_mill.need).map(([k, n]) => n + ' ' + ITEMS[k].name).join(', ')})`, () => ewRepaired('ew_mill'), { gold: 4000 }, 'elderwood'),
  ewTask('ew_dunn', 'Talk to Gaffer Dunn at the mill', 'An old logger in Greenline hi-vis is standing outside the mill, staring at it.', () => ew().dunn, {}, 'elderwood'),
  // 5. Replant the Glade
  ewTask('ew_seeds', () => `Gather elder seeds from the felled stumps (${Math.min(12, ew().seeds || 0)}/12)`, 'The great stumps in the clear-cut still drop seeds. Each gives two a day. Look for the green glow.', () => (ew().seeds || 0) >= 12, {}, 'eldglade'),
  ewTask('ew_grow', () => `Grow 12 Elder Saplings on your farm (${Math.min(12, ewHaveSaplings())}/12)`, 'Plant the elder seeds in tilled soil on your farm and water them. They grow in any season and take 5 days.', () => ewHaveSaplings() >= 12, {}, 'farm'),
  ewTask('ew_plant', () => `Replant the clear-cut with Dunn's crew (${Math.min(12, ew().planted || 0)}/12)`, "Dunn's crew are waiting by the clear-cut in the Elder Glade.", () => (ew().planted || 0) >= 12, { gold: 6000, items: { mon_treat: 3 } }, 'eldglade'),
  // 6. The Harvester
  ewTask('ew_alarm', 'Tansy has news', 'Tansy is in Elderwood, and she looks frantic.', () => ew().alarm, {}, 'elderwood'),
  ewTask('ew_harv', 'Stop the Harvester at the Eldest Tree', 'Run! The Eldest Tree is west of the Elder Glade.', () => ew().stroud, { gold: 8000, items: { sturdy_charm: 5 } }, 'eldest'),
  // 7. The Wild Crest
  ewTask('ew_crest', 'Earn the Wild Crest from Warden Alder', "Alder is waiting at his Lodge. His team is level 63–67.", () => S.crests && S.crests.wild, { gold: 6000, items: { mon_treat: 3 } }, 'elderwood'),
];
{
  const i = QUESTS.findIndex(q => q.id === 'ew_home');
  QUESTS.splice(i + 1, 0, ...EW_Q2);
  const all = [...EW_Q, ...EW_Q2];
  EW_Q2.forEach(q => { const k = all.indexOf(q); QUEST_PLACE[q.id] = q._place; q.ready = () => all[k - 1].done(); });
}

/* ---------- the Wild Crest */
CREST_INFO.wild = ['🦌 Wild Crest', '#7a5a2a'];
{ const h = CREST_INFO.hearth; delete CREST_INFO.hearth; CREST_INFO.hearth = h; }   // keep Rowan's crest last
WARDEN_ORDER.splice(WARDEN_ORDER.indexOf('hearth'), 0, 'wild'); WARDEN_ACE.wild = 67;
const ALDER_TEAM = [['ramruff_2', 63], ['cobblerollie', 64], ['drummajor', 65], ['tanglebruin', 65], ['plumevix', 66], ['elderhart', 67]];
const STROUD_TEAM = [['cobblerollie', 64], ['tanglebruin', 64], ['simmerkit', 65], ['stumpstag', 65], ['mortarmour', 66]];   // collared haulers, and the sawmill's own Mortarmour

/* ---------- the camp: guarded by day */
ROUTES.eldglade.blocks = [{ area: [50, 30, 51, 33], ok: () => ewNight() || !!ew().campShut, f: 'crate' }];
const _ewGladeActors = ROUTES.eldglade.actors;
ROUTES.eldglade.actors = () => {
  const W = ew(), out = _ewGladeActors();
  if (!ewNight() && !W.campShut) out.push({ id: 'ew_guard', x: 49, y: 29, tex: 'tr_vtech', dir: 'left' });
  if (W.dunn && !W.campShut) EW_SEED_STUMPS.forEach(([x, y], k) => { if (((W.seedDay || {})[k] || -1) !== S.day && (W.seeds || 0) < 30) out.push({ id: 'ew_seed' + k, x, y, img: ['objects', 'stump'], glow: true }); });
  if (W.dunn && (W.planted || 0) < 12) out.push({ id: 'ew_dunn', x: 33, y: 30, tex: 'tr_' + trArt('dunn'), dir: 'right' });
  return out;
};
ROUTES.ewcamp.onEnter = sc => { if (ewNight() && !ew().inCamp) { ew().inCamp = 1; toast('You slip past the dozing guard and into the camp. Quietly now...', 3000); setTimeout(checkQuests, 400); } };
const _ewTownActors = ROUTES.elderwood.actors;
ROUTES.elderwood.actors = () => {
  const W = ew(), out = _ewTownActors();
  if (W.dunn && (W.planted || 0) >= 12) out.push({ id: 'ew_dunn', x: 64, y: 49, tex: 'tr_' + trArt('dunn'), dir: 'up' });
  else if (ewRepaired('ew_mill') && !W.dunn) out.push({ id: 'ew_dunn', x: 64, y: 49, tex: 'tr_' + trArt('dunn'), dir: 'up' });
  return out;
};
const _ewTreeActors = ROUTES.eldest.actors;
ROUTES.eldest.actors = () => {
  const W = ew(), out = _ewTreeActors();
  if (W.alarm && !W.stroud) out.push({ id: 'ew_harvester', x: 21, y: 15, img: ['qd', 'qd_crane'], scale: .9 }, { id: 'ew_stroud', x: 18, y: 17, tex: 'tr_' + trArt('stroud'), dir: 'left' });
  return out;
};

/* ---------- riding the stag */
const ewRiding = sc => !!(S.ewRide && sc && sc.scene && S.ewRide === sc.scene.key && !RC.town);
const _ewFast = Route.prototype.fastAt;
Route.prototype.fastAt = function (x, y) { return ewRiding(this) || (_ewFast ? _ewFast.call(this, x, y) : false); };
const _ewOdds = vdEncOdds;
vdEncOdds = function (sc) { return ewRiding(sc) ? 0 : _ewOdds(sc); };
const _ewEat = eatHeld;
eatHeld = function (slotIdx = S.sel) {
  const s = inv.slots[slotIdx];
  if (s && s.id === 'alders_horn') {
    const sc = scene; if (!sc || !(sc instanceof Route) || RC.town || RC.sail) { toast('You can only call the stag on a route.', 1800); return true; }
    if (S.ewRide === sc.scene.key) { S.ewRide = null; sc.player.clearTint(); toast('You slide off the stag. It trots back into the trees.', 2000); return true; }
    S.ewRide = sc.scene.key; Sound.play('gust'); sc.player.setTint(0xe8f0ff);
    toast("You blow Alder's horn. The silver stag bounds out of the trees and lets you climb on!", 2600); return true;
  }
  return _ewEat(slotIdx);
};

/* ---------- the story's doors and people (chapters 4–7) */
const _ewDoor1 = ewDoorHook;
ewDoorHook = (sc, id) => {
  const W = ew(), say = (lines, cb) => { Talk.say(lines, cb); return true; };
  if (id === 'ew_guard') return say([{ who: 'trainer', name: 'Field Tech', img: trainerPic('vtech', 0), t: "Woah, woah. Greenline Timber property. No visitors. Not today, not ever." },
    { who: 'trainer', name: 'Field Tech', img: trainerPic('vtech', 0), t: "Night shift's someone else's problem, mind. Bloke on nights sleeps in the hut with the radio on. Not that I'm telling you anything." }]);
  if (id === 'ew_lodge') {
    if (W.herdsHome && ewPapers() >= 3 && !W.papers) return say([EW.alder("Give them here.", 0), EW.alder("...", 0),
      EW.alder("Rootwood. They're not cutting my trees for timber. They're cutting them because the trees grew from the root.", 0),
      EW.alder("A bore lined with my forest, straight down to the mother tree. Under Smallroot. Under your gran's Hearthroot.", 0),
      EW.alder("Nine thousand beams already gone down that tunnel to this 'Site G'.", 0),
      EW.alder("Then we stop the felling. Today. And half the men doing it are my neighbours, so we do it carefully.", 0),
      EW.alder("Pruett's notice board. The mill. If the mill runs, the town doesn't need Greenline's money. Fund it, and I'll talk to Dunn.", 0)],
      () => { W.papers = 1; checkQuests(); });
    if (W.stroud && !(S.crests && S.crests.wild)) {
      openModal("Warden's Lodge", `<p>Warden Alder sets down his staff by the fire and picks up a carved horn instead. His Wild team is around <b>level 63–67</b>. Your team will be fully healed before the battle.</p><div class="row"><button class="btn gold" data-a="go">Challenge Warden Alder</button><button class="btn" data-a="no">Not yet</button></div>`, a => {
        closeModal(); if (a !== 'go') return;
        S.mons.forEach(restMon); refreshTeamBtn && refreshTeamBtn();
        Talk.say([EW.alder("The saws have stopped. The herds are home. Elderwood has a Warden again.", 0), EW.alder("So. Let's see what the forest thinks of you.", 0)], () => {
          const tm = ALDER_TEAM.map(wardenMon);
          Battle.start(tm[0], { label: 'Warden', name: 'Alder', team: tm, prize: 12000, boss: true, smart: true, heals: 2, lose: 'The forest is patient. Come back when you are.', onWin: () => {
            S.crests.wild = 1; inv.add('alders_horn', 1); renderHotbar();
            setTimeout(() => { Sound.play('gotcha'); Talk.say([EW.alder("Ha! The herds would follow you. That's the highest thing I can say about anyone.", 1),
              EW.alder("The Wild Crest. And take my horn. Blow it on any road and the silver stag will come and carry you. He likes you. Don't tell him I said.", 1),
              EW.tansy("Alder! Alder, I followed the haul road past the camp. It doesn't stop. It goes into the mountain, into an old miners' tunnel.", 0),
              EW.alder("The miners' tunnel. That comes out on the far side of the mountain, in the hollow. Gloamhollow.", 0),
              EW.alder("If anyone knows those tunnels, it's a miner. Your friend from the Old Mine. Brask. Find him.", 0)], () => toast('You received the Wild Crest! 🦌', 3200)); }, 400);
          } });
        });
      });
      return true;
    }
    if (S.crests && S.crests.wild) return say([EW.alder("The Glade's growing back. Slowly. Trees are patient. I'm learning to be.", 1)]);
  }
  if (id === 'ew_dunn') {
    if (!W.dunn) return say([EW.dunn("Forty years I worked that mill. Forty years. Then it shut, and the only work going was Greenline's.", 0),
      EW.dunn("And now it's open again. Saws running. Local wood, local hands.", 0),
      EW.dunn("Alder came to see me. Showed me the papers. Said I could choose.", 0),
      EW.dunn("Well. I've cut down enough of those trees.", 0),
      EW.dunn("I'm done with Greenline. Me and four of the lads. And if we're done cutting, we might as well start planting.", 1),
      EW.dunn("Them old stumps still drop seeds. Gather what you can, grow them up on that farm of yours, and bring them to the clear-cut. We'll be waiting.", 1)],
      () => { W.dunn = 1; Sound.play('levelup'); checkQuests(); ewRefresh(sc); });
    if (sc.scene.key === 'eldglade') {
      const have = inv.count('elder_sapling'), need = 12 - (W.planted || 0);
      if (!have) return say([EW.dunn(`${W.planted || 0} of 12 planted. Bring us saplings. Seeds from the stumps, grown on your farm in five days.`, 0)]);
      const n = Math.min(have, need); inv.remove('elder_sapling', n); renderHotbar(); W.planted = (W.planted || 0) + n;
      if (W.planted >= 12) { W.regrow = 1; W.regrowDay = S.day; }
      return say(W.planted >= 12 ? [EW.dunn("That's the twelfth. Look at that. A wood, again. Give it a few days and you won't know it was ever cut.", 1), EW.dunn("Go and see Alder's lass, Tansy. She came running through here looking for you a minute ago. White as a sheet.", 0)]
        : [EW.dunn(`${n} more in the ground. ${W.planted} of 12.`, 1)], () => { Sound.play('plant'); checkQuests(); ewRefresh(sc); });
    }
    return say([EW.dunn(W.planted >= 12 ? "Folk who wouldn't speak to each other a month ago were planting side by side. That's a good day's work." : "Seeds from the stumps, saplings on your farm, then to the clear-cut. Off you go.", 1)]);
  }
  if (id.startsWith('ew_seed')) {
    const k = +id.slice(7); W.seedDay = W.seedDay || {}; W.seedDay[k] = S.day; W.seeds = (W.seeds || 0) + 2;
    inv.add('elder_seed', 2); renderHotbar(); Sound.play('pick');
    toast(`You gather 2 Elder Seeds from the old stump. (${Math.min(12, W.seeds)}/12)`, 2200); checkQuests(); ewRefresh(sc); return true;
  }
  if (id === 'ew_tansy' && (W.planted || 0) >= 12 && !W.alarm) return say([EW.tansy("There you are! I ran all the way from the camp!", 0),
    EW.tansy("A woman came in a black car. All grey and green and quiet. Everyone stopped talking when she got out.", 0),
    EW.tansy("She told Stroud, the Haulmaster, to take the Eldest Tree. Today. And they've started up the Harvester!", 0),
    EW.tansy("It's a machine as big as a house. On legs. It walks to a tree and just... eats it.", 0),
    EW.tansy("It's heading for the Eldest Tree right now. West of the Glade. Please hurry!", 0)], () => { W.alarm = 1; checkQuests(); });
  if (id === 'ew_harvester') return say([{ ...vdSys(''), t: "The Harvester towers over the clearing: steel legs, a cab full of levers, and a great toothed saw arm reaching for the Eldest Tree's roots." }]);
  if (id === 'ew_stroud') { ewHarvester(sc); return true; }
  return _ewDoor1(sc, id);
};

async function ewHarvester(sc) {
  const W = ew(), H = (sc.ewSpr || {}).ew_harvester, St = (sc.ewSpr || {}).ew_stroud;
  await csMoment(sc, async () => {
    if (H) await csPan(sc, H.x, H.y - 30, 800);
    await csSay([EW.stroud("Stand aside, farmer. This is a work site, and that is a tree.", 0),
      EW.stroud("I've been felling trees for thirty years. They grow back. That's the beauty of it. Verdance has a replanting scheme.", 0),
      EW.stroud("Orders are orders. Ms Vale wants this one, and Ms Vale gets what she wants.", 0)]);
    // the herds come
    const sp = [[EW_MON.stag, -150], [EW_MON.boar, 150], [EW_MON.owl, -40]];
    for (const [mon, dx] of sp) {
      const m = hdSpr(sc.add.sprite((H ? H.x : sc.player.x) + dx, (H ? H.y : sc.player.y) + 30, 'mon_' + mon, 0).setOrigin(.5, 1).setDepth(9e6 - 40), mon);
      sc.tweens.add({ targets: m, x: (H ? H.x : sc.player.x) + dx / 4, duration: 900, ease: 'Quad.out' });
      Sound.play('thud'); sc.cameras.main.shake(250, .004); await csWait(500);
    }
    await csSay([{ ...vdSys(''), t: 'Hooves thunder through the forest. The silver stag, the bear matriarch and the night wolf burst into the clearing, and behind them, the whole herd.' },
      EW.stroud("What in the... Get those animals out of my way!", 0),
      EW.stroud("Fine. FINE. You want to play Warden? Let's see your team against my haulers.", 0)]);
  });
  const tm = STROUD_TEAM.map(([s, l]) => { const m = trainerMon(s, l); m.collar = 1; return m; });
  await vdCollarPics(tm);
  Battle.start(tm[0], { label: 'Haulmaster', name: 'Stroud', team: tm, prize: 6000, boss: true, smart: true, heals: 2, intro: ['Haulmaster Stroud wants to battle!', `${SPECIES[tm[0].sp].name} is hooked up to a Verdance drain! Its colour has faded...`], lose: 'Thirty years...',
    onWin: () => setTimeout(async () => {
      await csMoment(sc, async () => {
        if (H) await csPan(sc, H.x, H.y - 30, 600);
        await csSay([{ ...vdSys(''), t: "The drain collars on Stroud's team crack and fall away. His Fablemon shake themselves, and trot over to stand with the herd." },
          { ...vdSys(''), t: 'The herd charges. The stag drives its antlers into the Harvester\'s leg, the bear shoulders the other, and the wolf\'s shadow-maw clamps onto the cab.' }]);
        if (H) { sc.cameras.main.shake(900, .01); Sound.play('thud'); sc.tweens.add({ targets: H, angle: 18, x: H.x + 40, alpha: 0, duration: 1600, ease: 'Quad.in' }); await csWait(1700); }
        await csSay([{ ...vdSys(''), t: "The Harvester staggers, tips, and goes crashing back down the haul road, all the way into the camp's log pond with an enormous splash." },
          EW.stroud("...", 0),
          EW.stroud("Thirty years. I told every one of my crews the trees grow back.", 0),
          EW.stroud("I never asked what Verdance wanted the old ones for. I didn't want to know.", 0),
          EW.stroud("Tell Alder the camp's shut. I'll send the lads home. And I'll be telling Ms Vale myself.", 1)]);
      });
      W.stroud = 1; W.campShut = 1; vd().shut.camp = S.day; S.trainers = S.trainers || {}; S.trainers.ew_stroud = 1;
      Sound.play('levelup'); toast('Greenline Timber has shut its Elderwood camp! The Fernwalk checkpoint is open.', 3600); checkQuests(); ewRefresh(sc);
    }, 400) });
}

/* ---------- nights: the second clear-cut grows back three nights after planting */
const _ewNightly = nightly;
nightly = function (passedOut) {
  const r = _ewNightly(passedOut);
  try { const W = S.ew; if (W && W.regrow === 1 && S.day >= (W.regrowDay || 0) + 3) W.regrow = 2; if (S.ewRide) S.ewRide = null; } catch (e) { }
  return r;
};

/* ---------- Meanwhile, at the Spire */
CUTAWAYS.push(
  { id: 'ew_felling', when: () => !!(S.ew && S.ew.papers), lines: () => [
    VS.vale("Mr Stroud. You're behind schedule.", 0),
    { who: 'trainer', name: 'Haulmaster Stroud', img: trainerPic('stroud', 0), t: "The herds are back, Ms Vale. And the locals are funny about the old trees. If we just stuck to the—" },
    VS.vale("The old trees are the point, Mr Stroud.", 0),
    VS.vale("Start the Harvester. Fell the Eldest Tree. All of it, Ewan.", 1)] },
  { id: 'ew_timber', when: () => !!(S.ew && S.ew.campShut), lines: () => [
    VS.thorne("Elderwood is closed. The farmer, again. And a herd of deer."),
    VS.ash("It doesn't matter. We have nine thousand beams. Enough to line the top of the bore, and the rest can follow.", 0),
    VS.vale("Then stop waiting for it to be perfect, Corvin.", 0),
    VS.vale("Move everything to Site G. The hollow under the mountain. Begin assembly.", 1),
    VS.thorne("And the farmer?"),
    VS.vale("The farmer will come to us. They always do.", 1)] },
);

/* ============================================================ things to do in Elderwood besides the story
   The Forest Stores (open once the mill runs), a rest at the Antler Inn (heals your team), daily foraging in the
   Glade and on Fernwalk (wild mushrooms, elderberries, the odd truffle), and three new recipes. */
Object.assign(ITEMS, {
  wild_mushroom: { name: 'Wild Mushrooms', stack: 999, sell: 160, desc: 'Plump brown woodland mushrooms. Sells for 160g.' },
  elderberry: { name: 'Elderberries', stack: 999, sell: 120, desc: 'Clusters of tiny dark berries from the elder trees. Sells for 120g.' },
  mushroom_stew: { name: 'Forest Mushroom Stew', stack: 99, eat: 180, sell: 640, desc: 'A rich, dark stew of wild mushrooms and potato. Restores 180 energy.' },
  elderberry_cordial: { name: 'Elderberry Cordial', stack: 99, eat: 120, sell: 520, desc: 'Sweet, deep purple and very slightly fizzy. Restores 120 energy.' },
  truffle_omelette: { name: 'Truffle Omelette', stack: 99, eat: 240, sell: 1300, desc: "Alder's favourite: eggs, cheese and shaved forest truffle. Restores 240 energy." },
});
COOKING.push({ out: 'mushroom_stew', need: { wild_mushroom: 2, potato: 1 } }, { out: 'elderberry_cordial', need: { elderberry: 3, honey: 1 } }, { out: 'truffle_omelette', need: { truffle: 1, egg: 2, cheese: 1 } });
const _ewItems3 = hdItems;
hdItems = async function () { await _ewItems3(); for (const [id, f] of [['wild_mushroom', 'potato'], ['elderberry', 'berry'], ['mushroom_stew', 'veg_soup'], ['elderberry_cordial', 'berry_crumble'], ['truffle_omelette', 'omelette']]) if (!ICONS[id] || ICONS[id] === ICONS.wood) { ICONS[id] = ICONS[f]; ICON_CANVAS[id] = ICON_CANVAS[f]; } };
const EW_SHOP = [['salt_lick', 400], ['elder_seed', 200], ['tonic', 110], ['mon_treat', 250], ['sturdy_charm', 130], ['skyward_charm', 300]];

// forage spots: each gives its find once a day
const EW_FORAGE = {
  fernwalk: [['wild_mushroom', 9, 24], ['elderberry', 27, 14], ['wild_mushroom', 26, 52], ['elderberry', 11, 50]],
  eldglade: [['wild_mushroom', 12, 10], ['elderberry', 22, 30], ['wild_mushroom', 40, 12], ['elderberry', 8, 44], ['truffle', 18, 34]],
  eldest: [['wild_mushroom', 9, 22], ['elderberry', 23, 8]],
};
for (const [key, spots] of Object.entries(EW_FORAGE)) {
  const prev = ROUTES[key].actors || (() => []);
  ROUTES[key].actors = () => {
    const out = prev(), F = (ew().forage = ew().forage || {});
    spots.forEach(([item, x, y], k) => { if (F[key + k] !== S.day && (item !== 'truffle' || ew().herds.boar)) out.push({ id: `ew_forage_${key}_${k}`, x, y, img: ['objects', item === 'elderberry' ? 'bush_round' : 'wildflowers'], glow: item === 'truffle' }); });
    return out;
  };
}

const _ewDoor2 = ewDoorHook;
ewDoorHook = (sc, id) => {
  if (id.startsWith('ew_forage_')) {
    const [, , key, k] = id.split('_'), [item] = EW_FORAGE[key][+k], n = item === 'truffle' ? 1 : 2 + (Math.random() < .35 ? 1 : 0);
    (ew().forage = ew().forage || {})[key + k] = S.day; inv.add(item, n); renderHotbar(); Sound.play('pick');
    toast(item === 'truffle' ? 'A Hollowcub is snuffling here... and it digs you up a truffle!' : `You gather ${n} ${ITEMS[item].name}.`, 2200); ewRefresh(sc); return true;
  }
  if (id === 'ew_store') {
    if (!ewRepaired('ew_mill')) return false;
    const render = () => `${ewKeeper('oliver', 'Oliver', "Now the mill's running, the shelves are filling up again. Salt licks, seeds, the usual. And anything you forage, I'll take off your hands.")}<div class="mlist">${EW_SHOP.map(([i, p]) => shopRow(i, p, 0, 1)).join('')}</div>`;
    openModal('Forest Stores', render(), (a, d) => { if (a === 'buy') buy(d.id, +d.p, +d.n || 1); $('mBody').innerHTML = render(); });
    return true;
  }
  if (id === 'ew_inn') {
    openModal('The Antler Inn', ewKeeper('hazel', 'Hazel', "Sit down, love. You look like you've walked through the whole forest. Your Fablemon can curl up by the hearth.", 1) + '<div class="row"><button class="btn gold" data-a="heal">Rest by the fire (heal my team)</button></div>', a => {
      if (a === 'heal') { S.mons.forEach(restMon); refreshTeamBtn(); Sound.play('fill'); toast('Your Fablemon are fully healed and their moves are restored!', 2400); closeModal(); }
    });
    return true;
  }
  if (id === 'ew_carver') return Talk.say([EW.ellis(ewRepaired('ew_bridge') ? "Ellis. I carve. Birds, mostly. Sometimes stags, when the stag holds still, which is never." : "...", 1),
    EW.ellis(ew().regrow ? "You helped plant the clear-cut. I'll carve something for your house one day. When I've the wood to spare. From fallen branches only." : "Every offcut Greenline leaves behind, I collect. Seems a shame to waste a six-hundred-year-old tree twice.", 0)]), true;
  return _ewDoor2(sc, id);
};

/* ---------- the map */
{
  const P = MAP_PLACES.find(p => p.k === 'elderwood');
  if (P) {
    Object.assign(P, { soon: 0, route: 1, warden: ['Alder', 'wild', 6], notes: () => [ew().campShut ? '✔ The saws have stopped' : '🪓 Greenline Timber is felling the Glade', '🍄 Forage in the woods'] });
    MAP_PLACES.splice(MAP_PLACES.indexOf(P), 0,
      { k: 'fernwalk', name: 'Fernwalk', al: 'l', x: .875, y: .42, route: 1, notes: () => [ew().campShut ? '✔ Checkpoint gone' : ew().deer ? '🦌 Old deer path round the checkpoint' : '🚧 Verdance checkpoint'] },
      { k: 'eldglade', name: 'The Elder Glade', al: 'b', x: .88, y: .32, route: 1, notes: () => [ew().regrow ? '🌱 Replanted' : '🪵 Clear-cut zones', ew().campShut ? '✔ Timber camp shut' : '🏭 Greenline Timber camp to the east'] });
  }
}
