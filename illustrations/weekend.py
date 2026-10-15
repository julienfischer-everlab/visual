#!/usr/bin/env python3
"""Build the "weekend escape" illustrations as SVG.

Same ink and orange as build.py, but drawn as open vignettes (no frame) in
the style of the A-frame cabin reference: leafy tuft trees, ink grass
clumps, rocky ground, and orange glass that glows from inside.

    python3 illustrations/weekend.py          # SVGs into illustrations/weekend-escape/
    node illustrations/export-png.js          # transparent PNGs next to them
"""
import math

from build import INK, ORANGE, Scene, add, f, lerp, poly, pt, smooth

W, H = 960, 640
OUT = __import__("pathlib").Path(__file__).resolve().parent / "weekend-escape"


class Vignette(Scene):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        self.w, self.h = W, H

    def svg(self):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'width="{W}" height="{H}" role="img" aria-labelledby="{self.slug}-title">\n'
            f'<title id="{self.slug}-title">{self.title}</title>\n'
            f'<desc>{self.desc}</desc>\n'
            f'<defs>{"".join(self.defs)}</defs>\n'
            f'<g fill="none" stroke="{INK}" stroke-width="2.4" stroke-linecap="round" '
            f'stroke-linejoin="round">\n' + "\n".join(self.body) + '\n</g>\n</svg>\n'
        )


# ---------------------------------------------------------------- geometry

