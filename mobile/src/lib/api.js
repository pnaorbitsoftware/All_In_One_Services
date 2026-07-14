import NetInfo from "@react-native-community/netinfo";
import { API_URL, API_URL_CANDIDATES } from "../config/api";

export const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
export const AUTH_REQUEST_TIMEOUT_MS = 45000;
export const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function normalizeUser(user = null) {
  if (!user) return null;

  const avatar = user.avatar || user.profileImage || "";
  return {
    ...user,
    name: user.name || "",
    email: user.email || "",
    address: user.address || "",
    profileComplete: user.profileComplete === true,
    mobileVerified: user.mobileVerified === true || Boolean(user.mobileVerifiedAt),
    avatar,
    profileImage: user.profileImage || avatar,
  };
}

export function normalizeProvider(provider = null) {
  if (!provider) return null;

  const image = provider.image || provider.profileImage || "";
  const approvalStatus = provider.approvalStatus || "approved";
  const rawAvailabilityStatus = provider.availabilityStatus || (provider.isActive === false ? "inactive" : "available");
  const availabilityStatus = String(rawAvailabilityStatus).trim().toLowerCase();
  const isBookable =
    approvalStatus !== "pending" &&
    approvalStatus !== "rejected" &&
    provider.isActive !== false &&
    !["inactive", "absent"].includes(availabilityStatus);
  return {
    ...provider,
    image,
    profileImage: provider.profileImage || image,
    approvalStatus,
    availabilityStatus,
    profileStatus: provider.profileStatus || (provider.isActive === false ? "inactive" : "active"),
    isBookable,
    unavailableMessage: isBookable ? "" : "Provider is currently unavailable.",
  };
}

export function normalizeProviderDashboard(data = {}) {
  const provider = normalizeProvider(data.provider);
  const summary = data.paymentSummary || data.summary || null;

  return {
    provider,
    bookings: Array.isArray(data.bookings) ? data.bookings : [],
    availableRequests: Array.isArray(data.availableRequests) ? data.availableRequests : [],
      history: data.history ?? {
  pending: [],
  completed: [],
  providerRejected: [],
  clientCancelled: [],
},

stats: data.stats ?? {
  pending: 0,
  completed: 0,
  providerRejected: 0,
  clientCancelled: 0,
},

    dashboardLocked: Boolean(data.dashboardLocked),
    message: data.message || "",
    paymentSummary: summary
      ? {
          totalPaidEarnings: summary.totalPaidEarnings ?? summary.adminReleasedAmount ?? 0,
          pendingEarnings: summary.pendingEarnings ?? 0,
          completedPaidBookings: summary.completedPaidBookings ?? summary.totalBookingsPaid ?? 0,
          awaitingClientPayment: summary.awaitingClientPayment ?? 0,
          adminReleased: summary.adminReleased ?? summary.adminReleasedAmount ?? 0,
          adminCommission: summary.adminCommission ?? 0,
          adminCommissionPercent: summary.adminCommissionPercent ?? 20,
          alreadyWithdrawn: summary.alreadyWithdrawn ?? summary.withdrawnAmount ?? 0,
          availableToWithdraw: summary.availableToWithdraw ?? 0,
          providerSharePercent: summary.providerSharePercent ?? 80,
        }
      : null,
    payments: Array.isArray(data.earnings) ? data.earnings : [],
    payouts: Array.isArray(data.payouts) ? data.payouts : [],
    withdrawals: Array.isArray(data.withdrawals) ? data.withdrawals : [],
  };
}

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { message: text || fallbackMessage };
}

