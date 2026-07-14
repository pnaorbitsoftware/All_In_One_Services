import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import BookingCard from "../components/BookingCard";
import { ErrorState, LoadingState } from "../components/StateView";
import ModalSheet from "../components/ModalSheet";
import { colors, radius, useThemeColors } from "../theme";

function Section({ title, copy, bookings, emptyCopy, onCancel, onAcceptEstimate, onRejectEstimate, onPayEstimate, onTrack }) {
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
              onAcceptEstimate={onAcceptEstimate}
              onRejectEstimate={onRejectEstimate}
              onPayEstimate={onPayEstimate}
              onTrack={onTrack}
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
  onAcceptEstimate,
  onRejectEstimate,
  onPayEstimate,
  onTrackBooking,
}) {
  const theme = useThemeColors();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("pending");

  const activeBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const status = String(booking.status || "").toLowerCase().replace(/_/g, " ");
      return ["accepted", "confirmed", "provider assigned", "provider_assigned", "on the way", "on_the_way", "arrived", "service started", "service_started"].includes(status);
    });
  }, [bookings]);

  const filteredHistory = useMemo(() => {
    const pending = [];
    const completed = [];
    const providerRejected = [];
    const clientCancelled = [];

    bookings.forEach((booking) => {
      const status = String(booking.status || "").toLowerCase();
      if (status === "pending") {
        pending.push(booking);
      } else if (status === "completed") {
        completed.push(booking);
      } else if (status === "rejected" || (status === "cancelled" && booking.cancelledBy === "provider")) {
        providerRejected.push(booking);
      } else if (status === "cancelled") {
        clientCancelled.push(booking);
      }
    });

    return { pending, completed, providerRejected, clientCancelled };
  }, [bookings]);

  const selectedHistoryBookings = useMemo(() => {
    switch (historyTab) {
      case "pending":
        return filteredHistory.pending;
      case "completed":
        return filteredHistory.completed;
      case "providerRejected":
        return filteredHistory.providerRejected;
      case "clientCancelled":
        return filteredHistory.clientCancelled;
      default:
        return filteredHistory.pending;
    }
  }, [historyTab, filteredHistory]);

  const historyCount =
    filteredHistory.pending.length +
    filteredHistory.completed.length +
    filteredHistory.providerRejected.length +
    filteredHistory.clientCancelled.length;

  useEffect(() => {
    if (!visible) {
      setHistoryOpen(false);
      setHistoryTab("pending");
    }
  }, [visible]);

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
          {!historyOpen && (
            <Section
              title="Accepted Request Provider"
              bookings={activeBookings}
              emptyCopy="No Active Booking"
              onCancel={onCancelBooking}
              onAcceptEstimate={onAcceptEstimate}
              onRejectEstimate={onRejectEstimate}
              onPayEstimate={onPayEstimate}
              onTrack={onTrackBooking}
            />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setHistoryOpen((open) => !open)}
            style={({ pressed }) => [
              styles.historyButton,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.historyText}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>Booking History</Text>
              <Text style={[styles.historyCopy, { color: theme.textMuted }]}>
                {historyCount
                  ? `${filteredHistory.pending.length} pending, ${filteredHistory.completed.length} completed, ${(filteredHistory.providerRejected.length + filteredHistory.clientCancelled.length)} cancelled/rejected`
                  : "Pending, completed, and cancelled bookings will appear here"}
              </Text>
            </View>
            <Text style={[styles.sectionCount, { backgroundColor: theme.surface, color: theme.textMuted }]}>
              {historyCount}
            </Text>
            <MaterialCommunityIcons
              name={historyOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color={theme.textMuted}
            />
          </Pressable>
          {historyOpen ? (
            <View style={{ marginTop: 12, gap: 10 }}>
              <Text style={[styles.historyTabsTitle, { color: theme.text }]}>History Categories</Text>
              <View style={styles.tabRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollTabContainer}>
                  {[
                    { id: "pending", label: `Pending (${filteredHistory.pending.length})` },
                    { id: "completed", label: `Completed (${filteredHistory.completed.length})` },
                    { id: "providerRejected", label: `Provider Rejected (${filteredHistory.providerRejected.length})` },
                    { id: "clientCancelled", label: `Client Cancelled (${filteredHistory.clientCancelled.length})` },
                  ].map((tab) => (
                    <Pressable
                      key={tab.id}
                      onPress={() => setHistoryTab(tab.id)}
                      style={[
                        styles.tabButton,
                        {
                          backgroundColor: historyTab === tab.id ? theme.teal : theme.surfaceMuted,
                          borderColor: historyTab === tab.id ? theme.teal : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          { color: historyTab === tab.id ? "#ffffff" : theme.textMuted },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={{ marginTop: 12 }}>
                <Section
                  title={
                    historyTab === "pending"
                      ? "Pending Requests"
                      : historyTab === "completed"
                      ? "Completed Orders"
                      : historyTab === "providerRejected"
                      ? "Provider Rejected"
                      : "Client Cancelled"
                  }
                  bookings={selectedHistoryBookings}
                  emptyCopy={
                    historyTab === "pending"
                      ? "No pending requests."
                      : historyTab === "completed"
                      ? "No completed bookings."
                      : historyTab === "providerRejected"
                      ? "No provider rejected bookings."
                      : "No client cancelled bookings."
                  }
                  onCancel={onCancelBooking}
                  onAcceptEstimate={onAcceptEstimate}
                  onRejectEstimate={onRejectEstimate}
                  onPayEstimate={onPayEstimate}
                  onTrack={null}
                />
              </View>
            </View>
          ) : null}
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
  historyButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  historyCopy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  historyText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0,
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
  historyTabsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  tabRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  scrollTabContainer: {
    gap: 8,
    paddingRight: 10,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonText: {
    fontWeight: "600",
    fontSize: 13,
  },
});



