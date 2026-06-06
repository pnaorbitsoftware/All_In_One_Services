import haversineDistance from "./haversine.js";

const fallbackEtaMinutes = ({ provider, client }) => {
  const distanceMeters = haversineDistance(provider.lat, provider.lng, client.lat, client.lng);
  const cityTrafficMetersPerMinute = 350;
  return Math.max(1, Math.round(distanceMeters / cityTrafficMetersPerMinute));
};

export const computeEtaMinutes = async ({ provider, client }) => {
  if (!provider || !client) return null;

  const fallback = fallbackEtaMinutes({ provider, client });
  const osrmBaseUrl = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
  const coordinates = `${provider.lng},${provider.lat};${client.lng},${client.lat}`;
  const url = `${osrmBaseUrl}/table/v1/driving/${coordinates}?annotations=duration&sources=0&destinations=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;

    const data = await response.json();
    const seconds = data?.durations?.[0]?.[0];
    if (!Number.isFinite(seconds)) return fallback;

    return Math.max(1, Math.round(seconds / 60));
  } catch {
    return fallback;
  }
};
