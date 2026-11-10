# Photography review and delivery

## Current direction — version 3.0

The photography section and standalone ChatGPT skill now use **In their element**: individual character, relationships and a sense of place. Four selected editorial studies replace the desk-based series. The set covers a direct portrait, close listening, arrival and city movement.

The current download is the guidelines Markdown only; the Photography Skill is separately available in Skills and the shared Skills ZIP. Earlier crop templates, kit/download section, publication checklist, identity examples, captions and callouts remain removed. The in-use example retains the required 16:9, 40/60 composition and deliberate 4:5 mobile crop.

See [the v3 rendered evaluation](photography-skill-evaluation/v3-editorial/results.md) for exact prompts, the rejected first arrival, the correction, transfer testing and limitations. Earlier entries below describe superseded versions, not the current assets or UI.

## Previous implementation record

# Earlier photography implementation

Reviewed and implemented 10 November 2026 in `~/Documents/GitHub/atoms-ai-brand`.

## Brand and site review

- The intro and brand guidance describe AtomsAI as senior, practical, precise and accountable for the workflow it ships. Photography translates this into real subjects, useful context, quiet confidence and observed work.
- The current palette, logo rules, typography, patterns and illustration pages establish Deep green and Cream, natural clear space and one dominant visual. Photography keeps skin and materials natural; the surrounding layout carries the brand colors and typography.
- `Guide.astro`, `Sub.astro`, `Sidebar.astro`, `global.css`, the Assets page and existing ZIP routes establish the site's layout and delivery conventions. The section reuses the same shell, sticky section headings, 32 px display / 14 px supporting type, quiet dividers and pill download controls. URLs use `withBase()` / `publishedUrl()`.
- The Signal identity was added to this repository during implementation. Photography references that identity for automated assistance and distinguishes it from named people and shared human teams with visible labels.
- An earlier photography draft and its reference board in the AtomsAI workspace were reviewed and adapted for this repository. Only photography files were transferred; shared navigation, manifest, Assets page, README and brand guidance received scoped additions preserving the other ongoing work.

## Direction and assets

The section covers customer stories, support, onboarding and careers, including subjects, direction, character treatment, shot lists and formats. Shared guidance covers lighting, finish, setting, representation, framing, live copy, production and publication review.

The nine-file kit contains guidelines, an editable shoot brief, an image-record JSON template, four editable SVG crop guides (4:3, 4:5, 16:9 and 1:1), the reference PNG and package notes. Page copy and generated documents share `src/data/photography.ts`. Individual endpoints, the ZIP, Assets hub and manifest reference the same assets.

The reference board is explicitly AI-generated and depicts fictional people. It is an art-direction resource, not cleared customer, team or support photography. The SVGs are composition diagrams, not new character artwork. No release or real-person photography license is implied by the kit.

## Validation

- `npm run check`: zero errors or warnings; one existing clipboard deprecation hint.
- `npm run build`: successful production build.
- `npm run check:skills`: successful; includes the updated brand guidance and its links.
- Browser checks at 390, 768, 1024, 1280 and 1920 px: no horizontal overflow, all images loaded, no page errors.
- All four crop options, keyboard arrow selection, mobile menu, section anchors, unique IDs, homepage contents and Assets hub checked.
- Nine files in the built ZIP match the individual built downloads byte for byte. Download links, image-record JSON and photography manifest entries checked.
- Desktop and mobile visual inspection completed. No deployment performed.

## Placement correction

The in-use example now maintains a true 16:9 frame and 40% / 60% split whenever its own available width exceeds 600 px. Container queries replace the viewport breakpoints that previously stacked it on desktop. The photograph uses deliberate wide and 4:5 portrait viewBoxes. The supplied logotype is top-left, shares its left margin with the copy, remains at least 100 px wide and preserves its prescribed clear space. An optional overlay shows the panel boundary and 5% safety inset. The downloadable guidelines include the same placement instructions (kit version 1.1).

Verified the frame ratio, copy proportion, logo minimum size and top/left clear space at 390, 768, 1024, 1280, 1440 and 1920 px, plus desktop/mobile visual inspection.

## Candid direction revision — version 2.0

The earlier posed reference board is superseded by four actual rendered tests for healthcare scheduling administration, human support escalation, client-led onboarding and remote engineering. Available light, ordinary local color and observed tasks now replace the earlier consistently soft, warm campaign treatment. The four selected reference PNGs replace the single board in the kit, bringing it to twelve files. Page examples, in-use crops, downloadable guidelines and shoot brief follow the new direction. The user-requested removal of Framing & crops, Downloads, publication checklist, identity examples, callouts and captions from the photography page remains intact. See photography-skill-review.md for the eight-render evaluation and its limitations.

## Environment quality revision — version 2.1

The guidance now specifies contemporary, well-maintained spaces, well-made working furniture and restrained materials alongside candid behavior. It no longer treats tired surroundings as authenticity. Four selected images from fourteen actual rendered candidates replace the page references. The current individual guidelines download uses the same revised direction. The skill review records rejected texture artifacts, fresh-generation comparisons and the remaining limitations.
