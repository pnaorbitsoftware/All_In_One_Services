import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, Linking, useWindowDimensions } from "react-native";
import { showConfirm } from "../lib/confirm";

import { formatBookingDate, formatBookingTime, formatPrice, normalizeTrackingStatus } from "../lib/formatters";
import { getCurrentReadableLocation } from "../lib/location";
import { openDirections } from "../lib/maps";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";
import StatusPill from "./StatusPill";

function JobCard({ booking, type, onAccept, onReject, onComplete, onCancel, onEstimate, onUpdateTrackingStatus, onRequestLocation, submitting = false }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const isAvailable = type === "available";
  const normalizedStatus = normalizeTrackingStatus(booking.status);
  const canComplete = !["Completed", "Cancelled"].includes(normalizedStatus);
  const nextTrackingAction = getNextTrackingAction(normalizedStatus);
  const estimateAccepted = booking.estimateStatus === "accepted";
  const paymentPaid = booking.paymentStatus === "paid" || booking.clientPaymentStatus === "paid";

  const handleOpenClientLocation = async () => {
    const lat = Number(booking.bookingLocation?.latitude || booking.addressLocation?.latitude || booking.clientLocation?.latitude || booking.clientLatitude || 0);
    const lng = Number(booking.bookingLocation?.longitude || booking.addressLocation?.longitude || booking.clientLocation?.longitude || booking.clientLongitude || 0);

    let providerLat = null;
    let providerLng = null;
    try {
      const providerLoc = await getCurrentReadableLocation();
      if (providerLoc) {
        providerLat = providerLoc.latitude;
        providerLng = providerLoc.longitude;
      }
    } catch {
      // Ignored
    }

    await openDirections({
      latitude: lat,
      longitude: lng,
      originLatitude: providerLat,
      originLongitude: providerLng,
      address: booking.address,
    });
  };


  const startWorkLocked = nextTrackingAction?.status === "Service Started" && (!estimateAccepted || !paymentPaid);
  const canEstimate =
    !isAvailable &&
    canComplete &&
    !["submitted", "accepted"].includes(String(booking.estimateStatus || "not_submitted"));

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.header, width < 360 && { flexDirection: "column", alignItems: "stretch", gap: 6 }]}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text, fontSize: width < 360 ? 15 : 17 }]} numberOfLines={2}>
            {booking.service}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>
            {booking.name}{isAvailable ? "" : ` | ${booking.phone}`}
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
          <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={3}>{booking.address}</Text>
        </View>
        <View style={styles.line}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.textMuted} />
          <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>
            {formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}
          </Text>
        </View>
        <View style={styles.line}>
          <MaterialCommunityIcons name="cash" size={16} color={theme.textMuted} />
          <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>
            {booking.serviceDuration} | {formatPrice(booking.costEstimate)}
          </Text>
        </View>
        {booking.status && ["cancelled", "Cancelled"].includes(booking.status) ? (
          <View style={{ marginTop: 6, padding: 8, backgroundColor: theme.cardBorder + "22", borderRadius: 6, gap: 4, borderWidth: 1, borderColor: theme.cardBorder }}>
            {booking.cancellationReason || booking.cancelReason ? (
              <View style={styles.line}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
                <Text style={[styles.lineText, { color: theme.rose, fontSize: width < 360 ? 11 : 13, fontWeight: "700" }]} numberOfLines={3}>
                  {booking.cancelledBy === "provider" ? "Rejection reason" : "Cancellation reason"}: {booking.cancellationReason || booking.cancelReason}
                </Text>
              </View>
            ) : null}
            {booking.cancelledBy ? (
              <View style={styles.line}>
                <MaterialCommunityIcons name="account-cancel-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Cancelled by: {booking.cancelledBy === "client" ? "Client" : booking.cancelledBy === "provider" ? "You (Provider)" : booking.cancelledBy}
                </Text>
              </View>
            ) : null}
            {booking.cancelledAt ? (
              <View style={styles.line}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Cancelled at: {new Date(booking.cancelledAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {booking.status && ["rejected", "Rejected"].includes(booking.status) && (booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason) ? (
          <View style={{ marginTop: 6, padding: 8, backgroundColor: theme.cardBorder + "22", borderRadius: 6, gap: 4, borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={styles.line}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
              <Text style={[styles.lineText, { color: theme.rose, fontSize: width < 360 ? 11 : 13, fontWeight: "700" }]} numberOfLines={3}>
                Rejection reason: {booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason}
              </Text>
            </View>
            {booking.cancelledAt || booking.rejectedAt ? (
              <View style={styles.line}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.lineText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Rejected at: {new Date(booking.rejectedAt || booking.cancelledAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {isAvailable ? (
        <View style={{ gap: 10 }}>
          <View style={width < 360 ? [styles.actions, { flexDirection: "column", gap: 8 }] : styles.actions}>
            <ActionButton
              title="Accept request"
              icon="check-circle-outline"
              loading={submitting}
              disabled={submitting}
              onPress={() => onAccept?.(booking)}
              style={width < 360 ? { width: "100%" } : styles.action}
            />
            <ActionButton
              title="Reject Request"
              icon="close-circle-outline"
              variant="danger"
              loading={submitting}
              disabled={submitting}
              onPress={() => onReject?.(booking)}
              style={width < 360 ? { width: "100%" } : styles.action}
            />
          </View>
        </View>
      ) : canComplete ? (
        <View style={{ gap: 10 }}>
          {startWorkLocked ? (
            <Text style={[styles.workflowMessage, { color: theme.rose, backgroundColor: theme.roseSoft }]}>
              Submit estimate and wait for client payment before starting work.
            </Text>
          ) : null}
          <View style={width < 360 ? [styles.actions, { flexDirection: "column", gap: 8 }] : styles.actions}>
            {canEstimate ? (
              <ActionButton
                title="Estimate"
                icon="cash-check"
                variant="secondary"
                disabled={submitting}
                onPress={() => onEstimate(booking)}
                style={width < 360 ? { width: "100%" } : styles.action}
              />
            ) : null}
            {nextTrackingAction ? (
              <ActionButton
                title={nextTrackingAction.label}
                icon={nextTrackingAction.icon}
                disabled={submitting || startWorkLocked}
                onPress={() => onUpdateTrackingStatus?.(booking, nextTrackingAction.status)}
                style={width < 360 ? { width: "100%" } : styles.action}
              />
            ) : null}
            <ActionButton
              title="Cancel"
              icon="close-circle-outline"
              variant="danger"
              disabled={submitting}
              onPress={() => onCancel(booking)}
              style={width < 360 ? { width: "100%" } : styles.action}
            />
          </View>
          <View style={width < 360 ? { flexDirection: "column", gap: 8 } : { flexDirection: "row", gap: 10 }}>
            <ActionButton
              title="Call Client"
              icon="phone"
              variant="secondary"
              onPress={() => {
                if (booking.phone && booking.phone !== "Client details hidden") {
                  Linking.openURL(`tel:${booking.phone}`).catch(() => {});
                }
              }}
              style={width < 360 ? { width: "100%" } : { flex: 1 }}
            />
            <ActionButton
              title="📍 Client Location"
              icon="navigation"
              variant="secondary"
              onPress={handleOpenClientLocation}
              style={width < 360 ? { width: "100%" } : { flex: 1 }}
            />
          </View>
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

