export const photographyVersion = '3.0';
export const photographyExamples = [
  { id: 'customer-story', name: 'Customer story', file: '/photography/customer-story-ai-generated.png', alt: 'Fictional editorial portrait of a woman in a cobalt shirt at a brick and green-metal doorway.' },
  { id: 'support', name: 'Support', file: '/photography/support-ai-generated.png', alt: 'Fictional conversation study of a man in a burgundy shirt listening with a slight smile to a person in the foreground.' },
  { id: 'onboarding', name: 'Onboarding', file: '/photography/onboarding-ai-generated.png', alt: 'Fictional arrival study: one person approaches a glazed entrance while another holds the door.' },
  { id: 'careers', name: 'Careers', file: '/photography/careers-ai-generated.png', alt: 'Fictional profile study of a cyclist passing a brick railway arch in morning light.' },
];
export const referenceNotice = 'AI-generated art-direction studies. The people, locations and situations are fictional; these files do not document AtomsAI customers, employees or outcomes.';

export const photographyPrinciples = [
  { title: 'Personality first.', text: 'Find the expression, relationship or detail that makes someone an individual. A portrait can be direct. An encounter can be quiet. Give the viewer something to notice.' },
  { title: 'A world beyond the screen.', text: 'Show people in places that matter to their story: at a threshold, in conversation, moving through a city or between tasks. Let product UI explain the software.' },
  { title: 'One idea in each frame.', text: 'Choose proximity, scale, movement or a pause. Build a series from different moments, connected by believable light, natural color and a confident photographic eye.' },
];

export const photographyUseCases = [
  {
    id: 'customer-stories', title: 'Customer stories', lead: 'A person with a point of view.',
    subject: 'The actual customer whose decisions and experience give the story weight.',
    direction: 'Let the story choose the moment. An environmental portrait can establish presence; an encounter or revealing detail can show what matters to this person. A software demonstration is only useful when it is the story.',
    character: 'Use the real subject and their approved name and words. Give them room to look like themselves, with personal clothing, expression and surroundings.',
    crops: '4:3 editorial image · 4:5 portrait · 16:9 composition',
    avoid: 'Interchangeable executive poses, generic office scenes or generated people attached to a real testimonial.',
    shots: ['A portrait that connects the person to their world', 'An encounter or detail drawn from the actual story'],
  },
  {
    id: 'support', title: 'Support', lead: 'Attention you can feel.',
    subject: 'The person listening, understanding and helping.',
    direction: 'Move closer. An attentive face or a moment in conversation can convey more than a row of headsets. Let the expression carry the image and keep the background secondary.',
    character: 'Use the actual person for a named portrait. Keep human, team and AI identities clearly labelled in the interface.',
    crops: '4:3 conversation · 4:5 portrait · 1:1 named avatar',
    avoid: 'The stock service smile, unnecessary equipment as shorthand, or a human portrait representing automation.',
    shots: ['A close listening moment', 'A straightforward portrait when the interface needs one'],
  },
  {
    id: 'onboarding', title: 'Onboarding', lead: 'The beginning of a relationship.',
    subject: 'The people meeting, arriving or finding their bearings together.',
    direction: 'Use a threshold, an arrival or a conversation to make a welcome feel human. Step back when the place and the relationship matter. Use product UI and diagrams to explain the procedural steps.',
    character: 'Treat participants as peers. Keep the interaction ordinary and the next action clear.',
    crops: '4:3 welcome image · 16:9 environmental scene',
    avoid: 'Staged handshakes, a presenter pointing at a screen, or decorative faces on every instruction.',
    shots: ['An arrival with a sense of place', 'An exchange with a shared point of attention'],
  },
  {
    id: 'careers', title: 'Careers', lead: 'People with lives of their own.',
    subject: 'The actual colleagues and relationships that give the team its character.',
    direction: 'Follow a particular person or connection: an individual portrait, a moment between tasks, or an interest outside work that belongs to the profile. Show engineering work when it adds something specific to the story.',
    character: 'Let people shape their own representation. A personal interest is part of an individual story, not a claim about company perks or everyone’s lifestyle.',
    crops: '4:3 profile · 4:5 portrait · 16:9 group or place',
    avoid: 'Invented employee biographies, performative team fun, prestige offices or repeating the same laptop scene.',
    shots: ['A moment that reveals the individual', 'A real relationship or shared setting'],
  },
];

