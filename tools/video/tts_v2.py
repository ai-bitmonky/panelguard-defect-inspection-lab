"""Offline narration for the student guide v2.0: Kokoro-82M (ONNX, int8), voice af_heart, US English.
Model files: kokoro-v1.0.int8.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0).
Needs: pip install kokoro-onnx soundfile   (run with python -I)
Usage: tts_v2.py jobs.json   (a list of {"text", "out"}; writes 24 kHz 16-bit mono wav files)
"""
import sys, json, os, re
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
MODEL = os.environ.get('KOKORO_MODEL', '/tmp/voices/kokoro.onnx'); VOICES = os.environ.get('KOKORO_VOICES', '/tmp/voices/voices.bin')
VOICE, SPEED = os.environ.get('KOKORO_VOICE', 'af_heart'), float(os.environ.get('KOKORO_SPEED', '1.0'))
k = Kokoro(MODEL, VOICES)
jobs = json.load(open(sys.argv[1]))
for i, j in enumerate(jobs):
    # sentence by sentence, with a short pause between them (long inputs are cut by the model)
    parts = [p for p in re.split(r'(?<=[.!?:])\s+', j['text']) if p.strip()]
    chunks, sr = [], 24000
    for p in parts:
        a, sr = k.create(p, voice=VOICE, speed=SPEED, lang='en-us')
        chunks.append(a); chunks.append(np.zeros(int(sr * 0.28), dtype=np.float32))
    audio = np.concatenate(chunks) if chunks else np.zeros(sr, dtype=np.float32)
    tmp = j['out'] + '.tmp.wav'; sf.write(tmp, audio, sr, subtype='PCM_16'); os.replace(tmp, j['out'])
    print('%d/%d %.1fs' % (i + 1, len(jobs), len(audio) / sr), flush=True)
