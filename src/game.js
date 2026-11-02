'use strict';
/* =====================================================================
   Fablemon: Wild Roots — farm prototype (polish pass)
   Rules live in plain modules (inventory, map, time, weather); Phaser only draws.
   ===================================================================== */
const $ = id => document.getElementById(id);
const DPR = () => Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
// keep the canvas at full device resolution when the window or phone orientation changes
addEventListener('resize', () => { if (typeof game !== 'undefined' && game && game.scale) { game.scale.resize(Math.round(innerWidth * DPR()), Math.round(innerHeight * DPR())); game.scale.setZoom(1 / DPR()); } });
const W = 80, H = 60, T = 16;
const SAVE_KEY = 'fablemon_wildroots_v1';
const DIRS = ['down', 'left', 'right', 'up'];
const DV = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOOR = { x: 52, y: 13 }, MAILBOX = { x: 56, y: 13 }, BIN = { x: 47, y: 12 };
// farmhouse upgrades: cost, and the room size inside [width, height]
const HOUSE_COST = [0, 5000, 20000, 50000];
const HOUSE_NAMES = ['Cottage', 'Family Cottage', 'Farmhouse', 'Grand Farmhouse'];
const HOUSE_ROOM = [[10, 8], [13, 9], [16, 10], [18, 11]];
const houseFrame = st => st ? ASSET.housesJson['house' + st] : { w: 80, h: 61, door: 40 };
// [x0, y0, x1, y1, centre-x in pixels] of the house on the farm
function houseFoot(st = S.house || 0, door = DOOR) {
  const f = houseFrame(st), cx = door.x * T + 8 - (f.door - f.w / 2);
  const rows = Math.max(3, Math.ceil(f.h * .5 / T));
  return [Math.floor((cx - f.w / 2 + 4) / T), door.y - rows, Math.floor((cx + f.w / 2 - 5) / T), door.y - 1, cx];
}
// where the house door, mailbox and shipping bin are (saved, so they can be moved)
function applyLayout() {
  const L = S.layout || {};
  Object.assign(DOOR, L.door || { x: 52, y: 13 }); Object.assign(MAILBOX, L.mail || { x: 56, y: 13 }); Object.assign(BIN, L.bin || { x: 47, y: 12 });
}
const FILL_ROW = 4;            // terrain.png row with plain fills
const CAN_MAX = 40;

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };

/* ---------------------------------------------------------------- items */
const ITEMS = {
  axe: { name: 'Axe', stack: 1, tool: 'axe', desc: 'Chops trees, stumps and bushes.' },
  pickaxe: { name: 'Pickaxe', stack: 1, tool: 'pickaxe', desc: 'Breaks rocks and boulders, and clears paths and soil.' },
  hoe: { name: 'Hoe', stack: 1, tool: 'hoe', desc: 'Tills grass into soil for planting.' },
  can: { name: 'Watering Can', stack: 1, tool: 'can', desc: 'Waters soil. Holds 40 uses; refill it at the pond.' },
  scythe: { name: 'Scythe', stack: 1, tool: 'scythe', desc: 'Cuts weeds for fiber. Uses no energy.' },
  wood: { name: 'Wood', stack: 999, sell: 2, desc: 'From trees, stumps and bushes.' },
  stone: { name: 'Stone', stack: 999, sell: 2, desc: 'From rocks and boulders.' },
  fiber: { name: 'Fiber', stack: 999, sell: 1, desc: 'From weeds and bushes.' },
  fence: { name: 'Wood Fence', stack: 999, place: 'fence', desc: 'Place it on the farm. Hit it with an axe to pick it up.' },
  gate: { name: 'Gate', stack: 999, place: 'gate', desc: 'A fence you can open. Tap it, or face it and press the action button.' },
  path: { name: 'Cobble Path', stack: 999, place: 'path', path: 'cobble', desc: 'Lay it on grass. The edges blend into the grass. You walk faster on paths.' },
  dirt_path: { name: 'Dirt Path', stack: 999, place: 'path', path: 'dirt', desc: 'A packed-earth track that blends into the grass, like the farm road. You walk faster on paths.' },
  chest: { name: 'Chest', stack: 99, place: 'obj', obj: 'chest', desc: 'Stores 18 stacks of items. Tap it to open. Hit it with an axe to pick it up (empty it first).' },
  sprinkler: { name: 'Sprinkler', stack: 99, place: 'obj', obj: 'sprinkler', desc: 'Waters the 8 soil tiles all around it every morning, corners included.' },
  scarecrow: { name: 'Scarecrow', stack: 99, place: 'obj', obj: 'scarecrow', desc: 'A cheerful straw friend for your fields. Decoration for now.' },
  lantern: { name: 'Lantern Post', stack: 99, place: 'obj', obj: 'lantern', desc: 'Glows warmly after dark.' },
  barrel: { name: 'Barrel', stack: 99, place: 'obj', obj: 'barrel', desc: 'Decoration.' },
  crate: { name: 'Crate', stack: 99, place: 'obj', obj: 'crate', desc: 'Decoration.' },
  bench: { name: 'Garden Bench', stack: 99, place: 'obj', obj: 'bench', desc: 'A wooden bench, 3 tiles wide.' },
  planter: { name: 'Planter Box', stack: 99, place: 'obj', obj: 'planter', desc: 'A stone trough of flowers, 3 tiles wide.' },
  flowerbed: { name: 'Flower Bed', stack: 99, place: 'obj', obj: 'flowerbed', desc: 'A round stone bed of flowers, 3 tiles wide.' },
  hedge: { name: 'Hedge', stack: 99, place: 'obj', obj: 'hedge', desc: 'A neatly trimmed hedge, 2 tiles wide.' },
  bush: { name: 'Garden Bush', stack: 99, place: 'obj', obj: 'bush', desc: 'A round little shrub.' },
  wildflowers: { name: 'Wildflowers', stack: 99, place: 'obj', obj: 'wildflowers', desc: 'A patch of wildflowers. You can walk around it.' },
  rockery: { name: 'Garden Rocks', stack: 99, place: 'obj', obj: 'rockery', desc: 'Decorative stones.' },
  lamp: { name: 'Street Lamp', stack: 99, place: 'obj', obj: 'lamp', desc: 'A tall iron lamp that lights up after dark.' },
  wall: { name: 'Stone Wall', stack: 99, place: 'obj', obj: 'wall', desc: 'A low stone wall, 4 tiles wide.' },
  pillar: { name: 'Stone Pillar', stack: 99, place: 'obj', obj: 'pillar', desc: 'A stone gatepost. Good for wall ends.' },
  farmstand: { name: 'Farm Stand', stack: 99, place: 'obj', obj: 'farmstand', desc: 'A striped market stall with crates of produce, 3 tiles wide. Decoration for now.' },
  root_charm: { name: 'Root Charm', stack: 99, desc: 'Throw it at a weakened wild Fablemon in battle and it may choose to come with you.', sell: 15 },
  mine: { name: 'Mine', stack: 99, place: 'obj', obj: 'mine', desc: 'A small quarry, 3 tiles wide. Slow going: 4 pickaxe hits per stone. A Stone Fablemon with a job area covering it will mine it for you, faster once evolved. Pick it up with the axe.' },
  well: { name: 'Well', stack: 99, place: 'obj', obj: 'well', desc: 'Face it with your watering can and use it to fill the can. Saves a trip to the pond.' },
  compost: { name: 'Compost Bin', stack: 99, place: 'obj', obj: 'compost', desc: 'Put in 10 fiber. Three days later it gives 3 Fertiliser.' },
  beehive: { name: 'Beehive', stack: 99, place: 'obj', obj: 'beehive', desc: 'Makes honey every 3 days. Flowers nearby (wildflowers, flower beds, planters) make it produce 2.' },
  trough: { name: 'Feeding Trough', stack: 99, place: 'obj', obj: 'trough', desc: 'Fill it with crops. Each night, every Fablemon out on your farm eats one and grows closer to you. 2 tiles wide.' },
  fertiliser: { name: 'Fertiliser', stack: 999, fert: true, sell: 5, desc: 'Use it on tilled soil. The next crop there grows a day faster.' },
  honey: { name: 'Honey', stack: 99, sell: 80, heal: 40, desc: 'Sweet golden honey. Sells for 80g. In battle, or from a Fablemon\'s Info page, it restores 40% of a Fablemon\'s HP.' },
  berry: { name: 'Hearthberry', stack: 99, heal: 25, desc: 'A sweet berry. In battle, or from a Fablemon\'s Info page, it restores 25% of a Fablemon\'s HP.', sell: 10 },
  pot: { name: 'Cooking Pot', stack: 99, place: 'obj', obj: 'pot', desc: 'A pot over a little fire. Tap it to cook meals from your crops. Each meal uses 1 wood for the fire.' },
  roast_turnip: { name: 'Roasted Turnip', stack: 99, eat: 45, sell: 105, desc: 'Crispy and golden. Restores 45 energy.' },
  veg_soup: { name: 'Garden Soup', stack: 99, eat: 100, sell: 280, desc: 'A warming bowl of turnip, carrot and potato. Restores 100 energy.' },
  glazed_carrots: { name: 'Honey Carrots', stack: 99, eat: 80, sell: 280, desc: 'Sweet, sticky and shiny. Restores 80 energy.' },
  jacket_potato: { name: 'Jacket Potato', stack: 99, eat: 70, sell: 135, desc: 'Fluffy inside, crisp outside. Restores 70 energy.' },
  tomato_salad: { name: 'Tomato Salad', stack: 99, eat: 60, sell: 290, desc: 'Fresh summer tomatoes. Restores 60 energy.' },
  corn_chowder: { name: 'Corn Chowder', stack: 99, eat: 140, sell: 630, desc: 'Creamy and filling. Restores 140 energy.' },
  pumpkin_pie: { name: 'Pumpkin Pie', stack: 99, eat: 220, sell: 650, desc: 'A proper autumn treat. Restores 220 energy.' },
  berry_crumble: { name: 'Berry Crumble', stack: 99, heal: 50, sell: 60, desc: 'A Fablemon favourite. In battle, or from a Fablemon\'s Info page, it restores half a Fablemon\'s HP.' },
  feed: { name: 'Fablemon Feed', stack: 999, sell: 5, desc: "Hattie's own mix of grains and dried berries. Put it in a Feeding Trough like a crop." },
  sturdy_charm: { name: 'Sturdy Charm', stack: 99, sell: 40, desc: "Gideon's iron-bound charm. Throw it in battle: 1.5× more likely to catch than a Root Charm." },
  hearty_stew: { name: 'Hearty Stew', stack: 99, eat: 170, sell: 430, desc: "Barney's recipe. Potatoes, carrots and turnip, slow-cooked. Restores 170 energy." },
  corn_fritters: { name: 'Corn Fritters', stack: 99, eat: 110, sell: 300, desc: "Barney's recipe. Crispy and golden. Restores 110 energy." },
  tavern_pie: { name: 'Tavern Pie', stack: 99, eat: 280, sell: 820, desc: "Barney's famous pie. Restores 280 energy." },
  mon_treat: { name: 'Fablemon Feast', stack: 99, heal: 100, sell: 150, desc: 'Berries baked in honey. Fully heals a Fablemon in battle or from its Info page.' },
  oak_sapling: { name: 'Oak Sapling', stack: 99, place: 'obj', obj: 'sap_oak', desc: 'Plant it on grass. Grows into an oak tree in 7 days.' },
  pine_sapling: { name: 'Pine Sapling', stack: 99, place: 'obj', obj: 'sap_pine', desc: 'Plant it on grass. Grows into a pine tree in 7 days.' },
  apple_sapling: { name: 'Apple Sapling', stack: 99, place: 'obj', obj: 'sap_apple', desc: 'Plant it on grass. Grows into an apple tree in 7 days.' },
  turnip_seeds: { name: 'Turnip Seeds', stack: 999, seed: 'turnip', sell: 10, desc: 'Spring. Plant in tilled soil and water daily. Ready in 4 days.' },
  turnip: { name: 'Turnip', stack: 999, sell: 45, desc: 'A crisp spring turnip. Sells for 45g.' },
  carrot_seeds: { name: 'Carrot Seeds', stack: 999, seed: 'carrot', sell: 15, desc: 'Spring. Ready in 5 days.' },
  carrot: { name: 'Carrot', stack: 999, sell: 80, desc: 'Sweet and crunchy. Sells for 80g.' },
  potato_seeds: { name: 'Potato Seeds', stack: 999, seed: 'potato', sell: 25, desc: 'Spring. Ready in 6 days.' },
  potato: { name: 'Potato', stack: 999, sell: 110, desc: 'A hearty spud. Sells for 110g.' },
  tomato_seeds: { name: 'Tomato Seeds', stack: 999, seed: 'tomato', sell: 25, desc: 'Summer. Ready in 7 days.' },
  tomato: { name: 'Tomato', stack: 999, sell: 125, desc: 'Sun-ripened and juicy. Sells for 125g.' },
  corn_seeds: { name: 'Corn Seeds', stack: 999, seed: 'corn', sell: 40, desc: 'Summer and fall. Ready in 10 days.' },
  corn: { name: 'Corn', stack: 999, sell: 220, desc: 'Golden sweetcorn. Sells for 220g.' },
  pumpkin_seeds: { name: 'Pumpkin Seeds', stack: 999, seed: 'pumpkin', sell: 50, desc: 'Fall. Ready in 12 days.' },
  pumpkin: { name: 'Pumpkin', stack: 999, sell: 380, desc: 'A proper prize pumpkin. Sells for 380g.' },
};
const needOf = r => (r.out && S.town && S.town.done.carpenter && r.need.wood) ? { ...r.need, wood: Math.max(1, Math.ceil(r.need.wood * .75)) } : r.need;
const goldCut = g => S.town && S.town.done.carpenter ? Math.round(g * .85 / 10) * 10 : g;
const RECIPES = [
  { out: 'fence', n: 1, need: { wood: 2 } },
  { out: 'gate', n: 1, need: { wood: 10 } },
  { out: 'path', n: 1, need: { stone: 1 } },
  { out: 'dirt_path', n: 2, need: { fiber: 1 } },
  { out: 'chest', n: 1, need: { wood: 40 } },
  { out: 'sprinkler', n: 1, need: { stone: 25, wood: 10 } },
  { out: 'scarecrow', n: 1, need: { wood: 15, fiber: 15 } },
  { out: 'lantern', n: 1, need: { wood: 8, stone: 4 } },
  { out: 'barrel', n: 1, need: { wood: 10 } },
  { out: 'crate', n: 1, need: { wood: 6 } },
  { out: 'bench', n: 1, need: { wood: 20 } },
  { out: 'planter', n: 1, need: { stone: 15, fiber: 5 } },
  { out: 'flowerbed', n: 1, need: { stone: 10, fiber: 10 } },
  { out: 'hedge', n: 1, need: { fiber: 10, wood: 4 } },
  { out: 'bush', n: 1, need: { fiber: 8 } },
  { out: 'wildflowers', n: 1, need: { fiber: 3 } },
  { out: 'rockery', n: 1, need: { stone: 5 } },
  { out: 'lamp', n: 1, need: { stone: 10, wood: 4 } },
  { out: 'wall', n: 1, need: { stone: 20 } },
  { out: 'pillar', n: 1, need: { stone: 6 } },
  { out: 'farmstand', n: 1, need: { wood: 30, fiber: 10 } },
  { out: 'pot', n: 1, need: { stone: 20, wood: 10 } },
  { out: 'mine', n: 1, need: { stone: 50, wood: 40 } },
  { out: 'well', n: 1, need: { stone: 60, wood: 20 } },
  { out: 'compost', n: 1, need: { wood: 20 } },
  { out: 'beehive', n: 1, need: { wood: 15, fiber: 20 } },
  { out: 'trough', n: 1, need: { wood: 25 } },
  { out: 'root_charm', n: 1, need: { wood: 3, fiber: 3 } },
  { out: 'oak_sapling', n: 1, need: { wood: 5, fiber: 5 } },
  { out: 'pine_sapling', n: 1, need: { wood: 5, fiber: 5 } },
  { out: 'apple_sapling', n: 1, need: { wood: 10, fiber: 10 } },
];
const crop = (id, days, seasons) => ({ days, item: id, seasons, frames: [1, 2, 3, 4].map(n => `${id}_stage${n}`) });
const CROPS = { turnip: crop('turnip', 4, [0]), carrot: crop('carrot', 5, [0]), potato: crop('potato', 6, [0]), tomato: crop('tomato', 7, [1]), corn: crop('corn', 10, [1, 2]), pumpkin: crop('pumpkin', 12, [2]) };
const cropDays = c => c.need || CROPS[c.type].days;
function cropStage(c) { const d = cropDays(c); if (c.g >= d) return 3; return Math.min(2, Math.floor(c.g * 3 / d)); }
function cropRipe(c) { return c && !c.dead && c.g >= cropDays(c); }

/* ------------------------------------------------------------ inventory
   Fixed slots. add() tops up stacks, then fills empties, returns leftovers.
   The hotbar is a view of slots 0..11. */
class Inventory {
  constructor(size) { this.slots = Array.from({ length: size }, () => null); this.listeners = []; }
  onChange(fn) { this.listeners.push(fn); }
  emit() { this.listeners.forEach(f => f()); }
  max(id) { return ITEMS[id].stack; }
  add(id, n = 1) {
    let left = n;
    for (const s of this.slots) if (s && s.id === id && s.n < this.max(id) && left > 0) { const k = Math.min(left, this.max(id) - s.n); s.n += k; left -= k; }
    for (let i = 0; i < this.slots.length && left > 0; i++) if (!this.slots[i]) { const k = Math.min(left, this.max(id)); this.slots[i] = { id, n: k }; left -= k; }
    if (left !== n) this.emit();
    return left;
  }
  count(id) { return this.slots.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0); }
  has(id, n = 1) { return this.count(id) >= n; }
  remove(id, n = 1) {
    if (!this.has(id, n)) return false;
    for (let i = this.slots.length - 1; i >= 0 && n > 0; i--) { const s = this.slots[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) this.slots[i] = null; } }
    this.emit(); return true;
  }
  removeAt(i, n = 1) { const s = this.slots[i]; if (!s) return; s.n -= n; if (s.n <= 0) this.slots[i] = null; this.emit(); }
  swap(a, b) {
    if (a === b) return;
    const A = this.slots[a], B = this.slots[b];
    if (A && B && A.id === B.id) { const k = Math.min(A.n, this.max(B.id) - B.n); B.n += k; A.n -= k; if (!A.n) this.slots[a] = null; }
    else { this.slots[a] = B; this.slots[b] = A; }
    this.emit();
  }
  find(id) { return this.slots.findIndex(s => s && s.id === id); }
  canCraft(r) { return Object.entries(needOf(r)).every(([k, v]) => this.has(k, v)); }
  craft(r) {
    if (!this.canCraft(r)) return false;
    const snapshot = JSON.stringify(this.slots);
    Object.entries(needOf(r)).forEach(([k, v]) => this.remove(k, v));
    const left = this.add(r.out, r.n);
    if (left) { this.slots = JSON.parse(snapshot); this.emit(); return 'full'; }
    return true;
  }
  serialize() { return this.slots.map(s => s ? [s.id, s.n] : 0); }
  load(arr) { this.slots = arr.map(s => s ? { id: s[0], n: s[1] } : null); while (this.slots.length < 36) this.slots.push(null); this.emit(); }
}

/* --------------------------------------------------------------- map */
const DEBRIS = {
  weeds: { frame: 'tall_grass', hp: 1, tool: 'scythe', sfx: 'rustle', drop: () => ({ fiber: Math.random() < .3 ? 2 : 1 }) },
  pebble: { frame: 'rock_flat', hp: 1, tool: 'pickaxe', sfx: 'pick', drop: () => ({ stone: 1 }) },
  rocks: { frame: 'rock_pair', hp: 2, tool: 'pickaxe', sfx: 'pick', drop: () => ({ stone: 2 }) },
  boulder: { frame: 'rock_large', hp: 6, tool: 'pickaxe', sfx: 'pick', drop: () => ({ stone: 8 }) },
  bush: { frame: 'bush_round', hp: 3, tool: 'axe', sfx: 'chop', drop: () => ({ fiber: 2, wood: 1 }) },
  bigbush: { frame: 'bush_wide', hp: 4, tool: 'axe', sfx: 'chop', wide: true, drop: () => ({ fiber: 3, wood: 2 }) },
  stump: { frame: 'stump', hp: 4, tool: 'axe', sfx: 'chop', drop: () => ({ wood: 4 }) },
  oak: { frame: 'tree_oak', hp: 8, tool: 'axe', sfx: 'chop', tree: true, drop: () => ({ wood: 10 }) },
  pine: { frame: 'tree_pine', hp: 8, tool: 'axe', sfx: 'chop', tree: true, drop: () => ({ wood: 10 }) },
  apple: { frame: 'tree_apple', hp: 8, tool: 'axe', sfx: 'chop', tree: true, drop: () => ({ wood: 8 }) },
};

function buildFarm() {
  const R = mulberry(20261030);
  const V = Array.from({ length: H + 1 }, () => new Uint8Array(W + 1));
  const setRect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y <= H && x >= 0 && x <= W) V[y][x] = v; };
  const ell = (cx, cy, rx, ry, v, wob = 0) => { for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) { const a = Math.atan2(y - cy, x - cx); const r = 1 + wob * Math.sin(a * 3 + cx) + wob * .6 * Math.cos(a * 5 + cy); if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= r * r) V[y][x] = v; } };
  setRect(50, 13, 54, 15, 1); setRect(51, 15, 53, 21, 1); setRect(51, 19, 80, 21, 1); setRect(38, 54, 41, 60, 1);
  ell(17, 44, 9.5, 6.5, 2, .08); ell(68, 9, 4.2, 3, 2, .06); ell(30, 50, 2.6, 2, 2, .05);

  const tiles = new Int32Array(W * H), blocked = new Uint8Array(W * H), dirtish = new Uint8Array(W * H), waterish = new Uint8Array(W * H);
  const water = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = [V[y][x], V[y][x + 1], V[y + 1][x + 1], V[y + 1][x]];
    const i = y * W + x;
    if (c.every(v => v === 0)) { const h = hash(x, y); tiles[i] = FILL_ROW * 16 + (h < .6 ? 0 : h < .8 ? 1 : 2); continue; }
    const low = Math.max(...c), row = low === 2 ? 1 : 0;
    const bits = (c[0] === 0) * 8 + (c[1] === 0) * 4 + (c[2] === 0) * 2 + (c[3] === 0);
    tiles[i] = row * 16 + bits;
    if (low === 2) { water.push(i); waterish[i] = 1; if (c.filter(v => v === 2).length >= 2) blocked[i] = 1; }
    else dirtish[i] = 1;
  }
  const border = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    const eastGap = x >= W - 7 && y >= 18 && y <= 22, southGap = y >= H - 6 && x >= 37 && x <= 42;
    if (eastGap || southGap) continue;
    if (d < 3 || (d < 5 && hash(x * 3, y * 7) < .35)) {
      blocked[y * W + x] = 1;
      if ((x + y) % 2 === 0 || d >= 3) border.push({ x, y, kind: hash(x, y * 3) < .45 ? 'pine' : 'oak' });
    }
  }
  const hf = houseFoot();
  if (BIN.y >= hf[1] && BIN.y <= hf[3] && BIN.x + 1 >= hf[0] && BIN.x <= hf[2]) { BIN.x = hf[0] - 3; S.layout = { ...(S.layout || {}), bin: { x: BIN.x, y: BIN.y } }; }
  for (let y = hf[1]; y <= hf[3]; y++) for (let x = hf[0]; x <= hf[2]; x++) blocked[y * W + x] = 1;
  blocked[MAILBOX.y * W + MAILBOX.x] = 1;
  blocked[BIN.y * W + BIN.x] = 1; blocked[BIN.y * W + BIN.x + 1] = 1;

  const G = 9, lat = [];
  for (let j = 0; j <= Math.ceil(H / G) + 1; j++) { lat.push([]); for (let i = 0; i <= Math.ceil(W / G) + 1; i++) lat[j].push(R()); }
  const noise = (x, y) => { const gx = x / G, gy = y / G, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j, s = t => t * t * (3 - 2 * t); const a = lat[j][i], b = lat[j][i + 1], c = lat[j + 1][i], d = lat[j + 1][i + 1]; return (a * (1 - s(fx)) + b * s(fx)) * (1 - s(fy)) + (c * (1 - s(fx)) + d * s(fx)) * s(fy); };

  const debris = [], occ = new Int32Array(W * H).fill(-1);
  const free = (x, y) => x > 2 && y > 2 && x < W - 3 && y < H - 3 && !blocked[y * W + x] && !dirtish[y * W + x] && !waterish[y * W + x] && occ[y * W + x] < 0;
  const nearHouse = (x, y) => Math.hypot(x - 52, (y - 14) * 1.2) < 7.5;
  const add = (kind, x, y) => { const id = debris.length; debris.push({ id, kind, x, y, hp: DEBRIS[kind].hp }); occ[y * W + x] = id; if (DEBRIS[kind].wide) occ[y * W + x + 1] = id; };
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    if (!free(x, y) || nearHouse(x, y)) continue;
    const n = noise(x, y), r = R();
    if (n > .6) {
      let crowded = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const o = occ[(y + dy) * W + x + dx]; if (o >= 0 && DEBRIS[debris[o].kind].tree) crowded = true; }
      if (!crowded && r < .5) { add(r < .2 ? 'pine' : r < .47 ? 'oak' : 'apple', x, y); continue; }
      if (r < .8) { add('weeds', x, y); continue; }
      continue;
    }
    if (r < .13) add('weeds', x, y);
    else if (r < .175) add('pebble', x, y);
    else if (r < .195) add('rocks', x, y);
    else if (r < .202) add('boulder', x, y);
    else if (r < .216) add('bush', x, y);
    else if (r < .221 && free(x + 1, y)) add('bigbush', x, y);
    else if (r < .231) add('stump', x, y);
    else if (r < .243) add(R() < .5 ? 'oak' : 'pine', x, y);
  }
  return { tiles, blocked, water, border, debris, occ, dirtish, waterish, V };
}

/* ----------------------------------------------------------- icons */
const ICONS = {}, ICON_CANVAS = {};
// world sprites for placed objects: [texture, frame or null, from icon?]
const OBJ_ART = {
  chest: ['ic', 'chest'], sprinkler: ['ic', 'sprinkler'], scarecrow: ['ic', 'scarecrow'], lantern: ['objects', 'lantern_post'], barrel: ['objects', 'barrel'], crate: ['objects', 'crate'],
  bench: ['town', 'bench', 3], planter: ['town', 'planter', 3], flowerbed: ['town', 'flowerbed', 3], hedge: ['town', 'hedge', 2], bush: ['objects', 'bush_round'],
  wildflowers: ['objects', 'wildflowers'], rockery: ['objects', 'rock_pair'], lamp: ['town', 'lamp'], wall: ['town', 'wall_h', 4], pillar: ['town', 'wall_end'], farmstand: ['town', 'stall', 3],
  pot: ['cv', 'pot'], well: ['cv', 'well'], mine: ['cv', 'mine', 3], compost: ['cv', 'compost'], beehive: ['cv', 'beehive'], trough: ['cv', 'trough', 2],
  sap_oak: ['cv', 'sap_oak'], sap_pine: ['cv', 'sap_pine'], sap_apple: ['cv', 'sap_apple'],
};
const mineHits = () => [4, 3, 2, 1][(S.tools && S.tools.pickaxe) || 0];   // pickaxe swings per stone; Gideon's upgrades lower it
const MINE_TIME = [0, 40, 20, 10];   // seconds per stone from the mine, by evolution stage
const objReady = o => (o.t === 'compost' && o.n && S.day >= o.doneDay) || (o.t === 'beehive' && o.honey > 0) || (o.t === 'fishhut' && Object.values(o.fish || {}).some(Boolean));
const objW = it => it && it.place === 'obj' ? (OBJ_ART[it.obj][2] || 1) : 1;
const SAPLING_TREE = { sap_oak: 'oak', sap_pine: 'pine', sap_apple: 'apple' };
// little sapling sprites drawn in code
const SAP_CANVAS = {};
function makeFarmArt() {
  SAP_CANVAS.well = pixCanvas(18, 28, R => {
    R(4, 2, 1, 14, '#6b4426'); R(13, 2, 1, 14, '#6b4426'); R(2, 0, 14, 3, '#a8443a'); R(2, 0, 14, 1, '#c95a48'); R(3, 3, 12, 1, '#7a2e26');
    R(5, 5, 8, 1, '#8f5f34'); R(8, 6, 1, 4, '#c9b48a'); R(7, 10, 3, 3, '#8f5f34'); R(7, 10, 3, 1, '#b07a45');
    R(1, 15, 16, 12, '#8a8a82'); R(1, 15, 16, 2, '#b4b4aa'); R(2, 16, 14, 1, '#3a5f8e');
    for (const [x, y] of [[1, 19], [6, 19], [11, 19], [3, 23], [8, 23], [13, 23]]) R(x, y, 4, 3, '#a0a098');
    R(1, 18, 16, 1, '#6e6e66'); R(1, 22, 16, 1, '#6e6e66'); R(1, 26, 16, 1, '#5e5e56');
  });
  SAP_CANVAS.compost = pixCanvas(16, 16, R => {
    R(1, 3, 14, 12, '#8f5f34'); for (const x of [1, 5, 9, 13]) R(x, 3, 2, 12, '#b07a45'); R(1, 3, 14, 1, '#6b4426'); R(1, 14, 14, 1, '#5e3b20');
    R(2, 1, 12, 3, '#4e3a22'); R(3, 0, 4, 2, '#5a8a3a'); R(9, 1, 3, 1, '#6bb24a'); R(6, 1, 2, 1, '#7a5a32');
  });
  SAP_CANVAS.beehive = pixCanvas(16, 22, R => {
    R(3, 15, 2, 7, '#6b4426'); R(11, 15, 2, 7, '#6b4426'); R(1, 14, 14, 2, '#8f5f34');
    R(5, 1, 6, 2, '#d9a440'); R(3, 3, 10, 3, '#e8b84a'); R(2, 6, 12, 3, '#d9a440'); R(2, 9, 12, 3, '#e8b84a'); R(3, 12, 10, 2, '#c9922e');
    R(3, 5, 10, 1, '#b07a2a'); R(2, 8, 12, 1, '#b07a2a'); R(2, 11, 12, 1, '#b07a2a'); R(7, 11, 3, 3, '#3a2a1e');
  });
  SAP_CANVAS.mine = pixCanvas(48, 34, R => {
    R(2, 12, 44, 21, '#8a8578'); R(6, 6, 36, 8, '#8a8578'); R(12, 2, 24, 6, '#8a8578');
    R(4, 12, 10, 4, '#a8a396'); R(14, 4, 10, 4, '#a8a396'); R(30, 8, 10, 4, '#a8a396'); R(36, 18, 8, 4, '#a8a396');
    R(6, 22, 6, 4, '#6e6a60'); R(36, 26, 8, 4, '#6e6a60'); R(10, 9, 5, 3, '#6e6a60'); R(31, 3, 4, 3, '#6e6a60');
    R(4, 4, 3, 2, '#5aa64a'); R(38, 4, 4, 3, '#5aa64a'); R(2, 10, 3, 2, '#4e8f3a'); R(42, 11, 3, 2, '#4e8f3a');
    R(16, 14, 16, 19, '#1e1612'); R(18, 16, 12, 17, '#2a1e18');
    R(14, 12, 3, 21, '#8f5f34'); R(31, 12, 3, 21, '#8f5f34'); R(13, 11, 22, 3, '#b07a45'); R(13, 11, 22, 1, '#d39a5e');
    R(15, 14, 1, 19, '#6b4426'); R(32, 14, 1, 19, '#6b4426');
    R(20, 28, 9, 4, '#6b4426'); R(19, 26, 11, 3, '#5e5e66'); R(21, 24, 3, 2, '#a8a396'); R(25, 24, 3, 3, '#8a8578');
    R(20, 32, 2, 2, '#3a3a3e'); R(27, 32, 2, 2, '#3a3a3e');
  });
  SAP_CANVAS.pot = pixCanvas(18, 20, R => {
    R(2, 14, 14, 4, '#5e3b20'); R(4, 13, 3, 2, '#8f5f34'); R(11, 13, 3, 2, '#8f5f34');
    R(6, 15, 6, 3, '#f08a2a'); R(7, 14, 4, 2, '#ffd25a'); R(8, 13, 2, 1, '#fff3a0');
    R(2, 5, 14, 9, '#3a3a3e'); R(1, 6, 16, 6, '#3a3a3e'); R(3, 6, 4, 3, '#5a5a62'); R(1, 4, 16, 2, '#4a4a52');
    R(3, 3, 12, 2, '#c95a2a'); R(5, 3, 3, 1, '#e8a04a'); R(10, 3, 2, 1, '#8ab04a');
    R(6, 0, 1, 2, '#d8d8d8'); R(10, 1, 1, 2, '#d8d8d8');
  });
  SAP_CANVAS.trough = pixCanvas(32, 14, R => {
    R(2, 9, 2, 5, '#6b4426'); R(28, 9, 2, 5, '#6b4426'); R(0, 2, 32, 9, '#8f5f34'); R(0, 2, 32, 2, '#c99462'); R(2, 4, 28, 3, '#5e3b20');
    R(0, 7, 32, 1, '#6b4426'); for (const x of [8, 16, 24]) R(x, 4, 1, 7, '#6b4426');
  });
}
function makeSaplings() {
  makeFarmArt(); makeHearthArt(); makeBogCropArt();
  const leaf = { sap_oak: ['#4e8f3a', '#6bb24a'], sap_pine: ['#2f6b3a', '#3f8a4a'], sap_apple: ['#5a9a3a', '#7cc24a'] };
  for (const [k, [a, b]] of Object.entries(leaf)) SAP_CANVAS[k] = pixCanvas(12, 18, R => {
    R(5, 8, 2, 9, '#8f5f34'); R(3, 16, 6, 2, '#6b4426');
    if (k === 'sap_pine') { R(4, 1, 4, 3, b); R(3, 4, 6, 3, a); R(2, 7, 8, 3, b); }
    else { R(2, 2, 4, 4, a); R(6, 1, 4, 4, b); R(3, 5, 6, 4, b); if (k === 'sap_apple') { R(3, 3, 1, 1, '#d0443a'); R(8, 5, 1, 1, '#d0443a'); } }
  });
}
// icons for new items cut from the object atlas and terrain
function loadExtraIcons() {
  return Promise.all([loadImg(ASSET.objects), loadImg(ASSET.terrain), loadImg(ASSET.town), loadImg(ASSET.houses)]).then(([ob, te, tw, hs]) => {
    for (const [k, f] of Object.entries(ASSET.housesJson)) { const c = document.createElement('canvas'); c.width = f.w; c.height = f.h; c.getContext('2d').drawImage(hs, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); HOUSE_PIC[+k.slice(5)] = c.toDataURL(); }
    const mk = draw => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g); return c; };
    makeSaplings();
    for (const [id, it] of Object.entries(ITEMS)) {
      if (it.place !== 'obj' || ICONS[id]) continue;
      const [tex, fr] = OBJ_ART[it.obj];
      let img, f;
      if (tex === 'cv') { img = SAP_CANVAS[fr]; f = { x: 0, y: 0, w: img.width, h: img.height }; }
      else { img = tex === 'town' ? tw : ob; f = (tex === 'town' ? ASSET.townJson : ASSET.objectsJson).frames[fr].frame; }
      const k = Math.min(tex === 'cv' ? 1.3 : 1, 24 / Math.max(f.w, f.h));
      const c = mk(g => g.drawImage(img, f.x, f.y, f.w, f.h, Math.round((24 - f.w * k) / 2), Math.round(24 - f.h * k), Math.round(f.w * k), Math.round(f.h * k)));
      ICONS[id] = c.toDataURL(); ICON_CANVAS[id] = c;
    }
    // dirt path: a dirt patch with grass edges from the corner tiles
    const c = mk(g => {
      const fx = (FILL_ROW * 16 + 3) % 16 * 16, fy = Math.floor((FILL_ROW * 16 + 3) / 16) * 16;
      g.fillStyle = '#4a3a22'; g.beginPath(); g.ellipse(12, 13, 11, 8, 0, 0, 7); g.fill();
      g.save(); g.beginPath(); g.ellipse(12, 13, 10, 7, 0, 0, 7); g.clip(); g.drawImage(te, fx, fy, 16, 16, 2, 5, 20, 16); g.restore();
      g.fillStyle = '#5aa64a'; for (const [x, y] of [[3, 8], [19, 9], [6, 18], [17, 18]]) g.fillRect(x, y, 2, 2);
    });
    ICONS.dirt_path = c.toDataURL();
    ICONS.berry = ICONS.energy_berry;
    ICONS.fertiliser = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 4, 14, 18); g.fillStyle = '#c9b48a'; g.fillRect(6, 5, 12, 16); g.fillStyle = '#8f6a3a'; g.fillRect(6, 5, 12, 3); g.fillStyle = '#4e9a3a'; g.fillRect(9, 11, 6, 6); g.fillStyle = '#7cc24a'; g.fillRect(11, 9, 2, 6); g.fillStyle = '#5e3b20'; g.fillRect(7, 18, 10, 2); }).toDataURL();
    const bowl = (soup, top) => mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 10, 18, 10); g.fillRect(5, 20, 14, 2); g.fillStyle = '#e8e0d0'; g.fillRect(4, 11, 16, 8); g.fillStyle = '#c9c0b0'; g.fillRect(6, 18, 12, 2); g.fillStyle = soup; g.fillRect(5, 11, 14, 3); g.fillStyle = top; g.fillRect(7, 11, 3, 2); g.fillRect(13, 12, 3, 1); g.fillStyle = '#ffffffaa'; g.fillRect(9, 5, 1, 4); g.fillRect(13, 4, 1, 4); }).toDataURL();
    const plate = draw => mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(1, 15, 22, 6); g.fillStyle = '#f3ead8'; g.fillRect(2, 16, 20, 4); g.fillStyle = '#d8ccb4'; g.fillRect(4, 19, 16, 1); draw(g); }).toDataURL();
    ICONS.veg_soup = bowl('#d08a3a', '#4e9a3a'); ICONS.corn_chowder = bowl('#f2d26a', '#e8b030');
    ICONS.roast_turnip = plate(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 8, 14, 9); g.fillStyle = '#e8d8c0'; g.fillRect(6, 9, 12, 7); g.fillStyle = '#c9822e'; g.fillRect(6, 9, 12, 3); g.fillStyle = '#9b4ab0'; g.fillRect(7, 9, 5, 1); });
    ICONS.jacket_potato = plate(g => { g.fillStyle = '#2a1e1a'; g.fillRect(4, 8, 16, 9); g.fillStyle = '#a8703c'; g.fillRect(5, 9, 14, 7); g.fillStyle = '#f6e6a8'; g.fillRect(8, 9, 8, 3); g.fillStyle = '#fff6c0'; g.fillRect(10, 8, 4, 2); });
    ICONS.glazed_carrots = plate(g => { for (const [x, y] of [[4, 11], [9, 9], [14, 11]]) { g.fillStyle = '#2a1e1a'; g.fillRect(x, y, 6, 6); g.fillStyle = '#f08a2a'; g.fillRect(x + 1, y + 1, 4, 4); g.fillStyle = '#ffd25a'; g.fillRect(x + 1, y + 1, 2, 1); } });
    ICONS.tomato_salad = plate(g => { g.fillStyle = '#4e9a3a'; g.fillRect(4, 11, 16, 4); for (const [x, y] of [[5, 9], [11, 8], [15, 10]]) { g.fillStyle = '#2a1e1a'; g.fillRect(x, y, 5, 5); g.fillStyle = '#d8402a'; g.fillRect(x + 1, y + 1, 3, 3); } });
    ICONS.pumpkin_pie = plate(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 9, 18, 8); g.fillStyle = '#c99462'; g.fillRect(4, 10, 16, 6); g.fillStyle = '#e88a2a'; g.fillRect(5, 10, 14, 4); g.fillStyle = '#fff6e0'; g.fillRect(10, 9, 4, 2); });
    ICONS.berry_crumble = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 8, 18, 13); g.fillStyle = '#e8e0d0'; g.fillRect(4, 14, 16, 6); g.fillStyle = '#d8b070'; g.fillRect(4, 9, 16, 5); g.fillStyle = '#b04070'; for (const x of [6, 11, 16]) g.fillRect(x, 12, 2, 2); }).toDataURL();
    ICONS.mon_treat = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(4, 6, 16, 15); g.fillStyle = '#f2c14e'; g.fillRect(5, 7, 14, 13); g.fillStyle = '#c0304a'; for (const [x, y] of [[7, 9], [12, 8], [9, 13], [14, 13]]) g.fillRect(x, y, 3, 3); g.fillStyle = '#fff3a0'; g.fillRect(6, 8, 3, 1); g.fillStyle = '#e04a6a'; g.fillRect(11, 2, 3, 3); }).toDataURL();
    ICONS.hearty_stew = bowl('#8a4a2a', '#e8a040'); ICONS.corn_fritters = plate(g => { for (const [x, y] of [[4, 10], [10, 8], [14, 11]]) { g.fillStyle = '#2a1e1a'; g.fillRect(x, y, 7, 6); g.fillStyle = '#e8b030'; g.fillRect(x + 1, y + 1, 5, 4); g.fillStyle = '#fff0a0'; g.fillRect(x + 1, y + 1, 2, 1); } });
    ICONS.tavern_pie = plate(g => { g.fillStyle = '#2a1e1a'; g.fillRect(3, 8, 18, 9); g.fillStyle = '#b07038'; g.fillRect(4, 9, 16, 7); g.fillStyle = '#d89a58'; for (let x = 5; x < 19; x += 3) g.fillRect(x, 10, 2, 5); g.fillStyle = '#f0c080'; g.fillRect(5, 9, 6, 1); });
    ICONS.feed = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 5, 14, 17); g.fillStyle = '#c8a46a'; g.fillRect(6, 6, 12, 15); g.fillStyle = '#8a6a3a'; g.fillRect(6, 6, 12, 3); g.fillStyle = '#e8d070'; for (const [x, y] of [[8, 12], [12, 14], [10, 17], [14, 11], [9, 15]]) g.fillRect(x, y, 2, 2); g.fillStyle = '#c0304a'; g.fillRect(13, 17, 2, 2); }).toDataURL();
    ICONS.honey = mk(g => { g.fillStyle = '#2a1e1a'; g.fillRect(5, 7, 14, 15); g.fillRect(7, 3, 10, 5); g.fillStyle = '#e8a82e'; g.fillRect(6, 9, 12, 12); g.fillStyle = '#f6c84a'; g.fillRect(7, 10, 4, 6); g.fillStyle = '#f3ead8'; g.fillRect(8, 4, 8, 4); g.fillStyle = '#c95a48'; g.fillRect(7, 6, 10, 2); }).toDataURL();
    ICONS.root_charm = mk(g => {
      g.fillStyle = '#3a2a1e'; g.fillRect(11, 1, 2, 6);
      g.fillStyle = '#2a1e1a'; g.beginPath(); g.arc(12, 14, 8, 0, 7); g.fill();
      g.fillStyle = '#a8703c'; g.beginPath(); g.arc(12, 14, 7, 0, 7); g.fill();
      g.fillStyle = '#c99059'; g.beginPath(); g.arc(11, 13, 5, 0, 7); g.fill();
      g.fillStyle = '#4e9a3a'; g.beginPath(); g.ellipse(12, 14, 2.5, 4.5, .6, 0, 7); g.fill();
      g.fillStyle = '#7cc24a'; g.fillRect(11, 12, 1, 4); g.fillStyle = '#e8d080'; g.fillRect(10, 6, 4, 2);
    }).toDataURL();
    ICONS.sturdy_charm = mk(g => {
      g.fillStyle = '#3a2a1e'; g.fillRect(11, 1, 2, 6);
      g.fillStyle = '#2a1e1a'; g.beginPath(); g.arc(12, 14, 8, 0, 7); g.fill();
      g.fillStyle = '#6a6e78'; g.beginPath(); g.arc(12, 14, 7, 0, 7); g.fill();
      g.fillStyle = '#a8adb8'; g.beginPath(); g.arc(11, 13, 5, 0, 7); g.fill();
      g.fillStyle = '#4a4e58'; g.fillRect(4, 13, 16, 2); g.fillRect(11, 6, 2, 16);
      g.fillStyle = '#c0304a'; g.beginPath(); g.arc(12, 14, 2.5, 0, 7); g.fill(); g.fillStyle = '#e8d080'; g.fillRect(10, 6, 4, 2);
    }).toDataURL();
  });
}
function loadIcons() {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      for (const [name, [x, y]] of Object.entries(ASSET.iconsMap)) {
        const c = document.createElement('canvas'); c.width = c.height = 24;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, x, y, 24, 24, 0, 0, 24, 24);
        ICONS[name] = c.toDataURL(); ICON_CANVAS[name] = c;
      }
      res();
    };
    img.src = ASSET.icons;
  });
}
const iconFor = id => ICONS[id] || ICONS.wood;

/* -------------------------------------------------------------- audio
   Everything is synthesised with Web Audio, so there are no sound files. */
const Sound = (() => {
  let rainHush = false, theme = 'field';
  let ctx = null, sfx, mus, noiseBuf, rainSrc = null, rainGain = null, musicOn = false, nextT = 0, step = 0, timer = null, lastNote = 72;
  function init() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const m = ctx.createGain(); m.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.connect(m); mus = ctx.createGain(); mus.connect(m);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      volumes();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  function volumes() { if (!ctx) return; sfx.gain.value = opts.sfx ?? .7; mus.gain.value = (opts.music ?? .5) * .3; if (rainGain) rainGain.gain.value = rainHush ? 0 : .22 * (opts.sfx ?? .7) * (indoor ? .35 : 1); }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function tone(f, d, type = 'square', peak = .2, f2 = null, when = 0, dest = null) {
    if (!ctx) return; const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    env(g, t, .006, d, peak); o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, ftype, freq, peak = .3, q = 1, when = 0, f2 = null) {
    if (!ctx) return; const t = ctx.currentTime + when, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = ftype; f.frequency.setValueAtTime(freq, t); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + d); f.Q.value = q;
    env(g, t, .003, d, peak); s.connect(f); f.connect(g); g.connect(sfx); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  }
  const P = {
    chop() { noise(.09, 'bandpass', 900, .55, 1.5); tone(130, .08, 'square', .1, 90); },
    pick() { tone(1500, .06, 'triangle', .22, 1150); noise(.05, 'highpass', 2600, .22); tone(210, .05, 'square', .07); },
    rustle() { noise(.16, 'bandpass', 3000, .28, 1.2, 0, 1500); },
    swish() { noise(.14, 'bandpass', 2400, .2, 2, 0, 700); },
    hoe() { noise(.11, 'lowpass', 800, .45); tone(160, .06, 'square', .07, 110); },
    water() { for (let i = 0; i < 5; i++) tone(500 + Math.random() * 700, .05, 'sine', .07, null, i * .04); noise(.25, 'lowpass', 1500, .16); },
    fill() { noise(.4, 'lowpass', 1000, .25, 1, 0, 400); for (let i = 0; i < 6; i++) tone(300 + i * 60, .06, 'sine', .06, null, i * .06); },
    pop() { tone(620, .08, 'sine', .2, 980); },
    plant() { tone(420, .07, 'triangle', .14, 560); noise(.06, 'lowpass', 600, .15); },
    thud() { tone(110, .35, 'sine', .45, 40); noise(.3, 'lowpass', 380, .4); },
    crunch() { noise(.18, 'bandpass', 1300, .4, 1); },
    step(i) { noise(.035, 'lowpass', i % 2 ? 520 : 430, .1); },
    click() { tone(900, .035, 'square', .06); },
    coin() { tone(988, .07, 'square', .1); tone(1319, .16, 'square', .1, null, .07); },
    door() { tone(240, .12, 'triangle', .12, 180); noise(.08, 'lowpass', 600, .15); },
    error() { tone(200, .12, 'square', .07, 150); },
    place() { tone(330, .06, 'square', .08); noise(.06, 'lowpass', 700, .2); },
    snore() { tone(120, .5, 'sine', .12, 90); },
    hit() { noise(.12, 'bandpass', 700, .5, 1.2); tone(180, .1, 'square', .14, 80); },
    faint() { tone(500, .5, 'square', .1, 90); },
    levelup() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .12, 'square', .09, null, i * .09)); },
    wobble() { tone(300, .08, 'triangle', .14, 240); noise(.06, 'lowpass', 500, .2); },
    gotcha() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .16, 'square', .1, null, i * .11)); },
    grass() { noise(.045, 'bandpass', 2600, .045, .7, 0, 1800); },
    encounter() { for (let i = 0; i < 6; i++) tone(300 + i * 120, .06, 'square', .08, null, i * .04); noise(.3, 'highpass', 2000, .2, 1, 0, 6000); },
  };
  // gentle generative music: I-vi-IV-V in C, pentatonic melody, soft bass
  const midi = n => 440 * Math.pow(2, (n - 69) / 12), PENT = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
  function note(n, t, d, type, peak) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = midi(n); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(mus); o.start(t); o.stop(t + d + .05); }
  function playStep(i, t) {
    const bar = Math.floor(i / 8) % 4, beat = i % 8, root = [48, 45, 41, 43][bar], night = S && S.time >= 1140;
    if (beat === 0) { note(root, t, 1.6, 'triangle', .22); note(root + 12 + 4 - (bar === 1 ? 1 : 0), t, 1.5, 'sine', .05); note(root + 19, t, 1.5, 'sine', .04); }
    if (beat === 4) note(root + 7, t, .9, 'triangle', .14);
    if (Math.random() < (night ? .35 : .6) && !(beat % (night ? 2 : 1))) {
      let k = PENT.indexOf(lastNote); if (k < 0) k = 5;
      k = Math.max(0, Math.min(PENT.length - 1, k + Math.round((Math.random() - .5) * 3)));
      lastNote = PENT[k]; note(lastNote - (night ? 12 : 0), t, .45, 'triangle', .12);
    }
  }
  // composed loops (MIDI notes, 0 = rest), one entry per eighth note
  const THEMES = {
    route: { bpm: 126, roots: [48, 45, 41, 43], third: [4, 3, 4, 4],
      mel: [72, 0, 76, 79, 76, 0, 74, 72, 69, 0, 72, 76, 74, 0, 72, 0, 65, 69, 72, 0, 74, 72, 69, 0, 67, 71, 74, 0, 79, 0, 77, 74,
            72, 0, 76, 79, 81, 0, 79, 76, 77, 0, 76, 74, 72, 0, 69, 0, 69, 72, 74, 0, 76, 74, 72, 0, 74, 0, 71, 0, 72, 0, 0, 0] },
    battle: { bpm: 152, roots: [45, 41, 43, 40], third: [3, 4, 4, 4], drums: true,
      mel: [69, 0, 72, 69, 76, 0, 74, 72, 72, 0, 69, 65, 69, 72, 74, 0, 71, 0, 74, 71, 79, 0, 77, 74, 76, 0, 75, 76, 80, 0, 76, 0,
            81, 0, 79, 76, 77, 0, 76, 74, 72, 74, 76, 72, 69, 0, 72, 0, 74, 0, 71, 67, 74, 77, 79, 0, 76, 75, 76, 80, 83, 0, 0, 0] },
  };
  function perc(t, hi) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = hi ? 'highpass' : 'bandpass'; f.frequency.value = hi ? 7000 : 1800; g.gain.setValueAtTime(hi ? .05 : .12, t); g.gain.exponentialRampToValueAtTime(.0001, t + (hi ? .04 : .12));
    s.connect(f); f.connect(g); g.connect(mus); s.start(t, Math.random() * .5); s.stop(t + .15);
  }
  function playTheme(T, i, t) {
    const len = T.mel.length, k = i % len, bar = Math.floor(k / 8) % 4, beat = k % 8, root = T.roots[bar], spb = 60 / T.bpm / 2;
    note(root - 12 + (beat % 2 ? 12 : 0), t, spb * .9, T.drums ? 'square' : 'triangle', T.drums ? .07 : .16);
    if (beat % 2 === 1) { note(root + 12 + T.third[bar], t, spb * .8, 'square', .025); note(root + 19, t, spb * .8, 'square', .02); }
    const m = T.mel[k]; if (m) note(m, t, spb * 1.6, 'square', .045);
    if (T.drums) { perc(t, true); if (beat === 2 || beat === 6) perc(t, false); }
  }
  function sched() {
    if (!musicOn || !ctx) return;
    const T = THEMES[theme];
    while (nextT < ctx.currentTime + .4) { if (T) playTheme(T, step, nextT); else playStep(step, nextT); nextT += T ? 60 / T.bpm / 2 : 60 / 82 / 2; step++; }
  }
  let indoor = false;
  return {
    init, volumes,
    play(name, a) { if (ctx && P[name]) P[name](a); },
    theme(name) { if (name === theme) return; theme = name; step = 0; if (ctx) nextT = ctx.currentTime + .15; },
    get currentTheme() { return theme; },
    hushRain(on) { rainHush = on; volumes(); },
    victory() { if (!ctx) return; [[72, 0], [76, .12], [79, .24], [84, .36], [79, .6], [84, .72]].forEach(([n, w]) => tone(midi(n), w > .5 ? .5 : .14, 'square', .09, null, w)); },
    music(on) { musicOn = on; if (!ctx) return; if (on && !timer) { nextT = ctx.currentTime + .2; timer = setInterval(sched, 100); } if (!on && timer) { clearInterval(timer); timer = null; } },
    rain(on, inside = false) {
      indoor = inside; if (!ctx) return;
      if (on && !rainSrc) {
        rainSrc = ctx.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1300;
        rainGain = ctx.createGain(); rainSrc.connect(f); f.connect(rainGain); rainGain.connect(sfx); rainSrc.start();
      }
      if (!on && rainSrc) { rainSrc.stop(); rainSrc = null; rainGain = null; }
      volumes();
    },
  };
})();
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => Sound.init(), { capture: true }));

/* --------------------------------------------------------------- state */
let S = null, inv = null, farm = null, scene = null, game = null, slot = 1;
const opts = { autoTool: false, sfx: .7, music: .5 };
try { Object.assign(opts, JSON.parse(localStorage.getItem(SAVE_KEY + '_opts')) || {}); } catch (e) { }
function saveOpts() { try { localStorage.setItem(SAVE_KEY + '_opts', JSON.stringify(opts)); } catch (e) { } }
function newState(name) {
  return {
    v: 1, name: name || 'Farmer', day: 1, time: 360, energy: 270, maxEnergy: 270, sel: 0,
    debris: {}, extra: [], tilled: {}, fences: {}, paths: {}, objs: {}, mailRead: false, nextId: 100000,
    gold: 500, shipped: [], starter: false, water: CAN_MAX,
    weather: 'sun', tomorrow: rollWeather(2), spawn: { scene: 'house', x: 2, y: 3, dir: 'down' },
    town: newTown(), mons: [], ranch: 0,
  };
}
function newTown() { return { done: {}, pending: {}, met: {}, talked: {}, hearts: {}, visited: false }; }
const slotKey = n => SAVE_KEY + '_slot' + n;
function readSlot(n) { try { const s = JSON.parse(localStorage.getItem(slotKey(n))); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function snapshot() { return { ...S, inv: inv.serialize() }; }
function save() {
  S.savedAt = Date.now();
  const data = snapshot();
  try { localStorage.setItem(slotKey(slot), JSON.stringify(data)); localStorage.setItem(SAVE_KEY + '_last', String(slot)); } catch (e) { }
  saveOpts();
  return Cloud.put(slot, data);
}
function manualSave() {
  if (!scene || !scene.p || scene.sleeping) return;
  const p = scene.p;
  S.spawn = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir };
  Sound.play('coin');
  toast('Game saved', 1500);
  save().then(ok => { if (ok) toast('Game saved · backed up to your account', 2000); });
}
/* save codes: gzip + base64 with a FAB1: prefix (plain JSON backups still load) */
async function encodeSave(obj) {
  const json = JSON.stringify(obj);
  try {
    const cs = new CompressionStream('gzip'), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(json)); w.close();
    const u = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return 'FAB1:' + btoa(s);
  } catch (e) { return json; }
}
async function decodeSave(text) {
  text = (text || '').trim();
  if (!text.startsWith('FAB1:')) return JSON.parse(text);
  const bin = atob(text.slice(5).replace(/\s+/g, '')), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('gzip'), w = ds.writable.getWriter(); w.write(u); w.close();
  return JSON.parse(await new Response(ds.readable).text());
}
async function exportSave() {
  const snap = snapshot(), data = JSON.stringify(snap);
  const name = `fablemon-${(S.name || 'farm').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-day${S.day}.json`;
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename: name, data }); S.lastBackup = S.day; toast('Backup file saved.'); return; }
  } catch (e) { if (e && e.code === 'declined') return; }
  const code = await encodeSave(snap);
  openModal('Back up your farm', `<p>Keep a copy of your save somewhere safe. To restore it, choose <b>Load game</b> on the title screen and paste the code or pick the file. It works on any device.</p>
    <div class="row" style="justify-content:flex-start"><button class="btn gold" data-a="copy">📋 Copy save code</button><button class="btn" data-a="file">💾 Download backup file</button></div>
    <p style="font-size:12px;opacity:.75;margin:8px 0 2px">Your save code (paste it into Notes, or message it to yourself):</p>
    <textarea id="bcode" readonly style="width:100%;height:90px;font:11px monospace;word-break:break-all">${code.replace(/</g, '&lt;')}</textarea>`, a => {
    if (a === 'copy') navigator.clipboard.writeText(code).then(() => { S.lastBackup = S.day; toast('Save code copied! Paste it somewhere safe.', 2400); }, () => { $('bcode').select(); toast('Select the code and copy it.'); });
    if (a === 'file') { const url = URL.createObjectURL(new Blob([data], { type: 'application/json' })), el = document.createElement('a'); el.href = url; el.download = name; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); S.lastBackup = S.day; toast('Backup file downloaded.', 2000); }
  });
}
/* ---------------------------------------------------------- cloud saves
   Each save is also kept in the player's own private area of the artifact's
   database, so it survives game updates and follows them between devices.
   localStorage stays as a fast local copy. */
const Cloud = (() => {
  let db = null, uid = null, readyP = null; const writing = {}, pending = {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function init() {
    if (readyP) return readyP;
    readyP = (async () => {
      try {
        if (!window.claude || !window.claude.use) return false;
        const both = Promise.all([window.claude.use('db'), window.claude.use('user')]);
        const [d, u] = await Promise.race([both, sleep(10000).then(() => [null, null])]);
        if (!d || !u) return false;
        const id = await u.id(); if (!id) return false;
        db = d; uid = id; return true;
      } catch (e) { return false; }
    })();
    return readyP;
  }
  const ref = n => db.doc(`data/users/${uid}/slot${n}`);
  async function get(n) {
    if (!await init()) return null;
    try { const snap = await ref(n).get(); if (!snap.exists) return null; const d = snap.data(); return d && d.json ? JSON.parse(d.json) : null; } catch (e) { return null; }
  }
  async function write(n, o) {
    const body = { json: JSON.stringify(o), savedAt: o.savedAt || 0 };
    try { await ref(n).set(body); return true; }
    catch (e) { if (e && e.code === 'unavailable') { await sleep(600 + Math.random() * 600); try { await ref(n).set(body); return true; } catch (_) { } } return false; }
  }
  // one write at a time per slot; a newer save replaces a queued one
  async function put(n, o) {
    if (!await init()) return false;
    pending[n] = o; if (writing[n]) return writing[n];
    writing[n] = (async () => { let ok = true; while (pending[n]) { const x = pending[n]; pending[n] = null; ok = await write(n, x); } writing[n] = null; return ok; })();
    return writing[n];
  }
  async function del(n) { if (!await init()) return; try { await ref(n).delete(); } catch (e) { } }
  return { init, get, put, del, ok: () => !!db };
})();
async function syncSlots() {
  if (!await Cloud.init()) return false;
  for (let n = 1; n <= 3; n++) {
    const local = readSlot(n), cloud = await Cloud.get(n);
    if (cloud && (!local || (cloud.savedAt || 0) > (local.savedAt || 0))) { try { localStorage.setItem(slotKey(n), JSON.stringify(cloud)); } catch (e) { } }
    else if (local && (!cloud || (local.savedAt || 0) > (cloud.savedAt || 0))) Cloud.put(n, local);
  }
  return true;
}
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
(function migrate() { try { const old = localStorage.getItem(SAVE_KEY); if (old && !localStorage.getItem(slotKey(1))) { localStorage.setItem(slotKey(1), old); localStorage.setItem(SAVE_KEY + '_last', '1'); } if (old) localStorage.removeItem(SAVE_KEY); } catch (e) { } })();
function lastSlot() {
  let best = null;
  try { const l = +localStorage.getItem(SAVE_KEY + '_last'); if (l && readSlot(l)) return l; } catch (e) { }
  for (let n = 1; n <= 3; n++) { const s = readSlot(n); if (s && (!best || (s.savedAt || 0) > (readSlot(best).savedAt || 0))) best = n; }
  return best;
}

/* ------------------------------------------------- calendar and weather */
const seasonIdx = day => Math.floor((day - 1) / 28) % 4;
function seasonDay(day = S.day) { const d = day - 1; return { season: SEASONS[seasonIdx(day)], si: seasonIdx(day), dom: d % 28 + 1, wd: WEEK[d % 7], year: Math.floor(d / 112) + 1 }; }
function rollWeather(day) {
  const si = seasonIdx(day), dom = (day - 1) % 28 + 1, r = Math.random();
  if (dom === 1) return 'sun';                       // first day of a season is always fair
  if (si === 3) return r < .3 ? 'snow' : 'sun';
  if (si === 1) return r < .1 ? 'storm' : r < .2 ? 'rain' : 'sun';
  return r < .22 ? 'rain' : 'sun';
}
const WX = { sun: { icon: '☀️', name: 'Sunny' }, rain: { icon: '🌧️', name: 'Rain' }, storm: { icon: '⛈️', name: 'Storm' }, snow: { icon: '❄️', name: 'Snow' } };
const isWet = w => w === 'rain' || w === 'storm';

/* ------------------------------------------------------------- UI bits */
let toastT;
const escHTML = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const numHTML = t => escHTML(t).replace(/\d[\d,.]*/g, '<span class="num">$&</span>');
// wrap digit runs in a clear font inside pixel-font elements (prices, levels, counts)
function numWrap(root) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /\d/.test(n.nodeValue) && !(n.parentNode.closest && n.parentNode.closest('.num,input,textarea,script,style')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) { const sp = document.createElement('span'); sp.innerHTML = numHTML(n.nodeValue); n.replaceWith(...sp.childNodes); }
}
for (const id of ['mBody', 'bmenu', 'bmsg', 'quest']) { const el = document.getElementById(id); if (el) new MutationObserver(() => { obsBusy || (obsBusy = 1, numWrap(el), obsBusy = 0); }).observe(el, { childList: true, subtree: true, characterData: true }); }
var obsBusy = 0;
function toast(m, ms = 2200) { const t = $('toast'); t.innerHTML = numHTML(m); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function fmtTime(t) { const h = Math.floor(t / 60) % 24, m = Math.floor(t % 60 / 10) * 10; return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; }
let modalClose = null;
function openModal(title, html, onClick, onClose) {
  if ($('modal').classList.contains('show') && modalClose) { const f = modalClose; modalClose = null; f(); }
  $('mTitle').textContent = title; $('mBody').innerHTML = html; $('modal').classList.add('show');
  $('mBody').onclick = e => { const el = e.target.closest('[data-a]'); if (el && onClick) { Sound.play('click'); onClick(el.dataset.a, el.dataset, el); } };
  $('mBody').oninput = e => { const el = e.target.closest('[data-a]'); if (el && onClick) onClick(el.dataset.a, el.dataset, el); };
  modalClose = onClose || null; if (scene) scene.paused = true; Sound.play('click');
}
/* ---------- "how many?" picker: −/+ buttons, a slider, quick amounts and a running total */
function askQty(o, cb) {
  const max = Math.max(1, Math.floor(o.max)), el = $('qty'), p = el.querySelector('.panel');
  let n = Math.max(1, Math.min(max, o.start || max));
  const tot = () => o.unit ? `${o.cost ? 'Cost' : 'Worth'}: <span class="num">${(o.unit * n).toLocaleString()}g</span>` : (o.note ? o.note(n) : '');
  p.innerHTML = `<div class="qh">${o.icon ? `<img src="${o.icon}">` : ''}<span>${o.title}</span></div>
    <div class="qrow"><button class="btn" data-q="-">−</button><input type="number" min="1" max="${max}" value="${n}"><button class="btn" data-q="+">+</button></div>
    <input type="range" min="1" max="${max}" value="${n}" ${max < 2 ? 'disabled' : ''}>
    <div class="quick">${[1, 5, 10, 25].filter(v => v < max).map(v => `<button class="btn" data-q="=${v}">${v}</button>`).join('')}${max > 2 ? `<button class="btn" data-q="=${Math.ceil(max / 2)}">Half</button>` : ''}<button class="btn" data-q="=${max}">All (${max})</button></div>
    <div class="tot"></div>
    <div class="row"><button class="btn" data-q="x">Cancel</button><button class="btn gold" data-q="ok">${o.verb || 'OK'}</button></div>`;
  const num = p.querySelector('input[type=number]'), rng = p.querySelector('input[type=range]'), tt = p.querySelector('.tot');
  const set = v => { n = Math.max(1, Math.min(max, Math.round(v) || 1)); num.value = n; rng.value = n; tt.innerHTML = tot(); };
  set(n);
  const close = () => { el.classList.remove('show'); el.onclick = null; };
  el.onclick = e => {
    e.stopPropagation(); const q = e.target.closest('[data-q]'); if (e.target === el) return close(); if (!q) return;
    const v = q.dataset.q; Sound.play('click');
    if (v === '-') set(n - 1); else if (v === '+') set(n + 1); else if (v[0] === '=') set(+v.slice(1));
    else if (v === 'x') close(); else if (v === 'ok') { close(); cb(n); }
  };
  num.oninput = () => set(+num.value); rng.oninput = () => set(+rng.value);
  el.classList.add('show');
}
// re-run the open modal's own render after a picker finishes
function refreshModal() { if (!$('modal').classList.contains('show')) return; const s = document.createElement('span'); s.dataset.a = 'refresh'; $('mBody').appendChild(s); s.click(); s.remove(); }
function closeModal() { curVendor = null; $('modal').classList.remove('show'); const f = modalClose; modalClose = null; if (f) f(); if (scene) scene.paused = false; }
$('mClose').onclick = closeModal;
$('modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });

function slotHTML(i, s, extra = '') {
  const img = s ? `<img src="${s.id === 'can' && !S.water ? ICONS.can_empty : iconFor(s.id)}">` : '';
  const n = s && s.n > 1 ? `<span class="n">${s.n}</span>` : '';
  const wb = s && s.id === 'can' ? `<span class="wb"><i style="width:${100 * S.water / canMax()}%"></i></span>` : '';
  return `<div class="slot ${extra}" data-i="${i}" title="${s ? ITEMS[s.id].name : ''}">${img}${n}${wb}</div>`;
}
function slotSize() { return Math.max(26, Math.min(40, Math.floor((Math.min(window.innerWidth, 620) - 40) / 12))); }
function renderHotbar() {
  if (!S) return;
  const s = slotSize(); document.documentElement.style.setProperty('--s', s + 'px');
  $('hotbar').innerHTML = inv.slots.slice(0, 12).map((sl, i) => slotHTML(i, sl, i === S.sel ? 'sel' : '')).join('');
  const h = inv.slots[S.sel]; $('actBtn').innerHTML = h ? `<img src="${h.id === 'can' && !S.water ? ICONS.can_empty : iconFor(h.id)}">` : '<span style="font-weight:700;color:var(--green)">USE</span>'; { const as = (opts[ctlKey()] || {}).as || 1, im = $('actBtn').querySelector('img'); if (im && as !== 1) im.style.width = im.style.height = 34 * as + 'px'; }
}
$('hotbar').addEventListener('pointerdown', e => { const el = e.target.closest('.slot'); if (!el) return; e.stopPropagation(); select(+el.dataset.i); });
function select(i) { S.sel = (i + 12) % 12; renderHotbar(); Sound.play('click'); const s = inv.slots[S.sel]; if (s) toast(ITEMS[s.id].name, 900); }
function held() { return inv.slots[S.sel]; }
function updateHUD() {
  const sd = seasonDay();
  refreshTeamBtn();
  $('date').textContent = `${WX[S.weather].icon} ${sd.wd}. ${sd.dom} ${sd.season}`;
  $('time').textContent = fmtTime(S.time);
  $('gold').innerHTML = `<img src="${ICONS.coin}"> ${(S.gold || 0).toLocaleString()}g`;
  $('energy').querySelector('.fill').style.height = (100 * S.energy / S.maxEnergy) + '%';
  const t = S.time; let d = 0;
  if (t >= 1080) d = Math.min(.55, (t - 1080) / 180 * .55);
  if (isWet(S.weather)) d = Math.max(d, .22);
  $('night').style.opacity = d;
}

// merge every stack, then tidy the main backpack (the hotbar stays where you put things)
function sortBackpack() {
  const sl = inv.slots;
  for (let i = 0; i < sl.length; i++) {
    const s = sl[i]; if (!s) continue; const max = ITEMS[s.id].stack || 99;
    for (let j = i + 1; j < sl.length && s.n < max; j++) { const t = sl[j]; if (t && t.id === s.id) { const k = Math.min(max - s.n, t.n); s.n += k; t.n -= k; if (!t.n) sl[j] = null; } }
  }
  const cat = id => { const it = ITEMS[id]; return it.tool ? 0 : it.seed ? 1 : it.qbase || Object.values(CROPS).some(c => c.item === id) ? 2 : it.eat || it.heal ? 3 : it.place ? 5 : 4; };
  const rest = sl.slice(12).filter(Boolean).sort((a, b) => cat(a.id) - cat(b.id) || ITEMS[a.id].name.localeCompare(ITEMS[b.id].name));
  for (let i = 12; i < sl.length; i++) sl[i] = rest[i - 12] || null;
  inv.emit();
}
function openBag() {
  let pick = -1, drag = null;
  const gs = Math.max(24, Math.min(42, Math.floor((Math.min(window.innerWidth * .94, 600) - 52) / 12) - 2));
  const render = () => {
    const sl = inv.slots;
    const hot = sl.slice(0, 12).map((s, i) => slotHTML(i, s, (i === pick ? 'pick ' : '') + (i === S.sel ? 'sel' : ''))).join('');
    const rest = sl.slice(12).map((s, i) => slotHTML(i + 12, s, i + 12 === pick ? 'pick' : '')).join('');
    const info = pick >= 0 && sl[pick] ? `<p><b>${ITEMS[sl[pick].id].name}</b>: ${ITEMS[sl[pick].id].desc}${ITEMS[sl[pick].id].sell && !/Sells for/.test(ITEMS[sl[pick].id].desc) ? ` <small>(sells for ${ITEMS[sl[pick].id].sell}g)</small>` : ''}</p>${ITEMS[sl[pick].id].eat ? `<div class="row"><button class="btn gold" data-a="eat">Eat it (+${ITEMS[sl[pick].id].eat} energy)</button></div>` : ''}` : '<p>Drag items between slots, or tap one then tap where it should go. The top row is your hotbar. Drag onto the bin to throw an item away.</p>';
    return `<div style="--s:${gs}px"><div class="grid hot">${hot}</div><div class="grid">${rest}</div></div>
      <div class="trashrow"><button class="btn" data-a="sort" style="margin-right:auto">↕ Sort and stack</button><div class="slot trash" data-trash="1" title="Trash"><img src="${ICONS.trash}"></div></div>${info}`;
  };
  const rerender = () => { $('mBody').innerHTML = render(); };
  const trash = i => {
    const s = inv.slots[i]; if (!s) return;
    if (ITEMS[s.id].tool) { Sound.play('error'); toast("You'll need that. Tools can't be thrown away."); return; }
    inv.slots[i] = null; inv.emit(); Sound.play('crunch'); toast(`Threw away ${s.n} ${ITEMS[s.id].name}`);
  };
  openModal('Backpack', render(), a => {
    if (a === 'eat' && pick >= 0) { eatHeld(pick); if (!inv.slots[pick]) pick = -1; rerender(); }
    if (a === 'sort') { sortBackpack(); pick = -1; Sound.play('pop'); rerender(); renderHotbar(); }
  });
  const body = $('mBody');
  const down = e => {
    const el = e.target.closest('.slot'); if (!el) return;
    if (el.dataset.trash) { if (pick >= 0) { trash(pick); pick = -1; rerender(); } return; }
    const i = +el.dataset.i;
    drag = { i, x: e.clientX, y: e.clientY, moved: false, ghost: null, has: !!inv.slots[i] };
    e.preventDefault();
  };
  const move = e => {
    if (!drag || !drag.has) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
      drag.moved = true; pick = -1;
      const g = document.createElement('img'); g.src = iconFor(inv.slots[drag.i].id); g.className = 'dragghost'; document.body.appendChild(g); drag.ghost = g;
    }
    if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; }
  };
  const up = e => {
    if (!drag) return; const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (!d.moved) {
      if (pick < 0) { if (d.has) pick = d.i; } else { inv.swap(pick, d.i); Sound.play('click'); pick = -1; }
      rerender(); return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY), sl = el && el.closest('.slot');
    if (sl && sl.dataset.trash) trash(d.i);
    else if (sl && sl.dataset.i !== undefined) { inv.swap(d.i, +sl.dataset.i); Sound.play('click'); }
    rerender();
  };
  body.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  modalClose = () => { body.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.querySelectorAll('.dragghost').forEach(g => g.remove()); };
}
const COOKING = [
  { out: 'roast_turnip', need: { turnip: 2 } },
  { out: 'jacket_potato', need: { potato: 1, fiber: 1 } },
  { out: 'veg_soup', need: { turnip: 1, carrot: 1, potato: 1 } },
  { out: 'glazed_carrots', need: { carrot: 2, honey: 1 } },
  { out: 'tomato_salad', need: { tomato: 2 } },
  { out: 'corn_chowder', need: { corn: 2, potato: 1 } },
  { out: 'pumpkin_pie', need: { pumpkin: 1, honey: 1 } },
  { out: 'berry_crumble', need: { berry: 3 } },
  { out: 'mon_treat', need: { berry: 2, honey: 1 } },
  { out: 'hearty_stew', need: { potato: 2, carrot: 1, turnip: 1 }, tavern: 1 },
  { out: 'corn_fritters', need: { corn: 1, berry: 2 }, tavern: 1 },
  { out: 'tavern_pie', need: { pumpkin: 1, potato: 1, honey: 1 }, tavern: 1 },
];
function openCooking() {
  const render = () => COOKING.map((r, k) => [r, k]).filter(([r]) => (!r.tavern || S.flags.tavernRecipes) && (!r.crest || (S.flags.tavernCrest || 0) >= r.crest)).map(([r, k]) => {
    const it = ITEMS[r.out], need = { ...r.need, wood: 1 }, ok = Object.entries(need).every(([id, n]) => inv.count(id) >= n);
    const parts = Object.entries(need).map(([id, n]) => `<span class="need ${inv.count(id) < n ? 'no' : ''}"><img src="${iconFor(id)}">${n}</span>`).join('');
    return `<div class="recipe"><img src="${iconFor(r.out)}"><div class="g"><b>${it.name}</b><small>${it.eat ? `⚡ +${it.eat} energy` : it.heal >= 100 ? '♥ Fully heals a Fablemon' : `♥ Heals ${it.heal}% of a Fablemon`}</small><div>${parts}</div></div><button class="btn gold" data-a="cook" data-k="${k}" ${ok ? '' : 'disabled'}>Cook</button></div>`;
  }).join('');
  openModal('Cooking Pot', `<p class="hint">Each meal uses 1 wood for the fire. Eat meals from your backpack, or hold one and press the action button.</p><div class="mlist">${render()}</div>`, (a, d) => {
    if (a === 'refresh') { $('mBody').querySelector('.mlist').innerHTML = render(); return; }
    if (a !== 'cook') return;
    const r = COOKING[+d.k], need = { ...r.need, wood: 1 };
    const most = Math.min(99, ...Object.entries(need).map(([id, n]) => Math.floor(inv.count(id) / n)));
    if (most < 1) return Sound.play('error');
    const cook = times => {
      let made = 0;
      for (let i = 0; i < times; i++) {
        if (!Object.entries(need).every(([id, n]) => inv.count(id) >= n)) break;
        for (const [id, n] of Object.entries(need)) inv.remove(id, n);
        const left = inv.add(r.out, 1); if (left) { for (const [id, n] of Object.entries(need)) inv.add(id, n); toast('Your backpack is full!'); break; }
        made++;
      }
      if (made) { S.flags.cooked = 1; Sound.play('fill'); setTimeout(() => Sound.play('coin'), 350); renderHotbar(); toast(`You cooked ${made > 1 ? made + ' ' : ''}${ITEMS[r.out].name}!`, 1500); }
      $('mBody').querySelector('.mlist').innerHTML = render();
    };
    if (most === 1) cook(1); else askQty({ title: `Cook ${ITEMS[r.out].name}`, icon: iconFor(r.out), max: most, start: 1, verb: 'Cook', note: k => 'Uses ' + Object.entries(need).map(([id, n]) => `${n * k} ${ITEMS[id].name}`).join(', ') }, cook);
  });
}
function eatHeld(slotIdx = S.sel) {
  const s = inv.slots[slotIdx], it = s && ITEMS[s.id]; if (!it || !it.eat) return false;
  if (S.energy >= S.maxEnergy && !it.xpBoost && !it.buff) { toast("You're not hungry right now.", 1400); return true; }
  const gain = Math.min(it.eat, S.maxEnergy - S.energy); S.energy += gain; inv.removeAt(slotIdx, 1);
  if (it.xpBoost) S.xpDay = S.day;
  if (it.buff) S.buff = { k: it.buff, day: S.day };
  Sound.play('plant'); setTimeout(() => Sound.play('pop'), 150); updateHUD(); renderHotbar(); toast(`Ate ${it.name}. +${gain} energy${it.xpBoost ? '. Battle XP +50% today!' : ''}${it.buff ? `. Your Fablemon feel ${BUFF_TEXT[it.buff]} today!` : ''}`, 2400);
  return true;
}
const CROP_ITEMS = () => Object.values(CROPS).map(c => c.item).concat(['feed']);
function openTrough(o) {
  o.food = o.food || 0;
  const out = () => S.mons.filter(m => m.loc === 'ranch' && m.out).length;
  const render = () => {
    const rows = (o.lv ? ['premium_feed', 'feed'] : CROP_ITEMS()).filter(id => inv.count(id)).map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name}</b><small>You have ${inv.count(id)}</small></div><button class="btn gold" data-a="add" data-id="${id}" data-n="1">Add 1</button><button class="btn" data-a="add" data-id="${id}" data-n="all">All</button></div>`).join('');
    return `<p>Food in the trough: <b>${o.food}</b>${o.prem ? ` + <b>${o.prem}</b> Premium` : ''}. Each night, every Fablemon out on your farm eats 1 and grows closer to you.</p>
      <p><small>${S.ranch === 2 ? `${out()} Fablemon are out on your farm right now.` : 'Build a ranch so your Fablemon can live on the farm.'}</small></p><div class="mlist">${rows || (o.lv ? '<p>A Deluxe Trough only takes Fablemon Feed. Hattie sells it at the ranch in town.</p>' : '<p>You have no crops to add. Grow some first!</p>')}</div>`;
  };
  openModal(o.lv ? 'Deluxe Trough' : 'Feeding Trough', render(), (a, d) => {
    if (a !== 'add') return;
    const n = d.n === 'all' ? inv.count(d.id) : 1; if (!inv.remove(d.id, n)) return;
    if (d.id === 'premium_feed') o.prem = (o.prem || 0) + n; else o.food += n; Sound.play('plant'); renderHotbar(); $('mBody').innerHTML = render();
  });
}
function openChest(o) {
  let pickMode = false; o.lock = o.lock || {};
  const usable = s => s && (ITEMS[s.id].seed || COOKING.some(r => r.need[s.id] || r.need[plainId(s.id)]) || s.id === 'wood');
  const render = () => `<p style="display:flex;align-items:center;gap:8px"><b>Chest</b> <small style="flex:1">${pickMode ? 'Tap seeds and ingredients to allow or block them.' : 'Tap an item to move it across.'}</small><button class="btn" data-a="qs" style="padding:3px 10px;font-size:13px">⇩ Quick stack</button></p>
    <button class="tog ${o.noCook ? '' : 'on'}" data-a="cookok"><span></span>Fablemon cooks may use ingredients from this chest</button>
    <button class="btn ${pickMode ? 'gold' : ''}" data-a="pickmode" style="width:100%;margin:4px 0 6px">${pickMode ? '✔ Done choosing' : '🔒 Choose what Fablemon may use'}</button>
    <div class="grid" style="display:grid;grid-template-columns:repeat(9,var(--s));gap:3px;justify-content:center">${o.items.map((s, i) => { const lk = s && o.lock[s.id], dim = pickMode && s && !usable(s); return slotHTML(i, s, `${lk ? 'locked' : ''} ${dim ? 'dim' : ''}`).replace('data-i=', `data-a="${pickMode ? 'lock' : 'out'}" data-i=`); }).join('')}</div>
    ${Object.keys(o.lock).some(k => o.lock[k]) ? '<small class="hint">🔒 Locked items stay in the chest: Fablemon won\'t plant or cook them.</small>' : ''}
    <p style="margin-top:10px"><b>Backpack</b></p><div class="grid" style="display:grid;grid-template-columns:repeat(9,var(--s));gap:3px;justify-content:center">${inv.slots.map((s, i) => slotHTML(i, s).replace('data-i=', 'data-a="in" data-i=')).join('')}</div>`;
  openModal('Chest', render(), (a, d) => {
    const i = +d.i;
    if (a === 'out') { const s = o.items[i]; if (!s) return; const left = inv.add(s.id, s.n); o.items[i] = left ? { id: s.id, n: left } : null; if (left) toast('Your backpack is full.'); }
    const put = (i, quiet) => {
      const s = inv.slots[i]; if (!s) return;
      let n = s.n;
      for (const t of o.items) if (t && t.id === s.id && n) { const add = Math.min(n, ITEMS[s.id].stack - t.n); t.n += add; n -= add; }
      for (let j = 0; j < o.items.length && n; j++) if (!o.items[j]) { const add = Math.min(n, ITEMS[s.id].stack); o.items[j] = { id: s.id, n: add }; n -= add; }
      if (n) { s.n = n; if (!quiet) toast('The chest is full.'); } else inv.slots[i] = null;
    };
    if (a === 'in') { put(i); inv.emit(); }
    if (a === 'pickmode') { pickMode = !pickMode; }
    if (a === 'lock') { const s = o.items[i]; if (s) { if (!usable(s)) toast('Fablemon only use seeds and cooking ingredients.', 1600); else { o.lock[s.id] = !o.lock[s.id]; Sound.play('click'); } } }
    if (a === 'cookok') { o.noCook = !o.noCook; toast(o.noCook ? 'Fablemon cooks will leave this chest alone.' : 'Fablemon cooks can use this chest\'s ingredients.', 1800); }
    // quick stack: everything in the backpack that this chest already holds goes in
    if (a === 'qs') { const have = new Set(o.items.filter(Boolean).map(t => t.id)); let k = 0; inv.slots.forEach((s, j) => { if (s && have.has(s.id) && !ITEMS[s.id].tool) { put(j, true); k++; } }); inv.emit(); toast(k ? 'Stacked matching items into the chest.' : 'Nothing in your backpack matches this chest.', 1600); }
    renderHotbar(); $('mBody').innerHTML = render();
  });
}
const CRAFT_TABS = [
  ['Adventure', ['root_charm']],
  ['Farm', ['pot', 'mine', 'well', 'compost', 'beehive', 'trough', 'chest', 'sprinkler', 'scarecrow', 'oak_sapling', 'pine_sapling', 'apple_sapling', 'farmstand']],
  ['Paths & fences', ['fence', 'gate', 'path', 'dirt_path', 'wall', 'pillar']],
  ['Garden', ['bench', 'planter', 'flowerbed', 'hedge', 'bush', 'wildflowers', 'rockery']],
  ['Lights & decor', ['lantern', 'lamp', 'barrel', 'crate']],
];
let craftTab = 0;
function openCraft() {
  const render = () => {
    const tabs = CRAFT_TABS.map(([n], i) => `<button class="btn ${i === craftTab ? 'gold' : ''}" data-a="tab" data-k="${i}" style="padding:4px 9px;font-size:13px">${n}</button>`).join('');
    const rows = RECIPES.map((r, k) => [r, k]).filter(([r]) => CRAFT_TABS[craftTab][1].includes(r.out)).map(([r, k]) => {
      if (recipeLocked(r)) return `<div class="recipe" style="opacity:.55"><img src="${iconFor(r.out)}" style="filter:grayscale(1)"><div class="g"><b>${ITEMS[r.out].name}</b><small>${r.crest ? `🔒 After your ${['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][r.crest]} Crest` : `🌳 Unlocks at Hearthroot stage ${r.stage + 1}`}</small></div></div>`;
      const can = inv.canCraft(r);
      const need = Object.entries(needOf(r)).map(([id, v]) => `${v} ${ITEMS[id].name} (${inv.count(id)})`).join(', ');

      return `<div class="recipe"><img src="${iconFor(r.out)}"><div class="g"><b>${ITEMS[r.out].name}${r.n > 1 ? ' ×' + r.n : ''}</b><small>${need}</small></div>
        <button class="btn gold" data-a="craft" data-k="${k}" ${can ? '' : 'disabled'}>Craft</button></div>`;
    }).join('');
    return `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">${tabs}</div><div class="mlist">${rows}</div><p><small>Crafted items go into your backpack. Select one in the hotbar and place it in front of you. Wide items fill tiles to the right; a green box means it fits.</small></p>`;
  };
  openModal('Crafting', render(), (a, d) => {
    if (a === 'tab') { craftTab = +d.k; $('mBody').innerHTML = render(); return; }
    if (a === 'craft') {
      const r = RECIPES[+d.k]; if (!r || recipeLocked(r)) return;
      const most = Math.min(99, ...Object.entries(needOf(r)).map(([id, v]) => Math.floor(inv.count(id) / v)));
      const make = times => { let made = 0; for (let i = 0; i < times; i++) { const ok = inv.craft(r); if (ok === 'full') { toast('Your backpack is full.'); break; } if (!ok) break; made++; } if (made) Sound.play('place'); refreshModal(); };
      if (most <= 1) make(1); else askQty({ title: `Craft ${ITEMS[r.out].name}`, icon: iconFor(r.out), max: most, start: 1, verb: 'Craft', note: k => 'Uses ' + Object.entries(needOf(r)).map(([id, v]) => `${v * k} ${ITEMS[id].name}`).join(', ') }, make);
    }
    $('mBody').innerHTML = render();
  });
}
// settings as tappable choice chips (seg = one choice from a group; tog = on/off)
function controlsHTML() {
  const m = controlMode(), sp = opts.bspeed || 1;
  const seg = (a, cur, list) => `<div class="seg">${list.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-a="${a}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<div class="setc"><b>Controls</b>${seg('ctl', m, [['joystick', '🕹️ Joystick'], ['dpad', '✚ Arrows'], ['tap', '👆 Tap']])}
      <small>${m === 'tap' ? 'Tap the ground to walk and tap things to use your tool. Hold to keep swinging.' : m === 'dpad' ? 'Walk with the arrow buttons (press between two for diagonals) and press the action button to use your tool.' : 'Walk with the joystick and press the action button to use your tool.'}</small>
      <button class="tog ${opts.autoTool ? 'on' : ''}" data-a="auto"><span></span>Auto-switch to the right tool</button></div>
    <div class="setc"><b>Battle speed</b>${seg('bspeed', sp, [[1, 'Normal'], [1.7, 'Fast'], [3, 'Very fast']])}</div>
    <div class="setc"><b>Sound</b>
      <label class="slid">🎵 Music <input type="range" min="0" max="1" step=".05" value="${opts.music}" data-a="music"></label>
      <label class="slid">🔔 Effects <input type="range" min="0" max="1" step=".05" value="${opts.sfx}" data-a="sfx"></label></div>`;
}
function openSettings(back) {
  const render = () => `${back ? '<button class="btn mback" data-a="back">‹ Back to menu</button>' : ''}${controlsHTML()}
    <div class="setc"><b>Screen</b><button class="btn" data-a="ctledit" style="width:100%">🕹️ Move and resize the HUD</button></div>
    ${back ? '' : '<div class="setc"><button class="btn" data-a="intro" style="width:100%">🎬 Watch the opening</button></div>'}
    <p class="hint">Keyboard: WASD or arrows to walk, Space to use, 1–0 or the mouse wheel for the hotbar, I for the backpack, C for crafting.</p>`;
  openModal('Settings', render(), (a, d, el) => {
    if (a === 'back') return openMenu();
    if (a === 'ctledit') { closeModal(); return ctlEdit(true); }
    if (a === 'intro') { closeModal(); return playIntro('Farmer', () => { $('title').style.display = 'flex'; }); }
    handleSetting(a, d, el);
    if (['ctl', 'auto', 'bspeed'].includes(a)) $('mBody').innerHTML = render();
  });
}
function handleSetting(a, d, el) {
  if (a === 'ctl') setControls(d.v);
  if (a === 'auto') { opts.autoTool = el.type === 'checkbox' ? el.checked : !opts.autoTool; saveOpts(); }
  if (a === 'bspeed') { opts.bspeed = +d.v; saveOpts(); toast(['', 'Normal', '', 'Very fast'][Math.round(opts.bspeed)] || 'Fast', 900); }
  if (a === 'music') { opts.music = +el.value; Sound.volumes(); saveOpts(); }
  if (a === 'sfx') { opts.sfx = +el.value; Sound.volumes(); saveOpts(); }
}
const HOUSE_PIC = {};
function openHouseUpgrade() {
  const st = S.house || 0, next = st + 1;
  if (S.houseNext) return openModal('House upgrade', `<p>The builders are working on your <b>${HOUSE_NAMES[S.houseNext]}</b>. It will be ready tomorrow morning.</p>`);
  if (next > 3) return openModal('House upgrade', `<p>You live in the <b>${HOUSE_NAMES[3]}</b>, the finest house in the valley. There's nothing left to build!</p>`);
  const [w, h] = HOUSE_ROOM[next];
  openModal('House upgrade', `<p>You live in the <b>${HOUSE_NAMES[st]}</b>. Next: the <b>${HOUSE_NAMES[next]}</b>.</p>
    <div style="text-align:center;background:#cfe3b2;border:3px solid #5e3b20;border-radius:8px;padding:8px;margin:6px 0"><img src="${HOUSE_PIC[next]}" style="max-width:100%;height:150px;object-fit:contain;image-rendering:pixelated"></div>
    <p>A bigger home with a ${w}×${h} room inside. Built overnight.</p>
    <p><span class="need ${S.gold < goldCut(HOUSE_COST[next]) ? 'no' : ''}"><img src="${ICONS.coin}">${goldCut(HOUSE_COST[next]).toLocaleString()}g${S.town.done.carpenter ? ' <small>(Robin saves you 15%)</small>' : ''}</span></p>
    <div class="row"><button class="btn gold" data-a="plans">See where it goes</button></div>`, a => {
    if (a !== 'plans') return;
    if (!scene || scene.scene.key !== 'farm') return toast('Go outside on your farm to see the plans.', 2200);
    closeModal();
    const cur = houseFoot(st), nf = houseFoot(next), f = houseFrame(next);
    scene.buildPreview({
      fixed: true, name: HOUSE_NAMES[next], desc: 'Your new house goes here. Clear any red tiles first.', atlas: 'houses', frame: 'house' + next,
      at: { cx: 0, by: 0 }, areaFor: () => nf.slice(0, 4), gx: Math.round(nf[4]), gy: DOOR.y * T + 2, cost: {}, gold: goldCut(HOUSE_COST[next]), allowDirt: true,
      ignore: (x, y) => (x >= cur[0] && x <= cur[2] && y >= cur[1] && y <= cur[3]) || (y === BIN.y && x >= BIN.x && x <= BIN.x + 1),
      onBuild: () => { S.houseNext = next; toast(`The builders will have your ${HOUSE_NAMES[next]} ready tomorrow morning!`, 3000); },
    });
  });
}
function openMenu() {
  const tiles = [
    ['map', '🗺️', 'Map'], ['tasks', '📜', 'Tasks'], ['journal', '📖', 'Journal'],
    ['friends', '💛', 'Friends'], ['cal', '📅', 'Calendar'], ['house', '🏡', 'House'],
    ['move', '✋', 'Move things'], ['settings', '⚙️', 'Settings'], ['export', '💾', 'Back up'],
  ];
  const saveNote = Cloud.ok() ? 'Saves are backed up to your claude.ai account.' : 'Saves are kept on this device. Back up now and then to keep them safe.';
  openModal('Menu', `<div class="mtiles">${tiles.map(([a, i, l]) => `<button class="mtile" data-a="${a}"><span>${i}</span>${l}</button>`).join('')}</div>
    <div class="mfoot"><button class="btn gold" data-a="save">💾 Save game</button><button class="btn" data-a="title">Quit to title</button></div>
    <p class="hint" style="text-align:center">The game also saves each night when you go to bed. ${saveNote}</p>`, (a, d, el) => {
    if (a === 'save') { closeModal(); manualSave(); }
    if (a === 'house') openHouseUpgrade();
    if (a === 'move') { if (!scene || scene.scene.key !== 'farm') return toast('Go outside on your farm to move things.', 2000); closeModal(); scene.moveMode(); }
    if (a === 'export') exportSave();
    if (a === 'settings') openSettings(true);
    if (a === 'tasks') openQuests();
    if (a === 'journal') openJournal();
    if (a === 'friends') openFriends();
    if (a === 'cal') openCalendar();
    if (a === 'map') openMap();
    if (a === 'title') { openModal('Quit to title?', '<p>Anything since you last saved will be lost.</p><div class="row"><button class="btn gold" data-a="yes">Quit</button><button class="btn" data-a="no">Keep playing</button></div>', b => { if (b === 'yes') location.reload(); else closeModal(); }); }
  });
}
$('quest').onclick = () => openQuests(); $('clock').style.cursor = 'pointer'; $('clock').onclick = () => { if (S && !Talk.open) openCalendar(); }; $('bTeam').onclick = () => openTeam(); $('bBag').onclick = openBag; $('bCraft').onclick = openCraft; $('bMenu').onclick = openMenu;

const letterText = () => `Dear ${S.name},

It was lovely to meet you yesterday. Welcome to Wild Roots Farm! It has been empty for years, so the weeds, rocks and saplings have had their way with it. I'm afraid you'll have some clearing to do.

Your scythe cuts weeds for fiber. Your axe fells trees and stumps for wood, and your pickaxe breaks stones. Wood makes good fences, which you can put together on your crafting bench.

When you're settled in, follow the road east into Smallroot. Folks are eager to meet you, and so are the little critters that wander the meadows.

Warmly,
Elder Bramble
Mayor of Smallroot

P.S. I've tucked in a packet of turnip seeds. Till the soil with your hoe, plant them, and water them every day. Fill your watering can at the pond. When they're ready, put them in the shipping bin beside your house and you'll be paid the next morning.`;

/* ------------------------------------------------------ touch controls */
const joy = { dx: 0, dy: 0, active: false, id: null };
let actHeld = false;
function touchDevice() { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; }
function controlMode() { return opts.controls || (touchDevice() ? 'joystick' : 'tap'); }
function applyTouchMode() { const m = controlMode(); document.body.classList.toggle('touch', m === 'joystick' || m === 'dpad'); document.body.classList.toggle('dpad', m === 'dpad'); }
function setControls(v) { opts.controls = v; applyTouchMode(); saveOpts(); toast(v === 'tap' ? 'Tap to go' : v === 'dpad' ? 'Arrow buttons and action button' : 'Joystick and action button', 1200); }
function litArrow(dir) { document.querySelectorAll('#joy .dp').forEach(b => b.classList.toggle('on', !!dir && b.dataset.d.split('').every(c => dir.includes(c)) && (b.dataset.d.length === 2 ? dir.length === 2 : true))); }
function setupTouch() {
  const el = $('joy'), knob = el.querySelector('.knob');
  const move = e => {
    const R = 42 * ctlLayout().js;
    if (document.body.classList.contains('dpad')) {
      const r = el.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(x, y) < r.width * .12) { joy.dx = joy.dy = 0; litArrow(''); return; }
      const a = Math.round(Math.atan2(y, x) / (Math.PI / 4)), sx = Math.round(Math.cos(a * Math.PI / 4)), sy = Math.round(Math.sin(a * Math.PI / 4));
      joy.dx = sx; joy.dy = sy; litArrow((sy < 0 ? 'u' : sy > 0 ? 'd' : '') + (sx < 0 ? 'l' : sx > 0 ? 'r' : '')); return;
    }
    const r = el.getBoundingClientRect(); let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d; }
    knob.style.transform = `translate(${x}px,${y}px)`; joy.dx = x / R; joy.dy = y / R;
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (document.body.classList.contains('ctlEdit')) return ctlDrag(e, el, 'j'); try { el.setPointerCapture(e.pointerId); } catch (_) { } joy.active = true; joy.id = e.pointerId; move(e); });
  el.addEventListener('pointermove', e => { if (joy.active && e.pointerId === joy.id) move(e); });
  const end = e => { if (e.pointerId !== joy.id) return; joy.active = false; joy.dx = joy.dy = 0; knob.style.transform = ''; litArrow(''); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
  const a = $('actBtn');
  a.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (document.body.classList.contains('ctlEdit')) return ctlDrag(e, a, 'a'); actHeld = true; a.classList.add('down'); if (scene && !scene.paused && !scene.sleeping) scene.actFacing(); });
  const up = () => { actHeld = false; a.classList.remove('down'); };
  a.addEventListener('pointerup', up); a.addEventListener('pointercancel', up); a.addEventListener('pointerleave', up);
  applyTouchMode(); applyCtlLayout(); addEventListener('resize', applyCtlLayout);
  $('ctlJs').oninput = e => { ctlLayout().js = +e.target.value; applyCtlLayout(); };
  $('ctlAs').oninput = e => { ctlLayout().as = +e.target.value; applyCtlLayout(); };
  $('ctlReset').onclick = () => { delete opts[ctlKey()]; applyCtlLayout(); ctlSync(); };
  $('ctlDone').onclick = () => ctlEdit(false);
}
/* player-chosen joystick / action-button placement and size, kept per orientation; x,y = centre as a fraction of the screen */
const ctlKey = () => innerHeight > innerWidth ? 'ctlP' : 'ctlL';
function ctlLayout() { return opts[ctlKey()] || (opts[ctlKey()] = { js: 1, as: 1 }); }
function applyCtlLayout() {
  const L = opts[ctlKey()] || { js: 1, as: 1 }, j = $('joy'), a = $('actBtn'), k = j.querySelector('.knob');
  const js = L.js || 1, as = L.as || 1;
  j.style.width = j.style.height = 120 * js + 'px'; j.style.setProperty('--jz', 120 * js + 'px');
  k.style.width = k.style.height = 54 * js + 'px'; k.style.margin = -27 * js + 'px 0 0 ' + -27 * js + 'px';
  a.style.width = a.style.height = 70 * as + 'px';
  const im = a.querySelector('img'); if (im) im.style.width = im.style.height = 34 * as + 'px';
  const place = (el, x, y, sz) => {
    if (x == null) { el.style.left = el.style.top = el.style.right = el.style.bottom = el.style.transform = ''; return; }
    const h = sz / 2, cx = Math.min(innerWidth - h, Math.max(h, x * innerWidth)), cy = Math.min(innerHeight - h, Math.max(h, y * innerHeight));
    el.style.left = cx - h + 'px'; el.style.top = cy - h + 'px'; el.style.right = el.style.bottom = 'auto';
  };
  place(j, L.jx, L.jy, 120 * js); place(a, L.ax, L.ay, 70 * as);
  const hs = L.hud || {};
  for (const [id, , origin, base] of HUD_PARTS) {
    const el = $(id); if (!el) continue; const k = hs[id] || 1;
    el.style.transformOrigin = origin; el.style.transform = k === 1 ? '' : (base ? base + ' ' : '') + `scale(${k})`;
  }
  if (typeof S !== 'undefined' && S) try { renderQuest(); } catch (_) { }
}
/* id, label, transform origin, the element's own transform (kept when scaling) */
const HUD_PARTS = [['clock', 'Date and time', 'top left'], ['quest', 'Task tracker', 'top left'], ['topbtns', 'Menu buttons', 'top right'], ['hotbar', 'Hotbar', 'bottom center', 'translateX(-50%)'], ['energy', 'Energy bar', 'bottom right']];
function hudSizesHTML() {
  const hs = ctlLayout().hud || {};
  return HUD_PARTS.map(([id, lbl]) => `<label><span>${lbl}</span> <input type="range" min=".5" max="1.6" step=".05" value="${hs[id] || 1}" data-hud="${id}"></label>`).join('');
}
function ctlSync() {
  const L = ctlLayout(); $('ctlJs').value = L.js || 1; $('ctlAs').value = L.as || 1;
  $('hudSizes').innerHTML = hudSizesHTML();
  $('hudSizes').querySelectorAll('input').forEach(i => i.oninput = () => { const L2 = ctlLayout(); L2.hud = L2.hud || {}; L2.hud[i.dataset.hud] = +i.value; applyCtlLayout(); });
}
function ctlEdit(on) {
  document.body.classList.toggle('ctlEdit', on);
  if (scene) scene.paused = on ? true : false;
  if (on) ctlSync(); else { saveOpts(); toast('Controls saved', 1200); }
}
function ctlDrag(e, el, w) {
  try { el.setPointerCapture(e.pointerId); } catch (_) { }
  const r = el.getBoundingClientRect(), ox = e.clientX - (r.left + r.width / 2), oy = e.clientY - (r.top + r.height / 2), L = ctlLayout();
  const mv = ev => { L[w + 'x'] = (ev.clientX - ox) / innerWidth; L[w + 'y'] = (ev.clientY - oy) / innerHeight; applyCtlLayout(); };
  const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); saveOpts(); };
  el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function joyDirs() {
  if (!joy.active) return null;
  const ax = Math.abs(joy.dx), ay = Math.abs(joy.dy);
  if (Math.max(ax, ay) < .3) return null;
  const h = joy.dx > 0 ? 'right' : 'left', v = joy.dy > 0 ? 'down' : 'up', diag = Math.min(ax, ay) > Math.max(ax, ay) * .45;
  return ax >= ay ? [h, ay > .3 ? v : null, diag] : (diag ? [h, v, true] : [v, ax > .3 ? h : null, false]);
}

/* --------------------------------------------------------- weather FX */
const FX = (() => {
  const cv = $('fx'), g = cv.getContext('2d'); let mode = null, parts = [], raf = 0, indoor = false, amb = null, aparts = [];
  const LEAF = ['#d9822b', '#b5432c', '#e8b040', '#c8642a'], PETAL = ['#f8c8d8', '#f4a6c0', '#fff0f4'];
  function seedAmb() { aparts = []; if (!amb) return; const n = Math.round(innerWidth * innerHeight / (amb === 'leaves' ? 26000 : 30000)); for (let i = 0; i < n; i++) aparts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: .5 + Math.random() * .6, s: Math.random(), r: Math.random() * 6, c: (amb === 'leaves' ? LEAF : PETAL)[i % (amb === 'leaves' ? 4 : 3)] }); }
  function size() { cv.width = innerWidth; cv.height = innerHeight; }
  function seed() {
    parts = []; const n = mode === 'snow' ? 90 : mode === 'storm' ? 220 : 140;
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: .6 + Math.random() * .6, s: Math.random() });
  }
  function frame() {
    raf = requestAnimationFrame(frame);
    g.clearRect(0, 0, cv.width, cv.height);
    if (indoor || (scene && scene.paused)) return;
    if (!mode) {
      if (!amb) return;
      for (const p of aparts) {
        p.y += p.v * .7; p.x += Math.sin((p.y + p.s * 300) / 50) * .9 - .25; p.r += .05;
        if (p.y > cv.height + 6 || p.x < -10) { p.y = -6; p.x = Math.random() * (cv.width + 40); }
        g.fillStyle = p.c; const z = scene && scene.cameras && scene.cameras.main ? scene.cameras.main.zoom : 3, k = Math.max(1, Math.round(z * .5)), x = p.x | 0, y = p.y | 0, fl = Math.cos(p.r) > 0;
        if (amb === 'leaves') { g.fillRect(x, y, 3 * k, k); g.fillRect(x + k, y + (fl ? -k : k), k, k); g.fillStyle = 'rgba(60,30,10,.45)'; g.fillRect(x + 2 * k, y, k, k); }
        else { g.fillRect(x, y, 2 * k, k); if (fl) g.fillRect(x + k, y - k, k, k); }
      }
      return;
    }
    if (mode === 'snow') {
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (const p of parts) { p.y += p.v * 1.1; p.x += Math.sin((p.y + p.s * 100) / 40) * .5; if (p.y > cv.height) { p.y = -4; p.x = Math.random() * cv.width; } g.fillRect(p.x | 0, p.y | 0, 2 + (p.s > .7), 2 + (p.s > .7)); }
    } else {
      g.strokeStyle = 'rgba(190,215,255,.55)'; g.lineWidth = 1.5; g.beginPath();
      const sp = mode === 'storm' ? 15 : 11;
      for (const p of parts) { p.y += p.v * sp; p.x -= p.v * 2.5; if (p.y > cv.height) { p.y = -12; p.x = Math.random() * (cv.width + 60); } g.moveTo(p.x, p.y); g.lineTo(p.x + 3, p.y - 10); }
      g.stroke();
      if (mode === 'storm' && Math.random() < .002) { $('flash').style.opacity = .6; setTimeout(() => $('flash').style.opacity = 0, 90); }
    }
  }
  addEventListener('resize', () => { size(); seed(); seedAmb(); });
  return {
    ambient(k) { if (k !== amb) { amb = k; seedAmb(); } if (!raf) { size(); frame(); } },
    set(w, inside) {
      indoor = !!inside; const m = w === 'sun' ? null : w;
      if (m !== mode) { mode = m; size(); seed(); }
      if (!raf) { size(); frame(); }
      Sound.rain(isWet(w), indoor);
    },
  };
})();

/* ------------------------------------------------------ seasonal art
   Summer, fall and winter are recoloured from the spring art at load time. */
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); if (!s) return [l * 255, l * 255, l * 255]; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; }
function recolor(season, kind, r, g, b) {
  let [h, s, l] = rgb2hsl(r, g, b);
  const green = h > 55 && h < 170 && s > .18 && l > .08;
  if (season === 1) { if (green) { h += 6; s *= 1.1; l *= .94; } }
  else if (season === 2) {
    if (green) {
      if (kind === 'terrain' || kind === 'grass') { h = 50 - (h - 100) * .15; s *= .9; }
      else if (kind === 'pine') { s *= .8; l *= .95; }
      else { h = 16 + l * 42; s = Math.min(1, s * 1.25); }
    }
  } else if (season === 3) {
    const dirt = h >= 15 && h <= 45 && s > .3, water = h >= 180 && h <= 215 && s > .3, red = (h < 15 || h > 340) && s > .45;
    if (kind === 'terrain') {
      if (green) { l = .8 + l * .18; s = .18; h = 210; }
      else if (dirt) { s *= .45; l *= .85; }
      else if (water) { l = Math.min(.92, l + .14); s *= .55; }
    } else if (kind === 'pine') { if (green) { if (l > .5) { l = .9; s = .15; h = 210; } else { l *= .8; s *= .7; } } }
    else if (kind === 'grass') { if (green) { h = 40; s = .3; l *= .9; } }
    else if (green || red) { if (l > .36) { l = .84 + l * .12; s = .15; h = 210; } else { h = 30; s = .18; l *= .9; } }
  }
  return hsl2rgb(h, s, l);
}
const SEASON_FRAMES = { tree_oak: 'leaf', tree_apple: 'leaf', bush_round: 'leaf', bush_wide: 'leaf', tree_pine: 'pine', tall_grass: 'grass', wildflowers: 'leaf' };
function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; }); }
async function seasonalAssets(si) {
  if (si === 0) return { terrain: ASSET.terrain, objects: ASSET.objects };
  const proc = (img, regions) => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    for (const [x0, y0, w, h, kind] of regions) {
      const d = g.getImageData(x0, y0, w, h), a = d.data;
      for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const [r, gg, b] = recolor(si, kind, a[i], a[i + 1], a[i + 2]); a[i] = r; a[i + 1] = gg; a[i + 2] = b; }
      g.putImageData(d, x0, y0);
    }
    return c.toDataURL();
  };
  const [ti, oi] = await Promise.all([loadImg(ASSET.terrain), loadImg(ASSET.objects)]);
  const regions = Object.entries(SEASON_FRAMES).map(([f, k]) => { const fr = ASSET.objectsJson.frames[f].frame; return [fr.x, fr.y, fr.w, fr.h, k]; });
  const objects = proc(oi, regions);
  return { terrain: proc(ti, [[0, 0, ti.width, ti.height, 'terrain']]), objects: si === 3 ? snowCap(await loadImg(objects)) : objects };
}

/* ------------------------------------------------- generated furniture
   Placeholder pixel art for the house until the real sheet arrives. */
function pixCanvas(w, h, draw, outline = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const R = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  draw(R, g);
  if (outline) {
    const d = g.getImageData(0, 0, w, h), a = d.data, out = new Uint8ClampedArray(a);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (a[i + 3]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && a[(Y * w + X) * 4 + 3]; })) { out[i] = 42; out[i + 1] = 30; out[i + 2] = 26; out[i + 3] = 255; }
    }
    g.putImageData(new ImageData(out, w, h), 0, 0);
  }
  return c;
}
function houseTextures(sc) {
  const add = (k, c) => { if (!sc.textures.exists(k)) sc.textures.addCanvas(k, c); };
  add('h_floor', pixCanvas(16, 16, R => { R(0, 0, 16, 16, '#b98250'); for (const y of [3, 7, 11, 15]) R(0, y, 16, 1, '#8f5f34'); R(5, 0, 1, 3, '#8f5f34'); R(12, 4, 1, 3, '#8f5f34'); R(3, 8, 1, 3, '#8f5f34'); R(10, 12, 1, 3, '#8f5f34'); R(0, 0, 16, 1, '#c99462'); }, false));
  add('h_wall', pixCanvas(16, 32, R => { R(0, 0, 16, 22, '#efe0bd'); for (let x = 1; x < 16; x += 4) R(x, 0, 1, 22, '#e2cd9f'); R(0, 22, 16, 10, '#8f5f34'); R(0, 22, 16, 2, '#b07a45'); R(0, 31, 16, 1, '#5e3b20'); R(0, 21, 16, 1, '#c9a66b'); }, false));
  add('h_bed', pixCanvas(18, 32, R => { R(1, 1, 16, 30, '#8f5f34'); R(2, 2, 14, 8, '#f3eee6'); R(3, 3, 12, 5, '#ffffff'); R(2, 10, 14, 19, '#4f7cc4'); R(2, 10, 14, 2, '#7fa6e0'); for (const y of [15, 21, 27]) R(2, y, 14, 1, '#3a5f9e'); R(1, 29, 16, 2, '#6b4426'); }));
  add('h_table', pixCanvas(30, 18, R => { R(1, 1, 28, 9, '#b07a45'); R(1, 1, 28, 2, '#d39a5e'); R(2, 10, 3, 7, '#6b4426'); R(25, 10, 3, 7, '#6b4426'); }));
  add('h_tvtable', pixCanvas(30, 26, R => { R(1, 12, 28, 6, '#b07a45'); R(1, 12, 28, 2, '#d39a5e'); R(2, 18, 3, 7, '#6b4426'); R(25, 18, 3, 7, '#6b4426'); R(8, 1, 14, 11, '#5e3b20'); R(9, 2, 12, 8, '#2f3a4a'); R(10, 3, 3, 2, '#7fa6c0'); R(13, 11, 4, 1, '#3a2a1e'); }));
  add('h_rug', pixCanvas(48, 30, R => { R(0, 0, 48, 30, '#a8443a'); R(2, 2, 44, 26, '#c95a48'); R(4, 4, 40, 22, '#a8443a'); for (let x = 6; x < 44; x += 6) R(x, 13, 3, 3, '#f2c14e'); }, false));
  add('h_mat', pixCanvas(16, 10, R => { R(1, 1, 14, 8, '#3e7d3a'); R(2, 2, 12, 6, '#5aa64a'); }));
  add('h_window', pixCanvas(18, 16, R => { R(1, 1, 16, 14, '#8f5f34'); R(2, 2, 14, 12, '#9fd0f5'); R(8, 2, 2, 12, '#8f5f34'); R(2, 7, 14, 2, '#8f5f34'); R(3, 3, 3, 2, '#e4f4ff'); }));
  add('h_plant', pixCanvas(14, 24, R => { R(3, 15, 8, 8, '#b9783e'); R(3, 15, 8, 2, '#d99a5a'); R(6, 5, 2, 10, '#4e8f3a'); R(1, 6, 5, 4, '#5aa64a'); R(8, 3, 5, 4, '#6bb24a'); R(2, 1, 4, 4, '#6bb24a'); R(8, 9, 5, 4, '#4e8f3a'); }));
  add('h_chair', pixCanvas(12, 18, R => { R(1, 1, 10, 9, '#8f5f34'); R(2, 2, 8, 2, '#b07a45'); R(1, 10, 10, 3, '#b07a45'); R(1, 13, 2, 4, '#6b4426'); R(9, 13, 2, 4, '#6b4426'); }));
}

/* ======================================================================
   World: shared player, movement, camera, tools feedback and clock.
   ====================================================================== */
class World extends Phaser.Scene {
  initWorld(mw, mh) { this.dressed = 0; this.mw = mw; this.mh = mh; this.paused = false; this.sleeping = false; scene = this; this.p = null; this.shadows = []; }
  standF(dir) { return DIRS.indexOf(dir) * (this.walkCols || 4); }
  /* soft ground shadows that follow their sprite, so things feel planted in the world */
  shadow(spr, w, h, dx = 0) { const e = this.add.ellipse(Math.round(spr.x + dx), Math.round(spr.y - 1), w, h || Math.max(3, Math.round(w * .34)), 0x1a1206, .32).setDepth(1.5); this.shadows.push({ spr, e, dx }); return e; }
  syncShadows() {
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      const s = this.shadows[i];
      if (!s.spr.active) { s.e.destroy(); this.shadows.splice(i, 1); continue; }
      s.e.setPosition(Math.round(s.spr.x + s.dx), Math.round(s.spr.y - 1)).setVisible(s.spr.visible);
    }
  }
  // trees sway a little in the breeze, and everything tall gets a shadow
  dressTall() {
    for (const im of this.tall || []) {
      if (im.shadowed) continue; im.shadowed = 1;
      const fr = im.frame && im.frame.name || '', tree = /tree|dead_tree/.test(fr);
      this.shadow(im, Math.min(150, Math.round(im.displayWidth * (tree ? .7 : .8))), tree ? 11 : 10);
      if (tree && !im.swaying) { im.swaying = 1; this.tweens.add({ targets: im, angle: { from: -.7, to: .7 }, duration: 2600 + hash(im.x, im.y) * 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: hash(im.y, im.x) * 2000 }); }
    }
  }
  makePlayer(sp) {
    // walk sheets: 4 columns (stand, step, stand, step) or a richer 6–8 frame cycle (column 0 is the standing pose)
    const cols = Math.round(this.textures.get('walk').getSourceImage().width / 24); this.walkCols = cols;
    for (let r = 0; r < 4; r++) { const k = 'walk_' + DIRS[r]; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('walk', { frames: cols >= 6 ? Array.from({ length: cols }, (_, i) => r * cols + i) : [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: cols >= 6 ? 18 : 9, repeat: -1 }); }
    this.player = this.add.sprite(0, 0, 'walk', 0).setOrigin(.5, 1);
    this.toolSpr = this.add.sprite(0, 0, 'tools', 0).setOrigin(.5, 46 / 48).setVisible(false);
    this.p = { x: sp.x, y: sp.y, dir: sp.dir || 'down', moving: false, path: [], pending: null, busy: 0, steps: 0 };
    this.placePlayer(); this.player.setFrame(this.standF(this.p.dir));
    this.shadow(this.player, 14, 6);
    this.makeFollower();
    this.dressTall();
  }
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,I,C,ESC');
    this.input.keyboard.on('keydown', ev => this.onKey(ev));
    this.input.on('pointerdown', p => { this.holding = p; if (this.p) this.p.lastTarget = null; this.onTap(p.worldX, p.worldY); });
    this.input.on('pointerup', () => { this.holding = null; if (this.p) this.p.lastTarget = null; });
    this.input.on('wheel', (p, o, dx, dy) => select(S.sel + (dy > 0 ? 1 : -1)));
    this.clockAcc = 0;
    this.events.once('shutdown', () => { this.input.keyboard.removeAllListeners(); });
  }
  // the canvas is drawn at the screen's real pixel density; zoom is a whole number of device pixels per art pixel
  applyZoom() {
    const w = this.scale.width, h = this.scale.height, d = DPR();
    this.cameras.main.setZoom(Math.max(2 * d, Math.min(4 * d, Math.floor(Math.min(w / 320, h / 230)))));
  }
  placePlayer() {
    const p = this.p;
    this.player.setPosition(Math.round(p.px ?? p.x * T + 8), Math.round(p.py ?? p.y * T + 8) + 7);
    this.player.setDepth(this.player.y);
  }
  path(goal) {
    const p = this.p, MW = this.mw, MH = this.mh, start = p.y * MW + p.x;
    if (goal(p.x, p.y)) return [];
    const prev = new Int32Array(MW * MH).fill(-1); prev[start] = start; const q = [start]; let h = 0;
    while (h < q.length) {
      const cur = q[h++], cx = cur % MW, cy = (cur / MW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, ni = ny * MW + nx;
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH || prev[ni] !== -1 || !this.passable(nx, ny)) continue;
        prev[ni] = cur;
        if (goal(nx, ny)) { const out = []; let k = ni; while (k !== start) { out.push({ x: k % MW, y: (k / MW) | 0 }); k = prev[k]; } return out.reverse(); }
        q.push(ni);
      }
    }
    return null;
  }
  face(x, y) {
    const p = this.p, dx = x - p.x, dy = y - p.y;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'; else if (dy) p.dir = dy > 0 ? 'down' : 'up';
    this.player.setFrame(this.standF(p.dir));
  }
  // wind-up, strike, settle: one pose, three beats
  /* seasonal props: any axe, pickaxe, hoe or scythe clears one away (nothing drops) */
  propAt(x, y) { return this.seasonAt && this.seasonAt[x + ',' + y]; }
  cutProp(x, y) {
    const h = held(); if (!this.propAt(x, y) || !h || !['axe', 'pickaxe', 'scythe', 'hoe'].includes(h.id)) return false;
    this.swing(h.id, () => cutSeasonProp(this, x, y), 0); return true;
  }
  tapProp(wx, wy) {
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    if (!p || !this.propAt(x, y) || Math.abs(p.x - x) + Math.abs(p.y - y) !== 1) return false;
    this.face(x, y); return this.cutProp(x, y);
  }
  swing(tool, cb, cost = null) {
    const p = this.p, row = { axe: 2, scythe: 2, pickaxe: 0, hoe: 0, can: 1 }[tool];
    if (cost === null) cost = tool === 'scythe' ? 0 : 2;
    if (S.energy < cost) { Sound.play('error'); toast("You're exhausted. Go to bed to recover."); return false; }
    S.energy -= cost; updateHUD();
    p.busy = .36;
    const [fx, fy] = DV[p.dir], bx = this.player.x, by = this.player.y - 1;
    this.player.setVisible(false);
    this.toolSpr.setFrame(row * 4 + DIRS.indexOf(p.dir)).setPosition(bx - fx * 2, by - 2 - (fy > 0 ? 1 : 0)).setDepth(this.player.depth).setVisible(true);
    this.tweens.add({ targets: this.toolSpr, x: bx + fx, y: by + 1, duration: 70, delay: 95, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: this.toolSpr, x: bx, y: by, duration: 90, delay: 230 });
    this.time.delayedCall(170, cb);
    this.time.delayedCall(345, () => { this.toolSpr.setVisible(false); this.player.setVisible(true); });
    return true;
  }
  floatText(txt, x, y) {
    const t = this.add.text(x, y, txt, { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '9px', color: '#fffbe8', stroke: '#2a1e1a', strokeThickness: 2, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 1100, delay: 250, onComplete: () => t.destroy() });
  }
  chips(x, y, col, n = 5) {
    for (let i = 0; i < n; i++) {
      const r = this.add.rectangle(x, y, 2, 2, col).setDepth(9e6 - 1);
      this.tweens.add({ targets: r, x: x + (Math.random() * 16 - 8), y: y + 6 + Math.random() * 6, alpha: 0, duration: 380 + Math.random() * 200, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
    }
  }
  spark(x, y) {
    const s = this.add.star(x, y, 4, 1, 4, 0xfffbe0).setDepth(9e6);
    this.tweens.add({ targets: s, scale: 1.6, alpha: 0, angle: 45, duration: 180, onComplete: () => s.destroy() });
  }
  giveDrops(drops, wx, wy) {
    let i = 0;
    for (const [id, n] of Object.entries(drops)) {
      const left = inv.add(id, n);
      if (n - left) this.floatText(`+${n - left} ${ITEMS[id].name}`, wx, wy - i * 9);
      if (left) toast('Your backpack is full!');
      i++;
    }
    Sound.play('pop'); renderHotbar();
  }
  onKey(ev) {
    if (Battle.active) return;
    if ($('modal').classList.contains('show')) { if (ev.key === 'Escape') closeModal(); return; }
    if (this.sleeping) return;
    if (/^[0-9]$/.test(ev.key)) select(ev.key === '0' ? 9 : +ev.key - 1);
    if (ev.key === '-') select(10); if (ev.key === '=') select(11);
    if (ev.key === 'i' || ev.key === 'I') openBag();
    if (ev.key === 'c' || ev.key === 'C') openCraft();
    if (ev.key === 't' || ev.key === 'T') openTeam();
    if (ev.key === 'j' || ev.key === 'J') openJournal();
    if (ev.key === 'Escape') openMenu();
    if (ev.key === ' ' || ev.key === 'e' || ev.key === 'E') this.actFacing();
  }
  update(time, dms) {
    const dt = Math.min(.05, dms / 1000);
    if (this.shadows) this.syncShadows();
    if (!this.p || this.paused || this.sleeping) return;
    const p = this.p;
    this.clockAcc += dt;
    if (this.clockAcc >= .7) { S.time += 1; this.clockAcc -= .7; if (S.time % 10 === 0) updateHUD(); if (S.time >= 26 * 60) { goToBed(true); return; } }
    this.frameHook && this.frameHook(dt);
    this.updateFollower(dt);
    tickWorkers(dt, this);
    if (p.busy > 0) { p.busy -= dt; if (p.busy <= 0 && p.queued) { const q = p.queued; p.queued = null; this.act(q); } return; }
    if (p.moving) {
      const fast = this.fastAt && this.fastAt(p.x, p.y), sp = 5.2 * T * dt * (fast ? 1.25 : 1);
      this.player.anims.timeScale = fast ? 1.25 : 1;
      const tx = p.x * T + 8, ty = p.y * T + 8, dx = tx - p.px, dy = ty - p.py, d = Math.hypot(dx, dy);
      if (d <= sp) { p.px = tx; p.py = ty; p.moving = false; this.arrived(); }
      else { p.px += dx / d * sp; p.py += dy / d * sp; }
      this.placePlayer();
      if (p.moving || this.sleeping || this.paused) return;
    }
    p.idleT = (p.idleT || 0) + dt;
    let next = null;
    if (p.path.length) { next = p.path.shift(); if (!this.passable(next.x, next.y)) { p.path = []; next = null; } }
    if (!next) {
      const k = this.keys;
      const kv = (k.W.isDown || k.UP.isDown) ? 'up' : (k.S.isDown || k.DOWN.isDown) ? 'down' : null, kh = (k.A.isDown || k.LEFT.isDown) ? 'left' : (k.D.isDown || k.RIGHT.isDown) ? 'right' : null;
      const dir = kh || kv;
      // 8-way: two keys at once (or the stick at an angle) walks diagonally
      const jd = dir ? [dir, kh && kv ? kv : null, !!(kh && kv)] : joyDirs();
      if (!jd) p.turnT = 0;
      if (jd) {
        p.pending = null; p.path = []; p.lastTarget = null;
        // a light push or a quick tap only turns you; keep pushing to walk
        const light = !dir && joy.active && Math.hypot(joy.dx, joy.dy) < .65;
        if (jd[0] !== p.dir && (p.idleT || 0) > .12) { p.dir = jd[0]; this.player.setFrame(this.standF(p.dir)); p.turnT = .18; }
        else if (p.turnT > 0) p.turnT -= dt;
        else if (!light) {
          const cands = [];
          if (jd[2] && jd[1]) { const a = DV[jd[0]], b = DV[jd[1]]; cands.push([a[0] + b[0], a[1] + b[1]]); }
          for (const d of [jd[0], jd[1]]) if (d) cands.push(DV[d]);
          for (const [dx, dy] of cands) {
            if (dx && dy) { if (this.passable(p.x + dx, p.y + dy) && this.passable(p.x + dx, p.y) && this.passable(p.x, p.y + dy)) { next = { x: p.x + dx, y: p.y + dy }; break; } }
            else if (this.passable(p.x + dx, p.y + dy)) { next = { x: p.x + dx, y: p.y + dy }; break; }
          }
          if (!next) { const [dx, dy] = DV[jd[0]]; this.bump(p.x + dx, p.y + dy); }
        }
      }
    }
    if (next) {
      const dx = next.x - p.x, dy = next.y - p.y;
      p.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if (p.px === undefined) { p.px = p.x * T + 8; p.py = p.y * T + 8; }
      this.followStep(p.x, p.y);
      p.x = next.x; p.y = next.y; p.moving = true; p.idleT = 0;
      Sound.play('step', p.steps++);
      if (this.player.anims.currentAnim?.key !== 'walk_' + p.dir || !this.player.anims.isPlaying) this.player.play('walk_' + p.dir);
    } else if (!p.moving) {
      if (this.player.anims.isPlaying) { this.player.stop(); this.player.setFrame(this.standF(p.dir)); }
      if ((this.keys.SPACE.isDown || this.keys.E.isDown || actHeld) && !p.busy) this.actFacing();
      if (this.holding && this.holding.isDown && p.lastTarget && !p.busy && p.lastTarget.d && !p.lastTarget.d.gone && !p.path.length) this.tapGoal(p.lastTarget);
    }
  }
  arrived() {
    const p = this.p;
    if (!p.path.length && p.pending) { const t = p.pending; p.pending = null; this.act(t); }
    this.arriveHook && this.arriveHook(p.x, p.y);
  }
  bump() { }
  fadeIn() {
    setTimeout(() => { $('fade').style.opacity = 0; }, 60);
    const out = this.scene.key !== 'house'; FX.ambient(out ? [ 'petals', null, 'leaves', null ][seasonIdx(S.day)] : null);
    if (!this.dressed) { this.dressed = 1; try { seasonDress(this); } catch (e) { console.warn('season dress', e); } }
  }
}

/* ============================================================ Fablemon
   Species, your team, the follower, starter choice and the farm ranch. */
const MON_ORDER = ['hedglet', 'cindimple', 'rillip', 'tusskip', 'whirplet', 'cloverclasp', 'flintuck', 'fuzzwick', 'duskwick', 'mortoad', 'brashlet', 'brooknook', 'briamble', 'kilnook', 'weirlet', 'fleecebolt', 'whirlwyn', 'cloverguard', 'flintburrow', 'staticwing', 'duskcloak', 'rampartoad', 'pyrebrash', 'brookstride', 'muddlebub', 'lotling', 'puffpiper', 'sundrowse', 'tipplecup', 'glimmerjel', 'logloom', 'puffpiper_cotton', 'fenfang', 'mirebellows', 'lotveil', 'reefarer', 'reefarer_cotton', 'yawnox', 'brimbramble', 'stormveil', 'hollowbark', 'marshviper'];
const STARTERS = ['hedglet', 'cindimple', 'rillip'];
const TYPES = { Leaf: '#4e9a3a', Ember: '#d0542a', Tide: '#2f8fd0', Stone: '#8a7a5e', Gale: '#7fb6c9', Spark: '#d9b21e', Frost: '#7fc7e0', Shade: '#5b4a78', Glow: '#e0a8d0', Wild: '#a08a6a' };
const SPECIES = {
  hedglet: { exp: 64, rate: 45, name: 'Hedglet', type: 'Leaf', base: { hp: 50, atk: 45, def: 60, spd: 40 }, evo: ['briamble', 16], desc: "A shy hedge-dweller that weaves a nest of twigs on its back. Fresh leaves sprout from it when it's happy." },
  cindimple: { exp: 64, rate: 45, name: 'Cindimple', type: 'Ember', base: { hp: 55, atk: 60, def: 50, spd: 35 }, evo: ['kilnook', 16], desc: "Its clay-hard body is warm to the touch. Embers glow in the vents along its back when it's excited." },
  rillip: { exp: 64, rate: 45, name: 'Rillip', type: 'Tide', base: { hp: 50, atk: 45, def: 45, spd: 60 }, evo: ['weirlet', 16], desc: 'Carries a little pool of spring water on its back and never spills a drop. Its flower tail turns towards rain.' },
  tusskip: { evo: ['fleecebolt', 18], name: 'Tusskip', type: 'Wild', base: { hp: 45, atk: 50, def: 40, spd: 60 }, exp: 50, rate: 200, desc: 'A bouncy meadow critter with a fluffy cream crest. It hops through the long grass in springy zig-zags.' },
  whirplet: { evo: ['whirlwyn', 18], name: 'Whirplet', type: 'Gale', base: { hp: 40, atk: 45, def: 40, spd: 65 }, exp: 52, rate: 190, desc: 'Its curled blue wings catch the smallest breeze. It whistles through its horn-like crest when it is happy.' },
  cloverclasp: { evo: ['cloverguard', 18], name: 'Cloverclasp', type: 'Leaf', base: { hp: 50, atk: 40, def: 60, spd: 30 }, exp: 54, rate: 180, desc: 'Hides under heart-shaped clover leaves on its back. Finding one is said to bring good luck to a farm.' },
  flintuck: { evo: ['flintburrow', 18], name: 'Flintuck', type: 'Stone', base: { hp: 55, atk: 55, def: 70, spd: 20 }, exp: 60, rate: 150, desc: 'Burrows through hard ground with its stony shell. It sniffs out buried pebbles with its big orange nose.' },
  fuzzwick: { evo: ['staticwing', 18], name: 'Fuzzwick', type: 'Spark', base: { hp: 40, atk: 55, def: 35, spd: 60 }, exp: 58, rate: 160, desc: 'A fuzzy moth whose ruff crackles with static. It is drawn to lantern light on summer evenings.' },
  duskwick: { evo: ['duskcloak', 18], name: 'Duskwick', type: 'Shade', base: { hp: 50, atk: 55, def: 50, spd: 45 }, exp: 66, rate: 110, desc: 'Only comes out after dark, wrapped in striped wings like a cloak. Its crescent smile glows faintly.' },
  brooknook: { evo: ['brookstride', 18], name: 'Brooknook', type: 'Tide', base: { hp: 48, atk: 46, def: 44, spd: 60 }, exp: 54, rate: 185, desc: 'A playful riverbank critter that paddles with its leafy blue tail. It keeps a polished pebble tucked in its fur for luck.' },
  mortoad: { evo: ['rampartoad', 30], name: 'Mortoad', type: 'Stone', base: { hp: 70, atk: 62, def: 78, spd: 22 }, exp: 80, rate: 75, desc: 'An old garden-wall toad with slates for a roof and moss in every crack. It can sit still for a whole season.' },
  brashlet: { evo: ['pyrebrash', 30], name: 'Brashlet', type: 'Ember', base: { hp: 52, atk: 70, def: 46, spd: 64 }, exp: 80, rate: 75, desc: 'A cheeky little bonfire sprite with leaf-like flames for feathers. The embers in its belly flare when it gets cocky.' },
  fleecebolt: { name: 'Fleecebolt', type: 'Wild', base: { hp: 68, atk: 75, def: 58, spd: 88 }, exp: 140, rate: 90, desc: 'Its crest has grown into a mane of fiery plumes and a fan of a tail. It streaks across meadows in great bounding leaps.' },
  whirlwyn: { name: 'Whirlwyn', type: 'Gale', base: { hp: 60, atk: 68, def: 58, spd: 94 }, exp: 142, rate: 90, desc: 'Its curled wings now sweep the sky in great blue swirls. The whistle from its horn can be heard across three valleys.' },
  cloverguard: { name: 'Cloverguard', type: 'Leaf', base: { hp: 72, atk: 60, def: 88, spd: 45 }, exp: 145, rate: 90, desc: 'A sturdy beetle armoured in heart-shaped leaves. Farmers say a field it patrols never loses a crop to pests.' },
  flintburrow: { name: 'Flintburrow', type: 'Stone', base: { hp: 78, atk: 78, def: 98, spd: 30 }, exp: 150, rate: 90, desc: 'Its shell has grown into a ridge of flint plates. Its big claws can dig a tunnel through a hillside overnight.' },
  staticwing: { name: 'Staticwing', type: 'Spark', base: { hp: 60, atk: 80, def: 52, spd: 88 }, exp: 148, rate: 90, desc: 'Its golden wings crackle with gathered lightning. On summer nights it lights up the hedgerows like a lantern.' },
  duskcloak: { name: 'Duskcloak', type: 'Shade', base: { hp: 72, atk: 80, def: 70, spd: 65 }, exp: 155, rate: 80, desc: 'It drapes itself in a great striped cloak of shadow. Travellers lost at night say it has led them home.' },
  rampartoad: { name: 'Rampartoad', type: 'Stone', base: { hp: 100, atk: 90, def: 120, spd: 30 }, exp: 210, rate: 45, desc: 'A massive living rampart roofed in slate, with moss-covered pillars on its back. Each step of its crushing stone feet shakes the ground.' },
  pyrebrash: { name: 'Pyrebrash', type: 'Ember', base: { hp: 78, atk: 110, def: 70, spd: 92 }, exp: 210, rate: 45, desc: 'A towering bonfire guardian with glowing bark and a sweeping crown of burning leaves. Its ash-tipped tail leaves a trail of embers.' },
  brookstride: { name: 'Brookstride', type: 'Tide', base: { hp: 66, atk: 72, def: 60, spd: 90 }, exp: 142, rate: 90, desc: 'A sleek riverbank hunter with fins on its legs and a twin-leaf tail. It can race upstream against the strongest current.' },
  // Mossmere Bog (area 2). Second forms at 24 and third forms at 38 are still to be designed, so `evo` names a
  // placeholder id: evoOf() only evolves into species that have art in MON_ORDER.
  muddlebub: { evo: ['mirebellows', 27], name: 'Muddlebub', type: 'Tide', base: { hp: 62, atk: 50, def: 64, spd: 32 }, exp: 66, rate: 150, desc: 'A cheerful mud blob that carries clean water in the bubble above its head. Its frilled sail helps it paddle through bog pools, though a startled Muddlebub sometimes pops its own bubble.' },
  lotling: { evo: ['lotveil', 25], name: 'Lotling', type: 'Tide', base: { hp: 50, atk: 44, def: 52, spd: 62 }, exp: 64, rate: 160, desc: 'A shy water spirit sheltered inside a living lily bud. It closes its petals when frightened and leaves a trail of tiny droplets from its bulb-shaped tail.' },
  puffpiper: { evo: ['reefarer', 26], form: 'Reed Form', name: 'Puffpiper', type: 'Tide', type2: 'Gale', base: { hp: 50, atk: 54, def: 44, spd: 66 }, exp: 66, rate: 160, desc: 'An inquisitive bog diver with a leaf mask and a hollow reed snorkel. It searches underwater for interesting pebbles, with only its reed tip showing above the surface.' },
  sundrowse: { evo: ['yawnox', 28], name: 'Sundrowse', type: 'Leaf', base: { hp: 72, atk: 42, def: 66, spd: 26 }, exp: 66, rate: 150, desc: 'A sleepy moss creature that travels in slow, squashy bounces. Its sundew antenna catches moisture from the fog; when the droplets grow heavy, it nods off beneath them.' },
  tipplecup: { evo: ['brimbramble', 24], name: 'Tipplecup', type: 'Leaf', base: { hp: 52, atk: 64, def: 48, spd: 48 }, exp: 68, rate: 140, desc: 'A mischievous pitcher-plant imp that tips its lid like a hat. It offers sweet-smelling dew to visitors, then uses its sticky vine hands to investigate their belongings.' },
  glimmerjel: { evo: ['stormveil', 26], name: 'Glimmerjel', type: 'Spark', base: { hp: 50, atk: 62, def: 42, spd: 60 }, exp: 68, rate: 130, desc: 'A gentle marsh-light creature that floats above the reeds. Its ribbon tendrils gather static from the damp air, releasing little sparks whenever it gives a sleepy stretch.' },
  puffpiper_cotton: { evo: ['reefarer_cotton', 26], form: 'Cotton Form', name: 'Puffpiper', type: 'Leaf', type2: 'Gale', base: { hp: 54, atk: 44, def: 50, spd: 64 }, exp: 66, rate: 160, desc: 'A fluffy variant whose cotton-grass coat traps warm air. It bobs through chilly shallows, shaking water from its fleece before disappearing into the mist.' },
  fenfang: { evo: ['marshviper', 40], name: 'Fenfang', type: 'Tide', type2: 'Shade', base: { hp: 56, atk: 68, def: 50, spd: 60 }, exp: 80, rate: 60, desc: 'A watchful bog spirit that binds hollow reed segments into a serpentine body. It draws water through its funnel tail and fires it from its thorn-fanged hood, guarding secluded pools with fierce determination.' },
  logloom: { evo: ['hollowbark', 27], name: 'Logloom', type: 'Shade', base: { hp: 56, atk: 60, def: 70, spd: 28 }, exp: 70, rate: 100, desc: 'A bashful shadow that makes its home inside a fallen log. It tends the moss and mushrooms on its shell, pulling its wispy claws inside whenever anyone approaches too quickly.' },
  // Mossmere Bog middle forms (levels 24 to 28; their third forms at 38 are placeholders until the art exists). Marshviper is Fenfang's final form at 40.
  mirebellows: { name: 'Mirebellows', type: 'Tide', type2: 'Stone', evo: ['mirebellows_3', 38], base: { hp: 78, atk: 62, def: 82, spd: 36 }, exp: 142, rate: 90, desc: 'Its mud has set into a heavy, speckled shell crowned with a frilled sail. It wades through the deepest pools, holding its water bubble high on a curling stalk. When it bellows, the whole bog ripples.' },
  lotveil: { name: 'Lotveil', type: 'Tide', type2: 'Leaf', evo: ['lotveil_3', 38], base: { hp: 62, atk: 58, def: 62, spd: 78 }, exp: 142, rate: 90, desc: 'Its lily bud has opened into a wide-brimmed hat and a flowing petal robe. It drifts between the lily pads at dusk, drawing patterns in the water with its bulb-tipped tail.' },
  reefarer: { form: 'Reed Form', name: 'Reefarer', type: 'Tide', type2: 'Gale', evo: ['reefarer_3', 38], base: { hp: 60, atk: 70, def: 50, spd: 84 }, exp: 142, rate: 90, desc: 'A sleek diver with long leaf fins, clear goggles and a brass-gold snorkel. It shoots through flooded channels in a blur, surfacing only to blow a cheerful toot from its reed.' },
  reefarer_cotton: { form: 'Cotton Form', name: 'Reefarer', type: 'Leaf', type2: 'Gale', evo: ['reefarer_cotton_3', 38], base: { hp: 70, atk: 54, def: 72, spd: 66 }, exp: 142, rate: 90, desc: 'Its cotton-grass fleece has grown thick and heavy. It plants itself in the shallows like a soft wall, and attacks simply bounce off the fluff.' },
  yawnox: { name: 'Yawnox', type: 'Leaf', type2: 'Stone', evo: ['yawnox_3', 38], base: { hp: 90, atk: 56, def: 82, spd: 28 }, exp: 142, rate: 90, desc: 'A great mossy boulder of a creature that seldom bothers to stand up. The sticky flower on its antenna lulls passers-by to sleep, and travellers often wake up leaning against it.' },
  brimbramble: { name: 'Brimbramble', type: 'Leaf', type2: 'Shade', evo: ['brimbramble_3', 38], base: { hp: 64, atk: 80, def: 58, spd: 60 }, exp: 142, rate: 90, desc: 'It walks on twisted roots and carries its pitcher like a lantern. Glowing drops of nectar hang from its vine hands, and anything tempted close enough gets snapped up.' },
  stormveil: { name: 'Stormveil', type: 'Spark', type2: 'Tide', evo: ['stormveil_3', 38], base: { hp: 60, atk: 80, def: 52, spd: 74 }, exp: 142, rate: 90, desc: 'A glowing marsh jelly trailing long ribbon tendrils lined with sparks. On stormy nights whole swarms rise over the reeds, and the bog flickers like a sky full of lightning.' },
  hollowbark: { name: 'Hollowbark', type: 'Shade', type2: 'Leaf', evo: ['hollowbark_3', 38], base: { hp: 70, atk: 72, def: 90, spd: 30 }, exp: 142, rate: 90, desc: 'Its log has grown into a hollow old tree, crowned with moss and mushrooms. A shadow watches from inside the trunk, and dark claws creep out from the roots to guard the bog at night.' },
  marshviper: { name: 'Marshviper', type: 'Tide', type2: 'Shade', base: { hp: 80, atk: 104, def: 72, spd: 90 }, exp: 215, rate: 30, desc: 'Its reed segments have grown into a long, banded coil under a crown of marsh leaves. It rears up from still water without a ripple and fires a scalding jet from its funnel tail.' },
  // later stages: art to come
  briamble: { exp: 142, rate: 45, name: 'Briamble', type: 'Leaf', base: { hp: 65, atk: 60, def: 80, spd: 50 }, evo: ['hedgerholt', 36], desc: 'Its twig nest has grown into a tangle of bramble and thorns, with ripening seed pods tucked inside. Its white whiskers rustle like dry leaves.' },
  hedgerholt: { name: 'Hedgerholt', type: 'Leaf', base: { hp: 85, atk: 80, def: 100, spd: 60 } },
  kilnook: { exp: 142, rate: 45, name: 'Kilnook', type: 'Ember', base: { hp: 70, atk: 80, def: 65, spd: 45 }, evo: ['hearthrusk', 36], desc: 'Its clay plates have hardened like fired brick. Three furnace vents roar along its back, and its fists are hot enough to bake bread.' },
  hearthrusk: { name: 'Hearthrusk', type: 'Ember', base: { hp: 90, atk: 105, def: 80, spd: 55 } },
  weirlet: { exp: 142, rate: 45, name: 'Weirlet', type: 'Tide', base: { hp: 65, atk: 60, def: 60, spd: 80 }, evo: ['merewheel', 36], desc: 'The spring pool on its back has deepened, and its flower tail now spins like a little water wheel. It can turn a stream to follow it.' },
  merewheel: { name: 'Merewheel', type: 'Tide', base: { hp: 85, atk: 80, def: 80, spd: 100 } },
};
const TEAM_MAX = 6, ROAM_MAX = 8;
const IV_KEYS = ['hp', 'atk', 'def', 'spd'], IV_NAME = { hp: 'HP', atk: 'Attack', def: 'Defence', spd: 'Speed' };
const rollIV = (lo = 1) => Object.fromEntries(IV_KEYS.map(k => [k, lo + Math.floor(Math.random() * (11 - lo))]));
const ivMul = (m, k) => 1 + ((m.iv && m.iv[k]) || 5) * .01;   // each point of potential adds 1%: 1 = +1%, 10 = +10%
const monStat = (m, k) => { const b = SPECIES[m.sp].base[k]; return Math.floor((k === 'hp' ? Math.floor(b * 2 * m.lv / 100) + m.lv + 10 : Math.floor(b * 2 * m.lv / 100) + 5) * ivMul(m, k)); };
const monName = m => m.nick || SPECIES[m.sp].name;
const healAmt = (id, m) => Math.max(1, Math.ceil(monStat(m, 'hp') * ITEMS[id].heal / 100));   // healing items restore a share of max HP
const team = () => S.mons.filter(m => m.loc === 'team');
const lead = () => team()[0] || null;
function newMon(sp, lv = 5) { const m = { uid: S.nextId++, sp, nick: '', lv, xp: lv ** 3, loc: 'team', out: false, bond: 0, moves: movesAt(sp, lv), iv: rollIV() }; m.hp = monStat(m, 'hp'); return m; }
function fixMon(m) { if (!m.iv) m.iv = rollIV(4); if (!m.moves || !m.moves.length) m.moves = movesAt(m.sp, m.lv); if (!(m.xp >= m.lv ** 3)) m.xp = m.lv ** 3; m.hp = Math.min(m.hp ?? 999, monStat(m, 'hp')); return m; }
function giveMon(m) {
  if (team().length >= TEAM_MAX) { m.loc = 'ranch'; }
  S.mons.push(m); refreshTeamBtn();
  return m.loc;
}

/* ---------- pictures cut from the sheets at startup */
const MONPIC = {};
function loadMonPics() {
  const cut = (img, x, y, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, x, y, w, h, 0, 0, w, h); return c.toDataURL(); };
  return Promise.all([loadImg(ASSET.monIcons), loadImg(ASSET.monBattle)]).then(([ic, bt]) => {
    MON_ORDER.forEach((sp, i) => { MONPIC[sp] = { icon: cut(ic, i * 48, 0, 48, 48), front: cut(bt, 0, i * 64, 64, 64), back: cut(bt, 64, i * 64, 64, 64) }; });
  });
}
const monPic = (sp, k = 'icon') => (MONPIC[sp] || MONPIC[MON_ORDER[MON_ORDER.indexOf(sp) >= 0 ? MON_ORDER.indexOf(sp) : 0]] || {})[k] || '';

let teamBtnKey = null;
function refreshTeamBtn() {
  const b = $('bTeam'); if (!b || !S) return;
  const m = lead() || S.mons[0], key = m ? m.sp : '';
  b.style.display = S.mons.length ? 'flex' : 'none';
  if (key !== teamBtnKey) { teamBtnKey = key; b.innerHTML = m ? `<img src="${monPic(m.sp)}" style="width:36px;height:36px">` : ''; }
}

/* ---------- team screen */
function typeChip(t) { if (SPECIES[t]) return typesOf(t).map(typeChip).join(''); return `<span class="tchip" style="background:${TYPES[t]}">${t}</span>`; }
function hpBar(m) { const mx = monStat(m, 'hp'), v = Math.max(0, Math.min(m.hp ?? mx, mx)), pc = v / mx; return `<span class="hpwrap"><span class="hpl">HP</span><span class="hpb"><i style="width:${100 * pc}%;background:${pc > .5 ? '#5cc85a' : pc > .2 ? '#f0b02a' : '#e0503a'}"></i></span></span><span class="hpn">${v}/${mx}</span>`; }
const badge = (sp, size = 52) => `<span class="mbadge" style="--tc:${TYPES[SPECIES[sp].type]};width:${size}px;height:${size}px"><img src="${monPic(sp)}"></span>`;
function monRow(m, buttons, lead) {
  return `<div class="mrow${lead ? ' lead' : ''}" style="--tc:${TYPES[SPECIES[m.sp].type]}">${badge(m.sp)}<div class="g"><div class="mn">${monName(m)}<span class="lv">Lv ${m.lv}</span></div><div class="mt">${typeChip(m.sp)}${hpBar(m)}</div></div><div class="mb">${buttons}</div></div>`;
}
function openTeam() {
  const render = () => {
    const t = team();
    if (!S.mons.length) return '<p>You have no Fablemon yet. Elder Bramble in Smallroot might know where to find one.</p>';
    const rows = t.map((m, i) => monRow(m, `${i ? `<button class="btn sm" data-a="lead" data-u="${m.uid}">Lead</button>` : '<span class="follow">★ Following</span>'}<button class="btn gold sm" data-a="info" data-u="${m.uid}">Info</button>`, !i)).join('');
    const away = S.mons.length - t.length;
    const pips = Array.from({ length: TEAM_MAX }, (_, i) => `<i class="${i < t.length ? 'on' : ''}"></i>`).join('');
    const crests = Object.keys(S.crests || {}).length ? `<div class="subbar"><span>Crests: ${Object.keys(CREST_INFO).filter(k => S.crests[k]).map(k => `<span class="tchip" style="background:${CREST_INFO[k][1]}">${CREST_INFO[k][0]}</span>`).join(' ')}</span></div>` : '';
    return `<div class="subbar"><span>Team <b>${t.length}/${TEAM_MAX}</b> <span class="pips">${pips}</span></span><button class="btn sm" data-a="journal">📖 Journal</button></div>${crests}<div class="mlist">${rows || '<p>Your team is empty. Visit the ranch to bring a Fablemon along.</p>'}</div><p class="hint">The first Fablemon follows you around.${away ? ` ${away} more at your ranch.` : ''}</p>`;
  };
  openModal('Fablemon team', render(), (a, d) => {
    if (a === 'journal') return openJournal();
    const m = S.mons.find(x => x.uid === +d.u); if (!m) return;
    if (a === 'lead') { S.mons.splice(S.mons.indexOf(m), 1); S.mons.unshift(m); refreshTeamBtn(); if (scene && scene.refreshFollower) scene.refreshFollower(); $('mBody').innerHTML = render(); }
    if (a === 'info') openMonInfo(m, openTeam);
  });
}
const HABITAT = sp => {
  if (STARTERS.includes(sp)) return 'The roots of the Hearthroot, Smallroot';
  { const prev = Object.keys(SPECIES).find(k => SPECIES[k].evo && SPECIES[k].evo[0] === sp); if (prev) return `Evolves from ${SPECIES[prev].name} at level ${SPECIES[prev].evo[1]}`; }
  { const H = { muddlebub: 'Mossmere Bog and Sluice Fen', lotling: 'Mossmere Bog and Sluice Fen', puffpiper: 'Sluice Fen: the Reed Form dives in the flooded channels', puffpiper_cotton: 'Mossmere Bog: the Cotton Form drifts over the grass', sundrowse: 'Mossmere Bog and Sluice Fen', tipplecup: 'Mossmere Bog and Sluice Fen', glimmerjel: 'Mossmere Bog and Sluice Fen, mostly after dark', logloom: 'The far end of Mossmere Bog, and anywhere at night', fenfang: 'Rare: the south island of Sluice Fen, and Mossmere Bog after dark', mirebellows: 'Not found wild yet: evolve Muddlebub', lotveil: 'Not found wild yet: evolve Lotling', reefarer: 'Not found wild yet: evolve a Reed Form Puffpiper', reefarer_cotton: 'Not found wild yet: evolve a Cotton Form Puffpiper', yawnox: 'Not found wild yet: evolve Sundrowse', brimbramble: 'Not found wild yet: evolve Tipplecup', stormveil: 'Not found wild yet: evolve Glimmerjel', hollowbark: 'Not found wild yet: evolve Logloom', marshviper: 'Not found wild yet: evolve Fenfang' }; if (H[sp]) return H[sp]; }
  if (sp === 'brooknook') return 'Brookside Lane long grass, and the grass by the brook on the Meadow Trail';
  if (sp === 'mortoad' || sp === 'brashlet') return 'Brookside Lane long grass, the lower half near the Warden\'s Garden';
  const d = ENCOUNTERS.day.some(([s]) => s === sp), n = ENCOUNTERS.night.some(([s]) => s === sp);
  if (ROUTES.route2.enc.day.some(([s]) => s === sp) && !(d || n)) return 'Brookside Lane long grass';
  return d || n ? `Meadow Trail and Brookside Lane long grass${d && n ? ', day and night' : n ? ', at night only' : ', in the daytime'}` : 'Unknown';
};
// the whole evolution line, with levels; unknown or future forms show as ???
function evoChain(sp) {
  let s = baseOf(sp); const out = [];
  for (let k = 0; k < 4 && s; k++) {
    const known = SPECIES[s] && MON_ORDER.includes(s), seen = known && (S.seen[s] || S.caught[s]);
    out.push(s === sp ? `<b>${SPECIES[s].name}</b>` : seen ? SPECIES[s].name : '???');
    const e = SPECIES[s] && SPECIES[s].evo; if (!e) break;
    out.push(`<span style="opacity:.7">→ Lv ${e[1]} →</span>`); s = e[0];
  }
  return out.length > 1 ? out.join(' ') : 'Does not evolve';
}
function openJournal(focus) {
  const list = MON_ORDER, seen = list.filter(sp => S.seen[sp] || S.caught[sp] || S.mons.some(m => m.sp === sp)), caught = list.filter(sp => S.caught[sp] || S.mons.some(m => m.sp === sp));
  const card = (sp, i) => {
    const has = caught.includes(sp), saw = seen.includes(sp), num = String(i + 1).padStart(3, '0');
    return `<button class="jcard ${has ? 'caught' : saw ? 'seen' : 'unknown'}" data-a="${saw ? 'view' : ''}" data-sp="${sp}" style="--tc:${saw ? TYPES[SPECIES[sp].type] : '#8a7a5e'}"><span class="jn">#${num}</span><img src="${monPic(sp)}">${has ? '<span class="jc">●</span>' : ''}<span class="jname">${saw ? SPECIES[sp].name : '???'}</span></button>`;
  };
  const grid = () => `<div class="subbar"><span>Seen <b>${seen.length}</b> · Caught <b>${caught.length}</b> <small>of ${list.length}</small></span></div><div class="jgrid">${list.map(card).join('')}</div><p class="hint">Tap a Fablemon you've seen to read about it. ● means you've caught one.</p>`;
  const page = sp => {
    const s0 = SPECIES[sp], has = caught.includes(sp), i = list.indexOf(sp);
    return `<div style="display:flex;gap:12px;align-items:center"><span class="showcase" style="--tc:${TYPES[s0.type]}"><img src="${monPic(sp, 'front')}"></span><div><div class="jn">#${String(i + 1).padStart(3, '0')}</div><b style="font-size:20px" class="pixt">${s0.name}</b>${s0.form ? ` <small>(${s0.form})</small>` : ''}<br>${typeChip(sp)}${has ? '<span class="tchip" style="background:#c0392b">Caught</span>' : '<span class="tchip" style="background:#8a7a5e">Seen</span>'}</div></div>
      <p>${has ? s0.desc : 'You have only glimpsed this Fablemon. Catch one to learn more about it.'}</p>
      <p><small><b>Found:</b> ${HABITAT(sp)}</small></p>${has ? `<p><small><b>Role:</b> ${LINE_ROLE[baseOf(sp)] || 'Unknown'}</small></p>
      <p><small><b>Evolution:</b> ${evoChain(sp)}</small></p>
      <p><small><b>Base stats:</b> HP ${s0.base.hp} · Attack ${s0.base.atk} · Defence ${s0.base.def} · Speed ${s0.base.spd}</small></p>
      <p style="margin:8px 0 4px"><b>Moves it learns</b></p><div class="jmoves">${(LEARN[sp] || []).map(([l, id]) => `<div class="jmv" style="--tc:${TYPES[MOVES[id].type]}"><span class="jl">Lv ${l}</span><b>${MOVES[id].name}</b><span class="tchip" style="background:${TYPES[MOVES[id].type]}">${MOVES[id].type}</span><small>${moveTag(id)}</small></div>`).join('')}</div>` : ''}
      <div class="row"><button class="btn" data-a="back">Back to Journal</button></div>`;
  };
  openModal('Fablemon Journal', focus ? page(focus) : grid(), (a, d) => {
    if (a === 'view') { $('mTitle').textContent = SPECIES[d.sp].name; $('mBody').innerHTML = page(d.sp); }
    if (a === 'back') { $('mTitle').textContent = 'Fablemon Journal'; $('mBody').innerHTML = grid(); }
  });
}
function openMonInfo(m, back) {
  const sp = SPECIES[m.sp];
  const render = () => `<div style="display:flex;gap:12px;align-items:center"><span class="showcase" style="--tc:${TYPES[sp.type]}"><img src="${monPic(m.sp, 'front')}"></span>
    <div><b style="font-size:18px">${monName(m)}</b>${m.nick ? `<br><small>${sp.name}</small>` : ''}<br>${typeChip(m.sp)} <b>Lv ${m.lv}</b><br>${hpBar(m)}<br><small>Bond: ${'♥'.repeat(Math.min(5, Math.ceil(m.bond / 4))) || '–'}</small></div></div>
    <p>${sp.desc || ''}</p>
    <p><small>Attack ${monStat(m, 'atk')} · Defence ${monStat(m, 'def')} · Speed ${monStat(m, 'spd')} · XP to next level: ${Math.max(0, xpNext(m) - m.xp)}</small></p>
    ${ivPanel(m)}
    ${m.uid >= 0 ? heldRow(m) : ''}
    <p style="margin:10px 0 4px;display:flex;justify-content:space-between;align-items:center"><b>Moves</b>${m.uid >= 0 ? '<button class="btn sm" data-a="moves">Change moves</button>' : ''}</p>${(m.moves || []).map(id => moveCard(id, m)).join('')}
    ${(() => { const nx = (LEARN[m.sp] || []).find(([l, id]) => l > m.lv && !m.moves.includes(id)); return nx ? `<p class="hint">Next new move: <b>${MOVES[nx[1]].name}</b> at level ${nx[0]}.</p>` : ''; })()}
    ${m.hp < monStat(m, 'hp') ? `<div class="row" style="display:flex;gap:6px;flex-wrap:wrap">${Object.keys(ITEMS).filter(id => ITEMS[id].heal && inv.count(id)).map(id => `<button class="btn gold sm" data-a="feed" data-id="${id}"><img src="${iconFor(id)}" style="width:18px;vertical-align:middle;image-rendering:pixelated"> ${ITEMS[id].name} (${inv.count(id)})</button>`).join('')}</div>` : ''}
    <div class="row" style="display:flex;gap:6px;align-items:center"><input id="nick" maxlength="12" placeholder="Nickname" value="${m.nick}" style="font-family:inherit;font-size:15px;padding:6px;border:2px solid var(--green);border-radius:6px;flex:1;min-width:0"><button class="btn gold" data-a="rename">Rename</button></div>
    <div class="row" style="margin-top:8px"><button class="btn" data-a="back">Back</button></div>`;
  openModal(monName(m), render(), (a, dd) => {
    if (a === 'feed') { const d = dd; if (!inv.remove(d.id, 1)) return; m.hp = Math.min(monStat(m, 'hp'), m.hp + healAmt(d.id, m)); if (ITEMS[d.id].cure) m.status = null; renderHotbar(); Sound.play('pop'); $('mBody').innerHTML = render(); return; }
    if (a === 'moves') return openMoveSwap(m, () => openMonInfo(m, back));
    if (a === 'held') return openHeldPicker(m, () => openMonInfo(m, back));
    if (a === 'rename') { m.nick = $('nick').value.trim().slice(0, 12); toast(`Now called ${monName(m)}`, 1200); $('mTitle').textContent = monName(m); }
    if (a === 'back') back ? back() : closeModal();
  });
}

/* ---------- choosing your partner */
const STARTER_INTRO = [
  { who: 'bramble', f: 1, t: 'Before you go, {name}, come and look at this.' },
  { who: 'bramble', f: 2, t: "Something has been stirring in the Hearthroot's roots since the day you arrived." },
  { who: 'bramble', f: 3, t: "Three young Fablemon! I haven't seen wild ones in Smallroot for years." },
  { who: 'bramble', f: 0, t: "I think they've been waiting for someone. Go on, see which one takes to you." },
];
function openStarterPick() {
  const cards = STARTERS.map(sp => { const s = SPECIES[sp]; return `<div class="shoprow" style="align-items:flex-start"><img src="${monPic(sp, 'front')}" style="width:72px;height:72px"><div class="g"><b>${s.name}</b>${typeChip(s.type)}<small style="display:block;margin-top:3px">${s.desc}</small></div><button class="btn gold" data-a="pick" data-sp="${sp}">Choose</button></div>`; }).join('');
  openModal('Choose your partner', `<p>Three Fablemon peek out from the roots of the Hearthroot.</p><div class="mlist">${cards}</div>`, (a, d) => {
    if (a !== 'pick' || S.mons.length) return;
    const m = newMon(d.sp); giveMon(m);
    modalClose = null; closeModal(); Sound.play('coin');
    if (scene && scene.refreshFollower) scene.refreshFollower();
    Talk.say([
      { who: 'bramble', f: 3, t: `${SPECIES[d.sp].name}! It chose you as much as you chose it.` },
      { who: 'bramble', f: 0, t: 'The old wardens used to say a Fablemon and its keeper grow stronger together. Look after each other.' },
      { who: 'bramble', f: 1, t: "Your farm has plenty of room. Build a ranch there and any Fablemon you meet will have a home." },
      ...CHARM_GIFT,
    ], () => { giveCharms(); toast(`${SPECIES[d.sp].name} joined your team! Tap its picture at the top to see your team.`, 3500); });
  });
}

/* ---------- follower (mixed into every World scene) */
const evoOf = m => { const e = SPECIES[m.sp].evo; return e && MON_ORDER.includes(e[0]) && m.lv >= e[1] ? e[0] : null; };
const baseOf = sp => { const prev = Object.keys(SPECIES).find(k => SPECIES[k].evo && SPECIES[k].evo[0] === sp); return prev ? baseOf(prev) : sp; };
// evolved forms use their first stage's walking sprite until their own sheet is added
const walkSp = sp => ASSET['mon_' + sp] ? sp : baseOf(sp);
function monAnims(sc, sp) {
  for (let r = 0; r < 4; r++) { const k = `${sp}_${DIRS[r]}`; if (!sc.anims.exists(k)) sc.anims.create({ key: k, frames: sc.anims.generateFrameNumbers('mon_' + sp, { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 8, repeat: -1 }); }
}
Object.assign(World.prototype, {
  makeFollower() {
    if (this.fol) { this.fol.spr.destroy(); this.fol = null; }
    const m = lead(); if (!m || !this.textures.exists('mon_' + walkSp(m.sp))) return;
    monAnims(this, walkSp(m.sp));
    const p = this.p, [dx, dy] = DV[p.dir];
    let x = p.x - dx, y = p.y - dy; if (!this.passable(x, y)) { x = p.x; y = p.y; }
    const spr = this.add.sprite(0, 0, 'mon_' + walkSp(m.sp), DIRS.indexOf(p.dir) * 4).setOrigin(.5, 1);
    this.fol = { m, spr, x, y, px: x * T + 8, py: y * T + 8, dir: p.dir, moving: false, bob: 0, bt: 0 };
    this.shadow(spr, Math.round(spr.width * .55), 5);
    this.drawFollower();
  },
  refreshFollower() { if (this.p) this.makeFollower(); },
  followStep(ox, oy) {
    const f = this.fol; if (!f) return;
    if (f.x === ox && f.y === oy) return;
    const dx = ox * T + 8 - f.px, dy = oy * T + 8 - f.py;
    f.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    f.x = ox; f.y = oy; f.moving = true;
    const k = `${walkSp(f.m.sp)}_${f.dir}`; if (f.spr.anims.currentAnim?.key !== k || !f.spr.anims.isPlaying) f.spr.play(k);
  },
  updateFollower(dt) {
    const f = this.fol; if (!f) return;
    if (f.moving) {
      const tx = f.x * T + 8, ty = f.y * T + 8, dx = tx - f.px, dy = ty - f.py, d = Math.hypot(dx, dy), sp = 5.2 * T * 1.3 * dt * (d > 20 ? 1.8 : 1);
      if (d <= sp) { f.px = tx; f.py = ty; f.moving = false; } else { f.px += dx / d * sp; f.py += dy / d * sp; }
      this.drawFollower();
      f.bob = 0;
    } else if (f.spr.anims.isPlaying && !this.p.moving) { f.spr.stop(); f.spr.setFrame(DIRS.indexOf(f.dir) * 4); }
    // a little idle bounce while it waits for you
    if (!f.moving) { f.bt += dt; const b = Math.sin(f.bt * 4.2) > .55 ? -1 : 0; if (b !== f.bob) { f.bob = b; this.drawFollower(); } }
  },
  drawFollower() { const f = this.fol; f.spr.setPosition(Math.round(f.px), Math.round(f.py) + 7 + (f.bob || 0)).setDepth(f.py + 6.5); },
});

/* ---------- the ranch on the farm */
const RANCH = { cx: 40, by: 15, door: -1, sign: { x: 34, y: 17 }, area: [35, 9, 45, 16], cost: { wood: 60, stone: 30 }, gold: 500 };
const ranchPos = () => S.ranchAt || { cx: RANCH.cx, by: RANCH.by };
const ranchArea = (at = ranchPos()) => [at.cx - 5, at.by - 6, at.cx + 5, at.by + 1];
const ranchDoor = () => { const at = ranchPos(); return { x: at.cx + RANCH.door, y: at.by }; };
const RANCH_BUILD = () => ({
  name: 'Ranch', atlas: 'town', frame: 'ranch', at: { ...ranchPos() }, areaFor: ranchArea, cost: RANCH.cost, gold: goldCut(RANCH.gold),
  desc: "A barn and pens for Fablemon you aren't taking with you. Built overnight by the villagers.",
  onBuild: at => { S.ranchAt = at; S.ranch = 1; toast('The villagers will build your ranch tonight!', 2600); },
});
function openRanch() {
  const render = () => {
    const t = team(), r = S.mons.filter(m => m.loc === 'ranch'), out = r.filter(m => m.out).length;
    const tr = t.map(m => monRow(m, `<button class="btn" data-a="toRanch" data-u="${m.uid}">Leave here</button>`)).join('');
    const rr = r.map(m => { const J = jobOf(m); return monRow(m, `${J ? `<button class="btn sm ${m.job ? 'gold' : ''}" data-a="job" data-u="${m.uid}">${m.job ? '⚒ ' + J.name : 'Give job'}</button>` : ''}${m.job ? `<button class="btn sm" data-a="stopjob" data-u="${m.uid}">Stop work</button>` : `<button class="btn sm ${m.out ? 'gold' : ''}" data-a="roam" data-u="${m.uid}">${m.out ? 'On the farm' : 'In the barn'}</button>`}<button class="btn sm" data-a="toTeam" data-u="${m.uid}" ${t.length >= TEAM_MAX ? 'disabled' : ''}>Take</button>`); }).join('');
    const st = Object.entries(S.workStore || {}).filter(([, n]) => n);
    const store = st.length ? `<div class="subbar"><span>Your Fablemon gathered: ${st.map(([id, n]) => `<span class="need"><img src="${iconFor(id)}">${n}</span>`).join('')}</span><button class="btn gold sm" data-a="collect">Collect</button></div>` : '';
    return `${store}<div class="mlist"><p><b>With you (${t.length}/${TEAM_MAX})</b></p>${tr || '<p><small>Nobody. Take a Fablemon along so you are not adventuring alone.</small></p>'}
      <p style="margin-top:10px"><b>At the ranch</b> <small>(${out}/${ROAM_MAX} out on the farm)</small></p>${rr || '<p><small>No one lives here yet. Leave a Fablemon here, and any you befriend when your team is full will come here too.</small></p>'}</div>`;
  };
  openModal('Your ranch', render(), (a, d) => {
    if (a === 'collect') {
      for (const [id, n] of Object.entries(S.workStore || {})) { const left = inv.add(id, n); S.workStore[id] = left; }
      const full = Object.values(S.workStore).some(n => n); Sound.play('coin'); renderHotbar(); if (full) toast('Your backpack is full. Some items are still waiting at the ranch.');
      $('mBody').innerHTML = render(); return;
    }
    const m = S.mons.find(x => x.uid === +d.u); if (!m) return;
    if (a === 'job') return openJobPicker(m);
    if (a === 'stopjob') { m.job = null; }
    if (a === 'toRanch') { m.loc = 'ranch'; m.out = S.mons.filter(x => x.loc === 'ranch' && x.out).length < ROAM_MAX; }
    if (a === 'toTeam') { if (team().length >= TEAM_MAX) return; m.loc = 'team'; m.out = false; m.job = null; S.mons.splice(S.mons.indexOf(m), 1); S.mons.splice(team().length, 0, m); }
    if (a === 'roam') { if (!m.out && S.mons.filter(x => x.loc === 'ranch' && x.out).length >= ROAM_MAX) return toast(`Only ${ROAM_MAX} can be out at once.`); m.out = !m.out; }
    refreshTeamBtn(); $('mBody').innerHTML = render();
  }, () => { if (scene && scene.spawnRoamers) { scene.refreshFollower(); scene.spawnRoamers(); } });
}

/* -------------------------------------------------------------- quests
   Elder Bramble's to-do list. Each task checks the save, pays out once, and
   the tracker under the clock always shows the next one. */
const QUESTS = [
  { id: 'mail', name: 'Check your mailbox', hint: 'The mailbox is beside your front door.', done: () => S.mailRead, reward: {} },
  { id: 'plant', name: 'Plant your first crop', hint: 'Till soil with the hoe, plant turnip seeds, then water them.', done: () => Object.values(S.tilled).some(t => t.crop), reward: { gold: 100 } },
  { id: 'ship', name: 'Put something in the shipping bin', hint: 'Crops, wood, stone and fiber can all be sold. You\'re paid the next morning.', done: () => S.flags.shipped, reward: { gold: 100 } },
  { id: 'town', name: 'Visit Smallroot and meet Elder Bramble', hint: 'Walk off the east side of your farm, along the road.', done: () => S.town.met.bramble, reward: {} },
  { id: 'starter', name: 'Choose your first Fablemon', hint: 'Talk to Elder Bramble in the square.', done: () => S.mons.length > 0, reward: { items: { berry: 3 } } },
  { id: 'catch', name: 'Befriend a wild Fablemon', hint: 'Walk through the long grass on the Meadow Trail, south of your farm. Weaken one, then throw a Root Charm.', done: () => (S.flags.catches || 0) >= 1 || S.mons.length >= 2, reward: { items: { root_charm: 5 } } },
  { id: 'team3', name: 'Have 3 Fablemon', hint: 'Keep catching! They can live at your ranch if your team is full.', done: () => S.mons.length >= 3, reward: { gold: 300 } },
  { id: 'trainers1', name: 'Beat the 4 trainers on the Meadow Trail', hint: 'They challenge you when you walk into their line of sight.', done: () => ['mt1', 'mt2', 'mt3', 'mt4'].every(beatTrainer), reward: { gold: 500 } },
  { id: 'ranch', name: 'Build a ranch on your farm', hint: 'Tap the signpost west of your shipping bin.', done: () => S.ranch === 2, reward: { items: { honey: 2 } } },
  { id: 'job', name: 'Give a Fablemon a farm job', hint: 'Leave a Fablemon at your ranch, open the ranch and tap Give job.', done: () => S.mons.some(m => m.job), reward: { gold: 300 } },
  { id: 'cook', name: 'Cook a meal', hint: 'Craft a Cooking Pot (Farm tab), place it and tap it.', done: () => S.flags.cooked, reward: { items: { berry: 3 } } },
  { id: 'repair', name: 'Fund a repair in Smallroot', hint: 'Use the notice board in front of the Hearthroot.', done: () => Object.keys(S.town.done).length + Object.keys(S.town.pending).length > 0, reward: { gold: 400 } },
  { id: 'lane', name: 'Reach Brookside Lane', hint: 'Follow the Meadow Trail all the way south.', done: () => S.visited && S.visited.route2, reward: { items: { root_charm: 5 } } },
  { id: 'warden', name: 'Earn the Root Crest from Warden Mabel', hint: 'She waits in the walled garden at the end of Brookside Lane. Rest at the spring well first!', done: () => S.crests && S.crests.root, reward: { gold: 1000, items: { mon_treat: 2 } } },
  { id: 'bog', name: 'Cross Mossmere Bog', hint: 'Head east from the middle of Brookside Lane, past the old rockfall. Beat all five keepers in the bog.', done: () => ['mb1', 'mb2', 'mb3', 'mb4', 'mb5'].every(beatTrainer), reward: { gold: 1500, items: { sturdy_charm: 3 } } },
  { id: 'fen', name: 'Solve Sluice Fen', hint: 'Past Mossmere Bog, the fen is cut up by flooded channels. Pull the old levers to drain a way through to the far side.', done: () => !!(S.visited && S.visited.fenDone), reward: { gold: 1500, items: { mon_treat: 2 } } },
  { id: 'brook', name: 'Earn the Brook Crest from Warden Delphine', hint: "Cross Sluice Fen to Brookholt. Fund two repairs on the town's notice board, then challenge Delphine at the Lock House. Her Tide team is level 20–24.", done: () => S.crests && S.crests.brook, reward: { gold: 1500, items: { tonic: 3 } } },
  { id: 'restore', name: 'Restore all of Smallroot', get hint() { return `Fund every repair on the notice board (${smallrootDone()}/${Object.keys(PROJECTS).length} so far). Warden Rowan won't battle until the whole town is back on its feet.`; }, done: () => smallrootDone() >= Object.keys(PROJECTS).length, reward: { gold: 3000 } },
  { id: 'rowan', name: 'Earn the Hearth Crest from Warden Rowan', get hint() { return `Rowan is the last Warden. He'll battle once you hold the other 7 Crests (${otherCrests()}/7) and all of Smallroot is restored. His team is level 68–72.`; }, done: () => S.crests && S.crests.hearth, reward: { gold: 5000, items: { sturdy_charm: 5 } } },
];
const questDone = q => !!S.quests[q.id];
const activeQuest = () => QUESTS.find(q => !questDone(q));
function rewardText(r) { return [r.gold ? `${r.gold}g` : '', ...Object.entries(r.items || {}).map(([id, n]) => `${n} ${ITEMS[id].name}`)].filter(Boolean).join(', '); }
function checkQuests() {
  if (!S || !S.quests || !inv || Battle.active || $('hud').style.display !== 'block') return;
  for (const q of QUESTS) {
    if (questDone(q)) continue;
    if (!q.done()) continue;
    S.quests[q.id] = 1;
    const r = q.reward || {}; if (r.gold) S.gold += r.gold;
    for (const [id, n] of Object.entries(r.items || {})) inv.add(id, n);
    updateHUD(); renderHotbar(); Sound.play('levelup');
    toast(`✔ Task complete: ${q.name}${rewardText(r) ? ' · Reward: ' + rewardText(r) : ''}`, 3200);
  }
  renderQuest();
}
let questKey = '';
function renderQuest() {
  const q = activeQuest(), el = $('quest'); if (!el) return;
  el.style.top = ($('clock').getBoundingClientRect().bottom + 6) + 'px';
  const key = q ? q.id : 'none'; if (key === questKey) return; questKey = key;
  el.innerHTML = q ? `<b>📜 ${q.name}</b>` : '<b>📜 All tasks done! More to come.</b>';
}
function openQuests() {
  const rows = QUESTS.map(q => {
    const d = questDone(q), cur = q === activeQuest();
    return `<div class="proj" style="${d ? 'opacity:.6' : cur ? 'border-color:#c9a64e;background:#fff6dc' : ''}"><b>${d ? '✔ ' : cur ? '▶ ' : ''}${q.name}</b>${rewardText(q.reward) ? `<span class="st">${rewardText(q.reward)}</span>` : ''}${cur ? `<br><small>${q.hint}</small>` : ''}</div>`;
  }).join('');
  openModal("Bramble's tasks", `<p class="hint">Elder Bramble's list of things to try. Each one pays a reward when you finish it.</p><div class="mlist">${rows}</div>`);
}
setInterval(() => { try { checkQuests(); } catch (e) { } }, 1000);

/* ------------------------------------------------------------ farm jobs
   Fablemon at the ranch can be given a 7x7 work area on the farm. They work in
   real time; fully evolved Fablemon work four times faster than first-stage ones. */
const MON_STAGE = { brookstride: 2, rampartoad: 2.5, pyrebrash: 2.5, briamble: 2, kilnook: 2, weirlet: 2, fleecebolt: 2, whirlwyn: 2, cloverguard: 2, flintburrow: 2, staticwing: 2, duskcloak: 2, hedgerholt: 3, hearthrusk: 3, merewheel: 3 };
const JOBS = {
  Tide: { name: 'Waterer', desc: 'Waters dry soil in its area.' },
  Leaf: { name: 'Gardener', desc: 'Plants seeds from any chest in its area onto empty tilled soil there, and clears weeds and bushes (the fiber goes to a chest in the area, or your ranch).' },
  Wild: { name: 'Lumberjack', desc: 'Chops trees and stumps in its area. The wood goes to your ranch.' },
  Stone: { name: 'Rock Collector', desc: 'Breaks up rocks in its area, and chips away at any Mine there for a steady supply of stone. The stone goes to your ranch.' },
  Ember: { name: 'Cook', desc: 'With a Cooking Pot and a chest in its area, it cooks the best meal it can from the chest\'s ingredients (using 1 wood each) and puts the dish back in the chest. Turn this off for any chest from inside it. Otherwise it warms tilled soil so the next crop grows a day faster.' },
  Gale: { name: 'Harvester', desc: 'Picks ripe crops, and collects honey, fertiliser and fish from beehives, compost bins and fishing huts in its area. Everything goes into a chest in the area, or to your ranch.' },
  Spark: { name: 'Charger', desc: 'Charges compost bins and beehives in its area so they finish a day sooner. (It will power machines later.)' },
  Shade: { name: 'Night Forager', desc: 'Works after 7pm, finding Hearthberries and the odd Root Charm in its area.' },
};
const JOB_R = 3;
const jobArea = j => [j.x - JOB_R, j.y - JOB_R, j.x + JOB_R, j.y + JOB_R];
const monStage = m => MON_STAGE[m.sp] || 1;
const jobOf = m => JOBS[SPECIES[m.sp].type];
const workers = () => S.ranch === 2 ? S.mons.filter(m => m.loc === 'ranch' && m.out && m.job && jobOf(m)) : [];
const byStage = (arr, st) => st % 1 ? (arr[Math.floor(st)] + arr[Math.ceil(st)]) / 2 : arr[st];
function jobInterval(m) { if (m.mining) return byStage(MINE_TIME, monStage(m)) * fedMul(m); let s = byStage([0, 24, 12, 6], monStage(m)) * (SPECIES[m.sp].type === 'Wild' ? 2 : 1); s *= 1 - Math.min(.3, m.lv / 100); s *= fedMul(m); return s; }
const isNight = () => S.time >= 1140 || S.time < 360;
const grassFree = (x, y) => { const k = x + ',' + y, i = y * W + x; return farm && !farm.blocked[i] && farm.occ[i] < 0 && !farm.dirtish[i] && !farm.waterish[i] && !S.tilled[k] && !S.paths[k] && !S.fences[k] && !S.objs[k] && !(scene && scene.isHouseZone && scene.isHouseZone(x, y)); };
function jobTargets(m, area) {
  const [x0, y0, x1, y1] = area || jobArea(m.job), type = SPECIES[m.sp].type, out = [];
  const chests = chestsIn([x0, y0, x1, y1]);
  // Leaf: seeds from a chest go into empty tilled soil (planting comes before weeding)
  if (type === 'Leaf' && chests.length) {
    const seeds = [...new Set(chests.flatMap(c => c.o.items.filter(s => s && ITEMS[s.id].seed && !(c.o.lock || {})[s.id]).map(s => s.id)))];
    if (seeds.length) for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      const tl = S.tilled[x + ',' + y]; if (!tl || tl.crop) continue;
      const sd = seeds.find(id => canPlantAt(x, y, ITEMS[id].seed)); if (sd) out.push({ x, y, plant: sd, pri: 0 });
    }
  }
  // Ember: cook at a pot when a chest nearby has the ingredients
  if (type === 'Ember' && chests.length && S.time >= 360 && S.time < 1320) {
    const pot = potIn([x0, y0, x1, y1]), r = pot && bestRecipe(chests.filter(c => !c.o.noCook));
    if (r) return [{ x: pot.x, y: pot.y, cook: r }];
  }
  // Gale: collect from beehives, compost bins and fishing huts
  if (type === 'Gale') for (const [k, o] of Object.entries(S.objs)) {
    if (o.part) continue; const [x, y] = k.split(',').map(Number); if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    if (objReady(o)) out.push({ x, y, collect: k });
  }
  const kinds = { Leaf: ['weeds', 'bush', 'bigbush'], Wild: ['stump', 'oak', 'pine', 'apple'], Stone: ['pebble', 'rocks', 'boulder'] }[type];
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
    const k = x + ',' + y, tl = S.tilled[k];
    if (type === 'Stone' && S.objs[k]) { const anchor = S.objs[k].part || k, mo = S.objs[anchor]; if (mo && mo.t === 'mine') { out.push({ x, y, mine: anchor }); continue; } }
    if (kinds) { if (!farm) continue; const id = farm.occ[y * W + x], d = id >= 0 && farm.debris[id]; if (d && !d.gone && d.x === x && d.y === y && kinds.includes(d.kind)) out.push({ x, y, d }); continue; }
    if (type === 'Tide' && tl && !tl.w) out.push({ x, y, pri: tl.crop ? 0 : 1 });
    if (type === 'Ember' && tl && !tl.fert) out.push({ x, y });
    if (type === 'Gale' && tl && cropRipe(tl.crop)) out.push({ x, y });
    const ob = S.objs[k];
    if (type === 'Spark' && ob && !ob.boost && ((ob.t === 'compost' && ob.n && S.day < ob.doneDay) || (ob.t === 'beehive' && !ob.honey))) out.push({ x, y });
    if (type === 'Shade' && isNight() && (x + y) % 3 === 0) out.push({ x, y });
  }
  if (type === 'Tide' || type === 'Leaf') out.sort((a, b) => (a.pri ?? 1) - (b.pri ?? 1));
  return out;
}
const toStore0 = (id, n) => { S.workStore = S.workStore || {}; S.workStore[id] = (S.workStore[id] || 0) + n; };
let jobChests = [];   // chests in the area of the Fablemon currently working; their finds go there first
const toStore = (id, n) => { const left = jobChests.length ? chestPut(jobChests, id, n) : n; if (left) toStore0(id, left); };
/* ---------- chests near a work area */
function chestsIn([x0, y0, x1, y1]) { const out = []; for (const [k, o] of Object.entries(S.objs || {})) { if (o.t !== 'chest' || o.part || !o.items) continue; const [x, y] = k.split(',').map(Number); if (x >= x0 && x <= x1 && y >= y0 && y <= y1) out.push({ k, o }); } return out; }
function potIn([x0, y0, x1, y1]) { for (const [k, o] of Object.entries(S.objs || {})) { if (o.t !== 'pot' || o.part) continue; const [x, y] = k.split(',').map(Number); if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return { x, y }; } return null; }
// free = skip items the player has locked in that chest
const chestCount = (cs, id, free) => { const ids = QUAL[id] ? [id, ...QUAL[id]] : [id]; return cs.reduce((a, c) => a + c.o.items.reduce((b, s) => b + (s && ids.includes(s.id) && !(free && (c.o.lock || {})[s.id]) ? s.n : 0), 0), 0); };
function chestTake(cs, id, n, free) { const ids = QUAL[id] ? [id, ...QUAL[id]] : [id]; for (const want of ids) for (const c of cs) c.o.items.forEach((s, i) => { if (!n || !s || s.id !== want || (free && (c.o.lock || {})[s.id])) return; const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) c.o.items[i] = null; }); return !n; }
function chestPut(cs, id, n) {
  const max = ITEMS[id].stack || 99;
  for (const c of cs) for (const s of c.o.items) if (n && s && s.id === id && s.n < max) { const k = Math.min(n, max - s.n); s.n += k; n -= k; }
  for (const c of cs) for (let i = 0; i < c.o.items.length && n; i++) if (!c.o.items[i]) { const k = Math.min(n, max); c.o.items[i] = { id, n: k }; n -= k; }
  return n;
}
function canPlantAt(x, y, cropId) {
  const C = CROPS[cropId], tl = S.tilled[x + ',' + y]; if (!C || !tl || tl.crop) return false;
  if (!inGreenhouse(x, y) && !C.seasons.includes(seasonIdx(S.day))) return false;
  const edge = waterEdge(x, y), soggy = edge || tl.bog;
  if (tl.bog && !C.bog) return false; if (C.edge && !edge) return false; if (C.bog && !soggy) return false;
  return true;
}
// the most valuable meal a cook can make from these chests (plus 1 wood)
function bestRecipe(cs) {
  return COOKING.filter(r => (!r.tavern || S.flags.tavernRecipes) && (!r.crest || (S.flags.tavernCrest || 0) >= r.crest))
    .filter(r => Object.entries({ ...r.need, wood: (r.need.wood || 0) + 1 }).every(([id, n]) => chestCount(cs, id, true) >= n))
    .sort((a, b) => ITEMS[b.out].sell - ITEMS[a.out].sell)[0] || null;
}
// carry out one job on tile t; works whether or not the farm is on screen
function doJob(m, t) {
  const type = SPECIES[m.sp].type, k = t.x + ',' + t.y, tl = S.tilled[k], fs = scene && scene.scene && scene.scene.key === 'farm' ? scene : null;
  let msg = '';
  jobChests = m.job ? chestsIn(jobArea(m.job)) : [];
  if (t.plant) {
    if (!canPlantAt(t.x, t.y, ITEMS[t.plant].seed) || chestCount(jobChests, t.plant, true) < 1 || !chestTake(jobChests, t.plant, 1, true)) return;
    tl.crop = { type: ITEMS[t.plant].seed, g: 0 }; msg = '🌱 Planted';
    if (fs) { fs.drawTilled(t.x, t.y); fs.chips(t.x * T + 8, t.y * T + 12, 0x6bb24a); }
  }
  else if (t.cook) {
    const r = t.cook, need = { ...r.need, wood: (r.need.wood || 0) + 1 }, pantry = jobChests.filter(c => !c.o.noCook);
    if (!Object.entries(need).every(([id, n]) => chestCount(pantry, id, true) >= n)) return;
    for (const [id, n] of Object.entries(need)) chestTake(pantry, id, n, true);
    toStore(r.out, 1); msg = `🍲 ${ITEMS[r.out].name}`;
    if (fs) { fs.chips(t.x * T + 8, t.y * T + 2, 0xe0703a, 5); fs.drawObj(t.x, t.y); }
  }
  else if (t.collect) {
    const o = S.objs[t.collect]; if (!o || !objReady(o)) return;
    if (o.t === 'beehive') { toStore('honey', o.honey); msg = `+${o.honey} Honey`; o.honey = 0; o.last = S.day; }
    else if (o.t === 'compost') { const n = compostOut(o); toStore('fertiliser', n); msg = `+${n} Fertiliser`; o.n = 0; o.boost = 0; }
    else if (o.t === 'fishhut') { let n = 0; for (const [id, c] of Object.entries(o.fish || {})) if (c) { toStore(id, c); n += c; o.fish[id] = 0; } msg = `+${n} fish`; }
    if (fs) fs.drawObj(t.x, t.y);
  }
  else if (type === 'Tide') { if (!tl || tl.w) return; tl.w = 1; if (fs) { fs.drawTilled(t.x, t.y); fs.splash(t.x, t.y); } }
  else if (type === 'Ember') { if (!tl || tl.fert) return; tl.fert = 1; if (fs) { fs.drawTilled(t.x, t.y); fs.chips(t.x * T + 8, t.y * T + 10, 0xe0703a); } }
  else if (type === 'Gale') { if (!tl || !cropRipe(tl.crop)) return; const it = CROPS[tl.crop.type].item; delete tl.crop; toStore(it, 1); msg = `+1 ${ITEMS[it].name}`; if (fs) fs.drawTilled(t.x, t.y); }
  else if (type === 'Spark') {
    const o = S.objs[k]; if (!o || o.boost) return;
    o.boost = 1; if (o.t === 'compost') o.doneDay--; msg = '⚡ Charged!';
    if (fs) { fs.spark(t.x * T + 8, t.y * T + 4); fs.spark(t.x * T + 4, t.y * T + 8); fs.drawObj(t.x, t.y); }
  }
  else if (type === 'Shade') { const r = Math.random(); if (r < .5) { toStore('berry', 1); msg = '+1 Hearthberry'; } else if (r < .58) { toStore('root_charm', 1); msg = '+1 Root Charm'; } else return; }
  else if (t.mine) {
    if (!S.objs[t.mine]) return;
    toStore('stone', 1); msg = '+1 Stone';
    if (fs) { fs.chips(t.x * T + 8, t.y * T + 4, 0x9a968c, 6); fs.spark(t.x * T + 8, t.y * T + 2); Sound.play('pick'); }
  }
  else {
    const d = t.d; if (!d || d.gone) return;
    const def = DEBRIS[d.kind];
    for (const [id, n] of Object.entries(def.drop())) { toStore(id, n); msg = `+${n} ${ITEMS[id].name}`; }
    const sp = fs && fs.sprites[d.id];
    if (def.tree) {
      d.kind = 'stump'; d.hp = DEBRIS.stump.hp;
      if (d.id >= 100000) { const e = S.extra.find(e => e.id === d.id); if (e) { e.kind = 'stump'; e.hp = d.hp; } } else S.debris[d.id] = ['stump', d.hp];
      if (fs) { if (sp) sp.destroy(); fs.spawnDebris(d); Sound.play('thud'); }
    } else {
      farm.occ[d.y * W + d.x] = -1; if (def.wide) farm.occ[d.y * W + d.x + 1] = -1; d.gone = true;
      if (d.id >= 100000) S.extra = S.extra.filter(e => e.id !== d.id); else S.debris[d.id] = 0;
      if (fs && sp) { fs.tweens.add({ targets: sp, alpha: 0, scaleY: .4, duration: 160, onComplete: () => sp.destroy() }); delete fs.sprites[d.id]; }
    }
  }
  S.workLog = S.workLog || {}; S.workLog[m.uid] = (S.workLog[m.uid] || 0) + 1;
  if (fs && msg) fs.floatText(msg, t.x * T + 8, t.y * T);
  return true;
}
// called every frame from any scene, so work carries on while you're in town or on the trail
function tickWorkers(dt, sc) {
  if (!S || !S.mons || sc.paused || sc.sleeping) return;
  const onFarm = sc.scene.key === 'farm';
  for (const m of workers()) {
    m.jobT = (m.jobT || 0) + dt;
    if (m.jobT < jobInterval(m)) continue;
    const r = onFarm && sc.roamers && sc.roamers.find(r => r.m === m);
    if (r) { if (r.task) continue; const ts = jobTargets(m); const rocks = ts.filter(t => !t.mine); if (rocks.length) ts.splice(0, ts.length, ...rocks); if (!ts.length) { m.jobT *= .5; continue; } ts.sort((a, b) => (Math.abs(a.x - r.x) + Math.abs(a.y - r.y)) - (Math.abs(b.x - r.x) + Math.abs(b.y - r.y))); r.task = ts[0]; r.taskT = 0; continue; }
    let ts = jobTargets(m); const rocks = ts.filter(t => !t.mine); if (rocks.length) ts = rocks;
    m.jobT = 0; if (ts.length) { const t = ts[Math.floor(Math.random() * Math.min(ts.length, 6))]; doJob(m, t); m.mining = !!t.mine; }
  }
}
function openJobPicker(m) {
  if (!scene || scene.scene.key !== 'farm') return toast('Visit your ranch on the farm to set a work area.');
  closeModal();
  const J = jobOf(m), start = m.job ? { cx: m.job.x, by: m.job.y } : { cx: ranchDoor().x, by: ranchDoor().y + 5 };
  scene.buildPreview({
    zone: true, name: `${monName(m)}: ${J.name}`, desc: J.desc, at: start, areaFor: a => jobArea({ x: a.cx, y: a.by }),
    targetsIn: area => new Set(jobTargets(m, area).map(t => t.x + ',' + t.y)),
    speed: monStage(m) === 2.5 ? 'Quick (final form)' : ['', 'Slow (stage 1)', 'Steady (stage 2)', 'Fast (fully evolved)'][monStage(m)],
    onBuild: at => {
      if (!m.out && S.mons.filter(x => x.loc === 'ranch' && x.out).length >= ROAM_MAX) return toast(`Only ${ROAM_MAX} Fablemon can be out on the farm at once.`);
      m.job = { x: at.cx, y: at.by }; m.out = true; m.jobT = 0; scene.spawnRoamers();
      toast(`${monName(m)} is off to work as a ${J.name}!`, 2400);
    },
  });
}

/* --------------------------------------------------------------- Farm */
class Farm extends World {
  constructor() { super('farm'); }
  create() {
    this.initWorld(W, H);
    const tex = this.textures.get('objects');
    const fr = tex.get('fence_h'); if (!tex.has('rail_h')) tex.add('rail_h', 0, fr.cutX + 7, fr.cutY, 18, fr.cutHeight);
    const gr = tex.get('gate'); if (!tex.has('gate_mid')) tex.add('gate_mid', 0, gr.cutX + 8, gr.cutY, 16, gr.cutHeight);
    this.makeCanvasTextures();

    farm = buildFarm();
    const data = []; for (let y = 0; y < H; y++) data.push(Array.from(farm.tiles.slice(y * W, y * W + W)));
    this.map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const ts = this.map.addTilesetImage('terrain', 'terrain_x', T, T, 1, 2);
    this.ground = this.map.createLayer(0, ts, 0, 0);
    this.waterFrame = 0;
    this.time.addEvent({ delay: 650, loop: true, callback: () => this.animateWater() });

    this.tall = [];
    for (const b of farm.border) {
      const im = this.add.image(b.x * T + 8, b.y * T + 15, 'objects', b.kind === 'pine' ? 'tree_pine' : 'tree_oak').setOrigin(.5, 1);
      im.setDepth(b.y * T + 15).setTint(0xb8c8b0); this.tall.push(im);
    }
    const hf = houseFoot();
    this.cottage = S.house ? this.add.image(Math.round(hf[4]), DOOR.y * T + 2, 'houses', 'house' + S.house).setOrigin(.5, 1).setDepth(DOOR.y * T) : this.add.image(DOOR.x * T + 8, DOOR.y * T + 2, 'objects', 'cottage').setOrigin(.5, 1).setDepth(DOOR.y * T);
    this.tall.push(this.cottage);
    this.add.image((BIN.x + 1) * T, BIN.y * T + 15, 'objects', 'shipping_bin').setOrigin(.5, 1).setDepth(BIN.y * T + 15);
    drawGreenhouses(this);
    this.mailbox = this.add.image(MAILBOX.x * T + 8, MAILBOX.y * T + 15, 'mailbox').setOrigin(.5, 1).setDepth(MAILBOX.y * T + 15);
    this.mailFlag = this.add.text(MAILBOX.x * T + 8, MAILBOX.y * T - 12, '!', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '14px', color: '#ffe35a', stroke: '#2a1e1a', strokeThickness: 3, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6);
    this.tweens.add({ targets: this.mailFlag, y: '-=3', yoyo: true, repeat: -1, duration: 500 });
    if (S.mailRead && !S.starter) S.mailRead = false;
    this.mailFlag.setVisible(!S.mailRead);

    for (const [id, st] of Object.entries(S.debris)) { const d = farm.debris[+id]; if (!d) continue; if (st === 0) { this.clearOcc(d); d.gone = true; } else { d.kind = st[0]; d.hp = st[1]; } }
    for (const e of S.extra) { if (farm.occ[e.y * W + e.x] < 0) { const d = { ...e }; farm.debris[d.id] = d; farm.occ[d.y * W + d.x] = d.id; } }
    this.sprites = {};
    for (const d of Object.values(farm.debris)) if (d && !d.gone) this.spawnDebris(d);
    { const hf = houseFoot(); this.clearDebrisIn(hf[0], hf[1], hf[2], hf[3]); this.clearDebrisIn(BIN.x, BIN.y, BIN.x + 1, BIN.y); this.clearDebrisIn(MAILBOX.x, MAILBOX.y, MAILBOX.x, MAILBOX.y); this.clearDebrisIn(DOOR.x, DOOR.y, DOOR.x, DOOR.y + 1); }
    this.setupRanch();
    this.cropSprites = {}; this.fenceSprites = {};
    for (const k of Object.keys(S.tilled)) { const [x, y] = k.split(',').map(Number); this.drawTilled(x, y); }
    for (const k of Object.keys(S.paths)) { const [x, y] = k.split(',').map(Number); this.drawPath(x, y); }
    this.objSprites = {}; this.glows = [];
    for (const k of Object.keys(S.objs)) { const [x, y] = k.split(',').map(Number); this.drawObj(x, y); }
    for (const k of Object.keys(S.fences)) { const [x, y] = k.split(',').map(Number); this.drawFence(x, y); }

    const sp = S.spawn && S.spawn.scene === 'farm' ? S.spawn : { x: DOOR.x, y: DOOR.y + 1, dir: 'down' };
    this.makePlayer(sp);
    this.spawnRoamers();
    this.ghostRect = this.add.rectangle(0, 0, 16, 16).setOrigin(0).setDepth(9e6 - 3).setVisible(false);
    this.sprinkRect = this.add.rectangle(0, 0, 16, 16, 0x6ab0ff, .16).setOrigin(0).setStrokeStyle(1, 0xbfe2ff, .8).setDepth(9e6 - 4).setVisible(false);
    this.ghostImg = this.add.image(0, 0, 'objects', 'fence_end').setOrigin(.5, 1).setAlpha(.6).setDepth(9e6 - 4).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * T, H * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput();
    this.fadeAcc = 0;
    Sound.theme('field');
    updateHUD(); renderHotbar(); FX.set(S.weather, false); this.fadeIn();
    if (!S.mailRead) setTimeout(() => toast('You have mail! Check the mailbox by your door.', 3500), 700);
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  makeCanvasTextures() {
    if (this.textures.exists('mailbox')) return;
    this.textures.addCanvas('mailbox', pixCanvas(12, 20, R => { R(5, 8, 2, 12, '#8f5f34'); R(5, 8, 1, 12, '#b07a45'); R(1, 2, 10, 7, '#3e7d3a'); R(1, 2, 10, 2, '#5aa64a'); R(2, 5, 8, 1, '#2f5f2c'); R(10, 1, 1, 4, '#d0443a'); }));
    this.textures.addCanvas('rail_v', pixCanvas(6, 16, R => { R(2, 0, 2, 16, '#a8703c'); R(2, 0, 1, 16, '#c99059'); }));
    this.textures.addCanvas('gate_v', pixCanvas(8, 22, R => { R(2, 0, 4, 22, '#b07a45'); R(2, 0, 1, 22, '#d39a5e'); R(1, 4, 6, 2, '#8f5f34'); R(1, 15, 6, 2, '#8f5f34'); R(3, 6, 2, 9, '#8f5f34'); }));
  }
  animateWater() {
    this.waterFrame ^= 1;
    for (const i of farm.water) this.ground.putTileAt(farm.tiles[i] + (this.waterFrame ? 16 : 0), i % W, (i / W) | 0);
  }
  passable(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = y * W + x;
    if (farm.blocked[i] || farm.occ[i] >= 0 || S.objs[x + ',' + y]) return false;
    const f = S.fences[x + ',' + y]; if (f && !(f.t === 'gate' && f.open)) return false;
    return true;
  }
  fastAt(x, y) { return !!S.paths[x + ',' + y]; }
  clearOcc(d) { farm.occ[d.y * W + d.x] = -1; if (DEBRIS[d.kind] && DEBRIS[d.kind].wide) farm.occ[d.y * W + d.x + 1] = -1; }
  spawnDebris(d) {
    const def = DEBRIS[d.kind];
    const x = d.x * T + (def.wide ? 16 : 8), y = d.y * T + 15;
    const s = this.add.image(x, y, 'objects', def.frame).setOrigin(.5, 1).setDepth(y);
    this.sprites[d.id] = s;
    if (def.tree) this.tall.push(s);
  }
  /* ---------- per-frame: see-through canopies and the placement preview */
  frameHook(dt) {
    this.updateRoamers(dt);
    if (this.glows && this.glows.length) { const t = S.time, n = t >= 1080 ? Math.min(1, (t - 1080) / 90) : t < 390 ? 1 : 0; for (const g of this.glows) if (g.active) g.setFillStyle(0xffd27a, n * .35); }
    this.fadeAcc += dt;
    if (this.fadeAcc > .08) {
      this.fadeAcc = 0;
      const px = this.player.x, py = this.player.y;
      this.tall = this.tall.filter(s => s.active);
      for (const s of this.tall) {
        if (Math.abs(s.x - px) > 48 || s.y < py || s.y - s.displayHeight > py) { if (s.alpha !== 1 && !s._falling) s.setAlpha(1); continue; }
        const behind = s.y > py + 2 && Math.abs(s.x - px) < s.displayWidth / 2 + 2 && py > s.y - s.displayHeight + 4;
        if (!s._falling) s.setAlpha(behind ? .28 : 1);
      }
    }
    this.updateGhost();
  }
  ghostTarget() {
    const p = this.p;
    if (controlMode() === 'tap') {
      const ptr = this.input.activePointer;
      if (!ptr || ptr.wasTouch || !this.input.mouse) return null;
      return { x: Math.floor(ptr.worldX / T), y: Math.floor(ptr.worldY / T) };
    }
    const [dx, dy] = DV[p.dir]; return { x: p.x + dx, y: p.y + dy };
  }
  updateGhost() {
    const h = held(), it = h && ITEMS[h.id];
    const t = it && !this.p.moving ? this.ghostTarget() : null;
    const spr = t && it.place === 'obj' && /^sprinkler/.test(it.obj) ? 1 + (it.lv || 0) : 0;
    if (spr) this.sprinkRect.setSize((2 * spr + 1) * T, (2 * spr + 1) * T).setPosition((t.x - spr) * T, (t.y - spr) * T).setVisible(true); else if (this.sprinkRect) this.sprinkRect.setVisible(false);
    if (!t || !(it.place || it.seed || it.tool || it.fert)) { this.ghostRect.setVisible(false); this.ghostImg.setVisible(false); return; }
    let ok, show = true;
    if (it.place) ok = this.canPlace(t.x, t.y, it.place, objW(it));
    else if (it.seed) ok = !!S.tilled[t.x + ',' + t.y] && !S.tilled[t.x + ',' + t.y].crop;
    else if (it.fert) ok = !!S.tilled[t.x + ',' + t.y] && !S.tilled[t.x + ',' + t.y].fert;
    else if (it.tool === 'hoe' || it.tool === 'can') ok = this.wantsAction({ x: t.x, y: t.y });
    else { show = false; }
    const col = ok ? 0x9cf27a : 0xff6a5a;
    this.ghostRect.setSize(16 * (it.place ? objW(it) : 1), 16).setPosition(t.x * T, t.y * T).setVisible(true).setStrokeStyle(1, show ? col : 0xfffbe8, show ? .95 : .5).setFillStyle(col, show ? .18 : 0);
    if (it.place === 'obj') { const [key, frame] = this.objTex(it.obj); this.ghostImg.setTexture(key, frame).setPosition(t.x * T + objW(it) * 8, t.y * T + 16).setVisible(true); }
    else if (it.place && it.place !== 'path') this.ghostImg.setTexture('objects', it.place === 'gate' ? 'gate_mid' : 'fence_end').setPosition(t.x * T + 8, t.y * T + 15).setVisible(true);
    else if (it.seed) { const f0 = CROPS[it.seed].frames[0]; if (f0.startsWith('cv:')) { const ck = 'cv_' + f0.slice(3); if (!this.textures.exists(ck)) this.textures.addCanvas(ck, SAP_CANVAS[f0.slice(3)]); this.ghostImg.setTexture(ck); } else this.ghostImg.setTexture('objects', f0); this.ghostImg.setPosition(t.x * T + 8, t.y * T + 15).setVisible(true); }
    else this.ghostImg.setVisible(false);
  }
  /* ---------- targets */
  targetAt(wx, wy) {
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    let best = null;
    for (let dy = 0; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) {
      const x = tx + dx, y = ty + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const id = farm.occ[y * W + x]; if (id < 0) continue;
      const d = farm.debris[id], s = this.sprites[id]; if (!s) continue;
      if (!s.getBounds().contains(wx, wy)) continue;
      if (dy === 0 && dx === 0) return { type: 'debris', d };
      if (DEBRIS[d.kind].tree && (!best || y > best.d.y)) best = { type: 'debris', d };
    }
    if (best) return best;
    for (const r of this.roamers || []) if (r.spr.getBounds().contains(wx, wy)) return { type: 'mon', r, x: r.x, y: r.y };
    if (this.ranchImg && this.ranchImg.getBounds().contains(wx, wy)) return { type: 'ranch' };
    if (this.signImg && tx === RANCH.sign.x && (ty === RANCH.sign.y || ty === RANCH.sign.y - 1)) return { type: 'sign', x: RANCH.sign.x, y: RANCH.sign.y };
    { const hf = houseFoot(); if (tx >= hf[0] && tx <= hf[2] && ty >= hf[1] - 3 && ty <= hf[3]) return { type: 'house' }; }
    if (tx === MAILBOX.x && (ty === MAILBOX.y || ty === MAILBOX.y - 1)) return { type: 'mail' };
    if ((tx === BIN.x || tx === BIN.x + 1) && (ty === BIN.y || ty === BIN.y - 1)) return { type: 'bin' };
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return null;
    const f = S.fences[tx + ',' + ty]; if (f) return { type: 'fence', x: tx, y: ty, f };
    if (S.objs[tx + ',' + ty]) return { type: 'obj', x: tx, y: ty };
    if (S.objs[tx + ',' + (ty + 1)] && ['scarecrow', 'lantern'].includes(S.objs[tx + ',' + (ty + 1)].t)) return { type: 'obj', x: tx, y: ty + 1 };
    return { type: 'tile', x: tx, y: ty };
  }
  onTap(wx, wy) {
    if (this.moving) return this.pickToMove(wx, wy);
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    if (this.tapProp(wx, wy)) return;
    const t = this.targetAt(wx, wy); if (t) this.tapGoal(t);
  }
  /* ---------- move mode: tap the house, bin, mailbox, ranch or anything placed, then place it again */
  moveMode() {
    this.moving = true; this.paused = true;
    const bb = $('buildbar'); bb.classList.remove('side');
    bb.innerHTML = `<div class="bt"><b>Move things</b></div><small>Tap your house, the shipping bin, the mailbox, the ranch, or anything you've placed, to move it.</small><div class="row"><button class="btn gold" data-a="done">Done</button></div>`;
    bb.classList.add('show');
    bb.onclick = e => { if (e.target.closest('[data-a="done"]')) this.endMove(); };
  }
  endMove() { this.moving = false; this.paused = false; $('buildbar').classList.remove('show'); if (this.p) this.p.busy = .3; }
  pickToMove(wx, wy) {
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T), def = this.moveDef(tx, ty, wx, wy);
    if (!def) return toast("That can't be moved. Tap a building or something you've placed.", 1600);
    this.moving = false; $('buildbar').classList.remove('show');
    Sound.play('click'); this.buildPreview({ move: true, allowDirt: true, cost: {}, gold: 0, ...def });
  }
  moveDef(tx, ty, wx, wy) {
    const restart = () => { S.spawn = { scene: 'farm', x: this.p.x, y: this.p.y, dir: this.p.dir }; this.scene.restart(); setTimeout(() => this.moveMode && scene === this && this.moveMode(), 600); };
    const own = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
    const hf = houseFoot();
    if (this.cottage.getBounds().contains(wx, wy) || (tx >= hf[0] && tx <= hf[2] && ty >= hf[1] && ty <= hf[3]))
      return { name: HOUSE_NAMES[S.house || 0], ghostKey: S.house ? 'houses' : 'objects', ghostFrame: S.house ? 'house' + S.house : 'cottage', at: { cx: DOOR.x, by: DOOR.y },
        areaFor: a => houseFoot(S.house, { x: a.cx, y: a.by }).slice(0, 4), ghostAt: a => { const f = houseFoot(S.house, { x: a.cx, y: a.by }); return [Math.round(S.house ? f[4] : a.cx * T + 8), a.by * T + 2]; },
        ignore: own(hf[0], hf[1], hf[2], hf[3]), onBuild: a => { S.layout = { ...(S.layout || {}), door: { x: a.cx, y: a.by } }; applyLayout(); restart(); } };
    if ((tx === BIN.x || tx === BIN.x + 1) && (ty === BIN.y || ty === BIN.y - 1))
      return { name: 'Shipping bin', ghostKey: 'objects', ghostFrame: 'shipping_bin', at: { cx: BIN.x, by: BIN.y }, areaFor: a => [a.cx, a.by, a.cx + 1, a.by], ghostAt: a => [(a.cx + 1) * T, a.by * T + 15],
        ignore: own(BIN.x, BIN.y, BIN.x + 1, BIN.y), onBuild: a => { S.layout = { ...(S.layout || {}), bin: { x: a.cx, y: a.by } }; applyLayout(); restart(); } };
    if (tx === MAILBOX.x && (ty === MAILBOX.y || ty === MAILBOX.y - 1))
      return { name: 'Mailbox', ghostKey: 'mailbox', at: { cx: MAILBOX.x, by: MAILBOX.y }, areaFor: a => [a.cx, a.by, a.cx, a.by], ghostAt: a => [a.cx * T + 8, a.by * T + 15],
        ignore: own(MAILBOX.x, MAILBOX.y, MAILBOX.x, MAILBOX.y), onBuild: a => { S.layout = { ...(S.layout || {}), mail: { x: a.cx, y: a.by } }; applyLayout(); restart(); } };
    if (S.ranch === 2 && this.ranchImg && this.ranchImg.getBounds().contains(wx, wy)) {
      const ra = ranchArea();
      return { name: 'Ranch', ghostKey: 'town', ghostFrame: 'ranch', at: { ...ranchPos() }, areaFor: ranchArea, ignore: own(...ra), onBuild: a => { S.ranchAt = { cx: a.cx, by: a.by }; restart(); } };
    }
    let k = tx + ',' + ty; if (!S.objs[k] && S.objs[tx + ',' + (ty + 1)]) k = tx + ',' + (ty + 1);
    if (S.objs[k] && S.objs[k].part) k = S.objs[k].part;
    const o = S.objs[k];
    if (o) {
      const [ox, oy] = k.split(',').map(Number), w = o.w || 1, [key, frame] = this.objTex(o.t);
      const it = Object.values(ITEMS).find(i => i.obj === o.t);
      return { name: it ? it.name : 'Item', ghostKey: key, ghostFrame: frame, at: { cx: ox, by: oy }, areaFor: a => [a.cx, a.by, a.cx + w - 1, a.by], ghostAt: a => [a.cx * T + w * 8, a.by * T + 16],
        ignore: own(ox, oy, ox + w - 1, oy), onBuild: a => {
          for (let i = 0; i < w; i++) delete S.objs[(ox + i) + ',' + oy];
          const nk = a.cx + ',' + a.by; S.objs[nk] = o; for (let i = 1; i < w; i++) S.objs[(a.cx + i) + ',' + a.by] = { part: nk };
          restart();
        } };
    }
    return null;
  }
  tapGoal(t) {
    const p = this.p; let gx, gy;
    if (t.type === 'house') { const path = this.path((x, y) => x === DOOR.x && y === DOOR.y); if (path) { p.path = path; p.pending = t; } return; }
    if (t.type === 'ranch') { const d = ranchDoor(); if (p.x === d.x && p.y === d.y + 1 && !p.moving) return this.act(t); const path = this.path((x, y) => x === d.x && y === d.y + 1); if (path) { p.path = path; p.pending = t; } return; }
    if (t.type === 'mail') { gx = MAILBOX.x; gy = MAILBOX.y; }
    else if (t.type === 'bin') { gx = BIN.x; gy = BIN.y; }
    else if (t.type === 'debris') { gx = t.d.x; gy = t.d.y; }
    else { gx = t.x; gy = t.y; }
    if (t.type === 'debris') { if (t.d.gone) return; p.lastTarget = t; }
    const isWide = (t.type === 'debris' && DEBRIS[t.d.kind].wide) || t.type === 'bin';
    const adj = (x, y) => (Math.abs(x - gx) + Math.abs(y - gy) === 1) || (isWide && Math.abs(x - gx - 1) + Math.abs(y - gy) === 1);
    if (t.type === 'tile' && !this.wantsAction(t)) { const path = this.path((x, y) => x === gx && y === gy); if (path) { p.path = path; p.pending = null; } return; }
    if (adj(p.x, p.y) && !p.moving) { this.act(t); return; }
    const path = this.path(adj);
    if (!path) { toast("Can't reach that."); return; }
    p.path = path; p.pending = t;
  }
  wantsAction(t) {
    const k = t.x + ',' + t.y, i = t.y * W + t.x;
    if (t.x < 0 || t.y < 0 || t.x >= W || t.y >= H) return false;
    const tl = S.tilled[k];
    if (tl && tl.crop && (cropRipe(tl.crop) || tl.crop.dead)) return true;
    const h = held(); if (!h) return false;
    const it = ITEMS[h.id];
    if (it.seed) return !!tl && !tl.crop;
    if (it.peat) return !!tl && !tl.bog;
    if (it.fert) return !!tl && !tl.fert;
    if (it.place) return this.canPlace(t.x, t.y, it.place, objW(it));
    if (it.tool === 'hoe') return !farm.blocked[i] && !farm.dirtish[i] && !farm.waterish[i] && !tl && !S.paths[k] && this.passable(t.x, t.y) && !this.isHouseZone(t.x, t.y);
    if (it.tool === 'can') return !!tl || !!farm.waterish[i];
    if (it.tool === 'pickaxe') return !!tl || !!S.paths[k];
    return false;
  }
  isHouseZone(x, y) { const hf = houseFoot(); return y >= hf[1] && y <= DOOR.y && x >= hf[0] && x <= hf[2]; }
  canPlace(x, y, kind, w = 1) {
    if (w > 1) { for (let i = 0; i < w; i++) if (!this.canPlace(x + i, y, kind)) return false; return true; }
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const k = x + ',' + y, i = y * W + x;
    if (S.fences[k] || S.objs[k] || farm.occ[i] >= 0 || farm.blocked[i] || farm.waterish[i] || (S.tilled[k] && S.tilled[k].crop)) return false;
    if (kind === 'obj' && held() && SAPLING_TREE[ITEMS[held().id].obj] && (S.paths[k] || farm.dirtish[i])) return false;
    if (kind === 'obj' && (S.tilled[k] || (x === DOOR.x && y === DOOR.y) || this.roamerAt(x, y))) return false;
    if (x === this.p.x && y === this.p.y) return false;
    if (kind === 'path') return !S.paths[k] && !S.tilled[k] && !farm.dirtish[i];
    if (x === DOOR.x && y === DOOR.y) return false;
    return true;
  }
  /* ---------- actions */
  act(t) {
    const p = this.p; if (p.busy > 0) { p.queued = t; return; }
    if (t.type === 'ranch') { const d = ranchDoor(); this.face(d.x, d.y); p.busy = .3; return openRanch(); }
    if (t.type === 'sign') { this.face(t.x, t.y); return S.ranch === 1 ? toast('The villagers will build your ranch tonight.', 2200) : this.buildPreview(RANCH_BUILD()); }
    if (t.type === 'mon') return this.pet(t.r);
    if (t.type === 'obj') return this.useObj(t.x, t.y);
    if (t.type === 'mail') { this.face(MAILBOX.x, MAILBOX.y); return this.readMail(); }
    if (t.type === 'bin') { this.face(BIN.x, BIN.y); return this.openBin(); }
    if (t.type === 'house') { this.face(DOOR.x, DOOR.y - 1); return this.enterHouse(); }
    if (t.type === 'fence') {
      this.face(t.x, t.y);
      const h = held();
      if (h && ITEMS[h.id].tool === 'axe') return this.pickUpFence(t.x, t.y);
      if (t.f.t === 'gate') { t.f.open = !t.f.open; Sound.play('door'); this.drawFence(t.x, t.y); return; }
      return toast('Hit a fence with your axe to pick it back up.');
    }
    if (t.type === 'debris') return this.hitDebris(t.d);
    if (t.type === 'tile') return this.useOnTile(t.x, t.y);
  }
  actFacing() {
    const p = this.p; if (p.moving || this.paused) return;
    const [dx, dy] = DV[p.dir], x = p.x + dx, y = p.y + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (!p.busy && this.cutProp(x, y)) return;
    const id = farm.occ[y * W + x];
    if (id >= 0) return this.act({ type: 'debris', d: farm.debris[id] });
    const r = this.roamerAt(x, y); if (r) return this.act({ type: 'mon', r });
    if (this.signImg && x === RANCH.sign.x && y === RANCH.sign.y) return this.act({ type: 'sign', x, y });
    if (S.ranch === 2 && x === ranchDoor().x && y === ranchDoor().y) return this.act({ type: 'ranch' });
    if (x === MAILBOX.x && y === MAILBOX.y) return this.act({ type: 'mail' });
    if ((x === BIN.x || x === BIN.x + 1) && y === BIN.y) return this.act({ type: 'bin' });
    if (y === DOOR.y - 1 && x === DOOR.x) return this.act({ type: 'house' });
    const f = S.fences[x + ',' + y]; if (f) return this.act({ type: 'fence', x, y, f });
    if (S.objs[x + ',' + y]) return this.act({ type: 'obj', x, y });
    this.act({ type: 'tile', x, y });
  }
  ensureTool(tool) {
    const h = held();
    if (h && ITEMS[h.id].tool === tool) return true;
    if (!opts.autoTool) return false;
    const i = inv.slots.findIndex((s, k) => k < 12 && s && ITEMS[s.id].tool === tool);
    if (i < 0) return false;
    S.sel = i; renderHotbar(); return true;
  }
  hitDebris(d) {
    this.face(d.x, d.y);
    const def = DEBRIS[d.kind];
    if (!this.ensureTool(def.tool)) { Sound.play('error'); toast(`You need your ${ITEMS[def.tool].name.toLowerCase()} for that.`); return; }
    if (def.tool === 'scythe') Sound.play('swish');
    this.swing(def.tool, () => {
      const s = this.sprites[d.id]; if (!s || d.gone) return;
      d.hp -= def.tool === 'axe' || def.tool === 'pickaxe' ? 1 + ((S.tools && S.tools[def.tool]) || 0) : 1;
      Sound.play(def.sfx);
      const hy = s.y - Math.min(10, s.height / 3);
      this.chips(s.x, hy, def.tree || d.kind === 'stump' || d.kind.includes('bush') ? 0x9b6a3c : d.kind === 'weeds' ? 0x6bb24a : 0x9a968c);
      this.spark(s.x + (this.p.x < d.x ? -5 : this.p.x > d.x ? 5 : 0), hy);
      this.tweens.add({ targets: s, x: s.x + 1, duration: 40, yoyo: true, repeat: 1 });
      if (!def.tree) this.tweens.add({ targets: s, scaleY: .9, duration: 50, yoyo: true });
      if (d.hp > 0) { S.debris[d.id] = [d.kind, d.hp]; return; }
      this.giveDrops(def.drop(), s.x, s.y - 12);
      if (def.tree) {
        s._falling = true;
        this.tweens.add({ targets: s, angle: (this.p.x <= d.x ? 1 : -1) * 85, alpha: 0, duration: 650, ease: 'Quad.easeIn', onComplete: () => { s.destroy(); this.cameras.main.shake(160, .006); Sound.play('thud'); } });
        d.kind = 'stump'; d.hp = DEBRIS.stump.hp; S.debris[d.id] = ['stump', d.hp];
        this.time.delayedCall(250, () => this.spawnDebris(d));
      } else {
        if (def.tool === 'pickaxe') Sound.play('crunch');
        this.tweens.add({ targets: s, alpha: 0, scaleY: .4, duration: 160, onComplete: () => s.destroy() });
        delete this.sprites[d.id]; this.clearOcc(d); d.gone = true; S.debris[d.id] = 0;
        S.extra = S.extra.filter(e => e.id !== d.id);
      }
    });
  }
  useOnTile(x, y) {
    this.face(x, y);
    const k = x + ',' + y, tl = S.tilled[k];
    if (tl && tl.crop && tl.crop.dead) { delete tl.crop; Sound.play('rustle'); this.drawTilled(x, y); toast('You cleared the withered crop.', 1200); return; }
    if (tl && cropRipe(tl.crop)) {
      const hh = held(), r = hh && hh.id === 'scythe' ? [0, 1, 1, 2][toolTier('scythe')] : 0;
      if (!r) return this.harvest(x, y);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const t2 = S.tilled[(x + dx) + ',' + (y + dy)]; if (t2 && cropRipe(t2.crop)) this.harvest(x + dx, y + dy); }
      return;
    }
    const h = held(); if (!h) return;
    const it = ITEMS[h.id];
    if (it.eat) return eatHeld();
    if (it.place) {
      if (it.water && !nearWater(x, y, objW(it))) { Sound.play('error'); return toast('A Fishing Hut needs water within 2 tiles of it.', 2400); }
      if (!this.canPlace(x, y, it.place, objW(it))) { Sound.play('error'); return toast(objW(it) > 1 ? `That needs ${objW(it)} clear tiles in a row, starting here and going right.` : "You can't place that there."); }
      if (it.place === 'path') { S.paths[k] = it.path; this.drawPath(x, y); }
      else if (it.place === 'obj') {
        const w = objW(it); S.objs[k] = { t: it.base || it.obj, w, day: S.day }; if (it.base) Object.assign(S.objs[k], { art: it.obj, lv: it.lv, item: h.id });
        for (let i = 1; i < w; i++) S.objs[(x + i) + ',' + y] = { part: k };
        if ((it.base || it.obj) === 'chest') S.objs[k].items = Array(it.lv ? 36 : 18).fill(null); this.drawObj(x, y);
      }
      else { S.fences[k] = { t: it.place, open: false }; this.redrawFenceAround(x, y); }
      Sound.play('place'); inv.removeAt(S.sel, 1); renderHotbar();
      return;
    }
    if (it.peat) {
      if (!tl) { Sound.play('error'); return toast('Spread Bog Peat on tilled soil.'); }
      if (tl.bog) return toast('This soil is already waterlogged.', 1200);
      tl.bog = 1; tl.w = 1; inv.removeAt(S.sel, 1); renderHotbar(); this.drawTilled(x, y); Sound.play('water'); this.chips(x * T + 8, y * T + 12, 0x3a2a1a); return;
    }
    if (it.fert) {
      if (!tl) { Sound.play('error'); return toast('Use fertiliser on tilled soil.'); }
      if (tl.fert) return toast('This soil is already fertilised.', 1200);
      tl.fert = 1; tl.fq = 1; inv.removeAt(S.sel, 1); renderHotbar(); this.drawTilled(x, y); Sound.play('plant'); this.chips(x * T + 8, y * T + 12, 0x5e3b20); return;
    }
    if (it.seed) {
      if (!tl) { Sound.play('error'); return toast('Seeds go in tilled soil. Use your hoe first.'); }
      if (tl.crop) return toast('Something is already growing there.');
      if (!inGreenhouse(x, y) && !CROPS[it.seed].seasons.includes(seasonIdx(S.day))) { Sound.play('error'); return toast(`${ITEMS[h.id].name} won't grow in ${seasonDay().season.toLowerCase()}.`); }
      const C = CROPS[it.seed], edge = waterEdge(x, y), soggy = edge || tl.bog;
      if (tl.bog && !C.bog) { Sound.play('error'); return toast(`This soil is waterlogged with Bog Peat. Only bog crops grow here: wild rice, cranberries and lotus.`, 3200); }
      if (C.edge && !edge) { Sound.play('error'); return toast(`${ITEMS[h.id].name} only grow right next to the pond.`, 2600); }
      if (C.bog && !soggy) { Sound.play('error'); return toast(`${ITEMS[h.id].name} need waterlogged ground. Plant them right next to water, or spread Bog Peat on the soil first.`, 3200); }
      tl.crop = { type: it.seed, g: 0 }; inv.removeAt(S.sel, 1); this.drawTilled(x, y); renderHotbar();
      Sound.play('plant'); this.chips(x * T + 8, y * T + 12, 0x6bb24a); return;
    }
    if (it.tool === 'hoe') {
      if (!this.wantsAction({ x, y })) { Sound.play('error'); return toast(tl ? 'This soil is already tilled.' : "You can't till there."); }
      return this.swing('hoe', () => {
        const [dx, dy] = DV[this.p.dir];
        for (let i = 0; i <= toolTier('hoe'); i++) {
          const tx = x + dx * i, ty = y + dy * i, kk = tx + ',' + ty;
          if (i && (S.tilled[kk] || !this.wantsAction({ x: tx, y: ty }))) break;
          S.tilled[kk] = { w: isWet(S.weather) ? 1 : 0 }; this.drawTilled(tx, ty); this.chips(tx * T + 8, ty * T + 10, 0x8a5a33);
        }
        Sound.play('hoe');
      });
    }
    if (it.tool === 'can') {
      if (farm.waterish[y * W + x]) {
        if (S.water >= canMax()) return toast('Your watering can is already full.', 1200);
        return this.swing('can', () => { S.water = canMax(); Sound.play('fill'); this.splash(x, y, 10); renderHotbar(); toast('Filled your watering can.', 1200); }, 1);
      }
      if (!tl) { Sound.play('error'); return toast('Water tilled soil and the crops growing in it.'); }
      if (S.water <= 0) { Sound.play('error'); return toast('Your watering can is empty. Fill it at the pond.'); }
      return this.swing('can', () => {
        if (!S.tilled[k]) return; const [dx, dy] = DV[this.p.dir];
        for (let i = 0; i <= toolTier('can') && S.water > 0; i++) { const tx = x + dx * i, ty = y + dy * i, t2 = S.tilled[tx + ',' + ty]; if (!t2) break; S.water--; t2.w = 1; this.drawTilled(tx, ty); this.splash(tx, ty); }
        Sound.play('water'); renderHotbar();
        if (S.water === 0) toast('Your watering can is empty.', 1500);
      });
    }
    if (it.tool === 'pickaxe') return this.swing('pickaxe', () => {
      Sound.play('pick');
      if (S.paths[k]) { const back = S.paths[k] === 'dirt' ? 'dirt_path' : 'path'; delete S.paths[k]; this.drawPath(x, y); inv.add(back, 1); renderHotbar(); }
      else if (S.tilled[k]) { delete S.tilled[k]; this.drawTilled(x, y); }
    });
    if (it.tool === 'axe' || it.tool === 'scythe') return this.swing(it.tool, () => Sound.play('swish'), 0);
  }
  drawTilled(x, y) {
    const k = x + ',' + y, tl = S.tilled[k];
    this.renderTile(x, y);
    if (this.cropSprites[k]) { this.cropSprites[k].forEach(o => o.destroy()); delete this.cropSprites[k]; }
    const parts0 = [];
    if (tl && tl.fert) parts0.push(this.add.rectangle(x * T, y * T, T, T, 0x2a1a0a, .22).setOrigin(0).setDepth(1));
    if (tl && tl.bog) parts0.push(this.add.rectangle(x * T + 1, y * T + 1, T - 2, T - 2, 0x2a4a5a, .35).setOrigin(0).setDepth(1));
    const c = tl && tl.crop; if (!c) { if (parts0.length) this.cropSprites[k] = parts0; return; }
    const fr = CROPS[c.type].frames[cropStage(c)], ck = fr.startsWith('cv:') ? 'cv_' + fr.slice(3) : null;
    if (ck && !this.textures.exists(ck)) this.textures.addCanvas(ck, SAP_CANVAS[fr.slice(3)]);
    const img = ck ? this.add.image(x * T + 8, y * T + 15, ck).setOrigin(.5, 1).setDepth(y * T + 14) : this.add.image(x * T + 8, y * T + 15, 'objects', fr).setOrigin(.5, 1).setDepth(y * T + 14);
    if (c.dead) img.setTint(0x8a7050);
    const parts = [img, ...parts0];
    if (cropRipe(c)) { const sp = this.add.rectangle(x * T + 13, y * T + 3, 2, 2, 0xfff7c0).setDepth(y * T + 15); this.tweens.add({ targets: sp, alpha: .2, duration: 500, yoyo: true, repeat: -1 }); parts.push(sp); }
    this.cropSprites[k] = parts;
  }
  /* paths blend into grass: each corner of a tile takes the kind of any path touching it */
  pathKind(x, y) { const v = S.paths[x + ',' + y]; return !v ? 0 : v === 'dirt' ? 1 : 3; }
  vertexKind(vx, vy) {
    const base = farm.V[vy] ? farm.V[vy][vx] : 0; if (base === 2) return 2;
    let k = base;
    for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const p = this.pathKind(vx + dx, vy + dy); if (p === 3) return 3; if (p) k = 1; }
    return k;
  }
  renderTile(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = x + ',' + y, i = y * W + x, tl = S.tilled[k];
    if (tl) return this.ground.putTileAt(FILL_ROW * 16 + (tl.w ? 5 : 4), x, y);
    const c = [this.vertexKind(x, y), this.vertexKind(x + 1, y), this.vertexKind(x + 1, y + 1), this.vertexKind(x, y + 1)];
    if (c.includes(2) || !c.some(v => v)) return this.ground.putTileAt(farm.tiles[i], x, y);
    const own = this.pathKind(x, y), kind = own || (c.includes(3) ? 3 : 1), row = kind === 3 ? 3 : 0;
    const bits = (c[0] === 0) * 8 + (c[1] === 0) * 4 + (c[2] === 0) * 2 + (c[3] === 0);
    if (!bits) return this.ground.putTileAt(kind === 3 ? FILL_ROW * 16 + 6 + ((x + y) & 1) : FILL_ROW * 16 + 3, x, y);
    this.ground.putTileAt(row * 16 + bits, x, y);
  }
  drawPath(x, y) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.renderTile(x + dx, y + dy); }
  redrawFenceAround(x, y) { this.drawFence(x, y); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (S.fences[(x + dx) + ',' + (y + dy)]) this.drawFence(x + dx, y + dy); }
  drawFence(x, y) {
    const k = x + ',' + y;
    if (this.fenceSprites[k]) { this.fenceSprites[k].forEach(s => s.destroy()); delete this.fenceSprites[k]; }
    const f = S.fences[k]; if (!f) return;
    const at = (dx, dy) => S.fences[(x + dx) + ',' + (y + dy)];
    const L = at(-1, 0), Rr = at(1, 0), U = at(0, -1), D = at(0, 1);
    const cx = x * T + 8, by = y * T + 15, parts = [], dep = by - .5;
    const add = o => { parts.push(o); return o; };
    if (f.t === 'gate') {
      const vertical = !(L || Rr) && (U || D);
      if (!f.open) {
        if (vertical) add(this.add.image(cx, by + 2, 'gate_v').setOrigin(.5, 1).setDepth(dep));
        else add(this.add.image(cx, by, 'objects', 'gate_mid').setOrigin(.5, 1).setDepth(dep));
      } else {
        if (vertical) add(this.add.image(cx, by - 12, 'gate_v').setOrigin(.5, 1).setDepth(dep).setScale(1, .35));
        else add(this.add.image(cx - 6, by, 'objects', 'fence_end').setOrigin(.5, 1).setDepth(dep).setScale(.6, 1));
      }
    } else {
      if (Rr) add(this.add.image(cx, by, 'objects', 'rail_h').setOrigin(0, 1).setDepth(dep));
      if (D) add(this.add.image(cx, by - 9, 'rail_v').setOrigin(.5, 0).setDepth(dep + .05));
      add(this.add.image(cx, by, 'objects', 'fence_end').setOrigin(.5, 1).setDepth(dep + .1));
    }
    this.fenceSprites[k] = parts;
  }
  pickUpFence(x, y) {
    const k = x + ',' + y, f = S.fences[k];
    this.swing('axe', () => {
      Sound.play('chop');
      delete S.fences[k]; this.redrawFenceAround(x, y);
      this.giveDrops({ [f.t]: 1 }, x * T + 8, y * T);
    });
  }
  splash(x, y, n = 6) {
    for (let i = 0; i < n; i++) { const r = this.add.rectangle(x * T + 4 + Math.random() * 8, y * T + 2, 1, 2, 0x8fd3ea).setDepth(9e6); this.tweens.add({ targets: r, y: y * T + 11 + Math.random() * 4, alpha: 0, duration: 300 + Math.random() * 150, onComplete: () => r.destroy() }); }
  }
  readMail() {
    S.mailRead = true; this.mailFlag.setVisible(false); Sound.play('pop');
    let extra = '';
    if (!S.starter) { const left = inv.add('turnip_seeds', 15); S.starter = true; renderHotbar(); extra = `<p style="text-align:center"><img src="${ICONS.turnip_seeds}" style="width:32px;image-rendering:pixelated;vertical-align:middle"> <b>Received 15 Turnip Seeds</b>${left ? ' (backpack full!)' : ''}</p>`; }
    openModal('A letter', `<div class="letter">${letterText()}</div>${extra}`);
  }
  harvest(x, y) {
    const k = x + ',' + y, tl = S.tilled[k], c = tl.crop, C = CROPS[c.type];
    const n = Math.random() < .1 ? 2 : 1, q = rollQuality(tl), id = q && QUAL[C.item] ? QUAL[C.item][q - 1] : C.item;
    delete tl.crop; delete tl.fq; this.drawTilled(x, y);
    if (q) toast(`${q === 2 ? '🌟 Gold' : '⭐ Silver'} quality ${ITEMS[C.item].name}!`, 1400);
    this.giveDrops({ [id]: n }, x * T + 8, y * T + 4);
  }
  openBin() {
    const render = () => {
      const rows = []; inv.slots.forEach((s, i) => { if (s && ITEMS[s.id].sell) rows.push(`<div class="recipe"><img src="${iconFor(s.id)}"><div class="g"><b>${ITEMS[s.id].name} ×${s.n}</b><small>${ITEMS[s.id].sell}g each · ${ITEMS[s.id].sell * s.n}g</small></div><button class="btn gold" data-a="ship" data-i="${i}">Ship</button></div>`); });
      const total = S.shipped.reduce((a, e) => a + ITEMS[e.id].sell * e.n, 0);
      const inBin = S.shipped.length ? S.shipped.map(e => `${e.n} ${ITEMS[e.id].name}`).join(', ') : 'Nothing yet';
      return `<p>Anything in the bin is collected tonight. You're paid when you wake up.</p><p><b>In the bin:</b> ${inBin}${total ? ` (${total}g)` : ''}</p>${rows.join('') || '<p>You have nothing to sell yet. Crops, wood, stone and fiber can all be shipped.</p>'}${S.shipped.length ? '<div class="row"><button class="btn" data-a="undo">Take back the last item</button></div>' : ''}`;
    };
    openModal('Shipping bin', render(), (a, d) => {
      if (a === 'ship') {
        const i = +d.i, s = inv.slots[i]; if (!s) return;
        const ship = k => {
          const cur = inv.slots[i]; if (!cur || cur.id !== s.id) return; k = Math.min(k, cur.n);
          const last = S.shipped[S.shipped.length - 1]; if (last && last.id === cur.id) last.n += k; else S.shipped.push({ id: cur.id, n: k });
          S.flags.shipped = 1; cur.n -= k; if (cur.n <= 0) inv.slots[i] = null; inv.emit(); Sound.play('coin'); refreshModal();
        };
        if (s.n === 1) ship(1); else askQty({ title: `Ship ${ITEMS[s.id].name}`, icon: iconFor(s.id), max: s.n, unit: ITEMS[s.id].sell, verb: 'Ship' }, ship);
      }
      if (a === 'undo') { const e = S.shipped.pop(); const left = inv.add(e.id, e.n); if (left) { e.n = left; S.shipped.push(e); toast('Not enough room in your backpack.'); } }
      $('mBody').innerHTML = render();
    });
  }
  /* ---------- generic build preview: highlight the plot, ghost the building, confirm */
  buildPreview(def) {
    const g = this.add.graphics().setDepth(9e6 - 6);
    const ghost = def.ghostKey ? this.add.image(0, 0, def.ghostKey, def.ghostFrame).setOrigin(.5, 1).setAlpha(.55).setDepth(9e6 - 5) : def.zone ? this.add.circle(0, 0, 4, 0x6ab0ff, .9).setDepth(9e6 - 5) : this.add.image(0, 0, def.atlas, def.frame).setOrigin(.5, 1).setAlpha(.5).setDepth(9e6 - 5);
    this.tweens.add({ targets: ghost, alpha: .3, yoyo: true, repeat: -1, duration: 700 });
    let jobs = 0;
    const cam = this.cameras.main; cam.stopFollow(); this.paused = true;
    let at = { ...def.at }, mustClear = 0;
    const fits = a => { if (def.fixed) return false; const [x0, y0, x1, y1] = def.areaFor(a); return x0 >= 3 && y0 >= 3 && x1 <= W - 4 && y1 <= H - 4; };
    const hardAt = (x, y) => { const k = x + ',' + y, i = y * W + x; return !!(S.tilled[k] || S.fences[k] || S.paths[k] || S.objs[k] || farm.waterish[i] || (farm.dirtish[i] && !def.allowDirt) || (farm.blocked[i] && !(x === RANCH.sign.x && y === RANCH.sign.y))) && !(def.ignore && def.ignore(x, y)); };
    const draw = () => {
      const [x0, y0, x1, y1] = def.areaFor(at); g.clear(); mustClear = 0;
      if (def.zone) {
        const tg = def.targetsIn([x0, y0, x1, y1]); jobs = tg.size;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const on = tg.has(x + ',' + y); g.fillStyle(on ? 0xffd23a : 0x6ab0ff, on ? .5 : .2).fillRect(x * T, y * T, T, T); g.lineStyle(1, 0xffffff, .15).strokeRect(x * T + .5, y * T + .5, T - 1, T - 1); }
        g.lineStyle(2, 0xfffbe8, .95).strokeRect(x0 * T, y0 * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T);
        ghost.setPosition(at.cx * T + 8, at.by * T + 8); return;
      }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const hard = hardAt(x, y), soft = !hard && farm.occ[y * W + x] >= 0;
        if (hard) mustClear++;
        g.fillStyle(hard ? 0xff4a3a : soft ? 0xffb03a : 0x7cf27a, hard ? .55 : soft ? .38 : .25).fillRect(x * T, y * T, T, T);
        g.lineStyle(1, 0xffffff, .18).strokeRect(x * T + .5, y * T + .5, T - 1, T - 1);
      }
      g.lineStyle(2, 0xfffbe8, .95).strokeRect(x0 * T, y0 * T, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T);
      if (def.ghostAt) { const [gx, gy] = def.ghostAt(at); ghost.setPosition(gx, gy); } else ghost.setPosition(def.gx ?? at.cx * T + 8, def.gy ?? at.by * T + 16);
    };
    const frame = (dur = 350) => {
      const bb = $('buildbar'), side = innerWidth > innerHeight * 1.25; bb.classList.toggle('side', side);
      const r = bb.getBoundingClientRect(), top = 60, [x0, y0, x1, y1] = def.areaFor(at);
      const rw = side ? r.left - 8 : innerWidth, rh = (side ? innerHeight - 70 : r.top - 6) - top;
      const d = DPR(), zc = Math.max(.75, Math.min(this.zoomBefore / d, rw * .8 / ((x1 - x0 + 1) * T), rh * .8 / ((y1 - y0 + 1) * T)));
      const zd = Math.max(1, Math.floor(zc * d)), z = zd / d;
      const sx = rw / 2, sy = top + rh / 2, wx = (x0 + x1 + 1) * T / 2, wy = (y0 + y1 + 1) * T / 2;
      cam.zoomTo(zd, dur, 'Sine.easeInOut'); cam.pan(wx + (innerWidth / 2 - sx) / z, wy + (innerHeight / 2 - sy) / z, dur, 'Sine.easeInOut');
    };
    const move = (cx, by, reframe) => { const n = { cx, by }; if (!fits(n) || (n.cx === at.cx && n.by === at.by)) return; at = n; draw(); render(); if (reframe) frame(); };
    // drag the plot around the map
    let grab = null;
    const down = p => { const tx = Math.floor(p.worldX / T), ty = Math.floor(p.worldY / T), [x0, y0, x1, y1] = def.areaFor(at); grab = tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1 ? { dx: at.cx - tx, dy: at.by - ty } : { dx: 0, dy: 0 }; if (!(tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1)) move(tx, ty + 3); };
    const drag = p => { if (!grab || !p.isDown) return; move(Math.floor(p.worldX / T) + grab.dx, Math.floor(p.worldY / T) + grab.dy); };
    const up = () => { grab = null; };
    this.input.on('pointerdown', down); this.input.on('pointermove', drag); this.input.on('pointerup', up);
    const close = () => {
      this.input.off('pointerdown', down); this.input.off('pointermove', drag); this.input.off('pointerup', up);
      g.destroy(); ghost.destroy(); $('buildbar').classList.remove('show', 'side'); this.applyZoom(); cam.startFollow(this.player, true, 1, 1); this.paused = false; if (this.p) this.p.busy = .3;
    };
    const render = () => {
      const [x0, y0, x1, y1] = def.areaFor(at);
      if (def.zone) {
        $('buildbar').innerHTML = `<div class="bt"><b>${def.name}</b> <small>${x1 - x0 + 1}×${y1 - y0 + 1} work area</small></div><small>${def.desc} Speed: <b>${def.speed}</b>.</small>
          <div class="legend"><i style="background:#ffd23a"></i>Jobs to do (${jobs}) <i style="background:#6ab0ff"></i>Rest of the area</div>
          <div class="mv"><button class="btn" data-a="mv" data-dx="-1" data-dy="0">◀</button><button class="btn" data-a="mv" data-dx="0" data-dy="-1">▲</button><button class="btn" data-a="mv" data-dx="0" data-dy="1">▼</button><button class="btn" data-a="mv" data-dx="1" data-dy="0">▶</button></div>
          <small>Drag the area on the map, or use the arrows.</small>
          <div class="row"><button class="btn gold" data-a="build">Work here</button><button class="btn" data-a="close">Cancel</button></div>`;
        return;
      }
      let ok = S.gold >= def.gold;
      if (def.move) {
        $('buildbar').innerHTML = `<div class="bt"><b>Move: ${def.name}</b></div><small>Drag it on the map, or use the arrows. Trees, rocks and weeds in the way are cleared for you.</small>
          <div class="legend"><i style="background:#7cf27a"></i>Free <i style="background:#ffb03a"></i>Cleared for you <i style="background:#ff4a3a"></i>In the way</div>
          <div class="mv"><button class="btn" data-a="mv" data-dx="-1" data-dy="0">◀</button><button class="btn" data-a="mv" data-dx="0" data-dy="-1">▲</button><button class="btn" data-a="mv" data-dx="0" data-dy="1">▼</button><button class="btn" data-a="mv" data-dx="1" data-dy="0">▶</button></div>
          <div style="font-size:13px;margin:3px 0">${mustClear ? `<b style="color:#b03a2e">${mustClear} red tile${mustClear > 1 ? 's' : ''} in the way.</b>` : '<b style="color:var(--green2)">It fits here.</b>'}</div>
          <div class="row"><button class="btn gold" data-a="build" ${mustClear ? 'disabled' : ''}>Move here</button><button class="btn" data-a="close">Cancel</button></div>`;
        return;
      }
      const needs = Object.entries(def.cost).map(([k, n]) => { const have = inv.count(k); if (have < n) ok = false; return `<span class="need ${have < n ? 'no' : ''}"><img src="${iconFor(k)}">${Math.min(have, n)}/${n}</span>`; }).join('') + `<span class="need ${S.gold < def.gold ? 'no' : ''}"><img src="${ICONS.coin}">${def.gold.toLocaleString()}g</span>`;
      const blocked = mustClear ? `<b style="color:#b03a2e">${mustClear} red tile${mustClear > 1 ? 's' : ''} in the way.</b> Clear them or move the plot.` : '<b style="color:var(--green2)">The plot is ready.</b>';
      $('buildbar').innerHTML = `<div class="bt"><b>${def.name}</b> <small>${x1 - x0 + 1}×${y1 - y0 + 1} tiles</small></div><small>${def.fixed ? def.desc : 'Drag the plot on the map, or use the arrows, to choose where it goes.'}</small>
        <div class="legend"><i style="background:#7cf27a"></i>Free <i style="background:#ffb03a"></i>Cleared for you <i style="background:#ff4a3a"></i>In the way</div>
        ${def.fixed ? '' : '<div class="mv"><button class="btn" data-a="mv" data-dx="-1" data-dy="0">◀</button><button class="btn" data-a="mv" data-dx="0" data-dy="-1">▲</button><button class="btn" data-a="mv" data-dx="0" data-dy="1">▼</button><button class="btn" data-a="mv" data-dx="1" data-dy="0">▶</button></div>'}
        <div>${needs}</div><div style="font-size:13px;margin:3px 0">${blocked}</div>
        <div class="row"><button class="btn gold" data-a="build" ${ok && !mustClear ? '' : 'disabled'}>Build here</button><button class="btn" data-a="close">Close</button></div>`;
    };
    this.zoomBefore = cam.zoom;
    this.events.once('shutdown', () => { $('buildbar').classList.remove('show', 'side'); });
    $('toast').classList.remove('show'); draw(); render(); $('buildbar').classList.add('show'); frame();
    $('buildbar').onclick = e => {
      const el = e.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a;
      Sound.play('click');
      if (a === 'mv') return move(at.cx + +el.dataset.dx, at.by + +el.dataset.dy, true);
      if (a === 'close') { close(); if (def.move) this.moveMode(); return; }
      if (a === 'build' && def.zone) { close(); def.onBuild(at); return; }
      if (a === 'build' && def.move) { if (mustClear) return Sound.play('error'); const [x0, y0, x1, y1] = def.areaFor(at); close(); this.clearDebrisIn(x0, y0, x1, y1); Sound.play('place'); def.onBuild(at); return; }
      if (a === 'build') {
        if (mustClear || S.gold < def.gold || Object.entries(def.cost).some(([k, n]) => inv.count(k) < n)) return Sound.play('error');
        for (const [k, n] of Object.entries(def.cost)) inv.remove(k, n);
        S.gold -= def.gold; updateHUD(); renderHotbar(); Sound.play('coin'); close(); def.onBuild(at);
      }
    };
  }
  drawObj(x, y) {
    const k = x + ',' + y;
    if (this.objSprites[k]) { this.objSprites[k].forEach(o => o.destroy()); delete this.objSprites[k]; }
    const o = S.objs[k]; if (!o || o.part) return;
    const [key, frame] = this.objTex(o.art || o.t);
    const img = this.add.image(x * T + (o.w || 1) * 8, y * T + 16, key, frame).setOrigin(.5, 1).setDepth(y * T + 15);
    const parts = [img];
    if (objReady(o)) { const sp = this.add.star(x * T + (o.w || 1) * 8 + 5, y * T - (o.t === 'well' ? 10 : 2), 4, 1.2, 3.5, 0xfff3a0).setDepth(9e6 - 2); this.tweens.add({ targets: sp, alpha: .3, scale: 1.4, yoyo: true, repeat: -1, duration: 500 }); parts.push(sp); }
    if (o.t === 'lamp') { const gl = this.add.circle(x * T + 8, y * T - 22, 18, 0xffd27a, 0).setDepth(9e6 - 10).setBlendMode(Phaser.BlendModes.ADD); parts.push(gl); this.glows.push(gl); }
    if (GLOWS.includes(o.t)) { const gl = this.add.circle(x * T + 8, y * T - 6, 16, 0xffd27a, 0).setDepth(9e6 - 10).setBlendMode(Phaser.BlendModes.ADD); parts.push(gl); this.glows.push(gl); }
    this.objSprites[k] = parts;
  }
  useCompost(o, x, y) {
    if (o.n && S.day >= o.doneDay) {
      const out = compostOut(o), left = inv.add('fertiliser', out); if (left === out) return toast('Your backpack is full!');
      this.floatText(`+${out - left} Fertiliser`, x * T + 8, y * T); o.n = 0; o.boost = 0; Sound.play('pop'); renderHotbar(); this.drawObj(x, y); return;
    }
    if (o.n) { const d = o.doneDay - S.day; return toast(`It's breaking down nicely. Ready in ${d} day${d > 1 ? 's' : ''}.`, 2000); }
    if (inv.count('fiber') < 10) return toast('Put in 10 fiber to make compost. Cut weeds with your scythe to get fiber.', 2600);
    inv.remove('fiber', 10); o.n = 1; o.doneDay = S.day + compostDays(o); renderHotbar(); Sound.play('plant'); this.chips(x * T + 8, y * T + 6, 0x6b8a3a);
    toast(`You filled the compost bin. Fertiliser in ${compostDays(o)} days.`, 2000); this.drawObj(x, y);
  }
  objTex(t) {
    const [tex, fr] = OBJ_ART[t];
    if (tex === 'ic' || tex === 'cv') { const key = tex + '_' + fr; if (!this.textures.exists(key)) this.textures.addCanvas(key, tex === 'ic' ? ICON_CANVAS[fr] : SAP_CANVAS[fr]); return [key, undefined]; }
    return [tex, fr];
  }
  useObj(x, y) {
    let k = x + ',' + y; if (S.objs[k] && S.objs[k].part) { k = S.objs[k].part; [x, y] = k.split(',').map(Number); }
    const o = S.objs[k]; if (!o) return;
    this.face(x, y);
    const h = held(), tool = h && ITEMS[h.id].tool;
    if (o.t === 'mine' && tool === 'pickaxe') {
      return this.swing('pickaxe', () => {
        Sound.play('pick'); this.chips(x * T + 24, y * T + 2, 0x9a968c, 6);
        o.dig = (o.dig || 0) + 1;
        if (o.dig >= mineHits()) { o.dig = 0; this.giveDrops({ stone: 1 }, x * T + 24, y * T - 4); }
        else this.floatText('·'.repeat(o.dig), x * T + 24, y * T);
      });
    }
    if (tool === 'axe' || tool === 'pickaxe') {
      if (o.t === 'chest' && o.items.some(Boolean)) { Sound.play('error'); return toast('Empty the chest before picking it up.'); }
      return this.swing(tool, () => {
        if (!S.objs[k]) return;
        const left = inv.add(o.item || o.t, 1); if (left) { toast('Your backpack is full!'); return; }
        for (let i = 1; i < (o.w || 1); i++) delete S.objs[(x + i) + ',' + y];
        delete S.objs[k]; this.drawObj(x, y); this.glows = this.glows.filter(g => g.active); Sound.play('pop'); renderHotbar();
      }, 0);
    }
    if (o.t === 'well') {
      if (tool !== 'can') return toast('A deep, cool well. Use your watering can on it to fill up.', 2200);
      if (S.water >= canMax()) return toast('Your watering can is already full.', 1200);
      return this.swing('can', () => { S.water = canMax(); Sound.play('fill'); renderHotbar(); toast('Filled your watering can at the well.', 1400); }, 1);
    }
    if (o.t === 'compost') return this.useCompost(o, x, y);
    if (o.t === 'beehive') {
      if (!o.honey) { const left = Math.max(1, beeDays(o) - (S.day - (o.last || o.day || S.day))); return toast(`The bees are busy. Honey in about ${left} day${left > 1 ? 's' : ''}.`, 2000); }
      const left = inv.add('honey', o.honey); if (left === o.honey) return toast('Your backpack is full!');
      this.floatText(`+${o.honey - left} Honey`, x * T + 8, y * T); o.honey = left; o.last = S.day; Sound.play('pop'); renderHotbar(); this.drawObj(x, y); return;
    }
    if (o.t === 'trough') return openTrough(o);
    if (o.t === 'fishhut') return collectFish(this, o, x, y);
    if (o.t === 'pot') return openCooking();
    if (o.t === 'mine') return toast('A little quarry. Hit it with your pickaxe for stone, or let a Stone Fablemon work it.', 2600);
    if (o.t === 'chest') return openChest(o);
    if (o.t === 'sprinkler') return toast(ITEMS[o.item || 'sprinkler'].desc, 2400);
    if (SAPLING_TREE[o.t]) { const left = Math.max(1, 7 - (S.day - (o.day || S.day))); return toast(`${ITEMS[o.t.replace('sap_', '') + '_sapling'].name}: about ${left} more day${left > 1 ? 's' : ''} until it's a tree.`, 2200); }
    toast(ITEMS[o.t].name, 1000);
  }
  clearDebrisIn(x0, y0, x1, y1) {
    for (const d of Object.values(farm.debris)) {
      if (!d || d.gone || d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue;
      this.clearOcc(d); d.gone = true; if (this.sprites[d.id]) this.sprites[d.id].destroy();
      if (d.id >= 100000) S.extra = S.extra.filter(e => e.id !== d.id); else S.debris[d.id] = 0;
    }
  }
  setupRanch() {
    const sg = RANCH.sign;
    if (S.ranch === 2) {
      const at = ranchPos(), [x0, y0, x1, y1] = ranchArea(at); this.clearDebrisIn(x0, y0, x1, y1);
      const f = ASSET.townJson.frames.ranch.frame, cxp = at.cx * T + 8;
      const bx0 = Math.floor((cxp - f.w / 2 + 4) / T), bx1 = Math.floor((cxp + f.w / 2 - 5) / T);
      for (let y = at.by - 2; y <= at.by; y++) for (let x = bx0; x <= bx1; x++) farm.blocked[y * W + x] = 1;
      this.ranchImg = this.add.image(cxp, at.by * T + 16, 'town', 'ranch').setOrigin(.5, 1).setDepth(at.by * T + 15);
      this.tall.push(this.ranchImg);
    } else {
      this.clearDebrisIn(sg.x, sg.y, sg.x, sg.y); farm.blocked[sg.y * W + sg.x] = 1;
      this.signImg = this.add.image(sg.x * T + 8, sg.y * T + 15, 'objects', 'signpost').setOrigin(.5, 1).setDepth(sg.y * T + 15);
    }
  }
  spawnRoamers() {
    for (const r of this.roamers || []) r.spr.destroy();
    this.roamers = [];
    if (S.ranch !== 2) return;
    const d = ranchDoor();
    for (const m of S.mons.filter(m => m.loc === 'ranch' && m.out)) {
      if (!this.textures.exists('mon_' + walkSp(m.sp))) continue;
      monAnims(this, walkSp(m.sp));
      let x = d.x, y = d.y + 2;
      const [ax0, ay0, ax1, ay1] = m.job ? jobArea(m.job) : [d.x - 5, d.y + 1, d.x + 5, d.y + 6];
      for (let i = 0; i < 40; i++) { const tx = ax0 + Math.floor(Math.random() * (ax1 - ax0 + 1)), ty = ay0 + Math.floor(Math.random() * (ay1 - ay0 + 1)); if (this.passable(tx, ty) && !this.roamerAt(tx, ty) && !S.tilled[tx + ',' + ty]) { x = tx; y = ty; break; } }
      const spr = this.add.sprite(x * T + 8, y * T + 15, 'mon_' + walkSp(m.sp), 0).setOrigin(.5, 1).setDepth(y * T + 15);
      this.shadow(spr, Math.round(spr.width * .55), 5);
      this.roamers.push({ m, spr, x, y, px: x * T + 8, py: y * T + 8, dir: 'down', moving: false, steps: 0, wait: Math.random() * 2 });
    }
  }
  roamerAt(x, y) { return (this.roamers || []).find(r => r.x === x && r.y === y); }
  updateRoamers(dt) {
    const d = ranchDoor();
    for (const r of this.roamers || []) {
      if (r.moving) {
        const tx = r.x * T + 8, ty = r.y * T + 8, dx = tx - r.px, dy = ty - r.py, dd = Math.hypot(dx, dy), sp = 2.4 * T * dt;
        if (dd <= sp) { r.px = tx; r.py = ty; r.moving = false; } else { r.px += dx / dd * sp; r.py += dy / dd * sp; }
        r.spr.setPosition(Math.round(r.px), Math.round(r.py) + 7).setDepth(r.py + 7);
        if (r.moving) continue;
      }
      if (r.task) { this.workStep(r, dt); continue; }
      r.wait -= dt; if (r.wait > 0) continue;
      if (r.steps <= 0) {
        if (r.spr.anims.isPlaying) { r.spr.stop(); r.spr.setFrame(DIRS.indexOf(r.dir) * 4); }
        r.steps = 1 + Math.floor(Math.random() * 4); r.dir = DIRS[Math.floor(Math.random() * 4)];
        r.wait = 1.2 + Math.random() * 3; r.spr.setFrame(DIRS.indexOf(r.dir) * 4); continue;
      }
      const [vx, vy] = DV[r.dir], nx = r.x + vx, ny = r.y + vy;
      const inZone = r.m.job ? (([a0, b0, a1, b1]) => nx >= a0 && nx <= a1 && ny >= b0 && ny <= b1)(jobArea(r.m.job)) : Math.abs(nx - d.x) + Math.abs(ny - d.y - 4) <= 13;
      const ok = this.passable(nx, ny) && !(this.p.x === nx && this.p.y === ny) && !this.roamerAt(nx, ny) && inZone && (r.m.job || !S.tilled[nx + ',' + ny]);
      if (!ok) { r.steps = 0; r.wait = .5; continue; }
      r.x = nx; r.y = ny; r.moving = true; r.steps--;
      const k = `${walkSp(r.m.sp)}_${r.dir}`; if (r.spr.anims.currentAnim?.key !== k || !r.spr.anims.isPlaying) r.spr.play(k);
    }
  }
  /* a worker walks next to its job tile, then does it */
  workStep(r, dt) {
    const t = r.task; r.taskT = (r.taskT || 0) + dt;
    const dist = Math.abs(t.x - r.x) + Math.abs(t.y - r.y);
    if (dist <= 1 || r.taskT > 6) {
      if (dist) { r.dir = t.x > r.x ? 'right' : t.x < r.x ? 'left' : t.y > r.y ? 'down' : 'up'; }
      r.spr.stop(); r.spr.setFrame(DIRS.indexOf(r.dir) * 4);
      this.tweens.add({ targets: r.spr, y: r.spr.y - 3, yoyo: true, duration: 110 });
      doJob(r.m, t); r.m.mining = !!t.mine; r.task = null; r.m.jobT = 0; r.wait = .8 + Math.random(); r.steps = 0; return;
    }
    const opts = [];
    for (const dd of DIRS) { const [vx, vy] = DV[dd], nx = r.x + vx, ny = r.y + vy; if (!this.passable(nx, ny) || this.roamerAt(nx, ny) || (this.p.x === nx && this.p.y === ny)) continue; opts.push([Math.abs(t.x - nx) + Math.abs(t.y - ny) + Math.random() * .5, dd, nx, ny]); }
    opts.sort((a, b) => a[0] - b[0]);
    if (!opts.length || opts[0][0] > dist + .5) { r.taskT += dt * 4; return; }
    const [, dd, nx, ny] = opts[0];
    r.dir = dd; r.x = nx; r.y = ny; r.moving = true;
    const k = `${walkSp(r.m.sp)}_${r.dir}`; if (r.spr.anims.currentAnim?.key !== k || !r.spr.anims.isPlaying) r.spr.play(k);
  }
  pet(r) {
    this.face(r.x, r.y); this.p.busy = .4;
    r.steps = 0; r.wait = 2; r.dir = this.p.x > r.x ? 'right' : this.p.x < r.x ? 'left' : this.p.y > r.y ? 'down' : 'up';
    r.spr.stop(); r.spr.setFrame(DIRS.indexOf(r.dir) * 4);
    this.floatText('♥', r.px, r.py - 14); Sound.play('pop');
    this.tweens.add({ targets: r.spr, y: r.spr.y - 4, yoyo: true, duration: 120 });
    if (r.m.petDay !== S.day) { r.m.petDay = S.day; r.m.bond = (r.m.bond || 0) + 1; }
    toast(`${monName(r.m)} looks happy to see you.`, 1600);
  }
  enterHouse() {
    if (this.sleeping) return;
    this.sleeping = true; Sound.play('door'); $('fade').style.opacity = 1;
    setTimeout(() => { S.spawn = { scene: 'house', x: Math.floor(HOUSE_ROOM[S.house || 0][0] / 2), y: HOUSE_ROOM[S.house || 0][1] - 2, dir: 'up' }; this.scene.start('house'); }, 320);
  }
  bump(x, y) {
    if (S.ranch === 2 && x === ranchDoor().x && y === ranchDoor().y && this.p.dir === 'up' && !(this.p.busy > 0)) return this.act({ type: 'ranch' });
    if (x >= W - 1 && y >= 18 && y <= 22) return travel(this, 'town', { x: 1, y: 24, dir: 'right' });
    if (y >= H - 1 && x >= 37 && x <= 42) {
      if (!S.mons.length) return toast("The long grass ahead is full of wild Fablemon. It's not safe without one of your own. Elder Bramble in Smallroot might help.", 3500);
      return travel(this, 'route1', { x: Math.max(19, Math.min(21, x - ROUTE_OFF)), y: 1, dir: 'down' });
    }
  }
  arriveHook(x, y) { if (x >= W - 1 || y >= H - 1) this.bump(x, y); }
}
function travel(sc, to, sp) {
  if (sc.sleeping) return;
  sc.sleeping = true; $('fade').style.opacity = 1; Sound.play('step', 0);
  setTimeout(() => { S.spawn = { scene: to, ...sp }; sc.scene.start(to); }, 380);
}

/* -------------------------------------------------------------- House */
let HW = 10, HH = 8, HOUSE_BLOCK = new Set();
const HDX = () => Math.floor(HW / 2);
class House extends World {
  constructor() { super('house'); }
  create() {
    [HW, HH] = HOUSE_ROOM[S.house || 0];
    HOUSE_BLOCK = new Set(['1,2', '1,3', '7,2', '8,2', '4,4', '5,4', '9,2', '3,4']);
    this.initWorld(HW, HH);
    houseTextures(this);
    const ox = 0, oy = 0;
    this.add.rectangle(-200, -200, HW * T + 400, HH * T + 400, 0x120d0a).setOrigin(0).setDepth(-10);
    for (let x = 0; x < HW; x++) this.add.image(ox + x * T, oy, 'h_wall').setOrigin(0).setDepth(-5);
    for (let y = 2; y < HH; y++) for (let x = 0; x < HW; x++) this.add.image(x * T, y * T, 'h_floor').setOrigin(0).setDepth(-5);
    this.add.rectangle(0, 0, HW * T, HH * T).setOrigin(0).setStrokeStyle(2, 0x5e3b20).setDepth(-4);
    for (let x = 3; x < HW - 1; x += 3) if (x !== 9 || HW > 10) this.add.image(x * T, 1 * T - 2, 'h_window').setOrigin(.5, .5).setDepth(-3);
    this.add.image(5 * T, 4.6 * T, 'h_rug').setOrigin(.5).setDepth(-2);
    this.add.image(HDX() * T + 8, (HH - 1) * T + 13, 'h_mat').setOrigin(.5, 1).setDepth(-1);
    // extra furniture in bigger houses
    const put = (k, x, y, ox = 8) => { this.add.image(x * T + ox, y * T + 15, k).setOrigin(.5, 1).setDepth(y * T + 15); };
    if (S.house >= 1) { put('h_plant', HW - 1, 2); HOUSE_BLOCK.add((HW - 1) + ',2'); put('h_plant', 0, HH - 2); HOUSE_BLOCK.add('0,' + (HH - 2)); }
    if (S.house >= 2) { this.add.image((HW - 4) * T, (HH - 3.4) * T, 'h_rug').setOrigin(.5).setDepth(-2); put('h_table', HW - 5, HH - 4, 16); put('h_chair', HW - 6, HH - 4); put('h_chair', HW - 3, HH - 4); for (const x of [HW - 6, HW - 5, HW - 4, HW - 3]) HOUSE_BLOCK.add(x + ',' + (HH - 4)); }
    if (S.house >= 3) { put('h_plant', HW - 1, HH - 2); HOUSE_BLOCK.add((HW - 1) + ',' + (HH - 2)); put('h_plant', 11, 2); put('h_plant', 12, 2); HOUSE_BLOCK.add('11,2'); HOUSE_BLOCK.add('12,2'); }
    this.add.image(1 * T + 8, 3 * T + 15, 'h_bed').setOrigin(.5, 1).setDepth(3 * T + 15);
    this.add.image(8 * T, 2 * T + 15, 'h_tvtable').setOrigin(.5, 1).setDepth(2 * T + 15);
    this.add.image(4 * T + 16, 4 * T + 15, 'h_table').setOrigin(.5, 1).setDepth(4 * T + 15);
    this.add.image(3 * T + 8, 4 * T + 15, 'h_chair').setOrigin(.5, 1).setDepth(4 * T + 14);
    this.add.image(9 * T + 8, 2 * T + 15, 'h_plant').setOrigin(.5, 1).setDepth(2 * T + 15);
    this.tvGlow = this.add.rectangle(8 * T - 6, 2 * T + 2, 12, 8, 0x9fd0f5).setOrigin(0).setAlpha(0).setDepth(2 * T + 16);

    const sp = S.spawn && S.spawn.scene === 'house' ? S.spawn : { x: HDX(), y: HH - 2, dir: 'up' };
    this.makePlayer(sp);
    const cam = this.cameras.main; this.applyZoom(); this.frameHook(); cam.setRoundPixels(true);
    this.scale.on('resize', this.onResize, this); this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput();
    Sound.theme('field');
    updateHUD(); renderHotbar(); FX.set(S.weather, true); this.fadeIn();
    if (S.morning) { const m = S.morning; S.morning = null; setTimeout(() => toast(m, 3600), 500); }
  }
  onResize() { this.applyZoom(); this.frameHook(); renderHotbar(); }
  // small rooms sit in the middle of the screen; big ones scroll with you
  frameHook() {
    const cam = this.cameras.main, vw = cam.width / cam.zoom, vh = cam.height / cam.zoom, rw = HW * T, rh = HH * T, px = this.player.x, py = this.player.y - 8;
    const cx = rw <= vw ? rw / 2 : Math.max(vw / 2, Math.min(rw - vw / 2, px)), cy = rh <= vh ? rh / 2 : Math.max(vh / 2, Math.min(rh - vh / 2, py));
    cam.centerOn(Math.round(cx), Math.round(cy));
  }
  passable(x, y) { return x >= 0 && y >= 2 && x < HW && y < HH && !HOUSE_BLOCK.has(x + ',' + y); }
  thingAt(x, y) {
    if (x === 1 && (y === 2 || y === 3)) return 'bed';
    if ((x === 7 || x === 8) && y === 2) return 'tv';
    if (x === HDX() && y === HH - 1) return 'door';
    return null;
  }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T);
    const what = this.thingAt(x, y) || (x === 1 && y === 1 ? 'bed' : null) || ((x === 7 || x === 8) && y === 1 ? 'tv' : null);
    const p = this.p;
    if (what === 'door') { const path = this.path((a, b) => a === HDX() && b === HH - 1); if (path) { p.path = path; p.pending = null; } return; }
    if (what) {
      const tx = what === 'bed' ? 1 : 8, ty = what === 'bed' ? 3 : 2;
      const adj = (a, b) => what === 'bed' ? (a === 2 && (b === 2 || b === 3)) || (a === 1 && b === 4) : (b === 3 && (a === 7 || a === 8)) || (a === 6 && b === 2);
      if (adj(p.x, p.y)) { this.face(tx, ty); this.act({ what }); return; }
      const path = this.path(adj); if (path) { p.path = path; p.pending = { what, tx, ty }; }
      return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  act(t) {
    if (t.tx !== undefined) this.face(t.tx, t.ty);
    if (t.what === 'bed') return this.askSleep();
    if (t.what === 'tv') return this.watchTV();
  }
  actFacing() {
    const p = this.p; if (p.moving || this.paused) return;
    const [dx, dy] = DV[p.dir], what = this.thingAt(p.x + dx, p.y + dy);
    if (what === 'bed' || what === 'tv') this.act({ what });
  }
  tapGoal() { }
  askSleep() {
    const hurt = S.mons.some(m => m.hp < monStat(m, 'hp'));
    openModal('Bed', `<p>Go to sleep for the night? The game saves and your energy is restored.</p>${S.mons.length ? `<p><small>Or take a quick nap: one hour passes and your Fablemon are fully healed.</small></p>` : ''}<div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn gold" data-a="yes">Sleep</button>${S.mons.length ? `<button class="btn" data-a="nap" ${hurt ? '' : 'disabled'}>Nap (heal team)</button>` : ''}<button class="btn" data-a="no">Not yet</button></div>`, a => {
      closeModal();
      if (a === 'yes') goToBed(false);
      if (a === 'nap') { S.mons.forEach(restMon); S.time = Math.min(S.time + 60, 25 * 60); updateHUD(); $('fade').style.opacity = 1; Sound.play('snore'); setTimeout(() => { $('fade').style.opacity = 0; toast('Your Fablemon are fully healed.', 2200); }, 700); }
    });
  }
  watchTV() {
    this.tvGlow.setAlpha(.5); this.tweens.add({ targets: this.tvGlow, alpha: .2, yoyo: true, repeat: 5, duration: 120 });
    const t = seasonDay(S.day + 1), w = WX[S.tomorrow];
    const lines = { sun: "Clear skies and plenty of sunshine. Don't forget to water your crops!", rain: 'Rain is rolling in. Your crops will get a good soaking, so leave the watering can at home.', storm: 'Thunderstorms expected. Stay safe out there, though your crops will be watered.', snow: 'Snow is on the way. Bundle up!' }[S.tomorrow];
    openModal('Weather report', `<p style="font-size:28px;text-align:center;margin:4px 0">${w.icon}</p><p><b>Tomorrow, ${t.wd}. ${t.dom} ${t.season}: ${w.name}</b></p><p>${lines}</p>`);
  }
  arriveHook(x, y) {
    if (x === HDX() && y === HH - 1) {
      this.sleeping = true; Sound.play('door'); $('fade').style.opacity = 1;
      setTimeout(() => { S.spawn = { scene: 'farm', x: DOOR.x, y: DOOR.y + 1, dir: 'down' }; this.scene.start('farm'); }, 320);
    }
  }
}

/* ================================================================ Town
   Smallroot. Buildings start derelict and are restored through the notice
   board; every restoration helps the Hearthroot grow. */
const TW = 72, TH = 52;
const TOWN_IN = { x: 1, y: 24, dir: 'right' };
// cx/by: bottom-centre tile; door: tile offset from cx along the bottom row
const BUILDINGS = {
  homeA: { frame: 'homeA', cx: 9, by: 11, door: 0, name: 'Old cottage' },
  store: { frame: 'store', cx: 22, by: 12, door: 1, name: "Marigold's General Store" },
  hall: { frame: 'hall', cx: 36, by: 12, door: 0, name: "Warden's Hall" },
  clinic: { frame: 'clinic', cx: 50, by: 12, door: 0, name: 'Clinic' },
  homeB: { frame: 'homeB', cx: 63, by: 12, door: -1, name: 'Timber house' },
  bramble: { frame: 'bramble_house', cx: 9, by: 20, door: 0, name: "Elder Bramble's house" },
  station: { frame: 'station', cx: 64, by: 24, door: -1, name: 'Smallroot Station' },
  homeC: { frame: 'homeC', cx: 64, by: 33, door: 1, name: 'Long cottage' },
  tavern: { frame: 'tavern', cx: 10, by: 42, door: -2, name: 'The Sleepy Acorn' },
  smith: { frame: 'smith', cx: 26, by: 42, door: -1, name: 'Blacksmith' },
  carpenter: { frame: 'carpenter', cx: 41, by: 42, door: -1, name: "Carpenter's workshop" },
  ranch: { frame: 'ranch', cx: 58, by: 42, door: -1, name: 'Ranch' },
};
const ALWAYS_OPEN = { store: 1, bramble: 1 };
const PROJECTS = {
  fountain: { name: 'The square fountain', need: { stone: 40 }, gold: 300, blurb: 'Get the water flowing again.' },
  homeA: { name: 'Old cottage', need: { wood: 50, stone: 20 }, gold: 500, blurb: 'Poppy and her son Finn are looking for a home.' },
  carpenter: { name: "Carpenter's workshop", need: { wood: 80, stone: 20 }, gold: 800, blurb: 'Robin the carpenter moves in. Wood recipes need 25% less wood; house and ranch upgrades cost 15% less.' },
  smith: { name: 'Blacksmith', need: { stone: 80, wood: 30 }, gold: 1200, blurb: 'Gideon the smith moves in. Upgrade your tools and buy Sturdy Charms.' },
  homeB: { name: 'Timber house', need: { wood: 60, fiber: 20 }, gold: 700, blurb: 'Ivy the painter is looking for a home.' },
  tavern: { name: 'The Sleepy Acorn', need: { wood: 100, fiber: 40 }, gold: 1500, blurb: 'Old Barney opens the tavern. Hot meals, and three new recipes.' },
  clinic: { name: 'Clinic', need: { wood: 60, stone: 60 }, gold: 2000, blurb: 'Nurse Willa moves in. Free healing for your team, and medicine to buy.' },
  homeC: { name: 'Long cottage', need: { wood: 70, stone: 40 }, gold: 900, blurb: 'Captain Fenwick, a retired explorer, is looking for a home.' },
  ranch: { name: 'Ranch', need: { wood: 150, fiber: 80 }, gold: 2500, blurb: 'Hattie moves in and sells Fablemon Feed for your trough.' },
  station: { name: 'Smallroot Station', need: { wood: 200, stone: 150 }, gold: 5000, blurb: 'Stanley the stationmaster returns, and the trains run to Brookholt again.', needs: () => S.visited && S.visited.brookholt, lockText: 'Nobody knows where the old line leads any more. Find the other end of it first, somewhere past the bog.' },
  hall: { name: "Warden's Hall", need: { wood: 150, stone: 150 }, gold: 4000, blurb: 'Warden Rowan returns, and waits for a challenger.' },
};
function hearthStage() { const n = hearthLife(); let s = 0; LIFE_AT.forEach((v, i) => { if (n >= v) s = i; }); return s; }
const isOpen = id => ALWAYS_OPEN[id] || S.town.done[id];

const FACES = { bramble: 0, marigold: 1 };
const NPC_NAMES = { bramble: 'Elder Bramble', marigold: 'Marigold' };
const SHOP = [
  { id: 'root_charm', price: 40 }, { id: 'berry', price: 30 },
  { id: 'turnip_seeds', price: 20 }, { id: 'carrot_seeds', price: 35 }, { id: 'potato_seeds', price: 50 },
  { id: 'tomato_seeds', price: 50 }, { id: 'corn_seeds', price: 80 }, { id: 'pumpkin_seeds', price: 100 },
];

/* ---------------------------------------------------- dialogue box */
const Talk = (() => {
  let lines = [], i = 0, done = null, typing = null, full = '';
  const el = $('talk');
  function show() {
    const L = lines[i], who = L.who;
    if (L.img) { $('tface').style.backgroundImage = `url(${L.img})`; $('tface').style.backgroundSize = '80px 80px'; $('tface').style.backgroundPosition = '0 0'; }
    else { $('tface').style.backgroundImage = `url(${ASSET.portraits})`; $('tface').style.backgroundSize = ''; $('tface').style.backgroundPosition = `${-(L.f || 0) * 80}px ${-FACES[who] * 80}px`; }
        $('tname').innerHTML = `<span>${L.name || NPC_NAMES[who]}</span><span class="h">${L.name ? (L.hearts || '') : heartStr(who)}</span>`;
    full = L.t.replace(/\{name\}/g, S.name); let n = 0;
    clearInterval(typing); $('ttext').textContent = '';
    typing = setInterval(() => { n += 2; $('ttext').innerHTML = numHTML(full.slice(0, n)); if (n % 6 === 0) Sound.play('click'); if (n >= full.length) { clearInterval(typing); typing = null; } }, 28);
  }
  function next() {
    if (typing) { clearInterval(typing); typing = null; $('ttext').innerHTML = numHTML(full); return; }
    i++;
    if (i < lines.length) return show();
    el.classList.remove('show'); const sc = scene; if (sc && sc.p) sc.p.busy = .3; setTimeout(() => { if (sc && !$('modal').classList.contains('show')) sc.paused = false; }, 150);
    const f = done; done = null; if (f) setTimeout(f, 30);
  }
  el.addEventListener('pointerdown', e => { e.stopPropagation(); next(); });
  addEventListener('keydown', e => { if (el.classList.contains('show') && (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter')) { e.preventDefault(); next(); } });
  return {
    say(ls, cb) { lines = ls; i = 0; done = cb; el.classList.add('show'); if (scene) scene.paused = true; show(); },
    get open() { return el.classList.contains('show'); },
  };
})();

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function brambleLines() {
  const tw = S.town, st = hearthStage(), B = (t, f = 1) => ({ who: 'bramble', t, f });
  if (!tw.met.bramble) return [
    B("Ah, {name}! You found your way into Smallroot. Welcome, welcome!", 0),
    B("Not much to look at these days, I'm afraid. Most folk packed up for the cities years ago."),
    B("See that old tree in the square? That's the Hearthroot. It's stood here longer than anyone remembers.", 2),
    B("When the town thrived, so did she. Now she's barely hanging on, just like the rest of us."),
    B("But every building we bring back to life seems to wake her up a little.", 0),
    B("I've pinned the repair jobs on the notice board by the tree. Bring materials and a bit of gold, and we'll get to work."),
    B("And do pop into Marigold's store. She has seeds, and she's been dying for a new face to chat to.", 0),
  ];
  const pool = [
    ["Morning, {name}. How's the farm treating you?", 0],
    ["The notice board's got a few jobs on it, if you've any wood or stone going spare.", 1],
    ["My knees can tell when rain's coming. They're never wrong. Well, almost never.", 2],
    ["Your grandfather would have liked you, I think. He was stubborn about this place too.", 0],
  ];
  if (st === 0) pool.push(["Look at her branches. Not a single bud. Still, she's waited this long.", 2]);
  if (st >= 1) pool.push(["Did you see? Buds on the Hearthroot! I haven't seen that in twenty years!", 3]);
  if (st >= 2) pool.push(["With the Hearthroot this strong, we could open the Warden's Hall again. Imagine that.", 2]);
  if (isWet(S.weather)) pool.push(["Good soaking rain. The Hearthroot drinks it up. So do my boots, unfortunately.", 1]);
  if (S.town.done.fountain) pool.push(["Hear that fountain? Sounds like the old days.", 0]);
  const [t, f] = pick(pool); return [B(t, f)];
}
function marigoldLines(open) {
  const tw = S.town, M = (t, f = 1) => ({ who: 'marigold', t, f });
  if (!tw.met.marigold) return [
    M("Oh! A new face! You must be the one who took on the old farm. I'm Marigold.", 2),
    M("I run the store. Well, 'run' is a big word. It's mostly me, some seed packets and a very lazy cat."),
    M("I keep seeds for whatever's in season. Come by between 9 and 5 and I'll sort you out.", 0),
    M("It's been so quiet here. It's lovely to have someone new in town.", 3),
  ];
  const si = seasonIdx(S.day), pool = [
    ["Back again? Lovely. I was just reorganising the seed packets. Again.", 2],
    ["If you water every single day, your crops will love you for it.", 1],
    ["Bramble's been humming all week. I think you've given him hope.", 0],
  ];
  if (si === 3) pool.push(["Nothing grows in winter, love. Have a rest, mend some fences.", 3]);
  if (si === 2) pool.push(["Pumpkins! It's pumpkin season. I get a bit silly about pumpkins.", 2]);
  if (!open) pool.push(["The store's shut just now. Come and see me between 9 and 5.", 1]);
  const [t, f] = pick(pool); return [M(t, f)];
}
function chat(who, after) {
  const tw = S.town, first = !tw.met[who];
  let lines = who === 'bramble' ? brambleLines() : marigoldLines(storeOpen());
  if (who === 'bramble' && !S.mons.length) { lines = lines.concat(STARTER_INTRO); after = openStarterPick; }
  else if (who === 'bramble' && !S.gotCharms) { lines = lines.concat(CHARM_GIFT); const a0 = after; after = () => { giveCharms(); a0 && a0(); }; }
  if (!tw.talked[who]) { tw.talked[who] = 1; addFP(who, 20); }
  tw.met[who] = 1;
  Talk.say(lines, after);
}
const storeOpen = () => S.time >= 540 && S.time < 1020;

function openShop() {
  const si = seasonIdx(S.day);
  const render = () => SHOP.map(e => {
    const it = ITEMS[e.id], ok = !it.seed || CROPS[it.seed].seasons.includes(si);
    return `<div class="shoprow"><img src="${iconFor(e.id)}"><div class="g"><b>${it.name}</b><small>${it.desc}${ok ? '' : ' Out of season.'}</small></div>
      <button class="btn gold" data-a="buy" data-id="${e.id}" ${S.gold < e.price ? 'disabled' : ''}>${e.price}g</button></div>`;
  }).join('');
  const wrap = () => `<p>Seeds for every season, plus supplies for adventurers.</p><div class="mlist">${render()}</div>`;
  openModal("Marigold's General Store", wrap(), (a, d) => {
    if (a === 'refresh') { $('mBody').innerHTML = wrap(); return; }
    if (a !== 'buy') return;
    const e = SHOP.find(x => x.id === d.id), afford = Math.floor(S.gold / e.price);
    if (afford < 1) { Sound.play('error'); return; }
    const get = n => {
      const left = inv.add(e.id, n); if (left === n) { Sound.play('error'); return toast('Your backpack is full!'); }
      S.gold -= e.price * (n - left); Sound.play('coin'); updateHUD(); renderHotbar();
      toast(`Bought ${n - left} ${ITEMS[e.id].name}`, 1200); $('mBody').innerHTML = wrap();
    };
    askQty({ title: `Buy ${ITEMS[e.id].name}`, icon: iconFor(e.id), max: Math.min(afford, 999), start: 1, unit: e.price, cost: true, verb: 'Buy' }, get);
  });
}

function openBoard() {
  const st = hearthStage();
  const render = () => {
    const rows = Object.entries(PROJECTS).map(([id, p]) => {
      const tw = S.town;
      if (tw.done[id]) return `<div class="proj"><b>${p.name}</b><span class="st">✔ Restored</span></div>`;
      if (tw.pending[id]) return `<div class="proj"><b>${p.name}</b><span class="st">⚒ Work starts tonight</span></div>`;
      if (p.needs && !p.needs()) return `<div class="proj" style="opacity:.6"><b>${p.name}</b><span class="st">🔒</span><br><small>${p.lockText}</small></div>`;
      if (p.stage && st < p.stage) return `<div class="proj" style="opacity:.6"><b>${p.name}</b><span class="st">🔒</span><br><small>Unlocks when the Hearthroot grows stronger (stage ${p.stage + 1}).</small></div>`;
      let ok = S.gold >= p.gold;
      const needs = Object.entries(p.need).map(([k, n]) => { const have = inv.count(k); if (have < n) ok = false; return `<span class="need ${have < n ? 'no' : ''}"><img src="${iconFor(k)}">${Math.min(have, n)}/${n}</span>`; }).join('');
      return `<div class="proj"><b>${p.name}</b><br><small>${p.blurb}</small><div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;flex-wrap:wrap"><div>${needs}<span class="need ${S.gold < p.gold ? 'no' : ''}"><img src="${ICONS.coin}">${p.gold}g</span></div><button class="btn gold" data-a="fund" data-id="${id}" ${ok ? '' : 'disabled'}>Fund it</button></div></div>`;
    }).join('');
    return `<p>Repairs for Smallroot. Every one helps the Hearthroot grow. <b>Hearthroot: stage ${st + 1} of 5</b> (${hearthLife()} life). Tap the tree to see how it grows.</p><div class="mlist">${rows}</div>`;
  };
  openModal('Notice board', render(), (a, d) => {
    if (a !== 'fund') return;
    const p = PROJECTS[d.id];
    if (S.gold < p.gold || Object.entries(p.need).some(([k, n]) => inv.count(k) < n)) return Sound.play('error');
    for (const [k, n] of Object.entries(p.need)) inv.remove(k, n);
    S.gold -= p.gold; S.town.pending[d.id] = 1; updateHUD(); renderHotbar(); Sound.play('coin');
    toast(`Funded: ${p.name}. The villagers start work tonight!`, 2600);
    $('mBody').innerHTML = render();
  });
}

/* ---------------------------------------------------- the map */
function buildTown() {
  const pave = new Uint8Array(TW * TH), blocked = new Uint8Array(TW * TH);
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < TW && y < TH) pave[y * TW + x] = v; };
  const block = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < TW && y < TH) blocked[y * TW + x] = 1; };
  rect(16, 13, 56, 36, 1);                       // the square
  const ell = (cx, cy, rx, ry, v) => { for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) pave[y * TW + x] = v; };
  ell(36, 22.5, 5.6, 4.2, 0);                     // grass around the Hearthroot
  ell(36, 32, 4.4, 3, 3);                         // river stones round the fountain
  for (const [x0, y0, x1, y1] of [[17, 17, 25, 21], [47, 17, 55, 21], [17, 29, 25, 35], [47, 29, 55, 35]]) rect(x0, y0, x1, y1, 0);   // lawns
  // every street and doorstep path is 3 tiles wide
  rect(0, 23, 15, 25, 2);                        // road to the farm
  rect(8, 12, 16, 14, 2); rect(8, 15, 10, 15, 0);  // old cottage
  rect(8, 21, 10, 22, 2);                        // Bramble's doorstep
  rect(57, 13, 63, 15, 2);                       // timber house
  rect(57, 25, 69, 27, 2);                       // station
  rect(57, 34, 67, 36, 2);                       // long cottage
  rect(4, 43, 66, 45, 2);                        // south street
  for (const x of [15, 31, 48]) rect(x, 37, x + 2, 42, 2);
  // border woods
  const border = [];
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const d = Math.min(x, y, TW - 1 - x, TH - 1 - y);
    if (x <= 2 && y >= 22 && y <= 26) continue;
    if (d < 2 || (d < 3 && hash(x * 5, y * 3) < .5)) { blocked[y * TW + x] = 1; if ((x + y) % 2 === 0 || d >= 2) border.push({ x, y, kind: hash(x, y * 7) < .5 ? 'pine' : 'oak' }); }
  }
  const doors = {};
  for (const [id, b] of Object.entries(BUILDINGS)) {
    const f = ASSET.townJson.frames[b.frame].frame, cxp = b.cx * T + 8;
    const x0 = Math.floor((cxp - f.w / 2 + 4) / T), x1 = Math.floor((cxp + f.w / 2 - 5) / T);
    const rows = Math.max(2, Math.ceil(f.h * .5 / T));
    block(x0, b.by - rows + 1, x1, b.by);
    doors[(b.cx + b.door) + ',' + b.by] = id;
  }
  block(34, 22, 38, 24);                          // Hearthroot trunk and roots
  block(34, 32, 38, 33);                          // fountain
  // [frame, left tile, row, width in tiles]; nothing may sit on paving
  const props = [
    ['board', 35, 26, 3], ['stall', 26, 12, 3], ['planter', 17, 12, 3], ['planter', 54, 12, 3],
    ['bench', 20, 17, 3], ['flowerbed', 20, 20, 3], ['bench', 50, 17, 3], ['flowerbed', 50, 20, 3],
    ['flowerbed', 20, 31, 3], ['bench', 20, 35, 3], ['flowerbed', 50, 31, 3], ['bench', 50, 35, 3],
    ['bench', 6, 27, 3], ['bench', 26, 47, 3], ['bench', 58, 47, 3],
  ];
  const trees = [
    ['tree_oak', 18, 20], ['tree_apple', 24, 18], ['bush_round', 18, 17], ['tree_pine', 54, 20], ['tree_apple', 48, 18], ['bush_round', 54, 17],
    ['tree_pine', 18, 30], ['tree_apple', 24, 32], ['bush_wide', 17, 34], ['tree_oak', 54, 30], ['tree_apple', 48, 32], ['bush_wide', 54, 34],
    ['tree_oak', 4, 6], ['tree_pine', 14, 5], ['tree_oak', 27, 6], ['tree_apple', 45, 6], ['tree_pine', 58, 6], ['tree_oak', 66, 5], ['bush_round', 18, 9], ['bush_round', 55, 9],
    ['tree_oak', 3, 28], ['tree_apple', 11, 30], ['tree_pine', 6, 34], ['bush_round', 8, 32],
    ['bush_round', 68, 16], ['tree_oak', 65, 40], ['tree_pine', 68, 38], ['bush_round', 64, 37], ['tree_pine', 19, 40],
    ['tree_apple', 10, 47], ['tree_oak', 36, 47], ['tree_pine', 64, 47], ['bush_wide', 47, 47],
  ];
  const lamps = [[25, 21], [47, 21], [25, 29], [47, 29], [32, 24], [40, 24], [5, 22], [5, 26], [13, 22], [13, 26], [58, 24], [61, 28], [68, 28],
    [30, 12], [43, 12], [57, 16], [20, 46], [44, 46], [52, 46]];
  const approach = new Set(Object.values(BUILDINGS).map(b => (b.cx + b.door) + ',' + (b.by + 1)));
  const claim = (x, y, what) => {
    const i = y * TW + x;
    if (pave[i] || blocked[i] || approach.has(x + ',' + y)) console.warn('town: ' + what + ' badly placed at ' + x + ',' + y);
    blocked[i] = 1;
  };
  for (const [fr, x, y, w] of props) for (let k = 0; k < w; k++) claim(x + k, y, fr);
  for (const [fr, x, y] of trees) { claim(x, y, fr); if (fr === 'bush_wide') claim(x + 1, y, fr); }
  for (const [x, y] of lamps) claim(x, y, 'lamp');
  return { pave, blocked, border, doors, props, lamps, trees };
}

function townGround(sc, town) {
  if (sc.textures.exists('townGround')) sc.textures.remove('townGround');
  const c = document.createElement('canvas'); c.width = TW * T; c.height = TH * T;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const ter = sc.textures.get('terrain').getSourceImage();
  const src = { 1: ['g_cobble1', 'g_cobble2', 'g_cobble3'], 2: ['g_slab'], 3: ['g_riverstone'] };
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const h = hash(x, y), fi = FILL_ROW * 16 + (h < .6 ? 0 : h < .8 ? 1 : 2);
    g.drawImage(ter, (fi % 16) * T, Math.floor(fi / 16) * T, T, T, x * T, y * T, T, T);
    const v = town.pave[y * TW + x]; if (!v) continue;
    const list = src[v], im = sc.textures.get(list[Math.floor(hash(x >> 1, y >> 1) * list.length)]).getSourceImage();
    g.drawImage(im, (x & 1) * T, (y & 1) * T, T, T, x * T, y * T, T, T);
  }
  // soft edges where paving meets grass
  g.fillStyle = 'rgba(38,30,22,.45)';
  const P = (x, y) => x < 0 || y < 0 || x >= TW || y >= TH ? 1 : town.pave[y * TW + x];
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    if (!town.pave[y * TW + x]) continue;
    if (!P(x, y - 1)) g.fillRect(x * T, y * T, T, 1);
    if (!P(x, y + 1)) g.fillRect(x * T, y * T + T - 1, T, 1);
    if (!P(x - 1, y)) g.fillRect(x * T, y * T, 1, T);
    if (!P(x + 1, y)) g.fillRect(x * T + T - 1, y * T, 1, T);
  }
  sc.textures.addCanvas('townGround', c);
}

class Town extends World {
  constructor() { super('town'); }
  create() {
    this.initWorld(TW, TH);
    this.town = buildTown();
    townGround(this, this.town);
    this.add.image(0, 0, 'townGround').setOrigin(0).setDepth(-10);
    this.tall = [];
    for (const b of this.town.border) {
      const im = this.add.image(b.x * T + 8, b.y * T + 15, 'objects', b.kind === 'pine' ? 'tree_pine' : 'tree_oak').setOrigin(.5, 1);
      im.setDepth(b.y * T + 15).setTint(0xb8c8b0); this.tall.push(im);
    }
    this.bsprites = {};
    for (const [id, b] of Object.entries(BUILDINGS)) {
      const fr = isOpen(id) || id === 'bramble' ? b.frame : (b.frame + '_old');
      const s = this.add.image(b.cx * T + 8, b.by * T + 16, 'town', fr).setOrigin(.5, 1).setDepth(b.by * T + 15);
      this.bsprites[id] = s; this.tall.push(s);
    }
    const st = hearthStage();
    this.hearth = this.add.image(36 * T + 8, 24 * T + 16, 'town', 'hearth' + st).setOrigin(.5, 1).setDepth(24 * T + 15);
    this.tall.push(this.hearth);
    this.fountain = this.add.image(36 * T + 8, 33 * T + 15, 'town', S.town.done.fountain ? 'fountain' : 'fountain_dry').setOrigin(.5, 1).setDepth(33 * T + 15);
    for (const [fr, x, y] of this.town.trees) { const im = this.add.image(x * T + (fr === 'bush_wide' ? 16 : 8), y * T + 15, 'objects', fr).setOrigin(.5, 1).setDepth(y * T + 15); if (fr.startsWith('tree')) this.tall.push(im); }
    for (const [fr, x, y, w] of this.town.props) this.add.image(x * T + w * 8, y * T + 15, 'town', fr).setOrigin(.5, 1).setDepth(y * T + 15);
    this.glows = [];
    for (const [x, y] of this.town.lamps) {
      const l = this.add.image(x * T + 8, y * T + 15, 'town', 'lamp').setOrigin(.5, 1).setDepth(y * T + 15); this.tall.push(l);
      this.glows.push(this.add.circle(x * T + 8, y * T - 22, 14, 0xffd27a, .0).setDepth(9e6 - 10).setBlendMode(Phaser.BlendModes.ADD));
    }
    if (st >= 3) for (let i = 0; i < 10; i++) this.glows.push(this.add.circle(36 * T + 8 + (hash(i, 7) - .5) * 110, 24 * T - 50 - hash(i, 3) * 60, 9, 0xffc060, 0).setDepth(9e6 - 10).setBlendMode(Phaser.BlendModes.ADD));

    // villagers
    this.npcs = [];
    for (const id of ['bramble', 'marigold', ...VILL_IDS.filter(villHere)]) {
      for (let r = 0; r < 4; r++) { const k = `${id}_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers('npc_' + id, { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 6, repeat: -1 }); }
      const spr = this.add.sprite(0, 0, 'npc_' + id, 0).setOrigin(.5, 1);
      this.shadow(spr, 12, 5);
      const mark = this.add.text(0, 0, '!', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '14px', color: '#ffe35a', stroke: '#2a1e1a', strokeThickness: 3, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6);
      const n = { id, spr, mark, x: 0, y: 0, dir: 'down', path: [], moving: false, wait: 1 + Math.random() * 2, home: true, vill: !!VILL[id] };
      this.npcs.push(n);
    }
    this.placeNpcs(true);

    const sp = S.spawn && S.spawn.scene === 'town' ? S.spawn : TOWN_IN;
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, TW * T, TH * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput();
    this.fadeAcc = 0;
    Sound.theme('field');
    updateHUD(); renderHotbar(); FX.set(S.weather, false); this.fadeIn();
    festTown(this);
    if (!S.town.visited) { S.town.visited = true; setTimeout(() => toast('Welcome to Smallroot. Elder Bramble is waiting in the square.', 3500), 600); }
    else if (S.morning) { const m = S.morning; S.morning = null; setTimeout(() => toast(m, 3600), 500); }
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  /* ---------- villagers: where each one should be right now */
  spotFor(n) {
    const t = S.time;
    if (n.vill) {
      const v = VILL[n.id], b = BUILDINGS[v.home], dx = b.cx + b.door, svc = !!SERVICE[v.home];
      if (t < v.open[0] - 60 || t >= Math.max(v.open[1], 1260)) return { home: true, x: dx, y: b.by };
      if (svc && villOpen(n.id)) return { stay: workSpot(n.id), dir: 'down' };
      return { wander: villWander(n.id) };
    }
    if (n.id === 'bramble') {
      if (t < 480 || t >= 1140) return { home: true, x: 9, y: 21 };
      return { wander: [[34, 27], [30, 28], [24, 25], [12, 24], [40, 28], [36, 29], [44, 26], [27, 33]] };
    }
    if (t < 510 || t >= 1260) return { home: true, x: 23, y: 13 };
    if (storeOpen()) return { stay: [25, 13], dir: 'down' };
    return { wander: [[36, 35], [31, 31], [42, 31], [36, 28], [23, 14]] };
  }
  placeNpcs(initial) {
    for (const n of this.npcs) {
      const s = this.spotFor(n);
      if (s.home) { n.home = true; n.x = s.x; n.y = s.y; n.path = []; n.moving = false; }
      else if (n.home || initial) {
        n.home = false;
        const [x, y] = s.stay || (n.vill ? s.wander[(VILL[n.id].row * 5) % s.wander.length] : s.wander[0]);
        if (initial || !this.p) { n.x = x; n.y = y; }
        else { const d = BUILDINGS[n.vill ? VILL[n.id].home : n.id === 'bramble' ? 'bramble' : 'store']; n.x = d.cx + d.door; n.y = d.by + 1; }
        n.px = n.x * T + 8; n.py = n.y * T + 8;
      }
      n.px ??= n.x * T + 8; n.py ??= n.y * T + 8;
      n.spr.setVisible(!n.home); n.mark.setVisible(!n.home && (!S.town.met[n.id] || (n.id === 'bramble' && !S.mons.length)));
      this.drawNpc(n);
    }
  }
  drawNpc(n) {
    n.spr.setPosition(Math.round(n.px), Math.round(n.py) + 7).setDepth(n.py + 7);
    n.mark.setPosition(Math.round(n.px), Math.round(n.py) - 24);
  }
  npcAt(x, y) { return this.npcs.find(n => !n.home && n.x === x && n.y === y); }
  npcPath(n, gx, gy) {
    const start = n.y * TW + n.x, prev = new Int32Array(TW * TH).fill(-1); prev[start] = start; const q = [start]; let h = 0;
    while (h < q.length) {
      const cur = q[h++];
      if (cur === gy * TW + gx) { const out = []; let k = cur; while (k !== start) { out.push({ x: k % TW, y: (k / TW) | 0 }); k = prev[k]; } return out.reverse(); }
      const cx = cur % TW, cy = (cur / TW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, ni = ny * TW + nx; if (nx < 0 || ny < 0 || nx >= TW || ny >= TH || prev[ni] !== -1 || this.town.blocked[ni]) continue; prev[ni] = cur; q.push(ni); }
    }
    return [];
  }
  frameHook(dt) {
    this.fadeAcc += dt;
    if (this.fadeAcc > .08) {
      this.fadeAcc = 0;
      const px = this.player.x, py = this.player.y;
      for (const s of this.tall) {
        const behind = s.y > py + 2 && Math.abs(s.x - px) < s.displayWidth / 2 - 2 && py > s.y - s.displayHeight + 4;
        s.setAlpha(behind ? .35 : 1);
      }
      const t = S.time, night = t >= 1080 ? Math.min(1, (t - 1080) / 90) : t < 390 ? 1 : 0;
      for (const g of this.glows) g.setFillStyle(g.fillColor, night * .35);
      if (this.lastMin !== t) { this.lastMin = t; this.placeNpcs(false); }
    }
    for (const n of this.npcs) {
      if (n.home) continue;
      if (n.moving) {
        const tx = n.x * T + 8, ty = n.y * T + 8, dx = tx - n.px, dy = ty - n.py, d = Math.hypot(dx, dy), sp = 2.6 * T * dt;
        if (d <= sp) { n.px = tx; n.py = ty; n.moving = false; } else { n.px += dx / d * sp; n.py += dy / d * sp; }
        this.drawNpc(n); if (n.moving) continue;
      }
      const s = this.spotFor(n);
      if (!n.path.length) {
        n.wait -= dt;
        if (n.wait > 0) { if (n.spr.anims.isPlaying) { n.spr.stop(); n.spr.setFrame(DIRS.indexOf(n.dir) * 4); } continue; }
        if (s.home) continue;
        const goal = s.stay || pick(s.wander);
        if (goal[0] === n.x && goal[1] === n.y) { if (s.dir && n.dir !== s.dir) { n.dir = s.dir; n.spr.setFrame(DIRS.indexOf(n.dir) * 4); } n.wait = 2 + Math.random() * 3; continue; }
        n.path = this.npcPath(n, goal[0], goal[1]); n.wait = 2.5 + Math.random() * 4;
        if (!n.path.length) continue;
      }
      const nx = n.path[0];
      if ((this.p.x === nx.x && this.p.y === nx.y) || this.npcs.some(o => o !== n && !o.home && o.x === nx.x && o.y === nx.y)) { n.wait = .4; n.path = []; continue; }
      n.path.shift();
      n.dir = nx.x > n.x ? 'right' : nx.x < n.x ? 'left' : nx.y > n.y ? 'down' : 'up';
      n.x = nx.x; n.y = nx.y; n.moving = true;
      const k = `${n.id}_${n.dir}`; if (n.spr.anims.currentAnim?.key !== k || !n.spr.anims.isPlaying) n.spr.play(k);
    }
  }
  passable(x, y) {
    if (x < 0 || y < 0 || x >= TW || y >= TH) return false;
    return !this.town.blocked[y * TW + x] && !this.npcAt(x, y);
  }
  fastAt(x, y) { return !!this.town.pave[y * TW + x]; }
  /* ---------- what is at a tile */
  thing(x, y) {
    const n = this.npcAt(x, y); if (n) return { type: 'npc', n, x, y };
    const d = this.town.doors[x + ',' + y]; if (d) return { type: 'door', id: d, x, y };
    if (y === 26 && x >= 35 && x <= 37) return { type: 'board', x, y };
    if (x >= 34 && x <= 38 && y >= 22 && y <= 24) return { type: 'hearth', x, y };
    if (x >= 34 && x <= 38 && y >= 32 && y <= 33) return { type: 'fountain', x, y };
    if (y === 12 && x >= 26 && x <= 28) return { type: 'stall', x, y };
    return null;
  }
  actFacing() {
    const p = this.p; if (p.moving || this.paused || p.busy > 0) return;
    const [dx, dy] = DV[p.dir], t = this.thing(p.x + dx, p.y + dy);
    if (t) this.act(t); else if (this.cutProp(p.x + dx, p.y + dy)) return; else if (eatHeld()) p.busy = .4;
  }
  act(t) {
    const p = this.p;
    if (t.n) this.face(t.n.x, t.n.y); else if (t.x !== undefined) this.face(t.x, t.y);
    p.busy = .25;
    if (t.type === 'npc') {
      const n = t.n; n.path = []; n.wait = 3;
      n.dir = p.x > n.x ? 'right' : p.x < n.x ? 'left' : p.y > n.y ? 'down' : 'up'; n.spr.stop(); n.spr.setFrame(DIRS.indexOf(n.dir) * 4);
      n.mark.setVisible(false);
      if (n.vill) { const h = VILL[n.id].home; return villChat(n.id, SERVICE[h] && villOpen(n.id) ? SERVICE[h] : null); }
      if (n.id === 'bramble' && festNow()) return festOffer();
      const shop = n.id === 'marigold' && storeOpen();
      return chat(n.id, shop ? openShop : null);
    }
    if (t.type === 'door') return this.enter(t.id);
    if (t.type === 'board') return openBoard();
    if (t.type === 'stall') return storeOpen() ? openShop() : toast('The stall is packed up for the day. Marigold opens at 9am.');
    if (t.type === 'hearth') {
      const msg = ['The Hearthroot. Its bark is cold and grey, but you feel something faint stir inside.', 'Tiny buds are breaking out along the branches.', 'Fresh leaves rustle overhead. The bark feels warm.', 'The Hearthroot is in full leaf. Something in the roots seems to be watching, curious.', 'Lanterns glow among the leaves. The whole square feels alive again.'][hearthStage()];
      return openModal('The Hearthroot', `<p><i>${msg}</i></p>${hearthInfoHTML()}`);
    }
    if (t.type === 'fountain') return toast(S.town.done.fountain ? 'The fountain splashes happily.' : 'The fountain is dry and full of leaves. It could be repaired from the notice board.', 2600);
  }
  enter(id) {
    const b = BUILDINGS[id];
    if (id === 'store') {
      if (!storeOpen()) return toast("A sign on the door says: Open 9am – 5pm. Back soon! – Marigold", 2600);
      const m = this.npcs.find(n => n.id === 'marigold');
      if (!S.town.met.marigold) return chat('marigold', openShop);
      Sound.play('door'); return openShop(m);
    }
    if (id === 'bramble') {
      const br = this.npcs.find(n => n.id === 'bramble');
      return toast(br.home ? 'Bramble calls through the door: "It\'s late, dear! Come and find me in the square tomorrow."' : "Nobody's home. Bramble is usually out in the square.", 3000);
    }
    if (!isOpen(id)) return toast(`${b.name}: boarded up. Its restoration can be funded at the notice board.`, 2600);
    const vid = BUILD_VILL[id] || VILL_IDS.find(v => VILL[v].home === id && VILL[v].row !== 8);
    if (!vid) return toast(`${b.name} is fixed up and ready.`);
    const v = VILL[vid], n = this.npcs.find(q => q.id === vid), hm = h => `${Math.floor(h / 60) % 24 > 12 ? Math.floor(h / 60) % 24 - 12 : Math.floor(h / 60) % 24 || 12}${Math.floor(h / 60) % 24 >= 12 && h < 1440 ? 'pm' : 'am'}`;
    if (!n) return toast(`${v.name} is moving in. Come back tomorrow!`, 2600);
    if (SERVICE[id]) {
      if (!villOpen(vid)) return toast(`A sign on the door: open ${hm(v.open[0])} – ${hm(v.open[1])}.${n.home ? '' : ` ${v.name} is out and about in town.`}`, 2800);
      Sound.play('door');
      return S.town.met[vid] ? SERVICE[id]() : villChat(vid, SERVICE[id], true);
    }
    const who = VILL_IDS.filter(q => VILL[q].home === id).map(q => VILL[q].name).join(' and ');
    return toast(n.home ? `${who} call${who.includes(' and ') ? '' : 's'} through the door: "It's late! Come and see us tomorrow."` : `Nobody's home. ${who} ${who.includes(' and ') ? 'are' : 'is'} out in town.`, 3000);
  }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    if (this.tapProp(wx, wy)) return;
    const t = this.tapTarget(wx, wy); if (t) this.tapGoal(t);
  }
  tapTarget(wx, wy) {
    for (const n of this.npcs) if (!n.home && n.spr.getBounds().contains(wx, wy)) return { type: 'npc', n };
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    const th = this.thing(tx, ty); if (th) return th;
    for (const [id, s] of Object.entries(this.bsprites)) if (s.getBounds().contains(wx, wy)) { const b = BUILDINGS[id]; return { type: 'door', id, x: b.cx + b.door, y: b.by }; }
    if (this.hearth.getBounds().contains(wx, wy)) return { type: 'hearth', x: 36, y: 24 };
    return { type: 'tile', x: tx, y: ty };
  }
  tapGoal(t) {
    const p = this.p;
    if (t.type === 'tile') { if (!this.passable(t.x, t.y)) return; const path = this.path((x, y) => x === t.x && y === t.y); if (path) { p.path = path; p.pending = null; } return; }
    const gx = t.n ? t.n.x : t.x, gy = t.n ? t.n.y : t.y;
    const adj = (x, y) => t.type === 'door' ? x === gx && y === gy + 1 : t.type === 'hearth' ? y === 25 && x >= 34 && x <= 38 : Math.abs(x - gx) + Math.abs(y - gy) === 1;
    if (adj(p.x, p.y) && !p.moving) { if (t.type === 'door') this.face(gx, gy); return this.act(t); }
    const path = this.path(adj); if (!path) return toast("Can't reach that.");
    p.path = path; p.pending = t.type === 'door' ? { ...t } : t.type === 'hearth' ? { type: 'hearth', x: p.x, y: 24 } : t;
  }
  arrived() {
    const p = this.p;
    if (!p.path.length && p.pending) { const t = p.pending; p.pending = null; if (t.type === 'hearth') t.x = p.x; this.act(t); }
    this.arriveHook(p.x, p.y);
  }
  bump(x, y) { const t = this.thing(x, y); if (t && t.type === 'door' && this.p.dir === 'up') this.act(t); }
  arriveHook(x, y) { if (x === 0) travel(this, 'farm', { x: W - 2, y: 20, dir: 'left' }); }
}

/* ============================================================== Battles
   Moves, types, wild encounters, catching with Root Charms, levels. */
const MOVES = {
  tackle: { name: 'Tackle', type: 'Wild', pow: 40, acc: 100 },
  headbutt: { name: 'Headbutt', type: 'Wild', pow: 60, acc: 95 },
  quickhop: { name: 'Quick Hop', type: 'Wild', pow: 40, acc: 100, prio: 1, note: 'Always goes first.' },
  growl: { name: 'Growl', type: 'Wild', stat: ['foe', 'atk', -1] },
  tailwhip: { name: 'Tail Whip', type: 'Wild', stat: ['foe', 'def', -1] },
  harden: { name: 'Harden', type: 'Stone', stat: ['self', 'def', 1] },
  leafflick: { name: 'Leaf Flick', type: 'Leaf', pow: 40, acc: 100 },
  thornvolley: { name: 'Thorn Volley', type: 'Leaf', pow: 60, acc: 95, st: ['psn', 20] },
  nettlesting: { name: 'Nettle Sting', type: 'Leaf', acc: 85, st: ['psn', 100] },
  drowse: { name: 'Drowse', type: 'Shade', acc: 70, st: ['slp', 100] },
  hum: { name: 'Lull Wind', type: 'Gale', acc: 60, st: ['slp', 100] },
  struggle: { name: 'Struggle', type: 'Wild', pow: 40, acc: 100, recoil: 4 },
  bramblecurl: { name: 'Bramble Curl', type: 'Leaf', stat: ['self', 'def', 1] },
  emberpuff: { name: 'Ember Puff', type: 'Ember', pow: 40, acc: 100, st: ['brn', 10] },
  cinderslam: { name: 'Cinder Slam', type: 'Ember', pow: 65, acc: 95, st: ['brn', 15] },
  kilnguard: { name: 'Kiln Guard', type: 'Ember', stat: ['self', 'def', 1] },
  splashjet: { name: 'Splash Jet', type: 'Tide', pow: 40, acc: 100 },
  weirwave: { name: 'Weir Wave', type: 'Tide', pow: 60, acc: 95 },
  rainveil: { name: 'Rain Veil', type: 'Tide', stat: ['self', 'def', 1] },
  peck: { name: 'Peck', type: 'Gale', pow: 35, acc: 100 },
  gust: { name: 'Gust', type: 'Gale', pow: 45, acc: 100 },
  pebbletoss: { name: 'Pebble Toss', type: 'Stone', pow: 40, acc: 95 },
  rockroll: { name: 'Rock Roll', type: 'Stone', pow: 60, acc: 90 },
  staticbuzz: { name: 'Static Buzz', type: 'Spark', pow: 40, acc: 100, st: ['par', 20] },
  sparkdash: { name: 'Spark Dash', type: 'Spark', pow: 60, acc: 95, st: ['par', 15] },
  shadownip: { name: 'Shadow Nip', type: 'Shade', pow: 40, acc: 100 },
  nightdrop: { name: 'Night Drop', type: 'Shade', pow: 60, acc: 95 },
  moonglare: { name: 'Moon Glare', type: 'Shade', stat: ['foe', 'atk', -1] },
  hedgecrash: { name: 'Hedge Crash', type: 'Leaf', pow: 85, acc: 90 },
  furnacefist: { name: 'Furnace Fist', type: 'Ember', pow: 85, acc: 90, st: ['brn', 15] },
  millrace: { name: 'Millrace', type: 'Tide', pow: 85, acc: 90 },
  stampede: { name: 'Stampede', type: 'Wild', pow: 80, acc: 95 },
  galeforce: { name: 'Gale Force', type: 'Gale', pow: 80, acc: 95 },
  boltwing: { name: 'Bolt Wing', type: 'Spark', pow: 80, acc: 95, st: ['par', 20] },
  eclipse: { name: 'Eclipse', type: 'Shade', pow: 80, acc: 95 },
  rampartcrush: { name: 'Rampart Crush', type: 'Stone', pow: 100, acc: 85 },
  wildfire: { name: 'Wildfire', type: 'Ember', pow: 100, acc: 85, st: ['brn', 30] },
  slateslam: { name: 'Slate Slam', type: 'Stone', pow: 75, acc: 90 },
  mosscloak: { name: 'Moss Cloak', type: 'Leaf', stat: ['self', 'def', 1] },
  bonfirekick: { name: 'Bonfire Kick', type: 'Ember', pow: 70, acc: 95, st: ['brn', 20] },
  smokescreen: { name: 'Smoke Puff', type: 'Ember', stat: ['foe', 'atk', -1] },
  bogbubble: { name: 'Bog Bubble', type: 'Tide', pow: 50, acc: 100 },
  mirejet: { name: 'Mire Jet', type: 'Tide', pow: 70, acc: 95 },
  mudslick: { name: 'Mud Slick', type: 'Tide', acc: 95, stat: ['foe', 'spd', -1] },
  downdraft: { name: 'Downdraft', type: 'Gale', pow: 65, acc: 95 },
  sporesnooze: { name: 'Spore Snooze', type: 'Leaf', acc: 75, st: ['slp', 100] },
  sundewsnare: { name: 'Sundew Snare', type: 'Leaf', pow: 55, acc: 100, st: ['psn', 20] },
  pitchergulp: { name: 'Pitcher Gulp', type: 'Leaf', pow: 70, acc: 95 },
  wispshock: { name: 'Wisp Shock', type: 'Spark', pow: 55, acc: 100, st: ['par', 20] },
  marshglow: { name: 'Marsh Glow', type: 'Spark', stat: ['foe', 'atk', -1] },
  hollowknock: { name: 'Hollow Knock', type: 'Shade', pow: 55, acc: 100 },
  gloomgrip: { name: 'Gloom Grip', type: 'Shade', pow: 70, acc: 95 },
};
const LEARN = {
  muddlebub: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'mudslick'], [13, 'bogbubble'], [17, 'harden'], [21, 'mirejet'], [27, 'rockroll']],
  lotling: [[1, 'tackle'], [1, 'growl'], [5, 'splashjet'], [9, 'rainveil'], [13, 'bogbubble'], [17, 'quickhop'], [21, 'mirejet'], [27, 'weirwave']],
  puffpiper: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [10, 'hum'], [14, 'quickhop'], [19, 'downdraft'], [28, 'galeforce']],
  sundrowse: [[1, 'tackle'], [1, 'mosscloak'], [5, 'leafflick'], [10, 'sporesnooze'], [15, 'sundewsnare'], [19, 'headbutt'], [28, 'hedgecrash']],
  tipplecup: [[1, 'leafflick'], [1, 'growl'], [6, 'nettlesting'], [11, 'sundewsnare'], [16, 'pitchergulp'], [21, 'thornvolley'], [29, 'hedgecrash']],
  glimmerjel: [[1, 'staticbuzz'], [1, 'growl'], [6, 'marshglow'], [11, 'wispshock'], [17, 'sparkdash'], [28, 'boltwing']],
  logloom: [[1, 'shadownip'], [1, 'harden'], [6, 'moonglare'], [11, 'hollowknock'], [15, 'drowse'], [20, 'gloomgrip'], [29, 'eclipse']],
  hedglet: [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'bramblecurl'], [11, 'nettlesting'], [13, 'thornvolley'], [17, 'headbutt']],
  cindimple: [[1, 'tackle'], [1, 'growl'], [5, 'emberpuff'], [9, 'kilnguard'], [13, 'cinderslam'], [17, 'headbutt']],
  rillip: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'rainveil'], [13, 'weirwave'], [17, 'headbutt']],
  tusskip: [[1, 'tackle'], [1, 'tailwhip'], [4, 'quickhop'], [10, 'headbutt']],
  whirplet: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [11, 'quickhop'], [14, 'hum']],
  cloverclasp: [[1, 'tackle'], [1, 'harden'], [5, 'leafflick'], [8, 'nettlesting'], [12, 'thornvolley']],
  flintuck: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [12, 'rockroll']],
  fuzzwick: [[1, 'tackle'], [1, 'growl'], [5, 'staticbuzz'], [12, 'sparkdash']],
  brooknook: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'quickhop'], [13, 'weirwave']],
  briamble: [[1, 'tackle'], [1, 'growl'], [5, 'leafflick'], [9, 'bramblecurl'], [11, 'nettlesting'], [13, 'thornvolley'], [17, 'headbutt'], [22, 'hedgecrash']],
  kilnook: [[1, 'tackle'], [1, 'growl'], [5, 'emberpuff'], [9, 'kilnguard'], [13, 'cinderslam'], [17, 'headbutt'], [22, 'furnacefist']],
  weirlet: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'rainveil'], [13, 'weirwave'], [17, 'headbutt'], [22, 'millrace']],
  fleecebolt: [[1, 'tackle'], [1, 'tailwhip'], [4, 'quickhop'], [10, 'headbutt'], [22, 'stampede']],
  whirlwyn: [[1, 'peck'], [1, 'growl'], [5, 'gust'], [11, 'quickhop'], [14, 'hum'], [22, 'galeforce']],
  cloverguard: [[1, 'tackle'], [1, 'harden'], [5, 'leafflick'], [8, 'nettlesting'], [12, 'thornvolley'], [22, 'hedgecrash']],
  flintburrow: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [12, 'rockroll'], [22, 'slateslam']],
  staticwing: [[1, 'tackle'], [1, 'growl'], [5, 'staticbuzz'], [12, 'sparkdash'], [22, 'boltwing']],
  duskcloak: [[1, 'tackle'], [1, 'moonglare'], [5, 'shadownip'], [9, 'drowse'], [12, 'nightdrop'], [22, 'eclipse']],
  rampartoad: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [9, 'mosscloak'], [11, 'rockroll'], [15, 'slateslam'], [34, 'rampartcrush']],
  pyrebrash: [[1, 'tackle'], [1, 'smokescreen'], [5, 'emberpuff'], [9, 'quickhop'], [12, 'cinderslam'], [15, 'bonfirekick'], [34, 'wildfire']],
  brookstride: [[1, 'tackle'], [1, 'tailwhip'], [5, 'splashjet'], [9, 'quickhop'], [13, 'weirwave'], [22, 'millrace']],
  mortoad: [[1, 'tackle'], [1, 'harden'], [5, 'pebbletoss'], [9, 'mosscloak'], [11, 'rockroll'], [15, 'slateslam']],
  brashlet: [[1, 'tackle'], [1, 'smokescreen'], [5, 'emberpuff'], [9, 'quickhop'], [12, 'cinderslam'], [15, 'bonfirekick']],
  duskwick: [[1, 'tackle'], [1, 'moonglare'], [5, 'shadownip'], [9, 'drowse'], [12, 'nightdrop']],
};
function movesAt(sp, lv) { return (LEARN[sp] || LEARN.tusskip).filter(([l]) => l <= lv).map(([, m]) => m).filter((m, i, a) => a.indexOf(m) === i).slice(-4); }
const EFF = {
  // every type has two strengths and two weaknesses
  Leaf: { Tide: 2, Stone: 2, Ember: .5, Leaf: .5, Gale: .5 },
  Ember: { Leaf: 2, Shade: 2, Frost: 2, Tide: .5, Stone: .5, Ember: .5 },
  Tide: { Ember: 2, Stone: 2, Leaf: .5, Tide: .5 },
  Stone: { Ember: 2, Gale: 2, Frost: 2, Leaf: .5 },
  Gale: { Leaf: 2, Wild: 2, Stone: .5, Spark: .5 },
  Spark: { Tide: 2, Gale: 2, Stone: .5, Leaf: .5, Spark: .5 },
  Shade: { Spark: 2, Wild: 2, Glow: 2, Shade: .5 },
  Glow: { Shade: 2, Glow: .5 },
  Frost: { Leaf: 2, Gale: 2, Ember: .5, Tide: .5 },
  Wild: { Shade: 2, Spark: 2, Stone: .5 },
};
const eff = (atk, def) => (EFF[atk] || {})[def] ?? 1;
// dual types: a Fablemon may have a second type. Matchups multiply; either type earns the same-type bonus.
const typesOf = sp => SPECIES[sp].type2 ? [SPECIES[sp].type, SPECIES[sp].type2] : [SPECIES[sp].type];
const hasType = (sp, t) => typesOf(sp).includes(t);
const effOn = (mt, sp) => typesOf(sp).reduce((a, t) => a * eff(mt, t), 1);
const stabOf = (mt, sp) => hasType(sp, mt) ? 1.5 : 1;
const STATUS = { psn: ['Poisoned', '#8a4ab0', 'was poisoned'], brn: ['Burned', '#d0542a', 'was burned'], slp: ['Asleep', '#5b7aa8', 'fell asleep'], par: ['Dazed', '#c9a21e', 'is dazed and may not be able to move'] };
const IMMUNE = { brn: 'Ember', par: 'Spark', psn: 'Stone' };
// plain sentences about what a move does
const STAT_LABEL = { atk: 'Attack', def: 'Defence', spd: 'Speed' };
const statText = ([who, k, n]) => `${n > 0 ? 'Raises' : 'Lowers'} ${who === 'self' ? 'its own' : "the opponent's"} ${STAT_LABEL[k]}${Math.abs(n) > 1 ? ' sharply' : ''}`;
const WEATHER_TEXT = { rain: 'Rain: Tide moves are 50% stronger and Ember moves 50% weaker', sun: 'Harsh sun: Ember moves are 50% stronger and Tide moves 50% weaker', gloom: 'Gloom: Shade moves are 50% stronger' };
function moveEffect(id) {
  const M = MOVES[id], st = M.st && STATUS[M.st[0]][0].toLowerCase(), t = [];
  if (id === 'struggle') return 'Used when every move has run out. Hurts the user a little too.';
  if (M.protect) t.push('Blocks every move aimed at it this turn. Likely to fail if used twice in a row.');
  if (M.weather) t.push(`Changes the weather for 5 turns. ${WEATHER_TEXT[M.weather]}.`);
  if (M.hazard) t.push("Scatters sharp debris on the opponent's side: every Fablemon they send out is hurt. Stacks up to 3 times.");
  if (M.seed) t.push('Plants a seed on the opponent that drains 1/8 of its HP each turn to heal the user. Leaf Fablemon are immune.');
  if (M.haze) t.push('Clears every stat change on both sides.');
  if (M.critUp) t.push('Sharply raises its critical-hit rate until it switches out.');
  if (M.cure) t.push("Cures every Fablemon on the user's team of poison, burns, sleep and daze.");
  if (M.rest) t.push('The user falls asleep for 2 turns, fully healing its HP and curing any status.');
  if (M.heal && !M.pow) t.push(`Restores half the user's HP${M.sunHeal ? ', or two-thirds in harsh sun' : ''}.`);
  if (M.stat) t.push(statText(M.stat) + '.');
  if (M.stats) t.push(M.stats.map(statText).join(', and ').replace(/, and Raises/g, ' and').replace(/, and Lowers/g, ', but lowers') + '.');
  if (M.st && !M.pow) t.push(`Leaves the opponent ${st}.`);
  if (M.fixed) t.push("Always deals damage equal to the user's level.");
  if (M.pow) {
    t.push(M.pow >= 100 ? 'A huge attack.' : M.pow >= 80 ? 'A very strong attack.' : M.pow >= 65 ? 'A strong attack.' : M.pow >= 50 ? 'A solid attack.' : 'A light attack.');
    if (M.hits) t.push(`Hits ${M.hits[0]}–${M.hits[1]} times in a row.`);
    if (M.prio > 0) t.push('Always strikes first.');
    if (M.crit) t.push('Lands critical hits far more often.');
    if (M.useDef) t.push("Uses the user's Defence instead of its Attack.");
    if (M.drain) t.push('Heals the user by half the damage dealt.');
    if (M.recoil) t.push(`The user takes 1/${M.recoil} of the damage dealt.`);
    if (M.hex) t.push('Double power if the opponent has a status condition.');
    if (M.desperate) t.push('Double power when the user is below a third of its HP.');
    if (M.onlySleep) t.push('Only works on a sleeping opponent.');
    if (M.flinch) t.push(`${M.flinch}% chance to make the opponent flinch, if the user moves first.`);
    if (M.pivot) t.push('The user switches out after attacking.');
    if (M.st) t.push(`${M.st[1]}% chance to leave the opponent ${st}.`);
    if (M.boost) t.push(`${M.boost[3] < 100 ? M.boost[3] + '% chance: ' : 'Then '}${statText(M.boost).replace(/^./, c => M.boost[3] < 100 ? c.toLowerCase() : c.toLowerCase())}.`);
  }
  if (!M.pow && !M.fixed && !M.protect && M.prio > 0) t.push('Goes first.');
  if (!M.acc && (M.pow || M.st || M.seed)) t.push('Never misses.');
  return t.join(' ');
}
function moveCard(id, m, tag = '') {
  const M = MOVES[id], strong = Object.keys(EFF[M.type] || {}).filter(k => EFF[M.type][k] > 1);
  return `<div class="mcard" style="--tc:${TYPES[M.type]}"><div class="mh"><b>${M.name}</b>${tag}<span class="tchip" style="background:${TYPES[M.type]}">${M.type}</span></div>
    <div class="ms"><span>Power <b>${M.pow || '–'}</b></span><span>Accuracy <b>${M.acc ? M.acc + '%' : (M.pow || M.st || M.seed || M.fixed) ? 'Sure' : '–'}</b></span>${M.prio ? `<span>Priority <b>${M.prio > 0 ? '+' : ''}${M.prio}</b></span>` : ''}<span>Uses <b>${m ? ppLeft(m, id) + '/' : ''}${ppMax(id)}</b></span>${M.pow && m && hasType(m.sp, M.type) ? '<span class="same">Same type ×1.5</span>' : ''}</div>
    <small>${moveEffect(id)}${M.pow && strong.length ? ` Super effective against ${strong.join(', ')}.` : ''}</small></div>`;
}
const ppMax = id => { const M = MOVES[id]; if (M.protect || M.heal || M.rest || M.weather) return 10; if (!M.pow && !M.fixed) return M.st || M.seed ? 15 : 20; return M.pow >= 110 ? 8 : M.pow >= 80 ? 12 : M.pow >= 60 ? 15 : 25; };
const moveTag = id => { const M = MOVES[id]; if (M.pow) return 'Pow ' + M.pow + (M.hits ? '×' + M.hits[0] + '–' + M.hits[1] : '') + (M.prio > 0 ? ' · First' : ''); if (M.fixed) return 'Lv dmg'; if (M.st) return STATUS[M.st[0]][0]; if (M.protect) return 'Protect'; if (M.heal || M.rest) return 'Heal'; if (M.weather) return { rain: 'Rain', sun: 'Sun', gloom: 'Gloom' }[M.weather]; if (M.hazard) return 'Hazard'; if (M.seed) return 'Seed'; if (M.haze) return 'Clear stats'; if (M.cure) return 'Cure team'; if (M.critUp) return '▲Crit'; const x = (M.stats || [M.stat])[0]; return x ? (x[2] > 0 ? '▲' : '▼') + { atk: 'Atk', def: 'Def', spd: 'Spd' }[x[1]] : ''; };
const ppLeft = (m, id) => (m.pp && m.pp[id] != null) ? m.pp[id] : ppMax(id);
function restMon(m) { m.hp = monStat(m, 'hp'); m.pp = {}; m.status = null; }
const STAGE = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const xpNext = m => (m.lv + 1) ** 3;

const CHARM_GIFT = [
  { who: 'bramble', f: 1, t: "One more thing. Take these Root Charms. Tie one to a Fablemon you've worn out in a battle and it might choose to come with you." },
  { who: 'bramble', f: 0, t: "And a few Hearthberries. They'll perk up a tired Fablemon. Marigold sells more of both." },
  { who: 'bramble', f: 2, t: "The Meadow Trail starts at the bottom of your farm. Keep to the path unless you're looking for trouble... or new friends!" },
];
function giveCharms() { if (S.gotCharms) return; S.gotCharms = true; inv.add('root_charm', 5); inv.add('berry', 3); renderHotbar(); toast('Received 5 Root Charms and 3 Hearthberries!', 2600); }

// trainers' Fablemon have steady, slightly-above-average potential so fights stay predictable
const trainerMon = (sp, lv) => { const m = wildMon(sp, lv); m.iv = { hp: 6, atk: 6, def: 6, spd: 6 }; m.hp = monStat(m, 'hp'); return m; };
function wildMon(sp, lv) { const m = { uid: -1, sp, nick: '', lv, xp: lv ** 3, moves: movesAt(sp, lv), iv: rollIV() }; m.hp = monStat(m, 'hp'); return m; }
const canFight = m => m.loc === 'team' && m.hp > 0;

/* ---------------------------------------------------- the battle screen */
const Battle = (() => {
  const el = $('battle');
  let B = null, tapNext = null;
  const q = id => $(id);
  function layout() {
    if (!B) return;
    const side = innerWidth > innerHeight * 1.3;
    el.classList.toggle('side', side);
    const uiW = side ? Math.min(300, innerWidth * .36) : 0, uiH = side ? 0 : 170;
    // upright phones get a taller crop of the background so the Fablemon are bigger
    const ar = side ? 16 / 9 : Math.max(4 / 3, Math.min(16 / 9, innerWidth / Math.max(1, (innerHeight - uiH) * .62)));
    let w = Math.floor(Math.min(innerWidth - uiW, (innerHeight - uiH) * ar)), h = Math.floor(w / ar);
    const bgW = h * 16 / 9, c = (bgW - w) / 2, X = f => (f * bgW - c) + 'px';
    const st = q('bstage'); st.style.width = w + 'px'; st.style.height = h + 'px';
    st.style.backgroundSize = `${bgW}px ${h}px`; st.style.backgroundPosition = `${-c}px 0`;
    st.style.setProperty('--w', bgW + 'px'); st.style.setProperty('--fx', X(.77)); st.style.setProperty('--mx', X(.32));
    q('bui').style.width = side ? uiW + 'px' : Math.min(innerWidth, Math.max(w, 340)) + 'px';
  }
  addEventListener('resize', layout);
  el.addEventListener('pointerdown', e => { if (tapNext && !e.target.closest('button')) { const f = tapNext; tapNext = null; f(); } });
  const SPD = () => opts.bspeed || 1;   // battle speed setting: 1 normal, 1.7 fast, 3 very fast
  function say(t, ms = 1400) {
    q('bmsg').textContent = t; q('bmenu').innerHTML = '';
    return new Promise(r => { let done = false; const fin = () => { if (done) return; done = true; tapNext = null; r(); }; tapNext = fin; setTimeout(fin, ms / SPD()); });
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms / SPD()));
  function box(side) {
    const m = side === 'me' ? B.me : B.foe, mx = monStat(m, 'hp'), v = Math.max(0, m.hp), pc = v / mx;
    const xp = side === 'me' ? `<div class="bxp"><i style="width:${100 * Math.max(0, Math.min(1, (m.xp - m.lv ** 3) / (xpNext(m) - m.lv ** 3)))}%"></i></div>` : '';
    const caught = side === 'foe' && S.caught[m.sp] ? '<span title="Befriended before" style="color:#c0392b">♥</span> ' : '';
    const stc = (m.status ? `<span class="tchip" style="background:${STATUS[m.status][1]}">${STATUS[m.status][0]}</span>` : '')
      + Object.entries((B.st || {})[side] || {}).filter(([, n]) => n).map(([k, n]) => `<span class="tchip" style="background:${n > 0 ? '#3a8a4a' : '#9a4a3a'}">${{ atk: 'Atk', def: 'Def', spd: 'Spd' }[k] || k}${n > 0 ? '▲' : '▼'}${Math.abs(n) > 1 ? Math.abs(n) : ''}</span>`).join('');
    q(side === 'me' ? 'bmebox' : 'bfoebox').innerHTML = `<div class="bn">${caught}${monName(m)} <small>Lv ${m.lv}</small></div>${typeChip(m.sp)}${stc}<div class="bhp"><i style="width:${100 * pc}%;background:${pc > .5 ? '#4caf50' : pc > .2 ? '#e0a020' : '#d04030'}"></i></div>${side === 'me' ? `<div class="bhpn">${v}/${mx}</div>` : ''}${xp}`;
  }
  function sprites() {
    q('bfoe').src = monPic(B.foe.sp, 'front'); q('bme').src = monPic(B.me.sp, 'back');
    q('bfoe').className = 'bmon'; q('bme').className = 'bmon';
  }
  const anim = (id, cls, ms) => { const e = q(id); e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); return sleep(ms); };
  function menu(buttons) {
    return new Promise(r => {
      q('bmenu').innerHTML = buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}" ${b.off ? 'disabled' : ''} style="${b.style || ''}">${b.html}</button>`).join('');
      q('bmenu').onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; Sound.play('click'); q('bmenu').onclick = null; r(buttons[+b.dataset.i].v); };
    });
  }
  async function chooseAction() {
    for (;;) {
      q('bmsg').textContent = `What will ${monName(B.me)} do?`;
      const a = await menu([{ html: 'Fight', v: 'fight', cls: 'gold' }, { html: 'Bag', v: 'bag' }, { html: 'Switch', v: 'team' }, { html: 'Run', v: 'run' }]);
      if (a === 'fight') {
        q('bmsg').textContent = 'Choose a move.';
        if (B.me.moves.every(id => ppLeft(B.me, id) <= 0)) { await say(`${monName(B.me)} has no moves left to use!`, 1100); return { kind: 'move', id: 'struggle' }; }
        const mv = await menu(B.me.moves.map(id => { const M = MOVES[id], pp = ppLeft(B.me, id), ef = M.pow ? effOn(M.type, B.foe.sp) : 1;
          const hint = !M.pow ? '' : ef === 0 ? '<b class="eff no">✕ No effect</b>' : ef > 1 ? `<b class="eff up">▲ Super effective</b>` : ef < 1 ? '<b class="eff dn">▼ Not very effective</b>' : '';
          return { html: `${M.name}<small>${M.type} · ${moveTag(id)} · ${pp}/${ppMax(id)}</small>${hint}`, v: id, off: pp <= 0, style: `border-color:${TYPES[M.type]}` }; }).concat([{ html: 'Back', v: null }]));
        if (mv) return { kind: 'move', id: mv };
      }
      if (a === 'bag') {
        const c = inv.count('root_charm'), full = B.me.hp >= monStat(B.me, 'hp');
        const heals = Object.keys(ITEMS).filter(id => ITEMS[id].heal && inv.count(id));
        q('bmsg').textContent = 'Use an item.';
        const c2 = inv.count('sturdy_charm');
        const it = await menu([{ html: `<img src="${iconFor('root_charm')}">Root Charm ×${c}`, v: 'charm', off: !c || !B.wild }, ...(c2 ? [{ html: `<img src="${iconFor('sturdy_charm')}">Sturdy Charm ×${c2}`, v: 'sturdy', off: !B.wild }] : []), ...heals.map(id => ({ html: `<img src="${iconFor(id)}">${ITEMS[id].name} ×${inv.count(id)}`, v: id, off: full })), { html: 'Back', v: null }]);
        if (it === 'charm' || it === 'sturdy') return { kind: 'charm', id: it === 'sturdy' ? 'sturdy_charm' : 'root_charm' };
        if (it) return { kind: 'heal', id: it };
      }
      if (a === 'team') { const m = await pickMon(false); if (m && m !== B.me) return { kind: 'switch', m }; }
      if (a === 'run') return { kind: 'run' };
    }
  }
  async function pickMon(forced) {
    q('bmsg').textContent = forced ? 'Choose who goes next.' : 'Switch to which Fablemon?';
    const opts = team().map(m => ({ html: `<img src="${monPic(m.sp)}">${monName(m)} <small>Lv ${m.lv} · ${m.hp}/${monStat(m, 'hp')}</small>`, v: m, off: m.hp <= 0 || m === B.me }));
    if (!forced) opts.push({ html: 'Back', v: null });
    return menu(opts);
  }
  function stat(side, k) { const m = side === 'me' ? B.me : B.foe; return monStat(m, k) * heldStat(m, k) * STAGE(B.st[side][k] || 0) * (k === 'spd' && m.status === 'par' ? .5 : 1) * (side === 'me' ? buffMul(k) : 1); }
  const nameOf = side => (side === 'foe' ? foeLabel() : '') + monName(side === 'me' ? B.me : B.foe);
  async function inflict(side, st) {
    const m = side === 'me' ? B.me : B.foe;
    if (m.status || m.hp <= 0 || hasType(m.sp, IMMUNE[st])) return false;
    m.status = st; if (st === 'slp') m.slp = 1 + Math.floor(Math.random() * 3);
    box(side); Sound.play('error'); await anim(side === 'me' ? 'bme' : 'bfoe', 'debuff', 400);
    await say(`${nameOf(side)} ${STATUS[st][2]}!`, 1200); return true;
  }
  const other = side => side === 'me' ? 'foe' : 'me';
  const monOf = side => side === 'me' ? B.me : B.foe;
  const spr = side => side === 'me' ? 'bme' : 'bfoe';
  const wxMul = type => { const w = B.wx && B.wx.kind; if (w === 'rain') return type === 'Tide' ? 1.5 : type === 'Ember' ? .5 : 1; if (w === 'sun') return type === 'Ember' ? 1.5 : type === 'Tide' ? .5 : 1; if (w === 'gloom') return type === 'Shade' ? 1.5 : 1; return 1; };
  const hitsFoe = M => !!(M.pow || M.fixed || (M.st && !M.pow) || M.seed || (M.stat && M.stat[0] === 'foe') || (M.stats && M.stats.some(x => x[0] === 'foe')));
  async function applyStat(side, [who, k, n]) {
    const tgt = who === 'self' ? side : other(side), cur = B.st[tgt][k] || 0, nx = Math.max(-6, Math.min(6, cur + n)), nm = monName(monOf(tgt));
    if (monOf(tgt).hp <= 0) return;
    if (nx === cur) return say(`${nm}'s ${STAT_LABEL[k]} won't go any ${n > 0 ? 'higher' : 'lower'}!`, 1000);
    B.st[tgt][k] = nx; Sound.play(n > 0 ? 'pop' : 'error');
    await anim(spr(tgt), n > 0 ? 'buff' : 'debuff', 400);
    return say(`${nm}'s ${STAT_LABEL[k]} ${n > 0 ? 'rose' : 'fell'}${Math.abs(n) > 1 ? ' sharply' : ''}!`, 1100);
  }
  async function healSide(side, amt, why) {
    const m = monOf(side), h = Math.min(monStat(m, 'hp') - m.hp, Math.max(1, Math.floor(amt)));
    if (h <= 0) return; m.hp += h; box(side); Sound.play('pop'); await anim(spr(side), 'buff', 350);
    if (why) await say(why, 1000);
  }
  async function useMove(side, id) {
    const att = monOf(side), defSide = other(side), def = monOf(defSide), M = MOVES[id], va = B.v[side], vd = B.v[defSide];
    if (att.hp <= 0) return;
    if (att.status === 'slp') {
      if (--att.slp > 0) return say(`${nameOf(side)} is fast asleep.`, 1100);
      att.status = null; box(side); await say(`${nameOf(side)} woke up!`, 1000);
    }
    if (va.flinch) { va.flinch = 0; return say(`${nameOf(side)} flinched and couldn't move!`, 1100); }
    if (att.status === 'par' && Math.random() < .25) return say(`${nameOf(side)} is dazed and can't move!`, 1100);
    if (id !== 'struggle') { att.pp = att.pp || {}; att.pp[id] = Math.max(0, ppLeft(att, id) - 1); }
    await say(`${nameOf(side)} used ${M.name}!`, 1000);
    await anim(spr(side), side === 'me' ? 'lunge-me' : 'lunge-foe', 260);
    // moves that don't target the opponent
    if (M.protect) {
      if (va.lastProtect === B.turn - 1 && Math.random() < .5) { va.lastProtect = -9; return say('But it failed!', 900); }
      va.protect = 1; va.lastProtect = B.turn; Sound.play('pop'); await anim(spr(side), 'buff', 350);
      return say(`${nameOf(side)} braced itself!`, 1000);
    }
    if (M.weather) {
      if (B.wx && B.wx.kind === M.weather) return say('But it failed!', 900);
      B.wx = { kind: M.weather, turns: 5 }; Sound.play(M.weather === 'rain' ? 'water' : 'pop'); weatherFx();
      return say({ rain: 'It started to rain!', sun: 'The sunlight turned harsh!', gloom: 'A deep gloom fell over the battle!' }[M.weather], 1300);
    }
    if (M.hazard) {
      if ((B.hz[defSide] || 0) >= 3) return say('But it failed!', 900);
      B.hz[defSide] = (B.hz[defSide] || 0) + 1; Sound.play('pick');
      return say(`Sharp ${M.hazard} are scattered around ${defSide === 'foe' ? 'the opposing team' : 'your team'}!`, 1300);
    }
    if (M.haze) { B.st = { me: {}, foe: {} }; Sound.play('swish'); return say('A cyclone blew away every stat change!', 1300); }
    if (M.cure) {
      const tm = side === 'me' ? team() : (B.T ? B.T.team : [B.foe]); tm.forEach(m => { m.status = null; m.slp = 0; }); box('me'); box('foe');
      Sound.play('fill'); return say(`A calming scent cured ${side === 'me' ? 'your' : 'the opposing'} team!`, 1300);
    }
    if (M.rest) {
      if (att.hp >= monStat(att, 'hp')) return say('But it failed!', 900);
      att.status = 'slp'; att.slp = 3; att.hp = monStat(att, 'hp'); box(side); Sound.play('fill');
      return say(`${nameOf(side)} curled up and fell asleep. It's fully healed!`, 1400);
    }
    if (M.heal && !M.pow) {
      if (att.hp >= monStat(att, 'hp')) return say(`${nameOf(side)}'s HP is already full!`, 1000);
      const share = M.sunHeal && B.wx && B.wx.kind === 'sun' ? 2 / 3 : M.heal;
      return healSide(side, monStat(att, 'hp') * share, `${nameOf(side)} recovered some HP!`);
    }
    if (M.critUp) { if ((va.crit || 0) >= 2) return say('But it failed!', 900); va.crit = Math.min(2, (va.crit || 0) + M.critUp); Sound.play('pop'); await anim(spr(side), 'buff', 350); return say(`${nameOf(side)} is getting pumped! Critical hits are far more likely.`, 1300); }
    if (!hitsFoe(M)) { for (const x of M.stats || (M.stat ? [M.stat] : [])) await applyStat(side, x); return; }
    // moves aimed at the opponent
    if (vd.protect) return say(`${nameOf(defSide)} protected itself!`, 1100);
    if (M.acc && Math.random() * 100 >= M.acc) return say(`${nameOf(side)}'s ${M.pow ? 'attack' : 'move'} missed!`, 1000);
    if (M.seed) {
      if (vd.seed || hasType(def.sp, 'Leaf')) return say('But it failed!', 900);
      vd.seed = 1; Sound.play('plant'); return say(`A seed was planted on ${nameOf(defSide)}!`, 1200);
    }
    if (M.stat || M.stats) { for (const x of M.stats || [M.stat]) await applyStat(side, x); return; }
    if (M.st && !M.pow) {
      if (!(await inflict(defSide, M.st[0]))) return say('But it failed!', 900);
      return;
    }
    if (M.onlySleep && def.status !== 'slp') return say('But it failed! The opponent is awake.', 1100);
    const e = M.fixed ? 1 : effOn(M.type, def.sp), stab = stabOf(M.type, att.sp);
    const n = M.hits ? M.hits[0] + Math.floor(Math.random() * (M.hits[1] - M.hits[0] + 1)) : 1;
    let total = 0, crits = 0, k = 0;
    for (; k < n && def.hp > 0; k++) {
      let dmg;
      if (M.fixed) dmg = att.lv;
      else {
        const bondCrit = side === 'me' ? Math.min(20, att.bond || 0) / 400 : 0;   // up to +5% for a close bond
        const crit = Math.random() < [1 / 16, 1 / 8, 1 / 2, 1][Math.min(3, (M.crit ? 1 : 0) + (va.crit || 0))] + bondCrit ? 1.5 : 1; if (crit > 1) crits++;
        const pw = M.pow * (att.held === sigilOf(M.type) ? 1.15 : 1) * (M.hex && def.status ? 2 : 1) * (M.desperate && att.hp < monStat(att, 'hp') / 3 ? 2 : 1);
        const base = Math.floor(Math.floor((2 * att.lv / 5 + 2) * pw * stat(side, M.useDef ? 'def' : 'atk') * (att.status === 'brn' && !M.useDef ? .5 : 1) / stat(defSide, 'def')) / 50) + 2;
        dmg = Math.max(1, Math.floor(base * stab * e * crit * wxMul(M.type) * (.85 + Math.random() * .15)));
      }
      Sound.play('hit'); await anim(spr(defSide), 'hurt', n > 1 ? 260 : 450);
      const fullBefore = def.hp >= monStat(def, 'hp');
      def.hp = Math.max(0, def.hp - dmg); total += dmg;
      if (def.hp === 0 && fullBefore && def.held === 'clinging_burr' && !(B.burr = B.burr || {})[def.uid + defSide]) { def.hp = 1; B.burr[def.uid + defSide] = 1; B.burrNow = 1; }
      // a Fablemon with a strong bond (10+) may hang on at 1 HP, once per battle
      if (defSide === 'me' && def.hp === 0 && (def.bond || 0) >= 10 && !(B.hung = B.hung || {})[def.uid] && Math.random() < def.bond / 100) { def.hp = 1; B.hung[def.uid] = 1; B.hungNow = 1; }
      box(defSide); await sleep(n > 1 ? 120 : 450);
    }
    if (B.burrNow) { B.burrNow = 0; await say(`${monName(def)} clung on with its Clinging Burr!`, 1200); }
    if (B.hungNow) { B.hungNow = 0; await say(`${monName(def)} hung on to stay with you!`, 1200); }
    if (n > 1) await say(`Hit ${k} time${k > 1 ? 's' : ''}!`, 900);
    if (crits) await say(crits > 1 ? `${crits} critical hits!` : 'A critical hit!', 900);
    if (e > 1) await say("It's super effective!", 1000); else if (e < 1) await say("It's not very effective...", 1000);
    if (M.drain && att.hp > 0) await healSide(side, total * M.drain, `${nameOf(defSide)} had its energy drained!`);
    if (M.recoil) { att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(total / M.recoil))); box(side); await say(`${nameOf(side)} is hurt by the effort!`, 1000); }
    if (def.hp > 0) {
      if (M.st && Math.random() * 100 < M.st[1]) await inflict(defSide, M.st[0]);
      if (M.flinch && B.first === side && Math.random() * 100 < M.flinch) vd.flinch = 1;
    }
    if (M.boost && Math.random() * 100 < M.boost[3] && (M.boost[0] === 'self' ? att.hp > 0 : def.hp > 0)) await applyStat(side, M.boost);
    if (M.pivot && att.hp > 0) B.pivot = side;
  }
  function weatherFx() { q('bstage').style.filter = !B.wx ? '' : B.wx.kind === 'rain' ? 'saturate(.8) brightness(.85) hue-rotate(10deg)' : B.wx.kind === 'sun' ? 'saturate(1.25) brightness(1.08)' : 'brightness(.7) saturate(.7)'; }
  // poison, burns and seeds at the end of each turn; weather runs down
  async function endTurn() {
    for (const side of ['me', 'foe']) {
      const m = monOf(side);
      if (m.hp > 0 && (m.status === 'psn' || m.status === 'brn')) {
        const d = Math.max(1, Math.floor(monStat(m, 'hp') / (m.status === 'psn' ? 8 : 12)));
        m.hp = Math.max(0, m.hp - d); await anim(spr(side), 'hurt', 300); box(side);
        await say(`${nameOf(side)} is hurt by its ${m.status === 'psn' ? 'poison' : 'burn'}!`, 1000);
      }
      if (m.hp > 0 && m.held === 'heartwood_charm' && m.hp < monStat(m, 'hp')) await healSide(side, monStat(m, 'hp') / 16, `${nameOf(side)}'s Heartwood Charm restored a little health.`);
      if (m.hp > 0 && B.v[side].seed && monOf(other(side)).hp > 0) {
        const d = Math.min(m.hp, Math.max(1, Math.floor(monStat(m, 'hp') / 8)));
        m.hp -= d; box(side); await anim(spr(side), 'hurt', 300);
        await healSide(other(side), d, `The seed drains ${nameOf(side)}!`);
      }
    }
    B.v.me.protect = 0; B.v.foe.protect = 0; B.v.me.flinch = 0; B.v.foe.flinch = 0;
    if (B.wx && --B.wx.turns <= 0) { const k = B.wx.kind; B.wx = null; weatherFx(); await say({ rain: 'The rain stopped.', sun: 'The sunlight faded.', gloom: 'The gloom lifted.' }[k], 1000); }
  }
  // hazards hurt whoever is sent out on that side
  async function hazardIn(side) {
    const L = B.hz[side] || 0, m = monOf(side); if (!L || m.hp <= 0) return;
    const d = Math.max(1, Math.floor(monStat(m, 'hp') * [0, 1 / 8, 1 / 6, 1 / 4][L])); m.hp = Math.max(0, m.hp - d); box(side);
    await anim(spr(side), 'hurt', 300); await say(`${nameOf(side)} is hurt by the sharp debris!`, 1000);
  }
  // how well a foe Fablemon matches up against the player's: higher is better for the foe
  const bestHit = (a, d) => Math.max(1, ...a.moves.map(id => { const M = MOVES[id]; return M.pow ? M.pow * effOn(M.type, d.sp) * stabOf(M.type, a.sp) * (M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1) : M.fixed ? 50 : 0; }));
  const matchup = (f, me) => bestHit(f, me) * monStat(f, 'atk') / (bestHit(me, f) * monStat(me, 'atk')) * (f.hp / monStat(f, 'hp') + .2);
  const foeLeft = () => B.T ? B.T.team.filter(m => m.hp > 0) : (B.foe.hp > 0 ? [B.foe] : []);
  function nextFoe() {
    const left = foeLeft().filter(m => m !== B.foe); if (!left.length) return null;
    return B.T.smart ? left.sort((a, b) => matchup(b, B.me) - matchup(a, B.me))[0] : B.T.team.find(m => m.hp > 0 && m !== B.foe);
  }
  async function foeSwitch(m, msg) {
    if (msg) await say(msg, 1100);
    B.foe = m; B.st.foe = {}; B.v.foe = {}; S.seen[m.sp] = 1;
    q('bfoe').src = monPic(m.sp, 'front'); q('bfoe').className = 'bmon'; box('foe');
    await anim('bfoe', 'enter-foe', 500);
    await say(`${B.T.label} ${B.T.name} sent out ${SPECIES[m.sp].name}!`, 1300);
    await hazardIn('foe');
  }
  // what the opponent will do this turn
  function foeDecide() {
    const f = B.foe, ms = f.moves.filter(id => ppLeft(f, id) > 0);
    if (!ms.length) return { kind: 'move', id: 'struggle' };
    if (B.T && B.T.boss && (B.T.heals ?? 2) > 0 && f.hp < monStat(f, 'hp') * .3 && f.hp > 0) return { kind: 'heal' };
    if (B.wild) { const dmg = ms.filter(m => MOVES[m].pow); return { kind: 'move', id: Math.random() < .75 && dmg.length ? pick(dmg) : pick(ms) }; }
    // clever Wardens swap out of a bad matchup (twice a battle at most)
    if (B.T.smart && (B.T.switches ?? 2) > 0 && B.turn > 0) {
      const now = matchup(f, B.me), alt = foeLeft().filter(m => m !== f).sort((a, b) => matchup(b, B.me) - matchup(a, B.me))[0];
      if (alt && now < .6 && matchup(alt, B.me) > now * 2) { B.T.switches = (B.T.switches ?? 2) - 1; return { kind: 'switch', m: alt }; }
    }
    const me = B.me, myT = SPECIES[me.sp].type, fT = SPECIES[f.sp].type, fTs = typesOf(f.sp), low = f.hp < monStat(f, 'hp') * .45, vf = B.v.foe, vm = B.v.me;
    const myBoost = Object.values(B.st.me).reduce((a, b) => a + Math.max(0, b), 0);
    const score = id => {
      const M = MOVES[id];
      if (M.protect) return vf.lastProtect === B.turn - 1 ? 0 : (vm.seed || me.status === 'psn' || me.status === 'brn') ? 35 : 8;
      if (M.weather) return B.wx && B.wx.kind === M.weather ? 0 : (fTs.includes({ rain: 'Tide', sun: 'Ember', gloom: 'Shade' }[M.weather]) ? 55 : 5);
      if (M.hazard) return (B.hz.me || 0) >= 3 ? 0 : (B.turn || 0) < 3 ? 45 : 12;
      if (M.haze) return myBoost >= 2 ? 80 : 0;
      if (M.critUp) return vf.crit ? 0 : (B.turn || 0) < 2 ? 45 : 15;
      if (M.cure) return B.T.team.some(m => m.status && m.hp > 0) ? 60 : 0;
      if (M.rest) return f.hp < monStat(f, 'hp') * .35 ? 75 : 0;
      if (M.heal && !M.pow) return low ? 85 : 0;
      if (M.seed) return vm.seed || hasType(me.sp, 'Leaf') ? 0 : 50;
      if (M.onlySleep && me.status !== 'slp') return 0;
      if (M.pow || M.fixed) {
        let v = M.fixed ? f.lv * 1.2 : (M.useDef ? monStat(f, 'def') / Math.max(1, monStat(f, 'atk')) : 1) * M.pow * effOn(M.type, me.sp) * stabOf(M.type, f.sp) * wxMul(M.type) * (M.hits ? (M.hits[0] + M.hits[1]) / 2 : 1) * (M.hex && me.status ? 2 : 1) * (M.desperate && f.hp < monStat(f, 'hp') / 3 ? 2 : 1);
        v *= (M.acc || 100) / 100;
        if (M.st && !me.status) v *= 1.1;
        if (M.drain && low) v *= 1.3;
        if (M.prio > 0 && me.hp < monStat(me, 'hp') * .25) v *= 2;
        if (M.recoil && f.hp < monStat(f, 'hp') * .3) v *= .7;
        return v;
      }
      if (M.st) return me.status || hasType(me.sp, IMMUNE[M.st[0]]) ? 0 : (M.st[0] === 'slp' ? 75 : 60) * (M.acc || 100) / 100;
      if (M.stat || M.stats) { const k = (M.stats || [M.stat])[0], cur = B.st[k[0] === 'self' ? 'foe' : 'me'][k[1]] || 0; return Math.abs(cur) >= 2 ? 5 : (B.turn || 0) < 2 ? 45 : 20; }
      return 10;
    };
    const jitter = B.T.boss ? 0 : 18;
    return { kind: 'move', id: ms.map(id => [score(id) + Math.random() * jitter, id]).sort((a, b) => b[0] - a[0])[0][1] };
  }
  async function doFoe(fa) {
    if (!fa || B.foe.hp <= 0) return;
    if (fa.kind === 'heal') {
      const f = B.foe; B.T.heals = (B.T.heals ?? 2) - 1; f.hp = Math.min(monStat(f, 'hp'), f.hp + Math.ceil(monStat(f, 'hp') / 2)); Sound.play('pop'); box('foe');
      await anim('bfoe', 'buff', 400); return say(`Warden ${B.T.name} used a Hearthberry! ${SPECIES[f.sp].name} recovered some HP.`, 1500);
    }
    if (fa.kind === 'switch') return foeSwitch(fa.m, `${B.T.label} ${B.T.name} called ${SPECIES[B.foe.sp].name} back!`);
    await useMove('foe', fa.id);
  }
  async function afterPivot() {
    const side = B.pivot; B.pivot = null; if (!side) return;
    if (side === 'me') {
      if (B.me.hp <= 0 || !team().some(m => m.hp > 0 && m !== B.me)) return;
      await say(`${monName(B.me)} went back to you!`, 900);
      const m = await pickMon(true); await sendOut(m); await say(`Go, ${monName(B.me)}!`, 900); await hazardIn('me');
    } else if (B.T && B.foe.hp > 0) {
      const m = nextFoe(); if (m) await foeSwitch(m, `${SPECIES[B.foe.sp].name} went back to ${B.T.name}!`);
    }
  }
  async function gainXP() {
    const S0 = SPECIES[B.foe.sp], gain = Math.max(1, Math.floor((S0.exp || 50) * B.foe.lv / 5 * .9 * (B.wild ? 1 : 1.5) * (S.xpDay === S.day ? 1.5 : 1) * (hasPerk('rowan') ? 1.1 : 1)));   // ×0.9: a little grinding is part of the game
    const fought = [...B.used].map(uid => S.mons.find(x => x.uid === uid)).filter(m => m && m.hp > 0);
    const rest = team().filter(m => m.hp > 0 && !fought.includes(m)), share = Math.max(1, Math.floor(gain / 2));
    for (const m of rest) m.xp += Math.floor(share * (m.held === 'study_leaf' ? 1.2 : 1));
    if (rest.length) await say(`The rest of your team gained ${share} experience each.`, 1100);
    for (const m of [...fought, ...rest]) {
      if (fought.includes(m)) { const gg = Math.floor(gain * (m.held === 'study_leaf' ? 1.2 : 1)); m.xp += gg; if (m === B.me) box('me'); await say(`${monName(m)} gained ${gg} experience!`, 1100); }
      while (m.lv < 100 && m.xp >= xpNext(m)) {
        const oldMax = monStat(m, 'hp'); m.lv++; m.hp += monStat(m, 'hp') - oldMax; m.bond = (m.bond || 0);
        Sound.play('levelup'); if (m === B.me) { box('me'); await anim('bme', 'buff', 400); }
        await say(`${monName(m)} grew to level ${m.lv}!`, 1300);
        for (const [l, id] of LEARN[m.sp] || []) if (l === m.lv && !m.moves.includes(id)) await learn(m, id);
      }
    }
  }
  async function learn(m, id) {
    if (m.moves.length < 4) { m.moves.push(id); Sound.play('coin'); return say(`${monName(m)} learned ${MOVES[id].name}!`, 1300); }
    q('bmsg').innerHTML = `<div style="font-size:14px;margin-bottom:4px">${monName(m)} wants to learn a new move, but already knows 4. Forget one?</div>${moveCard(id, m, ' <span class="newtag">NEW</span>')}`;
    const f = await menu(m.moves.map(x => { const M = MOVES[x]; return { html: `Forget ${M.name}<small>${M.type} · ${M.pow ? 'Power ' + M.pow : moveEffect(x).replace(/\.$/, '')}${M.acc ? ' · ' + M.acc + '%' : ''}</small>`, v: x, style: `border-color:${TYPES[M.type]}` }; }).concat([{ html: `Don't learn ${MOVES[id].name}`, v: null }]));
    if (!f) return say(`${monName(m)} did not learn ${MOVES[id].name}.`);
    m.moves[m.moves.indexOf(f)] = id; Sound.play('coin');
    return say(`${monName(m)} forgot ${MOVES[f].name} and learned ${MOVES[id].name}!`, 1500);
  }
  async function sendOut(m) {
    B.me = m; B.st.me = {}; B.v.me = {}; B.used.add(m.uid); sprites(); box('me');
    await anim('bme', 'enter-me', 450);
  }
  async function throwCharm(cid = 'root_charm') {
    inv.remove(cid, 1); renderHotbar();
    await say(`You threw a ${ITEMS[cid].name}!`, 700);
    const c = q('bcharm'); c.src = iconFor(cid); c.className = 'throw'; await sleep(650);
    Sound.play('pop'); q('bfoe').classList.add('absorb'); await sleep(450);
    const M = monStat(B.foe, 'hp'), rate = (SPECIES[B.foe.sp].rate || 120) * (cid === 'sturdy_charm' ? 1.5 : 1) * (B.foe.status === 'slp' ? 2 : B.foe.status ? 1.5 : 1);
    const a = Math.max(1, ((3 * M - 2 * B.foe.hp) * rate) / (3 * M));
    const b = a >= 255 ? 65536 : 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
    let shakes = 0; while (shakes < 4 && Math.random() * 65536 < b) shakes++;
    for (let i = 0; i < Math.min(3, shakes); i++) { c.className = 'throw sit'; void c.offsetWidth; c.className = 'throw sit wobble'; Sound.play('wobble'); await sleep(750); }
    if (shakes >= 4) {
      Sound.play('gotcha'); c.className = 'throw sit glow';
      await say(`Gotcha! ${SPECIES[B.foe.sp].name} chose to come with you!`, 1800);
      const m = newMon(B.foe.sp, B.foe.lv); m.iv = { ...B.foe.iv }; m.hp = Math.min(B.foe.hp, monStat(m, 'hp')); m.moves = B.foe.moves.slice(); m.xp = B.foe.xp;
      S.caught[m.sp] = 1; S.flags.catches = (S.flags.catches || 0) + 1;
      { const best = ivBest(m); if (best[1] >= 8) await say(`It looks like it has great ${IV_NAME[best[0]]}! (${best[1]}/10)`, 1600); }
      const nm = SPECIES[m.sp].name, home = S.ranch === 2 ? 'your ranch' : 'wait at your farm until you build a ranch';
      if (team().length < TEAM_MAX) { giveMon(m); await say(`${nm} joined your team!`, 1800); return true; }
      // team is full: send the new one home, or swap it with someone in the team
      q('bmsg').textContent = `Your team is full. Keep ${nm} with you by sending someone else home?`;
      const out = await menu([{ html: `Send ${nm} home`, v: null, cls: 'gold' }, ...team().map(t => ({ html: `<img src="${monPic(t.sp)}">Swap ${monName(t)} <small>Lv ${t.lv}</small>`, v: t }))]);
      if (!out) { m.loc = 'ranch'; S.mons.push(m); refreshTeamBtn(); await say(`${nm} went to ${home}.`, 1800); return true; }
      const pos = S.mons.indexOf(out);
      out.loc = 'ranch'; out.out = false; out.job = null;
      S.mons.splice(pos, 0, m); refreshTeamBtn();
      await say(`${monName(out)} went to ${home}, and ${nm} joined your team!`, 2000);
      return true;
    }
    c.className = 'hidden'; q('bfoe').classList.remove('absorb'); Sound.play('error');
    await say(['Oh no! It broke free!', 'Aww! It almost chose you!', 'So close! It wriggled out!', 'Argh! Nearly had it!'][Math.min(3, shakes)], 1300);
    return false;
  }
  async function blackout() {
    await say(`You have no Fablemon left that can battle...`, 1600);
    await say('You hurry home with your team to rest.', 1600);
    finish(); S.mons.forEach(restMon);
    S.time = Math.min(S.time + 120, 25 * 60);
    if (scene) { scene.sleeping = true; $('fade').style.opacity = 1; setTimeout(() => { S.spawn = { scene: 'house', x: 2, y: 3, dir: 'down' }; scene.scene.start('house'); setTimeout(() => toast('Your Fablemon are rested and healthy again.', 2600), 600); }, 400); }
  }
  async function evolveAll() {
    for (const m of team()) {
      const to = evoOf(m); if (!to) continue;
      const from = m.sp, oldName = monName(m), oldMax = monStat(m, 'hp');
      q('bfoe').style.visibility = 'hidden'; q('bfoebox').style.visibility = 'hidden'; q('bmebox').style.visibility = 'hidden';
      const me = q('bme'); me.src = monPic(from, 'front'); me.className = 'bmon evolving';
      Sound.theme('none'); await say(`What? ${oldName} is evolving!`, 1800);
      for (let i = 0; i < 6; i++) { me.src = monPic(i % 2 ? to : from, 'front'); Sound.play('wobble'); await sleep(Math.max(140, 420 - i * 55)); }
      m.sp = to; m.hp = Math.min(monStat(m, 'hp'), m.hp + (monStat(m, 'hp') - oldMax));
      me.src = monPic(to, 'front'); me.className = 'bmon evolved'; Sound.play('gotcha');
      S.caught[to] = 1; S.seen[to] = 1;
      await say(`Congratulations! ${oldName} evolved into ${SPECIES[to].name}!`, 2400);
      for (const [l, id] of LEARN[to] || []) if ((l === m.lv || (SIGNATURE[to] && SIGNATURE[to][1] === id && l <= m.lv)) && !m.moves.includes(id)) await learn(m, id);
      q('bfoe').style.visibility = ''; q('bfoebox').style.visibility = ''; q('bmebox').style.visibility = '';
    }
  }
  function finish() { for (const m of S.mons) { m.status = null; m.slp = 0; } Sound.hushRain(false); Sound.theme(B && B.prevTheme || 'field'); el.classList.remove('show'); B = null; tapNext = null; if (scene) { scene.paused = false; if (scene.p) scene.p.busy = .4; if (scene.refreshFollower) scene.refreshFollower(); } refreshTeamBtn(); updateHUD(); Sound.music(true); }
  const foeLabel = () => B.wild ? 'The wild ' : 'The opposing ';
  async function run(foe, T) {
    const first = team().find(m => m.hp > 0);
    B = { foe, me: first, wild: !T, T, st: { me: {}, foe: {} }, v: { me: {}, foe: {} }, hz: {}, wx: null, turn: 0, used: new Set([first.uid]), runs: 0, prevTheme: Sound.currentTheme };
    Sound.hushRain(true); Sound.theme('battle');
    S.seen[foe.sp] = 1;
    if (scene) scene.paused = true;
    q('bstage').style.backgroundImage = `url(${scene && ['route3', 'route4', 'brookholt', 'bhgym'].includes(scene.scene.key) ? ASSET.bgBog : ASSET.bgMeadow})`;
    q('bcharm').className = 'hidden'; q('bstage').style.filter = '';
    sprites(); box('me'); box('foe'); el.classList.add('show'); layout();
    q('bfoe').classList.add('enter-foe'); q('bme').classList.add('enter-me');
    if (T) { await say(`${T.label} ${T.name} wants to battle!`, 1500); await say(`${T.label} ${T.name} sent out ${SPECIES[foe.sp].name}!`, 1300); }
    else await say(`A wild ${SPECIES[foe.sp].name} appeared!`, 1500);
    await say(`Go, ${monName(B.me)}!`, 900);
    for (;;) {
      for (;;) {
        const act = await chooseAction();
        const fa = foeDecide();
        let foeDone = false;
        if (act.kind === 'run') {
          if (T) { await say("You can't run away from a trainer battle!", 1300); continue; }
          B.runs++;
          const ok = stat('me', 'spd') >= stat('foe', 'spd') || Math.random() < .5 + .15 * B.runs;
          if (ok) { Sound.play('swish'); await say('You got away safely!', 1100); return finish(); }
          await say("Couldn't get away!", 1000);
        } else if (act.kind === 'charm') {
          if (await throwCharm(act.id)) return finish();
        } else if (act.kind === 'heal') {
          inv.remove(act.id, 1); renderHotbar(); const h = Math.min(monStat(B.me, 'hp') - B.me.hp, healAmt(act.id, B.me)); if (ITEMS[act.id].cure && B.me.status) { B.me.status = null; box('me'); } B.me.hp += h; Sound.play('pop');
          box('me'); await anim('bme', 'buff', 400); await say(`${monName(B.me)} ate the ${ITEMS[act.id].name} and recovered ${h} HP!`, 1400);
        } else if (act.kind === 'switch') {
          await say(`Come back, ${monName(B.me)}!`, 800); await sendOut(act.m); await say(`Go, ${monName(B.me)}!`, 800); await hazardIn('me');
        } else {
          // switching and healing come before any move; then priority, then speed
          if (fa.kind !== 'move') { await doFoe(fa); foeDone = true; }
          const mp = MOVES[act.id].prio || 0, fp = fa.kind === 'move' ? (MOVES[fa.id].prio || 0) : -99;
          const meFirst = foeDone || mp > fp || (mp === fp && (stat('me', 'spd') > stat('foe', 'spd') || (stat('me', 'spd') === stat('foe', 'spd') && Math.random() < .5)));
          if (meFirst) { B.first = 'me'; await useMove('me', act.id); await afterPivot(); if (B.foe.hp <= 0) break; if (!foeDone) { await doFoe(fa); await afterPivot(); } }
          else { B.first = 'foe'; await doFoe(fa); await afterPivot(); if (B.me.hp > 0) { await useMove('me', act.id); await afterPivot(); } if (B.foe.hp <= 0) break; }
          foeDone = true;
        }
        if (!foeDone) { B.first = 'me'; await doFoe(fa); await afterPivot(); }
        B.turn = (B.turn || 0) + 1;
        if (B.foe.hp > 0 && B.me.hp > 0) await endTurn();
        if (B.foe.hp <= 0) break;
        while (B.me.hp <= 0) {
          Sound.play('faint'); await anim('bme', 'faint', 600);
          await say(`${monName(B.me)} fainted!`, 1300);
          if (!team().some(m => m.hp > 0)) return blackout();
          const m = await pickMon(true); await sendOut(m); await say(`Go, ${monName(B.me)}!`, 900); await hazardIn('me');
        }
      }
      Sound.play('faint'); await anim('bfoe', 'faint', 600);
      await say(`${foeLabel()}${SPECIES[B.foe.sp].name} fainted!`, 1300);
      if (!(T && nextFoe())) { Sound.theme('none'); Sound.victory(); }
      await gainXP();
      B.used = new Set([B.me.uid]);
      const next = T && nextFoe();
      if (!next) break;
      await foeSwitch(next);
      if (B.foe.hp <= 0) { Sound.play('faint'); await anim('bfoe', 'faint', 600); }
    }
    if (T) {
      await say(`You beat ${T.label} ${T.name}!`, 1400);
      if (T.lose) await say(`"${T.lose}"`, 2200);
      const lucky = [...B.used].some(uid => (S.mons.find(x => x.uid === uid) || {}).held === 'lucky_acorn'), prize = Math.round(T.prize * (lucky ? 1.25 : 1));
      S.gold += prize; updateHUD(); Sound.play('coin');
      await say(`You got ${prize}g for winning${lucky ? ' (Lucky Acorn bonus!)' : ''}.`, 1500);
      if (T.onWin) T.onWin();
    }
    await evolveAll();
    finish();
  }
  return { start(foe, T) { Sound.play('encounter'); const f = $('flash'); f.style.opacity = .9; setTimeout(() => f.style.opacity = 0, 140); setTimeout(() => run(foe, T), 220); }, get active() { return !!B; } };
})();

/* ---------- the route's encounter tables */
const ENCOUNTERS = {
  day: [['tusskip', 30], ['whirplet', 25], ['cloverclasp', 25], ['flintuck', 12], ['fuzzwick', 8]],
  night: [['duskwick', 35], ['fuzzwick', 25], ['tusskip', 20], ['flintuck', 20]],
};
function rollWild(lvMin, lvMax, extra) {
  const night = S.time >= 1140 || S.time < 360, tab = [...(RC ? RC.enc : ENCOUNTERS)[night ? 'night' : 'day'], ...(extra || [])];
  let r = Math.random() * tab.reduce((a, [, w]) => a + w, 0), sp = tab[0][0];
  for (const [s, w] of tab) { if ((r -= w) < 0) { sp = s; break; } }
  return wildMon(sp, lvMin + Math.floor(Math.random() * (lvMax - lvMin + 1)));
}

/* ========================================================= Meadow Trail
   The first route: south of the farm. Path, a brook with a footbridge,
   long grass where wild Fablemon live, and a few things to find. */
const ROUTE_OFF = 19;   // farm x = Meadow Trail x + ROUTE_OFF
let RW = 44, RH = 72, RC = null, GRASS_ZONES, PICKUPS, ROUTE_SIGNS, BRIDGE, ROUTE_TRAINERS;
const R1_ZONES = [
  [23, 2, 29, 9, 2, 4], [12, 15, 18, 23, 2, 4], [34, 15, 40, 30, 3, 5], [13, 40, 19, 52, 3, 5, 'brook'],
  [26, 40, 36, 52, 4, 6, 'brook'], [14, 60, 23, 68, 4, 7], [30, 60, 40, 68, 4, 7],
];
const R1_PICKUPS = [
  { id: 'r1', x: 38, y: 12, item: 'root_charm', n: 2 }, { id: 'r2', x: 15, y: 30, item: 'berry', n: 2 },
  { id: 'r3', x: 39, y: 57, gold: 150 }, { id: 'r4', x: 6, y: 64, item: 'root_charm', n: 3 },
];
const R1_SIGNS = {
  '17,3': 'Meadow Trail. Wild Fablemon live in the long grass. Keep to the path to stay out of trouble!',
  '24,68': 'South to Brookside Lane and the Warden\'s Garden.',
};
function buildRoute() {
  const V = Array.from({ length: RH + 1 }, () => new Uint8Array(RW + 1));
  const setRect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y <= RH && x >= 0 && x <= RW) V[y][x] = v; };
  if (RC.lake) { setRect(0, 0, RW, RH, 2); setRect(0, 0, RW, 1, 0); setRect(0, RH - 1, RW, RH, 0); setRect(0, 0, 1, RH, 0); setRect(RW - 1, 0, RW, RH, 0); for (const r of RC.land) setRect(...r, 0); }
  for (const r of RC.paths) setRect(...r, 1);
  // a drained channel becomes mossy banks with a muddy path down the middle, so it blends into the bog
  for (const c of RC.channels || []) {
    const [x0, y0, x1, y1] = c.r;
    if (!c.dry(sluice())) { setRect(x0, y0, x1, y1, 2); continue; }
    setRect(x0, y0, x1, y1, 0);
    if (x1 - x0 > y1 - y0) setRect(x0, y0 + 1, x1, y1 - 1, 1); else setRect(x0 + 1, y0, x1 - 1, y1, 1);
    for (const l of c.links || []) setRect(...l, 1);
  }
  for (const [cx, cy, rx, ry] of RC.ponds) for (let y = 0; y <= RH; y++) for (let x = 0; x <= RW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) V[y][x] = 2;
  const tiles = new Int32Array(RW * RH), blocked = new Uint8Array(RW * RH), dirtish = new Uint8Array(RW * RH), waterish = new Uint8Array(RW * RH), grass = new Int8Array(RW * RH).fill(-1), water = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const c = [V[y][x], V[y][x + 1], V[y + 1][x + 1], V[y + 1][x]], i = y * RW + x;
    if (c.every(v => v === 0)) { const h = hash(x + 99, y); tiles[i] = FILL_ROW * 16 + (h < .6 ? 0 : h < .8 ? 1 : 2); continue; }
    const low = Math.max(...c), row = low === 2 ? 1 : 0;
    tiles[i] = row * 16 + (c[0] === 0) * 8 + (c[1] === 0) * 4 + (c[2] === 0) * 2 + (c[3] === 0);
    if (low === 2) { water.push(i); waterish[i] = 1; if (c.filter(v => v === 2).length >= 2) blocked[i] = 1; } else dirtish[i] = 1;
  }
  let bx0 = RW, bx1 = 0;
  if (BRIDGE) for (let y = BRIDGE.y0; y <= BRIDGE.y1; y++) for (let x = 0; x < RW; x++) if (waterish[y * RW + x]) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); }
  if (BRIDGE) { BRIDGE.x0 = bx0 - 1; BRIDGE.x1 = bx1 + 1; }
  if (BRIDGE) for (let y = BRIDGE.y0; y <= BRIDGE.y1; y++) for (let x = BRIDGE.x0; x <= BRIDGE.x1; x++) { blocked[y * RW + x] = 0; dirtish[y * RW + x] = 1; }
  GRASS_ZONES.forEach(([x0, y0, x1, y1], z) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * RW + x; if (!dirtish[i] && !waterish[i] && hash(x * 3, y * 5) > .08) { grass[i] = z; tiles[i] = FILL_ROW * 16 + 11; } } });
  const border = [], deco = [];
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const i = y * RW + x, d = Math.min(x, y, RW - 1 - x, RH - 1 - y);
    if (RC.open.some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)) continue;
    if (d < 2 || (d < 3 && hash(x * 7, y * 3) < .5)) { blocked[i] = 1; if ((x + y) % 2 === 0 || d >= 2) border.push({ x, y, kind: hash(x, y * 7) < .5 ? 'tree_pine' : 'tree_oak' }); continue; }
    if (dirtish[i] || waterish[i] || grass[i] >= 0 || PICKUPS.some(p => p.x === x && p.y === y) || ROUTE_SIGNS[x + ',' + y] || ROUTE_TRAINERS.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) <= 1)) continue;
    let near = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * RW + x + dx; if (dirtish[j] || grass[j] >= 0) near = true; }
    const h = hash(x * 13 + 5, y * 11 + 3);
    if (RC.clear.some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)) continue;
    if (RC.town && !near && h < .12) continue;
    if (!near && h < .09) { blocked[i] = 1; deco.push({ x, y, f: h < .03 ? 'tree_pine' : h < .07 ? 'tree_oak' : 'tree_apple', tall: true }); }
    else if (h < .12) { blocked[i] = 1; deco.push({ x, y, f: h < .105 ? 'bush_round' : 'rock_large' }); }
    else if (h > .93) deco.push({ x, y, f: 'wildflowers', flat: true });
  }
  for (let x = 0; x < RW; x++) blocked[(RH - 1) * RW + x] = 1;
  if (RC.gate && !RC.gate.ok()) { const [a, b, c, d] = RC.gate.area; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) { blocked[y * RW + x] = 1; if ((x + y) % 2 === 0 || x === a) deco.push({ x, y, f: 'rock_large', gate: 1 }); } }
  for (const t of ROUTE_TRAINERS) { const i = t.y * RW + t.x; blocked[i] = 1; grass[i] = -1; if (tiles[i] === FILL_ROW * 16 + 11) tiles[i] = FILL_ROW * 16; }
  for (const k of Object.keys(ROUTE_SIGNS)) { const [x, y] = k.split(',').map(Number); blocked[y * RW + x] = 1; }
  for (const [, x, y, w] of RC.props || []) for (let k = 0; k < (w || 1); k++) { const i = y * RW + x + k; blocked[i] = 1; grass[i] = -1; }
  for (const b of RC.buildings || []) {
    const f = (b.atlas === 'bh' ? ASSET.bhJson : ASSET.townJson).frames[b.frame].frame, cxp = b.cx * T + 8, x0 = Math.floor((cxp - f.w / 2 + 4) / T), x1 = Math.floor((cxp + f.w / 2 - 5) / T), rows = Math.max(2, Math.ceil(f.h * .5 / T));
    for (let y = b.by - rows + 1; y <= b.by; y++) for (let x = x0; x <= x1; x++) blocked[y * RW + x] = 1;
  }
  return { tiles, blocked, dirtish, waterish, grass, water, border, deco };
}

/* ---------- bog terrain: the clean meadow tiles, recoloured for the bog */
function bogTerrain(sc) {
  if (sc.textures.exists('terrain_bog')) return;
  const src = sc.textures.get('terrain_x').getSourceImage(), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], gg = a[i + 1], b = a[i + 2];
    if (b > r + 10 && b > gg - 10) { r = r * .45 + 18; gg = gg * .72 + 22; b = b * .6 + 14; }            // water: murky teal
    else if (gg > r && gg > b) { const l = (r + gg + b) / 3; r = (r * .7 + l * .3) * .86 + 10; gg = (gg * .7 + l * .3) * .84; b = (b * .7 + l * .3) * .72; }   // grass: muted olive
    else { const l = (r + gg + b) / 3; r = (r * .5 + l * .5) * .68; gg = (gg * .5 + l * .5) * .64; b = (b * .5 + l * .5) * .58; }   // paths and earth: dark peat
    a[i] = r; a[i + 1] = gg; a[i + 2] = b;
  }
  g.putImageData(d, 0, 0); sc.textures.addCanvas('terrain_bog', c);
}
/* ---------- bog ground: painted textures instead of meadow tiles (unused: too busy at game size) */
function bogGround(sc, R) {
  const key = 'bogGround_' + sc.scene.key; if (sc.textures.exists(key)) sc.textures.remove(key);
  const c = document.createElement('canvas'); c.width = RW * T; c.height = RH * T;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const img = n => sc.textures.get('g_' + n).getSourceImage();
  const inRect = (x, y, r) => x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
  const kindAt = (x, y) => {
    const i = y * RW + x;
    if (R.waterish[i]) return hash(x >> 1, y >> 1) < .1 ? 'lily' : 'bogwater';
    if (R.dirtish[i]) {
      if ((RC.channels || []).some(ch => inRect(x, y, ch.r))) return 'peat';
      const r = RC.paths.find(p => inRect(x, y, p)); return r && r[3] - r[1] > r[2] - r[0] ? 'board_v' : 'board_h';
    }
    return hash(x >> 2, y >> 2) < .28 ? 'peat' : 'moss';
  };
  const K = new Array(RW * RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const k = K[y * RW + x] = kindAt(x, y); g.drawImage(img(k), (x & 1) * T, (y & 1) * T, T, T, x * T, y * T, T, T); }
  g.fillStyle = 'rgba(16,30,12,.32)'; for (let i = 0; i < RW * RH; i++) if (R.grass[i] >= 0) g.fillRect((i % RW) * T, ((i / RW) | 0) * T, T, T);
  // shadowed edges where water meets land, and where boardwalks start
  const wet = k => k === 'bogwater' || k === 'lily', board = k => k === 'board_h' || k === 'board_v';
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = K[y * RW + x], at = (dx, dy) => K[(y + dy) * RW + x + dx];
    if (wet(k)) { g.fillStyle = 'rgba(20,28,16,.55)'; if (y > 0 && !wet(at(0, -1))) g.fillRect(x * T, y * T, T, 2); if (x > 0 && !wet(at(-1, 0))) g.fillRect(x * T, y * T, 1, T); if (x < RW - 1 && !wet(at(1, 0))) g.fillRect(x * T + T - 1, y * T, 1, T); if (y < RH - 1 && !wet(at(0, 1))) { g.fillStyle = 'rgba(200,220,170,.25)'; g.fillRect(x * T, y * T + T - 1, T, 1); } }
    if (board(k)) { g.fillStyle = 'rgba(30,20,12,.5)'; if (y < RH - 1 && !board(at(0, 1))) g.fillRect(x * T, y * T + T - 1, T, 1); if (x > 0 && !board(at(-1, 0))) g.fillRect(x * T, y * T, 1, T); if (x < RW - 1 && !board(at(1, 0))) g.fillRect(x * T + T - 1, y * T, 1, T); }
  }
  sc.textures.addCanvas(key, c);
}
// reeds at the water's edge, lilies, logs, drifting mist and marsh lights
function bogDressing(sc, R) {
  for (let y = 2; y < RH - 2; y++) for (let x = 2; x < RW - 2; x++) {
    const i = y * RW + x, h = hash(x * 7 + 1, y * 11 + 5);
    if (R.waterish[i] && R.blocked[i] && h < .015) sc.add.image(x * T + 8, y * T + 14, 'bog', 'lilies').setOrigin(.5, 1).setDepth(2);
    const edge = !R.waterish[i] && !R.dirtish[i] && !R.blocked[i] && R.grass[i] < 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => R.waterish[(y + dy) * RW + x + dx]);
    const busy = PICKUPS.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) <= 1) || ROUTE_TRAINERS.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) <= 1) || Object.keys(ROUTE_SIGNS).some(k => { const [a, b] = k.split(',').map(Number); return Math.abs(a - x) + Math.abs(b - y) <= 1; }) || (RC.channels || []).some(ch => x >= ch.r[0] - 1 && x <= ch.r[2] && y >= ch.r[1] - 1 && y <= ch.r[3]);
    if (edge && !busy && h < .09) { R.blocked[i] = 1; const im = sc.add.image(x * T + 8, y * T + 15, 'bog', h < .06 ? 'cattail' : 'tuft').setOrigin(.5, 1).setDepth(y * T + 15); sc.tall.push(im); }
  }
  for (let k = 0; k < 4; k++) { const m = sc.add.image(hash(k, 3) * RW * T, hash(k, 9) * RH * T, 'bog', 'mist').setAlpha(.22).setDepth(9e6 - 29).setScale(1.5); sc.tweens.add({ targets: m, x: m.x + 70, alpha: .1, duration: 7000 + k * 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
  for (let k = 0; k < 5; k++) { const w = sc.add.image(hash(k, 17) * RW * T, hash(k, 23) * RH * T, 'bog', 'wisp').setBlendMode(Phaser.BlendModes.ADD).setDepth(9e6 - 28).setAlpha(.45); sc.tweens.add({ targets: w, y: w.y - 10, x: w.x + 6, alpha: .15, duration: 1800 + k * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
}

/* ---------- trainers: reusable types with names, lines and art */
const TRAINER_TYPES = {
  delphine: { label: 'Warden', challenge: ['Let the tide decide.'], lose: ['Well played.'], after: ['Mind the fen on your way home!'] },
  rambler: { label: 'Rambler', challenge: ["Oi! You're walking the trail too? Let's see what your Fablemon are made of!", "Fresh air, long walks and a good battle. Perfect day!"], lose: ["Well, that's me told. Lovely battling, though!", "I'll walk that off. Well played!"], after: ["Mind the brook further down. The bridge gets slippy when it rains.", "I've walked every trail round here. This one's my favourite."] },
  birdwatcher: { label: 'Birdwatcher', challenge: ["Shh! I've been watching you through my binoculars. Fancy a battle?", "A rare sighting! A new trainer! Let's see your Fablemon up close."], lose: ["Remarkable! I must write this down.", "Well, I didn't see that coming. And I see everything!"], after: ["Whirplets nest in the hedgerows. Listen for their whistle at dawn.", "Patience is everything. Sit still long enough and the wild comes to you."] },
  forager: { label: 'Forager', challenge: ["Found a lovely patch of mushrooms. Not sharing! Unless you beat me...", "The woods provide everything. Including a good battle!"], lose: ["Oh well. At least I've still got my mushrooms.", "You've a good eye for battling. Ever tried foraging?"], after: ["Never eat a mushroom you can't name. Golden rule, that.", "Hearthberries grow wild if you know where to look."] },
  busker: { label: 'Busker', challenge: ["Every great tune needs a bit of drama. Let's battle!", "Tip the musician? Or battle him! Your choice. Actually, battle him."], lose: ["Ha! That's going in a song.", "Bum note. Well played, mate."], after: ["I play for the Fablemon too. They like a jig.", "One day I'll play the big stage in the city. Or maybe I'll just stay here."] },
  allotment: { label: 'Allotment Keeper', challenge: ["You've got a farmer's hands, dear. Let's see if you've a battler's heart!", "Forty years I've grown prize marrows. Battling's easy next to that!"], lose: ["Goodness! You've beaten me fair and square.", "Well, I never. Come by for a cuppa sometime."], after: ["Water in the morning, never the heat of the day. That's the secret.", "My Fablemon keeps the slugs off the lettuces. Worth its weight in gold."] },
  reedcutter: { label: 'Reed Cutter', challenge: ["Mind where you step, the reeds hide all sorts. Including a battle!", "Cut reeds all morning. Fancy cutting loose with a battle?"], lose: ["Well, that's me sliced and diced.", "Fair play. Back to the reeds for me."], after: ["Reed thatch keeps Brookholt dry. Best roofs in the valley.", "Wild rice grows in the shallows if you've the patience. And waders."] },
  wispwatcher: { label: 'Wisp-Watcher', challenge: ["The wisps led me to you. They're never wrong about a battle.", "Shh... the lights are dancing. Let's battle beneath them!"], lose: ["The wisps saw that coming. I didn't.", "My lantern flickered. A sign, surely."], after: ["Glimmerjel gather where the fog is thickest after dark.", "Some say the wisps are the bog's memories. I just think they're pretty."] },
  ponddipper: { label: 'Pond Dipper', challenge: ["I caught loads in the brook today! Wanna see?", "Shh! You'll scare the newts! ...Fine, let's battle!"], lose: ["Aww! My jam jar's empty now...", "No fair! You're really good!"], after: ["Did you know some Fablemon only come out at night? Spooky!", "I'm going to be a Warden when I grow up. Probably."] },
};
// portrait rows on tr_portraits.png; column 0 = ready to battle, 1 = beaten but cheerful
const TRAINER_ROW = { rambler: 0, ponddipper: 1, birdwatcher: 2, forager: 3, busker: 4, allotment: 5, delphine: 6, reedcutter: 7, wispwatcher: 8 };
const TRAINER_PIC = {};
function loadTrainerPics() {
  return loadImg(ASSET.trPortraits).then(img => {
    for (const [k, r] of Object.entries(TRAINER_ROW)) for (const f of [0, 1]) {
      const c = document.createElement('canvas'); c.width = c.height = 80; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#cfe3b2'; g.fillRect(0, 0, 80, 80); g.drawImage(img, f * 64, r * 64, 64, 64, 0, 0, 80, 80);
      TRAINER_PIC[k + f] = c.toDataURL();
    }
  });
}
const trainerPic = (kind, beaten = 0) => TRAINER_PIC[kind + beaten] || '';
// id, type, name, tile, facing, sight, team [species, level]...
const R1_TRAINERS = [
  { id: 'mt1', kind: 'rambler', name: 'Sue', x: 26, y: 9, dir: 'down', sight: 4, team: [['tusskip', 4], ['whirplet', 5]] },
  { id: 'mt2', kind: 'ponddipper', name: 'Alfie', x: 28, y: 33, dir: 'down', sight: 4, team: [['cloverclasp', 5], ['fuzzwick', 5]] },
  { id: 'mt3', kind: 'rambler', name: 'Dot', x: 15, y: 47, dir: 'left', sight: 5, team: [['whirplet', 6], ['tusskip', 6], ['cloverclasp', 7]] },
  { id: 'mt4', kind: 'ponddipper', name: 'Maisie', x: 20, y: 59, dir: 'up', sight: 4, team: [['fuzzwick', 7], ['flintuck', 8]] },
];
// Brookside Lane: Meadow Trail's south exit leads here; the Warden's Garden is at the far end
const hedgeRing = [];
for (let x = 15; x <= 31; x += 2) { if (x < 21 || x > 25) hedgeRing.push(['hedge', x, 51, 2]); hedgeRing.push(['hedge', x, 61, 2]); }
for (let y = 52; y <= 60; y++) { hedgeRing.push(['hedge1', 15, y, 1]); hedgeRing.push(['hedge1', 32, y, 1]); }
const ROUTES = {
  route1: { name: 'Meadow Trail', w: 44, h: 72, paths: [[19, 0, 22, 14], [19, 11, 33, 14], [30, 11, 33, 38], [9, 35, 33, 38], [9, 35, 12, 58], [9, 55, 28, 58], [25, 55, 28, 72]],
    ponds: [[22.5, 37, 2.3, 12]], bridge: { x0: 19, x1: 25, y0: 35, y1: 37 }, zones: R1_ZONES, pickups: R1_PICKUPS, signs: R1_SIGNS, trainers: R1_TRAINERS,
    brook: [['brooknook', 14]], open: [[13, 0, 28, 4], [24, 67, 29, 71]], clear: [[12, 0, 29, 7]], spawn: { x: 20, y: 1, dir: 'down' },
    up: (x) => ['farm', { x: Math.max(38, Math.min(40, x + ROUTE_OFF)), y: H - 2, dir: 'up' }], down: (x) => ['route2', { x: Math.max(25, Math.min(28, x)), y: 1, dir: 'down' }],
    enc: { day: [['tusskip', 30], ['whirplet', 25], ['cloverclasp', 25], ['flintuck', 12], ['fuzzwick', 8]], night: [['duskwick', 35], ['fuzzwick', 25], ['tusskip', 20], ['flintuck', 20]] } },
  route2: { name: 'Brookside Lane', w: 46, h: 64, paths: [[25, 0, 28, 11], [10, 8, 28, 11], [10, 8, 13, 30], [10, 27, 37, 30], [34, 27, 46, 30], [34, 27, 37, 46], [21, 43, 37, 46], [21, 43, 26, 52], [17, 52, 30, 60]],
    ponds: [[38, 16, 4.2, 3.4], [19, 37, 3.6, 2.6]], bridge: null,
    zones: [[15, 13, 24, 24, 7, 9], [29, 20, 42, 25, 7, 9], [3, 13, 8, 26, 8, 10], [15, 32, 31, 41, 8, 10, 'low'], [39, 30, 43, 46, 9, 11, 'low'], [3, 32, 8, 50, 9, 11, 'low'], [27, 47, 43, 50, 10, 11, 'low']],
    low: [['mortoad', 9], ['brashlet', 9]],
    pickups: [{ id: 'b1', x: 41, y: 9, item: 'root_charm', n: 3 }, { id: 'b2', x: 5, y: 41, item: 'honey', n: 2 }, { id: 'b3', x: 41, y: 48, gold: 300 }, { id: 'b4', x: 12, y: 45, item: 'mon_treat', n: 1 }],
    signs: { '23,2': "Brookside Lane. The Warden's Garden lies at the end of the lane.", '20,50': "The Warden's Garden. Warden Mabel tends this garden and tests every keeper who comes calling.", '28,50': '__heal' },
    props: [...hedgeRing, ['flowerbed', 18, 55, 3], ['flowerbed', 27, 55, 3], ['planter', 18, 59, 3], ['planter', 27, 59, 3]],
    trainers: [
      { id: 'bl1', kind: 'birdwatcher', name: 'Reg', x: 14, y: 18, dir: 'left', sight: 4, team: [['whirplet', 9], ['whirplet', 9], ['fuzzwick', 10]] },
      { id: 'bl2', kind: 'forager', name: 'Rosie', x: 24, y: 31, dir: 'up', sight: 4, team: [['cloverclasp', 10], ['duskwick', 11]] },
      { id: 'bl3', kind: 'busker', name: 'Jonty', x: 33, y: 38, dir: 'right', sight: 4, team: [['fuzzwick', 11], ['tusskip', 11], ['whirplet', 12]] },
      { id: 'boss1', kind: 'allotment', name: 'Mabel', x: 23, y: 56, dir: 'down', sight: 0, boss: true, team: [['flintuck', 13], ['cloverclasp', 14], ['hedglet', 14], ['mortoad', 15]] },
    ],
    open: [[23, 0, 30, 4], [41, 26, 45, 31]], clear: [[21, 0, 32, 6], [14, 50, 33, 63], [38, 26, 45, 31]], spawn: { x: 26, y: 1, dir: 'down' },
    gate: { area: [43, 26, 45, 30], sign: [42, 26], ok: () => S.crests && S.crests.root, text: "A rockfall blocks the way east. A note is pinned to the sign: 'Mossmere Bog. Closed by order of Warden Mabel until a keeper has earned her Crest.'" },
    up: (x) => ['route1', { x: Math.max(25, Math.min(28, x)), y: 69, dir: 'up' }], down: null,
    right: (y) => ['route3', { x: 1, y: Math.max(20, Math.min(22, y + -6)), dir: 'right' }],
    enc: { day: [['flintuck', 22], ['cloverclasp', 20], ['whirplet', 20], ['brooknook', 20], ['tusskip', 14], ['fuzzwick', 14], ['duskwick', 10]], night: [['duskwick', 40], ['fuzzwick', 30], ['flintuck', 30], ['brooknook', 16]] } },
  route3: { name: 'Mossmere Bog', w: 64, h: 44, murk: true, bog: true,
    paths: [[0, 20, 12, 23], [9, 8, 12, 23], [9, 8, 30, 11], [27, 8, 30, 32], [27, 29, 46, 32], [43, 14, 46, 32], [43, 14, 63, 17]],
    ponds: [[20, 18, 5, 3.6], [36, 20, 3.6, 4.6], [16, 32, 6, 3.6], [54, 26, 5.6, 4.6], [38, 38, 5, 3], [52, 6, 4, 2.6], [5, 34, 3, 3], [60, 38, 3, 2.6], [22, 2.5, 4, 1.6]],
    bridge: null,
    zones: [[14, 4, 25, 7, 14, 16], [2, 10, 8, 19, 14, 16], [31, 3, 42, 13, 15, 17], [13, 24, 26, 27, 15, 17], [47, 8, 60, 12, 16, 18], [22, 34, 34, 42, 16, 18, 'low'], [47, 33, 61, 41, 17, 19, 'low']],
    low: [['logloom', 10], ['tipplecup', 6]],
    pickups: [{ id: 'm1', x: 3, y: 12, item: 'sturdy_charm', n: 2 }, { id: 'm2', x: 40, y: 6, item: 'honey', n: 2 }, { id: 'm3', x: 30, y: 41, gold: 600 }, { id: 'm4', x: 60, y: 34, item: 'mon_treat', n: 2 }, { id: 'm5', x: 24, y: 26, item: 'root_charm', n: 5 }],
    signs: { '3,19': 'Mossmere Bog. Keep to the path, and mind the mist.', '32,28': '__heal', '60,12': 'East: Sluice Fen, and beyond it Brookholt. The old drainage channels are flooded, so mind your step.' },
    trainers: [
      { id: 'mb1', kind: 'forager', name: 'Bryony', x: 13, y: 15, dir: 'left', sight: 4, team: [['puffpiper_cotton', 15], ['sundrowse', 16]] },
      { id: 'mb2', kind: 'ponddipper', name: 'Wes', x: 20, y: 12, dir: 'up', sight: 3, team: [['lotling', 16], ['muddlebub', 16], ['lotling', 17]] },
      { id: 'mb3', kind: 'reedcutter', name: 'Gil', x: 31, y: 20, dir: 'left', sight: 4, team: [['puffpiper_cotton', 17], ['puffpiper', 17], ['tipplecup', 18]] },
      { id: 'mb4', kind: 'wispwatcher', name: 'Moira', x: 37, y: 33, dir: 'up', sight: 3, team: [['glimmerjel', 18], ['logloom', 18]] },
      { id: 'mb5', kind: 'reedcutter', name: 'Fen', x: 47, y: 22, dir: 'left', sight: 4, team: [['muddlebub', 19], ['tipplecup', 19], ['puffpiper', 20]] },
    ],
    open: [[0, 18, 3, 25], [60, 13, 63, 18]], clear: [[0, 17, 6, 26], [55, 12, 63, 19]], spawn: { x: 1, y: 21, dir: 'right' },
    right: (y) => ['route4', { x: 1, y: Math.max(19, Math.min(21, y + 5)), dir: 'right' }],
    left: (y) => ['route2', { x: 44, y: Math.max(27, Math.min(29, y + 6)), dir: 'left' }],
    enc: { day: [['muddlebub', 20], ['lotling', 18], ['puffpiper_cotton', 18], ['sundrowse', 16], ['tipplecup', 12], ['brooknook', 8], ['glimmerjel', 6]], night: [['glimmerjel', 30], ['logloom', 20], ['muddlebub', 18], ['duskwick', 15], ['sundrowse', 15], ['fenfang', 3]] } },
  // Sluice Fen: islands in a flooded fen. Three old levers each flood one channel and drain another.
  // Start: S–I2 and I3–I1 open. Solution: lever B (on I2) drains I2–I3; lever C (on I3) drains I1–E but floods I3–I1;
  // walk back to lever A (on S), which drains S–I1 (and floods S–I2), then cross I1 to the far side. Any lever can be pulled back.
  route4: { name: 'Sluice Fen', w: 56, h: 40, murk: true, bog: true, lake: true,
    land: [[0, 14, 12, 26], [6, 2, 22, 9], [30, 2, 48, 10], [18, 24, 36, 36], [46, 16, 56, 26]],
    paths: [[0, 18, 8, 21], [6, 4, 21, 6], [36, 4, 47, 6], [21, 28, 36, 31], [46, 19, 56, 22]],
    channels: [
      // links: short paths on the land at each end, so a drained channel joins the islands' paths
      { r: [7, 9, 10, 14], dry: L => !L.A, links: [[8, 14, 9, 19], [8, 6, 9, 9]] },                     // S – I2
      { r: [12, 24, 18, 27], dry: L => !!L.A, links: [[6, 21, 8, 26], [6, 25, 12, 26], [18, 25, 22, 26], [20, 25, 22, 29]] },  // S – I1
      { r: [22, 4, 30, 7], dry: L => !!L.B, links: [[30, 5, 36, 6]] },                                  // I2 – I3
      { r: [32, 10, 35, 24], dry: L => !L.C, links: [[33, 6, 34, 10], [33, 24, 34, 28]] },              // I3 – I1
      { r: [36, 22, 46, 25], dry: L => !!L.C, links: [[34, 24, 36, 29]] },                              // I1 – E
    ],
    goal: { area: [46, 16, 55, 25], flag: 'fenDone', msg: 'You made it across Sluice Fen! Brookholt lies just ahead.' },
    ponds: [], bridge: null,
    zones: [[7, 3, 15, 8, 16, 18], [31, 3, 37, 9, 17, 19], [19, 32, 34, 34, 18, 20, 'low'], [5, 23, 10, 24, 16, 17]],
    low: [['logloom', 12], ['glimmerjel', 10], ['fenfang', 5]],
    pickups: [{ id: 'f1', x: 46, y: 8, item: 'mon_treat', n: 2 }, { id: 'f2', x: 34, y: 34, item: 'sturdy_charm', n: 3 }, { id: 'f3', x: 47, y: 17, gold: 1000 }, { id: 'f4', x: 7, y: 3, item: 'honey', n: 3 }],
    signs: { '3,16': "Sluice Fen. The old drainage levers still work. Each one drains one channel and floods another. Think before you pull!", '4,14': '__lever:A', '10,3': '__lever:B', '45,3': '__lever:C', '52,18': 'East: Brookholt, the canal town.' },
    trainers: [
      { id: 'sf1', kind: 'forager', name: 'Nell', x: 18, y: 7, dir: 'left', sight: 4, team: [['sundrowse', 20], ['tipplecup', 21]] },
      { id: 'sf2', kind: 'wispwatcher', name: 'Kit', x: 40, y: 8, dir: 'up', sight: 3, team: [['glimmerjel', 20], ['logloom', 21], ['duskwick', 22]] },
      { id: 'sf3', kind: 'reedcutter', name: 'Ozzy', x: 27, y: 33, dir: 'up', sight: 3, team: [['sundrowse', 21], ['muddlebub', 22]] },
      { id: 'sf4', kind: 'ponddipper', name: 'Tam', x: 49, y: 23, dir: 'up', sight: 3, team: [['lotling', 22], ['brookstride', 23]] },
    ],
    open: [[0, 17, 3, 23], [52, 18, 56, 23]], clear: [[0, 16, 6, 23], [44, 2, 48, 9], [2, 13, 12, 15], [8, 2, 12, 5]], spawn: { x: 1, y: 19, dir: 'right' },
    right: (y) => ['brookholt', { x: 1, y: Math.max(11, Math.min(13, y - 8)), dir: 'right' }],
    left: (y) => ['route3', { x: 62, y: Math.max(14, Math.min(16, y - 5)), dir: 'left' }],
    enc: { day: [['lotling', 20], ['muddlebub', 18], ['tipplecup', 16], ['puffpiper', 16], ['sundrowse', 12], ['brooknook', 10]], night: [['glimmerjel', 30], ['logloom', 25], ['muddlebub', 15], ['duskwick', 15], ['puffpiper', 8]] } },
  brookholt: { name: 'Brookholt', w: 44, h: 30, town: true, bog: true,
    paths: [[0, 11, 44, 14], [0, 24, 25, 26], [12, 14, 15, 25], [29, 24, 44, 26], [30, 14, 32, 25]],
    ponds: [[27, 15, 2.2, 18]], bridge: { x0: 0, x1: 0, y0: 11, y1: 14 },
    zones: [], pickups: [],
    buildings: [
      { id: 'bh_clinic', atlas: 'bh', frame: 'bh_clinic', cx: 6, by: 10, door: -1, name: 'Brookholt Clinic' },
      { id: 'bh_shop', atlas: 'bh', frame: 'bh_shop', cx: 15, by: 10, door: 0, name: 'The Chandlery' },
      { id: 'bh_station', atlas: 'bh', frame: 'bh_halt', cx: 7, by: 23, door: -3, name: 'Brookholt Halt' },
      { id: 'bh_cottage', atlas: 'bh', frame: 'bh_cottage', old: 'bh_cottage_old', cx: 19, by: 23, door: 0, name: 'Lock Cottage', repair: true },
      { id: 'bh_lock', atlas: 'bh', frame: 'bh_lockhouse', cx: 36, by: 10, door: 0, name: "Warden's Lock House" },
      { id: 'bh_mill', atlas: 'bh', frame: 'bh_mill', old: 'bh_mill_old', cx: 37, by: 23, door: 0, name: 'Old Watermill', repair: true },
    ],
    props: [['bh_board', 19, 9, 3, 'bh']],
    signs: { '4,10': 'Brookholt. Mind the canal, and say hello to the lock-keeper.', '20,9': '__board' },
    npcs: [{ kind: 'delphine', x: 38, y: 11, dir: 'down', door: 'bh_lock', hideIf: () => lockHouseOpen() }],   // once the lock house opens she waits inside
    trainers: [],
    open: [[0, 10, 3, 15]], clear: [[0, 9, 44, 27]], spawn: { x: 1, y: 12, dir: 'right' },
    left: (y) => ['route4', { x: 54, y: Math.max(19, Math.min(21, y + 8)), dir: 'left' }],
    enc: { day: [['lotling', 1]], night: [['lotling', 1]] } },
};
const sluice = () => (S.sluice = S.sluice || { A: 0, B: 0, C: 0 });
function useRoute(key) {
  RC = ROUTES[key]; RW = RC.w; RH = RC.h; GRASS_ZONES = RC.zones; PICKUPS = RC.pickups; ROUTE_SIGNS = RC.signs; ROUTE_TRAINERS = RC.trainers;
  if (RC.gate && !RC.gate.ok()) ROUTE_SIGNS = { ...RC.signs, [RC.gate.sign.join(',')]: RC.gate.text };
  if (RC.buildings) { ROUTE_SIGNS = { ...ROUTE_SIGNS }; for (const b of RC.buildings) ROUTE_SIGNS[(b.cx + b.door) + ',' + b.by] = '__door:' + b.id; }
  for (const n of RC.npcs || []) if (!(n.hideIf && n.hideIf())) { if (ROUTE_SIGNS === RC.signs) ROUTE_SIGNS = { ...ROUTE_SIGNS }; ROUTE_SIGNS[n.x + ',' + n.y] = '__door:' + n.door; }
  BRIDGE = RC.bridge ? { ...RC.bridge } : null;
}
const beatTrainer = id => !!(S.trainers && S.trainers[id]);
// Rematches: once beaten, a trainer can be fought again after each new Crest. Their team is raised to the
// level of trainers in the next area (keeping its spread) and evolves where it can.
const REMATCH_TOP = [0, 22, 30, 38, 46, 54, 62, 70, 80];
const rematchReady = t => !t.boss && beatTrainer(t.id) && crestCount() > ((S.trainerCrest || {})[t.id] || 0);
function rematchTeam(t) {
  if (!beatTrainer(t.id)) return t.team;
  const top = Math.max(...t.team.map(([, l]) => l)), want = REMATCH_TOP[Math.min(8, crestCount())];
  if (want <= top) return t.team;
  return t.team.map(([sp, lv]) => { const nl = want - (top - lv); let s = sp, e; while ((e = SPECIES[s].evo) && MON_ORDER.includes(e[0]) && nl >= e[1]) s = e[0]; return [s, nl]; });
}
class Route extends World {
  constructor(key = 'route1') { super(key); }
  create() {
    useRoute(this.scene.key);
    this.initWorld(RW, RH);
    const R = this.R = buildRoute();
    const data = []; for (let y = 0; y < RH; y++) data.push(Array.from(R.tiles.slice(y * RW, y * RW + RW)));
    {
      if (RC.bog) bogTerrain(this);
      this.map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
      this.ground = this.map.createLayer(0, this.map.addTilesetImage('terrain', RC.bog ? 'terrain_bog' : 'terrain_x', T, T, 1, 2), 0, 0);
      this.waterFrame = 0;
      this.time.addEvent({ delay: 650, loop: true, callback: () => { this.waterFrame ^= 1; for (const i of R.water) if (!R.blocked[i] || true) this.ground.putTileAt(R.tiles[i] + (this.waterFrame ? 16 : 0), i % RW, (i / RW) | 0); } });
    }
    if (BRIDGE) this.makeBridge();
    for (const [f, x, y, w, at] of RC.props || []) {
      if (at) { this.add.image(x * T + w * 8, y * T + 16, at, f).setOrigin(.5, 1).setDepth(y * T + 15); continue; }
      if (f === 'hedge1') { this.add.image(x * T + 8, y * T + 16, 'town', 'hedge').setOrigin(.5, 1).setCrop(8, 0, 16, 28).setDepth(y * T + 15); continue; }
      this.add.image(x * T + w * 8, y * T + 16, 'town', f).setOrigin(.5, 1).setDepth(y * T + 15);
    }
    this.tall = [];
    const BOGSWAP = { tree_pine: ['bog', 'dead_tree'], tree_oak: ['bog', 'dead_tree'], tree_apple: ['bog', 'dead_tree'], bush_round: ['bog', 'cattail'], rock_large: ['bog', 'stump'], wildflowers: ['bog', 'tuft'] };
    const art = (f, x, y) => RC.bog && BOGSWAP[f] && !(f === 'tree_pine' && hash(x, y * 3) < .45) ? BOGSWAP[f] : ['objects', f];
    for (const b of R.border) { const [a, f] = art(b.kind, b.x, b.y); const im = this.add.image(b.x * T + 8, b.y * T + 15, a, f).setOrigin(.5, 1).setDepth(b.y * T + 15).setTint(RC.bog ? 0xa8b8a0 : 0xb8c8b0); this.tall.push(im); }
    this.gateSpr = [];
    for (const d of R.deco) { const [a, f] = d.gate ? ['objects', d.f] : art(d.f, d.x, d.y); const im = this.add.image(d.x * T + 8, d.y * T + 15, a, f).setOrigin(.5, 1).setDepth(d.flat ? 2 : d.y * T + 15); if (d.tall) this.tall.push(im); if (d.gate) this.gateSpr.push(im); }
    if (RC.bog) bogDressing(this, R);
    // a murky green haze over the bog until its own art arrives
    if (RC.murk && !RC.bog) { this.add.rectangle(0, 0, RW * T, RH * T, 0x2e4a2a, .22).setOrigin(0).setDepth(9e6 - 30); for (let i = 0; i < 14; i++) { const m = this.add.ellipse(hash(i, 3) * RW * T, hash(i, 9) * RH * T, 120, 40, 0xe8f0e0, .10).setDepth(9e6 - 29); this.tweens.add({ targets: m, x: m.x + 60, alpha: .04, duration: 6000 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); } }
    this.grassSpr = {};
    for (let i = 0; i < RW * RH; i++) if (R.grass[i] >= 0) { const x = i % RW, y = (i / RW) | 0; this.grassSpr[i] = RC.bog ? this.add.image(x * T + 8, y * T + 16, 'bog', 'bog_grass').setOrigin(.5, 1).setDepth(y * T + 15.6) : this.add.image(x * T + 8, y * T + 16, 'objects', 'tall_grass').setOrigin(.5, 1).setDepth(y * T + 15.6); if (hash(x * 3, y) < .35) this.tweens.add({ targets: this.grassSpr[i], angle: { from: -2.5, to: 2.5 }, duration: 1800 + hash(x, y) * 900, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: hash(y, x) * 1500 }); }
    for (const n of (RC.npcs || []).filter(n => !(n.hideIf && n.hideIf()))) { const sp2 = this.add.sprite(n.x * T + 8, n.y * T + 15, 'tr_' + n.kind, DIRS.indexOf(n.dir) * 4).setOrigin(.5, 1).setDepth(n.y * T + 15); this.shadow(sp2, 12, 5); }
    for (const b of RC.buildings || []) { const fr = b.repair && !bhDone(b.id) ? b.old : b.frame; const im = this.add.image(b.cx * T + 8, b.by * T + 16, b.atlas || 'town', fr).setOrigin(.5, 1).setDepth(b.by * T + 15); this.tall.push(im); }
    for (const [k, v] of Object.entries(ROUTE_SIGNS)) {
      const [x, y] = k.split(',').map(Number);
      if (v.startsWith('__door:') || v === '__board') continue;
      if (v.startsWith('__lever:')) {
        const on = !!sluice()[v.slice(8)];
        if (this.textures.exists('bog')) { this.add.image(x * T + 8, y * T + 16, 'bog', on ? 'lever_down' : 'lever_up').setOrigin(.5, 1).setDepth(y * T + 15); continue; }
        const key = 'lever' + (on ? 1 : 0);
        if (!this.textures.exists(key)) this.textures.addCanvas(key, pixCanvas(14, 20, R => { R(2, 14, 10, 5, '#6a6e78'); R(2, 14, 10, 1, '#8a8e98'); R(6, 12, 2, 3, '#4a4e58'); if (on) { R(7, 4, 2, 9, '#8f5f34'); R(8, 3, 4, 3, '#c0304a'); } else { R(5, 4, 2, 9, '#8f5f34'); R(2, 3, 4, 3, '#c0304a'); } R(3, 16, 3, 2, on ? '#6bd04a' : '#5a5e68'); }));
        this.add.image(x * T + 8, y * T + 16, key).setOrigin(.5, 1).setDepth(y * T + 15); continue;
      }
      if (v === '__heal') { if (!this.textures.exists('cv_well')) this.textures.addCanvas('cv_well', SAP_CANVAS.well); this.add.image(x * T + 8, y * T + 16, 'cv_well').setOrigin(.5, 1).setDepth(y * T + 15); }
      else if (RC.bog) this.add.image(x * T + 8, y * T + 16, 'bog', 'signpost').setOrigin(.5, 1).setDepth(y * T + 15);
      else this.add.image(x * T + 8, y * T + 15, 'objects', 'signpost').setOrigin(.5, 1).setDepth(y * T + 15);
    }
    this.pickSpr = {};
    for (const p of PICKUPS) if (!S.picked[p.id]) {
      const s = this.add.star(p.x * T + 8, p.y * T + 9, 4, 1.5, 5, 0xfff3a0).setDepth(p.y * T + 15);
      this.tweens.add({ targets: s, scale: 1.5, alpha: .5, angle: 45, yoyo: true, repeat: -1, duration: 600 });
      this.pickSpr[p.id] = s;
    }
    this.trainers = [];
    for (const t of ROUTE_TRAINERS) {
      const key = 'tr_' + t.kind;
      for (let r = 0; r < 4; r++) { const k = `${key}_${DIRS[r]}`; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers(key, { frames: [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: 7, repeat: -1 }); }
      const spr = this.add.sprite(t.x * T + 8, t.y * T + 15, key, DIRS.indexOf(t.dir) * 4).setOrigin(.5, 1).setDepth(t.y * T + 15);
      this.shadow(spr, 12, 5);
      this.trainers.push({ ...t, spr, cx: t.x, cy: t.y, px: t.x * T + 8, py: t.y * T + 8 });
    }
    const sp = S.spawn && S.spawn.scene === this.scene.key ? S.spawn : RC.spawn;
    this.makePlayer(sp);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, RW * T, RH * T); cam.startFollow(this.player, true, 1, 1); cam.setRoundPixels(true);
    this.applyZoom(); this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
    this.setupInput(); this.fadeAcc = 0; this.stepsSafe = 3;
    updateHUD(); renderHotbar(); FX.set(S.weather, false); this.fadeIn();
    Sound.theme('route');
    S.visited = S.visited || {}; if (this.scene.key === 'route1') S.visited.route1 = S.visited.route1 || S.routeVisited;
    if (!S.visited[this.scene.key]) { S.visited[this.scene.key] = 1; setTimeout(() => toast(RC.town ? `Welcome to ${RC.name}!` : `${RC.name}. Wild Fablemon hide in the long grass!`, 3000), 600); }
    if (RC.town) Sound.theme('field');
  }
  onResize() { this.applyZoom(); renderHotbar(); }
  // a plank footbridge drawn to fit the brook: deck, rails, posts, and a shadow on the water
  makeBridge() {
    const tiles = BRIDGE.x1 - BRIDGE.x0 + 1, w = tiles * T, h = (BRIDGE.y1 - BRIDGE.y0 + 1) * T;
    const key = 'bridge_' + tiles;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, pixCanvas(w, h + 6, (R, g) => {
      R(2, 6, w - 4, h - 6, 'rgba(10,30,50,.35)');                       // shadow on the water
      R(0, 5, w, h - 9, '#8f5f34');                                        // deck base
      for (let x = 0; x < w; x += 5) { R(x, 6, 4, h - 11, (x / 5) % 3 === 0 ? '#c99462' : (x / 5) % 3 === 1 ? '#b07a45' : '#a8703c'); R(x + 4, 6, 1, h - 11, '#6b4426'); if (hash(x, 7) < .4) R(x + 1, 10 + Math.floor(hash(x, 3) * (h - 22)), 2, 1, '#8f5f34'); }
      R(0, 5, w, 1, '#6b4426'); R(0, h - 5, w, 1, '#6b4426');
      for (const ry of [1, h - 7]) { R(0, ry, w, 4, '#a8703c'); R(0, ry, w, 1, '#d39a5e'); R(0, ry + 3, w, 1, '#6b4426'); }   // rails
      for (let x = 0; x < w; x += 16) for (const py of [0, h - 8]) { const px = Math.min(x, w - 5); R(px, py, 5, 9, '#6b4426'); R(px + 1, py + 1, 3, 2, '#8f5f34'); }
      for (const px of [0, w - 5]) { R(px, 0, 5, h + 2, '#5e3b20'); R(px + 1, 1, 3, 2, '#8f5f34'); }   // end posts sunk into the bank
    }));
    this.add.image(BRIDGE.x0 * T, BRIDGE.y0 * T - 3, key).setOrigin(0, 0).setDepth(1);
  }
  passable(x, y) { return x >= 0 && y >= 0 && x < RW && y < RH && !this.R.blocked[y * RW + x] && !this.trainers.some(t => t.cx === x && t.cy === y); }
  fastAt(x, y) { return !!this.R.dirtish[y * RW + x]; }
  trainerAt(x, y) { return this.trainers.find(t => t.cx === x && t.cy === y); }
  /* does an undefeated trainer see the player in a straight line? */
  spotted() {
    if (!team().some(m => m.hp > 0)) return null;
    const p = this.p;
    for (const t of this.trainers) {
      if (beatTrainer(t.id)) continue;
      const [dx, dy] = DV[t.dir];
      for (let k = 1; k <= t.sight; k++) {
        const x = t.cx + dx * k, y = t.cy + dy * k;
        if (x === p.x && y === p.y) return { t, k };
        if (this.R.blocked[y * RW + x]) break;
      }
    }
    return null;
  }
  async challenge(t, steps) {
    const p = this.p; this.paused = true; p.path = []; p.pending = null;
    if (this.player.anims.isPlaying) { this.player.stop(); this.player.setFrame(this.standF(p.dir)); }
    const mark = this.add.text(t.px, t.py - 20, '!', { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '15px', color: '#ffe35a', stroke: '#2a1e1a', strokeThickness: 3, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6);
    Sound.play('encounter');
    await new Promise(r => this.time.delayedCall(650, r)); mark.destroy();
    const [dx, dy] = DV[t.dir];
    t.spr.play(`tr_${t.kind}_${t.dir}`);
    for (let k = 1; k < steps; k++) {
      const tx = (t.cx + dx) * T + 8, ty = (t.cy + dy) * T + 8;
      await new Promise(r => this.tweens.add({ targets: t, px: tx, py: ty, duration: 230, onUpdate: () => t.spr.setPosition(Math.round(t.px), Math.round(t.py) + 7).setDepth(t.py + 7), onComplete: r }));
      t.cx += dx; t.cy += dy;
    }
    t.spr.stop(); t.spr.setFrame(DIRS.indexOf(t.dir) * 4);
    this.face(t.cx, t.cy);
    this.startTrainerBattle(t);
  }
  startBoss(t) {
    const pic = trainerPic(t.kind), who = `Warden ${t.name}`, W0 = (txt, f = 0) => ({ who: 'trainer', name: who, img: trainerPic(t.kind, f), t: txt });
    Talk.say([
      W0("Well now. You've come a long way down that lane to reach my garden."),
      W0("I'm Mabel, Warden of these parts. Forty years I've looked after this valley and its Fablemon."),
      W0("A Warden's job is to see whether a keeper and their Fablemon truly trust each other. Weeds don't grow in a garden that's loved."),
      W0("So let's see what's growing between you and yours. Don't hold back, dear. I certainly won't!"),
    ], () => {
      const teamMons = t.team.map(([sp, lv]) => trainerMon(sp, lv));
      Battle.start(teamMons[0], { label: 'Warden', name: t.name, team: teamMons, prize: 1500, boss: true, lose: 'Ha! Well grown, dear. Very well grown indeed.', onWin: () => {
        S.trainers[t.id] = 1; S.crests = S.crests || {}; S.crests.root = 1; giveSigil('leaf');
        setTimeout(() => {
          Sound.play('gotcha');
          Talk.say([
            W0("That's the finest battling I've seen since I was a girl.", 1),
            W0("Here. The Root Crest. Every Warden in the valley will know you've earned my trust.", 1),
            W0("The roads beyond lead to Brookholt and the other Wardens. They're not as soft as me!", 1),
          ], () => toast('You received the Root Crest! 🌿 Mabel has had the rockfall cleared: Mossmere Bog lies east of Brookside Lane.', 4500));
        }, 400);
      } });
    });
  }
  startTrainerBattle(t) {
    if (t.boss) return this.startBoss(t);
    const TT = TRAINER_TYPES[t.kind], pic = trainerPic(t.kind), who = `${TT.label} ${t.name}`;
    this.paused = true;
    Talk.say([{ who: 'trainer', name: who, img: pic, t: pick(TT.challenge) }], () => {
      const tm = rematchTeam(t), teamMons = tm.map(([sp, lv]) => trainerMon(sp, lv)), again = beatTrainer(t.id);
      // prize money: 25g per level of their strongest Fablemon the first time, 12g per level in rematches
      Battle.start(teamMons[0], { label: TT.label, name: t.name, team: teamMons, prize: Math.max(...tm.map(([, l]) => l)) * (again ? 12 : 25), lose: pick(TT.lose), onWin: () => { S.trainers = S.trainers || {}; S.trainers[t.id] = 1; S.trainerCrest = S.trainerCrest || {}; S.trainerCrest[t.id] = crestCount(); } });
    });
  }
  talkTrainer(t) {
    const TT = TRAINER_TYPES[t.kind], p = this.p;
    t.dir = p.x > t.cx ? 'right' : p.x < t.cx ? 'left' : p.y > t.cy ? 'down' : 'up'; t.spr.setFrame(DIRS.indexOf(t.dir) * 4);
    if (!beatTrainer(t.id)) { if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400); return this.startTrainerBattle(t); }
    if (t.boss) return Talk.say([{ who: 'trainer', name: `Warden ${t.name}`, img: trainerPic(t.kind, 1), t: pick(["Keep that Root Crest polished, dear.", "Your Fablemon look happy. That's the real prize.", "Mind how you go. The other Wardens won't go easy on you."]) }]);
    if (rematchReady(t)) {
      const top = Math.max(...rematchTeam(t).map(([, l]) => l));
      return Talk.say([{ who: 'trainer', name: `${TT.label} ${t.name}`, img: trainerPic(t.kind, 0), t: `Oi, it's you! I've been training since we last met. My team's around level ${top} now. Rematch?` }], () =>
        openModal('Rematch?', `<p>Battle ${TT.label} ${t.name} again? Their Fablemon are now up to <b>level ${top}</b>.</p><div class="row" style="display:flex;gap:6px"><button class="btn gold" data-a="yes">Battle!</button><button class="btn" data-a="no">Not now</button></div>`, a => {
          closeModal(); if (a !== 'yes') return;
          if (!team().some(m => m.hp > 0)) return toast('Your Fablemon are too tired to battle. Rest them first.', 2400);
          this.startTrainerBattle(t);
        }));
    }
    Talk.say([{ who: 'trainer', name: `${TT.label} ${t.name}`, img: trainerPic(t.kind, 1), t: pick(TT.after) }]);
  }
  frameHook(dt) {
    this.fadeAcc += dt; if (this.fadeAcc < .08) return; this.fadeAcc = 0;
    // a gate (like the rockfall on Brookside Lane) opens the moment it's earned, even without leaving the area
    if (this.gateSpr && this.gateSpr.length && RC.gate && RC.gate.ok() && !this.paused) {
      const [a, b, c, d] = RC.gate.area; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) this.R.blocked[y * RW + x] = 0;
      this.gateSpr.forEach(im => this.tweens.add({ targets: im, alpha: 0, y: im.y + 4, duration: 500, onComplete: () => im.destroy() })); this.gateSpr = [];
      ROUTE_SIGNS = { ...RC.signs }; if (RC.buildings) for (const bd of RC.buildings) ROUTE_SIGNS[(bd.cx + bd.door) + ',' + bd.by] = '__door:' + bd.id;
      Sound.play('pick'); toast('The rockfall has been cleared. The way east to Mossmere Bog is open!', 3200);
    }
    const px = this.player.x, py = this.player.y;
    for (const s of this.tall) { if (Math.abs(s.x - px) > 40) { if (s.alpha !== 1) s.setAlpha(1); continue; } const behind = s.y > py + 2 && Math.abs(s.x - px) < s.displayWidth / 2 && py > s.y - s.displayHeight + 4; s.setAlpha(behind ? .35 : 1); }
  }
  arriveHook(x, y) {
    const seen = this.spotted(); if (seen) return this.challenge(seen.t, seen.k);
    if (y === 0 && RC.up) { const [to, sp] = RC.up(x); return travel(this, to, sp); }
    if (y >= RH - 2 && RC.down) { const [to, sp] = RC.down(x); return travel(this, to, sp); }
    if (x === 0 && RC.left) { const [to, sp] = RC.left(y); return travel(this, to, sp); }
    if (x >= RW - 1 && RC.right) { const [to, sp] = RC.right(y); return travel(this, to, sp); }
    if (RC.goal && !(S.visited && S.visited[RC.goal.flag])) { const [a0, b0, c0, d0] = RC.goal.area; if (x >= a0 && x <= c0 && y >= b0 && y <= d0) { S.visited[RC.goal.flag] = 1; Sound.play('levelup'); toast(RC.goal.msg, 3500); } }
    const p = PICKUPS.find(q => q.x === x && q.y === y && !S.picked[q.id]);
    if (p) {
      S.picked[p.id] = 1; this.pickSpr[p.id].destroy(); Sound.play('coin');
      if (p.gold) { S.gold += p.gold; updateHUD(); toast(`Found ${p.gold}g!`, 1800); }
      else { inv.add(p.item, p.n); renderHotbar(); toast(`Found ${p.n} ${ITEMS[p.item].name}${p.n > 1 ? 's' : ''}!`, 1800); }
    }
    const i = y * RW + x, z = this.R.grass[i];
    if (z >= 0) {
      const g = this.grassSpr[i]; if (g) { this.tweens.add({ targets: g, scaleY: .8, yoyo: true, duration: 90 }); this.tweens.add({ targets: g, scaleX: { from: 1.15, to: 1 }, duration: 260, ease: 'Back.out' }); for (let k = 0; k < 3; k++) { const leaf = this.add.rectangle(x * T + 4 + Math.random() * 8, y * T + 8, 2, 1, RC.bog ? 0x8a9a4a : 0x6bb24a).setDepth(y * T + 16); this.tweens.add({ targets: leaf, x: leaf.x + (Math.random() - .5) * 14, y: leaf.y - 4 - Math.random() * 6, alpha: 0, duration: 420 + Math.random() * 200, ease: 'Quad.out', onComplete: () => leaf.destroy() }); } }
      Sound.play('grass');
      if (--this.stepsSafe <= 0 && Math.random() < 1 / 9 && team().some(m => m.hp > 0)) {
        this.stepsSafe = 3; this.p.path = []; this.p.pending = null;
        const [, , , , a, b, tag] = GRASS_ZONES[z]; Battle.start(rollWild(a, b, tag && RC[tag]));
      }
    }
  }
  sign(x, y) {
    const t = ROUTE_SIGNS[x + ',' + y]; if (!t) return false;
    this.face(x, y);
    if (t.startsWith('__door:')) { bhDoor(this, t.slice(7)); return true; }
    if (t === '__board') { bhBoard(); return true; }
    if (t.startsWith('__lever:')) {
      const id = t.slice(8), L = sluice(); L[id] = L[id] ? 0 : 1;
      const ch = RC.channels.map(c => c.dry(L)), was = RC.channels.map(c => { const o = { ...L, [id]: L[id] ? 0 : 1 }; return c.dry(o); });
      const drained = ch.filter((d, i) => d && !was[i]).length, flooded = ch.filter((d, i) => !d && was[i]).length;
      Sound.play('door'); setTimeout(() => Sound.play('fill'), 250);
      toast(`You heave the lever ${L[id] ? 'down' : 'up'}. Water rushes through the sluices: ${drained} channel${drained === 1 ? '' : 's'} drain${drained === 1 ? 's' : ''} and ${flooded} flood${flooded === 1 ? 's' : ''}.`, 3200);
      const p = this.p; this.time.delayedCall(700, () => travel(this, this.scene.key, { x: p.x, y: p.y, dir: p.dir }));
      return true;
    }
    if (t === '__heal') {
      if (!S.mons.length) return true;
      S.mons.forEach(restMon); Sound.play('fill'); refreshTeamBtn();
      openModal('Spring well', '<p>You draw cool water from the old spring well. Your Fablemon drink deeply and are fully healed!</p>'); return true;
    }
    openModal('Sign', `<p>${t}</p>`); return true;
  }
  actFacing() { const p = this.p; if (p.moving || this.paused || p.busy > 0) return; const [dx, dy] = DV[p.dir], tr = this.trainerAt(p.x + dx, p.y + dy); if (tr) { p.busy = .4; return this.talkTrainer(tr); } if (this.cutProp(p.x + dx, p.y + dy)) return; if (!this.sign(p.x + dx, p.y + dy) && eatHeld()) p.busy = .4; }
  act(t) { if (t && t.sign) this.sign(t.x, t.y); if (t && t.tr) { this.face(t.tr.cx, t.tr.cy); this.talkTrainer(t.tr); } }
  onTap(wx, wy) {
    if (this.paused || this.sleeping || controlMode() !== 'tap') return;
    if (this.tapProp(wx, wy)) return;
    const x = Math.floor(wx / T), y = Math.floor(wy / T), p = this.p;
    const tr = this.trainers.find(t => t.spr.getBounds().contains(wx, wy));
    if (tr) { if (Math.abs(p.x - tr.cx) + Math.abs(p.y - tr.cy) === 1) { this.face(tr.cx, tr.cy); return this.talkTrainer(tr); } const path = this.path((a, b) => Math.abs(a - tr.cx) + Math.abs(b - tr.cy) === 1); if (path) { p.path = path; p.pending = { tr }; } return; }
    if (ROUTE_SIGNS[x + ',' + y] || ROUTE_SIGNS[x + ',' + (y + 1)]) {
      const sy = ROUTE_SIGNS[x + ',' + y] ? y : y + 1;
      if (Math.abs(p.x - x) + Math.abs(p.y - sy) === 1) return this.sign(x, sy);
      const path = this.path((a, b) => Math.abs(a - x) + Math.abs(b - sy) === 1); if (path) { p.path = path; p.pending = { sign: true, x, y: sy }; } return;
    }
    if (this.passable(x, y)) { const path = this.path((a, b) => a === x && b === y); if (path) { p.path = path; p.pending = null; } }
  }
  tapGoal() { }
}

/* --------------------------------------------------------------- night
   All overnight rules in one place, in a fixed order. */
function nightly(passedOut) {
  const before = seasonIdx(S.day);
  S.day++; S.time = 360; S.energy = passedOut ? Math.round(S.maxEnergy * .75) : S.maxEnergy;
  S.weather = S.tomorrow; S.tomorrow = rollWeather(S.day + 1);
  const si = seasonIdx(S.day), newSeason = si !== before;
  let withered = 0;
  for (const [tk, t] of Object.entries(S.tilled)) {
    if (t.crop && !t.crop.dead && t.w && !cropRipe(t.crop)) { t.crop.g++; if (t.fert && !cropRipe(t.crop)) { t.crop.g++; t.fert = 0; } }
    if (t.crop && !t.crop.dead && newSeason && !CROPS[t.crop.type].seasons.includes(si) && !inGreenhouse(...tk.split(',').map(Number))) { t.crop.dead = true; withered++; }
    t.w = isWet(S.weather) || t.bog ? 1 : 0;
  }
  let grown = 0;
  for (const [k, o] of Object.entries(S.objs || {})) if (SAPLING_TREE[o.t] && S.day - (o.day || S.day) >= 7) {
    const [x, y] = k.split(',').map(Number), kind = SAPLING_TREE[o.t];
    delete S.objs[k]; const d = { id: S.nextId++, kind, x, y, hp: DEBRIS[kind].hp }; S.extra.push(d); if (farm) farm.occ[y * W + x] = d.id; grown++;
  }
  let honey = 0, fed = 0;
  const flowery = (x, y) => Object.entries(S.objs).some(([k2, o2]) => { const [a, b] = k2.split(',').map(Number); return ['wildflowers', 'flowerbed', 'planter', 'gfountain', 'topiary'].includes(o2.t) && Math.abs(a - x) <= 3 && Math.abs(b - y) <= 3; });
  const objList = Object.entries(S.objs || {}).sort(([, a], [, b]) => (b.t === 'trough' && b.lv ? 1 : 0) - (a.t === 'trough' && a.lv ? 1 : 0));
  for (const [k, o] of objList) {
    if (o.t === 'beehive' && !o.honey && S.day - (o.last || o.day || S.day) >= beeDays(o) - (o.boost ? 1 : 0)) { const [x, y] = k.split(',').map(Number); o.honey = beeMake(o, flowery(x, y)); o.boost = 0; honey++; }
    if (o.t === 'trough' && (o.food > 0 || o.prem > 0) && S.ranch === 2) for (const m of S.mons.filter(m => m.loc === 'ranch' && m.out)) { if (o.food <= 0 && !(o.prem > 0)) break; if (m.fedDay === S.day) continue; if (o.prem > 0) { o.prem--; m.fedPremium = S.day; } else o.food--; m.fedDay = S.day; if (o.lv) m.fedDeluxe = S.day; m.bond = Math.min(20, (m.bond || 0) + 1); fed++; }
  }
  for (const [k, o] of Object.entries(S.objs || {})) if (o.t === 'sprinkler') { const [x, y] = k.split(',').map(Number), r = 1 + (o.lv || 0); for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const t = S.tilled[(x + dx) + ',' + (y + dy)]; if (t) t.w = 1; } }
  const trained = ringNight();
  fishNight(); S.shippedKinds = S.shippedKinds || {}; for (const e of S.shipped) S.shippedKinds[e.id] = 1;
  const earned = S.shipped.reduce((a, e) => a + ITEMS[e.id].sell * e.n, 0); S.gold += earned; S.shipped = [];
  // the wild creeps back a little each night
  if (farm) {
    let n = 0, tries = 0;
    while (n < 8 && tries++ < 400) {
      const x = 4 + Math.floor(Math.random() * (W - 8)), y = 4 + Math.floor(Math.random() * (H - 8)), i = y * W + x, k = x + ',' + y;
      if (farm.blocked[i] || farm.occ[i] >= 0 || S.fences[k] || S.objs[k] || farm.dirtish[i] || farm.waterish[i] || S.tilled[k] || S.paths[k] || Math.hypot(x - DOOR.x, y - DOOR.y - 1) < 6) continue;
      const kind = Math.random() < .75 ? 'weeds' : 'pebble';
      const d = { id: S.nextId++, kind, x, y, hp: DEBRIS[kind].hp };
      S.extra.push(d); farm.occ[i] = d.id; n++;
    }
  }
  const tw = S.town, built = Object.keys(tw.pending), stageBefore = hearthStage();
  for (const id of built) { tw.done[id] = 1; delete tw.pending[id]; }
  const bh = S.bh || { done: {}, pending: {} }; for (const id of Object.keys(bh.pending)) { bh.done[id] = 1; delete bh.pending[id]; }
  const ranchBuilt = S.ranch === 1; if (ranchBuilt) S.ranch = 2;
  const houseBuilt = S.houseNext; if (houseBuilt) { S.house = houseBuilt; S.houseNext = 0; }
  for (const m of S.mons) restMon(m);
  tw.talked = {};
  const sd = seasonDay();
  const bits0 = trained;
  const bits = [passedOut ? 'You passed out and woke up at home' : `${WX[S.weather].icon} ${sd.wd}. ${sd.dom} ${sd.season}`, 'Game saved'];
  if (newSeason) bits.push(`${sd.season} has arrived!`);
  if (earned) bits.push(`Earned ${earned}g`);
  const movers = VILL_IDS.filter(v => built.includes(VILL[v].home)).map(v => VILL[v].name); if (movers.length) bits.push(`${movers.join(' and ')} moved into Smallroot!`);
  if (withered) bits.push(`${withered} out-of-season crop${withered > 1 ? 's' : ''} withered`);
  if (isWet(S.weather)) bits.push('Rain is watering your crops');
  if (honey) bits.push(`Your bees made honey`);
  if (bits0) bits.push(bits0);
  const jobsDone = Object.values(S.workLog || {}).reduce((a, n) => a + n, 0); S.workLog = {};
  if (jobsDone) bits.push(`Your Fablemon did ${jobsDone} job${jobsDone > 1 ? 's' : ''} on the farm yesterday`);
  if (fed) bits.push(`${fed} Fablemon ate from the trough`);
  if (grown) bits.push(`${grown} sapling${grown > 1 ? 's have' : ' has'} grown into a tree`);
  for (const id of built) bits.push(`${PROJECTS[id].name} has been restored!`);
  if (ranchBuilt) bits.push('Your ranch has been built!');
  if (houseBuilt) bits.push(`Welcome to your new ${HOUSE_NAMES[houseBuilt]}!`);
  if (hearthStage() > stageBefore) bits.push('The Hearthroot is stirring…');
  socialNight(bits);
  if (!Cloud.ok() && S.day - (S.lastBackup || 0) >= 7 && S.day % 7 === 1) bits.push('💾 Tip: back up your farm from the Menu, so your save is safe');
  S.morning = bits.join(' · ');
  S.spawn = { scene: 'house', x: 2, y: 3, dir: 'down' };
  return { newSeason, earned };
}
function goToBed(passedOut) {
  if (!scene || scene.sleeping && !passedOut) return;
  scene.sleeping = true; $('fade').style.opacity = 1; Sound.play('snore');
  setTimeout(() => {
    const r = nightly(passedOut);
    save();
    if (r.earned) Sound.play('coin');
    if (r.newSeason) { bootGame(); return; }
    scene.scene.start('house');
  }, 900);
}


/* ------------------------------------------------------------- opening
   Nine stills with typed captions. Tap to continue, Skip to jump ahead. */
const INTRO = [
  { lines: [{ t: 'Another Monday. Another 6:12 train.' }, { t: 'Machines did all the real work now. We just kept them running.' }] },
  { lines: [{ t: 'Twelve hours later, the same city lights. The same tiny flat. The same question: is this it?' }, { t: "I couldn't remember the last time I'd seen a real Fablemon." }] },
  { lines: [{ t: '"Wild Roots Farm, Smallroot. Needs work. Make an offer."' }, { t: 'It was the cheapest place for a hundred miles. There was probably a reason.' }] },
  { lines: [{ t: "Every penny I'd ever saved. One signature." }] },
  { lines: [{ t: "I took the first train out of the city and didn't look back." }] },
  { lines: [{ t: 'Smallroot. Or what was left of it.' }, { who: 'Elder Bramble', t: "You must be {name}! Welcome, welcome. Don't mind the mess." }] },
  { lines: [{ who: 'Elder Bramble', t: 'This town used to be full of life. People and Fablemon, side by side.' }, { who: 'Elder Bramble', t: 'When the great Hearthroot began to wither, the Fablemon went back to the wilds. Then, one by one, so did everyone else.' }] },
  { lines: [{ t: 'And this was mine. All of it.' }] },
  { lines: [{ t: "That night, I wasn't the only one who'd come home." }] },
];
function playIntro(name, done) {
  const el = $('intro'), img = $('iimg'), bg = el.querySelector('.ibg'), who = el.querySelector('.who'), txt = el.querySelector('.txt'), hint = el.querySelector('.hint');
  let si = 0, li = 0, typing = null, full = '', finished = false;
  $('title').style.display = 'none'; $('hud').style.display = 'none';
  el.style.display = 'flex'; requestAnimationFrame(() => el.classList.add('on'));
  const finish = () => {
    if (finished) return; finished = true;
    clearInterval(typing); el.classList.remove('on');
    setTimeout(() => { el.style.display = 'none'; done(); }, 450);
  };
  const type = () => {
    const ln = INTRO[si].lines[li];
    full = ln.t.replace('{name}', name || 'Farmer');
    who.textContent = ln.who || ''; who.style.display = ln.who ? 'block' : 'none';
    txt.textContent = ''; hint.style.visibility = 'hidden';
    let i = 0; clearInterval(typing);
    typing = setInterval(() => {
      i++; txt.textContent = full.slice(0, i);
      if (i % 3 === 0 && full[i - 1] !== ' ') Sound.play('click');
      if (i >= full.length) { clearInterval(typing); typing = null; hint.style.visibility = 'visible'; }
    }, 26);
  };
  const show = () => {
    img.classList.remove('kb'); img.style.opacity = 0;
    setTimeout(() => {
      img.src = ASSET.intro[si]; bg.style.backgroundImage = `url(${ASSET.intro[si]})`;
      img.style.transformOrigin = ['30% 40%', '70% 50%', '50% 40%', '40% 60%', '60% 40%', '45% 50%', '55% 45%', '50% 60%', '50% 50%'][si];
      void img.offsetWidth; img.classList.add('kb'); img.style.opacity = 1;
      li = 0; type();
    }, si ? 380 : 0);
  };
  const next = () => {
    if (finished) return;
    if (typing) { clearInterval(typing); typing = null; txt.textContent = full; hint.style.visibility = 'visible'; return; }
    li++;
    if (li < INTRO[si].lines.length) return type();
    si++;
    if (si >= INTRO.length) return finish();
    show();
  };
  el.onpointerup = e => { if (e.target.closest('#iskip')) return; next(); };
  $('iskip').onclick = e => { e.stopPropagation(); finish(); };
  const key = e => { if (!el.classList.contains('on')) { removeEventListener('keydown', key); return; } if (e.key === 'Escape') finish(); else if (e.key === ' ' || e.key === 'Enter') next(); };
  addEventListener('keydown', key);
  show();
}

/* ---------------------------------------------------------- startup */
async function bootGame() {
  $('loading').style.display = 'flex';
  if (game) { game.destroy(true); game = null; scene = null; await new Promise(r => setTimeout(r, 60)); }
  const art = await seasonalAssets(seasonIdx(S.day));
  const snow = seasonIdx(S.day) === 3 ? await winterAtlases() : {};
  $('loading').style.display = 'none';
  $('title').style.display = 'none'; $('hud').style.display = 'block';
  class Boot extends Phaser.Scene {
    constructor() { super('boot'); }
    preload() {
      this.load.image('terrain', art.terrain);
      this.load.image('gym_bh', ASSET.gymBh);
      this.load.atlas('objects', art.objects, ASSET.objectsJson);
      this.load.spritesheet('walk', ASSET.walk, { frameWidth: 24, frameHeight: 32 });
      this.load.spritesheet('tools', ASSET.tools, { frameWidth: 40, frameHeight: 48 });
      this.load.atlas('town', snow.town || ASSET.town, ASSET.townJson);
      this.load.atlas('seasonal', ASSET.seasonal, ASSET.seasonalJson);
      this.load.atlas('houses', snow.houses || ASSET.houses, { frames: Object.fromEntries(Object.entries(ASSET.housesJson).map(([k, f]) => [k, { frame: { x: f.x, y: f.y, w: f.w, h: f.h } }])) });
      for (const n of Object.keys(TRAINER_TYPES)) this.load.spritesheet('tr_' + n, ASSET['tr_' + n], { frameWidth: 28, frameHeight: 32 });
      const BIG = { briamble: 40, kilnook: 40, weirlet: 40, fleecebolt: 40, whirlwyn: 40, cloverguard: 40, flintburrow: 40, staticwing: 40, duskcloak: 40, rampartoad: 44, pyrebrash: 44, brookstride: 40, mirebellows: 40, lotveil: 40, reefarer: 40, reefarer_cotton: 40, yawnox: 40, brimbramble: 40, stormveil: 40, hollowbark: 40, marshviper: 44 };
      for (const n of MON_ORDER) if (ASSET['mon_' + n]) this.load.spritesheet('mon_' + n, ASSET['mon_' + n], { frameWidth: BIG[n] || 28, frameHeight: BIG[n] || 28 });
      for (const n of ['bramble', 'marigold', ...VILL_IDS]) this.load.spritesheet('npc_' + n, ASSET['npc_' + n], { frameWidth: 28, frameHeight: 32 });
      for (const n of ['cobble1', 'cobble2', 'cobble3', 'slab', 'riverstone', 'peat', 'moss', 'bogwater', 'lily', 'board_h', 'board_v']) this.load.image('g_' + n, ASSET['g_' + n]);
      this.load.atlas('bog', snow.bog || ASSET.bog, ASSET.bogJson);
      this.load.atlas('bh', snow.bh || ASSET.bh, ASSET.bhJson);
    }
    create() {
      // copy each terrain tile's edge pixels outward by one so no seams show between tiles
      const src = this.textures.get('terrain').getSourceImage(), cols = Math.floor(src.width / T), rows = Math.floor(src.height / T);
      const c = document.createElement('canvas'); c.width = cols * (T + 2); c.height = rows * (T + 2);
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const sx = q * T, sy = r * T, dx = q * (T + 2) + 1, dy = r * (T + 2) + 1;
        g.drawImage(src, sx, sy, T, T, dx, dy, T, T);
        g.drawImage(src, sx, sy, T, 1, dx, dy - 1, T, 1); g.drawImage(src, sx, sy + T - 1, T, 1, dx, dy + T, T, 1);
        g.drawImage(c, dx, dy - 1, 1, T + 2, dx - 1, dy - 1, 1, T + 2); g.drawImage(c, dx + T - 1, dy - 1, 1, T + 2, dx + T, dy - 1, 1, T + 2);
      }
      if (this.textures.exists('terrain_x')) this.textures.remove('terrain_x');
      this.textures.addCanvas('terrain_x', c);
      this.scene.start(S.spawn && ['farm', 'town', 'route1', 'route2', 'route3', 'route4', 'brookholt', 'bhgym'].includes(S.spawn.scene) ? S.spawn.scene : 'house'); }
  }
  game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#22361f', pixelArt: true, roundPixels: true,
    scale: { mode: Phaser.Scale.NONE, width: Math.round(innerWidth * DPR()), height: Math.round(innerHeight * DPR()), zoom: 1 / DPR() },
    input: { activePointers: 2 }, scene: [Boot, Farm, House, Town, Route, class extends Route { constructor() { super('route2'); } }, class extends Route { constructor() { super('route3'); } }, class extends Route { constructor() { super('route4'); } }, class extends Route { constructor() { super('brookholt'); } }, BhGym],
  });
  Sound.music(true);
}
function startFrom(n, fresh, name) {
  slot = n;
  const old = fresh ? null : readSlot(n);
  S = Object.assign(newState(name), old || {});
  for (const m of S.mons || []) if (m.sp === 'hollowar' + 'den') m.sp = 'hollowbark';   // renamed species
  if (old) delete S.inv;
  S.town = Object.assign(newTown(), S.town || {});
  (S.mons || []).forEach(fixMon); setTimeout(() => { try { catchUpSigils(); } catch (e) { } }, 2500); S.seen ??= {}; S.caught ??= {}; S.picked ??= {};
  S.house ??= 0; S.tools ??= {}; S.shippedKinds ??= {}; applyToolNames(); applyLayout(); S.water ??= CAN_MAX; S.objs ??= {}; S.trainers ??= {}; S.workStore ??= {}; S.flags ??= {}; S.quests ??= {}; S.weather ??= 'sun'; S.tomorrow ??= rollWeather(S.day + 1);
  if (!S.spawn || !old) S.spawn = old ? { scene: 'farm', x: DOOR.x, y: DOOR.y + 1, dir: 'down' } : { scene: 'house', x: 2, y: 3, dir: 'down' };
  inv = new Inventory(36);
  questKey = '';
  if (old && old.inv) inv.load(old.inv); else ['axe', 'pickaxe', 'hoe', 'can', 'scythe'].forEach(id => inv.add(id, 1));
  inv.onChange(renderHotbar);
  if (fresh) { save(); S.morning = `Your first morning at Wild Roots Farm. Head outside and check your mailbox.`; playIntro(S.name, bootGame); return; }
  bootGame();
}
function slotSummary(n) {
  const s = readSlot(n); if (!s) return null;
  const sd = seasonDay(s.day);
  return `${s.name || 'Farmer'} · ${sd.season} ${sd.dom}, Year ${sd.year} · ${(s.gold || 0).toLocaleString()}g`;
}
function newGameDialog() {
  let chosen = [1, 2, 3].find(n => !readSlot(n)) || 1;
  const render = () => `<p>What's your name, farmer?</p><input id="fname" maxlength="14" value="${($('fname') && $('fname').value) || ''}" placeholder="Your name" style="font:inherit;font-size:18px;padding:6px 10px;border:3px solid var(--green);border-radius:6px;width:100%;background:#fffaf0">
    <p style="margin-top:12px"><b>Save slot</b></p>
    ${[1, 2, 3].map(n => { const s = slotSummary(n); return `<div class="recipe slotpick ${n === chosen ? 'on' : ''}" data-a="slot" data-n="${n}"><div class="g"><b>Slot ${n}</b><small>${s ? s + ' (will be replaced)' : 'Empty'}</small></div></div>`; }).join('')}
    <div class="row"><button class="btn gold" data-a="go">Start farming</button></div>`;
  openModal('New game', render(), (a, d) => {
    if (a === 'slot') { const v = $('fname').value; chosen = +d.n; $('mBody').innerHTML = render(); $('fname').value = v; }
    if (a === 'go') { const name = ($('fname').value || '').trim() || 'Farmer'; closeModal(); startFrom(chosen, true, name); }
  });
  setTimeout(() => $('fname') && $('fname').focus(), 50);
}
function loadDialog() {
  let imported = null;
  const render = () => [1, 2, 3].map(n => { const s = slotSummary(n); return `<div class="recipe"><div class="g"><b>Slot ${n}</b><small>${s || 'Empty'}</small></div>${imported ? `<button class="btn gold" data-a="put" data-n="${n}">${s ? 'Replace' : 'Put here'}</button>` : s ? `<button class="btn gold" data-a="load" data-n="${n}">Load</button><button class="btn" data-a="del" data-n="${n}">Delete</button>` : ''}</div>`; }).join('')
    + (imported ? `<p>Choose a slot for <b>${imported.name || 'Farmer'}</b>'s farm (day ${imported.day}).</p>` : `<p style="font-size:13px;opacity:.8">${Cloud.ok() ? '☁️ Saves are backed up to your claude.ai account.' : 'Saves are kept in this browser.'}</p><div class="row"><label class="btn" style="cursor:pointer">Import a backup file<input type="file" accept=".json,application/json,text/plain" data-a="file" style="display:none"></label><button class="btn" data-a="paste">Paste a backup code</button></div>`);
  const take = async text => { try { const o = await decodeSave(text); if (!o || o.v !== 1 || !o.inv) throw 0; imported = o; $('mBody').innerHTML = render(); } catch (e) { toast("That doesn't look like a Fablemon backup."); } };
  openModal('Load game', render(), (a, d, el) => {
    if (a === 'load') { closeModal(); startFrom(+d.n, false); }
    if (a === 'del') {
      if (el.dataset.sure) { try { localStorage.removeItem(slotKey(+d.n)); } catch (e) { } Cloud.del(+d.n); $('mBody').innerHTML = render(); refreshTitle(); }
      else { el.dataset.sure = 1; el.textContent = 'Really?'; }
    }
    if (a === 'file' && el.files && el.files[0]) el.files[0].text().then(take);
    if (a === 'paste') openModal('Paste a backup code', '<textarea id="pcode" style="width:100%;height:120px;font:12px monospace"></textarea><div class="row"><button class="btn gold" data-a="ok">Use this code</button></div>', b => { if (b === 'ok') { const t = $('pcode').value; loadDialog(); setTimeout(() => window._takeBackup && window._takeBackup(t), 0); } });
    if (a === 'put') { const n = +d.n; imported.savedAt = Date.now(); try { localStorage.setItem(slotKey(n), JSON.stringify(imported)); } catch (e) { } Cloud.put(n, imported); imported = null; refreshTitle(); toast('Backup restored.'); $('mBody').innerHTML = render(); }
  });
  $('mBody').addEventListener('change', e => { const el = e.target; if (el.dataset.a === 'file' && el.files[0]) el.files[0].text().then(take); });
  window._takeBackup = take;
}
function refreshTitle() {
  const has = !!lastSlot();
  document.querySelectorAll('#title .hit').forEach(el => { const t = el.dataset.t; el.classList.toggle('off', t === 'continue' && !has);   /* Load stays on: it also restores backups */ });
}
function layoutTitle() {
  // fill the whole screen without stretching: scale evenly and trim the edges ("cover")
  const img = $('titleImg'), wrap = img.parentElement, bg = document.querySelector('#title .bg'), vw = window.innerWidth, vh = window.innerHeight;
  const boxes = { continue: [400, 410, 384, 92], new: [400, 516, 384, 82], load: [400, 610, 384, 80], settings: [400, 702, 384, 80] };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const place = (cx, cy, cw, ch, s, left, top) => {
    Object.assign(wrap.style, { position: 'absolute', left: left + 'px', top: top + 'px', width: cw * s + 'px', height: ch * s + 'px', overflow: 'hidden' });
    Object.assign(img.style, { width: 1536 * s + 'px', height: 1024 * s + 'px', marginLeft: -cx * s + 'px', marginTop: -cy * s + 'px', maxWidth: 'none' });
    wrap.querySelectorAll('.hit').forEach(el => { const [x, y, bw, bh] = boxes[el.dataset.t]; Object.assign(el.style, { left: (x - cx) * s + 'px', top: (y - cy) * s + 'px', width: bw * s + 'px', height: bh * s + 'px' }); });
  };
  if (vw / vh >= .9) {
    // wide screens: the picture covers the screen, keeping the logo and buttons in view
    const s = Math.max(vw / 1536, vh / 1024), F = [180, 95, 1190, 800];
    const ox = clamp((F[0] + F[2]) / 2 * s - vw / 2, 0, 1536 * s - vw), oy = clamp(Math.min((F[1] + F[3]) / 2 * s - vh / 2, F[1] * s - 6), 0, 1024 * s - vh);
    bg.style.display = 'none'; wrap.style.webkitMaskImage = wrap.style.maskImage = '';
    place(ox / s, oy / s, vw / s, vh / s, s, 0, 0);
  } else {
    // tall phone screens: the farm half of the picture fills the screen, with the logo and buttons on top
    const sb = vh / 1024 * 1.08, bx = clamp(1035 * sb, 0, 1536 * sb - vw);   // the farm side, starting just past the logo
    Object.assign(bg.style, { display: 'block', inset: '0', filter: 'none', backgroundSize: `${1536 * sb}px ${1024 * sb}px`, backgroundPosition: `${-bx}px ${vh - 1024 * sb}px`, backgroundRepeat: 'no-repeat' });
    const C = [120, 60, 1010, 770], s = Math.min(vw / C[2], vh * .62 / C[3]);
    // only the logo band and the buttons show through, so nothing from the scene appears twice
    const fade = 'linear-gradient(to bottom, transparent 0, #000 7%, #000 43%, transparent 52%), radial-gradient(ellipse 31% 35% at 47% 70%, #000 80%, transparent 100%)';
    place(C[0], C[1], C[2], C[3], s, (vw - C[2] * s) / 2, Math.max(8, vh * .06));
    wrap.style.webkitMaskImage = wrap.style.maskImage = fade;
  }
}
async function initTitle() {
  await loadIcons(); await loadMonPics(); await loadExtraIcons(); applyItemArt(); await loadTrainerPics(); await loadVillPics();
  ['bBag', 'bCraft', 'bMenu'].forEach((id, i) => $(id).innerHTML = `<img src="${ICONS[['bag', 'craft', 'menu'][i]]}">`);
  $('titleImg').src = ASSET.title;
  document.querySelector('#title .bg').style.backgroundImage = `url(${ASSET.title})`;
  refreshTitle();
  syncSlots().then(ok => { refreshTitle(); $('cloudNote').textContent = ok ? '☁️ Saves backed up to your account' : ''; });
  document.querySelectorAll('#title .hit').forEach(el => {
    const t = el.dataset.t;
    el.onclick = () => {
      if (el.classList.contains('off')) return;
      Sound.play('click');
      if (t === 'continue') startFrom(lastSlot(), false);
      if (t === 'load') loadDialog();
      if (t === 'new') newGameDialog();
      if (t === 'settings') openSettings(false);
    };
  });
  layoutTitle(); window.addEventListener('resize', layoutTitle);
}
initTitle();
setupTouch();
