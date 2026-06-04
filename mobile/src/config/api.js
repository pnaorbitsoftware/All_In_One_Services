import { Platform } from "react-native";

const LAN_API_URL = "http://10.187.33.79:5000/api";

const localApiUrl = Platform.select({
  android: LAN_API_URL,
  ios: LAN_API_URL,
  default: LAN_API_URL,
});

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || localApiUrl).replace(/\/$/, "");
