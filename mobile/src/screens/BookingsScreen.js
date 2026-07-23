import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState, useMemo } from "react";
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
import SegmentedControl from "../components/SegmentedControl";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { colors, responsiveMetrics, useThemeColors } from "../theme";

function BookingsScreen({
  user,
  bookings = [],
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
  const [selectedTab, setSelectedTab] = useState("active");

  const keyExtractor = useCallback(
    (item, index) => String(item?._id ?? item?.id ?? index),
    []
  );

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

  // Normalizer to map a booking to its tab
  const getBookingTab = useCallback((booking) => {
    const status = String(booking.status || "").toLowerCase().replace(/[\s_]+/g, "_");
    if (
      [
        "pending",
        "accepted",
        "confirmed",
        "assigned",
        "provider_assigned",
        "on_the_way",
        "en_route",
        "arrived",
        "service_started",
        "job_started",
      ].includes(status)
    ) {
      return "active";
    }
    if (status === "completed") {
      return "completed";
    }
    if (["cancelled", "rejected"].includes(status)) {
      return "cancelled";
    }
    return "active"; // default fallback
  }, []);

  // Deduplicate bookings by ID and calculate count for each tab
  const counts = useMemo(() => {
    const c = { active: 0, completed: 0, cancelled: 0 };
    const seenIds = new Set();

    bookings.forEach((booking) => {
      if (!booking) return;
      const id = String(booking._id || booking.id);
      if (seenIds.has(id)) return;
      seenIds.add(id);

      const tab = getBookingTab(booking);
      if (tab && c[tab] !== undefined) {
        c[tab]++;
      }
    });
    return c;
  }, [bookings, getBookingTab]);

  // Deduplicate and filter bookings for the selected tab
  const filteredBookings = useMemo(() => {
    const seenIds = new Set();
    return bookings.filter((booking) => {
      if (!booking) return false;
      const id = String(booking._id || booking.id);
      if (seenIds.has(id)) return false;
      seenIds.add(id);

      return getBookingTab(booking) === selectedTab;
    });
  }, [bookings, selectedTab, getBookingTab]);

  // Custom empty states per tab
  const emptyStateProps = useMemo(() => {
    switch (selectedTab) {
      case "active":
        return {
          title: "No active bookings",
          copy: "Pending, accepted, confirmed, or in-progress bookings will appear here.",
          icon: "clock-outline",
        };
      case "completed":
        return {
          title: "No completed bookings",
          copy: "Your finished services will show up here.",
          icon: "calendar-check",
        };
      case "cancelled":
        return {
          title: "No cancelled bookings",
          copy: "Cancelled or rejected booking requests will appear here.",
          icon: "calendar-remove-outline",
        };
      default:
        return {
          title: "No bookings found",
          copy: "There are no bookings in this section.",
          icon: "calendar-blank-outline",
        };
    }
  }, [selectedTab]);

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
      data={filteredBookings}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>My bookings</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            {filteredBookings.length} request{filteredBookings.length === 1 ? "" : "s"} in this tab
          </Text>
          <View style={styles.tabsContainer}>
            <SegmentedControl
              value={selectedTab}
              options={[
                { label: `Active (${counts.active})`, value: "active" },
                { label: `Completed (${counts.completed})`, value: "completed" },
                { label: `Cancelled (${counts.cancelled})`, value: "cancelled" },
              ]}
              onChange={setSelectedTab}
            />
          </View>
          {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title={emptyStateProps.title}
          copy={emptyStateProps.copy}
          icon={emptyStateProps.icon}
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
  header: {
    gap: 4,
    paddingTop: 8,
  },
  tabsContainer: {
    marginTop: 12,
    marginBottom: 4,
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

export default React.memo(BookingsScreen);