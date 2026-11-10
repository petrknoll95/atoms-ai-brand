# AtomsAI photography v2.1 — new client concepts

Date: 10 November 2026

Skill: /Users/petrknoll/Documents/GitHub/atoms-ai-brand/skills/atomsai-photography/SKILL.md, metadata version 2.1.

Method: built-in image generation only. Each call was a separate new generation. `referenced_image_paths` and `num_last_images_to_include` were omitted. `transparent_background` was false. No CLI generation or post-production was used. Final PNGs are byte-for-byte copies of the tool's source files. Fictional people, workplace concepts and workflows; no real customer, employee or result is claimed.

## Files and measured geometry

- Final customer story: `customer-story-new.png` — 1448 × 1086, exactly 4:3.
- Final onboarding: `onboarding-new.png` — 1448 × 1086, exactly 4:3.
- Preserved first customer-story attempt: `customer-story-new-attempt-1.png` — 1448 × 1086, exactly 4:3.

The first customer prompt requested 1536 × 1152 if supported. The image service actually supplied 1448 × 1086. No resizing or cropping was performed. Later prompts requested 4:3 without specifying a resolution.

## Inspection and candid assessment

The generated images were visually inspected. Saved PNGs were opened with the image viewer at original detail, and dimensions were measured from the actual files. Repeated inline display of an identical saved image sometimes appeared as a small top-left tile in the tool transcript; the complete source render was visible at generation. Inspection judgments are based on those complete source pixels, with byte equality checked between sources and saved copies.

### Customer story, first attempt — preserved, not selected

The administrator's gaze, note and mouse use clearly suggest scheduling review; the calendar is visible obliquely. Her anatomy, mouse contact, paper grip and posture look plausible. Color is fairly neutral, light is readable and the full crown has good headroom.

The reception is tidy and credible, but the combination of generic boxy honey wood cabinetry, a broad counter, institutional seating and suspended ceiling makes the overall environment more conventional than the intended considered contemporary direction. A suspended ceiling by itself is not a failure in a medical practice. This was an art-direction weakness in the whole environment, not a claim that the room is poorly maintained. I generated one targeted new version concentrating on storage, ceiling and the relationship to daylight.

### Customer story, revised — usable with qualifications

Environment: stronger result. Blue-grey integrated storage, a courtyard window, plain ceiling, well-kept seating and a durable counter make a comfortable contemporary practice. It remains recognizably a working reception, not a luxurious showroom. Cabinet hardware and waiting chairs are still fairly conventional; this is a modest well-equipped practice rather than an architectural showcase. Plant repetition is a little decorative.

Naturalness: the administrator faces her work and has a neutral expression. The paper-and-mouse combination is credible, though more composed than a genuinely fleeting gesture. Natural directional daylight, neutral skin and ordinary clothes are successful. No obvious cinematic grading or golden glow.

Anatomy and function: no obvious duplicated fingers, malformed limbs or impossible furniture contacts at the displayed full resolution. Hands plausibly hold the note and rest on the mouse. The workstation is usable. Faces and crown are uncropped.

Task relevance: calendar blocks and paper comparison make scheduling legible. A specific exception-handling action cannot be proved from the screen alone. Appropriate as a fictional customer-story concept, not documentary evidence.

Artifacts: small screen, note and paper marks are not reliably readable. Do not enlarge or use them as factual UI/data. The monitor's minute bezel markings look synthetic. No large unsolicited logos, captions or watermarks were observed. Some background fine details have the ordinary softness of generated imagery.

Decision: usable candidate for main-agent comparison, with the above limitations; not an unconditional photographic-realism pass.

### Onboarding — usable with visible synthetic cues

Environment: contemporary, maintained and thoughtfully equipped. Generous desk, ergonomic seating, low storage, daylight and blue acoustic treatment meet the setting brief. It is ordinary enough to be a client workplace without suggesting a prestigious company headquarters. A large acoustic panel and several decorative plants make the arrangement slightly composed.

