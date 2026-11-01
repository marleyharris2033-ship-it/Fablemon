# Fablemon: Wild Roots

A cosy farming and creature-collecting adventure. Restore an overgrown farm, bring the sleepy town of Smallroot back to life, befriend wild Fablemon across meadows and misty bogs, and challenge the Wardens for their Crests.

**Play:** https://marleyharris2033-ship-it.github.io/Fablemon/

On iPhone, open the link in Safari, tap **Share → Add to Home Screen**, and Fablemon installs like an app with its own icon. It runs full screen and works offline after the first visit.

## Saves

Saves live on the device and browser you play on. A Home Screen copy keeps its own saves, separate from Safari's. To keep a save safe or move it between devices, use **Menu → Back up to a file**: copy the save code or download the file, then restore it with **Load game** on the title screen.

## What's in here

| Folder | Contents |
|---|---|
| `src/` | The game: code (`game.js`, `villagers.js`, `hearth.js`, `moves.js`, `brookholt.js`, `social.js`), the page template, and all the art |
| `docs/` | The built web app GitHub Pages serves, plus ready-made downloads |
| `docs/downloads/` | `Fablemon_Wild_Roots.html` (the whole game in one file) and `Fablemon_itch.zip` (upload to itch.io) |
| `tools/` | `build_web.py` (builds `docs/`), and the generators for the menu root frames and wetland crop art |

## Building

Needs Python 3 with Pillow.

```
cd tools
python3 build_web.py
```

This rebuilds everything in `docs/`. Commit and push, and GitHub Pages updates within a minute or two.

To update itch.io, upload `docs/downloads/Fablemon_itch.zip` (kind: HTML, *played in the browser*) and delete the old file. Players keep their saves.

## Credits

Game engine: [Phaser](https://phaser.io) 4 (MIT licence). Art was made with ChatGPT image generation and edited for the game; code written with Claude.
