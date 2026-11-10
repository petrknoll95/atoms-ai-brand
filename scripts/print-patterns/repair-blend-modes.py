from pathlib import Path
import os
import argparse,json,subprocess
ROOT=Path(__file__).resolve().parents[2];WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'));OUT=ROOT/'assets/print/patterns'
p=argparse.ArgumentParser();p.add_argument('--only');a=p.parse_args();jobs=json.loads((WORK/'jobs.json').read_text());inv=json.loads((OUT/'inventory.json').read_text())
for j,e in zip(jobs,inv):
 if a.only and j['id']!=a.only:continue
 if (WORK/(j['id']+'-blend-repaired.done')).exists():continue
 e['status']='pending-blend-audit';(OUT/'inventory.json').write_text(json.dumps(inv,indent=2))
 for key in ['native_reopen','visual_review']:e.pop(key,None)
 p=Path(j['out']+'-validation.json')
 if p.exists():p.unlink()
 wrapper='var WORK='+json.dumps(str(WORK))+';var PROFILE="Coated FOGRA39 (ISO 12647-2:2004)";var SCALE=300*72/25.4/800;var JOBS='+json.dumps([j])+';\n'+(ROOT/'scripts/print-patterns/repair-blend-modes.jsx').read_text().replace('#target illustrator','')
 script=WORK/'repair-current.jsx';script.write_text(wrapper);print('Correcting',j['id'],flush=True)
 subprocess.run(['osascript','-e','with timeout of 1800 seconds','-e',f'tell application "Adobe Illustrator" to do javascript file "{script}"','-e','end timeout'],check=True)
 if not (WORK/(j['id']+'-blend-repaired.done')).exists():raise SystemExit((WORK/'blend-repair-error.txt').read_text())
 subprocess.run(['python3',str(ROOT/'scripts/print-patterns/validate.py')],cwd=ROOT,check=True)
 inv=json.loads((OUT/'inventory.json').read_text())
print('Blend repair complete',flush=True)
