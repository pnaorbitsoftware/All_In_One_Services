import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { imageForService } from "../data/catalog";
import { allHomeServices, serviceCategories } from "../data/homeServicesData";
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

export default function ServicesScreen({ onViewDetails, onOpenProvidersForService }) {
  const theme = useThemeColors();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const visibleServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allHomeServices.filter((service) => {
      const matchesQuery = !normalized || `${service.name} ${service.category}`.toLowerCase().includes(normalized);
      const matchesCategory = activeCategory === "All" || service.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  const openService = (service) => {
    const payload = createServicePayload(service);
    if (onViewDetails) onViewDetails(payload);
    else onOpenProvidersForService?.(payload);
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
        {["All", ...serviceCategories.map((item) => item.title)].map((category) => {
          const active = category === activeCategory;
          return <Pressable key={category} onPress={() => setActiveCategory(category)} style={[styles.chip, { backgroundColor: active ? theme.text : theme.surface, borderColor: theme.border }]}><Text style={[styles.chipText, { color: active ? theme.surface : theme.text }]} numberOfLines={1}>{category === "All" ? "All services" : category.replace(" & Appliance Repair", " repair")}</Text></Pressable>;
        })}
      </ScrollView>

      {!query && activeCategory === "All" ? (
        <View style={[styles.promo, { backgroundColor: theme.teal }]}> 
          <View style={styles.promoCopy}><Text style={styles.promoEyebrow}>FIRST SERVICE</Text><Text style={styles.promoTitle}>A trusted professional, right on time.</Text><Text style={styles.promoBody}>Verified experts · clear estimates · support included</Text></View>
          <View style={styles.promoIcon}><MaterialCommunityIcons name="shield-check" size={44} color={theme.teal} /></View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>{query ? "Search results" : activeCategory === "All" ? "All services" : activeCategory}</Text><Text style={[styles.count, { color: theme.textMuted }]}>{visibleServices.length} available</Text></View>

      {visibleServices.length ? (
        <View style={styles.grid}>{visibleServices.map((service) => <ServiceTile key={service.id || service.name} service={service} onPress={openService} />)}</View>
      ) : (
        <View style={styles.empty}><MaterialCommunityIcons name="magnify-close" size={34} color={theme.textMuted} /><Text style={[styles.emptyTitle, { color: theme.text }]}>No service found</Text><Text style={[styles.emptyCopy, { color: theme.textMuted }]}>Try a different service name or category.</Text></View>
      )}

      <View style={[styles.promise, { backgroundColor: theme.surface }]}>
        <Text style={[styles.promiseTitle, { color: theme.text }]}>The ServiceHub promise</Text>
        <View style={styles.promiseRow}>{[["account-check", "Verified experts"], ["receipt-text-check", "Clear pricing"], ["shield-star", "Service warranty"]].map(([icon, label]) => <View key={label} style={styles.promiseItem}><View style={[styles.promiseIcon, { backgroundColor: theme.tealSoft }]}><MaterialCommunityIcons name={icon} size={20} color={theme.teal} /></View><Text style={[styles.promiseLabel, { color: theme.textMuted }]}>{label}</Text></View>)}</View>
      </View>
    </ScrollView>
  );
}

function ServiceTile({ service, onPress }) {
  const theme = useThemeColors();
  return (
    <Pressable onPress={() => onPress(service)} style={({ pressed }) => [styles.tile, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
      <Image source={imageForService(service)} style={[styles.tileImage, { backgroundColor: theme.surfaceMuted }]} resizeMode="cover" />
      <View style={styles.tileBody}>
        <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
        <View style={styles.meta}><MaterialCommunityIcons name="star" size={13} color="#F79009" /><Text style={[styles.metaText, { color: theme.textMuted }]}>4.8 · {service.badge || "45 mins"}</Text></View>
        <Text style={[styles.price, { color: theme.text }]}>Starts at ₹299</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
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
  search: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 54, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", minHeight: 50 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { flex: 1, fontSize: 21, fontWeight: "900", lineHeight: 27 },
  tile: { borderRadius: radius.lg, overflow: "hidden", width: "48%", ...shadow },
  tileBody: { padding: 12 },
  tileImage: { aspectRatio: 1.25, width: "100%" },
  tileTitle: { fontSize: 14, fontWeight: "900", lineHeight: 18, minHeight: 36 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.7 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
});
