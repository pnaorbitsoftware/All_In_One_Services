import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { showConfirm } from "../lib/confirm";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";
import { colors, radius, useThemeColors } from "../theme";

const supportEmail = "support@servicehub.com";
const supportPhone = "+91 95794 24323";

function ContactRow({ icon, title, copy }) {
  const theme = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.teal} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.rowCopy, { color: theme.textMuted }]}>{copy}</Text>
      </View>
    </View>
  );
}

export default function ContactUsSheet({ visible, submitting = false, onClose, onSubmit }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (visible) setMessage("");
  }, [visible]);

  const openEmail = useCallback(async () => {
    const url = `mailto:${supportEmail}?subject=ServiceHub%20Support`;
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      showConfirm("Contact Us", `Email us at ${supportEmail}`);
      return;
    }

    Linking.openURL(url);
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) {
      showConfirm("Contact Us", "Enter your message for support.");
      return;
    }

    const sent = await onSubmit?.(message.trim());
    if (sent) setMessage("");
  };

  return (
    <ModalSheet
      visible={visible}
      title="Contact Us"
      subtitle="Reach ServiceHub support for booking, provider, and account help."
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Sending..." : "Send message"}
          icon="send-outline"
          disabled={submitting}
          onPress={sendMessage}
        />
      }
    >
      <TextField
        label="Message"
        value={message}
        onChangeText={setMessage}
        placeholder="Tell support what happened..."
        multiline
      />
      <ActionButton
        title="Email support instead"
        icon="email-fast-outline"
        variant="secondary"
        onPress={openEmail}
      />
      <ContactRow icon="email-outline" title="Support email" copy={supportEmail} />
      <ContactRow icon="phone-outline" title="Phone support" copy={supportPhone} />
      <ContactRow icon="map-marker-outline" title="Service area" copy="Pune, Maharashtra and nearby cities" />
      <ContactRow icon="clock-outline" title="Support hours" copy="Monday to Saturday, 9:00 AM to 7:00 PM" />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  rowCopy: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
