#!/usr/bin/env python3
"""Generate the extension icons with no third-party deps.

Draws a red rounded square with a white play triangle at 16/48/128 px,
supersampled 4x and box-downsampled (premultiplied) for clean edges.
Run from the repo root:  python3 tools/make_icons.py
"""
import os
import struct
import zlib

SS = 4  # supersample factor
BG = (230, 33, 23)       # YouTube-ish red
FG = (255, 255, 255)     # play triangle


def in_round_rect(x, y, w, h, r):
    nx = max(r - x, x - (w - 1 - r), 0)
    ny = max(r - y, y - (h - 1 - r), 0)
    return nx * nx + ny * ny <= r * r


def in_triangle(x, y, w, h):
    # Left-pointing-right play glyph.
    p1 = (0.40 * w, 0.30 * h)
    p2 = (0.40 * w, 0.70 * h)
    p3 = (0.70 * w, 0.50 * h)

    def sign(a, b, c):
        return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])

    p = (x, y)
    d1, d2, d3 = sign(p, p1, p2), sign(p, p2, p3), sign(p, p3, p1)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)


def subpixel(x, y, w, h, r):
    # Returns premultiplied (R, G, B, A) for one supersample point.
    if in_triangle(x, y, w, h):
        return (FG[0], FG[1], FG[2], 255)
    if in_round_rect(x, y, w, h, r):
        return (BG[0], BG[1], BG[2], 255)
    return (0, 0, 0, 0)


def render(size):
    big = size * SS
    r = big * 0.22
    out = bytearray()
    for y in range(size):
        out.append(0)  # PNG filter type 0
        for x in range(size):
            ar = ag = ab = aa = 0
            for sy in range(SS):
                for sx in range(SS):
                    px = x * SS + sx
                    py = y * SS + sy
                    cr, cg, cb, a = subpixel(px, py, big, big, r)
                    # premultiply
                    ar += cr * a // 255
                    ag += cg * a // 255
                    ab += cb * a // 255
                    aa += a
            n = SS * SS
            A = aa // n
            if A == 0:
                out += bytes((0, 0, 0, 0))
            else:
                # un-premultiply averaged color
                R = min(255, (ar // n) * 255 // A)
                G = min(255, (ag // n) * 255 // A)
                B = min(255, (ab // n) * 255 // A)
                out += bytes((R, G, B, A))
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
