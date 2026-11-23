"""PanelGuard student guide v2.0 builder.
Screens (tools/video/v2_content.py) -> PNG per screen -> one H.264 file per screen
-> concat demuxer (-c copy) -> audio muxed with -c:v copy -> dist/PanelGuard_Student_Guide_v2.0.mp4 (+ the screen script .txt).
Narration: writes tools/video/narration.json (the words per screen). If tools/video/voice/<id>.mp3 exist (make_voice.py),
each screen lasts max(reading time, audio + 0.6 s) and its audio is laid under it; with no voice files the video is silent.
Usage: python3 tools/video/build_v2.py [--frames-only] [--only 12,40] [--silent] [--voice-dir DIR] [--out FILE.mp4]
"""
import os, sys, json, re, subprocess, hashlib, shutil, wave
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, HERE)
import v2_content as C

W, H, FPS = 1280, 720, 30
OUTDIR = os.path.join(HERE, 'build_v2'); SC = os.path.join(OUTDIR, 'sc'); ENC = os.path.join(OUTDIR, 'enc')
for d in (OUTDIR, SC, ENC): os.makedirs(d, exist_ok=True)
FINAL = os.path.join(ROOT, 'dist', 'PanelGuard_Student_Guide_v2.0.mp4'); SCRIPT = os.path.join(ROOT, 'dist', 'PanelGuard_Student_Guide_v2.0_script.txt')

FD = '/usr/share/fonts/opentype/inter/'
def F(w, s): return ImageFont.truetype(FD + {'r': 'Inter-Regular.otf', 'm': 'Inter-Medium.otf', 's': 'Inter-SemiBold.otf', 'b': 'Inter-Bold.otf'}[w], s)
MONO = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', s)
BG = (7, 11, 18); PANEL = (13, 21, 36); LINE = (38, 52, 72); CY = (70, 227, 255); AM = (255, 181, 71); GR = (61, 255, 160)
WH = (238, 242, 248); GY = (160, 172, 190); DK = (6, 16, 26); RED = (255, 90, 90)

def wrap(d, text, font, maxw):
    out = []
    for para in text.split('\n'):
        line = ''
        for w in para.split(' '):
            if w == '': continue
            t = (line + ' ' + w).strip()
            if d.textlength(t, font=font) <= maxw: line = t
            else:
                if line: out.append(line)
                line = w
        out.append(line)
    return out

def topbar(d, prog, frac):
    d.rectangle([0, 0, W, 40], fill=(10, 16, 27))
    d.text((20, 9), 'PANELGUARD', font=F('b', 20), fill=CY)
    d.text((20 + d.textlength('PANELGUARD', font=F('b', 20)) + 12, 11), 'student guide v2.0', font=F('r', 18), fill=GY)
    if prog:
        f = F('s', 21); tw = d.textlength(prog, font=f); d.text((W - 20 - tw, 8), prog, font=f, fill=WH)
    d.rectangle([0, 40, W, 43], fill=(22, 32, 48)); d.rectangle([0, 40, int(W * frac), 43], fill=CY)

def words(t): return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'._/%-]*", t or ''))

# ------------------------------------------------------------------ cards
def render_card(s, frac):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    topbar(d, s.get('prog') or ('Part %d' % s['part'] if s.get('part') else ''), frac)
    k = s['kind']; x = 96; maxw = W - 2 * x
    if k == 'chapter':
        d.rectangle([0, 44, 14, H], fill=CY)
        y = 150; d.text((x, y), 'PART %d' % s['part'], font=F('b', 30), fill=CY); y += 54
    elif k == 'step':
        d.rectangle([0, 44, 14, H], fill=AM); y = 110
    else: y = 150 if k == 'title' else 120
    tf = F('b', 56 if k in ('title', 'chapter') else 46)
    for l in wrap(d, s['title'], tf, maxw): d.text((x, y), l, font=tf, fill=WH); y += int(tf.size * 1.2)
    if s.get('sub'): y += 6; d.text((x, y), s['sub'], font=F('s', 28), fill=AM if k == 'step' else CY); y += 56
    y += 10; bf = F('r', 28)
    for ln in s['lines']:
        ls = wrap(d, ln, bf, maxw - 34)
        d.ellipse([x + 2, y + 13, x + 12, y + 23], fill=CY if k != 'step' else AM)
        for l in ls: d.text((x + 34, y), l, font=bf, fill=(214, 222, 234)); y += 40
        y += 14
    if y > H - 20: raise SystemExit('card overflow: ' + s['title'])
    return im

