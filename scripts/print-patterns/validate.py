"""Normalize bleed boxes, copy native exports, and check all production files (not PDF/X certification)."""
from pathlib import Path
import os
import json,hashlib,re,shutil,argparse
from compression import zstd
from pypdf import PdfReader,PdfWriter
from pypdf.generic import RectangleObject,NameObject,TextStringObject
import pymupdf as fitz
import numpy as np
from PIL import Image,ImageCms
from pdf_image_resolution import image_resolutions
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/print/patterns'
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,default=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production')));a=p.parse_args();WORK=a.work
jobs=json.loads((WORK/'jobs.json').read_text());inventory=json.loads((OUT/'inventory.json').read_text());manifest=json.loads((OUT/'source-manifest.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def private_ai(p):
 r=PdfReader(p);d=r.pages[0]['/PieceInfo']['/Illustrator']['/Private'];b=b''.join(d[k].get_object().get_data()for k in d if 'PrivateData' in k);return zstd.decompress(b[b.index(b'\x28\xb5\x2f\xfd'):])
for job,entry in zip(jobs,inventory):
 ident=job['id'];dest=Path(job['out']);reportfile=dest.with_name(ident+'-validation.json')
 if not (WORK/(ident+'.done')).exists():continue
 if reportfile.exists():
  previous_report=json.loads(reportfile.read_text());entry['status']='validated' if 'blend_modes' in previous_report['pdf'] else 'pending-blend-audit';continue
 print('Validating',ident,flush=True)
 ai=dest.with_name(ident+'-cmyk.ai');pdf=dest.with_name(ident+'-cmyk-print.pdf');png=dest.with_name(ident+'-preview.png')
 shutil.copy2(WORK/ai.name,ai);shutil.copy2(WORK/png.name,png)
 # Embed sRGB in the Illustrator RGB export without changing its pixels.
 im=Image.open(png);assert float(np.asarray(im.convert('RGB')).std(axis=(0,1)).max())>2,'Blank/flat preview';im.convert('RGB').save(png,icc_profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes())
 raw=PdfReader(WORK/(ident+'-raw.pdf'));w=PdfWriter(clone_from=raw);w.pdf_header=raw.pdf_header;page=w.pages[0];t=list(map(float,page.trimbox));b=3*72/25.4
 # Remove sub-micron Adobe box rounding while keeping the original crop center.
 cx=(t[0]+t[2])/2;cy=(t[1]+t[3])/2;half=150*72/25.4
 t=[cx-half,cy-half,cx+half,cy+half];page.trimbox=RectangleObject(t)
 box=RectangleObject([t[0]-b,t[1]-b,t[2]+b,t[3]+b]);page.mediabox=box;page.cropbox=box;page.bleedbox=box
 if '/ArtBox'in page:del page['/ArtBox']
 # Illustrator 30.8 writes the condition identifier into RegistryName despite PDFSaveOptions.
 w._root_object['/OutputIntents'][0].get_object()[NameObject('/RegistryName')]=TextStringObject('http://www.color.org')
 w.write(pdf)
 r=PdfReader(pdf);page=r.pages[0];intent=r.trailer['/Root']['/OutputIntents'][0];icc=hashlib.sha256(intent['/DestOutputProfile'].get_data()).hexdigest();spaces=set();shadings=0;smasks=0;overprints=[];imageinfo=[];blends=set()
 for num in sorted({n for ids in r.xref.values()for n in ids if n}|set(r.xref_objStm)):
  o=r.get_object(num)
  if not isinstance(o,dict):continue
  if '/ColorSpace'in o:spaces.add(str(o['/ColorSpace']))
  if '/BM'in o:blends.add(str(o['/BM']))
  if '/ShadingType'in o:shadings+=1
  if '/SMask'in o:smasks+=1
  if any(getattr(o.get(key),'value',False) is True for key in ['/OP','/op']):overprints.append(num)
  if '/CS' in o:spaces.add(str(o['/CS']))
  if o.get('/Subtype')=='/Image':imageinfo.append(dict(width=int(o['/Width']),height=int(o['/Height']),color_space=str(o.get('/ColorSpace'))))
 assert not any(s in str(spaces)for s in ['RGB','DeviceN']),spaces
 assert all("'/Separation', '/Black'" in s for s in spaces if '/Separation' in s),spaces
 for n in sorted({n for ids in r.xref.values()for n in ids if n}|set(r.xref_objStm)):
  obj=r.get_object(n)
  if isinstance(obj,dict) and obj.get('/N')==3 and hasattr(obj,'get_data'):raise AssertionError('Unexpected three-channel profile')
 expected_blends={'/Normal','/Overlay'} if job['family']=='single-band' else {'/Normal','/Screen'}
 assert blends==expected_blends,(blends,expected_blends)
 assert icc==manifest['profile_sha256']
 assert r.metadata.get('/GTS_PDFXVersion')=='PDF/X-4'
 dims=[float(page.trimbox.width)*25.4/72,float(page.trimbox.height)*25.4/72];assert all(abs(x-300)<.001 for x in dims)
 bleeds=[float(page.trimbox.left)-float(page.bleedbox.left),float(page.trimbox.bottom)-float(page.bleedbox.bottom),float(page.bleedbox.right)-float(page.trimbox.right),float(page.bleedbox.top)-float(page.trimbox.top)];assert all(abs(v-b)<1e-6 for v in bleeds)
 native=private_ai(ai);maskcount=native.count(b'(AI9_Mask)');blur=[float(v)for v in re.findall(rb'\(Gaussian Blur\) /Title ,\s*/Dictionary : /NotRecorded ,\s*([0-9.]+) /Real \(blur\)',native)]
 expected_masks=7 if job['family']=='single-band' else 3 if job['family']=='concentric' else 4
 assert maskcount==expected_masks,(maskcount,expected_masks)
 expected_blur=4 if job['family']=='single-band' else 3 if job['family']=='drift' else 0
 assert len(blur)==expected_blur,(blur,expected_blur)
 assert all(abs(v-1.89*300*72/25.4/800)<1e-5 for v in blur)
 assert b'blurradius' not in native
 ar=PdfReader(ai);layers=[str(v.get_object()['/Name'])for v in ar.trailer['/Root']['/OCProperties']['/OCGs']];assert len(layers)==5
 doc=fitz.open(pdf);pg=doc[0];resolution_details=image_resolutions(r);ppi=[x['ppi']for x in resolution_details]
 assert not imageinfo or ppi,'Raster images were not located in PDF forms/masks'
 assert all(min(v)>299 for v in ppi),ppi
 assert not pg.get_fonts()
 pix=pg.get_pixmap(matrix=fitz.Matrix(150/72,150/72),colorspace=fitz.csCMYK,alpha=False);arr=np.frombuffer(pix.samples,np.uint8).reshape(pix.height,pix.width,4);maxink=float(arr.astype('uint16').sum(2).max())/255*100
 edge=np.concatenate([arr[1,1:-1],arr[-2,1:-1],arr[1:-1,1],arr[1:-1,-2]]);unprinted_edge_pixels=int(np.sum(edge.sum(1)==0))
 assert unprinted_edge_pixels==0,'Uncovered bleed edge'
 report=dict(id=ident,status='structural-pass',native=dict(layers_bottom_to_top=layers,opacity_masks=maskcount,live_gaussian_blur_pt=blur,private_edit_data=True,application_log=(WORK/(ident+'-native.txt')).read_text(),gradient_definitions=native.count(b'%AI5_BeginGradient:'),native_raster_art_objects='See native application log; effect render caches are not flattened art'),pdf=dict(declared_standard=r.metadata.get('/GTS_PDFXVersion'),certified=False,output_intent_registry=str(intent['/RegistryName']),trim_mm=dims,bleed_mm=[v*25.4/72 for v in bleeds],color_spaces=sorted(spaces),blend_modes=sorted(blends),icc_sha256=icc,shadings=shadings,soft_masks=smasks,images=imageinfo,image_resolution_ppi=ppi,image_resolution_details=resolution_details,image_resolution_method="CTM traversal through page forms, soft-mask groups and image alpha masks",fonts=0,overprint_true_objects=overprints,max_total_ink_150ppi_percent=round(maxink,3),unprinted_edge_pixels_at_150ppi=unprinted_edge_pixels,edge_sampling="One pixel inside bleed box; excludes fractional pixmap boundary rounding"),files={x.name:dict(bytes=x.stat().st_size,sha256=sha(x))for x in [ai,pdf,png]},qualification='Structural checks and sampled ink/bleed analysis, not certified PDF/X conformance. FOGRA39 is an assumed condition.')
 reportfile.write_text(json.dumps(report,indent=2));entry['status']='validated';entry['validation']=str(reportfile.relative_to(OUT));(OUT/'inventory.json').write_text(json.dumps(inventory,indent=2))
(OUT/'inventory.json').write_text(json.dumps(inventory,indent=2))
print('Validated',sum(x['status']=='validated'for x in inventory),'/',len(inventory))
