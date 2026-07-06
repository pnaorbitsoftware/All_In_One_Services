const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const productionBackendApiUrl = "https://all-in-one-services-eegn.onrender.com/api";

const fallbackApiUrl = import.meta.env.PROD
  ? "/api"
  : "http://localhost:5000/api";

export const API_URL = (configuredApiUrl || fallbackApiUrl).replace(/\/+$/, "");
export const SOCKET_API_URL = String(
  import.meta.env.VITE_SOCKET_API_URL || productionBackendApiUrl,
).replace(/\/+$/, "");

export const AUTH_API_URLS = [
  ...new Set([
    API_URL,
    ...(import.meta.env.DEV
      ? ["http://localhost:5000/api", "http://localhost:5001/api"]
      : []),
  ]),
];
