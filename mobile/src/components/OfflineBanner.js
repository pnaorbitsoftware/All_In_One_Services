import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

export default function OfflineBanner({ visible, onRetry }) {
  const theme = useThemeColors();

  if (!visible) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.roseSoft, borderColor: theme.rose }]}>
      <MaterialCommunityIcons name="wifi-off" size={22} color={theme.rose} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.rose }]}>No Internet Connection</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Please check your network and try again.</Text>
      </View>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
          <Text style={[styles.retryText, { color: theme.rose }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.75,
  },
  retry: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "900",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.rose,
    fontSize: 14,
    fontWeight: "900",
  },
});
