import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const emailConfig = {
  appName: process.env.APP_NAME || "ServiceHub",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  supportEmail: process.env.SUPPORT_EMAIL || process.env.MAIL_FROM_EMAIL || "",
  fromEmail: process.env.MAIL_FROM_EMAIL || process.env.BREVO_SMTP_USER || "",
  fromName: process.env.MAIL_FROM_NAME || "ServiceHub",
  smtp: {
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    user: process.env.BREVO_SMTP_USER || "",
    key: process.env.BREVO_SMTP_KEY || "",
  },
  api: {
    key: process.env.BREVO_API_KEY || "",
    url: process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email",
  },
};

export const isSmtpConfigured = Boolean(
  emailConfig.smtp.user && emailConfig.smtp.key && emailConfig.fromEmail
);

export const isBrevoApiConfigured = Boolean(
  emailConfig.api.key && emailConfig.fromEmail
);

export const smtpTransporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.port === 465,
      pool: true,
      maxConnections: Number(process.env.BREVO_SMTP_MAX_CONNECTIONS || 3),
      maxMessages: Number(process.env.BREVO_SMTP_MAX_MESSAGES || 100),
      connectionTimeout: Number(process.env.BREVO_SMTP_CONNECTION_TIMEOUT_MS || 5000),
      greetingTimeout: Number(process.env.BREVO_SMTP_GREETING_TIMEOUT_MS || 5000),
      socketTimeout: Number(process.env.BREVO_SMTP_SOCKET_TIMEOUT_MS || 10000),
      auth: {
        user: emailConfig.smtp.user,
        pass: emailConfig.smtp.key,
      },
    })
  : null;
