# Arrays at 64 (exact shipped pack), 96, 128 from the original 300x300 photos; same split + labels as Step 1; Step 2 SVC val scores.
import numpy as np, json, os
from PIL import Image
from sklearn.model_selection import train_test_split
src='/home/claude/dl/x/elpv_dataset/data/'
rows=json.load(open('/home/claude/panelguard/site/data/labels.json'))['rows']
X64=np.fromfile('/home/claude/panelguard/tools/ref/cells64.u8',np.uint8).reshape(-1,64,64)
for S in (96,128):
    A=np.stack([np.asarray(Image.open(src+'images/cell%04d.png'%r[0]).convert('L').resize((S,S),Image.LANCZOS)) for r in rows])
    np.save('X%d.npy'%S,A)
np.save('X64.npy',X64)
prob=np.array([r[1] for r in rows]); y=(prob>=0.5).astype(int); idx=np.arange(len(y))
itr,ir=train_test_split(idx,test_size=0.4,stratify=y,random_state=42)
iva,ite=train_test_split(ir,test_size=0.5,stratify=y[ir],random_state=42)
np.savez('split.npz',y=y,itr=itr,iva=iva,ite=ite,prob=prob)
# Step 2 pipeline (same code as steps.js 2a/2b) -> SVC val scores
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
Xs=X64.astype(np.float32)/255; Xflat=Xs.reshape(len(Xs),-1)
def line_finder(imgs, box=16, bins=9):
    gx=np.zeros_like(imgs); gy=np.zeros_like(imgs)
    gx[:,:,1:-1]=imgs[:,:,2:]-imgs[:,:,:-2]; gy[:,1:-1,:]=imgs[:,2:,:]-imgs[:,:-2,:]
    strength=np.hypot(gx,gy); angle=np.minimum((np.arctan2(gy,gx)%np.pi)/np.pi*bins,bins-1).astype(int)
    n,h,w=imgs.shape; g=h//box
    H=np.stack([np.where(angle==k,strength,0).reshape(n,g,box,g,box).sum(axis=(2,4)) for k in range(bins)],axis=-1)
    H/=np.linalg.norm(H,axis=3,keepdims=True)+1e-3; return H.reshape(n,-1)
def dark_map(imgs):
    n=len(imgs); rows_=imgs.mean(axis=2); cols=imgs.mean(axis=1)
    dark=imgs<imgs.mean(axis=(1,2),keepdims=True)-0.15
    patches=dark.reshape(n,8,8,8,8).mean(axis=(2,4)).reshape(n,-1); spread=imgs.std(axis=(1,2))[:,None]
    return np.hstack([rows_,cols,patches,spread])
small=Xflat.reshape(len(Xflat),32,2,32,2).mean(axis=(2,4)).reshape(len(Xflat),-1)
pca=PCA(n_components=40,svd_solver='full',random_state=0).fit(small[itr])
F=np.hstack([line_finder(Xs),dark_map(Xs),pca.transform(small)])
best=Pipeline([('scale',StandardScaler()),('model',SVC(C=3,probability=True,random_state=0))]).fit(F[itr],y[itr])
np.save('svc_val.npy',best.predict_proba(F[iva])[:,1]); np.save('svc_train.npy',best.predict_proba(F[itr])[:,1])
print('ok', len(itr),len(iva))
