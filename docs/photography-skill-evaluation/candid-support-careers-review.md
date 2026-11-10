# AtomsAI photography v2.0 — support and careers image evaluation

Date: 2026-11-10  
Generator: built-in `tools.image_gen__imagegen`; no CLI used.  
Direction read: `/Users/petrknoll/Documents/GitHub/atoms-ai-brand/skills/atomsai-photography/SKILL.md`, metadata version 2.0.  
Context supplied with assignment: support human escalation; careers remote-first senior engineering, evaluations, production reliability and integrations. All depicted people are fictional generated editorial subjects.

## Outputs and measured format

PNG dimensions were read directly from each saved file's IHDR. All four files are **1448 × 1086**, exactly **4:3**. The prompts requested 1536 × 1152; the built-in generator delivered the correct ratio but a different pixel size. No resize, crop, retouch or format conversion was applied.

| File | Status | Source file |
| --- | --- | --- |
| support.png | Original, preserved | /Users/petrknoll/.codex/generated_images/01a1c69b-abbe-7050-9f84-163ef213e399/exec-4dde7981-c7b3-4391-8d5b-89541e834df9.png |
| support-revised.png | Recommended support candidate | /Users/petrknoll/.codex/generated_images/01a1c69b-abbe-7050-9f84-163ef213e399/exec-41d6d8f1-b17e-4d54-a12a-9be0b85f3659.png |
| careers.png | Original, preserved | /Users/petrknoll/.codex/generated_images/01a1c69b-abbe-7050-9f84-163ef213e399/exec-b2ed0116-156a-4b1b-9cdb-d774e7e08b36.png |
| careers-revised.png | Recommended careers candidate | /Users/petrknoll/.codex/generated_images/01a1c69b-abbe-7050-9f84-163ef213e399/exec-524979a9-c3c4-47c9-a59e-82fc5bee8054.png |

Saved directory: `/Users/petrknoll/Documents/ChatGPT/AtomsAI/output/photography-skill-eval/candid/`

Each local file was passed to `view_image`. That path displayed only a small preview in this environment, so the saved PNG bytes were also displayed through the image output facility for full-image visual inspection. The original generation output itself was inspected at full display size as well.

## Support — original inspection

Assignment relevance: credible human support workstation with a conversation screen and a person reading before responding. No headset, camera-facing smile, explicit identity claim or brand overlay. The escalation itself is not independently provable from the pixels; it remains the fictional scenario's context.

What worked: ordinary shared office, readable work environment, full headroom, normal skin and local colors, believable chair/monitor/keyboard contact, non-golden daylight. No obvious anatomy failure at the inspected scale.

Material issues: the hand-on-chin pose looks like stock-photo shorthand for thinking, particularly when compared with the other test images. The decorative mug and open notebook are conspicuously placed. The monitor dominates and contains too much readable-looking invented interface detail. This is relevant but not a convincing first-pass success for the candid default.

Decision: revise once, preserving the original.

## Support — revision inspection

The woman now performs a small practical typing action; the monitor sits at a steeper angle with much less legible content. The decorative mug is gone, and the foreground contains casual papers rather than an exhibition-like open notebook. Her full head, neutral expression, existing desk, clothing and daylight character are retained.

Naturalness is materially improved: she is absorbed in the screen and the hands contact the keyboard plausibly. The composition remains a clean, well-exposed workplace photograph, and the large plant still contributes some generic office styling. The screen is appropriately subordinate. No obvious hand or object defect was visible at the inspected scale; no readable customer identity was apparent.

Decision: use `support-revised.png` as the stronger support candidate. It is a pass with the reservation that the overall office still looks relatively orderly.

## Careers — original inspection

Assignment relevance: a believable remote engineering setup in a modest room, with laptop, external monitor, code/log structure and a red failed-run cue. Doorway framing, full crown, cables, ordinary clothes and the residential setting support the remote-first careers use. No prestigious invented office.

What worked: neutral soft overcast light, natural color, understandable engineering work and intact headroom. No obvious anatomy failure.

Material issues: the same hand-on-chin “thinking” pose as support weakens the impression of an observed working moment. Matching plant placement around the desk and shelf and a neatly displayed notebook add lifestyle staging. The failure cue is visible but screen detail does not establish any real workflow result.

Decision: revise once, preserving the original.

## Careers — revision inspection

The engineer is looking down at the laptop during a small active investigation, with plausible keyboard contact and a naturally bent working posture. The chin pose is removed. The software context and normal room remain, with the external monitor still showing a small red failure cue. The result feels more uneventful and less like a portrait.

The edit removed both the desk plant and shelf plant, although the prompt specifically requested removal of the large plant beside the monitor and preservation of the rest of the room. This is minor reference drift, not an exact preservation pass. Facial identity, blue shirt, chair, equipment, doorway view and lighting appear consistent. The desk is still fairly composed, and the red panels are generated illustrations of workflow context, not verified application content.

Decision: use `careers-revised.png` as the stronger careers candidate. Naturalness improved enough to accept with the stated preservation caveat.

## Series finding

The two original independent generations converged on a hand-on-chin pose without either prompt requesting one. This is a demonstrated generation tendency, not evidence that the written skill alone reliably prevents stock-photo body language. The one-revision limit for each image was respected. The revised pair has coherent neutral daylight and normal materials; both remain computer-work scenes and should be reviewed with the full site series for repetitive action or layout.

