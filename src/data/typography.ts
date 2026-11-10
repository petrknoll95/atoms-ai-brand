// Web scale in CSS pixels. Keep the guide, specimens and delivery manifest in sync.
export const typography = {
  desktopMinWidth: 768,
  unit: 'px',
  emphasisWeight: 500,
  scale: [
    { role: 'Display', family: 'Founders Grotesk', weight: 400, trackingEm: -0.015, leading: 0.9, desktop: 80, mobile: 48, sample: 'Built to ship.' },
    { role: 'H1', family: 'Founders Grotesk', weight: 400, trackingEm: -0.015, leading: 1, desktop: 64, mobile: 40, sample: 'AI that works with you.' },
    { role: 'H2', family: 'Founders Grotesk', weight: 400, trackingEm: -0.015, leading: 1, desktop: 48, mobile: 32, sample: 'From idea to operation.' },
    { role: 'H3', family: 'Founders Grotesk', weight: 400, trackingEm: -0.015, leading: 1, desktop: 32, mobile: 24, sample: 'Built into your workflow.' },
    { role: 'Body', family: 'PP Neue Montreal', weight: 400, trackingEm: 0, leading: 1.4, desktop: 16, mobile: 16, sample: 'Our engineers embed with your team and ship AI agents into the workflows you already run.' },
    { role: 'Caption', family: 'PP Neue Montreal', weight: 400, trackingEm: 0, leading: 1.4, desktop: 14, mobile: 14, sample: 'Supporting details, labels and image captions.' },
  ],
};

export const lineHeightPx = (size: number, leading: number) => Number((size * leading).toFixed(1));
