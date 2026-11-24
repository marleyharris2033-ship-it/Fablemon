"""Gloamhollow's three underground maps, as text (same legend as the crags: crag.js), written to src/gloam_maps.js.
   undercroft   the haul tunnel: a long rail tunnel (night convoys), a collapse with a maintenance door round it (Brask)
                and flooded galleries the long way round; two side chambers of cave moss
   glimmerdeep  crystal caverns round a black lake below the hollow; the crystal-mirror beam puzzle in the south chamber
   siteg        Site G: the hall inside the mountain where the Taproot drill is assembled
   Marked spots (mirrors, tools, the siphon...) are exported as coordinates, so gloam.js never guesses. Checks every
   walkable tile can be reached from the entrance (doors and gates open)."""
import json

def grid(w, h, c='#'): return [[c] * w for _ in range(h)]
def rect(g, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): g[y][x] = c
def put(g, x, y, c): g[y][x] = c
def rows(g): return [''.join(r) for r in g]
WALK = set('.,0123456789')

def reach(g, start, extra_open=()):
    H, W = len(g), len(g[0]); seen = {start}; q = [start]; op = set(extra_open)
    while q:
        x, y = q.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and (g[ny][nx] in WALK or (nx, ny) in op):
                seen.add((nx, ny)); q.append((nx, ny))
    return seen

out = {}

# ---------------------------------------------------------------- the Undercroft (60 x 30)
W, H = 60, 30; g = grid(W, H)
rect(g, 0, 14, 59, 14, ','); rect(g, 0, 16, 59, 16, ',')
rect(g, 0, 15, 1, 15, ','); rect(g, 58, 15, 59, 15, ',')
for x in range(3, 57): put(g, x, 15, '─')
put(g, 2, 15, '■'); put(g, 57, 15, '■')
north_alc = [8, 14, 20, 26, 36, 42, 48, 54]; south_alc = [11, 17, 23, 39, 45, 51]
for x in north_alc: put(g, x, 13, '.')
for x in south_alc: put(g, x, 17, '.')
# the collapse: rubble across both walkways
for y in (14, 16):
    for x in (30, 31): put(g, x, y, 'o')
# the maintenance passage round it (its door is the gate: open for Brask)
rect(g, 28, 9, 28, 13, '.'); rect(g, 28, 9, 33, 9, ','); rect(g, 33, 9, 33, 13, '.')
door = [(30, 9), (31, 9)]
# the flooded galleries: the long way round, south
rect(g, 27, 17, 27, 20, '.'); rect(g, 8, 20, 27, 20, ','); rect(g, 8, 20, 8, 27, ','); rect(g, 8, 27, 50, 27, ',')
rect(g, 50, 20, 50, 27, ','); rect(g, 34, 20, 50, 20, ','); rect(g, 34, 17, 34, 20, '.')
rect(g, 10, 21, 20, 26, '1'); rect(g, 36, 21, 48, 26, '2')
for (x, y) in [(13, 23), (14, 23), (15, 24), (16, 24), (40, 22), (41, 22), (42, 23), (44, 25), (45, 25), (24, 24), (25, 24), (26, 25), (29, 23), (30, 23)]:
    put(g, x, y, '~')
rect(g, 22, 22, 31, 26, '.')
for (x, y) in [(24, 24), (25, 24), (26, 25), (29, 23), (30, 23)]: put(g, x, y, '~')
rect(g, 21, 22, 21, 26, ','); rect(g, 32, 22, 32, 26, ',')     # joins the gallery chambers to each other
put(g, 21, 21, ','); put(g, 32, 21, ',')
# side chambers off the tunnel: cave moss (long grass) and a trainer each
rect(g, 3, 6, 19, 11, '0'); rect(g, 8, 12, 8, 12, '.'); rect(g, 4, 6, 6, 7, '.')
rect(g, 40, 6, 56, 11, '3'); rect(g, 48, 12, 48, 12, '.'); rect(g, 53, 6, 55, 7, '.')
for (x, y) in [(10, 8), (11, 8), (15, 10), (44, 8), (45, 9), (51, 10)]: put(g, x, y, 'o')
tools = [(10, 26), (48, 21), (27, 26)]
trail = [(27, 18), (27, 20), (22, 20), (17, 20), (12, 20), (8, 22), (8, 25), (11, 27), (16, 27), (22, 27), (28, 27), (34, 27), (40, 27), (46, 27), (50, 25), (50, 22), (46, 20)]
lost = (44, 21)
for (x, y) in tools + trail + [lost]: assert g[y][x] in WALK, ('undercroft', x, y, g[y][x])
seen = reach(g, (1, 15), door)
walk = {(x, y) for y in range(H) for x in range(W) if g[y][x] in WALK}
assert walk <= seen, ('undercroft unreachable', sorted(walk - seen)[:10])
assert (59, 14) in reach(g, (1, 15))   # the long way round works without the door
out['undercroft'] = dict(rows=rows(g), door=door, tools=tools, trail=trail, lost=lost, northAlc=north_alc, southAlc=south_alc)

