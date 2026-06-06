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
  const isAdmin = user?.role === "admin";
  const items = isAdmin
    ? [
        { id: "admin", label: t("nav.admin", "Admin"), icon: "shield-account-outline" },
        { id: "home", label: t("nav.home", "Home"), icon: "home-variant-outline" },
        { id: "account", label: t("nav.account", "Account"), icon: "account-circle-outline" },
      ]
    : isProvider
    ? [
        { id: "home", label: t("nav.home", "Home"), icon: "home-variant-outline" },
        { id: "provider", label: t("nav.bookings", "Bookings"), icon: "calendar-check-outline" },
        { id: "payments", label: t("nav.payments", "Payments"), icon: "credit-card-check-outline" },
        { id: "account", label: t("nav.account", "Account"), icon: "account-circle-outline" },
      ]
    : [
        { id: "home", label: t("nav.home", "Home"), icon: "home-variant-outline" },
        { id: "services", label: t("nav.services", "Services"), icon: "view-grid-outline" },
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
              active && { backgroundColor: theme.tealSoft },
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
    borderRadius: 8,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
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
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    ...shadow,
  },
});
