/* ============================================================ Quests and post (18 Nov 2026)
   1. Main story and side quests. Every quest is Main unless it's in QUEST_SIDE. The tracker under the clock follows
      the main story only; side quests sit in the quest log until you do them (they never block the story).
   2. Hidden until reached: a main quest shows once it's the current one; a side quest once every main quest before it
      is done (or its own `after` quest is). Later quests are hidden behind "More will appear as the story goes on".
   3. Prompts: a banner when the next main quest starts and when a side quest opens up, and a letter the next morning
      for the bigger steps (QUEST_MAIL), from whoever would write it.
   4. The mailbox is a proper inbox now: letters arrive overnight, the "!" shows over the mailbox, and every letter is
      kept (Bramble's welcome and Verdance's letters included) so you can read them again. Also in the post: a nudge
      from Bramble if the story has sat still for 5 days, and the weekly Alpha sighting.
   S.post = { box: [{ id, day, from, subj, body, read }], queue: [ids], sent: { id: day }, still: { q, day } }
   S.qSeen = { questId: 1 }   (quests whose start has been announced) */
const QUEST_SIDE = { team3: { after: 'catch' }, trainers1: { after: 'team3' }, ranch: { after: 'trainers1' }, job: { after: 'ranch' }, cook: { after: 'repair' }, isles: { after: 'sail' } };   // `after`: what opens it
const questKind = q => QUEST_SIDE[q.id] ? 'side' : 'main';
const mainQuests = () => QUESTS.filter(q => !QUEST_SIDE[q.id]);
activeQuest = () => QUESTS.find(q => !QUEST_SIDE[q.id] && !questDone(q) && (!q.ready || q.ready()));
function questOpen(q) {   // reached: may be shown in the log
  if (questDone(q)) return true;
  const S2 = QUEST_SIDE[q.id];
  if (S2) {
    if (S2.after) return !!S.quests[S2.after];
    const i = QUESTS.indexOf(q); return QUESTS.slice(0, i).every(p => QUEST_SIDE[p.id] || questDone(p));
  }
  return q === activeQuest();
}
const sideOpen = () => QUESTS.filter(q => QUEST_SIDE[q.id] && !questDone(q) && questOpen(q));

/* ---------- the log */
const qTag = q => questKind(q) === 'side' ? '<span class="qtag side">Side</span>' : '<span class="qtag main">Main</span>';
openQuests = function () {
  const a = activeQuest(), side = sideOpen(), done = QUESTS.filter(questDone).reverse();
  const card = (q, cur) => `<div class="proj" style="${cur ? 'border-color:#c9a64e;background:#fff6dc' : ''}">${qTag(q)} <b>${cur ? '▶ ' : ''}${q.name}</b>${rewardText(q.reward) ? `<span class="st">${rewardText(q.reward)}</span>` : ''}<br><small>${q.hint}</small></div>`;
  const html = `<p class="qhead">📖 Main story</p>
    <div class="mlist">${a ? card(a, true) : '<p class="hint">The story is done, for now.</p>'}</div>
    ${a ? '<p class="hint" style="text-align:center;margin:4px 0 10px">More will appear as the story goes on.</p>' : ''}
    <p class="qhead">🧭 Side quests</p>
    <div class="mlist">${side.length ? side.map(q => card(q)).join('') : '<p class="hint">None right now. Keep an eye on your mailbox.</p>'}</div>
    ${done.length ? `<details style="margin-top:10px"><summary class="qhead" style="cursor:pointer">✔ Done (${done.length})</summary><div class="mlist" style="margin-top:6px">${done.map(q => `<div class="proj" style="opacity:.65">${qTag(q)} ✔ ${q.name}</div>`).join('')}</div></details>` : ''}`;
  openModal('Quests', html);
};
renderQuest = function () {
  const q = activeQuest(), el = $('quest'); if (!el) return;
  el.style.top = ($('clock').getBoundingClientRect().bottom + 6) + 'px';
  const n = sideOpen().length, key = (q ? q.id : 'none') + ':' + n + ':' + (q ? q.name : ''); if (key === questKey) return; questKey = key;
  el.innerHTML = (q ? `<b>📜 ${q.name}</b>` : '<b>📜 The story is done, for now.</b>') + (n ? `<br><small style="opacity:.75">🧭 ${n} side quest${n > 1 ? 's' : ''}</small>` : '');
};

