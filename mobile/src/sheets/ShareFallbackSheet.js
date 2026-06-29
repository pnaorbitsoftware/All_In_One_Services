import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import { colors, radius, useThemeColors } from "../theme";

export default function ShareFallbackSheet({ visible, appLink, onClose, onCopied, onCopyFailed }) {
  const theme = useThemeColors();

  const copyLink = useCallback(async () => {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) {
        throw new Error("Clipboard is not available in this environment.");
      }
      await globalThis.navigator.clipboard.writeText(appLink);
      onCopied?.();
      onClose?.();
    } catch (error) {
      onCopyFailed?.(error.message || "Copy link failed.");
    }
  }, [appLink, onClose, onCopied, onCopyFailed]);

  return (
    <ModalSheet
      visible={visible}
      title="Share ServiceHub"
      subtitle="Native share is unavailable here. Copy the app link instead."
      onClose={onClose}
      footer={<ActionButton title="Copy Link" icon="content-copy" onPress={copyLink} />}
    >
      <View style={[styles.linkBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text selectable style={[styles.linkText, { color: theme.text }]}>
          {appLink}
        </Text>
      </View>
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        If copy is unavailable in this browser, long-press the link and copy it manually.
      </Text>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  linkBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
  },
  linkText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
});