# ---------------------------------------------------------------- Glimmerdeep (48 x 36)
W, H = 48, 36; g = grid(W, H)
rect(g, 23, 1, 24, 2, ','); rect(g, 20, 3, 28, 6, '.')
rect(g, 4, 7, 44, 8, ','); rect(g, 4, 7, 5, 29, ','); rect(g, 42, 7, 43, 29, ','); rect(g, 4, 28, 44, 29, ',')
rect(g, 8, 10, 40, 26, '~')
rect(g, 4, 10, 5, 26, '4'); rect(g, 42, 10, 43, 26, '5')
rect(g, 20, 15, 28, 20, '6'); rect(g, 22, 17, 26, 18, '.')               # the island: cave moss round a clearing
for y in (9, 10): put(g, 24, y, '.')
for y in (12, 13, 14): put(g, 24, y, '.')                                  # stepping stones: one gap for a Leap or a Glide
rect(g, 30, 3, 44, 6, '7'); rect(g, 41, 3, 43, 4, '.')                    # the north-east grotto
rect(g, 44, 15, 46, 21, '.')                                              # the siphon niche
rect(g, 5, 30, 42, 34, '.')                                               # the south chamber: the beam puzzle
for (x0, y0, x1, y1) in [(6, 30, 11, 31), (13, 31, 19, 32), (21, 31, 42, 32), (13, 33, 19, 34), (5, 33, 11, 34), (35, 33, 42, 34)]:
    rect(g, x0, y0, x1, y1, '#')
for (x, y) in [(6, 32), (7, 32), (8, 32), (9, 32), (10, 32), (11, 32), (12, 30), (12, 31), (12, 32), (12, 33), (12, 34), (13, 30), (14, 30), (15, 30), (16, 30),
               (17, 30), (18, 30), (19, 30), (20, 30), (20, 31), (20, 32), (20, 33), (21, 33), (22, 33), (23, 33), (24, 33), (25, 33), (26, 33), (27, 33),
               (28, 33), (29, 33), (30, 33), (31, 33), (32, 33), (33, 33), (34, 33), (20, 34), (21, 34), (34, 34)]:
    put(g, x, y, '.')
rect(g, 13, 29, 30, 29, ',')                                              # the chamber opens off the ring above
for x in range(13, 31): put(g, x, 30, '.' if g[30][x] == '#' and x in (13, 14, 15, 16, 17, 18, 19, 20) else g[30][x])
src = (6, 32); mirrors = {'A': (12, 32), 'B': (12, 30), 'C': (20, 30), 'D': (20, 33)}; target = (34, 33)
sol = {'A': '/', 'B': '/', 'C': '\\', 'D': '\\'}
siphon = (45, 18); legend = (42, 3); bloom = (24, 4); pickups = [(22, 18), (44, 4), (5, 27)]
# trace the beam with the solution: it must reach the target
def trace(g, mir, start, d0=(1, 0)):
    (x, y), (dx, dy) = start, d0; path = []
    for _ in range(400):
        x += dx; y += dy
        if not (0 <= x < W and 0 <= y < H) or g[y][x] == '#': return path, None
        path.append((x, y))
        if (x, y) == target: return path, True
        for k, p in mirrors.items():
            if p == (x, y):
                dx, dy = ((-dy, -dx) if mir[k] == '/' else (dy, dx))
    return path, None
_, ok = trace(g, sol, src); assert ok, 'beam puzzle unsolvable'
import itertools
wins = [m for m in itertools.product('/\\', repeat=4) if trace(g, dict(zip('ABCD', m)), src)[1]]
assert len(wins) == 1, ('beam has more than one answer', wins)
for (x, y) in [src, target, siphon, legend, bloom] + list(mirrors.values()) + pickups: assert g[y][x] != '#', ('glimmerdeep', x, y)
seen = reach(g, (24, 3))
walk = {(x, y) for y in range(H) for x in range(W) if g[y][x] in WALK}
miss = walk - seen
island = {(x, y) for (x, y) in miss if 20 <= x <= 28 and 9 <= y <= 20}
assert not (miss - island), ('glimmerdeep unreachable', sorted(miss - island)[:10])
out['glimmerdeep'] = dict(rows=rows(g), src=src, mirrors=mirrors, sol=sol, target=target, siphon=siphon, legend=legend, bloom=bloom, pickups=pickups)

# ---------------------------------------------------------------- Site G (40 x 32)
W, H = 40, 32; g = grid(W, H)
rect(g, 18, 29, 21, 31, ','); rect(g, 5, 4, 34, 28, '.'); rect(g, 18, 4, 21, 28, ',')
for (x0, y0, x1, y1) in [(8, 8, 9, 9), (30, 8, 31, 9), (8, 18, 9, 19), (30, 18, 31, 19), (8, 25, 9, 26), (30, 25, 31, 26)]: rect(g, x0, y0, x1, y1, '#')   # pillars
stacks = [(12, 12), (13, 12), (14, 12), (25, 12), (26, 12), (27, 12), (12, 22), (13, 22), (26, 22), (27, 22), (6, 15), (6, 16), (33, 15), (33, 16)]
drill = (20, 6); vale = (20, 10)
seen = reach(g, (20, 29))
walk = {(x, y) for y in range(H) for x in range(W) if g[y][x] in WALK}
assert walk <= seen
out['siteg'] = dict(rows=rows(g), stacks=stacks, drill=drill, vale=vale)

for k, v in out.items():
    assert all(len(r) == len(v['rows'][0]) for r in v['rows']), k
open('src/gloam_maps.js', 'w').write('// made by tools/gen_gloam.py: do not edit by hand\nconst GH_MAPS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
for k, v in out.items():
    print(k); print('\n'.join(v['rows']))
