#target illustrator
// Run through run.py. Paths and selected jobs are injected into a temporary wrapper.
(function(){
 var prior=app.userInteractionLevel;app.userInteractionLevel=UserInteractionLevel.DONTDISPLAYALERTS;
 function log(s){var f=new File(WORK+'/build.log');f.open('a');f.writeln(new Date()+' '+s);f.close();}
 function write(path,s){var f=new File(path);f.open('w');f.write(s);f.close();}
 function col(v){var c=new CMYKColor();c.cyan=v[0];c.magenta=v[1];c.yellow=v[2];c.black=v[3];return c;}
 function paint(items,palette){for(var i=0;i<items.length;i++){var x=items[i];if(x.typename==='GroupItem')paint(x.pageItems,palette);else if(x.typename==='PathItem'&&x.name.indexOf('ink ')===0){x.fillColor=col(palette[x.name.substring(4)]);x.fillOverprint=false;x.strokeOverprint=false;}}}
 function neutralMask(items){for(var i=0;i<items.length;i++){var x=items[i];if(x.typename==='GroupItem')neutralMask(x.pageItems);else if(x.typename==='CompoundPathItem')neutralMask(x.pathItems);else if(x.typename==='PathItem'&&x.filled){var c=x.fillColor;if(c.typename==='GradientColor'){var st=c.gradient.gradientStops;for(var t=0;t<st.length;t++){var w=new GrayColor();w.gray=0;st[t].color=w;}}else{var b=new GrayColor();b.gray=100;x.fillColor=b;}}}}
 function configure(d,outer,node){
  var inner=outer.groupItems.length?outer.groupItems[0]:null;
  if(node.children){for(var j=0;j<node.children.length;j++){var ch=node.children[j];configure(d,d.groupItems.getByName(ch.role),ch);}}
  if(node.mask || (FAMILY==='concentric' && node.role!=='reflection')){
   var mask=d.groupItems.getByName('source mask '+(node.role||'fields'));
   neutralMask(mask.pageItems);var scratch=d.layers.getByName('temporary');inner.move(scratch,ElementPlacement.PLACEATEND);mask.move(scratch,ElementPlacement.PLACEATBEGINNING);
   if(node.mask&&node.mask.blur)mask.applyEffect('<LiveEffect name="Adobe PSL Gaussian Blur"><Dict data="R blur '+(node.mask.blur*SCALE)+'"/></LiveEffect>');
   d.selection=null;mask.selected=true;inner.selected=true;app.doScript('Make','AtomsAIMasks',false);if(d.selection.length!==1)throw Error('Make mask failed');d.selection[0].move(outer,ElementPlacement.PLACEATBEGINNING);d.selection=null;
  }
  outer.opacity=100*((node.mask&&node.mask.opacity)||1)*((node.mask&&node.mask.slitOpacity)||node.uniform||1);
  if(node.blend==='lighter'){outer.blendingMode=BlendModes.SCREEN;}else if(node.blend==='overlay'){outer.blendingMode=BlendModes.OVERLAY;}else if(node.blend==='hard-light'){outer.blendingMode=BlendModes.HARDLIGHT;}else{outer.blendingMode=BlendModes.NORMAL;}
  outer.name=(node.role||'fields')+((node.mask||(FAMILY==='concentric'&&node.role!=='reflection'))?' / editable native mask':' / uniform fill');
 }
 try{
  try{app.unloadAction('AtomsAIMasks','');}catch(ignore){}
  app.loadAction(new File(WORK+'/masks.aia'));
  for(var z=0;z<JOBS.length;z++){
   var j=JOBS[z],d=null,src=null;var FAMILY=j.family;log('START '+j.id);
   try{
    src=app.open(new File(j.svg));
    // The existing pilot supplies a document-local embedded FOGRA39 profile, not geometry.
    d=app.open(new File(WORK+'/profile-template.ai'));
    if(d.colorProfileName!==PROFILE)throw Error('Wrong template profile');
    var empty=d.layers.add();empty.name='temporary';
    for(var li=d.layers.length-1;li>=0;li--)if(d.layers[li]!==empty){d.layers[li].locked=false;d.layers[li].remove();}
    var roles=['base'];for(var ni=0;ni<j.nodes.length;ni++)roles.push(j.nodes[ni].role||'fields');
    for(var i=0;i<roles.length;i++){
     var role=roles[i],lay=d.layers.add();lay.name=('0'+(i+1)).slice(-2)+' / '+(role==='fields'?'Fields':role.charAt(0).toUpperCase()+role.slice(1));
     var imported=src.groupItems.getByName(role);var cp=imported.duplicate(lay,ElementPlacement.PLACEATBEGINNING);cp.position=imported.position;
    }
    for(var mg=0;mg<src.groupItems.length;mg++){var sm=src.groupItems[mg];if(sm.name.indexOf('source mask ')===0){var cm=sm.duplicate(empty,ElementPlacement.PLACEATBEGINNING);cm.position=sm.position;}}
    src.close(SaveOptions.DONOTSAVECHANGES);src=null;d.activate();
    paint(d.pageItems,j.cmyk);
    for(var ni=0;ni<j.nodes.length;ni++){var nd=j.nodes[ni];configure(d,d.groupItems.getByName(nd.role||'fields'),nd);}
    empty.remove();
    d.artboards[0].artboardRect=[20*SCALE,820*SCALE,820*SCALE,20*SCALE];
    d.artboards[0].name='AtomsAI / '+j.family+' / '+j.colorway+' / '+(j.slits?j.slits+' slits':'variant '+j.density)+' / 300 mm';
    var rs=d.rasterEffectSettings;rs.resolution=300;rs.transparency=true;d.rasterEffectSettings=rs;
    d.selection=null;
    var bounds=d.layers.getByName('01 / Base').groupItems[0].geometricBounds;log('FIELD '+j.id+' '+bounds);if(Math.abs(bounds[0])>0.001||Math.abs(bounds[1]-840*SCALE)>0.001)throw Error('Field alignment failed');
    var ai=new IllustratorSaveOptions();ai.pdfCompatible=true;ai.embedICCProfile=true;ai.compressed=true;
    d.saveAs(new File(WORK+'/'+j.id+'-cmyk.ai'),ai);log('AI '+j.id);
    var pdf=new PDFSaveOptions();pdf.pDFPreset='[PDF/X-4:2008]';pdf.preserveEditability=false;pdf.bleedOffsetRect=[9,9,9,9];pdf.colorConversionID=ColorConversion.COLORCONVERSIONREPURPOSE;pdf.colorDestinationID=ColorDestination.COLORDESTINATIONDOCCMYK;pdf.colorProfileID=ColorProfile.INCLUDEDESTPROFILE;pdf.outputIntentProfile=PROFILE;pdf.outputConditionID='FOGRA39';pdf.outputCondition='Assumed coated offset ISO 12647-2:2004';pdf.registryName='http://www.color.org';pdf.artboardRange='1';pdf.trimMarks=false;pdf.registrationMarks=false;pdf.colorBars=false;pdf.pageInformation=false;
    d.saveAs(new File(WORK+'/'+j.id+'-raw.pdf'),pdf);log('PDF '+j.id);
    var png=new ExportOptionsPNG24();png.artBoardClipping=true;png.horizontalScale=1200.5/(800*SCALE)*100;png.verticalScale=png.horizontalScale;png.transparency=false;
    d.exportFile(new File(WORK+'/'+j.id+'-preview'),ExportType.PNG24,png);
    write(WORK+'/'+j.id+'-native.txt','application='+app.version+'\nprofile='+d.colorProfileName+'\nspace='+d.documentColorSpace+'\nppi='+d.rasterEffectSettings.resolution+'\nlayers='+d.layers.length+'\nrasterItems='+d.rasterItems.length+'\nplacedItems='+d.placedItems.length+'\ntextFrames='+d.textFrames.length+'\n');
    d.close(SaveOptions.DONOTSAVECHANGES);d=null;write(WORK+'/'+j.id+'.done','native export complete');log('DONE '+j.id);
   }catch(e){log('ERROR '+j.id+' '+e+' line '+e.line);if(src)src.close(SaveOptions.DONOTSAVECHANGES);if(d)d.close(SaveOptions.DONOTSAVECHANGES);throw e;}
  }
 }catch(e){log('STOP '+e+' line '+e.line);}finally{try{app.unloadAction('AtomsAIMasks','');}catch(ignore){}app.userInteractionLevel=prior;}
})();
