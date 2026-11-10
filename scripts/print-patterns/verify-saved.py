from pathlib import Path
import os
import json,subprocess
ROOT=Path(__file__).resolve().parents[2];WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'))
for stale in ['reopen-all.done','reopen-error.txt']:
 (WORK/stale).unlink(missing_ok=True)
jobs=json.loads((WORK/'jobs.json').read_text());checks=['atomsai-drift-forest-5','atomsai-drift-forest-10','atomsai-drift-iris-40','atomsai-offset-forest-5','atomsai-offset-iris-40','atomsai-single-band-forest-5','atomsai-single-band-iris-40','atomsai-concentric-forest-variant-1','atomsai-concentric-iris-variant-2']
s='var WORK='+json.dumps(str(WORK))+';var JOBS='+json.dumps(jobs)+';var CHECKS='+json.dumps(checks)+';var SCALE=300*72/25.4/800;\n'+(ROOT/'scripts/print-patterns/verify-saved.jsx').read_text().replace('#target illustrator','');p=WORK/'verify-saved-current.jsx';p.write_text(s)
subprocess.run(['osascript','-e','with timeout of 1800 seconds','-e',f'tell application "Adobe Illustrator" to do javascript file "{p}"','-e','end timeout'],check=True)
if not (WORK/'reopen-all.done').exists():raise SystemExit((WORK/'reopen-error.txt').read_text())
print((WORK/'reopen-all.done').read_text())
