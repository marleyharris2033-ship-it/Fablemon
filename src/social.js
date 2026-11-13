/* ============================================================ Friendship and festivals
   Friendship: 250 points per heart, 10 hearts. Talking (once a day) +20, gifts by taste (two a week,
   any number on a birthday at ×5). Heart events at 2, 5 and 8 hearts: a short scene, then the villager's
   favourite gifts, a present, and finally a lasting perk.
   Festivals: one a season in the Smallroot square, each with its own mini-game. */

/* ---------- tastes and birthdays ([season index, day]) */
const TASTE = {
  monty: { love: ['corn_fritters', 'jacket_potato'], like: ['corn', 'honey', 'mon_treat'], hate: ['watercress', 'stone'] },
  willa: { love: ['watercress_salad', 'tomato_salad'], like: ['honey', 'berry', 'cranberry', 'fish_pie'], hate: ['bog_peat', 'stone'] },
  gideon: { love: ['corn_chowder', 'hearth_roast'], like: ['veg_soup', 'stone', 'hearty_stew', 'jacket_potato'], hate: ['berry_crumble', 'watercress'] },
  robin: { love: ['pumpkin_pie', 'tavern_pie'], like: ['wood', 'jacket_potato', 'corn_fritters'], hate: ['fiber', 'bog_peat'] },
  barney: { love: ['pumpkin_pie', 'fen_chowder'], like: ['corn', 'honey', 'wild_rice', 'brook_trout'], hate: ['watercress_salad', 'feed'] },
  hattie: { love: ['glazed_carrots', 'premium_feed'], like: ['carrot', 'turnip', 'potato', 'feed'], hate: ['fish_pie', 'bog_peat'] },
  stanley: { love: ['jacket_potato', 'trainers_breakfast'], like: ['roast_turnip', 'honey', 'potato'], hate: ['cranberry_tart', 'fiber'] },
  rowan: { love: ['mon_treat', 'hearth_roast'], like: ['corn_chowder', 'honey', 'grilled_trout'], hate: ['berry', 'tomato'] },
  poppy: { love: ['cranberry_tart', 'glazed_carrots'], like: ['berry', 'tomato', 'honey'], hate: ['stone', 'minnow'] },
  finn: { love: ['berry_crumble', 'mon_treat'], like: ['berry', 'honey', 'corn_fritters'], hate: ['watercress', 'veg_soup'] },
  ivy: { love: ['lotus_root', 'tomato_salad'], like: ['pumpkin', 'cranberry', 'lotus_stirfry'], hate: ['stone', 'corn_chowder'] },
  fenwick: { love: ['fen_chowder', 'pumpkin_pie'], like: ['corn_chowder', 'veg_soup', 'silver_perch', 'fish_pie'], hate: ['berry_crumble', 'turnip'] },
};
const BDAY = { monty: [1, 13], willa: [0, 6], hattie: [0, 21], finn: [0, 27], poppy: [1, 4], robin: [1, 18], ivy: [1, 26], barney: [2, 3], fenwick: [2, 10], rowan: [2, 24], gideon: [3, 9], stanley: [3, 17] };
const isBirthday = (id, day = S.day) => { const b = BDAY[id], sd = seasonDay(day); return !!b && b[0] === sd.si && b[1] === sd.dom; };
const bdayText = id => BDAY[id] ? `${BDAY[id][1]} ${SEASONS[BDAY[id][0]]}` : '?';
const GIFT_PTS = { love: 80, like: 45, neutral: 20, hate: -40 };
function tasteOf(id, item) {
  item = (ITEMS[item] && ITEMS[item].qbase) || item;   // a gold turnip is still a turnip
  const t = TASTE[id] || { love: [], like: [], hate: [] };
  return t.love.includes(item) ? 'love' : t.hate.includes(item) ? 'hate' : (t.like.includes(item) || (VILL[id].likes || []).includes(item)) ? 'like' : 'neutral';
}
const giftWeek = () => Math.floor((S.day - 1) / 7);
function giftsLeft(id) { const g = (S.town.gw || {})[id]; return g && g[0] === giftWeek() ? Math.max(0, 2 - g[1]) : 2; }
function canGift(id) { return (S.town.giftDay || {})[id] !== S.day && (isBirthday(id) || giftsLeft(id) > 0); }
function learnTaste(id, item, taste) { const k = S.town.known = S.town.known || {}; (k[id] = k[id] || {})[item] = taste; }
function giveGift(id, item, after) {
  const v = VILL[id], tw = S.town, bday = isBirthday(id), taste = tasteOf(id, item), nm = ITEMS[item].name;
  if (!inv.remove(item, 1)) return after && after();
  tw.giftDay = tw.giftDay || {}; tw.giftDay[id] = S.day;
  if (!bday) { tw.gw = tw.gw || {}; const g = tw.gw[id]; tw.gw[id] = g && g[0] === giftWeek() ? [g[0], g[1] + 1] : [giftWeek(), 1]; }
  addFP(id, GIFT_PTS[taste] * (bday && taste !== 'hate' ? 5 : 1)); learnTaste(id, item, taste);
  renderHotbar(); Sound.play(taste === 'love' ? 'levelup' : taste === 'hate' ? 'error' : 'pop');
  const say = {
    love: `${nm}! Oh, how did you know? I absolutely love these!`,
    like: `${nm}? Thank you, that's lovely.`,
    neutral: `For me? That's kind of you. Thank you!`,
    hate: `Oh. ${nm}. Um... thanks, I suppose.`,
  }[taste];
  const L = { who: id, name: v.name, img: VPIC[id + 0], hearts: heartStr(id), t: (bday && taste !== 'hate' ? 'And on my birthday, too! ' : '') + say };
  Talk.say([L], after);
}

/* ---------- heart events */
const PERKS = {
  willa: 'Clinic medicine costs 25% less', gideon: 'Tool upgrades cost 20% less gold', robin: 'Wood bundles cost a third less',
  barney: 'The tavern menu costs 25% less', hattie: 'Fablemon feed costs 25% less', stanley: 'Charms from lost property every Monday',
  rowan: 'Your Fablemon gain 10% more experience', poppy: 'Honey in your mailbox every Monday', finn: 'A Fablemon treat every Monday',
  ivy: 'Seeds from her garden every Monday', fenwick: 'Travel tonics every Monday',
};
const DISC = { willa: .75, robin: .67, barney: .75, hattie: .75 };
const WEEKLY = { stanley: ['root_charm', 5], poppy: ['honey', 3], finn: ['mon_treat', 1], fenwick: ['tonic', 2], ivy: 'seeds' };
var curVendor = null;
const hasPerk = id => !!(S.town.perks || {})[id];
const friendPrice = p => curVendor && hasPerk(curVendor) && DISC[curVendor] ? Math.round(p * DISC[curVendor]) : p;
for (const [home, f] of Object.entries(SERVICE)) SERVICE[home] = (...a) => { curVendor = VILL_IDS.find(v => VILL[v].home === home) || null; return f(...a); };

