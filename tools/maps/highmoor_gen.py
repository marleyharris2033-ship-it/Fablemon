"""Maps for the way to Highmoor, written to src/highmoor_maps.json, with a solver that checks the wind puzzles.

Windward Sound is a sea route (beach painter, sea rules). The two cliff routes use the cliff painter:
  #  rock (raised, cliff faces)   .  heather turf    ,  path    H  wooden steps    0-9 long heather (zones)
  C  a gorge (can't walk; the wind can carry you over it)       T  windswept tree  o  rocks
  <>^v  an updraft that always blows that way
  a b c d  an updraft whose direction is set by weathervane A B C D (vanes are signs: '__wvane:A')
Rule (same as src/highmoor.js): step onto an updraft and, if the gorge lies ahead in the wind's direction, the gust carries
you straight across it to the first tile past the gorge, as long as you can stand there. Land on another updraft and it
carries you on. The solver walks every state (where you stand + how each vane points) and checks that the far exit can
be reached, and that from anywhere you can reach you can still get to both exits (no getting stuck)."""
import json, sys
from collections import deque

DV = {'N': (0, -1), 'S': (0, 1), 'E': (1, 0), 'W': (-1, 0)}
FIXED = {'^': 'N', 'v': 'S', '>': 'E', '<': 'W'}
WALK = set('.,0123456789H=') | set('abcd') | set(FIXED)


