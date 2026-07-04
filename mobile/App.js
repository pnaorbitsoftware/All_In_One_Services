
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Appearance, BackHandler, Dimensions, Keyboard, Linking, Platform, Pressable, Share, StatusBar, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import BottomNav from "./src/components/BottomNav";
import { LoadingState } from "./src/components/StateView";
import Toast from "./src/components/Toast";
import OfflineBanner from "./src/components/OfflineBanner";
import {
  authApi,
  bookingApi,
  catalogApi,
  contactApi,
  notificationApi,
  normalizeProvider,
  normalizeProviderDashboard,
  normalizeUser,
  paymentApi,
  providerApi,
} from "./src/lib/api";
import { createTranslator, normalizeLanguage } from "./src/lib/i18n";
import { getCurrentReadableLocation, watchProviderLocation } from "./src/lib/location";
import { useNetworkStatus } from "./src/lib/network";
import {
  clearSession,
  defaultSettings,
  loadAddresses,
  loadPaymentMethods,
  loadRecentLocations,
  loadSelectedLocation,
  loadSession,
  loadSettings,
  saveAddresses,
  savePaymentMethods,
  saveRecentLocations,
  saveSelectedLocation,
  saveSession,
  saveSettings,
} from "./src/lib/storage";
import AccountScreen from "./src/screens/AccountScreen";
import BookingsScreen from "./src/screens/BookingsScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import PaymentsScreen from "./src/screens/PaymentsScreen";
import ProviderScreen from "./src/screens/ProviderScreen";
import ProvidersScreen from "./src/screens/ProvidersScreen";
import ServicesScreen from "./src/screens/ServicesScreen";
import TrackingScreen from "./src/screens/TrackingScreen";
import AccountProfileSheet from "./src/sheets/AccountProfileSheet";
import AddressBookSheet from "./src/sheets/AddressBookSheet";
import AuthSheet from "./src/sheets/AuthSheet";
import BookingSheet from "./src/sheets/BookingSheet";
import CancelReasonSheet from "./src/sheets/CancelReasonSheet";
import ContactUsSheet from "./src/sheets/ContactUsSheet";
import LocationSearchSheet from "./src/sheets/LocationSearchSheet";
import EstimateSheet from "./src/sheets/EstimateSheet";
import MyBookingsSheet from "./src/sheets/MyBookingsSheet";
import PaymentCheckoutSheet from "./src/sheets/PaymentCheckoutSheet";
import PaymentMethodsSheet from "./src/sheets/PaymentMethodsSheet";
import PaymentConfirmationSheet from "./src/sheets/PaymentConfirmationSheet";
import ProviderProfileSheet from "./src/sheets/ProviderProfileSheet";
import ServiceDetailSheet from "./src/sheets/ServiceDetailSheet";
import SettingsSheet from "./src/sheets/SettingsSheet";
import ShareFallbackSheet from "./src/sheets/ShareFallbackSheet";
import { applyAppearanceMode, colors, getAppearanceColors, ThemeColorsProvider } from "./src/theme";


