/* ===== Cosy carved-wood UI helpers (27 Nov 2026), with ui/ui.css */
// long window titles shrink to fit the wooden plaque instead of being cut off
function uiFitTitle() {
  const el = $('mTitle'); if (!el) return; el.style.fontSize = '';
  let f = parseFloat(getComputedStyle(el).fontSize) || 19;
  while (el.scrollWidth > el.clientWidth + 1 && f > 11) { f -= 0.5; el.style.fontSize = f + 'px'; }
}
{ const _om = openModal; openModal = function (...a) { const r = _om.apply(this, a); try { uiFitTitle(); } catch (e) {} return r; }; }
// titles changed in place (the Journal, renames) or a window that changes width are fitted again
try {
  let busy = 0; const refit = () => { if (busy) return; busy = 1; requestAnimationFrame(() => { busy = 0; try { uiFitTitle(); } catch (e) {} }); };
  new MutationObserver(refit).observe($('mTitle'), { childList: true, characterData: true, subtree: true });
  if (window.ResizeObserver) new ResizeObserver(refit).observe($('modal').querySelector('.panel'));
} catch (e) {}
// painted icons from the UI icon sheet: icon('coin') -> <i class="ico" ...>
const UI_ICONS = ['coin', 'energy', 'heart', 'star', 'sparkle', 'trophy', 'medal', 'gift', 'bag', 'paw', 'hammer', 'scroll', 'mail', 'map', 'compass', 'book',
  'gear', 'home', 'link', 'trade', 'flag', 'swords', 'lock', 'yesno', 'talk', 'hand', 'hoe', 'can', 'axe', 'pick', 'sprout', 'sickle',
  't_leaf', 't_ember', 't_tide', 't_stone', 't_gale', 't_spark', 't_frost', 't_shade', 't_glow', 't_wild', 'rod', 'saddle', 'boot', 'spring', 'summer', 'autumn'];
function icon(n, cls) {
  const i = UI_ICONS.indexOf(n); if (i < 0) return '';
  return `<i class="ico${cls ? ' ' + cls : ''}" style="background-position:${(i % 8) / 7 * 100}% ${Math.floor(i / 8) / 5 * 100}%"></i>`;
}
