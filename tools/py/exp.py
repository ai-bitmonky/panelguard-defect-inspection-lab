import numpy as np, json, time
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import precision_recall_curve, roc_auc_score
from scipy import ndimage
X=np.load('/home/claude/panelguard/tools/py/X64.npy')
M=json.load(open('/home/claude/panelguard/site/data/labels.json'))['rows']
prob=np.array([r[1] for r in M]); typ=np.array([r[2] for r in M])
y=(prob>=0.5).astype(int)
idx=np.arange(len(y))
itr,itmp=train_test_split(idx,test_size=0.4,stratify=y,random_state=42)
iva,ite=train_test_split(itmp,test_size=0.5,stratify=y[itmp],random_state=42)
Xs=X.astype(np.float32)/255.
def hog(imgs,cell=8,bins=9):
    gx=np.zeros_like(imgs); gy=np.zeros_like(imgs)
    gx[:,:,1:-1]=imgs[:,:,2:]-imgs[:,:,:-2]; gy[:,1:-1,:]=imgs[:,2:,:]-imgs[:,:-2,:]
    mag=np.hypot(gx,gy); ang=(np.arctan2(gy,gx)%np.pi)/np.pi*bins
    b=np.minimum(ang.astype(int),bins-1)
    n,h,w=imgs.shape; ch,cw=h//cell,w//cell
    F=np.zeros((n,ch,cw,bins),np.float32)
    cy=(np.arange(h)//cell)[None,:,None]; cx=(np.arange(w)//cell)[None,None,:]
    for k in range(bins):
        m=np.where(b==k,mag,0).reshape(n,ch,cell,cw,cell).sum((2,4))
        F[...,k]=m
    F/= (np.linalg.norm(F,axis=3,keepdims=True)+1e-3)
    return F.reshape(n,-1)
def stats(imgs):
    r=imgs.mean(2); c=imgs.mean(1)
    lap=np.abs(ndimage.laplace(imgs, mode='nearest') if False else np.stack([ndimage.laplace(i) for i in imgs]))
    dark=(imgs< (imgs.mean((1,2),keepdims=True)-0.15)).reshape(len(imgs),8,8,8,8).mean((2,4)).reshape(len(imgs),-1)
    return np.hstack([r,c,r.std(1,keepdims=True),c.std(1,keepdims=True),imgs.std((1,2))[:,None],dark,lap.reshape(len(imgs),8,8,8,8).mean((2,4)).reshape(len(imgs),-1)])
t=time.time(); H=hog(Xs); print('hog',H.shape,time.time()-t)
t=time.time(); S=stats(Xs); print('stats',S.shape,time.time()-t)
P=Xs.reshape(len(Xs),-1)
cv=StratifiedKFold(5,shuffle=True,random_state=0)
def evalset(name,F,models):
    for mn,m in models.items():
        pipe=make_pipeline(StandardScaler(),m)
        t=time.time(); s=cross_val_score(pipe,F[itr],y[itr],cv=cv,scoring='roc_auc'); tc=time.time()-t
        pipe.fit(F[itr],y[itr]); p=pipe.predict_proba(F[iva])[:,1]
        pr,rc,th=precision_recall_curve(y[iva],p)
        ok=np.where(rc[:-1]>=0.95)[0]; j=ok[-1]; thr=th[j]
        pred=p>=thr; tp=(pred&(y[iva]==1)).sum(); fp=(pred&(y[iva]==0)).sum(); fn=((~pred)&(y[iva]==1)).sum(); tn=((~pred)&(y[iva]==0)).sum()
        print(f'{name:10s} {mn:4s} cvAUC {s.mean():.3f} valAUC {roc_auc_score(y[iva],p):.3f} thr {thr:.3f} rec {tp/(tp+fn):.3f} prec {tp/(tp+fp):.3f} FAR {fp/(fp+tn):.3f} cv {tc:.1f}s')
mods={'LR':LogisticRegression(max_iter=2000,C=0.1),'RF':RandomForestClassifier(300,n_jobs=1,random_state=0),'SVC':SVC(C=3,probability=True,random_state=0)}
evalset('hog',H,mods)
evalset('stats',S,mods)
evalset('hog+stats',np.hstack([H,S]),mods)
pcaF=PCA(60,random_state=0).fit(P[itr]).transform(P)
evalset('pca60',pcaF,mods)