// lines: plain strings, said by the villager; choice: [question, [answer, reply, points], [answer, reply, points]]
const HEART_EVENTS = {
  willa: [
    { at: 2, lines: ['Oh, {name}! Perfect timing. Could you hold this jar steady for me?', "There. Feverfew tincture. My grandmother's recipe.", 'She used to say a healer\'s first medicine is a cup of tea and a good listen.'],
      choice: ['Willa offers you a cup of tea.', ['Gladly. Tell me about her.', 'She ran the clinic here long before me. It\'s nice to tell her stories to someone again.', 60], ["Sorry, I'm in a rush.", 'Of course, of course. Another time!', 10]] },
    { at: 5, gift: true, lines: ['I had a Rillip in today with a thorn stuck in its fin. Shaking like a leaf, poor thing.', 'It made me think of you, actually. You\'re always out there keeping them safe.', 'The clinic feels less lonely with you popping in. Here, I want you to have these.'] },
    { at: 8, perk: true, lines: ['{name}, can I tell you something? When I came back, the clinic was full of dust. I nearly turned round and left.', 'Then you woke the Hearthroot, and the whole town woke with it. I stayed because of that.', 'So from now on, my medicine is a quarter off for you. No arguing!'] },
  ],
  gideon: [
    { at: 2, lines: ['Hmph. You again.', '...Hand me those tongs. No, the other ones.', 'My father forged the old iron fence round the Hearthroot. Every bar by hand.'],
      choice: ['Gideon stares into the forge.', ["I'd love to see his work.", "Most of it's rusted away. But I kept one bar. Maybe one day I'll make something worthy of it.", 60], ['Must be hot work.', 'Hot? This is nothing. You should feel her at full blast.', 20]] },
    { at: 5, gift: true, lines: ["Brought you something. Don't make a fuss.", 'Charms. Proper ones, mind. Tempered twice.', 'Use them well.'] },
    { at: 8, perk: true, lines: ['Sit. ...I finished it. The bar from my father\'s fence.', 'A hook for your door, shaped like a Hearthroot leaf. For luck.', "And from now on, your tool upgrades cost a fifth less gold. A friend doesn't pay full price at my forge."] },
  ],
  robin: [
    { at: 2, lines: ["{name}! Look at this. I'm sketching plans for a bandstand in the square.", 'Music every Friday, lanterns strung across the trees. Can you picture it?'],
      choice: ['Robin shows you the drawing.', ["It's brilliant! Smallroot needs this.", "You really think so? Right. I'm doing it. Someday. Probably. Definitely!", 60], ['It looks a bit wobbly.', "Wobbly?! That's... actually fair. I'll add another brace.", 30]] },
    { at: 5, gift: true, lines: ["I've been thinking. You've done more for this town than anyone.", "So I've put aside a big stack of seasoned timber for you. Go on, take it!"] },
    { at: 8, perk: true, lines: ['Guess what I found under the workshop floor? My old gaffer\'s plane. Still sharp!', 'He always said: build for people, not for praise.', "So here's my promise. A bundle of my wood costs you a third less, now and always."] },
  ],
  barney: [
    { at: 2, lines: ['Pull up a stool, friend. Quiet night.', 'I opened this place the year Bramble became mayor. Forty years, near enough.', 'Some nights it was just me and the mice.'],
      choice: ['Barney polishes a glass.', ['You must have some stories.', 'Stories? Ha! Ask me about the night a Fleecebolt got into the cellar. Another time. It\'s a long one.', 60], ["I'm glad it's busier now.", "Aye, so am I. You've had a hand in that.", 30]] },
    { at: 5, gift: true, lines: ['Here, on the house. My last batch of Fablemon treats.', 'The trick is a pinch of honey and a lot of love.'] },
    { at: 8, perk: true, lines: ['{name}, sit down a moment. I want to say this properly.', 'When the town emptied, I kept a lamp lit in the window every night. Silly, maybe.', 'Then one night someone walked in off the road. You.', "From now on, the menu's a quarter off for you. Don't tell Marigold."] },
  ],
  hattie: [
    { at: 2, lines: ["Shh! Look. That Tusskip's letting me brush her. Took three weeks.", 'Fablemon are like people. Patience gets you further than treats.'],
      choice: ['Hattie holds out the brush.', ['Let me have a go.', "Gentle strokes, with the fur... see? She's smiling!", 60], ["I'd rather watch.", "Fair enough. She's fussy with strangers anyway.", 20]] },
    { at: 5, gift: true, lines: ['Your lot at the ranch always look so happy.', "Here's a sack of my best feed. On me."] },
    { at: 8, perk: true, lines: ["I've decided something. I'm going to raise farm animals here again, like my mum did.", 'You made me believe this place has a future.', "Feed's a quarter off for you from now on. Partner's rates!"] },
  ],
  stanley: [
    { at: 2, lines: ['Ah, {name}. Would you care to see the timetable? The 1962 edition.', 'Every train, every stop. Brookholt, Quarrydown, the City...'],
      choice: ['Stanley unrolls a yellowed timetable.', ['Tell me about the old line.', 'Oh, it was splendid! Steam, whistles, porters calling out. Thank you for asking. Nobody ever asks.', 60], ['Very... thorough.', 'Isn\'t it? Thorough is exactly the word. Ahem.', 20]] },
    { at: 5, gift: true, lines: ['I found a box of charms in the lost property office.', "Unclaimed for thirty years. I think it's time they found a good home."] },
    { at: 8, perk: true, lines: ['I polish the station clock every morning, as you know.', "Yesterday I noticed it's been keeping perfect time again. Ever since you arrived.", "I'll send you a little something from lost property each Monday. Station perks, you might say."] },
  ],
  rowan: [
    { at: 2, lines: ['You battle like Mabel taught you. Did she?', 'She taught me too, once. I was terrible.'],
      choice: ['Rowan watches your team closely.', ['Any advice?', "Don't just command them. Listen. A Fablemon tells you when it's ready.", 60], ['I worked it out myself.', "Hm. Confidence. Good. Don't let it turn into carelessness.", 30]] },
    { at: 5, gift: true, lines: ['Take these treats. Your team has earned them.', 'I can see the bond between you growing.'] },
    { at: 8, perk: true, lines: ['I want to show you something.', 'Every Warden of Smallroot has carried this whistle. I have no use for it now.', "Your Fablemon will train harder hearing it. They'll gain a tenth more experience from every battle."] },
  ],
  poppy: [
    { at: 2, lines: ['Oh! You caught me talking to my roses.', 'My mother always said plants grow better if you tell them your worries.'],
      choice: ['Poppy looks a little tired.', ["What's worrying you?", 'Just wondering if moving here was right for Finn. Seeing him so happy, I think it was. Thank you for asking.', 60], ['Do they answer back?', 'Ha! Not yet. Though that one looks a bit sulky.', 30]] },
    { at: 5, gift: true, lines: ["I made far too much honey this week.", 'Here. No, I insist!'] },
    { at: 8, perk: true, lines: ['Finn drew a picture of our family. Me, him... and you, with all your Fablemon.', "You've become family to us, {name}.", "Every Monday I'll leave a few jars of honey in your mailbox. No arguing."] },
  ],
  finn: [
    { at: 2, lines: ["{name}! Watch! I've been practising my Warden pose!", 'Hyah! ...Was that cool? Be honest.'],
      choice: ['Finn waits, wide-eyed.', ['That was the coolest pose ever!', "YES! I knew it! I'm gonna show Mum!", 60], ['Try bending your knees more.', 'Like this? Hyah! Oh, that IS better!', 40]] },
    { at: 5, gift: true, lines: ['I found these charms by the river!', "I want you to have them 'cause you're my best friend."] },
    { at: 8, perk: true, lines: ["I made a list of every Fablemon I've ever seen. You're on it too. Number one!", "When I'm a Warden, you're gonna be my first battle.", "And I'll save you my best treat every week. Promise!"] },
  ],
  ivy: [
    { at: 2, lines: ['Can I paint you? Just hold still for... oh, you moved again.', "Never mind. I've got your outline."],
      choice: ['Ivy shows you a quick sketch.', ["It's beautiful!", 'Really? I always think my faces look like potatoes. Thank you.', 60], ['Is that my nose?', "...It's a work in progress!", 30]] },
    { at: 5, gift: true, lines: ["I've been pressing flowers from the meadow.", 'These are for your farm. Plant them somewhere sunny.'] },
    { at: 8, perk: true, lines: ['I finished the Hearthroot painting. Want to know the secret? I painted it the day you arrived.', "The tree hadn't changed. The light had.", "I'll send you seeds from my garden every Monday. Plant something beautiful."] },
  ],
  fenwick: [
    { at: 2, lines: ['Ah, {name}! Did I ever tell you about the Frost Fablemon? No? Splendid!', 'Picture it: a blizzard, a cave, a pair of glowing blue eyes...'],
      choice: ['Fenwick leans in dramatically.', ['What happened next?!', 'It shared my soup. Lovely chap. Then it flew off into the aurora. Ha!', 60], ['Is this going to take long?', 'Harrumph! The short version: it was cold.', 10]] },
    { at: 5, gift: true, lines: ['Here, for your adventures. Charms from my travel trunk.', "They've been to four continents!"] },
    { at: 8, perk: true, lines: ["I've decided to write my memoirs. Chapter one: 'Smallroot, and the Farmer Who Woke It.'", "Don't look so surprised. You've made an old explorer feel at home.", "I'll send you a pair of my travel tonics every Monday. Keep exploring!"] },
  ],
};
function nextHeartEvent(id) {
  const evs = HEART_EVENTS[id]; if (!evs) return null;
  const seen = (S.town.ev || {})[id] || 0, ev = evs[seen];
  return ev && heartsOf(id) >= ev.at ? ev : null;
}
const nameList = ids => { const n = ids.map(i => ITEMS[i] ? ITEMS[i].name : i); return n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0]; };
function playHeartEvent(id, ev, after) {
  const v = VILL[id], tw = S.town;
  tw.ev = tw.ev || {}; tw.ev[id] = (tw.ev[id] || 0) + 1;
  const L = (t, f) => ({ who: id, name: v.name, img: VPIC[id + f], hearts: heartStr(id), t });
  const lines = ev.lines.map((t, i) => L(t, i % 2));
  const finish = () => {
    const tail = [];
    if (ev.at === 2) { tail.push(L(`Oh, and between you and me... I adore ${nameList(TASTE[id].love)}.`, 1)); for (const it of TASTE[id].love) learnTaste(id, it, 'love'); }
    const done = () => {
      if (ev.gift) { const [gi, gn] = v.gift; inv.add(gi, gn); renderHotbar(); Sound.play('gotcha'); toast(`${v.name} gave you ${gn} ${ITEMS[gi].name}!`, 2600); }
      if (ev.perk) { tw.perks = tw.perks || {}; tw.perks[id] = 1; Sound.play('levelup'); toast(`💛 ${v.name}'s friendship perk: ${PERKS[id]}`, 3600); }
      after && after();
    };
    tail.length ? Talk.say(tail, done) : done();
  };
  Sound.play('pop');
  Talk.say(lines, () => {
    if (!ev.choice) return finish();
    const [q, ...opts] = ev.choice;
    openModal(`${v.name}`, `<p style="font-style:italic">${q}</p><div style="display:flex;flex-direction:column;gap:8px">${opts.map((o, i) => `<button class="btn" data-a="pick" data-i="${i}">${o[0]}</button>`).join('')}</div>`, (a, d) => {
      if (a !== 'pick') return;
      const o = opts[+d.i]; closeModal(); addFP(id, o[2]);
      Talk.say([L(o[1], 0)], finish);
    });
  });
}