def cr_points(pts, per=10):
    """Points along the Catmull-Rom spline that smooth() draws."""
    n = len(pts)

    def get(i):
        return pts[max(0, min(n - 1, i))]
    out = []
    for i in range(n - 1):
        p0, p1, p2, p3 = get(i - 1), get(i), get(i + 1), get(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        for k in range(per):
            t = k / per
            a, b, c, d = (1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3
            out.append((a * p1[0] + b * c1[0] + c * c2[0] + d * p2[0],
                        a * p1[1] + b * c1[1] + c * c2[1] + d * p2[1]))
    out.append(pts[-1])
    return out


def area(pts):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(pts, pts[1:] + pts[:1])) / 2


def lumpy(pts, size=0.45, closed=True):
    """Bumpy outline that always bulges outward (orients the loop first)."""
    if closed and area(pts) > 0:
        pts = pts[::-1]
    loop = pts + [pts[0]] if closed else pts
    d = f"M{pt(loop[0])}"
    for a, b in zip(loop, loop[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        c = (a[0] + dx / 2 - dy * size, a[1] + dy / 2 + dx * size)
        d += f"Q{pt(c)} {pt(b)}"
    return d + ("Z" if closed else "")


def limb(pts, w0, w1):
    """Tapered limb: returns (left edge, right edge, silhouette) path data."""
    c = cr_points(pts, 8)
    seg = [math.dist(a, b) for a, b in zip(c, c[1:])]
    total = sum(seg) or 1
    s, left, right = 0.0, [], []
    for i, p in enumerate(c):
        a, b = c[max(i - 1, 0)], c[min(i + 1, len(c) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        w = (w0 + (w1 - w0) * s / total) / 2
        left.append((p[0] + nx * w, p[1] + ny * w))
        right.append((p[0] - nx * w, p[1] - ny * w))
        if i < len(seg):
            s += seg[i]
    pick = lambda q: q[::4] + ([q[-1]] if (len(q) - 1) % 4 else [])
    return smooth(pick(left)), smooth(pick(right)), poly(left + right[::-1], True)


# ---------------------------------------------------------------- motifs

def tuft(S, c, ang, size):
    """Fan-shaped cluster of leaves growing from c in direction ang (degrees)."""
    r = S.rnd
    size *= 1.35
    a = math.radians(-90 + (ang + 90) * 0.6)  # tufts lean, but always reach up
    u = (math.cos(a), math.sin(a))
    v = (-u[1], u[0])
    hw, hh = size * 0.64, size * 0.3
    ctr = add(c, u, hh * 0.85)
    pts = []
    N = 28
    for k in range(N):
        t = 2 * math.pi * k / N
        x, y = hw * math.sin(t), -hh * math.cos(t)
        if y < 0:
            x, y = x * 0.62, y * 0.6
        j = r.uniform(0.84, 1.08)
        pts.append(add(add(ctr, v, x * j), u, y * j))
    sil = lumpy(pts, 0.46)
    els = [S.ink(sil, 1.9)]
    # stems inside the tuft
    root = add(c, u, 2)
    for side in (-0.55, -0.15, 0.3, 0.62):
        tip = add(add(ctr, v, hw * side * r.uniform(0.8, 1)), u, hh * r.uniform(0.15, 0.5))
        mid = add(lerp(root, tip, 0.5), u, 3)
        els.append(S.ink(f"M{pt(root)}Q{pt(mid)} {pt(tip)}", 1.2))
    # a few leaf notches
    for side in (-0.4, 0.05, 0.45):
        p = add(add(ctr, v, hw * side), u, hh * 0.55)
        q = add(p, v, size * 0.1)
        m = add(lerp(p, q, 0.5), u, -size * 0.07)
        els.append(S.ink(f"M{pt(p)}Q{pt(m)} {pt(q)}", 1.1))
    return els, sil


def tree(S, trunk, w0, w1, branches, tufts, extra_occ=()):
    """Double-line trunk and limbs merged into one outline, leaf tufts on top.
    branches: [(pts, w0, w1)]; tufts: [(point, angle, size)]."""
    limbs = [limb(trunk, w0, w1)] + [limb(p, a, b) for p, a, b in branches]
    made = [tuft(S, c, ang, size) for c, ang, size in tufts]
    leaf_sil = [s for _, s in made]
    leaf_els = []
    for i, (e, _) in enumerate(made):
        leaf_els.append(S.behind(leaf_sil[i + 1:], e, f"tuft{S.n}") if i + 1 < len(made)
                        else "".join(e))
        S.n += 1
    wood = []
    for i, (l, rr, _) in enumerate(limbs):
        others = [s for j, (_, _, s) in enumerate(limbs) if j != i]
        wood.append(S.behind(others + leaf_sil + list(extra_occ),
                             [S.ink(l, 2.2), S.ink(rr, 2.2)], f"limb{S.n}"))
        S.n += 1
    sil = [s for _, _, s in limbs] + leaf_sil
    return wood + leaf_els, sil


def grass(S, base, w, h, n=11, lean=0.0):
    """Clump of tapered ink blades."""
    r = S.rnd
    els = []
    for i in range(n):
        t = i / (n - 1) * 2 - 1
        ang = -math.pi / 2 + t * 1.0 + r.uniform(-0.12, 0.12) + lean
        L = h * (1 - 0.42 * abs(t)) * r.uniform(0.72, 1.05)
        b = (base[0] + t * w * 0.22 + r.uniform(-1.5, 1.5), base[1])
        tip = (b[0] + math.cos(ang) * L + t * L * 0.12, b[1] + math.sin(ang) * L + abs(t) * L * 0.12)
        ctrl = (b[0] + math.cos(ang) * L * 0.5, b[1] + math.sin(ang) * L * 0.55)
        bw = r.uniform(2.0, 3.0)
        nx, ny = -math.sin(ang), math.cos(ang)
        d = (f"M{pt((b[0] - nx * bw, b[1] - ny * bw))}"
             f"Q{pt((ctrl[0] - nx * bw * 0.7, ctrl[1] - ny * bw * 0.7))} {pt(tip)}"
             f"Q{pt((ctrl[0] + nx * bw * 0.7, ctrl[1] + ny * bw * 0.7))} "
             f"{pt((b[0] + nx * bw, b[1] + ny * bw))}Z")
        els.append(S.fill(d, INK))
    return els


def bush(S, base, w, h):
    """Leafy mound sitting on the ground; returns (elements, silhouette)."""
    r = S.rnd
    x0, y0 = base
    pts = []
    N = 11
    for k in range(N + 1):
        t = math.pi * k / N
        rr = r.uniform(0.86, 1.06)
        pts.append((x0 - math.cos(t) * w / 2 * rr, y0 - math.sin(t) * h * rr))
    sil = lumpy(pts + [(x0 + w / 2 - 2, y0 + 3), (x0 - w / 2 + 2, y0 + 3)], 0.4)
    outline = lumpy(pts[::-1], 0.4, closed=False)
    els = [S.ink(outline, 1.9)]
    for k in range(3):
        p = (x0 + r.uniform(-w / 3, w / 3), y0 - r.uniform(h * 0.3, h * 0.7))
        els.append(S.ink(f"M{pt(p)}q4,-6 9,-2q3,-5 8,-1", 1.2))
    return els, sil


def lounger(S, base, s=1.0, facing=1):
    """Deck lounger in 3/4 view, reclining with the backrest on the far side."""
    k = facing

    def P(x, y):
        return (base[0] + x * s * k, base[1] + y * s)
    v = (11, -5)

    def V(p, m=1.0):
        return (p[0] + v[0] * s * k * m, p[1] + v[1] * s * m)
    hinge, front = P(0, -16), P(52, -16)
    top = P(-16, -54)
    els = []
    # backrest frame with a sling panel
    els.append(S.ink(poly([hinge, top, V(top), V(hinge)], True), 2.2))
    els.append(S.ink(poly([lerp(hinge, top, 0.12), lerp(hinge, top, 0.9),
                           lerp(V(hinge), V(top), 0.9), lerp(V(hinge), V(top), 0.12)], True), 1.2))
    # seat
    els.append(S.ink(poly([hinge, front, V(front), V(hinge)], True), 2.2))
    for m in (0.33, 0.66):
        els.append(S.ink(poly([lerp(hinge, front, m), V(lerp(hinge, front, m))]), 1.1))
    # legs and arm
    for p, q in ((hinge, P(-6, 0)), (front, P(58, 0)), (V(front), V(P(58, 0))),
                 (lerp(hinge, front, 0.45), P(14, 0))):
        els.append(S.ink(poly([p, q]), 2))
    els.append(S.ink(poly([V(lerp(hinge, top, 0.45)), V(P(40, -27)), V(front)]), 1.8))
    sil = poly([P(-6, 0), hinge, top, V(top), V(P(40, -27)), V(front), V(P(58, 0)),
                P(58, 0), front], True)
    return els, sil


def water_lines(S, rows, w=1.8):
    return [S.ink(S.hline((a, y), (b, y), 0.4), w) for y, a, b in rows]


# ---------------------------------------------------------------- scenes

def a_frame():
    S = Vignette("aframe", "A-frame cabin by the lake",
                 "Line drawing of an A-frame cabin glowing orange through its glass "
                 "front, with a deck, two loungers, tall trees and a lake below the hills.",
                 seed=3)
    HZ = 428
    # cabin geometry: front gable plus the side roof receding left
    F, FL, FR = (486, 250), (360, 502), (592, 502)
    B, BL = (338, 284), (236, 486)
    Fi, FLi, FRi = (486, 280), (382, 498), (570, 498)

    # ---- trees
    treeA, silA = tree(S, [(222, 470), (224, 400), (227, 330), (226, 260), (222, 200), (228, 140)],
                       9, 4,
                       [([(226, 300), (246, 256), (268, 220), (284, 200)], 5, 2.5),
                        ([(225, 250), (204, 216), (184, 196)], 4, 2)],
                       [((184, 196), -118, 40), ((284, 200), -64, 42), ((228, 140), -92, 48)])
    treeB, silB = tree(S, [(290, 470), (296, 400), (306, 330), (318, 260), (332, 190),
                           (346, 130), (352, 96)], 11, 4,
                       [([(318, 250), (352, 220), (370, 212)], 5, 2.5),
                        ([(330, 196), (380, 166), (430, 150), (500, 144), (560, 152),
                          (620, 166), (664, 178)], 7, 2.5),
                        ([(430, 150), (448, 128)], 3, 2),
                        ([(560, 152), (566, 134)], 3, 2)],
                       [((352, 96), -84, 54), ((370, 212), -30, 46), ((448, 128), -78, 46),
                        ((566, 134), -70, 50), ((668, 180), -40, 46)])
    treeC, silC = tree(S, [(586, 462), (584, 400), (582, 330), (578, 270), (572, 228)], 8, 3.5,
                       [([(582, 320), (604, 296), (620, 282)], 4, 2),
                        ([(580, 296), (562, 290), (548, 296)], 3.5, 2),
                        ([(584, 380), (612, 362), (632, 352)], 4, 2),
                        ([(584, 400), (566, 388), (556, 380)], 3, 2)],
                       [((572, 228), -100, 44), ((620, 282), -50, 40), ((548, 296), -150, 34),
                        ((632, 352), -40, 38), ((556, 380), -140, 30)])

    # ---- deck and loungers
    deck_top = [(352, 505), (706, 505), (734, 520), (380, 522)]
    deck = [S.ink(poly([deck_top[0], deck_top[1], deck_top[2]]), 2.4),
            S.ink(poly([deck_top[2], deck_top[3]]), 2.4),
            S.ink(poly([deck_top[2], (734, 530), (380, 532)]), 2.2)]
    for x in (500, 656, 712):
        deck.append(S.ink(poly([(x, 531), (x, 566)]), 2.4))
        deck.append(S.ink(poly([(x + 7, 531), (x + 7, 566)]), 1.4))
    deck_sil = poly([(352, 505), (706, 505), (734, 520), (734, 530), (380, 532)], True)
    ch1, sil_ch1 = lounger(S, (606, 516), 0.88)
    ch2, sil_ch2 = lounger(S, (668, 516), 0.88)

    # ---- ground, bushes, grass (front)
    front = []
    b1, sb1 = bush(S, (342, 470), 86, 48)
    b2, sb2 = bush(S, (612, 432), 52, 40)
    b3, sb3 = bush(S, (402, 538), 60, 30)
    b4, sb4 = bush(S, (470, 568), 64, 32)
    b5, sb5 = bush(S, (612, 440), 40, 30)
    ground = [
        [(132, 437), (190, 436), (240, 440), (268, 448)],
        [(206, 474), (236, 462), (262, 464), (296, 480), (330, 502), (352, 512)],
        [(184, 540), (222, 526), (268, 528), (310, 546), (338, 572), (352, 600)],
        [(330, 606), (380, 598), (430, 602), (476, 596), (520, 588), (566, 596),
         (604, 606)],
        [(398, 548), (440, 566), (500, 578), (560, 574), (610, 568)],
        [(610, 568), (660, 572), (720, 566), (780, 556), (840, 566), (900, 588), (936, 598)],
        # right shoreline rocks behind the deck
        [(706, 470), (730, 478), (748, 500), (756, 526), (776, 546), (812, 560)],
    ]
    for g in ground:
        front.append(S.ink(smooth(g), 2.2))
    for seg in ([(236, 548), (260, 560), (276, 580)], [(640, 586), (676, 584)],
                [(470, 612), (500, 610)], [(780, 572), (800, 580)],
                [(742, 492), (750, 510)], [(766, 532), (780, 540)]):
        front.append(S.ink(smooth(seg), 1.3))
    front += b1 + b3 + b4 + b5
    for base, w, h, n in (((222, 470), 70, 62, 13), ((288, 474), 50, 44, 10),
                          ((290, 556), 56, 52, 12), ((454, 572), 44, 36, 9),
                          ((752, 560), 40, 40, 9), ((830, 586), 60, 50, 12),
                          ((902, 596), 36, 26, 8), ((640, 438), 30, 32, 7)):
        front += grass(S, base, w, h, n)

    # ---- cabin
    cabin = []
    glass = poly([Fi, FRi, FLi], True)
    cabin.append(S.fill(glass))
    # window frame
    tx = 370
    def edge_x(y, a, b):
        return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])
    cabin.append(S.ink(poly([(edge_x(tx, Fi, FLi), tx), (edge_x(tx, Fi, FRi), tx)]), 3))
    for x in (424, 470, 532):
        top_y = Fi[1] + (abs(x - Fi[0]) / (Fi[0] - FLi[0])) * (FLi[1] - Fi[1]) if x < Fi[0] \
            else Fi[1] + ((x - Fi[0]) / (FRi[0] - Fi[0])) * (FRi[1] - Fi[1])
        cabin.append(S.ink(poly([(x, max(top_y, tx)), (x, 498)]), 3))
    cabin.append(S.ink(poly([(476, tx), (476, 498)]), 1.6))
    cabin.append(S.ink(poly([(486, Fi[1]), (486, tx)]), 2))
    # interior silhouettes: pendant lamp, potted plant, lounge chair
    cabin.append(S.ink(poly([(502, tx), (502, 396)]), 1.6))
    cabin.append(S.fill("M490,406a12,10 0 0 1 24,0Z", INK))
    cabin.append(S.fill("M436,474h22l-3,24h-16Z", INK))
    cabin.append(S.ink("M447,474V428", 2))
    for i, (dy, side) in enumerate(((0, -1), (8, 1), (16, -1), (24, 1), (32, -1), (40, 1))):
        y = 432 + dy
        cabin.append(S.fill(f"M447,{y + 4}q{side * 7},-9 {side * 14},-6q{-side * 4},8 {-side * 14},6Z", INK))
    cabin.append(S.fill("M505,462h26a4,4 0 0 1 4,4v14h-30Z M503,452l4,-2l6,30h-4Z "
                        "M507,480h2l-3,16h-2Z M529,480h2l2,16h-2Z", INK))
    # roof: gable band, side plane, seams
    cabin.append(S.ink(poly([FL, F, FR]), 2.6))
    cabin.append(S.ink(poly([FLi, Fi, FRi]), 2.2))
    cabin.append(S.ink(poly([(FR[0] + 6, FR[1] + 2), FR]), 2.4))
    cabin.append(S.ink(poly([F, B, BL]), 2.4))
    for m in (0.36, 0.68):
        a, b = lerp(F, B, m), lerp(FL, BL, m)
        cabin.append(S.ink(poly([a, b]), 2))
        cabin.append(S.ink(poly([add(a, (-6, 1.5)), add(b, (-6, 1.5))]), 1.3))
    cabin.append(S.ink(poly([(FLi[0] - 4, 500), (FRi[0] + 4, 500)]), 2.2))
    cabin_sil = poly([F, FR, (FR[0] + 6, 504), BL, B], True)

    # ---- lake and hills (furthest back)
    back = []
    back.append(S.ink(S.hline((588, HZ), (936, HZ), 0.3), 2.2))
    back.append(S.ink(smooth([(588, 404), (624, 396), (664, 395), (704, 392), (742, 382),
                              (776, 384), (802, 397), (826, 407), (852, 403), (884, 410),
                              (914, 420), (940, HZ)]), 2.2))
    back.append(S.ink(smooth([(700, 392), (734, 404), (772, 414)]), 1.4))
    back.append(S.ink(smooth([(836, 408), (862, 416)]), 1.4))
    back += water_lines(S, [(456, 732, 808), (470, 770, 820), (488, 818, 926),
                            (506, 852, 906), (524, 830, 870)])

    S.body.append(S.behind([cabin_sil, silB[0], sb2, sb5] + silC, back, "lake"))
    S.body.append(S.behind(silB + silC + [sb1, sb2, sb5], cabin, "cabin"))
    S.body.append(S.behind([sil_ch1, sil_ch2, sb3, sb4], deck, "deck"))
    S.body.append(S.behind([sil_ch2], ch1, "chair"))
    S.body += ch2
    S.body += treeA + treeB + treeC + b2
    S.body.append(S.behind([deck_sil, sb1, sb3, sb4, sil_ch1, sil_ch2], front[:len(ground)],
                           "ground"))
    S.body += front[len(ground):]
    return S


def bell_tent():
    S = Vignette("camp", "Bell tent camp by the lake",
                 "Line drawing of a bell tent glowing orange inside, a campfire, two "
                 "loungers and string lights between the trees, with a lake and hills "
                 "behind.", seed=8)
    HZ = 418
    cx, base_y, rx, ry = 372, 506, 112, 18
    wall_top = 438
    apex = (cx, 300)

    # ---- tent
    tent = []
    eave_y, erx = wall_top, rx + 12
    # door opening, flaps tied back
    door = poly([(cx - 10, 392), (cx + 10, 392), (cx + 40, 520), (cx - 40, 520)], True)
    door_open = (f"M{cx - 9},398L{cx + 9},398L{cx + 34},{base_y + ry - 1}"
                 f"Q{cx},{base_y + ry + 2} {cx - 34},{base_y + ry - 1}Z")
    tent.append(S.fill(door_open))
    # inside: lantern, bed with cushions, rug edge
    tent.append(S.ink(f"M{cx},398V430", 1.6))
    tent.append(S.fill(f"M{cx - 4},430h8l2,4v10l-2,3h-8l-2,-3v-10Z", INK))
    tent.append(S.fill(f"M{cx - 30},{base_y + 6}q0,-16 14,-18h32q14,2 14,18Z", INK))
    tent.append(S.fill(f"M{cx - 20},{base_y - 13}a7,6 0 1 1 14,0Z M{cx + 4},{base_y - 13}a8,7 0 1 1 16,0Z", INK))
    # walls
    tent.append(S.ink(f"M{cx - rx},{wall_top}V{base_y}"))
    tent.append(S.ink(f"M{cx + rx},{wall_top}V{base_y}"))
    tent.append(S.ink(f"M{cx - rx},{base_y}Q{cx - rx * 0.5},{base_y + ry * 1.25} {cx - 34},{base_y + ry - 1}"))
    tent.append(S.ink(f"M{cx + 34},{base_y + ry - 1}Q{cx + rx * 0.5},{base_y + ry * 1.25} {cx + rx},{base_y}"))
    tent.append(S.ink(door_open.replace("Z", ""), 2.2))
    for x in (cx - 78, cx - 50, cx + 50, cx + 78):
        y0 = wall_top + 6
        y1 = base_y + ry * math.sqrt(max(0, 1 - ((x - cx) / rx) ** 2)) * 0.95
        tent.append(S.ink(f"M{x},{y0}V{f(y1)}", 1.2))
    # tied-back flaps
    for side in (-1, 1):
        x0 = cx + side * 9
        tent.append(S.ink(f"M{x0},400Q{cx + side * 40},430 {cx + side * 30},472"
                          f"Q{cx + side * 46},450 {cx + side * 48},{base_y + ry - 6}", 2))
        tent.append(S.ink(f"M{cx + side * 26},446q{side * 8},2 {side * 16},-2", 1.4))
    # roof cone with seams and scalloped eave
    tent.append(S.ink(f"M{pt(apex)}L{cx - erx},{eave_y}"))
    tent.append(S.ink(f"M{pt(apex)}L{cx + erx},{eave_y}"))
    eave = ""
    n = 6
    prev = None
    for i in range(n + 1):
        t = math.pi - i * math.pi / n
        p = (cx + erx * math.cos(t), eave_y + 14 * math.sin(t))
        if prev:
            m = lerp(prev, p, 0.5)
            eave += f"Q{pt((m[0], m[1] + 7))} {pt(p)}"
        else:
            eave = f"M{pt(p)}"
        if 0 < i < n:
            tent.append(S.ink(f"M{pt(apex)}L{pt(p)}", 1.3))
        prev = p
    tent.append(S.ink(eave, 2.2))
    tent.append(S.ink(f"M{cx - erx},{eave_y}Q{cx},{eave_y + 30} {cx + erx},{eave_y}", 1.4))
    # pole tip and pennant
    tent.append(S.ink(f"M{pt(apex)}V{apex[1] - 22}", 2.2))
    tent.append(S.fill(f"M{cx + 1},{apex[1] - 22}l22,6l-22,6Z"))
    tent.append(S.ink(f"M{cx + 1},{apex[1] - 22}l22,6l-22,6", 1.6))
    # guy ropes and pegs
    for (x0, y0), (x1, y1) in (((cx - erx, eave_y + 2), (cx - erx - 70, base_y + 34)),
                               ((cx + erx, eave_y + 2), (cx + erx + 66, base_y + 30)),
                               ((cx - erx * 0.6, eave_y + 12), (cx - 120, base_y + 58))):
        tent.append(S.ink(f"M{x0},{y0}L{x1},{y1}", 1.2))
        tent.append(S.ink(f"M{x1 - 2},{y1 - 3}l4,10", 2))
    tent_sil = (f"M{pt(apex)}L{cx + erx},{eave_y}L{cx + rx},{eave_y + 6}V{base_y}"
                f"Q{cx},{base_y + ry * 2.3} {cx - rx},{base_y}V{eave_y + 6}L{cx - erx},{eave_y}Z")

    # ---- campfire and loungers
    fire = []
    fx, fy = 590, 552
    stones = []
    for i in range(9):
        t = math.pi * 2 * i / 9
        p = (fx + 36 * math.cos(t), fy + 11 * math.sin(t))
        if math.sin(t) > -0.2:
            stones.append(S.ink(lumpy([(p[0] - 7, p[1] + 3), (p[0], p[1] + 5), (p[0] + 7, p[1] + 3),
                                       (p[0] + 6, p[1] - 3), (p[0], p[1] - 6), (p[0] - 6, p[1] - 3)],
                                      0.25), 1.6))
    flame = (f"M{fx - 18},{fy - 2}C{fx - 26},{fy - 24} {fx - 8},{fy - 30} {fx - 10},{fy - 50}"
             f"C{fx},{fy - 40} {fx + 2},{fy - 34} {fx + 4},{fy - 62}"
             f"C{fx + 16},{fy - 44} {fx + 24},{fy - 30} {fx + 14},{fy - 20}"
             f"C{fx + 22},{fy - 22} {fx + 26},{fy - 14} {fx + 18},{fy - 2}Z")
    fire.append(S.fill(flame))
    fire.append(S.ink(flame, 2))
    fire.append(S.ink(f"M{fx - 6},{fy - 4}C{fx - 10},{fy - 16} {fx},{fy - 22} {fx + 2},{fy - 32}"
                      f"C{fx + 8},{fy - 20} {fx + 12},{fy - 12} {fx + 6},{fy - 4}", 1.4))
    for (x0, y0, x1, y1) in ((fx - 34, fy + 6, fx + 30, fy - 6), (fx - 30, fy - 6, fx + 34, fy + 6)):
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * 5, dx / L * 5
        fire.append(S.ink(f"M{f(x0 + nx)},{f(y0 + ny)}L{f(x1 + nx)},{f(y1 + ny)}"
                          f"A5,5 0 0 0 {f(x1 - nx)},{f(y1 - ny)}L{f(x0 - nx)},{f(y0 - ny)}"
                          f"A5,5 0 0 1 {f(x0 + nx)},{f(y0 + ny)}Z", 1.8))
    fire += stones
    for x, y in ((fx - 10, fy - 74), (fx + 12, fy - 88), (fx - 4, fy - 100)):
        fire.append(S.fill(f"M{x},{y}l2.5,-2.5l2.5,2.5l-2.5,2.5Z"))
    ch1, sil_ch1 = lounger(S, (488, 560), 1.0)
    ch2, sil_ch2 = lounger(S, (706, 572), 1.0, facing=-1)

    # ---- trees and string lights
    treeA, silA = tree(S, [(118, 520), (122, 440), (128, 360), (134, 280), (138, 210), (146, 150)],
                       11, 4,
                       [([(132, 300), (104, 262), (84, 236)], 5, 2),
                        ([(136, 240), (166, 206), (190, 190)], 5, 2),
                        ([(134, 330), (168, 312), (196, 306)], 4, 2)],
                       [((146, 150), -86, 56), ((84, 236), -130, 44), ((190, 190), -40, 46),
                        ((196, 306), -10, 40)])
    treeB, silB = tree(S, [(214, 520), (210, 450), (206, 380), (204, 320), (212, 262), (226, 226)],
                       8, 3.5,
                       [([(206, 360), (184, 336), (172, 320)], 3.5, 2),
                        ([(206, 290), (232, 278), (252, 276)], 3.5, 2)],
                       [((226, 226), -70, 44), ((172, 320), -130, 36), ((252, 276), -20, 36)])
    treeC, silC = tree(S, [(796, 512), (792, 440), (786, 370), (780, 300), (770, 240)], 9, 3.5,
                       [([(786, 380), (818, 352), (840, 340)], 4, 2),
                        ([(782, 320), (752, 298), (738, 292)], 4, 2),
                        ([(788, 420), (812, 404)], 3, 2)],
                       [((770, 240), -96, 50), ((840, 340), -40, 44), ((738, 292), -140, 40),
                        ((812, 404), -30, 32)])
    lights = []
    a, b = (cx + 2, apex[1] - 4), (776, 300)
    sag = [(lerp(a, b, t)[0], lerp(a, b, t)[1] + 70 * math.sin(math.pi * t)) for t in
           [i / 12 for i in range(13)]]
    lights.append(S.ink(smooth(sag), 1.3))
    for p in cr_points(sag, 2)[2:-2:3]:
        lights.append(S.ink(f"M{pt(p)}v5", 1.2))
        lights.append(S.fill(f"M{f(p[0] - 3)},{f(p[1] + 8)}a3,4 0 1 0 6,0a3,4 0 1 0 -6,0Z"))

    # ---- ground and plants
    front = []
    ground = [
        [(60, 522), (120, 520), (180, 524), (240, 520), (262, 516)],
        [(470, 520), (540, 516), (620, 520), (700, 514), (760, 512), (830, 516), (900, 524)],
        [(150, 580), (220, 570), (290, 576), (360, 590), (420, 600)],
        [(560, 604), (640, 596), (720, 600), (790, 592), (860, 604)],
        # shoreline
        [(470, 478), (540, 470), (620, 466), (700, 470), (780, 476), (860, 474), (930, 480)],
    ]
    for g in ground:
        front.append(S.ink(smooth(g), 2.2))
    b1, sb1 = bush(S, (250, 520), 64, 40)
    b2, sb2 = bush(S, (512, 478), 56, 30)
    b3, sb3 = bush(S, (860, 520), 70, 40)
    front += b1 + b2 + b3
    for base, w, h, n in (((96, 524), 60, 56, 12), ((300, 584), 54, 46, 11),
                          ((650, 600), 50, 40, 10), ((900, 528), 40, 40, 9),
                          ((790, 516), 46, 50, 10), ((460, 524), 40, 34, 8),
                          ((190, 576), 36, 30, 8)):
        front += grass(S, base, w, h, n)

    # ---- lake and hills
    back = [S.ink(S.hline((240, HZ), (940, HZ), 0.3), 2.2)]
    back.append(S.ink(smooth([(244, 404), (300, 386), (346, 376), (392, 360), (430, 352),
                              (466, 362), (506, 378), (548, 392), (590, 386), (630, 372),
                              (666, 366), (704, 378), (744, 394), (800, 400), (860, 404),
                              (940, 412)]), 2.2))
    for seg in ([(430, 352), (452, 376), (476, 396)], [(666, 366), (690, 384), (712, 398)],
                [(330, 386), (350, 400)]):
        back.append(S.ink(smooth(seg), 1.4))
    back += water_lines(S, [(432, 520, 600), (446, 640, 720), (440, 830, 900),
                            (458, 560, 610), (456, 870, 920)])

    occ_tent = [tent_sil]
    S.body.append(S.behind(occ_tent + silA + silB + silC + [sb2], back, "lake"))
    S.body.append(S.behind(occ_tent + silA + silB + silC + [sil_ch1, sil_ch2, sb1, sb2, sb3],
                           front[:len(ground)], "ground"))
    S.body.append(S.behind(silB + [sb1], tent, "tent"))
    S.body += front[len(ground):]
    S.body += treeA + treeB + treeC
    S.body.append(S.behind(silC + [tent_sil], lights, "lights"))
    S.body += fire + ch1 + ch2
    return S


def camper_van():
    S = Vignette("van", "Camper van on the coast",
                 "Line drawing of a camper van parked on a grassy clifftop with its "
                 "door open to an orange-lit interior, a surfboard on the roof, an "
                 "awning and a lounger, with the sea and headlands behind.", seed=14)
    HZ = 404

    # ---- van (profile, facing right)
    van = []
    body = ("M286,466L284,372Q284,348 308,348L512,348Q548,350 562,398L565,454Q565,466 554,466"
            "L534,466A32,32 0 0 0 470,466L374,466A32,32 0 0 0 310,466Z")
    # glass
    windows = ["M298,362h30a4,4 0 0 1 4,4v28a4,4 0 0 1 -4,4h-30a4,4 0 0 1 -4,-4v-28a4,4 0 0 1 4,-4Z",
               "M424,362h40a4,4 0 0 1 4,4v28a4,4 0 0 1 -4,4h-40a4,4 0 0 1 -4,-4v-28a4,4 0 0 1 4,-4Z",
               "M480,362h34q12,0 18,12l8,20q2,4 -3,4h-57a4,4 0 0 1 -4,-4v-28a4,4 0 0 1 4,-4Z"]
    door = "M342,358h68v104h-68Z"
    for wnd in windows:
        van.append(S.fill(wnd))
    van.append(S.fill(door))
    # interior: hanging planter, lamp, bench with cushions
    van.append(S.ink("M358,358v12", 1.4))
    van.append(S.fill("M351,370h14l-2,9h-10Z", INK))
    for side, dy in ((-1, 0), (1, 4), (-1, 10), (1, 16)):
        van.append(S.fill(f"M358,{380 + dy}q{side * 6},6 {side * 3},14q{-side * 4},-6 {-side * 3},-14Z", INK))
    van.append(S.ink("M394,358v18", 1.4))
    van.append(S.fill("M385,382a9,7 0 0 1 18,0Z", INK))
    van.append(S.fill("M344,430h64v32h-64Z", INK))
    van.append(S.fill("M350,430q0,-14 14,-14h6q10,0 10,14Z M382,430q0,-12 12,-12h4q8,0 8,12Z", INK))
    # body lines
    van.append(S.ink(body, 2.6))
    van.append(S.ink("M285,410H342M410,410H563", 1.6))
    for wnd in windows:
        van.append(S.ink(wnd, 2.2))
    van.append(S.ink(door, 2.4))
    van.append(S.ink("M476,356V462M286,440H340M412,440H564", 1.4))
    van.append(S.ink("M484,420h10", 2))
    van.append(S.ink("M556,416a6,6 0 1 0 0.1,0Z", 1.8))
    van.append(S.ink("M552,454h18a4,4 0 0 1 0,10h-18Z", 2))
    van.append(S.ink("M276,454h12v10h-12a4,4 0 0 1 0,-10Z", 2))
    van.append(S.ink("M546,376l8,-6v12Z", 1.6))
    # wheels: tyre ring with open hub
    for wx in (342, 502):
        van.append(f'<path d="M{wx - 25},476a25,25 0 1 0 50,0a25,25 0 1 0 -50,0Z'
                   f'M{wx - 12},476a12,12 0 1 0 24,0a12,12 0 1 0 -24,0Z" fill="{INK}" '
                   f'fill-rule="evenodd" stroke="none"/>')
        van.append(S.ink(f"M{wx - 4},476a4,4 0 1 0 8,0a4,4 0 1 0 -8,0Z", 1.6))
    # roof rack and surfboard
    van.append(S.ink("M304,340H520M316,340V348M412,340V348M508,340V348", 2))
    board = "M276,332Q300,318 420,318Q540,318 584,330Q540,342 420,342Q300,342 276,332Z"
    van.append(S.ink(board, 2.2))
    van.append(S.ink("M290,331Q420,328 570,330", 1.1))
    van.append(S.fill("M300,341l10,0l-8,9Z", INK))
    van_sil = (body + " M276,332Q300,318 420,318Q540,318 584,330Q540,342 420,342Q300,342 276,332Z"
               " M317,476a25,25 0 1 0 50,0a25,25 0 1 0 -50,0Z"
               " M477,476a25,25 0 1 0 50,0a25,25 0 1 0 -50,0Z"
               " M272,452h20v14h-20Z M548,452h26v14h-26Z")

    # ---- lounger, side table, lantern
    props = []
    ch, sil_ch = lounger(S, (604, 526), 1.05)
    props += ch
    props.append(S.ink("M232,494h40M236,494l6,30M268,494l-6,30M240,510h24", 2))
    props.append(S.fill("M246,478h12v4h-2v8h2v4h-12v-4h2v-8h-2Z"))
    props.append(S.ink("M246,478h12v4h-2v8h2v4h-12v-4h2v-8h-2Z", 1.4))
    props.append(S.ink("M248,478q4,-8 8,0", 1.4))
    table_sil = "M230,476h44v50h-44Z"

    # ---- trees
    treeA, silA = tree(S, [(150, 540), (152, 460), (158, 380), (166, 300), (176, 230), (190, 160)],
                       12, 4,
                       [([(162, 340), (130, 300), (106, 280)], 5, 2),
                        ([(170, 270), (210, 236), (246, 222)], 5, 2),
                        ([(180, 210), (150, 176), (136, 160)], 4, 2),
                        ([(166, 300), (200, 292), (226, 300)], 4, 2)],
                       [((190, 160), -76, 58), ((106, 280), -140, 46), ((246, 222), -26, 48),
                        ((136, 160), -120, 40), ((226, 300), 10, 38)])
    treeB, silB = tree(S, [(84, 540), (82, 470), (78, 400), (70, 340), (60, 290)], 8, 3,
                       [([(78, 410), (52, 384), (36, 374)], 3.5, 2),
                        ([(76, 380), (98, 360)], 3, 2)],
                       [((60, 290), -100, 44), ((36, 374), -150, 34), ((98, 360), -40, 32)])

    # ---- ground, cliff, plants
    front = []
    ground = [
        [(40, 540), (110, 532), (200, 530), (280, 526)],
        [(470, 520), (560, 522), (640, 528), (700, 534)],
        # cliff edge dropping to the sea
        [(700, 534), (726, 546), (744, 570), (754, 600), (760, 630)],
        [(120, 600), (220, 592), (320, 596), (420, 604), (520, 598), (620, 606), (690, 600)],
        # rocks out in the water
        [(812, 500), (826, 486), (846, 482), (862, 488), (876, 500)],
        [(880, 496), (894, 488), (910, 492), (922, 500)],
    ]
    for g in ground:
        front.append(S.ink(smooth(g), 2.2))
    for seg in ([(722, 562), (730, 584)], [(736, 600), (742, 618)], [(300, 560), (340, 562)],
                [(560, 560), (600, 564)], [(840, 490), (848, 500)], [(800, 506), (930, 506)]):
        front.append(S.ink(smooth(seg), 1.3))
    b1, sb1 = bush(S, (676, 530), 56, 34)
    b2, sb2 = bush(S, (60, 544), 50, 30)
    front += b1 + b2
    for base, w, h, n in (((120, 534), 60, 54, 12), ((216, 600), 50, 40, 10),
                          ((480, 600), 46, 38, 9), ((700, 536), 40, 44, 9),
                          ((640, 530), 40, 36, 8), ((24, 548), 40, 40, 8),
                          ((380, 530), 30, 22, 7)):
        front += grass(S, base, w, h, n)

    # ---- sea and headlands
    back = [S.ink(S.hline((20, HZ), (940, HZ), 0.3), 2.2)]
    back.append(S.ink(smooth([(600, HZ), (636, 392), (680, 380), (722, 368), (760, 372),
                              (796, 384), (830, 392), (860, 388), (900, 396), (940, 400)]), 2.2))
    back.append(S.ink(smooth([(722, 368), (744, 386), (760, 400)]), 1.4))
    back.append(S.ink(smooth([(20, 396), (60, 388), (110, 390), (150, HZ)]), 2))
    back += water_lines(S, [(424, 596, 680), (438, 640, 740), (452, 780, 900),
                            (470, 820, 870), (490, 800, 880), (440, 860, 930),
                            (430, 230, 300), (446, 480, 560)])
    sea_occ = [van_sil, sil_ch, table_sil, sb1, sb2] + silA + silB
    S.body.append(S.behind(sea_occ, back, "sea"))
    S.body.append(S.behind([van_sil, sil_ch, table_sil, sb1, sb2], front[:len(ground)], "ground"))
    S.body += front[len(ground):]
    S.body += van + props
    S.body += treeA + treeB
    return S


def main():
    OUT.mkdir(exist_ok=True)
    for name, scene in (("a-frame-cabin", a_frame), ("bell-tent-camp", bell_tent),
                        ("camper-van-coast", camper_van)):
        path = OUT / f"{name}.svg"
        path.write_text(scene().svg())
        print(f"wrote {path.relative_to(OUT.parent.parent)}")


if __name__ == "__main__":
    main()
