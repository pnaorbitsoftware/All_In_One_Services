import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
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
  mostBookedServices,
  noteworthyServices,
  promoBanners,
  quickServices,
  secondaryPromoBanners,
  serviceCategories,
} from "../data/homeServicesData";
import { buildMarketplace, iconForCategory, imageForService } from "../data/catalog";
import { prefetchServiceImages } from "../lib/images";
import { shadow } from "../theme";

const PAGE_GAP = 18;
const CARD_BG = "#f6f6f6";
const TEXT = "#111111";
const MUTED = "#737373";
const BORDER = "#e8e8e8";
const SEPARATOR = "#f4f4f4";
const GREEN = "#0f8f68";
const PURPLE = "#6f3ff5";

const defaultT = (_key, fallback) => fallback;

function createServicePayload(item, marketplaceServices = []) {
  const normalizedName = String(item.name || "").toLowerCase();
  const match = marketplaceServices.find((service) => {
    const serviceName = String(service.name || "").toLowerCase();
    const serviceCategory = String(service.category || "").toLowerCase();
    return serviceName.includes(normalizedName) || normalizedName.includes(serviceCategory);
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
  searchTerm,
  onSearchChange,
  dataSaver = false,
  t = defaultT,
}) {
  const { width } = useWindowDimensions();
  const pagePadding = Math.round(Math.min(Math.max(width * 0.045, 16), 24));
  const bannerWidth = Math.max(width - pagePadding * 2, 280);
  const [topActiveBanner, setTopActiveBanner] = useState(0);
  const [bottomActiveBanner, setBottomActiveBanner] = useState(0);
  const [allServicesOpen, setAllServicesOpen] = useState(false);
  const [searchSuggestionIndex, setSearchSuggestionIndex] = useState(0);
  const topBannerRef = useRef(null);
  const bottomBannerRef = useRef(null);

  const marketplaceServices = useMemo(() => buildMarketplace(catalogProviders), [catalogProviders]);

  const searchSuggestions = useMemo(() => {
    const defaultNames = [
      "Microwave repair",
      "Plumber",
      "Electrician",
      "Bathroom Cleaning",
      "Water Purifier",
      "AC Repair",
      "Washing Machine Repair",
      "Carpenter",
      "Painting Service",
      "Smart Locks",
    ];
    const categoryNames = new Set(serviceCategories.map((category) => category.title));
    const serviceNames = allHomeServices
      .map((service) => service.name)
      .filter((name) => name && !categoryNames.has(name));
    return [...new Set([...defaultNames, ...serviceNames].filter(Boolean))].slice(0, 16);
  }, []);

  useEffect(() => {
    if (dataSaver) return;
    prefetchServiceImages(marketplaceServices);
  }, [dataSaver, marketplaceServices]);

  useEffect(() => {
    if (searchTerm.trim() || searchSuggestions.length < 2) return undefined;

    const timer = setInterval(() => {
      setSearchSuggestionIndex((current) => (current + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [searchSuggestions.length, searchTerm]);

  useEffect(() => {
    if (searchSuggestionIndex < searchSuggestions.length) return;
    setSearchSuggestionIndex(0);
  }, [searchSuggestionIndex, searchSuggestions.length]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    const unique = new Map();
    allHomeServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.name, service);
    });
    marketplaceServices.forEach((service) => {
      const haystack = `${service.name} ${service.category || ""} ${service.description || ""}`.toLowerCase();
      if (haystack.includes(query)) unique.set(service.name, service);
    });

    return [...unique.values()].slice(0, 8);
  }, [marketplaceServices, searchTerm]);

  const handleServicePress = useCallback(
    (service) => {
      onViewDetails(createServicePayload(service, marketplaceServices));
    },
    [marketplaceServices, onViewDetails]
  );

  const handleSuggestionPress = useCallback(
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

      handleServicePress(matchedService || { id: `suggestion-${name}`, name, category: "Home services" });
    },
    [handleServicePress]
  );

  const handleBookPress = useCallback(
    (service) => {
      onBook(createServicePayload(service, marketplaceServices));
    },
    [marketplaceServices, onBook]
  );

  const handleTopBannerScroll = useCallback(
    (event) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
      setTopActiveBanner(Math.min(Math.max(nextIndex, 0), promoBanners.length - 1));
    },
    [bannerWidth]
  );

  const handleBottomBannerScroll = useCallback(
    (event) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
      setBottomActiveBanner(Math.min(Math.max(nextIndex, 0), secondaryPromoBanners.length - 1));
    },
    [bannerWidth]
  );

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.content, { paddingHorizontal: pagePadding }]}>
          <Header />

          <SearchBar
            value={searchTerm}
            onChangeText={onSearchChange}
            suggestion={searchSuggestions[searchSuggestionIndex] || "Microwave repair"}
            onSuggestionPress={handleSuggestionPress}
            t={t}
          />
          {searchResults.length ? <SearchResults results={searchResults} onPress={handleServicePress} /> : null}

          <PromoCarousel
            banners={promoBanners}
            bannerWidth={bannerWidth}
            activeIndex={topActiveBanner}
            onScroll={handleTopBannerScroll}
            onAction={handleBookPress}
            scrollRef={topBannerRef}
          />

          <QuickServiceGrid services={quickServices} onPress={handleServicePress} />

          <PromoCarousel
            banners={secondaryPromoBanners}
            bannerWidth={bannerWidth}
            activeIndex={bottomActiveBanner}
            onScroll={handleBottomBannerScroll}
            onAction={handleBookPress}
            scrollRef={bottomBannerRef}
          />

          {catalogError && marketplaceServices.length ? <Text style={styles.softError}>{catalogError}</Text> : null}
          {catalogLoading && !marketplaceServices.length ? <Text style={styles.loadingText}>Loading live providers...</Text> : null}
        </View>

        <View style={styles.separator} />

        <View style={[styles.content, { paddingHorizontal: pagePadding }]}>
          <SectionHeader title="New and noteworthy" />
          <HorizontalServiceList data={noteworthyServices} onPress={handleServicePress} />

          <SectionHeader title="Most booked services" />
          <HorizontalServiceList
            data={mostBookedServices}
            onPress={handleServicePress}
            onAdd={handleBookPress}
            product
          />

          <Pressable style={styles.allServicesButton} onPress={() => setAllServicesOpen(true)}>
            <MaterialCommunityIcons name="view-grid-outline" size={20} color="#ffffff" />
            <Text style={styles.allServicesButtonText}>See all services</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AllServicesSheet
        visible={allServicesOpen}
        categories={serviceCategories}
        onClose={() => setAllServicesOpen(false)}
        onServicePress={handleServicePress}
      />
    </>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="wrench" size={28} color={PURPLE} />
      </View>
      <Text style={styles.headerTitle}>
        <Text style={styles.headerTitleStrong}>Service</Text>
        <Text style={styles.headerTitleMuted}> Hub</Text>
      </Text>
    </View>
  );
}

