import { Platform } from "react-native";

export const PRODUCTION_BACKEND_API_URL = "https://all-in-one-services-eegn.onrender.com/api";
export const SHARED_BACKEND_API_URL = PRODUCTION_BACKEND_API_URL;
export const ANDROID_EMULATOR_BACKEND_API_URL = "http://10.0.2.2:5000/api";

function normalizeApiUrl(url = SHARED_BACKEND_API_URL) {
  let trimmedUrl = String(url || SHARED_BACKEND_API_URL).trim().replace(/\/$/, "");

  if (trimmedUrl && !/\/api(?:\/|$)/i.test(trimmedUrl)) {
    trimmedUrl = `${trimmedUrl}/api`;
  }

  if (Platform.OS === "android") {
    return trimmedUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "http://10.0.2.2");
  }

  return trimmedUrl;
}

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL || SHARED_BACKEND_API_URL);
export const API_URL_CANDIDATES = [
  API_URL,
  normalizeApiUrl(PRODUCTION_BACKEND_API_URL),
  typeof __DEV__ !== "undefined" && __DEV__ ? normalizeApiUrl(ANDROID_EMULATOR_BACKEND_API_URL) : "",
].filter((url, index, urls) => url && urls.indexOf(url) === index);
