#!/usr/bin/env python3
"""
fetch-channel-logos.py — Scarica e memorizza localmente tutti i loghi dei canali.

Obiettivo:
Eliminare le dipendenze esterne verso iptv-epg.org (bloccato da robots.txt Disallow: /images/),
garantendo che Googlebot smartphone e desktop possano visualizzare e indicizzare tutti i loghi.
I file scaricati vengono salvati in public/channel-logos/ e mappati in src/data/channel-logos-map.json.
"""

import json
import os
import re
import sys
import urllib.request
import concurrent.futures

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
EPG_CACHE_FILE = os.path.join(PROJECT_DIR, 'src', 'data', 'epg-cache.json')
LOGOS_DIR = os.path.join(PROJECT_DIR, 'public', 'channel-logos')
MAP_FILE = os.path.join(PROJECT_DIR, 'src', 'data', 'channel-logos-map.json')

os.makedirs(LOGOS_DIR, exist_ok=True)

# Leggi channelSlug.ts per usare la stessa mappatura canonica
SLUG_MAP = {}
slug_ts_file = os.path.join(PROJECT_DIR, 'src', 'utils', 'channelSlug.ts')
if os.path.exists(slug_ts_file):
    with open(slug_ts_file, 'r', encoding='utf-8') as f:
        content = f.read()
    for m in re.finditer(r'[\'\"]([a-zA-Z0-9_\-\.]+)[\'\"]\s*:\s*[\'\"]([a-zA-Z0-9_\-\.]+)[\'\"]', content):
        SLUG_MAP[m.group(1)] = m.group(2)

def norm_cid(cid):
    if not cid:
        return ''
    cleaned = cid.lower().strip()
    cleaned = re.sub(r'^de\s*[-–:]\s*', '', cleaned, flags=re.I)
    cleaned = re.sub(r'^de-', '', cleaned)
    cleaned = re.sub(r'\.de$', '', cleaned)
    cleaned = cleaned.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
    cleaned = cleaned.replace('+', '-plus-').replace('&', '-and-')
    cleaned = re.sub(r'[^a-z0-9]+', '-', cleaned)
    cleaned = re.sub(r'^-+|-+$', '', cleaned)
    return SLUG_MAP.get(cleaned) or SLUG_MAP.get(cid.lower().strip()) or cleaned

def download_one(channel):
    cid = channel.get('id', '')
    name = channel.get('name', '')
    remote_url = channel.get('logo', '')

    slug = norm_cid(cid)
    if not slug:
        return None

    # Controlla se esiste già un file SVG o PNG locale
    for ext in ['.svg', '.png', '.webp', '.jpg']:
        candidate = os.path.join(LOGOS_DIR, f"{slug}{ext}")
        if os.path.exists(candidate) and os.path.getsize(candidate) > 100:
            return (slug, f"/channel-logos/{slug}{ext}")

    if not remote_url or not remote_url.startswith('http'):
        return None

    target_file = os.path.join(LOGOS_DIR, f"{slug}.png")

    try:
        req = urllib.request.Request(
            remote_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            }
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read()
            if len(content) > 100:
                content_type = resp.headers.get('Content-Type', '').lower()
                ext = '.png'
                if 'svg' in content_type:
                    ext = '.svg'
                elif 'webp' in content_type:
                    ext = '.webp'
                elif 'jpeg' in content_type or 'jpg' in content_type:
                    ext = '.jpg'

                final_target = os.path.join(LOGOS_DIR, f"{slug}{ext}")
                with open(final_target, 'wb') as out_f:
                    out_f.write(content)
                return (slug, f"/channel-logos/{slug}{ext}")
    except Exception as e:
        # Non bloccare se un singolo canale remoto fallisce
        return None

def main():
    if not os.path.exists(EPG_CACHE_FILE):
        print(f"[fetch-channel-logos] Cache file missing: {EPG_CACHE_FILE}")
        return

    with open(EPG_CACHE_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    channels = data.get('channels', [])
    print(f"[fetch-channel-logos] Inizio download loghi per {len(channels)} canali...")

    existing_map = {}
    if os.path.exists(MAP_FILE):
        try:
            with open(MAP_FILE, 'r', encoding='utf-8') as mf:
                existing_map = json.load(mf)
        except Exception:
            existing_map = {}

    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(download_one, ch): ch for ch in channels}
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res:
                slug, local_path = res
                results[slug] = local_path

    # Fonde i risultati con la mappa esistente
    existing_map.update(results)

    with open(MAP_FILE, 'w', encoding='utf-8') as mf:
        json.dump(existing_map, mf, indent=2, ensure_ascii=False)

    print(f"[fetch-channel-logos] Completato! Mappati {len(existing_map)} loghi in {MAP_FILE}")

if __name__ == '__main__':
    main()
