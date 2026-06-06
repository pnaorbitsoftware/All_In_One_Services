import React from "react";
import { StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import { formatPrice } from "../lib/formatters";
import { colors, radius, useThemeColors } from "../theme";

export default function PaymentConfirmationSheet({ visible, booking, onClose, onGoToBookings }) {
  const theme = useThemeColors();
  if (!booking) return null;

  const provider = booking.assignedProvider || booking.requestedProvider || {};

  return (
    <ModalSheet
      visible={visible}
      title="Payment Successful"
      subtitle="Booking Confirmed"
      centeredTitle
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <ActionButton title="Go to My Bookings" icon="calendar-check-outline" onPress={onGoToBookings} style={styles.footerButton} />
          <ActionButton title={booking.receiptUrl ? "View Receipt" : "Receipt Pending"} icon="receipt" variant="secondary" disabled={!booking.receiptUrl} onPress={() => {}} style={styles.footerButton} />
        </View>
      }
    >
      <View style={[styles.summary, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}> 
        <Line label="Service" value={booking.service} />
        <Line label="Provider" value={provider.name || booking.assignedProviderName || booking.requestedProviderName || "Provider pending"} />
        <Line label="Date and time" value={`${new Date(booking.preferredDate).toLocaleDateString("en-IN")} ${booking.preferredTime || ""}`} />
        <Line label="Amount paid" value={formatPrice(booking.costEstimate || 0)} />
        <Line label="Booking ID" value={booking._id || booking.id || "Pending"} />
      </View>
      {!booking.receiptUrl ? <Text style={[styles.note, { color: theme.textMuted }]}>Receipt download is ready for backend invoice integration.</Text> : null}
    </ModalSheet>
  );
}

function Line({ label, value }) {
  const theme = useThemeColors();
  return (
    <View style={styles.line}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footerButton: {
    flex: 1,
    minWidth: 150,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  line: {
    gap: 3,
  },
  note: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  summary: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
});

