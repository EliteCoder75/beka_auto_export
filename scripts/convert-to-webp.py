"""
BEKA AUTO EXPORT — Convert images to WebP
Scans images/, converts jpg/png to webp, updates _vehicules/*.md, deletes originals.
"""

import os
import re
from PIL import Image

IMAGES_DIR   = os.path.join(os.path.dirname(__file__), '..', 'images')
VEHICULES_DIR = os.path.join(os.path.dirname(__file__), '..', '_vehicules')
CONVERTIBLE  = {'.jpg', '.jpeg', '.png'}

def run():
    files = [f for f in os.listdir(IMAGES_DIR)
             if os.path.splitext(f)[1].lower() in CONVERTIBLE]

    if not files:
        print('Nothing to convert.')
        return

    renamed = {}

    for f in files:
        src  = os.path.join(IMAGES_DIR, f)
        base = os.path.splitext(f)[0]
        dst_name = base + '.webp'
        dst  = os.path.join(IMAGES_DIR, dst_name)

        before = os.path.getsize(src) // 1024

        img = Image.open(src).convert('RGB')
        img.save(dst, 'WEBP', quality=85)
        os.remove(src)

        after = os.path.getsize(dst) // 1024
        saved = round((1 - after / max(before, 1)) * 100)
        renamed[f'images/{f}'] = f'images/{dst_name}'
        print(f'  ✓  {f} → {dst_name}  ({before}KB → {after}KB, -{saved}%)')

    if not renamed:
        return

    for md_file in os.listdir(VEHICULES_DIR):
        if not md_file.endswith('.md'):
            continue
        md_path = os.path.join(VEHICULES_DIR, md_file)
        content = open(md_path, encoding='utf-8').read()
        new_content = content
        for old, new in renamed.items():
            new_content = new_content.replace(old, new)
        if new_content != content:
            open(md_path, 'w', encoding='utf-8').write(new_content)
            print(f'  ↺  Updated: _vehicules/{md_file}')

    print(f'\nDone. {len(renamed)} image(s) converted.')

if __name__ == '__main__':
    run()
