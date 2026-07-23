import { Alert, Platform } from "react-native";

/**
 * Cross-platform replacement for Alert.alert(title, message, buttons).
 *
 * React Native's Alert.alert has no reliable multi-button UI on web (react-native-web
 * doesn't implement the native alert dialog), so on web this falls back to the browser's
 * window.confirm/window.alert. Same call signature as Alert.alert, so existing call sites
 * only need Alert.alert renamed to showConfirm — no other logic changes.
 */
export function showConfirm(title, message, buttons = [{ text: "OK" }]) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((button) => button.style === "cancel");
  const confirmButton = buttons.find((button) => button !== cancelButton) || buttons[buttons.length - 1];

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
