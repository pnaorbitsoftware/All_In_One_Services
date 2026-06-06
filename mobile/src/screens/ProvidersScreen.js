import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { buildMarketplace } from "../data/catalog";
import { responsiveMetrics, shadow, useThemeColors } from "../theme";

export default function ProvidersScreen({
  catalogProviders,
  catalogLoading,
  catalogError,
  refreshing,
  onRefresh,
  onViewDetails,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const providers = useMemo(() => buildMarketplace(catalogProviders), [catalogProviders]);

  const filteredProviders = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return providers.filter((provider) => {
      const status = provider.availabilityStatus || provider.profileStatus || "available";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!normalized) return true;

      return [provider.name, provider.category, provider.location, provider.description, status]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [providers, query, statusFilter]);

  const keyExtractor = useCallback((item) => String(item.id), []);
  const renderItem = useCallback(
    ({ item }) => <ProviderCard provider={item} onPress={onViewDetails} />,
    [onViewDetails]
  );

  return (
    <FlatList
      data={filteredProviders}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Providers</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Browse verified providers by service and city.</Text>
          <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search providers, service, city..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <View style={styles.filterRow}>
            {["all", "active", "available", "absent", "inactive"].map((status) => {
              const active = statusFilter === status;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[styles.filterChip, { borderColor: active ? theme.teal : theme.border, backgroundColor: active ? theme.tealSoft : theme.surface }]}
                >
                  <Text style={[styles.filterText, { color: active ? theme.teal : theme.textMuted }]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>          {catalogError && providers.length ? (
            <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{catalogError}</Text>
          ) : null}
          {catalogLoading && !providers.length ? (
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading providers...</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={<Text style={[styles.empty, { color: theme.textMuted }]}>No providers found.</Text>}
      contentContainerStyle={[
        styles.content,
        { gap: metrics.gutter, paddingHorizontal: metrics.pagePadding },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      showsVerticalScrollIndicator={false}
    />
  );
}

function ProviderCard({ provider, onPress }) {
  const theme = useThemeColors();
  const profileImage = provider.profileImage || "";

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => onPress(provider)}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.providerImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="account-circle-outline" size={36} color={theme.textMuted} />
        )}
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.providerName, { color: theme.text }]} numberOfLines={1}>{provider.name}</Text>
        <View style={styles.nameRow}>
          <Text style={[styles.serviceName, { color: theme.textMuted }]} numberOfLines={1}>{provider.category}</Text>
          <StatusBadge status={provider.availabilityStatus || provider.profileStatus} bookable={provider.isBookable} />
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color={theme.textMuted} />
          <Text style={[styles.location, { color: theme.textMuted }]} numberOfLines={1}>{provider.location || "Nearby"}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name={provider.isBookable ? "chevron-right" : "alert-circle-outline"} size={22} color={provider.isBookable ? theme.textMuted : theme.rose} />
    </Pressable>
  );
}


function StatusBadge({ status = "available", bookable }) {
  const theme = useThemeColors();
  const bad = !bookable || ["inactive", "absent"].includes(status);
  return (
    <Text style={[styles.badge, { backgroundColor: bad ? theme.roseSoft : theme.tealSoft, color: bad ? theme.rose : theme.teal }]} numberOfLines={1}>
      {status}
    </Text>
  );
}
const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 7,
    maxWidth: 86,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    textTransform: "capitalize",
  },
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 12,
    ...shadow,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    paddingBottom: 118,
    paddingTop: 10,
  },
  empty: {
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 40,
    textAlign: "center",
  },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  header: {
    gap: 10,
    paddingTop: 8,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 14,
    flexShrink: 0,
    height: 58,
    justifyContent: "center",
    overflow: "hidden",
    width: 58,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  location: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "900",
  },
  providerImage: {
    height: "100%",
    width: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 48,
    minWidth: 0,
  },
  searchWrap: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  softError: {
    borderRadius: 12,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
});

