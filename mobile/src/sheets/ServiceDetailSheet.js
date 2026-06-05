import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import { colors, radius, useThemeColors } from "../theme";

export default function ServiceDetailSheet({ service, visible, onClose, onBook }) {
  const theme = useThemeColors();
  if (!service) return null;

  const features = service.features?.length ? service.features : [service.category, "On-site visit", "Work inspection"];

  return (
    <ModalSheet
      visible={visible}
      title={service.name}
      subtitle={`${service.category} | ${service.location}`}
      onClose={onClose}
      footer={
        <View style={styles.footerActions}>
          <ActionButton title="Book now" icon="calendar-check-outline" onPress={() => onBook(service)} style={styles.footerButton} />
        </View>
      }
    >
      <Image source={{ uri: service.image }} style={[styles.image, { backgroundColor: theme.surfaceMuted }]} resizeMode="cover" />
      <View style={styles.stats}>
        <DetailStat icon="star-outline" label="Rating" value={`${service.rating || 0} (${service.reviews || 0})`} />
        <DetailStat icon="clock-outline" label="Response" value={service.responseTime || "~1 hr"} />
        <DetailStat icon="cash" label="Price" value={service.price || "Price not set"} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>{service.about || service.description}</Text>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Included</Text>
        <View style={styles.featureWrap}>
          {features.map((feature) => (
            <View key={feature} style={[styles.feature, { backgroundColor: theme.tealSoft }]}>
              <MaterialCommunityIcons name="check" size={14} color={theme.teal} />
              <Text style={[styles.featureText, { color: theme.teal }]} numberOfLines={1}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </ModalSheet>
  );
}

function DetailStat({ icon, label, value }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surfaceMuted }]}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.teal} />
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  feature: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  featureText: {
    color: colors.teal,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
  },
  featureWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  footerActions: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  image: {
    aspectRatio: 1.7,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    width: "100%",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  stat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    gap: 3,
    minWidth: 0,
    padding: 11,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  statValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
});
