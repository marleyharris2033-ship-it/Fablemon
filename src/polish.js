/* ============================================================ Map, weekly respawns and seasonal villager lines */

/* ---------- map: the illustrated world map, with names, Warden badges and fog over places not yet found.
   x, y are fractions of the picture. Places that aren't in the game yet stay fogged as "???". */
const MAP_PLACES = [
  { k: 'farm', name: 'Farm', al: 'l', x: .41, y: .472, seen: () => true, notes: () => ['Your home and fields'] },
  { k: 'town', name: 'Smallroot', x: .575, y: .468, seen: () => S.town.visited, warden: ['Rowan', 'hearth', 8], notes: () => ['Shops, villagers, notice board', `Hearthroot stage ${hearthStage() + 1} of 5`] },
  { k: 'route1', name: 'Meadow Trail', x: .43, y: .605, route: 1 },
  { k: 'route2', name: 'Brookside Lane', al: 'l', x: .42, y: .73, route: 1, warden: ['Mabel', 'root', 1] },
  { k: 'route3', name: 'Mossmere Bog', al: 'b', x: .565, y: .742, route: 1 },
  { k: 'route4', name: 'Sluice Fen', al: 't', x: .715, y: .75, route: 1, extra: () => S.flags && S.flags.fenDone ? '✔ Levers solved' : '🔧 Lever puzzle' },
  { k: 'brookholt', name: 'Brookholt', x: .87, y: .75, route: 1, warden: ['Delphine', 'brook', 2] },
  { k: 'crag1', name: 'Cragside Pass', al: 'l', x: .865, y: .655, route: 1 },
  { k: 'crag2', name: 'Cragside Heights', al: 'l', x: .85, y: .585, route: 1, extra: () => `🪨 ${Object.keys((S.crag || {}).filled || {}).length} of 3 crevasses filled` },
  { k: 'crag3', name: 'Old Rail Cutting', al: 'b', x: .775, y: .6, route: 1, extra: () => (S.visited || {}).cragmine ? '✔ Reached the Old Mine' : '🛤️ Mine-cart puzzle' },
  { k: 'quarrydown', name: 'Quarrydown', x: .84, y: .525, route: 1, warden: ['Granger', 'stone', 3] },
  { k: 'dunes', name: 'Saltgrass Dunes', x: .31, y: .5, route: 1 },
  { k: 'glimmer', name: 'Glimmer Sea', x: .17, y: .49, route: 1, notes: () => ['⛵ Sail from the Driftwood Cove pier'] },
  { k: 'stormwatch', name: 'Stormwatch Strait', x: .11, y: .42, route: 1, notes: () => [S.visited && S.visited.beaconSighted ? '🗼 Through the torrents to Beaconreach' : '⛈ Always stormy. Torrents guard Beaconreach'] },
  { k: 'shoals', name: 'Tidewrack Shoals', x: .14, y: .7, route: 1, notes: () => [S.visited && S.visited.islesFound ? '🏝 The Secret Isles' : '🌊 Torrents to the south'] },
  { k: 'driftwood', name: 'Driftwood Cove', x: .22, y: .54, route: 1, notes: () => [((S.cove || {}).stage || 0) >= 4 ? '⛵ Your boat is ready' : `⛵ Hal's building your boat (${(S.cove || {}).stage || 0}/4)`] },
  { k: 'beaconreach', name: 'Beaconreach', x: .1, y: .365, soon: 1, warden: ['?', 'spark', 4] },
  { k: 'highmoor', name: 'Highmoor', x: .29, y: .16, soon: 1, warden: ['?', 'gale', 5] },
  { k: 'elderwood', name: 'Elderwood', x: .87, y: .22, soon: 1, warden: ['?', 'wild', 6] },
  { k: 'gloamhollow', name: 'Gloamhollow', x: .615, y: .33, soon: 1, warden: ['?', 'shade', 7] },
  { k: 'rootcrown', name: 'Rootcrown', x: .605, y: .05, soon: 1 },
  { k: 'isles', name: 'Secret isles', x: .15, y: .835, soon: 1 },
];
function placeSeen(P) { return P.soon ? false : P.route ? !!(S.visited && S.visited[P.k]) || (P.k === 'route1' && S.routeVisited) : P.seen(); }
function placeNotes(P) {
  const R = ROUTES[P.k], lines = P.notes ? P.notes() : [];
  if (R) {
    const tr = (R.trainers || []).filter(t => !t.boss), left = tr.filter(t => !(S.trainers || {})[t.id]).length;
    if (tr.length) lines.push(left ? `⚔️ ${left} trainer${left > 1 ? 's' : ''} to beat` : '✔ All trainers beaten');
    if (Object.values(R.signs || {}).includes('__heal')) lines.push('💧 Healing well');
    const items = (R.pickups || []).filter(p => !S.picked[p.id]).length; if (items) lines.push(`🎁 ${items} item${items > 1 ? 's' : ''} to find`);
    if (R.town) lines.push('🛒 Shops');
  }
  if (P.warden) lines.push((S.crests || {})[P.warden[1]] ? `🏅 Warden ${P.warden[0]} beaten` : `🏅 Warden ${P.warden[0]} waits here`);
  if (P.extra) lines.push(P.extra());
  return lines;
}
function openMap() {
  const here = scene ? ({ house: 'farm', bhgym: 'brookholt', cragmine: 'crag3', qdpit: 'quarrydown' }[scene.scene.key] || scene.scene.key) : '';
  const pins = MAP_PLACES.map((P, i) => {
    const seen = placeSeen(P), w = P.warden, won = w && (S.crests || {})[w[1]];
    const fog = seen ? '' : `<div class="wfog" style="left:${P.x * 100}%;top:${P.y * 100}%"></div>`;
    const badge = w && seen ? `<span class="wbadge ${won ? 'won' : ''}">${won ? '✔' : w[2]}</span>` : '';
    return `${fog}<button class="wpin ${seen ? '' : 'unseen'} ${here === P.k ? 'here' : ''} ${P.al ? 'al-' + P.al : ''}" data-a="pin" data-i="${i}" style="left:${P.x * 100}%;top:${P.y * 100}%">${here === P.k ? '<i class="wyou">▼</i>' : ''}<b>${seen ? P.name : '???'}</b>${badge}</button>`;
  }).join('');
  openModal('Map', `<div class="wmap"><img src="${ASSET.worldmap}" alt="World map">${pins}</div><div id="wmapInfo" class="hint">Tap a place to see what's there.</div>`, (a, d) => {
    if (a !== 'pin') return;
    const P = MAP_PLACES[+d.i], seen = placeSeen(P);
    $('wmapInfo').innerHTML = seen ? `<b>${P.k === 'farm' ? 'Wild Roots Farm' : P.name}</b>${here === P.k ? ' <i>(you are here)</i>' : ''}<br>${placeNotes(P).join('<br>')}` : P.soon ? '<b>???</b><br>Somewhere you haven\'t been yet.' : '<b>???</b><br>You haven\'t found this place yet.';
  });
}

