# Builds the Cragside Pass maps (ASCII) and checks the boulder puzzles and rail rides can be solved.
import json, collections
def blank(w, h, c='#'): return [[c] * w for _ in range(h)]
def rect(M, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): M[y][x] = c
def put(M, x, y, c): M[y][x] = c
def hsh(x, y):
    n = (x * 374761393 + y * 668265263) & 0xffffffff; n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff; return (n & 0xffff) / 65536
def dress(M, keep=()):
    """trees and rocks on open ground away from paths"""
    H, W = len(M), len(M[0])
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if M[y][x] != '.' or (x, y) in keep: continue
            near = any(M[y + dy][x + dx] in ',0123456789CBL=' for dy in (-1, 0, 1) for dx in (-1, 0, 1))
            h = hsh(x * 7 + 3, y * 13 + 1)
            if near: continue
            if h < .06: M[y][x] = 'T'
            elif h < .10: M[y][x] = 'o'
            elif h < .115: M[y][x] = 'O'
def rough(M, x0, y0, x1, y1):
    """jagged cliff edges round an open area"""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            edge = min(x - x0, x1 - x, y - y0, y1 - y)
            if edge == 0 and hsh(x, y * 5) < .45: M[y][x] = '#'
def S(M): return [''.join(r) for r in M]

# ---------------------------------------------------------------- crag1: Cragside Pass (an ordinary route)
W, H = 36, 50; M = blank(W, H)
rect(M, 3, 1, 32, 48, '.'); rough(M, 3, 1, 32, 48)
rect(M, 3, 32, 33, 33, '#'); rect(M, 2, 17, 24, 18, '#')          # ridges that the path winds round
for r in [(16, 40, 18, 49), (6, 38, 18, 40), (6, 24, 8, 40), (6, 24, 28, 26), (26, 10, 28, 26), (16, 8, 28, 10), (16, 0, 18, 10)]: rect(M, *r, ',')
for z, r in enumerate([(20, 42, 30, 47), (10, 27, 17, 31), (12, 13, 23, 16), (29, 3, 31, 21), (4, 2, 13, 6)]):
    for y in range(r[1], r[3] + 1):
        for x in range(r[0], r[2] + 1):
            if M[y][x] == '.' and hsh(x * 3, y * 5) > .1: M[y][x] = str(z)
for x in range(9, 14): put(M, x, 21, 'C')                                # a little crevasse with a plank bridge
put(M, 11, 21, '='); rect(M, 9, 19, 13, 23, '.') if False else None
dress(M, keep={(14, 47), (20, 7), (14, 2)})
crag1 = S(M)

# ---------------------------------------------------------------- crag2: Cragside Heights (boulder puzzles)
W, H = 40, 44; M = blank(W, H); B2 = []
rect(M, 6, 34, 33, 42, '.'); rough(M, 6, 34, 33, 42); rect(M, 17, 42, 21, 43, '.'); rect(M, 18, 35, 20, 43, ',')
for z, r in enumerate([(24, 37, 31, 41), (7, 37, 13, 41)]):
    for y in range(r[1], r[3] + 1):
        for x in range(r[0], r[2] + 1):
            if M[y][x] == '.' and hsh(x * 3, y * 5) > .1: M[y][x] = str(z)
# puzzle 1 (tutorial): push the boulder straight up into the crevasse
rect(M, 14, 33, 24, 33, '.'); rect(M, 16, 32, 22, 32, 'C'); B2.append((19, 34))
# middle: puzzle 2. Only one crack leads north (x=27); a rock stops you pushing straight up from low down
rect(M, 4, 19, 34, 31, '.'); rough(M, 4, 19, 34, 31); rect(M, 14, 31, 24, 31, '.'); rect(M, 0, 25, 4, 27, '.'); rect(M, 0, 25, 4, 27, ',')
put(M, 27, 18, 'C'); B2.append((12, 24))
for x, y in [(27, 23), (20, 21), (8, 28), (31, 27), (16, 28), (24, 25)]: put(M, x, y, 'O')
for x in range(13, 28): put(M, x, 20, '.')
for y in range(19, 23): put(M, 27, y, '.')
put(M, 11, 20, '.'); put(M, 11, 21, '.'); put(M, 12, 25, '.')
rect(M, 30, 20, 33, 23, '2')
# north: puzzle 3. A two-deep crevasse: two boulders down the same gap
rect(M, 5, 2, 34, 17, '.'); rough(M, 5, 2, 34, 17); rect(M, 25, 17, 29, 17, '.')
rect(M, 5, 8, 34, 9, '#'); rect(M, 15, 8, 17, 9, 'C'); B2 += [(16, 12), (20, 14)]
for x, y in [(16, 15), (13, 11), (19, 11), (24, 13)]: put(M, x, y, 'O')
rect(M, 18, 0, 20, 7, '.'); rect(M, 18, 0, 20, 7, ',')
for z, r in [(3, (6, 3, 13, 6)), (3, (26, 3, 33, 6))]:
    for y in range(r[1], r[3] + 1):
        for x in range(r[0], r[2] + 1):
            if M[y][x] == '.' and hsh(x * 3, y * 5) > .1: M[y][x] = str(z)
for x, y in B2: M[y][x] = 'B'
dress(M, keep={(15, 35), (23, 31), (5, 26), (28, 21), (21, 13), (17, 3), (21, 2), (19, 2)})
crag2 = S(M)

