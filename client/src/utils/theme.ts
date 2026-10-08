export const theme = {
    colors: {
        primary: '#E9151C',
        primaryPressed: '#C81018',
        primaryForeground: '#FFFFFF',

        backgroundPrimary: '#19191A',
        backgroundSecondary: '#0F0F0E',
        backgroundTertiary: '#292928',

        textPrimary: '#ECEDEC',
        textSecondary: '#CACACB',
        textMuted: '#979796',

        border: '#333333',
        input: '#1F1F1F',
        
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        late: '#A855F7',

        // translucent tints used behind status text (badges, pills)
        errorMuted: '#EF44441F',
        warningMuted: '#F59E0B1F',
        successMuted: '#22C55E1F',
        lateMuted: '#A855F71F',
        primaryGlow: '#E9151C66',
        primaryMuted: '#E9151C1A',

        icon: '#F5F5F5',
        iconMuted: '#A3A3A3',
        overlay: '#00000099',
    },
} as const;

export type ThemeColors = typeof theme.colors;