## Exact support generation prompt

```text
Use case: photorealistic-natural. Create a single landscape 4:3 photograph, 1536 × 1152 pixels, for the AtomsAI support page. An ordinary customer support specialist is taking over an escalated, unresolved customer request from an automated workflow. A fictional woman in her forties in everyday clothes sits at her normal office desk, absorbed in reading the earlier conversation and checking the order context on her computer before replying. Catch an unremarkable pause during that work, with neutral concentration and no awareness of the camera.

Photograph from a plausible colleague's position slightly to the side and behind her, a medium-wide environmental view with her full crown and workspace visible. The monitor is oblique: incidental rows and conversation structure may be visible, but no readable names, personal data, polished invented interface or large graphics. Ordinary laminate desk, typical office chair and varied everyday equipment; only the modest incidental disorder that belongs there. Moderate depth of field leaves the working environment legible. Use ordinary window spill and ceiling light, slightly uneven illumination, natural local colors and neutral skin, normal contrast and restrained detail.

The human handover and attention to the unresolved request are the subject. No headset portrait, smile at the camera, pointing or performed demonstration. No staged collaboration, showroom office, coordinated props, golden glow, cinematic grading, commercial retouching, brand colors applied as a filter, logos, captions, watermark or border. This is a candid photographic editorial scenario, not a named real employee or customer.
```

## Exact support revision prompt

Input edit target: `support.png` using `referenced_image_paths`.

```text
Edit this photograph for a candid AtomsAI support editorial, correcting the staged thoughtful-pose impression. Preserve the same fictional woman, ordinary support desk and office, neutral natural colors, available daylight and normal ceiling light, full crown, and 4:3 landscape format. The human task remains taking over an unresolved customer request from an automated workflow and checking its context before answering.

Show her in the middle of a small practical action: entering a short handover note about the unresolved request at her keyboard, still attending to the conversation. Let her posture and hands follow that everyday task rather than holding any pose. Remove the hand-on-chin gesture. Move the camera slightly farther to the side so the monitor is more oblique and much less dominant; screen content should be indistinct incidental chat structure without legible or pseudo-legible sentences, names, detailed perfect UI or customer data. Keep enough context for a real support workstation.

Reduce the arranged desk styling by removing the prominent decorative mug and closing the conspicuously displayed foreground notebook, leaving it casually with the other papers. Do not tidy the rest of the desk into a showroom. No smiles, eye contact, headset portrait, performed pointing, showcase gestures, dramatic lighting, overlays, captions or watermarks. Capture an unremarkable second while the work continues.
```

## Exact careers generation prompt

```text
Use case: photorealistic-natural. Create a single landscape 4:3 photograph, 1536 × 1152 pixels, for AtomsAI's careers page. AtomsAI has a remote-first team working on production AI workflows, integrations, evaluations and reliability. A fictional male engineer in his thirties is reviewing a failed workflow run in his ordinary home workspace, concentrating on where the integration failed and comparing the run trace with a short set of evaluation notes. Photograph a quiet, unfinished moment during that work, with no posing or eye contact.

Use a medium-wide view from a plausible room doorway a little to one side, so his profile, full crown and actual working setup remain visible. He sits at a simple desk tucked into a modest lived-in spare room, wearing an ordinary faded blue T-shirt. The workspace has a laptop with one external monitor and the few incidental cables and personal objects typical of actual daily use. Screens are seen obliquely at a distance: subdued dark run-log panels, a small red failure indicator and code-like structure are incidental rather than a crisp designed graphic; no readable customer data or invented company claims. The engineer's posture and hands should follow the work naturally, without theatrical frustration or a demonstration gesture.

Overcast daylight from the room's window mixes subtly with available indoor light, with readable skin and a little ordinary unevenness. Natural local colors, neutral white balance, normal contrast and moderate depth of field; let the room remain legible. No luxurious headquarters, loft aesthetic, staged lifestyle decor, coordinated props, warm golden wash, teal shadows, dramatic rim lighting or commercial retouching. No logos, text overlay, watermark or border. Make it feel observed during a normal remote working day; this is a fictional editorial scenario, not a real employee portrait.
```

## Exact careers revision prompt

Input edit target: `careers.png` using `referenced_image_paths`.

```text
Edit this photograph for a candid AtomsAI careers editorial. Preserve the same fictional engineer and identity, his ordinary home workspace, doorway viewpoint, full headroom, 4:3 landscape framing, soft overcast light, natural skin and local colors, laptop plus external monitor with incidental failed-run context.

Correct the staged 'thinking portrait' impression: catch him in the middle of actually investigating the failed run, making a small change or test on the laptop and reading its result, with a naturally settled working posture. Let his hands and gaze follow the task; remove the conspicuous hand-on-chin pose. The camera is unnoticed. Reduce the styled-lifestyle impression by removing the large decorative plant immediately beside the monitor; keep the rest of the room and its everyday objects and cables as they were. Do not add dramatic frustration, demonstration gestures, pristine fake UI, readable private data, polished lighting, text, logos or watermarks. Keep this an uneventful observed remote working moment.
```
