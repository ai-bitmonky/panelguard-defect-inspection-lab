import os, subprocess, json
from PIL import Image, ImageDraw, ImageFont
W,H,BAR=1280,720,108
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F=lambda p,s: ImageFont.truetype(p,s)
BG=(8,13,22); CY=(56,214,235); OR=(255,170,40); WH=(238,242,248); GR=(150,162,180)
big=open('big.txt').read().split('\n')
SH='/home/claude/panelguard/tools/audit/shots_v12/'
scenes=[]
def wrap(d,text,font,maxw):
    out=[];line=''
    for w in text.split():
        t=(line+' '+w).strip()
        if d.textlength(t,font=font)<=maxw: line=t
        else: out.append(line); line=w
    if line: out.append(line)
    return out
def card(title,lines,sub=None):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,8],fill=CY)
    y=200 if lines else 280
    d.text((90,y),title,font=F(B,54),fill=WH); y+=84
    if sub: d.text((90,y),sub,font=F(R,28),fill=CY); y+=56
    for l in lines:
        for ll in wrap(d,l,F(R,30),W-200): d.text((90,y),ll,font=F(R,30),fill=GR); y+=44
        y+=8
    return im
def shot(path,chip,text,boxes=(),nums=()):
    im=Image.new('RGB',(W,H),BG); src=Image.open(path).convert('RGB'); d0=ImageDraw.Draw(src)
    lw=max(4,src.size[0]//280)
    for (x0,y0,x1,y1) in boxes: d0.rounded_rectangle([x0,y0,x1,y1],radius=10,outline=OR,width=lw)
    for (x,y,n) in nums:
        r=26; d0.ellipse([x-r,y-r,x+r,y+r],fill=OR,outline=(20,20,20),width=3); f=F(B,34); tw=d0.textlength(str(n),font=f); d0.text((x-tw/2,y-21),str(n),font=f,fill=(20,20,20))
    aw,ah=W-16,H-BAR-12; s=min(aw/src.size[0],ah/src.size[1]); nw,nh=int(src.size[0]*s),int(src.size[1]*s)
    src=src.resize((nw,nh),Image.LANCZOS); im.paste(src,((W-nw)//2,6+(ah-nh)//2))
    d=ImageDraw.Draw(im); d.rectangle([0,H-BAR,W,H],fill=(13,21,36)); d.rectangle([0,H-BAR,W,H-BAR+3],fill=CY)
    f1=F(B,22); cw=d.textlength(chip,font=f1)+28; d.rounded_rectangle([24,H-BAR+18,24+cw,H-BAR+54],radius=8,fill=CY); d.text((38,H-BAR+23),chip,font=f1,fill=(6,16,26))
    f2=F(B,27); x=24+cw+18; ls=wrap(d,text,f2,W-x-24)
    if len(ls)>2: f2=F(B,23); ls=wrap(d,text,f2,W-x-24)
    y=H-BAR+ (20 if len(ls)>1 else 36)
    for l in ls[:3]: d.text((x,y),l,font=f2,fill=WH); y+=34
    return im
def add(im,dur): scenes.append((im,dur))

add(card('PanelGuard',['Build a real solar-cell defect inspection system, step by step.','You only need Chrome and a GitHub account.'],'Student guide'),4.5)
add(card('Part 1 · The lab',['Runs in your browser. Nothing to install.'],'Steps 0 to 8'),3.5)
add(shot(big[22],'1','Open the lab link in Chrome on a laptop. Wait until Python and TensorFlow.js turn green (top right).',boxes=[(1090,12,1436,40)]),7)
add(shot(SH+'1366_1a_a.png','2','How every page works: 1 your steps · 2 the task · 3 fill the ____ blanks and press RUN · 4 the check and result.',nums=[(128,150,1),(300,330,2),(300,590,3),(935,150,4)]),9)
add(card('On every page',['Do the hands-on part on the picture first.','Fill the ____ blanks in the code. Press RUN.','If the check fails, read the message and try again.','Stuck? Open "Worked example". The next page unlocks when the check passes.'],None),7)
steps={'0':('Step 0 · Meet the line','Look at the station and inspect 12 real cells by hand.'),
'1':('Step 1 · Get the data ready','Load, count, label and split the photos. Seal the test set.'),
'2':('Step 2 · First inspector with scikit-learn','Build features, compare 3 models and set the cutoff.'),
'3':('Step 3 · Train a CNN with Keras + TensorFlow','Build and train the network (Quick or Full). Keep the tab open. Then set two gates.'),
'4':('Step 4 · See what the model looks at','Heat maps, an honesty test, and where the model fails.'),
'5':('Step 5 · Wire the flow with LangGraph','Pass, send to a person, or stop. Run a full shift.'),
'6':('Step 6 · Add the quality crew','Three workers write the shift report. A checker checks every number.'),
'7':('Step 7 · Build the operator console','Build the screen, then find and fix two planted bugs.'),
'8':('Step 8 · Line trial','Freeze the settings, break the seal, test ONCE. Go or no-go. Final test and Submit.')}
subs='0a 0b 0c 0d 1a 1b 1c 1d 1e 2a 2b 2c 2d 2e 3a 3b 3c 3d 3e 3f 3g 4a 4b 4c 4d 4e 4f 5a 5b 5c 5d 5e 5f 5g 6a 6b 6c 6d 6e 6f 6g 7a 7b 7c 7d 7e 7f 7g 8a 8b 8c 8d 8e 8f 8g'.split()
for s in subs:
    t,c=steps[s[0]]
    add(shot(SH+'1366_%s_a.png'%s,s,t+' — '+c),1.9)
add(card('Good to know',['Your progress is saved in this browser on this laptop. Use the same one each time.','Keep "Review mode" OFF. It is for teachers.','After you break the seal in Step 8, do not change earlier steps.'],'Part 1'),7)
add(card('Part 2 · The Python project',['The same system as real Python files.','It runs in GitHub Codespaces: VS Code inside a Chrome tab.'],'Fork · Codespace · 5 commands'),4.5)
add(shot(big[23],'1','Sign in to GitHub. Open the repository ai-bitmonky/panelguard-defect-inspection-lab. Click Fork.',boxes=[(1090,116,1212,152)]),6.5)
add(shot(big[0],'2','Keep the name. Scroll down and click "Create fork". You now have your own copy.'),5.5)
add(shot(big[1],'3','On your fork, click the green Code button.',boxes=[(810,204,926,244)]),4.5)
add(shot(big[2],'4','Open the Codespaces tab. Click "Create codespace on main".',boxes=[(504,245,716,286)]),5.5)
add(shot(big[8],'5','A new tab opens with VS Code. Wait while the codespace is built.'),4.5)
add(shot(big[9],'6','If this question appears, click "Trust Folder & Continue".',boxes=[(780,381,940,416)]),5)
add(shot(big[10],'7','Setup now runs by itself: it installs the packages and gets the photos. This takes 5 to 10 minutes. Wait.',boxes=[(366,426,900,486)]),7)
add(shot(big[11],'8','In the terminal type:  cd tools/takehome   then:  python train.py --elpv elpv-dataset/src/elpv_dataset/data',boxes=[(996,72,1412,94)]),7.5)
add(shot(big[12],'8','Training runs for 30 rounds. It takes about 4 minutes.'),4)
add(shot(big[14],'8','Done: the models and the two gates are saved.',boxes=[(366,522,1340,553)]),5)
add(shot(big[15],'9','Next:  python flow.py --elpv elpv-dataset/src/elpv_dataset/data   A validation shift goes through the flow.',boxes=[(366,214,1300,246)]),7)
add(shot(big[17],'10','When you are done tuning, add  --trial  to open the sealed test set. It runs ONCE.',boxes=[(366,214,1180,274)]),7)
add(shot(big[16],'11','Then:  python crew.py --dry   The crew tools and the number checker run.',boxes=[(366,88,1420,188)]),6)
add(shot(big[18],'12','Last:  python app.py --elpv elpv-dataset/src/elpv_dataset/data   This starts the operator console.',boxes=[(366,214,790,246)]),6)
add(shot(big[19],'12','The console opens in a new tab. Before any cell: NO VERDICT. That is the safe default.'),5)
add(shot(big[21],'12','Click NEXT CELL or START. Each real cell gets PASS, CHECK or STOP.'),4.5)
add(shot(big[20],'12','SHIFT BOARD shows the counts for the shift.',boxes=[(104,552,720,576)]),4.5)
add(card('When you finish',['Stop the codespace: on github.com/codespaces choose "Stop codespace".','Your free hours are only used while it runs.','You can open it again later and carry on.'],'Part 2'),7)
add(card('You are done',['Lab: Steps 0 to 8 in Chrome.','Python project: fork, codespace, five commands.'],'PanelGuard'),4)
json.dump([d for _,d in scenes],open('durs.json','w'))
for i,(im,d) in enumerate(scenes): im.save('sc/%03d.jpg'%i,quality=92)
print(len(scenes),'scenes',round(sum(d for _,d in scenes),1),'s')
