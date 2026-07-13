import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

// Generic horizontally-scrolling stat pill strip, shared by the client and
// provider dashboards so the "statistics" requirement isn't implemented
// twice. `items` is [{ label, value }].
function StatsStrip({ items = [] }) {
  const theme = useThemeColors();

  if (!items.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {items.map((item) => (
        <View key={item.label} style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default React.memo(StatsStrip);

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingVertical: 2,
  },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    marginTop: 2,
  },
});
