import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "servicehub_token";
const USER_KEY = "servicehub_user";
const SETTINGS_KEY = "servicehub_settings";
const ADDRESSES_KEY = "servicehub_addresses";
const PAYMENT_METHODS_KEY = "servicehub_payment_methods";
const SELECTED_LOCATION_KEY = "servicehub_selected_location";
const RECENT_LOCATIONS_KEY = "servicehub_recent_locations";
const fallbackStore = {};

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

async function isSecureStoreReady() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getItem(key) {
  if (await isSecureStoreReady()) {
    return SecureStore.getItemAsync(key);
  }

  return fallbackStore[key] || null;
}

async function setItem(key, value) {
  if (await isSecureStoreReady()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  fallbackStore[key] = value;
}

async function deleteItem(key) {
  if (await isSecureStoreReady()) {
    await SecureStore.deleteItemAsync(key);
    return;
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


