# Third-form art (waiting to go in)

These are the original sheets for the third forms. **They're in the game now** (added 5 Nov 2026). `tools/art/cut_thirds.py` cuts them into the sprites in `src/`, and the species data is in `src/thirds.js`.

Walk sheets are 4 rows: front, facing left, facing right, back. Each row has 4 frames, except Plumevix, which has 3.
Battle sheets show the front on the left and the back on the right. Some sheets have a magenta background that needs removing. The walk sheets that came in transparent are ready to use.

| Name | Evolves from | Code id now | Walk sheet | Battle sheet |
|---|---|---|---|---|
| Hedgerholt | Briamble | hedgerholt | hedgerholt_walk.png | battle_shared_hedgerholt-hearthrusk-merewheel.png (row 1) |
| Hearthrusk | Kilnook | hearthrusk | hearthrusk_walk.png | battle_shared_hedgerholt-hearthrusk-merewheel.png (row 2) |
| Merewheel | Weirlet | merewheel | merewheel_walk.png | battle_shared_hedgerholt-hearthrusk-merewheel.png (row 3) |
| Plumevix | Fleecebolt | — (new) | plumevix_walk.png | plumevix_battle.png |
| Whorlcrest | Whirlwyn | — (new) | whorlcrest_walk.png | battle_shared_whorlcrest-flintcairn-moonspark.png (row 1) |
| Cloverlegion | Cloverguard | — (new) | cloverlegion_walk.png | cloverlegion_battle.png |
| Flintcairn | Flintburrow | — (new) | flintcairn_walk.png | battle_shared_whorlcrest-flintcairn-moonspark.png (row 2) |
| Moonspark | Staticwing | — (new) | moonspark_walk.png | battle_shared_whorlcrest-flintcairn-moonspark.png (row 3) |
| Duskwyrm | Duskcloak | — (new) | duskwyrm_walk.png | duskwyrm_battle.png |
| Torrentail | Brookstride | — (new) | torrentail_walk.png | torrentail_battle.png |
| Deepfarer (Reed Form) | Reefarer (Reed Form) | reefarer_3 | deepfarer_walk.png | battle_shared_deepfarer-reed-cotton.png (row 1) |
| Deepfarer (Cotton Form) | Reefarer (Cotton Form) | reefarer_cotton_3 | deepfarer_cotton_walk.png | battle_shared_deepfarer-reed-cotton.png (row 2) |
| Mirelure | Mirebellows | mirebellows_3 | mirelure_walk.png | mirelure_battle.png |
| Lotmancer | Lotveil | lotveil_3 | lotmancer_walk.png | lotmancer_battle.png |
| Slumberdew | Yawnox | yawnox_3 | slumberdew_walk.png | slumberdew_battle.png |
| Pitchfiend | Brimbramble | brimbramble_3 | pitchfiend_walk.png | pitchfiend_battle.png |
| Stormcrown | Stormveil | stormveil_3 | stormcrown_walk.png | stormcrown_battle.png |
| Grimbark | Hollowbark | hollowbark_3 | grimbark_walk.png | grimbark_battle.png |
| Blazejack | Cinderhare | cindhop_3 | blazejack_walk.png | blazejack_battle.png |
| Pinewarden | Bristlestag | bristlecone_3 | pinewarden_walk.png | pinewarden_battle.png |
| Belfrock | Chimestone | clinkit_3 | belfrock_walk.png | belfrock_battle.png |
| Shardgryph | Cragryph | craglet_3 | shardgryph_walk.png | shardgryph_battle.png |

## Evolution levels
- Starters: Hedgerholt, Hearthrusk and Merewheel at 36 (already set in the game code).
- Meadow lines (new): Cloverguard → Cloverlegion at 34, Whirlwyn → Whorlcrest at 35, Fleecebolt → Plumevix at 36, Brookstride → Torrentail at 36, Flintburrow → Flintcairn at 36, Staticwing → Moonspark at 37, Duskcloak → Duskwyrm at 40.
- Bog: all at 38 (already set). Crag: Bristlestag 42, Cinderhare 44, Cragryph 46, Chimestone 48 (already set).

## Notes
- Plumevix's walk sheet has 3 frames per row, so the game loops them (stand, step, stand, other step).
