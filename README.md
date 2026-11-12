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

## ZUK shot: one-shot transition instead of the dissolve
`ZukOneShot` (50 fps, 6.44 s) replaces the 2.8–3.44 s dissolve in `public/zuk.mp4` with one camera pull-back:
scene A (plate on the counter) is slowed ~1.9x with motion interpolation to keep the length, then cuts on the
plate to scene B, which starts scaled ~1.55x so its plate matches A's and keeps pulling back to full frame.
```bash
ffmpeg -i public/zuk.mp4 -vf "bwdif=mode=send_field:parity=tff:deint=all" -r 50 \
  -c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p -c:a copy public/zuk-50p.mp4
ffmpeg -ss 2.0 -t 0.76 -i public/zuk-50p.mp4 -an \
  -vf "setpts=(1.44/0.76)*PTS,minterpolate=fps=50:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -c:v libx264 -crf 12 -pix_fmt yuv420p public/zuk-a-slow.mp4
npx remotion render ZukOneShot out/zuk-oneshot-50p.mp4
```
