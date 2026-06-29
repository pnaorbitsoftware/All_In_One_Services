import { Platform } from "react-native";

export const shadows = {
  card: Platform.select({
    web: { boxShadow: "0 8px 28px rgba(17, 24, 39, 0.08)" },
    default: { shadowColor: "#111827", shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  }),
  floating: Platform.select({
    web: { boxShadow: "0 14px 36px rgba(63, 34, 184, 0.18)" },
    default: { shadowColor: "#3F22B8", shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  }),
};
