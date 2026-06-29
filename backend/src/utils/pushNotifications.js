export async function sendPushNotification({
  tokens = [],
  title,
  body,
  data = {},
}) {
  const validTokens = [...new Set(tokens)].filter(
    (token) =>
      typeof token === "string" &&
      token.startsWith("ExponentPushToken["),
  );

  if (!validTokens.length) {
    return { sent: 0 };
  }

  const messages = validTokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
    channelId: "servicehub-alerts",
  }));

  try {
    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      },
    );

    const result = await response.json().catch(() => ({}));
    return {
      sent: validTokens.length,
      result,
    };
  } catch (error) {
    console.error("Push notification error:", error);
    return {
      sent: 0,
      error: error.message,
    };
  }
}
