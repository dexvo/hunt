// HUNT Design Tokens — Blood Red on Near-Black
// Brand font: DM Sans | UI font: Inter

export const Colors = {
  // Backgrounds
  bg:           '#0A0A0C',
  surface1:     '#111114',
  surface2:     '#18181C',
  surface3:     '#1F1F24',

  // Ice text
  ice:          '#F2F0F4',
  ice2:         '#A8A4B0',
  ice3:         '#5C5868',

  // Accent — blood red
  accent:       '#E8364B',
  accentBg:     '#E8364B14',
  accentBorder: '#E8364B2E',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  border2:      'rgba(255,255,255,0.04)',

  // Role colors
  roleTop:      '#E8364B',
  roleBottom:   '#34D399',

  // Utilities
  white:        '#FFFFFF',
  error:        '#FF5F6D',
  success:      '#34D399',
  online:       '#34D399',
} as const;

export const Typography = {
  // Brand font (logo, headings, names, badges)
  brand:    'DMSans-Bold',
  brandMed: 'DMSans-SemiBold',

  // UI font (body, labels, buttons, meta)
  light:    'Inter-Light',
  regular:  'Inter-Regular',
  medium:   'Inter-Medium',
  semibold: 'Inter-SemiBold',

  // Weights (numeric)
  300: '300',
  400: '400',
  500: '500',
  600: '600',
  700: '700',

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

  // Letter spacing
  tight: -0.5,
  logo:  5,
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
