const AVATAR_PALETTE = [
  { bg: 'rgba(182,236,19,0.18)', text: '#4a6b00' },  // brand green
  { bg: 'rgba(134,239,172,0.25)', text: '#166534' },  // sage
  { bg: 'rgba(147,197,253,0.25)', text: '#1d4ed8' },  // sky
  { bg: 'rgba(252,165,165,0.25)', text: '#b91c1c' },  // rose
  { bg: 'rgba(252,211,77,0.25)',  text: '#92400e' },  // amber
  { bg: 'rgba(196,181,253,0.25)', text: '#6d28d9' },  // violet
];

export type AvatarColor = { bg: string; text: string };

export function getAvatarColor(name: string | null | undefined): AvatarColor {
  if (!name) return AVATAR_PALETTE[0];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
