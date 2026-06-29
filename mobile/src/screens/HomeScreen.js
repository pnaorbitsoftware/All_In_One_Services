import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
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
import ProfileCompletionBanner from "../components/ProfileCompletionBanner";

const PAGE_GAP = 16;
const defaultT = (_key, fallback) => fallback;
const HERO_ART = require("../assets/images/hero/servicehub-hero-v2.jpg");
const POPULAR_SERVICE_IMAGES = {
  "AC Repair": require("../assets/images/popular/ac-repair-v2.jpg"),
  "Washing Machine": require("../assets/images/popular/washing-machine-v2.jpg"),
  Refrigerator: require("../assets/images/popular/refrigerator-v2.jpg"),
  Electrician: require("../assets/images/popular/electrician-v2.jpg"),
  Plumber: require("../assets/images/popular/plumber-v2.jpg"),
  "Bathroom Cleaning": require("../assets/images/popular/bathroom-cleaning-v2.jpg"),
};

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
  profileIncomplete = false,
  onCompleteProfile,
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
      onViewDetails(payload);
    },
    [marketplaceServices, onViewDetails]
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

      <ProfileCompletionBanner visible={profileIncomplete} onPress={onCompleteProfile} />

      <HeroPanel onPress={() => openServiceProviders({ name: "Full Home Cleaning", category: "Bathroom & Kitchen Cleaning" })} />

      <SearchBar
        value={searchTerm}
        onChangeText={onSearchChange}
        suggestion={searchSuggestions[suggestionIndex] || "AC Repair"}
        onSuggestionPress={openSuggestedService}
        t={t}
      />

      {searchResults.length ? <SearchResults results={searchResults} onPress={openServiceProviders} /> : null}

      <DiscoveryStickers onPress={openServiceProviders} />

      <SectionHeader title="Popular services" actionLabel="View all" onAction={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
      <ServiceGrid services={quickServices} onPress={openServiceProviders} />

      <SectionHeader title="Offers for you" />
      <OfferCarousel
        banners={promoBanners}
        bannerWidth={bannerWidth}
        activeIndex={activeBanner}
        onScroll={handleBannerScroll}
        onAction={handleBookPress}
        scrollRef={bannerRef}
      />

      <SeasonalStory onPress={() => openServiceProviders({ name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning" })} />

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

      <FooterExperienceCard onPress={() => openServiceProviders({ name: "Providers", category: "Home services" })} />
    </ScrollView>
  );
}

function LocationHeader({ location, unreadCount, onOpenLocation, onOpenNotifications }) {
  const theme = useThemeColors();
  const label = location?.address || location?.label || "Select your location";

  return (
    <View style={styles.locationHeader}>
      <View style={styles.brandWrap}>
        <View style={[styles.brandIcon, { backgroundColor: theme.teal }]}> 
          <MaterialCommunityIcons name="home-heart" size={20} color="#ffffff" />
        </View>
        <View>
          <Text style={[styles.brandName, { color: theme.text }]}>ServiceHub</Text>
          <Text style={[styles.brandTagline, { color: theme.textMuted }]}>Trusted home services</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenLocation} style={({ pressed }) => [styles.locationChip, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="map-marker" size={16} color={theme.teal} />
        <Text style={[styles.locationChipText, { color: theme.text }]} numberOfLines={1}>{label}</Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={theme.textMuted} />
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

function HeroPanel({ onPress }) {
  const theme = useThemeColors();
  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(sparkle, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    intro.start();
    floating.start();
    twinkle.start();
    return () => {
      intro.stop();
      floating.stop();
      twinkle.stop();
    };
  }, [entrance, float, sparkle]);

  const imageTransform = {
    opacity: entrance,
    transform: [
      { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [2, -8] }) },
      { scale: float.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.055] }) },
    ],
  };
  const copyTransform = {
    opacity: entrance,
    transform: [{ translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
  };
  const sparkleTransform = {
    opacity: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    transform: [
      { scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.12] }) },
      { rotate: sparkle.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "8deg"] }) },
    ],
  };

  return (
    <View style={styles.heroPanel}> 
      <Animated.Image source={HERO_ART} style={[styles.heroArtwork, imageTransform]} resizeMode="cover" />
      <View style={styles.heroScrim} />
      <Animated.View style={[styles.heroCopy, copyTransform]}>
        <View style={styles.heroEyebrow}> 
          <MaterialCommunityIcons name="lightning-bolt" size={13} color="#ffffff" />
          <Text style={styles.heroEyebrowText}>READY IN MINUTES</Text>
        </View>
        <Text style={styles.heroTitle}>Your home,{"\n"}<Text style={styles.heroTitleAccent}>handled.</Text></Text>
        <Text style={styles.heroSubtitle}>Trusted pros for every fix, clean and upgrade.</Text>
        <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
          <Text style={styles.heroButtonText}>Book a service</Text>
          <MaterialCommunityIcons name="arrow-top-right" size={17} color="#101a35" />
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.heroFloatingSticker, styles.heroStickerTop, sparkleTransform]}>
        <MaterialCommunityIcons name="shimmer" size={19} color="#ffffff" />
      </Animated.View>
      <Animated.View style={[styles.heroFloatingSticker, styles.heroStickerBottom, imageTransform]}>
        <MaterialCommunityIcons name="shield-check" size={17} color="#246bfd" />
        <Text style={styles.heroStickerText}>4.9 rated</Text>
      </Animated.View>
      <View style={styles.heroPager}>
        <View style={styles.heroPagerActive} />
        <View style={styles.heroPagerDot} />
        <View style={styles.heroPagerDot} />
      </View>
    </View>
  );
}

