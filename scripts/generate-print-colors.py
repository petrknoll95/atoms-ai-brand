#!/usr/bin/env python3
"""Generate/check CMYK using Pillow 12.1.0 + LittleCMS 2.17. See docs/print-colors.md."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess

import PIL
from PIL import Image, ImageCms

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--profiles', type=Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
if (PIL.__version__, ImageCms.core.littlecms_version) != ('12.1.0', '2.17'):
    raise SystemExit('Reproduction requires Pillow 12.1.0 and LittleCMS 2.17.')
profiles = {
    'C': {
        'name': 'PSO Coated v3', 'condition': 'FOGRA51', 'stock': 'Coated',
        'file': 'PSOcoated_v3.icc',
        'sha256': 'c30ad2c01e8f93135ec7682c535e0a81bc2d177c301e196376c5f5838b5c8e86',
        'url': 'https://registry.color.org/profile-registry/PSOcoated_v3',
    },
    'U': {
        'name': 'PSO Uncoated v3 (FOGRA52)', 'condition': 'FOGRA52', 'stock': 'Uncoated',
        'file': 'PSOuncoated_v3_FOGRA52.icc',
        'sha256': '7c39f74fbede1e8c85f8fbb9df7d359aea638b9b68dd0854fdd3ba386e3a02c0',
        'url': 'https://registry.color.org/profile-registry/PSOuncoated_v3_FOGRA52',
    },
}
colors = json.loads(subprocess.check_output([
    'node', '--experimental-strip-types', '--input-type=module', '-e',
    "import {allColors} from './src/data/colors.ts'; console.log(JSON.stringify(allColors));",
], cwd=ROOT, text=True))
source = Image.new('RGB', (len(colors), 1))
source.putdata([tuple(bytes.fromhex(c['hex'][1:])) for c in colors])
result = {
    'version': 1,
    'conversion': {
        'source': 'sRGB IEC61966-2.1',
        'sourceProfile': 'LittleCMS built-in sRGB (ImageCms.createProfile)',
        'engine': 'LittleCMS 2.17', 'library': 'Pillow 12.1.0',
        'intent': 'Relative colorimetric', 'blackPointCompensation': True,
        'precision': '8-bit CMYK, rounded to nearest whole percent (half up)',
        'channelOrder': ['C', 'M', 'Y', 'K'],
        'note': 'Process simulations of the digital palette on profile reference white; not Pantone ink recipes. Proof on the final stock.',
    },
    'profiles': profiles,
    'colors': {c['token']: {'hex': c['hex']} for c in colors},
}
for stock, profile in profiles.items():
    path = args.profiles / profile['file']
    if hashlib.sha256(path.read_bytes()).hexdigest() != profile['sha256']:
        raise SystemExit(f'Profile checksum mismatch: {path}')
    transform = ImageCms.buildTransformFromOpenProfiles(
        ImageCms.createProfile('sRGB'), ImageCms.getOpenProfile(str(path)), 'RGB', 'CMYK',
        renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,
        flags=ImageCms.Flags.BLACKPOINTCOMPENSATION,
    )
    converted = ImageCms.applyTransform(source, transform)
    for i, color in enumerate(colors):
        result['colors'][color['token']][stock] = [
            math.floor(v * 100 / 255 + 0.5) for v in converted.getpixel((i, 0))
        ]
output = ROOT / 'src/data/cmyk-values.json'
encoded = json.dumps(result, indent=2) + '\n'
if args.check:
    if output.read_text() != encoded:
        raise SystemExit('CMYK data has drifted; regenerate and review the print values.')
    print(f'Checked {len(colors)} colors across both ICC profiles.')
else:
    output.write_text(encoded)
    print(f'Generated {len(colors)} colors across both ICC profiles.')