/* ---------- the post */
const post = () => { S.post = S.post || { box: [], queue: [], sent: {} }; S.post.queue = S.post.queue || []; S.post.sent = S.post.sent || {}; return S.post; };
const postUnread = () => (S && S.post ? S.post.box.filter(l => !l.read).length : 0);
const QUEST_MAIL = {
  // side quests
  team3: { from: 'Elder Bramble', subj: 'Company', body: n => `Dear ${n},\n\nYou've made your first Fablemon friend! They're happier in company, you know. Keep exploring the long grass and see who else wants to come home with you.\n\nIf your team fills up, the rest can live at your farm.\n\nElder Bramble` },
  trainers1: { from: 'The Meadow Trail regulars', subj: 'A challenge!', body: n => `To the new keeper at Wild Roots Farm,\n\nWe've seen you out on the Meadow Trail with your Fablemon. Four of us train out there every day. Walk past and we'll battle you, one at a time.\n\nBeat all four and you've earned your place on the trail.\n\nThe Meadow Trail regulars` },
  ranch: { from: 'Elder Bramble', subj: 'A home for your Fablemon', body: n => `Dear ${n},\n\nYour gran used to keep a little ranch on the farm. The signpost west of your shipping bin marks where it stood. Build it again and your Fablemon will have somewhere to live when they're not out with you.\n\nElder Bramble` },
  job: { from: 'Elder Bramble', subj: 'Many paws', body: n => `Dear ${n},\n\nFablemon love to help out. Leave one at your ranch, open the ranch and give it a job: watering, chopping, picking... each type has its own knack.\n\nYour gran's farm ran itself, nearly!\n\nElder Bramble` },
  cook: { from: 'Elder Bramble', subj: "Your gran's recipe", body: n => `Dear ${n},\n\nI found this in an old book at the Hall, in your gran's handwriting: "Roast turnips. Chop, salt, into the pot, and don't let anyone tell you it needs more than that."\n\nCraft a Cooking Pot on your bench (it's on the Farm tab), set it down and give it a try.\n\nElder Bramble` },
  isles: { from: 'An unsigned note', subj: 'Smells of salt', body: () => `If you've a boat, you've a right to know.\n\nBeyond the torrents south of the Glimmer Sea there are islands no chart shows. Fablemon there that nobody's named.\n\nThe Cove sailors laugh about it. They don't laugh when they think nobody's listening.` },
  // main story
  lane: { from: 'Elder Bramble', subj: 'The first Warden', body: n => `Dear ${n},\n\nYou're shaping up to be a fine keeper. Every keeper's road starts with a Warden, and ours is Mabel. She keeps the walled garden at the very end of Brookside Lane, south past the Meadow Trail.\n\nShe's kind. She's also very, very good.\n\nElder Bramble` },
  warden: { from: 'Warden Mabel', subj: 'From the walled garden', body: n => `Dear ${n},\n\nBramble tells me you've reached my lane. Good! The gate's open whenever you're ready.\n\nRest at the spring well on the way, and bring your best. I'll know if you're holding back.\n\nMabel` },
  bog: { from: 'Warden Delphine', subj: 'From the Lock House, Brookholt', body: n => `Dear ${n},\n\nWord travels fast along the water. Mabel's Crest, already!\n\nIf you'd like to try for mine, come to Brookholt. The way is east from the middle of Brookside Lane, through Mossmere Bog and Sluice Fen. Mind the keepers in the bog; they're proud of it.\n\nDelphine, Warden of Brookholt` },
  vdq_fen1: { from: 'Nurse Willa', subj: 'Something odd', body: n => `Dear ${n},\n\nI've had three Fablemon brought in from the fen this week, all with grey patches in their fur, all of them listless. I've never seen anything like it.\n\nCould you pop into the clinic? I'd like a second pair of eyes.\n\nWilla` },
  settle_2: { from: 'Elder Bramble', subj: 'A letter from Delphine', body: n => `Dear ${n},\n\nDelphine wrote to me. She's a stickler, that one: a Warden looks after a place, she says, and she wants to see Smallroot coming back to life before she'll battle.\n\nFund a repair or two on the notice board, then help the new folk settle in.\n\nElder Bramble` },
  settle_4: { from: 'Elder Bramble', subj: 'Granger too', body: n => `Dear ${n},\n\nGranger's the same as Delphine: he wants to see Smallroot growing before he'll battle you. Four buildings with folk living in them, he says.\n\nElder Bramble` },
  settle_6: { from: 'Elder Bramble', subj: 'Orrin asked after the town', body: n => `Dear ${n},\n\nOrrin wrote from Beaconreach asking how Smallroot was getting on. Six buildings lived in, he'd like to see.\n\nElder Bramble` },
  settle_7: { from: 'Elder Bramble', subj: 'Tamsin asked after the town', body: n => `Dear ${n},\n\nA kite landed in the square with a note tied to it, from Tamsin up in Highmoor. She'd like to see seven of our buildings lived in before she battles.\n\nElder Bramble` },
  tq_ledger: { from: 'Warden Delphine', subj: 'My ledger!', body: n => `Dear ${n},\n\nA gale took my lock-keeper's ledger right out of my hands and tore it to bits. Two hundred years of water levels!\n\nThe pages came down in Mossmere Bog, Sluice Fen and here in Brookholt. If you see paper flapping about, I'd be so grateful.\n\nDelphine` },
  elder: { from: 'Elder Bramble', subj: 'A word, please', body: n => `Dear ${n},\n\nWhen you've a moment, come and find me in the square. There's something I'd like your help with.\n\nElder Bramble` },
  quarry: { from: 'Cragside road crew', subj: 'Road open', body: () => `NOTICE\n\nThe landslide on Cragside Heights has been cleared. The road north from the top of the Heights to Quarrydown is open again.\n\nMind the loose stones.` },
  tq_crane: { from: 'Fergus, Quarrydown', subj: 'The Old Crane', body: n => `Dear ${n},\n\nFergus here, crane-man at the quarry. The old girl's fixed and itching to lift, but there's rockfall all over: two heaps round town, one up on Cragside Heights.\n\nA Stone or Spark Fablemon could shift them. Clear them and I'll give you a ride you won't forget.\n\nFergus` },
  vdq_mine1: { from: 'Warden Granger', subj: 'The Old Mine', body: n => `${n},\n\nThe rock in the Old Mine sings at night. Never done that in forty years. There's a notebook of Brask's down there, torn up. Find the pages.\n\nGranger` },
  west: { from: 'Elder Bramble', subj: 'News!', body: n => `Dear ${n},\n\nCongratulations on the Stone Crest! Come and see me in the square when you can. I've news about the woods west of your farm.\n\nElder Bramble` },
  vd_rowan: { from: 'Rowan', subj: 'Verdance', body: n => `${n},\n\nI'd like a word about Verdance, away from listening ears. I'll be waiting at the Warden's Hall in Smallroot, whatever state it's in.\n\nRowan` },
  tq_tools: { from: 'Hal, Driftwood Cove', subj: 'Lost my tools', body: n => `Dear ${n},\n\nHeard you were coming my way. I'd build you anything, but a wave took my tool box off the pier. Four tools, all glinting in the shallows of the Cove and the Dunes.\n\nA Tide Fablemon could dive for them. Bring them back and we'll talk boats.\n\nHal` },
  sail: { from: 'Hal, Driftwood Cove', subj: 'She floats!', body: n => `Dear ${n},\n\nYour boat's in the water beside the pier. Sail north across the Glimmer Sea and find a way through the torrents in Stormwatch Strait. Beaconreach is on the far side.\n\nHal` },
  tq_lamps: { from: 'Warden Orrin', subj: 'Lanterns out!', body: n => `${n}!\n\nThe gale blew out all three storm lanterns round the harbour. Ships can't see the rocks! An Ember or Spark Fablemon could light them again.\n\nOrrin` },
  gale: { from: 'Warden Orrin', subj: 'North jetty', body: n => `${n}!\n\nThe north jetty is open to you now. Sail across Windward Sound to Heatherstep Cliffs and climb. Highmoor's at the top, and so is Tamsin. Hold on to your hat!\n\nOrrin` },
  tq_kites: { from: 'Kitty, Kestrel Kites', subj: 'Runaway kites!', body: n => `Dear ${n},\n\nThe wind snatched four of my kites! Two round Highmoor, one on Gale Ledges and one on Heatherstep Cliffs. They keep blowing away whenever I get close.\n\nPlease catch them for me?\n\nKitty` },
  restore: { from: 'Elder Bramble', subj: 'Nearly there', body: n => `Dear ${n},\n\nLook at Smallroot! I never thought I'd see it like this again. There's still work on the notice board, though, and Rowan won't battle until every building is back on its feet.\n\nElder Bramble` },
  rowan: { from: 'Rowan', subj: 'The Hall', body: n => `${n},\n\nYou've done what nobody else could. Come to the Warden's Hall when you're ready. I'll be waiting.\n\nRowan` },
};
function postSend(id, L, now) {   // L: { from, subj, body(name) }; now: straight into the box rather than overnight
  const P = post(); if (P.sent[id]) return; P.sent[id] = S.day;
  P.box.push({ id, day: S.day, from: L.from, subj: L.subj, body: typeof L.body === 'function' ? L.body(S.name) : L.body, read: 0 });
  if (P.box.length > 60) { const i = P.box.findIndex(l => l.read); if (i >= 0) P.box.splice(i, 1); }
  if (now && scene && scene.mailFlag) scene.mailFlag.setVisible(true);
}
const postQueue = id => { const P = post(); if (!P.sent[id] && !P.queue.includes(id)) P.queue.push(id); };

