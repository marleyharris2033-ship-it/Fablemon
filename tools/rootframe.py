import math
from PIL import Image
OUT=(38,26,22,255); D=(70,44,26,255); M=(108,70,40,255); L=(146,100,56,255); H=(186,138,82,255)
VD=(128,86,46,255); VL=(204,160,100,255)
LG1=(40,90,42,255); LG2=(78,142,58,255); LG3=(146,196,86,255); CREAM=(251,243,217,255)
T_=None

def edge(Lp, T, thick, vamp, inner_from, leaves, hairs, grain):
    im = Image.new('RGBA', (Lp, T), (0,0,0,0)); px = im.load()
    c = T*0.55 - 0.5
    for y in range(inner_from, T):
        for x in range(Lp): px[x,y] = CREAM
    # main root: centre wobble + thickness swell (periodic)
    def mc(x): return c + 0.6*math.sin(2*math.pi*x/Lp*2)
    def mr(x): return thick/2 + 0.5*math.sin(2*math.pi*x/Lp + 1.3)
    main = {}
    for x in range(Lp):
        for y in range(T):
            d = y - mc(x)
            if abs(d) <= mr(x):
                t = (d + mr(x)) / (2*mr(x))
                col = H if t < .2 else L if t < .45 else M if t < .8 else D
                main[(x,y)] = col
    # bark grain: short diagonal dark ticks
    for gx in grain:
        for i in range(3):
            p = (gx+i, int(round(mc(gx)))-1+i)
            if p in main: main[p] = D if main[p] != D else OUT
    # vine: thin root spiralling around the main root
    vine = {}
    for x in range(Lp):
        yv = c + vamp*math.sin(2*math.pi*x/Lp)
        front = math.cos(2*math.pi*x/Lp) < 0     # in front on the falling half
        for y in (math.floor(yv), math.floor(yv)+1):
            if 0 <= y < T: vine[(x,y)] = (front, VL if y == math.floor(yv) else VD)
    solid = set(main) | set(vine)
    for p,col in main.items(): px[p] = col
    for p,(front,col) in vine.items():
        if front or p not in main: px[p] = col
    # outline everything
    for x in range(Lp):
        for y in range(T):
            if (x,y) in solid: continue
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                q = ((x+dx)%Lp, y+dy)
                if q in solid: px[x,y] = OUT; break
    # where the vine crosses in front of the main root, edge it in dark
    for (x,y),(front,col) in vine.items():
        if front and (x,y) in main:
            for dy in (-1, 2):
                q = (x, y+dy) if dy < 0 else (x, y+1)
            for q in ((x,y-1),(x,y+1)):
                if q in main and q not in vine: px[q] = OUT
    # rootlet hairs on the outside edge
    for hx in hairs:
        y0 = min(y for (x,y) in solid if x == hx) - 1
        for i in range(2):
            if y0-i >= 0: px[hx - i, y0 - i] = OUT
    # leaf sprigs on the outer side
    for lx in leaves:
        y0 = min(y for (x,y) in solid if x == lx) - 1
        pts = [(0,0,LG1),(0,-1,LG1),(-1,-1,LG2),(-2,-2,LG2),(-1,-2,LG3),(1,-2,LG2),(2,-2,LG3),(2,-3,LG2),(-2,-3,LG2)]
        for dx,dy,col in pts:
            if 0 <= y0+dy: px[lx+dx, y0+dy] = col
        for dx,dy in ((-3,-3),(-3,-2),(-2,-4),(-1,-3),(3,-3),(3,-4),(2,-4),(1,-3),(-2,-1),(1,-1),(3,-2)):
            x,y = lx+dx, y0+dy
            if 0 <= y < T and px[x,y][3] == 0: px[x,y] = OUT
    return im

def corner(T, R, inner_from, sprig, thick):
    im = Image.new('RGBA', (T, T), (0,0,0,0)); px = im.load()
    c = T*0.55 - 0.5
    r0 = thick/2 + 0.5*math.sin(1.3)
    for y in range(inner_from, T):
        for x in range(inner_from, T): px[x,y] = CREAM
    solid = {}
    def shade(t): return H if t < .2 else L if t < .45 else M if t < .8 else D
    for y in range(T):
        for x in range(T):
            if x >= c and abs(y-c) <= r0: solid[(x,y)] = shade((y-c+r0)/(2*r0))
            if y >= c and abs(x-c) <= r0: solid[(x,y)] = shade((x-c+r0)/(2*r0))
    for y in range(T):
        for x in range(T):
            d = math.hypot(x-c, y-c); a = math.atan2(y-c, x-c)
            if d <= R + 0.6*math.sin(a*5):
                ring = int(d*1.3) % 2
                lit = (x-c) + (y-c) < -1
                col = (H if lit else L) if ring else (L if lit else M)
                if (x-c)+(y-c) > R*.9: col = D
                solid[(x,y)] = col
    for p,col in solid.items(): px[p] = col
    for y in range(T):
        for x in range(T):
            if (x,y) in solid: continue
            if any((x+dx,y+dy) in solid for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))): px[x,y] = OUT
    ci = int(round(c)); px[ci,ci] = OUT; px[ci+1,ci] = D; px[ci,ci+1] = D
    if sprig:
        for (x,y,col) in [(2,3,LG2),(3,2,LG2),(2,2,LG3),(1,2,LG1),(2,1,LG1),(1,1,LG2),(3,3,LG1)]:
            px[x,y] = col
        for (x,y) in [(0,1),(1,0),(0,2),(2,0),(1,3),(3,1)]:
            if px[x,y][3] == 0: px[x,y] = OUT
    return im

def frame(T, Lp, R, inner_from, sprig, **kw):
    e = edge(Lp, T, inner_from=inner_from, **kw)
    k = corner(T, R, inner_from, sprig, kw['thick'])
    W = T*2 + Lp
    im = Image.new('RGBA', (W, W), (0,0,0,0))
    im.paste(e, (T, 0)); im.paste(e.rotate(-90, expand=True), (W-T, T))
    im.paste(e.rotate(180, expand=True), (T, W-T)); im.paste(e.rotate(90, expand=True), (0, T))
    im.paste(k, (0,0)); im.paste(k.rotate(-90), (W-T,0)); im.paste(k.rotate(180), (W-T,W-T)); im.paste(k.rotate(90), (0,W-T))
    for y in range(T, W-T):
        for x in range(T, W-T): im.putpixel((x,y), CREAM)
    return im

big = frame(T=12, Lp=28, R=4.0, inner_from=8, sprig=True, thick=4.6, vamp=3.0, leaves=[20], hairs=[5, 11], grain=[3, 13, 24])
big.save('../src/frame_big.png')
sm = frame(T=7, Lp=18, R=2.4, inner_from=5, sprig=False, thick=3.0, vamp=1.7, leaves=[], hairs=[], grain=[4, 13])
sm.save('../src/frame_sm.png')
for n, im in (('big', big), ('sm', sm)):
    im.resize((im.width*8, im.height*8), Image.NEAREST).save(f'preview_frame_{n}_x8.png')