class Map:
    def __init__(s, w, h, fill='#'):
        s.w, s.h = w, h; s.g = [[fill] * w for _ in range(h)]
    def box(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.g[y][x] = c
    def put(s, x, y, c): s.g[y][x] = c
    def rows(s): return [''.join(r) for r in s.g]


def solve(rows, vanes, starts, goals, blocked=()):
    """vanes: {id: (x, y, [dirs...], start_index)}; starts/goals: lists of (x, y)."""
    H, W = len(rows), len(rows[0]); ids = sorted(vanes); blk = set(blocked) | {(v[0], v[1]) for v in vanes.values()}
    K = lambda x, y: rows[y][x] if 0 <= x < W and 0 <= y < H else '#'
    ok = lambda x, y: K(x, y) in WALK and (x, y) not in blk
    def land(x, y, vs):
        seen = set()
        while (x, y) not in seen:
            seen.add((x, y)); k = K(x, y)
            d = FIXED.get(k) or (vanes[k.upper()][2][vs[ids.index(k.upper())]] if k in 'abcd' else None)
            if not d: return x, y
            dx, dy = DV[d]; tx, ty, n = x + dx, y + dy, 0
            while K(tx, ty) == 'C': tx += dx; ty += dy; n += 1
            if not n or not ok(tx, ty): return x, y
            x, y = tx, ty
        return x, y
    def nexts(st):
        x, y, vs = st
        for dx, dy in DV.values():
            if ok(x + dx, y + dy): yield (*land(x + dx, y + dy, vs), vs)
            for i, v in enumerate(ids):
                vx, vy, dirs, _ = vanes[v]
                if (x + dx, y + dy) == (vx, vy):
                    nv = list(vs); nv[i] = (nv[i] + 1) % len(dirs); yield (x, y, tuple(nv))
    s0 = (*starts[0], tuple(vanes[v][3] for v in ids))
    seen = {s0}; q = deque([s0]); edges = {}
    while q:
        st = q.popleft(); edges[st] = list(nexts(st))
        for n in edges[st]:
            if n not in seen: seen.add(n); q.append(n)
    # reverse reachability to each exit
    rev = {}
    for a, ns in edges.items():
        for b in ns: rev.setdefault(b, []).append(a)
    def can_reach(targets):
        good = {st for st in seen if (st[0], st[1]) in targets}; q = deque(good)
        while q:
            b = q.popleft()
            for a in rev.get(b, []):
                if a not in good: good.add(a); q.append(a)
        return good
    tg, ts = can_reach(set(goals)), can_reach(set(starts))
    stuck = [st for st in seen if st not in tg or st not in ts]
    nog = [st for st in seen if st not in tg]; nos = [st for st in seen if st not in ts]
    tiles = {(st[0], st[1]) for st in seen}
    # shortest number of vane turns + steps to the goal
    dist = {s0: 0}; q = deque([s0]); best = None
    while q:
        st = q.popleft()
        if (st[0], st[1]) in goals: best = dist[st]; break
        for n in edges[st]:
            if n not in dist: dist[n] = dist[st] + 1; q.append(n)
    return {'states': len(seen), 'reach_goal': s0 in tg, 'stuck': stuck[:5], 'n_stuck': len(stuck), 'no_goal': nog[:4], 'n_no_goal': len(nog), 'no_start': nos[:4], 'n_no_start': len(nos), 'tiles': tiles, 'moves': best}


def show(rows, tiles=()):
    for y, r in enumerate(rows): print(f'{y:2} ' + ''.join(('*' if (x, y) in tiles and c in '.,' else c) for x, c in enumerate(r)))


def heatherstep():
    m = Map(36, 60)
    # the landing at the foot of the cliffs
    m.box(3, 52, 32, 58, '.'); m.box(15, 59, 20, 59, ','); m.box(17, 49, 18, 58, ','); m.box(17, 49, 18, 51, 'H')
    m.box(4, 53, 11, 57, '0'); m.box(24, 52, 31, 56, '0')
    for x, y in [(3, 52), (32, 52), (3, 58), (32, 58), (14, 53), (22, 57)]: m.put(x, y, 'o')
    # band A: the first gorge, crossed on a steady updraft
    m.box(2, 42, 33, 48, '.'); m.box(3, 44, 9, 47, '0'); m.box(26, 45, 32, 47, '0'); m.box(17, 43, 18, 48, ',')
    m.box(2, 40, 33, 41, 'C'); m.put(8, 42, '^'); m.put(20, 42, '^')
    # band B: weathervane A, out on the east strip beyond a side gorge
    m.box(2, 31, 33, 39, '.'); m.box(27, 31, 28, 39, 'C'); m.put(14, 39, 'v')
    m.box(4, 34, 10, 38, '1'); m.box(16, 35, 22, 38, '1')
    m.put(26, 33, 'a'); m.put(29, 37, '<'); m.put(10, 31, 'a')
    m.box(2, 29, 33, 30, 'C')
    # band C: heather and a spring, then steps up the next cliff
    m.box(2, 18, 33, 28, '.'); m.box(4, 20, 12, 25, '1'); m.box(20, 21, 30, 26, '2'); m.box(24, 16, 25, 17, 'H'); m.box(24, 16, 25, 19, ','); m.put(14, 28, 'v')
    for x, y in [(2, 18), (33, 18), (17, 23), (2, 28)]: m.put(x, y, 'o')
    # band D: the top gorge. Vane B on the west ledge sends you on to the summit path (east) or to the treasure ledge (north)
    m.box(2, 10, 33, 15, '.'); m.box(6, 12, 14, 14, '2')
    m.box(2, 8, 33, 9, 'C'); m.put(6, 10, '^'); m.put(28, 10, 'b')
    m.box(2, 2, 11, 7, '.'); m.box(12, 2, 13, 7, 'C'); m.box(14, 1, 21, 7, '.'); m.box(22, 2, 23, 7, 'C'); m.box(24, 2, 33, 7, '.')
    m.put(11, 5, 'b'); m.put(3, 7, 'v'); m.put(18, 7, 'v'); m.put(30, 7, 'v')
    m.box(16, 0, 19, 6, ','); m.box(16, 0, 19, 0, ',')
    return m.rows(), {'A': (13, 33, ['E', 'S', 'W', 'N'], 0), 'B': (4, 3, ['N', 'E', 'S', 'W'], 2)}, [(17, 59)], [(17, 0)]


def galeledges():
    m = Map(40, 50)
    m.box(1, 6, 38, 42, 'C')
    # the ledge you arrive on, and the summit ledge with the road to Highmoor
    m.box(2, 43, 37, 48, '.'); m.box(17, 43, 20, 49, ','); m.box(4, 45, 12, 47, '3'); m.box(25, 45, 34, 47, '3')
    m.box(2, 1, 37, 5, '.'); m.box(18, 0, 21, 5, ','); m.box(4, 2, 12, 4, '4'); m.box(26, 2, 35, 4, '4')
    # the pillars standing in the gorge
    P = {'P1': (4, 34, 10, 38), 'P2': (28, 34, 34, 38), 'P3': (16, 30, 22, 36), 'P4': (4, 14, 10, 19), 'P5': (28, 26, 34, 31)}
    for x0, y0, x1, y1 in P.values(): m.box(x0, y0, x1, y1, '.')
    m.box(5, 15, 9, 18, '5'); m.box(29, 27, 33, 29, '5'); m.box(17, 32, 21, 34, '4')
    m.put(7, 43, '^'); m.put(31, 43, 'a')                     # entry: to pillar 1 always, to pillar 2 when vane A blows north
    m.put(5, 38, 'v'); m.put(7, 34, '^'); m.put(10, 35, 'b')   # pillar 1: home, up to pillar 4, across to pillar 3 (vane B east)
    m.put(33, 38, 'v'); m.put(28, 35, 'b')                     # pillar 2: home, across to pillar 3 (vane B west)
    m.put(9, 19, 'v')                                          # pillar 4: back down to pillar 1
    m.put(19, 30, 'c'); m.put(22, 31, 'c'); m.put(19, 36, 'v') # pillar 3: the summit (vane C north), pillar 5 (vane C east), home
    m.put(31, 31, 'v')                                         # pillar 5: down to pillar 2
    m.put(17, 5, 'v')                                          # summit: back down to pillar 3
    vanes = {'A': (12, 44, ['E', 'S', 'W', 'N'], 0), 'B': (31, 36, ['N', 'E', 'S', 'W'], 0), 'C': (6, 16, ['W', 'N', 'E', 'S'], 0)}
    return m.rows(), vanes, [(18, 49)], [(19, 0)]


def windward():
    """Windward Sound, the sea north of Beaconreach (sea legend: ~ sea, 0-9 rough water, * rock, . sand, # bank, , jetty)."""
    m = Map(44, 52, '~')
    m.box(0, 0, 43, 2, '#'); m.box(0, 3, 43, 4, '#')
    import math
    for x in range(44):                                   # a ragged shoreline under the cliffs: grassy bank, then a strip of sand
        d = 6 + round(1.4 * math.sin(x * .27 + .5))
        for y in range(3, d + 1): m.g[y][x] = '#' if y < d - 1 else '.'
    m.box(20, 5, 21, 9, ',')
    m.box(5, 12, 14, 19, '0'); m.box(28, 14, 38, 21, '0'); m.box(14, 24, 26, 31, '1'); m.box(4, 33, 12, 40, '2'); m.box(30, 33, 39, 41, '2')
    for x, y in [(17, 13), (25, 18), (9, 27), (35, 28), (22, 38), (12, 45), (31, 46), (3, 22), (40, 10)]: m.put(x, y, '*')
    return m.rows()


if __name__ == '__main__':
    out = {}
    for name, fn in [('heatherstep', heatherstep), ('galeledges', galeledges)]:
        rows, vanes, st, gl = fn()
        assert all(len(r) == len(rows[0]) for r in rows)
        r = solve(rows, vanes, st, gl)
        print(name, {k: v for k, v in r.items() if k != 'tiles'})
        if '-v' in sys.argv: show(rows, r['tiles'])
        out[name] = {'rows': rows, 'vanes': {k: {'x': v[0], 'y': v[1], 'dirs': v[2], 'start': v[3]} for k, v in vanes.items()}}
    out['windward'] = {'rows': windward()}
    if '-v' in sys.argv: show(out['windward']['rows'])
    json.dump(out, open('src/highmoor_maps.json', 'w'))
