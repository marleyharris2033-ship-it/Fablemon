"""Elderwood people (sent 17 Nov 2026, art_incoming/ewchars) -> tr_<kind>.png, hd_world/tr_<kind>.webp, hd/port_<kind>_<0|1>.webp.
Same layout as the Verdance pack (4x4 walk sheets, step/stand/step/stand; two portraits side by side), so it reuses cut_vdpack.
Run from the repo root:  python3 tools/art/cut_ewchars.py
"""
import sys
sys.path.insert(0, 'tools/art')
import cut_vdpack as V
A = 'art_incoming/ewchars/'
WHO = {'tansy': 'tansy', 'pruett': 'mayor_pruett', 'dunn': 'gaffer_dunn', 'stroud': 'haulmaster_stroud', 'ellis': 'ellis_the_carver',
       'hazel': 'hazel', 'oliver': 'oliver', 'ranger': 'forest_ranger_man', 'ranger2': 'forest_ranger_woman',
       'logger': 'logger_man', 'logger2': 'logger_woman', 'herder': 'herder_man', 'herder2': 'herder_woman'}
for kind, src in WHO.items():
    V.walk(A + src + '_walk.png', kind); V.portraits(A + src + '_portraits.png', kind); print(kind)