# ---------------------------------------------------------------- crag3: the Old Rail Cutting (mine-cart rides)
W, H = 46, 38; M = blank(W, H)
PLAT = {'P0': (37, 24, 44, 31), 'P1': (21, 24, 29, 31), 'P2': (9, 16, 15, 22), 'P3': (28, 8, 40, 13), 'P4': (41, 1, 44, 7), 'P5': (19, 8, 25, 13), 'P6': (2, 3, 8, 10)}
for p in PLAT.values(): rect(M, *p, '.')
rect(M, 45, 27, 45, 29, ','); rect(M, 39, 27, 44, 29, ',')
put(M, 5, 2, '.')                                                      # into the old mine
LINES = [[(36, 28), (30, 28)],                                            # A - B (the first ride)
         [(25, 23), (25, 19), (16, 19)], [(25, 19), (32, 19), (32, 14)],    # C - W1 - D / E
         [(34, 7), (34, 4), (26, 4), (26, 10)], [(34, 4), (40, 4)], [(26, 4), (26, 3), (9, 3)]]   # F - W2 - W3 - H / G / I
conn = collections.defaultdict(set)
D = {(0, -1): 'N', (1, 0): 'E', (0, 1): 'S', (-1, 0): 'W'}
for ln in LINES:
    for (ax, ay), (bx, by) in zip(ln, ln[1:]):
        dx = (bx > ax) - (bx < ax); dy = (by > ay) - (by < ay); x, y = ax, ay
        while (x, y) != (bx, by):
            conn[(x, y)].add(D[(dx, dy)]); x += dx; y += dy; conn[(x, y)].add(D[(-dx, -dy)])
GLYPH = {frozenset('EW'): '─', frozenset('NS'): '│', frozenset('ES'): '┌', frozenset('WS'): '┐', frozenset('NE'): '└', frozenset('NW'): '┘', frozenset('WES'): '┬', frozenset('WEN'): '┴', frozenset('NSE'): '├', frozenset('NSW'): '┤', frozenset('NSEW'): '┼'}
STOPS = {'A': (36, 28), 'B': (30, 28), 'C': (25, 23), 'D': (16, 19), 'E': (32, 14), 'F': (34, 7), 'G': (40, 4), 'H': (26, 10), 'I': (9, 3)}
for (x, y), c in conn.items():
    assert M[y][x] == '#', (x, y)
    M[y][x] = '■' if len(c) == 1 else GLYPH[frozenset(c)]
for n, (x, y) in STOPS.items(): assert M[y][x] == '■', n
crag3 = S(M)
SWITCH = {'W1': ((25, 19), 'S', 'W', 'E'), 'W2': ((34, 4), 'S', 'W', 'E'), 'W3': ((26, 4), 'E', 'S', 'N')}
OPP = {'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E'}; DV = {'N': (0, -1), 'S': (0, 1), 'E': (1, 0), 'W': (-1, 0)}
def ride(stop, sw):
    x, y = STOPS[stop]; d = next(iter(conn[(x, y)]))
    while True:
        x += DV[d][0]; y += DV[d][1]; came = OPP[d]; c = conn[(x, y)]
        if len(c) == 1: return [k for k, v in STOPS.items() if v == (x, y)][0]
        sid = next((k for k, v in SWITCH.items() if v[0] == (x, y)), None)
        if sid:
            _, tr, a, b = SWITCH[sid]; d = (b if sw[sid] else a) if came == tr else tr
        else: d = next(iter(c - {came}))
for sw in [{'W1': a, 'W2': b, 'W3': c} for a in (0, 1) for b in (0, 1) for c in (0, 1)]:
    print(sw, {s: ride(s, sw) for s in STOPS})

# ---------------------------------------------------------------- the old mine (the legend's chamber)
W, H = 24, 30; M = blank(W, H)
rect(M, 10, 22, 13, 29, '.'); rect(M, 5, 19, 18, 23, '.'); rect(M, 4, 12, 7, 19, '.'); rect(M, 4, 11, 19, 14, '.'); rect(M, 16, 7, 19, 12, '.')
rect(M, 6, 2, 18, 8, '.'); rough(M, 6, 2, 18, 8)
for y in range(3, 9): put(M, 12, y, '.')
rect(M, 11, 27, 12, 29, ',')
mine = S(M)

# ---------------------------------------------------------------- boulder puzzle solver (crag2)
def solve(rows, start, goal, filled=frozenset()):
    Hh, Ww = len(rows), len(rows[0])
    bl = frozenset((x, y) for y in range(Hh) for x in range(Ww) if rows[y][x] == 'B')
    wall = lambda x, y: not (0 <= x < Ww and 0 <= y < Hh) or rows[y][x] in '#TOo'
    crack = lambda x, y, f: rows[y][x] == 'C' and (x, y) not in f
    q = collections.deque([(start, bl, filled, 0)]); seen = {(start, bl, filled)}
    while q:
        (px, py), b, f, n = q.popleft()
        if (px, py) == goal: return n
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            nx, ny = px + dx, py + dy
            if wall(nx, ny) or crack(nx, ny, f): continue
            nb, nf = b, f
            if (nx, ny) in b:
                tx, ty = nx + dx, ny + dy
                if wall(tx, ty) or (tx, ty) in b: continue
                if crack(tx, ty, f): nb = b - {(nx, ny)}; nf = f | {(tx, ty)}
                else: nb = (b - {(nx, ny)}) | {(tx, ty)}
            st = ((nx, ny), nb, nf)
            if st not in seen: seen.add(st); q.append(((nx, ny), nb, nf, n + 1))
    return None
print('crag2 start->west exit', solve(crag2, (19, 42), (0, 26)))
print('crag2 start->north', solve(crag2, (19, 42), (19, 0)))
json.dump({'crag1': crag1, 'crag2': crag2, 'crag3': crag3, 'cragmine': mine}, open('/home/claude/work/crag/maps.json', 'w'), ensure_ascii=False)
for k, v in [('crag1', crag1), ('crag2', crag2), ('crag3', crag3), ('mine', mine)]:
    print(k); print('\n'.join(v))
