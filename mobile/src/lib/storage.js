import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "servicehub_token";
const USER_KEY = "servicehub_user";
const SETTINGS_KEY = "servicehub_settings";
const ADDRESSES_KEY = "servicehub_addresses";
const PAYMENT_METHODS_KEY = "servicehub_payment_methods";
const SELECTED_LOCATION_KEY = "servicehub_selected_location";
const RECENT_LOCATIONS_KEY = "servicehub_recent_locations";
const fallbackStore = {};

function getWebStorage() {
  if (Platform.OS !== "web" || typeof globalThis.localStorage === "undefined") return null;

  try {
    const probeKey = "__servicehub_storage_probe__";
    globalThis.localStorage.setItem(probeKey, "1");
    globalThis.localStorage.removeItem(probeKey);
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export const defaultSettings = {
  appearance: "light",
  language: "en",
  notificationsEnabled: true,
  bookingUpdates: true,
  providerRequests: true,
  emailAlerts: true,
  bookingReminders: true,
  dataSaver: false,
};

let isSecureStoreAvailable = null;
async function isSecureStoreReady() {
  if (isSecureStoreAvailable !== null) return isSecureStoreAvailable;
  try {
    isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    isSecureStoreAvailable = false;
  }
  return isSecureStoreAvailable;
}

const SECURE_STORE_TIMEOUT_MS = 2000;

async function withTimeout(promise, fallbackValue = null) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallbackValue);
    }, SECURE_STORE_TIMEOUT_MS);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

async function getItem(key) {
  if (key === TOKEN_KEY && (await isSecureStoreReady())) {
    try {
      const secureValue = await withTimeout(SecureStore.getItemAsync(key), null);
      if (secureValue !== null) return secureValue;
    } catch {
      // Fall through to the platform-safe persistent store.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) return webStorage.getItem(key);

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    // The in-memory store keeps the current session usable if all persistence fails.
  }
  return fallbackStore[key] || null;
}

async function setItem(key, value) {
  if (key === TOKEN_KEY && (await isSecureStoreReady())) {
    try {
      await withTimeout(SecureStore.setItemAsync(key, value), null);
      return;
    } catch {
      // Fall through to the platform-safe persistent store.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
    return;
  } catch {
    // Preserve the active app session even when persistence is unavailable.
  }
  fallbackStore[key] = value;
}

async function deleteItem(key) {
  if (key === TOKEN_KEY && (await isSecureStoreReady())) {
    try {
      await withTimeout(SecureStore.deleteItemAsync(key), null);
    } catch {
      // Continue clearing every fallback to guarantee logout.
    }
  }

  const webStorage = getWebStorage();
  if (webStorage) webStorage.removeItem(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // The remaining in-memory copy is still cleared below.
  }
  delete fallbackStore[key];
}

export async function loadSession() {
  const [token, savedUser] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);

  if (!token || !savedUser) {
    return { token: "", user: null };
  }

  try {
    return { token, user: JSON.parse(savedUser) };
  } catch {
    await clearSession();
    return { token: "", user: null };
  }
}

export async function saveSession(token, user) {
  await Promise.all([setItem(TOKEN_KEY, token), setItem(USER_KEY, JSON.stringify(user))]);
}

export async function clearSession() {
  await Promise.all([deleteItem(TOKEN_KEY), deleteItem(USER_KEY)]);
}

export async function loadSettings() {
  const savedSettings = await getItem(SETTINGS_KEY);

  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    return { ...defaultSettings, ...JSON.parse(savedSettings) };
  } catch {
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
}

export async function saveSettings(settings) {
  const nextSettings = { ...defaultSettings, ...settings };
  await setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  return nextSettings;
}

async function loadJsonList(key) {
  const savedValue = await getItem(key);
  if (!savedValue) return [];

  try {
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    await setItem(key, JSON.stringify([]));
    return [];
  }
}

async function saveJsonList(key, items) {
  const nextItems = Array.isArray(items) ? items : [];
  await setItem(key, JSON.stringify(nextItems));
  return nextItems;
}

export async function loadAddresses() {
  return loadJsonList(ADDRESSES_KEY);
}

export async function saveAddresses(addresses) {
  return saveJsonList(ADDRESSES_KEY, addresses);
}

export async function loadPaymentMethods() {
  return loadJsonList(PAYMENT_METHODS_KEY);
}

export async function savePaymentMethods(paymentMethods) {
  return saveJsonList(PAYMENT_METHODS_KEY, paymentMethods);
}

export async function loadSelectedLocation() {
  const savedLocation = await getItem(SELECTED_LOCATION_KEY);
  if (!savedLocation) return null;

  try {
    return JSON.parse(savedLocation);
  } catch {
    await deleteItem(SELECTED_LOCATION_KEY);
    return null;
  }
}

export async function saveSelectedLocation(location) {
  const nextLocation = location && typeof location === "object" ? location : null;
  if (!nextLocation) {
    await deleteItem(SELECTED_LOCATION_KEY);
    return null;
  }

  await setItem(SELECTED_LOCATION_KEY, JSON.stringify(nextLocation));
  return nextLocation;
}

export async function loadRecentLocations() {
  try {
    const savedLocations = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    if (!savedLocations) return [];
    const parsedLocations = JSON.parse(savedLocations);
    return Array.isArray(parsedLocations) ? parsedLocations : [];
  } catch {
    return [];
  }
}

export async function saveRecentLocations(locations) {
  const nextLocations = Array.isArray(locations) ? locations : [];
  await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(nextLocations));
  return nextLocations;
}

const READ_NOTIFICATIONS_KEY = "servicehub_read_notifications";

export async function loadReadNotificationIds() {
  return loadJsonList(READ_NOTIFICATIONS_KEY);
}

export async function saveReadNotificationIds(ids) {
  return saveJsonList(READ_NOTIFICATIONS_KEY, ids);
}