/* ---------- quest prompts */
function questAnnounce() {
  if (!S || !S.quests) return;
  const first = !S.qSeen; S.qSeen = S.qSeen || {};
  const fresh = [];
  const a = activeQuest(); if (a && !S.qSeen[a.id]) fresh.push(a);
  for (const q of sideOpen()) if (!S.qSeen[q.id]) fresh.push(q);
  for (const q of fresh) {
    S.qSeen[q.id] = 1;
    if (first) continue;   // an older save: the log simply shows what's open
    if (QUEST_MAIL[q.id]) postQueue(q.id);
  }
  if (first || !fresh.length) return;
  setTimeout(() => {   // after the "task complete" toast; skip any already done by then
    const words = fresh.filter(q => !questDone(q)).map(q => (questKind(q) === 'side' ? '🧭 New side quest: ' : '📖 Next: ') + q.name);
    if (!words.length || Battle.active) return;
    toast(words.slice(0, 2).join(' · ') + (words.length > 2 ? ` · and ${words.length - 2} more in your quest log` : ''), 3600);
  }, 3400);
}
const _pqCheck = checkQuests;
checkQuests = function () {
  _pqCheck.apply(this, arguments);
  if (!S || !S.quests || !inv || Battle.active || $('hud').style.display !== 'block') return;
  questAnnounce();
};

