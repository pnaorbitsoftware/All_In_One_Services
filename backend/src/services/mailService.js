import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = Number(process.env.BREVO_SMTP_PORT || 587);
const smtpUser = process.env.BREVO_SMTP_USER || "";
const smtpKey = process.env.BREVO_SMTP_KEY || "";
const fromEmail = process.env.MAIL_FROM_EMAIL || smtpUser || "";
const fromName = process.env.MAIL_FROM_NAME || "ServiceHub";

const isMailEnabled = Boolean(smtpUser && smtpKey && fromEmail);
const hasCommonBrevoKeyPrefix =
  !smtpKey || /^(xkeysib-|xsmtp|x-smtp|smtp)/i.test(smtpKey);

const transporter = isMailEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpKey,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildHtml = (title, lines) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#18232e">
    <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>
    ${lines.map((line) => `<p style="margin:0 0 10px">${line}</p>`).join("")}
  </div>
`;

const getMailFailureMessage = (error) => {
  const response = String(error?.response || "");
  const message = String(error?.message || "");
  const joined = `${response} ${message}`.toLowerCase();

  if (["EAUTH", "EENVELOPE"].includes(error?.code) || error?.responseCode === 535) {
    return "Brevo SMTP authentication failed. Re-copy BREVO_SMTP_USER and the full BREVO_SMTP_KEY from Brevo SMTP settings.";
  }

  if (
    error?.responseCode === 550 ||
    joined.includes("sender") ||
    joined.includes("not verified") ||
    joined.includes("not allowed")
  ) {
    return "Brevo rejected the sender email. Verify MAIL_FROM_EMAIL in Brevo senders, then restart Render.";
  }

  if (
    ["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(error?.code) ||
    joined.includes("timeout") ||
    joined.includes("timed out")
  ) {
    return "Brevo SMTP timed out from Render. Check Brevo SMTP settings and try again after restarting the backend.";
  }

  return "Email could not be sent. Check your Brevo SMTP username, key, and verified sender email.";
};

export const getMailStatus = () => ({
  configured: isMailEnabled,
  host: smtpHost,
  port: smtpPort,
  userConfigured: Boolean(smtpUser),
  keyConfigured: Boolean(smtpKey),
  senderConfigured: Boolean(fromEmail),
  keyHasCommonBrevoPrefix: hasCommonBrevoKeyPrefix,
});

export const sendMail = async ({ to, subject, html, text }) => {
  if (!to || !isMailEnabled) {
    if (!isMailEnabled) {
      console.log("Email skipped: Brevo SMTP is not configured.");
    }
    return { skipped: true };
  }

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    return { sent: true };
  } catch (error) {
    console.error(`Email failed for ${to}: ${error.message}`);
    console.error("Brevo SMTP failure details:", {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
    });
    return { failed: true, error, message: getMailFailureMessage(error) };
  }
};

export const sendOtpEmail = ({ to, name, otp, purpose }) =>
  sendMail({
    to,
    subject: `ServiceHub OTP for ${purpose}`,
    text: `Hi ${name || "there"}, your ServiceHub OTP is ${otp}. It is valid for 5 minutes.`,
    html: buildHtml(`ServiceHub ${purpose} OTP`, [
      `Hi ${escapeHtml(name || "there")},`,
      `Your OTP is <strong style="font-size:20px">${escapeHtml(otp)}</strong>.`,
      "This OTP is valid for 5 minutes.",
    ]),
  });

export const sendWelcomeEmail = ({ to, name, role }) =>
  sendMail({
    to,
    subject: "Welcome to ServiceHub",
    text: `Hi ${name}, your ${role === "provider" ? "provider" : "client"} account has been created successfully.`,
    html: buildHtml("Welcome to ServiceHub", [
      `Hi ${escapeHtml(name)},`,
      `Your ${role === "provider" ? "provider" : "client"} account has been created successfully.`,
      role === "provider"
        ? "You can now open your provider workspace and accept matching service requests."
        : "You can now book trusted service providers.",
    ]),
  });

export const sendBookingEmail = ({ to, name, booking, provider }) =>
  sendMail({
    to,
    subject: `ServiceHub booking request: ${booking.service}`,
    text: `Hi ${name}, your ${booking.service} booking request is saved for ${booking.preferredTime}.`,
    html: buildHtml("Booking Request Received", [
      `Hi ${escapeHtml(name)},`,
      `Your <strong>${escapeHtml(booking.service)}</strong> booking request has been saved.`,
      `Date: ${new Date(booking.preferredDate).toLocaleDateString("en-IN")} at ${escapeHtml(booking.preferredTime)}`,
      `Duration: ${escapeHtml(booking.serviceDuration)} | Estimate: Rs. ${Number(booking.costEstimate || 0).toLocaleString("en-IN")}`,
      `Problem: ${escapeHtml(booking.problemDescription || "Not provided")}`,
      provider ? `Requested provider: ${escapeHtml(provider.name)}` : "A matching provider can accept this request.",
    ]),
  });

export const sendProviderRequestEmail = ({ to, providerName, booking }) =>
  sendMail({
    to,
    subject: `New ${booking.service} request on ServiceHub`,
    text: `Hi ${providerName}, a client has booked ${booking.service}. Check your provider dashboard.`,
    html: buildHtml("New Client Request", [
      `Hi ${escapeHtml(providerName)},`,
      `A client has requested <strong>${escapeHtml(booking.service)}</strong>.`,
      `Client: ${escapeHtml(booking.name)} | Phone: ${escapeHtml(booking.phone)}`,
      `Date: ${new Date(booking.preferredDate).toLocaleDateString("en-IN")} at ${escapeHtml(booking.preferredTime)}`,
      `Problem: ${escapeHtml(booking.problemDescription || "Not provided")}`,
      "Open your provider dashboard to accept the request.",
    ]),
  });

export const sendServiceCompletedEmail = ({ to, name, booking, providerName }) =>
  sendMail({
    to,
    subject: `ServiceHub service completed: ${booking.service}`,
    text: `Hi ${name}, your ${booking.service} service has been marked completed by ${providerName}.`,
    html: buildHtml("Service Completed", [
      `Hi ${escapeHtml(name)},`,
      `Your <strong>${escapeHtml(booking.service)}</strong> service has been marked completed.`,
      `Provider: ${escapeHtml(providerName || booking.assignedProviderName || "ServiceHub provider")}`,
      "Thank you for using ServiceHub.",
    ]),
  });

export const sendProviderAcceptedEmail = ({ to, name, booking, provider }) =>
  sendMail({
    to,
    subject: `Provider accepted your ${booking.service} booking`,
    text: `Hi ${name}, ${provider.name} accepted your ${booking.service} booking.`,
    html: buildHtml("Provider Accepted Your Booking", [
      `Hi ${escapeHtml(name)},`,
      `${escapeHtml(provider.name)} accepted your <strong>${escapeHtml(booking.service)}</strong> booking.`,
      `Provider phone: ${escapeHtml(provider.phone || "Not available")}`,
      `Scheduled time: ${new Date(booking.preferredDate).toLocaleDateString("en-IN")} at ${escapeHtml(booking.preferredTime)}`,
    ]),
  });

