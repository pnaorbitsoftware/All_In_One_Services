import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  allHomeServices,
  getServiceVisual,
  promoBanners,
  quickServices,
  serviceCategories,
} from "../data/homeServicesData";
import { buildMarketplace, iconForCategory, imageForService } from "../data/catalog";
import { prefetchServiceImages } from "../lib/images";
import { colors, radius, shadow, useThemeColors } from "../theme";

const PAGE_GAP = 16;
const defaultT = (_key, fallback) => fallback;

function createServicePayload(item, marketplaceServices = []) {
  const normalizedName = String(item.name || "").toLowerCase();
  const match = marketplaceServices.find((service) => {
    const serviceName = String(service.name || "").toLowerCase();
    const serviceCategory = String(service.category || "").toLowerCase();
    return serviceName.includes(normalizedName) || normalizedName.includes(serviceCategory) || normalizedName.includes(serviceName);
  });

  if (match) {
    return {
      ...match,
      name: item.name || match.name,
      category: item.category || match.category,
      description: item.description || `${item.name || match.name} by verified ServiceHub professionals.`,
      about: item.about || `Book ${item.name || match.name} from ServiceHub with trained local service partners.`,
      features: [item.name || match.category, "Verified professional", "Doorstep service"],
      image: imageForService(item),
      icon: item.icon || match.icon,
    };
  }

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
    description: item.description || `${item.name} by verified ServiceHub professionals.`,
    about: item.about || `Book ${item.name} from ServiceHub with trained local service partners.`,
    features: [item.name, "Verified professional", "Doorstep service"],
    image: imageForService(item),
    icon: item.icon || iconForCategory(category),
  };
}

export default function HomeScreen({
  catalogProviders,
  catalogLoading,
  catalogError,
  refreshing,
  onRefresh,
  onBook,
  onViewDetails,
  onOpenProvidersForService,
  searchTerm,
  onSearchChange,
  dataSaver = false,
  selectedLocation,
  onOpenLocation,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  t = defaultT,
}) {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const pagePadding = Math.round(Math.min(Math.max(width * 0.045, 16), 24));
  const bannerWidth = Math.max(width - pagePadding * 2, 280);
  const [activeBanner, setActiveBanner] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const bannerRef = useRef(null);

  const marketplaceServices = useMemo(() => buildMarketplace(catalogProviders), [catalogProviders]);
  const recommendedProviders = useMemo(() => marketplaceServices.filter((provider) => provider.isBookable !== false).slice(0, 8), [marketplaceServices]);

  const searchSuggestions = useMemo(() => {
    const requested = ["AC Repair", "Washing Machine", "Electrician", "Bathroom Cleaning", "Sofa Cleaning"];
    const categoryNames = new Set(serviceCategories.map((category) => category.title));
    const serviceNames = allHomeServices.map((service) => service.name).filter((name) => name && !categoryNames.has(name));
    return [...new Set([...requested, ...serviceNames])].slice(0, 16);
  }, []);

  useEffect(() => {
    if (dataSaver) return;
    prefetchServiceImages(marketplaceServices);
  }, [dataSaver, marketplaceServices]);

  useEffect(() => {
    if (searchTerm.trim() || searchSuggestions.length < 2) return undefined;
    const timer = setInterval(() => setSuggestionIndex((current) => (current + 1) % searchSuggestions.length), 1600);
    return () => clearInterval(timer);
  }, [searchSuggestions.length, searchTerm]);

  useEffect(() => {
    if (!promoBanners.length) return undefined;
    const timer = setInterval(() => {
      setActiveBanner((current) => {
        const next = current >= promoBanners.length - 1 ? 0 : current + 1;
        bannerRef.current?.scrollTo({ x: next * (bannerWidth + PAGE_GAP), animated: true });
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [bannerWidth]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const unique = new Map();
    allHomeServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.name, service);
    });
    marketplaceServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""} ${service.description || ""} ${service.location || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.id || service.name, service);
    });

    return [...unique.values()].slice(0, 8);
  }, [marketplaceServices, searchTerm]);

  const openServiceProviders = useCallback(
    (service) => {
      const payload = createServicePayload(service, marketplaceServices);
      if (onOpenProvidersForService) {
        onOpenProvidersForService(payload);
        return;
      }
      onViewDetails(payload);
    },
    [marketplaceServices, onOpenProvidersForService, onViewDetails]
  );

  const handleBookPress = useCallback(
    (service) => onBook(createServicePayload(service, marketplaceServices)),
    [marketplaceServices, onBook]
  );

  const openSuggestedService = useCallback(
    (name) => {
      const normalizedName = String(name || "").toLowerCase();
      const compactName = normalizedName.replace(/\s+service$/, "").replace(/\s+repair$/, "").trim();
      const matchedService =
        allHomeServices.find((service) => String(service.name || "").toLowerCase() === normalizedName) ||
        allHomeServices.find((service) => String(service.name || "").toLowerCase().includes(compactName)) ||
        { id: `suggestion-${name}`, name, category: "Home services" };
      openServiceProviders(matchedService);
    },
    [openServiceProviders]
  );

  const handleBannerScroll = useCallback(
    (event) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / (bannerWidth + PAGE_GAP));
      setActiveBanner(Math.min(Math.max(nextIndex, 0), promoBanners.length - 1));
    },
    [bannerWidth]
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.teal]} tintColor={theme.teal} />}
      contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background, paddingHorizontal: pagePadding }]}
    >
      <LocationHeader
        location={selectedLocation}
        unreadCount={unreadNotificationsCount}
        onOpenLocation={onOpenLocation}
        onOpenNotifications={onOpenNotifications}
      />

      <SearchBar
        value={searchTerm}
        onChangeText={onSearchChange}
        suggestion={searchSuggestions[suggestionIndex] || "AC Repair"}
        onSuggestionPress={openSuggestedService}
        t={t}
      />

      {searchResults.length ? <SearchResults results={searchResults} onPress={openServiceProviders} /> : null}

      <SectionHeader title="Offers & discounts" />
      <OfferCarousel
        banners={promoBanners}
        bannerWidth={bannerWidth}
        activeIndex={activeBanner}
        onScroll={handleBannerScroll}
        onAction={handleBookPress}
        scrollRef={bannerRef}
      />

      <SectionHeader title="Popular services" actionLabel="View all" onAction={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
      <ServiceGrid services={quickServices} onPress={openServiceProviders} />

      {catalogError && marketplaceServices.length ? (
        <Text style={[styles.softError, { backgroundColor: theme.roseSoft, color: theme.rose }]}>{catalogError}</Text>
      ) : null}
      {catalogLoading && !marketplaceServices.length ? <SkeletonRow /> : null}

      <SectionHeader title="Recommended providers" actionLabel="See all" onAction={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
      <FlatList
        data={recommendedProviders}
        horizontal
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProviderMiniCard provider={item} onPress={onViewDetails} onBook={onBook} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ListEmptyComponent={<Text style={[styles.emptyInline, { color: theme.textMuted }]}>Providers will appear here.</Text>}
      />
    </ScrollView>
  );
}

