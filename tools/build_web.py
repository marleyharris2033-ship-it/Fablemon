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
open(os.path.join(DOCS, 'downloads', 'Fablemon_Wild_Roots.html'), 'w').write(single)
with zipfile.ZipFile(os.path.join(DOCS, 'downloads', 'Fablemon_itch.zip'), 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z: z.writestr('index.html', single)
# the installable web app: same game plus a manifest, icons and a service worker
version = time.strftime('%Y%m%d-%H%M%S')
head = f'''<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Fablemon">
<meta name="theme-color" content="#1f2a1e">
<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js?v={version}').catch(() => {{}}));</script>
'''
app = single.replace('</head>', head + '</head>', 1)
open(os.path.join(DOCS, 'index.html'), 'w').write(app)
icon = Image.open(os.path.join(HERE, 'icon_source.png')).convert('RGB')
for s in (180, 192, 512): icon.resize((s, s), Image.LANCZOS if s < 512 else Image.NEAREST).save(os.path.join(DOCS, f'icon-{s}.png'))
json.dump({'name': 'Fablemon: Wild Roots', 'short_name': 'Fablemon', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'any',
           'background_color': '#1f2a1e', 'theme_color': '#1f2a1e',
           'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'}]},
          open(os.path.join(DOCS, 'manifest.webmanifest'), 'w'), indent=1)
open(os.path.join(DOCS, 'sw.js'), 'w').write(f'''// Fablemon offline cache, build {version}. Network first, so players always get the newest version when online.
const CACHE = 'fablemon-{version}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {{ if (r.ok) {{ const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }} return r; }})
    .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
}});
''')
open(os.path.join(DOCS, '.nojekyll'), 'w').write('')
print('built', version, round(len(app) / 1048576, 1), 'MB')