/* ---------- each night: birthdays, Monday deliveries, festival notices */
function socialNight(bits) {
  const tw = S.town, sd = seasonDay();
  for (const id of VILL_IDS) if (tw.met[id] && isBirthday(id)) bits.push(`🎂 It's ${VILL[id].name}'s birthday today`);
  if (sd.wd === 'Mon') {
    respawnPickups(); bits.push('🌿 New items have turned up along the routes');
    const got = [];
    for (const [id, w] of Object.entries(WEEKLY)) {
      if (!hasPerk(id)) continue;
      if (w === 'seeds') {
        const seeds = Object.keys(ITEMS).filter(k => ITEMS[k].seed && CROPS[ITEMS[k].seed] && CROPS[ITEMS[k].seed].seasons.includes(sd.si) && !CROPS[ITEMS[k].seed].bog && !CROPS[ITEMS[k].seed].edge);
        const s = seeds[Math.floor(Math.random() * seeds.length)]; if (s) { inv.add(s, 5); got.push(`${VILL[id].name}: 5 ${ITEMS[s].name}`); }
      } else { inv.add(w[0], w[1]); got.push(`${VILL[id].name}: ${w[1]} ${ITEMS[w[0]].name}`); }
    }
    if (got.length) bits.push(`📬 Gifts from friends (${got.join(', ')})`);
  }
  const f = festToday();
  if (f && tw.visited) bits.push(`${f.icon} Today: the ${f.name} in Smallroot square, ${fmtTime(f.from)} to ${fmtTime(f.to)}`);
  const tom = festOn(S.day + 1); if (tom && tw.visited) bits.push(`${tom.icon} Tomorrow: the ${tom.name}`);
  if (sd.si === 3 && sd.dom === 1) secretFriend();
}