const windowMetrics = Dimensions.get("window");
const safeAreaInitialMetrics = initialWindowMetrics || {
  frame: {
    x: 0,
    y: 0,
    width: windowMetrics.width,
    height: windowMetrics.height,
  },
  insets: {
    top: StatusBar.currentHeight || 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
};

const APP_SHARE_LINK = process.env.EXPO_PUBLIC_APP_LINK || "https://servicehub.aparaitech.org/";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNAVAILABLE_STATUSES = ["inactive", "absent"];
const PROVIDER_DEFAULT_TAB = "provider";
const USER_DEFAULT_TAB = "home";
SplashScreen.preventAutoHideAsync().catch(() => {});

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("ServiceHub app render error", error);
    SplashScreen.hideAsync().catch(() => {});
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorBoundary}>
          <Text style={styles.errorBoundaryTitle}>ServiceHub could not open this screen.</Text>
          <Text style={styles.errorBoundaryCopy}>Please try again. Your login and bookings are safe.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ error: null })}
            style={({ pressed }) => [styles.errorBoundaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.errorBoundaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

function validateAuthForm({ mode, role, form, otpSent }) {
  const email = form.email.trim();

  if (!email) {
    return "Enter your email address.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  if (mode === "login") {
    if (!form.password) {
      return "Enter your password.";
    }

    return "";
  }

  if (otpSent) {
    if (!form.otp.trim()) {
      return "Enter the email OTP to finish registration.";
    }

    return "";
  }

  if (!form.name.trim()) {
    return "Enter your full name.";
  }

  if (!form.phone.trim()) {
    return "Enter your phone number.";
  }

  if (role === "user" && !form.address.trim()) {
    return "Enter your service address.";
  }

  if (form.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (form.password !== form.confirmPassword) {
    return "Re-enter password must match your password.";
  }

  if (
    role === "provider" &&
    (!form.providerName.trim() ||
      !form.category.trim() ||
      !form.location.trim() ||
      !form.price.trim() ||
      !form.responseTime.trim() ||
      String(form.aadhaarNumber || "").replace(/\D/g, "").length !== 12 ||
      !form.aadhaarCardImage)
  ) {
    return "Complete provider details, enter 12-digit Aadhaar number, and upload Aadhaar card before registering.";
  }

  return "";
}

function ServiceHubApp() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [settings, setSettings] = useState(defaultSettings);
  const [persistedSettings, setPersistedSettings] = useState(defaultSettings);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const network = useNetworkStatus();
  const trackingSubscriptionRef = useRef(null);

  const [catalogProviders, setCatalogProviders] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  const [providerData, setProviderData] = useState(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerRefreshing, setProviderRefreshing] = useState(false);
  const [providerError, setProviderError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProviderService, setSelectedProviderService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedService, setSelectedService] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [pendingBookingContext, setPendingBookingContext] = useState(null);
  const [trackingBookingId, setTrackingBookingId] = useState("");
  const [trackingBackTab, setTrackingBackTab] = useState("bookings");
  const [providerProfileOpen, setProviderProfileOpen] = useState(false);
  const [providerCancelBooking, setProviderCancelBooking] = useState(null);
  const [providerEstimateBooking, setProviderEstimateBooking] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState("settings");
  const [shareFallbackOpen, setShareFallbackOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [addressesOpen, setAddressesOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("user");
  const [authSessionKey, setAuthSessionKey] = useState(0);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [accountProfileOpen, setAccountProfileOpen] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [estimateSubmitting, setEstimateSubmitting] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [addressesSubmitting, setAddressesSubmitting] = useState(false);
  const [paymentMethodsSubmitting, setPaymentMethodsSubmitting] = useState(false);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [paymentCheckout, setPaymentCheckout] = useState(null);

  const [paymentCheckoutError, setPaymentCheckoutError] = useState("");
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsRefreshing, setNotificationsRefreshing] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([loadSession(), loadSettings(), loadAddresses(), loadPaymentMethods(), loadSelectedLocation(), loadRecentLocations()])
      .then(async ([session, savedSettings, savedAddresses, savedPaymentMethods, savedLocation, savedRecentLocations]) => {
        if (!mounted) return;
        let restoredUser = normalizeUser(session.user);
        let restoredToken = session.token;

        if (restoredToken) {
          try {
            const refreshed = await authApi.me(restoredToken);
            restoredUser = normalizeUser(refreshed.user);
            await saveSession(restoredToken, restoredUser);
          } catch {
            restoredToken = "";
            restoredUser = null;
            await clearSession();
          }
        }

        if (!mounted) return;
        setToken(restoredToken);
        setUser(restoredUser);
        setSettings(savedSettings);
        setPersistedSettings(savedSettings);
        setAddresses(savedAddresses);
        setPaymentMethods(savedPaymentMethods);
        setSelectedLocation(savedLocation);
        setRecentLocations(savedRecentLocations);
        if (restoredUser?.role === "provider") setActiveTab("provider");
      })
      .catch(async () => {
        try {
          await clearSession();
        } catch {
          // If storage itself is unavailable, continue with in-memory defaults.
        }

        if (!mounted) return;
        setToken("");
        setUser(null);
        setSettings(defaultSettings);
        setPersistedSettings(defaultSettings);
        setAddresses([]);
        setPaymentMethods([]);
        setSelectedLocation(null);
        setRecentLocations([]);
      })
      .finally(() => {
        if (mounted) setBooting(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!booting) SplashScreen.hideAsync().catch(() => {});
  }, [booting]);

  useEffect(() => () => {
    trackingSubscriptionRef.current?.remove?.();
    trackingSubscriptionRef.current = null;
  }, []);

  const effectiveAppearance = settings.appearance === "system" ? systemColorScheme || "light" : settings.appearance;
  const appColors = getAppearanceColors(effectiveAppearance);
  const language = normalizeLanguage(settings.language);
  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    applyAppearanceMode(effectiveAppearance);
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(settings.appearance === "system" ? null : settings.appearance);
    }
  }, [effectiveAppearance, settings.appearance]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadCatalog = useCallback(async (refreshing = false) => {
    if (refreshing) setCatalogRefreshing(true);
    else setCatalogLoading(true);
    setCatalogError("");

    try {
      const data = await catalogApi.list();
      setCatalogProviders(data.providers || []);
    } catch (error) {
      setCatalogError(error.message);
    } finally {
      setCatalogLoading(false);
      setCatalogRefreshing(false);
    }
  }, []);

  const loadBookings = useCallback(
    async (refreshing = false) => {
      if (!token || !user) {
        setBookings([]);
        return;
      }

      if (refreshing) setBookingsRefreshing(true);
      else setBookingsLoading(true);
      setBookingsError("");

      try {
        const data = await bookingApi.my(token);
        setBookings(data.bookings || []);
      } catch (error) {
        setBookingsError(error.message);
      } finally {
        setBookingsLoading(false);
        setBookingsRefreshing(false);
      }
    },
    [loadCatalog, token, user]
  );

  const loadProviderDashboard = useCallback(
    async (refreshing = false) => {
      if (!token || user?.role !== "provider") {
        setProviderData(null);
        return;
      }

      if (refreshing) setProviderRefreshing(true);
      else setProviderLoading(true);
      setProviderError("");

      try {
        const dashboard = await providerApi.dashboard(token);
        const normalized = normalizeProviderDashboard(dashboard);

        if (!normalized.dashboardLocked) {
          try {
            const earnings = await paymentApi.providerEarnings(token);
            setProviderData(normalizeProviderDashboard({ ...dashboard, ...earnings, paymentSummary: earnings.summary }));
            return;
          } catch {
            setProviderData(normalized);
            return;
          }
        }

        setProviderData(normalized);
      } catch (error) {
        setProviderError(error.message);
      } finally {
        setProviderLoading(false);
        setProviderRefreshing(false);
      }
    },
    [token, user]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const loadNotifications = useCallback(
    async (refreshing = false) => {
      if (refreshing) setNotificationsRefreshing(true);
      else setNotificationsLoading(true);
      setNotificationsError("");

      if (!token) {
        setNotifications([]);
        setNotificationsLoading(false);
        setNotificationsRefreshing(false);
        return;
      }

      try {
        const data = await notificationApi.list(token);
        const nextNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications(nextNotifications);
      } catch (error) {
        setNotifications([]);
        setNotificationsError(error.message || "Notifications could not be loaded.");
      } finally {
        setNotificationsLoading(false);
        setNotificationsRefreshing(false);
      }
    },
    [token]
  );

  const openNotificationsScreen = useCallback(() => {
    setActiveTab("notifications");
    loadNotifications(true);
  }, [loadNotifications]);

  const markNotificationRead = useCallback(
    async (notification) => {
      if (!notification) return;
      const notificationId = notification.id || notification._id;
      setNotifications((current) => current.map((item) => ((item.id || item._id) === notificationId ? { ...item, read: true } : item)));
      if (!token || !notificationId) return;

      try {
        await notificationApi.markRead(token, notificationId);
      } catch (error) {
        setNotificationsError(error.message || "Notification could not be marked as read.");
      }
    },
    [token]
  );

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    if (!token) return;

    try {
      await notificationApi.markAllRead(token);
    } catch (error) {
      setNotificationsError(error.message || "Notifications could not be marked as read.");
    }
  }, [token]);

  const saveLocationChoice = useCallback(
    async (location) => {
      if (!location?.address) return null;
      const nextLocation = {
        id: location.id || `${location.latitude || "manual"}-${Date.now()}`,
        label: location.label || location.address,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp || new Date().toISOString(),
        source: location.source || "selected",
      };

      const deduped = [nextLocation, ...recentLocations.filter((item) => item.address !== nextLocation.address)].slice(0, 6);
      setSelectedLocation(nextLocation);
      setRecentLocations(deduped);
      await Promise.all([saveSelectedLocation(nextLocation), saveRecentLocations(deduped)]);
      setLocationSearchOpen(false);
      return nextLocation;
    },
    [recentLocations]
  );

  const useCurrentLocationForHome = useCallback(async () => {
    setLocatingAddress(true);
    try {
      const location = await getCurrentReadableLocation();
      await saveLocationChoice({ ...location, source: "gps" });
      setToast("Location updated.");
      return location;
    } catch (error) {
      setToast(error.message || "Location permission is required to detect your current address.");
      return null;
    } finally {
      setLocatingAddress(false);
    }
  }, [saveLocationChoice]);

  const openProvidersForService = useCallback((service) => {
    setSelectedProviderService(service || null);
    setSearchTerm("");
    setActiveTab("providers");
  }, []);

  const clearProviderServiceFilter = useCallback(() => setSelectedProviderService(null), []);
  const openTrackingScreen = useCallback((booking) => {
    const bookingId = booking?._id || booking?.id || booking;
    if (!bookingId) {
      setToast("Booking tracking is not available yet.");
      return;
    }
    setTrackingBookingId(String(bookingId));
    setTrackingBackTab(activeTab === "tracking" ? "bookings" : activeTab || "bookings");
    setActiveTab("tracking");
  }, [activeTab]);

  const closeTrackingScreen = useCallback(() => {
    setActiveTab(trackingBackTab || "bookings");
  }, [trackingBackTab]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (token && user) {
      loadBookings();
    }
  }, [loadBookings, token, user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (token && user?.role === "provider") {
      loadProviderDashboard();
    }
  }, [loadProviderDashboard, token, user]);

  const openAuth = useCallback((mode = "login", role = "user") => {
    setAuthMode(mode);
    setAuthRole(role === "provider" ? "provider" : "user");
    setAuthSessionKey((current) => current + 1);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const changeAuthMode = useCallback((mode) => {
    setAuthMode(mode);
    if (mode === "register" && authRole !== "provider") setAuthRole("user");
  }, [authRole]);

  const changeAuthRole = useCallback((role) => setAuthRole(role === "provider" ? "provider" : "user"), []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (toast) {
        setToast("");
        return true;
      }

      if (authOpen) {
        setAuthOpen(false);
        return true;
      }

      if (locationSearchOpen) {
        setLocationSearchOpen(false);
        return true;
      }

      if (selectedService) {
        setSelectedService(null);
        return true;
      }

      if (bookingService) {
        setBookingService(null);
        return true;
      }

      if (accountProfileOpen) {
        setAccountProfileOpen(false);
        return true;
      }

      if (providerProfileOpen) {
        setProviderProfileOpen(false);
        return true;
      }

      if (settingsOpen) {
        setSettings(persistedSettings);
        setSettingsOpen(false);
        return true;
      }

      if (shareFallbackOpen) {
        setShareFallbackOpen(false);
        return true;
      }

      if (contactOpen) {
        setContactOpen(false);
        return true;
      }

      if (myBookingsOpen) {
        setMyBookingsOpen(false);
        return true;
      }

      if (addressesOpen) {
        setAddressesOpen(false);
        return true;
      }

      if (paymentMethodsOpen) {
        setPaymentMethodsOpen(false);
        return true;
      }

      if (providerCancelBooking) {
        setProviderCancelBooking(null);
        return true;
      }

      if (providerEstimateBooking) {
        setProviderEstimateBooking(null);
        return true;
      }

      if (paymentCheckout && !paymentVerifying) {
        setPaymentCheckout(null);
        setPaymentCheckoutError("");
        return true;
      }

      if (paymentConfirmation) {
        setPaymentConfirmation(null);
        return true;
      }

      if (activeTab === "tracking") {
        closeTrackingScreen();
        return true;
      }

      const defaultTab = user?.role === "provider" ? PROVIDER_DEFAULT_TAB : USER_DEFAULT_TAB;
      if (activeTab !== defaultTab) {
        setSelectedProviderService(null);
        setActiveTab(defaultTab);
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [
    accountProfileOpen,
    activeTab,
    addressesOpen,
    authOpen,
    bookingService,
    closeTrackingScreen,
    contactOpen,
    locationSearchOpen,
    myBookingsOpen,
    paymentCheckout,
    paymentConfirmation,
    paymentMethodsOpen,
    paymentVerifying,
    providerCancelBooking,
    providerEstimateBooking,
    providerProfileOpen,
    selectedService,
    shareFallbackOpen,
    settingsOpen,
    persistedSettings,
    toast,
    user?.role,
  ]);

  const handleAuthSubmit = useCallback(
    async ({ mode, role, form, otpSent }) => {
      const validationMessage = validateAuthForm({ mode, role, form, otpSent });

      if (validationMessage) {
        setToast(validationMessage);
        return null;
      }

      Keyboard.dismiss();
      setAuthSubmitting(true);

      try {
        const providerCategoryIsPreset = ["Electrician", "Plumber", "AC Repair", "Washing Machine", "Bathroom Cleaning", "Painting & Water-proofing"].includes(form.category.trim());
        const providerCategory = providerCategoryIsPreset ? form.category.trim() : "Other";
        const customProviderCategory = providerCategoryIsPreset ? "" : form.category.trim();
        const body =
          mode === "login"
            ? {
                email: form.email.trim(),
                password: form.password,
                role,
              }
            : {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                confirmPassword: form.confirmPassword,
                phone: form.phone.trim(),
                address: form.address.trim(),
                role,
                providerName: form.providerName.trim(),
                category: role === "provider" ? providerCategory : form.category.trim(),
                customCategory: role === "provider" ? customProviderCategory : "",
                location: form.location.trim(),
                preferredWorkLocation: form.location.trim(),
                price: form.price.trim(),
                responseTime: form.responseTime.trim(),
                aadhaarCardImage: form.aadhaarCardImage || "",
                aadhaarNumber: String(form.aadhaarNumber || "").replace(/\D/g, ""),
                aadhaarFrontUrl: form.aadhaarCardImage || "",
                aadhaarDocumentUrl: form.aadhaarCardImage || "",
                aadhaarDocumentName: "aadhaar-card.jpg",
                otp: otpSent ? form.otp.trim() : undefined,
              };

        const data = mode === "login" ? await authApi.login(body) : await authApi.register(body);

        if (data.requiresOtp) {
          setToast(data.message || "OTP sent to registered email.");
          return data;
        }

        const nextUser = normalizeUser(data.user);
        await saveSession(data.token, nextUser);
        setToken(data.token);
        setUser(nextUser);
        setAuthOpen(false);

        if (nextUser?.role === "user" && pendingBookingContext?.service) {
          if (nextUser.profileComplete === true) {
            setActiveTab(pendingBookingContext.sourceTab || "providers");
            setBookingService(pendingBookingContext.service);
            setPendingBookingContext(null);
            setToast("Logged in successfully. Continue your booking.");
          } else {
            setActiveTab(pendingBookingContext.sourceTab || "providers");
            setAccountProfileOpen(true);
            setToast("Logged in successfully. Complete your profile to continue booking.");
          }
        } else {
          setToast(mode === "login" ? "Logged in successfully." : role === "provider" ? "Provider profile submitted. Wait for website admin approval." : "Account created successfully.");
          setActiveTab(nextUser?.role === "provider" ? "provider" : "home");
        }

        return data;
      } catch (error) {
        setToast(error.message);
        return null;
      } finally {
        setAuthSubmitting(false);
      }
    },
    [pendingBookingContext]
  );

  const requestPasswordResetOtp = useCallback(async ({ role, identifier }) => {
    Keyboard.dismiss();
    setAuthSubmitting(true);

    try {
      const data = await authApi.forgotPasswordOtp({
        role,
        identifier: identifier.trim(),
      });
      setToast(data.message || "OTP sent to registered email.");
      return data;
    } catch (error) {
      setToast(error.message);
      return null;
    } finally {
      setAuthSubmitting(false);
    }
  }, []);

  const verifyPasswordResetOtp = useCallback(async ({ role, identifier, otp }) => {
    Keyboard.dismiss();
    setAuthSubmitting(true);

    try {
      const data = await authApi.forgotPasswordVerify({
        role,
        identifier: identifier.trim(),
        otp: otp.trim(),
      });
      setToast(data.message || "OTP verified.");
      return data;
    } catch (error) {
      setToast(error.message);
      return null;
    } finally {
      setAuthSubmitting(false);
    }
  }, []);

  const resetPassword = useCallback(async ({ role, identifier, password, resetToken }) => {
    Keyboard.dismiss();
    setAuthSubmitting(true);

    try {
      const data = await authApi.resetPassword({
        role,
        identifier: identifier.trim(),
        password,
        resetToken,
      });
      setToast(data.message || "Password updated successfully.");
      return data;
    } catch (error) {
      setToast(error.message);
      return null;
    } finally {
      setAuthSubmitting(false);
    }
  }, []);

  const sendMobileOtp = useCallback(async (phone) => {
    Keyboard.dismiss();
    setMobileOtpSending(true);
    setMobileOtpError("");
    setMobileOtpDevCode("");

    try {
      const data = await authApi.sendMobileOtp({ phone });
      setMobileOtpDevCode(data.devOtp || "");
      setToast(data.message || "OTP sent.");
      return true;
    } catch (error) {
      setMobileOtpError(error.message || "OTP could not be sent.");
      return false;
    } finally {
      setMobileOtpSending(false);
    }
  }, []);

  const verifyMobileOtp = useCallback(async ({ phone, otp }) => {
    Keyboard.dismiss();
    setMobileOtpVerifying(true);
    setMobileOtpError("");

    try {
      const data = await authApi.verifyMobileOtp({ phone, otp });
      const nextUser = normalizeUser(data.user);
      await saveSession(data.token, nextUser);
      setToken(data.token);
      setUser(nextUser);
      setActiveTab("home");
      setMobileOtpDevCode("");
      setToast(data.message || "Logged in successfully.");
      return true;
    } catch (error) {
      setMobileOtpError(error.message || "OTP verification failed.");
      return false;
    } finally {
      setMobileOtpVerifying(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await clearSession();
    setToken("");
    setUser(null);
    setBookings([]);
    setProviderData(null);
    setPendingBookingContext(null);
    setActiveTab("home");
    setAuthOpen(false);
    setToast("Logged out successfully.");
  }, []);

  const openBooking = useCallback(
    (service) => {
      const unavailable = service?.isBookable === false || UNAVAILABLE_STATUSES.includes(service?.availabilityStatus);
      if (unavailable) {
        setToast("Provider is currently unavailable.");
        return;
      }

      if (!token || !user) {
        setPendingBookingContext({ service, form: null, sourceTab: activeTab });
        setSelectedService(null);
        setToast("Please login or create a client account to continue booking.");
        openAuth("login", "user");
        return;
      }

      setSelectedService(null);
      setBookingService(service);
    },
    [activeTab, openAuth, token, user]
  );

  const getCurrentLocationForForm = useCallback(async () => {
    setLocatingAddress(true);
    try {
      return await getCurrentReadableLocation();
    } catch (error) {
      setToast(error.message || "Could not detect your current location.");
      return null;
    } finally {
      setLocatingAddress(false);
    }
  }, []);

  const mergeProviderData = useCallback((provider) => {
    setProviderData((current) => {
      const normalized = normalizeProviderDashboard(current || {});
      return {
        ...normalized,
        provider: normalizeProvider({
          ...normalized.provider,
          ...provider,
        }),
      };
    });
  }, []);

  const updateProviderAvailability = useCallback(
    async (availabilityStatus) => {
      if (!token) return;
      setProviderSubmitting(true);
      try {
        const data = await providerApi.updateAvailability(token, availabilityStatus);
        mergeProviderData(data.provider);
        await loadCatalog(true);
        setToast(UNAVAILABLE_STATUSES.includes(availabilityStatus) ? "Provider is currently unavailable." : "Provider availability updated.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setProviderSubmitting(false);
      }
    },
    [loadCatalog, mergeProviderData, token]
  );

  const startProviderTracking = useCallback(async () => {
    if (!token) return;
    setProviderSubmitting(true);
    try {
      const location = await getCurrentReadableLocation();
      const data = await providerApi.startTracking(token, location);
      mergeProviderData(data.provider);
      setToast("Duty tracking started.");
    } catch (error) {
      setToast(error.message || "Could not start duty tracking.");
    } finally {
      setProviderSubmitting(false);
    }
  }, [mergeProviderData, token]);

  const stopProviderTracking = useCallback(async () => {
    if (!token) return;
    trackingSubscriptionRef.current?.remove?.();
    trackingSubscriptionRef.current = null;
    setProviderSubmitting(true);
    try {
      const data = await providerApi.stopTracking(token);
      mergeProviderData(data.provider);
      setToast("Duty tracking stopped.");
    } catch (error) {
      setToast(error.message || "Could not stop duty tracking.");
    } finally {
      setProviderSubmitting(false);
    }
  }, [mergeProviderData, token]);

  useEffect(() => {
    if (!token || user?.role !== "provider" || !providerData?.provider?.trackingActive) return undefined;

    let cancelled = false;
    watchProviderLocation(
      async (location) => {
        if (cancelled) return;
        try {
          const data = await providerApi.updateTrackingLocation(token, location);
          if (!cancelled) mergeProviderData(data.provider);
        } catch (error) {
          if (!cancelled) setToast(error.message || "Could not update duty location.");
        }
      },
      (error) => {
        if (!cancelled) setToast(error.message || "Location tracking stopped.");
      }
    )
      .then((subscription) => {
        if (cancelled) {
          subscription?.remove?.();
          return;
        }
        trackingSubscriptionRef.current = subscription;
      })
      .catch((error) => {
        if (!cancelled) setToast(error.message || "Could not start location watcher.");
      });

    return () => {
      cancelled = true;
      trackingSubscriptionRef.current?.remove?.();
      trackingSubscriptionRef.current = null;
    };
  }, [mergeProviderData, providerData?.provider?.trackingActive, token, user?.role]);

  const submitBooking = useCallback(
    async (form) => {
      if (!token) {
        setPendingBookingContext({
          service: bookingService,
          form,
          sourceTab: activeTab,
        });
        openAuth("login", "user");
        return;
      }

      if (user?.role === "user" && user?.profileComplete !== true) {
        setPendingBookingContext({ service: bookingService, form, sourceTab: activeTab });
        setBookingService(null);
        setAccountProfileOpen(true);
        setToast("Your choices are saved. Complete your profile to confirm.");
        return;
      }

      setBookingSubmitting(true);
      try {
        const data = await bookingApi.create(token, form);
        setBookings((current) => [data.booking, ...current]);
        setBookingService(null);
        setActiveTab(user?.role === "provider" ? "provider" : "providers");
        setToast("Booking saved. Provider will respond soon.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setBookingSubmitting(false);
      }
    },
    [activeTab, bookingService, openAuth, token, user]
  );

  const cancelClientBooking = useCallback(
    (booking) => {
      Alert.alert("Cancel booking", "Do you want to cancel this booking?", [
        { text: "Keep booking", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await bookingApi.cancel(token, booking._id);
              setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
              setToast("Booking cancelled successfully.");
            } catch (error) {
              setToast(error.message);
            }
          },
        },
      ]);
    },
    [token]
  );

  const acceptProviderRequest = useCallback(
    async (booking) => {
      try {
        const data = await providerApi.acceptBooking(token, booking._id);
        setProviderData((current) => {
          const normalized = normalizeProviderDashboard(current || {});
          return {
            ...normalized,
            availableRequests: normalized.availableRequests.filter((item) => item._id !== booking._id),
            bookings: [data.booking, ...normalized.bookings],
          };
        });
        setToast("Request accepted.");
      } catch (error) {
        setToast(error.message);
      }
    },
    [token]
  );

  const updateProviderTrackingStatus = useCallback(
    (booking, status) => {
      if (!booking?._id || !status) return;

      const runUpdate = async () => {
        try {
          const data = await bookingApi.updateTracking(token, booking._id, { status });
          setProviderData((current) => {
            const normalized = normalizeProviderDashboard(current || {});
            return {
              ...normalized,
              bookings: normalized.bookings.map((item) => (item._id === booking._id ? data.booking : item)),
            };
          });
          setToast(`${status} updated.`);
          loadBookings(true);
        } catch (error) {
          setToast(error.message);
        }
      };

      if (status === "Completed") {
        Alert.alert("Complete service", "Mark this service as completed?", [
          { text: "Not yet", style: "cancel" },
          { text: "Complete", onPress: runUpdate },
        ]);
        return;
      }

      runUpdate();
    },
    [loadBookings, token]
  );

  const completeProviderJob = useCallback(
    (booking) => updateProviderTrackingStatus(booking, "Completed"),
    [updateProviderTrackingStatus]
  );

  const submitProviderEstimate = useCallback(
    async (amount) => {
      if (!providerEstimateBooking) return;

      setEstimateSubmitting(true);
      try {
        const data = await paymentApi.submitEstimate(token, providerEstimateBooking._id, amount);
        setProviderData((current) => {
          const normalized = normalizeProviderDashboard(current || {});
          return {
            ...normalized,
            bookings: normalized.bookings.map((item) => (item._id === providerEstimateBooking._id ? data.booking : item)),
          };
        });
        setProviderEstimateBooking(null);
        setToast("Estimate sent to client.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setEstimateSubmitting(false);
      }
    },
    [providerEstimateBooking, token]
  );

  const acceptClientEstimate = useCallback(
    async (booking) => {
      try {
        const data = await paymentApi.acceptEstimate(token, booking._id);
        setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
        setToast("Estimate accepted. Continue to final estimate payment.");
      } catch (error) {
        setToast(error.message);
      }
    },
    [token]
  );
  const payClientEstimate = useCallback(
    async (booking) => {
      try {
        const data = await paymentApi.createOrder(token, booking._id);
        setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
        if (data.gateway !== "razorpay" || !data.keyId || !data.orderId) {
          setToast(data.message || "Payment order created.");
          return;
        }

        setPaymentCheckout({ booking: data.booking || booking, order: data, paymentResponse: null });
        setPaymentCheckoutError("");
      } catch (error) {
        setToast(error?.description || error?.message || "Payment could not be completed.");
      }
    },
    [token]
  );

  const verifyClientEstimatePayment = useCallback(
    async (paymentResponse) => {
      const checkoutBooking = paymentCheckout?.booking;
      const bookingId = checkoutBooking?._id || checkoutBooking?.id;

      if (!bookingId) {
        setToast("Booking details are missing for payment verification.");
        return;
      }

      if (!paymentResponse?.razorpay_payment_id || !paymentResponse?.razorpay_signature) {
        setPaymentCheckoutError("Razorpay payment details were not returned. Please try again.");
        return;
      }

      setPaymentVerifying(true);
      setPaymentCheckoutError("");
      setPaymentCheckout((current) => (current ? { ...current, paymentResponse } : current));

      try {
        const verified = await paymentApi.verify(token, {
          bookingId,
          razorpay_order_id: paymentResponse.razorpay_order_id || paymentCheckout?.order?.orderId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        });

        setBookings((current) => current.map((item) => ((item._id || item.id) === bookingId ? verified.booking : item)));
        setPaymentCheckout(null);
        setPaymentCheckoutError("");
        setPaymentConfirmation(verified.booking);
        setToast(verified.message || "Payment successful.");
      } catch (error) {
        const message = error?.description || error?.message || "Payment could not be verified.";
        setPaymentCheckoutError(message);
        setToast(message);
      } finally {
        setPaymentVerifying(false);
      }
    },
    [paymentCheckout, token]
  );

  const rejectClientEstimate = useCallback(
    (booking) => {
      Alert.alert("Reject estimate", "Reject this provider estimate? A penalty may apply as configured by backend.", [
        { text: "Keep estimate", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await paymentApi.rejectEstimate(token, booking._id, "Rejected from mobile app.");
              setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
              setToast(data.message || "Estimate rejected.");
            } catch (error) {
              setToast(error.message);
            }
          },
        },
      ]);
    },
    [token]
  );
  const withdrawProviderEarnings = useCallback(
    async () => {
      try {
        const data = await paymentApi.withdrawProviderEarnings(token, {});
        setProviderData((current) =>
          normalizeProviderDashboard({
            ...(current || {}),
            ...data,
            paymentSummary: data.summary,
          })
        );
        setToast(data.message || "Withdrawal recorded.");
      } catch (error) {
        setToast(error.message);
      }
    },
    [token]
  );

  const submitProviderCancel = useCallback(
    async (reason) => {
      if (!providerCancelBooking) return;
      if (!reason.trim()) {
        setToast("Please describe why this booking is being cancelled.");
        return;
      }

      setProviderSubmitting(true);
      try {
        const data = await providerApi.updateBookingStatus(token, providerCancelBooking._id, {
          status: "cancelled",
          cancellationReason: reason.trim(),
        });
        setProviderData((current) => {
          const normalized = normalizeProviderDashboard(current || {});
          return {
            ...normalized,
            bookings: normalized.bookings.map((item) => (item._id === providerCancelBooking._id ? data.booking : item)),
          };
        });
        setProviderCancelBooking(null);
        setToast("Job cancelled.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setProviderSubmitting(false);
      }
    },
    [providerCancelBooking, token]
  );

  const submitProviderProfile = useCallback(
    async (form) => {
      setProviderSubmitting(true);
      try {
        const data = await providerApi.updateProfile(token, {
          ...form,
          profileImage: form.image || "",
        });
        const provider = {
          ...data.provider,
          image: data.provider?.image || data.provider?.profileImage || form.image || "",
        };
        setProviderData((current) => ({
          ...normalizeProviderDashboard(current || {}),
          provider,
        }));
        const nextUser = {
          ...user,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          avatar: provider.image || "",
          profileImage: provider.image || "",
        };
        setUser(nextUser);
        await saveSession(token, nextUser);
        loadCatalog(true);
        setProviderProfileOpen(false);
        setToast("Provider profile updated.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setProviderSubmitting(false);
      }
    },
    [token, user]
  );

  const submitAccountProfile = useCallback(
    async (form) => {
      setAccountSubmitting(true);
      try {
        const completingClientProfile = user?.role === "user" && user?.profileComplete !== true;
        const profileData = await (completingClientProfile ? authApi.completeClientProfile : authApi.updateProfile)(token, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address?.trim() || user?.address || "",
          avatar: form.avatar || "",
          currentLocation: form.currentLocation || user?.currentLocation || null,
        });
        const imageData =
          (form.avatar || "") !== (user?.avatar || user?.profileImage || "")
            ? await authApi.updateProfileImage(token, form.avatar || "")
            : profileData;
        const normalizedProfileUser = normalizeUser(imageData.user || profileData.user);
        const nextUser = completingClientProfile
          ? {
              ...normalizedProfileUser,
              role: normalizedProfileUser?.role || user?.role || "user",
              name: normalizedProfileUser?.name || form.name.trim(),
              email: normalizedProfileUser?.email || form.email.trim(),
              phone: normalizedProfileUser?.phone || user?.phone || form.phone.trim(),
              address: normalizedProfileUser?.address || form.address?.trim() || user?.address || "",
              avatar: normalizedProfileUser?.avatar || form.avatar || "",
              profileImage: normalizedProfileUser?.profileImage || normalizedProfileUser?.avatar || form.avatar || "",
              profileComplete: true,
              mobileVerified: normalizedProfileUser?.mobileVerified ?? user?.mobileVerified ?? true,
            }
          : normalizedProfileUser;

        setUser(nextUser);
        await saveSession(token, nextUser);

        if (nextUser?.role === "provider") {
          setProviderData((current) => {
            const normalized = normalizeProviderDashboard(current || {});
            return {
              ...normalized,
              provider: normalized.provider
                ? {
                    ...normalized.provider,
                    name: nextUser.name,
                    email: nextUser.email,
                    phone: nextUser.phone,
                    image: nextUser.avatar || "",
                    profileImage: nextUser.avatar || "",
                  }
                : normalized.provider,
            };
          });
          loadCatalog(true);
        }

        setAccountProfileOpen(false);
        if (completingClientProfile && pendingBookingContext?.service) {
          if (pendingBookingContext.form) {
            setBookingSubmitting(true);
            try {
              const data = await bookingApi.create(token, pendingBookingContext.form);
              setBookings((current) => [data.booking, ...current]);
              setBookingService(null);
              setPendingBookingContext(null);
              setActiveTab("providers");
              setToast("Profile completed and booking placed.");
            } catch (error) {
              setActiveTab(pendingBookingContext.sourceTab || "providers");
              setBookingService(pendingBookingContext.service);
              setToast(error.message || "Profile completed, but booking could not be placed.");
            } finally {
              setBookingSubmitting(false);
            }
          } else {
            setActiveTab(pendingBookingContext.sourceTab || "providers");
            setBookingService(pendingBookingContext.service);
            setPendingBookingContext(null);
            setToast("Profile completed. Continue your booking.");
          }
        } else {
          setToast(completingClientProfile ? "Client profile completed." : "Account profile updated.");
        }
      } catch (error) {
        setToast(error.message);
      } finally {
        setAccountSubmitting(false);
      }
    },
    [loadCatalog, pendingBookingContext, token, user]
  );

  const submitSettings = useCallback(async (form) => {
    setSettingsSubmitting(true);
    try {
      const nextSettings = await saveSettings(form);
      setSettings(nextSettings);
      setPersistedSettings(nextSettings);
      setSettingsOpen(false);
      setToast(t("settings.saved", "Settings saved."));
    } catch {
      setToast(t("settings.saveFailed", "Settings could not be saved."));
    } finally {
      setSettingsSubmitting(false);
    }
  }, [t]);

  const previewSettings = useCallback((form) => {
    setSettings((current) => ({ ...current, ...form }));
  }, []);

  const closeSettings = useCallback(() => {
    setSettings(persistedSettings);
    setSettingsOpen(false);
  }, [persistedSettings]);

  const openSettingsSheet = useCallback((mode = "settings") => {
    setSettingsMode(mode);
    setSettingsOpen(true);
  }, []);

  const shareApp = useCallback(async () => {
    const message = `${t("settings.shareMessage", "Try ServiceHub for trusted home services: ")}${APP_SHARE_LINK}`;

    if (Platform.OS === "web") {
      setShareFallbackOpen(true);
      return;
    }

    try {
      await Share.share({
        title: "ServiceHub",
        message,
        url: APP_SHARE_LINK,
      });
      setToast(t("settings.shareStarted", "Opening share options."));
    } catch (error) {
      setShareFallbackOpen(true);
      setToast(error.message || t("settings.shareFailed", "Share could not be opened."));
    }
  }, [t]);

  const openAddressBook = useCallback(() => {
    if (!token || !user) {
      setToast(t("account.loginForAddresses", "Please login to manage saved addresses."));
      openAuth("login", "user");
      return;
    }

    setAddressesOpen(true);
  }, [openAuth, t, token, user]);

  const openPaymentMethods = useCallback(() => {
    if (!token || !user) {
      setToast(t("account.loginForPayments", "Please login to manage payment methods."));
      openAuth("login", "user");
      return;
    }

    setPaymentMethodsOpen(true);
  }, [openAuth, t, token, user]);

  const submitAddresses = useCallback(
    async (nextAddresses) => {
      setAddressesSubmitting(true);
      try {
        const savedAddresses = await saveAddresses(nextAddresses);
        setAddresses(savedAddresses);
        setToast(t("addresses.savedToast", "Addresses saved."));
      } catch {
        setToast(t("addresses.saveFailed", "Addresses could not be saved."));
      } finally {
        setAddressesSubmitting(false);
      }
    },
    [t]
  );

  const submitPaymentMethods = useCallback(
    async (nextPaymentMethods) => {
      setPaymentMethodsSubmitting(true);
      try {
        const savedPaymentMethods = await savePaymentMethods(nextPaymentMethods);
        setPaymentMethods(savedPaymentMethods);
        setToast(t("payments.savedToast", "Payment methods saved."));
      } catch {
        setToast(t("payments.saveFailed", "Payment methods could not be saved."));
      } finally {
        setPaymentMethodsSubmitting(false);
      }
    },
    [t]
  );

  const openMyBookings = useCallback(() => {
    if (!token || user?.role !== "user") {
      openAuth("login", "user");
      return;
    }

    setMyBookingsOpen(true);
    loadBookings(true);
  }, [loadBookings, openAuth, token, user]);

  const submitContactMessage = useCallback(
    async (message) => {
      if (!token || user?.role !== "user") {
        setToast("Please login as a client to send a message.");
        openAuth("login", "user");
        return false;
      }

      setContactSubmitting(true);
      try {
        await contactApi.create(token, message);
        setContactOpen(false);
        setToast("Message sent successfully.");
        return true;
      } catch (error) {
        setToast(error.message);
        return false;
      } finally {
        setContactSubmitting(false);
      }
    },
    [openAuth, token, user]
  );

  const openProviderProfileEditor = useCallback(() => {
    if (user?.role === "provider" && !providerData?.provider) {
      loadProviderDashboard();
    }
    setProviderProfileOpen(true);
  }, [loadProviderDashboard, providerData, user]);

  const screen = useMemo(() => {
    if (booting) {
      return (
        <View style={styles.startupLoader}>
          <LoadingState label="Loading ServiceHub..." />
        </View>
      );
    }

    if (activeTab === "notifications") {
      return (
        <NotificationsScreen
          notifications={notifications}
          loading={notificationsLoading}
          error={notificationsError}
          refreshing={notificationsRefreshing}
          onBack={() => setActiveTab("home")}
          onRefresh={() => loadNotifications(true)}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
        />
      );
    }
    if (activeTab === "services") {
      return (
        <ServicesScreen
          catalogProviders={catalogProviders}
          catalogLoading={catalogLoading}
          catalogError={catalogError}
          onRefresh={() => loadCatalog(true)}
          onViewDetails={setSelectedService}
          onOpenProvidersForService={openProvidersForService}
          t={t}
        />
      );
    }


    if (activeTab === "providers") {
      return (
        <ProvidersScreen
          catalogProviders={catalogProviders}
          catalogLoading={catalogLoading}
          catalogError={catalogError}
          refreshing={catalogRefreshing}
          onRefresh={() => loadCatalog(true)}
          onViewDetails={setSelectedService}
          onBook={openBooking}
          selectedServiceFilter={selectedProviderService}
          onClearServiceFilter={clearProviderServiceFilter}
        />
      );
    }

    if (activeTab === "payments") {
      return (
        <PaymentsScreen
          user={user}
          providerData={providerData}
          loading={providerLoading}
          error={providerError}
          refreshing={providerRefreshing}
          onRefresh={() => loadProviderDashboard(true)}
          onOpenAuth={openAuth}
          onWithdraw={withdrawProviderEarnings}
        />
      );
    }

    if (activeTab === "bookings") {
      return (
        <BookingsScreen
          user={user}
          bookings={bookings}
          loading={bookingsLoading}
          error={bookingsError}
          refreshing={bookingsRefreshing}
          onRefresh={() => loadBookings(true)}
          onCancelBooking={cancelClientBooking}
          onAcceptEstimate={acceptClientEstimate}
          onRejectEstimate={rejectClientEstimate}
          onPayEstimate={payClientEstimate}
          onTrackBooking={openTrackingScreen}
          onOpenAuth={openAuth}
        />
      );
    }

    if (activeTab === "tracking") {
  return (
    <TrackingScreen
      token={token}
      bookingId={trackingBookingId}
      onBack={closeTrackingScreen}
    />
  );
}

    if (activeTab === "provider") {
      return (
        <ProviderScreen
          user={user}
          providerData={providerData}
          loading={providerLoading}
          error={providerError}
          refreshing={providerRefreshing}
          onRefresh={() => loadProviderDashboard(true)}
          onOpenAuth={openAuth}
          onAccept={acceptProviderRequest}
          onComplete={completeProviderJob}
          onUpdateTrackingStatus={updateProviderTrackingStatus}
          onCancel={setProviderCancelBooking}
          onEstimate={setProviderEstimateBooking}
          onUpdateAvailability={updateProviderAvailability}
          onStartTracking={startProviderTracking}
          onStopTracking={stopProviderTracking}
          onEditProfile={openProviderProfileEditor}
        />
      );
    }

    if (activeTab === "account") {
      return (
        <AccountScreen
          user={user}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
          onEditAccount={() => setAccountProfileOpen(true)}
          onEditProviderProfile={openProviderProfileEditor}
          onOpenSettings={() => openSettingsSheet("settings")}
          onOpenNotifications={openNotificationsScreen}
          onOpenContact={() => setContactOpen(true)}
          onOpenMyBookings={openMyBookings}
          onOpenAddresses={openAddressBook}
          onOpenPayments={openPaymentMethods}
          onReferFriend={shareApp}
          settings={settings}
          t={t}
        />
      );
    }

    return (
      <HomeScreen
        catalogProviders={catalogProviders}
        catalogLoading={catalogLoading}
        catalogError={catalogError}
        refreshing={catalogRefreshing}
        onRefresh={() => loadCatalog(true)}
        onBook={openBooking}
        onViewDetails={setSelectedService}
        onOpenProvidersForService={openProvidersForService}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        dataSaver={settings.dataSaver}
        selectedLocation={selectedLocation}
        onOpenLocation={() => setLocationSearchOpen(true)}
        onOpenNotifications={openNotificationsScreen}
        unreadNotificationsCount={unreadNotificationsCount}
        profileIncomplete={user?.role === "user" && user?.profileComplete !== true}
        onCompleteProfile={() => setAccountProfileOpen(true)}
        t={t}
      />
    );
  }, [
    acceptProviderRequest,
    activeTab,
    bookings,
    bookingsError,
    bookingsLoading,
    bookingsRefreshing,
    booting,
    cancelClientBooking,
    catalogError,
    catalogLoading,
    catalogProviders,
    catalogRefreshing,
    completeProviderJob,
    updateProviderTrackingStatus,
    acceptClientEstimate,
    handleLogout,
    loadBookings,
    loadCatalog,
    loadProviderDashboard,
    closeTrackingScreen,
    loadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    notificationsError,
    notificationsLoading,
    notificationsRefreshing,
    openAuth,
    openAddressBook,
    openBooking,
    getCurrentLocationForForm,
    locatingAddress,
    openPaymentMethods,
    openProviderProfileEditor,
    openMyBookings,
    openSettingsSheet,
    openTrackingScreen,
    openNotificationsScreen,
    openProvidersForService,
    clearProviderServiceFilter,
    providerData,
    startProviderTracking,
    stopProviderTracking,
    providerError,
    providerLoading,
    providerRefreshing,
    payClientEstimate,
    rejectClientEstimate,
    withdrawProviderEarnings,
    searchTerm,
    selectedCategory,
    selectedLocation,
    selectedProviderService,
    settings,
    shareApp,
    sendMobileOtp,
    t,
    token,
    trackingBookingId,
    unreadNotificationsCount,
    updateProviderAvailability,
    verifyMobileOtp,
    user,
  ]);

  return (
    <View style={[styles.safe, { backgroundColor: appColors.background, paddingTop: insets.top }]}>
      <StatusBar
        barStyle={effectiveAppearance === "dark" ? "light-content" : "dark-content"}
        backgroundColor={appColors.background}
      />
      <ThemeColorsProvider value={appColors}>
        <View style={[styles.app, { backgroundColor: appColors.background }]}>
          <OfflineBanner
            visible={network.isOffline}
            onRetry={() => {
              loadCatalog(true);
              loadBookings(true);
              loadProviderDashboard(true);
            }}
          />
          <View style={styles.screen}>{screen}</View>
          <BottomNav activeTab={activeTab} onChange={setActiveTab} user={user} t={t} />
          <AuthSheet
            visible={authOpen}
            sessionKey={authSessionKey}
            mode={authMode}
            role={authRole}
            submitting={authSubmitting}
            onClose={closeAuth}
            onModeChange={changeAuthMode}
            onRoleChange={changeAuthRole}
            onSubmit={handleAuthSubmit}
            onForgotPasswordOtp={requestPasswordResetOtp}
            onForgotPasswordVerify={verifyPasswordResetOtp}
            onResetPassword={resetPassword}
            t={t}
          />
          <LocationSearchSheet
            visible={locationSearchOpen}
            selectedLocation={selectedLocation}
            recentLocations={recentLocations}
            detecting={locatingAddress}
            onClose={() => setLocationSearchOpen(false)}
            onUseCurrentLocation={useCurrentLocationForHome}
            onSelectLocation={saveLocationChoice}
            onSaveManualLocation={saveLocationChoice}
          />
          <ServiceDetailSheet
            visible={Boolean(selectedService)}
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onBook={openBooking}
          />
          <BookingSheet
            visible={Boolean(bookingService)}
            service={bookingService}
            user={user}
            initialForm={pendingBookingContext?.service?.id === bookingService?.id ? pendingBookingContext?.form : null}
            submitting={bookingSubmitting}
            onClose={() => setBookingService(null)}
            onSubmit={submitBooking}
            t={t}
            locatingAddress={locatingAddress}
            onUseCurrentLocation={getCurrentLocationForForm}
          />
          <AccountProfileSheet
            visible={accountProfileOpen}
            user={user}
            submitting={accountSubmitting}
            profileCompletion={user?.role === "user" && user?.profileComplete !== true}
            onClose={() => setAccountProfileOpen(false)}
            onSubmit={submitAccountProfile}
            locatingAddress={locatingAddress}
            onUseCurrentLocation={getCurrentLocationForForm}
          />
          <ProviderProfileSheet
            visible={providerProfileOpen}
            provider={providerData?.provider}
            submitting={providerSubmitting}
            onClose={() => setProviderProfileOpen(false)}
            onSubmit={submitProviderProfile}
          />
          <SettingsSheet
            visible={settingsOpen}
            settings={settings}
            mode={settingsMode}
            submitting={settingsSubmitting}
            onClose={closeSettings}
            onSubmit={submitSettings}
            onDraftChange={previewSettings}
            onShareApp={shareApp}
            t={t}
          />
          <ShareFallbackSheet
            visible={shareFallbackOpen}
            appLink={APP_SHARE_LINK}
            onClose={() => setShareFallbackOpen(false)}
            onCopied={() => setToast("App link copied.")}
            onCopyFailed={(message) => setToast(message || "Copy link failed.")}
          />
          <ContactUsSheet
            visible={contactOpen}
            submitting={contactSubmitting}
            onClose={() => setContactOpen(false)}
            onSubmit={submitContactMessage}
          />
          <AddressBookSheet
            visible={addressesOpen}
            addresses={addresses}
            submitting={addressesSubmitting}
            onClose={() => setAddressesOpen(false)}
            onSave={submitAddresses}
            t={t}
          />
          <PaymentMethodsSheet
            visible={paymentMethodsOpen}
            paymentMethods={paymentMethods}
            submitting={paymentMethodsSubmitting}
            onClose={() => setPaymentMethodsOpen(false)}
            onSave={submitPaymentMethods}
            t={t}
          />
          <MyBookingsSheet
            visible={myBookingsOpen}
            bookings={bookings}
            loading={bookingsLoading}
            error={bookingsError}
            refreshing={bookingsRefreshing}
            onClose={() => setMyBookingsOpen(false)}
            onRefresh={() => loadBookings(true)}
            onCancelBooking={cancelClientBooking}
            onAcceptEstimate={acceptClientEstimate}
            onRejectEstimate={rejectClientEstimate}
            onPayEstimate={payClientEstimate}
            onTrackBooking={openTrackingScreen}
          />
          <CancelReasonSheet
            visible={Boolean(providerCancelBooking)}
            booking={providerCancelBooking}
            submitting={providerSubmitting}
            onClose={() => setProviderCancelBooking(null)}
            onSubmit={submitProviderCancel}
          />
          <EstimateSheet
            visible={Boolean(providerEstimateBooking)}
            booking={providerEstimateBooking}
            submitting={estimateSubmitting}
            onClose={() => setProviderEstimateBooking(null)}
            onSubmit={submitProviderEstimate}
          />
          <PaymentCheckoutSheet
            visible={Boolean(paymentCheckout)}
            checkout={paymentCheckout}
            verifying={paymentVerifying}
            error={paymentCheckoutError}
            onClose={() => {
              if (paymentVerifying) return;
              setPaymentCheckout(null);
              setPaymentCheckoutError("");
            }}
            onSuccess={verifyClientEstimatePayment}
            onFailure={(message) => {
              if (paymentVerifying) return;
              setPaymentCheckout(null);
              setPaymentCheckoutError("");
              setToast(message || "Payment was not completed.");
            }}
            onRetry={
              paymentCheckout?.paymentResponse
                ? () => verifyClientEstimatePayment(paymentCheckout.paymentResponse)
                : null
            }
          />
          <PaymentConfirmationSheet
            visible={Boolean(paymentConfirmation)}
            booking={paymentConfirmation}
            onClose={() => setPaymentConfirmation(null)}
            onGoToBookings={() => {
              setPaymentConfirmation(null);
              setActiveTab("bookings");
              setMyBookingsOpen(true);
              loadBookings(true);
            }}
            onViewReceipt={(receiptUrl) => {
              if (receiptUrl) Linking.openURL(receiptUrl).catch(() => setToast("Receipt could not be opened."));
            }}
          />
          <Toast message={toast} onClose={() => setToast("")} />
        </View>
      </ThemeColorsProvider>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={safeAreaInitialMetrics}>
      <AppErrorBoundary>
        <ServiceHubApp />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  startupLoader: {
    flex: 1,
    justifyContent: "center",
  },
  errorBoundary: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  errorBoundaryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  errorBoundaryCopy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  errorBoundaryButton: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  errorBoundaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});






