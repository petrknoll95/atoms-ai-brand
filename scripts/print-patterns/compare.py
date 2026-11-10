"""Compare saved-master RGB previews with current renderer; color deltas are expected in print."""
from pathlib import Path
import os
from PIL import Image,ImageDraw,ImageFont
from fontTools.ttLib import TTFont
import json,numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/print/patterns';WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'));jobs=json.loads((WORK/'jobs.json').read_text());results=[]
fontpath=WORK/'PPNeueMontreal-Regular.ttf'
if not fontpath.exists():
 sourcefont=TTFont(ROOT/'public/fonts/PPNeueMontreal-Regular.woff2');sourcefont.flavor=None;sourcefont.save(fontpath)
font=ImageFont.truetype(str(fontpath),17)
for family in ['drift','offset','single-band','concentric']:
 rows=[j for j in jobs if j['family']==family];sheet=Image.new('RGB',(1280,80+190*(len(rows)//4)), '#f6f1e8');draw=ImageDraw.Draw(sheet);draw.text((10,12),f'{family}: each pair = current RGB renderer (left) / CMYK master preview (right)',font=font,fill='#1d3c34')
 for i,j in enumerate(rows):
  p=Path(j['out']+'-preview.png');ref=WORK/(j['id']+'-reference.png')
  if not p.exists():continue
  a=Image.open(ref).convert('RGB');b=Image.open(p).convert('RGB').resize(a.size,Image.Resampling.LANCZOS);aa=np.asarray(a).astype(float);bb=np.asarray(b).astype(float);la=aa@np.array([.2126,.7152,.0722]);lb=bb@np.array([.2126,.7152,.0722]);corr=float(np.corrcoef(la.ravel(),lb.ravel())[0,1]);mae=float(np.abs(aa-bb).mean())
  results.append(dict(id=j['id'],luminance_correlation=round(corr,5),mean_absolute_rgb_channel_difference_255=round(mae,3),interpretation='Geometry/falloff comparison; not colorimetric proof. ICC gamut, CMYK blending and Screen adaptation cause color differences.'))
  x=i%4*320+5;y=60+i//4*190;sheet.paste(a.resize((150,150)),(x,y));sheet.paste(b.resize((150,150)),(x+153,y));draw.text((x,y+155),f'{j["colorway"]} / {j["slits"] or "v"+str(j["density"])}',font=font,fill='#1d3c34')
 sheet.save(OUT/f'{family}-renderer-comparison.jpg',quality=95)
(OUT/'renderer-comparison.json').write_text(json.dumps(results,indent=2));print('Compared',len(results));print('Lowest correlations:', sorted([(x['luminance_correlation'],x['id'])for x in results])[:8])