/* ---------- festivals */
const FESTS = [
  { id: 'sprout', si: 0, day: 13, name: 'Sprout Race', icon: '🏁', from: 540, to: 900, blurb: 'Race one of your Fablemon round the square. Tap Cheer when the marker is in the green for a burst of speed.' },
  { id: 'firefly', si: 1, day: 11, name: 'Firefly Night', icon: '✨', from: 1140, to: 1380, blurb: 'Catch as many fireflies as you can before the lanterns go out. Golden ones count triple.' },
  { id: 'harvest', si: 2, day: 16, name: 'Harvest Show', icon: '🎃', from: 540, to: 960, blurb: 'Enter your finest crop, fish or dish. The judges award ribbons and prizes, and you keep your entry.' },
  { id: 'hearthlight', si: 3, day: 25, name: 'Hearthlight Night', icon: '🕯️', from: 1020, to: 1320, blurb: 'A secret gift exchange and a feast beneath the glowing Hearthroot.' },
];
const festOn = day => { const sd = seasonDay(day); return FESTS.find(f => f.si === sd.si && f.day === sd.dom) || null; };
const festToday = () => festOn(S.day);
const festKey = f => f.id + seasonDay().year;
const festDone = f => !!(S.fests || {})[festKey(f)];
const festNow = () => { const f = festToday(); return f && S.town.visited && S.time >= f.from && S.time < f.to && !festDone(f) ? f : null; };
function secretFriend() {
  const y = seasonDay().year; S.secret = S.secret || {};
  if (!S.secret[y]) { const met = VILL_IDS.filter(id => S.town.met[id]); S.secret[y] = met.length ? met[Math.floor(Math.random() * met.length)] : 'willa'; }
  return S.secret[y];
}
const BRAMBLE = (t, f = 0) => ({ who: 'bramble', t, f });
function festTown(sc) {
  const f = festToday(); if (!f) return;
  festDecor(sc, f);
  if (festNow()) setTimeout(() => { if (!Talk.open && !$('modal').classList.contains('show')) festOffer(); }, 900);
  else if (!festDone(f) && S.time < f.from) setTimeout(() => toast(`${f.icon} The ${f.name} starts at ${fmtTime(f.from)} in the square.`, 3200), 700);
}
function festOffer() {
  const f = festNow(); if (!f) return;
  Talk.say([BRAMBLE(`Ah, {name}! Welcome to the ${f.name}!`), BRAMBLE(f.blurb, 1)], () => {
    openModal(`${f.icon} ${f.name}`, `<p>${f.blurb}</p><p class="hint">Joining takes the rest of the festival: you'll be done at ${fmtTime(f.to)}.</p><div class="row"><button class="btn" data-a="no">Not yet</button><button class="btn gold" data-a="yes">Join in</button></div>`, a => {
      if (a === 'no') return closeModal();
      if (a === 'yes') ({ sprout: festRace, firefly: festFireflies, harvest: festHarvest, hearthlight: festHearthlight })[f.id](f);
    });
  });
}
function festEnd(f, msg) {
  S.fests = S.fests || {}; S.fests[festKey(f)] = 1;
  for (const id of VILL_IDS) if (S.town.met[id]) addFP(id, 30);
  S.time = Math.max(S.time, f.to); updateHUD(); renderHotbar();
  if (scene && scene.festDecor) scene.festDecor.forEach(o => o.setAlpha(o.alpha * .6));
  toast(`${msg} Everyone enjoyed having you there.`, 3600);
}
function prize(gold, items = []) {
  S.gold += gold; for (const [id, n] of items) inv.add(id, n); updateHUD(); renderHotbar(); Sound.play('coin');
  return [gold ? `${gold.toLocaleString()}g` : '', ...items.map(([id, n]) => `${n} ${ITEMS[id].name}`)].filter(Boolean).join(', ');
}
const PLACE = ['1st', '2nd', '3rd', '4th'];

// --- Spring: the Sprout Race
function festRace(f) {
  const mons = team().filter(m => m.hp > 0);
  if (!mons.length) { closeModal(); return Talk.say([BRAMBLE("Oh dear, you'll need a Fablemon fit to run! Come back after a rest.")]); }
  openModal('🏁 Choose your runner', `<p>Who will race?</p><div class="mlist">${mons.map((m, i) => `<div class="shoprow"><img src="${monPicOf(m)}"><div class="g"><b>${monName(m)}</b><small>Lv ${m.lv} · Speed ${monStat(m, 'spd')}</small></div><button class="btn gold" data-a="go" data-i="${i}">Race</button></div>`).join('')}</div>`, (a, d) => { if (a === 'go') runRace(f, mons[+d.i]); });
}
function runRace(f, mine) {
  const yr = seasonDay().year;
  const R = [{ name: monName(mine), sp: mine.sp, you: 1 }, { name: "Finn's Tusskip", sp: 'tusskip' }, { name: "Hattie's Cloverclasp", sp: 'cloverclasp' }, { name: "Fenwick's Whirplet", sp: 'whirplet' }];
  const myBase = Math.min(1.25, .55 + monStat(mine, 'spd') / 260);
  R.forEach((r, i) => { r.x = 0; r.v = r.you ? myBase : .62 + i * .03 + (yr - 1) * .05; r.boost = 0; r.done = 0; });
  openModal('🏁 Sprout Race', `<div id="race" style="position:relative;background:#cfe3b2;border:3px solid #5e3b20;padding:6px 6px 6px 6px">
    ${R.map((r, i) => `<div style="position:relative;height:44px;border-bottom:2px dashed #9cba7c;${r.you ? 'background:#fff3c4' : ''}"><span style="position:absolute;left:4px;top:2px;font-size:11px;opacity:.7">${r.name}</span><img id="rr${i}" src="${monPic(r.sp)}" style="position:absolute;left:0;bottom:0;width:36px;height:36px;image-rendering:pixelated;transition:left .05s linear"><span style="position:absolute;right:2px;top:10px;font-size:18px">🏁</span></div>`).join('')}
  </div>
  <div style="margin:10px 0 4px;position:relative;height:18px;background:#e8d49c;border:2px solid #5e3b20"><div style="position:absolute;left:40%;width:20%;top:0;bottom:0;background:#7ec85a"></div><div id="needle" style="position:absolute;top:-3px;bottom:-3px;width:5px;background:#2a1e1a;left:0"></div></div>
  <div id="rmsg" style="text-align:center;min-height:20px;font-weight:700">Get ready...</div>
  <div class="row" style="justify-content:center"><button class="btn gold" data-a="cheer" style="font-size:20px;padding:10px 40px">Cheer!</button></div>`, a => {
    if (a !== 'cheer' || !run) return;
    if (cool > 0) return; cool = 8;
    const ok = nd > 40 && nd < 60; R[0].boost = ok ? 22 : 0; $('rmsg').textContent = ok ? 'Great cheer! 💨' : 'Too early or late!'; Sound.play(ok ? 'levelup' : 'click');
  }, () => { clearInterval(tk); });
  let t = 0, nd = 0, dir = 1, run = 0, cool = 0, order = [];
  const tk = setInterval(() => {
    t++;
    if (t === 20) { run = 1; $('rmsg').textContent = 'Go!'; Sound.play('pop'); }
    nd += dir * 4.2; if (nd >= 100 || nd <= 0) dir *= -1; const ne = $('needle'); if (ne) ne.style.left = `calc(${nd}% - 2px)`;
    if (!run) return; if (cool > 0) cool--;
    R.forEach((r, i) => {
      if (r.done) return;
      if (!r.you && !r.boost && Math.random() < .03) r.boost = 22;
      r.x += r.v * (r.boost ? 1.65 : 1) * (.85 + Math.random() * .3) * .55; if (r.boost) r.boost--;
      if (r.x >= 100) { r.x = 100; r.done = 1; order.push(i); }
      const im = $('rr' + i); if (im) im.style.left = `calc(${Math.min(r.x, 100) * .88}%)`;
    });
    if (order.length === R.length || (order.includes(0) && order.length >= 2 && t > 400)) {
      clearInterval(tk); R.forEach((r, i) => { if (!order.includes(i)) order.push(i); });
      const place = order.indexOf(0);
      const won = prize(...[[1000, [['mon_treat', 2]]], [400, [['mon_treat', 1]]], [150, []], [50, []]][place]);
      closeModal(); addFP('finn', place === 0 ? 40 : 10);
      Talk.say([BRAMBLE(`${PLACE[place]} place for ${monName(mine)}! ${place === 0 ? 'What a sprint!' : place === 3 ? 'Every runner deserves a cheer.' : 'Splendid running!'}`), BRAMBLE(`Your prize: ${won}.`, 1)], () => festEnd(f, `You came ${PLACE[place]} in the Sprout Race.`));
    }
  }, 50);
}

