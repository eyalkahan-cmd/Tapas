#!/usr/bin/env bash
# Deluxe composite: video → back graphics → people cut out of the video (matte) → front graphics.
# From frame 546 (10.92 s, the logo card) the source picture is passed through untouched.
# Needs: public/tapas-50p.mp4, public/people-matte.mkv (tools/matte.py),
#        out/deluxe/back/*.png and out/deluxe/front/*.png (npx remotion render DeluxeBack|DeluxeFront --sequence).
set -euo pipefail
cd "$(dirname "$0")/.."
B=$(ls out/deluxe/back | head -1 | sed -E 's/[0-9]+\.png$//')
F=$(ls out/deluxe/front | head -1 | sed -E 's/[0-9]+\.png$//')
N=$(ls out/deluxe/back | head -1 | sed -E 's/.*[^0-9]([0-9]+)\.png$/\1/' | wc -c); N=$((N-1))
ffmpeg -v error -y \
  -i public/tapas-50p.mp4 -i public/people-matte.mkv \
  -framerate 50 -i "out/deluxe/back/${B}%0${N}d.png" \
  -framerate 50 -i "out/deluxe/front/${F}%0${N}d.png" \
  -filter_complex "\
[0:v]split[v0][tail];\
[tail]trim=start_frame=546,setpts=PTS-STARTPTS,format=yuv420p[logo];\
[v0]trim=end_frame=546,setpts=PTS-STARTPTS,format=gbrp,split[base][src];\
[1:v]format=gray,lut=y='clip((val-20)*1.8,0,255)'[m];\
[src][m]alphamerge[people];\
[2:v]format=rgba[back];[3:v]format=rgba[front];\
[base][back]overlay=eof_action=pass:format=gbrp[a];\
[a][people]overlay=eof_action=pass:format=gbrp[b];\
[b][front]overlay=eof_action=pass:format=gbrp,format=yuv420p[gfx];\
[gfx][logo]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy out/tapas-deluxe-50p.mp4
ffmpeg -v error -y -i out/tapas-deluxe-50p.mp4 -vf "tinterlace=mode=interleave_top,setfield=tff" \
  -c:v libx264 -flags +ilme+ildct -x264opts tff=1 -crf 14 -pix_fmt yuv420p -c:a copy out/tapas-deluxe-1080i50-TFF.mp4
