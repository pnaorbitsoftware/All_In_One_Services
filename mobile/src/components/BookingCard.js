import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { formatBookingDate, formatBookingTime, formatPrice, getClientCancelState } from "../lib/formatters";
import { colors, radius, shadow, useThemeColors } from "../theme";
import ActionButton from "./ActionButton";
import StatusPill from "./StatusPill";

function InfoLine({ icon, children }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  return (
    <View style={styles.infoLine}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.textMuted} />
      <Text style={[styles.infoText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={3}>
        {children}
      </Text>
    </View>
  );
}

function BookingCard({ booking, onCancel, onAcceptEstimate, onRejectEstimate, onPayEstimate, onTrack }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const cancelState = getClientCancelState(booking);
  const provider = booking.assignedProvider || booking.requestedProvider;
  const estimateSubmitted = booking.estimateStatus === "submitted";
  const estimateAccepted = booking.estimateStatus === "accepted";
  const terminalStatus = ["completed", "cancelled"].includes(String(booking.status || "").toLowerCase());
  const paymentPending = !terminalStatus && estimateAccepted && booking.paymentStatus !== "paid" && booking.clientPaymentStatus !== "paid";
  const hideTrackingForEstimate = (estimateSubmitted || paymentPending) && Number(booking.finalEstimateAmount || 0) > 0;
  const canTrack = !terminalStatus && !hideTrackingForEstimate;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.header, width < 360 && { flexDirection: "column", alignItems: "stretch", gap: 6 }]}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text, fontSize: width < 360 ? 15 : 17 }]} numberOfLines={2}>
            {booking.service}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={2}>
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
      <View style={styles.info}>
        <InfoLine icon="map-marker-outline">{booking.address}</InfoLine>
        <InfoLine icon="calendar-clock">
          {formatBookingDate(booking.preferredDate)} at {formatBookingTime(booking.preferredTime)}
        </InfoLine>
        <InfoLine icon="timer-outline">
          {booking.serviceDuration} | {formatPrice(booking.costEstimate)}
        </InfoLine>
        {provider ? (
          <InfoLine icon="account-hard-hat-outline">
            {provider.name} | {provider.location}
          </InfoLine>
        ) : null}
        {booking.problemDescription ? (
          <InfoLine icon="text-box-outline">{booking.problemDescription}</InfoLine>
        ) : null}
        {booking.finalEstimateAmount ? (
          <InfoLine icon="cash-check">
            Final estimate: {formatPrice(booking.finalEstimateAmount)} | {booking.estimateStatus || "not_submitted"} | {booking.paymentStatus || "unpaid"}
          </InfoLine>
        ) : null}
        {booking.status && ["cancelled", "Cancelled"].includes(booking.status) ? (
          <View style={{ marginTop: 6, padding: 8, backgroundColor: theme.cardBorder + "22", borderRadius: 6, gap: 4, borderWidth: 1, borderColor: theme.cardBorder }}>
            {booking.cancellationReason || booking.cancelReason ? (
              <View style={styles.infoLine}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
                <Text style={[styles.infoText, { color: theme.rose, fontSize: width < 360 ? 11 : 13, fontWeight: "700" }]} numberOfLines={3}>
                  {booking.cancelledBy === "provider" ? "Rejection reason" : "Cancellation reason"}: {booking.cancellationReason || booking.cancelReason}
                </Text>
              </View>
            ) : null}
            {booking.cancelledBy ? (
              <View style={styles.infoLine}>
                <MaterialCommunityIcons name="account-cancel-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.infoText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Cancelled by: {booking.cancelledBy === "client" ? "You (Client)" : booking.cancelledBy === "provider" ? "Provider" : booking.cancelledBy}
                </Text>
              </View>
            ) : null}
            {booking.cancelledAt ? (
              <View style={styles.infoLine}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.infoText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Cancelled at: {new Date(booking.cancelledAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {booking.status && ["rejected", "Rejected"].includes(booking.status) && (booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason) ? (
          <View style={{ marginTop: 6, padding: 8, backgroundColor: theme.cardBorder + "22", borderRadius: 6, gap: 4, borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={styles.infoLine}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.rose} />
              <Text style={[styles.infoText, { color: theme.rose, fontSize: width < 360 ? 11 : 13, fontWeight: "700" }]} numberOfLines={3}>
                Rejection reason: {booking.rejectionReason || booking.cancellationReason || booking.adminRejectionReason}
              </Text>
            </View>
            {booking.cancelledAt || booking.rejectedAt ? (
              <View style={styles.infoLine}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.infoText, { color: theme.textMuted, fontSize: width < 360 ? 11 : 13 }]} numberOfLines={1}>
                  Rejected at: {new Date(booking.rejectedAt || booking.cancelledAt).toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {canTrack ? (
        <ActionButton
          title="Track Service"
          icon="timeline-clock-outline"
          variant="secondary"
          onPress={() => onTrack?.(booking)}
        />
      ) : null}
      {paymentPending ? (
        <ActionButton
          title={`Pay final estimate ${formatPrice(booking.finalEstimateAmount || 0)}`}
          icon="credit-card-check-outline"
          onPress={() => onPayEstimate?.(booking)}
        />
      ) : null}
      {!terminalStatus && estimateSubmitted ? (
        <View style={width < 360 ? [styles.actions, { flexDirection: "column", gap: 8 }] : styles.actions}>
          <ActionButton
            title="Accept estimate"
            icon="check-circle-outline"
            onPress={() => onAcceptEstimate?.(booking)}
            style={width < 360 ? { width: "100%" } : styles.estimateAction}
          />
          <ActionButton
            title="Reject"
            icon="close-circle-outline"
            variant="danger"
            onPress={() => onRejectEstimate?.(booking)}
            style={width < 360 ? { width: "100%" } : styles.estimateAction}
          />
        </View>
      ) : null}
      {!terminalStatus && cancelState.canCancel ? (
        <ActionButton
          title={cancelState.label}
          icon="close-circle-outline"
          variant="danger"
          onPress={() => onCancel(booking)}
        />
      ) : null}
    </View>
  );
}

export default React.memo(BookingCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 15,
    ...shadow,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  estimateAction: {
    flex: 1,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  info: {
    gap: 8,
  },
  infoLine: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  infoText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
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



