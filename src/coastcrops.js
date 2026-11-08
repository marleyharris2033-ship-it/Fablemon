/* ============================================================ Beaconreach and Highmoor crops
   Seeds sold only in each town (art: coastcrops.json, tools/cut_coast_crops.py).
     Sea Samphire (Beaconreach)   loves the rain: grows an extra day on every rainy or stormy day
     Lantern Gourd (Beaconreach)  glows softly in your fields at night once its gourds have set
     Highmoor Wheat (Highmoor)    the base of the new baking recipes
     Moorberries (Highmoor)       a bush: after the first harvest it fruits again every 3 days, all season */
Object.assign(ITEMS, {
  samphire_seeds: { name: 'Sea Samphire Seeds', stack: 999, seed: 'samphire', sell: 35, desc: 'Spring and summer. A salty sea succulent that loves the rain: it grows an extra day whenever it rains. Ready in 6 days. Sold only in Beaconreach.' },
  lanterngourd_seeds: { name: 'Lantern Gourd Seeds', stack: 999, seed: 'lanterngourd', sell: 75, desc: 'Autumn. Paper-thin gourds that glow in your fields at night, like little lighthouse lamps. Ready in 11 days. Sold only in Beaconreach.' },
  moorwheat_seeds: { name: 'Highmoor Wheat Seeds', stack: 999, seed: 'moorwheat', sell: 50, desc: 'Summer and autumn. Tall golden wheat from the windmill town, for bread and baking. Ready in 8 days. Sold only in Highmoor.' },
  moorberry_seeds: { name: 'Moorberry Seeds', stack: 999, seed: 'moorberry', sell: 70, desc: 'Spring and summer. A heathland bush: after the first harvest it fruits again every 3 days until the season ends. Ready in 7 days. Sold only in Highmoor.' },
  samphire: { name: 'Sea Samphire', stack: 999, sell: 120, desc: 'Crisp, salty sea greens. Sells for 120g.' },
  lantern_gourd: { name: 'Lantern Gourd', stack: 999, sell: 400, desc: 'It still glows faintly after picking. Sells for 400g.' },
  highmoor_wheat: { name: 'Highmoor Wheat', stack: 999, sell: 200, desc: 'Golden wheat from the windy moor. Sells for 200g.' },
  moorberry: { name: 'Moorberries', stack: 999, sell: 110, desc: 'Dusky blue moorland berries, sweet and tart. Sells for 110g.' },
  samphire_fritters: { name: 'Samphire Fritters', stack: 99, eat: 70, sell: 360, desc: 'Crispy golden fritters full of salty samphire. Restores 70 energy.' },
  lantern_soup: { name: 'Lantern Gourd Soup', stack: 99, eat: 90, sell: 760, desc: 'A velvety orange soup that glows a little in the bowl. Restores 90 energy.' },
  lighthouse_chowder: { name: 'Lighthouse Chowder', stack: 99, eat: 200, sell: 1150, desc: "Orrin's favourite: samphire, lantern gourd and potato in a thick creamy chowder, with bread for dunking. Restores 200 energy." },
  highmoor_loaf: { name: 'Highmoor Loaf', stack: 99, eat: 90, sell: 520, desc: 'A big crusty loaf, baked with flour from Highmoor Mill. Restores 90 energy.' },
  moorberry_scones: { name: 'Moorberry Scones', stack: 99, eat: 80, sell: 560, desc: 'Split, filled with cream and moorberry jam. Restores 80 energy.' },
  moorberry_crumble: { name: 'Moorberry Crumble', stack: 99, eat: 200, sell: 1100, desc: "Tamsin's favourite: moorberries under a golden wheat crumble, sweetened with honey. Restores 200 energy." },
});
Object.assign(CROPS, {
  samphire: cvCrop('samphire', 6, [0, 1], { rain: 1 }),
  lanterngourd: cvCrop('lanterngourd', 11, [2], { item: 'lantern_gourd', glow: 1 }),
  moorwheat: cvCrop('moorwheat', 8, [1, 2], { item: 'highmoor_wheat' }),
  moorberry: cvCrop('moorberry', 7, [0, 1], { regrow: 3 }),
});
COOKING.push(
  { out: 'samphire_fritters', need: { samphire: 2, potato: 1 } }, { out: 'lantern_soup', need: { lantern_gourd: 1, tomato: 1 } },
  { out: 'lighthouse_chowder', need: { samphire: 1, lantern_gourd: 1, potato: 1 } },
  { out: 'highmoor_loaf', need: { highmoor_wheat: 2 } }, { out: 'moorberry_scones', need: { moorberry: 2, highmoor_wheat: 1 } },
  { out: 'moorberry_crumble', need: { moorberry: 2, highmoor_wheat: 1, honey: 1 } },
);
BR_SHOP.unshift(['samphire_seeds', 70], ['lanterngourd_seeds', 150]);
HM_SHOP.unshift(['moorwheat_seeds', 100], ['moorberry_seeds', 140]);
if (ASSET.coastcrops) for (const [k, v] of Object.entries(ASSET.coastcrops.crops)) SAP_CANVAS[k] = rgbaCanvas(v);
// Silver and Gold versions, like every other crop
for (const b of ['samphire', 'lantern_gourd', 'highmoor_wheat', 'moorberry']) {
  if (QUAL[b]) continue; QUAL[b] = [b + '_s', b + '_g'];
  [['_s', 'Silver', 1.25, 1], ['_g', 'Gold', 1.5, 2]].forEach(([suf, lab, mul, q]) => {
    const sell = Math.round(ITEMS[b].sell * mul);
    ITEMS[b + suf] = { ...ITEMS[b], name: `${lab} ${ITEMS[b].name}`, sell, qbase: b, q, desc: `${lab}-star quality. Sells for ${sell}g. Counts as ${ITEMS[b].name} in recipes.` };
  });
}
// a bush that has fruited stays a leafy, flowering bush while its next berries ripen
const _cropStage = cropStage;
cropStage = c => c.re && !cropRipe(c) ? 2 : _cropStage(c);
// after picking: a regrowing crop starts its next round instead of being cleared
function regrowAfterPick(tl) { const C = tl.crop && CROPS[tl.crop.type]; if (C && C.regrow) { tl.crop = { type: tl.crop.type, g: 0, need: C.regrow, re: 1 }; return true; } return false; }
