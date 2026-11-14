/* ============================================================ Verdance Energy
   The main story's villains (claude/story-plan.md). A power company is tapping the Rootweave, the living network
   of roots that joins every hearthtree to Smallroot's Hearthroot, and selling the energy to the city.

   What's here:
   - their things on every route: survey stakes, pipes, billboards, dropped memos, Field Techs whose Fablemon wear
     drain collars, and one siphon site per region (Sluice Fen, the Old Mine, Stormwatch Strait, Windcrown Peak);
   - shutting a site down: its root-heart revives, the drained land around it recovers, the Hearthroot gains life
     and the Rootweave lights up on the map;
   - Tobias Gleam's letters and his Verdance Grow kiosk in Smallroot, the Files tab for memos, Rowan's reveal,
     and the gates on Fulgarok (the mine drill) and Cirrovale (Ash's tower).
   Everything is placed at runtime next to the spot it was written for: on a walkable tile, off the long grass,
   never on a path someone needs (tools/test checks it). Stand-in art: tools/art/make_verdance_standins.py.
   Loaded last, after fabled.js. */
const vd = () => (S.vd = S.vd || { shut: {}, memos: {}, freed: {}, mail: {}, read: {} });
const vdShut = s => !!vd().shut[s];
const vdReveal = () => !!vd().reveal;

TRAINER_TYPES.vtech = { label: 'Field Tech', challenge: ["Hey! This is a Verdance work site. Authorised personnel only!", "You're not supposed to be here. Company policy says I have to battle you. Sorry. Not sorry.", "Clean power, naturally! ...That's what they make us say. Now clear off!"],
  lose: ["The collar... it snapped clean off. That's coming out of my wages.", "Ugh. Fine. I'm on minimum wage anyway.", "Don't tell my supervisor about this."],
  after: ["Look, I just need the job. Rent's not cheap in the city.", "They told us the collars don't hurt them. They told us a lot of things.", "My nan grew up round here. Don't tell her what I do."] };
TRAINER_TYPES.vtech2 = { label: 'Field Tech', challenge: TRAINER_TYPES.vtech.challenge, lose: TRAINER_TYPES.vtech.lose, after: TRAINER_TYPES.vtech.after };
TRAINER_TYPES.gleam = { label: 'Head of Community Relations', challenge: ['Ah! Our favourite neighbour!'], lose: ['Most irregular.'], after: ['The offer stands.'] };
TRAINER_TYPES.brask = { label: 'Foreman', challenge: ['Right then.'], lose: ['Fair enough.'], after: ['Go on, then.'] };
TRAINER_TYPES.ash = { label: 'Dr', challenge: ['Fascinating.'], lose: ['Noted.'], after: ['Remarkable.'] };

/* ---------- the sites, and what freeing each one means */
const VD_SITES = {
  fen: { name: 'Sluice Fen siphon', route: 'route4', heart: "Brookholt's willow", pin: 'route4', boss: 'vd_fen_boss', art: 'vd_siphon' },
  mine: { name: 'Old Mine drill', route: 'cragmine', heart: 'the Cragside root-heart', pin: 'crag3', boss: 'vd_brask', art: 'vd_drill' },
  rig: { name: 'Stormwatch rig', route: 'stormwatch', heart: 'the sea root under the strait', pin: 'stormwatch', boss: 'vd_rigchief', art: 'vd_rig' },
  tower: { name: 'Windcrown siphon tower', route: 'windcrown', heart: 'the summit root-heart', pin: 'windcrown', boss: 'vd_ash', art: 'vd_tower' },
};
const vdSiteOf = key => Object.keys(VD_SITES).find(s => VD_SITES[s].route === key);
const vdFreedCount = () => Object.keys(VD_SITES).filter(vdShut).length;
// which site each route's litter belongs to: it goes once that region recovers
const VD_REGION = { route1: 'fen', route2: 'fen', route3: 'fen', route4: 'fen', brookholt: 'fen', crag1: 'mine', crag2: 'mine', crag3: 'mine', cragmine: 'mine', quarrydown: 'mine',
  dunes: 'rig', driftwood: 'rig', stormwatch: 'rig', beaconreach: 'rig', windward: 'tower', heatherstep: 'tower', galeledges: 'tower', highmoor: 'tower', windcrown: 'tower' };

/* ---------- memos: read in the Files tab */
const VD_MEMOS = {
  survey: { title: 'Survey notice: Smallroot corridor', from: 'Verdance Land & Acquisitions', body: `Parcels 1–41 acquired via Greenline Holdings Ltd. Locals unaware of the parent company. Keep it that way.

One holdout: <b>Wild Roots Farm</b>. The old owner refused every offer and has now passed away. A new tenant is moving in from the city. Mr Gleam to make contact.

Pipeline to run beneath the Meadow Trail. Surface works to be described as "drainage improvements".` },
  brief: { title: 'Community relations brief', from: 'T. Gleam, Head of Community Relations', body: `Team, a reminder of our language guidelines for rural areas:

✗ siphon → ✓ <i>root-energy partnership</i>
✗ drain → ✓ <i>harvest</i>
✗ the trees are dying → ✓ <i>seasonal variation</i>

Hand out Verdance Grow freely. A farmer who depends on us is a farmer who signs. Smile! You are the face of clean power.

– Tobias 🌿` },
  collars: { title: 'Field Tech handbook, page 12', from: 'Verdance Research Division', body: `<b>Drain collars</b> draw surplus energy from a Fablemon and store it in the belt pack for collection.

A collared specimen produces up to 40% more charge in battle. Side effects (lethargy, grey colouring, loss of appetite) are temporary and of no commercial concern.

Do not remove collars in the field. Do not let the public see collared specimens up close. Do not name them.` },
  fenlog: { title: 'Site log: Sluice Fen', from: 'Site Supervisor Pell', body: `Week 12. Gates holding. The fen's drained enough to reach the willow root. Output steady.

Week 15. Output dropping. The willow at Brookholt is losing leaves in summer. Locals blaming the weather. Good.

Week 18. The lock-keeper came asking about the water levels. Told her it's a "drainage study". She didn't believe me.

Keep the levers locked. Nobody crosses.` },
  quarry: { title: 'Lease: Quarrydown quarry', from: 'Verdance Legal', body: `Verdance Energy leases the Quarrydown quarry for a "geological survey" (term: indefinite).

Survey complete. The Cragside root-heart lies beneath the Old Mine, under a large energy-dense specimen. Recommend we drill from below.

Abandon the surface works (crane, cottage). The town can have them back. It's cheaper than fixing them.` },
  brask: { title: "Foreman's notebook (torn page)", from: 'R. Brask', body: `Day 40. The rock sings at night. The lads won't go past the notice board. Can't say I blame them.

Day 44. Ash came down. Said the singing means we're close. Said the thing in the rock is "energy-dense". Said keep drilling.

Day 51. Found two Clinkits curled up dead by the drill head. Grey as ash. Buried them myself. Didn't put it in the report.

Twenty years I've worked for this company. I don't know any more.` },
  power: { title: 'From the office of the CEO', from: 'Silas Thorne', body: `To all heads of department.

The city will need 40% more power by next winter. The old plants cannot supply it. The Rootweave can.

I am aware of the "concerns" from the field. I share none of them. A few trees in a valley nobody visits, against hospitals, trains and three million homes with the lights on.

Someone has to keep the lights on. Let it be us.

– S. Thorne` },
  rig: { title: 'Incident report: Stormwatch rig', from: 'Rig Chief Dunmore', body: `Drill reached the sea root at 340 fathoms. Output excellent.

Unexpected side effect: a very large Frost-type specimen (a whale?) surfaced near the Secret Isles and has been ramming boats ever since. The fishing fleet is furious.

Recommend we put it down to "unusual storms". Nobody questions storms here.` },
  cirro: { title: 'Specimen notes: Cirrovale', from: 'Dr C. Ash', body: `Subject roosts in the summit cloud. The tower's draw has kept it agitated for 31 days: wind speeds at Highmoor up 300%. The mill has stopped. The village is cold. Excellent data.

An agitated legendary gives off three times the energy of a calm one. Hypothesis: a frightened specimen is a productive specimen.

Must request a larger collar.` },
  taproot: { title: 'PROJECT TAPROOT (eyes only)', from: 'S. Thorne to C. Ash', body: `Corvin,

The regional sites are a stopgap. Every one we open, some meddling farmer shuts down.

All the roots lead to one tree. Taproot is a single bore, straight down to the mother tree beneath Smallroot. We take the whole Rootweave at once, and the regional sites become unnecessary.

The drill is being built in the city. Tell no one, least of all Gleam.

– S.T.` },
};
const VD_MEMO_ORDER = ['survey', 'brief', 'collars', 'fenlog', 'quarry', 'brask', 'power', 'rig', 'cirro', 'taproot'];
const vdFileCount = () => S && S.vd ? Object.keys(S.vd.memos).length : 0;
function openFiles(sel) {
  const have = VD_MEMO_ORDER.filter(id => vd().memos[id]);
  const list = () => `<p class="hint">Verdance Energy's papers, picked up wherever they dropped them. ${have.length} of ${VD_MEMO_ORDER.length} found.</p><div class="mlist">${have.map(id => `<button class="proj" data-a="memo" data-id="${id}" style="text-align:left;width:100%;cursor:pointer">${vd().read[id] ? '' : '<b style="color:#6a9a2a">● </b>'}<b>${VD_MEMOS[id].title}</b><br><small>${VD_MEMOS[id].from}</small></button>`).join('')}</div>`;
  const show = id => { vd().read[id] = 1; const M = VD_MEMOS[id]; return `<div class="letter vdmemo"><div class="vdhead"><span class="vdlogo">⚙</span> VERDANCE ENERGY <small>Clean power, naturally™</small></div><b>${M.title}</b><br><small><i>${M.from}</i></small>\n\n${M.body}</div><div class="row"><button class="btn" data-a="back">◀ All files</button></div>`; };
  openModal('Files', sel ? show(sel) : list(), (a, d) => { if (a === 'memo') $('mBody').innerHTML = show(d.id); if (a === 'back') $('mBody').innerHTML = list(); });
}
(function () {
  const st = document.createElement('style');
  st.textContent = `.vdmemo{white-space:pre-line;background:#f4f2ea;border-left:4px solid #8ccc3c}.vdhead{font:700 11px var(--pix);color:#3a424c;letter-spacing:.5px;border-bottom:2px solid #8ccc3c;margin-bottom:6px;padding-bottom:3px;white-space:normal}.vdhead small{font-weight:400;color:#6a7480;margin-left:4px}.vdlogo{color:#6ab02a}
  .wmap svg.rootweave{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}`;
  document.head.appendChild(st);
})();

