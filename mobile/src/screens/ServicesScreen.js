import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { allHomeServices, finalServiceNames, getServiceVisual, serviceCategories } from "../data/homeServicesData";
import { colors, responsiveMetrics, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;
const SEARCH_SUGGESTIONS = ["Electrician", "AC Repair", "Washing Machine", "Bathroom Cleaning", "Bed Bugs Control"];

function createServicePayload(item) {
  return {
    id: item.id || item.slug || item.name,
    name: item.name,
    category: item.category || "Home services",
    serviceCategory: item.category || "Home services",
    slug: item.slug || item.id,
    location: "Nearby",
    rating: item.rating || 4.8,
    reviews: item.reviews || 120,
    responseTime: item.estimatedTime || item.badge || item.responseTime || "Fast",
    price: item.price || "Contact for price",
    phone: "",
    description: item.description || `${item.name} by verified ServiceHub professionals.`,
    about: item.about || `Book ${item.name} from ServiceHub with trained local service partners.`,
    features: [item.name, "Verified professional", "Doorstep service"],
    icon: item.icon || "briefcase-check-outline",
  };
}

export default function ServicesScreen({ onViewDetails, onOpenProvidersForService, t = defaultT }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [query, setQuery] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const searchSuggestions = useMemo(() => [...new Set([...SEARCH_SUGGESTIONS, ...finalServiceNames])].slice(0, 18), []);

  useEffect(() => {
    if (query.trim() || searchSuggestions.length < 2) return undefined;
    const timer = setInterval(() => setSuggestionIndex((current) => (current + 1) % searchSuggestions.length), 2000);
    return () => clearInterval(timer);
  }, [query, searchSuggestions.length]);

  const openService = useCallback(
    (service) => {
      const payload = createServicePayload(service);
      if (onOpenProvidersForService) {
        onOpenProvidersForService(payload);
        return;
      }
      onViewDetails?.(payload);
    },
    [onOpenProvidersForService, onViewDetails]
  );

  const openSuggestedService = useCallback(
    (name) => {
      const matchedService = allHomeServices.find((service) => String(service.name || "").toLowerCase() === String(name || "").toLowerCase());
      if (matchedService) openService(matchedService);
    },
    [openService]
  );

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return allHomeServices.filter((service) => `${service.name} ${service.category} ${service.groupTitle || ""}`.toLowerCase().includes(normalized));
  }, [query]);

  const listHeader = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>{t("services.title", "Services")}</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>{t("services.subtitle", "Search or browse all ServiceHub home services.")}</Text>
      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View style={[styles.searchIconBubble, { backgroundColor: theme.surfaceMuted }]}> 
          <MaterialCommunityIcons name="magnify" size={20} color={colors.teal} />
        </View>
        <View style={styles.searchInputWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder=""
            placeholderTextColor="transparent"
            style={[styles.searchInput, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType="search"
          />
          {!query ? (
            <View pointerEvents="box-none" style={styles.searchPlaceholderRow}>
              <Text style={[styles.searchPlaceholderLead, { color: theme.textMuted }]}>{t("search.searchFor", "Search for")}</Text>
              <Pressable
                accessibilityLabel={`Open ${searchSuggestions[suggestionIndex] || "Electrician"}`}
                accessibilityRole="button"
                onPress={() => openSuggestedService(searchSuggestions[suggestionIndex] || "Electrician")}
                style={({ pressed }) => [styles.searchSuggestionPill, pressed && styles.searchSuggestionPillPressed]}
              >
                <Text style={styles.searchSuggestionText} numberOfLines={1}>{searchSuggestions[suggestionIndex] || "Electrician"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (query.trim()) {
    return (
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id || item.name}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => <ServiceIconTile service={item} onPress={openService} />}
        numColumns={4}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: metrics.pagePadding }]}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textMuted }]}>No services found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: metrics.pagePadding }]}> 
      {listHeader}
      {serviceCategories.map((category, categoryIndex) => (
        <View key={category.id || category.title} style={[styles.categoryBlock, categoryIndex > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}> 
          <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
          {category.groups.map((group, index) => (
            <View key={`${category.id}-${group.title || index}`} style={styles.groupBlock}>
              {group.title ? <Text style={[styles.groupTitle, { color: theme.text }]}>{group.title}</Text> : null}
              <View style={styles.serviceGrid}>
                {group.services.map((service) => <ServiceIconTile key={service.id || service.name} service={service} onPress={openService} />)}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function ServiceIconTile({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);
  return (
    <Pressable style={({ pressed }) => [styles.serviceTile, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.iconBox, { backgroundColor: visual.bg }]}> 
        <MaterialCommunityIcons name={visual.icon} size={30} color={visual.color} />
        {service.badge ? (
          <View style={[styles.timeBadge, { backgroundColor: theme.surface }]}> 
            <Text style={[styles.timeBadgeText, { color: theme.teal }]}>{service.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.serviceName, { color: theme.text }]} numberOfLines={3}>{service.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  categoryBlock: {
    gap: 16,
    paddingTop: 22,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  empty: {
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 40,
    textAlign: "center",
  },
  groupBlock: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  header: {
    gap: 10,
    paddingTop: 18,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 12,
    height: 58,
    justifyContent: "center",
    position: "relative",
    width: 58,
  },
  listContent: {
    gap: 14,
    paddingBottom: 118,
    paddingTop: 6,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 118,
    paddingTop: 6,
  },
  searchIconBubble: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 48,
    minWidth: 0,
  },
  searchInputWrap: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  searchPlaceholderLead: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: "800",
  },
  searchPlaceholderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    left: 0,
    position: "absolute",
    right: 0,
  },
  searchSuggestionPill: {
    backgroundColor: colors.tealSoft,
    borderColor: "#b8efe2",
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    minHeight: 28,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchSuggestionPillPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  searchSuggestionText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
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
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },
  serviceName: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    marginTop: 7,
    minHeight: 42,
    textAlign: "center",
  },
  serviceTile: {
    alignItems: "center",
    marginBottom: 2,
    width: "25%",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  timeBadge: {
    borderColor: "#dbeafe",
    borderRadius: 4,
    borderWidth: 1,
    bottom: -8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute",
  },
  timeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
