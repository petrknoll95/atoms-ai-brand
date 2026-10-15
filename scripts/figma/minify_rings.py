"""Minify Figma's concentric mask SVGs into transparent white-gradient masks."""
import re, sys, pathlib
import xml.etree.ElementTree as ET
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
q = lambda t: f'{{{NS}}}{t}'
NUM = re.compile(r'-?\d*\.?\d+(?:e-?\d+)?')
def rnd(s, d=3):
    def f(m):
        v = float(m.group())
        out = f'{v:.{d}f}'.rstrip('0').rstrip('.')
        return '0' if out in ('-0', '') else out
    return NUM.sub(f, s)

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
root = ET.parse(src).getroot()
svg = ET.Element(q('svg'), {'viewBox': '0 0 840 840', 'width': '840', 'height': '840'})
defs = ET.SubElement(svg, q('defs'))
shapes = ET.SubElement(svg, q('g'))
for el in root.iter():
    tag = el.tag.split('}')[1]
    if tag in ('circle', 'path') and 'url(#paint' in (el.get('fill') or ''):
        attrs = {'fill': el.get('fill')}
        for a in ('cx', 'cy', 'r', 'd'):
            if el.get(a) is not None: attrs[a] = rnd(el.get(a))
        if el.get('fill-rule'): attrs['fill-rule'] = el.get('fill-rule')
        ET.SubElement(shapes, q(tag), attrs)
    elif tag == 'radialGradient':
        g = ET.SubElement(defs, q('radialGradient'), {
            'id': el.get('id'), 'cx': '0', 'cy': '0', 'r': '1', 'gradientUnits': 'userSpaceOnUse',
            'gradientTransform': rnd(el.get('gradientTransform'))})
        for s in el:
            if s.tag.split('}')[1] != 'stop': continue
            sa = {'offset': rnd(s.get('offset') or '0', 4), 'stop-color': '#fff'}
            op = s.get('stop-opacity')
            if op is not None and float(op) < 1: sa['stop-opacity'] = rnd(op, 3)
            ET.SubElement(g, q('stop'), sa)
text = ET.tostring(svg, encoding='unicode')
# shorten paint ids
text = re.sub(r'paint(\d+)_radial_\d+_\d+', r'g\1', text)
out.write_text(text + '\n')
print(out.name, len(text), 'shapes', len(shapes), 'grads', len(defs))
