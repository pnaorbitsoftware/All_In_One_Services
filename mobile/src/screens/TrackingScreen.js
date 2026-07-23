import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, AppState } from "react-native";

import TrackingTimeline from "../components/TrackingTimeline";
import TrackingMap from "../components/TrackingMap";
import ActionButton from "../components/ActionButton";
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
import { bookingApi, providerApi } from "../lib/api";
import { formatBookingDate, formatBookingTime } from "../lib/formatters";
import { openDirections, openMapSearch } from "../lib/maps";
import { colors, radius, responsiveMetrics, useThemeColors } from "../theme";

function TrackingScreen({ token, user, bookingId, onBack, socket }) {
  const theme = useThemeColors();
  const metrics = responsiveMetrics(390);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [metricsState, setMetricsState] = useState({ distance: "", duration: "" });
  const [appState, setAppState] = useState(AppState.currentState);

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
        const fetchTracking = user?.role === "provider"
          ? providerApi.bookingTracking(token, bookingId).catch(() => bookingApi.tracking(token, bookingId))
          : bookingApi.tracking(token, bookingId);
        const data = await fetchTracking;
        setTracking(data);
      } catch (requestError) {
        setError(requestError.message || "Tracking could not be loaded.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bookingId, token, user?.role]
  );

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  useEffect(() => {
    if (!socket || !bookingId) return undefined;
    socket.emit("join_room", { bookingId, role: user?.role === "provider" ? "provider" : "client" });

    const handleLocationUpdate = (data) => {
      if (data && (String(data.bookingId) === String(bookingId) || String(data.databaseId) === String(bookingId))) {
        setTracking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            providerLocation: data.providerLocation || {
              latitude: data.lat,
              longitude: data.lng,
              timestamp: data.timestamp,
            },
            ...(data.clientLocation ? { clientLocation: data.clientLocation } : {}),
            ...(data.eta != null ? { eta: data.eta } : {}),
          };
        });
      }
    };

    const handleStatusChange = (data) => {
      if (data && (String(data.bookingId) === String(bookingId) || String(data.databaseId) === String(bookingId))) {
        loadTracking(true).catch(() => {});
      }
    };

    socket.on("location:update", handleLocationUpdate);
    socket.on("status:change", handleStatusChange);

    return () => {
      socket.off("location:update", handleLocationUpdate);
      socket.off("status:change", handleStatusChange);
    };
  }, [socket, bookingId, user?.role, loadTracking]);


  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      setAppState(nextAppState);
      if (nextAppState === "active") {
        loadTracking(true).catch(() => {});
      }
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [loadTracking]);

  useEffect(() => {
    if (!token || !bookingId || appState !== "active") return undefined;
    const lowerStatus = String(tracking?.currentStatus || "").toLowerCase();
    if (lowerStatus === "completed" || lowerStatus === "cancelled") {
      return undefined;
    }
    const timer = setInterval(() => {
      loadTracking(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [bookingId, loadTracking, token, tracking?.currentStatus, appState]);

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
          {tracking.problemDescription ? (
            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8, fontWeight: "700" }}>
              Work Details: <Text style={{ color: theme.text, fontWeight: "800" }}>{tracking.problemDescription}</Text>
            </Text>
          ) : null}
          {tracking.status && ["cancelled", "Cancelled"].includes(tracking.status) ? (
            <View style={{ marginTop: 8, padding: 10, backgroundColor: theme.rose + "10", borderRadius: 8, borderWidth: 1, borderColor: theme.rose + "30", gap: 4 }}>
              <Text style={{ fontSize: 13, color: theme.rose, fontWeight: "700" }}>
                Status: <Text style={{ fontWeight: "800" }}>Cancelled</Text>
              </Text>
              {tracking.cancellationReason || tracking.cancelReason ? (
                <Text style={{ fontSize: 13, color: theme.rose, fontWeight: "700" }}>
                  {tracking.cancelledBy === "provider" ? "Rejection reason" : "Cancellation reason"}: <Text style={{ fontWeight: "800" }}>{tracking.cancellationReason || tracking.cancelReason}</Text>
                </Text>
              ) : null}
              {tracking.cancelledBy ? (
                <Text style={{ fontSize: 13, color: theme.rose, fontWeight: "700" }}>
                  Cancelled by: <Text style={{ fontWeight: "800" }}>{tracking.cancelledBy === "client" ? "Client" : tracking.cancelledBy === "provider" ? "Provider" : tracking.cancelledBy}</Text>
                </Text>
              ) : null}
              {tracking.cancelledAt ? (
                <Text style={{ fontSize: 13, color: theme.rose, fontWeight: "700" }}>
                  Cancelled at: <Text style={{ fontWeight: "800" }}>{new Date(tracking.cancelledAt).toLocaleString()}</Text>
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {tracking ? (
        <LocationPanel
          tracking={tracking}
          showNavigate={user?.role === "provider"}
          metrics={metricsState}
          onMetricsUpdate={setMetricsState}
        />
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

function hasCoordinates(location = {}) {
  const lat = Number(location?.latitude);
  const lng = Number(location?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

function mapsUrl(location = {}, label = "Service location") {
  if (!hasCoordinates(location)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${Number(location.latitude)},${Number(location.longitude)}&query_place_id=${encodeURIComponent(label)}`;
}

function LocationPanel({ tracking, showNavigate, metrics, onMetricsUpdate }) {
  const theme = useThemeColors();
  const providerLocation = tracking.providerLocation || {};
  const clientLocation = tracking.bookingLocation && hasCoordinates(tracking.bookingLocation)
    ? tracking.bookingLocation
    : tracking.clientLocation || {};
  const hasClientCoords = hasCoordinates(clientLocation);
  const hasProviderCoords = hasCoordinates(providerLocation);

  const handleNavigation = () => {
    openDirections({
      latitude: clientLocation.latitude,
      longitude: clientLocation.longitude,
      originLatitude: providerLocation.latitude,
      originLongitude: providerLocation.longitude,
      address: tracking.clientAddress || tracking.address,
    });
  };

  const handleOpenProviderLocation = () => {
    openMapSearch({
      latitude: providerLocation.latitude,
      longitude: providerLocation.longitude,
      address: providerLocation.address || tracking.providerAddress,
    });
  };

  const handleClientNavigate = () => {
    openDirections({
      latitude: providerLocation.latitude,
      longitude: providerLocation.longitude,
      originLatitude: clientLocation.latitude,
      originLongitude: clientLocation.longitude,
      address: providerLocation.address || tracking.providerAddress,
    });
  };


  const lastUpdated = providerLocation.timestamp
    ? new Date(providerLocation.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Just now";

  return (
    <View style={[styles.locationPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.locationHeader}>
        <MaterialCommunityIcons name="map-marker-path" size={22} color={theme.teal} />
        <View style={styles.headerText}>
          <Text style={[styles.locationTitle, { color: theme.text }]}>Location</Text>
          <Text style={[styles.locationCopy, { color: theme.textMuted }]}>Open coordinates in maps when available.</Text>
        </View>
      </View>
      <TrackingMap
        providerLocation={providerLocation}
        clientLocation={clientLocation}
        onMetricsUpdate={onMetricsUpdate}
      />
      {hasProviderCoords ? (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 4, gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: "900", color: theme.text }}>Provider Location</Text>
          <Text style={{ fontSize: 13, color: theme.textMuted }}>
            Current Address: <Text style={{ color: theme.text, fontWeight: "700" }}>{providerLocation.address || tracking.providerAddress || "N/A"}</Text>
          </Text>
          {metrics?.distance ? (
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Distance Remaining: <Text style={{ color: theme.teal, fontWeight: "800" }}>{metrics.distance}</Text>
            </Text>
          ) : null}
          {metrics?.duration ? (
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Estimated Arrival Time: <Text style={{ color: theme.teal, fontWeight: "800" }}>{metrics.duration}</Text>
            </Text>
          ) : null}
          <Text style={{ fontSize: 12, color: theme.textMuted }}>
            Last Updated: <Text style={{ color: theme.text, fontWeight: "600" }}>{lastUpdated}</Text>
          </Text>
        </View>
      ) : (
        <LocationRow
          title="Provider"
          icon="account-hard-hat-outline"
          address={providerLocation.address || tracking.providerAddress || "Provider location will appear after tracking starts."}
          location={providerLocation}
        />
      )}
      <LocationRow
        title="Client"
        icon="home-map-marker"
        address={clientLocation.address || tracking.clientAddress || "Client destination is saved with booking address."}
        location={clientLocation}
      />
      {showNavigate && hasClientCoords ? (
        <ActionButton
          title="Navigate"
          icon="navigation"
          onPress={handleNavigation}
          style={{ marginTop: 10 }}
        />
      ) : null}
      {!showNavigate && hasProviderCoords ? (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <ActionButton
            title="Provider Location"
            icon="map-marker-radius-outline"
            variant="secondary"
            onPress={handleOpenProviderLocation}
            style={{ flex: 1 }}
          />
          <ActionButton
            title="Navigate"
            icon="navigation"
            onPress={handleClientNavigate}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
    </View>
  );
}

function LocationRow({ icon, title, address, location }) {
  const theme = useThemeColors();
  const canOpenMap = hasCoordinates(location) || Boolean(address?.trim());
  const openMap = () => {
    openMapSearch({
      latitude: location?.latitude,
      longitude: location?.longitude,
      address,
    });
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

export default React.memo(TrackingScreen);
