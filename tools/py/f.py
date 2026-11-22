import numpy as np, time
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
import json
X=np.fromfile('/data/cells64.u8',dtype=np.uint8).reshape(-1,64,64)
prob=np.array([r[1] for r in json.load(open('/data/labels.json'))['rows']])
y=(prob>=0.5).astype(int); idx=np.arange(len(y))
itr,ir=train_test_split(idx,test_size=0.4,stratify=y,random_state=42)
Xf=(X.astype(np.float32)/255).reshape(len(X),-1)
t=time.time()
s=cross_val_score(make_pipeline(StandardScaler(),SVC(C=3)),Xf[itr],y[itr],cv=StratifiedKFold(3,shuffle=True,random_state=0),scoring='roc_auc'); print('raw',s.mean(),time.time()-t)
