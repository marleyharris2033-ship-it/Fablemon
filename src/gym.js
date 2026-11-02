/* ============================================================ Brookholt Lock House (Delphine's gym)
   Opens once both Brookholt repairs are done; Delphine then waits inside on her platform.
   The room is one painted picture; WALK lists the tiles you can stand on (21 x 28 tiles). */
const GYM_W = 21, GYM_H = 28, GYM_BOSS = { x: 10, y: 4 }, GYM_EXIT = { scene: 'brookholt', x: 36, y: 11, dir: 'down' };
const GYM_WALK = (() => {
  const s = new Set(), r = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.add(x + ',' + y); };
  r(3, 5, 6, 5); r(14, 5, 17, 5);   // either side of the dais (the steps up to Delphine are hers)
  r(3, 6, 17, 10); r(1, 8, 19, 10);                     // the main floor and the lantern alcoves
  r(9, 11, 11, 24);                                     // the boardwalk between the pools
  r(7, 25, 13, 27);                                     // the entrance
  return s;
})();
const lockHouseOpen = () => bhRepairs() >= 2 || !!(S.crests && S.crests.brook);
class BhGym extends World {
  constructor() { super('bhgym'); }
  create() {
    this.initWorld(GYM_W, GYM_H);
    this.add.rectangle(-300, -300, GYM_W * T + 600, GYM_H * T + 600, 0x0c0a08).setOrigin(0).setDepth(-20);
    this.add.image(0, 0, 'gym_bh').setOrigin(0).setScale(.5).setDepth(-10);
    // lantern glow
    for (const [x, y] of [[4.6, 9], [17.5, 9], [7.4, 2.5], [13.3, 2.5], [7.4, 24], [13.6, 24]]) {
      const g = this.add.circle(x * T, y * T, 14, 0xffd27a, .12).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 10);
      this.tweens.add({ targets: g, alpha: .05, yoyo: true, repeat: -1, duration: 1300 + Math.random() * 600 });
    }
    for (let r = 0; r < 4; r++) { const k = `delphine_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('tr_delphine', { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
    this.boss = this.add.sprite(GYM_BOSS.x * T + 8, GYM_BOSS.y * T + 15, 'tr_delphine', 0).setOrigin(.5, 1).setDepth(GYM_BOSS.y * T + 15);
    this.shadow(this.boss, 12, 5);
    const sp = S.spawn && S.spawn.scene === 'bhgym' ? S.spawn : { x: 10, y: 26, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(-T * 2, -T, (GYM_W + 4) * T, (GYM_H + 2) * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); Sound.theme('route'); updateHUD(); renderHotbar(); FX.set(S.weather, true); this.fadeIn();
    if (!S.flags.gymSeen) { S.flags.gymSeen = 1; setTimeout(() => toast("The Warden's Lock House. Delphine waits at the far end.", 3000), 600); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  passable(x, y) { return GYM_WALK.has(x + ',' + y) && !(x === GYM_BOSS.x && y === GYM_BOSS.y); }
  bossNear(x, y) { return x === GYM_BOSS.x && y === GYM_BOSS.y + 2; }   // you challenge her from the foot of the steps
  talk() { this.face(GYM_BOSS.x, GYM_BOSS.y); this.boss.setFrame(0); this.p.busy = .4; delphine(this); }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir];
    if (p.x + dx === GYM_BOSS.x && (p.y + dy === GYM_BOSS.y || p.y + dy === GYM_BOSS.y + 1)) return this.talk();
    if (eatHeld()) p.busy = .4;
  }
  act() { this.talk(); }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    if (this.boss.getBounds().contains(wx, wy) || (x === GYM_BOSS.x && y === GYM_BOSS.y)) {
      if (this.bossNear(p.x, p.y) && !p.moving) return this.talk();
      const path = this.path((a, b) => this.bossNear(a, b)); if (path) { p.path = path; p.pending = { tr: 1 }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
  arrived() { const p = this.p; if (!p.path.length && p.pending) { p.pending = null; this.talk(); } this.arriveHook(p.x, p.y); }
  arriveHook(x, y) { if (y >= GYM_H - 1) { Sound.play('door'); travel(this, GYM_EXIT.scene, { x: GYM_EXIT.x, y: GYM_EXIT.y, dir: GYM_EXIT.dir }); } }
}
