#!/usr/bin/env python3
"""
Video Cache Manager — Downloads and indexes Simli video responses locally.

Usage:
  python3 save_video.py --url "https://api.simli.ai/mp4/..." --prompt "Governor, focus on infantry..." --archetype "steward" --advisor "Ysabel"

Or import and call save_response() from another script.

All videos saved to this directory. Index at index.json.
MANDATORY: Never delete videos without explicit Architect approval.
"""

import os
import sys
import json
import hashlib
import argparse
from datetime import datetime

CACHE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(CACHE_DIR, 'index.json')


def load_index():
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE) as f:
            return json.load(f)
    return []


def save_index(index):
    with open(INDEX_FILE, 'w') as f:
        json.dump(index, f, indent=2)


def make_cache_key(text, archetype):
    normalized = text.lower().strip()
    raw = f"{archetype}:{normalized}"
    return hashlib.md5(raw.encode()).hexdigest()[:16]


def save_response(mp4_url, prompt, response_text=None, archetype='steward',
                   advisor_name='Ysabel', face_id='f3e0d64a-dda5-403e-8d23-b3c980dd3713',
                   audio_url=None):
    """Download and index a Simli video response."""
    import requests

    cache_key = make_cache_key(response_text or prompt, archetype)

    # Check if already cached
    index = load_index()
    for entry in index:
        if entry.get('cache_key') == cache_key:
            entry['times_served'] = entry.get('times_served', 0) + 1
            save_index(index)
            print(f"Already cached: {entry['filename']} (served {entry['times_served']}x)")
            return entry

    # Download MP4
    filename = f"{cache_key}_{archetype}.mp4"
    filepath = os.path.join(CACHE_DIR, filename)

    print(f"Downloading: {mp4_url}")
    resp = requests.get(mp4_url, timeout=60)
    with open(filepath, 'wb') as f:
        f.write(resp.content)
    print(f"Saved: {filepath} ({len(resp.content):,} bytes)")

    # Download audio too if provided
    audio_filename = None
    if audio_url:
        audio_filename = f"{cache_key}_{archetype}.mp3"
        audio_path = os.path.join(CACHE_DIR, audio_filename)
        audio_resp = requests.get(audio_url, timeout=60)
        with open(audio_path, 'wb') as f:
            f.write(audio_resp.content)

    # Create index entry
    entry = {
        'cache_key': cache_key,
        'prompt': prompt,
        'response_text': response_text or prompt,
        'archetype': archetype,
        'advisor_name': advisor_name,
        'face_id': face_id,
        'filename': filename,
        'audio_filename': audio_filename,
        'original_mp4_url': mp4_url,
        'tts_voice': 'nova',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'times_served': 1,
        'file_size_bytes': len(resp.content),
    }

    index.append(entry)
    save_index(index)
    print(f"Indexed: {cache_key} | {prompt[:80]}...")
    return entry


def list_cache():
    """Print all cached videos."""
    index = load_index()
    print(f"\n{'='*70}")
    print(f"VIDEO CACHE: {len(index)} entries")
    print(f"{'='*70}")
    for e in index:
        served = e.get('times_served', 0)
        size_mb = e.get('file_size_bytes', 0) / 1024 / 1024
        print(f"\n  [{e['archetype']}] {e['prompt'][:60]}...")
        print(f"  File: {e['filename']} ({size_mb:.1f}MB) | Served: {served}x | {e['generated']}")

    total_bytes = sum(e.get('file_size_bytes', 0) for e in index)
    print(f"\n  Total: {total_bytes/1024/1024:.1f}MB across {len(index)} videos")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Save a Simli video response to local cache')
    parser.add_argument('--url', help='MP4 URL to download')
    parser.add_argument('--prompt', help='The prompt/question that generated this response')
    parser.add_argument('--response', help='The response text (defaults to prompt)')
    parser.add_argument('--archetype', default='steward', help='Advisor archetype')
    parser.add_argument('--advisor', default='Ysabel', help='Advisor name')
    parser.add_argument('--list', action='store_true', help='List all cached videos')

    args = parser.parse_args()

    if args.list:
        list_cache()
    elif args.url and args.prompt:
        save_response(
            mp4_url=args.url,
            prompt=args.prompt,
            response_text=args.response or args.prompt,
            archetype=args.archetype,
            advisor_name=args.advisor,
        )
    else:
        parser.print_help()
