import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

// Horizontally scrollable row of selectable chips. Used for history tabs,
// date-range filters, and sort options so those three features share one
// implementation instead of three.
function ChipRow({ options = [], value, onChange, getLabel }) {
  const theme = useThemeColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {options.map((option) => {
        const active = option.key === value;
        const label = getLabel ? getLabel(option) : option.label;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.key}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: active ? theme.teal : theme.surfaceMuted, borderColor: active ? theme.teal : theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, { color: active ? "#ffffff" : theme.text }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default React.memo(ChipRow);

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.8,
  },
});