function LocationHeader({ location, unreadCount, onOpenLocation, onOpenNotifications }) {
  const theme = useThemeColors();
  const label = location?.address || location?.label || "Select your location";

  return (
    <View style={styles.locationHeader}>
      <Pressable accessibilityRole="button" onPress={onOpenLocation} style={({ pressed }) => [styles.locationPressable, pressed && styles.pressed]}>
        <View style={[styles.locationIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={22} color={theme.teal} />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={[styles.locationLabel, { color: theme.textMuted }]}>Location</Text>
          <View style={styles.locationValueRow}>
            <Text style={[styles.locationValue, { color: theme.text }]} numberOfLines={1}>{label}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={theme.textMuted} />
          </View>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpenNotifications} style={({ pressed }) => [styles.bellButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="bell-outline" size={23} color={theme.text} />
        {unreadCount ? (
          <View style={[styles.notificationBadge, { backgroundColor: theme.rose }]}>
            <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function SearchBar({ value, onChangeText, suggestion, onSuggestionPress, t }) {
  const theme = useThemeColors();
  const showSuggestion = !value;

  return (
    <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
      <MaterialCommunityIcons name="magnify" size={22} color={theme.textMuted} />
      <View style={styles.searchInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          placeholderTextColor="transparent"
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {showSuggestion ? (
          <View pointerEvents="box-none" style={styles.searchPlaceholderRow}>
            <Text style={[styles.searchPlaceholderLead, { color: theme.textMuted }]}>{t("search.searchFor", "Search for")}</Text>
            <Pressable accessibilityRole="button" onPress={() => onSuggestionPress(suggestion)} style={({ pressed }) => [styles.searchSuggestionPill, { backgroundColor: theme.tealSoft }, pressed && styles.pressed]}>
              <Text style={[styles.searchSuggestionText, { color: theme.teal }]} numberOfLines={1}>{suggestion}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SearchResults({ results, onPress }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.searchResults, { backgroundColor: theme.surface }]}> 
      {results.map((item) => (
        <Pressable key={`${item.id || item.name}-result`} style={styles.searchResultRow} onPress={() => onPress(item)}>
          <MaterialCommunityIcons name={item.icon || iconForCategory(item.category)} size={20} color={theme.teal} />
          <View style={styles.searchResultTextWrap}>
            <Text style={[styles.searchResultText, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.searchResultMeta, { color: theme.textMuted }]} numberOfLines={1}>{item.category || item.location || "Service"}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function OfferCarousel({ banners, bannerWidth, activeIndex, onScroll, onAction, scrollRef }) {
  const theme = useThemeColors();
  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={bannerWidth + PAGE_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerTrack}
        onMomentumScrollEnd={onScroll}
      >
        {banners.map((banner) => <OfferBanner key={banner.id} banner={banner} width={bannerWidth} onAction={onAction} />)}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((banner, index) => (
          <View key={`${banner.id}-dot`} style={[styles.dot, { backgroundColor: theme.border }, activeIndex === index && { backgroundColor: theme.teal, width: 28 }]} />
        ))}
      </View>
    </View>
  );
}

function OfferBanner({ banner, width, onAction }) {
  const theme = useThemeColors();
  return (
    <Pressable style={[styles.banner, { backgroundColor: theme.surface, width }]} onPress={() => onAction({ id: banner.id, name: banner.serviceName || banner.subtitle || banner.title, category: banner.category || banner.title, icon: banner.icon, price: "Contact for price" })}>
      <View style={styles.bannerText}>
        {banner.eyebrow ? <Text style={[styles.bannerEyebrow, { color: banner.accent }]}>{banner.eyebrow}</Text> : null}
        <Text style={[styles.bannerTitle, { color: theme.text }]}>{banner.title}</Text>
        <Text style={[styles.bannerSubtitle, { color: theme.textMuted }]}>{banner.subtitle}</Text>
        <View style={[styles.bannerButton, { backgroundColor: theme.slate }]}>
          <Text style={styles.bannerButtonText}>{banner.action}</Text>
        </View>
      </View>
      <View style={[styles.bannerArt, { backgroundColor: `${banner.accent}18` }]}>
        <MaterialCommunityIcons name={banner.icon || "briefcase-check-outline"} size={54} color={banner.accent} />
      </View>
    </Pressable>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  const theme = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: theme.teal }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ServiceGrid({ services, onPress }) {
  return (
    <View style={styles.quickGrid}>
      {services.map((service) => <ServiceTile key={service.id || service.name} service={service} onPress={onPress} />)}
    </View>
  );
}

function ServiceTile({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.quickImageBox, { backgroundColor: service.bg || visual.bg }]}>
        <MaterialCommunityIcons name={service.icon || visual.icon} size={34} color={service.color || visual.color} />
        {service.badge ? <Text style={[styles.timeBadge, { color: theme.teal, backgroundColor: theme.surface }]}>{service.badge}</Text> : null}
      </View>
      <Text style={[styles.quickTitle, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
    </Pressable>
  );
}

function HorizontalServiceList({ data, onPress, product = false }) {
  const renderItem = useCallback(({ item }) => (product ? <ServiceProductCard service={item} onPress={onPress} /> : <ServiceIconCard service={item} onPress={onPress} />), [onPress, product]);
  return (
    <FlatList
      data={data}
      horizontal
      keyExtractor={(item) => item.id || item.name}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
    />
  );
}

function ServiceIconCard({ service, onPress }) {
  const theme = useThemeColors();
  return (
    <Pressable style={({ pressed }) => [styles.iconCard, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.iconImageBox, { backgroundColor: theme.surfaceMuted }]}>
        <Image source={imageForService(service)} style={styles.iconPreviewImage} resizeMode="cover" />
      </View>
      <Text style={[styles.iconCardTitle, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
    </Pressable>
  );
}

function ServiceProductCard({ service, onPress }) {
  const theme = useThemeColors();
  return (
    <Pressable style={({ pressed }) => [styles.productCard, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.productImage, { backgroundColor: theme.surfaceMuted }]}>
        <Image source={imageForService(service)} style={styles.productPreviewImage} resizeMode="cover" />
      </View>
      <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
      <Text style={[styles.priceText, { color: theme.textMuted }]} numberOfLines={1}>{service.price || "Contact for price"}</Text>
    </Pressable>
  );
}

function ProviderMiniCard({ provider, onPress, onBook }) {
  const theme = useThemeColors();
  const profileImage = provider.profileImage || "";
  return (
    <Pressable style={({ pressed }) => [styles.providerMiniCard, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(provider)}>
      <View style={[styles.providerAvatar, { backgroundColor: theme.surfaceMuted }]}>
        {profileImage ? <Image source={{ uri: profileImage }} style={styles.providerImage} /> : <MaterialCommunityIcons name={provider.icon || "account-hard-hat-outline"} size={24} color={theme.teal} />}
      </View>
      <Text style={[styles.providerName, { color: theme.text }]} numberOfLines={1}>{provider.name}</Text>
      <Text style={[styles.providerCategory, { color: theme.textMuted }]} numberOfLines={1}>{provider.category}</Text>
      <View style={styles.providerMetaRow}>
        <MaterialCommunityIcons name="star" size={13} color={theme.amber} />
        <Text style={[styles.providerMeta, { color: theme.textMuted }]}>{provider.rating || "New"}</Text>
      </View>
      <Pressable disabled={!provider.isBookable} onPress={() => onBook(provider)} style={[styles.providerBookButton, { backgroundColor: provider.isBookable ? theme.teal : theme.surfaceMuted }]}>
        <Text style={[styles.providerBookText, { color: provider.isBookable ? "#ffffff" : theme.textMuted }]}>{provider.isBookable ? "Book" : "Unavailable"}</Text>
      </Pressable>
    </Pressable>
  );
}

function SkeletonRow() {
  const theme = useThemeColors();
  return (
    <View style={styles.skeletonRow}>
      {[0, 1, 2].map((item) => <View key={item} style={[styles.skeletonCard, { backgroundColor: theme.surfaceMuted }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: 12,
    marginRight: PAGE_GAP,
    minHeight: 172,
    overflow: "hidden",
    padding: 18,
    ...shadow,
  },
  bannerArt: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.lg,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
    width: 132,
  },
  bannerArtImage: {
    height: "100%",
    width: "100%",
  },
  bannerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bannerButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  bannerEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  bannerText: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 29,
    marginTop: 5,
  },
  bannerTrack: {
    paddingRight: 2,
  },
  bellButton: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 48,
    justifyContent: "center",
    width: 48,
    ...shadow,
  },
  carouselWrap: {
    gap: 12,
  },
  dot: {
    borderRadius: 999,
    height: 5,
    width: 16,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  emptyInline: {
    fontSize: 13,
    fontWeight: "800",
    paddingVertical: 22,
  },
  horizontalList: {
    gap: 12,
    paddingRight: 4,
  },
  iconCard: {
    borderRadius: radius.lg,
    gap: 10,
    padding: 10,
    width: 126,
    ...shadow,
  },
  iconCardTitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    minHeight: 36,
  },
  iconImageBox: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 82,
    justifyContent: "center",
    overflow: "hidden",
  },
  iconPreviewImage: {
    height: "100%",
    width: "100%",
  },
  locationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
  },
  locationIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  locationPressable: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  locationTextWrap: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  locationValue: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
  },
  locationValueRow: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  notificationBadge: {
    alignItems: "center",
    borderRadius: 999,
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: 5,
    top: 5,
  },
  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  productCard: {
    borderRadius: radius.lg,
    padding: 10,
    width: 150,
    ...shadow,
  },
  productImage: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 86,
    justifyContent: "center",
    overflow: "hidden",
  },
  productPreviewImage: {
    height: "100%",
    width: "100%",
  },
  productName: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
    marginTop: 10,
    minHeight: 38,
  },
  providerAvatar: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
    width: 52,
  },
  providerBookButton: {
    alignItems: "center",
    borderRadius: radius.sm,
    marginTop: 10,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  providerBookText: {
    fontSize: 12,
    fontWeight: "900",
  },
  providerCategory: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  providerImage: {
    height: "100%",
    width: "100%",
  },
  providerMeta: {
    fontSize: 12,
    fontWeight: "800",
  },
  providerMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  providerMiniCard: {
    borderRadius: radius.lg,
    padding: 12,
    width: 158,
    ...shadow,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
  },
  quickCard: {
    flexBasis: "31%",
    flexGrow: 0,
    gap: 9,
    marginBottom: 18,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickImageBox: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 82,
    justifyContent: "center",
    overflow: "hidden",
  },
  quickPreviewImage: {
    height: "100%",
    width: "100%",
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    minHeight: 34,
    textAlign: "center",
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 118,
  },
  searchBar: {
    alignItems: "center",
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 15,
    ...shadow,
  },
  searchInput: {
    fontSize: 15,
    fontWeight: "800",
    minHeight: 50,
    paddingVertical: 0,
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
  searchResults: {
    borderRadius: radius.lg,
    marginTop: -8,
    paddingHorizontal: 12,
    ...shadow,
  },
  searchResultMeta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  searchResultRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: "900",
  },
  searchResultTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  searchSuggestionPill: {
    borderRadius: 999,
    flexShrink: 1,
    minHeight: 28,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchSuggestionText: {
    fontSize: 13,
    fontWeight: "900",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "900",
  },
  sectionBlock: {
    gap: 0,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
  },
  skeletonCard: {
    borderRadius: radius.lg,
    height: 92,
    flex: 1,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
  },
  softError: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeBadge: {
    borderRadius: radius.sm,
    bottom: -9,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: "absolute",
  },
});




