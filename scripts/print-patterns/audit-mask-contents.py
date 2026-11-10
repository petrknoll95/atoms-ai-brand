from pathlib import Path
import json,subprocess,os
ROOT=Path(__file__).resolve().parents[2];WORK=Path(os.environ.get('PATTERN_WORK','/tmp/atomsai-pattern-production'));OUT=ROOT/'assets/print/patterns/audits';OUT.mkdir(exist_ok=True)
cases=[
('original-pilot-lower','/Users/petrknoll/Documents/ChatGPT/AtomsAI/output/drift-print/assets/print/patterns/drift/atomsai-drift-forest-10-cmyk.ai','02 / Lower',None),
('drift-40-lower',str(WORK/'atomsai-drift-iris-40-cmyk.ai'),'02 / Lower',None),
('offset-40-upper',str(WORK/'atomsai-offset-iris-40-cmyk.ai'),'02 / Upper',None),
('single-band-40-field1',str(WORK/'atomsai-single-band-forest-40-cmyk.ai'),None,'field1 / editable native mask'),
('concentric-variant-2-upper',str(WORK/'atomsai-concentric-iris-variant-2-cmyk.ai'),'02 / Upper',None)]
inspector=(ROOT/'scripts/print-patterns/inspect-mask.jsx').read_text().replace('#target illustrator','')
for ident,file,layer,group in cases:
 output=str(WORK/(ident+'-mask-inspection.txt'))
 script="var prior=app.userInteractionLevel;app.userInteractionLevel=UserInteractionLevel.DONTDISPLAYALERTS;var d=app.open(new File("+json.dumps(file)+"));try{try{app.unloadAction('AtomsAIMasks','');}catch(ignore){}app.loadAction(new File("+json.dumps(str(WORK/'masks.aia'))+"));d.selection=null;var g="+("d.groupItems.getByName("+json.dumps(group)+")" if group else "d.layers.getByName("+json.dumps(layer)+").groupItems[0]")+".groupItems[0];var l=d.layers.add();l.name='Temporary native mask audit';g.move(l,ElementPlacement.PLACEATBEGINNING);d.selection=[g];app.doScript('Release','AtomsAIMasks',false);if(d.selection.length!==2)throw Error('Mask did not release');var OUTPUT="+json.dumps(output)+";\n"+inspector+"\nd.close(SaveOptions.DONOTSAVECHANGES);}finally{app.userInteractionLevel=prior;}"
 p=WORK/'audit-mask-current.jsx';p.write_text(script);print('Inspecting',ident,flush=True)
 subprocess.run(['osascript','-e','with timeout of 120 seconds','-e',f'tell application "Adobe Illustrator" to do javascript file "{p}"','-e','end timeout'],check=True)
 text=Path(output).read_text();(OUT/(ident+'.txt')).write_text(text);print('\n'.join(text.splitlines()[:6]),flush=True)
# The parent-mask log is produced separately with inspect-mask.jsx after targeting Fields.
