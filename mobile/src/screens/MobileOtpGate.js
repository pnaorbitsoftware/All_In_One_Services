import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import ActionButton from "../components/ActionButton";
import { colors, radius, shadow, useThemeColors } from "../theme";

const onlyDigits = (value = "", maxLength) => String(value).replace(/\D/g, "").slice(0, maxLength);

export default function MobileOtpGate({
  sending = false,
  verifying = false,
  error = "",
  devOtp = "",
  onSendOtp,
  onVerifyOtp,
  onClientLogin,
  onClientRegister,
  onProviderLogin,
  onProviderRegister,
}) {
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const phoneLayout = width < 600;
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [localError, setLocalError] = useState("");
  const busy = sending || verifying;

  useEffect(() => {
    if (!otpSent) setOtp("");
  }, [otpSent]);

  const title = useMemo(
    () => (otpSent ? "Verify OTP" : "Login with mobile"),
    [otpSent],
  );

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setLocalError("Enter exactly 10 digit mobile number.");
      return;
    }
    setLocalError("");
    const sent = await onSendOtp?.(phone);
    if (sent) setOtpSent(true);
  };

  const verifyOtp = async () => {
    if (phone.length !== 10) {
      setLocalError("Enter exactly 10 digit mobile number.");
      return;
    }
    if (otp.length !== 6) {
      setLocalError("Enter the 6 digit OTP.");
      return;
    }
    setLocalError("");
    await onVerifyOtp?.({ phone, otp });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: phoneLayout ? theme.surface : theme.background }, phoneLayout && styles.phoneScreen]}
    >
      {!phoneLayout ? <><View style={[styles.glow, styles.glowTop, { backgroundColor: theme.tealSoft }]} /><View style={[styles.glow, styles.glowBottom, { backgroundColor: theme.mintSoft }]} /></> : null}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, phoneLayout && styles.phoneCard]}> 
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: theme.teal }]}> 
            <MaterialCommunityIcons name="home-heart" size={28} color="#ffffff" />
          </View>
          <View><Text style={[styles.brand, { color: theme.text }]}>ServiceHub</Text><Text style={[styles.brandTag, { color: theme.textMuted }]}>Trusted help, right at home.</Text></View>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          {otpSent
            ? "Enter the OTP sent for this mobile number."
            : "Enter your mobile number to continue booking services."}
        </Text>

        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: theme.text }]}>Mobile number</Text>
          <View style={[styles.inputShell, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.prefix, { color: theme.text }]}>+91</Text>
            <TextInput
              value={phone}
              editable={!busy && !otpSent}
              onChangeText={(value) => setPhone(onlyDigits(value, 10))}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digit number"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
            />
          </View>
        </View>

        {otpSent ? (
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.text }]}>OTP</Text>
            <View style={styles.otpRow}>
              {Array.from({ length: 6 }).map((_, index) => <View key={index} style={[styles.otpBox, { borderColor: otp.length === index ? theme.teal : theme.border, backgroundColor: theme.surface }]}><Text style={[styles.otpDigit, { color: theme.text }]}>{otp[index] || ""}</Text></View>)}
              <TextInput
                value={otp}
                editable={!busy}
                onChangeText={(value) => setOtp(onlyDigits(value, 6))}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                textContentType="oneTimeCode"
                style={styles.hiddenOtpInput}
              />
            </View>
          </View>
        ) : null}

        {devOtp ? <Text style={[styles.devOtp, { color: theme.teal }]}>Testing OTP: {devOtp}</Text> : null}
        {localError || error ? <Text style={[styles.error, { color: theme.rose }]}>{localError || error}</Text> : null}

        <ActionButton
          title={otpSent ? "Verify OTP" : "Send OTP"}
          icon={otpSent ? "shield-check-outline" : "cellphone-message"}
          loading={otpSent ? verifying : sending}
          disabled={busy}
          onPress={otpSent ? verifyOtp : sendOtp}
        />
        <View style={styles.trustRow}>
          <View style={styles.trustItem}><MaterialCommunityIcons name="shield-check" size={16} color={theme.success} /><Text style={[styles.trustText, { color: theme.textMuted }]}>Verified pros</Text></View>
          <View style={styles.trustItem}><MaterialCommunityIcons name="lock-outline" size={16} color={theme.success} /><Text style={[styles.trustText, { color: theme.textMuted }]}>Secure login</Text></View>
          <View style={styles.trustItem}><MaterialCommunityIcons name="headset" size={16} color={theme.success} /><Text style={[styles.trustText, { color: theme.textMuted }]}>Live support</Text></View>
        </View>
        {otpSent ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setOtpSent(false);
              setLocalError("");
            }}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          >
            <Text style={[styles.linkText, { color: theme.teal }]}>Change mobile number</Text>
          </Pressable>
        ) : null}
        <View style={[styles.alternativeRow, { borderTopColor: theme.border }]}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={onClientLogin} style={({ pressed }) => [styles.altButton, pressed && styles.pressed]}><MaterialCommunityIcons name="email-outline" size={18} color={theme.textMuted} /><Text style={[styles.altText, { color: theme.textMuted }]}>Email login</Text></Pressable>
          <View style={[styles.altDivider, { backgroundColor: theme.border }]} />
          <Pressable accessibilityRole="button" disabled={busy} onPress={onProviderLogin} style={({ pressed }) => [styles.altButton, pressed && styles.pressed]}><MaterialCommunityIcons name="account-hard-hat-outline" size={18} color={theme.textMuted} /><Text style={[styles.altText, { color: theme.textMuted }]}>Provider portal</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  altButton: { alignItems: "center", flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44 },
  altDivider: { height: 22, width: 1 },
  altText: { fontSize: 12, fontWeight: "800" },
  alternativeRow: { alignItems: "center", borderTopWidth: 1, flexDirection: "row", marginTop: 2, paddingTop: 8 },
  brand: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0,
  },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 8 },
  brandTag: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  card: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 16,
    maxWidth: 430,
    padding: 24,
    width: "100%",
    ...shadow,
  },
  phoneCard: { borderWidth: 0, borderRadius: 0, boxShadow: "none", elevation: 0, flex: 1, maxWidth: "none", paddingHorizontal: 24, paddingTop: 34, shadowOpacity: 0 },
  phoneScreen: { padding: 0 },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "left",
  },
  devOtp: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },
  error: {
    color: colors.rose,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
  fieldWrap: {
    gap: 7,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    paddingVertical: 10,
  },
  inputShell: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  hiddenOtpInput: { ...StyleSheet.absoluteFillObject, color: "transparent", opacity: 0.02 },
  label: {
    fontSize: 12,
    fontWeight: "900",
  },
  linkButton: {
    alignItems: "center",
    minHeight: 38,
    justifyContent: "center",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "900",
  },
  logo: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  otpBox: { alignItems: "center", borderRadius: 12, borderWidth: 1.5, flex: 1, height: 52, justifyContent: "center" },
  otpDigit: { fontSize: 20, fontWeight: "900" },
  otpRow: { flexDirection: "row", gap: 8, position: "relative" },
  prefix: {
    fontSize: 17,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.65,
  },
  screen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 18,
    overflow: "hidden",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  glow: { borderRadius: 999, height: 300, opacity: 0.75, position: "absolute", width: 300 },
  glowBottom: { bottom: -140, left: -130 },
  glowTop: { right: -130, top: -120 },
  trustItem: { alignItems: "center", flexDirection: "row", gap: 4 },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center", paddingVertical: 4 },
  trustText: { fontSize: 11, fontWeight: "700" },
});
