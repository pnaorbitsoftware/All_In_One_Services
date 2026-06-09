import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import TrackingTimeline from "../components/TrackingTimeline";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { bookingApi } from "../lib/api";
import { formatBookingDate, formatBookingTime } from "../lib/formatters";
import { colors, radius, responsiveMetrics, useThemeColors } from "../theme";

export default function TrackingScreen({ token, bookingId, onBack }) {
  const theme = useThemeColors();
  const metrics = responsiveMetrics(390);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTracking = useCallback(
    async (refresh = false) => {
      if (!token || !bookingId) {
        setLoading(false);
        setError("Login and booking are required to track service progress.");
        return;
      }

      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const data = await bookingApi.tracking(token, bookingId);
        setTracking(data);
      } catch (requestError) {
        setError(requestError.message || "Tracking could not be loaded.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId, token]
  );

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  useEffect(() => {
    if (!token || !bookingId) return undefined;
    const timer = setInterval(() => loadTracking(true), 10000);
    return () => clearInterval(timer);
  }, [bookingId, loadTracking, token]);

  if (loading && !tracking) {
    return <LoadingState label="Loading service tracking..." />;
  }

  if (error && !tracking) {
    return <ErrorState title="Tracking unavailable" copy={error} onRetry={() => loadTracking()} />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTracking(true)} colors={[theme.teal]} tintColor={theme.teal} />}
      contentContainerStyle={[styles.content, { paddingHorizontal: metrics.pagePadding }]}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, { backgroundColor: theme.surfaceMuted }, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="arrow-left" size={23} color={theme.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Track Service</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Live progress from booking to completion</Text>
        </View>
      </View>

      {tracking ? (
        <View style={styles.summary}>
          <Text style={[styles.serviceName, { color: theme.text }]} numberOfLines={2}>{tracking.serviceName}</Text>
          <Text style={[styles.summaryText, { color: theme.textMuted }]} numberOfLines={1}>{tracking.providerName}</Text>
          <Text style={[styles.summaryText, { color: theme.textMuted }]} numberOfLines={1}>
            {formatBookingDate(tracking.bookingDate)} at {formatBookingTime(tracking.bookingTime)}
          </Text>
        </View>
      ) : null}

      {tracking?.trackingHistory?.length ? (
        <TrackingTimeline history={tracking.trackingHistory} currentStatus={tracking.currentStatus} />
      ) : (
        <EmptyState title="No tracking updates yet" copy="Your service timeline will appear here after booking confirmation." icon="timeline-clock-outline" />
      )}

      {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  content: {
    backgroundColor: colors.background,
    paddingBottom: 118,
    paddingTop: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  serviceName: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  softError: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 14,
    padding: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  summary: {
    gap: 5,
    marginBottom: 22,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
