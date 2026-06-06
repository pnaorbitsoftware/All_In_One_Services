import { Platform } from "react-native";

export const SHARED_BACKEND_API_URL = "http://localhost:5000/api";
export const ANDROID_EMULATOR_BACKEND_API_URL = "http://10.0.2.2:5000/api";

function normalizeApiUrl(url = SHARED_BACKEND_API_URL) {
  const trimmedUrl = String(url || SHARED_BACKEND_API_URL).trim().replace(/\/$/, "");

  if (Platform.OS === "android") {
    return trimmedUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "http://10.0.2.2");
  }

  return trimmedUrl;
}

export const API_URL = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL || SHARED_BACKEND_API_URL);
