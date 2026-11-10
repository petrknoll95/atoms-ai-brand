"""Run selected/resumable native Illustrator jobs without touching existing user documents."""
from pathlib import Path
import os
import argparse,json,subprocess,shutil
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,default=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production')));p.add_argument('--only');p.add_argument('--template',type=Path,default=Path('/Users/petrknoll/Documents/ChatGPT/AtomsAI/output/drift-print/assets/print/patterns/drift/atomsai-drift-forest-10-cmyk.ai'));a=p.parse_args()
jobs=json.loads((a.work/'jobs.json').read_text());jobs=[j for j in jobs if (not a.only or j['id'] in a.only.split(',')) and not (a.work/(j['id']+'.done')).exists()]
shutil.copy2(ROOT/'scripts/print-patterns/masks.aia',a.work/'masks.aia');shutil.copy2(a.template,a.work/'profile-template.ai')
for j in jobs:
 # Run one document per call so native memory is released and progress survives interruption.
 wrapper='var WORK='+json.dumps(str(a.work))+';var PROFILE="Coated FOGRA39 (ISO 12647-2:2004)";var SCALE=300*72/25.4/800;var JOBS='+json.dumps([j])+';\n'+(ROOT/'scripts/print-patterns/build.jsx').read_text().replace('#target illustrator','')
 script=a.work/'run-current.jsx';script.write_text(wrapper)
 print('Generating',j['id'],flush=True)
 subprocess.run(['osascript','-e','with timeout of 1800 seconds','-e',f'tell application "Adobe Illustrator" to do javascript file "{script}"','-e','end timeout'],check=True)
 if not (a.work/(j['id']+'.done')).exists():raise SystemExit('Native generation failed; see build.log')
 subprocess.run(['python3',str(ROOT/'scripts/print-patterns/validate.py'),'--work',str(a.work)],cwd=ROOT,check=True)
print('Selected jobs complete',flush=True)
