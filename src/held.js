/* ============================================================ Held items and stat potential */
const SIGIL_TYPES = ['Leaf', 'Ember', 'Tide', 'Stone', 'Gale', 'Spark', 'Shade', 'Wild'];
const sigilOf = type => type.toLowerCase() + '_sigil';
Object.assign(ITEMS, {
  fang_charm: { name: 'Fang Charm', stack: 99, held: 1, sell: 300, desc: 'Held: raises Attack by 10% (physical moves).' },
  ironbark_charm: { name: 'Ironbark Charm', stack: 99, held: 1, sell: 300, desc: 'Held: raises Defence by 10% (against physical moves).' },
  starpetal_charm: { name: 'Starpetal Charm', stack: 99, held: 1, sell: 300, desc: 'Held: raises Elemental Attack by 10%.' },
  mossveil_charm: { name: 'Mossveil Charm', stack: 99, held: 1, sell: 300, desc: 'Held: raises Elemental Defence by 10%.' },
  swift_feather: { name: 'Swift Feather', stack: 99, held: 1, sell: 300, desc: 'Held: raises Speed by 10%.' },
  heartwood_charm: { name: 'Heartwood Charm', stack: 99, held: 1, sell: 500, desc: 'Held: restores 1/16 of its health at the end of every turn.' },
  clinging_burr: { name: 'Clinging Burr', stack: 99, held: 1, sell: 600, desc: 'Held: once per battle, survives a hit that would knock it out from full health.' },
  study_leaf: { name: 'Study Leaf', stack: 99, held: 1, sell: 400, desc: 'Held: earns 20% more experience.' },
  lucky_acorn: { name: 'Lucky Acorn', stack: 99, held: 1, sell: 500, desc: 'Held: if it takes part, trainer prize money is 25% higher.' },
});
for (const t of SIGIL_TYPES) ITEMS[sigilOf(t)] = { name: `${t} Sigil`, stack: 99, held: 1, sell: 700, type: t, desc: `Held: ${t} moves are 15% stronger.` };
const HELD_SHOP = [['fang_charm', 900, 1], ['ironbark_charm', 900, 1], ['starpetal_charm', 900, 1], ['mossveil_charm', 900, 1], ['swift_feather', 900, 1], ['study_leaf', 1200, 1], ['lucky_acorn', 1500, 1], ['heartwood_charm', 1600, 2], ['clinging_burr', 1800, 2], ...SIGIL_TYPES.map(t => [sigilOf(t), 2000, 2])];
const HELD_STAT = { fang_charm: 'atk', ironbark_charm: 'def', starpetal_charm: 'eatk', mossveil_charm: 'edef', swift_feather: 'spd' };   // each charm lifts one stat only
const heldStat = (m, k) => HELD_STAT[m.held] === k ? 1.1 : 1;
// a Warden hands over their type's sigil (and anyone who beat them before this update gets theirs once)
function giveSigil(t) { S.flags = S.flags || {}; const id = sigilOf(t[0].toUpperCase() + t.slice(1)); if (S.flags['sig_' + id]) return; S.flags['sig_' + id] = 1; inv.add(id, 1); renderHotbar(); setTimeout(() => toast(`The Warden also gave you a ${ITEMS[id].name}! Give it to a Fablemon to hold.`, 3400), 1500); }
function catchUpSigils() { if (!S || !S.crests) return; if (S.crests.root) giveSigil('leaf'); if (S.crests.brook) giveSigil('tide'); if (S.crests.stone) giveSigil('stone'); if (S.crests.spark) giveSigil('spark'); }
// icons: tinted copies of the charm art
function heldIcons() {
  const tint = (base, col, id) => {
    const im = new Image(); im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, 24, 24);
      g.globalCompositeOperation = 'source-atop'; g.globalAlpha = .45; g.fillStyle = col; g.fillRect(0, 0, 24, 24);
      ICONS[id] = c.toDataURL(); ICON_CANVAS[id] = c;
    }; im.src = ICONS[base] || ICONS.wood; ICONS[id] = ICONS[base] || ICONS.wood;
  };
  tint('sturdy_charm', '#d04030', 'fang_charm'); tint('sturdy_charm', '#8a5a2a', 'ironbark_charm'); tint('root_charm', '#4aa0e0', 'swift_feather'); tint('sturdy_charm', '#b060d0', 'starpetal_charm'); tint('sturdy_charm', '#3a9a8a', 'mossveil_charm');
  tint('root_charm', '#3a9a3a', 'heartwood_charm'); tint('berry', '#7a6a2a', 'clinging_burr'); tint('root_charm', '#e0c040', 'study_leaf'); tint('honey', '#a06020', 'lucky_acorn');
  for (const t of SIGIL_TYPES) tint('sturdy_charm', TYPES[t], sigilOf(t));
}

