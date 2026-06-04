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

import { imageForService } from "../data/catalog";
import { allHomeServices, getServiceVisual, serviceCategories } from "../data/homeServicesData";
import { colors, responsiveMetrics, shadow, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;

function createServicePayload(item) {
  const visual = getServiceVisual(item);
  const category = item.category || item.name || "Home services";

  return {
    id: item.id || item.name,
    name: item.name,
    category,
    location: "Nearby",
    rating: item.rating || 4.8,
    reviews: item.reviews || 120,
    responseTime: item.badge || "Fast",
    price: item.price || "Contact for price",
    phone: "",
    description: `${item.name} by verified ServiceHub professionals.`,
    about: `Book ${item.name} from ServiceHub with trained local service partners.`,
    features: [item.name, "Verified professional", "Doorstep service"],
    image: imageForService(item),
    icon: visual.icon,
  };
}

export default function ServicesScreen({ onViewDetails, t = defaultT }) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const metrics = responsiveMetrics(width);
  const [query, setQuery] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const searchSuggestions = useMemo(() => {
    const defaultNames = [
      "Microwave repair",
      "Plumber",
      "Electrician",
      "Bathroom Cleaning",
      "Water Purifier",
      "Washing Machine Repair",
      "Carpenter",
      "Painting Service",
      "Smart Locks",
      "Cockroach Control",
    ];
    const categoryNames = new Set(serviceCategories.map((category) => category.title));
    const serviceNames = allHomeServices
      .map((service) => service.name)
      .filter((name) => name && !categoryNames.has(name));

    return [...new Set([...defaultNames, ...serviceNames])].slice(0, 16);
  }, []);

  useEffect(() => {
    if (query.trim() || searchSuggestions.length < 2) return undefined;

    const timer = setInterval(() => {
      setSuggestionIndex((current) => (current + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [query, searchSuggestions.length]);

  useEffect(() => {
    if (suggestionIndex < searchSuggestions.length) return;
    setSuggestionIndex(0);
  }, [searchSuggestions.length, suggestionIndex]);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const unique = new Map();
    allHomeServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""}`.toLowerCase();
      if (haystack.includes(normalized)) unique.set(service.name, service);
    });
    return [...unique.values()];
  }, [query]);

  const openService = useCallback(
    (service) => onViewDetails(createServicePayload(service)),
    [onViewDetails]
  );

  const openSuggestedService = useCallback(
    (name) => {
      const normalizedName = String(name || "").toLowerCase();
      const compactName = normalizedName.replace(/\s+repair$/, "").trim();
      const matchedService =
        allHomeServices.find((service) => String(service.name || "").toLowerCase() === normalizedName) ||
        allHomeServices.find((service) => String(service.name || "").toLowerCase() === compactName) ||
        allHomeServices.find((service) => {
          const serviceName = String(service.name || "").toLowerCase();
          return normalizedName.includes(serviceName) || serviceName.includes(compactName);
        });

      openService(matchedService || { id: `suggestion-${name}`, name, category: "Home services" });
    },
    [openService]
  );

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
                accessibilityLabel={`Open ${searchSuggestions[suggestionIndex] || "Plumber"}`}
                accessibilityRole="button"
                onPress={() => openSuggestedService(searchSuggestions[suggestionIndex] || "Plumber")}
                style={({ pressed }) => [styles.searchSuggestionPill, pressed && styles.searchSuggestionPillPressed]}
              >
                <Text style={styles.searchSuggestionText} numberOfLines={1}>
                  {searchSuggestions[suggestionIndex] || "Plumber"}
                </Text>
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
        renderItem={({ item }) => <ServiceGridCard service={item} onPress={openService} />}
        numColumns={2}
        columnWrapperStyle={{ gap: metrics.gutter }}
        contentContainerStyle={[
          styles.listContent,
          { gap: metrics.gutter, paddingHorizontal: metrics.pagePadding },
        ]}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textMuted }]}>No services found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: metrics.pagePadding },
      ]}
    >
      {listHeader}
      {serviceCategories.map((category) => (
        <View key={category.title} style={[styles.categoryBlock, { borderColor: theme.border }]}>
          <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
          {category.groups.map((group, index) => (
            <View key={`${category.title}-${group.title || index}`} style={styles.group}>
              {group.title ? <Text style={[styles.groupTitle, { color: theme.text }]}>{group.title}</Text> : null}
              <View style={styles.serviceGrid}>
                {group.services.map((service) => (
                  <ServiceIconCard
                    key={service.name}
                    service={{ ...service, category: category.title }}
                    onPress={openService}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function ServiceGridCard({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);

  return (
    <Pressable style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => onPress(service)}>
      <View style={[styles.resultIcon, { backgroundColor: visual.bg }]}>
        <MaterialCommunityIcons name={visual.icon} size={34} color={visual.color} />
      </View>
      <View style={styles.resultText}>
        <Text style={[styles.resultName, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
        <Text style={[styles.resultCategory, { color: theme.textMuted }]} numberOfLines={1}>{service.category || "Home service"}</Text>
      </View>
    </Pressable>
  );
}

function ServiceIconCard({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);

  return (
    <Pressable style={styles.iconCard} onPress={() => onPress(service)}>
      <View style={[styles.iconBox, { backgroundColor: visual.bg }]}>
        <View style={styles.iconHalo}>
          <MaterialCommunityIcons name={visual.icon} size={32} color={visual.color} />
        </View>
        {service.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{service.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.iconTitle, { color: theme.text }]} numberOfLines={3}>{service.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#ffffff",
    borderColor: "#dcefe8",
    borderRadius: 4,
    borderWidth: 1,
    bottom: -8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: "absolute",
  },
  badgeText: {
    color: "#0f8f68",
    fontSize: 11,
    fontWeight: "900",
  },
  categoryBlock: {
    borderBottomWidth: 1,
    gap: 18,
    paddingBottom: 24,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },
  empty: {
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 40,
    textAlign: "center",
  },
  group: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  header: {
    gap: 10,
    paddingTop: 18,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 12,
    height: 76,
    justifyContent: "center",
    width: "88%",
  },
  iconCard: {
    alignItems: "center",
    marginBottom: 20,
    width: "25%",
  },
  iconHalo: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.74)",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  iconTitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 10,
    paddingHorizontal: 2,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 118,
    paddingTop: 6,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minHeight: 166,
    padding: 12,
    ...shadow,
  },
  resultCategory: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  resultIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 82,
    justifyContent: "center",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  resultText: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 118,
    paddingTop: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 48,
    minWidth: 0,
  },
  searchIconBubble: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
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
