import os, sys, time, json, numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL']='3'
import keras, tensorflow as tf
from keras import layers
from sklearn.metrics import roc_auc_score, precision_recall_curve
d=np.load('split.npz'); y,itr,iva=d['y'],d['itr'],d['iva']
svc=np.load('svc_val.npy')
def far95(yv,p):
    pr,rc,th=precision_recall_curve(yv,p); cut=th[rc[:-1]>=0.95].max(); s=p>=cut
    return float((s&(yv==0)).sum()/(yv==0).sum()), float(cut)
def build(size, S, widths, drop=0.3, bn=False, head='gap'):
    m=keras.Sequential([keras.Input((S,S,1))])
    for w in widths:
        m.add(layers.Conv2D(w,3,padding='same',use_bias=not bn,activation=None if bn else 'relu'))
        if bn: m.add(layers.BatchNormalization()); m.add(layers.Activation('relu'))
        m.add(layers.MaxPooling2D(2))
    m.add(layers.GlobalAveragePooling2D() if head=='gap' else layers.Flatten()) 
    if head=='flat': m.add(layers.Dense(64,activation='relu'))
    if False: pass
    m.add(layers.Dropout(drop)); m.add(layers.Dense(1,activation='sigmoid'))
    return m
ARCH={'S':[8,16,32],'M':[16,32,64],'L':[16,32,64,128],'XL':[32,64,128,128]}
def aug(xb, mode, rng):
    if mode=='none': return xb
    xb=xb.copy()
    f=rng.random(len(xb))<0.5; xb[f]=xb[f][:,:,::-1]      # left-right
    f=rng.random(len(xb))<0.5; xb[f]=xb[f][:,::-1,:]      # up-down
    if mode=='flip+bright':
        xb=np.clip(xb*rng.uniform(0.85,1.15,(len(xb),1,1,1)),0,1)
    return xb
def run(S=64, arch='M', augm='flip', cw=True, epochs=30, seed=0, lr=1e-3, bs=32, bn=False, head='gap'):
    keras.utils.set_random_seed(seed); rng=np.random.default_rng(seed)
    X=(np.load('X%d.npy'%S).astype(np.float32)/255)[...,None]
    m=build(S,S,ARCH[arch],bn=bn,head=head); m.compile(optimizer=keras.optimizers.Adam(lr),loss='binary_crossentropy')
    n1=y[itr].sum(); n0=len(itr)-n1; w={0:len(itr)/(2*n0),1:len(itr)/(2*n1)} if cw else None
    best=(-1,0,None); hist=[]; t=time.time()
    for ep in range(epochs):
        perm=rng.permutation(itr)
        m.fit(aug(X[perm],augm,rng),y[perm],batch_size=bs,epochs=1,verbose=0,class_weight=w,shuffle=False)
        p=m.predict(X[iva],verbose=0).ravel(); a=roc_auc_score(y[iva],p); hist.append(round(a,3))
        if a>best[0]: best=(a,ep,p)
    sec=time.time()-t; a,ep,p=best
    fa,cut=far95(y[iva],p)
    # blend: average of ranks-free probabilities
    pb=0.5*p+0.5*svc; fb,_=far95(y[iva],pb); ab=roc_auc_score(y[iva],pb)
    r=dict(S=S,arch=arch,bn=bn,head=head,lr=lr,ep=epochs,aug=augm,cw=cw,seed=seed,params=m.count_params(),best_ep=ep+1,auc=round(a,3),far=round(fa,3),blend_auc=round(ab,3),blend_far=round(fb,3),sec=round(sec),last_auc=hist[-1])
    print(json.dumps(r),flush=True); return r,p
if __name__=='__main__':
    cfg=json.loads(sys.argv[1]); run(**cfg)
