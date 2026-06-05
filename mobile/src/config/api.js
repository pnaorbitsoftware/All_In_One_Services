export const PRODUCTION_API_URL = "https://servicehub-mobile-app.onrender.com/api";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL).replace(/\/$/, "");
