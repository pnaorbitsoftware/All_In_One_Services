import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";

function MetaRow({ icon, text }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.metaRow, { backgroundColor: theme.surfaceMuted }]}>
      <MaterialCommunityIcons name={icon} size={15} color={theme.textMuted} />
      <Text numberOfLines={1} style={[styles.metaText, { color: theme.textMuted }]}>
        {text}
      </Text>
    </View>
  );
}

function ServiceCard({ service, onBook, onViewDetails, style }) {
  const theme = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onViewDetails(service)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Image
        source={{ uri: service.image }}
        style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.iconBadge, { backgroundColor: theme.tealSoft }]}>
            <MaterialCommunityIcons name={service.icon} size={23} color={theme.teal} />
          </View>
          <View style={styles.titleWrap}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {service.name}
            </Text>
            <Text numberOfLines={1} style={[styles.category, { color: theme.textMuted }]}>
              {service.category}
            </Text>
          </View>
        </View>
        <Text numberOfLines={2} style={[styles.description, { color: theme.textMuted }]}>
          {service.description}
        </Text>
        <View style={styles.metaGrid}>
          <MetaRow icon="map-marker-outline" text={service.location} />
          <MetaRow icon="star-outline" text={`${service.rating || 0} (${service.reviews || 0})`} />
          <MetaRow icon="clock-outline" text={service.responseTime} />
          <MetaRow icon="cash" text={service.price} />
        </View>
        <View style={styles.actions}>
          <ActionButton
            title="Details"
            icon="information-outline"
            variant="secondary"
            onPress={() => onViewDetails(service)}
            style={styles.action}
          />
          <ActionButton
            title="Book"
            icon="calendar-check-outline"
            onPress={() => onBook(service)}
            style={styles.action}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(ServiceCard);

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  body: {
    gap: 12,
    padding: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
    ...shadow,
  },
  category: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 46,
  },
  image: {
    aspectRatio: 1.78,
    backgroundColor: colors.surfaceMuted,
    width: "100%",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  metaText: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.92,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
});
