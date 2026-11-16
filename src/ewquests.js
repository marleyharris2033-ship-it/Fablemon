/* ============================================================ Elderwood quest line, chapters 1–3 (plan: claude/elderwood-plan.md)
   1. The Haul Road      Bramble hands over Alder's letter (opens Quarrydown's east road) → Fernwalk → Tansy shows you
                         the old deer path round the Verdance checkpoint → Elderwood.
   2. A town split       Alder won't battle while the saws run → Mayor Pruett and the timber lease → fund the footbridge.
   3. The Scattered Herds  Alder asks you to bring home three herd leaders:
                         the stag (follow its hoofprints through the Glade; lose the trail and start again; a salt lick calms it),
                         the boar matriarch (stuck in a logging pit: a Stone or Wild Fablemon clears the rubble and a Gale one
                         lifts the logs; then three truffles, rooted up by her piglets round the Glade),
                         the owl elder (at night, light the five lanterns round the Eldest Tree in the carvings' order).
   State: S.ew = { deer, alder, mayor, herdAsk, trail, stagFound, pitClear, pig: {}, lamps: [], owlFound, herds: {}, herdsHome }
   The herd leaders, piglets and story people use stand-in art until the user's Elderwood Fablemon and characters arrive. */
Object.assign(ITEMS, {
  salt_lick: { name: 'Salt Lick', stack: 99, sell: 50, desc: 'A block of mineral salt. Wild herd Fablemon find it hard to resist.' },
  truffle: { name: 'Forest Truffle', stack: 99, sell: 420, desc: 'A knobbly black truffle that smells wonderful. Boar Fablemon root them up in old woods.' },
});
const _ewItems = hdItems;
hdItems = async function () { await _ewItems(); for (const [id, f] of [['salt_lick', 'stone'], ['truffle', 'potato']]) if (!ICONS[id] || ICONS[id] === ICONS.wood) { ICONS[id] = ICONS[f]; ICON_CANVAS[id] = ICON_CANVAS[f]; } };

// stand-in people (portraits borrowed from other trainers until theirs arrive)
Object.assign(TRAINER_TYPES, {
  tansy: { label: 'Ranger', art: 'forager', challenge: ['Ready?'], lose: ['Aw.'], after: ['Come on!'] },
  pruett: { label: 'Mayor', art: 'birdwatcher', challenge: ['...'], lose: ['...'], after: ['...'] },
  dunn: { label: 'Logger', art: 'miner', challenge: ['...'], lose: ['...'], after: ['...'] },
  stroud: { label: 'Haulmaster', art: 'dunmore', challenge: ['...'], lose: ['...'], after: ['...'] },
  ellis: { label: 'Carver', art: 'busker', challenge: ['...'], lose: ['...'], after: ['...'] },
});
const EWS = (kind, name) => (t, f = 0) => ({ who: 'trainer', name, img: trainerPic(kind, f), t });
const EW = {
  bramble: (t, f = 1) => ({ who: 'bramble', t, f }),
  alder: EWS('alder', 'Warden Alder'), tansy: EWS('tansy', 'Tansy'), pruett: EWS('pruett', 'Mayor Pruett'),
  dunn: EWS('dunn', 'Gaffer Dunn'), stroud: EWS('stroud', 'Haulmaster Stroud'), ellis: EWS('ellis', 'Ellis the carver'),
};
const EW_MON = { stag: 'heathfoal_2', boar: 'ramruff_2', piglet: 'tusskip', owl: 'flurrowl_2' };   // stand-ins
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
  ewTask('ew_alder1', "Visit Warden Alder at his Lodge", "Alder's Lodge is on the east side of Elderwood's square.", () => ew().alder, {}, 'elderwood'),
  ewTask('ew_mayor', 'Hear Mayor Pruett out', "The Mayor's house is in the north of town. Tansy says he's at the inn most days, avoiding everyone.", () => ew().mayor, {}, 'elderwood'),
  ewTask('ew_bridge', 'Fund the paddock footbridge', () => `Use Elderwood's notice board in the square. The herd paddock is across the river. (${EW_PROJECTS.ew_bridge.gold}g, ${Object.entries(EW_PROJECTS.ew_bridge.need).map(([k, n]) => n + ' ' + ITEMS[k].name).join(', ')})`, () => ewRepaired('ew_bridge'), { gold: 1500 }, 'elderwood'),
  // 3. The Scattered Herds
  ewTask('ew_ask', 'Talk to Alder about the herds', "Now the footbridge is up, Alder wants a word at his Lodge.", () => ew().herdAsk, {}, 'elderwood'),
  ewTask('ew_herds', () => `Bring the herd leaders home (${ewHerds()}/3)`, () => [
    ew().herds.stag ? '✔ the stag' : "The stag: in the Elder Glade's west woods. Follow its hoofprints, and don't stray from them. It loves a salt lick.",
    ew().herds.boar ? '✔ the boar matriarch' : 'The boar matriarch: trapped in a logging pit in the clear-cut, east of the Glade. You\'ll need strong Fablemon, and something tasty.',
    ew().herds.owl ? '✔ the owl elder' : 'The owl elder: only at night, at the Eldest Tree, west of the Glade.'].join('<br>'), () => ewHerds() >= 3, { gold: 4000, items: { mon_treat: 3 } }, 'eldglade'),
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
const LAMPS = [['moon', 9, 12], ['stag', 21, 12], ['root', 7, 19], ['owl', 23, 19], ['boar', 15, 23]];
const LAMP_ORDER = ['root', 'stag', 'boar', 'owl', 'moon'];
const LAMP_TEXT = { moon: 'a crescent moon', stag: 'a running stag', root: 'a tangle of roots', owl: 'an owl with spread wings', boar: 'a boar with her piglets' };

