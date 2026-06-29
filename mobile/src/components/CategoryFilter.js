import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import { iconForCategory } from "../data/catalog";
import { colors, radius, useThemeColors } from "../theme";

function CategoryFilter({ categories, selectedCategory, onChange }) {
  const theme = useThemeColors();
  const renderItem = useCallback(
    ({ item }) => {
      const active = item === selectedCategory;

      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(item)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: active ? theme.teal : theme.surface,
              borderColor: active ? theme.teal : theme.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={item === "All" ? "apps" : iconForCategory(item)}
            size={18}
            color={active ? "#ffffff" : theme.text}
          />
          <Text
            numberOfLines={1}
            style={[styles.chipText, { color: active ? "#ffffff" : theme.text }]}
          >
            {item}
          </Text>
        </Pressable>
      );
    },
    [onChange, selectedCategory, theme]
  );

  return (
    <FlatList
      data={categories}
      horizontal
      keyExtractor={(item) => item}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
    />
  );
}

export default React.memo(CategoryFilter);

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginRight: 9,
    minHeight: 42,
    paddingHorizontal: 13,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },
  list: {
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
