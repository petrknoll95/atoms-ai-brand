# AtomsAI print patterns

Open **catalog.html** for the full library. Each family folder contains editable Illustrator masters, production PDFs, RGB previews, and a validation JSON for each combination. `inventory.json` records completion; `source-manifest.json` records the exact local sources and converted colors.

## Inventory

| Family | Published variants | Colorways | Combinations |
| --- | --- | --- | --- |
| Drift | 5, 10, 20, 40 slits | Forest, Sage, Graphite, Iris | 16 |
| Offset | 5, 10, 20, 40 slits | Forest, Sage, Graphite, Iris | 16 |
| Single band | 5, 10, 20, 40 slits | Forest, Sage, Graphite, Iris | 16 |
| Concentric | density keys 1, 2 | Forest, Sage, Graphite, Iris | 8 |

The 56 combinations exclude intermediate generator stops 6, 8, 13, 16, 25 and 32. The current generator exposes only the four published colorways. “Master” is a guideline specimen and underlying data recipe, not a downloadable generator choice, so it is not included. Concentric filenames use `variant-1` and `variant-2`; these are source density keys, not literal ring counts.

## Production condition

- Trim: **300 × 300 mm**. Bleed: **3 mm**, continuous artwork on all sides; no printer marks.
- Process CMYK with embedded **Coated FOGRA39 (ISO 12647-2:2004)**. This is an assumed coated-offset condition, not a printer-approved specification.
- Illustrator document raster effects: **300 ppi**. Blurs remain live; production PDFs contain rasterized effect appearances and live transparency.
- Illustrator **PDF/X-4:2008 preset** with embedded FOGRA39 output intent. PDF normalization corrects Illustrator scripting's fractional-point bleed rounding, sub-micron trim-box rounding and its incorrectly written registry metadata (`http://www.color.org`), without changing artwork streams. Structural checks are **not certified PDF/X conformance**.
- No linked images or fonts. PNGs are 1200 px square RGB previews of the print adaptation, tagged sRGB; do not use them for print production.

The artwork is the complete 840-unit field at 300 mm / 800 units, with a centered 800-unit trim. It provides 7.5 mm of artwork beyond each trim edge; the delivered PDF retains exactly 3 mm. Scale uniformly with Scale Strokes & Effects enabled. Never stretch or replace the crop with a rescaled 840-unit field.

## Color provenance and print adaptation

Current local `src/data/colors.ts` and `src/data/patterns.ts` are authoritative; no outdated Figma palette was used. Each source sRGB color was converted with LittleCMS to the actual embedded FOGRA39 profile using **relative colorimetric intent and black-point compensation**. Converted channel values are recorded per role in `inventory.json`; Illustrator's stored values can be slightly quantized.

Cream is profile-converted from **#F6F1E8 to approximately 3.922 / 5.882 / 10.980 / 0 CMYK**. The pilot's former 0/2/6/4 override is obsolete under the latest local guidance. The repository's newer FOGRA51/52 tables describe different conditions; those numbers were not assigned to FOGRA39. These are process simulations, not PANTONE ink recipes or certified matches.

Mask black and white are neutral luminance controls, independent of the artwork's ICC conversion. This prevents CMYK rich-black conversion from distorting the mask falloff. The PDFs may encode mask grayscale as a `/Separation /Black` with a DeviceCMYK alternate. That is the existing **process Black** plate, not an additional spot ink. No named spot color is used.

The renderer's additive `lighter` blend is adapted to native **Screen at 20%** only for Drift, Offset and Concentric reflection. Screen is not mathematically identical to additive RGB blending, and the print gamut/compositing space also changes appearance; dark Concentric fields can look darker, and Iris Offset highlights have less contrast than the additive RGB reference. Single band's reflection stays **Normal at 20%**, its overlay stays **Overlay at 15%**, and its shade stays Normal. Geometry, gradient transforms, stop curves, source order, annular paths and mask nesting are retained.

## Editing in Illustrator

Open the `.ai`, not its PDF companion. Five named top-level layers run bottom to top:

- Drift: Base, Lower, Upper, Highlight, Reflection.
- Offset and Concentric: Base, Upper, Lower, Highlight, Reflection.
- Single band: Base, Fields, Reflection, Overlay, Shade. Fields contains Field1, Field2 and Field3 inside a further group opacity mask.

Expand a layer to the inner masked group (underlined in Layers) and target that group, rather than its outer wrapper. In the dedicated **Window → Transparency** panel, click the mask thumbnail to edit its native gradients and slit clipping paths or annular compound paths. The Properties/Control opacity popovers can misleadingly show “Make Mask” for a wrapper; use the full panel and the correct nested target. Click the artwork thumbnail to return. Keep masks linked. For nested Single band masks, enter the relevant child group separately.

