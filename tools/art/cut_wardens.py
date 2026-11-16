"""Wardens Alder (Elderwood) and Isolde (Gloamhollow), sent 16 Nov 2026 -> tr_<kind>.png, hd_world/tr_<kind>.webp, hd/port_<kind>_<0|1>.webp.
Same layout as the Verdance pack, so it reuses cut_vdpack's walk() and portraits().
Run from the repo root:  python3 tools/art/cut_wardens.py
"""
import sys
sys.path.insert(0, 'tools/art')
import cut_vdpack as V
A = 'art_incoming/wardens/'
for who in ['alder', 'isolde']:
    V.walk(A + who + '_walk.png', who); V.portraits(A + who + '_portraits.png', who); print(who)
