/* ============================================================ Townsfolk
   Villagers for the newer towns, drawn with the route-trainer sprites under new names. They wander the
   walkable tiles of their town (never onto doors, signs or exits) and have a few lines each. Talk to them
   by facing them. Loaded after beacon.js. */
const TOWNSFOLK = {
  quarrydown: [
    { kind: 'miner', name: 'Dougie', at: [20, 26], lines: ["Granger? Best foreman I ever had. Never raises his voice. Never needs to.", "Mind the carts on the avenue. They've no brakes to speak of.", "Thirty years I've swung a pick in that pit. Still find something new every week."] },
    { kind: 'climber', name: 'Bryn', at: [30, 18], lines: ["You came up through Cragside Heights? Those boulders still give me nightmares.", "Best view in the valley from the top of the Old Crane, once it's fixed.", "Granger's twin runs a shipyard on the coast. Can you imagine? Granger on a boat!"] },
    { kind: 'rambler', name: 'Meg', at: [14, 20], lines: ["Stone & Supply sells seeds you won't find anywhere else. Geode Melons! Try them!", "Flintcorn's the only thing that'll grow through a frost round here.", "I walk the quarry rim every morning. Keeps the knees honest."] },
    { kind: 'forager', name: 'Nell', at: [34, 26], lines: ["Wild Fablemon come down from the heights when it rains. Little rock ones, mostly.", "I sell my mushrooms at the station. The train crews love them.", "If you find a Flintcairn, leave it be. They sulk for weeks if you wake them."] },
  ],
  beaconreach: [
    { kind: 'busker', name: 'Shanty Sam', at: [22, 24], lines: ["♪ Oh the lamp burns bright on Beaconreach, the storm can't put it out! ♪", "Every boat that makes it through the strait gets a song from me. Here's yours!", "Orrin taps his boots to my shanties. Don't tell him I told you."] },
    { kind: 'birdwatcher', name: 'Old Tam', at: [33, 16], lines: ["Forty years at the lookout. I've seen a whale made of ice, you know. Twice!", "Gulls fly low before a big storm. They're flying low today. They always are.", "See the shoals to the south? There's islands behind them nobody visits."] },
    { kind: 'ponddipper', name: 'Marigold', at: [12, 23], lines: ["I mend the nets. That whale tore three of them clean in half last month.", "Kilnback turtles warm themselves on the hot vents out past the shoals.", "Rain's the same as sunshine here, love. You just wear a bigger coat."] },
    { kind: 'rambler', name: 'Harbourmaster Quill', at: [27, 30], lines: ["Tide's turning. Tide's always turning. That's the job.", "If the strait's too rough, I'll have you towed home. No shame in it.", "We used to get the ferry from Driftwood before the storms set in for good.", "The north jetty's for sailors Orrin trusts. Beat him and I'll open it: Windward Sound, then the cliffs of Highmoor."] },
  ],
  driftwood: [
    { kind: 'ponddipper', name: 'Rosie', at: [25, 20], lines: ["Hal's been whistling all week. He's happiest with sawdust in his beard.", "The rock pools by the pier are full of Nipshade at night. Watch your toes!", "My gran says the cove was busy as a market once. Maybe it will be again."] },
    { kind: 'busker', name: 'Fiddler Jory', at: [20, 14], lines: ["Pull up a crate! I know every shanty there is, and a few that aren't yet.", "Hal and Granger used to sing together. Granger had the better voice. Don't tell Hal.", "♪ Haul away, haul away, the boat's not built in a day! ♪"] },
    { kind: 'forager', name: 'Kit', at: [30, 24], lines: ["I comb the beach for driftwood every morning. Hal buys the good bits.", "Saltgrass Dunes are full of Fablemon that like the sea air.", "Ever been out past the Glimmer Sea? They say the water turns grey and never stops raining."] },
  ],
};
function folkSetup(sc) {
  const list = TOWNSFOLK[sc.scene.key]; if (!list) return;
  const R = sc.R, exits = RC.exits || [];
  const inExit = (x, y) => exits.some(e => x >= e.r[0] && x <= e.r[2] && y >= e.r[1] && y <= e.r[3]);
  const free = (x, y) => x > 0 && y > 0 && x < RW - 1 && y < RH - 1 && !R.blocked[y * RW + x] && !ROUTE_SIGNS[x + ',' + y] && !inExit(x, y) && !ROUTE_SIGNS[x + ',' + (y - 1)];
  sc.folk = [];
  list.forEach((f, i) => {
    // nearest free tile to where they like to stand
    let spot = null;
    for (let r = 0; r < 12 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r && !spot; dx++) {
      const x = f.at[0] + dx, y = f.at[1] + dy; if (free(x, y) && !sc.folk.some(o => o.x === x && o.y === y) && !(sc.p && sc.p.x === x && sc.p.y === y)) spot = { x, y };
    }
    if (!spot) return;
    const key = 'tr_' + trArt(f.kind);
    for (let r = 0; r < 4; r++) { const k = `${key}_walk_${DIRS[r]}`; if (!sc.anims.exists(k)) sc.anims.create({ key: k, frames: sc.anims.generateFrameNumbers(key, { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    const spr = sc.add.sprite(spot.x * T + 8, spot.y * T + 15, key, 0).setOrigin(.5, 1).setDepth(spot.y * T + 15);
    sc.shadow(spr, 12, 5);
    const o = { ...f, i, x: spot.x, y: spot.y, home: spot, spr, key };
    const id = `tf_${sc.scene.key}_${i}`;
    o.place = () => { R.blocked[o.y * RW + o.x] = 1; ROUTE_SIGNS[o.x + ',' + o.y] = '__door:' + id; };
    o.lift = () => { R.blocked[o.y * RW + o.x] = 0; if (ROUTE_SIGNS[o.x + ',' + o.y] === '__door:' + id) delete ROUTE_SIGNS[o.x + ',' + o.y]; };
    o.place(); sc.folk.push(o);
  });
  sc.time.addEvent({ delay: 1400, loop: true, callback: () => {
    if (sc.paused || !sc.p) return;
    for (const o of sc.folk) {
      if (o.busy || o.talking || !o.spr.active || Math.random() < .55) continue;
      const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = o.x + dx, ny = o.y + dy, p = sc.p;
      const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if (Math.abs(nx - o.home.x) > 5 || Math.abs(ny - o.home.y) > 4 || !free(nx, ny) || (p.x === nx && p.y === ny) || (p.x === o.x && p.y === o.y) || (p.path && p.path.some(q => q.x === nx && q.y === ny))) { o.spr.setFrame(DIRS.indexOf(dir) * 4); continue; }
      o.lift(); o.x = nx; o.y = ny; o.place(); o.busy = 1; o.spr.play(`${o.key}_walk_${dir}`);
      sc.tweens.add({ targets: o.spr, x: nx * T + 8, y: ny * T + 15, duration: 480, onUpdate: () => o.spr.active && o.spr.setDepth(o.spr.y), onComplete: () => { o.busy = 0; if (!o.spr.active) return; o.spr.stop(); o.spr.setFrame(DIRS.indexOf(dir) * 4); } });
    }
  } });
}
function folkTalk(sc, id) {
  const i = +id.split('_').pop(), o = (sc.folk || []).find(f => f.i === i); if (!o) return;
  const p = sc.p; o.spr.setFrame(DIRS.indexOf(p.x < o.x ? 'left' : p.x > o.x ? 'right' : p.y < o.y ? 'up' : 'down') * 4);
  o.talking = 1; S.town.talked = S.town.talked || {};
  const k = sc.scene.key + o.name, n = S.town.talked[k] || 0; S.town.talked[k] = n + 1;
  Talk.say([{ who: 'trainer', name: o.name, img: trainerPic(o.kind, 0), t: o.lines[n % o.lines.length] }], () => { o.talking = 0; });
}
