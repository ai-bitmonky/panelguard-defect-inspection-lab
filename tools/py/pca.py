import numpy as np, time
from sklearn.decomposition import PCA
X=np.fromfile('/data/cells64.u8',dtype=np.uint8).reshape(-1,64,64).astype(np.float32)/255
S=X.reshape(-1,32,2,32,2).mean((2,4)).reshape(len(X),-1)
for s in ['full','randomized','covariance_eigh']:
    t=time.time(); p=PCA(40,svd_solver=s,random_state=0).fit(S[:1574]); print(s,time.time()-t, p.explained_variance_ratio_.sum())