Naturalness: the client is operating the mouse and reading her display while the engineer records a note. Their gaze directions differ naturally and the engineer is not selling or pointing. The client's chin-resting pose is a familiar stock-photo convention; it is plausible, but reduces the sense of an accidental unremarkable moment. The shirt fabric is somewhat mottled and textured. Light and skin tones remain credible.

Anatomy and function: no obvious gross hand or limb failures. The client's chin contact and mouse contact look plausible, and the engineer appears to write in a notebook resting on his lap. The engineer's pen-tip area is partly obscured, so fine contact cannot be verified. Full crowns have headroom.

Task relevance: the operator-plus-observing-note-taker division strongly fits onboarding. An unresolved-request queue and detail pane are suggested on the display, although the exact exception workflow is conceptual and cannot be validated.

Artifacts: the monitor is prominent enough that its very clean grey placeholder-style bars and amber dot are a noticeable synthetic UI cue. No personal data are readable. This is the main reason not to treat it as a full natural-photography pass. The screen is more visually explicit than ideal under the skill's instruction that screen content remain incidental. No large unsolicited logos, captions or watermarks were observed.

Decision: retain for main-agent review, with a clear UI/naturalness caveat. No further generation, per the parent request to compare available assets first.

## Source locations

- First customer story: /Users/petrknoll/.codex/generated_images/01a1c6af-d22a-73d3-aa0c-9b260621a8d6/exec-598e9855-dafc-4329-b388-58cb059c6e5d.png
- Revised customer story: /Users/petrknoll/.codex/generated_images/01a1c6af-d22a-73d3-aa0c-9b260621a8d6/exec-0096966b-dec8-4d3b-a603-a223910b7124.png
- Onboarding: /Users/petrknoll/.codex/generated_images/01a1c6af-d22a-73d3-aa0c-9b260621a8d6/exec-c846be5b-39dc-49a0-a42e-90492a3ea969.png

## Exact prompt — customer story, first attempt

Create ONE standalone fictional AtomsAI customer-story photographic concept. Landscape 4:3 composition, output exactly 1536 × 1152 pixels if supported. This is a new image with no reference images.

An experienced medical practice administrator, a woman in her early fifties with short dark hair going grey and ordinary navy office clothes, is reviewing a scheduling exception at her workstation behind the reception desk of a contemporary, well-maintained outpatient medical practice. The photograph catches an unremarkable pause during ongoing work: she is attending to her monitor, comparing the day's scheduling with a small paper note beside her keyboard. No posing or eye contact with the camera. The screen is incidental and seen at an angle: quiet calendar blocks and an exception row with no legible names, patient details or pseudo-readable text.

Medium-wide environmental photograph from a plausible colleague's position just to one side of the reception desk, with the administrator slightly off-center. Include her full crown with some headroom and enough of the reception to understand the workplace. A durable pale grey solid-surface reception counter, well-made oak integrated storage, a comfortable ergonomic task chair, and a small waiting area with contemporary upholstered chairs supply credible quality without luxury or showroom emptiness. A couple of ordinary working papers can be present, with the space maintained and in use. No brand signage, names, captions or claims.

Useful soft daytime window light enters from the side, balanced with believable ceiling light. The reception has clear whites, natural skin color, restrained local color and normal contrast with some natural shadow variation. Moderate depth of field keeps the environment legible. A candid documentary working photograph, naturally finished and unretouched in feeling; no creamy amber grade, teal shadows, artificial grain, HDR crispness or advertising glow. Plausible anatomy, functional equipment and restrained material detail. The meaningful subject is the administrator checking scheduling, not a glamorous interior or a portrait.

## Exact prompt — customer story, revised

Create ONE standalone fictional AtomsAI customer-story photographic concept. Landscape 4:3 composition. This is a new generation with no reference images.

