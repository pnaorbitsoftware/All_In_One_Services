import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

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

      {tracking ? <LocationPanel tracking={tracking} /> : null}

      {tracking?.trackingHistory?.length ? (
        <TrackingTimeline history={tracking.trackingHistory} currentStatus={tracking.currentStatus} />
      ) : (
        <EmptyState title="No tracking updates yet" copy="Your service timeline will appear here after booking confirmation." icon="timeline-clock-outline" />
      )}

      {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
    </ScrollView>
  );
}

function hasCoordinates(location = {}) {
  return Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));
}

function mapsUrl(location = {}, label = "Service location") {
  if (!hasCoordinates(location)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${Number(location.latitude)},${Number(location.longitude)}&query_place_id=${encodeURIComponent(label)}`;
}

function LocationPanel({ tracking }) {
  const theme = useThemeColors();
  const providerLocation = tracking.providerLocation || {};
  const clientLocation = tracking.clientLocation || {};

  return (
    <View style={[styles.locationPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.locationHeader}>
        <MaterialCommunityIcons name="map-marker-path" size={22} color={theme.teal} />
        <View style={styles.headerText}>
          <Text style={[styles.locationTitle, { color: theme.text }]}>Location</Text>
          <Text style={[styles.locationCopy, { color: theme.textMuted }]}>Open coordinates in maps when available.</Text>
        </View>
      </View>
      <LocationRow
        title="Provider"
        icon="account-hard-hat-outline"
        address={providerLocation.address || tracking.providerAddress || "Provider location will appear after tracking starts."}
        location={providerLocation}
      />
      <LocationRow
        title="Client"
        icon="home-map-marker"
        address={clientLocation.address || tracking.clientAddress || "Client destination is saved with booking address."}
        location={clientLocation}
      />
    </View>
  );
}

function LocationRow({ icon, title, address, location }) {
  const theme = useThemeColors();
  const canOpenMap = hasCoordinates(location);
  const openMap = () => {
    const url = mapsUrl(location, title);
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.locationRow, { backgroundColor: theme.surfaceMuted }]}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.teal} />
      <View style={styles.locationText}>
        <Text style={[styles.locationRowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.locationAddress, { color: theme.textMuted }]} numberOfLines={2}>{address}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!canOpenMap}
        onPress={openMap}
        style={({ pressed }) => [
          styles.mapButton,
          { backgroundColor: canOpenMap ? theme.teal : theme.border },
          pressed && canOpenMap && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="map-search-outline" size={18} color="#ffffff" />
      </Pressable>
    </View>
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
  locationAddress: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  locationCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  locationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  locationPanel: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    marginBottom: 22,
    padding: 14,
  },
  locationRow: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  locationRowTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  locationText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  mapButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
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
