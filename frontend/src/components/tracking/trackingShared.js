export const trackingSteps = [
  {
    id: "booking_confirmed",
    label: "Booking confirmed",
    copy: "Your service booking is confirmed",
    aliases: ["pending", "accepted", "confirmed", "assigned", "booking_confirmed"],
  },
  {
    id: "en_route",
    label: "Professional on the way",
    copy: "Your professional is travelling to your location",
    aliases: ["en_route", "on_the_way"],
  },
  {
    id: "arrived",
    label: "Arrived",
    copy: "Provider has reached the destination",
    aliases: ["arrived"],
  },
  {
    id: "job_started",
    label: "Job started",
    copy: "Service work is in progress",
    aliases: ["job_started"],
  },
  {
    id: "completed",
    label: "Job completed",
    copy: "Service work is finished",
    aliases: ["completed"],
  },
];

export const normalizeTrackingStatus = (status = "pending") => {
  if (["pending", "accepted", "confirmed", "assigned"].includes(status)) return "booking_confirmed";
  if (["on_the_way", "en_route"].includes(status)) return "en_route";
  return status;
};

export const getActiveStepIndex = (status) => {
  const normalizedStatus = normalizeTrackingStatus(status);
  const index = trackingSteps.findIndex((step) => step.id === normalizedStatus);
  return index >= 0 ? index : 0;
};

export const getLatestTrackingEvent = (events = [], step) =>
  [...events].reverse().find((event) => step.aliases.includes(normalizeTrackingStatus(event.status)) || step.aliases.includes(event.status));

export const formatTrackingEventTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatEta = (eta) => {
  if (!Number.isFinite(Number(eta))) return "Waiting for GPS";
  const minutes = Math.max(0, Math.round(Number(eta)));
  if (minutes <= 1) return "Arriving now";
  return `${minutes} min`;
};

export const hasCoordinates = (location) =>
  Number.isFinite(Number(location?.latitude ?? location?.lat)) &&
  Number.isFinite(Number(location?.longitude ?? location?.lng));

export const toLatLng = (location) => {
  if (!hasCoordinates(location)) return null;
  return {
    lat: Number(location.latitude ?? location.lat),
    lng: Number(location.longitude ?? location.lng),
  };
};

export const socketUrlFromApi = (apiUrl) =>
  import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, "");

export const requestBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => reject(new Error("Location permission was denied or unavailable.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
    );
  });

export const haversineDistance = (from, to) => {
  if (!from || !to) return Infinity;
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
