#target illustrator
// Read selected native opacity-mask artwork after entering its thumbnail in Transparency.
// Wrapper supplies OUTPUT; this inspector never changes the artwork.
(function(){var rows=[],counts={groups:0,paths:0,compoundPaths:0,clippingPaths:0,gradientPaths:0},seen={};
function walk(x){
 if(x.typename==='GroupItem'){counts.groups++;rows.push('group='+x.name+'; clipped='+x.clipped);for(var i=0;i<x.pageItems.length;i++)walk(x.pageItems[i]);}
 else if(x.typename==='CompoundPathItem'){counts.compoundPaths++;for(var i=0;i<x.pathItems.length;i++)walk(x.pathItems[i]);}
 else if(x.typename==='PathItem'){counts.paths++;if(x.clipping)counts.clippingPaths++;if(x.filled&&x.fillColor.typename==='GradientColor'){counts.gradientPaths++;var c=x.fillColor,g=c.gradient;if(!seen[g.name]){seen[g.name]=true;rows.push('gradient='+g.name+'; stops='+g.gradientStops.length+'; origin='+c.origin+'; angle='+c.angle+'; length='+c.length);for(var n=0;n<g.gradientStops.length;n++){var st=g.gradientStops[n];rows.push('stop='+st.rampPoint+'; opacity='+st.opacity+'; color='+st.color.typename+(st.color.typename==='GrayColor'?' '+st.color.gray:''));}}}}
}
var d=app.activeDocument;rows.push('document='+d.name+'; selection='+d.selection.length);for(var i=0;i<d.selection.length;i++)walk(d.selection[i]);for(var k in counts)rows.unshift(k+'='+counts[k]);var f=new File(OUTPUT);f.open('w');f.write(rows.join('\n'));f.close();return rows.slice(0,8).join('\n');})();