function isMissingApiRoute(status, message = "") {
  const normalizedMessage = String(message || "").trim().toLowerCase();
  return (
    status === 404 &&
    (
      normalizedMessage === "not found" ||
      normalizedMessage === "api route not found." ||
      normalizedMessage.includes("<!doctype html>") ||
      normalizedMessage.includes("<html>") ||
      /^cannot (get|post|put|patch|delete) /i.test(message)
    )
  );
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    token,
    signal,
    method = body ? "POST" : "GET",
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    retry = method === "GET" ? 1 : 0,
  } = options;
  const headers = { Accept: "application/json" };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const network = await NetInfo.fetch().catch(() => null);
  if (network && network.isConnected === false) {
    throw new Error("No Internet Connection. Please check your network and try again.");
  }
  let lastError;
  const apiUrls = API_URL_CANDIDATES.length ? API_URL_CANDIDATES : [API_URL];

  for (let attempt = 0; attempt <= retry; attempt += 1) {
    let shouldRetryAttempt = false;

    for (let urlIndex = 0; urlIndex < apiUrls.length; urlIndex += 1) {
      const baseUrl = apiUrls[urlIndex];
      const hasFallbackUrl = urlIndex < apiUrls.length - 1;
      const controller = new AbortController();
      let didTimeout = false;
      let timeoutId;
      let externalAbortHandler;

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs);
      }

      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else if (typeof signal.addEventListener === "function") {
          externalAbortHandler = () => controller.abort();
          signal.addEventListener("abort", externalAbortHandler, { once: true });
        }
      }

      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const data = await parseApiResponse(response, "Request failed.");
        if (!response.ok) {
          const message = data.error || data.message || "Request failed.";

          if (isMissingApiRoute(response.status, message) && hasFallbackUrl) {
            lastError = new Error(message);
            continue;
          }

          if (attempt < retry && RETRYABLE_STATUS_CODES.has(response.status)) {
            lastError = new Error(message);
            shouldRetryAttempt = true;
            break;
          }

          const apiError = new Error(message);
          apiError.status = response.status;
          apiError.noFallback = true;
          throw apiError;
        }

        return data;
      } catch (error) {
        if (error?.noFallback) {
          throw error;
        }

        if (didTimeout) {
          lastError = new Error("Request timed out. The Render backend may be waking up. Please try again in a minute.");
        } else if (error?.name === "AbortError") {
          lastError = new Error("Request was cancelled. Please try again.");
        } else if (error?.message) {
          lastError = error;
        } else {
          lastError = new Error(`Cannot reach ServiceHub server at ${baseUrl}. Check your internet connection and try again.`);
        }

        if (hasFallbackUrl && !signal?.aborted) {
          continue;
        }

        if (attempt < retry && !signal?.aborted) {
          shouldRetryAttempt = true;
          break;
        }

        throw lastError;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (signal && externalAbortHandler && typeof signal.removeEventListener === "function") {
          signal.removeEventListener("abort", externalAbortHandler);
        }
      }
    }

    if (shouldRetryAttempt && attempt < retry && !signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
    }
  }

  throw lastError || new Error("Request failed.");
}

