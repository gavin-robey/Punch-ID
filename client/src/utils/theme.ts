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

        icon: '#F5F5F5',
        iconMuted: '#A3A3A3',
        overlay: '#00000099',
    },
} as const;

export type ThemeColors = typeof theme.colors;