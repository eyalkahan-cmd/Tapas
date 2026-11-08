# Tapas: opening titles, branded

Remotion project that layers minimal brand graphics (no text) over the "Tapas" opening titles,
using the language of the logo card (yellow `#FED100`, red `#ED2727`, white, ~15° leaning bands,
dashed stripe bars, stars, chili).

## Run
```bash
npm install
npx remotion studio            # preview
npx remotion render TapasBranded out/tapas-branded-50p.mp4
```

## Source and field order
`public/tapas.mp4` is flagged as 25p but is really interlaced, upper field first (combing on motion).
It was deinterlaced to 50p, and the composition renders from that file:
```bash
ffmpeg -i public/tapas.mp4 -vf "bwdif=mode=send_field:parity=tff:deint=all" -r 50 \
  -c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p -c:a copy public/tapas-50p.mp4
```
Not every shot is true 50i: the chop shot (~2.4–3.5 s) and the cloche shot (~8.0–10.7 s) are 25p
material with a shifted field cadence (each image is split across two source frames). Deinterlacing
those as 50i invents soft in-between images and smears the motion, so after the step above the
full-resolution frames are rebuilt by weaving each field with its same-moment twin:
```bash
python3 tools/rebuild_25p_shots.py public/tapas.mp4 public/tapas-50p.mp4 /tmp/tapas-50p-fixed.mp4
mv /tmp/tapas-50p-fixed.mp4 public/tapas-50p.mp4
```
Broadcast version (1080i50, upper field first) from the 50p render:
```bash
ffmpeg -i out/tapas-branded-50p.mp4 -vf "tinterlace=mode=interleave_top,setfield=tff" \
  -c:v libx264 -flags +ilme+ildct -x264opts tff=1 -crf 14 -pix_fmt yuv420p -c:a copy \
  out/tapas-branded-1080i50-TFF.mp4
```

## Code
- `src/brand.ts`: colours, lean angle, shot timings. Animation timing is written in a 25-unit
  timebase (`s()`, `useF()`), the composition runs at 50 fps.
- `src/elements.tsx`: reusable graphics (StripeDash, BandWipe, Star, Chili, CornerBrackets, Ring, Burst).
- `src/TapasBranded.tsx`: one layer per shot over the video.

## Deluxe version (richer motion graphics)
A brand thread (yellow, red, fine white) travels through every shot as one continuous move, floating
behind the people and in front of the set, with embers, stars, stripe bars, band wipes, speed streaks,
an orbit under the croquetas, a reflection on the steel, and the card's bands gathering at the end.
The logo card (from frame 546, 10.92 s) is passed through untouched. Code: `src/deluxe/`.
```bash
# 1. people cut-outs (once): venv with onnxruntime, opencv-python-headless, numpy + u2net_human_seg.onnx
python tools/matte.py public/tapas-50p.mp4 u2net_human_seg.onnx public/people-matte.mkv
# 2. graphics in two depth passes
npx remotion render DeluxeBack out/deluxe/back --sequence --image-format=png --frames=0-545
npx remotion render DeluxeFront out/deluxe/front --sequence --image-format=png --frames=0-545
# 3. composite → out/tapas-deluxe-50p.mp4 and out/tapas-deluxe-1080i50-TFF.mp4
tools/composite_deluxe.sh
```
`npx remotion studio` → `DeluxePreview` previews the graphics (without the cut-outs).