export const authApi = {
  sendMobileOtp: (body) => apiRequest("/auth/mobile-otp/send", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  verifyMobileOtp: (body) => apiRequest("/auth/mobile-otp/verify", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  login: (body) => apiRequest("/auth/login", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  register: (body) => apiRequest("/auth/register", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  me: (token) => apiRequest("/auth/me", { token }),
  updateProfile: (token, body) => apiRequest("/auth/profile", { method: "PATCH", token, body }),
  completeClientProfile: async (token, body) => {
    try {
      return await apiRequest("/auth/profile/complete", { method: "PATCH", token, body });
    } catch (error) {
      if (isMissingApiRoute(error?.status, error?.message)) {
        return apiRequest("/auth/profile", { method: "PATCH", token, body });
      }

      throw error;
    }
  },
  updateProfileImage: async (token, profileImage) => {
    try {
      return await apiRequest("/auth/profile-image", { method: "PATCH", token, body: { profileImage } });
    } catch (error) {
      if (isMissingApiRoute(error?.status, error?.message)) {
        return { skippedProfileImage: true };
      }

      throw error;
    }
  },
  forgotPasswordOtp: (body) => apiRequest("/auth/forgot-password/otp", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  forgotPasswordVerify: (body) => apiRequest("/auth/forgot-password/verify", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
  resetPassword: (body) => apiRequest("/auth/reset-password", { body, timeoutMs: AUTH_REQUEST_TIMEOUT_MS }),
};

export const catalogApi = {
  list: () => apiRequest("/catalog"),
};

export const bookingApi = {
  create: (token, body) => apiRequest("/bookings", { token, body }),
  confirmPayment: (token, bookingId, body) =>
    apiRequest(`/bookings/${bookingId}/payment-confirmation`, { method: "PATCH", token, body }),
  my: (token) => apiRequest("/bookings/my", { token }),
  cancel: (token, bookingId) => apiRequest(`/bookings/${bookingId}/cancel`, { method: "PATCH", token }),
  review: (token, bookingId, body) => apiRequest(`/bookings/${bookingId}/review`, { method: "PATCH", token, body }),
  tracking: (token, bookingId) => apiRequest(`/bookings/${bookingId}/tracking`, { token }),
  updateTracking: (token, bookingId, body) =>
    apiRequest(`/bookings/${bookingId}/tracking`, { method: "PATCH", token, body }),
  updateClientLocation: (token, bookingId, body) =>
    apiRequest(`/bookings/${bookingId}/client-location`, { method: "PATCH", token, body }),
};

export const providerApi = {
  dashboard: (token) => apiRequest("/providers/dashboard", { token }),
  profile: (token) => apiRequest("/providers/profile", { token }),
  updateProfile: (token, body) => apiRequest("/providers/profile", { method: "PATCH", token, body }),
  updateAvailability: (token, availabilityStatus) =>
    apiRequest("/providers/availability", { method: "PATCH", token, body: { availabilityStatus } }),
  startTracking: (token, location) => apiRequest("/providers/tracking/start", { method: "POST", token, body: location }),
  stopTracking: (token) => apiRequest("/providers/tracking/stop", { method: "POST", token, body: {} }),
  updateTrackingLocation: (token, location) =>
    apiRequest("/providers/tracking/location", { method: "PATCH", token, body: location }),
  acceptBooking: (token, bookingId) => apiRequest(`/providers/bookings/${bookingId}/accept`, { method: "PATCH", token }),
  updateBookingStatus: (token, bookingId, body) =>
    apiRequest(`/providers/bookings/${bookingId}/status`, { method: "PATCH", token, body }),
  updateLocation: (token, bookingId, body) =>
    apiRequest(`/providers/bookings/${bookingId}/location`, { method: "PATCH", token, body }),
  tracking: (token, bookingId) => apiRequest(`/providers/bookings/${bookingId}/tracking`, { token }),
  requestClientLocation: (token, bookingId) =>
    apiRequest(`/bookings/${bookingId}/request-location`, { method: "POST", token }),
};

export const paymentApi = {
  my: (token) => apiRequest("/payments/my", { token }),
  providerEarnings: (token) => apiRequest("/payments/provider/earnings", { token }),
  submitEstimate: (token, bookingId, finalEstimateAmount) =>
    apiRequest(`/payments/bookings/${bookingId}/estimate`, {
      method: "POST",
      token,
      body: { finalEstimateAmount },
    }),
  acceptEstimate: (token, bookingId) =>
    apiRequest(`/payments/bookings/${bookingId}/estimate/accept`, { method: "PATCH", token }),
  rejectEstimate: (token, bookingId, rejectionReason) =>
    apiRequest(`/payments/bookings/${bookingId}/estimate/reject`, {
      method: "PATCH",
      token,
      body: { rejectionReason },
    }),
  createOrder: (token, bookingId) => apiRequest("/payments/create-order", { token, body: { bookingId } }),
  verify: (token, body) => apiRequest("/payments/verify", { token, body }),
  withdrawProviderEarnings: (token, bankDetails) =>
    apiRequest("/payments/provider/withdraw", { token, body: bankDetails }),
};

export const contactApi = {
  create: (token, message) => apiRequest("/contact", { token, body: { message } }),
};
export const notificationApi = {
  list: (token) => apiRequest("/notifications", { token }),
  savePushToken: (token, expoPushToken) =>
    apiRequest("/notifications/push-token", {
      method: "POST",
      token,
      body: { expoPushToken },
    }),
  markRead: (token, notificationId) => apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH", token }),
  markAllRead: (token) => apiRequest("/notifications/read-all", { method: "PATCH", token }),
};
