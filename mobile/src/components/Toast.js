import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, shadow, useThemeColors } from "../theme";

export default function Toast({ message, onClose }) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  if (!message) return null;

  const isError = /failed|could not|not found|please|required|expired|invalid|error|network/i.test(message);

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.accent, { backgroundColor: isError ? theme.rose : theme.teal }]} />
        <MaterialCommunityIcons
          name={isError ? "alert-circle-outline" : "check-circle-outline"}
          size={22}
          color={isError ? theme.rose : theme.teal}
        />
        <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
          {message}
        </Text>
        <Pressable onPress={onClose} style={styles.close}>
          <MaterialCommunityIcons name="close" size={18} color={theme.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    alignSelf: "stretch",
    backgroundColor: colors.teal,
    borderBottomLeftRadius: radius.md,
    borderTopLeftRadius: radius.md,
    width: 5,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    paddingRight: 10,
    ...shadow,
  },
  close: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    minWidth: 38,
  },
  errorAccent: {
    backgroundColor: colors.rose,
  },
  message: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingVertical: 12,
  },
  wrap: {
    left: 12,
    position: "absolute",
    right: 12,
    top: 0,
    zIndex: 20,
  },
});