/* ---------- each night: the post arrives */
const _pqNight = nightly;
nightly = function (passedOut) {
  const out = _pqNight.apply(this, arguments);
  try {
    const P = post();
    for (const id of P.queue.splice(0)) { const q = QUESTS.find(q => q.id === id); if (q && questDone(q)) continue; if (QUEST_MAIL[id]) postSend(id, QUEST_MAIL[id]); }
    // a nudge when the story has sat still for 5 days
    const a = activeQuest();
    if (a) {
      if (!P.still || P.still.q !== a.id) P.still = { q: a.id, day: S.day };
      else if (S.day - P.still.day >= 5) postSend('nudge_' + a.id, { from: 'Elder Bramble', subj: 'Just checking in', body: n => `Dear ${n},\n\nJust checking in! Last I heard, you were setting out to ${a.name.charAt(0).toLowerCase() + a.name.slice(1)}.\n\n${a.hint}\n\nNo rush. The farm needs you too.\n\nElder Bramble` });
    }
  } catch (e) { console.warn('post', e); }
  return out;
};

/* ---------- the mailbox */
function postArchive() {   // letters from before the inbox existed, kept so they can be read again
  const out = [{ id: 'welcome', day: 1, from: 'Elder Bramble', subj: 'Welcome to Wild Roots Farm', body: letterText(), read: 1 }];
  if (typeof VD_LETTERS !== 'undefined' && S.vd && S.vd.mail) for (const [k, d] of Object.entries(S.vd.mail)) if (VD_LETTERS[k]) out.push({ id: 'vd_' + k, day: d, from: VD_LETTERS[k].from, subj: k === 'legal' ? 'Notice' : 'Verdance Energy', body: VD_LETTERS[k].body(S.name), read: 1 });
  return out;
}
function openMailbox(sc) {
  const P = post(), all = [...P.box, ...postArchive()].sort((a, b) => (a.read - b.read) || (b.day - a.day));
  const row = l => `<div class="proj" data-a="read" data-id="${l.id}" style="cursor:pointer;${l.read ? 'opacity:.7' : 'border-color:#c9a64e;background:#fff6dc'}"><b>${l.read ? '📄' : '✉️'} ${l.subj}</b><span class="st">${dayName(l.day)}</span><br><small>From ${l.from}</small></div>`;
  openModal('Mailbox', `<p class="hint">${postUnread() ? `${postUnread()} new letter${postUnread() > 1 ? 's' : ''}.` : 'No new post today.'} Letters come in the night.</p><div class="mlist">${all.map(row).join('')}</div>`, (a, d) => {
    if (a !== 'read') return;
    const l = all.find(x => x.id === d.id); if (!l) return;
    if (!l.read) { l.read = 1; const b = P.box.find(x => x.id === l.id); if (b) b.read = 1; }
    if (sc && sc.mailFlag) sc.mailFlag.setVisible(postUnread() > 0);
    renderQuest();
    openModal(l.subj, `<div class="letter">${l.body}</div><p style="text-align:center;margin-top:8px"><button class="btn" data-a="back">◀ Back to mailbox</button></p>`, a2 => { if (a2 === 'back') openMailbox(sc); });
  });
}
const dayName = d => { const q = seasonDay(Math.max(1, d)); return `${q.dom} ${q.season}`; };
const _pqRead = Farm.prototype.readMail;
Farm.prototype.readMail = function () {
  if (!S.mailRead || (typeof vdMailDue === 'function' && vdMailDue())) return _pqRead.apply(this, arguments);   // the welcome letter and Verdance's come first, as before
  Sound.play('pop'); openMailbox(this);
};
const _pqFarm = Farm.prototype.create;
Farm.prototype.create = function () {
  _pqFarm.apply(this, arguments);
  if (S.mailRead && postUnread() && this.mailFlag) { this.mailFlag.setVisible(true); setTimeout(() => toast(`📬 ${postUnread() > 1 ? postUnread() + ' letters are' : 'A letter is'} waiting in your mailbox.`, 3000), 900); }
};
