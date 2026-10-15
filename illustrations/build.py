#!/usr/bin/env python3
"""Build the three sunset line illustrations as SVG.

Ink is black, accents are orange, and there is no background fill, so each
file sits on whatever surface it is placed on. Run from anywhere:

    python3 illustrations/build.py

Lines that pass behind a foreground object are hidden with clip paths
(see Scene.behind), so the art stays plain strokes and fills that any SVG
renderer or design tool can open.
"""
import math
import random
from pathlib import Path

INK = "#111111"
ORANGE = "#FF5A1F"
W, H = 640, 360
FX0, FY0, FX1, FY1 = 12, 12, 628, 348  # the drawn frame

OUT = Path(__file__).resolve().parent


# ---------------------------------------------------------------- helpers

def f(v):
    s = f"{v:.1f}"
    if s.endswith(".0"):
        s = s[:-2]
    return "0" if s == "-0" else s


def pt(p):
    return f"{f(p[0])},{f(p[1])}"


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s)


def smooth(pts, closed=False, k=1.0, move=True):
    """Catmull-Rom spline through pts, as cubic Bezier path data."""
    n = len(pts)
    d = [f"M{pt(pts[0])}"] if move else []
    if n == 2:
        d.append(f"L{pt(pts[1])}")
    else:
        def get(i):
            return pts[i % n] if closed else pts[max(0, min(n - 1, i))]
        for i in range(n if closed else n - 1):
            p0, p1, p2, p3 = get(i - 1), get(i), get(i + 1), get(i + 2)
            c1 = (p1[0] + (p2[0] - p0[0]) * k / 6, p1[1] + (p2[1] - p0[1]) * k / 6)
            c2 = (p2[0] - (p3[0] - p1[0]) * k / 6, p2[1] - (p3[1] - p1[1]) * k / 6)
            d.append(f"C{pt(c1)} {pt(c2)} {pt(p2)}")
    if closed:
        d.append("Z")
    return "".join(d)


def poly(pts, closed=False):
    d = f"M{pt(pts[0])}" + "".join(f"L{pt(p)}" for p in pts[1:])
    return d + ("Z" if closed else "")


