#!/usr/bin/env python3
import gzip
import json
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

EPG_URL = os.getenv('EPG_XMLTV_URL', 'https://iptv-epg.org/files/epg-de.xml.gz')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'epg-cache.json')

def main():
    print(f'[fetch-epg-json] Downloading XMLTV from {EPG_URL}...')
    try:
        req = urllib.request.Request(EPG_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=40) as resp:
            with gzip.GzipFile(fileobj=resp) as gz:
                xml_data = gz.read()
    except Exception as e:
        print(f'[fetch-epg-json] Download failed: {e}', file=sys.stderr)
        if os.path.exists(OUTPUT_FILE):
            print('[fetch-epg-json] Using existing epg-cache.json fallback.')
            return 0
        return 1

    print(f'[fetch-epg-json] Parsing {len(xml_data)} bytes of XMLTV...')
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f'[fetch-epg-json] XML parse failed: {e}', file=sys.stderr)
        return 1

    raw_channels = []
    for ch in root.findall('channel'):
        cid = ch.get('id', '')
        name_el = ch.find('display-name')
        name = name_el.text if name_el is not None else cid
        icon_el = ch.find('icon')
        logo = icon_el.get('src') if icon_el is not None else None
        raw_channels.append({'id': cid, 'name': name, 'logo': logo})

    programmes = []
    for p in root.findall('programme'):
        chid = p.get('channel', '')
        norm_cid = chid.lower().replace('de-', '').replace('.de', '')
        title_el = p.find('title')
        desc_el = p.find('desc')
        cat_el = p.find('category')
        icon_el = p.find('icon')

        start_str = p.get('start', '')
        stop_str = p.get('stop', '')

        try:
            dt_start = datetime.strptime(start_str[:14], '%Y%m%d%H%M%S').replace(tzinfo=timezone.utc)
            dt_stop = datetime.strptime(stop_str[:14], '%Y%m%d%H%M%S').replace(tzinfo=timezone.utc)
            iso_start = dt_start.isoformat()
            iso_stop = dt_stop.isoformat()
            date_str = iso_start[:10]
        except Exception:
            continue

        title = title_el.text if title_el is not None else ''
        desc = desc_el.text if desc_el is not None else ''
        cat = cat_el.text if cat_el is not None else ''
        poster = icon_el.get('src') if icon_el is not None else None

        programmes.append({
            'id': f'{norm_cid}-{start_str[:14]}',
            'channel_id': norm_cid,
            'title': title,
            'description': desc,
            'start_time': iso_start,
            'end_time': iso_stop,
            'date': date_str,
            'category': cat,
            'poster_url': poster
        })

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'channels': raw_channels, 'programmes': programmes}, f)

    print(f'[fetch-epg-json] Successfully wrote {len(raw_channels)} channels and {len(programmes)} programmes to {OUTPUT_FILE}!')
    return 0

if __name__ == '__main__':
    sys.exit(main())
