from pathlib import Path
import os
from PIL import Image,ImageDraw,ImageFont
from fontTools.ttLib import TTFont
import json,html
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/print/patterns';WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'));jobs=json.loads((WORK/'jobs.json').read_text())
fontpath=WORK/'PPNeueMontreal-Regular.ttf'
if not fontpath.exists():
 sourcefont=TTFont(ROOT/'public/fonts/PPNeueMontreal-Regular.woff2');sourcefont.flavor=None;sourcefont.save(fontpath)
font=ImageFont.truetype(str(fontpath),20)
for family in ['drift','offset','single-band','concentric']:
 rows=[j for j in jobs if j['family']==family];sheet=Image.new('RGB',(1280,100+350*(len(rows)//4)), '#f6f1e8');draw=ImageDraw.Draw(sheet);draw.text((20,20),f'AtomsAI / {family} / CMYK master previews',font=font,fill='#1d3c34')
 for i,j in enumerate(rows):
  x=(i%4)*320+10;y=80+(i//4)*350;png=Path(j['out']+'-preview.png')
  if not png.exists():continue
  im=Image.open(png).convert('RGB').resize((300,300));sheet.paste(im,(x,y));draw.text((x,y+308),f'{j["colorway"]} / {j["slits"] or "variant "+str(j["density"])}',font=font,fill='#1d3c34')
 sheet.save(OUT/f'{family}-contact-sheet.jpg',quality=95)
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AtomsAI print patterns</title><style>@font-face{font-family:Montreal;src:url(../../../public/fonts/PPNeueMontreal-Regular.woff2)}@font-face{font-family:Founders;src:url(../../../public/fonts/FoundersGrotesk-Regular.woff2)}body{background:#f6f1e8;color:#1d3c34;font:16px Montreal,system-ui;margin:40px}h1,h2{font-family:Founders,Montreal,sans-serif;font-weight:400}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(150px,1fr))}body{margin:16px}}@media(max-width:480px){.grid{grid-template-columns:minmax(0,1fr)}}img{width:100%;height:auto}a{color:inherit}article{margin-bottom:24px}.note{max-width:800px}</style><h1>AtomsAI print patterns</h1><p class="note">56 editable CMYK masters. 300 × 300 mm trim, 3 mm bleed. Assumed Coated FOGRA39 condition. RGB previews show the print adaptation; they are not production artwork. See <a href="README.md">editing and production instructions</a> and <a href="validation-summary.json">validation results</a> before printing.</p>']
for family in ['drift','offset','single-band','concentric']:
 parts+=[f'<h2>{family}</h2><div class="grid">']
 for j in jobs:
  if j['family']!=family:continue
  stem=family+'/'+j['id'];parts.append(f'<article><img width="1200" height="1200" loading="lazy" alt="{family} — {j["colorway"]} — {j["slits"] or "variant "+str(j["density"])}" src="{stem}-preview.png"><p>{j["colorway"]} · {j["slits"] or "Variant "+str(j["density"])}</p><a download href="{stem}-cmyk.ai">Illustrator</a> · <a download href="{stem}-cmyk-print.pdf">Print PDF</a> · <a download href="{stem}-preview.png">Preview PNG</a> · <a href="{stem}-validation.json">Checks</a></article>')
 parts+=['</div>']
(OUT/'catalog.html').write_text('\n'.join(parts))
