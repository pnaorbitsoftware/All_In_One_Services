import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, useThemeColors } from "../theme";

const notificationIconByType = {
  booking: "calendar-check-outline",
  payment: "credit-card-check-outline",
  provider: "account-hard-hat-outline",
  offer: "tag-outline",
  service: "briefcase-check-outline",
};

function NotificationCard({ notification, onPress }) {
  const theme = useThemeColors();
  const unread = !notification?.read;
  const type = notification?.type || "service";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(notification)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        unread && { backgroundColor: theme.tealSoft },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: unread ? theme.surface : theme.surfaceMuted }]}>
        <MaterialCommunityIcons name={notificationIconByType[type] || "bell-outline"} size={22} color={theme.teal} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {notification?.title || "Service update"}
          </Text>
          {unread ? <View style={[styles.dot, { backgroundColor: theme.teal }]} /> : null}
        </View>
        <Text style={[styles.message, { color: theme.textMuted }]}>
          {notification?.message || "Your ServiceHub updates will appear here."}
        </Text>
        {notification?.time ? (
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {notification.time}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default React.memo(NotificationCard);

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  card: {
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    ...shadow,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  icon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
});
