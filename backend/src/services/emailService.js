import {
  emailConfig,
  isBrevoApiConfigured,
  isSmtpConfigured,
  smtpTransporter,
} from "../config/brevo.js";
export { emailConfig };
import {
  bookingAcceptedTemplate,
  bookingConfirmationTemplate,
  bookingReminderTemplate,
  cancellationTemplate,
  monthlySummaryTemplate,
  otpTemplate,
  passwordResetTemplate,
  paymentSuccessTemplate,
  providerRequestTemplate,
  providerApprovalTemplate,
  providerRejectionTemplate,
  refundTemplate,
  serviceCompletedTemplate,
  welcomeTemplate,
} from "../emails/emailTemplates.js";

const normalizeRecipients = (to) =>
  Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);

const emailTimeoutMs = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 8000);
const emailRetryCount = Number(process.env.EMAIL_RETRY_COUNT || 2);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (operation) => {
  let lastError;

  for (let attempt = 0; attempt <= emailRetryCount; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < emailRetryCount) {
        await wait(250 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const sendViaBrevoApi = async ({ recipients, subject, html, text }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), emailTimeoutMs);

  try {
    const response = await fetch(emailConfig.api.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": emailConfig.api.key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: emailConfig.fromName, email: emailConfig.fromEmail },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Brevo API responded with ${response.status}`);
    }

    return { sent: true, provider: "brevo-api" };
  } finally {
    clearTimeout(timeout);
  }
};

const sendViaSmtp = async ({ recipients, subject, html, text }) => {
  await smtpTransporter.sendMail({
    from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
    to: recipients.join(","),
    subject,
    html,
    text,
  });

  return { sent: true, provider: "brevo-smtp" };
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const recipients = normalizeRecipients(to);

  if (!recipients.length) {
    return { skipped: true, reason: "No recipient email provided." };
  }

  if (isBrevoApiConfigured) {
    try {
      return await withRetry(() => sendViaBrevoApi({ recipients, subject, html, text }));
    } catch (error) {
      console.error(`Brevo API email failed: ${error.message}`);
      if (!isSmtpConfigured) return { failed: true, error };
    }
  }

  if (isSmtpConfigured) {
    try {
      return await withRetry(() => sendViaSmtp({ recipients, subject, html, text }));
    } catch (error) {
      console.error(`Brevo SMTP email failed: ${error.message}`);
      return { failed: true, error };
    }
  }

  console.log("Email skipped: Brevo SMTP/API is not configured.");
  return { skipped: true, reason: "Brevo SMTP/API is not configured." };
};

const sendTemplate = (to, template) => sendEmail({ to, ...template });

export const sendWelcomeEmail = ({ to, name, role }) =>
  sendTemplate(to, welcomeTemplate({ name, role }));

export const sendBookingConfirmation = ({ to, name, booking, provider }) =>
  sendTemplate(to, bookingConfirmationTemplate({ name, booking, provider }));

export const sendBookingEmail = sendBookingConfirmation;

export const sendProviderRequestEmail = ({ to, providerName, booking }) =>
  sendTemplate(to, providerRequestTemplate({ providerName, booking }));

export const sendBookingAcceptedEmail = ({ to, name, booking, provider }) =>
  sendTemplate(to, bookingAcceptedTemplate({ name, booking, provider }));

export const sendProviderAcceptedEmail = sendBookingAcceptedEmail;

export const sendCancellationEmail = ({ to, audience, booking, reason, cancelledBy }) =>
  sendTemplate(to, cancellationTemplate({ audience, booking, reason, cancelledBy }));

export const sendCustomerCancellationEmail = ({ to, booking, reason }) =>
  sendCancellationEmail({ to, audience: "provider", booking, reason, cancelledBy: "customer" });

export const sendProviderCancellationEmail = ({ to, booking, reason }) =>
  sendCancellationEmail({ to, audience: "customer", booking, reason, cancelledBy: "provider" });

export const sendServiceRejectedEmail = ({ to, name, booking, reason }) =>
  sendTemplate(
    to,
    cancellationTemplate({
      audience: "customer",
      booking,
      reason,
      cancelledBy: booking.cancelledBy || "provider",
    })
  );

export const sendResetPasswordEmail = ({ to, name, resetUrl, expiresIn }) =>
  sendTemplate(to, passwordResetTemplate({ name, resetUrl, expiresIn }));

export const sendOtpEmail = ({ to, name, otp, purpose }) =>
  sendTemplate(to, otpTemplate({ name, otp, purpose }));

export const sendServiceCompletedEmail = ({ to, name, booking, providerName }) =>
  sendTemplate(to, serviceCompletedTemplate({ name, booking, providerName }));

export const sendPaymentSuccessEmail = ({ to, name, amount, transactionId, booking }) =>
  sendTemplate(to, paymentSuccessTemplate({ name, amount, transactionId, booking }));

export const sendRefundEmail = ({ to, name, amount, transactionId, timeline }) =>
  sendTemplate(to, refundTemplate({ name, amount, transactionId, timeline }));

export const sendProviderApprovalEmail = ({ to, name }) =>
  sendTemplate(to, providerApprovalTemplate({ name }));

export const sendProviderRejectionEmail = ({ to, name, reason }) =>
  sendTemplate(to, providerRejectionTemplate({ name, reason }));

export const sendBookingReminderEmail = ({ to, name, booking, provider }) =>
  sendTemplate(to, bookingReminderTemplate({ name, booking, provider }));

export const sendMonthlySummaryEmail = ({ to, name, month, totalBookings, completedServices, cancelledServices }) =>
  sendTemplate(to, monthlySummaryTemplate({ name, month, totalBookings, completedServices, cancelledServices }));
