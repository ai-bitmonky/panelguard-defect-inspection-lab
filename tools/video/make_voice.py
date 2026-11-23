#!/usr/bin/env python3
"""Make the narration mp3 files for the PanelGuard student guide v2.0 with ElevenLabs text-to-speech.

Reads tools/video/narration.json (written by build_v2.py: one {"id", "text"} per screen, in order) and writes
tools/video/voice/<id>.mp3 for every entry. A file that already exists is skipped, unless its text changed since it was
made (voice/index.json keeps a fingerprint of the text of each file; the key is never stored anywhere).
Then run:  python3 tools/video/build_v2.py   -> each screen lasts at least as long as its audio + 0.6 s.

Standard library only (runs with plain python3 on a Mac). The API key is read from the environment only:
    export ELEVENLABS_API_KEY=...        (never put the key in a file or in the command line history of a shared shell)
    python3 tools/video/make_voice.py [--voice VOICE_ID] [--model MODEL_ID] [--only 001_panelguard,023_1b] [--dry]
--dry prints what would be sent (ids and character count) and calls nothing.
"""
import argparse, hashlib, json, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format={fmt}'

def main():
    ap = argparse.ArgumentParser(description='ElevenLabs narration for the student guide')
    ap.add_argument('--voice', default='siw1N9V8LmYeEWKyWBxv', help='ElevenLabs voice id (default: the teacher\'s voice)')
    ap.add_argument('--model', default='eleven_multilingual_v2', help='model id (API default: eleven_multilingual_v2)')
    ap.add_argument('--format', default='mp3_44100_128', help='output_format query value')
    ap.add_argument('--narration', default=os.path.join(HERE, 'narration.json'))
    ap.add_argument('--out', default=os.path.join(HERE, 'voice'))
    ap.add_argument('--only', default='', help='comma-separated ids to (re)make')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    items = json.load(open(a.narration, encoding='utf-8'))
    os.makedirs(a.out, exist_ok=True)
    idx_path = os.path.join(a.out, 'index.json')
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    fp = lambda t: hashlib.sha256((a.voice + '|' + a.model + '|' + t).encode('utf-8')).hexdigest()[:16]
    only = set(x for x in a.only.split(',') if x)
    todo = []
    for it in items:
        mp3 = os.path.join(a.out, it['id'] + '.mp3')
        if only and it['id'] not in only: continue
        if os.path.exists(mp3) and index.get(it['id']) in (None, fp(it['text'])) and not only: continue
        todo.append(it)
    total = sum(len(it['text']) for it in items)
    print('narration: %d screens, %d characters in total' % (len(items), total))
    print('to make now: %d files, %d characters (ElevenLabs bills by character)' % (len(todo), sum(len(it['text']) for it in todo)))
    if a.dry or not todo: return
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not key: sys.exit('Set the environment variable ELEVENLABS_API_KEY first (the key is read from there only).')

    url = API.format(voice=a.voice, fmt=a.format)
    for n, it in enumerate(todo, 1):
        body = json.dumps({'text': it['text'], 'model_id': a.model}).encode('utf-8')
        for attempt in range(5):
            req = urllib.request.Request(url, data=body, method='POST', headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
            try:
                with urllib.request.urlopen(req, timeout=180) as r: audio = r.read()
                break
            except urllib.error.HTTPError as e:
                msg = e.read()[:400].decode('utf-8', 'replace')
                if e.code in (429, 500, 502, 503) and attempt < 4:
                    wait = 5 * (attempt + 1); print('  %s: HTTP %d, retry in %d s' % (it['id'], e.code, wait)); time.sleep(wait); continue
                sys.exit('%s: HTTP %d %s' % (it['id'], e.code, msg))
            except urllib.error.URLError as e:
                if attempt < 4: time.sleep(5); continue
                sys.exit('%s: network error: %s' % (it['id'], e.reason))
        mp3 = os.path.join(a.out, it['id'] + '.mp3'); tmp = mp3 + '.part'
        with open(tmp, 'wb') as f: f.write(audio)
        os.replace(tmp, mp3)
        index[it['id']] = fp(it['text'])
        with open(idx_path, 'w') as f: json.dump(index, f, indent=1)
        print('%d/%d %s  %d chars  %d KB' % (n, len(todo), it['id'], len(it['text']), len(audio) // 1024))
    print('done. Now run: python3 tools/video/build_v2.py')

if __name__ == '__main__':
    main()
