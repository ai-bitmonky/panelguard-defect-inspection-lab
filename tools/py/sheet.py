import numpy as np, json, sys
from PIL import Image, ImageDraw
X=np.load('X64.npy'); M=json.load(open('../../site/data/labels.json'))['rows']
sel=[i for i,r in enumerate(M) if r[1]==float(sys.argv[1]) and r[2]==sys.argv[2]]
off=int(sys.argv[3]); sel=sel[off:off+80]
W=10; S=96
im=Image.new('L',(W*S,(len(sel)+W-1)//W*(S+12)),0); d=ImageDraw.Draw(im)
for k,i in enumerate(sel):
  x=(k%W)*S; yy=(k//W)*(S+12)
  im.paste(Image.fromarray(X[i]).resize((S-4,S-4)),(x,yy)); d.text((x,yy+S-4),str(M[i][0]),fill=255)
im.save(sys.argv[4])
