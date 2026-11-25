"""Build the web versions of Fablemon: Wild Roots.

    cd tools && python3 build_web.py

Makes:
  docs/index.html              the installable web app GitHub Pages serves (works offline)
  docs/manifest.webmanifest    app name, colours and icons for "Add to Home Screen"
  docs/sw.js                   offline cache (always fetches the newest version when online)
  docs/icon-*.png              app icons
  docs/downloads/Fablemon_Wild_Roots.html   the whole game in one file
  docs/downloads/Fablemon_itch.zip          upload this to itch.io (kind: HTML, played in the browser)
"""
import os, subprocess, zipfile, json, time
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'src'); DOCS = os.path.join(HERE, '..', 'docs')
os.makedirs(os.path.join(DOCS, 'downloads'), exist_ok=True)
tmp = os.path.join(HERE, '_build.html')
subprocess.run(['python3', 'build.py', 'PHASER_INLINE', tmp], cwd=SRC, check=True)
html = open(tmp).read(); os.remove(tmp)
phaser = open(os.path.join(SRC, 'vendor', 'phaser.min.js')).read().replace('</script>', '<\\/script>')
tag = '<script src="PHASER_INLINE"></script>'; assert tag in html
single = html.replace(tag, '<script>' + phaser + '</script>')
# safety check: refuse to publish a build whose scripts don't parse (needs Node; skipped if it isn't installed)
import re, shutil, tempfile
if shutil.which('node'):
    js = '\n;\n'.join(re.findall(r'<script>([\s\S]*?)</script>', html))
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f: f.write(js)
    r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.remove(f.name)
    if r.returncode: raise SystemExit('Build stopped: the game code has a syntax error.\n' + r.stderr[-1500:])
open(os.path.join(DOCS, 'downloads', 'Fablemon_Wild_Roots.html'), 'w').write(single)
# 23 Nov 2026: the web app and itch get the game with its art as separate files (docs/a/), so a phone only fetches and
# holds what it needs. The one-file download above stays whole, for playing offline from a file.
try: PREV = set(json.load(open(os.path.join(DOCS, 'a', 'files.json'))))   # the last build's art: kept a while, for phones still running it
except Exception: PREV = set()
subprocess.run(['python3', 'build.py', 'PHASER_INLINE', tmp], cwd=SRC, check=True, env={**os.environ, 'FABLE_ASSETS': DOCS})
split = open(tmp).read().replace(tag, '<script>' + phaser + '</script>'); os.remove(tmp)
ART = json.load(open(os.path.join(DOCS, 'a', 'files.json')))
for f in os.listdir(os.path.join(DOCS, 'a')):   # art no longer used (by this build or the one before it)
    if f != 'files.json' and 'a/' + f not in ART and 'a/' + f not in PREV: os.remove(os.path.join(DOCS, 'a', f))
with zipfile.ZipFile(os.path.join(DOCS, 'downloads', 'Fablemon_itch.zip'), 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.writestr('index.html', split)
    for f in ART: z.write(os.path.join(DOCS, f), f, compress_type=zipfile.ZIP_STORED)   # already compressed pictures
# the installable web app: same game plus a manifest, icons and a service worker
version = time.strftime('%Y%m%d-%H%M%S')
head = f'''<link rel="manifest" href="manifest.webmanifest?v={version}">
<link rel="apple-touch-icon" href="icon-180.png?v={version}">
<link rel="icon" type="image/png" href="icon-192.png?v={version}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Fablemon">
<meta name="theme-color" content="#1f2a1e">
<script>if ('serviceWorker' in navigator) {{ addEventListener('load', () => navigator.serviceWorker.register('sw.js?v={version}').catch(() => {{}}));
  // a new version took over: on the title screen, load it now; mid-game, leave it for next time
  let had = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => {{ if (!had) {{ had = true; return; }} if (typeof S === 'undefined' || !S) location.reload(); }}); }}</script>
'''
app = split.replace('</head>', head + '</head>', 1)
open(os.path.join(DOCS, 'index.html'), 'w').write(app)
icon = Image.open(os.path.join(HERE, 'icon_source.png')).convert('RGB')
for s in (180, 192, 512): icon.resize((s, s), Image.LANCZOS).save(os.path.join(DOCS, f'icon-{s}.png'))
json.dump({'name': 'Fablemon: Wild Roots', 'short_name': 'Fablemon', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'any',
           'background_color': '#1f2a1e', 'theme_color': '#1f2a1e',
           'icons': [{'src': f'icon-192.png?v={version}', 'sizes': '192x192', 'type': 'image/png'}, {'src': f'icon-512.png?v={version}', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'}]},
          open(os.path.join(DOCS, 'manifest.webmanifest'), 'w'), indent=1)
open(os.path.join(DOCS, 'sw.js'), 'w').write(f'''// Fablemon offline cache, build {version}. The page: network first, so players always get the newest version.
// The art (a/, named by content so a file never changes): kept in its own cache across updates, fetched once.
const CACHE = 'fablemon-{version}', ART = 'fablemon-art';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); }});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== ART).map(k => caches.delete(k))))); self.clients.claim();
  // tidy art that neither this version nor the one before uses (a game still open may be the one before),
  // then quietly fetch the rest so the game also works offline
  fetch('a/files.json', {{ cache: 'no-store' }}).then(r => r.json()).then(async list => {{
    const c = await caches.open(ART), abs = f => new URL(f, self.registration.scope).href, want = new Set(list.map(abs)), PREV = abs('a/prev-list.json');
    const old = await c.match(PREV).then(r => r ? r.json() : []).catch(() => []), keep = new Set([...want, ...old.map(abs), PREV]);
    for (const q of await c.keys()) if (!keep.has(q.url)) await c.delete(q);
    await c.put(PREV, new Response(JSON.stringify(list), {{ headers: {{ 'Content-Type': 'application/json' }} }}));
    for (const u of want) if (!(await c.match(u))) {{ try {{ const r = await fetch(u); if (r.ok) await c.put(u, r); }} catch (err) {{ return; }} }}
  }}).catch(() => {{}});
}});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (new URL(e.request.url).pathname.includes('/a/')) {{
    e.respondWith(caches.open(ART).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => {{ if (r.ok) c.put(e.request, r.clone()); return r; }}))));
    return;
  }}
  e.respondWith(fetch(e.request).then(r => {{ if (r.ok) {{ const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }} return r; }})
    .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
}});
''')
open(os.path.join(DOCS, '.nojekyll'), 'w').write('')
print('built', version, round(len(app) / 1048576, 1), 'MB')
