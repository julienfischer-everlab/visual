"""Two hero visuals for My journey's phases, in the Baseline visual's vibe: light glowing out of black, yellow to orange to red, soft, a little grain.
Action plan: cells (organic shapes, their rims glowing, their insides speckled). Re-test: ripples (concentric echoes, as a measure taken again)."""
import numpy as np
from PIL import Image, ImageFilter

W, H = 918, 594          # 1.5x the Baseline visual (612 x 396), same proportions
OUT = '/home/user/visual/assets/overview/'
PREV = '/tmp/claude-0/-home-user-visual/cd7859a0-5e19-5dd6-aa67-ac470a6b05fc/scratchpad/'
rng = np.random.default_rng(7)


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(np.float32) / 255


def blurf(a, r):  # float-preserving blur via 16-bit-ish scaling
    m = a.max() or 1
    return blur(a / m, r) * m


def smooth_noise(cells_x, cells_y, seed):
    g = np.random.default_rng(seed).random((cells_y, cells_x)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8), 'L').resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(W / cells_x / 2.2))
    return np.asarray(im).astype(np.float32) / 255


def ramp(t):
    """the Baseline palette: black -> deep red -> orange -> amber -> pale yellow"""
    stops = np.array([[0.0, 0, 0, 0], [0.25, 70, 6, 4], [0.48, 190, 38, 18], [0.68, 245, 110, 30], [0.86, 255, 175, 55], [1.0, 255, 228, 150]], np.float32)
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for i in range(len(stops) - 1):
        a, b = stops[i], stops[i + 1]
        m = (t >= a[0]) & (t <= b[0])
        f = ((t - a[0]) / (b[0] - a[0]))[m][:, None]
        out[m] = a[1:] * (1 - f) + b[1:] * f
    return out


def frame():
    """where the light may be: the left-centre, as the Baseline's (fading to black at the left edge and over the right half)"""
    x = np.linspace(0, 1, W)[None, :]
    y = np.linspace(0, 1, H)[:, None]
    fx = np.clip((x - 0.06) / 0.16, 0, 1) * np.clip((0.78 - x) / 0.3, 0, 1)
    fy = 1 - 0.15 * np.abs(y - 0.5) * 2
    return (fx * fy).astype(np.float32)


def grain(img, amt=10):
    n = rng.normal(0, amt, img.shape[:2])[..., None]
    return np.clip(img + n * (img.mean(axis=2, keepdims=True) / 255 * 0.9 + 0.1), 0, 255)


def save(arr, name):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGB')
    im.save(OUT + name, 'WEBP', quality=82, method=6)
    im.save(PREV + name.replace('.webp', '.png'))
    print(name, im.size)


# ---- Action plan: cells ----
f = 0.62 * smooth_noise(9, 6, 11) + 0.38 * smooth_noise(19, 12, 12)
f = (f - f.min()) / (f.max() - f.min())
t = 0.5
inside = (f > t).astype(np.float32)
rim = np.exp(-((f - t) / 0.018) ** 2)                      # the shapes' edges, a thin line of light
rim_glow = blurf(rim, 9) * 2.2                               # its halo
speck = smooth_noise(160, 104, 13)                           # the insides' texture: small clusters
speck = np.clip((speck - 0.55) / 0.25, 0, 1) ** 1.5 * blur(inside, 3)
depth = blur(inside, 18) * inside                            # deeper inside, darker
inner = 0.32 * inside * (1 - 0.6 * depth) + 0.55 * speck
lum = np.clip(0.95 * rim + 0.55 * rim_glow + inner, 0, 1.2) * frame()
img = ramp(lum)
img = np.asarray(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)
save(grain(img, 9), 'jv-hero-2.webp')

# ---- Re-test: ripples ----
x = np.arange(W)[None, :].astype(np.float32)
y = np.arange(H)[:, None].astype(np.float32)
cx, cy = W * 0.44, H * 0.52
warp = (smooth_noise(6, 4, 21) - 0.5) * 26                   # a little life in the circles
r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) + warp
period = 30.0
ph = (r % period) / period
rings = np.exp(-((ph - 0.5) / 0.09) ** 2)                    # the echoes
fall = np.clip(1 - r / (W * 0.42), 0, 1) ** 0.9              # fading out from the centre
core = np.exp(-(r / 46) ** 2)                                # a warm centre
rings = rings * (0.35 + 0.65 * fall) * fall ** 0.35
lum = np.clip(0.9 * rings + 0.55 * blurf(rings, 8) + 1.1 * core, 0, 1.25)
lum = lum * np.clip(frame() * 1.15, 0, 1)
img = ramp(lum)
img = np.asarray(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGB').filter(ImageFilter.GaussianBlur(0.9))).astype(np.float32)
save(grain(img, 9), 'jv-hero-3.webp')
