"""Person mattes for every 50p frame: u2net_human_seg + guided-filter edge refinement, holes filled.

Usage (in a venv with onnxruntime, opencv-python-headless, numpy; model from the rembg releases):
  python tools/matte.py public/tapas-50p.mp4 u2net_human_seg.onnx public/people-matte.mkv
"""
import sys, subprocess, numpy as np, cv2, onnxruntime as ort
src, model, out = sys.argv[1:4]
W,H=1920,1080; S=320
so=ort.SessionOptions(); so.intra_op_num_threads=4
s=ort.InferenceSession(model, so, providers=['CPUExecutionProvider']); inp=s.get_inputs()[0].name
def guided(I, p, r, eps):
    m=lambda x: cv2.blur(x,(r,r))
    mI,mp=m(I),m(p); a=(m(I*p)-mI*mp)/(m(I*I)-mI*mI+eps); b=mp-a*mI
    return m(a)*I+m(b)
dec=subprocess.Popen(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','gray','-s',f'{W}x{H}','-r','50','-i','-','-c:v','ffv1','-pix_fmt','gray',out],stdin=subprocess.PIPE)
prev=None; buf=[]; n=0
def fill_holes(m):
    # gaps inside a person's outline (a notepad, a dark apron) count as the person
    b=(m>0.5).astype(np.uint8)*255; h,w=b.shape
    flood=b.copy(); cv2.floodFill(flood,np.zeros((h+2,w+2),np.uint8),(0,0),255)
    holes=cv2.bitwise_not(flood).astype(np.float32)/255
    return np.maximum(m, cv2.GaussianBlur(holes,(0,0),3))
def emit(m): m=fill_holes(m); enc.stdin.write((np.clip(m,0,1)*255+0.5).astype(np.uint8).tobytes())
while True:
    b=dec.stdout.read(W*H*3)
    if len(b)<W*H*3: break
    im=np.frombuffer(b,np.uint8).reshape(H,W,3)
    x=cv2.resize(im,(S,S),interpolation=cv2.INTER_AREA).astype(np.float32)/255
    x=((x-[0.485,0.456,0.406])/[0.229,0.224,0.225]).transpose(2,0,1)[None].astype(np.float32)
    o=s.run(None,{inp:x})[0][0,0]
    o=(o-o.min())/(o.max()-o.min()+1e-6)
    m=cv2.resize(o,(W,H),interpolation=cv2.INTER_CUBIC).astype(np.float32)
    g=cv2.cvtColor(im,cv2.COLOR_RGB2GRAY).astype(np.float32)/255
    m=guided(g,m,9,1e-3); m=guided(g,m,25,1e-2)
    m=np.clip((m-0.15)/0.7,0,1)
    buf.append(m)
    if len(buf)==3: emit(0.2*buf[0]+0.6*buf[1]+0.2*buf[2]); buf.pop(0)
    elif len(buf)==2 and n==1: emit(buf[0])
    n+=1
    if n%50==0: print(n, flush=True)
emit(buf[-1]); enc.stdin.close(); enc.wait()