// --- Summer: Firefly Night
function festFireflies(f) {
  openModal('✨ Firefly Night', `<p style="margin:4px 0">Tap the fireflies! <b id="ffs">0</b> caught · <span id="fft">25</span>s</p><canvas id="ffc" width="320" height="320" style="width:100%;max-width:420px;display:block;margin:0 auto;background:radial-gradient(#25304a,#0d1220);border:3px solid #5e3b20;touch-action:none"></canvas>`, null, () => { stop = 1; });
  const cv = $('ffc'), g = cv.getContext('2d'); let flies = [], score = 0, t0 = performance.now(), stop = 0, last = 0, pops = [];
  const spawn = () => flies.push({ x: 20 + Math.random() * 280, y: 40 + Math.random() * 260, vx: (Math.random() - .5) * .9, vy: (Math.random() - .5) * .9, ph: Math.random() * 6, gold: Math.random() < .12, life: 260 + Math.random() * 200 });
  for (let i = 0; i < 6; i++) spawn();
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 320 / r.width, y = (e.clientY - r.top) * 320 / r.height;
    const hit = flies.findIndex(q => Math.hypot(q.x - x, q.y - y) < 24); if (hit < 0) return;
    const q = flies.splice(hit, 1)[0]; score += q.gold ? 3 : 1; pops.push({ x: q.x, y: q.y, a: 1, gold: q.gold }); Sound.play(q.gold ? 'levelup' : 'pop'); $('ffs').textContent = score;
  });
  const loop = now => {
    if (stop) return;
    const el = (now - t0) / 1000, left = Math.max(0, 25 - el); const ft = $('fft'); if (ft) ft.textContent = Math.ceil(left);
    if (now - last > 420 && flies.length < 12) { spawn(); last = now; }
    g.clearRect(0, 0, 320, 320);
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(120,160,90,.25)'; g.fillRect((i * 37) % 320, 300 + (i * 13) % 20, 3, 20); }
    flies = flies.filter(q => (q.life -= 1) > 0);
    for (const q of flies) {
      q.ph += .12; q.vx += (Math.random() - .5) * .1; q.vy += (Math.random() - .5) * .1; q.vx *= .98; q.vy *= .98;
      q.x = Math.max(8, Math.min(312, q.x + q.vx * 1.6)); q.y = Math.max(8, Math.min(312, q.y + q.vy * 1.6));
      const a = .45 + .55 * Math.abs(Math.sin(q.ph)), c = q.gold ? '255,210,60' : '200,255,120';
      const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 16); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(q.x - 16, q.y - 16, 32, 32); g.fillStyle = `rgba(255,255,230,${a})`; g.fillRect(q.x - 2, q.y - 2, 4, 4);
    }
    for (const p of pops) { p.a -= .04; g.fillStyle = `rgba(255,240,150,${Math.max(0, p.a)})`; g.font = 'bold 14px sans-serif'; g.fillText(p.gold ? '+3' : '+1', p.x - 8, p.y - (1 - p.a) * 20); }
    pops = pops.filter(p => p.a > 0);
    if (left <= 0) {
      stop = 1; closeModal();
      const items = score >= 35 ? [['mon_treat', 2], ['honey', 3]] : score >= 20 ? [['mon_treat', 1]] : [];
      const won = prize(score * 12, items); addFP('ivy', 20);
      Talk.say([{ who: 'ivy', name: VILL.ivy.name, img: VPIC.ivy0, hearts: heartStr('ivy'), t: `${score} fireflies! ${score >= 35 ? "That's a festival record, I think!" : score >= 20 ? 'The square is glowing!' : 'They are quick little things, aren\'t they?'}` }, BRAMBLE(`For your lantern-filling efforts: ${won || 'a round of applause'}!`, 1)], () => festEnd(f, `You caught ${score} fireflies.`));
      return;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// --- Fall: the Harvest Show
const SHOW_SKIP = new Set(['wood', 'stone', 'fiber', 'root_charm', 'sturdy_charm', 'skyward_charm', 'fertiliser', 'feed', 'premium_feed', 'bog_peat', 'mon_treat', 'tonic']);
function festHarvest(f) {
  const ids = [...new Set(inv.slots.filter(s => s && ITEMS[s.id] && ITEMS[s.id].sell && !ITEMS[s.id].seed && !SHOW_SKIP.has(s.id)).map(s => s.id))].sort((a, b) => ITEMS[b].sell - ITEMS[a].sell);
  if (!ids.length) { closeModal(); return Talk.say([BRAMBLE("You've nothing to enter, dear! Bring a crop, a fish or a dish next time. Do stay for the pie, though.")], () => festEnd(f, 'You watched the Harvest Show.')); }
  openModal('🎃 Harvest Show', `<p>Choose your entry. You'll get it back afterwards.</p><div class="mlist">${ids.map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>Worth ${ITEMS[id].sell}g</small></div><button class="btn gold" data-a="enter" data-id="${id}">Enter</button></div>`).join('')}</div>`, (a, d) => {
    if (a !== 'enter') return;
    const yr = seasonDay().year, mine = ITEMS[d.id].sell * (.9 + Math.random() * .2), k = 1 + (yr - 1) * .3;
    const rivals = [['Hattie', 'pumpkin', 260 * k], ['Robin', 'pumpkin_pie', 520 * k], ['Barney', 'fen_chowder', 880 * k]].map(([who, id, s]) => [who, id, s * (.85 + Math.random() * .3)]);
    const place = rivals.filter(r => r[2] > mine).length;
    const won = prize(...[[2000, [['mon_treat', 2]]], [800, [['mon_treat', 1]]], [300, []], [60, []]][place]);
    closeModal();
    const lines = [BRAMBLE(`The judges have tasted, prodded and sniffed everything. Ahem!`), BRAMBLE(`Third... second... and first place...`, 1),
      BRAMBLE(place === 0 ? `goes to {name}'s ${ITEMS[d.id].name}! A blue ribbon!` : `The blue ribbon goes to ${rivals.sort((a, b) => b[2] - a[2])[0][0]}. {name}, your ${ITEMS[d.id].name} came ${PLACE[place]}.`), BRAMBLE(`Your prize: ${won}.`, 1)];
    Talk.say(lines, () => festEnd(f, `Your ${ITEMS[d.id].name} came ${PLACE[place]} at the Harvest Show.`));
  });
}

