import React, { createContext, useContext } from "react";
import { PixelRatio, Platform, StyleSheet } from "react-native";
import { darkPalette, palette } from "./theme/colors";
import { radii } from "./theme/radius";
import { shadows } from "./theme/shadows";

export const colors = {
  ...palette,
  teal: palette.primary,
  tealSoft: palette.primarySoft,
  blue: palette.primary,
  violet: palette.primary,
  violetSoft: palette.primarySoft,
  mint: palette.secondary,
  mintSoft: "#E7F8F4",
  amber: palette.warning,
  amberSoft: "#fef3c7",
  rose: palette.danger,
  roseSoft: "#ffe4e6",
  success: palette.success,
  successSoft: "#d1fae5",
  slate: palette.text,
};

export const darkColors = {
  ...colors,
  ...darkPalette,
  teal: palette.primary,
  tealSoft: darkPalette.primarySoft,
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
  ...radii,
};

export const shadow = shadows.card;

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
