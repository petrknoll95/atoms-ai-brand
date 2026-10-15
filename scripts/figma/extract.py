"""Cut a clean, standalone SVG out of a Figma REST/MCP node export.

The export wraps content in its ancestors (and an overlapping section's background),
all in the exported node's coordinate space. We pick the target subtree by layer-name path,
keep only the defs it references, strip Figma's styling noise and set a viewBox.
"""
import argparse, copy, re, sys
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
q = lambda t: f'{{{NS}}}{t}'

def norm(s):
    if s is None: return None
    try:
        s = s.encode('latin-1').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return s.strip()

def find(el, names):
    if not names: return el
    for d in el.iter():
        if d is not el and norm(d.get('id')) == names[0]:
            r = find(d, names[1:])
            if r is not None: return r
    return None

COLORS = {'white': '#ffffff', 'black': '#000000'}
def canon(v):
    v = (v or '').strip().lower()
    return COLORS.get(v, v)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--path', required=True, help='layer names separated by >')
    ap.add_argument('--bbox', nargs=4, type=float, help='x y w h in exported-node space (default: root size)')
    ap.add_argument('--drop-bg', action='store_true', help='drop the target frame background rect')
    ap.add_argument('--map', action='append', default=[], help='color mapping old=new for fill/stroke')
    ap.add_argument('--keep-latest', action='store_true')
    ap.add_argument('--drop', action='append', default=[], help='layer names to remove from the target')
    a = ap.parse_args()

    root = ET.parse(a.src).getroot()
    latest = find(root, ['Latest']) if not a.keep_latest else root
    target = find(latest if latest is not None else root, [p.strip() for p in a.path.split('>')])
    if target is None:
        sys.exit(f'not found: {a.path}')
    target = copy.deepcopy(target)

    W, H = float(root.get('width')), float(root.get('height'))
    x, y, w, h = a.bbox if a.bbox else (0, 0, W, H)

    for name in a.drop:
        for parent in list(target.iter()):
            for child in list(parent):
                if norm(child.get('id')) == name:
                    parent.remove(child)

    if a.drop_bg:
        first = next(iter(target), None)
        if first is not None and first.tag == q('rect') and first.get('fill') not in (None, 'none'):
            target.remove(first)

    mapping = {canon(k): v for k, v in (m.split('=', 1) for m in a.map)}
    refs = set()
    for el in target.iter():
        el.attrib.pop('style', None)
        if el.get('id') is not None:
            del el.attrib['id']
        for attr in ('fill', 'stroke'):
            v = el.get(attr)
            if v is not None and canon(v) in mapping:
                el.set(attr, mapping[canon(v)])
        for v in list(el.attrib.values()):
            refs.update(re.findall(r'url\(#([^)]+)\)', v))

    defs_out = ET.Element(q('defs'))
    all_defs = {d.get('id'): d for defs in root.iter(q('defs')) for d in defs}
    pending = list(refs); seen = set()
    while pending:
        rid = pending.pop()
        if rid in seen or rid not in all_defs: continue
        seen.add(rid)
        d = copy.deepcopy(all_defs[rid])
        for el in d.iter():
            el.attrib.pop('style', None)
            for attr in ('fill', 'stroke', 'stop-color'):
                v = el.get(attr)
                if v is not None and canon(v) in mapping:
                    el.set(attr, mapping[canon(v)])
            for v in el.attrib.values():
                pending += re.findall(r'url\(#([^)]+)\)', v)
        defs_out.append(d)

    fmt = lambda n: ('%.3f' % n).rstrip('0').rstrip('.')
    svg = ET.Element(q('svg'), {
        'width': fmt(w), 'height': fmt(h), 'viewBox': f'{fmt(x)} {fmt(y)} {fmt(w)} {fmt(h)}', 'fill': 'none'})
    if len(defs_out): svg.append(defs_out)
    svg.append(target)
    text = ET.tostring(svg, encoding='unicode')
    # Namespace ids so several inlined diagrams can share a page without clip-path collisions.
    slug = a.out.rsplit('/', 1)[-1].rsplit('.', 1)[0]
    for i in set(re.findall(r'id="([^"]+)"', text)):
        text = text.replace(f'id="{i}"', f'id="{slug}-{i}"').replace(f'url(#{i})', f'url(#{slug}-{i})')
    open(a.out, 'w').write(text + '\n')
    print(f'{a.out}: {len(text)} bytes')

main()
