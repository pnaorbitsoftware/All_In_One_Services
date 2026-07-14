import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, Alert, Linking } from "react-native";

import { formatBookingDate, formatBookingTime, formatPrice, normalizeTrackingStatus } from "../lib/formatters";
import { getCurrentReadableLocation } from "../lib/location";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";
import StatusPill from "./StatusPill";

function JobCard({ booking, type, onAccept, onReject, onComplete, onCancel, onEstimate, onUpdateTrackingStatus, onRequestLocation }) {
  const theme = useThemeColors();
  const isAvailable = type === "available";
  const normalizedStatus = normalizeTrackingStatus(booking.status);
  const canComplete = !["Completed", "Cancelled"].includes(normalizedStatus);
  const nextTrackingAction = getNextTrackingAction(normalizedStatus);
  const estimateAccepted = booking.estimateStatus === "accepted";
  const paymentPaid = booking.paymentStatus === "paid" || booking.clientPaymentStatus === "paid";

  const handleOpenClientLocation = async () => {
    const lat = Number(booking.addressLocation?.latitude || booking.clientLocation?.latitude || booking.clientLatitude || 0);
    const lng = Number(booking.addressLocation?.longitude || booking.clientLocation?.longitude || booking.clientLongitude || 0);

    const hasCoords = Boolean(lat && lng && Number.isFinite(lat) && Number.isFinite(lng));

    if (hasCoords) {
      let providerLat = null;
      let providerLng = null;
      try {
        const providerLoc = await getCurrentReadableLocation();
        if (providerLoc) {
          providerLat = providerLoc.latitude;
          providerLng = providerLoc.longitude;
        }
      } catch (err) {
        // Ignored
      }

      const intentUrl = `google.navigation:q=${lat},${lng}&mode=d`;
      const fallbackUrl = providerLat && providerLng
        ? `https://www.google.com/maps/dir/?api=1&origin=${providerLat},${providerLng}&destination=${lat},${lng}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

      try {
        const canOpenIntent = await Linking.canOpenURL(intentUrl);
        if (canOpenIntent) {
          await Linking.openURL(intentUrl);
          return;
        }
      } catch (err) {
        // Ignored
      }

      try {
        await Linking.openURL(fallbackUrl);
      } catch (err) {
        Alert.alert("Maps Launch Error", `Failed to open maps: ${err.message || err}`);
      }
    } else {
      const address = String(booking.address || "").trim();
      if (address) {
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        try {
          await Linking.openURL(searchUrl);
        } catch (err) {
          Alert.alert("Maps Launch Error", `Failed to open maps: ${err.message || err}`);
        }
      } else {
        Alert.alert("Location Unavailable", "Client location is unavailable.");
      }
    }
  };

  const startWorkLocked = nextTrackingAction?.status === "Service Started" && (!estimateAccepted || !paymentPaid);
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
        <StatusPill
          status={
            String(booking.status).toLowerCase() === "cancelled" &&
            String(booking.cancelledBy).toLowerCase() === "provider"
              ? "Provider Rejected"
              : booking.status
          }
        />
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
        {booking.status && ["cancelled", "Cancelled"].includes(booking.status) && booking.cancellationReason ? (
          <View style={styles.line}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
            <Text style={[styles.lineText, { color: theme.rose }]} numberOfLines={2}>
              {booking.cancelledBy === "provider" ? "Rejection reason" : "Cancellation reason"}: {booking.cancellationReason}
            </Text>
          </View>
        ) : null}
        {booking.status && ["rejected", "Rejected"].includes(booking.status) && (booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason) ? (
          <View style={styles.line}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
            <Text style={[styles.lineText, { color: theme.rose }]} numberOfLines={2}>
              Rejection reason: {booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason}
            </Text>
          </View>
        ) : null}
      </View>
      {isAvailable ? (
        <View style={{ gap: 10 }}>
          <View style={styles.actions}>
            <ActionButton
              title="Accept request"
              icon="check-circle-outline"
              onPress={() => onAccept?.(booking)}
              style={styles.action}
            />
            <ActionButton
              title="Reject Request"
              icon="close-circle-outline"
              variant="danger"
              onPress={() => onReject?.(booking)}
              style={styles.action}
            />
          </View>
          <ActionButton
            title="📍 Client Location"
            icon="navigation"
            variant="secondary"
            onPress={handleOpenClientLocation}
          />
        </View>
      ) : canComplete ? (
        <View style={{ gap: 10 }}>
          {startWorkLocked ? (
            <Text style={[styles.workflowMessage, { color: theme.rose, backgroundColor: theme.roseSoft }]}>
              Submit estimate and wait for client payment before starting work.
            </Text>
          ) : null}
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
            {nextTrackingAction ? (
              <ActionButton
                title={nextTrackingAction.label}
                icon={nextTrackingAction.icon}
                disabled={startWorkLocked}
                onPress={() => onUpdateTrackingStatus?.(booking, nextTrackingAction.status)}
                style={styles.action}
              />
            ) : null}
            <ActionButton
              title="Cancel"
              icon="close-circle-outline"
              variant="danger"
              onPress={() => onCancel(booking)}
              style={styles.action}
            />
          </View>
          <ActionButton
            title="📍 Client Location"
            icon="navigation"
            variant="secondary"
            onPress={handleOpenClientLocation}
          />
        </View>
      ) : null}
    </View>
  );
}




function getNextTrackingAction(status) {
  switch (status) {
    case "Confirmed":
      return { status: "Provider Assigned", label: "Mark as Assigned", icon: "account-check-outline" };
    case "Provider Assigned":
      return { status: "On The Way", label: "Mark as On The Way", icon: "truck-fast-outline" };
    case "On The Way":
      return { status: "Arrived", label: "Mark as Arrived", icon: "map-marker-check-outline" };
    case "Arrived":
      return { status: "Service Started", label: "Start Service", icon: "play-circle-outline" };
    case "Service Started":
      return { status: "Completed", label: "Complete Service", icon: "check-decagram-outline" };
    default:
      return null;
  }
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
  workflowMessage: {
    borderRadius: radius.md,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
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

