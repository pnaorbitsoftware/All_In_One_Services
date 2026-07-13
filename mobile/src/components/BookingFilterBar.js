import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { SORT_OPTIONS } from "../lib/bookingGrouping";
import { colors, radius, useThemeColors } from "../theme";
import ChipRow from "./ChipRow";

const DATE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

// Search + date-range filter + sort, shared by client and provider booking
// history views (Task 4). Kept as one component so both sides behave the
// same and there's a single place to fix bugs / tune performance.
function BookingFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search by ID, name, service...",
  dateFilter,
  onDateFilterChange,
  customRange,
  onCustomRangeChange,
  sortKey,
  onSortChange,
}) {
  const theme = useThemeColors();

  return (
    <View style={styles.wrap}>
      <View style={[styles.searchShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={19} color={theme.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery ? (
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={theme.textMuted}
            onPress={() => onSearchChange("")}
            suppressHighlighting
          />
        ) : null}
      </View>

      <ChipRow options={DATE_OPTIONS} value={dateFilter} onChange={onDateFilterChange} />

      {dateFilter === "custom" ? (
        <View style={styles.customRow}>
          <TextInput
            value={customRange?.from || ""}
            onChangeText={(text) => onCustomRangeChange({ ...customRange, from: text })}
            placeholder="From (YYYY-MM-DD)"
            placeholderTextColor={theme.textMuted}
            style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
          <TextInput
            value={customRange?.to || ""}
            onChangeText={(text) => onCustomRangeChange({ ...customRange, to: text })}
            placeholder="To (YYYY-MM-DD)"
            placeholderTextColor={theme.textMuted}
            style={[styles.dateInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          />
        </View>
      ) : null}

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.textMuted }]}>Sort</Text>
        <ChipRow options={SORT_OPTIONS} value={sortKey} onChange={onSortChange} />
      </View>
    </View>
  );
}

export default React.memo(BookingFilterBar);

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  searchShell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 8,
  },
  customRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  sortRow: {
    gap: 6,
  },
  sortLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
