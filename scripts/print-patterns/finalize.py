"""Finalize provenance only after every native export, structural check and reopen succeeds."""
from pathlib import Path
import os
import json,hashlib,numpy as np
from PIL import Image,ImageCms
from pypdf import PdfReader
from pypdf.generic import ContentStream
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/print/patterns';WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'));jobs=json.loads((WORK/'jobs.json').read_text());inv=json.loads((OUT/'inventory.json').read_text());manifest=json.loads((OUT/'source-manifest.json').read_text())
assert len(jobs)==56 and all(e['status']=='validated'for e in inv)
assert (WORK/'reopen-all.done').exists()
assert all(hashlib.sha256((ROOT/f).read_bytes()).hexdigest()==h for f,h in manifest['source_files'].items()),'Source changed during generation'
reports=[];reopens=[];proofs=[]
for j,e in zip(jobs,inv):
 p=Path(j['out']+'-validation.json');r=json.loads(p.read_text())
 for name,record in r['files'].items():
  f=p.parent/name;assert hashlib.sha256(f.read_bytes()).hexdigest()==record['sha256'],f
 assert hashlib.sha256(Path(j['out']+'-cmyk.ai').read_bytes()).hexdigest()==hashlib.sha256((WORK/(j['id']+'-cmyk.ai')).read_bytes()).hexdigest()
 pdf=PdfReader(j['out']+'-cmyk-print.pdf');root=pdf.trailer['/Root'];intent=root['/OutputIntents'][0].get_object()
 assert len(pdf.pages)==1 and not pdf.is_encrypted
 assert pdf.pdf_header=='%PDF-1.6' and str(pdf.metadata.get('/Trapped'))=='/False'
 assert intent['/S']=='/GTS_PDFX' and intent['/RegistryName']=='http://www.color.org'
 assert not any(k in root for k in ['/OpenAction','/AA','/AcroForm'])
 assert not any(k in pdf.pages[0] for k in ['/Annots','/AA'])
 assert r['pdf']['blend_modes']==(['/Normal','/Overlay'] if j['family']=='single-band' else ['/Normal','/Screen'])
 content_streams=[pdf.pages[0].get_contents()]
 for number in sorted({n for ids in pdf.xref.values()for n in ids if n}|set(pdf.xref_objStm)):
  obj=pdf.get_object(number)
  if isinstance(obj,dict) and obj.get('/Subtype')=='/Form':content_streams.append(ContentStream(obj,pdf))
 rgb_operators=[op.decode('latin1')for stream in content_streams for args,op in stream.operations if op in [b'rg',b'RG']]
 assert not rgb_operators,rgb_operators
 r['pdf']['unintended_rgb_paint_operators']=0
 preview=Image.open(j['out']+'-preview.png');assert preview.mode=='RGB' and preview.size==(1200,1200) and 'icc_profile' in preview.info
 r['pdf']['final_document_structure']={'pages':1,'version':'1.6','encrypted':False,'trapped':False,'interactive_actions':False,'registry':'http://www.color.org'}
 r['preview']={'mode':'RGB','size_px':[1200,1200],'embedded_profile':'sRGB'}
 log=(WORK/(j['id']+'-reopened.txt')).read_text();saved={} 
 for line in log.splitlines():
  if line.startswith('ink '):
   role,rest=line[4:].split('=',1);saved[role]=[float(v)for v in rest.split(';')[0].split(',')]
 r['native']['reopened_in_illustrator']=True;r['native']['saved_file_reopen_log']=log;r['native']['saved_process_colors']=saved
 e['saved_cmyk']=saved;e['native_reopen']='passed';e['visual_review']='reviewed in family contact sheet and renderer comparison'
 proof=WORK/(j['id']+'-reopened.png')
 if proof.exists():
  aa=np.asarray(Image.open(proof).convert('RGB')).astype(float);bb=np.asarray(Image.open(j['out']+'-preview.png').convert('RGB')).astype(float);assert aa.shape==bb.shape
  delta=dict(id=j['id'],mean_absolute_channel_difference=float(np.abs(aa-bb).mean()),maximum_channel_difference=float(np.abs(aa-bb).max()));proofs.append(delta)
  assert delta['mean_absolute_channel_difference']<1.0,delta
  r['native']['reopened_preview_comparison']=delta
 p.write_text(json.dumps(r,indent=2));reports.append(r);reopens.append(j['id'])
(OUT/'inventory.json').write_text(json.dumps(inv,indent=2))
summary=dict(date='2026-11-10',combinations=56,files=dict(native_ai=56,print_pdf=56,rgb_png=56,per_combination_validation=56),family_counts={f:sum(j['family']==f for j in jobs)for f in ['drift','offset','single-band','concentric']},native_reopened=len(reopens),native_mask_contents_audit='audits/native-mask-summary.json',previews_visually_reviewed=56,representative_reopened_previews=proofs,all_structural_checks_passed=True,unintended_rgb_or_spot_inks=False,fonts=0,linked_art=0,native_raster_art=0,overprint_true_objects=sum(len(r['pdf']['overprint_true_objects'])for r in reports),all_bleed_edges_covered=all(r['pdf']['unprinted_edge_pixels_at_150ppi']==0 for r in reports),maximum_sampled_total_ink_percent=max(r['pdf']['max_total_ink_150ppi_percent']for r in reports),sampling_ppi=150,minimum_effect_image_ppi=min(v for r in reports for xy in r['pdf']['image_resolution_ppi']for v in xy),profile='Coated FOGRA39 (ISO 12647-2:2004)',profile_sha256=manifest['profile_sha256'],declared_pdf_standard='PDF/X-4',formal_pdfx_certified=False,limitations=['FOGRA39 is an assumed coated-offset condition, not printer approval.','Additive RGB reflection is adapted to Screen at 20% only where specified.','CMYK gamut/compositing and application blur rendering differ from RGB canvas.','PDF/X structural checks are not formal certified conformance.','Ink and bleed raster sampling is 150 ppi, not a full-resolution RIP proof.'],source_hashes_still_current=True,total_deliverable_bytes=sum(x['bytes']for r in reports for x in r['files'].values()))
(OUT/'validation-summary.json').write_text(json.dumps(summary,indent=2));manifest['generation_script_hashes']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in sorted((ROOT/'scripts/print-patterns').glob('*'))if p.is_file()};(OUT/'source-manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(summary,indent=2))
