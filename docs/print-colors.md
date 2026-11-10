# Print color references

The digital palette in `src/data/colors.ts` is unchanged. The print data separates spot references from process separations; neither is a physical press approval.

## Spot references

`src/data/pantone-matches.json` retains the existing coated choices. Forest shade now uses **5535 C**, a dark green screen-reference candidate (#183028 versus the digital #10231E). Each coated reference has a same-number **U** counterpart, checked against the existing reference dataset. This is an ink-family reference, not a search for an identical appearance on uncoated stock. All references require a physical drawdown or proof on the intended stock.

The original third-party screen dataset and its C/U SHA-256 checksums are recorded in the JSON. It is not authoritative colorimetric data. [Pantone explains the effect of coated and uncoated paper](https://support.pantone.com/en/what-does-the-terms-coated-and-uncoated-mean-in-the-pantone-graphics-system). Do not infer an uncoated screen HEX or change a brand token from these references.

Cream, Paper and White use paper stock rather than a spot ink. Their process values describe simulation on reference white, not extra ink on an already matching substrate. Existing coated references can share an ink number (for example Deep green and Charcoal); they do not reproduce every digital distinction.

## Process separations

`src/data/cmyk-values.json` contains all 26 colors for both output conditions:

- [PSO Coated v3 / FOGRA51](https://registry.color.org/profile-registry/PSOcoated_v3): premium coated offset stock.
- [PSO Uncoated v3 / FOGRA52](https://registry.color.org/profile-registry/PSOuncoated_v3_FOGRA52): wood-free uncoated offset stock.

These are explicit reference conditions. A printer requiring a different profile should convert the RGB originals for that condition, not reinterpret these percentages. Profiles do not guarantee that bright accents or dark greens fit a press's gamut.

Conversion settings: LittleCMS 2.17 through Pillow 12.1.0; built-in sRGB IEC61966-2.1 source profile; relative colorimetric intent with black-point compensation; 8-bit CMYK output, rounded half up to whole percentages. The output profile filenames and SHA-256 hashes are recorded with the data. No mathematical RGB-to-CMYK fallback or unprofiled Cream override remains.

The converted Black is intended for color areas. Use 0/0/0/100 for small black text and fine rules. True-grey conversions contain CMY and are not single-ink tints.

## Reproduce

Use Python with `Pillow==12.1.0` and LittleCMS 2.17, plus the repository's supported Node version. The generator checks both engine versions and exact profile bytes. Profiles are fetched from the ICC registry into a local cache, not redistributed in the site or repository.

```sh
mkdir -p /tmp/atomsai-print
curl -fLsS https://registry.color.org/profile-registry/profiles/PSOcoated_v3.icc -o /tmp/atomsai-print/PSOcoated_v3.icc
curl -fLsS https://registry.color.org/profile-registry/profiles/PSOuncoated_v3_FOGRA52.icc -o /tmp/atomsai-print/PSOuncoated_v3_FOGRA52.icc
python3 scripts/generate-print-colors.py --profiles /tmp/atomsai-print
python3 scripts/generate-print-colors.py --profiles /tmp/atomsai-print --check
```

After a palette change, regenerate CMYK and review both spot references. Update the print table in `skills/atomsai-brand/SKILL.md`, then run `npm run check`, `npm run build` and `npm run check:skills`. The site build fails on missing, stale or invalid print entries. Skill checks cover both finishes and the downloadable data.

## Delivery

The Color page keeps the existing numbered sections, typography, swatch popovers, quiet buttons and ruled table. The print table puts coated and uncoated references side by side, with their CMYK profiles identified in the headers. Every copied CMYK value includes its profile and conversion settings. Copy menus and role specifications use the same shared print data.

`/assets/brand/print-colors.json` provides both finishes and conversion provenance. `/assets/brand/manifest.json` keeps its original coated match fields and adds `stock`, `cmykProfile` and a complete `uncoated` entry per color, plus shared profile metadata. `palette` remains digital-only; the obsolete unprofiled Cream `cmyk` field is removed. Consumers should read process colors from `print.matches`.