// --- Winter: Hearthlight Night
function festHearthlight(f) {
  const sf = secretFriend(), v = VILL[sf];
  const ids = [...new Set(inv.slots.filter(s => giftable(s)).map(s => s.id))];
  const end = got => {
    const from = pick(VILL_IDS.filter(id => S.town.met[id] && id !== sf)) || sf, [gi, gn] = VILL[from].gift;
    inv.add(gi, gn); renderHotbar();
    for (const id of VILL_IDS) if (S.town.met[id]) addFP(id, 20);
    S.energy = S.maxEnergy;
    Talk.say([{ who: from, name: VILL[from].name, img: VPIC[from + 0], hearts: heartStr(from), t: `Happy Hearthlight, {name}! I picked this out just for you.` },
      BRAMBLE('And now, the feast! Eat up, everyone. The Hearthroot is glowing brighter than I\'ve seen it in years.', 1)],
      () => festEnd(f, `${got} You received ${gn} ${ITEMS[gi].name} from ${VILL[from].name}, and the feast restored your energy.`));
  };
  const intro = [BRAMBLE('Gather round, everyone! Time for the secret gift exchange!'), BRAMBLE(`{name}, your secret friend this year is... ${v.name}!`, 1)];
  closeModal();
  Talk.say(intro, () => {
    if (!ids.length) { addFP(sf, 40); return Talk.say([{ who: sf, name: v.name, img: VPIC[sf + 0], hearts: heartStr(sf), t: 'No gift? Oh, a hug is a perfectly good present. Happy Hearthlight!' }], () => end('You gave a warm hug.')); }
    openModal(`🕯️ A gift for ${v.name}`, `<p>Choose a present for your secret friend.</p><div class="mlist">${ids.map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b>${(S.town.known?.[sf] || {})[id] ? `<small>${({ love: 'Loves it', like: 'Likes it', neutral: 'Not fussed', hate: 'Dislikes it' })[S.town.known[sf][id]]}</small>` : ''}</div><button class="btn gold" data-a="give" data-id="${id}">Give</button></div>`).join('')}</div>`, (a, d) => {
      if (a !== 'give' || !inv.remove(d.id, 1)) return;
      closeModal(); const taste = tasteOf(sf, d.id); learnTaste(sf, d.id, taste); addFP(sf, taste === 'hate' ? -20 : GIFT_PTS[taste] * 3); renderHotbar();
      const said = { love: `${ITEMS[d.id].name}! You know me so well. This is the best Hearthlight ever!`, like: `Oh, ${ITEMS[d.id].name}! Thank you, I'll treasure it.`, neutral: 'How thoughtful of you. Thank you, and happy Hearthlight!', hate: `Ah... ${ITEMS[d.id].name}. Well, it's the thought that counts!` }[taste];
      Talk.say([{ who: sf, name: v.name, img: VPIC[sf + 0], hearts: heartStr(sf), t: said }], () => end(`You gave ${ITEMS[d.id].name} to ${v.name}.`));
    });
  });
}

/* ---------- festival decorations in the square */
function festDecor(sc, f) {
  const objs = sc.festDecor = [], d = 9e6 - 30;
  const bunting = (x0, x1, y, cols) => {
    const g = sc.add.graphics().setDepth(d); objs.push(g);
    const X0 = x0 * T, X1 = x1 * T, Y = y * T, n = Math.round((X1 - X0) / 7), sag = 10;
    g.lineStyle(1, 0x5e3b20, 1); g.beginPath(); g.moveTo(X0, Y);
    for (let i = 1; i <= 20; i++) { const tt = i / 20; g.lineTo(X0 + (X1 - X0) * tt, Y + Math.sin(Math.PI * tt) * sag); } g.strokePath();
    for (let i = 0; i < n; i++) { const tt = (i + .5) / n, x = X0 + (X1 - X0) * tt, yy = Y + Math.sin(Math.PI * tt) * sag; g.fillStyle(cols[i % cols.length], 1); g.fillTriangle(x - 3, yy, x + 3, yy, x, yy + 6); }
  };
  const glow = (x, y, r, col, a) => { const c = sc.add.circle(x, y, r, col, a).setDepth(d + 1).setBlendMode(Phaser.BlendModes.ADD); objs.push(c); return c; };
  if (f.id === 'sprout' || f.id === 'harvest') {
    const cols = f.id === 'sprout' ? [0xf4a6c0, 0xfff1a8, 0xa8e0f4, 0xc8f0a0] : [0xd9822b, 0xb5432c, 0xe8c040, 0x7a4a20];
    bunting(29, 44, 27, cols); bunting(29, 44, 31, cols);
  }
  if (f.id === 'firefly') {
    bunting(29, 44, 27, [0xffd27a, 0xa8e0f4, 0xd8ff8a]);
    for (let i = 0; i < 30; i++) {
      const x = 30 * T + Math.random() * 14 * T, y = 24 * T + Math.random() * 10 * T, halo = glow(x, y, 7, 0xd8ff8a, .35), c = glow(x, y, 2.5, 0xffffd0, 1);
      sc.tweens.add({ targets: [halo, c], x: x + (Math.random() - .5) * 60, y: y + (Math.random() - .5) * 40, alpha: .1, duration: 1400 + Math.random() * 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }
  if (f.id === 'hearthlight') {
    bunting(29, 44, 28, [0xffd27a, 0xff9a4a, 0xffe9b0]);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = glow(36 * T + 8 + Math.cos(a) * 70, 22 * T + Math.sin(a) * 34, 6, 0xffb050, .5); sc.tweens.add({ targets: c, alpha: .2, duration: 900 + i * 60, yoyo: true, repeat: -1 }); }
  }
}

/* ---------- friends list and calendar */
function heartRow(id) { const h = heartsOf(id); return `<span style="color:#d0405a;letter-spacing:1px">${'♥'.repeat(h)}</span><span style="color:#cbb79a;letter-spacing:1px">${'♥'.repeat(10 - h)}</span>`; }
function openFriends() {
  const tw = S.town;
  const rows = VILL_IDS.map(id => {
    const v = VILL[id];
    if (!tw.met[id]) return `<div class="shoprow" style="opacity:.5"><div style="width:48px;height:48px;background:#cbb79a"></div><div class="g"><b>???</b><small>Not met yet</small></div></div>`;
    const known = Object.entries((tw.known || {})[id] || {}), nx = nextEventAt(id);
    const kn = known.length ? known.map(([it, t]) => `<img src="${iconFor(it)}" title="${ITEMS[it] ? ITEMS[it].name : it}" style="width:20px;height:20px;vertical-align:middle;${t === 'hate' ? 'filter:grayscale(1);opacity:.6' : ''}">${t === 'love' ? '💛' : ''}`).join(' ') : '<i>Give gifts to learn what they like</i>';
    return `<div class="shoprow" style="align-items:flex-start"><img src="${VPIC[id + 0]}" style="width:48px;height:48px"><div class="g"><b>${v.name}</b> ${isBirthday(id) ? '🎂' : ''}<div style="font-size:13px">${heartRow(id)}</div>
      <small>Birthday ${bdayText(id)} · Gifts this week ${2 - giftsLeft(id)}/2${(tw.giftDay || {})[id] === S.day ? ' · Gift given today' : ''}</small>
      <small style="display:block">${hasPerk(id) ? `💛 ${PERKS[id]}` : nx ? `Next heart event at ${nx} hearts` : ''}</small><div style="margin-top:2px;font-size:12px">${kn}</div></div></div>`;
  }).join('');
  openModal('Friends', `<p style="font-size:13px">Talk to villagers each day and bring them gifts (two a week, any number on their birthday). Special scenes play at 2, 5 and 8 hearts.</p><div class="mlist">${rows}</div>`);
}
function nextEventAt(id) { const evs = HEART_EVENTS[id] || [], seen = (S.town.ev || {})[id] || 0; return evs[seen] ? evs[seen].at : null; }
function openCalendar(si0) {
  let si = si0 == null ? seasonDay().si : si0;
  const render = () => {
    const sd = seasonDay(), cells = [];
    for (let d = 1; d <= 28; d++) {
      const fe = FESTS.find(f => f.si === si && f.day === d), bd = VILL_IDS.filter(id => BDAY[id][0] === si && BDAY[id][1] === d && S.town.met[id]);
      const today = si === sd.si && d === sd.dom;
      cells.push(`<div style="position:relative;aspect-ratio:1;background:${today ? '#ffe9a0' : fe ? '#f4dcc0' : '#fffaea'};border:2px solid ${today ? '#d99a1e' : '#d8c49a'};padding:1px 2px;font-size:11px;overflow:hidden"><span class="num">${d}</span>${fe ? `<div style="font-size:15px;text-align:center">${fe.icon}</div>` : ''}${bd.map(id => `<img src="${VPIC[id + 0]}" style="position:absolute;right:1px;bottom:1px;width:20px;height:20px;border:1px solid #5e3b20">`).join('')}</div>`);
    }
    const fe = FESTS.find(f => f.si === si), bds = VILL_IDS.filter(id => BDAY[id][0] === si && S.town.met[id]).sort((a, b) => BDAY[a][1] - BDAY[b][1]);
    const sec = si === 3 && S.secret && S.secret[sd.year] ? `<p>🎁 Your Hearthlight secret friend: <b>${VILL[S.secret[sd.year]].name}</b></p>` : '';
    return `<div style="display:flex;gap:4px;margin-bottom:6px">${SEASONS.map((s, i) => `<button class="btn ${i === si ? 'gold' : ''}" data-a="s" data-s="${i}" style="flex:1;padding:4px 0">${s}</button>`).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:10px;text-align:center;margin-bottom:2px">${WEEK.map(w => `<b>${w}</b>`).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${cells.join('')}</div>
      <p style="margin-top:8px">${fe.icon} <b>${fe.day} ${SEASONS[si]}: ${fe.name}</b>, ${fmtTime(fe.from)} to ${fmtTime(fe.to)} in Smallroot square.<br><small>${fe.blurb}</small></p>${sec}
      ${bds.length ? `<p>🎂 ${bds.map(id => `${VILL[id].name} (${BDAY[id][1]})`).join(', ')}</p>` : ''}`;
  };
  openModal('Calendar', render(), (a, d) => { if (a === 's') { si = +d.s; $('mBody').innerHTML = render(); } });
}

/* ============================================================ Seasonal dressing
   The same maps every season, dressed with props from the seasonal sheet, drifting leaves or petals,
   butterflies, and (in winter) snow along every upward-facing edge of the buildings and trees. */
const SEASON_PROPS = [
  { flat: ['p_petals'], small: ['p_tulips', 'p_daffs'], big: ['p_bush', 'p_birdbox', 'p_planter'], square: ['p_bush', 'p_planter', 'p_birdbox', 'p_bush'], farm: ['p_birdbox', 'p_planter'], fly: 1 },
  { flat: [], small: ['s_flowers', 's_flowers', 's_sunflower'], big: ['s_hay', 's_sunflower'], square: ['s_umbrella', 's_melon', 's_stand', 's_lanterns', 's_umbrella', 's_hay'], farm: ['s_sunflower', 's_hay'], fly: 1, dragon: 1 },
  { flat: ['a_litter', 'a_litter', 'a_leafpile'], small: ['a_mush'], big: ['a_pumpkins', 'a_haypump', 'a_apples'], square: ['a_pumpkins', 'a_haypump', 'a_jack', 'a_apples', 'a_scarecrow', 'a_jack'], farm: ['a_scarecrow', 'a_pumpkins'] },
  { flat: ['w_snowpile', 'w_puddle'], small: ['w_snowbush'], big: ['w_snowman_s', 'w_firewood'], square: ['w_snowman', 'w_wreath', 'w_lantern', 'w_firewood', 'w_snowman_s', 'w_lantern'], farm: ['w_snowman', 'w_firewood'] },
];
const FLAT_PROPS = new Set(['p_petals', 'a_litter', 'a_leafpile', 'w_snowpile', 'w_puddle']);
function seasonDress(sc) {
  const key = sc.scene.key; if (key === 'house' || key === 'cragmine' || (sc.R && (RC.beach || RC.snow)) || !sc.textures.exists('seasonal')) return;
  const si = seasonIdx(S.day), P = SEASON_PROPS[si]; let mw, mh, ok, spots = [];
  if (key === 'farm') {
    mw = W; mh = H;
    ok = (x, y) => { const i = y * W + x, k = x + ',' + y; return sc.passable(x, y) && !farm.dirtish[i] && !farm.waterish[i] && !S.tilled[k] && !S.paths[k] && !inGreenhouse(x, y) && Math.hypot(x - DOOR.x, y - DOOR.y) > 2.5; };
    spots = [[DOOR.x - 4, DOOR.y + 2], [DOOR.x + 4, DOOR.y + 3]];
  } else if (key === 'town') {
    mw = TW; mh = TH; ok = (x, y) => sc.passable(x, y) && !sc.town.pave[y * TW + x];
    spots = [[18, 21], [21, 21], [51, 21], [54, 21], [18, 35], [22, 35], [50, 35], [54, 35]];
  } else if (sc.R) {
    mw = RW; mh = RH; const R = sc.R; ok = (x, y) => { const i = y * RW + x; return sc.passable(x, y) && !R.dirtish[i] && !R.waterish[i] && !(R.grass[i] >= 0); };
  } else return;
  const cut = propsCut()[key] || {};
  const objs = sc.seasonObjs = [], at = sc.seasonAt = {}, put = (f, x, y, jx = 0) => {
    if (cut[x + ',' + y] || at[x + ',' + y]) return null;
    const flat = FLAT_PROPS.has(f), im = sc.add.image(x * T + 8 + jx, y * T + 15, 'seasonal', f).setOrigin(.5, 1).setDepth(flat ? y * T + 2 : y * T + 15);
    objs.push(im); at[x + ',' + y] = im; return im;
  };
  const seed = si * 977 + Math.floor((S.day - 1) / 112) * 31, used = new Set();
  // hand-placed set pieces (town lawns, by the farmhouse)
  const list = key === 'town' ? P.square : key === 'farm' ? P.farm : [];
  spots.forEach(([x, y], i) => { if (i < list.length && ok(x, y)) { put(list[i], x, y); used.add(x + ',' + y); } });
  // scattered extras
  const dens = key === 'town' ? [.05, .02, .006] : [.02, .01, .004];
  for (let y = 1; y < mh - 1; y++) for (let x = 1; x < mw - 1; x++) {
    if (used.has(x + ',' + y)) continue;
    const r = hash(x * 7 + seed, y * 13 + seed); if (r > dens[0] + dens[1] + dens[2] || !ok(x, y)) continue;
    const pool = r < dens[0] ? (P.flat.length ? P.flat : P.small) : r < dens[0] + dens[1] ? P.small : P.big;
    put(pool[Math.floor(hash(x + seed, y) * pool.length)], x, y, Math.round((hash(y, x + seed) - .5) * 6));
  }
  // butterflies and dragonflies by day
  const day = S.time < 1140;
  if (day && (P.fly || P.dragon)) {
    const n = P.fly ? 6 : 0, nd = P.dragon && key !== 'town' ? 4 : 0;
    const cam = sc.cameras.main;
    for (let i = 0; i < n + nd; i++) {
      const dragon = i >= n, f0 = dragon ? 's_dragonfly' : 'p_fly_open';
      const s = sc.add.image(0, 0, 'seasonal', f0).setDepth(9e6 - 40); objs.push(s);
      const hop = () => {
        if (!s.scene) return;
        const px = sc.player ? sc.player.x : cam.midPoint.x, py = sc.player ? sc.player.y : cam.midPoint.y;
        const tx = px + (Math.random() - .5) * 260, ty = py + (Math.random() - .5) * 200;
        sc.tweens.add({ targets: s, x: tx, y: ty, duration: dragon ? 500 + Math.random() * 500 : 1800 + Math.random() * 2200, ease: dragon ? 'Quad.out' : 'Sine.inOut', onComplete: () => sc.time.delayedCall(dragon ? 400 + Math.random() * 1600 : 100, hop) });
      };
      const px = sc.player ? sc.player.x : 0, py = sc.player ? sc.player.y : 0;
      s.setPosition(px + (Math.random() - .5) * 300, py + (Math.random() - .5) * 240); hop();
      if (!dragon) sc.time.addEvent({ delay: 140 + Math.random() * 60, loop: true, callback: () => s.scene && s.setFrame(s.frame.name === 'p_fly_open' ? 'p_fly_closed' : 'p_fly_open') });
      else s.setScale(Math.random() < .5 ? -1 : 1, 1);
    }
  }
}
// props you've cleared stay gone until the season changes
function propsCut() { const sk = seasonIdx(S.day) + 4 * Math.floor((S.day - 1) / 112); if (!S.propsCut || S.propsCut.k !== sk) S.propsCut = { k: sk }; return S.propsCut; }
function cutSeasonProp(sc, x, y) {
  const k = x + ',' + y, im = sc.seasonAt && sc.seasonAt[k]; if (!im) return;
  delete sc.seasonAt[k]; const pc = propsCut(); (pc[sc.scene.key] = pc[sc.scene.key] || {})[k] = 1;
  Sound.play('pop');
  for (let i = 0; i < 5; i++) { const b = sc.add.rectangle(im.x + (Math.random() - .5) * 8, im.y - 4 - Math.random() * 6, 2, 2, 0xffffff, .9).setDepth(im.depth + 1); sc.tweens.add({ targets: b, x: b.x + (Math.random() - .5) * 16, y: b.y - 6 - Math.random() * 8, alpha: 0, duration: 380, onComplete: () => b.destroy() }); }
  sc.tweens.add({ targets: im, alpha: 0, scaleX: 1.3, scaleY: .5, duration: 220, onComplete: () => im.destroy() });
}
/* winter: a cap of snow on every upward-facing edge (just under the outline) */
function snowCap(img, k = 1) {   // k: how many pixels make one art pixel (3 for the high-detail town)
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, src = new Uint8ClampedArray(a);
  const op = (x, y) => y >= 0 && src[(y * w + x) * 4 + 3] > 100;
  for (let x = 0; x < w; x++) for (let y = 1, run = op(x, 0) ? 1 : 0; y < h; y++) {
    if (!op(x, y)) { run = 0; continue; }
    run++;
    // depth below the top outline: the first k pixels under the outline are snow, the next k its shadow
    const dep = run > k && run <= 3 * k ? (run <= 2 * k ? 1 : 2) : 0;
    if (!dep) continue;
    const i = (y * w + x) * 4, l = (src[i] + src[i + 1] + src[i + 2]) / 3;
    if (l < 40) continue;   // keep inner outlines
    const col = dep === 1 ? [246, 250, 255] : [214, 226, 242];
    a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2];
  }
  g.putImageData(d, 0, 0); return c.toDataURL();
}
async function winterAtlases() {
  const out = {};
  for (const k of ['town', 'houses', 'bh', 'bog']) out[k] = snowCap(await loadImg(ASSET[k]));
  const HW = ASSET.hdWorld || {};
  for (const k of ['town', 'houses', 'bog']) if (HW[k]) out[k + 'HD'] = snowCap(await loadImg(HW[k].img), 3);
  return out;
}

/* ============================================================ Item art
   Painted icons for dishes, goods, seeds and decorations, and the placed farm objects (itemart.json).
   Runs after the code-drawn stand-ins are made, and replaces them. */
function applyItemArt() {
  const A = ASSET.itemart; if (!A) return;
  for (const [k, v] of Object.entries(A.objs)) SAP_CANVAS[k] = rgbaCanvas(v);
  for (const [k, v] of Object.entries(A.icons)) { const c = rgbaCanvas(v); ICONS[k] = c.toDataURL(); ICON_CANVAS[k] = c; }
  if (typeof applyWinterArt === 'function') applyWinterArt();
}
