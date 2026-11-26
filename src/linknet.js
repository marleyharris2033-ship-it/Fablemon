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
  let pc = null, dc = null, role = null, peer = null, last = 0, hb = null, onMsg = [], relay = null;
  const direct = () => !!(dc && dc.readyState === 'open');
  const mkPC = () => new RTCPeerConnection({ iceServers: ICE, ...(window.LINK_NO_DIRECT ? { iceTransportPolicy: 'relay' } : {}) });   // (tests: LINK_NO_DIRECT blocks the direct link)
  const st = { get on() { return !!((direct() || relay) && peer); }, get role() { return role; }, get peer() { return peer; }, get relayed() { return !!relay && !direct(); } };

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
  function reset() { try { dc && dc.close(); } catch (e) { } try { pc && pc.close(); } catch (e) { } pc = dc = null; role = null; peer = null; relay = null; clearInterval(hb); }
  // the link is up (directly, or through the relay): say hello and keep checking it's alive
  function opened() {
    last = Date.now(); send({ t: 'hello', n: (S && S.name) || 'Friend', look: (S && S.look && S.look.cc) || null, s: scene && scene.scene.key });
    clearInterval(hb); hb = setInterval(() => { if (!direct() && !relay) return; send({ t: 'ping' }); if (peer && Date.now() - last > (relay && !direct() ? 15000 : 9000)) lost(); }, 2000);
  }
  function wire(ch) {
    dc = ch;
    dc.onopen = () => { relay = null; opened(); };
    dc.onmessage = e => { last = Date.now(); let m; try { m = JSON.parse(e.data); } catch (x) { return; } recv(m); };
    dc.onclose = () => { if (!relay) lost(); };
  }
  function lost() { if (!peer && !dc && !relay) return; const n = peer && peer.n; reset(); if (n) { toast(`🔗 Lost the link with ${n}.`, 3000); fire({ t: 'bye' }); } }
  function recv(m) {
    if (m.t === 'hello') { const first = !peer; peer = { n: String(m.n || 'Friend').slice(0, 20), look: m.look, s: m.s }; if (first) { toast(`🔗 Linked with ${peer.n}!${st.relayed ? ' (through the relay)' : ''}`, 3000); Sound.play('levelup'); } if (typeof closeLinkPanel === 'function') closeLinkPanel(); }
    if (m.t === 'pos' && peer) Object.assign(peer, { s: m.s, x: m.x, y: m.y, d: m.d, m: m.m, at: Date.now() });
    if (m.t === 'bye') { const n = peer && peer.n; reset(); if (n) toast(`🔗 ${n} closed the link.`, 3000); }
    fire(m);
  }
  const fire = m => { for (const f of onMsg) try { f(m); } catch (e) { console.warn('link', e); } };
  function send(m) { if (direct()) try { dc.send(JSON.stringify(m)); return true; } catch (e) { } if (relay) { relay.out(m); return true; } return false; }
  async function host() {
    reset(); role = 'host'; pc = mkPC();
    wire(pc.createDataChannel('fablemon', { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer()); await gathered(pc);
    return pack(pc.localDescription.sdp, 'o');
  }
  async function join(code) {
    const o = unpack(code); if (!o || o.kind !== 'o') throw new Error('not an invite');
    reset(); role = 'guest'; pc = mkPC(); pc.ondatachannel = e => wire(e.channel);
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

  // ---------- rooms (25 Nov 2026): a 6-character code instead of swapping two long ones.
  // Something on the internet has to introduce the two phones, and free public services come and go, so a room
  // listens on several at once and the first to pass the hello along wins (first tried with PeerJS alone, which
  // didn't pass the friend's hello on between two real iPhones):
  //   - PeerJS's public server (WebSocket; the host is the server id 'fablemon-room-<CODE>');
  //   - three public MQTT brokers (MQTT 3.1.1 over WebSocket, written here: CONNECT, SUBSCRIBE, PUBLISH at QoS 0,
  //     PINGREQ), all on the topic 'fablemon-link/v1/<CODE>'.
  // The friend sends one message, { k: 'offer', f: their id, sdp } (the whole offer, addresses included, so nothing
  // else needs to cross), and the host answers { k: 'answer', to, sdp } on every channel it heard from. Once the
  // phones are linked directly, every channel is closed.
  const ROOM_AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I
  const roomCode = () => Array.from({ length: 6 }, () => ROOM_AB[Math.floor(Math.random() * ROOM_AB.length)]).join('');
  const SIGNALS = () => window.LINK_SIGNALS || [
    { kind: 'peerjs', url: 'wss://0.peerjs.com:443/peerjs', key: 'peerjs' },
    { kind: 'mqtt', url: 'wss://broker.emqx.io:8084/mqtt' },
    { kind: 'mqtt', url: 'wss://broker.hivemq.com:8884/mqtt' },
    { kind: 'mqtt', url: 'wss://test.mosquitto.org:8081/mqtt' },
  ];
  let chans = [];
  function sigClose() { for (const c of chans) try { c.close(); } catch (e) { } chans = []; onLate = null; openChans.gen = (openChans.gen || 0) + 1; }
  // one channel: open(onMsg) resolves once it's ready; send(msg); close()
  function peerjsChan(cfg, code, me, host) {
    let w = null, hb = null; const myId = host ? 'fablemon-room-' + code : 'fablemon-g-' + me;
    return {
      name: 'peerjs',
      open: onMsg => new Promise((res, rej) => {
        w = new WebSocket(`${cfg.url}?key=${cfg.key}&id=${encodeURIComponent(myId)}&token=${Math.random().toString(36).slice(2)}&version=1.5.4`);
        const t = setTimeout(() => rej(new Error('timeout')), 8000);
        w.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; }
          if (m.type === 'OPEN') { clearTimeout(t); hb = setInterval(() => w.readyState === 1 && w.send(JSON.stringify({ type: 'HEARTBEAT' })), 5000); res(); }
          else if (m.type === 'ID-TAKEN' || m.type === 'ERROR') { clearTimeout(t); rej(new Error(m.type === 'ID-TAKEN' ? 'taken' : 'error')); }
          else if ((m.type === 'OFFER' || m.type === 'ANSWER') && m.payload && m.payload.m) onMsg(m.payload.m); };
        w.onerror = () => { clearTimeout(t); rej(new Error('error')); };
      }),
      send: msg => { if (w && w.readyState === 1) w.send(JSON.stringify({ type: msg.k === 'offer' ? 'OFFER' : 'ANSWER', dst: msg.k === 'offer' ? 'fablemon-room-' + code : 'fablemon-g-' + msg.to, payload: { m: msg, type: 'data' } })); },
      close: () => { clearInterval(hb); if (w) { w.onclose = w.onmessage = null; try { w.close(); } catch (e) { } } },
    };
  }
  function mqttChan(cfg, code) {
    const te = new TextEncoder(), td = new TextDecoder(), topic = 'fablemon-link/v1/' + code;
    const str = s => { const b = te.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
    const pkt = (h, body) => { const len = []; let n = body.length; do { let d = n % 128; n = Math.floor(n / 128); if (n) d |= 128; len.push(d); } while (n); return new Uint8Array([h, ...len, ...body]); };
    let w = null, ping = null, buf = new Uint8Array(0);
    return {
      name: 'mqtt ' + cfg.url.split('/')[2],
      open: onMsg => new Promise((res, rej) => {
        w = new WebSocket(cfg.url, ['mqtt']); w.binaryType = 'arraybuffer';
        const t = setTimeout(() => rej(new Error('timeout')), 8000);
        w.onopen = () => w.send(pkt(0x10, [...str('MQTT'), 4, 2, 0, 60, ...str('fm' + Math.random().toString(36).slice(2, 14))]));
        w.onmessage = e => {
          const a = new Uint8Array(e.data), nb = new Uint8Array(buf.length + a.length); nb.set(buf); nb.set(a, buf.length); buf = nb;
          for (;;) {
            if (buf.length < 2) break; let len = 0, mul = 1, i = 1, d;
            do { if (i >= buf.length) return; d = buf[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128);
            if (buf.length < i + len) break; const head = buf[0], type = head >> 4, body = buf.slice(i, i + len); buf = buf.slice(i + len);
            if (type === 2) { if (body[1] !== 0) { clearTimeout(t); return rej(new Error('refused')); } w.send(pkt(0x82, [0, 1, ...str(topic), 0])); }
            else if (type === 9) { clearTimeout(t); ping = setInterval(() => w.readyState === 1 && w.send(new Uint8Array([0xC0, 0])), 30000); res(); }
            else if (type === 3) { const tl = (body[0] << 8) | body[1], off = 2 + tl + (((head >> 1) & 3) ? 2 : 0); try { onMsg(JSON.parse(td.decode(body.slice(off)))); } catch (x) { } }
          }
        };
        w.onerror = () => { clearTimeout(t); rej(new Error('error')); };
      }),
      send: msg => { if (w && w.readyState === 1) w.send(pkt(0x30, [...str(topic), ...te.encode(JSON.stringify(msg))])); },
      close: () => { clearInterval(ping); if (w) { w.onmessage = null; try { if (w.readyState === 1) w.send(new Uint8Array([0xE0, 0])); w.close(); } catch (e) { } } },
    };
  }
  // open every channel; resolves with the ones that came up (or throws if none did)
  let onLate = null;
  async function openChans(code, me, host, onMsg) {
    const list = SIGNALS().map(cfg => cfg.kind === 'peerjs' ? peerjsChan(cfg, code, me, host) : mqttChan(cfg, code));
    chans = []; const gen = openChans.gen = (openChans.gen || 0) + 1;
    // go as soon as one is ready (plus a moment for the others); any that come up later join in
    await new Promise((res, rej) => {
      let left = list.length, first = false;
      for (const c of list) c.open(m => onMsg(m, c)).then(() => {
        if (gen !== openChans.gen) return c.close();
        chans.push(c); if (onLate && first) onLate(c); if (!first) { first = true; setTimeout(res, 1200); }
      }, () => { try { c.close(); } catch (e) { } }).finally(() => { if (--left === 0) (first ? res : rej)(new Error('server')); });
    });
    return chans;
  }
  // The relay (25 Nov 2026): when the phones can't reach each other directly (two iPhones on the same home Wi-Fi
  // couldn't: routers often block it, and iPhones hide their local address), the link carries on through the
  // room's own channels instead. Each message goes out on every channel ({k:'d', f, to, q, m}) and the other phone
  // keeps the first copy of each. Slower than direct (about 0.1–0.3 s), fine for the hall, emotes and codes.
  function startRelay(me, other) {
    if (relay || direct()) return;
    relay = { me, other, q: 0, seen: new Set(), out: m => { const msg = { k: 'd', f: me, to: other, q: relay.q++, m }; for (const c of chans) c.send(msg); } };
    onLate = null; opened();
  }
  function relayIn(m, me) {
    if (!m || m.k !== 'd' || m.to !== me || !relay || m.f !== relay.other) return false;
    if (relay.seen.has(m.q)) return true; relay.seen.add(m.q); if (relay.seen.size > 400) relay.seen = new Set([...relay.seen].slice(-200));
    last = Date.now(); recv(m.m); return true;
  }
  // host: open a room and wait for a friend
  async function hostRoom(onCode) {
    reset(); const code = roomCode(), hid = 'h' + Math.random().toString(36).slice(2, 10); let guest = null;
    await openChans(code, null, true, async (m, ch) => {
      if (m && m.k === 'd' && m.to === hid && guest && m.f === guest) { if (!relay && !direct()) startRelay(hid, guest); relayIn(m, hid); return; }
      if (!m || m.k !== 'offer' || !m.sdp || !m.f) return;
      if (guest && guest !== m.f) return;   // someone already joined
      if (guest) { if (pc && pc.localDescription && pc.localDescription.type === 'answer') ch.send({ k: 'answer', f: hid, to: m.f, sdp: pc.localDescription.sdp }); return; }
      for (const c of chans) c.send({ k: 'here', f: hid, to: m.f });   // tell them straight away that the room is real
      guest = m.f; role = 'host';
      pc = mkPC(); pc.ondatachannel = e => { wire(e.channel); e.channel.addEventListener('open', sigClose); };
      await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
      await pc.setLocalDescription(await pc.createAnswer()); await gathered(pc);
      for (const c of chans) c.send({ k: 'answer', f: hid, to: guest, sdp: pc.localDescription.sdp });
      const fb = () => { if (guest && !direct() && pc) startRelay(hid, guest); };   // no direct link: carry on through the relay
      pc.addEventListener('iceconnectionstatechange', () => { if (pc && pc.iceConnectionState === 'failed') fb(); }); setTimeout(fb, 6000);
    });
    role = 'host'; onCode(code); return code;
  }
  // guest: join with the code
  async function joinRoom(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) throw new Error('code');
    reset(); role = 'guest'; const t0 = Date.now();
    const me = Math.random().toString(36).slice(2, 12);
    pc = mkPC(); const ch = pc.createDataChannel('fablemon', { ordered: true }); wire(ch); ch.addEventListener('open', sigClose);
    const offerP = pc.setLocalDescription(await pc.createOffer()).then(() => gathered(pc));
    let answered = false, here = false, hostId = null;
    await openChans(code, me, false, async m => {
      if (m && m.k === 'd' && m.to === me && hostId && m.f === hostId) { if (!relay && !direct()) startRelay(me, hostId); relayIn(m, me); return; }
      if (m && m.k === 'here' && m.to === me) { here = true; hostId = hostId || m.f; }
      if (!m || m.k !== 'answer' || m.to !== me || answered || !pc) return;
      answered = true; hostId = m.f || hostId; try { await pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); } catch (e) { answered = false; }
    });
    await offerP;
    const msg = { k: 'offer', f: me, sdp: pc.localDescription.sdp };
    for (const c of chans) c.send(msg); onLate = c => c.send(msg);
    const again = setInterval(() => { if (!answered) for (const c of chans) c.send(msg); }, 3000);   // in case the host's channel was a moment late
    return new Promise((res, rej) => {
      const t = setTimeout(() => { clearInterval(again); if (!st.on) { rej(new Error(answered || here ? 'blocked' : 'noroom')); reset(); } }, 25000);
      const t2 = setTimeout(() => { if (!here && !answered && !st.on) { clearTimeout(t); clearInterval(again); rej(new Error('noroom')); reset(); } }, Math.max(1500, 9000 - (Date.now() - t0)));   // nobody said "here" within 9 s of tapping Join
      ch.addEventListener('open', () => clearTimeout(t2));
      ch.addEventListener('open', () => { clearTimeout(t); clearInterval(again); res(); });
      // answered but no direct link (it failed, or 5 s passed): carry on through the relay (the host does the same)
      const fb = () => { clearInterval(again); if (direct() || relay) return; if (hostId) startRelay(me, hostId); else { clearTimeout(t); rej(new Error('blocked')); reset(); } };
      pc.addEventListener('iceconnectionstatechange', () => { if (pc && answered && pc.iceConnectionState === 'failed') fb(); });
      const chk = setInterval(() => { if (answered) { clearInterval(chk); setTimeout(fb, 5000); } }, 300);
      const ok = setInterval(() => { if (st.on) { clearInterval(ok); clearInterval(chk); clearTimeout(t); clearTimeout(t2); clearInterval(again); res(); } }, 250);
    });
  }
  const _reset = reset; reset = function () { _reset(); sigClose(); };
  return Object.assign(st, { hostRoom, joinRoom, cancelRoom: () => { sigClose(); if (!st.on) reset(); }, host, join, accept, send, bye, listen: f => onMsg.push(f), kindOf: c => (unpack(c) || {}).kind, _pack: pack, _unpack: unpack });
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
  openModal('Play with a friend', `<p>One of you hosts a room and gets a 6-letter code. The other joins with it.</p>
    <button class="btn gold" data-a="host" style="width:100%;margin:3px 0">📡 Host a room</button>
    <button class="btn gold" data-a="join" style="width:100%;margin:3px 0">🤝 Join with a code</button>
    <p style="font-size:12px;opacity:.7;margin:8px 0 2px">Can't connect? <a href="#" data-a="old" style="color:inherit">Link by QR code instead</a></p>
    <div class="row"><button class="btn" data-a="x">Not now</button></div>`, a => {
    if (a === 'host') return linkRoomHost(); if (a === 'join') return linkRoomJoin();
    if (a === 'old') return openModal('Link by QR code', `<p>The longer way: swap two codes by QR or text. Works without the room server.</p>
      <button class="btn gold" data-a="host" style="width:100%;margin:3px 0">📡 Host: show my code</button><button class="btn" data-a="join" style="width:100%;margin:3px 0">🤝 Join: my friend is hosting</button>
      <div class="row"><button class="btn" data-a="back">Back</button></div>`, b => b === 'host' ? linkHostFlow() : b === 'join' ? linkJoinFlow() : linkConnect());
    closeModal(); });
}
const linkRoomErr = e => ({ server: "Couldn't reach the room service. Check you're online, or use Link by QR code.", noroom: "No room with that code. Check it with your friend (they need to keep the Host screen open).", blocked: "Found the room, but the two phones couldn't reach each other. Try both on the same Wi-Fi, or one of you on mobile data.", code: 'Room codes are 6 letters and numbers.' }[e && e.message] || `Couldn't link (${(e && e.message) || e}).`);
async function linkRoomHost() {
  LINK_PANEL = true; let handoff = false;
  openModal('Host a room', '<p>Opening a room…</p>', null, () => { if (handoff) return; LINK_PANEL = false; if (!LinkNet.on) LinkNet.cancelRoom(); });
  try {
    await LinkNet.hostRoom(code => {
      if (!LINK_PANEL) return LinkNet.cancelRoom();
      handoff = true; const nice = code.slice(0, 3) + ' ' + code.slice(3);
      openModal('Host a room', `<p>Tell your friend this code. They tap <b>Play with a friend → Join with a code</b>.</p>
        <div style="text-align:center;font:900 40px/1.2 ui-monospace,monospace;letter-spacing:4px;color:#3a2a14;background:#fffaea;border:3px solid #5a3a1e;border-radius:12px;padding:10px 4px;margin:6px 0;user-select:all">${nice}</div>
        <p style="text-align:center;font-size:13px">⏳ Waiting for your friend… keep this open.</p>
        <div class="row">${navigator.share ? '<button class="btn" data-a="share">Share code</button>' : ''}<button class="btn" data-a="x">Cancel</button></div>`,
        a => { if (a === 'share') return navigator.share({ text: `Join my Fablemon room: ${code}` }).catch(() => { }); closeModal(); },
        () => { LINK_PANEL = false; if (!LinkNet.on) LinkNet.cancelRoom(); });
      LINK_PANEL = true;
    });
  } catch (e) { LINK_PANEL = false; openModal('Host a room', `<p>${linkRoomErr(e)}</p><div class="row"><button class="btn" data-a="b">Back</button></div>`, () => linkConnect()); }
}
function linkRoomJoin() {
  LINK_PANEL = true;
  openModal('Join with a code', `<p>Type the code from your friend's screen.</p>
    <input data-a="code" maxlength="7" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABC 123" style="width:100%;box-sizing:border-box;text-align:center;font:900 32px ui-monospace,monospace;letter-spacing:4px;text-transform:uppercase;padding:8px;border:3px solid #5a3a1e;border-radius:12px">
    <p id="lkMsg" style="font-size:13px;margin:4px 0;min-height:1.2em"></p>
    <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go">Join</button></div>`, async a => {
    if (a === 'back') { LINK_PANEL = false; return linkConnect(); }
    if (a !== 'go' || linkRoomJoin.busy) return;
    const v = document.querySelector('#mBody input').value; linkRoomJoin.busy = 1; linkMsg('🔗 Linking…');
    try { await LinkNet.joinRoom(v); } catch (e) { linkMsg('❌ ' + linkRoomErr(e)); }
    linkRoomJoin.busy = 0;
  }, () => { LINK_PANEL = false; });
  const inp = document.querySelector('#mBody input'); inp.focus();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') document.querySelector('#mBody [data-a=go]').click(); });
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

/* ============================================================ Meeting in the hall, live battles and live races (25 Nov 2026)
   - Walk up to your friend in the Link Hall and tap them (or face them and press Use): their card shows their team,
     Crests, Fablédex, records and your head-to-head, with buttons to challenge them to a battle or a race, offer a
     trade or wave. Each phone sends its card ({t:'card'}) when they link and whenever asked ({t:'card?'}).
   - Challenges: {t:'ch', k:'battle'|'race', cfg} → the friend accepts with their pick ({t:'ch.ok', ...}) or declines
     ({t:'ch.no'}) → the challenger starts and sends {t:'ch.go', ...}, which starts the friend too.
   - Battles: action battles in the chosen arena; both teams scaled to the chosen level (with their forms) by their
     own phones and sent across. Each phone runs its own Fablemon (rtbattle.js, live battle mode); the challenger
     starts at the bottom, the friend at the top.
   - Races: the same track and seed on both phones; each sends where it is ({t:'r.p'}) ten times a second and its
     time when it finishes ({t:'r.fin'}); fastest time wins. Results and a head-to-head count in S.link.h2h. */
const CREST_ORDER = [['root', '🌱'], ['brook', '💧'], ['stone', '🪨'], ['spark', '⚡'], ['gale', '🌬️'], ['wild', '🐾'], ['shade', '🌙'], ['hearth', '🔥']];
function myCard() {
  const L = lk(), g = S.gauntlet || {};
  return { t: 'card', n: S.name || 'Friend', day: S.day || 1, cr: CREST_ORDER.filter(([k]) => S.crests && S.crests[k]).map(([k]) => k), dex: Object.keys(S.caught || {}).length,
    team: team().slice(0, 6).map(m => ({ sp: m.sp, lv: m.lv, nk: m.nick || '', fab: m.fab ? 1 : 0 })), lw: L.wins || 0, ll: L.losses || 0, gb: g.best || 0, gm: g.medal ? 1 : 0, gw: L.ghostWins || 0 };
}
LinkNet.listen(m => {
  if (m.t === 'hello') LinkNet.send(myCard());
  else if (m.t === 'card') { if (LinkNet.peer) LinkNet.peer.card = m; if (linkCardOpen) friendCard(); }
  else if (m.t === 'card?') LinkNet.send(myCard());
  else if (m.t === 'ch') challenged(m);
  else if (m.t === 'ch.no') { if (LINK_CH && !LINK_CH.started) { LINK_CH = null; closeModal(); toast(`${LinkNet.peer ? LinkNet.peer.n : 'Your friend'} said not right now.`, 2600); } }
  else if (m.t === 'ch.ok') challengeOk(m);
  else if (m.t === 'ch.go') challengeGo(m);
  else if (m.t === 'ch.x') { if (LINK_CH && !LINK_CH.started) { LINK_CH = null; closeModal(); toast('They called off the challenge.', 2200); } }
  else if (/^b\./.test(m.t)) RTB.netIn(m);
  else if (m.t === 'r.p' || m.t === 'r.fin') linkRaceIn(m);
  if (m.t === 'bye') { RTB.netGone && RTB.netGone(); linkRaceIn({ t: 'r.gone' }); }
});
let linkCardOpen = false;
const h2h = n => { const L = lk(); L.h2h = L.h2h || {}; return L.h2h[n] = L.h2h[n] || { bw: 0, bl: 0, rw: 0, rl: 0 }; };
function friendCard() {
  const P = LinkNet.peer; if (!P) return toast('Not linked any more.');
  const c = P.card; linkCardOpen = true;
  if (!c) { LinkNet.send({ t: 'card?' }); return openModal(P.n, '<p>Asking for their card…</p>', null, () => linkCardOpen = false); }
  const H = h2h(P.n), mons = c.team.filter(m => SPECIES[m.sp]);
  openModal(`🔗 ${c.n}`, `<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:2px 0 8px">${mons.map(m => `<div style="text-align:center;width:58px;font-size:11px;line-height:1.15"><img src="${monPicOf({ sp: m.sp, fab: m.fab })}" style="width:44px;height:44px;image-rendering:pixelated;display:block;margin:0 auto">${(m.nk || SPECIES[m.sp].name).replace(/</g, '&lt;')}<br><b>Lv ${m.lv}</b></div>`).join('') || '<small>No team with them.</small>'}</div>
    <p style="margin:2px 0;text-align:center;font-size:20px;letter-spacing:2px">${CREST_ORDER.map(([k, e]) => `<span style="opacity:${c.cr.includes(k) ? 1 : .18}">${e}</span>`).join('')}</p>
    <p style="margin:4px 0;font-size:13px;text-align:center">Day ${c.day} · ${c.cr.length} Crest${c.cr.length === 1 ? '' : 's'} · ${c.dex} Fablemon befriended<br>Hall battles ${c.lw} won · Gauntlet ${c.gb ? `best ${c.gb}/8${c.gm ? ' 🏅' : ''}` : 'not tried'} · ${c.gw} ghosts beaten</p>
    <p style="margin:6px 0;font-size:13px;text-align:center"><b>You vs ${c.n.replace(/</g, '&lt;')}:</b> battles ${H.bw}–${H.bl} · races ${H.rw}–${H.rl}</p>
    <button class="btn gold" data-a="battle" style="width:100%;margin:3px 0">⚔️ Challenge to a battle</button>
    <button class="btn gold" data-a="race" style="width:100%;margin:3px 0">🏁 Challenge to a race</button>
    <div class="row"><button class="btn" data-a="trade">🔁 Offer a trade</button><button class="btn" data-a="wave">👋 Wave</button></div>`, a => {
    if (a === 'battle') return linkChallengeSetup('battle');
    if (a === 'race') return linkChallengeSetup('race');
    if (a === 'trade') { linkCardOpen = false; return linkOffer(); }
    if (a === 'wave') { linkCardOpen = false; closeModal(); if (scene && scene.scene.key === 'linkhall') linkBubble(scene, scene.player, 0); LinkNet.send({ t: 'emo', i: 0 }); }
  }, () => linkCardOpen = false);
}
// tapping your friend, or facing them and pressing Use
{
  const near = sc => sc.friend && sc.player && Math.hypot(sc.friend.x - sc.player.x, sc.friend.y - sc.player.y) < 34;
  const _tap = LinkHallScene.prototype.onTap;
  LinkHallScene.prototype.onTap = function (wx, wy) {
    if (this.friend && !this.paused && this.friend.getBounds().contains(wx, wy)) {
      if (near(this)) return friendCard();
      const fx = Math.floor(this.friend.x / T), fy = Math.floor((this.friend.y - 1) / T), path = this.path((x, y) => Math.abs(x - fx) + Math.abs(y - fy) === 1);
      if (path) { this.p.path = path; this.p.pending = { type: 'friend' }; } return;
    }
    return _tap.call(this, wx, wy);
  };
  const _act = LinkHallScene.prototype.act;
  LinkHallScene.prototype.act = function (t) { if (t && t.type === 'friend') return near(this) ? friendCard() : null; return _act.call(this, t); };
  const _af = LinkHallScene.prototype.actFacing;
  LinkHallScene.prototype.actFacing = function () {
    const p = this.p; if (this.friend && !p.moving && !this.paused && near(this)) { const [dx, dy] = DV[p.dir], fx = this.friend.x - this.player.x, fy = this.friend.y - this.player.y; if (dx * fx + dy * fy > 4) return friendCard(); }
    return _af.call(this);
  };
}

// ---------- challenges
let LINK_CH = null;   // { k, cfg, mine, role: 'from'|'to', started }
function linkChallengeSetup(k) {
  linkCardOpen = false; const P = LinkNet.peer; if (!P) return;
  const C = lk()[k === 'battle' ? 'lbcfg' : 'lrcfg'] = Object.assign(k === 'battle' ? { arena: 'Link', lv: 50, size: 3 } : { track: linkTracks()[0] || 'meadow', cap: 100 }, lk()[k === 'battle' ? 'lbcfg' : 'lrcfg']);
  const all = S.mons.slice().filter(m => k === 'battle' || !SPECIES[m.sp].legend).sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
  let pick = (C.team || []).filter(u => all.some(m => m.uid === u)); if (!pick.length) pick = all.filter(m => m.loc === 'team').map(m => m.uid);
  if (k === 'race') { if (!linkTracks().includes(C.track)) C.track = linkTracks()[0] || 'meadow'; }
  const chip = (key, v, t) => `<button class="btn ${C[key] === v ? 'gold' : ''}" data-a="o" data-k="${key}" data-v="${v}" style="flex:1 1 auto;padding:4px 6px;font-size:12px;margin:2px">${t}</button>`;
  const draw = () => {
    const size = k === 'battle' ? C.size : 1; pick = pick.slice(0, size);
    const opts = k === 'battle'
      ? `<p style="margin:2px 0"><b>Arena</b></p><div style="display:flex;flex-wrap:wrap">${linkArenas().map(([n]) => chip('arena', n, n === 'Link' ? 'Link Hall' : ARENAS[n].title)).join('')}</div>
         <p style="margin:6px 0 2px"><b>Level</b> <small>(both teams grow or shrink to it, evolutions too)</small></p><div style="display:flex;flex-wrap:wrap">${chip('lv', 0, 'Own levels')}${[25, 50, 75, 100].map(v => chip('lv', v, 'Lv ' + v)).join('')}</div>
         <p style="margin:6px 0 2px"><b>Team size</b></p><div style="display:flex;flex-wrap:wrap">${[1, 3, 6].map(v => chip('size', v, v + ' each')).join('')}</div>`
      : `<p style="margin:2px 0"><b>Track</b></p><div style="display:flex;flex-wrap:wrap">${linkTracks().map(t => chip('track', t, DERBY_TRACKS[t].name)).join('')}</div>
         <p style="margin:6px 0 2px"><b>Level</b> <small>(both racers grow or shrink to it, evolutions too)</small></p><div style="display:flex;flex-wrap:wrap">${LINK_CAPS.map(([v, t]) => chip('cap', v, t)).join('')}</div>`;
    openModal(k === 'battle' ? `Battle ${P.n}` : `Race ${P.n}`, `${opts}<p style="margin:6px 0 2px"><b>${k === 'battle' ? 'Your team' : 'Your racer'}</b> ${pick.length}/${size}</p>
      <div style="max-height:26vh;overflow:auto">${all.map(m => { const i = pick.indexOf(m.uid); return linkRow(m, i >= 0 ? (size > 1 ? `#${i + 1}` : '✓') + (k === 'battle' && C.lv ? ` → ${SPECIES[linkFormAt(m.sp, C.lv)].name} Lv ${C.lv}` : k === 'race' ? linkLvTag(m, C.cap) : '') : '', 0, k === 'race' ? linkSpdTag(m, C.cap) : ''); }).join('')}</div>
      <div class="row"><button class="btn" data-a="back">Back</button><button class="btn gold" data-a="go" ${pick.length ? '' : 'disabled'}>Send challenge</button></div>`, (a, d) => {
      if (a === 'o') { C[d.k] = ['lv', 'size', 'cap'].includes(d.k) ? +d.v : d.v; return draw(); }
      if (a === 't') { const u = linkUid(d.u), i = pick.indexOf(u); if (i >= 0) pick.splice(i, 1); else if (pick.length < size) pick.push(u); else { pick.pop(); pick.push(u); } C.team = pick.slice(); return draw(); }
      if (a === 'back') return friendCard();
      if (a === 'go' && pick.length && LinkNet.on) {
        C.team = pick.slice(); const mine = pick.map(u => all.find(m => m.uid === u));
        const cfg = k === 'battle' ? { arena: C.arena, lv: C.lv, size: C.size } : { track: C.track, cap: C.cap, seed: (Math.random() * 1e9) | 0 };
        LINK_CH = { k, cfg, mine, role: 'from' }; LinkNet.send({ t: 'ch', k, cfg });
        openModal('Challenge sent', `<p>⏳ Waiting for ${P.n} to accept…</p><div class="row"><button class="btn" data-a="x">Call it off</button></div>`, () => { LinkNet.send({ t: 'ch.x' }); LINK_CH = null; closeModal(); }, () => { if (LINK_CH && !LINK_CH.started && LINK_CH.role === 'from') { LinkNet.send({ t: 'ch.x' }); LINK_CH = null; } });
      }
    });
  };
  draw();
}
const chDesc = (k, c) => k === 'battle' ? `${c.arena === 'Link' ? 'the Link Hall' : (ARENAS[c.arena] || {}).title || c.arena} · ${c.lv ? 'Lv ' + c.lv : 'own levels'} · ${c.size} each` : `${(DERBY_TRACKS[c.track] || {}).name || c.track}${c.cap < 100 ? ` · Lv ${c.cap}` : ' · own levels'}`;
function challenged(m) {
  const P = LinkNet.peer; if (!P || (m.k !== 'battle' && m.k !== 'race')) return;
  if (RTB.active || (LINK_CH && LINK_CH.started) || (m.k === 'race' && !DERBY_TRACKS[m.cfg.track]) || (m.k === 'battle' && !(ARENAS[m.cfg.arena] && ASSET['arena_' + ARENAS[m.cfg.arena].k]))) return LinkNet.send({ t: 'ch.no' });
  Sound.play('pop'); LINK_CH = { k: m.k, cfg: m.cfg, role: 'to' };
  openModal(m.k === 'battle' ? '⚔️ A challenge!' : '🏁 A race!', `<p><b>${P.n}</b> challenges you to a ${m.k}: ${chDesc(m.k, m.cfg)}.</p><div class="row"><button class="btn" data-a="no">Not now</button><button class="btn gold" data-a="yes">Accept</button></div>`, a => {
    if (a !== 'yes') { LinkNet.send({ t: 'ch.no' }); LINK_CH = null; return closeModal(); }
    const size = m.k === 'battle' ? m.cfg.size : 1, all = S.mons.slice().filter(q => m.k === 'battle' || !SPECIES[q.sp].legend).sort((a, b) => (a.loc === 'team' ? 0 : 1) - (b.loc === 'team' ? 0 : 1) || b.lv - a.lv);
    let pick = all.filter(q => q.loc === 'team').slice(0, size).map(q => q.uid);
    const draw = () => openModal(m.k === 'battle' ? 'Pick your team' : 'Pick your racer', `<p style="font-size:13px">${chDesc(m.k, m.cfg)}</p><p style="margin:4px 0 2px"><b>${pick.length}/${size}</b></p>
      <div style="max-height:40vh;overflow:auto">${all.map(q => { const i = pick.indexOf(q.uid); return linkRow(q, i >= 0 ? (size > 1 ? `#${i + 1}` : '✓') + (m.k === 'battle' && m.cfg.lv ? ` → ${SPECIES[linkFormAt(q.sp, m.cfg.lv)].name} Lv ${m.cfg.lv}` : m.k === 'race' ? linkLvTag(q, m.cfg.cap) : '') : '', 0, m.k === 'race' ? linkSpdTag(q, m.cfg.cap) : ''); }).join('')}</div>
      <div class="row"><button class="btn" data-a="no">Back out</button><button class="btn gold" data-a="go" ${pick.length ? '' : 'disabled'}>Ready!</button></div>`, (b, d) => {
      if (b === 't') { const u = linkUid(d.u), i = pick.indexOf(u); if (i >= 0) pick.splice(i, 1); else if (pick.length < size) pick.push(u); else { pick.pop(); pick.push(u); } return draw(); }
      if (b === 'no') { LinkNet.send({ t: 'ch.no' }); LINK_CH = null; return closeModal(); }
      if (b === 'go' && pick.length) {
        const mine = pick.map(u => all.find(q => q.uid === u)); LINK_CH.mine = mine;
        if (m.k === 'battle') { LINK_CH.myTeam = linkBattleTeam(mine, m.cfg, 'g'); LinkNet.send({ t: 'ch.ok', team: LINK_CH.myTeam }); }
        else LinkNet.send({ t: 'ch.ok', racer: { sp: linkRacer(mine[0], m.cfg.cap).sp, nk: mine[0].nick || '' } });
        openModal('Ready!', `<p>⏳ Starting…</p>`);
      }
    });
    draw();
  });
}
const linkBattleTeam = (mine, cfg, tag) => mine.slice(0, cfg.size).map((m, i) => linkScale(m, cfg.lv, tag + i));
function challengeOk(m) {
  const C = LINK_CH; if (!C || C.role !== 'from' || C.started) return;
  C.started = true; closeModal();
  if (C.k === 'battle') {
    const theirs = (m.team || []).filter(q => q && SPECIES[q.sp]).slice(0, C.cfg.size).map(q => Object.assign(q, { hp: monStat(q, 'hp'), moves: (q.moves || []).filter(id => MOVES[id]) }));
    if (!theirs.length) return toast("Their team didn't come through. Try again.");
    C.myTeam = linkBattleTeam(C.mine, C.cfg, 'h'); LinkNet.send({ t: 'ch.go', team: C.myTeam });
    linkLiveBattle(C.myTeam, theirs, C.cfg, false);
  } else {
    LinkNet.send({ t: 'ch.go', racer: { sp: linkRacer(C.mine[0], C.cfg.cap).sp, nk: C.mine[0].nick || '' } });
    linkLiveRace(C.mine[0], m.racer, C.cfg);
  }
}
function challengeGo(m) {
  const C = LINK_CH; if (!C || C.role !== 'to' || C.started) return;
  C.started = true; closeModal();
  if (C.k === 'battle') {
    const theirs = (m.team || []).filter(q => q && SPECIES[q.sp]).map(q => Object.assign(q, { hp: monStat(q, 'hp'), moves: (q.moves || []).filter(id => MOVES[id]) }));
    linkLiveBattle(C.myTeam, theirs, C.cfg, true);
  } else linkLiveRace(C.mine[0], m.racer, C.cfg);
}

// ---------- a live battle
function linkLiveBattle(mine, theirs, cfg, flip) {
  const P = LinkNet.peer, n = P ? P.n : 'Friend', A = ARENAS[cfg.arena] || ARENAS.Link;
  for (const q of mine) { q.hp = monStat(q, 'hp'); q.status = null; }
  const T = { label: '', name: n, team: theirs, prize: 0, live: 1, intro: [`A live battle with ${n}!`, `${n} sent out ${monName(theirs[0])}!`] };
  const p = scene.p; S.arenaRet = { scene: scene.scene.key, x: p.x, y: p.y, dir: p.dir };
  ARENA_GO = { foe: theirs[0], T, A, win: null, hold: 1, rt: { myTeam: mine, noItems: true, net: { send: msg => LinkNet.send(msg), flip, name: n }, onEnd: out => linkLiveBattleEnd(out, n) } };
  scene.paused = true; Sound.play('encounter'); const fl = $('flash'); fl.style.opacity = .9; setTimeout(() => fl.style.opacity = 0, 140);
  setTimeout(() => travel(scene, 'arena', { x: 16, y: 40, dir: 'up' }), 260);
}
function linkLiveBattleEnd(out, n) {
  LINK_CH = null; const H = h2h(n), won = out === 'win';
  if (out === 'win') H.bw++; else if (out === 'lose') H.bl++;
  if (won) Sound.victory && Sound.victory();
  const home = () => { const sc = scene; if (sc && sc.scene.key === 'arena' && sc.g) { sc.g.hold = 0; sc.leave(); } };
  setTimeout(() => openModal(won ? 'You won!' : out === 'lose' ? 'You lost!' : 'Battle called off', `<p>${won ? `You beat ${n}!` : out === 'lose' ? `${n} won this one.` : 'The link dropped, so nobody wins this one.'}</p><p style="font-size:13px">You vs ${n}: battles <b>${H.bw}–${H.bl}</b></p><div class="row"><button class="btn gold" data-a="ok">Back to the hall</button></div>`, () => closeModal(), home), won ? 900 : 500);
}

// ---------- a live race
let LINK_RACE = null;   // { pos, fin, gone }
function linkRaceIn(m) {
  const R = LINK_RACE; if (!R) return;
  if (m.t === 'r.p') R.pos = { x: m.x, y: m.y };
  else if (m.t === 'r.fin') { R.fin = m.ms; if (R.ghost) R.ghost.done = 1; if (R.onFin) R.onFin(); }
  else if (m.t === 'r.gone') { R.gone = 1; if (R.onFin) R.onFin(); }
}
async function linkLiveRace(mine, racer, cfg) {
  const P = LinkNet.peer, n = P ? P.n : 'Friend';
  if (!racer || !SPECIES[racer.sp] || !DERBY_TRACKS[cfg.track]) { LINK_CH = null; return toast("That race couldn't start. Try again."); }
  const R = LINK_RACE = { pos: null, fin: null }, rec = {}; let sent = 0;
  const live = R.ghost = { who: n, sp: racer.sp, pos: () => R.pos };
  const res = await derbyRace({ id: 'link', track: cfg.track, cap: 100 }, linkRacer(mine, cfg.cap), [], 1, { trial: 1, seed: cfg.seed | 0, rec, live,
    tick: (me, clock) => { const now = performance.now(); if (now - sent > 100) { sent = now; LinkNet.send({ t: 'r.p', x: Math.round(me.x), y: Math.round(me.y) }); } } });
  LINK_CH = null;
  if (!res || !rec.ms) { LinkNet.send({ t: 'r.fin', ms: 0 }); LINK_RACE = null; return; }   // you left the race
  LinkNet.send({ t: 'r.fin', ms: rec.ms });
  const show = () => {
    if (LINK_RACE !== R) return; LINK_RACE = null;
    const H = h2h(n), theirs = R.fin, won = !theirs || rec.ms < theirs;
    if (theirs) { if (won) H.rw++; else H.rl++; }
    Sound.play(won ? 'levelup' : 'pop');
    openModal(won ? '🏁 You won the race!' : `🏁 ${n} won the race`, `<p>You: <b>${fmtLap(rec.ms)}</b><br>${n}: <b>${theirs ? fmtLap(theirs) : R.gone ? 'link dropped' : "didn't finish"}</b>${theirs ? `<br><small>${won ? 'Ahead' : 'Behind'} by ${(Math.abs(theirs - rec.ms) / 1000).toFixed(2)}s</small>` : ''}</p><p style="font-size:13px">You vs ${n}: races <b>${H.rw}–${H.rl}</b></p><div class="row"><button class="btn gold" data-a="ok">Nice</button></div>`, () => closeModal());
  };
  if (R.fin != null || R.gone) return show();
  openModal('🏁 Finished!', `<p>Your time: <b>${fmtLap(rec.ms)}</b>.</p><p>⏳ Waiting for ${n} to finish…</p>`);
  R.onFin = show; setTimeout(show, 45000);
}