function DiscoveryStickers({ onPress }) {
  const theme = useThemeColors();
  const stickers = [
    { label: "Monsoon ready", icon: "weather-rainy", color: "#2563eb", bg: "#e8f1ff", service: { name: "AC Repair", category: "AC & Appliance Repair" } },
    { label: "Deep clean", icon: "shimmer", color: "#0f9f78", bg: "#e5faf3", service: { name: "Bathroom Cleaning", category: "Bathroom & Kitchen Cleaning" } },
    { label: "Quick repairs", icon: "tools", color: "#f97316", bg: "#fff1e7", service: { name: "Electrician", category: "Electrician, Plumber & Carpenter" } },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRail}>
      {stickers.map((item) => (
        <Pressable key={item.label} onPress={() => onPress(item.service)} style={({ pressed }) => [styles.discoverySticker, { backgroundColor: item.bg }, pressed && styles.pressed]}>
          <View style={[styles.discoveryStickerIcon, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name={item.icon} size={18} color={item.color} /></View>
          <Text style={[styles.discoveryStickerText, { color: theme.text }]}>{item.label}</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color={item.color} />
        </Pressable>
      ))}
    </ScrollView>
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
          <View style={[styles.searchPlaceholderRow, { pointerEvents: "box-none" }]}>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickGrid}>
      {services.map((service) => <ServiceTile key={service.id || service.name} service={service} onPress={onPress} />)}
    </ScrollView>
  );
}

function ServiceTile({ service, onPress }) {
  const theme = useThemeColors();
  const visual = getServiceVisual(service);
  const image = POPULAR_SERVICE_IMAGES[service.name];
  return (
    <Pressable style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]} onPress={() => onPress(service)}>
      <View style={[styles.quickImageBox, { backgroundColor: service.bg || visual.bg }]}> 
        {image ? <Image source={image} style={styles.quickServiceImage} resizeMode="cover" /> : <MaterialCommunityIcons name={service.icon || visual.icon} size={34} color={service.color || visual.color} />}
        <View style={styles.quickImageShade} />
        {service.badge ? <View style={styles.quickTimeFloating}><MaterialCommunityIcons name="clock-fast" size={11} color="#ffffff" /><Text style={styles.quickTimeFloatingText}>{service.badge}</Text></View> : null}
      </View>
      <Text style={[styles.quickTitle, { color: theme.text }]} numberOfLines={2}>{service.name}</Text>
      <View style={styles.quickRatingRow}><MaterialCommunityIcons name="star" size={12} color={theme.amber} /><Text style={[styles.quickRatingText, { color: theme.textMuted }]}>4.8 · Verified</Text></View>
    </Pressable>
  );
}

