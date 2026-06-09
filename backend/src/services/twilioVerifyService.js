import "dotenv/config";

const cleanEnv = (value = "") => String(value).trim().replace(/^['"]|['"]$/g, "");

const getTwilioVerifyConfig = () => ({
  accountSid: cleanEnv(process.env.TWILIO_ACCOUNT_SID),
  authToken: cleanEnv(process.env.TWILIO_AUTH_TOKEN),
  verifyServiceSid: cleanEnv(process.env.TWILIO_VERIFY_SERVICE_SID),
});

const normalizePhoneNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
};

const getAuthHeader = ({ accountSid, authToken }) =>
  `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

const validateConfig = (config) => {
  if (!config.accountSid || !config.authToken || !config.verifyServiceSid) {
    return "Twilio SMS OTP is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in backend .env.";
  }

  if (!config.accountSid.startsWith("AC")) {
    return "Invalid TWILIO_ACCOUNT_SID. It must start with AC.";
  }

  if (!config.verifyServiceSid.startsWith("VA")) {
    return "Invalid TWILIO_VERIFY_SERVICE_SID. It must start with VA.";
  }

  return "";
};

const getTwilioReason = (data = {}, fallback = "") => {
  const code = data?.code ? String(data.code) : "";
  const message = data?.message || fallback || "Twilio Verify request failed.";

  if (code === "20003" || /authenticate/i.test(message)) {
    return "Twilio authentication failed. Confirm TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN belong to the same active Twilio account, then restart the backend.";
  }

  return `${message}${code ? ` (Twilio code ${code})` : ""}`;
};

const twilioVerifyRequest = async (path, params) => {
  const config = getTwilioVerifyConfig();
  const configError = validateConfig(config);

  if (configError) {
    return { skipped: true, reason: configError };
  }

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${config.verifyServiceSid}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { failed: true, reason: getTwilioReason(data, `Twilio Verify responded with ${response.status}`), data };
  }

  return { sent: true, provider: "twilio-verify-sms", data };
};

export const sendSmsOtp = async ({ to }) => {
  const phone = normalizePhoneNumber(to);

  if (!phone) {
    return { skipped: true, reason: "No mobile number provided for SMS OTP." };
  }

  return twilioVerifyRequest("/Verifications", {
    To: phone,
    Channel: "sms",
  });
};

export const verifySmsOtp = async ({ to, code }) => {
  const phone = normalizePhoneNumber(to);

  if (!phone || !code) {
    return { approved: false, reason: "Mobile number and OTP are required." };
  }

  const result = await twilioVerifyRequest("/VerificationCheck", {
    To: phone,
    Code: code,
  });

  if (result.failed || result.skipped) {
    return { approved: false, reason: result.reason, data: result.data };
  }

  return {
    approved: result.data?.status === "approved",
    reason: result.data?.status === "approved" ? "" : "Invalid or expired SMS OTP.",
    data: result.data,
  };
};

export const getSmsOtpDiagnostics = () => {
  const config = getTwilioVerifyConfig();
  return {
    twilioSmsConfigured: !validateConfig(config),
    twilioSmsConfigError: validateConfig(config),
    twilioVerifyServiceSidLooksValid: config.verifyServiceSid.startsWith("VA"),
  };
};
