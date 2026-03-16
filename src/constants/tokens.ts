// LYNX Design Tokens — Slate/Violet palette

export const Colors = {
  // Backgrounds
  bg:           '#0D0F14',
  surface1:     '#111318',
  surface2:     '#161A22',
  surface3:     '#1C2130',

  // Ice text
  ice:          '#E8EEFF',
  ice2:         '#B0B8D0',
  ice3:         '#5A6480',

  // Accent — cool violet
  accent:       '#7B8FFF',
  accentBg:     '#7B8FFF18',
  accentBorder: '#7B8FFF40',

  // Borders
  border:       '#1E2435',
  border2:      '#171C28',

  // Utilities
  white:        '#FFFFFF',
  error:        '#FF5F6D',
  success:      '#4FD1A5',
  online:       '#4FD1A5',
} as const;

export const Typography = {
  // Font families
  light:    'Outfit-Light',
  regular:  'Outfit-Regular',
  medium:   'Outfit-Medium',
  semibold: 'Outfit-SemiBold',

  // Weights (numeric)
  300: '300',
  400: '400',
  500: '500',
  600: '600',

  // Named sizes
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
