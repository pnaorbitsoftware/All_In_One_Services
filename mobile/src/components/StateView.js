import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";

export function LoadingState({ label = "Loading..." }) {
  const theme = useThemeColors();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={theme.teal} size="large" />
      <Text style={[styles.copy, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, copy, icon = "tray" }) {
  const theme = useThemeColors();
  return (
    <View style={styles.state}>
      <View style={[styles.icon, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={26} color={theme.teal} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {copy ? <Text style={[styles.copy, { color: theme.textMuted }]}>{copy}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = "Something went wrong", copy, onRetry }) {
  const theme = useThemeColors();
  return (
    <View style={styles.state}>
      <View style={[styles.icon, { backgroundColor: theme.roseSoft }]}>
        <MaterialCommunityIcons name="wifi-alert" size={26} color={theme.rose} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {copy ? <Text style={[styles.copy, { color: theme.textMuted }]}>{copy}</Text> : null}
      {onRetry ? <ActionButton title="Try again" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    maxWidth: "92%",
    textAlign: "center",
  },
  errorIcon: {
    backgroundColor: colors.roseSoft,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 54,
  },
  state: {
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
    minHeight: 220,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
});
