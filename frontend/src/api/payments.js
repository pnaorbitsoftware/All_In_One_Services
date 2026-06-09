const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("servicehub_token");

const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return { message: (await response.text()) || fallbackMessage };
};

const paymentRequest = async (path, options = {}, fallbackMessage = "Payment request failed.") => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await parseApiResponse(response, fallbackMessage);
  if (!response.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }
  return data;
};

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const submitProviderEstimate = (bookingId, finalEstimateAmount) =>
  paymentRequest(
    `/payments/bookings/${bookingId}/estimate`,
    {
      method: "POST",
      body: JSON.stringify({ finalEstimateAmount }),
    },
    "Estimate could not be submitted."
  );

export const acceptEstimate = (bookingId) =>
  paymentRequest(
    `/payments/bookings/${bookingId}/estimate/accept`,
    { method: "PATCH" },
    "Estimate could not be accepted."
  );

export const rejectEstimate = (bookingId, rejectionReason) =>
  paymentRequest(
    `/payments/bookings/${bookingId}/estimate/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    },
    "Estimate could not be rejected."
  );

export const createRazorpayOrder = (bookingId) =>
  paymentRequest(
    "/payments/create-order",
    {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    },
    "Razorpay order could not be created."
  );

export const verifyRazorpayPayment = (response, bookingId) =>
  paymentRequest(
    "/payments/verify",
    {
      method: "POST",
      body: JSON.stringify({
        bookingId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    },
    "Payment verification failed."
  );

export const getProviderEarnings = () =>
  paymentRequest("/payments/provider/earnings", {}, "Provider earnings could not be loaded.");

export const withdrawProviderEarnings = (bankDetails) =>
  paymentRequest(
    "/payments/provider/withdraw",
    {
      method: "POST",
      body: JSON.stringify(bankDetails),
    },
    "Withdrawal could not be completed."
  );

export const getAdminLedger = () =>
  paymentRequest("/payments/admin/ledger", {}, "Admin payment ledger could not be loaded.");

export const sendProviderPayout = (providerId) =>
  paymentRequest(
    `/payments/admin/providers/${providerId}/payout`,
    { method: "POST" },
    "Provider payout could not be sent."
  );
