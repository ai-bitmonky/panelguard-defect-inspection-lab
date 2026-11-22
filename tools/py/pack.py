import numpy as np, json, os, csv, sys
from PIL import Image
src='/home/claude/dl/x/elpv_dataset/data'
out='/home/claude/panelguard/site/data'
rows=[l.split() for l in open(src+'/labels.csv') if l.strip()]
X=np.zeros((len(rows),64,64),np.uint8); meta=[]
for i,(p,pr,t) in enumerate(rows):
    im=Image.open(os.path.join(src,p)).convert('L')
    X[i]=np.asarray(im.resize((64,64),Image.BILINEAR if False else Image.LANCZOS))
    meta.append([int(p[-8:-4]), round(float(pr),2), t])
X.tofile(out+'/cells64.u8')
np.save('/home/claude/panelguard/tools/py/X64.npy',X)
json.dump({'shape':[len(rows),64,64],'dtype':'uint8','source':'ELPV dataset 1.0.0.post1, images downscaled 300->64 with Lanczos',
  'cols':['id','prob','type'],'rows':meta},open(out+'/labels.json','w'),separators=(',',':'))
print(X.shape, os.path.getsize(out+'/cells64.u8'))