/* ---------- potential panel on a Fablemon's info page */
function ivBest(m) { return IV_KEYS.map(k => [k, ivOf(m, k)]).sort((a, b) => b[1] - a[1])[0]; }
function ivRole(m) {
  // the role looks at the better of each pair (Attack or Elemental Attack, Defence or Elemental Defence)
  const v = k => ivOf(m, k), top = [['hp', v('hp')], ['atk', Math.max(v('atk'), v('eatk'))], ['def', Math.max(v('def'), v('edef'))], ['spd', v('spd')]].sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).sort().join('+');
  return { 'def+hp': 'Tank', 'atk+spd': 'Striker', 'atk+hp': 'Bruiser', 'atk+def': 'Juggernaut', 'hp+spd': 'Runner', 'def+spd': 'Guardian' }[top] || '';
}
function ivPanel(m) {
  if (!m.iv) return '';
  const total = IV_KEYS.reduce((a, k) => a + ivOf(m, k), 0), grade = total >= 51 ? 'Outstanding' : total >= 42 ? 'Great' : total >= 30 ? 'Good' : 'Modest';
  const bar = k => `<div class="ivr"><span>${IV_NAME[k]}</span><i>${Array.from({ length: 10 }, (_, j) => `<b class="${j < ivOf(m, k) ? 'on' : ''}"></b>`).join('')}</i><em>${ivOf(m, k)}</em></div>`;
  return `<div class="ivp"><div style="display:flex;justify-content:space-between"><b>Potential</b><small>${grade} (${total}/60)${ivRole(m) ? ` · suits a <b>${ivRole(m)}</b>` : ''}</small></div>${IV_KEYS.map(bar).join('')}<small class="hint">Every Fablemon is born with its own potential. Each point adds 1% to that stat, so a 10 gives +10%.</small></div>`;
}
function heldRow(m) {
  const it = m.held && ITEMS[m.held];
  return `<div class="shoprow" style="margin:6px 0"><img src="${it ? iconFor(m.held) : ICONS.wood}" style="${it ? '' : 'opacity:.25'}"><div class="g"><b>${it ? it.name : 'No held item'}</b><small>${it ? it.desc : 'Give it a charm to hold for a bonus in battle.'}</small></div><button class="btn sm" data-a="held">${it ? 'Change' : 'Give'}</button></div>`;
}
function openHeldPicker(m, back) {
  const own = [...new Set(inv.slots.filter(s => s && ITEMS[s.id].held).map(s => s.id))];
  openModal(`${monName(m)}: held item`, `${m.held ? `<div class="row" style="justify-content:flex-start"><button class="btn" data-a="off">Take off ${ITEMS[m.held].name}</button></div>` : ''}
    <div class="mlist">${own.length ? own.map(id => `<div class="shoprow"><img src="${iconFor(id)}"><div class="g"><b>${ITEMS[id].name} ×${inv.count(id)}</b><small>${ITEMS[id].desc}</small></div><button class="btn gold" data-a="give" data-id="${id}">Give</button></div>`).join('') : '<p>You have no charms for Fablemon to hold. Gideon\'s forge sells them, and Wardens hand out sigils.</p>'}</div>
    <div class="row"><button class="btn" data-a="back">Back</button></div>`, (a, d) => {
    if (a === 'back') return back();
    if (a === 'off' && m.held) { if (inv.add(m.held, 1)) return toast('Your backpack is full.'); m.held = null; renderHotbar(); return back(); }
    if (a === 'give') { if (!inv.remove(d.id, 1)) return; if (m.held) inv.add(m.held, 1); m.held = d.id; renderHotbar(); Sound.play('pop'); toast(`${monName(m)} is now holding the ${ITEMS[d.id].name}.`, 1800); return back(); }
  });
}