Blur lives **on the mask artwork**, so the parent mask softens without blurring the colored children. Its native effect is `Adobe PSL Gaussian Blur`, radius **2.009055 pt**, corresponding to 1.89 source units. Edit through Appearance while in the mask. Ordinary document gradient/path counts do not include every object held inside opacity masks.

When resaving a master, keep **Create PDF Compatible File** and **Embed ICC Profiles** enabled, then verify the profile after reopening. The native scripts set these save options explicitly. Do not expand or flatten the master. The PDF's rendered effect images are expected and do not mean that the Illustrator artwork was flattened. After any edit, regenerate the PDF and preview, check bleed and raster effects, and re-run validation. For a different press or stock, convert from the source RGB recipes using the printer's profile and obtain a proof; do not simply assign another profile to these separations.

## Validation and qualifications

Each `*-validation.json` records native private edit data, layers, mask count, live blur parameters, native application checks, PDF boxes, output profile hash, color spaces, blend modes, image resolution, overprint flags, font count, sampled total ink and file hashes. `validation-summary.json` summarizes the set and representative reopen checks. Contact sheets and the catalog provide visual review of every output. `audits/` contains direct native-mask contents inspections: masks were released only in unsaved working copies to expose editable gradient stops, clipping paths and compound paths; the delivered masters retain every mask.

Ink coverage and edge coverage are sampled at 150 ppi and are not a full-resolution RIP certification. Adobe Acrobat Pro Preflight, callas pdfToolbox, or another formal PDF/X validator was not available in this environment. PDF/X-4 metadata and structure pass the implemented checks; **certified conformance remains unverified**. A printer proof remains necessary for the assumed output condition and blend adaptation.

## Reproduction and resuming

Scripts are in `scripts/print-patterns/`. Run from the repository root with Adobe Illustrator 2026 available, Python 3.14 (installed package versions in `scripts/print-patterns/requirements.txt`; LittleCMS 2.17), Node and the repository's TypeScript dependency. The default temporary directory is `/tmp/atomsai-pattern-production`.

```sh
python3 scripts/print-patterns/prepare.py
python3 scripts/print-patterns/run.py --template assets/print/patterns/drift/atomsai-drift-forest-10-cmyk.ai
python3 scripts/print-patterns/validate.py
python3 scripts/print-patterns/catalog.py
python3 scripts/print-patterns/verify-saved.py
python3 scripts/print-patterns/finalize.py
```

`run.py --only atomsai-drift-forest-10` restricts generation. Native `.done` checkpoints skip completed jobs. `validate.py` copies native files into the repository and normalizes the exported PDF boxes. To intentionally regenerate changed artwork, set `PATTERN_WORK` to a fresh temporary directory for all commands and review source provenance first; do not reuse stale checkpoints. Never edit a generated PDF in place to change its artwork.

Illustrator cannot access this repository directly in the current app context, so the runner stages only its working files under `/tmp`; the Python validator performs repository copies. No global Illustrator color settings are changed. A supplied native master is used only as a document-profile template; its artwork is removed in the working copy before source-derived vectors are constructed.

Opacity-mask action parameter identifiers were checked against the [original author’s documented Illustrator action example](https://gist.github.com/creold/889cce331bf4ecafba7b7ed71ab6827b). The reusable action contains only Make/Release commands; generation uses Make. Masks are assembled from ordinary vector groups because releasing an imported SVG opacity mask proved unstable in this Illustrator version. The UI workflow follows [Adobe's opacity-mask instructions](https://helpx.adobe.com/uk/illustrator/desktop/manage-colors/apply-transparency-and-blending/create-transparency-using-opacity-masks.html).

No Git LFS filter is configured for these paths. These files follow the repository’s existing ordinary binary-asset convention. No unrelated tracked files were edited.

For fresh renderer comparisons, use `render-references.mjs` with a local Playwright module and Chromium, then run `compare.py`. This executes the current repository renderer directly; the comparison JPGs show reference and print preview pairs. `renderer-comparison.json` records image correlation and RGB differences, not a colorimetric certification.

The reference-render check used Playwright 1.65.0 with locally installed Chromium. Its module and browser paths are supplied through `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`; no repository package files were changed.

The saved-file audit caught an Illustrator ExtendScript nested-ternary enumeration issue that substituted Hard Light for Screen/Overlay. The generator now uses explicit conditional assignments. All masters were corrected and re-exported; PDF blend-mode checks and native reopen checks prevent recurrence. `repair-blend-modes.py` preserves existing native geometry while applying this one-time correction.
