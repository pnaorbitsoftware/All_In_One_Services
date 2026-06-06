import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import ActionButton from "../components/ActionButton";
import { ErrorState, LoadingState } from "../components/StateView";
import StatusPill from "../components/StatusPill";
import { adminApi } from "../lib/api";
import { colors, radius, responsiveMetrics, shadow, useThemeColors } from "../theme";

function StatCard({ label, value, icon }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.teal} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

function ProviderApprovalCard({ provider }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{provider.name}</Text>
          <Text style={[styles.cardCopy, { color: theme.textMuted }]}>
            {provider.category} | {provider.location} | {provider.phone}
          </Text>
        </View>
        <StatusPill status={provider.approvalStatus || "pending"} />
      </View>
      <Text style={[styles.cardCopy, { color: theme.textMuted }]} numberOfLines={2}>
        {provider.description || "Provider profile is waiting for website admin approval."}
      </Text>
      <Text style={[styles.notice, { backgroundColor: theme.tealSoft, color: theme.teal }]}>Approve or reject this request from the website admin dashboard.</Text>
    </View>
  );
}


function ProviderStatusCard({ provider, onStatus }) {
  const theme = useThemeColors();
  const location = provider.currentLocation || {};
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{provider.name}</Text>
          <Text style={[styles.cardCopy, { color: theme.textMuted }]}>{provider.category} | {provider.location}</Text>
        </View>
        <StatusPill status={provider.availabilityStatus || (provider.isActive ? "available" : "inactive")} />
      </View>
      <Text style={[styles.cardCopy, { color: theme.textMuted }]}>
        Tracking: {provider.trackingActive ? "On duty" : "Stopped"} {location.address ? `| ${location.address}` : ""}
      </Text>
      <View style={styles.actionsWrap}>
        {["available", "active", "absent", "inactive"].map((status) => (
          <ActionButton key={status} title={status} icon="toggle-switch-outline" variant="secondary" onPress={() => onStatus(provider, status)} style={styles.compactAction} />
        ))}
      </View>
    </View>
  );
}
function BookingAdminCard({ booking, onComplete, onCancel }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowBetween}>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{booking.service}</Text>
          <Text style={[styles.cardCopy, { color: theme.textMuted }]} numberOfLines={1}>
            {booking.name || booking.userName} | {booking.phone || booking.user?.phone}
          </Text>
        </View>
        <StatusPill status={booking.status} />
      </View>
      <Text style={[styles.cardCopy, { color: theme.textMuted }]} numberOfLines={2}>{booking.address}</Text>
      {!["completed", "cancelled"].includes(booking.status) ? (
        <View style={styles.actions}>
          <ActionButton title="Complete" icon="check-decagram-outline" onPress={() => onComplete(booking)} style={styles.action} />
          <ActionButton title="Cancel" icon="close-circle-outline" variant="danger" onPress={() => onCancel(booking)} style={styles.action} />
        </View>
      ) : null}
    </View>
  );
}

