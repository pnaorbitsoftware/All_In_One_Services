import { sendWhatsAppMessage } from "./whatsappService.js";

const bookingRef = (booking = {}) => booking.bookingId || booking._id || "your booking";
const bookingService = (booking = {}) => booking.service || "service";
const bookingSchedule = (booking = {}) => {
  const date = booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString("en-IN") : "scheduled date";
  const time = booking.preferredTime || "scheduled time";
  return `${date} at ${time}`;
};

const sendOptionalWhatsApp = (payload) =>
  sendWhatsAppMessage(payload).catch((error) => {
    console.error(`WhatsApp notification failed: ${error.message}`);
    return { failed: true, error };
  });

export const sendWelcomeWhatsApp = ({ to, name, role }) =>
  sendOptionalWhatsApp({
    to,
    body:
      role === "provider"
        ? `Hi ${name || "there"}, your ServiceHub provider registration is received. Please wait for admin approval before accepting jobs.`
        : `Hi ${name || "there"}, your ServiceHub client account was created successfully. You can now book trusted home services.`,
  });

export const sendBookingConfirmationWhatsApp = ({ to, name, booking, provider }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || booking?.name || "there"}, your ServiceHub booking ${bookingRef(booking)} for ${bookingService(booking)} is confirmed for ${bookingSchedule(booking)}.${provider?.name ? ` Requested provider: ${provider.name}.` : ""}`,
  });

export const sendProviderRequestWhatsApp = ({ to, providerName, booking }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${providerName || "Provider"}, new ServiceHub request for ${bookingService(booking)} at ${booking?.address || "client address"}. Client name and phone number will be visible after you accept it. Booking: ${bookingRef(booking)}.`,
  });

export const sendBookingAcceptedWhatsApp = ({ to, name, booking, provider }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || booking?.name || "there"}, ${provider?.name || "your provider"} accepted your ServiceHub booking ${bookingRef(booking)} for ${bookingService(booking)}.`,
  });

export const sendProviderApprovalWhatsApp = ({ to, name }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || "Provider"}, your ServiceHub provider profile has been approved. You can now access the provider dashboard and accept jobs.`,
  });

export const sendProviderRejectionWhatsApp = ({ to, name, reason }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || "Provider"}, your ServiceHub provider profile was not approved. Reason: ${reason || "Please contact support for details."}`,
  });

export const sendServiceCompletedWhatsApp = ({ to, name, booking, providerName }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || booking?.name || "there"}, your ServiceHub ${bookingService(booking)} booking ${bookingRef(booking)} has been completed${providerName ? ` by ${providerName}` : ""}.`,
  });

export const sendCancellationWhatsApp = ({ to, booking, reason, cancelledBy = "ServiceHub" }) =>
  sendOptionalWhatsApp({
    to,
    body: `ServiceHub booking ${bookingRef(booking)} for ${bookingService(booking)} was cancelled by ${cancelledBy}. Reason: ${reason || "Not specified"}.`,
  });

export const sendProviderRequestRejectedWhatsApp = ({ to, name, booking, providerName, reason }) =>
  sendOptionalWhatsApp({
    to,
    body: `Hi ${name || booking?.name || "there"}, ${providerName || "the provider"} could not accept your ServiceHub request ${bookingRef(booking)} for ${bookingService(booking)}.${reason ? ` Reason: ${reason}.` : ""} You can choose another provider on ServiceHub.`,
  });
