# Photography v3 — rendered evaluation

10 November 2026. Four initial prototypes and one correction. Three separate agents generated and inspected support, onboarding and the careers holdout; the primary agent generated the portrait and inspected all five outputs. This is visual and instruction-transfer testing, not independent audience validation.

**Later image selection:** after the user approved the style and rejected the top-right image, one new support conversation replaced it. See [replacement and pixel review](support-replacement.md). The initial evaluation below is retained as history; its support selection is superseded.

## Editorial decision

**In their element.** Photography shows individual character, relationships and a sense of place. Product UI and diagrams explain the technology. The set varies the camera’s relationship to its subject: a direct portrait, a close listener, a wide arrival and a person in motion.

The previous rules repeatedly required observed office work, soft light and software-delivery relevance. They produced interchangeable desk scenes even when the rooms improved. Those restrictions are replaced by a clear photographic purpose for each image. A directed portrait is allowed to be a portrait; a candid moment needs a believable situation. Better furniture alone was rejected as an answer to the editorial problem. Unrelated activity added only for variety was also rejected: the cycling test has a supplied fictional profile rationale.

Business context came from the supplied company direction spanning applications, models and services. The old customer stories were mock content. No firsthand customer engagement was available, and none was manufactured. These are fictional direction studies, not documented customer outcomes or employee portraits. Private source correspondence is not included in the repository.

## Criteria set before rendering

Each frame needs a distinct visual job, believable human detail and light, and a specific setting. The series must vary shot scale, camera relationship and activity. The portrait must remain legible in the site’s desktop and mobile placements. The arrival must visibly establish entry. The careers holdout must carry an unfamiliar supplied brief through the standalone skill. No computers or desks in this test set; the skill does not impose that as a permanent ban.

## Actual results

| Test | Visible result | Decision and remaining issue |
| --- | --- | --- |
| Customer portrait | Particular face, engaged expression, vivid blue shirt and architectural depth. Full crown retained. | Selected as a deliberate portrait. Conventional composition and fairly pronounced textile detail remain; it is not candid reportage. |
| Support conversation | Close attentive gaze, incidental foreground speaker, natural facial lines and separate local colors. | Selected for the listening treatment. Some flyaway hairs meet the upper edge; hair is longer than requested and cloth texture is coarse. |
| Onboarding, first render | Full figures, conversation, wide architecture and useful diagonal shadows. | **Rejected as arrival:** the pair walks away from the entrance. The centered pair also feels closer to workplace stock photography. Exact original prompt retained. |
| Onboarding, correction | Newcomer approaches from behind; the other person holds the glazed door. Destination, contact and direction are readable. | Selected. Arrival is corrected; the lobby remains somewhat styled and the welcome slightly formal. |
| Careers, independent holdout | City cycling scene with coherent panning, natural posture, a particular face and an identifiable urban setting. | Selected for movement and the supplied profile context. The front wheel clips the bottom despite the prompt requesting the complete bicycle. Full-bicycle framing did not pass. |

All selected originals are 1448 × 1086, exact 4:3. They were copied without retouching, resizing or color changes. The first onboarding render and all originals remain in the workspace evaluation folder. Public selected files are:

- `public/photography/customer-story-ai-generated.png`
- `public/photography/support-ai-generated.png`
- `public/photography/onboarding-ai-generated.png` — corrected render
- `public/photography/careers-ai-generated.png`

Exact generation prompts are alongside this report. The careers agent saw the revised skill and a short fictional engineer/cycling profile brief, not an expected composition. Its interpretation demonstrates transfer beyond office work. It does not establish that an engineer actually has this routine.

## What the test changed

The skill now asks for a photographic decision before a prompt, allows portraiture and expressive light, separates photography’s purpose from product explanation, and reviews variation across the set. The observed arrival failure added one specific instruction: make a transition’s destination and direction visible. Crown and bicycle-edge misses are recorded rather than treated as unqualified passes or multiplied into new universal rules.

The set has more variation in scale and action than its predecessor, but still leans toward urban architecture and blue/brick color combinations. It is not a comprehensive test of every environment, subject or assignment. No numerical aesthetic score or audience preference is claimed.

## Site and delivery verification

- Production build passed.
- Website-scoped Astro check: 150 files, zero errors and warnings; one existing clipboard-deprecation hint. Illustrator-only JSX scripts elsewhere in the repo use `#target` syntax and fail the broader scan; they were excluded in an external temporary check configuration, not edited.
- Skill structure validator passed.
- Shared skill checks passed: four skills, 18 package files, ZIP/copy parity and 355 local links.
- Production-preview browser checks at 1440 and 390 px: all four images loaded, no horizontal overflow or page errors. Desktop frame is 16:9 with 40% copy; mobile photo is 4:5. Logo measures 123.6 px on desktop and 100 px on mobile. Placement guides toggle correctly. Both crops and the contact sheet were visually inspected.
- Photography Skill source, copy payload and Markdown download match. All four selected PNGs match the tool originals and built files byte for byte. Guidelines and manifest deliver v3.0.
- The prior UI removals remain removed. No crop-selector section, photography-kit block, publication checklist, identity strip, disclaimer caption or use-case button was restored.

## External validation status

Customer recognition, candidate reaction and independent photo-editor review have **not** occurred. Subagents are not substitutes for these.

A bounded follow-up evaluation would show the images without the direction statement and ask: “What is happening?”, “What feels observed or arranged?”, and “Which image tells you something about a particular person?” Compare the old and new sets without identifying which is newer. A source participant must separately confirm any real identity, place or event before a concept becomes an actual story. Keep answers verbatim; do not prefill results or treat a small qualitative panel as statistical proof. No outreach was performed.