def bumps(pts, size=0.8, closed=True):
    """Lumpy outline: one rounded bump per segment, bulging to the right of
    the direction of travel (outward for a loop drawn counter-clockwise)."""
    loop = pts + [pts[0]] if closed else pts
    d = f"M{pt(loop[0])}"
    for a, b in zip(loop, loop[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        c = (a[0] + dx / 2 - dy * size, a[1] + dy / 2 + dx * size)
        d += f"Q{pt(c)} {pt(b)}"
    return d + ("Z" if closed else "")


def ellipse_pts(c, rx, ry, a0, a1, n=24):
    return [(c[0] + rx * math.cos(a0 + (a1 - a0) * i / n),
             c[1] + ry * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def solve(A, b):
    n = len(b)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(n):
            if r != c:
                k = M[r][c] / M[c][c]
                M[r] = [x - k * y for x, y in zip(M[r], M[c])]
    return [M[i][n] / M[i][i] for i in range(n)]


def homography(dst):
    """Map the unit square onto the quad dst (perspective-correct)."""
    src = [(0, 0), (1, 0), (1, 1), (0, 1)]
    A, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    h = solve(A, b)

    def m(p):
        x, y = p
        w = h[6] * x + h[7] * y + 1
        return ((h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w)
    return m


class Scene:
    def __init__(self, slug, title, desc, seed):
        self.slug, self.title, self.desc = slug, title, desc
        self.rnd = random.Random(seed)
        self.w, self.h = W, H
        self.defs = []
        self.body = []
        self.n = 0

    # -- drawing primitives (appended in painter's order)
    def ink(self, d, w=None, **attrs):
        a = f' stroke-width="{f(w)}"' if w else ""
        a += "".join(f' {k.replace("_", "-")}="{v}"' for k, v in attrs.items())
        return f'<path d="{d}"{a}/>'

    def orange_line(self, d, w=2.4):
        return f'<path d="{d}" stroke="{ORANGE}" stroke-width="{f(w)}"/>'

    def fill(self, d, color=ORANGE):
        return f'<path d="{d}" fill="{color}" stroke="none"/>'

    def hline(self, a, b, wob=0.8):
        """A straight-ish line with a slight hand-drawn bow."""
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        j = self.rnd.uniform(-wob, wob) * min(1.0, L / 60)
        c = (a[0] + dx / 2 - dy / L * j, a[1] + dy / 2 + dx / L * j)
        return f"M{pt(a)}Q{pt(c)} {pt(b)}"

    def behind(self, occluders, elements, name):
        """Wrap elements so they are hidden wherever an occluder shape sits.
        Each occluder gets its own nested even-odd clip, so overlapping
        occluders still all hide (a single even-odd clip would re-show the
        overlap)."""
        out = "".join(elements)
        for i, occ in enumerate(occluders):
            cid = f"{self.slug}-{name}-{i}"
            self.defs.append(
                f'<clipPath id="{cid}"><path clip-rule="evenodd" '
                f'd="M-20,-20H{self.w + 20}V{self.h + 20}H-20Z{occ}"/></clipPath>')
            out = f'<g clip-path="url(#{cid})">{out}</g>'
        return out

    def clip_to(self, shape_d, elements, name):
        cid = f"{self.slug}-{name}"
        self.defs.append(f'<clipPath id="{cid}"><path d="{shape_d}"/></clipPath>')
        return f'<g clip-path="url(#{cid})">{"".join(elements)}</g>'

    def svg(self):
        fid = f"{self.slug}-frame"
        self.defs.insert(0, f'<clipPath id="{fid}"><rect x="{FX0}" y="{FY0}" '
                            f'width="{FX1 - FX0}" height="{FY1 - FY0}"/></clipPath>')
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'width="{W}" height="{H}" role="img" aria-labelledby="{self.slug}-title">\n'
            f'<title id="{self.slug}-title">{self.title}</title>\n'
            f'<desc>{self.desc}</desc>\n'
            f'<defs>{"".join(self.defs)}</defs>\n'
            f'<g fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round" '
            f'stroke-linejoin="round">\n'
            f'<g clip-path="url(#{fid})">\n' + "\n".join(self.body) + '\n</g>\n'
            f'<rect x="{FX0}" y="{FY0}" width="{FX1 - FX0}" height="{FY1 - FY0}" '
            f'stroke-width="2.6"/>\n'
            '</g>\n</svg>\n'
        )


def sun_disc(S, c, r, cut_y):
    """Orange sun with its lower part sunk below the line y = cut_y."""
    dy = cut_y - c[1]
    if dy >= r:
        return S.fill(f"M{pt((c[0] - r, c[1]))}a{f(r)},{f(r)} 0 1 0 {f(2 * r)},0"
                      f"a{f(r)},{f(r)} 0 1 0 {f(-2 * r)},0Z")
    dx = math.sqrt(r * r - dy * dy)
    return S.fill(f"M{pt((c[0] - dx, cut_y))}A{f(r)} {f(r)} 0 1 1 {pt((c[0] + dx, cut_y))}Z")


def sun_glints(S, cx, y0, halves, gap=7, w=2.4):
    out = []
    for i, half in enumerate(halves):
        y = y0 + i * gap
        # split each glint into two strokes so it reads as broken water
        split = cx + S.rnd.uniform(-half * 0.3, half * 0.3)
        out.append(S.orange_line(S.hline((cx - half, y), (split - 2, y), 0.3), w))
        out.append(S.orange_line(S.hline((split + 3, y), (cx + half, y), 0.3), w))
    return out


def water(S, rows, x0, x1, avoid=(), dash=(16, 70), gap=(12, 50), w=1.5):
    """Rows of short horizontal strokes; avoid = [(xa, xb, y_max)] keeps clear."""
    out = []
    for y in rows:
        x = x0 + S.rnd.uniform(-10, 40)
        while x < x1:
            L = S.rnd.uniform(*dash)
            a, b = x, min(x + L, x1 + 10)
            ok = all(not (y < ym and b > xa and a < xb) for xa, xb, ym in avoid)
            if ok and S.rnd.random() > 0.18:
                yy = y + S.rnd.uniform(-0.8, 0.8)
                out.append(S.ink(S.hline((a, yy), (b, yy + S.rnd.uniform(-0.6, 0.6)), 0.5), w))
            x = b + S.rnd.uniform(*gap)
    return out


# ---------------------------------------------------------------- scene 1

def lounger(S, O, u=(96, -4), v=(36, -16), w=(38, -58), h=24, t=7):
    """Slatted sun lounger: seat slab, raised backrest, legs.
    O is the ground point under the front corner of the foot end.
    Returns (elements, silhouette path data)."""
    A = (O[0], O[1] - h)
    B, D = add(A, u), add(A, v)
    C = add(B, v)
    A2, B2, C2 = (A[0], A[1] + t), (B[0], B[1] + t), (C[0], C[1] + t)
    BW, CW = add(B, w), add(C, w)
    g = h - t
    els = []
    # seat slab
    els.append(S.ink(poly([A, B, C, D], True)))
    els.append(S.ink(poly([A, A2, B2, C2, C])))
    els.append(S.ink(poly([B, B2]), 1.6))
    for i in range(1, 8):
        s = i / 8
        els.append(S.ink(poly([lerp(A, B, s), lerp(D, C, s)]), 1.3))
    # backrest
    els.append(S.ink(poly([B, BW, CW, C])))
    for i in range(1, 6):
        s = i / 6
        els.append(S.ink(poly([lerp(B, BW, s), lerp(C, CW, s)]), 1.3))
    # legs and the backrest prop
    for p in (A2, B2, C2):
        els.append(S.ink(poly([p, (p[0], p[1] + g)])))
    prop = lerp(C, CW, 0.55)
    foot = (C2[0] + 14, C2[1] + g - 4)
    els.append(S.ink(poly([prop, foot]), 1.8))
    # shadow strokes
    gy = O[1] + 3
    els.append(S.ink(S.hline((A[0] - 4, gy), (B2[0] + 12, gy - 3), 0.4), 1.3))
    els.append(S.ink(S.hline((A[0] + 16, gy + 5), (B2[0] - 6, gy + 3), 0.4), 1.1))
    # where the backrest edge meets the seat's back edge
    X = add(B, w, (C[1] - B[1]) / w[1])
    sil = poly([(A2[0], A2[1] + g), A2, A, D, X, BW, CW, C, C2, (C2[0], C2[1] + g),
                (foot[0] + 2, foot[1] + 1), (B2[0], B2[1] + g)], True)
    return els, sil


def beach():
    S = Scene("beach", "Beach umbrella at sunset",
              "Line drawing of a beach umbrella and two sun loungers facing a "
              "calm sea, with the sun setting on the horizon.", seed=11)
    HZ = 216
    SUN = (527, 172)
    apex, base = (290, 38), (275, 334)

    def pole_x(y):
        return apex[0] + (base[0] - apex[0]) * (y - apex[1]) / (base[1] - apex[1])

    # --- foreground silhouettes
    chair_l, sil_l = lounger(S, (88, 330))
    chair_r, sil_r = lounger(S, (304, 330))
    pole_band = poly([(apex[0] - 4, apex[1]), (apex[0] + 4, apex[1]),
                      (base[0] + 4, base[1]), (base[0] - 4, base[1])], True)

    # --- sky and sea (behind everything)
    back = [sun_disc(S, SUN, 50, HZ)]
    back += sun_glints(S, SUN[0], HZ + 7, [30, 21, 13, 6])
    back.append(S.ink(S.hline((FX0 - 4, HZ), (FX1 + 4, HZ), 0.3), 2.2))
    # headland on the left
    back.append(S.ink(smooth([(4, 136), (16, 139), (28, 146), (40, 147), (52, 152),
                              (62, 162), (74, 170), (88, 176), (100, 186), (110, 197),
                              (124, 205), (140, 211), (160, HZ)])))
    back.append(S.ink(smooth([(4, 164), (20, 168), (34, 176), (48, 184), (58, 194),
                              (66, 206), (72, HZ)]), 1.6))
    for seg in ([(34, 152), (44, 160), (48, 172)], [(84, 184), (92, 194), (96, 206)],
                [(112, 204), (122, 212)], [(18, 186), (30, 196), (36, 210)]):
        back.append(S.ink(smooth(seg), 1.2))
    # low island on the horizon
    back.append(S.ink(smooth([(290, HZ), (297, 209), (308, 205), (320, 204), (330, 200),
                              (342, 199), (352, 202), (364, 200), (378, 197), (392, 199),
                              (404, 203), (418, 201), (432, 204), (446, 207), (458, 211),
                              (468, HZ)]), 1.7))
    back.append(S.ink(smooth([(330, 207), (346, 205), (360, 208)]), 1.1))
    back.append(S.ink(smooth([(392, 206), (408, 208), (420, 207)]), 1.1))
    # sea
    back += water(S, [223, 230, 238, 247, 257, 268, 280], FX0, FX1,
                  avoid=[(SUN[0] - 40, SUN[0] + 40, HZ + 34)])
    # wash line and foam
    shore = [(x, 295 + 3 * math.sin(x / 47) + S.rnd.uniform(-1, 1))
             for x in range(0, 661, 40)]
    back.append(S.ink(smooth(shore), 1.9))
    for x in range(30, 620, 70):
        x += S.rnd.uniform(-12, 12)
        y = 302 + 2 * math.sin(x / 31)
        back.append(S.ink(S.hline((x, y), (x + S.rnd.uniform(18, 40), y + 0.5), 0.6), 1.2))
    # sand
    back.append(S.ink(smooth([(452, 344), (492, 336), (540, 332), (584, 335), (634, 329)]), 1.6))
    for x, y in [(70, 336), (196, 340), (232, 322), (448, 318), (520, 314), (596, 316),
                 (610, 342), (40, 318), (566, 324)]:
        back.append(S.ink(S.hline((x, y), (x + S.rnd.uniform(6, 12), y - 1), 0.3), 1.2))

    S.body.append(S.behind([sil_l, sil_r, pole_band], back, "sea"))

    # --- umbrella
    rx, ry, cy = 170, 13, 100
    cx = pole_x(cy + ry)
    N = 6
    tips = []
    for i in range(N + 1):
        # halfway between even spacing and true ellipse spacing reads best
        t = i / N
        x = cx - rx + 2 * rx * (0.5 * (0.5 - 0.5 * math.cos(math.pi * t)) + 0.5 * t)
        tips.append((x, cy + ry * math.sqrt(max(0.0, 1 - ((x - cx) / rx) ** 2))))

    def rib_ctrl(tip):
        dx, dy = tip[0] - apex[0], tip[1] - apex[1]
        L = math.hypot(dx, dy)
        bow = 9 * abs(dx) / rx
        n = (dy / L, -dx / L) if dx < 0 else (-dy / L, dx / L)
        return (apex[0] + dx / 2 + n[0] * bow, apex[1] + dy / 2 + n[1] * bow)

    def rim_ctrl(a, b):
        return (a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2 - 3)

    def flap_ctrl(a, b):
        return (a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2 + 14)

    canopy = []
    for i in range(N):
        a, b = tips[i], tips[i + 1]
        if i % 2 == 0:
            canopy.append(S.fill(
                f"M{pt(apex)}Q{pt(rib_ctrl(a))} {pt(a)}Q{pt(rim_ctrl(a, b))} {pt(b)}"
                f"Q{pt(rib_ctrl(b))} {pt(apex)}Z"))
            canopy.append(S.fill(f"M{pt(a)}Q{pt(rim_ctrl(a, b))} {pt(b)}"
                                 f"Q{pt(flap_ctrl(a, b))} {pt(a)}Z"))
    for tip in tips:
        canopy.append(S.ink(f"M{pt(apex)}Q{pt(rib_ctrl(tip))} {pt(tip)}"))
    for a, b in zip(tips, tips[1:]):
        canopy.append(S.ink(f"M{pt(a)}Q{pt(rim_ctrl(a, b))} {pt(b)}", 1.7))
        canopy.append(S.ink(f"M{pt(a)}Q{pt(flap_ctrl(a, b))} {pt(b)}"))
    canopy.append(S.ink(poly([apex, (apex[0] + 0.6, apex[1] - 7)])))
    canopy.append(f'<circle cx="{f(apex[0] + 0.7)}" cy="{f(apex[1] - 9)}" r="2.6" '
                  f'fill="{INK}" stroke="none"/>')
    # pole, tilt joint, sand
    top = (pole_x(tips[3][1]), tips[3][1])
    canopy.append(S.ink(poly([top, base]), 3))
    jy = 178
    jx = pole_x(jy)
    canopy.append(S.ink(f"M{pt((jx - 4, jy - 6))}h8v12h-8Z", 1.6))
    canopy.append(S.ink(f"M{pt((base[0] - 18, base[1] + 4))}Q{pt((base[0], base[1] - 6))} "
                        f"{pt((base[0] + 18, base[1] + 4))}", 1.6))
    S.body += canopy
    S.body += chair_l + chair_r
    return S


# ---------------------------------------------------------------- scene 2

def coastal_drive():
    S = Scene("drive", "Coastal drive at sunset",
              "Line drawing of an off-road car driving a winding cliff road "
              "beside the sea, with the sun setting on the horizon.", seed=5)
    HZ = 172
    SUN = (528, 126)

    # --- the car, seen from behind
    car = []
    roof = [(232, 220), (242, 209), (352, 209), (357, 214)]
    sil_car = poly([(203, 240), (212, 236), (220, 232), (226, 224), (232, 219), (242, 208),
                    (352, 208), (358, 214), (359, 294), (364, 297), (364, 309), (355, 312),
                    (355, 334), (333, 334), (333, 318), (252, 318), (251, 334), (227, 334),
                    (226, 316), (221, 318), (205, 318), (205, 290), (207, 258), (203, 251)],
                   True)
    # tyres
    car.append(S.fill("M228,309h22v23a2,2 0 0 1 -2,2h-18a2,2 0 0 1 -2,-2Z", INK))
    car.append(S.fill("M334,309h20v23a2,2 0 0 1 -2,2h-16a2,2 0 0 1 -2,-2Z", INK))
    car.append(S.fill("M206,293h15v23a2,2 0 0 1 -2,2h-11a2,2 0 0 1 -2,-2Z", INK))
    # underside
    car.append(S.fill("M250,309H336V318H250Z", INK))
    # rear body
    car.append(S.ink("M253,214H355Q358,214 358,217V294H252V217Q252,214 253,214Z"))
    car.append(S.ink(poly(roof)))
    car.append(S.ink(poly([(248, 205), (348, 205)]), 1.6))
    for x in (258, 342):
        car.append(S.ink(poly([(x, 205), (x, 209)]), 1.6))
    # side of the car, receding to the left
    car.append(S.ink(smooth([(232, 219), (226, 226), (222, 236), (219, 250)])))
    car.append(S.ink(poly([(219, 250), (210, 256), (207, 260), (206, 288)])))
    car.append(S.ink(poly([(252, 296), (230, 294), (220, 292)])))
    car.append(S.ink("M248,224L236,227L233,250L248,250Z", 1.7))
    car.append(S.ink("M232,228L227,233L225,250L230,250Z", 1.5))
    car.append(S.ink("M203,294Q213,282 224,292", 1.6))
    # mirror
    car.append(S.ink("M219,244L213,244", 1.6))
    car.append(S.ink("M204,238h9v12h-9Z", 1.8))
    # rear window and glare
    car.append(S.ink("M264,222H344Q347,222 347,225V246Q347,249 344,249H264Q261,249 261,246V225Q261,222 264,222Z"))
    car.append(S.ink(poly([(318, 226), (306, 244)]), 1.2))
    car.append(S.ink(poly([(326, 226), (316, 240)]), 1.2))
    # spare wheel
    car.append(S.ink("M310,246a22,22 0 1 0 0.1,0Z", 2.4))
    car.append(S.ink("M310,254a14,14 0 1 0 0.1,0Z", 1.4))
    car.append(S.ink("M310,263a5,5 0 1 0 0.1,0Z", 1.6))
    # tail lights
    car.append(S.fill("M255,258h7v22h-7Z"))
    car.append(S.fill("M348,258h7v22h-7Z"))
    car.append(S.ink("M255,258h7v22h-7Z", 1.4))
    car.append(S.ink("M348,258h7v22h-7Z", 1.4))
    # plate, bumper
    car.append(S.ink("M266,281h20v10h-20Z", 1.4))
    car.append(S.ink("M248,294H362Q365,294 365,297V306Q365,309 362,309H248Q245,309 245,306V297Q245,294 248,294Z"))
    car.append(S.ink(poly([(262, 301), (348, 301)]), 1.1))
    # shadow
    for y, a, b in ((337, 214, 362), (341, 230, 348)):
        car.append(S.ink(S.hline((a, y), (b, y), 0.3), 1.4))

    # --- bush at the roadside on the left
    bush_out = [(-4, 296), (10, 298), (24, 296), (38, 298), (52, 292), (62, 284), (68, 272),
                (66, 260), (60, 250), (52, 242), (42, 236), (30, 230), (18, 228), (4, 230),
                (-6, 234)]
    sil_bush = bumps(bush_out, 0.42)
    bush = [S.ink(sil_bush, 1.8)]
    for seg in ([(14, 280), (26, 268), (34, 256)], [(30, 288), (40, 276), (48, 262)],
                [(20, 250), (28, 244)], [(46, 270), (54, 262)], [(10, 262), (18, 256)]):
        bush.append(S.ink(smooth(seg), 1.2))

    # --- road and guard rail (behind car and bush)
    road = []
    far_edge = [(-10, 252), (60, 254), (140, 257), (220, 262), (290, 270), (350, 282),
                (410, 300), (466, 322), (520, 346), (556, 366), (600, 392)]
    near_edge = [(-10, 268), (60, 270), (120, 276), (158, 288), (178, 304), (180, 322),
                 (172, 340), (164, 356)]
    road.append(S.ink(smooth(far_edge), 1.8))
    road.append(S.ink(smooth(near_edge)))
    road.append(S.ink(smooth([(-10, 260), (60, 262), (140, 266), (220, 272), (290, 284),
                              (350, 300), (390, 322), (420, 348), (430, 362)]), 1.6,
                      stroke_dasharray="12 12"))
    # rail: posts + two beams, growing toward the viewer
    rail_pts = []
    for i in range(len(far_edge) - 1):
        for s in (0, 0.5):
            rail_pts.append(lerp(far_edge[i], far_edge[i + 1], s))
    rail_pts.append(far_edge[-1])

    def rail_h(x):
        return 6 + 18 * max(0.0, min(1.0, (x - 0) / 540)) ** 1.6

    top = [(x, y - rail_h(x)) for x, y in rail_pts]
    mid = [(x, y - rail_h(x) * 0.55) for x, y in rail_pts]
    road.append(S.ink(smooth(top), 2.2))
    road.append(S.ink(smooth(mid), 1.6))
    x = 30
    while x < 600:
        # locate the edge point at this x
        for a, b in zip(far_edge, far_edge[1:]):
            if a[0] <= x <= b[0]:
                y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])
                break
        hh = rail_h(x)
        pw = 1.6 + hh * 0.12
        road.append(S.fill(f"M{pt((x - pw / 2, y - hh - 1))}h{f(pw)}v{f(hh + 1)}h{f(-pw)}Z", INK))
        x += 14 + hh * 1.6
    # embankment strokes on the left of the road
    for seg in ([(80, 300), (120, 304), (146, 318)], [(60, 322), (110, 326), (136, 342)],
                [(90, 346), (120, 352)], [(20, 316), (50, 318)]):
        road.append(S.ink(smooth(seg), 1.2))

    # --- sea, sun, cliffs (furthest back)
    back = [sun_disc(S, SUN, 50, HZ)]
    back += sun_glints(S, SUN[0], HZ + 8, [26, 18, 10], gap=9)
    back.append(S.orange_line(S.hline((SUN[0] - 3, HZ + 38), (SUN[0] + 3, HZ + 38), 0.1), 2.4))
    back.append(S.ink(S.hline((148, HZ), (FX1 + 4, HZ), 0.3), 2.1))
    back += water(S, [180, 188, 198, 210, 224, 240, 258], 150, FX1,
                  avoid=[(SUN[0] - 34, SUN[0] + 34, HZ + 42)], dash=(20, 90), gap=(16, 60))
    # distant ridge
    back.append(S.ink(smooth([(132, 116), (150, 116), (168, 121), (184, 130), (198, 135),
                              (212, 131), (228, 128), (248, 128), (266, 127), (282, 131),
                              (300, 136), (322, 140), (350, 146), (380, 155), (404, 164),
                              (416, HZ)]), 1.9))
    for seg in ([(170, 136), (190, 148), (206, 160)], [(258, 140), (284, 150), (304, 160)],
                [(318, 152), (350, 158), (376, 166)], [(216, 142), (236, 150)]):
        back.append(S.ink(smooth(seg), 1.2))
    # cliff
    cliff = [(-20, 66), (4, 70), (24, 74), (46, 82), (72, 90), (98, 96), (118, 100), (130, 104),
             (134, 114), (138, 134), (142, 154), (146, 172), (154, 192), (166, 210),
             (182, 226), (200, 240), (222, 252), (240, 258)]
    back.append(S.ink(smooth(cliff[1:])))
    sil_cliff = smooth(cliff) + "L240,300L-20,300Z"
    back.append(S.ink(smooth([(4, 112), (30, 116), (60, 122), (92, 124), (114, 120),
                              (124, 116)]), 1.6))
    for seg in ([(118, 106), (122, 124), (126, 146)], [(108, 128), (114, 150), (124, 172)],
                [(96, 140), (104, 168), (118, 192), (138, 214)], [(130, 160), (136, 182)],
                [(124, 196), (146, 218), (170, 234)], [(64, 136), (74, 162), (88, 186),
                                                      (110, 212), (132, 232)],
                [(20, 140), (30, 170), (42, 200)], [(150, 236), (176, 246), (198, 252)]):
        back.append(S.ink(smooth(seg), 1.2))
    # the cliff-top road and a tiny car on it
    back.append(S.ink(smooth([(4, 86), (40, 92), (80, 100), (112, 108)]), 1.3))
    back.append(S.fill("M84,90q1,-5 5,-5h9q4,0 5,5v4h-19Z", INK))

    occ_all = [sil_car, sil_bush]
    sea = back[:]
    cliff_art = sea[sea.index(S.ink(smooth(cliff[1:]))):]
    sea = sea[:len(sea) - len(cliff_art)]
    S.body.append(S.behind(occ_all + [sil_cliff], sea, "sea"))
    S.body.append(S.behind(occ_all, cliff_art, "cliff"))
    S.body.append(S.behind(occ_all, road, "road"))
    S.body += bush + car
    return S


# ---------------------------------------------------------------- scene 3

def picnic():
    S = Scene("picnic", "Picnic by the lake at sunset",
              "Line drawing of a picnic under a tree: a basket, oranges, a "
              "bottle and a book on a checked blanket, with the sun setting "
              "behind the hills.", seed=23)
    HZ = 168
    SUN = (520, 130)

    # --- picnic objects (front)
    # basket
    bc, brx, bry = (166, 250), 46, 9
    body_l, body_r = (120, 250), (212, 250)
    bot_c, bot_rx = (166, 300), 40
    basket_sil = (f"M{pt(body_l)}"
                  + smooth(ellipse_pts(bc, brx, bry, math.pi, 2 * math.pi, 16), move=False)
                  + f"L{pt((bot_c[0] + bot_rx, bot_c[1]))}"
                  + smooth(ellipse_pts(bot_c, bot_rx, 8, 0, math.pi, 16), move=False) + "Z")
    handle_out = [(136, 250), (138, 226), (150, 208), (166, 202), (182, 208), (194, 226),
                  (196, 250)]
    handle_in = [(144, 250), (146, 229), (155, 215), (166, 211), (177, 215), (186, 229),
                 (188, 250)]
    handle_sil = smooth(handle_out) + "L" + smooth(handle_in[::-1])[1:] + "Z"
    # bottle
    bx = 290
    bottle_pts = [(bx - 12, 290), (bx - 12, 240), (bx - 11, 233), (bx - 6, 226), (bx - 4.5, 220),
                  (bx - 4.5, 204), (bx - 5.5, 202), (bx - 5.5, 197), (bx + 5.5, 197),
                  (bx + 5.5, 202), (bx + 4.5, 204), (bx + 4.5, 220), (bx + 6, 226),
                  (bx + 11, 233), (bx + 12, 240), (bx + 12, 290)]
    bottle_sil = poly(bottle_pts, True)
    # book
    bk = [(330, 268), (384, 260), (410, 278), (354, 288)]
    th = 10
    book_sil = poly([bk[0], bk[1], bk[2], (bk[2][0], bk[2][1] + th), (bk[3][0], bk[3][1] + th),
                     (bk[0][0], bk[0][1] + th)], True)

    objects = []
    # basket
    objects.append(S.ink(smooth(handle_out), 2))
    objects.append(S.ink(smooth(handle_in), 1.6))
    weave = []
    for i in range(-8, 9):
        xt = bc[0] + i * 5.6
        xb = bot_c[0] + i * 5.0
        weave.append(S.ink(poly([(xt, 240), (xb, 312)]), 1))
    for j in range(1, 9):
        yy = 252 + j * 5.6
        rxx = brx - (brx - bot_rx) * (yy - 250) / 50
        weave.append(S.ink(smooth(ellipse_pts((bc[0], yy), rxx, 8, 0.05, math.pi - 0.05, 12)), 1))
    objects.append(S.clip_to(basket_sil, weave, "weave"))
    objects.append(S.ink(f"M{pt(body_l)}L{pt((bot_c[0] - bot_rx, bot_c[1]))}"
                         + smooth(ellipse_pts(bot_c, bot_rx, 8, math.pi, 0, 16), move=False)
                         + f"L{pt(body_r)}"))
    objects.append(S.ink(smooth(ellipse_pts(bc, brx, bry, 0, 2 * math.pi, 32), closed=False)))
    objects.append(S.ink(smooth(ellipse_pts((bc[0], bc[1] + 6), brx - 1, bry, 0.1, math.pi - 0.1, 16)), 1.6))
    objects.append(S.ink(smooth(ellipse_pts(bc, brx - 5, bry - 3, math.pi + 0.15, 2 * math.pi - 0.15, 16)), 1.3))
    # oranges: back one first so the front pair overlaps it
    for (ox, oy, r) in [(238, 268, 9.5), (226, 284, 10.5), (251, 286, 10.5)]:
        circle = f"M{pt((ox - r, oy))}a{f(r)},{f(r)} 0 1 0 {f(2 * r)},0a{f(r)},{f(r)} 0 1 0 {f(-2 * r)},0Z"
        objects.append(S.fill(circle))
        objects.append(S.ink(circle, 1.8))
        objects.append(S.ink(poly([(ox, oy - r + 1), (ox + 1, oy - r - 3)]), 1.4))
        objects.append(S.ink(f"M{pt((ox + 1, oy - r - 1))}q5,-4 9,-1q-5,4 -9,1Z", 1.2))
    # bottle
    objects.append(S.ink(bottle_sil))
    objects.append(S.ink(poly([(bx - 4.5, 207), (bx + 4.5, 207)]), 1.4))
    objects.append(S.ink("M%s,252h20v22h-20Z" % f(bx - 10), 1.4))
    objects.append(S.ink(poly([(bx - 7, 238), (bx - 7, 248)]), 1.2))
    # book: cover, page block, spine
    objects.append(S.ink(poly(bk, True)))
    objects.append(S.ink(poly([bk[3], (bk[3][0], bk[3][1] + th), (bk[2][0], bk[2][1] + th), bk[2]])))
    objects.append(S.ink(poly([bk[3], (bk[3][0], bk[3][1] + th), (bk[0][0], bk[0][1] + th), bk[0]])))
    for k in (3.3, 6.6):
        objects.append(S.ink(poly([(bk[3][0] + 2, bk[3][1] + k), (bk[2][0] - 2, bk[2][1] + k)]), 1))
    objects.append(S.ink(poly([lerp(bk[0], bk[3], 0.08), lerp(bk[1], bk[2], 0.08)]), 1.2))

    # --- blanket
    quad = [(66, 278), (446, 264), (540, 360), (12, 344)]
    m = homography(quad)
    cols, rows = 6, 4
    blanket = [S.ink(poly([m(p) for p in [(0, 0), (1, 0), (1, 1), (0, 1)]], True), 2)]
    for i in range(1, cols):
        blanket.append(S.ink(poly([m((i / cols, 0)), m((i / cols, 1))]), 1.7))
    for j in range(1, rows):
        blanket.append(S.ink(poly([m((0, j / rows)), m((1, j / rows))]), 1.7))
    # fringe at the two short ends
    for j in range(1, 24):
        s = j / 24
        for a, b in (((0, s), (-0.018, s)), ((1, s), (1.018, s))):
            blanket.append(S.ink(poly([m(a), m(b)]), 1))
    occ_objects = [basket_sil, bottle_sil, book_sil]

    # --- tree
    trunk_l = [(18, 270), (26, 246), (34, 222), (42, 196), (50, 170), (58, 146), (66, 120),
               (70, 96), (70, 74), (68, 50)]
    crotch = [(92, 52), (90, 74), (94, 92), (108, 96), (132, 86), (164, 72), (200, 60),
              (236, 50), (258, 42)]
    trunk_r = [(64, 268), (66, 246), (70, 222), (78, 196), (90, 170), (106, 146), (128, 126),
               (156, 110), (190, 94), (226, 80), (262, 68), (296, 52)]
    tree_sil = (smooth(trunk_l) + "L" + smooth(crotch)[1:] + "L" + smooth(trunk_r[::-1])[1:]
                + "Z")
    tree = [S.ink(smooth(trunk_l), 2.4), S.ink(smooth(crotch), 2.2), S.ink(smooth(trunk_r), 2.4)]
    # roots
    tree.append(S.ink(smooth([(2, 278), (10, 276), (18, 270)]), 2))
    tree.append(S.ink(smooth([(64, 268), (72, 274), (86, 278)]), 2))
    # bark
    for seg in ([(40, 232), (46, 208), (54, 186)], [(58, 204), (62, 186)],
                [(72, 156), (82, 138), (96, 126)], [(34, 258), (38, 242)],
                [(150, 104), (176, 94)], [(80, 100), (82, 80)]):
        tree.append(S.ink(smooth(seg), 1.2))
    # twigs reaching into the leaves
    twigs = []
    for seg, wdt in (([(150, 82), (164, 62), (172, 44), (176, 30)], 2),
                     ([(198, 62), (210, 46), (220, 30)], 1.8),
                     ([(224, 78), (238, 88), (244, 98)], 1.7),
                     ([(296, 56), (316, 70), (328, 84)], 1.7),
                     ([(68, 100), (52, 86), (36, 62)], 1.8),
                     ([(86, 80), (104, 62), (124, 50)], 1.6)):
        twigs.append(S.ink(smooth(seg), wdt))
    # leaf clumps, each loop drawn counter-clockwise so the bumps face out
    clumps = [
        [(-8, 56), (12, 62), (32, 58), (50, 64), (68, 58), (86, 62), (104, 54), (120, 56),
         (134, 46), (142, 30), (138, 12), (138, -8), (-8, -8)],
        [(146, 30), (158, 42), (176, 46), (194, 44), (210, 36), (220, 22), (216, -8),
         (146, -8), (142, 14)],
        [(230, 40), (246, 50), (264, 54), (282, 52), (300, 58), (318, 54), (336, 58),
         (354, 52), (372, 56), (390, 50), (406, 52), (420, 42), (432, 30), (434, 12),
         (430, -8), (232, -8), (226, 20)],
        [(230, 106), (246, 112), (260, 104), (262, 92), (250, 84), (236, 86), (228, 96)],
        [(316, 96), (332, 102), (346, 94), (346, 82), (334, 76), (320, 78), (314, 88)],
    ]
    leaves_sil = [bumps(c, 0.45) for c in clumps]
    leaves = [S.ink(d, 1.9) for d in leaves_sil]
    for x, y in [(30, 36), (96, 30), (182, 26), (300, 36), (380, 28), (246, 98)]:
        leaves.append(S.ink(f"M{pt((x - 6, y))}q3,-4 6,0q3,-4 6,0", 1.2))

    # --- lake, hills, sun
    back = []
    hills = [(258, 158), (276, 152), (300, 146), (326, 140), (350, 133), (374, 136),
             (400, 142), (430, 146), (460, 150), (490, 154), (516, 156), (544, 150),
             (568, 143), (592, 146), (612, 139), (640, 134)]
    sky = smooth(hills) + "L640,-20L240,-20Z"
    back.append(S.clip_to(sky, [sun_disc(S, SUN, 48, HZ)], "sky"))
    back += sun_glints(S, SUN[0], HZ + 9, [22, 12], gap=8)
    back.append(S.ink(S.hline((FX0 - 4, HZ), (FX1 + 4, HZ), 0.3), 2.1))
    back.append(S.ink(smooth(hills), 1.9))
    near_hill = [(110, 140), (130, 128), (152, 124), (172, 126), (196, 132), (218, 140),
                 (240, 150), (262, 160), (286, HZ)]
    back.append(S.ink(smooth(near_hill), 2))
    for seg in ([(168, 134), (186, 146), (198, 160)], [(226, 152), (240, 162)],
                [(360, 142), (372, 154), (380, 164)], [(552, 156), (566, 164)],
                [(440, 154), (468, 160), (486, 166)], [(596, 152), (618, 158)]):
        back.append(S.ink(smooth(seg), 1.2))
    shore = [(40, 214), (120, 220), (220, 228), (320, 238), (420, 250), (520, 264), (650, 282)]
    back += water(S, [176, 184, 193, 203], 60, FX1,
                  avoid=[(SUN[0] - 30, SUN[0] + 30, HZ + 22)], dash=(18, 80), gap=(18, 60))
    for y in (214, 226, 240, 254):
        # start each lower row where the shore has dropped below it
        x0 = next(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])
                  for a, b in zip(shore, shore[1:]) if a[1] <= y <= b[1])
        back += water(S, [y], x0 + 30, FX1, dash=(18, 70), gap=(20, 60))
    # edge of the meadow
    back.append(S.ink(smooth(shore), 2))
    back.append(S.ink(smooth([(250, 245), (350, 255), (450, 268), (550, 284), (650, 300)]),
                      1.3))
    # grass tufts
    for x, y in [(560, 334), (604, 316), (486, 318), (24, 304), (112, 272), (530, 302)]:
        back.append(S.ink(f"M{pt((x - 4, y))}q-1,-4 -4,-7M{pt((x, y))}q0,-5 1,-10"
                          f"M{pt((x + 4, y))}q1,-4 4,-7", 1.2))

    blanket_sil = poly([m(p) for p in [(-0.02, 0), (1.02, 0), (1.02, 1), (-0.02, 1)]], True)
    occ_front = occ_objects + [handle_sil, blanket_sil]
    S.body.append(S.behind(occ_front + [tree_sil] + leaves_sil, back, "lake"))
    S.body.append(S.behind(occ_objects, blanket, "blanket"))
    S.body.append(S.behind(leaves_sil, tree + twigs, "tree"))
    S.body += leaves
    S.body += objects
    return S


def main():
    for name, scene in (("beach-umbrella", beach), ("coastal-drive", coastal_drive),
                        ("picnic-sunset", picnic)):
        path = OUT / f"{name}.svg"
        path.write_text(scene().svg())
        print(f"wrote {path.relative_to(OUT.parent)}")


if __name__ == "__main__":
    main()
