#target illustrator
// Repair the ExtendScript nested-ternary enumeration bug in a previously generated master.
(function(){var prior=app.userInteractionLevel;app.userInteractionLevel=UserInteractionLevel.DONTDISPLAYALERTS;
function log(s){}function write(path,s){var f=new File(path);f.open('w');f.write(s);f.close();}
try{var j=JOBS[0];var d=app.open(new File(WORK+'/'+j.id+'-cmyk.ai'));
for(var ni=0;ni<j.nodes.length;ni++){var nd=j.nodes[ni],outer=d.layers[d.layers.length-2-ni].groupItems[0];
if(nd.blend==='lighter'){outer.blendingMode=BlendModes.SCREEN;}else if(nd.blend==='overlay'){outer.blendingMode=BlendModes.OVERLAY;}else if(nd.blend==='hard-light'){outer.blendingMode=BlendModes.HARDLIGHT;}else{outer.blendingMode=BlendModes.NORMAL;}if(j.family==='concentric'&&nd.role==='reflection')outer.name='reflection / uniform fill';}
    var ai=new IllustratorSaveOptions();ai.pdfCompatible=true;ai.embedICCProfile=true;ai.compressed=true;
    d.saveAs(new File(WORK+'/'+j.id+'-cmyk.ai'),ai);log('AI '+j.id);
    var pdf=new PDFSaveOptions();pdf.pDFPreset='[PDF/X-4:2008]';pdf.preserveEditability=false;pdf.bleedOffsetRect=[9,9,9,9];pdf.colorConversionID=ColorConversion.COLORCONVERSIONREPURPOSE;pdf.colorDestinationID=ColorDestination.COLORDESTINATIONDOCCMYK;pdf.colorProfileID=ColorProfile.INCLUDEDESTPROFILE;pdf.outputIntentProfile=PROFILE;pdf.outputConditionID='FOGRA39';pdf.outputCondition='Assumed coated offset ISO 12647-2:2004';pdf.registryName='http://www.color.org';pdf.artboardRange='1';pdf.trimMarks=false;pdf.registrationMarks=false;pdf.colorBars=false;pdf.pageInformation=false;
    d.saveAs(new File(WORK+'/'+j.id+'-raw.pdf'),pdf);log('PDF '+j.id);
    var png=new ExportOptionsPNG24();png.artBoardClipping=true;png.horizontalScale=1200.5/(800*SCALE)*100;png.verticalScale=png.horizontalScale;png.transparency=false;
    d.exportFile(new File(WORK+'/'+j.id+'-preview'),ExportType.PNG24,png);
    write(WORK+'/'+j.id+'-native.txt','application='+app.version+'\nprofile='+d.colorProfileName+'\nspace='+d.documentColorSpace+'\nppi='+d.rasterEffectSettings.resolution+'\nlayers='+d.layers.length+'\nrasterItems='+d.rasterItems.length+'\nplacedItems='+d.placedItems.length+'\ntextFrames='+d.textFrames.length+'\n');

d.close(SaveOptions.DONOTSAVECHANGES);write(WORK+'/'+j.id+'-blend-repaired.done','Native blend assignments corrected and re-exported.');
}catch(e){write(WORK+'/blend-repair-error.txt',e+' line '+e.line);}finally{app.userInteractionLevel=prior;}})();