export default function AdminScreen({ token, user, onOpenAuth }) {
  const { width } = useWindowDimensions();
  const metrics = responsiveMetrics(width);
  const theme = useThemeColors();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const pendingProviders = useMemo(
    () => (dashboard?.providers || []).filter((provider) => provider.approvalStatus === "pending"),
    [dashboard]
  );

  const approvedProviders = useMemo(
    () => (dashboard?.providers || []).filter((provider) => provider.approvalStatus === "approved").slice(0, 10),
    [dashboard]
  );

  const activeBookings = useMemo(
    () => (dashboard?.bookings || []).filter((booking) => !["completed", "cancelled"].includes(booking.status)).slice(0, 8),
    [dashboard]
  );

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!token || user?.role !== "admin") return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        setDashboard(await adminApi.dashboard(token));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, user]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const approveProvider = async (provider) => {
    try {
      await adminApi.approveProvider(token, provider._id);
      await loadDashboard(true);
    } catch (approvalError) {
      setError(approvalError.message);
    }
  };

  const rejectProvider = (provider) => {
    Alert.alert("Reject provider", `Reject ${provider.name}?`, [
      { text: "Keep pending", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await adminApi.rejectProvider(token, provider._id, "Rejected from mobile admin dashboard.");
            await loadDashboard(true);
          } catch (rejectionError) {
            setError(rejectionError.message);
          }
        },
      },
    ]);
  };


  const updateProviderAvailability = async (provider, availabilityStatus) => {
    try {
      await adminApi.updateProviderStatus(token, provider._id, availabilityStatus);
      await loadDashboard(true);
    } catch (statusError) {
      setError(statusError.message);
    }
  };
  const updateBookingStatus = (booking, status) => {
    Alert.alert("Update booking", `Mark ${booking.service} as ${status}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            await adminApi.updateBooking(token, booking._id, {
              status,
              adminRejectionReason: status === "cancelled" ? "Cancelled from mobile admin dashboard." : "",
            });
            await loadDashboard(true);
          } catch (bookingError) {
            setError(bookingError.message);
          }
        },
      },
    ]);
  };

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.center, { paddingHorizontal: metrics.pagePadding }]}>
        <View style={[styles.lockIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={theme.teal} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Admin dashboard</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Provider approval is managed from the website admin dashboard.</Text>
        <ActionButton title="Admin login" icon="login" onPress={() => onOpenAuth("login", "admin")} />
      </View>
    );
  }

  if (loading && !dashboard) {
    return <LoadingState label="Loading admin dashboard..." />;
  }

  if (error && !dashboard) {
    return <ErrorState copy={error} onRetry={() => loadDashboard(true)} />;
  }

  const stats = dashboard?.stats || {};

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingHorizontal: metrics.pagePadding }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} colors={[theme.teal]} tintColor={theme.teal} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Admin dashboard</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Provider approvals are listed here, but approval decisions are handled from the website admin dashboard.</Text>
        {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Customers" value={String(stats.totalUsers || 0)} icon="account-group-outline" />
        <StatCard label="Providers" value={String(stats.totalProviders || 0)} icon="account-hard-hat-outline" />
        <StatCard label="Bookings" value={String(stats.totalBookings || 0)} icon="calendar-check-outline" />
        <StatCard label="Pending work" value={String(stats.pendingWork || 0)} icon="clipboard-clock-outline" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Provider approvals from website admin</Text>
        {pendingProviders.length ? (
          pendingProviders.slice(0, 8).map((provider) => (
            <ProviderApprovalCard key={provider._id} provider={provider} />
          ))
        ) : (
          <Text style={[styles.empty, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>No pending providers.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Provider availability and staff tracking</Text>
        {approvedProviders.length ? (
          approvedProviders.map((provider) => (
            <ProviderStatusCard key={provider._id} provider={provider} onStatus={updateProviderAvailability} />
          ))
        ) : (
          <Text style={[styles.empty, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>No approved providers to track.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Active bookings</Text>
        {activeBookings.length ? (
          activeBookings.map((booking) => (
            <BookingAdminCard
              key={booking._id}
              booking={booking}
              onComplete={(item) => updateBookingStatus(item, "completed")}
              onCancel={(item) => updateBookingStatus(item, "cancelled")}
            />
          ))
        ) : (
          <Text style={[styles.empty, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>No active bookings.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compactAction: {
    flex: 1,
    minHeight: 42,
    minWidth: 118,
    paddingHorizontal: 9,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...shadow,
  },
  cardCopy: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: 13,
    justifyContent: "center",
  },
  content: {
    gap: 16,
    paddingBottom: 116,
    paddingTop: 12,
  },
  copy: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  empty: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    gap: 6,
  },
  lockIcon: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  notice: {
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },  rowBetween: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  softError: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "left",
  },
  statCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minWidth: 136,
    padding: 13,
    ...shadow,
  },
  statIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
});

