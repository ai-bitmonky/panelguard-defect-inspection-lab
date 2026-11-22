import numpy as np, json, time
from scipy import ndimage
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
X=np.fromfile('/home/claude/panelguard/site/data/cells64.u8',dtype=np.uint8).reshape(-1,64,64)
prob=np.array([r[1] for r in json.load(open('/home/claude/panelguard/site/data/labels.json'))['rows']])
y=(prob>=0.5).astype(int); idx=np.arange(len(y))
itr,ir=train_test_split(idx,test_size=0.4,stratify=y,random_state=42)
iva,ite=train_test_split(ir,test_size=0.5,stratify=y[ir],random_state=42)
Xs=X.astype(np.float32)/255; Xf=Xs.reshape(len(Xs),-1)
t=time.time()
def grad_hist(imgs,cell=16,bins=9):
    gx=np.zeros_like(imgs); gy=np.zeros_like(imgs)
    gx[:,:,1:-1]=imgs[:,:,2:]-imgs[:,:,:-2]; gy[:,1:-1,:]=imgs[:,2:,:]-imgs[:,:-2,:]
    mag=np.hypot(gx,gy); b=np.minimum((np.arctan2(gy,gx)%np.pi)/np.pi*bins,bins-1).astype(int)
    n,h,w=imgs.shape; g=h//cell
    F=np.stack([np.where(b==k,mag,0).reshape(n,g,cell,g,cell).sum((2,4)) for k in range(bins)],-1)
    F/=np.linalg.norm(F,axis=3,keepdims=True)+1e-3
    return F.reshape(n,-1)
G=grad_hist(Xs); print('G',G.shape,time.time()-t); t=time.time()
def dark_map(imgs):
    n=len(imgs); rows=imgs.mean(2); cols=imgs.mean(1)
    dark=(imgs<imgs.mean((1,2),keepdims=True)-0.15).reshape(n,8,8,8,8).mean((2,4)).reshape(n,-1)
    edge=np.abs(ndimage.laplace(imgs,mode='nearest'))   # careful: 3D laplace
    return np.hstack([rows,cols,dark,imgs.std((1,2))[:,None]])
D=dark_map(Xs); print('D',D.shape,time.time()-t); t=time.time()
pca=PCA(40,random_state=0).fit(Xf[itr]); Pc=pca.transform(Xf); print('P',time.time()-t); t=time.time()
F=np.hstack([G,D,Pc])
cv=StratifiedKFold(5,shuffle=True,random_state=0)
for nm,m in [('LR',LogisticRegression(C=0.1,max_iter=2000)),('RF',RandomForestClassifier(100,random_state=0)),('SVC',SVC(C=3,probability=True,random_state=0))]:
    s=cross_val_score(Pipeline([('s',StandardScaler()),('m',m)]),F[itr],y[itr],cv=cv,scoring='roc_auc'); print(nm,s.mean().round(3),time.time()-t); t=time.time()
cv3=StratifiedKFold(3,shuffle=True,random_state=0)
s=cross_val_score(Pipeline([('s',StandardScaler()),('m',SVC(C=3))]),G[itr],y[itr],cv=cv3,scoring='roc_auc'); print('quick3 svc G',s.mean().round(3),time.time()-t)
