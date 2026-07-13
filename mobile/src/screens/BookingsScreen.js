import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import ActionButton from "../components/ActionButton";
import BookingCard from "../components/BookingCard";
import BookingFilterBar from "../components/BookingFilterBar";
import ChipRow from "../components/ChipRow";
import StatsStrip from "../components/StatsStrip";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import {
  CLIENT_HISTORY_TABS,
  categorizeClientBookings,
  filterBookingsByDate,
  searchBookings,
  sortBookings,
} from "../lib/bookingGrouping";
import { formatPrice } from "../lib/formatters";
import { colors, responsiveMetrics, useThemeColors } from "../theme";

export default function BookingsScreen({
  user,
  bookings,
  loading,
  error,
  refreshing,
  onRefresh,
  onCancelBooking,
  onAcceptEstimate,
  onRejectEstimate,
  onPayEstimate,
  onTrackBooking,
  onOpenAuth,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);

  const [historyTab, setHistoryTab] = useState("completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [sortKey, setSortKey] = useState("newest");

  const { ongoing, history, stats } = useMemo(() => categorizeClientBookings(bookings), [bookings]);

  const activeHistoryList = history[historyTab] || [];
  const visibleHistory = useMemo(() => {
    const dated = filterBookingsByDate(activeHistoryList, dateFilter, customRange);
    const searched = searchBookings(dated, searchQuery);
    return sortBookings(searched, sortKey);
  }, [activeHistoryList, dateFilter, customRange, searchQuery, sortKey]);

  const historyTabOptions = useMemo(
    () => CLIENT_HISTORY_TABS.map((tab) => ({ key: tab.key, label: `${tab.label} (${(history[tab.key] || []).length})` })),
    [history]
  );

  const statsItems = useMemo(
    () => [
      { label: "Total Orders", value: stats.totalOrders },
      { label: "Today", value: stats.todaysOrders },
      { label: "This Week", value: stats.weeklyOrders },
      { label: "This Month", value: stats.monthlyOrders },
      { label: "This Year", value: stats.yearlyOrders },
      { label: "Completed", value: stats.completed },
      { label: "Completion Rate", value: `${stats.completionRate}%` },
      { label: "Cancellation Rate", value: `${stats.cancellationRate}%` },
      { label: "Total Spending", value: formatPrice(stats.totalSpending) },
      { label: "Avg Rating", value: stats.averageRating || "—" },
    ],
    [stats]
  );

  const keyExtractor = useCallback((item) => String(item._id || item.id), []);
  const renderItem = useCallback(
    ({ item }) => (
      <BookingCard
        booking={item}
        onCancel={onCancelBooking}
        onAcceptEstimate={onAcceptEstimate}
        onRejectEstimate={onRejectEstimate}
        onPayEstimate={onPayEstimate}
        onTrack={onTrackBooking}
      />
    ),
    [onAcceptEstimate, onCancelBooking, onPayEstimate, onRejectEstimate, onTrackBooking]
  );

  if (!user) {
    return (
      <View style={[styles.center, { paddingHorizontal: metrics.pagePadding }]}>
        <View style={[styles.lockIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="lock-outline" size={30} color={theme.teal} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Login to view bookings</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Your current and past service requests will appear here.</Text>
        <View style={styles.authActions}>
          <ActionButton title="Login" icon="login" onPress={() => onOpenAuth("login", "user")} />
          <ActionButton title="Register" icon="account-plus-outline" variant="secondary" onPress={() => onOpenAuth("register", "user")} />
        </View>
      </View>
    );
  }

  if (loading && !bookings.length) {
    return <LoadingState label="Loading bookings..." />;
  }

  if (error && !bookings.length) {
    return <ErrorState copy={error} onRetry={onRefresh} />;
  }

  return (
    <FlatList
      data={visibleHistory}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>My bookings</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>{bookings.length} request{bookings.length === 1 ? "" : "s"} tracked</Text>
          {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}

          <StatsStrip items={statsItems} />

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ongoing Orders</Text>
              <Text style={[styles.sectionCount, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>
                {ongoing.length}
              </Text>
            </View>
            {ongoing.length ? (
              <View style={styles.cardStack}>
                {ongoing.map((booking) => (
                  <BookingCard
                    key={String(booking._id || booking.id)}
                    booking={booking}
                    onCancel={onCancelBooking}
                    onAcceptEstimate={onAcceptEstimate}
                    onRejectEstimate={onRejectEstimate}
                    onPayEstimate={onPayEstimate}
                    onTrack={onTrackBooking}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No ongoing orders right now. Pending, accepted, on-the-way and in-progress bookings show up here.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Booking History</Text>
            <ChipRow options={historyTabOptions} value={historyTab} onChange={setHistoryTab} />
            <BookingFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search by booking ID, provider, service..."
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              sortKey={sortKey}
              onSortChange={setSortKey}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No bookings in this tab"
          copy="Try a different history tab, or adjust your filters."
          icon="calendar-blank-outline"
        />
      }
      contentContainerStyle={[
        styles.listContent,
        {
          paddingHorizontal: metrics.pagePadding,
          gap: metrics.gutter,
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />
      }
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      updateCellsBatchingPeriod={45}
      windowSize={7}
      removeClippedSubviews={Platform.OS === "android"}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  authActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 8,
  },
  cardStack: {
    gap: 12,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: 13,
    justifyContent: "center",
  },
  copy: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  emptyBox: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  header: {
    gap: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 110,
    paddingTop: 12,
  },
  lockIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 66,
    minWidth: 66,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionCount: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0,
  },
  softError: {
    backgroundColor: colors.roseSoft,
    borderRadius: 12,
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "left",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
});
