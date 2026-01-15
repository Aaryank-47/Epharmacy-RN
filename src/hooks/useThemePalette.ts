import { useColorScheme, Platform } from 'react-native';

const COLORS = {
    // Legacy Colors (Restored)
    lightSurface: '#FFFFFF',
    darkSurface: '#181A20',
    lightAccent: '#0e0e0eff',
    darkAccent: '#cf7393ff',

    // Existing Helpers
    white: '#FFFFFF',
    black: '#1F2937',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    darkBgLight: '#2A2A2A', // Adjusted slightly for compatibility
    success: '#10B981',
    error: '#EF4444',
    placeholderLight: '#666',
    placeholderDark: '#999',
};

const useThemePalette = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    const surfaceColor = isDark ? COLORS.darkSurface : COLORS.lightSurface;
    const accentColor = isDark ? COLORS.darkAccent : COLORS.lightAccent;

    return {
        isDark,
        // Colors (Mapped to new scheme)
        primary: accentColor,
        primaryDark: isDark ? '#b05f7c' : '#000000', // Derived from accents
        white: COLORS.white,
        black: COLORS.black,
        success: COLORS.success,
        error: COLORS.error,

        // Backgrounds
        darkBg: COLORS.darkSurface,
        darkBgLight: COLORS.darkBgLight,
        lightGray: COLORS.lightGray,

        // Dynamic
        textColor: isDark ? COLORS.white : COLORS.black,
        backgroundColor: surfaceColor,
        headerBorderColor: isDark ? '#2A2A2A' : '#E5E7EB',
        inputBg: isDark ? '#2A2A2A' : COLORS.lightGray,
        placeholderColor: isDark ? COLORS.placeholderDark : COLORS.placeholderLight,

        // Tab & Keys required by other components
        accentColor: accentColor,
        surfaceColor: surfaceColor,
        ctaGradient: isDark ? ['#f472b6', '#f472b6'] : ['#000000', '#000000'], // Legacy Gradients

        // Status Bar
        statusBarStyle: (isDark ? 'light-content' : 'dark-content') as 'light-content' | 'dark-content',
        statusBarBackground: surfaceColor,

        // Fonts (Legacy)
        serifFontFamily: Platform.select({ ios: "Times New Roman", android: "serif", default: "serif" }) ?? "serif",
    };
};

export { useThemePalette };
export default useThemePalette;
