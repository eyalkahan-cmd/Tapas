"""Rebuild full-resolution frames in the shots that are really 25p with a shifted field cadence.

Most of public/tapas.mp4 is true 1080i50 (every field is a new moment) and is deinterlaced with bwdif.
Some shots, though, are 25p material whose fields are paired across frame boundaries
(bottom field of frame k + top field of frame k+1 are the same moment). Treating those as 50i
invents half-resolution in-between images and smears the motion. Here every field in such a
shot is woven with its same-moment twin, giving the original sharp frame (each shown twice at 50p).

Usage: python3 tools/rebuild_25p_shots.py public/tapas.mp4 public/tapas-50p.mp4 OUT.mp4
"""
import subprocess
import sys

import numpy as np

SRC, BWDIF, OUT = sys.argv[1:4]
W, H = 1920, 1080
YS, CS = W * H, (W // 2) * (H // 2)
FS = YS + 2 * CS
# Only these stretches (seconds) are rebuilt; the logo card from 10.8 s stays as it was.
RANGES = [(2.0, 3.8), (7.6, 10.8)]
# Single-field flashes baked into the source (50p frame -> frame shown instead).
# 397 (7.94 s): one over-bright field right at the plate cut.
REPLACE = {397: 398}


def frames(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'],
                         stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(FS)
        if len(b) < FS:
            break
        a = np.frombuffer(b, np.uint8)
        yield a[:YS].reshape(H, W), a[YS:YS + CS].reshape(H // 2, W // 2), a[YS + CS:].reshape(H // 2, W // 2)


src = list(frames(SRC))
n_fields = 2 * len(src)


def field(i):
    """Field i in time order (upper field first): planes holding only that field's rows."""
    k, par = divmod(i, 2)
    return k, par


def lum_field(i):
    k, par = field(i)
    return src[k][0][par::2].astype(np.int16)


# Difference between each field and the previous one (on the half-height luma field).
d = np.zeros(n_fields)
for i in range(1, n_fields):
    a, b = lum_field(i), lum_field(i - 1)
    # Compare at a common vertical position: average rows to cancel the half-line offset.
    a2 = (a[:-1] + a[1:]) / 2 if i % 2 == 0 else a[:-1]
    b2 = b[:-1] if i % 2 == 0 else (b[:-1] + b[1:]) / 2
    d[i] = np.abs(a2[::4, ::4] - b2[::4, ::4]).mean()


def twin(i):
    """Same-moment partner of field i, or None if it has none (true 50i motion)."""
    prev = d[i] if i > 0 else np.inf
    nxt = d[i + 1] if i + 1 < n_fields else np.inf
    lo, hi = min(prev, nxt), max(prev, nxt)
    if hi == np.inf:
        hi = lo * 10
    j = i - 1 if prev < nxt else i + 1
    if lo < 2.5 and lo < 0.4 * hi:
        return j
    if hi < 2.5:  # almost no motion: weaving is safe and sharper
        return j
    return None


def in_ranges(i):
    t = i / 50
    return any(a <= t < b for a, b in RANGES)


enc = subprocess.Popen(
    ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{W}x{H}', '-r', '50',
     '-i', '-', '-i', BWDIF, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
     '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
     '-c:a', 'copy', OUT],
    stdin=subprocess.PIPE)

rebuilt = []
bw = list(frames(BWDIF))
for i in range(len(bw)):
    y, u, v = bw[REPLACE.get(i, i)]
    j = twin(i) if in_ranges(i) and i < n_fields else None
    if j is not None:
        ki, pi = field(i)
        kj, pj = field(j)
        y = np.empty((H, W), np.uint8); u = np.empty((H // 2, W // 2), np.uint8); v = np.empty_like(u)
        for k, par in ((ki, pi), (kj, pj)):
            y[par::2] = src[k][0][par::2]
            u[par::2] = src[k][1][par::2]
            v[par::2] = src[k][2][par::2]
        rebuilt.append(i)
    enc.stdin.write(y.tobytes() + u.tobytes() + v.tobytes())
enc.stdin.close()
enc.wait()

print('rebuilt frames:', len(rebuilt))
runs, start = [], None
for a, b in zip([None] + rebuilt, rebuilt + [None]):
    if a is None or b is None or b != a + 1:
        pass
s = rebuilt[0] if rebuilt else None
prev = s
for x in rebuilt[1:] + [None]:
    if x is None or x != prev + 1:
        runs.append((s / 50, (prev + 1) / 50))
        s = x
    prev = x
print('rebuilt stretches (s):', [(round(a, 2), round(b, 2)) for a, b in runs])