An experienced medical practice administrator, a woman in her early fifties with short dark hair going grey and ordinary navy office clothes, is reviewing a scheduling exception at her workstation behind the reception desk of a contemporary, well-maintained outpatient medical practice. Catch an ordinary pause during ongoing work: she attends to the monitor and compares the day's scheduling with a small paper note beside her keyboard. No posing or eye contact with the camera. The screen is incidental and oblique, showing quiet calendar blocks and one flagged row without legible names, patient details or pseudo-readable text.

Medium-wide environmental photograph from a plausible colleague's position a little to one side, administrator off-center, full crown with headroom, workspace legible. The reception is a genuinely thoughtfully designed present-day medical workplace. A slim warm-grey mineral solid-surface reception desk with a curved corner has a lower ergonomic work surface inside. Flush integrated storage uses muted blue-grey cabinet fronts with discreet hardware, rather than wall-mounted honey wood cupboards. Beyond is a small waiting area with comfortable, contemporary upholstered chairs that have slim curved timber frames, and a broad interior window with a view into a planted courtyard. The ceiling is plain white plaster with small recessed lights, not a suspended ceiling grid or fluorescent panels. Good proportions and useful equipment, a phone and two working papers, make this a working practice rather than a luxury hotel or empty showroom. Avoid grand architecture, decorative staging and clutter.

Useful soft daytime window light from one side, balanced with believable interior ambient light. Clear whites, neutral skin color, natural local colors and normal contrast with natural shadow variation. Moderate depth of field. Candid documentary photograph with a natural, unpolished finish. No amber color grade, teal shadows, artificial grain, HDR sharpness, advertising glow, brand signage, names, captions, watermarks or claims. Anatomy and hand-object contact must be plausible, fabric and material detail restrained. The scheduling work is the priority; the contemporary architecture supports it.

## Exact prompt — onboarding

Create ONE standalone fictional AtomsAI onboarding photographic concept. A separate new image with no reference images. Landscape 4:3 composition.

At a client service company's operations workspace, a client operations person in her late thirties, with medium-brown skin, curly hair loosely tied back and an ordinary muted rust cotton shirt, is trying an exception-handling workflow on her desktop computer. Beside her, an embedded engineer, an East Asian man in his early thirties wearing a simple light-grey shirt, is recording observations in a notebook while she works. Catch the quiet moment when she has opened one unresolved request and is considering the available next action; he looks down to capture a note rather than demonstrating or pointing. Their body language should arise naturally from these different tasks. Neither person looks at the camera. The client operates the workflow herself; this is an onboarding observation session, not a sales presentation or generic laptop huddle.

Medium-wide environmental photograph from a slightly diagonal colleague's viewpoint, across an adjacent desk edge. The client and her monitor are the visual priority, the engineer nearby within conversational distance, both crowns fully inside frame with headroom. The desktop screen is seen obliquely enough to remain incidental: a quiet queue/list and a detail pane with one restrained amber status marker, no readable client names, customer data or pseudo-readable text. The screen cannot be the entire story and does not need detailed interface labels.

A thoughtfully equipped client workspace: a substantial pale ash desk with generous working room and tidy cable routing, comfortable ergonomic chairs, one dark-blue fabric acoustic panel and built-in low storage. Window light comes from the side. A used pen, the engineer's notebook and a short printed runbook are the few incidental signs of work. The room is contemporary, comfortable and well maintained, with useful equipment and believable proportions, not a glamorous headquarters, cramped cubicle, beige showroom or staged hotel lounge.

Natural available daylight balanced by gentle ambient light, clear whites and neutral skin color, normal photographic contrast, moderate depth of field so the workspace stays legible. Restrained natural surface and fabric texture, no cinematic golden glow, creamy amber grade, teal shadows, artificial film grain, HDR crispness or commercial retouching. Plausible hands, pen contact and equipment. No exaggerated gestures, matching outfits, brand logos, watermarks, captions, customer claims or decorative AI graphics. The photograph should feel taken during ongoing work without stopping it for the camera.

