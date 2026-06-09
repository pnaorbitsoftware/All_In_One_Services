import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { imageForService } from "../data/catalog";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";

function resolveImageSource(service = {}) {
  if (typeof service.image === "number") return service.image;
  if (typeof service.image === "string" && service.image.trim()) return { uri: service.image.trim() };
  return imageForService(service);
}

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
  const imageSource = resolveImageSource(service);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onViewDetails(service)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.titleWrap}>
          {service.responseTime ? (
            <Text numberOfLines={1} style={[styles.timeBadge, { backgroundColor: theme.tealSoft, color: theme.teal }]}> 
              {service.responseTime}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}> 
            {service.name}
          </Text>
          <Text numberOfLines={1} style={[styles.category, { color: theme.textMuted }]}> 
            {service.category}
          </Text>
        </View>
        <Text numberOfLines={2} style={[styles.description, { color: theme.textMuted }]}> 
          {service.description}
        </Text>
        <View style={styles.metaGrid}>
          <MetaRow icon="map-marker-outline" text={service.location} />
          <MetaRow icon="star-outline" text={`${service.rating || 0} (${service.reviews || 0})`} />
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
    borderRadius: radius.lg,
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
  image: {
    aspectRatio: 1.65,
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
  timeBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 2,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleWrap: {
    minWidth: 0,
  },
});
