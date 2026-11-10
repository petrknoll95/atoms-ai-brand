"""Derive native-mask interchange from current repository sources; no screenshot tracing."""
from pathlib import Path
import os
import json,subprocess,hashlib,math,re,argparse
from PIL import Image,ImageCms
import PIL
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,default=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production')));a=p.parse_args();WORK=a.work;WORK.mkdir(exist_ok=True,parents=True)
OUT=ROOT/'assets/print/patterns';OUT.mkdir(exist_ok=True,parents=True)
spec=json.loads(subprocess.check_output(['node','scripts/print-patterns/export-spec.mjs'],cwd=ROOT))
PROFILE=Path('/Library/Application Support/Adobe/Color/Profiles/Recommended/CoatedFOGRA39.icc')
transform=ImageCms.buildTransformFromOpenProfiles(ImageCms.createProfile('sRGB'),ImageCms.getOpenProfile(str(PROFILE)),'RGB','CMYK',renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
def cmyk(h):return [round(v*100/255,6) for v in ImageCms.applyTransform(Image.new('RGB',(1,1),tuple(bytes.fromhex(h[1:]))),transform).getpixel((0,0))]
k=300*72/25.4/800

def stops(curve):
 if isinstance(curve,list):return [(j/(len(curve)-1),v) for j,v in enumerate(curve)]
 if curve=='cosine':return [(j/32,(1+math.cos(math.pi*j/32))/2)for j in range(33)]
 t=.86 if curve=='fade86' else .72
 return [(0,1)]+[(t+(1-t)*j/20,1-(j/20)**2*(3-2*j/20))for j in range(21)]

def svg(family,density,n,colors):
 defs=[];nodes=[];counter=[0]
 def node(nd):
  counter[0]+=1;name=nd.get('role','fields');mid='mask_'+name
  mask=nd.get('mask')
  if mask:
   sw=840/n
   parts=['<rect width="840" height="840" fill="#000000"/>']
   for i in range(n):
    cid=f'{mid}_clip_{i}';defs.append(f'<clipPath id="{cid}"><rect x="{i*sw}" width="{sw}" height="840"/></clipPath>');parts.append(f'<g clip-path="url(#{cid})">')
    for j,T in enumerate(mask['paints']):
     (aa,b,tx),(c,d,ty)=T;det=aa*d-b*c;ia=d/det;ib=-b/det;ic=-c/det;idd=aa/det
     mat=(ia*sw,ic*840,ib*sw,idd*840,(i-ia*tx-ib*ty)*sw,(-ic*tx-idd*ty)*840);gid=f'{mid}_g_{i}_{j}'
     defs.append(f'<radialGradient id="{gid}" gradientUnits="userSpaceOnUse" cx=".5" cy=".5" r=".5" gradientTransform="matrix({" ".join(map(str,mat))})">'+''.join(f'<stop offset="{t:.9f}" stop-color="#FFFFFF" stop-opacity="{v:.9f}"/>' for t,v in stops(mask['curve']))+'</radialGradient>')
     parts.append(f'<rect x="{i*sw}" width="{sw}" height="840" fill="url(#{gid})"/>')
    parts.append('</g>')
   defs.append(f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="840" height="840">'+''.join(parts)+'</mask>')
  content=(f'<rect id="ink_{name}" width="840" height="840" fill="{colors[name]}"/>' if nd['kind']=='fill' else ''.join(node(ch)for ch in nd['children']))
  return f'<g id="{name}"><g'+(f' mask="url(#{mid})"' if mask else '')+'>'+content+'</g></g>'
 if family!='concentric':
  nodes=[node(nd) for nd in spec['slitLayers'][family]]
 else:
  for role in ['upper','lower','highlight']:
   raw=(ROOT/f'public/pattern-masks/concentric-{density}-{role}.svg').read_text();raw=re.sub(r'\bg(\d+)\b',role+r'_g\1',raw)
   defs.append(re.search(r'<defs>(.*?)</defs>',raw).group(1));art=re.search(r'</defs>(.*)</svg>',raw).group(1)
   defs.append(f'<mask id="mask_{role}" maskUnits="userSpaceOnUse" x="0" y="0" width="840" height="840"><rect width="840" height="840" fill="#000000"/>{art}</mask>')
   nodes.append(f'<g id="{role}"><g mask="url(#mask_{role})"><rect id="ink_{role}" width="840" height="840" fill="{colors[role]}"/></g></g>')
  nodes.append(f'<g id="reflection"><rect id="ink_reflection" width="840" height="840" fill="{colors["reflection"]}"/></g>')
 result = f'<svg xmlns="http://www.w3.org/2000/svg" width="{840*k}pt" height="{840*k}pt" viewBox="0 0 840 840"><defs>'+''.join(defs)+'</defs>'+f'<g id="base"><rect id="ink_base" width="840" height="840" fill="{colors["base"]}"/></g>'+''.join(nodes)+'</svg>'
 # Import masks as ordinary editable groups; Illustrator constructs native opacity masks afterward.
 masks=re.findall(r'<mask id="mask_([^"]+)"[^>]*>(.*?)</mask>',result)
 result=re.sub(r'<mask[^>]*>.*?</mask>','',result)
 result=re.sub(r' mask="url\(#mask_[^"]+\)"','',result)
 result=result.replace('</svg>',''.join(f'<g id="source_mask_{role}">{art}</g>' for role,art in masks)+'</svg>')
 return result

jobs=[]
for s in spec['structures']:
 family=s['id'];(OUT/family).mkdir(exist_ok=True)
 for density in s['densities']:
  n=spec['SLITS'][density] if family!='concentric' else None
  for name,colors in s['colorways'].items():
   ident=f'atomsai-{family}-{name.lower()}-{n if n else "variant-"+str(density)}'
   path=WORK/(ident+'.svg');path.write_text(svg(family,density,n,colors))
   jobs.append(dict(id=ident,family=family,colorway=name,density=density,slits=n,svg=str(path),out=str(OUT/family/ident),colors=colors,cmyk={role:cmyk(h)for role,h in colors.items()},nodes=spec['slitLayers'].get(family,spec['ringLayers'])))
(WORK/'jobs.json').write_text(json.dumps(jobs,indent=2));(WORK/'jobs.jsxinc').write_text('var JOBS='+json.dumps(jobs)+';')
files=['src/data/colors.ts','src/data/patterns.ts','src/scripts/pattern-renderer.ts','src/components/PatternGenerator.astro','src/pages/assets/brand/manifest.json.ts']+[str(p.relative_to(ROOT))for p in sorted((ROOT/'public/pattern-masks').glob('*.svg'))]
manifest=dict(date='2026-11-10',count=len(jobs),profile=str(PROFILE),profile_sha256=hashlib.sha256(PROFILE.read_bytes()).hexdigest(),conversion=dict(source='sRGB IEC61966-2.1',destination='Coated FOGRA39 (ISO 12647-2:2004)',intent='Relative colorimetric',black_point_compensation=True,pillow=PIL.__version__,littlecms=ImageCms.core.littlecms_version,precision='8-bit profile output, expressed as percentage; Illustrator save quantization checked separately',cream='Converted through same profile; obsolete 0/2/6/4 override removed'),source_files={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in files},guidance_review={'skills/atomsai-brand/SKILL.md':dict(sha256=hashlib.sha256((ROOT/'skills/atomsai-brand/SKILL.md').read_bytes()).hexdigest(),reviewed='2026-11-10')},inventory_reason='56 published combinations. Master is a guideline specimen and data recipe, not a published generator choice or downloadable pattern. Intermediate generator slit stops excluded.',spec=spec)
previous={x['id']:x for x in json.loads((OUT/'inventory.json').read_text())} if (OUT/'inventory.json').exists() else {}
(OUT/'source-manifest.json').write_text(json.dumps(manifest,indent=2));(OUT/'inventory.json').write_text(json.dumps([dict(id=j['id'],family=j['family'],colorway=j['colorway'],density_key=j['density'],slits=j['slits'],status=previous.get(j['id'],{}).get('status','pending'),palette={r:dict(hex=j['colors'][r],cmyk=v)for r,v in j['cmyk'].items()})for j in jobs],indent=2))
print(f'Prepared {len(jobs)} jobs; Cream CMYK {cmyk("#F6F1E8")}')
