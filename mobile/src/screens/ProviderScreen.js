import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import ActionButton from "../components/ActionButton";
import BookingFilterBar from "../components/BookingFilterBar";
import ChipRow from "../components/ChipRow";
import JobCard from "../components/JobCard";
import StatsStrip from "../components/StatsStrip";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { filterBookingsByDate, searchBookings, sortBookings } from "../lib/bookingGrouping";
import { formatPrice } from "../lib/formatters";
import { colors, responsiveMetrics, shadow, useThemeColors } from "../theme";

export default function ProviderScreen({
  user,
  providerData,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpenAuth,
  onAccept,
  onReject,
  onComplete,
  onCancel,
  onEstimate,
  onUpdateTrackingStatus,
  onUpdateAvailability,
  onStartTracking,
  onStopTracking,
  onEditProfile,
  onRequestLocation,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [historyTab, setHistoryTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [sortKey, setSortKey] = useState("newest");

  const provider = providerData?.provider;
  const availableRequests = providerData?.availableRequests || [];
  const bookings = providerData?.bookings || [];
  const acceptedBookings = useMemo(
    () => bookings.filter((booking) => !["completed", "cancelled"].includes(String(booking.status || "").toLowerCase())),
    [bookings]
  );
  const canceledBookings = useMemo(
    () => bookings.filter((booking) => String(booking.status || "").toLowerCase() === "cancelled"),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((booking) => String(booking.status || "").toLowerCase() === "completed"),
    [bookings]
  );

  // New History Data from Backend
const history = providerData?.history ?? {};
const stats = providerData?.stats ?? {};

const pendingHistory = history.pending ?? [];
const providerRejectedHistory = history.providerRejected ?? [];
const clientCancelledHistory = history.clientCancelled ?? [];
const completedHistory = history.completed ?? [];

const rawHistoryBookings = useMemo(() => {
  switch (historyTab) {
    case "pending":
      return pendingHistory;

    case "providerRejected":
      return providerRejectedHistory;

    case "clientCancelled":
      return clientCancelledHistory;

    case "completed":
      return completedHistory;

    default:
      return pendingHistory;
  }
}, [
  historyTab,
  pendingHistory,
  providerRejectedHistory,
  clientCancelledHistory,
  completedHistory,
]);

const selectedHistoryBookings = useMemo(() => {
  const dated = filterBookingsByDate(rawHistoryBookings, dateFilter, customRange);
  const searched = searchBookings(dated, searchQuery);
  return sortBookings(searched, sortKey);
}, [rawHistoryBookings, dateFilter, customRange, searchQuery, sortKey]);

const providerStatsItems = useMemo(
  () => [
    { label: "Total Orders", value: stats.totalOrders ?? 0 },
    { label: "Today", value: stats.todaysOrders ?? 0 },
    { label: "This Week", value: stats.weeklyOrders ?? 0 },
    { label: "This Month", value: stats.monthlyOrders ?? 0 },
    { label: "This Year", value: stats.yearlyOrders ?? 0 },
    { label: "Completed", value: stats.completed ?? 0 },
    { label: "Completion Rate", value: `${stats.completionRate ?? 0}%` },
    { label: "Cancellation Rate", value: `${stats.cancellationRate ?? 0}%` },
    { label: "Earnings", value: formatPrice(stats.providerEarnings ?? 0) },
    { label: "Avg Rating", value: stats.averageRating ?? 0 },
  ],
  [stats]
);

const historyTabOptions = useMemo(
  () => [
    { key: "pending", label: `Pending (${stats.pending ?? 0})` },
    { key: "completed", label: `Completed (${stats.completed ?? 0})` },
    { key: "providerRejected", label: `Provider Rejected (${stats.providerRejected ?? 0})` },
    { key: "clientCancelled", label: `Client Cancelled (${stats.clientCancelled ?? 0})` },
  ],
  [stats]
);


  const historyCount = canceledBookings.length + completedBookings.length;
  const providerUnavailable = provider && !provider.isBookable;

  const dashboardLocked = Boolean(
    providerData?.dashboardLocked || (provider && provider.approvalStatus && provider.approvalStatus !== "approved")
  );
  const approvalStatus = provider?.approvalStatus || (dashboardLocked ? "pending" : "approved");
  const approvalTitle = approvalStatus === "rejected" ? "Approval not granted" : "Waiting for admin approval";
  const approvalCopy = approvalStatus === "rejected"
    ? "Your provider request was rejected by the website admin. Update your details or contact ServiceHub support before taking jobs."
    : "Your provider registration is under review. The website admin dashboard manages all provider approvals for website and mobile requests.";

  const sections = useMemo(() => {
    if (dashboardLocked) return [];

    const list = [];
    if (availableRequests.length) {
      list.push({ title: "Booking Request", type: "available", data: availableRequests });
    }
    if (acceptedBookings.length) {
      list.push({ title: "Accepted Bookings", type: "assigned", data: acceptedBookings });
    }
   if (historyOpen && selectedHistoryBookings.length) {
  const historyTitles = {
    pending: "Pending Requests",
    providerRejected: "Provider Rejected",
    clientCancelled: "Client Cancelled",
    completed: "Completed Bookings",
  };

  list.push({
    title: historyTitles[historyTab] || "History",
    type: "history",
    data: selectedHistoryBookings,
  });
}
    return list;
  }, [acceptedBookings, availableRequests, selectedHistoryBookings, historyTab, dashboardLocked, historyOpen]);

  const keyExtractor = useCallback((item) => String(item._id || item.id), []);
  const renderItem = useCallback(
    ({ item, section }) => (
      <JobCard
        booking={item}
        type={section.type}
        onAccept={onAccept}
        onReject={onReject}
        onComplete={onComplete}
        onCancel={onCancel}
        onEstimate={onEstimate}
        onUpdateTrackingStatus={onUpdateTrackingStatus}
        onRequestLocation={onRequestLocation}
      />
    ),
    [onAccept, onReject, onCancel, onComplete, onEstimate, onUpdateTrackingStatus, onRequestLocation]
  );

  const renderSectionHeader = useCallback(
    ({ section }) => (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
        <Text style={[styles.sectionCount, { color: theme.teal }]}>{section.data.length}</Text>
      </View>
    ),
    [theme]
  );

  if (!user || user.role !== "provider") {
    return (
      <View style={[styles.center, { paddingHorizontal: metrics.pagePadding }]}>
        <View style={[styles.lockIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="briefcase-check-outline" size={31} color={theme.teal} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Provider workspace</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Login or create a provider account to accept jobs and update service status.</Text>
        <View style={styles.authActions}>
          <ActionButton title="Provider login" icon="login" onPress={() => onOpenAuth("login", "provider")} />
          <ActionButton title="Register" icon="account-plus-outline" variant="secondary" onPress={() => onOpenAuth("register", "provider")} />
        </View>
      </View>
    );
  }

  if (loading && !providerData) {
    return <LoadingState label="Loading provider workspace..." />;
  }

  if (error && !providerData) {
    return <ErrorState copy={error} onRetry={onRefresh} />;
  }

  if (dashboardLocked) {
    return (
      <View style={[styles.center, { paddingHorizontal: metrics.pagePadding }]}>
        <View style={[styles.lockIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="shield-clock-outline" size={32} color={theme.teal} />
        </View>
        <Text style={[styles.statusLabel, { color: approvalStatus === "rejected" ? theme.rose : theme.teal }]}>
          {approvalStatus}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>{approvalTitle}</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>{providerData?.message || approvalCopy}</Text>
        {approvalStatus === "rejected" && provider?.rejectionReason ? (
          <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>Reason: {provider.rejectionReason}</Text>
        ) : null}
        {provider ? (
          <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border, width: "100%" }]}>
            <View style={styles.profileTop}>
              <View style={[styles.providerIcon, { backgroundColor: theme.tealSoft }]}>
                {provider.image ? (
                  <Image source={{ uri: provider.image }} style={styles.providerImage} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="account-hard-hat-outline" size={28} color={theme.teal} />
                )}
              </View>
              <View style={styles.providerText}>
                <Text style={[styles.providerName, { color: theme.text }]} numberOfLines={1}>{provider.name}</Text>
                <Text style={[styles.providerMeta, { color: theme.textMuted }]} numberOfLines={2}>
                  {provider.category} | {provider.location} | {provider.phone}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
        {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
        <ActionButton title="Check approval status" icon="refresh" onPress={onRefresh} />
        {approvalStatus === "rejected" ? (
          <ActionButton title="Edit and resubmit" icon="account-edit-outline" variant="secondary" onPress={onEditProfile} />
        ) : null}
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Provider workspace</Text>
          {provider ? (
            <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.profileTop}>
                <View style={[styles.providerIcon, { backgroundColor: theme.tealSoft }]}>
                  {provider.image ? (
                    <Image source={{ uri: provider.image }} style={styles.providerImage} resizeMode="cover" />
                  ) : (
                    <MaterialCommunityIcons name="account-hard-hat-outline" size={28} color={theme.teal} />
                  )}
                </View>
                <View style={styles.providerText}>
                  <Text style={[styles.providerName, { color: theme.text }]} numberOfLines={1}>{provider.name}</Text>
                  <Text style={[styles.providerMeta, { color: theme.textMuted }]} numberOfLines={2}>
                    {provider.category} | {provider.location} | {provider.responseTime}
                  </Text>
                </View>
              </View>
              <View style={styles.statusPanel}>
                <View style={styles.statusHeader}>
                  <Text style={[styles.statusPanelTitle, { color: theme.text }]}>Availability</Text>
                  <Text style={[styles.statusLabel, { color: providerUnavailable ? theme.rose : theme.teal }]}>
                    {provider.availabilityStatus || "available"}
                  </Text>
                </View>
                {providerUnavailable ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>Provider is currently unavailable.</Text> : null}
                <View style={styles.statusActions}>
                  {["available", "active", "absent", "inactive"].map((status) => (
                    <ActionButton
                      key={status}
                      title={status}
                      icon={status === "absent" || status === "inactive" ? "pause-circle-outline" : "check-circle-outline"}
                      variant={provider.availabilityStatus === status ? "primary" : "secondary"}
                      onPress={() => onUpdateAvailability?.(status)}
                      style={styles.statusAction}
                    />
                  ))}
                </View>
              </View>
              <View style={[styles.statusPanel, { borderColor: theme.border }]}> 
                <View style={styles.statusHeader}>
                  <Text style={[styles.statusPanelTitle, { color: theme.text }]}>Duty tracking</Text>
                  <Text style={[styles.statusLabel, { color: provider.trackingActive ? theme.teal : theme.textMuted }]}>
                    {provider.trackingActive ? "tracking" : "off"}
                  </Text>
                </View>
                <Text style={[styles.providerMeta, { color: theme.textMuted }]}>
                  {provider.currentLocation?.address || "Start tracking to share your latest location with admin."}
                </Text>
                <View style={styles.statusActions}>
                  <ActionButton title="Start Duty" icon="map-marker-radius-outline" onPress={onStartTracking} style={styles.statusAction} />
                  <ActionButton title="Stop Tracking" icon="stop-circle-outline" variant="secondary" onPress={onStopTracking} style={styles.statusAction} />
                </View>
              </View>
                <View style={styles.profileStats}>
                  <ProfileStat label="Rating" value={String(provider.rating || 0)} />
                  <ProfileStat label="Reviews" value={String(provider.reviews || 0)} />
                  <ProfileStat label="Price" value={provider.price || "Set price"} />
                </View>
              </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => setHistoryOpen((open) => !open)}
            style={({ pressed }) => [
              styles.historyButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.historyText}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>Booking History</Text>
              <Text style={[styles.historyCopy, { color: theme.textMuted }]}>
                {historyCount
                  ? `${canceledBookings.length} canceled, ${completedBookings.length} completed`
                  : "Canceled and completed bookings will appear here"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={historyOpen ? "chevron-up" : "chevron-down"}
              size={24}
              color={theme.textMuted}
            />
          </Pressable>
          {historyOpen && (
            <View style={styles.historyDetail}>
              <StatsStrip items={providerStatsItems} />
              <ChipRow options={historyTabOptions} value={historyTab} onChange={setHistoryTab} />
              <BookingFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by booking ID, customer, service..."
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
                sortKey={sortKey}
                onSortChange={setSortKey}
              />
            </View>
          )}

          {historyOpen && !historyCount ? (
            <Text style={[styles.historyEmpty, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>
              No canceled or completed bookings yet.
            </Text>
          ) : null}
          {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No active bookings"
          copy="New booking requests and accepted bookings will appear here."
          icon="clipboard-list-outline"
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
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={45}
      windowSize={7}
      removeClippedSubviews={Platform.OS === "android"}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ProfileStat({ value, label }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.profileStat, { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
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
    gap: 13,
    paddingTop: 8,
  },
  historyButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  historyDetail: {
    gap: 12,
    marginTop: 12,
  },
  historyEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyText: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
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
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 15,
    ...shadow,
  },
  profileStat: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    flex: 1,
    gap: 2,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  profileStats: {
    flexDirection: "row",
    gap: 10,
  },
  profileTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  providerIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 15,
    flexShrink: 0,
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    width: 56,
  },
  providerImage: {
    height: "100%",
    width: "100%",
  },
  providerMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 2,
  },
  providerName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
  },
  providerText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.78,
  },
  sectionCount: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900",
  },
  statusAction: {
    flex: 1,
    minWidth: 128,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusPanel: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  statusPanelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },  softError: {
    backgroundColor: colors.roseSoft,
    borderRadius: 12,
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
});