function SeasonalStory({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.seasonalCard, pressed && styles.pressed]}>
      <View style={styles.seasonalBubbleOne} />
      <View style={styles.seasonalBubbleTwo} />
      <View style={styles.seasonalCopy}>
        <Text style={styles.seasonalKicker}>FRESH-HOME FEST</Text>
        <Text style={styles.seasonalTitle}>A cleaner home,{"\n"}a lighter week.</Text>
        <View style={styles.seasonalCta}><Text style={styles.seasonalCtaText}>Explore cleaning</Text><MaterialCommunityIcons name="arrow-right" size={15} color="#ffffff" /></View>
      </View>
      <View style={styles.seasonalArt}>
        <MaterialCommunityIcons name="spray-bottle" size={42} color="#ffffff" />
        <MaterialCommunityIcons name="shimmer" size={24} color="#fde68a" style={styles.seasonalSparkle} />
      </View>
      <View style={styles.seasonalSticker}><Text style={styles.seasonalStickerText}>20% OFF</Text></View>
    </Pressable>
  );
}

function FooterExperienceCard({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.footerExperience, pressed && styles.pressed]}>
      <View style={styles.footerExperienceTop}>
        <View style={styles.footerExperienceIcon}><MaterialCommunityIcons name="heart-flash" size={24} color="#101a35" /></View>
        <View style={styles.footerStars}><MaterialCommunityIcons name="star" size={14} color="#fbbf24" /><MaterialCommunityIcons name="star" size={18} color="#fbbf24" /><MaterialCommunityIcons name="star" size={14} color="#fbbf24" /></View>
      </View>
      <Text style={styles.footerExperienceTitle}>One app. Every home task.</Text>
      <Text style={styles.footerExperienceCopy}>Background-verified experts, transparent pricing and support whenever you need it.</Text>
      <View style={styles.footerExperienceButton}><Text style={styles.footerExperienceButtonText}>Meet our professionals</Text><MaterialCommunityIcons name="arrow-right" size={17} color="#101a35" /></View>
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
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Pressable style={({ pressed }) => [styles.providerMiniCard, { backgroundColor: theme.surface }, pressed && styles.pressed]} onPress={() => onPress(provider)}>
      <View style={[styles.providerAvatar, { backgroundColor: theme.surfaceMuted }]}>
        {profileImage && !imageFailed ? <Image source={{ uri: profileImage }} style={styles.providerImage} onError={() => setImageFailed(true)} /> : <MaterialCommunityIcons name={provider.icon || "account-hard-hat-outline"} size={24} color={theme.teal} />}
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
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    flexDirection: "row",
    gap: 12,
    marginRight: PAGE_GAP,
    minHeight: 146,
    overflow: "hidden",
    padding: 16,
    ...shadow,
  },
  bannerArt: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.lg,
    height: 94,
    justifyContent: "center",
    overflow: "hidden",
    width: 112,
  },
  bannerArtImage: {
    height: "100%",
    width: "100%",
  },
  bannerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    marginTop: 10,
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
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 25,
    marginTop: 5,
  },
  bannerTrack: {
    paddingRight: 2,
  },
  bellButton: {
    alignItems: "center",
    borderRadius: radius.xl,
    height: 44,
    justifyContent: "center",
    width: 44,
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
    borderColor: colors.border,
    borderWidth: 1,
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
    gap: 8,
    paddingTop: 14,
  },
  brandIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  brandWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
  },
  locationChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    maxWidth: 114,
    minHeight: 42,
    paddingHorizontal: 9,
  },
  locationChipText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
  },
  heroPanel: {
    backgroundColor: "#8fb8ff",
    borderRadius: 28,
    height: 270,
    overflow: "hidden",
    position: "relative",
    ...shadow,
  },
  heroArtwork: {
    bottom: -7,
    height: 284,
    left: -6,
    position: "absolute",
    right: -6,
    width: "103%",
  },
  heroScrim: {
    backgroundColor: "rgba(20, 35, 72, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: "61%",
  },
  heroCopy: {
    left: 18,
    maxWidth: "58%",
    position: "absolute",
    top: 20,
    zIndex: 2,
  },
  heroEyebrow: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 26, 53, 0.70)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroEyebrowText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 33,
    marginTop: 13,
    ...Platform.select({
      web: { textShadow: "0 2px 8px rgba(16,26,53,0.24)" },
      default: {
        textShadowColor: "rgba(16,26,53,0.24)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
  heroTitleAccent: {
    color: "#dff7ff",
  },
  heroSubtitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 8,
    opacity: 0.94,
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
    minHeight: 42,
    paddingHorizontal: 14,
    ...shadow,
  },
  heroButtonText: {
    color: "#101a35",
    fontSize: 12,
    fontWeight: "900",
  },
  heroFloatingSticker: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 999,
    borderWidth: 2,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    position: "absolute",
    ...shadow,
  },
  heroStickerTop: {
    backgroundColor: "#7c3aed",
    height: 42,
    right: 14,
    top: 16,
    width: 42,
  },
  heroStickerBottom: {
    bottom: 31,
    minHeight: 34,
    paddingHorizontal: 10,
    right: 13,
  },
  heroStickerText: {
    color: "#101a35",
    fontSize: 10,
    fontWeight: "900",
  },
  heroPager: {
    alignItems: "center",
    bottom: 11,
    flexDirection: "row",
    gap: 5,
    left: 18,
    position: "absolute",
  },
  heroPagerActive: {
    backgroundColor: "#ffffff",
    borderRadius: 99,
    height: 4,
    width: 20,
  },
  heroPagerDot: {
    backgroundColor: "rgba(255,255,255,0.46)",
    borderRadius: 99,
    height: 4,
    width: 5,
  },
  locationIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 46,
    justifyContent: "center",
    width: 46,
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
    borderColor: colors.border,
    borderWidth: 1,
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
    borderColor: colors.border,
    borderWidth: 1,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 8,
    width: 144,
    ...shadow,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 6,
    paddingRight: 4,
  },
  quickImageBox: {
    alignItems: "center",
    borderRadius: radius.lg,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
  },
  quickServiceImage: {
    height: "100%",
    width: "100%",
  },
  quickImageShade: {
    backgroundColor: "rgba(16,26,53,0.08)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  quickTimeFloating: {
    alignItems: "center",
    backgroundColor: "rgba(16,26,53,0.78)",
    borderRadius: 99,
    bottom: 7,
    flexDirection: "row",
    gap: 3,
    left: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
  },
  quickTimeFloatingText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  quickPreviewImage: {
    height: "100%",
    width: "100%",
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
    minHeight: 34,
  },
  quickRatingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  quickRatingText: {
    fontSize: 10,
    fontWeight: "800",
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 118,
  },
  searchBar: {
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
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
  stickerRail: {
    gap: 9,
    paddingRight: 4,
  },
  discoverySticker: {
    alignItems: "center",
    borderRadius: 17,
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 9,
    paddingRight: 12,
  },
  discoveryStickerIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  discoveryStickerText: {
    fontSize: 11,
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
  seasonalCard: {
    backgroundColor: "#7c3aed",
    borderRadius: 24,
    minHeight: 172,
    overflow: "hidden",
    padding: 18,
    position: "relative",
    ...shadow,
  },
  seasonalBubbleOne: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 90,
    height: 150,
    position: "absolute",
    right: -35,
    top: -44,
    width: 150,
  },
  seasonalBubbleTwo: {
    backgroundColor: "rgba(45,212,191,0.24)",
    borderRadius: 80,
    bottom: -70,
    height: 150,
    position: "absolute",
    right: 38,
    width: 150,
  },
  seasonalCopy: {
    maxWidth: "66%",
    zIndex: 2,
  },
  seasonalKicker: {
    color: "#ddd6fe",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  seasonalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 26,
    marginTop: 8,
  },
  seasonalCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 13,
  },
  seasonalCtaText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  seasonalArt: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 32,
    borderWidth: 1,
    height: 96,
    justifyContent: "center",
    position: "absolute",
    right: 17,
    top: 44,
    transform: [{ rotate: "7deg" }],
    width: 96,
  },
  seasonalSparkle: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  seasonalSticker: {
    backgroundColor: "#fbbf24",
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    right: 12,
    top: 10,
    transform: [{ rotate: "8deg" }],
  },
  seasonalStickerText: {
    color: "#101a35",
    fontSize: 9,
    fontWeight: "900",
  },
  footerExperience: {
    backgroundColor: "#101a35",
    borderRadius: 26,
    minHeight: 230,
    overflow: "hidden",
    padding: 20,
    position: "relative",
  },
  footerExperienceTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerExperienceIcon: {
    alignItems: "center",
    backgroundColor: "#67e8f9",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    transform: [{ rotate: "-7deg" }],
    width: 48,
  },
  footerStars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  footerExperienceTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 20,
  },
  footerExperienceCopy: {
    color: "#aebbd5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
    maxWidth: "90%",
  },
  footerExperienceButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  footerExperienceButtonText: {
    color: "#101a35",
    fontSize: 11,
    fontWeight: "900",
  },
});
