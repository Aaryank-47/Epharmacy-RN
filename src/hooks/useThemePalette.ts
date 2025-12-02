import { useColorScheme } from "nativewind";
import { Platform } from "react-native";
import type { StatusBarStyle } from "react-native";

type LottieFilter = {
  keypath: string;
  color: string;
};

type ThemePalette = {
  isDark: boolean;
  surfaceColor: string;
  accentColor: string;
  iconMutedBackground: string;
  statusBarStyle: StatusBarStyle;
  statusBarBackground: string;
  lottieFilters?: LottieFilter[];
  ctaGradient: [string, string];
  serifFontFamily: string;
};

const LIGHT_SURFACE = "#FFFFFF";
const DARK_SURFACE = "#181A20";
const LIGHT_ACCENT = "#0e0e0eff";
const DARK_ACCENT = "#cf7393ff";
const LIGHT_CTA_GRADIENT: [string, string] = ["#000000", "#000000"];
const DARK_CTA_GRADIENT: [string, string] = ["#f472b6", "#f472b6"];
const SERIF_FONT = Platform.select({ ios: "Times New Roman", android: "serif", default: "serif" }) ?? "serif";

export const useThemePalette = (): ThemePalette => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const surfaceColor = isDark ? DARK_SURFACE : LIGHT_SURFACE;

  return {
    isDark,
    surfaceColor,
    accentColor: isDark ? DARK_ACCENT : LIGHT_ACCENT,
    iconMutedBackground: isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)",
    statusBarStyle: isDark ? "light-content" : "dark-content",
    statusBarBackground: surfaceColor,
    ctaGradient: isDark ? DARK_CTA_GRADIENT : LIGHT_CTA_GRADIENT,
    serifFontFamily: SERIF_FONT,
    lottieFilters: isDark
      ? [
          { keypath: "feather gradient", color: surfaceColor },
          { keypath: "Rectangle 1", color: surfaceColor },
        ]
      : undefined,
  };
};

export default useThemePalette;
