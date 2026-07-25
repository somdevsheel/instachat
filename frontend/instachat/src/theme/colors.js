export default {
  bg: '#0A0714',
  surface: '#19152C',
  surfaceRaised: '#211D33',
  border: 'rgba(123, 92, 246, 0.16)',
  borderSoft: 'rgba(123, 92, 246, 0.28)',

  textPrimary: '#FFFFFF',
  textSecondary: '#848299',
  textFaint: '#514F66',

  accent: '#7B5CF6',
  accentLight: '#A78BFA',
  accentPink: '#F451A0',

  danger: '#F6534A',
  success: '#2ECB6F',
  warning: '#FBBF24',

  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases — kept so screens not yet migrated to the named
  // tokens above still pick up the Nebula palette (they already
  // reference these keys) instead of the old light Instagram-blue theme.
  primary: '#7B5CF6',
  background: '#0A0714',
  error: '#F6534A',
  inputBackground: '#211D33',
};

export const gradients = {
  brand: ['#7B5CF6', '#F451A0'],
  post: ['#7B5CF6', '#A855F7'],
  reel: ['#EF4444', '#EC4899'],
  story: ['#06B6D4', '#3B82F6'],
  storyRing: ['#7B5CF6', '#F451A0'],
};
