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
import JobCard from "../components/JobCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
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
  onComplete,
  onCancel,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [historyOpen, setHistoryOpen] = useState(false);

  const provider = providerData?.provider;
  const availableRequests = providerData?.availableRequests || [];
  const bookings = providerData?.bookings || [];
  const acceptedBookings = useMemo(
    () => bookings.filter((booking) => !["completed", "cancelled"].includes(booking.status)),
    [bookings]
  );
  const canceledBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "cancelled"),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed"),
    [bookings]
  );
  const historyCount = canceledBookings.length + completedBookings.length;

  const sections = useMemo(() => {
    const list = [];
    if (availableRequests.length) {
      list.push({ title: "Booking Request", type: "available", data: availableRequests });
    }
    if (acceptedBookings.length) {
      list.push({ title: "Accepted Bookings", type: "assigned", data: acceptedBookings });
    }
    if (historyOpen && canceledBookings.length) {
      list.push({ title: "Canceled Bookings", type: "history", data: canceledBookings });
    }
    if (historyOpen && completedBookings.length) {
      list.push({ title: "Completed Bookings", type: "history", data: completedBookings });
    }
    return list;
  }, [acceptedBookings, availableRequests, canceledBookings, completedBookings, historyOpen]);

  const keyExtractor = useCallback((item) => String(item._id || item.id), []);
  const renderItem = useCallback(
    ({ item, section }) => (
      <JobCard
        booking={item}
        type={section.type}
        onAccept={onAccept}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    ),
    [onAccept, onCancel, onComplete]
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
  softError: {
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
