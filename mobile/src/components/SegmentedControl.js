import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

function SegmentedControl({ value, options, onChange, disabled = false }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.shell, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.item,
              active && { backgroundColor: theme.slate },
              disabled && styles.disabled,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, { color: active ? "#ffffff" : theme.textMuted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default React.memo(SegmentedControl);

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 0,
    paddingHorizontal: 10,
  },
  disabled: {
    opacity: 0.72,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.8,
  },
  shell: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 6,
    padding: 5,
  },
});
