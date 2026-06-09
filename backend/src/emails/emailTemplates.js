import { emailConfig } from "../config/brevo.js";

const currency = (value = 0) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date not set";

const appUrl = (path = "") => `${emailConfig.clientUrl}${path}`;

const button = (label, href) => `
  <a class="button" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">
    ${escapeHtml(label)}
  </a>
`;

const row = (label, value) => `
  <tr>
    <td class="label">${escapeHtml(label)}</td>
    <td class="value">${escapeHtml(value || "Not available")}</td>
  </tr>
`;

const statusBadge = (status = "pending") => `
  <span class="badge badge-${escapeHtml(status).toLowerCase()}">${escapeHtml(status)}</span>
`;

const baseEmail = ({ preview = "", title, body, cta = "", note = "" }) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; background: #f4f7fb; color: #172033; font-family: Inter, Arial, sans-serif; }
      .preview { display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; }
      .wrap { width: 100%; padding: 28px 12px; }
      .container { max-width: 640px; margin: 0 auto; }
      .brand { padding: 20px 4px; text-align: center; }
      .logo { display:inline-block; width:42px; height:42px; border-radius:14px; background:linear-gradient(135deg,#0f9f9a,#1266f1); color:#fff; line-height:42px; font-weight:900; font-size:18px; }
      .brand-name { margin:10px 0 0; font-weight:900; font-size:22px; letter-spacing:-0.02em; }
      .brand-sub { margin:4px 0 0; color:#718096; font-size:12px; text-transform:uppercase; letter-spacing:0.16em; font-weight:800; }
      .card { background:#fff; border:1px solid #e8eef7; border-radius:24px; overflow:hidden; box-shadow:0 22px 70px rgba(22,34,51,0.10); }
      .hero { padding:34px 34px 22px; background:linear-gradient(135deg,#f8fbff,#fff7e6); }
      h1 { margin:0; font-size:30px; line-height:1.15; letter-spacing:-0.04em; }
      .lead { margin:14px 0 0; color:#526072; font-size:16px; line-height:1.65; }
      .content { padding: 26px 34px 34px; }
      .panel { border:1px solid #e8eef7; border-radius:18px; padding:18px; background:#fbfdff; margin:18px 0; }
      table { width:100%; border-collapse:collapse; }
      td { padding:10px 0; border-bottom:1px solid #edf2f7; vertical-align:top; }
      tr:last-child td { border-bottom:0; }
      .label { width:38%; color:#718096; font-size:12px; text-transform:uppercase; letter-spacing:.12em; font-weight:900; }
      .value { color:#172033; font-size:15px; font-weight:800; text-align:right; }
      .button { display:inline-block; background:#101827; color:#fff !important; text-decoration:none; padding:14px 22px; border-radius:14px; font-weight:900; box-shadow:0 14px 32px rgba(16,24,39,.18); }
      .button:hover { background:#000; }
      .badge { display:inline-block; padding:7px 11px; border-radius:999px; font-size:12px; font-weight:900; text-transform:capitalize; }
      .badge-pending,.badge-accepted,.badge-assigned,.badge-confirmed { background:#fff7d6; color:#8a5c00; }
      .badge-completed,.badge-approved,.badge-success { background:#dbf8e6; color:#087344; }
      .badge-cancelled,.badge-rejected { background:#ffe1e7; color:#b01635; }
      .otp { margin:22px 0; padding:18px; border-radius:18px; text-align:center; background:#101827; color:#fff; font-size:34px; font-weight:900; letter-spacing:.36em; }
      .receipt-total { display:flex; justify-content:space-between; gap:12px; padding:18px; border-radius:18px; background:#101827; color:#fff; font-size:18px; font-weight:900; }
      .note { color:#718096; font-size:13px; line-height:1.65; }
      .footer { padding:20px 12px; text-align:center; color:#8290a3; font-size:12px; line-height:1.6; }
      @media (max-width: 560px) {
        .wrap { padding: 10px; }
        .hero, .content { padding: 24px 18px; }
        h1 { font-size: 24px; }
        .label, .value { display:block; width:100%; text-align:left; padding:4px 0; }
        td { display:block; padding:9px 0; }
        .otp { font-size:28px; letter-spacing:.24em; }
      }
    </style>
  </head>
  <body>
    <div class="preview">${escapeHtml(preview)}</div>
    <div class="wrap">
      <div class="container">
        <div class="brand">
          <span class="logo">S</span>
          <p class="brand-name">ServiceHub</p>
          <p class="brand-sub">Verified local services</p>
        </div>
        <div class="card">
          <div class="hero">
            <h1>${escapeHtml(title)}</h1>
            ${preview ? `<p class="lead">${escapeHtml(preview)}</p>` : ""}
          </div>
          <div class="content">
            ${body}
            ${cta ? `<p style="margin:26px 0 0">${cta}</p>` : ""}
            ${note ? `<p class="note" style="margin-top:22px">${escapeHtml(note)}</p>` : ""}
          </div>
        </div>
        <div class="footer">
          You are receiving this because you use ServiceHub.<br />
          Need help? Contact ${escapeHtml(emailConfig.supportEmail || "ServiceHub support")}.
        </div>
      </div>
    </div>
  </body>
</html>
`;

export const welcomeTemplate = ({ name, role = "user" }) => ({
  subject: "Welcome to ServiceHub",
  text: `Hi ${name}, welcome to ServiceHub. Your ${role === "provider" ? "provider" : "client"} account is ready.`,
  html: baseEmail({
    title: `Welcome, ${name || "there"}`,
    preview: "Your ServiceHub account is ready. You can now manage bookings in one clean workspace.",
    body: `<p class="lead">We are glad you are here. ServiceHub helps clients book trusted local professionals and gives providers a simple place to manage service requests.</p>`,
    cta: button("Log in to ServiceHub", appUrl("/")),
  }),
});

export const bookingConfirmationTemplate = ({ name, booking, provider }) => ({
  subject: `Booking confirmed: ${booking.service}`,
  text: `Hi ${name}, your ${booking.service} booking request is confirmed for ${formatDate(booking.preferredDate)} at ${booking.preferredTime}.`,
  html: baseEmail({
    title: "Booking request received",
    preview: "We saved your service request and will keep you updated as it moves forward.",
    body: `
      <p class="lead">Hi ${escapeHtml(name || booking.name)}, your booking is now in ServiceHub.</p>
      <div class="panel"><table>
        ${row("Service", booking.service)}
        ${row("Provider", provider?.name || booking.assignedProviderName || booking.requestedProviderName || "Provider not assigned yet")}
        ${row("Date and time", `${formatDate(booking.preferredDate)} at ${booking.preferredTime}`)}
        ${row("Booking ID", booking._id || booking.id || "Pending")}
        <tr><td class="label">Status</td><td class="value">${statusBadge(booking.status || "pending")}</td></tr>
      </table></div>
    `,
    cta: button("View booking", appUrl("/")),
  }),
});

export const providerRequestTemplate = ({ providerName, booking }) => ({
  subject: `New ${booking.service} request on ServiceHub`,
  text: `Hi ${providerName}, a customer requested ${booking.service}. Open your provider dashboard to review it.`,
  html: baseEmail({
    title: "New client request",
    preview: "A customer has requested your service on ServiceHub.",
    body: `
      <p class="lead">Hi ${escapeHtml(providerName || "there")}, a new booking request is waiting for your review.</p>
      <div class="panel"><table>
        ${row("Service", booking.service)}
        ${row("Address", booking.address)}
        ${row("Date and time", `${formatDate(booking.preferredDate)} at ${booking.preferredTime}`)}
        ${row("Problem", booking.problemDescription || "Not provided")}
        ${row("Client details", "Name and phone number will be visible after accepting the request")}
      </table></div>
    `,
    cta: button("Review request", appUrl("/")),
  }),
});

export const bookingAcceptedTemplate = ({ name, booking, provider }) => ({
  subject: `${provider?.name || "A provider"} accepted your booking`,
  text: `Hi ${name}, ${provider?.name || "your provider"} accepted your ${booking.service} booking.`,
  html: baseEmail({
    title: "Your provider accepted",
    preview: "Your service booking is now confirmed with a provider.",
    body: `
      <p class="lead">Good news, ${escapeHtml(name || "there")}. ${escapeHtml(provider?.name || "Your provider")} accepted your request.</p>
      <div class="panel"><table>
        ${row("Service", booking.service)}
        ${row("Provider", provider?.name || booking.assignedProviderName)}
        ${row("Phone", provider?.phone || "Not available")}
        ${row("Location", provider?.location || "Not available")}
        ${row("Scheduled", `${formatDate(booking.preferredDate)} at ${booking.preferredTime}`)}
      </table></div>
    `,
    cta: button("Open dashboard", appUrl("/")),
  }),
});

export const cancellationTemplate = ({ audience = "customer", booking, reason, cancelledBy = "customer" }) => {
  const providerCancelled = cancelledBy === "provider";
  const title = providerCancelled ? "Your provider cancelled the booking" : "Booking cancelled";
  const preview = providerCancelled
    ? "We are sorry for the inconvenience. You can book another provider from ServiceHub."
    : "This booking has been cancelled and the related details are below.";

  return {
    subject: `ServiceHub booking cancelled: ${booking.service}`,
    text: `The ${booking.service} booking was cancelled. Reason: ${reason || "Not provided"}`,
    html: baseEmail({
      title,
      preview,
      body: `
        <p class="lead">${audience === "provider" ? "A customer cancelled a booking assigned to you." : "We know cancellations are frustrating. The request has been marked cancelled, and you can rebook when you are ready."}</p>
        <div class="panel"><table>
          ${row("Service", booking.service)}
          ${row("Date and time", `${formatDate(booking.preferredDate)} at ${booking.preferredTime}`)}
          ${row("Booking ID", booking._id || booking.id || "Not available")}
          ${row("Reason", reason || booking.adminRejectionReason || booking.cancellationReason || "Not provided")}
        </table></div>
      `,
      cta: providerCancelled ? button("Book another provider", appUrl("/")) : "",
    }),
  };
};

export const passwordResetTemplate = ({ name, resetUrl, expiresIn = "10 minutes" }) => ({
  subject: "Reset your ServiceHub password",
  text: `Hi ${name}, reset your password using this link: ${resetUrl}. This link expires in ${expiresIn}.`,
  html: baseEmail({
    title: "Reset your password",
    preview: "Use the secure button below to choose a new ServiceHub password.",
    body: `<p class="lead">Hi ${escapeHtml(name || "there")}, we received a request to reset your password. If this was not you, you can safely ignore this email.</p>`,
    cta: button("Reset password", resetUrl),
    note: `For your safety, this reset link expires in ${expiresIn}.`,
  }),
});

export const otpTemplate = ({ name, otp, purpose = "verification", expiresIn = "5 minutes" }) => ({
  subject: `ServiceHub OTP for ${purpose}`,
  text: `Hi ${name || "there"}, your ServiceHub OTP is ${otp}. It expires in ${expiresIn}.`,
  html: baseEmail({
    title: "Verify your email",
    preview: `Use this OTP to complete ${purpose}.`,
    body: `<p class="lead">Hi ${escapeHtml(name || "there")}, enter this code in ServiceHub to continue.</p><div class="otp">${escapeHtml(otp)}</div>`,
    note: `This OTP expires in ${expiresIn}. Never share it with anyone.`,
  }),
});

export const serviceCompletedTemplate = ({ name, booking, providerName }) => ({
  subject: `Service completed: ${booking.service}`,
  text: `Hi ${name}, your ${booking.service} service has been completed. Please leave a review.`,
  html: baseEmail({
    title: "Service completed",
    preview: "Your provider marked the service as completed.",
    body: `<p class="lead">Hi ${escapeHtml(name || "there")}, your ${escapeHtml(booking.service)} service with ${escapeHtml(providerName || booking.assignedProviderName || "your provider")} is complete. Your feedback helps other customers choose confidently.</p>`,
    cta: button("Leave a review", appUrl("/")),
  }),
});

export const paymentSuccessTemplate = ({ name, amount, transactionId, booking }) => ({
  subject: "Payment successful",
  text: `Hi ${name}, payment of ${currency(amount)} was successful. Transaction ID: ${transactionId}.`,
  html: baseEmail({
    title: "Payment successful",
    preview: "Your ServiceHub payment receipt is ready.",
    body: `
      <div class="receipt-total"><span>Paid</span><span>${currency(amount)}</span></div>
      <div class="panel"><table>
        ${row("Transaction ID", transactionId)}
        ${row("Service", booking?.service || "ServiceHub booking")}
        ${row("Booking ID", booking?._id || booking?.id || "Not available")}
      </table></div>
    `,
  }),
});

export const refundTemplate = ({ name, amount, transactionId, timeline = "5-7 business days" }) => ({
  subject: "Refund initiated",
  text: `Hi ${name}, refund of ${currency(amount)} has been initiated. Expected timeline: ${timeline}.`,
  html: baseEmail({
    title: "Refund initiated",
    preview: "Your refund request has been processed from ServiceHub.",
    body: `<div class="panel"><table>${row("Refund amount", currency(amount))}${row("Transaction ID", transactionId)}${row("Expected timeline", timeline)}</table></div>`,
  }),
});

export const providerApprovalTemplate = ({ name }) => ({
  subject: "Your ServiceHub provider profile is approved",
  text: `Hi ${name}, your provider account has been approved. You can now receive bookings.`,
  html: baseEmail({
    title: "Provider account approved",
    preview: "You can now accept bookings from customers on ServiceHub.",
    body: `<p class="lead">Hi ${escapeHtml(name || "there")}, your provider profile has been reviewed and approved by the ServiceHub team.</p>`,
    cta: button("Open provider dashboard", appUrl("/")),
  }),
});

export const providerRejectionTemplate = ({ name, reason = "Your profile did not meet the current provider requirements." }) => ({
  subject: "ServiceHub provider application update",
  text: `Hi ${name}, your provider application was not approved. Reason: ${reason}`,
  html: baseEmail({
    title: "Provider application update",
    preview: "Thank you for applying to become a ServiceHub provider.",
    body: `<p class="lead">Hi ${escapeHtml(name || "there")}, thank you for applying. We cannot approve the provider profile at this time.</p><div class="panel">${escapeHtml(reason)}</div>`,
  }),
});

export const bookingReminderTemplate = ({ name, booking, provider }) => ({
  subject: `Reminder: ${booking.service} starts in 1 hour`,
  text: `Hi ${name}, your ${booking.service} service starts in 1 hour.`,
  html: baseEmail({
    title: "Your service starts soon",
    preview: "A quick reminder from ServiceHub.",
    body: `<div class="panel"><table>${row("Service", booking.service)}${row("Provider", provider?.name || booking.assignedProviderName)}${row("Time", `${formatDate(booking.preferredDate)} at ${booking.preferredTime}`)}${row("Address", booking.address)}</table></div>`,
  }),
});

export const monthlySummaryTemplate = ({ name, month, totalBookings = 0, completedServices = 0, cancelledServices = 0 }) => ({
  subject: `Your ServiceHub summary for ${month}`,
  text: `Hi ${name}, ${month} summary: ${totalBookings} bookings, ${completedServices} completed, ${cancelledServices} cancelled.`,
  html: baseEmail({
    title: `${month} summary`,
    preview: "Here is a quick look at your ServiceHub activity.",
    body: `<div class="panel"><table>${row("Total bookings", totalBookings)}${row("Completed services", completedServices)}${row("Cancelled services", cancelledServices)}</table></div>`,
    cta: button("Open ServiceHub", appUrl("/")),
  }),
});
