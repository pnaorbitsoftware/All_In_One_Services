import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatBookingDate, formatBookingTime, formatPrice } from "../lib/formatters";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";
import StatusPill from "./StatusPill";

function JobCard({ booking, type, onAccept, onComplete, onCancel, onEstimate }) {
  const theme = useThemeColors();
  const isAvailable = type === "available";
  const canComplete = !["completed", "cancelled"].includes(booking.status);
  const canEstimate =
    !isAvailable &&
    canComplete &&
    !["submitted", "accepted"].includes(String(booking.estimateStatus || "not_submitted"));

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {booking.service}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {booking.name} | {booking.phone}
          </Text>
        </View>
        <StatusPill status={booking.status} />
      </View>
      <View style={styles.lines}>
        <View style={styles.line}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.lineText, { color: theme.textMuted }]} numberOfLines={2}>{booking.address}</Text>
        </View>
        <View style={styles.line}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.textMuted} />
          <Text style={[styles.lineText, { color: theme.textMuted }]} numberOfLines={1}>
            {formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}
          </Text>
        </View>
        <View style={styles.line}>
          <MaterialCommunityIcons name="cash" size={16} color={theme.textMuted} />
          <Text style={[styles.lineText, { color: theme.textMuted }]} numberOfLines={1}>
            {booking.serviceDuration} | {formatPrice(booking.costEstimate)}
          </Text>
        </View>
      </View>
      {isAvailable ? (
        <ActionButton title="Accept request" icon="check-circle-outline" onPress={() => onAccept(booking)} />
      ) : canComplete ? (
        <View style={styles.actions}>
          {canEstimate ? (
            <ActionButton
              title="Estimate"
              icon="cash-check"
              variant="secondary"
              onPress={() => onEstimate(booking)}
              style={styles.action}
            />
          ) : null}
          <ActionButton
            title="Complete"
            icon="check-decagram-outline"
            onPress={() => onComplete(booking)}
            style={styles.action}
          />
          <ActionButton
            title="Cancel"
            icon="close-circle-outline"
            variant="danger"
            onPress={() => onCancel(booking)}
            style={styles.action}
          />
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(JobCard);

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 15,
    ...shadow,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  line: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  lineText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  lines: {
    gap: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
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
});
