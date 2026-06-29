import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, hairline, shadow, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;

function BottomNav({ activeTab, onChange, user, t = defaultT }) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const isProvider = user?.role === "provider";
  const items = isProvider
    ? [
        { id: "home", label: t("nav.home", "Home"), icon: "home-variant-outline" },
        { id: "provider", label: t("nav.bookings", "Bookings"), icon: "calendar-check-outline" },
        { id: "payments", label: t("nav.payments", "Payments"), icon: "credit-card-check-outline" },
        { id: "account", label: t("nav.account", "Account"), icon: "account-circle-outline" },
      ]
      : [
        { id: "home", label: t("nav.home", "Home"), icon: "home-variant-outline" },
        { id: "services", label: t("nav.services", "Services"), icon: "view-grid-outline" },
        { id: "bookings", label: t("nav.bookings", "Bookings"), icon: "calendar-check-outline" },
        { id: "providers", label: t("nav.providers", "Providers"), icon: "account-hard-hat-outline" },
        { id: "account", label: t("nav.account", "Account"), icon: "account-circle-outline" },
      ];

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {items.map((item) => {
        const active = activeTab === item.id;
        return (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.item,
              active && { backgroundColor: theme.tealSoft, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              color={active ? theme.teal : theme.textMuted}
              size={23}
            />
            <Text style={[styles.label, { color: active ? theme.teal : theme.textMuted }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default React.memo(BottomNav);

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 7,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.75,
  },
  shell: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: hairline,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    ...shadow,
  },
});

