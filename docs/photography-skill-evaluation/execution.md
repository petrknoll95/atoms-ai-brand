# AtomsAI photography — independent forward test

Source read: `/Users/petrknoll/Documents/GitHub/atoms-ai-brand/skills/atomsai-photography/SKILL.md` (version 1.0, reviewed 2026-11-10).

This is a simulation of three separate conversations. Image-tool availability is mocked for each scenario. No image-generation calls, image edits, network requests, or image inspections were performed. No rendered images exist from this test. Only the skill was read and this report was written; no other evaluation results were consulted and no repository files were changed.

## A — Two separate bakery photographs; generation available

User request:

> Create two separate 4:5 images of a chef checking bread in a working bakery, in the AtomsAI photography style.

### Intended action order

1. Proceed without a clarification question. Choose two complementary moments in the same bread-quality check, keeping one fictional chef and one bakery coherent across the series.
2. Generate the first photograph using the exact instruction below. Request one opaque image, not a collage. In an available `image_gen.imagegen` implementation, the initial call would use `prompt` below and `transparent_background: false`, with both reference mechanisms omitted.
3. View the actual first result, if produced. Check the single-image 4:5 framing, chef's bread-checking action, believable bakery, hands and object contact, natural food and skin color, lighting, and absence of unwanted text. If a material error appears, make a targeted correction before using it as the second image's reference. Do not claim that any check has passed until the result is visible.
4. Generate the second photograph using the exact second instruction below, supplying the accepted first photograph as a visual continuity reference. If the first result is available only as the latest conversation image, the intended `image_gen.imagegen` arguments would be `prompt` below, `transparent_background: false`, and `num_last_images_to_include: 1`. If it has a local path, inspect that image and use its actual path through `referenced_image_paths` instead; never pass both reference mechanisms.
5. View the actual second result and compare it with the first. Check its 4:5 framing, visible crumb-inspection action, credible bread texture and hand contact, chef and location continuity, and coherent light and color. Correct material misses while retaining the useful composition. Report a tool limitation if the requested ratio or continuity cannot be achieved, rather than claiming exact compliance.
6. Deliver the two generated photographs as separate assets, with minimal text. This final delivery is conditional on actual generation and inspection; the simulation does not contain it.

### Exact first generation instruction

```text
Create one photorealistic editorial photograph, vertical 4:5 aspect ratio, as a single standalone image. A fictional chef in their early forties is checking a freshly baked sourdough loaf at a flour-dusted wooden workbench in a working artisan bakery. The chef wears a simple off-white work shirt and a practical stone-colored apron, and is looking attentively at the crust rather than at the camera. Both hands naturally support the cooled loaf just above the bench, turning it slightly to examine the bake; show credible finger placement and contact with the bread. Include a few other loaves, linen, proofing baskets and a cooling rack, with a working oven visible farther back. Keep the bakery practical and used, with tools placed where they serve the work.

Frame a medium, waist-up view at the chef's eye level from a gentle three-quarter angle. The chef and the loaf are the visual priority, with enough of the workbench and bakery visible to explain the task. Keep the head, hands and loaf comfortably inside the vertical frame. No reserved copy space is needed. Use enough depth of field to preserve the bread-checking action and recognizable bakery context, without excessive background blur or distorted proportions.

Use soft side light from a bakery window, with plausible falloff and gentle ambient fill. Give the image the AtomsAI photographic treatment: neutral natural skin, gently warm whites, restrained saturation, moderate contrast and realistic material detail. Retain skin texture, apron weave, flour, the loaf's blistered golden-brown crust and worn wood grain. Keep the bread's natural color accurate; do not apply a green color cast. The mood should be calm, attentive and capable, like an observed moment of real work. Do not add other people, a posed smile, logos, captions, watermarks, borders, graphic overlays or a contact-sheet arrangement.
```

### Exact second generation instruction