ROUTES.fernwalk.actors = () => ew().deer ? [] : [{ id: 'ew_tansy', x: 15, y: 37, tex: 'tr_' + trArt('tansy'), dir: 'right' }];
ROUTES.elderwood.actors = () => {
  const out = [];
  if (ew().deer) out.push({ id: 'ew_tansy', x: 18, y: 25, tex: 'tr_' + trArt('tansy'), dir: 'down' });
  if (ew().herds.stag) out.push({ id: 'ew_pstag', x: 25, y: 3, mon: EW_MON.stag });
  if (ew().herds.boar) out.push({ id: 'ew_pboar', x: 29, y: 3, mon: EW_MON.boar });
  if (ew().herds.owl) out.push({ id: 'ew_powl', x: 18, y: 5, mon: EW_MON.owl });
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
    PIGLETS.forEach(([x, y], k) => { if (!(W.pig || {})[k]) out.push({ id: 'ew_pig' + k, x, y, mon: EW_MON.piglet }); });
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
ROUTES.eldest.signs['12,18'] = "Carvings run round the roots. Read from the ground up: first the roots, then the stag that runs above them, the boar beneath the stag's hooves, the owl in the branches, and last of all the moon.";

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
    if (W.herdAsk && !W.herdsHome) return say([EW.tansy(ewHerds() >= 3 ? "All three home! Go and tell Alder, quick!" : "The stag likes salt. The boar likes truffles. The owl likes... nobody, really. But she likes the old lanterns.", 1)]);
    return say([EW.tansy(W.alder ? "Alder's been like a thundercloud since the lease was signed. Don't take it personally." : "That's Alder's Lodge, east side of the square. Knock loud. He pretends not to hear.", 0)]);
  }
  if (id === 'ew_lodge') {
    if (!W.alder) return say([EW.alder("...", 0), EW.alder("You're Edie's grandchild. You have her chin. Stubborn.", 0),
      EW.alder("I asked Bramble to send you. Now you're here I don't know what to say to you.", 0),
      EW.alder("If you've come for a Crest, there isn't one. There's no Warden in Elderwood while the saws run. Just an old man who let them in.", 0),
      EW.alder("Go and ask Pruett what he signed. Then you'll understand.", 0)], () => { W.alder = 1; checkQuests(); });
    if (W.mayor && ewRepaired('ew_bridge') && !W.herdAsk) return say([EW.alder("You built the footbridge. Hm.", 0),
      EW.alder("Then I'll ask you something I can't do myself. The herds have scattered. When the big trees come down, the herds lose their way.", 0),
      EW.alder("Three of them lead the rest: the silver stag, the old boar matriarch, and the owl elder. Bring those three home and the herds will follow.", 0),
      EW.alder("The stag is somewhere in the west woods of the Glade. Find its prints and don't lose them. It won't come near you without this.", 0),
      EW.alder("The boar's down by the clear-cut. She'll be angry. The owl only flies at night, round the Eldest Tree. Tansy knows the lanterns.", 0)],
      () => { W.herdAsk = 1; inv.add('salt_lick', 1); renderHotbar(); toast('Alder gave you a Salt Lick.', 2400); checkQuests(); });
    if (W.herdAsk && ewHerds() >= 3 && !W.herdsHome) return say([EW.alder("I heard them coming down the north track at dawn. All of them. The whole herd.", 1),
      EW.alder("I stood at the paddock gate like a fool and cried into my beard.", 1),
      EW.alder("Thank you. Your gran would have done the same, and she'd have been smug about it for a month.", 1),
      EW.alder("Now. Those saws. I've a feeling you're about to ask what Verdance actually wants with my trees. So am I.", 0)], () => { W.herdsHome = 1; checkQuests(); });
    if (W.herdAsk && !W.herdsHome) return say([EW.alder(`${ewHerds()} of 3. ${ew().herds.stag ? '' : "The stag's prints are in the west woods. "}${ew().herds.boar ? '' : "The boar's in the clear-cut. "}${ew().herds.owl ? '' : 'The owl comes out at night, at the Eldest Tree.'}`, 0)]);
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
    toast(['A piglet snuffles at the roots and roots up a truffle! It drops it at your feet and trots off.', "This piglet's found a truffle too. It looks very pleased with itself.", 'The last piglet squeals, digs, and presents a truffle. Then it runs off towards the clear-cut.'][Object.keys(W.pig).length - 1] || 'Another truffle!', 3200);
    ewRefresh(sc); return true;
  }
  if (id === 'ew_boar') {
    if (!W.pitClear) {
      const stone = ewHasType('Stone') || ewHasType('Wild'), gale = ewHasType('Gale');
      if (!stone || !gale) return say([{ who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: "A huge old boar is stuck in a pit where a tree's been dragged out, pinned under fallen logs and rubble. She snorts and thrashes." },
        { who: 'trainer', name: 'The Elder Glade', img: monPic(EW_MON.boar, 'front'), t: `To get her out you'll need ${stone ? '' : 'a Stone or Wild Fablemon to clear the rubble'}${!stone && !gale ? ', and ' : ''}${gale ? '' : 'a Gale Fablemon to lift the logs'} on your team.` }]);
      W.pitClear = 1;
      return say([{ who: 'trainer', name: 'The Elder Glade', img: monPic(EW_MON.boar, 'front'), t: 'Your Fablemon get to work: rubble is shoved aside, and with a great gust the logs lift and roll clear of the pit.' },
        { who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: "The boar scrambles out... and squares up to you, furious and starving. She sniffs the air. Truffles might change her mind. Her piglets are scattered round the Glade." }], () => ewRefresh(sc));
    }
    if (inv.count('truffle') < 3) return say([{ who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: `She snorts at you. You have ${inv.count('truffle')} truffle${inv.count('truffle') === 1 ? '' : 's'}. She looks like she'd want three. Her piglets are rooting about somewhere in the Glade.` }]);
    inv.remove('truffle', 3); renderHotbar();
    return say([{ who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: 'You set down three truffles. The boar eats them in about a second, then leans her whole enormous weight against your legs, grunting happily.' },
      { who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: 'She trots off north, and her piglets come running from every direction to follow her home.' }],
      () => { W.herds.boar = 1; Sound.play('levelup'); toast('The boar matriarch is heading home! (' + ewHerds() + '/3)', 3000); checkQuests(); ewRefresh(sc); });
  }
  if (id.startsWith('ew_lamp_')) {
    const sym = id.slice(8); W.lamps = W.lamps || [];
    if (W.lamps.includes(sym)) return say([{ who: 'trainer', name: 'The Eldest Tree', img: monPic(EW_MON.owl, 'front'), t: `This lantern is carved with ${LAMP_TEXT[sym]}. It's burning softly.` }]);
    if (!ewNight()) return say([{ who: 'trainer', name: 'The Eldest Tree', img: monPic(EW_MON.owl, 'front'), t: `An old roost lantern, carved with ${LAMP_TEXT[sym]}. Tansy said the owls only come at night. It'd be no use lighting it now.` }]);
    if (LAMP_ORDER[W.lamps.length] !== sym) { const had = W.lamps.length; W.lamps = []; Sound.play('error'); toast(had ? 'A cold gust puts every lantern out. That must be the wrong order...' : `You light the lantern carved with ${LAMP_TEXT[sym]}... and it gutters out at once.`, 3000); ewRefresh(sc); return true; }
    W.lamps.push(sym); Sound.play('pick');
    if (W.lamps.length === LAMP_ORDER.length) { W.owlFound = 1; toast('The last lantern catches. High in the Eldest Tree, two great round eyes open...', 3600); }
    else toast(`The lantern carved with ${LAMP_TEXT[sym]} flickers into light.`, 2000);
    ewRefresh(sc); return true;
  }
  if (id === 'ew_owl') return say([{ who: 'trainer', name: 'The owl elder', img: monPic(EW_MON.owl, 'front'), t: 'A huge, ancient owl drops silently from the branches and lands on the lantern pole beside you. It looks at you for a very long time.' },
    { who: 'trainer', name: 'The owl elder', img: monPic(EW_MON.owl, 'front'), t: 'Then it hoots, once, low and soft, and glides away north towards Elderwood. All around the tree, smaller wings follow.' }],
    () => { W.herds.owl = 1; Sound.play('levelup'); toast('The owl elder is heading home! (' + ewHerds() + '/3)', 3000); checkQuests(); ewRefresh(sc); });
  if (id === 'ew_pstag') return say([{ who: 'trainer', name: 'The silver stag', img: monPic(EW_MON.stag, 'front'), t: 'The stag grazes by the paddock fence. It ignores you magnificently.' }]);
  if (id === 'ew_pboar') return say([{ who: 'trainer', name: 'The boar matriarch', img: monPic(EW_MON.boar, 'front'), t: 'The boar matriarch grunts and pushes her snout into your pocket, looking for truffles.' }]);
  if (id === 'ew_powl') return say([{ who: 'trainer', name: 'The owl elder', img: monPic(EW_MON.owl, 'front'), t: ewNight() ? 'The owl elder watches the paddock, wide awake.' : 'The owl elder is asleep on the fence post, one eye very slightly open.' }]);
  return false;
};
