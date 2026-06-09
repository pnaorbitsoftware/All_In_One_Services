import "dotenv/config";

const cleanEnv = (value = "") => String(value).trim().replace(/^['"]|['"]$/g, "");

const getWhatsAppConfig = () => ({
  twilioAccountSid: cleanEnv(process.env.TWILIO_ACCOUNT_SID),
  twilioAuthToken: cleanEnv(process.env.TWILIO_AUTH_TOKEN),
  twilioWhatsAppFrom: cleanEnv(process.env.TWILIO_WHATSAPP_FROM),
  twilioOtpContentSid: cleanEnv(process.env.TWILIO_WHATSAPP_OTP_CONTENT_SID),
  accessToken: cleanEnv(process.env.WHATSAPP_ACCESS_TOKEN),
  phoneNumberId: cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID),
  apiVersion: cleanEnv(process.env.WHATSAPP_API_VERSION) || "v19.0",
});

const normalizeWhatsAppNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const hasMetaWhatsAppConfig = (config) => Boolean(config.accessToken && config.phoneNumberId);
const hasTwilioWhatsAppConfig = (config) => Boolean(
  config.twilioAccountSid &&
  config.twilioAuthToken &&
  config.twilioWhatsAppFrom
);

const validateTwilioWhatsAppConfig = (config) => {
  if (!hasTwilioWhatsAppConfig(config)) {
    return "Twilio WhatsApp OTP is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in backend .env.";
  }

  if (!config.twilioAccountSid.startsWith("AC")) {
    return "Invalid TWILIO_ACCOUNT_SID. Copy the Account SID from Twilio Console; it must start with AC.";
  }

  const from = normalizeTwilioFrom(config.twilioWhatsAppFrom);
  if (!from.startsWith("whatsapp:+")) {
    return "Invalid TWILIO_WHATSAPP_FROM. Use format whatsapp:+14155238886 for sandbox or whatsapp:+your_approved_sender.";
  }

  return "";
};

const toTwilioWhatsAppAddress = (phone = "") => {
  const normalized = normalizeWhatsAppNumber(phone);
  return normalized ? `whatsapp:+${normalized}` : "";
};

const normalizeTwilioFrom = (value = "") => cleanEnv(value).replace(/\s+/g, "");

const getTwilioErrorReason = (data = {}, fallback = "") => {
  const code = data?.code ? String(data.code) : "";
  const message = data?.message || fallback || "Twilio WhatsApp request failed.";

  if (code === "20003" || /authenticate/i.test(message)) {
    return "Twilio authentication failed. Rotate/copy a fresh Auth Token from Twilio Console, confirm TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN match the same account, update backend .env, then restart the backend server.";
  }

  return `${message}${code ? ` (Twilio code ${code})` : ""}`;
};

export const getWhatsAppDiagnostics = () => {
  const config = getWhatsAppConfig();
  const configError = validateTwilioWhatsAppConfig(config);

  return {
    twilioConfigured: hasTwilioWhatsAppConfig(config),
    twilioConfigError: configError,
    twilioAccountSidLooksValid: config.twilioAccountSid.startsWith("AC"),
    twilioAuthTokenPresent: Boolean(config.twilioAuthToken),
    twilioWhatsAppFrom: normalizeTwilioFrom(config.twilioWhatsAppFrom),
    twilioOtpTemplateConfigured: Boolean(config.twilioOtpContentSid),
    twilioOtpContentSidLooksValid: !config.twilioOtpContentSid || config.twilioOtpContentSid.startsWith("HX"),
    metaConfigured: hasMetaWhatsAppConfig(config),
  };
};

const sendTwilioWhatsAppMessage = async ({ to, body, contentSid = "", contentVariables = null }) => {
  const config = getWhatsAppConfig();
  const phone = toTwilioWhatsAppAddress(to);

  if (!phone) {
    return { skipped: true, reason: "No WhatsApp phone number provided." };
  }

  const configError = validateTwilioWhatsAppConfig(config);
  if (configError) {
    return {
      skipped: true,
      reason: configError,
    };
  }

  try {
    const params = new URLSearchParams({
      From: normalizeTwilioFrom(config.twilioWhatsAppFrom),
      To: phone,
    });

    if (contentSid) {
      params.set("ContentSid", contentSid);
      params.set("ContentVariables", JSON.stringify(contentVariables || {}));
    } else {
      params.set("Body", body);
    }
    const credentials = Buffer
      .from(`${config.twilioAccountSid}:${config.twilioAuthToken}`)
      .toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getTwilioErrorReason(data, `Twilio API responded with ${response.status}`));
    }

    return { sent: true, provider: "twilio-whatsapp", data };
  } catch (error) {
    console.error(`Twilio WhatsApp message failed: ${error.message}`);
    return {
      failed: true,
      error,
      reason: `${error.message}. If you are using Twilio Sandbox, the recipient must join the sandbox first and TWILIO_WHATSAPP_FROM should usually be whatsapp:+14155238886.`,
    };
  }
};

export const sendWhatsAppMessage = async ({ to, body }) => {
  const config = getWhatsAppConfig();
  const phone = normalizeWhatsAppNumber(to);

  if (!phone) {
    return { skipped: true, reason: "No WhatsApp phone number provided." };
  }

  if (hasTwilioWhatsAppConfig(config)) {
    return sendTwilioWhatsAppMessage({ to, body });
  }

  if (!hasMetaWhatsAppConfig(config)) {
    return {
      skipped: true,
      reason: "WhatsApp OTP is not configured. Add Twilio WhatsApp env values or WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend .env.",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: {
            preview_url: false,
            body,
          },
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error?.message || `WhatsApp API responded with ${response.status}`);
    }

    return { sent: true, provider: "whatsapp-cloud-api", data };
  } catch (error) {
    console.error(`WhatsApp message failed: ${error.message}`);
    return { failed: true, error };
  }
};

export const sendOtpWhatsApp = ({ to, name, otp, purpose = "verification" }) =>
  sendTwilioOtpOrTextWhatsApp({
    to,
    name,
    otp,
    purpose,
  });

const sendTwilioOtpOrTextWhatsApp = ({ to, name, otp, purpose = "verification" }) => {
  const config = getWhatsAppConfig();
  const body = `Hi ${name || "there"}, your ServiceHub OTP for ${purpose} is ${otp}. It expires in 5 minutes. Never share it with anyone.`;

  if (hasTwilioWhatsAppConfig(config) && config.twilioOtpContentSid) {
    return sendTwilioWhatsAppMessage({
      to,
      contentSid: config.twilioOtpContentSid,
      contentVariables: {
        1: otp,
        2: "5 minutes",
      },
    });
  }

  return sendWhatsAppMessage({ to, body });
};