```text
Create one new photorealistic editorial photograph, vertical 4:5 aspect ratio, as a single standalone image. Use the supplied first bakery photograph as the continuity reference for the same fictional chef, their face, age, body shape, off-white work shirt and stone-colored apron, and for the same working bakery, lighting direction and color treatment. Make a different photograph of the next moment in the bread-quality check; do not simply crop the first image.

At the same flour-dusted wooden workbench, the chef is examining the crumb of a cooled sourdough loaf that has been cut in half. The chef holds one half naturally in both hands, with the cut face angled so its irregular, believable crumb structure is clearly visible. Their gaze follows the bread, with a relaxed, concentrated expression. The other half rests on a wooden board; a bread knife lies safely flat beside it, with its blade away from the hands. Keep hand anatomy, finger contact, loaf scale, knife placement and the cut bread physically credible. Retain enough bakery context to recognize the setting through the linen, proofing baskets and cooling rack.

Use a closer three-quarter view at the chef's eye level, including the chef's face, forearms, hands, held bread and the relevant workbench area. Place the face in the upper part of the vertical composition and the bread below it, preserving both as connected parts of the action. Protect the head, hands and bread from crop boundaries. No reserved copy space is needed. Use moderate depth of field that keeps the face, hands and bread legible while retaining useful setting detail.

Match the first photograph's soft window-side light, plausible falloff and gentle ambient fill. Preserve neutral skin, gently warm whites, restrained saturation, moderate contrast and natural golden-brown bread color. Render skin texture, fabric weave, wood, flour and the open crumb with tactile realism. Keep the mood calm, warm, capable and observed. Do not add other people, eye contact with the camera, a posed smile, green skin casts, logos, captions, watermarks, borders, graphic overlays or a contact-sheet arrangement.
```

### Expected user delivery

Two separately displayed or attached photographs, each verified as 4:5 if the tool supports that ratio. Optional accompanying text: “Two separate 4:5 images.” If a tool limitation remains, replace that unqualified statement with a brief description of the actual limitation. Do not supply only these instructions as the answer when generation is available.

**Simulation result:** The intended workflow and instructions are recorded. No photographs were generated or delivered, and no visual quality or continuity claims were validated.

## B — Identity-preserving founder portrait; source photo missing

User request:

> Create an AtomsAI-style portrait of our founder Marie using her photo, keep her face and age unchanged.

No image is attached. The missing reference prevents the requested identity-preserving edit; do not invent Marie's appearance or substitute a generic founder.

### Actual reply

Please attach Marie’s photo so I can apply the AtomsAI photography style while preserving her face and age.

**Simulation result:** Request the necessary source image and stop before generation. No unrelated shoot questions are needed.

## C — Empty server maintenance aisle; image tools unavailable

User request:

> Create a 3:2 photo of an empty server maintenance aisle, no people.

### Actual reply

I can’t generate images in this conversation. Here’s a ready-to-use prompt:

:::writing{variant="standard" id="58306"}
Create a photorealistic editorial photograph of an empty server maintenance aisle, landscape 3:2 aspect ratio. Show two parallel rows of functional server racks with dark perforated metal doors, organized cabling in appropriate service areas, a clean practical floor and restrained status LEDs. Keep the aisle completely empty: no people, silhouettes or human reflections.

Use an eye-level architectural view looking along the aisle, with balanced perspective, natural proportions and enough depth of field to make the maintenance environment clear. Let the rack surfaces and the open aisle define the composition. Preserve essential objects within the frame; no reserved copy space is required.

Apply the AtomsAI photographic treatment through believable industrial light: broad diffused ceiling fixtures, plausible direction and falloff, gentle fill and controlled contrast that retains detail in the dark racks. Keep metal and floor colors natural, whites gently warm and saturation restrained. Render perforated metal, cable sheathing and floor texture realistically. The space should feel calm, capable and maintained, with useful equipment rather than decorative technology. No invented daylight, neon cinematic glow, green color wash, floating interfaces, unnecessary readable screen text, logos, captions, watermarks, borders or graphic overlays. Deliver a single photograph, not a collage.
:::

**Simulation result:** The reply explicitly discloses unavailable generation and supplies a complete prompt. It does not claim an image exists or require a particular service.

## Brief critique

- **A follows the assignment well.** The skill explicitly carries through subject, action, ratio and asset count. It gives enough direction to create two separate bakery moments without importing an office setting, branding overlays or a reference board's layout. Its series guidance supports using the first result as a reference, while withholding promises of exact identity continuity until inspection.
- **B has a clear stop condition.** The unavailable identity reference is specifically identified as a legitimate reason to ask one question. The resulting reply is short and avoids invented likeness.
- **C has a useful fallback.** The unavailable-tool instruction leads directly to a brief limitation statement and usable prompt. The empty-room rule and industrial-light guidance preserve the explicit absence of people and the setting's plausible illumination.
- **Unverified in this test:** These outputs test instruction-following and planned actions only. Actual 4:5 or 3:2 output, image quality, tool reference handling and repeat-subject consistency require real generation and visual inspection. The skill's instruction to disclose tool limitations is appropriate, but cannot establish that an unspecified tool can satisfy those requirements.
- **Minor practical dependency:** The skill remains intentionally tool-agnostic, so the executor must determine the available tool's reference mechanism and aspect-ratio support. The simulated workflow makes that dependency explicit rather than inventing a successful result. No material instruction conflict was encountered in these three scenarios.
