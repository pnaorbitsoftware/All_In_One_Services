// Shared booking categorization helpers for the client dashboard.
// Mirrors the categorization already used by the provider dashboard
// (backend/src/routes/providerRoutes.js) so behaviour is consistent
// across both sides of the app. Kept dependency-free and pure so it can
// be reused from screens, sheets, or unit tests without side effects.

const TERMINAL_STATUSES = new Set(["completed", "cancelled", "rejected"]);

export function getBookingStatus(booking) {
  return String(booking?.status || "pending").toLowerCase();
}

// Ongoing = anything that hasn't reached a final state yet.
// Covers pending / accepted / assigned / confirmed / on_the_way / en_route / arrived / job_started
// without hardcoding every intermediate tracking status, so new statuses
// added to the workflow later still fall into "ongoing" by default.
export function isOngoingBooking(booking) {
  return !TERMINAL_STATUSES.has(getBookingStatus(booking));
}

export function isHistoryBooking(booking) {
  return TERMINAL_STATUSES.has(getBookingStatus(booking));
}

export const CLIENT_HISTORY_TABS = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "providerCancelled", label: "Provider Cancelled" },
  { key: "selfCancelled", label: "Self Cancelled" },
];

/**
 * Splits a flat bookings array into:
 *  - ongoing: bookings still in-flight (shown in "Ongoing Orders")
 *  - history: bucketed completed/cancelled/rejected bookings for the
 *    client's history tabs
 *  - stats: dynamic counts + basic aggregate numbers for the stats strip
 */
export function categorizeClientBookings(bookings = []) {
  const ongoing = [];
  const history = { pending: [], completed: [], providerCancelled: [], selfCancelled: [] };

  let totalSpending = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  bookings.forEach((booking) => {
    const status = getBookingStatus(booking);

    if (!TERMINAL_STATUSES.has(status)) {
      ongoing.push(booking);
      // Bookings that are still active also surface under the "Pending"
      // history tab so clients can see everything awaiting an outcome,
      // matching the pattern already shipped on the provider dashboard.
      history.pending.push(booking);
      return;
    }

    if (status === "completed") {
      history.completed.push(booking);
      const price = Number(booking.finalEstimateAmount || booking.costEstimate || 0);
      if (Number.isFinite(price)) totalSpending += price;
      if (Number(booking.clientRating) >= 1) {
        ratingSum += Number(booking.clientRating);
        ratingCount += 1;
      }
      return;
    }

    // status is "cancelled" or "rejected" here
    const cancelledBy = String(booking.cancelledBy || "").toLowerCase();
    if (status === "cancelled" && cancelledBy === "client") {
      history.selfCancelled.push(booking);
    } else {
      // provider rejections and provider/admin cancellations both read as
      // "the client didn't cause this" from the client's point of view.
      history.providerCancelled.push(booking);
    }
  });

  const totalOrders = bookings.length;
  const completedCount = history.completed.length;
  const cancelledCount = history.providerCancelled.length + history.selfCancelled.length;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const countSince = (date) =>
    bookings.filter((booking) => booking.createdAt && new Date(booking.createdAt) >= date).length;

  const stats = {
    pending: history.pending.length,
    completed: completedCount,
    providerCancelled: history.providerCancelled.length,
    selfCancelled: history.selfCancelled.length,
    totalOrders,
    todaysOrders: countSince(startOfToday),
    weeklyOrders: countSince(startOfWeek),
    monthlyOrders: countSince(startOfMonth),
    yearlyOrders: countSince(startOfYear),
    totalSpending,
    averageRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : 0,
    completionRate: totalOrders ? Number(((completedCount / totalOrders) * 100).toFixed(1)) : 0,
    cancellationRate: totalOrders ? Number(((cancelledCount / totalOrders) * 100).toFixed(1)) : 0,
  };

  return { ongoing, history, stats };
}

const DATE_FILTERS = ["all", "today", "yesterday", "week", "month", "year", "custom"];

export function filterBookingsByDate(bookings, filter, customRange) {
  if (!filter || filter === "all") return bookings;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  return bookings.filter((booking) => {
    if (!booking.createdAt) return false;
    const created = new Date(booking.createdAt);

    switch (filter) {
      case "today":
        return isSameDay(created, startOfToday);
      case "yesterday": {
        const yesterday = new Date(startOfToday);
        yesterday.setDate(startOfToday.getDate() - 1);
        return isSameDay(created, yesterday);
      }
      case "week": {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        return created >= startOfWeek;
      }
      case "month":
        return created >= new Date(now.getFullYear(), now.getMonth(), 1);
      case "year":
        return created >= new Date(now.getFullYear(), 0, 1);
      case "custom":
        if (!customRange?.from || !customRange?.to) return true;
        return created >= new Date(customRange.from) && created <= new Date(customRange.to);
      default:
        return true;
    }
  });
}

export function searchBookings(bookings, query) {
  const trimmed = query?.trim().toLowerCase();
  if (!trimmed) return bookings;

  return bookings.filter((booking) => {
    const provider = booking.assignedProvider || booking.requestedProvider;
    const haystack = [
      booking.bookingId,
      booking._id,
      booking.name,
      provider?.name,
      booking.service,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(trimmed);
  });
}

export const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "priceHigh", label: "Highest Price" },
  { key: "priceLow", label: "Lowest Price" },
];

export function sortBookings(bookings, sortKey) {
  const list = [...bookings];
  const priceOf = (booking) => Number(booking.finalEstimateAmount || booking.costEstimate || 0);

  switch (sortKey) {
    case "oldest":
      return list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    case "priceHigh":
      return list.sort((a, b) => priceOf(b) - priceOf(a));
    case "priceLow":
      return list.sort((a, b) => priceOf(a) - priceOf(b));
    case "newest":
    default:
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
}

export { DATE_FILTERS };