# ------------------------------------------------------------------ shots
CROPS = {'main': (255, 54, 1366, 768), 'full': None}
def load_src(s):
    p = os.path.join(HERE, s['img'])
    if not os.path.exists(p) and os.environ.get('ALLOW_MISSING'): src = Image.new('RGB', (1366, 768), (60, 60, 60))
    else: src = Image.open(p).convert('RGB')
    for (x0, y0, x1, y1) in MASKS.get(s['img'], []):     # hide a word that must not appear in any frame (a commit author, a model-name placeholder)
        ImageDraw.Draw(src).rectangle([x0, y0, x1, y1], fill=src.getpixel((x0, (y0 + y1) // 2)))
    c = s.get('crop', 'main'); box = CROPS[c] if isinstance(c, str) else c
    if box is None: box = (0, 0) + src.size
    return src, box

MASKS = {'frames/gh_01.jpg': [(40, 366, 124, 394)], 'frames/gh_02.jpg': [(40, 366, 124, 394)], 'frames/gh_07.jpg': [(121, 336, 204, 363)], 'frames/gh_23.jpg': [(121, 255, 204, 282)],
         'p1/6g_a.jpg': [(441, 619, 842, 641)], 'p1/6g_b.jpg': [(441, 538, 842, 560)]}

def render_shot(s, frac):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    topbar(d, s.get('prog'), frac)
    LX0, LX1 = 20, 772; RX0, RX1 = 792, 1260; TOP, BOT = 56, 704
    # ---- bottom boxes under the image (quote, watch)
    blocks = []
    if s.get('quote'): blocks.append(('quote', s.get('qlabel', 'ON SCREEN'), s['quote']))
    if s.get('watch'): blocks.append(('watch', s.get('wlabel', 'WATCH OUT'), s['watch']))
    y = BOT; drawn = []
    for kind, lab, text in reversed(blocks):
        f = F('r', 24); lh = 32
        if kind == 'quote':
            items = text if isinstance(text, list) else [text]; sz = 21
            while sz > 17 and any(len(t) < 72 and d.textlength(t, font=MONO(sz)) > LX1 - LX0 - 36 for t in items): sz -= 1
            f = MONO(sz); lh = sz + 7
        lines = []
        for t in (text if isinstance(text, list) else [text]): lines += wrap(d, t, f, LX1 - LX0 - 36)
        hgt = 44 + lh * len(lines) + 10
        y0 = y - hgt; drawn.append((kind, lab, lines, f, lh, y0, y)); y = y0 - 10
    img_bot = y
    src, box = load_src(s)
    cw, ch = box[2] - box[0], box[3] - box[1]
    sc = min((LX1 - LX0) / cw, (img_bot - TOP) / ch)
    nw, nh = int(cw * sc), int(ch * sc)
    ox = LX0 + (LX1 - LX0 - nw) // 2; oy = TOP + max(0, (img_bot - TOP - nh) // 2)
    crop = src.crop(box)
    # draw boxes / marks on the crop at source scale, then resize
    dc = ImageDraw.Draw(crop); lw = max(3, int(round(3 / sc)))
    for (x0, y0, x1, y1) in s.get('boxes', []):
        dc.rounded_rectangle([x0 - box[0], y0 - box[1], x1 - box[0], y1 - box[1]], radius=int(8 / sc), outline=AM, width=lw)
    for (x, y_, n) in s.get('marks', []):
        r = int(17 / sc); cx, cy = x - box[0], y_ - box[1]
        dc.ellipse([cx - r, cy - r, cx + r, cy + r], fill=AM, outline=(20, 20, 20), width=max(2, int(2 / sc)))
        f = F('b', int(24 / sc)); t = str(n); tw = dc.textlength(t, font=f)
        dc.text((cx - tw / 2, cy - f.size * 0.62), t, font=f, fill=(20, 20, 20))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    im.paste(crop, (ox, oy)); d.rectangle([ox - 1, oy - 1, ox + nw, oy + nh], outline=LINE, width=1)
    for kind, lab, lines, f, lh, y0, y1 in drawn:
        col = CY if kind == 'quote' else AM
        d.rounded_rectangle([LX0, y0, LX1, y1], radius=10, fill=(12, 20, 33) if kind == 'quote' else (34, 26, 10), outline=col, width=2)
        d.text((LX0 + 18, y0 + 10), lab, font=F('b', 18), fill=col)
        yy = y0 + 40
        for l in lines: d.text((LX0 + 18, yy), l, font=f, fill=WH); yy += lh
    # ---- right panel
    d.rounded_rectangle([RX0, TOP, RX1, BOT], radius=12, fill=PANEL, outline=LINE, width=1)
    x = RX0 + 22; mw = RX1 - RX0 - 44; y = TOP + 18
    chip = s['id']; cf = F('b', 24); cw2 = d.textlength(chip, font=cf) + 24
    d.rounded_rectangle([x, y, x + cw2, y + 38], radius=8, fill=CY); d.text((x + 12, y + 5), chip, font=cf, fill=DK)
    if s.get('label'): d.text((x + cw2 + 14, y + 9), {'STEP': 'HOW THE LAB WORKS', 'TEST': 'FINAL TEST', 'CARD': 'STEP 8 · END', 'CLICK': 'CLICK', 'WAIT': 'WAIT', 'TYPE': 'TYPE', 'READ': 'READ THE OUTPUT', 'LOOK': 'LOOK'}.get(s['label'], s['label']), font=F('s', 18), fill=GY)
    y += 50
    tf = F('b', 30)
    for l in wrap(d, s['name'], tf, mw): d.text((x, y), l, font=tf, fill=WH); y += 38
    y += 10
    heads = s.get('heads') or (('WHAT YOU DO', 'WHAT YOU LEARN') if not s.get('label') else ('WHAT TO DO', 'GOOD TO KNOW'))
    for head, text, col in ((heads[0], s['do'], CY), (heads[1], s.get('learn'), GR)):
        if not text: continue
        d.text((x, y), head, font=F('b', 18), fill=col); y += 28
        for l in wrap(d, text, F('r', 24), mw): d.text((x, y), l, font=F('r', 24), fill=(222, 228, 238)); y += 31
        y += 14
    if y > BOT - 4: raise SystemExit('panel overflow (%d px) on %s %s' % (y - BOT, s['id'], s['name']))
    if img_bot - TOP < 250: raise SystemExit('image too small on %s %s' % (s['id'], s['name']))
    return im

# ------------------------------------------------------------------ narration text
ACR = {'EL', 'CNN', 'PCA', 'AUC', 'PSI', 'SVG', 'API', 'GPU', 'CSS', 'HTML', 'ELPV', 'MB', 'URL', 'II'}
def speech(t):
    t = t.replace('···', 'three dots').replace('a ____ blank', 'a blank').replace('____', 'blank').replace('×', ' times ').replace('÷', ' divided by ').replace('→', ' to ').replace('—', ', ').replace('·', ',')
    t = t.replace('Ctrl + C', 'Control C').replace('Ctrl + Enter', 'Control Enter').replace('3 × 3', '3 by 3')
    t = t.replace('TensorFlow.js', 'TensorFlow J S').replace('scikit-learn', 'sci-kit learn').replace('numpy', 'num-pie').replace('LangGraph', 'Lang Graph')
    t = t.replace('CrewAI', 'Crew A I').replace('MiniCrew', 'Mini Crew').replace('Grad-CAM', 'Grad-Cam').replace('predict_proba', 'predict proba').replace('OK', 'okay')
    t = t.replace('ELPV', 'E L P V').replace('val_auc', 'val A U C').replace(' auc', ' A U C').replace('e.g.', 'for example')
    t = re.sub(r'(\d+)/(\d+)', r'\1 of \2', t)
    t = t.replace('VS Code', 'V S Code').replace(' / ', ' or ').replace('START or STOP LINE', 'Start and Stop line')
    t = re.sub(r'--(\w+)', r'dash dash \1', t); t = re.sub(r'\b(\w+)\.py\b', r'\1 dot py', t)
    t = t.replace('github.com/codespaces', 'github dot com slash codespaces').replace('svc.joblib', 'svc dot joblib').replace('cnn.keras', 'cnn dot keras').replace('settings.json', 'settings dot json').replace('trial.json', 'trial dot json')
    t = re.sub(r'\b([A-Z]{2,})\b', lambda m: m.group(1) if m.group(1) in ACR else m.group(1).lower(), t)
    t = t.replace('"', '').replace('“', '').replace('”', '').replace('_', ' ').replace(' = ', ' is ').replace('  ', ' ')
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'([.!?] )([a-z])', lambda m: m.group(1) + m.group(2).upper(), t)
    return re.sub(r'\s+([,.:;?!])', r'\1', t).replace(',,', ',').replace('.,', '.').replace(':.', '.')

def say_text(s):
    if s.get('say'): return speech(s['say'])
    if s['kind'] == 'shot':
        sub = not s.get('label')
        h = s.get('heads') or ('', '')
        parts = [('%s, %s.' % (s['id'], s['name'])) if sub else (s['name'] + '.')]
        parts.append((h[0] + '. ' if h[0] else '') + s['do'])
        if s.get('learn'): parts.append((h[1] + '. ' if h[1] else '') + s['learn'])
        if s.get('watch'): parts.append('Watch out. ' + s['watch'])
        return speech(' '.join(parts))
    return speech('. '.join([s['title']] + ([s['sub']] if s.get('sub') else []) + s['lines']).replace('..', '.'))

def screen_text(s):
    """the plain text of one screen, for the handout script"""
    if s['kind'] == 'shot':
        h = s.get('heads') or (('What you do', 'What you learn') if not s.get('label') else ('What to do', 'Good to know'))
        out = ['%s  %s' % (s['id'], s['name']), '%s: %s' % (h[0], s['do'])]
        if s.get('learn'): out.append('%s: %s' % (h[1], s['learn']))
        if s.get('quote'): out.append('On screen: ' + ' | '.join(s['quote'] if isinstance(s['quote'], list) else [s['quote']]))
        if s.get('watch'): out.append('Watch out: ' + s['watch'])
        return out
    return [s['title'] + ('  (' + s['sub'] + ')' if s.get('sub') else '')] + ['- ' + l for l in s['lines']]

def screen_words(s):
    if s['kind'] == 'shot':
        q = ' '.join(s['quote']) if isinstance(s.get('quote'), list) else (s.get('quote') or '')
        return words(' '.join([s['name'], s['do'], s.get('learn') or '', s.get('watch') or '', q]))
    return words(' '.join([s['title'], s.get('sub') or ''] + s['lines']))

LEAD = 0.3
VOICE = os.path.join(HERE, 'voice')
def screen_id(i, s):
    tag = s['id'] if s['kind'] == 'shot' and not s.get('label') else re.sub(r'[^a-z0-9]+', '-', (s.get('name') or s.get('title')).lower()).strip('-')[:28]
    return '%03d_%s' % (i + 1, tag)
def audio_len(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())
def wav_len(p):
    with wave.open(p) as w: return w.getnframes() / w.getframerate()

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-2000:]); raise SystemExit('failed: ' + ' '.join(cmd[:6]))

