import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import ActionButton from "../components/ActionButton";
import { formatPrice } from "../lib/formatters";
import { colors, radius, shadow, useThemeColors } from "../theme";

function toScriptJson(value) {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

function buildCheckoutHtml({ checkout }) {
  const booking = checkout?.booking || {};
  const order = checkout?.order || {};
  const bookingId = String(booking._id || booking.id || "");
  const amountPaise = Number(order.amountPaise || Math.round(Number(order.amount || 0) * 100));
  const options = {
    key: order.keyId,
    amount: String(amountPaise),
    currency: order.currency || "INR",
    name: "ServiceHub",
    description: `${booking.service || "Service"} final estimate payment`,
    order_id: order.orderId,
    prefill: {
      name: booking.name || booking.userName || "",
      email: booking.userEmail || "",
      contact: booking.phone || "",
    },
    notes: {
      bookingId,
    },
    retry: {
      enabled: true,
      max_count: 2,
    },
    theme: {
      color: "#0f766e",
    },
  };

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <style>
      html, body {
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        height: 100%;
        margin: 0;
      }
      .state {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        justify-content: center;
        padding: 24px;
        text-align: center;
      }
      .mark {
        align-items: center;
        background: #ccfbf1;
        border-radius: 18px;
        color: #0f766e;
        display: flex;
        font-size: 28px;
        font-weight: 900;
        height: 64px;
        justify-content: center;
        width: 64px;
      }
      h1 {
        font-size: 20px;
        line-height: 26px;
        margin: 0;
      }
      p {
        color: #64748b;
        font-size: 14px;
        font-weight: 700;
        line-height: 21px;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="state">
      <div class="mark">₹</div>
      <h1>Opening secure payment</h1>
      <p>Please wait while Razorpay checkout loads.</p>
    </div>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function post(payload) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }

      function openCheckout() {
        if (!window.Razorpay) {
          post({ type: "error", message: "Razorpay checkout could not be loaded. Check your internet connection." });
          return;
        }

        var options = ${toScriptJson(options)};
        options.handler = function(response) {
          post({ type: "success", response: response });
        };
        options.modal = {
          ondismiss: function() {
            post({ type: "dismissed" });
          }
        };

        var razorpay = new Razorpay(options);
        razorpay.on("payment.failed", function(response) {
          var message = response && response.error && response.error.description
            ? response.error.description
            : "Payment failed. Please try again.";
          post({ type: "failed", message: message, response: response });
        });
        razorpay.open();
      }

      if (document.readyState === "complete") {
        openCheckout();
      } else {
        window.addEventListener("load", openCheckout);
      }
    </script>
  </body>
</html>`;
}

export default function PaymentCheckoutSheet({
  visible,
  checkout,
  verifying,
  error,
  onClose,
  onSuccess,
  onFailure,
  onRetry,
}) {
  const theme = useThemeColors();
  const [loading, setLoading] = useState(true);
  const html = useMemo(() => buildCheckoutHtml({ checkout }), [checkout]);
  const booking = checkout?.booking || {};
  const order = checkout?.order || {};
  const amount = Number(order.amount || booking.finalEstimateAmount || 0);

  useEffect(() => {
    if (visible) setLoading(true);
  }, [visible, checkout?.order?.orderId]);

  const handleMessage = (event) => {
    let payload = null;

    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (payload.type === "success") {
      onSuccess?.(payload.response);
      return;
    }

    if (payload.type === "dismissed") {
      onFailure?.("Payment was cancelled.");
      return;
    }

    if (payload.type === "failed" || payload.type === "error") {
      onFailure?.(payload.message || "Payment could not be completed.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.wrap, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Secure Payment</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {booking.service || "Final estimate"} {amount ? `| ${formatPrice(amount)}` : ""}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} disabled={verifying} style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]}>
            <MaterialCommunityIcons name="close" size={22} color={theme.text} />
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.roseSoft, borderColor: theme.rose }]}>
            <Text style={[styles.errorText, { color: theme.rose }]}>{error}</Text>
            {onRetry ? <ActionButton title="Retry verification" icon="refresh" variant="dangerSoft" onPress={onRetry} /> : null}
          </View>
        ) : null}

        <View style={styles.webWrap}>
          <WebView
            source={{ html, baseUrl: "https://checkout.razorpay.com" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mixedContentMode="always"
            onLoadEnd={() => setLoading(false)}
            onMessage={handleMessage}
            onError={(event) => onFailure?.(event.nativeEvent.description || "Payment page could not be opened.")}
            style={styles.webView}
          />
          {(loading || verifying) ? (
            <View style={[styles.loading, { backgroundColor: theme.surface }]}>
              <ActivityIndicator color={theme.teal} size="large" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                {verifying ? "Verifying payment..." : "Opening Razorpay checkout..."}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  errorBox: {
    backgroundColor: colors.roseSoft,
    borderColor: colors.rose,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    margin: 12,
    padding: 12,
  },
  errorText: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.surface,
    gap: 12,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  webView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  webWrap: {
    flex: 1,
    overflow: "hidden",
  },
  wrap: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
