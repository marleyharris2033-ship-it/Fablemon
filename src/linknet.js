/* ============================================================ Playing with a friend: the connection (25 Nov 2026)
   Two phones link up directly (WebRTC data channel), with no game server: they swap two short codes.
   1. The host taps "Host" and shows a QR code (and the same thing as text).
   2. The friend scans it in the game (phones whose browser can read QR codes: BarcodeDetector, e.g. Chrome on
      Android) or pastes the text, and shows their reply code.
   3. The host scans or pastes the reply. Linked.
   The codes are the connection details only (a compressed SDP: ICE username and password, the DTLS fingerprint and
   the addresses), about 150–250 characters. A public STUN server lets it find a way through most home routers, so
   it works on the same Wi-Fi and often across the internet too; about 1 network in 10 blocks direct links.
   Once linked (LinkNet):
   - in the Link Hall you see each other's farmer (built from their own Wardrobe look) walk about, with their name;
   - emotes (the 8 bubbles) pop up over either farmer;
   - any code (team, trade, ghost run) can be sent straight across instead of by message.
   Messages are small JSON: hello {n, look}, pos {s, x, y, d, m}, emo {i}, code {c}, ping, bye. */
const LinkNet = (() => {
  const ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  let pc = null, dc = null, role = null, peer = null, last = 0, hb = null, onMsg = [];
  const st = { get on() { return !!(dc && dc.readyState === 'open' && peer); }, get role() { return role; }, get peer() { return peer; } };

  // ---------- squeezing a session description into a short code, and back
  const hex2b = h => btoa(String.fromCharCode(...h.split(':').map(x => parseInt(x, 16)))).replace(/=+$/, '');
  const b2hex = b => [...atob(b)].map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(':');
  function pack(sdp, kind) {
    const get = k => (sdp.match(new RegExp('a=' + k + ':(.*)')) || [])[1] || '';
    const fp = get('fingerprint').split(' '), setup = { actpass: 'x', active: 'a', passive: 'p' }[get('setup')] || 'x';
    const cands = [...sdp.matchAll(/a=candidate:\S+ 1 udp (\d+) (\S+) (\d+) typ (host|srflx)/gi)].map(m => `${m[4][0]}${m[2]}:${m[3]}`);
    const uniq = [...new Set(cands)].slice(0, 6);
    return ['FL1', kind, get('ice-ufrag'), get('ice-pwd'), hex2b(fp[1] || ''), setup, uniq.join(',')].join('~');
  }
  function unpack(code) {
    const p = String(code || '').trim().replace(/\s+/g, '').split('~');
    if (p[0] !== 'FL1' || p.length < 7) return null;
    const [, kind, uf, pw, fp, su, cs] = p, setup = { x: 'actpass', a: 'active', p: 'passive' }[su] || 'actpass';
    const cand = cs ? cs.split(',').map((c, i) => { const t = c[0] === 's' ? 'srflx' : 'host', j = c.lastIndexOf(':'), ip = c.slice(1, j), port = c.slice(j + 1);
      return `a=candidate:${i + 1} 1 udp ${t === 'host' ? 2122260223 - i : 1686052607 - i} ${ip} ${port} typ ${t}${t === 'srflx' ? ' raddr 0.0.0.0 rport 0' : ''} generation 0`; }) : [];
    const sdp = ['v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0', ...cand, 'a=end-of-candidates', `a=ice-ufrag:${uf}`, `a=ice-pwd:${pw}`, 'a=ice-options:trickle',
      `a=fingerprint:sha-256 ${b2hex(fp)}`, `a=setup:${setup}`, 'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ''].join('\r\n');
    return { kind, sdp };
  }
  const gathered = (c, ms = 3500) => new Promise(res => {   // wait for the addresses (every one, or enough time for them)
    if (c.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, ms); c.addEventListener('icegatheringstatechange', () => { if (c.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });

  // ---------- the link
  function reset() { try { dc && dc.close(); } catch (e) { } try { pc && pc.close(); } catch (e) { } pc = dc = null; role = null; peer = null; clearInterval(hb); }
  function wire(ch) {
    dc = ch;
    dc.onopen = () => { last = Date.now(); send({ t: 'hello', n: (S && S.name) || 'Friend', look: (S && S.look && S.look.cc) || null, s: scene && scene.scene.key });
      clearInterval(hb); hb = setInterval(() => { if (!dc || dc.readyState !== 'open') return; send({ t: 'ping' }); if (peer && Date.now() - last > 9000) lost(); }, 2000); };
    dc.onmessage = e => { last = Date.now(); let m; try { m = JSON.parse(e.data); } catch (x) { return; } recv(m); };
    dc.onclose = () => lost();
  }
  function lost() { if (!peer && !dc) return; const n = peer && peer.n; reset(); if (n) { toast(`🔗 Lost the link with ${n}.`, 3000); fire({ t: 'bye' }); } }
  function recv(m) {
    if (m.t === 'hello') { const first = !peer; peer = { n: String(m.n || 'Friend').slice(0, 20), look: m.look, s: m.s }; if (first) { toast(`🔗 Linked with ${peer.n}!`, 3000); Sound.play('levelup'); } if (typeof closeLinkPanel === 'function') closeLinkPanel(); }
    if (m.t === 'pos' && peer) Object.assign(peer, { s: m.s, x: m.x, y: m.y, d: m.d, m: m.m, at: Date.now() });
    if (m.t === 'bye') { const n = peer && peer.n; reset(); if (n) toast(`🔗 ${n} closed the link.`, 3000); }
    fire(m);
  }
  const fire = m => { for (const f of onMsg) try { f(m); } catch (e) { console.warn('link', e); } };
  function send(m) { if (dc && dc.readyState === 'open') try { dc.send(JSON.stringify(m)); return true; } catch (e) { } return false; }
  async function host() {
    reset(); role = 'host'; pc = new RTCPeerConnection({ iceServers: ICE });
    wire(pc.createDataChannel('fablemon', { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
    return pack(pc.localDescription.sdp, 'o');
  }
  async function join(code) {
    const o = unpack(code); if (!o || o.kind !== 'o') throw new Error('not an invite');
    reset(); role = 'guest'; pc = new RTCPeerConnection({ iceServers: ICE }); pc.ondatachannel = e => wire(e.channel);
    await pc.setRemoteDescription({ type: 'offer', sdp: o.sdp });
    await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
    return pack(pc.localDescription.sdp, 'a');
  }
  async function accept(code) {
    const o = unpack(code); if (!o || o.kind !== 'a') throw new Error('not a reply');
    if (!pc || role !== 'host') throw new Error('not hosting');
    await pc.setRemoteDescription({ type: 'answer', sdp: o.sdp });
  }
  function bye() { send({ t: 'bye' }); setTimeout(reset, 150); }
  return Object.assign(st, { host, join, accept, send, bye, listen: f => onMsg.push(f), kindOf: c => (unpack(c) || {}).kind, _pack: pack, _unpack: unpack });
})();

// ---------- QR codes: draw one, and read one with the camera where the browser can
function qrCanvas(text, px = 260) {
  const q = QRGen(text, 'L'), b = 3, n = q.n + b * 2, s = Math.max(2, Math.floor(px / n)), c = document.createElement('canvas');
  c.width = c.height = n * s; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1a1208';
  for (let r = 0; r < q.n; r++) for (let k = 0; k < q.n; k++) if (q.dark(r, k)) g.fillRect((k + b) * s, (r + b) * s, s, s);
  c.style.cssText = 'width:min(62vw,240px);height:auto;image-rendering:pixelated;display:block;margin:6px auto;border-radius:6px'; return c;
}
const canScan = () => 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
let LINK_CAM = null;
function stopScan() { if (LINK_CAM) { clearInterval(LINK_CAM.t); LINK_CAM.s.getTracks().forEach(t => t.stop()); LINK_CAM = null; } }
async function startScan(video, onCode) {
  stopScan();
  const det = new BarcodeDetector({ formats: ['qr_code'] }), s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  video.srcObject = s; await video.play();
  LINK_CAM = { s, t: setInterval(async () => { try { const r = await det.detect(video); const v = r && r[0] && r[0].rawValue; if (v && /^FL1~/.test(v)) { stopScan(); onCode(v); } } catch (e) { } }, 250) };
}

// ---------- the panel
let LINK_PANEL = false;
function closeLinkPanel() { if (LINK_PANEL) { LINK_PANEL = false; stopScan(); closeModal(); } }
function linkMenuTile() { return [['link', ASSET.linkIcon ? `<img src="${ASSET.linkIcon}" style="width:1.5em;height:1.5em;vertical-align:middle">` : '🔗', LinkNet.on ? 'Linked' : 'Play with a friend']]; }
function linkConnect() {
  stopScan(); LINK_PANEL = false;
  if (LinkNet.on) return openModal('Playing with a friend', `<p>🔗 You're linked with <b>${LinkNet.peer.n}</b>.</p><p style="font-size:13px">Meet in the Link Hall in Smallroot to see each other. Codes for trades, ghost runs and teams can be sent straight across.</p>
    <div class="row"><button class="btn" data-a="x">Close</button><button class="btn" data-a="bye">Unlink</button></div>`, a => { if (a === 'bye') { LinkNet.bye(); toast('Unlinked.'); } closeModal(); });
  openModal('Play with a friend', `<p>Link your game with a friend's, phone to phone. You'll swap two codes, by scanning a QR code or pasting text.</p>
    <p style="font-size:13px;opacity:.8">One of you hosts, the other joins. Being on the same Wi-Fi works best.</p>
    <button class="btn gold" data-a="host" style="width:100%;margin:3px 0">📡 Host: show my code</button>
    <button class="btn" data-a="join" style="width:100%;margin:3px 0">🤝 Join: my friend is hosting</button>
    <div class="row"><button class="btn" data-a="x">Not now</button></div>`, a => { if (a === 'host') return linkHostFlow(); if (a === 'join') return linkJoinFlow(); closeModal(); });
}
function linkCodeView(title, intro, code, after) {
  LINK_PANEL = true;
  openModal(title, `<p>${intro}</p><div id="lkQR"></div><textarea readonly style="width:100%;height:46px;font-size:10px" onclick="this.select()">${code}</textarea>
    <div class="row" style="flex-wrap:wrap">${navigator.share ? '<button class="btn" data-a="share">Share</button>' : ''}<button class="btn" data-a="copy">Copy</button>${after || ''}</div>`, (a) => {
    if (a === 'copy') return linkCopyBtn(code);
    if (a === 'share') return navigator.share({ text: code }).catch(() => { });
    linkPanelAct(a);
  }, () => { LINK_PANEL = false; stopScan(); });
  document.getElementById('lkQR').appendChild(qrCanvas(code));
}
let linkPanelAct = () => { };
function linkReader(title, intro, onCode, back) {
  LINK_PANEL = true;
  const scan = canScan();
  openModal(title, `<p>${intro}</p>${scan ? `<video id="lkCam" playsinline muted style="width:100%;max-height:34vh;border-radius:8px;background:#000;object-fit:cover"></video>` : `<p style="font-size:12px;opacity:.8">This browser can't scan QR codes in the game, so paste the code instead (your friend can tap Share or Copy on theirs).</p>`}
    <textarea data-a="code" placeholder="…or paste the code here" style="width:100%;height:52px;font-size:11px;margin-top:6px"></textarea><p id="lkMsg" style="font-size:12px;margin:3px 0"></p>
    <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go">Use code</button></div>`, a => {
    if (a === 'back') { stopScan(); return back(); }
    if (a === 'go') onCode(document.querySelector('#mBody textarea').value.trim());
  }, () => { LINK_PANEL = false; stopScan(); });
  if (scan) startScan(document.getElementById('lkCam'), onCode).catch(() => { const m = document.getElementById('lkMsg'); if (m) m.textContent = "Couldn't open the camera: paste the code instead."; });
}
const linkMsg = t => { const m = document.getElementById('lkMsg'); if (m) m.textContent = t; };
async function linkHostFlow() {
  openModal('Hosting…', '<p>Getting your code ready…</p>');
  let code; try { code = await LinkNet.host(); } catch (e) { return openModal('Hosting', `<p>Couldn't start the link on this device (${e.message || e}).</p>`, () => closeModal()); }
  linkPanelAct = a => { if (a === 'next') linkReader('Scan their reply', `Now scan the reply code on your friend's screen.`, async c => {
    try { await LinkNet.accept(c); linkMsg('Linking…'); stopScan(); setTimeout(() => { if (!LinkNet.on) linkMsg("Still trying… if nothing happens, check you're both online (the same Wi-Fi is best) and try again."); }, 8000); }
    catch (e) { linkMsg(LinkNet.kindOf(c) === 'o' ? "That's an invite code, not a reply. Your friend should tap Join." : "❌ That isn't a reply code."); } }, linkHostFlow); };
  linkCodeView('Host: your code', `Let your friend scan this from <b>Join</b> in their game (or send it with Share). Then tap <b>Next</b> to scan their reply.`, code, '<button class="btn gold" data-a="next">Next</button>');
}
function linkJoinFlow() {
  linkReader('Join a friend', `Scan the code on your friend's screen (they tap <b>Host</b>).`, async c => {
    if (LinkNet.kindOf(c) !== 'o') return linkMsg(LinkNet.kindOf(c) === 'a' ? "That's a reply code: your friend should be the one to use it." : "❌ That isn't an invite code.");
    stopScan(); openModal('Joining…', '<p>Making your reply…</p>');
    let reply; try { reply = await LinkNet.join(c); } catch (e) { return openModal('Joining', `<p>Couldn't use that code (${e.message || e}). Ask your friend to host again.</p>`, () => closeModal()); }
    linkPanelAct = () => { };
    linkCodeView('Join: your reply', `Let your friend scan this (or send it with Share). You'll be linked as soon as they do.`, reply, '<button class="btn" data-a="x">Close</button>');
    linkPanelAct = a => { if (a === 'x') { LINK_PANEL = false; closeModal(); } };
  }, linkConnect);
}

// ---------- codes sent straight across
LinkNet.listen(m => {
  if (m.t !== 'code' || !m.c || !LinkNet.peer) return;
  const c = String(m.c), n = LinkNet.peer.n, what = /^FMX1-/.test(c) ? 'a trade code' : /^FMG1-/.test(c) ? 'a ghost run' : /^FMT1-/.test(c) ? 'their team code' : null;
  if (!what) return;
  Sound.play('pop');
  openModal(`From ${n}`, `<p>📨 ${n} sent you ${what}.</p><div class="row"><button class="btn" data-a="later">Later</button><button class="btn gold" data-a="open">Open it</button></div>`, a => {
    if (a !== 'open') { lk().inbox = c; toast('Saved: it will be filled in next time you open the paste box.', 2600); return closeModal(); }
    if (/^FMX1-/.test(c)) { linkPaste(); document.querySelector('#mBody textarea').value = c; }
    else if (/^FMG1-/.test(c)) { linkGhostPaste(); document.querySelector('#mBody textarea').value = c; }
    else { const C = lk().cfg = Object.assign(lk().cfg || {}, { foe: 'code', code: c }); linkSetup(); }
  });
});
// "Send to <friend>" next to every code the hall shows
{
  const _show = linkShowCode;
  linkShowCode = function (title, text, code, back) {
    _show(title, text, code, back);
    if (LinkNet.on) { const row = document.querySelector('#mBody .row'); row && row.insertAdjacentHTML('afterbegin', `<button class="btn gold" id="lkSend">📨 Send to ${LinkNet.peer.n}</button>`);
      document.getElementById('lkSend').onclick = e => { e.stopPropagation(); if (LinkNet.send({ t: 'code', c: code })) toast(`Sent to ${LinkNet.peer.n}!`); else toast('The link has dropped.'); }; }
  };
  const _box = linkCodeBox;
  linkCodeBox = code => _box(code) + (LinkNet.on ? `<button class="btn gold" style="width:100%;margin-top:4px" onclick="event.stopPropagation();LinkNet.send({t:'code',c:this.previousElementSibling.value})&&toast('Sent to '+LinkNet.peer.n+'!')">📨 Send to ${LinkNet.peer.n}</button>` : '');
  // a saved code fills the paste box when it next opens
  for (const nm of ['linkPaste', 'linkGhostPaste']) { const f = window[nm]; window[nm] = function () { f.apply(this, arguments); const L = lk(), ta = document.querySelector('#mBody textarea'); if (L.inbox && ta && ((nm === 'linkPaste') === /^FMX1-/.test(L.inbox))) { ta.value = L.inbox; delete L.inbox; } }; }
}

// ---------- in the Link Hall: your friend, and emotes
const EMO = ['wave', 'heart', 'laugh', 'wow', 'what', 'thumbs', 'trophy', 'phew'];
function linkEmoTex(sc, done) {
  if (sc.textures.exists('link_emo')) return done();
  const im = new Image(); im.onload = () => { if (!sc.sys || !sc.sys.isActive()) return; if (!sc.textures.exists('link_emo')) { sc.textures.addSpriteSheet('link_emo', im, { frameWidth: 96, frameHeight: 96 }); sc.textures.get('link_emo').setFilter(Phaser.Textures.FilterMode.LINEAR); } done(); }; im.src = ASSET.linkEmotes;
}
function linkBubble(sc, who, i) {
  if (!who || !who.active) return;
  linkEmoTex(sc, () => {
    const b = sc.add.image(who.x, who.y - 34, 'link_emo', i).setDisplaySize(20, 20).setDepth(9e6 + 5).setAlpha(0);
    sc.tweens.add({ targets: b, alpha: 1, y: who.y - 40, duration: 180, ease: 'Back.out' });
    const fol = sc.time.addEvent({ delay: 16, loop: true, callback: () => { if (b.active && who.active) b.x = who.x; } });
    sc.time.delayedCall(2400, () => { fol.remove(); if (b.active) sc.tweens.add({ targets: b, alpha: 0, y: b.y - 6, duration: 250, onComplete: () => b.destroy() }); });
  });
  Sound.play('pop');
}
const lhCss = document.createElement('style');
lhCss.textContent = `#lkEmo{position:fixed;left:12px;bottom:calc(150px + env(safe-area-inset-bottom));z-index:30;display:none;align-items:flex-end;gap:6px}
#lkEmo.show{display:flex}#lkEmo>button{width:46px;height:46px;border-radius:50%;border:3px solid #2c4a2c;background:#fffaea;padding:4px}#lkEmo>button img{width:100%;height:100%}
#lkEmo .row8{display:none;background:#fffaea;border:3px solid #2c4a2c;border-radius:12px;padding:4px;gap:2px;flex-wrap:wrap;width:176px}#lkEmo.open .row8{display:flex}
#lkEmo .row8 button{width:40px;height:40px;border:0;background:none;padding:0;background-image:var(--src);background-size:800% 100%}
#lkFriend{position:fixed;left:50%;transform:translateX(-50%);top:calc(8px + env(safe-area-inset-top));z-index:30;display:none;font:800 12px var(--ui);background:rgba(255,250,234,.92);border:2px solid #2c4a2c;border-radius:12px;padding:3px 9px;color:#2a3a20}
#lkFriend.show{display:block}`;
document.head.appendChild(lhCss);
const lkEmoEl = document.createElement('div'); lkEmoEl.id = 'lkEmo';
lkEmoEl.innerHTML = `<button data-e="open" aria-label="Emotes"><img src="${ASSET.linkIcon || ''}"></button><div class="row8">${EMO.map((n, i) => `<button data-e="${i}" aria-label="${n}" style="--src:url(${ASSET.linkEmotes});background-position:${i * 100 / 7}% 0"></button>`).join('')}</div>`;
document.body.appendChild(lkEmoEl);
const lkFriendEl = document.createElement('div'); lkFriendEl.id = 'lkFriend'; document.body.appendChild(lkFriendEl);
lkEmoEl.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-e]'); if (!b) return; e.preventDefault(); e.stopPropagation();
  if (b.dataset.e === 'open') return lkEmoEl.classList.toggle('open');
  const i = +b.dataset.e; lkEmoEl.classList.remove('open');
  if (scene && scene.scene.key === 'linkhall') linkBubble(scene, scene.player, i);
  LinkNet.send({ t: 'emo', i });
});
LinkNet.listen(m => { if (m.t === 'emo' && scene && scene.scene.key === 'linkhall' && scene.friend && LinkNet.peer && LinkNet.peer.s === 'linkhall') linkBubble(scene, scene.friend, Math.max(0, Math.min(7, m.i | 0))); });

// your friend's farmer, from their own look
const FRIEND_TEX = { key: null, look: null, busy: false };
function friendTexture(sc, look, done) {
  const sig = JSON.stringify(look || null);
  if (FRIEND_TEX.look === sig && sc.textures.exists(FRIEND_TEX.key)) return done(FRIEND_TEX.key);
  if (FRIEND_TEX.busy) return; FRIEND_TEX.busy = true;
  const fail = () => { FRIEND_TEX.busy = false; done('walk'); };
  if (typeof CCX === 'undefined' || !CCX) return fail();
  CCX.sheets(look || CCX.DEF).then(r => {
    const im = new Image(); im.onload = () => {
      FRIEND_TEX.busy = false; if (!sc.sys || !sc.sys.isActive()) return;
      const key = 'friend_walk_' + Math.abs([...sig].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
      if (!sc.textures.exists(key)) { sc.textures.addSpriteSheet(key, im, { frameWidth: r.fw, frameHeight: r.fh }); if (typeof hdShrinkTexture === 'function') hdShrinkTexture(sc.textures.get(key), Math.round(r.fw / 24) || 6); }
      FRIEND_TEX.key = key; FRIEND_TEX.look = sig; done(key);
    }; im.onerror = fail; im.src = r.walk;
  }).catch(fail);
}
{
  const _create = LinkHallScene.prototype.create;
  LinkHallScene.prototype.create = function () {
    _create.call(this); this.friend = null; this.lkSent = 0; this.lkLast = '';
    lkEmoEl.classList.add('show'); lkEmoEl.classList.remove('open');
    this.events.once('shutdown', () => { lkEmoEl.classList.remove('show', 'open'); lkFriendEl.classList.remove('show'); });
    LinkNet.send({ t: 'pos', s: 'linkhall', x: this.player.x, y: this.player.y, d: this.p.dir, m: 0 });
  };
  const _upd = LinkHallScene.prototype.update;
  LinkHallScene.prototype.update = function (time, dms) {
    _upd.call(this, time, dms);
    if (!this.player || this.sleeping) return;
    // what you're doing, 8 times a second (only when it changes, plus now and then)
    if (LinkNet.on && time - this.lkSent > 125) {
      const sig = `${Math.round(this.player.x)},${Math.round(this.player.y)},${this.p.dir},${this.p.moving ? 1 : 0}`;
      if (sig !== this.lkLast || time - this.lkSent > 1500) { this.lkLast = sig; this.lkSent = time; LinkNet.send({ t: 'pos', s: 'linkhall', x: Math.round(this.player.x), y: Math.round(this.player.y), d: this.p.dir, m: this.p.moving ? 1 : 0 }); }
    }
    const P = LinkNet.on ? LinkNet.peer : null, here = P && P.s === 'linkhall' && P.x != null;
    lkFriendEl.classList.toggle('show', !!P); if (P) lkFriendEl.textContent = here ? `🔗 ${P.n} is here` : `🔗 Linked with ${P.n}${P.s ? ' · not in the hall' : ''}`;
    if (!here) { if (this.friend) { this.friend.destroy(); this.friendTag.destroy(); this.friendSh.destroy(); this.friend = null; } return; }
    if (!this.friend) {
      if (this.friendWait) return; this.friendWait = 1;
      friendTexture(this, P.look, key => {
        this.friendWait = 0; if (!this.sys.isActive() || this.friend) return;
        const cols = Math.max(4, (this.textures.get(key).frameTotal - 1) / 4); this.friendCols = cols;
        for (let r = 0; r < 4; r++) { const k = key + '_' + DIRS[r]; if (!this.anims.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers(key, { frames: cols >= 6 ? Array.from({ length: cols }, (_, i) => r * cols + i) : [r * 4 + 1, r * 4, r * 4 + 3, r * 4] }), frameRate: cols >= 6 ? 12 : 7, repeat: -1 }); }
        this.friendKey = key; this.friend = this.add.sprite(P.x, P.y, key, 0).setOrigin(.5, 1);
        this.friendSh = this.add.ellipse(P.x, P.y - 1, 14, 6, 0x1a1206, .3).setDepth(1);
        this.friendTag = this.add.text(P.x, P.y - 34, P.n, { fontFamily: 'ui-rounded, Nunito, system-ui, sans-serif', fontStyle: 'bold', fontSize: '7px', color: '#fffaea', stroke: '#2a1e1a', strokeThickness: 2, resolution: 12 }).setOrigin(.5, 1).setDepth(9e6);
        this.fx = P.x; this.fy = P.y;
      });
      return;
    }
    // smooth towards where they are
    const k = Math.min(1, dms / 1000 * 10); this.fx += (P.x - this.fx) * k; this.fy += (P.y - this.fy) * k;
    if (Math.hypot(P.x - this.fx, P.y - this.fy) > 80) { this.fx = P.x; this.fy = P.y; }
    this.friend.setPosition(Math.round(this.fx), Math.round(this.fy)).setDepth(this.fy); this.friendSh.setPosition(this.fx, this.fy - 1); this.friendTag.setPosition(Math.round(this.fx), Math.round(this.fy) - 29);
    const an = this.friendKey + '_' + (P.d || 'down');
    if (P.m) { if (this.friend.anims.currentAnim?.key !== an || !this.friend.anims.isPlaying) this.friend.play(an); }
    else if (this.friend.anims.isPlaying || this.friendDir !== P.d) { this.friend.stop(); this.friend.setFrame(DIRS.indexOf(P.d || 'down') * (this.friendCols >= 6 ? this.friendCols : 4)); }
    this.friendDir = P.d;
  };
}
// leaving the hall: tell them where you are
LinkNet.listen(m => { if (m.t === 'hello' && scene && scene.scene.key === 'linkhall' && scene.player) LinkNet.send({ t: 'pos', s: 'linkhall', x: Math.round(scene.player.x), y: Math.round(scene.player.y), d: scene.p.dir, m: 0 }); });
{
  const _travel = travel;
  travel = function (sc, to, sp) { if (LinkNet.on && to !== 'linkhall') LinkNet.send({ t: 'pos', s: to }); return _travel.call(this, sc, to, sp); };
}
