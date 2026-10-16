"""Compose the master logotype from Figma's clean Symbol and Wordmark exports.

Usage:
  python3 -I compose_logos.py SYMBOL.svg WORDMARK.svg OUT_DIR --wordmark-at X Y [--mark MARK.svg]

SYMBOL/WORDMARK are the per-group `svgAssets` from `download_assets` on the "Logotype" component
(1330:27629). X Y is the wordmark's offset inside the lockup (280 20). Writes logotype.svg (and mark.svg
when --mark is given) with fill="currentColor".
"""
import argparse, pathlib, re

def paths(svg_text):
    res = []
    for m in re.finditer(r'<path\b([^>]*)/?>', svg_text):
        attrs = m.group(1)
        d = re.search(r'\bd="([^"]+)"', attrs).group(1)
        rule = re.search(r'fill-rule="([^"]+)"', attrs)
        res.append((d, rule.group(1) if rule else None))
    return res

def size(svg_text):
    w, h = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg_text).groups()
    return float(w), float(h)

def path_el(d, rule):
    r = f' fill-rule="{rule}" clip-rule="{rule}"' if rule else ''
    return f'<path d="{d}"{r}/>'

fmt = lambda n: ('%.3f' % n).rstrip('0').rstrip('.')

ap = argparse.ArgumentParser()
ap.add_argument('symbol'); ap.add_argument('wordmark'); ap.add_argument('out')
ap.add_argument('--wordmark-at', nargs=2, type=float, required=True)
ap.add_argument('--mark')
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)

sym_text = pathlib.Path(a.symbol).read_text()
wm_text = pathlib.Path(a.wordmark).read_text()
sym, wm = paths(sym_text), paths(wm_text)
sw, sh = size(sym_text)
ww, wh = size(wm_text)
x, y = a.wordmark_at
W, H = max(sw, x + ww), max(sh, y + wh)

logo = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(W)}" height="{fmt(H)}" viewBox="0 0 {fmt(W)} {fmt(H)}" fill="currentColor">'
        + ''.join(path_el(*p) for p in sym)
        + f'<g transform="translate({fmt(x)} {fmt(y)})">' + ''.join(path_el(*p) for p in wm) + '</g></svg>\n')
(out / 'logotype.svg').write_text(logo)
print('logotype.svg', fmt(W), 'x', fmt(H), len(wm), 'letters')

if a.mark:
    m_text = pathlib.Path(a.mark).read_text()
    mw, mh = size(m_text)
    mark = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(mw)}" height="{fmt(mh)}" viewBox="0 0 {fmt(mw)} {fmt(mh)}" fill="currentColor">'
            + ''.join(path_el(*p) for p in paths(m_text)) + '</svg>\n')
    (out / 'mark.svg').write_text(mark)
    print('mark.svg', fmt(mw), 'x', fmt(mh))
