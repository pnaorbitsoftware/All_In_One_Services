export const durationOptions = ["30 minutes", "1 hour", "2 hours", "3 hours", "Half day", "Full day", "Based on Work Time"];

export function formatPrice(value) {
  return Number.isFinite(Number(value)) ? `Rs. ${Number(value).toLocaleString("en-IN")}` : value || "Price not set";
}

export function formatBookingDate(value) {
  if (!value) return "Date not set";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatBookingTime(value) {
  if (!value || !value.includes(":")) return value || "Time not set";

  const [hourValue, minuteValue] = value.split(":").map(Number);
  return `${hourValue % 12 || 12}:${String(minuteValue || 0).padStart(2, "0")} ${hourValue >= 12 ? "PM" : "AM"}`;
}

export function getClientCancelState(booking, now = Date.now()) {
  if (["completed", "cancelled"].includes(booking.status)) {
    return { canCancel: false, label: "Cancel unavailable" };
  }

  if (!booking.acceptedAt) {
    return { canCancel: true, label: "Cancel booking" };
  }

  const remainingMs = 10 * 60 * 1000 - (now - new Date(booking.acceptedAt).getTime());
  if (remainingMs <= 0) {
    return { canCancel: false, label: "Cancel time expired" };
  }

  return { canCancel: true, label: `Cancel booking (${Math.ceil(remainingMs / 60000)}m left)` };
}

export function normalizeTrackingStatus(status = "") {
  const rawStatus = String(status || "").trim();
  if (!rawStatus) return "Confirmed";

  const LEGACY_STATUS_ALIASES = {
    pending: "Pending",
    accepted: "Provider Assigned",
    assigned: "Provider Assigned",
    confirmed: "Confirmed",
    en_route: "On The Way",
    "en route": "On The Way",
    on_the_way: "On The Way",
    "on the way": "On The Way",
    arrived: "Arrived",
    job_started: "Service Started",
    "job started": "Service Started",
    service_started: "Service Started",
    "service started": "Service Started",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  const lowerStatus = rawStatus.toLowerCase();
  if (LEGACY_STATUS_ALIASES[lowerStatus]) return LEGACY_STATUS_ALIASES[lowerStatus];

  const allowedStatuses = ["Pending", "Confirmed", "Provider Assigned", "On The Way", "Arrived", "Service Started", "Completed", "Cancelled"];
  return allowedStatuses.find((item) => item.toLowerCase() === lowerStatus) || rawStatus;
}