function SearchBar({ value, onChangeText, suggestion, onSuggestionPress, t }) {
  const showSuggestion = !value;

  return (
    <View style={styles.searchBar}>
      <View style={styles.searchIconBubble}>
        <MaterialCommunityIcons name="magnify" size={23} color={PURPLE} />
      </View>
      <View style={styles.searchInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          placeholderTextColor="transparent"
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {showSuggestion ? (
          <View pointerEvents="box-none" style={styles.searchPlaceholderRow}>
            <Text style={styles.searchPlaceholderLead}>{t("search.searchFor", "Search for")}</Text>
            <Pressable
              accessibilityLabel={`Open ${suggestion}`}
              accessibilityRole="button"
              onPress={() => onSuggestionPress(suggestion)}
              style={({ pressed }) => [styles.searchSuggestionPill, pressed && styles.searchSuggestionPillPressed]}
            >
              <Text style={styles.searchSuggestionText} numberOfLines={1}>
                {suggestion}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SearchResults({ results, onPress }) {
  return (
    <View style={styles.searchResults}>
      {results.map((item) => (
        <Pressable key={`${item.id || item.name}-result`} style={styles.searchResultRow} onPress={() => onPress(item)}>
          <MaterialCommunityIcons name={item.icon || iconForCategory(item.category)} size={20} color={PURPLE} />
          <Text style={styles.searchResultText} numberOfLines={1}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function QuickServiceGrid({ services, onPress }) {
  return (
    <View style={styles.quickGrid}>
      {services.map((service) => (
        <QuickServiceCard key={service.id} service={service} onPress={onPress} />
      ))}
    </View>
  );
}

function QuickServiceCard({ service, onPress }) {
  const visual = getServiceVisual(service);
  return (
    <Pressable style={styles.quickCard} onPress={() => onPress(service)}>
      <View style={[styles.quickImageBox, { backgroundColor: visual.bg }]}>
        <View style={styles.serviceIconHalo}>
          <MaterialCommunityIcons name={visual.icon} size={44} color={visual.color} />
        </View>
        {service.badge ? <TimeBadge label={service.badge} style={styles.quickBadge} /> : null}
      </View>
      <Text style={styles.quickTitle} numberOfLines={3}>{service.name}</Text>
    </Pressable>
  );
}

function PromoCarousel({ banners, bannerWidth, activeIndex, onScroll, onAction, scrollRef }) {
  const goToNextBanner = useCallback(() => {
    if (!banners.length) return;

    const nextIndex = activeIndex >= banners.length - 1 ? 0 : activeIndex + 1;
    scrollRef.current?.scrollTo({
      x: nextIndex * (bannerWidth + PAGE_GAP),
      animated: true,
    });
  }, [activeIndex, bannerWidth, banners.length, scrollRef]);

  return (
    <View style={styles.carouselWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={bannerWidth + PAGE_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerTrack}
        onMomentumScrollEnd={onScroll}
      >
        {banners.map((banner) => (
          <PromoBanner key={banner.id} banner={banner} width={bannerWidth} onAction={onAction} />
        ))}
      </ScrollView>
      {banners.length > 1 ? (
        <Pressable
          accessibilityLabel="Show next banner"
          accessibilityRole="button"
          hitSlop={10}
          onPress={goToNextBanner}
          style={({ pressed }) => [styles.carouselNextButton, pressed && styles.carouselNextButtonPressed]}
        >
          <MaterialCommunityIcons name="chevron-right" size={30} color="#ffffff" />
        </Pressable>
      ) : null}
      <View style={styles.dots}>
        {banners.map((banner, index) => (
          <View key={`${banner.id}-dot`} style={[styles.dot, activeIndex === index && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

function PromoBanner({ banner, width, onAction }) {
  return (
    <View style={[styles.banner, { width }]}>
      <View style={styles.bannerText}>
        {banner.eyebrow ? <Text style={[styles.bannerEyebrow, { color: banner.accent }]}>{banner.eyebrow}</Text> : null}
        <Text style={styles.bannerTitle}>{banner.title}</Text>
        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
        <Pressable
          style={styles.bannerButton}
          onPress={() =>
            onAction({
              id: banner.id,
              name: banner.serviceName || banner.subtitle || banner.title,
              category: banner.category || banner.title,
              icon: banner.icon,
              price: "Contact for price",
            })
          }
        >
          <Text style={styles.bannerButtonText}>{banner.action}</Text>
        </Pressable>
      </View>
      <View style={[styles.bannerArt, { backgroundColor: `${banner.accent}18` }]}>
        <MaterialCommunityIcons name={banner.icon} size={72} color={banner.accent} />
      </View>
    </View>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HorizontalServiceList({ data, onPress, onAdd, product = false }) {
  const renderItem = useCallback(
    ({ item }) =>
      product ? (
        <ServiceProductCard service={item} onPress={onPress} onAdd={onAdd} />
      ) : (
        <ServiceIconCard service={item} onPress={onPress} wide />
      ),
    [onAdd, onPress, product]
  );

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
      windowSize={5}
    />
  );
}

function ServiceProductCard({ service, onPress, onAdd }) {
  const visual = getServiceVisual(service);
  return (
    <Pressable style={styles.productCard} onPress={() => onPress(service)}>
      <View style={[styles.productImage, { backgroundColor: visual.bg }]}>
        <View style={styles.productIconHalo}>
          <MaterialCommunityIcons name={visual.icon} size={48} color={visual.color} />
        </View>
      </View>
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={2}>{service.name}</Text>
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={13} color="#111111" />
          <Text style={styles.ratingText}>{service.rating}</Text>
        </View>
        <Text style={styles.priceText} numberOfLines={1}>{service.price}</Text>
        <Pressable style={styles.addButton} onPress={() => onAdd(service)}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function AllServicesSheet({ visible, categories, onClose, onServicePress }) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <Pressable style={styles.sheetClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color={TEXT} />
          </Pressable>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {categories.map((category) => (
              <CategorySection
                key={category.title}
                category={category}
                onServicePress={(service) => {
                  onClose();
                  onServicePress({ ...service, category: category.title });
                }}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CategorySection({ category, onServicePress }) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      {category.groups.map((group, index) => (
        <View key={`${category.title}-${group.title || index}`} style={styles.categoryGroup}>
          {group.title ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
          <View style={styles.serviceIconGrid}>
            {group.services.map((service) => (
              <ServiceIconCard key={service.name} service={service} onPress={onServicePress} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function ServiceIconCard({ service, onPress, wide = false }) {
  const visual = getServiceVisual(service);
  return (
    <Pressable style={[styles.iconCard, wide && styles.wideIconCard]} onPress={() => onPress(service)}>
      <View style={[styles.iconImageBox, { backgroundColor: visual.bg }]}>
        <View style={styles.smallIconHalo}>
          <MaterialCommunityIcons name={visual.icon} size={wide ? 40 : 34} color={visual.color} />
        </View>
        {service.badge ? <TimeBadge label={service.badge} style={styles.iconBadge} /> : null}
      </View>
      <Text style={styles.iconCardTitle} numberOfLines={wide ? 2 : 3}>{service.name}</Text>
    </Pressable>
  );
}

function TimeBadge({ label, style }) {
  return (
    <View style={[styles.timeBadge, style]}>
      <Text style={styles.timeBadgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: "#4b4b4b",
    width: 48,
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: "#c7b7ff",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  addButtonText: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "900",
  },
  allServicesButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: TEXT,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 52,
  },
  allServicesButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  banner: {
    backgroundColor: "#f7f7f7",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginRight: PAGE_GAP,
    minHeight: 210,
    overflow: "hidden",
    padding: 18,
  },
  bannerArt: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 88,
    height: 140,
    justifyContent: "center",
    width: 140,
  },
  bannerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#2f2f2f",
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  bannerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  bannerEyebrow: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  bannerSubtitle: {
    color: "#262626",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
    marginTop: 7,
  },
  bannerText: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  bannerTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 32,
    marginTop: 5,
  },
  bannerTrack: {
    paddingRight: 2,
  },
  carouselWrap: {
    gap: 14,
    marginTop: 12,
    position: "relative",
  },
  carouselNextButton: {
    alignItems: "center",
    backgroundColor: GREEN,
    borderColor: "#ffffff",
    borderRadius: 999,
    borderWidth: 3,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: -10,
    top: 82,
    width: 46,
    zIndex: 5,
    ...shadow,
  },
  carouselNextButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  categoryGroup: {
    gap: 18,
  },
  categorySection: {
    borderBottomColor: SEPARATOR,
    borderBottomWidth: 8,
    gap: 24,
    paddingBottom: 28,
    paddingTop: 26,
  },
  categoryTitle: {
    color: TEXT,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 34,
  },
  content: {
    backgroundColor: "#ffffff",
    gap: 22,
    paddingBottom: 22,
    paddingTop: 18,
  },
  dot: {
    backgroundColor: "#eeeeee",
    borderRadius: 999,
    height: 6,
    width: 28,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
  },
  groupTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
    paddingTop: 18,
  },
  headerIcon: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerTitle: {
    fontSize: 36,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headerTitleMuted: {
    color: "#737373",
    fontWeight: "700",
  },
  headerTitleStrong: {
    color: TEXT,
    fontWeight: "900",
  },
  horizontalList: {
    gap: 14,
    paddingRight: 4,
  },
  iconBadge: {
    bottom: -8,
  },
  iconCard: {
    alignItems: "center",
    marginBottom: 4,
    width: "25%",
  },
  iconCardTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 12,
    minHeight: 38,
    paddingHorizontal: 2,
    textAlign: "center",
  },
  iconImageBox: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 10,
    height: 82,
    justifyContent: "center",
    width: "88%",
  },
  loadingText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  priceText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  productBody: {
    flex: 1,
    paddingTop: 10,
  },
  productCard: {
    width: 164,
  },
  productImage: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    height: 124,
    justifyContent: "center",
    width: "100%",
  },
  productName: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    minHeight: 42,
  },
  quickBadge: {
    bottom: -10,
  },
  quickCard: {
    alignItems: "center",
    flexBasis: "31%",
    flexGrow: 0,
    marginBottom: 20,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickImageBox: {
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    height: 108,
    justifyContent: "center",
    width: "100%",
  },
  quickTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 13,
    minHeight: 62,
    textAlign: "center",
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 6,
  },
  ratingText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    backgroundColor: "#ffffff",
    paddingBottom: 118,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e7dcff",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    paddingHorizontal: 11,
    ...shadow,
  },
  searchIconBubble: {
    alignItems: "center",
    backgroundColor: "#f1ebff",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  searchInput: {
    color: TEXT,
    fontSize: 16,
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
    color: MUTED,
    flexShrink: 0,
    fontSize: 15,
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
    backgroundColor: "#ecfdf5",
    borderColor: "#b8efe2",
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    minHeight: 30,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchSuggestionPillPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  searchSuggestionText: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  searchResultRow: {
    alignItems: "center",
    borderBottomColor: SEPARATOR,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
  },
  searchResultText: {
    color: TEXT,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  productIconHalo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 24,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  searchResults: {
    backgroundColor: "#ffffff",
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -12,
    paddingHorizontal: 12,
    ...shadow,
  },
  sectionAction: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: "900",
  },
  serviceIconHalo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    borderRadius: 28,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sectionTitle: {
    color: TEXT,
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0,
  },
  separator: {
    backgroundColor: SEPARATOR,
    height: 12,
  },
  serviceIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 28,
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "86%",
    overflow: "hidden",
    paddingHorizontal: 26,
  },
  sheetClose: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 50,
    justifyContent: "center",
    marginBottom: 6,
    marginRight: -8,
    marginTop: 12,
    width: 50,
  },
  sheetContent: {
    paddingBottom: 34,
  },
  sheetOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    flex: 1,
    justifyContent: "flex-end",
  },
  smallIconHalo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 20,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  softError: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeBadge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dcefe8",
    borderRadius: 3,
    borderWidth: 1,
    minHeight: 25,
    paddingHorizontal: 7,
    position: "absolute",
  },
  timeBadgeText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "900",
  },
  wideIconCard: {
    width: 136,
  },
});
