import React, { createContext, useContext } from "react";
import { PixelRatio, StyleSheet } from "react-native";

export const colors = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#eef2f7",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#dbe4ef",
  teal: "#0f766e",
  tealSoft: "#ccfbf1",
  blue: "#2563eb",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  rose: "#e11d48",
  roseSoft: "#ffe4e6",
  success: "#059669",
  successSoft: "#d1fae5",
  slate: "#111827",
};

export const darkColors = {
  ...colors,
  background: "#0b1220",
  surface: "#111827",
  surfaceMuted: "#1f2937",
  text: "#f8fafc",
  textMuted: "#cbd5e1",
  border: "#334155",
  tealSoft: "#134e4a",
  amberSoft: "#451a03",
  roseSoft: "#4c0519",
  successSoft: "#064e3b",
  slate: "#020617",
};

export function getAppearanceColors(appearance = "light") {
  return appearance === "dark" ? darkColors : colors;
}

const ThemeColorsContext = createContext(colors);

export function applyAppearanceMode(appearance = "light") {
  return appearance === "dark" ? "dark" : "light";
}

export function ThemeColorsProvider({ value, children }) {
  return React.createElement(ThemeColorsContext.Provider, { value }, children);
}

export function useThemeColors() {
  return useContext(ThemeColorsContext);
}

export const type = {
  tiny: 11,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title: 20,
  hero: 30,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const shadow = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

export const hairline = StyleSheet.hairlineWidth || 1 / PixelRatio.get();

export function responsiveMetrics(width) {
  const isSmallPhone = width < 360;
  const isTablet = width >= 720;
  const isLargeTablet = width >= 1040;

  return {
    isSmallPhone,
    isTablet,
    numColumns: isLargeTablet ? 3 : isTablet ? 2 : 1,
    gutter: isSmallPhone ? 10 : isTablet ? 18 : 14,
    pagePadding: Math.round(Math.min(Math.max(width * 0.045, isSmallPhone ? 12 : 16), 34)),
    heroSize: isTablet ? 36 : isSmallPhone ? 25 : 30,
    cardRadius: isTablet ? radius.xl : radius.lg,
  };
}
