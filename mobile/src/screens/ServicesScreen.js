import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { imageForService } from "../data/catalog";
import { finalServices } from "../data/homeServicesData";
import { radius, shadow, useThemeColors } from "../theme";

function createServicePayload(item) {
  return {
    ...item,
    id: item.id || item.slug || item.name,
    category: item.category || "Home services",
    serviceCategory: item.category || "Home services",
    location: "Nearby",
    rating: item.rating || 4.8,
    reviews: item.reviews || 120,
    responseTime: item.estimatedTime || item.badge || "Fast",
    price: item.price || "Starts at ₹299",
    description: item.description || `${item.name} by verified ServiceHub professionals.`,
    features: [item.name, "Verified professional", "Doorstep service"],
  };
}

function ServicesScreen({ catalogProviders = [], catalogLoading = false, catalogError = "", onRefresh, onViewDetails, onOpenProvidersForService }) {
  const theme = useThemeColors();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const providerServices = useMemo(() => {
    const byName = new Map();

    catalogProviders.forEach((provider) => {
      if (!provider?.category) return;

      const isVisible =
        provider.approvalStatus !== "pending" &&
        provider.approvalStatus !== "rejected" &&
        provider.isActive !== false &&
        !["inactive", "absent"].includes(provider.availabilityStatus);

      if (!isVisible) return;

      const name = provider.category;
      const existing = byName.get(name);
      const serviceMeta = finalServices.find((service) => service.name === name) || {};

      byName.set(name, {
        ...serviceMeta,
        id: serviceMeta.id || name,
        name,
        category: serviceMeta.category || name,
        serviceCategory: serviceMeta.category || name,
        providersCount: (existing?.providersCount || 0) + 1,
        estimatedTime: serviceMeta.estimatedTime || provider.responseTime || "Fast",
        badge: serviceMeta.badge || provider.responseTime || "Fast",
        price: provider.price || serviceMeta.price || "Contact for price",
        description: serviceMeta.description || `${name} by verified ServiceHub professionals.`,
      });
    });

    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogProviders]);

  const visibleCategories = useMemo(
    () => ["All", ...providerServices.map((service) => service.name)],
    [providerServices]
  );

  const visibleServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return providerServices.filter((service) => {
      const matchesQuery = !normalized || `${service.name} ${service.category}`.toLowerCase().includes(normalized);
      const matchesCategory = activeCategory === "All" || service.name === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, providerServices, query]);

  const openService = (service) => {
    const payload = createServicePayload(service);
    if (onOpenProvidersForService) onOpenProvidersForService(payload);
    else onViewDetails?.(payload);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page, { backgroundColor: theme.background }]}> 
      <View style={styles.topRow}>
        <View><Text style={[styles.eyebrow, { color: theme.teal }]}>EXPLORE</Text><Text style={[styles.title, { color: theme.text }]}>Home services</Text></View>
        <Pressable accessibilityRole="button" style={[styles.iconButton, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="tune-variant" size={21} color={theme.text} /></Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="magnify" size={21} color={theme.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search for AC repair, cleaning..." placeholderTextColor={theme.textMuted} style={[styles.searchInput, { color: theme.text }]} />
        {query ? <Pressable onPress={() => setQuery("")}><MaterialCommunityIcons name="close-circle" size={19} color={theme.textMuted} /></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {visibleCategories.map((category) => {
          const active = category === activeCategory;
          return <Pressable key={category} onPress={() => setActiveCategory(category)} style={[styles.chip, { backgroundColor: active ? theme.text : theme.surface, borderColor: theme.border }]}><Text style={[styles.chipText, { color: active ? theme.surface : theme.text }]} numberOfLines={1}>{category === "All" ? "All services" : category}</Text></Pressable>;
        })}
      </ScrollView>

      {!query && activeCategory === "All" ? (
        <View style={[styles.promo, { backgroundColor: theme.teal }]}> 
          <View style={styles.promoCopy}><Text style={styles.promoEyebrow}>FIRST SERVICE</Text><Text style={styles.promoTitle}>A trusted professional, right on time.</Text><Text style={styles.promoBody}>Verified experts · clear estimates · support included</Text></View>
          <View style={styles.promoIcon}><MaterialCommunityIcons name="shield-check" size={44} color={theme.teal} /></View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>{query ? "Search results" : activeCategory === "All" ? "All services" : activeCategory}</Text><Text style={[styles.count, { color: theme.textMuted }]}>{catalogLoading ? "Loading" : `${visibleServices.length} available`}</Text></View>

        {visibleServices.length ? (
          <View style={styles.grid}>
            {visibleServices.map((service) => (
              <PremiumServiceTile
                key={service.id || service.name}
                service={service}
                onPress={openService}
              />
            ))}
          </View>
        ) : (
        <View style={styles.empty}>
            <MaterialCommunityIcons name={catalogError ? "cloud-alert-outline" : "magnify-close"} size={34} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {catalogError ? "Services could not load" : catalogLoading ? "Loading services..." : "No provider services yet"}
            </Text>
            <Text style={[styles.emptyCopy, { color: theme.textMuted }]}>
              {catalogError || (catalogLoading ? "Please wait while we fetch provider services." : "Services will appear here after providers add and activate their service.")}
            </Text>
            {catalogError && onRefresh ? (
              <Pressable onPress={onRefresh} style={[styles.retryButton, { backgroundColor: theme.tealSoft }]}>
                <Text style={[styles.retryText, { color: theme.teal }]}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
      )}

      <View style={[styles.promise, { backgroundColor: theme.surface }]}>
        <Text style={[styles.promiseTitle, { color: theme.text }]}>The ServiceHub promise</Text>
        <View style={styles.promiseRow}>{[["account-check", "Verified experts"], ["receipt-text-check", "Clear pricing"], ["shield-star", "Service warranty"]].map(([icon, label]) => <View key={label} style={styles.promiseItem}><View style={[styles.promiseIcon, { backgroundColor: theme.tealSoft }]}><MaterialCommunityIcons name={icon} size={20} color={theme.teal} /></View><Text style={[styles.promiseLabel, { color: theme.textMuted }]}>{label}</Text></View>)}</View>
      </View>
    </ScrollView>
  );
}


function PremiumServiceTile({ service, onPress }) {
  const theme = useThemeColors();
  const payload = createServicePayload(service);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(payload)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tileImageWrap}>
        <Image
          source={imageForService(service)}
          style={[styles.tileImage, { backgroundColor: theme.surfaceMuted }]}
          resizeMode="cover"
        />
        <View style={styles.tileShade} />
        <View style={[styles.timeBadge, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons name="clock-fast" size={11} color={theme.teal} />
          <Text style={[styles.timeBadgeText, { color: theme.teal }]} numberOfLines={1}>
            {payload.responseTime}
          </Text>
        </View>
      </View>

      <View style={styles.tileBody}>
        <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={2}>
          {payload.name}
        </Text>
        <Text style={[styles.tileCategory, { color: theme.textMuted }]} numberOfLines={1}>
          {payload.category}
        </Text>

        <View style={styles.tileMetaRow}>
          <View style={[styles.ratingPill, { backgroundColor: theme.surfaceMuted }]}>
            <MaterialCommunityIcons name="star" size={12} color="#F79009" />
            <Text style={[styles.ratingText, { color: theme.textMuted }]}>4.8</Text>
          </View>
          <Text style={[styles.tilePrice, { color: theme.text }]} numberOfLines={1}>
            {payload.price}
          </Text>
        </View>

        <View style={[styles.viewCta, { backgroundColor: theme.tealSoft }]}>
          <Text style={[styles.viewCtaText, { color: theme.teal }]}>View service</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={theme.teal} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 999, borderWidth: 1, maxWidth: 190, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 12, fontWeight: "800" },
  chips: { gap: 8, paddingRight: 16 },
  count: { fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", gap: 6, paddingVertical: 48 },
  emptyCopy: { fontSize: 13 },
  emptyTitle: { fontSize: 17, fontWeight: "900" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "space-between" },
  iconButton: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44, ...shadow },
  meta: { alignItems: "center", flexDirection: "row", gap: 3, marginTop: 5 },
  metaText: { fontSize: 11, fontWeight: "700" },
  page: { gap: 20, paddingBottom: 120, paddingHorizontal: 16, paddingTop: 18 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  price: { fontSize: 12, fontWeight: "900", marginTop: 7 },
  promo: { alignItems: "center", borderRadius: radius.xl, flexDirection: "row", minHeight: 148, overflow: "hidden", padding: 20 },
  promoBody: { color: "rgba(255,255,255,.78)", fontSize: 11, fontWeight: "600", lineHeight: 17, marginTop: 6 },
  promoCopy: { flex: 1 },
  promoEyebrow: { color: "rgba(255,255,255,.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  promoIcon: { alignItems: "center", backgroundColor: "#fff", borderRadius: 30, height: 76, justifyContent: "center", marginLeft: 10, transform: [{ rotate: "7deg" }], width: 76 },
  promoTitle: { color: "#fff", fontSize: 20, fontWeight: "900", lineHeight: 25, marginTop: 4 },
  promise: { borderRadius: radius.xl, padding: 18, ...shadow },
  promiseIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  promiseItem: { alignItems: "center", flex: 1, gap: 7 },
  promiseLabel: { fontSize: 10, fontWeight: "800", textAlign: "center" },
  promiseRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  promiseTitle: { fontSize: 17, fontWeight: "900" },
  retryButton: { borderRadius: 999, marginTop: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { fontSize: 12, fontWeight: "900" },
  search: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 54, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", minHeight: 50 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { flex: 1, fontSize: 21, fontWeight: "900", lineHeight: 27 },
  tile: { borderRadius: radius.xl, borderWidth: 1, minHeight: 238, overflow: "hidden", width: "48%", ...shadow },
  tileBody: { gap: 6, padding: 11 },
  tileImage: { height: 116, width: "100%" },
  tileTitle: { fontSize: 14, fontWeight: "900", lineHeight: 18, minHeight: 36 },
  tileImageWrap: { height: 116, overflow: "hidden", position: "relative" },
  tileShade: { backgroundColor: "rgba(15,23,42,0.06)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  timeBadge: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 3, left: 8, paddingHorizontal: 7, paddingVertical: 4, position: "absolute", top: 8 },
  timeBadgeText: { fontSize: 10, fontWeight: "900" },
  tileCategory: { fontSize: 11, fontWeight: "800" },
  tileMetaRow: { alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "space-between", marginTop: 2 },
  ratingPill: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 3, paddingHorizontal: 7, paddingVertical: 4 },
  ratingText: { fontSize: 10, fontWeight: "900" },
  tilePrice: { flex: 1, fontSize: 11, fontWeight: "900", textAlign: "right" },
  viewCta: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 4, justifyContent: "center", marginTop: 6, paddingVertical: 8 },
  viewCtaText: { fontSize: 11, fontWeight: "900" },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.7 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
});

export default React.memo(ServicesScreen);
