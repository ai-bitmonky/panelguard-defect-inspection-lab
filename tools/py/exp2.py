import warnings; warnings.filterwarnings('ignore')
exec(open('exp.py').read().split("t=time.time(); H=hog")[0])
P=Xs.reshape(len(Xs),-1); cv=StratifiedKFold(5,shuffle=True,random_state=0)
exec(open("exp.py").read().split("def evalset")[1].split("mods=")[0].join(["def evalset",""]))
H8=hog(Xs); H16=hog(Xs,16); S=stats(Xs)
pcaF=PCA(60,random_state=0).fit(P[itr]).transform(P)
mods={'SVC1':SVC(C=1,probability=True,random_state=0),'SVC3':SVC(C=3,probability=True,random_state=0),'SVC10':SVC(C=10,probability=True,random_state=0),'RF100':RandomForestClassifier(100,random_state=0)}
for nm,F in [('h16+st',np.hstack([H16,S])),('h8+st+pca',np.hstack([H8,S,pcaF])),('h16+st+pca',np.hstack([H16,S,pcaF]))]:
    evalset(nm,F,mods)
