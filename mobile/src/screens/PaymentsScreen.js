import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import ActionButton from "../components/ActionButton";
import { ErrorState, LoadingState } from "../components/StateView";
import { formatPrice } from "../lib/formatters";
import { colors, radius, responsiveMetrics, shadow, useThemeColors } from "../theme";

const DEFAULT_PROVIDER_SHARE_PERCENT = 80;

function getPayoutAmount(booking) {
  const savedAmount = Number(booking.providerPayoutAmount || 0);
  if (savedAmount > 0) return savedAmount;

  const sharePercent = Number(booking.providerSharePercent || DEFAULT_PROVIDER_SHARE_PERCENT);
  return Math.round((Number(booking.costEstimate || 0) * sharePercent) / 100);
}

function buildLocalPaymentSummary(bookings = []) {
  const completedBookings = bookings.filter((booking) => booking.status === "completed");
  const releasedBookings = completedBookings.filter(
    (booking) => booking.adminPayoutStatus === "released"
  );
  const pendingPayoutBookings = completedBookings.filter(
    (booking) => booking.adminPayoutStatus !== "released"
  );
  const awaitingClientPaymentBookings = bookings.filter((booking) =>
    ["accepted", "assigned", "confirmed"].includes(String(booking.status || "")) &&
    booking.clientPaymentStatus !== "paid"
  );
  const adminReleased = releasedBookings.reduce((total, booking) => total + getPayoutAmount(booking), 0);
  const alreadyWithdrawn = releasedBookings.reduce(
    (total, booking) => total + Number(booking.providerWithdrawnAmount || 0),
    0
  );
  const pendingEarnings = pendingPayoutBookings.reduce((total, booking) => total + getPayoutAmount(booking), 0);

  return {
    totalPaidEarnings: adminReleased,
    pendingEarnings,
    completedPaidBookings: releasedBookings.length,
    awaitingClientPayment: awaitingClientPaymentBookings.length,
    adminReleased,
    alreadyWithdrawn,
    availableToWithdraw: Math.max(adminReleased - alreadyWithdrawn, 0),
    providerSharePercent: DEFAULT_PROVIDER_SHARE_PERCENT,
  };
}

function PaymentCard({ title, value, icon, children }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.textMuted }]}>{title}</Text>
        <View style={[styles.cardIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name={icon} size={23} color={theme.teal} />
        </View>
      </View>
      <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function DetailLine({ label, value, highlight = false }) {
  const theme = useThemeColors();

  return (
    <Text style={[styles.detailLine, { color: theme.textMuted }]}>
      {label}: <Text style={{ color: highlight ? theme.teal : theme.text }}>{value}</Text>
    </Text>
  );
}

export default function PaymentsScreen({
  user,
  providerData,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpenAuth,
}) {
  const { width } = useWindowDimensions();
  const metrics = responsiveMetrics(width);
  const theme = useThemeColors();
  const bookings = providerData?.bookings || [];
  const localSummary = useMemo(() => buildLocalPaymentSummary(bookings), [bookings]);
  const summary = { ...localSummary, ...(providerData?.paymentSummary || {}) };
  const availableToWithdraw = Number(summary.availableToWithdraw || 0);

  if (!user || user.role !== "provider") {
    return (
      <View style={[styles.center, { paddingHorizontal: metrics.pagePadding }]}>
        <View style={[styles.lockIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="credit-card-lock-outline" size={32} color={theme.teal} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Provider payments</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Login as a provider to view admin payouts and service earnings.</Text>
        <ActionButton title="Provider login" icon="login" onPress={() => onOpenAuth("login", "provider")} />
      </View>
    );
  }

  if (loading && !providerData) {
    return <LoadingState label="Loading payment dashboard..." />;
  }

  if (error && !providerData) {
    return <ErrorState copy={error} onRetry={onRefresh} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          gap: metrics.gutter,
          paddingHorizontal: metrics.pagePadding,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Provider payments</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Track service earnings, client payments, and admin payout release status.
        </Text>
        {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
      </View>

      <View style={[styles.grid, metrics.isTablet && styles.tabletGrid]}>
        <PaymentCard
          title="Total Paid Earnings"
          value={formatPrice(summary.totalPaidEarnings)}
          icon="wallet-outline"
        >
          <DetailLine label="Admin released" value={formatPrice(summary.adminReleased)} />
          <DetailLine label="Already withdrawn" value={formatPrice(summary.alreadyWithdrawn)} />
          <DetailLine label="Available to withdraw" value={formatPrice(availableToWithdraw)} highlight />
          <View
            style={[
              styles.payoutButton,
              { backgroundColor: availableToWithdraw > 0 ? theme.teal : theme.surfaceMuted },
            ]}
          >
            <Text style={[styles.payoutText, { color: availableToWithdraw > 0 ? "#ffffff" : theme.textMuted }]}>
              {availableToWithdraw > 0 ? "Admin payout released" : "Waiting for admin payout"}
            </Text>
          </View>
        </PaymentCard>

        <PaymentCard
          title="Pending Earnings"
          value={formatPrice(summary.pendingEarnings)}
          icon="clock-outline"
        >
          <Text style={[styles.cardCopy, { color: theme.textMuted }]}>
            Expected {summary.providerSharePercent || DEFAULT_PROVIDER_SHARE_PERCENT}% share from completed jobs waiting for admin payout.
          </Text>
        </PaymentCard>

        <PaymentCard
          title="Completed Paid Bookings"
          value={String(summary.completedPaidBookings || 0)}
          icon="check-circle-outline"
        >
          <Text style={[styles.cardCopy, { color: theme.textMuted }]}>
            Completed bookings with admin released payouts.
          </Text>
        </PaymentCard>

        <PaymentCard
          title="Awaiting Client Payment"
          value={String(summary.awaitingClientPayment || 0)}
          icon="credit-card-outline"
        >
          <Text style={[styles.cardCopy, { color: theme.textMuted }]}>
            Accepted estimates waiting for checkout.
          </Text>
        </PaymentCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: 11,
    minHeight: 190,
    padding: 16,
    ...shadow,
  },
  cardBody: {
    gap: 8,
  },
  cardCopy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radius.md,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  cardTitle: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  cardValue: {
    color: colors.text,
    fontSize: 26,
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
    paddingBottom: 116,
    paddingTop: 12,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  detailLine: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  grid: {
    gap: 14,
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
  payoutButton: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  payoutText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
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
  tabletGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
});
