import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
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
import { EmptyState, ErrorState, LoadingState } from "../components/StateView";
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
  onOpenAuth,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);

  const keyExtractor = useCallback((item) => String(item._id || item.id), []);
  const renderItem = useCallback(
    ({ item }) => (
      <BookingCard
        booking={item}
        onCancel={onCancelBooking}
        onAcceptEstimate={onAcceptEstimate}
        onRejectEstimate={onRejectEstimate}
      />
    ),
    [onAcceptEstimate, onCancelBooking, onRejectEstimate]
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
      data={bookings}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>My bookings</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>{bookings.length} request{bookings.length === 1 ? "" : "s"} tracked</Text>
          {error ? <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No bookings yet"
          copy="Book a provider and your request status will show up here."
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