/* ---------- what goes where. at: the tile it's meant for (the nearest good tile is used). Kinds:
   stake, pipe: litter you walk past. board: a billboard (defaced after the reveal). memo: a dropped clipboard.
   tech: a Field Tech. site: the siphon. heart: the root-heart it drinks from. boss: the site's admin. */
const vdTeam = (...a) => a.map(([s, l]) => [s, l]);
const VD_PLACES = {
  route1: [{ k: 'stake', at: [24, 6] }, { k: 'stake', at: [34, 17] }, { k: 'stake', at: [29, 29] }, { k: 'pipe', at: [13, 41] }, { k: 'pipe', at: [13, 44] }, { k: 'pipe', at: [13, 47] },
    { k: 'board', at: [28, 22], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Future site of Verdance Smallroot Station. Bringing jobs and energy to your community!" }, { k: 'memo', id: 'survey', at: [8, 52] }, { k: 'stake', at: [24, 61] }],
  route2: [{ k: 'board', at: [31, 6], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Proud partner of rural communities. Ask about our free Verdance Grow!" }, { k: 'stake', at: [15, 21] }, { k: 'stake', at: [32, 33] },
    { k: 'pipe', at: [17, 26] }, { k: 'pipe', at: [20, 26] }, { k: 'memo', id: 'brief', at: [39, 37] }],
  route3: [{ k: 'pipe', at: [25, 14] }, { k: 'pipe', at: [25, 18] }, { k: 'pipe', at: [25, 24] }, { k: 'pipe', at: [41, 27] }, { k: 'pipe', at: [49, 19] },
    { k: 'tech', id: 'vd_bog1', kind: 'vtech', name: 'Corbin', at: [40, 28], team: vdTeam(['puffpiper_cotton', 17], ['sundrowse', 18]) }, { k: 'memo', id: 'collars', at: [50, 20] }],
  route4: [{ k: 'tech', id: 'vd_fen1', kind: 'vtech', name: 'Mags', at: [15, 4], team: vdTeam(['puffpiper', 20], ['tipplecup', 21]) },
    { k: 'tech', id: 'vd_fen2', kind: 'vtech2', name: 'Dean', at: [40, 4], team: vdTeam(['glimmerjel', 21], ['muddlebub', 22]) },
    { k: 'memo', id: 'fenlog', at: [28, 34] },
    { k: 'site', s: 'fen', at: [51, 17] }, { k: 'heart', s: 'fen', at: [48, 24] },
    { k: 'boss', id: 'vd_fen_boss', kind: 'vtech2', name: 'Pell', title: 'Site Supervisor', s: 'fen', at: [49, 18], team: vdTeam(['muddlebub', 22], ['fenfang', 23], ['logloom', 24]) },
    { k: 'pipe', at: [47, 21] }],
  brookholt: [{ k: 'board', at: [27, 9], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Verdance is investing in Brookholt's future. Drainage improvements in progress. We apologise for any disruption to the fen." }],
  crag1: [{ k: 'board', at: [20, 3], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Cragside Pass: keeping the city's lights on since last spring." }, { k: 'pipe', at: [24, 20] }, { k: 'pipe', at: [24, 22] },
    { k: 'tech', id: 'vd_crag1', kind: 'vtech', name: 'Ferris', at: [22, 12], team: vdTeam(['craglet', 28], ['clinkit', 29]) }, { k: 'stake', at: [10, 36] }],
  crag3: [{ k: 'tech', id: 'vd_crag3', kind: 'vtech2', name: 'Lou', at: [24, 27], team: vdTeam(['cindhop_2', 32], ['staticwing', 33]) }, { k: 'pipe', at: [27, 30] }, { k: 'pipe', at: [12, 18] }],
  cragmine: [{ k: 'tech', id: 'vd_mine1', kind: 'vtech', name: 'Ozzie', at: [7, 20], team: vdTeam(['clinkit_2', 34], ['flintburrow', 34]) },
    { k: 'tech', id: 'vd_mine2', kind: 'vtech2', name: 'Petra', at: [12, 12], team: vdTeam(['rampartoad', 35], ['cindhop_2', 35]) },
    { k: 'site', s: 'mine', at: [16, 5] }, { k: 'heart', s: 'mine', at: [8, 5] },
    { k: 'boss', id: 'vd_brask', kind: 'brask', name: 'Brask', title: 'Foreman', s: 'mine', at: [13, 7], team: vdTeam(['flintburrow', 36], ['rampartoad', 37], ['clinkit_2', 37], ['craglet_2', 38]) },
    { k: 'memo', id: 'brask', at: [5, 13] }],
  quarrydown: [{ k: 'board', at: [30, 30], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Geological survey complete. Thank you, Quarrydown!" }, { k: 'memo', id: 'quarry', at: [40, 20] }],
  dunes: [{ k: 'board', at: [26, 14], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Coming soon: Verdance Coastal Energy Park. Powering the city with the strength of the sea." }, { k: 'stake', at: [18, 18] }, { k: 'stake', at: [34, 18] }, { k: 'memo', id: 'power', at: [44, 10] }],
  stormwatch: [{ k: 'site', s: 'rig', at: [26, 33] }, { k: 'memo', id: 'rig', at: [44, 26] }],
  beaconreach: [{ k: 'board', at: [16, 20], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Verdance Offshore: safe, quiet and nowhere near your fishing grounds." }],
  heatherstep: [{ k: 'tech', id: 'vd_heath', kind: 'vtech', name: 'Hollis', at: [18, 30], team: vdTeam(['kitlet_2', 52], ['heathfoal', 53]) }, { k: 'pipe', at: [20, 20] }, { k: 'pipe', at: [20, 24] }],
  galeledges: [{ k: 'tech', id: 'vd_gale', kind: 'vtech2', name: 'Bea', at: [20, 26], team: vdTeam(['flurrowl', 54], ['staticwing', 55]) }, { k: 'pipe', at: [14, 30] }],
  highmoor: [{ k: 'board', at: [12, 30], text: "<b>VERDANCE ENERGY</b><br><i>Clean power, naturally™</i><br><br>Verdance Weather Research Station, Windcrown Peak. Science for a brighter tomorrow." }],
  windcrown: [{ k: 'tech', id: 'vd_wc1', kind: 'vtech', name: 'Rufus', at: [22, 32], team: vdTeam(['floecalf', 56], ['craglet_3', 57]) },
    { k: 'tech', id: 'vd_wc2', kind: 'vtech2', name: 'Jo', at: [8, 22], team: vdTeam(['whirlwyn', 57], ['wishling_2', 57]) },
    { k: 'site', s: 'tower', at: [23, 3] }, { k: 'heart', s: 'tower', at: [7, 4] },
    { k: 'boss', id: 'vd_ash', kind: 'ash', name: 'Ash', title: 'Dr', s: 'tower', at: [20, 5], team: vdTeam(['duskcloak', 58], ['stormveil_3', 59], ['wishling_3', 59], ['flurrowl_2', 60], ['staticwing', 60]) },
    { k: 'memo', id: 'cirro', at: [26, 15] }, { k: 'memo', id: 'taproot', at: [26, 9], after: 'tower' }],
};
const VD_FOOT = { board: 3, site: 2, heart: 2, rig: 3 };   // tiles wide (blocked along the bottom row)
const VD_ART = { stake: 'vd_stake', pipe: 'vd_pipe', memo: 'vd_memo' };

// is it showing today?
function vdShows(key, it) {
  const reg = VD_REGION[key], gone = reg && vdShut(reg);
  if (it.k === 'memo') return !vd().memos[it.id] && (!it.after || vdShut(it.after));
  if (it.k === 'stake' || it.k === 'pipe' || it.k === 'tech') return !gone;
  if (it.k === 'board') return !(gone && vdReveal());
  return true;   // sites, root-hearts and bosses stay (shut down, revived and beaten)
}

/* ---------- finding good tiles */
const VD_POS = {};
function vdLayout(key) {
  if (VD_POS[key]) return VD_POS[key];
  const R = buildRoute(), N = RW * RH, blocked = Uint8Array.from(R.blocked), used = new Uint8Array(N);
  const kind = R.kind || [], ascii = !!RC.ascii, sea = !!RC.sail;
  const avoid = new Uint8Array(N);   // puzzle pieces, exits, channels and the spawn get a wide berth
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < RW && b < RH) avoid[b * RW + a] = 1; } };
  const markRect = ([a, b, c, d], r = 0) => { for (let y = b - r; y <= d + r; y++) for (let x = a - r; x <= c + r; x++) if (x >= 0 && y >= 0 && x < RW && y < RH) avoid[y * RW + x] = 1; };
  for (let i = 0; i < N; i++) { const c = kind[i]; if (c === 'B' || c === 'C' || (typeof RAILS !== 'undefined' && RAILS.includes(c))) mark(i % RW, (i / RW) | 0, 2); if ('<>^v'.includes(c) && c) mark(i % RW, (i / RW) | 0, 1); }
  for (const e of RC.exits || []) markRect(e.r, 2);
  for (const r of RC.open || []) markRect(r);
  for (const c of RC.channels || []) { markRect(c.r, 1); for (const l of c.links || []) markRect(l); }
  if (RC.gate) markRect(RC.gate.area, 1);
  const sp = RC.spawn; if (sp) mark(sp.x, sp.y, 2);
  for (const k of Object.keys(ROUTE_SIGNS)) { const [x, y] = k.split(',').map(Number); mark(x, y, 1); }
  for (const t of ROUTE_TRAINERS) mark(t.x, t.y, 1);
  for (const p of PICKUPS) mark(p.x, p.y, 1);
  for (const v of Object.values(RC.switches || {})) mark(v.x, v.y, 2);
  if (!sea) { if (RC.up) markRect([0, 0, RW - 1, 1]); if (RC.down) markRect([0, RH - 2, RW - 1, RH - 1]); if (RC.left) markRect([0, 0, 1, RH - 1]); if (RC.right) markRect([RW - 2, 0, RW - 1, RH - 1]); }
  // tall things (trees) hide whatever stands just behind them: keep billboards and machines out of their shade
  const shade = new Uint8Array(N);
  for (const d of [...(R.deco || []).filter(d => d.tall), ...(R.border || [])]) for (let dy = 1; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) { const a = d.x + dx, b = d.y - dy; if (a >= 0 && b >= 0 && a < RW && b < RH) shade[b * RW + a] = 1; }
  const free = i => !blocked[i];
  const path = i => !!(R.dirtish && R.dirtish[i]);
  // a tile can be filled without cutting anything off if its open neighbours stay joined round its 8-ring
  const simple = (x, y) => {
    const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([dx, dy]) => { const a = x + dx, b = y + dy; return a >= 0 && b >= 0 && a < RW && b < RH && free(b * RW + a); });
    const four = [1, 3, 5, 7].filter(j => ring[j]); if (!four.length) return false;
    // walk the ring: open cells joined edge-to-edge (corners only join through an open side)
    const seen = new Set([four[0]]), st = [four[0]];
    while (st.length) { const j = st.pop(); for (const n of [(j + 1) % 8, (j + 7) % 8]) if (ring[n] && !seen.has(n)) { seen.add(n); st.push(n); } }   // ring neighbours always share an edge
    return four.every(j => seen.has(j));
  };
  const ok = (x, y, w, blocks) => {
    for (let k = 0; k < w; k++) {
      const a = x + k, i = y * RW + a; if (a < 1 || y < 1 || a >= RW - 1 || y >= RH - 1) return false;
      if (blocked[i] || used[i] || avoid[i] || R.grass[i] >= 0 || (blocks && shade[i])) return false;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const j = (y + dy) * RW + a + dx; if (used[j] === 2) return false; }   // no two things touching
    }
    if (!blocks) return true;
    // fill one at a time, checking each keeps the map joined
    const filled = [];
    for (let k = 0; k < w; k++) { if (!simple(x + k, y)) { filled.forEach(i => blocked[i] = 0); return false; } blocked[y * RW + x + k] = 1; filled.push(y * RW + x + k); }
    // and something must stand in front of it so it can be talked to
    const front = [[0, 1], [0, -1], [-1, 0], [w, 0]].some(([dx, dy]) => { const a = x + dx, b = y + dy; return a >= 0 && b >= 0 && a < RW && b < RH && free(b * RW + a); });
    filled.forEach(i => blocked[i] = 0); return front;
  };
  const out = [];
  (VD_PLACES[key] || []).forEach((it, idx) => {
    const w = it.k === 'site' && it.s === 'rig' ? VD_FOOT.rig : VD_FOOT[it.k] || 1, blocks = !['stake', 'pipe', 'memo'].includes(it.k);
    let best = null, bs = 1e9; const [tx, ty] = it.at;
    for (let r = 0; r <= 12; r++) for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || x < 0 || y < 0 || x >= RW || y >= RH) continue;
      const d = Math.hypot(x - tx, y - ty); if (d >= bs) continue;
      const onPath = !sea && [...Array(w)].some((_, k) => path(y * RW + x + k));
      const nearPath = !sea && [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [w, 0]].some(([dx, dy]) => path((y + dy) * RW + x + dx));
      const sc = d + (onPath && it.k !== 'pipe' ? 5 : 0) + (nearPath || ascii ? 0 : 1.5); if (sc >= bs) continue;
      if (!ok(x, y, w, blocks)) continue;
      best = { x, y }; bs = sc;
    }
    if (!best) { console.warn('verdance: no room for', key, it.k, it.id || it.s || ''); return; }
    for (let k = 0; k < w; k++) { used[best.y * RW + best.x + k] = 2; if (blocks) blocked[best.y * RW + best.x + k] = 1; }
    // stand-alone litter only marks itself; everything else keeps a one-tile margin from the next thing
    const o = { ...it, idx, x: best.x, y: best.y, w };
    if (it.k === 'tech' || it.k === 'boss') {   // face the most open way, so they watch the path
      let bestDir = 'down', run = -1;
      for (const d of DIRS) { const [dx, dy] = DV[d]; let n = 0; for (let k = 1; k <= 4; k++) { const a = o.x + dx * k, b = o.y + dy * k; if (a < 0 || b < 0 || a >= RW || b >= RH || blocked[b * RW + a]) break; n++; } if (n > run) { run = n; bestDir = d; } }
      o.dir = it.dir || bestDir;
    }
    out.push(o);
  });
  return (VD_POS[key] = out);
}

/* ---------- putting them on the map: signs block and can be talked to, techs and bosses are trainers */
const VD_ADDED = {};
function vdClear(key) {
  const R0 = ROUTES[key], a = VD_ADDED[key]; if (!a) return;
  for (const k of a.signs) if (typeof R0.signs[k] === 'string' && R0.signs[k].startsWith('__door:vd_')) delete R0.signs[k];
  R0.trainers = R0.trainers.filter(t => !t.vd);
  delete VD_ADDED[key];
}
function vdInject(key) {
  const R0 = ROUTES[key], a = VD_ADDED[key] = { signs: [] };
  for (const o of vdLayout(key)) {
    if (!vdShows(key, o)) continue;
    if (o.k === 'tech' || o.k === 'boss') { R0.trainers.push({ id: o.id, kind: o.kind, name: o.name, x: o.x, y: o.y, dir: o.dir, sight: o.k === 'boss' ? 0 : 3, team: o.team, vd: o.k, title: o.title, s: o.s }); continue; }
    if (o.k === 'stake' || o.k === 'pipe' || o.k === 'memo') continue;
    for (let k = 0; k < o.w; k++) { const sk = (o.x + k) + ',' + o.y; R0.signs[sk] = '__door:vd_' + o.idx; a.signs.push(sk); }
  }
}
const _vdUseRoute = useRoute;
useRoute = function (key) {
  if (!VD_PLACES[key] || !S) return _vdUseRoute(key);
  vdClear(key); _vdUseRoute(key);
  vdLayout(key); vdInject(key); _vdUseRoute(key);
};
const vdItem = (key, idx) => (VD_POS[key] || []).find(o => o.idx === +idx);

/* ---------- drawing them */
const _vdRouteCreate = Route.prototype.create;
Route.prototype.create = function () {
  _vdRouteCreate.call(this);
  const key = this.scene.key; this.vdSpr = {};
  if (!VD_POS[key] || !this.textures.exists('vd')) return;
  const site = vdSiteOf(key);
  for (const o of VD_POS[key]) {
    if (!vdShows(key, o) || o.k === 'tech' || o.k === 'boss') continue;
    const cx = o.x * T + o.w * 8, by = o.y * T + 16;
    let f = VD_ART[o.k];
    if (o.k === 'board') f = vdReveal() ? 'vd_board_x' : 'vd_board';
    if (o.k === 'site') f = VD_SITES[o.s].art + (vdShut(o.s) ? '_off' : '');
    if (o.k === 'heart') f = vdShut(o.s) ? 'vd_root_on' : 'vd_root';
    const flat = o.k === 'pipe' || o.k === 'memo';
    const im = this.add.image(cx, flat ? o.y * T + 13 : by, 'vd', f).setOrigin(.5, flat ? .5 : 1).setDepth(flat ? 2 : o.y * T + 15);
    if (o.k === 'board' || o.k === 'site') { im.noShadow = 1; this.tall.push(im); }
    if (o.k === 'memo') this.tweens.add({ targets: im, y: im.y - 1.5, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
    if (o.k === 'site' && !vdShut(o.s)) vdHum(this, im, o);
    if (o.k === 'heart' && vdShut(o.s)) vdGlow(this, cx, by - 10);
    this.vdSpr[o.idx] = im;
  }
  if (site && !vdShut(site)) vdDrain(this, VD_POS[key].find(o => o.k === 'site'));
};
// a running siphon: a green pulse and a low hum of particles drawn up the pipe
function vdHum(sc, im, o) {
  const g = sc.add.circle(im.x, im.y - im.displayHeight * .55, 10, 0xb8ff6a, .25).setBlendMode(Phaser.BlendModes.ADD).setDepth(im.depth + 1);
  sc.tweens.add({ targets: g, scale: 1.6, alpha: .05, yoyo: true, repeat: -1, duration: 700 });
  sc.vdHumFx = [g];
  sc.time.addEvent({ delay: 380, loop: true, callback: () => {
    if (!im.active || vdShut(o.s)) return;
    const p = sc.add.circle(im.x + (Math.random() - .5) * 30, im.y + 6, 1.4, 0xb8ff6a, .9).setDepth(im.depth + 1);
    sc.tweens.add({ targets: p, x: im.x, y: im.y - im.displayHeight * .5, alpha: 0, duration: 1100, onComplete: () => p.destroy() });
  } });
}
// the drained land round a running siphon: greyed long grass and a dull haze
function vdDrain(sc, o) {
  if (!o) return;
  const cx = o.x * T + o.w * 8, cy = o.y * T + 8, rad = 10 * T;
  for (const [i, s] of Object.entries(sc.grassSpr || {})) { const d = Math.hypot(s.x - cx, s.y - cy); if (d < rad) s.setTint(d < rad * .6 ? 0x9a9884 : 0xb4b29c); }
  const haze = sc.add.graphics().setDepth(1.6);
  for (let r = rad; r > 0; r -= T) { haze.fillStyle(0x6e6a5a, .05); haze.fillCircle(cx, cy, r); }
  sc.vdHaze = haze;
}
function vdGlow(sc, x, y) {
  const g = sc.add.circle(x, y, 18, 0xffe9a0, .18).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 28);
  sc.tweens.add({ targets: g, scale: 1.3, alpha: .06, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.inOut' });
}

/* ---------- memos: walk over them to pick them up */
const _vdArrive = Route.prototype.arriveHook;
Route.prototype.arriveHook = function (x, y) {
  const key = this.scene.key, o = (VD_POS[key] || []).find(q => q.k === 'memo' && q.x === x && q.y === y && vdShows(key, q));
  if (o) {
    vd().memos[o.id] = 1; Sound.play('pop');
    const im = this.vdSpr[o.idx]; if (im) this.tweens.add({ targets: im, y: im.y - 10, alpha: 0, duration: 400, onComplete: () => im.destroy() });
    const first = vdFileCount() === 1;
    toast(`🗂️ Found a Verdance memo: “${VD_MEMOS[o.id].title}”. ${first ? 'Read it under Menu → Files.' : 'Added to your Files.'}`, 3600);
    if (o.id === 'taproot') setTimeout(() => openFiles('taproot'), 900);
  }
  return _vdArrive.call(this, x, y);
};

/* ---------- talking to things */
const _vdSign = Route.prototype.sign;
Route.prototype.sign = function (x, y) {
  const t = ROUTE_SIGNS[x + ',' + y];
  if (t && t.startsWith('__door:vd_')) { this.face(x, y); vdDoor(this, t.slice(10)); return true; }
  return _vdSign.call(this, x, y);
};
function vdDoor(sc, idx) {
  const key = sc.scene.key, o = vdItem(key, idx); if (!o) return;
  if (o.k === 'board') return openModal('Billboard', `<div style="text-align:center"><img src="${vdIcon('vd_board' + (vdReveal() ? '_x' : ''))}" style="width:60%;image-rendering:auto"></div><p style="text-align:center">${o.text}</p>${vdReveal() ? `<p class="hint" style="text-align:center">Someone has sprayed <b>LIARS</b> across it in big letters.</p>` : ''}`);
  if (o.k === 'heart') {
    const S0 = VD_SITES[o.s];
    return Talk.say([vdSys(vdShut(o.s) ? `A root as thick as a barrel breaks the surface here, warm and humming softly. This is ${S0.heart}, and life is flowing through it again, back along the Rootweave towards Smallroot.` : `A root as thick as a barrel breaks the surface here. It's grey, cold and cracked. A Verdance pipe is clamped onto it like a leech. This is ${S0.heart}.`)]);
  }
  if (o.k === 'site') return vdSiteTalk(sc, o);
}
const vdSys = t => ({ name: S.name, img: PLAYER_PIC ? PLAYER_PIC[0] : '', t });
function vdIcon(f) {
  const tx = scene && scene.textures.get('vd'); if (!tx) return '';
  const fr = tx.get(f), c = document.createElement('canvas'); c.width = fr.cutWidth; c.height = fr.cutHeight;
  c.getContext('2d').drawImage(tx.getSourceImage(), fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
  return c.toDataURL();
}

/* ---------- Field Techs and the site bosses */
const VD_BOSS_LINES = {
  fen: { meet: ["Oi! Who let you over the channels? Those levers were locked!", "This is a Verdance Energy work site. Site Supervisor Pell. Turn round and go back to your little farm.", "No? Fine. I've got quotas to hit and I'm not losing my bonus to some kid with a jam jar."],
    win: ["...Right. That's my bonus gone.", "You want to switch it off? Go on. I've got the lock-keeper on my back and head office on the phone. I don't get paid enough for this.", "But this isn't over. Gleam'll smooth it over. He always does."], after: "I'm putting in for a transfer. Somewhere with fewer farmers." },
  mine: { meet: ["Stop right there. You're the one who shut down Pell's siphon, aren't you? Word gets round.", "Name's Brask. I run the drilling crews. Twenty years I've been with Verdance.", "That drill's three days off the root-heart. I don't like it any more than you do, but a job's a job. Let's get this over with."],
    win: ["Huh. You fight like you mean it.", "...Go on, then. Switch it off. The red lever on the side.", "I've heard that thing in the rock singing every night for six weeks. Maybe it'll finally get some sleep. Maybe I will too."], after: "I'll tell head office the drill seized. Don't make me regret it." },
  rig: { meet: ["Ahoy, little boat! You're in Verdance waters now. Rig Chief Dunmore.", "You've been shutting down our sites up and down the valley. Not this one. This rig's the best earner we've got!", "Crew, man the pumps! I'll deal with the farmer."],
    win: ["Blast it! The pressure's dropping... the whole rig's shaking!", "Fine! Shut it off! I'm not going down with it.", "Head office will hear about this. Mr Thorne will hear about this!"], after: "Don't look at me like that. The whale was an accident." },
  tower: { meet: ["Ah. The farmer. I've read your file. It's growing quite thick.", "Dr Corvin Ash, Head of Research. That cloud above us is Cirrovale. My tower keeps it... agitated. An agitated legend gives three times the energy of a calm one.", "You'd like me to stop. How sentimental. Let's see whether your Fablemon are as energy-dense as you seem to think."],
    win: ["Remarkable. Your bond with them... it's a variable I hadn't accounted for.", "Very well. Turn it off. The data from today alone will keep me busy for a month.", "It changes nothing, of course. Taproot will make all of this unnecessary. Do read my notes. I left them on the summit."], after: "Fascinating. Simply fascinating." },
};
const vdBossName = t => `${t.title || TRAINER_TYPES[t.kind].label} ${t.name}`;
function vdBattle(sc, t) {
  const TT = TRAINER_TYPES[t.kind], boss = t.vd === 'boss', L = VD_BOSS_LINES[t.s] || {};
  const who = boss ? vdBossName(t) : `${TT.label} ${t.name}`, pic = f => trainerPic(t.kind, f);
  sc.paused = true;
  const lines = boss ? L.meet.map(x => ({ who: 'trainer', name: who, img: pic(0), t: x })) : [{ who: 'trainer', name: who, img: pic(0), t: pick(TT.challenge) }];
  Talk.say(lines, async () => {
    const teamMons = t.team.map(([sp, lv]) => { const m = trainerMon(sp, lv); m.collar = 1; return m; });
    await vdCollarPics(teamMons);
    const intro = [`${boss ? vdBossName(t) : TT.label + ' ' + t.name} wants to battle!`, `${SPECIES[teamMons[0].sp].name} is wearing a drain collar! A green light blinks on its belt pack...`];
    Battle.start(teamMons[0], { label: boss ? (t.title || TT.label) : TT.label, name: t.name, team: teamMons, intro, boss, smart: boss && t.s !== 'fen', heals: boss ? (t.s === 'tower' ? 2 : 1) : 0,
      prize: Math.max(...t.team.map(([, l]) => l)) * (boss ? 60 : 30), lose: boss ? 'Tch.' : pick(TT.lose),
      onWin: () => {
        S.trainers = S.trainers || {}; S.trainers[t.id] = 1;
        const fr = vd().freed[sc.scene.key] = vd().freed[sc.scene.key] || []; for (const [sp] of t.team) if (!fr.includes(sp)) fr.push(sp);
        setTimeout(() => {
          const names = [...new Set(t.team.map(([sp]) => SPECIES[sp].name))];
          const free = [vdSys(`Every drain collar on ${t.name}'s team cracks and falls off with a fizz. ${names.join(' and ')} blink${names.length > 1 ? '' : 's'}, shake${names.length > 1 ? '' : 's'} the grey out of ${names.length > 1 ? 'their' : 'its'} fur, and bound${names.length > 1 ? '' : 's'} away into the wild!`)];
          Talk.say(boss ? [...free, ...L.win.map(x => ({ who: 'trainer', name: who, img: pic(1), t: x }))] : free, () => toast(boss ? 'Now shut the site down: talk to it.' : 'The freed Fablemon will be living wild round here now.', 2800));
        }, 400);
      } });
  });
}
// a collared Fablemon in battle: drained grey, with the collar's belt pack blinking at its side
const VD_COLLAR_PIC = {};
async function vdCollarPics(mons) {
  for (const m of mons) {
    const src = monPicOf({ ...m, collar: 0 }, 'front'); if (VD_COLLAR_PIC[src]) continue;
    try {
      const im = await loadImg(src), c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d');
      g.filter = 'saturate(.35) brightness(.92)'; g.drawImage(im, 0, 0); g.filter = 'none';
      const tx = scene.textures.get('vd'), fr = tx.get('vd_collar'), w = c.width * .42, h = w * fr.cutHeight / fr.cutWidth;
      g.drawImage(tx.getSourceImage(), fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, c.width * .5 - w / 2, c.height * .78 - h, w, h);
      const u = c.toDataURL(); VD_COLLAR_PIC[src] = u; HD_SMOOTH.add(u);
    } catch (e) { }
  }
}
const _vdPicOf = monPicOf;
monPicOf = function (m, k = 'icon') { const u = _vdPicOf(m, k); return m && m.collar && k === 'front' && VD_COLLAR_PIC[u] ? VD_COLLAR_PIC[u] : u; };
const _vdStartTB = Route.prototype.startTrainerBattle;
Route.prototype.startTrainerBattle = function (t) { return t.vd ? vdBattle(this, t) : _vdStartTB.call(this, t); };
const _vdTalkTB = Route.prototype.talkTrainer;
Route.prototype.talkTrainer = function (t) {
  if (!t.vd) return _vdTalkTB.call(this, t);
  const p = this.p; t.dir = p.x > t.cx ? 'right' : p.x < t.cx ? 'left' : p.y > t.cy ? 'down' : 'up'; t.spr.setFrame(DIRS.indexOf(t.dir) * 4);
  if (!beatTrainer(t.id)) { if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400); return this.startTrainerBattle(t); }
  const who = t.vd === 'boss' ? vdBossName(t) : `${TRAINER_TYPES[t.kind].label} ${t.name}`;
  Talk.say([{ who: 'trainer', name: who, img: trainerPic(t.kind, 1), t: t.vd === 'boss' ? (vdShut(t.s) ? VD_BOSS_LINES[t.s].after : VD_BOSS_LINES[t.s].win[1]) : pick(TRAINER_TYPES[t.kind].after) }]);
};
// freed Fablemon live wild where they were set free
const _vdRollWild = rollWild;
rollWild = function (a, b, extra) { const fr = scene && S.vd && S.vd.freed[scene.scene.key]; return _vdRollWild(a, b, fr && fr.length ? [...(extra || []), ...fr.map(sp => [sp, 8])] : extra); };

/* ---------- shutting a site down */
function vdSiteTalk(sc, o) {
  const S0 = VD_SITES[o.s], boss = VD_POS[sc.scene.key].find(q => q.k === 'boss' && q.s === o.s);
  if (vdShut(o.s)) return Talk.say([vdSys(`The ${S0.name} sits silent and cold. A Verdance padlock hangs off it, snapped in two.`)]);
  if (boss && !beatTrainer(boss.id)) {
    const desc = { fen: "A Verdance siphon, hammered into the fen. Its pipe runs down into the black water towards a great grey root. A sign: AUTHORISED PERSONNEL ONLY.", mine: "A drill as tall as a house, screaming into the rock. The crystals on the walls flicker with every turn of its bit.", rig: "An offshore rig, all steel legs and floodlights, its drill thrumming down into the sea. Somewhere below, something vast groans.", tower: "A steel tower bristling with vanes, pulling the storm cloud round and round the summit like water down a plughole." }[o.s];
    return Talk.say([vdSys(desc), vdSys(`${vdBossName(boss)} is standing guard. You'll have to get past them first.`)]);
  }
  if (o.s === 'rig' && !beatTrainer('vd_rigchief')) return vdRigChief(sc, o);
  openModal(S0.name, `<p>Shut down the ${S0.name}? The pipe into ${S0.heart} will close for good.</p><div class="row"><button class="btn gold" data-a="yes">Shut it down</button><button class="btn" data-a="no">Not yet</button></div>`, a => {
    closeModal(); if (a === 'yes') vdShutDown(sc, o);
  });
}
// the rig has no deck to stand on, so its Chief shouts down from it and battles from there
function vdRigChief(sc, o) {
  if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
  const t = { id: 'vd_rigchief', kind: 'vtech2', name: 'Dunmore', title: 'Rig Chief', s: 'rig', vd: 'boss', team: vdTeam(['stormveil', 43], ['riftshear', 43], ['kilnback', 44], ['mirebellows', 44]) };
  vdBattle(sc, t);
}
function vdShutDown(sc, o) {
  const S0 = VD_SITES[o.s], im = sc.vdSpr[o.idx];
  vd().shut[o.s] = S.day; Sound.play('thud'); sc.cameras.main.shake(300, .006);
  if (im) { im.setFrame(S0.art + '_off'); }
  for (const g of sc.vdHumFx || []) g.destroy();
  if (sc.vdHaze) sc.tweens.add({ targets: sc.vdHaze, alpha: 0, duration: 1800 });
  for (const s of Object.values(sc.grassSpr || {})) s.clearTint();
  const h = VD_POS[sc.scene.key].find(q => q.k === 'heart' && q.s === o.s), hi = h && sc.vdSpr[h.idx];
  sc.time.delayedCall(900, () => {
    Sound.play('levelup');
    if (hi) { hi.setFrame('vd_root_on'); vdGlow(sc, hi.x, hi.y - 10); }
    const fx = hi || im; if (fx) for (let i = 0; i < 18; i++) { const p = sc.add.circle(fx.x + (Math.random() - .5) * 40, fx.y - Math.random() * 20, 2, i % 2 ? 0xb8ff6a : 0xffe9a0, .9).setDepth(9e6); sc.tweens.add({ targets: p, y: p.y - 30 - Math.random() * 30, alpha: 0, duration: 1400 + Math.random() * 600, onComplete: () => p.destroy() }); }
    const n = vdFreedCount();
    const lines = { fen: [`The siphon shudders and falls still. The pipe drains out with a long gurgle...`, `...and ${S0.heart} drinks again. You can almost hear Brookholt's willow sigh with relief.`, `Far away to the west, deep under Smallroot, something stirs. The Hearthroot has felt it.`],
      mine: [`The drill whines down to silence. Dust settles. For the first time in weeks, the mine is quiet.`, `Then, from deep in the rock, a slow and peaceful hum. The crystals glow softly. Whatever sleeps down there is settling.`, `Along the Rootweave, warmth flows back towards Smallroot.`],
      rig: [`The rig's floodlights flicker and die. The drill grinds to a halt, and the sea goes calm around its legs.`, `Below the waves, the sea root breathes again. The water clears to a deep, clean blue.`, `Orrin will want to hear about this. And it's all the proof anyone needs.`],
      tower: [`The tower's vanes slow, stop, and droop. The cloud above stops spinning...`, `The wind drops to a breeze. Far below, Highmoor's mill creaks.`, `The summit root-heart flushes warm. Four hearthtrees free. The Rootweave is waking up.`] }[o.s];
    Talk.say(lines.map(vdSys), () => {
      toast(`🌳 Root-heart freed! ${n} of ${Object.keys(VD_SITES).length}. The Hearthroot in Smallroot grows stronger.`, 3800);
      if (o.s === 'tower') toast('Ash mentioned notes on the summit. Have a look around.', 3000);
      // the techs pack up and go once their site's shut
      if (VD_POS[sc.scene.key].some(q => q.k === 'tech' || q.after)) sc.time.delayedCall(600, () => { if (sc.scene.isActive() && !sc.paused) { const p = sc.p; travel(sc, sc.scene.key, { x: p.x, y: p.y, dir: p.dir }); } });
    });
  });
}

/* ---------- the gates on the legendaries: they can't settle while a site is running */
const _vdMeetLegend = Crag.prototype.meetLegend;
Crag.prototype.meetLegend = function () {
  if (!vdShut('mine') && !S.mons.some(m => m.sp === 'fulgarok') && this.legend)
    return Talk.say([vdSys('The crystals pulse angrily. The ground trembles. Something vast thrashes in the rock below...'), vdSys("It can't settle while that Verdance drill is screaming into the rock. Shut the drill down first.")]);
  return _vdMeetLegend.call(this);
};
const _vdStorm = wcStorm;
wcStorm = function (sc) {
  if (!vdShut('tower') && !windCalm()) return Talk.say([vdSys('The wind nearly knocks you flat. This storm isn\'t natural: it\'s being dragged round and round the summit by that steel tower.'), vdSys("Nothing up here will calm down while the tower's running. Deal with whoever's guarding it.")]);
  return _vdStorm(sc);
};

/* ---------- Tobias Gleam: letters, and the Verdance Grow kiosk in Smallroot */
const VD_LETTERS = {
  offer: { when: () => S.day >= 3, from: 'Tobias Gleam', body: n => `Dear ${n},

Welcome to the countryside! I'm Tobias Gleam, Head of Community Relations at <b>Verdance Energy</b>. Clean power, naturally™.

Wild Roots Farm sits on land that's very important to our plans for a brighter, greener valley. We'd like to offer you <b>20,000g</b> for it, today, no questions asked. Imagine! A lovely flat back in the city.

Do pop by our kiosk in Smallroot. Free Verdance Grow for all our neighbours!

Warmest regards,
Tobias Gleam 🌿
Head of Community Relations` },
  raise: { when: () => vdShut('fen'), from: 'Tobias Gleam', body: n => `Dear ${n},

It has come to our attention that some of our equipment in Sluice Fen has been "switched off". I'm sure it was a misunderstanding!

In a spirit of partnership, Verdance is raising our offer for Wild Roots Farm to <b>60,000g</b>. That's a great deal of money for a field of turnips.

I'd hate for our relationship to get... complicated.

Warmest regards,
Tobias Gleam 🌿` },
  legal: { when: () => vdReveal(), from: 'Verdance Energy, Legal Department', body: n => `NOTICE TO: ${n}, tenant, Wild Roots Farm

Verdance Energy holds licensed rights to the root-energy beneath this valley. You are hereby asked to STOP interfering with licensed operations, including (but not limited to) switching off, unplugging, or "having a word with" our equipment and staff.

Continued interference may result in legal action.

Verdance Legal
<small>P.S. from Tobias: Please. They're making me write these now. – T.G.</small>` },
};
const vdMailDue = () => Object.keys(VD_LETTERS).find(k => !vd().mail[k] && VD_LETTERS[k].when());
const _vdFarmCreate = Farm.prototype.create;
Farm.prototype.create = function () {
  _vdFarmCreate.call(this);
  if (S.mailRead && vdMailDue()) { this.mailFlag.setVisible(true); setTimeout(() => toast('A crisp green envelope is poking out of your mailbox.', 3200), 900); }
};
const _vdReadMail = Farm.prototype.readMail;
Farm.prototype.readMail = function () {
  const k = S.mailRead && vdMailDue(); if (!k) return _vdReadMail.call(this);
  vd().mail[k] = S.day; this.mailFlag.setVisible(!!vdMailDue()); Sound.play('pop');
  const L = VD_LETTERS[k];
  openModal(L.from === 'Tobias Gleam' ? 'A letter from Verdance' : 'An official notice', `<div class="letter vdmemo"><div class="vdhead"><span class="vdlogo">⚙</span> VERDANCE ENERGY <small>Clean power, naturally™</small></div>${L.body(S.name)}</div>${k === 'legal' ? '' : '<div class="row"><button class="btn" data-a="no">Write back: "Not for sale."</button></div>'}`, a => { if (a === 'no') { closeModal(); toast(k === 'offer' ? "You post your reply. Somehow you can already hear him saying 'the offer stands'." : 'You post your reply. Two words this time.', 3000); } });
};

ITEMS.vgrow = { name: 'Verdance Grow', stack: 999, fert: true, vgrow: true, sell: 1, desc: "Crops on this soil grow twice as fast. The small print: the soil is spent afterwards, and nothing grows there again until the season turns." };
const VD_KIOSK = { at: [44, 23] };
function vdKioskPos(tw) {
  if (VD_KIOSK.x) return VD_KIOSK;
  const blk = tw.blocked, doorsUp = new Set(Object.values(BUILDINGS).map(q => (q.cx + q.door) + ',' + (q.by + 1)));
  const okAt = (x, y) => [0, 1, 2].every(k => !blk[y * TW + x + k] && !doorsUp.has((x + k) + ',' + y) && !doorsUp.has((x + k) + ',' + (y - 1)) && !tw.doors[(x + k) + ',' + (y - 1)]) && [0, 1, 2].every(k => !blk[(y + 1) * TW + x + k]) && !SQUARE.some(([a, b]) => Math.abs(a - x) <= 2 && Math.abs(b - y) <= 2);
  for (let r = 0; r < 12; r++) for (let y = VD_KIOSK.at[1] - r; y <= VD_KIOSK.at[1] + r; y++) for (let x = VD_KIOSK.at[0] - r; x <= VD_KIOSK.at[0] + r; x++) if (!VD_KIOSK.x && okAt(x, y)) Object.assign(VD_KIOSK, { x, y });
  return VD_KIOSK;
}
const _vdTownCreate = Town.prototype.create;
Town.prototype.create = function () {
  _vdTownCreate.call(this);
  if (!this.textures.exists('vd') || S.day < 2) return;
  const k = vdKioskPos(this.town); if (!k.x) return;
  for (const d of [0, 1, 2]) this.town.blocked[k.y * TW + k.x + d] = 1;
  const im = this.add.image(k.x * T + 16, k.y * T + 16, 'vd', 'vd_kiosk').setOrigin(.5, 1).setDepth(k.y * T + 15); this.tall.push(im); this.shadow(im, 34, 7);
  this.gleam = this.add.sprite(k.x * T + 40, k.y * T + 15, 'tr_gleam', 0).setOrigin(.5, 1).setDepth(k.y * T + 15); this.shadow(this.gleam, 12, 5);
  if (vdReveal()) this.gleam.setVisible(false);
};
const _vdThing = Town.prototype.thing;
Town.prototype.thing = function (x, y) { const k = VD_KIOSK; if (k.x && this.gleam && y === k.y && x >= k.x && x <= k.x + 2) return { type: 'vd_kiosk', x, y }; return _vdThing.call(this, x, y); };
const _vdTownAct = Town.prototype.act;
Town.prototype.act = function (t) { if (t.type === 'vd_kiosk') { this.face(t.x, t.y); this.p.busy = .25; return vdKiosk(); } return _vdTownAct.call(this, t); };
function vdKiosk() {
  const G = (t, f = 0) => ({ who: 'trainer', name: 'Tobias Gleam', img: trainerPic('gleam', f), t });
  if (vdReveal()) return Talk.say([vdSys("The kiosk's shutters are down. A note is taped to them: 'CLOSED FOR A REVIEW OF COMMUNITY RELATIONS.'"), vdSys("Through a gap you can see a mug that says WORLD'S BEST NEIGHBOUR.")]);
  const first = !vd().metGleam; vd().metGleam = 1;
  const lines = first ? [G("Well hello there! You must be the new face at Wild Roots Farm! Tobias Gleam, Verdance Energy, Head of Community Relations.", 1), G("We're simply mad about this valley. Clean power, naturally! We're putting it back into the community, one free sack of Verdance Grow at a time."), G("Crops grow twice as fast! The small print? Pfft. Nobody reads the small print. Here, have five on the house!", 1)]
    : [G(vdShut('fen') ? "Oh. It's you. Our engineers at Sluice Fen have had a very... eventful week. Anyway! Verdance Grow?" : pick(["Twice the crop, half the wait! Verdance Grow!", "Have you thought any more about our offer? No? The offer stands!", "Clean power, naturally! I do love saying that."]), 1)];
  Talk.say(lines, () => {
    if (first) { inv.add('vgrow', 5); renderHotbar(); toast('Received 5 Verdance Grow. Read the small print before you use it!', 3200); return; }
    openModal('Verdance Grow kiosk', `<div class="recipe"><img src="${iconFor('vgrow')}"><div class="g"><b>Verdance Grow</b><small>${ITEMS.vgrow.desc}</small></div><button class="btn gold" data-a="buy">10g</button></div><p class="hint">Tobias beams at you over the counter.</p>`, a => {
      if (a !== 'buy') return;
      if (S.gold < 10) return toast("You can't afford it.");
      askQty({ title: 'Buy Verdance Grow', icon: iconFor('vgrow'), max: Math.min(99, Math.floor(S.gold / 10)), unit: 10, verb: 'Buy' }, n => { const left = inv.add('vgrow', n); S.gold -= (n - left) * 10; updateHUD(); renderHotbar(); Sound.play('coin'); if (left) toast('Your backpack is full.'); });
    });
  });
}

/* ---------- Rowan's reveal: once the mine's shut and the Stone Crest is won */
const vdRevealReady = () => !vdReveal() && vdShut('mine') && S.crests && S.crests.stone && S.flags.westOpen;
function vdRevealTalk(then) {
  const R = (t, f = 0) => ({ who: 'rowan', name: VILL.rowan.name, img: VPIC['rowan' + f], t });
  Talk.say([R("There you are. Bramble told me you've been switching off Verdance's machines up and down the valley. Sit down. There's something you need to know."),
    R("Every hearthtree in this valley is joined to every other. Their roots meet deep underground, in one living network. The old folk call it the Rootweave."),
    R("And all of it leads here, to the Hearthroot. The mother tree. When the Rootweave is healthy, the land is healthy. When it's drained..."),
    R("...the Fablemon leave. Then the people. That's what happened to Smallroot. I've suspected Verdance for years. I never had proof.", 1),
    R("Now I do. The fen, the mine. Every siphon you've found was drinking from the Rootweave, and every one of them weakened the Hearthroot."),
    R("Find the rest of their sites. Shut them down. Bring their papers back. Whatever they're planning next, I want to know before they do it.", 1)], () => {
    vd().reveal = S.day; toast('The truth about Verdance is out. Word spreads fast in a small town...', 3600); if (then) then();
  });
}
const _vdVillChat = villChat;
villChat = function (id, after, door) { if (id === 'rowan' && vdRevealReady()) return vdRevealTalk(); return _vdVillChat(id, after, door); };
const _vdHall = SERVICE.hall;
SERVICE.hall = svcHall = function () { if (vdRevealReady()) return vdRevealTalk(); return _vdHall(); };
// once the secret's out, Smallroot has opinions
const VD_SAY = { willa: "Three Fablemon came in this week with grey patches in their fur. Now I know why.", gideon: "Verdance. I fixed one of their drills once. Should've broken it instead.", robin: "If you find any of their billboards, I'll happily take them for firewood.",
  barney: "Gleam's barred from the Acorn. Barred! Wouldn't serve him if he was the last man in the valley.", hattie: "The poor lambs with those collars... You did right freeing them, love.", stanley: "The city trains run on Verdance power, you know. Makes you think.",
  poppy: "We left the city to get away from all that. And it followed us here.", finn: "I drew a picture of you beating up the drill people! Want to see?", ivy: "I painted LIARS on their billboard. Don't tell Bramble. Actually, do.", fenwick: "In all my travels, I've never seen a company so sure it was right. Those are the dangerous ones." };
const _vdSeasonal = seasonalLine;
seasonalLine = function (id) { if (vdReveal() && VD_SAY[id] && Math.random() < .3) return VD_SAY[id]; return _vdSeasonal(id); };

/* ---------- the Hearthroot feeds on freed root-hearts; the Rootweave on the map */
const _vdLife = lifeParts;
lifeParts = function () { const p = _vdLife(); if (S.vd && vdFreedCount()) p.push(['🌳', 'Root-hearts freed', vdFreedCount(), 15]); return p; };
const _vdMap = openMap;
openMap = function () {
  _vdMap();
  if (!S.vd) return;
  const wm = document.querySelector('.wmap'), town = MAP_PLACES.find(P => P.k === 'town'); if (!wm || !town) return;
  let svg = '';
  for (const [s, S0] of Object.entries(VD_SITES)) {
    const P = MAP_PLACES.find(q => q.k === S0.pin); if (!P || !placeSeen(P)) continue;
    const on = vdShut(s), x1 = town.x * 100, y1 = town.y * 100, x2 = P.x * 100, y2 = P.y * 100, mx = (x1 + x2) / 2 + (y2 - y1) * .18, my = (y1 + y2) / 2 - (x2 - x1) * .18;
    svg += `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${on ? '#ffe36a' : '#7a7466'}" stroke-width="${on ? .9 : .5}" stroke-dasharray="${on ? '' : '1.4 1.2'}" stroke-linecap="round" opacity="${on ? .95 : .6}"${on ? ' filter="url(#rwg)"' : ''}/>`;
  }
  if (!svg) return;
  wm.insertAdjacentHTML('beforeend', `<svg class="rootweave" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><filter id="rwg"><feGaussianBlur stdDeviation=".5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${svg}</svg>`);
  const sv = wm.querySelector('svg.rootweave'), img = wm.querySelector('img'); if (sv && img) img.after(sv);
};
const _vdNotes = placeNotes;
placeNotes = function (P) {
  const n = _vdNotes(P), s = Object.keys(VD_SITES).find(k => VD_SITES[k].pin === P.k);
  if (s && S.vd && (vdShut(s) || (S.visited || {})[VD_SITES[s].route])) n.push(vdShut(s) ? `🌳 ${VD_SITES[s].name} shut down. The root-heart is free.` : `⚙ The ${VD_SITES[s].name} is still running.`);
  if (P.k === 'town' && S.vd && vdFreedCount()) n.push(`🌳 Root-hearts freed: ${vdFreedCount()} of ${Object.keys(VD_SITES).length}`);
  return n;
};

/* ---------- the story's tasks */
QUESTS.splice(QUESTS.findIndex(q => q.id === 'fen') + 1, 0,
  { id: 'vd_fen', name: 'Shut down the siphon in Sluice Fen', hint: "Verdance has drained the fen to reach a root below. Their supervisor guards a siphon on the far side, by the way to Brookholt.", done: () => vdShut('fen'), reward: { gold: 1500, items: { tonic: 2 } } });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'stone') + 1, 0,
  { id: 'vd_mine', name: 'Stop the drill in the Old Mine', hint: "The rock in the Old Mine sings at night. Something is drilling towards it. Take the tunnel at the top of the Old Rail Cutting.", done: () => vdShut('mine'), reward: { gold: 3000, items: { sturdy_charm: 3 } } });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'west') + 1, 0,
  { id: 'vd_rowan', name: 'Hear what Rowan has to say', hint: "Rowan wants a word about Verdance. Find him in Smallroot: in the square, or at the Warden's Hall.", done: () => vdReveal(), reward: { gold: 1000 } });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'whale') + 1, 0,
  { id: 'vd_rig', name: 'Shut down the Verdance rig in Stormwatch Strait', hint: 'A Verdance rig is drilling the sea root in the middle of the strait. Sail up to it.', done: () => vdShut('rig'), reward: { gold: 4000, items: { tonic: 3 } } });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'millwind'), 0,
  { id: 'vd_tower', name: 'Stop the siphon tower on Windcrown Peak', hint: "The wind jamming Highmoor's mill comes off a Verdance tower on the summit of Windcrown Peak. Dr Ash is waiting for you.", done: () => vdShut('tower'), reward: { gold: 6000, items: { sturdy_charm: 5 } } });
QUESTS.splice(QUESTS.findIndex(q => q.id === 'vd_tower') + 1, 0,
  { id: 'vd_taproot', name: "Find Dr Ash's notes on the summit", hint: 'Ash said he left his notes on the summit of Windcrown Peak, near the tower.', done: () => !!vd().memos.taproot, reward: { gold: 2000 } });
Object.assign(QUEST_PLACE, { vd_fen: 'route4', vd_mine: 'crag3', vd_rowan: 'town', vd_rig: 'stormwatch', vd_tower: 'windcrown', vd_taproot: 'windcrown' });
