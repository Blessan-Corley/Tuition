/**
 * Minimalist, editorial design tokens.
 * Zero neon gradients, zero AI slop, clean typography with high contrast.
 * Tailored for senior readability and comfortable touch targets.
 */

export const THEME = {
  colors: {
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9', // Slate 100
    border: '#E2E8F0', // Slate 200
    borderStrong: '#CBD5E1', // Slate 300

    // Text
    textPrimary: '#0F172A', // Slate 900 - High contrast
    textSecondary: '#475569', // Slate 600 - Readable
    textMuted: '#64748B', // Slate 500

    // Brand & Status
    primary: '#0F172A', // Crisp slate black
    primaryHover: '#1E293B',
    accent: '#1D4ED8', // Pure classic blue for primary links/highlights
    accentLight: '#EFF6FF',

    // Due Milestone (12 classes reached)
    dueBadgeBg: '#FEF3C7', // Amber 100
    dueBadgeBorder: '#F59E0B', // Amber 500
    dueBadgeText: '#92400E', // Amber 900

    // Success / Completed
    successBadgeBg: '#ECFDF5', // Emerald 50
    successBadgeBorder: '#10B981', // Emerald 500
    successBadgeText: '#065F46', // Emerald 800

    // Destructive (Safe delete inside settings)
    dangerBg: '#FEF2F2',
    dangerBorder: '#FCA5A5',
    dangerText: '#991B1B',
  },

  typography: {
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: '#0F172A',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#0F172A',
    },
    bodyLarge: {
      fontSize: 17,
      fontWeight: '500' as const,
      color: '#0F172A',
      lineHeight: 24,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      color: '#475569',
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#64748B',
    },
  },

  touchTarget: {
    minHeight: 52, // Comfortable 52px touch targets for senior usability
    borderRadius: 12,
  },
};
