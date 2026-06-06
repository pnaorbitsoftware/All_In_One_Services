import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Appearance, Dimensions, Keyboard, Linking, Share, StatusBar, StyleSheet, useColorScheme, View } from "react-native";
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
  loadSession,
  loadSettings,
  saveAddresses,
  savePaymentMethods,
  saveSession,
  saveSettings,
} from "./src/lib/storage";
import AccountScreen from "./src/screens/AccountScreen";
import AdminScreen from "./src/screens/AdminScreen";
import BookingsScreen from "./src/screens/BookingsScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PaymentsScreen from "./src/screens/PaymentsScreen";
import ProviderScreen from "./src/screens/ProviderScreen";
import ProvidersScreen from "./src/screens/ProvidersScreen";
import ServicesScreen from "./src/screens/ServicesScreen";
import AccountProfileSheet from "./src/sheets/AccountProfileSheet";
import AddressBookSheet from "./src/sheets/AddressBookSheet";
import AuthSheet from "./src/sheets/AuthSheet";
import BookingSheet from "./src/sheets/BookingSheet";
import CancelReasonSheet from "./src/sheets/CancelReasonSheet";
import ContactUsSheet from "./src/sheets/ContactUsSheet";
import EstimateSheet from "./src/sheets/EstimateSheet";
import MyBookingsSheet from "./src/sheets/MyBookingsSheet";
import PaymentMethodsSheet from "./src/sheets/PaymentMethodsSheet";
import PaymentConfirmationSheet from "./src/sheets/PaymentConfirmationSheet";
import ProviderProfileSheet from "./src/sheets/ProviderProfileSheet";
import ServiceDetailSheet from "./src/sheets/ServiceDetailSheet";
import SettingsSheet from "./src/sheets/SettingsSheet";
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

