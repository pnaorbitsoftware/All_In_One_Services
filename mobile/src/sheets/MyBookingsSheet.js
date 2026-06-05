import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import BookingCard from "../components/BookingCard";
import { ErrorState, LoadingState } from "../components/StateView";
import ModalSheet from "../components/ModalSheet";
import { colors, radius, useThemeColors } from "../theme";

const historyStatuses = new Set(["completed", "cancelled"]);

function Section({ title, copy, bookings, emptyCopy, onCancel }) {
  const theme = useThemeColors();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.sectionCount, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>
          {bookings.length}
        </Text>
      </View>
      {copy ? <Text style={[styles.sectionCopy, { color: theme.textMuted }]}>{copy}</Text> : null}
      {bookings.length ? (
        <View style={styles.cardStack}>
          {bookings.map((booking) => (
            <BookingCard
              key={String(booking._id || booking.id)}
              booking={booking}
              onCancel={onCancel}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>{emptyCopy}</Text>
        </View>
      )}
    </View>
  );
}

export default function MyBookingsSheet({
  visible,
  bookings = [],
  loading,
  error,
  refreshing,
  onClose,
  onRefresh,
  onCancelBooking,
}) {
  const theme = useThemeColors();
  const groupedBookings = useMemo(() => {
    const active = [];
    const history = [];

    bookings.forEach((booking) => {
      const status = String(booking.status || "pending").toLowerCase();
      if (historyStatuses.has(status)) {
        history.push(booking);
      } else {
        active.push(booking);
      }
    });

    return { active, history };
  }, [bookings]);

  return (
    <ModalSheet
      visible={visible}
      title="My Bookings"
      subtitle="Your accepted request by providers"
      onClose={onClose}
      headerAction={
        <Pressable
          accessibilityLabel="Refresh bookings"
          accessibilityRole="button"
          disabled={refreshing || loading}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            { backgroundColor: theme.surfaceMuted },
            pressed && !refreshing && !loading && styles.pressed,
          ]}
        >
          {refreshing ? (
            <ActivityIndicator color={theme.teal} size="small" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={22} color={theme.teal} />
          )}
        </Pressable>
      }
    >
      {loading && !bookings.length ? (
        <LoadingState label="Loading your bookings..." />
      ) : error && !bookings.length ? (
        <ErrorState copy={error} onRetry={onRefresh} />
      ) : (
        <>
          {error ? (
            <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text>
          ) : null}
          <Section
            title="Accepted Request Provider"
            bookings={groupedBookings.active}
            emptyCopy="No Active Booking"
            onCancel={onCancelBooking}
          />
          <Section
            title="Booking History"
            bookings={groupedBookings.history}
            emptyCopy="Book your frist service"
            onCancel={onCancelBooking}
          />
        </>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  cardStack: {
    gap: 12,
  },
  emptyBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.78,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  section: {
    gap: 10,
  },
  sectionCopy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  sectionCount: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  softError: {
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