def main():
    args = sys.argv[1:]; only = None
    if '--only' in args: only = [int(x) for x in args[args.index('--only') + 1].split(',')]
    S = C.S; n = len(S)
    pngs = []
    for i, s in enumerate(S):
        frac = (i + 1) / n
        im = render_card(s, frac) if s['kind'] != 'shot' else render_shot(s, frac)
        p = os.path.join(SC, '%03d.png' % i); im.save(p); pngs.append(p)
    print(n, 'screens drawn')
    if '--frames-only' in args: return
    # ---- narration script (the words to speak, one entry per screen) -> narration.json
    ids = [screen_id(i, s) for i, s in enumerate(S)]
    narr = [{'id': ids[i], 'text': say_text(s)} for i, s in enumerate(S)]
    json.dump(narr, open(os.path.join(HERE, 'narration.json'), 'w'), indent=1, ensure_ascii=False)
    print('narration.json: %d entries, %d characters' % (len(narr), sum(len(x['text']) for x in narr)))
    # ---- voice files (ElevenLabs mp3 from make_voice.py) -> voice mode, else silent
    vdir = args[args.index('--voice-dir') + 1] if '--voice-dir' in args else VOICE
    mp3 = [os.path.join(vdir, x + '.mp3') for x in ids]
    voice = '--silent' not in args and any(os.path.exists(p) for p in mp3)
    lens = [0.0] * n
    if voice:
        miss = [ids[i] for i, p in enumerate(mp3) if not os.path.exists(p)]
        if miss: print('WARNING: no voice file for %d screens (they stay silent): %s' % (len(miss), ', '.join(miss[:8])))
        lens = [audio_len(p) if os.path.exists(p) else 0.0 for p in mp3]
    durs = []
    for i, s in enumerate(S):
        d = max(6.0, 0.4 * screen_words(s), (lens[i] + 0.6) if lens[i] else 0)
        durs.append(round(d * FPS) / FPS)
    print('%s build: total %.1f s = %.1f min' % ('VOICE' if voice else 'SILENT', sum(durs), sum(durs) / 60))
    # ---- one encoded file per screen, identical settings
    files = []
    for i, (p, d) in enumerate(zip(pngs, durs)):
        out = os.path.join(ENC, '%03d.mp4' % i); files.append(out)
        key = hashlib.sha1(open(p, 'rb').read() + str(d).encode()).hexdigest()[:12]; stamp = out + '.key'
        if os.path.exists(out) and os.path.exists(stamp) and open(stamp).read() == key and not (only and i in only): continue
        fade = ',fade=t=in:st=0:d=0.3' if S[i]['kind'] != 'shot' else ''
        tmp = out[:-4] + '.tmp.mp4'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', p, '-vf', 'format=yuv420p,loop=-1:1,trim=duration=%.4f%s' % (d, fade),
             '-r', str(FPS), '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-g', '150', '-an', tmp])
        os.replace(tmp, out); open(stamp, 'w').write(key)
    lst = os.path.join(OUTDIR, 'list.txt'); open(lst, 'w').write(''.join("file '%s'\n" % f for f in files))
    vid = os.path.join(OUTDIR, 'video.mp4'); tmp = vid[:-4] + '.tmp.mp4'
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', tmp]); os.replace(tmp, vid)
    final = args[args.index('--out') + 1] if '--out' in args else FINAL
    tmpf = final[:-4] + '.tmp.mp4'
    if voice:
        sr = 48000; total = int(round(sum(durs) * sr)); track = bytearray(total * 2); t0 = 0.0
        for i, d in enumerate(durs):
            if lens[i]:
                pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3[i], '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
                st = int(round((t0 + LEAD) * sr)) * 2; pcm = pcm[:max(0, len(track) - st)]
                track[st:st + len(pcm)] = pcm          # screens never overlap: audio ends before the screen does
            t0 += d
        aw = os.path.join(OUTDIR, 'narration.wav')
        with wave.open(aw, 'w') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(bytes(track))
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', aw, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', tmpf])
    else:
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-c', 'copy', '-movflags', '+faststart', tmpf])
    os.replace(tmpf, final)
    if final != FINAL: print('wrote', final); return
    # ---- the screen script (hand-out)
    t0 = 0.0; out = ['PanelGuard - Student Guide v2.0 - the text of every screen, in order', 'Video: PanelGuard_Student_Guide_v2.0.mp4 (%d screens, %d:%02d)' % (n, int(sum(durs)) // 60, int(sum(durs)) % 60), '']
    for i, s in enumerate(S):
        out.append('[%d:%02d] Screen %d%s' % (int(t0) // 60, int(t0) % 60, i + 1, ('  -  ' + s['prog']) if s.get('prog') else ''))
        out += screen_text(s); out.append(''); t0 += durs[i]
    open(SCRIPT, 'w').write('\n'.join(out))
    json.dump({'durs': durs, 'n': n}, open(os.path.join(OUTDIR, 'durs.json'), 'w'))
    print('wrote', FINAL, os.path.getsize(FINAL) // 1024, 'KB')

if __name__ == '__main__': main()
