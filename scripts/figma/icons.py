import re, sys, pathlib
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
NUM = re.compile(r'-?\d*\.?\d+(?:e-?\d+)?')
def fmt(v):
    s = f'{v:.3f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s
def scale(text, k=1/3):
    return NUM.sub(lambda m: fmt(float(m.group()) * k), text)
names = []
for f in sorted(src.glob('icon*.svg')):
    t = f.read_text()
    name = re.search(r'<g id="Icon / ([^"]+)"', t).group(1)
    els = []
    for m in re.finditer(r'<(path|circle|line|rect)\b([^>]*)/>', t):
        tag, attrs = m.group(1), m.group(2)
        keep = []
        for a in ('d', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'x', 'y', 'width', 'height'):
            v = re.search(rf'(?:^|\s){a}="([^"]+)"', attrs)
            if v: keep.append(f'{a}="{scale(v.group(1))}"')
        sw = re.search(r'stroke-width="([^"]+)"', attrs)
        assert sw and float(sw.group(1)) == 4.5, (name, sw)
        els.append(f'<{tag} {" ".join(keep)}/>')
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
           'stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="butt">'
           + ''.join(els) + '</svg>\n')
    (out / f'{name}.svg').write_text(svg)
    names.append(name)
print(sorted(names))