export const photographyDirection = [
  { title: 'Light', use: 'Let the place and time explain the light. Use open shade, directional sun, reflected light or a believable evening interior. Shadows can give the frame structure; keep faces readable.', avoid: 'Soft flat light in every image, a permanent golden glow or theatrical lighting without a source.' },
  { title: 'Color & finish', use: 'Keep local color and natural skin. Rich blues, brick reds and greens can coexist with the brand. Preserve photographic texture and ordinary highlight and shadow variation.', avoid: 'A uniform beige or amber wash, teal shadows, beauty smoothing, HDR detail or artificial film distress.' },
  { title: 'Place & wardrobe', use: 'Find specificity in architecture, materials, geography and personal clothing. Choose maintained places with character. Let the story take the camera outdoors or into a personal setting.', avoid: 'Manufactured shabbiness, luxury props, identical showrooms or dressing everyone in brand colors.' },
  { title: 'Composition & moment', use: 'Make a clear choice about proximity, scale, viewpoint and timing. A direct portrait, a close expression and a moving figure should each have their own photographic logic.', avoid: 'Repeating the waist-up office scene, choreographing every gesture or calling a held pose candid.' },
  { title: 'People & detail', use: 'Keep individual features, natural body language and signs of a life. Check contact, balance, hands, hair and materials at full size.', avoid: 'Stock-photo archetypes, ornamental fabric artifacts, plastic skin or changing identity and body shape in a reference edit.' },
  { title: 'The series & the brand', use: 'Connect the set through photographic treatment while varying distance, place and emotional tone. Keep typography, logos and patterns in the surrounding layout.', avoid: 'Four versions of one scene, unrelated activities added just for variety, green skin casts or graphics laid across faces.' },
];

export const photographyDelivery = [
  { title: 'Capture & select', text: 'Shoot RAW where available. Deliver a full-resolution master with its embedded profile and an unflattened retouching file when used. Select frames with a real subject, clear action and an accurate context.' },
  { title: 'Web exports', text: 'Convert web derivatives to sRGB. Supply AVIF or WebP plus a JPEG fallback when required. Export at up to 2× the displayed size without upscaling; choose the export size for its actual placement.' },
  { title: 'Responsive crops', text: 'Deliver desktop and mobile crops separately with a recorded focal point. Verify faces, hands and key activity at the actual viewport. A wide team photograph rarely survives a narrow center crop.' },
  { title: 'Print handoff', text: 'Keep the profiled RGB master. Agree final dimensions, resolution and the destination print profile with the printer; convert a duplicate for that output. Do not apply the brand’s flat-color CMYK values to photographs.' },
  { title: 'Names & records', text: 'Use atomsai-[use-case]-[subject-id]-[sequence]-[ratio]-[width]px.[ext]. Keep photographer credit, source, usage permission, approved channels and expiry with the file. Store signed releases privately; link only the record ID.' },
  { title: 'Accessibility', text: 'Describe the relevant visible person or action in concise alt text. Use an empty alt for decoration or an avatar whose adjacent name conveys the same information. Keep names, roles, quotes and calls to action as live text.' },
];

export const photographyGuidelinesMarkdown = () => `# AtomsAI photography

Version ${photographyVersion} · 10 November 2026

## In their element

Photograph people with character, a sense of place and something happening in the frame. Photography supplies human presence; product UI and diagrams explain the system.

${photographyPrinciples.map(p => `### ${p.title}\n\n${p.text}`).join('\n\n')}

## Use cases

${photographyUseCases.map(c => `### ${c.title} — ${c.lead}\n\n- Subject: ${c.subject}\n- Direction: ${c.direction}\n- People: ${c.character}\n- Formats: ${c.crops}\n- Avoid: ${c.avoid}\n- Shot list: ${c.shots.join('; ')}.`).join('\n\n')}

## Art direction

${photographyDirection.map(d => `### ${d.title}\n\n${d.use}\n\nAvoid: ${d.avoid}`).join('\n\n')}

## Image and copy

Put headlines, quotes and calls to action on a separate Deep green/Cream or white/Deep green panel by default. Keep names and roles as live text. Keep faces, hands and key actions clear of type, logos and patterns. In the 16:9 example, the copy panel occupies the left 40% and the photograph the right 60%. Align the logotype and copy to the left margin; preserve one mark-width of clear space beside the logotype and one mark-height above and below it. Keep the logotype at least 100 px wide. On narrow layouts, stack copy above a deliberate 4:5 crop. Do not mirror people or environments to make them fit.

If copy must sit on a photograph, use a stable quiet area and verify contrast over the entire text area at each crop: 4.5:1 for normal text and 3:1 for large text. A tint or glass overlay alone is not a readability guarantee.

## Production & delivery

${photographyDelivery.map(d => `### ${d.title}\n\n${d.text}`).join('\n\n')}

## Reference imagery

${referenceNotice}

Use real subjects and source photographs for actual customer stories and named employee profiles.
`;

export interface PhotographyAsset { file: string; name: string; format: string; description: string; content: string }

export function photographyAssets(): PhotographyAsset[] {
  return [
    { file: 'guidelines.md', name: 'Photography guidelines', format: 'MD', description: 'People, art direction, placement and delivery.', content: photographyGuidelinesMarkdown() },
  ];
}