/* ---------- weekly respawn: items hidden on the routes (not gold) come back every Monday */
function respawnPickups() {
  for (const R of Object.values(ROUTES)) for (const p of R.pickups || []) if (!p.gold && S.picked[p.id]) delete S.picked[p.id];
}

/* ---------- seasonal and weather lines, mixed in with each villager's usual chat */
const VILL_SAY = {
  willa: { rain: "Rainy days are clinic days. Everyone slips in the mud!", snow: "Wrap up warm. I've had three frostbitten Fablemon this week.", s0: "The herbs out back are sprouting. Spring medicine is the best.", s1: "Drink plenty of water out there. Heatstroke is no joke.", s2: "Autumn colds are going round. Keep your team rested.", s3: "Winter's when I make my tinctures. The whole clinic smells of pine." },
  gideon: { rain: "Rain on a hot forge. Best sound in the world.", snow: "Cold steel bites. Keep your tools oiled this winter.", s0: "Spring. Everyone wants their hoe sharpened at once.", s1: "Too hot to work the forge at noon. I start at dawn.", s2: "Autumn's for mending. Bring me anything that's bent.", s3: "Folk crowd round the forge in winter. Can't say I mind." },
  robin: { rain: "Can't work outside in this. Perfect day for sketching plans!", snow: "Snow's heavy on old roofs. I'm checking every one in town.", s0: "Spring building season! My saw's been busy all week.", s1: "Summer's the best time to build. Dry wood, long days.", s2: "Stack your timber before the autumn rains, that's my advice.", s3: "Winter's for carving. I'm making little wooden Fablemon." },
  barney: { rain: "Rain brings 'em all in. Best nights for the tavern.", snow: "Snow outside, fire inside. Pull up a stool!", s0: "Spring ale's on. Light and fresh, like the season.", s1: "Long summer evenings. The garden tables are full every night.", s2: "Harvest stew season. Smell that?", s3: "Hot cider by the fire. Can't beat a winter evening at the Acorn." },
  hattie: { rain: "The Fablemon love the rain. They splash about for hours.", snow: "Extra feed in winter, love. They burn through it keeping warm.", s0: "Spring's when the little ones get frisky. Lovely to watch.", s1: "Make sure your troughs don't dry out in this heat.", s2: "Autumn coats are coming in thick. Grand for brushing.", s3: "Winter at the ranch is all hay, hot water and cuddles." },
  stanley: { rain: "Rain on the platform. It sounds just like the old days.", snow: "Snow on the rails. I swept them myself this morning.", s0: "Spring timetable's up. Not that it changes. But still.", s1: "A summer train ride, windows open. Nothing finer.", s2: "Autumn leaves on the line. The old drivers hated that.", s3: "I keep the waiting room stove lit all winter, just in case." },
  rowan: { rain: "Rain sharpens a trainer. Your footing, your focus.", snow: "Fablemon slow down in the cold. Plan your battles for it.", s0: "Spring brings new Fablemon to the meadows. Keep your eyes open.", s1: "Summer's for training hard. The days are long.", s2: "Autumn. The wild Fablemon grow bolder as the nights draw in.", s3: "Winter tests a bond. Look after your team." },
  poppy: { rain: "Finn's been jumping in every puddle since breakfast.", snow: "We built a snowman this morning! Finn named it Captain Fenwick.", s0: "My roses are budding! I could cry.", s1: "Summer evenings here are so peaceful after the city.", s2: "I'm making jam from everything. Everything.", s3: "Our first winter in Smallroot. It feels like home already." },
  finn: { rain: "Rain means mud. Mud means the BEST puddles!", snow: "SNOW! Want to have a snowball fight? Please?", s0: "I saw a baby Whirplet! It was SO small!", s1: "It's too hot. I'm gonna live in the pond.", s2: "I'm collecting conkers. I've got forty-two!", s3: "Do Fablemon get presents at Hearthlight? I'm getting them presents." },
  ivy: { rain: "The colours are so soft in the rain. I've painted all morning.", snow: "Painting snow is hard. It's never really white, you know?", s0: "Spring greens! I've used up all my green paint already.", s1: "The light's too harsh at noon. I paint at dawn and dusk.", s2: "Autumn is my season. All that orange!", s3: "I'm painting the Hearthroot covered in snow. It looks magical." },
  fenwick: { rain: "Rain? Pah! I once spent a month in a monsoon.", snow: "This? This is a light dusting. The frozen north, now that was snow.", s0: "Spring always makes me want to set off on an expedition.", s1: "Summer reminds me of the desert. Only greener. And cooler. And nicer.", s2: "Autumn's for writing up my journals by the fire.", s3: "A winter night, a good chowder, and a story or three. Splendid!" },
};
function seasonalLine(id) {
  const L = VILL_SAY[id]; if (!L) return null;
  const wx = S.weather, si = seasonIdx(S.day);
  if ((wx === 'rain' || wx === 'storm') && L.rain && Math.random() < .6) return L.rain;
  if (wx === 'snow' && L.snow && Math.random() < .6) return L.snow;
  return Math.random() < .35 ? L['s' + si] : null;
}
