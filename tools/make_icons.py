#!/usr/bin/env python3
"""Generate the extension icons with no third-party deps.

Draws a BRAIN silhouette (union of overlapping circles, indigo->violet gradient)
with a white play triangle in the middle. Deliberately not a red rounded square,
so it doesn't read as the YouTube logo. Supersampled 4x and box-downsampled
(premultiplied) for clean edges.

Run from the repo root:  python3 tools/make_icons.py
"""
import os
import struct
import zlib

SS = 4  # supersample factor
TOP = (124, 77, 255)     # indigo  (#7C4DFF)
BOT = (78, 39, 214)      # violet  (#4E27D6)
FG = (255, 255, 255)     # play triangle

# Brain silhouette = union of these circles, in normalized (fx, fy, fr) coords.
# Irregular sizes + a wide, flat-ish spread reads as a brain (uniform puffs read
# as a cloud) at small sizes.
BUMPS = [
    (0.27, 0.38, 0.135), (0.42, 0.30, 0.130), (0.58, 0.29, 0.150), (0.73, 0.37, 0.125),
    (0.22, 0.53, 0.150), (0.79, 0.52, 0.140),
    (0.50, 0.46, 0.250), (0.50, 0.59, 0.235),
    (0.33, 0.70, 0.135), (0.50, 0.73, 0.140), (0.67, 0.70, 0.130),
]
# Play triangle, normalized, pointing right.
TRI = [(0.435, 0.37), (0.435, 0.63), (0.655, 0.50)]

# Darker grooves that suggest brain folds (thin rings) + a center seam between
# the two hemispheres. The play triangle is drawn on top, so the seam naturally
# breaks around it.
GROOVES = [
    (0.30, 0.46, 0.105), (0.31, 0.63, 0.100),
    (0.70, 0.46, 0.105), (0.69, 0.63, 0.100),
]
SEAM_HALF = 0.022      # half-width of the center seam (normalized)
GROOVE_HALF = 0.020    # half-thickness of a groove ring (normalized)
DARK = 0.70            # how much to darken seam/groove pixels


def in_brain(x, y, w, h):
    for fx, fy, fr in BUMPS:
        cx, cy, r = fx * w, fy * h, fr * min(w, h)
        if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
            return True
    return False


def in_triangle(x, y, w, h):
    p = (x, y)
    pts = [(fx * w, fy * h) for fx, fy in TRI]

    def sign(a, b, c):
        return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])

    d1, d2, d3 = sign(p, pts[0], pts[1]), sign(p, pts[1], pts[2]), sign(p, pts[2], pts[0])
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)


def _is_dark(x, y, w, h):
    m = min(w, h)
    if abs(x - 0.5 * w) < SEAM_HALF * m:
        return True
    for gx, gy, gr in GROOVES:
        d = ((x - gx * w) ** 2 + (y - gy * h) ** 2) ** 0.5
        if abs(d - gr * m) < GROOVE_HALF * m:
            return True
    return False


def subpixel(x, y, w, h):
    # Premultiplied (R, G, B, A) for one supersample point.
    if in_triangle(x, y, w, h):
        return (FG[0], FG[1], FG[2], 255)
    if in_brain(x, y, w, h):
        t = y / (h - 1)
        r = round(TOP[0] + (BOT[0] - TOP[0]) * t)
        g = round(TOP[1] + (BOT[1] - TOP[1]) * t)
        b = round(TOP[2] + (BOT[2] - TOP[2]) * t)
        if _is_dark(x, y, w, h):
            r, g, b = round(r * DARK), round(g * DARK), round(b * DARK)
        return (r, g, b, 255)
    return (0, 0, 0, 0)


def render(size):
    big = size * SS
    out = bytearray()
    n = SS * SS
    for y in range(size):
        out.append(0)  # PNG filter type 0
        for x in range(size):
            ar = ag = ab = aa = 0
            for sy in range(SS):
                for sx in range(SS):
                    cr, cg, cb, a = subpixel(x * SS + sx, y * SS + sy, big, big)
                    ar += cr * a // 255
                    ag += cg * a // 255
                    ab += cb * a // 255
                    aa += a
            A = aa // n
            if A == 0:
                out += bytes((0, 0, 0, 0))
            else:
                out += bytes((
                    min(255, (ar // n) * 255 // A),
                    min(255, (ag // n) * 255 // A),
                    min(255, (ab // n) * 255 // A),
                    A,
                ))
    return bytes(out)


def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data +
            struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))


def write_png(path, size, raw):
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, '..', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    for size in (16, 48, 128):
        write_png(os.path.join(out_dir, f'icon{size}.png'), size, render(size))
        print(f'wrote icons/icon{size}.png')


if __name__ == '__main__':
    main()
