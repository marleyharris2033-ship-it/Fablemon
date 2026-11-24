/* ============================================================ Art loaded per area (23 Nov 2026)
   The big town and indoor pictures used to be loaded at start, every one of them. Now the start-up loader only notes
   down how to load each of them (LAZY_REC), and each area loads what it uses just before it starts (SCENE_TEX, from
   src/scene_tex.json: recorded by running every area in a test). Anything an area asks for that isn't here yet is
   fetched on the spot, with an invisible stand-in for that moment. After each load the usual high-detail swap runs
   (hdWorldSwap), which only touches pictures that haven't been swapped yet. */
const LAZY_KEYS = new Set(['town', 'ewb', 'gh', 'ewh', 'br', 'hm', 'qd', 'cove', 'sea', 'bh', 'bog', 'houses', 'gym_bh', 'gym_qd', 'gym_br', 'gym_hm',
  'room_0', 'room_1', 'room_2', 'room_3', 'furn', 'int_coop', 'int_barn', 'lv', 'an_cow', 'an_goat', 'an_sheep', 'an_hen', 'an_duck', 'an_calf', 'an_chick', 'an_lamb', 'an_kid', 'an_duckling']);
const lazyGroup = key => { const k = String(key).replace(/__hd$/, ''); return LAZY_KEYS.has(k) ? k : null; };
let LAZY_REC = {};   // group -> [[method, args]] as the start-up loader was asked
const SCENE_TEX = ASSET.sceneTex || {};
const LAZY_ORIG = {};   // each loader's own image/atlas/spritesheet (Phaser puts them on every loader it makes)
(function () {
  const FTM = Phaser.Loader.FileTypesManager, inst0 = FTM.install;
  FTM.install = function (loader) {
    inst0.call(this, loader);
    for (const m of ['image', 'atlas', 'spritesheet']) {
      const f0 = loader[m]; if (!f0 || f0._lazy) continue; LAZY_ORIG[m] = LAZY_ORIG[m] || f0;
      const w = function (key, ...rest) {
        const g = typeof key === 'string' && !window.LAZY_OFF && this.scene && this.scene.sys.settings.key === 'boot' && lazyGroup(key);
        if (g) { (LAZY_REC[g] = LAZY_REC[g] || []).push([m, key, rest]); return this; }
        return f0.call(this, key, ...rest);
      }; w._lazy = 1; loader[m] = w;
    }
  };
})();
const lazyHere = (sc, g) => sc.textures.exists(g) && !sc.textures.exists(g + '__hd');   // loaded and swapped
// queue a group on a scene's loader; false if there's nothing to do
function lazyQueue(sc, g) {
  const rec = LAZY_REC[g]; if (!rec || lazyHere(sc, g)) return false;
  let any = false;
  for (const [m, key, rest] of rec) if (!sc.textures.exists(key)) { sc.load[m].call(sc.load, key, ...rest); any = true; }
  return any;
}
// in a scene: load these groups now, then run cb
const LAZY_WAIT = {};
function lazyFetch(sc, groups, cb) {
  const want = groups.filter(g => LAZY_REC[g] && !lazyHere(sc, g)); if (!want.length) { cb && cb(); return; }
  const tag = want.join(','); if (LAZY_WAIT[tag]) { LAZY_WAIT[tag].push(cb); return; } LAZY_WAIT[tag] = [cb];
  let n = 0; for (const g of want) if (lazyQueue(sc, g)) n++;
  const done = () => { const cbs = LAZY_WAIT[tag] || []; delete LAZY_WAIT[tag]; try { hdWorldSwap(sc); } catch (e) { console.warn('lazy swap', e); } for (const f of cbs) try { f && f(); } catch (e) { console.warn('lazy', e); } };
  if (!n) return done();
  sc.load.once('complete', done); sc.load.start();
}
// before each area starts: the groups it uses (and the farm's, for the start-up scene)
const _lazyWP = World.prototype.preload;
World.prototype.preload = function () {
  _lazyWP.call(this);
  if (window.LAZY_OFF) return;
  let n = 0; for (const g0 of SCENE_TEX[this.scene.key] || []) { const g = /^room_/.test(g0) ? 'room_' + ((S && S.house) || 0) : g0; if (lazyQueue(this, g)) n++; }
  if (n) this.load.once('complete', () => { try { hdWorldSwap(this); } catch (e) { console.warn('lazy swap', e); } });
};
// a picture asked for from a group that isn't here yet: an invisible stand-in, swapped for the real one when it lands
(function () {
  const F = Phaser.GameObjects.GameObjectFactory.prototype;
  for (const m of ['image', 'sprite']) {
    const f0 = F[m];
    F[m] = function (x, y, key, frame, ...rest) {
      const sc = this.scene, g = typeof key === 'string' && lazyGroup(key);
      if (g && LAZY_REC[g] && !lazyHere(sc, g)) {
        if (!sc.textures.exists('__lazywait')) { const c = document.createElement('canvas'); c.width = c.height = 1; sc.textures.addCanvas('__lazywait', c); }
        const o = f0.call(this, x, y, '__lazywait', undefined, ...rest);
        lazyFetch(sc, [g], () => { if (o.active && sc.textures.exists(key)) o.setTexture(key, frame); });
        return o;
      }
      return f0.call(this, x, y, key, frame, ...rest);
    };
  }
})();
// a new game (bootGame) starts over with a fresh loader, so the notes start over too
const _lazyBoot = bootGame;
bootGame = async function (...a) { LAZY_REC = {}; for (const k in MON_LOADING) delete MON_LOADING[k]; for (const k in LAZY_WAIT) delete LAZY_WAIT[k]; return _lazyBoot.apply(this, a); };