const APP_SHARE_LINK = process.env.EXPO_PUBLIC_APP_LINK || "https://servicehub.app/download";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNAVAILABLE_STATUSES = ["inactive", "absent"];
SplashScreen.preventAutoHideAsync().catch(() => {});

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
      !form.responseTime.trim())
  ) {
    return "Complete all provider service details before registering.";
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedService, setSelectedService] = useState(null);
  const [bookingService, setBookingService] = useState(null);
  const [providerProfileOpen, setProviderProfileOpen] = useState(false);
  const [providerCancelBooking, setProviderCancelBooking] = useState(null);
  const [providerEstimateBooking, setProviderEstimateBooking] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState("settings");
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
  const [paymentConfirmation, setPaymentConfirmation] = useState(null);

  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([loadSession(), loadSettings(), loadAddresses(), loadPaymentMethods()])
      .then(([session, savedSettings, savedAddresses, savedPaymentMethods]) => {
        if (!mounted) return;
        setToken(session.token);
        setUser(normalizeUser(session.user));
        setSettings(savedSettings);
        setPersistedSettings(savedSettings);
        setAddresses(savedAddresses);
        setPaymentMethods(savedPaymentMethods);
        if (session.user?.role === "provider") setActiveTab("provider");
        if (session.user?.role === "admin") setActiveTab("admin");
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

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (token && user) {
      loadBookings();
    }
  }, [loadBookings, token, user]);

  useEffect(() => {
    if (token && user?.role === "provider") {
      loadProviderDashboard();
    }
  }, [loadProviderDashboard, token, user]);

  const openAuth = useCallback((mode = "login", role = "user") => {
    setAuthMode(mode);
    setAuthRole(role === "admin" && mode === "register" ? "user" : role);
    setAuthSessionKey((current) => current + 1);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const changeAuthMode = useCallback((mode) => {
    setAuthMode(mode);
    if (mode === "register" && authRole === "admin") setAuthRole("user");
  }, [authRole]);

  const changeAuthRole = useCallback((role) => setAuthRole(role), []);

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
                phone: form.phone.trim(),
                address: form.address.trim(),
                role,
                providerName: form.providerName.trim(),
                category: form.category.trim(),
                location: form.location.trim(),
                price: form.price.trim(),
                responseTime: form.responseTime.trim(),
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
        setToast(mode === "login" ? "Logged in successfully." : role === "provider" ? "Provider profile submitted. Wait for website admin approval." : "Account created successfully.");
        setActiveTab(nextUser?.role === "provider" ? "provider" : nextUser?.role === "admin" ? "admin" : "home");
        return data;
      } catch (error) {
        setToast(error.message);
        return null;
      } finally {
        setAuthSubmitting(false);
      }
    },
    []
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

  const handleLogout = useCallback(async () => {
    await clearSession();
    setToken("");
    setUser(null);
    setBookings([]);
    setProviderData(null);
    setActiveTab("home");
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
        setToast("Please login before booking a service.");
        openAuth("login", "user");
        return;
      }

      setSelectedService(null);
      setBookingService(service);
    },
    [openAuth, token, user]
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
        openAuth("login", "user");
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
    [openAuth, token, user]
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

  const completeProviderJob = useCallback(
    (booking) => {
      Alert.alert("Complete job", "Mark this service as completed?", [
        { text: "Not yet", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const data = await providerApi.updateBookingStatus(token, booking._id, { status: "completed" });
              setProviderData((current) => {
                const normalized = normalizeProviderDashboard(current || {});
                return {
                  ...normalized,
                  bookings: normalized.bookings.map((item) => (item._id === booking._id ? data.booking : item)),
                };
              });
              setToast("Job marked completed.");
            } catch (error) {
              setToast(error.message);
            }
          },
        },
      ]);
    },
    [token]
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
        setToast("Estimate accepted. Mobile Razorpay checkout SDK is still required for payment.");
      } catch (error) {
        setToast(error.message);
      }
    },
    [token]
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
        const profileData = await authApi.updateProfile(token, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address?.trim() || user?.address || "",
          currentLocation: form.currentLocation || user?.currentLocation || null,
        });
        const imageData =
          (form.avatar || "") !== (user?.avatar || user?.profileImage || "")
            ? await authApi.updateProfileImage(token, form.avatar || "")
            : profileData;
        const nextUser = normalizeUser(imageData.user || profileData.user);

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
        setToast("Account profile updated.");
      } catch (error) {
        setToast(error.message);
      } finally {
        setAccountSubmitting(false);
      }
    },
    [loadCatalog, token]
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
    const whatsAppUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(whatsAppUrl);
      setToast(t("settings.shareStarted", "Opening share options."));
    } catch {
      try {
        await Share.share({
          title: "ServiceHub",
          message,
          url: APP_SHARE_LINK,
        });
        setToast(t("settings.shareStarted", "Opening share options."));
      } catch {
        setToast(t("settings.shareFailed", "Share could not be opened."));
      }
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

    if (activeTab === "services") {
      return (
        <ServicesScreen
          onViewDetails={setSelectedService}
          t={t}
        />
      );
    }

    if (activeTab === "admin") {
      return (
        <AdminScreen
          token={token}
          user={user}
          onOpenAuth={openAuth}
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
          onOpenAuth={openAuth}
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
          onCancel={setProviderCancelBooking}
          onEstimate={setProviderEstimateBooking}
          onUpdateAvailability={updateProviderAvailability}
          onStartTracking={startProviderTracking}
          onStopTracking={stopProviderTracking}
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
          onOpenNotifications={() => openSettingsSheet("notifications")}
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
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        dataSaver={settings.dataSaver}
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
    acceptClientEstimate,
    handleLogout,
    loadBookings,
    loadCatalog,
    loadProviderDashboard,
    openAuth,
    openAddressBook,
    openBooking,
    getCurrentLocationForForm,
    locatingAddress,
    openPaymentMethods,
    openProviderProfileEditor,
    openMyBookings,
    openSettingsSheet,
    providerData,
    startProviderTracking,
    stopProviderTracking,
    providerError,
    providerLoading,
    providerRefreshing,
    rejectClientEstimate,
    searchTerm,
    selectedCategory,
    settings,
    shareApp,
    t,
    token,
    updateProviderAvailability,
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
      <ServiceHubApp />
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
});





