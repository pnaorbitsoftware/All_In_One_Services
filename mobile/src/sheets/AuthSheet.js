import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { showConfirm } from "../lib/confirm";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import SegmentedControl from "../components/SegmentedControl";
import TextField from "../components/TextField";
import { colors } from "../theme";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  providerName: "",
  category: "",
  location: "",
  price: "",
  responseTime: "",
  aadhaarNumber: "",
  aadhaarCardImage: "",
  otp: "",
  resetIdentifier: "",
  resetOtp: "",
  newPassword: "",
  confirmNewPassword: "",
};

const defaultT = (_key, fallback) => fallback;
const providerCategoryOptions = ["Electrician", "Plumber", "AC Repair", "Washing Machine", "Bathroom Cleaning", "Painting & Water-proofing"];

export default function AuthSheet({
  visible,
  sessionKey,
  mode,
  role,
  submitting,
  t = defaultT,
  onClose,
  onRoleChange,
  onSubmit,
  onForgotPasswordOtp,
  onForgotPasswordVerify,
  onResetPassword,
}) {
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [resetStep, setResetStep] = useState("login");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [providerCategoryMode, setProviderCategoryMode] = useState("");

  useEffect(() => {
    if (visible) {
      setForm(initialForm);
      setOtpSent(false);
      setResetStep("login");
      setResetToken("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setProviderCategoryMode("");
    }
  }, [visible, sessionKey]);

  const isRegister = mode === "register";
  const isPasswordReset = resetStep !== "login";
  const selectedRole = role === "provider" ? "provider" : "user";
  const roleOptions = useMemo(
    () => [
      { label: t("common.client", "Client"), value: "user" },
      { label: t("common.provider", "Provider"), value: "provider" },
    ],
    [t]
  );

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const selectedProviderCategory = providerCategoryMode || (providerCategoryOptions.includes(form.category) ? form.category : form.category ? "Other" : "");
  const customProviderCategory = selectedProviderCategory === "Other" && !providerCategoryOptions.includes(form.category) ? form.category : "";

  const selectProviderCategory = (category) => {
    setProviderCategoryMode(category);
    setForm((current) => ({
      ...current,
      category: category === "Other" ? "" : category,
    }));
  };

  const updateCustomProviderCategory = (value) => {
    setProviderCategoryMode("Other");
    update("category")(value);
  };

  const pickAadhaarCard = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showConfirm("Aadhaar upload", "Allow photo access to upload Aadhaar card.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 10],
        base64: true,
        mediaTypes: ["images"],
        quality: 0.42,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const mimeType = asset.mimeType || "image/jpeg";
      if (!asset.base64) {
        showConfirm("Aadhaar upload", "This image could not be prepared for upload. Please choose another image.");
        return;
      }
      const aadhaarCardImage = `data:${mimeType};base64,${asset.base64}`;
      setForm((current) => ({ ...current, aadhaarCardImage }));
    } catch {
      showConfirm("Aadhaar upload", "Could not select this image. Please try another photo.");
    }
  };

  const removeAadhaarCard = () => setForm((current) => ({ ...current, aadhaarCardImage: "" }));

  const startPasswordReset = () => {
    if (submitting) return;

    setResetStep("request");
    setResetToken("");
    setForm((current) => ({
      ...current,
      resetIdentifier: current.resetIdentifier || current.email.trim(),
      resetOtp: "",
      newPassword: "",
      confirmNewPassword: "",
    }));
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const backToLogin = () => {
    setResetStep("login");
    setResetToken("");
    setForm((current) => ({
      ...current,
      password: "",
      resetOtp: "",
      newPassword: "",
      confirmNewPassword: "",
    }));
  };

  const handleRoleChange = (nextRole) => {
    onRoleChange(nextRole);
    if (isPasswordReset && resetStep !== "request") {
      setResetStep("request");
      setResetToken("");
      setForm((current) => ({
        ...current,
        resetOtp: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
    }
  };

  const submitPasswordReset = async () => {
    if (submitting) return;

    const identifier = form.resetIdentifier.trim();

    if (!identifier) {
      showConfirm(t("auth.accountRequired", "Account required"), t("auth.accountRequiredCopy", "Enter your registered email or mobile number."));
      return;
    }

    if (resetStep === "request") {
      const result = await onForgotPasswordOtp({ role: selectedRole, identifier });
      if (result) setResetStep("verify");
      return;
    }

    if (resetStep === "verify") {
      if (!form.resetOtp.trim()) {
        showConfirm(t("auth.otpRequired", "OTP required"), t("auth.otpRequiredCopy", "Enter the OTP sent to your registered email."));
        return;
      }

      const result = await onForgotPasswordVerify({
        role: selectedRole,
        identifier,
        otp: form.resetOtp.trim(),
      });

      if (result?.resetToken) {
        setResetToken(result.resetToken);
        setResetStep("reset");
      }
      return;
    }

    if (form.newPassword.length < 6) {
      showConfirm(t("auth.passwordTooShort", "Password too short"), t("auth.passwordTooShortCopy", "Password must be at least 6 characters."));
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      showConfirm(t("auth.passwordMismatch", "Password mismatch"), t("auth.passwordMismatchNewCopy", "Re-enter password must match your new password."));
      return;
    }

    const result = await onResetPassword({
      role: selectedRole,
      identifier,
      password: form.newPassword,
      resetToken,
    });

    if (result) {
      setForm((current) => ({
        ...current,
        email: identifier.includes("@") ? identifier : current.email,
        password: "",
        resetOtp: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
      setResetStep("login");
      setResetToken("");
    }
  };

  const submit = async () => {
    if (submitting) return;

    if (isPasswordReset) {
      await submitPasswordReset();
      return;
    }

    if (isRegister && !otpSent && form.password !== form.confirmPassword) {
      showConfirm(t("auth.passwordMismatch", "Password mismatch"), t("auth.passwordMismatchCopy", "Re-enter password must match your password."));
      return;
    }

    const result = await onSubmit({
      mode,
      role: selectedRole,
      form,
      otpSent,
    });

    if (result?.requiresOtp) {
      setOtpSent(true);
    }
  };

  const title = isPasswordReset
    ? resetStep === "request"
      ? t("auth.forgotPassword", "Forgot password")
      : resetStep === "verify"
        ? t("auth.verifyOtp", "Verify OTP")
        : t("auth.resetPassword", "Reset password")
    : isRegister
      ? t("auth.createAccount", "Create account")
      : t("common.login", "Login");

  const actionTitle = isPasswordReset
    ? submitting
      ? t("common.pleaseWait", "Please wait...")
      : resetStep === "request"
        ? t("auth.sendOtp", "Send OTP")
        : resetStep === "verify"
          ? t("auth.verifyOtp", "Verify OTP")
          : t("auth.saveNewPassword", "Save new password")
    : submitting
      ? t("common.pleaseWait", "Please wait...")
      : otpSent
        ? t("auth.verifyOtp", "Verify OTP")
        : isRegister
          ? t("auth.createAccount", "Create account")
          : t("common.login", "Login");

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={title}
      centeredTitle
      footer={
        <View style={styles.footerStack}>
          {!isRegister && !isPasswordReset ? (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={startPasswordReset}
              style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <Text style={styles.forgotText}>{t("auth.forgotPasswordLink", "Forgot password?")}</Text>
            </Pressable>
          ) : null}

          {isPasswordReset ? (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={backToLogin}
              style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <Text style={styles.forgotText}>{t("auth.backToLogin", "Back to login")}</Text>
            </Pressable>
          ) : null}

          <ActionButton
            title={actionTitle}
            icon={isPasswordReset ? "lock-reset" : isRegister ? "account-plus-outline" : "login"}
            disabled={submitting}
            loading={submitting}
            onPress={submit}
          />
        </View>
      }
    >
      <SegmentedControl value={selectedRole} onChange={handleRoleChange} options={roleOptions} disabled={submitting} />

      {isPasswordReset ? (
        <>
          {resetStep === "request" ? (
            <TextField
              label={t("auth.emailOrMobile", "Email or mobile number")}
              value={form.resetIdentifier}
              onChangeText={update("resetIdentifier")}
              placeholder={t("auth.registeredEmailOrPhone", "Registered email or phone")}
              autoCapitalize="none"
            />
          ) : null}

          {resetStep === "verify" ? (
            <TextField
              label={t("auth.emailOtp", "Email OTP")}
              value={form.resetOtp}
              onChangeText={update("resetOtp")}
              placeholder={t("auth.sixDigitCode", "6 digit code")}
              keyboardType="number-pad"
            />
          ) : null}

          {resetStep === "reset" ? (
            <>
              <TextField
                label={t("auth.newPassword", "New password")}
                value={form.newPassword}
                onChangeText={update("newPassword")}
                placeholder={t("auth.atLeastSix", "At least 6 characters")}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                rightIcon={showNewPassword ? "eye-off-outline" : "eye-outline"}
                rightIconLabel={showNewPassword ? "Hide new password" : "Show new password"}
                onRightIconPress={() => setShowNewPassword((current) => !current)}
              />
              <TextField
                label={t("auth.reEnterPassword", "Re-enter password")}
                value={form.confirmNewPassword}
                onChangeText={update("confirmNewPassword")}
                placeholder={t("auth.typePasswordAgain", "Type password again")}
                secureTextEntry={!showConfirmNewPassword}
                autoCapitalize="none"
                rightIcon={showConfirmNewPassword ? "eye-off-outline" : "eye-outline"}
                rightIconLabel={showConfirmNewPassword ? "Hide re-enter password" : "Show re-enter password"}
                onRightIconPress={() => setShowConfirmNewPassword((current) => !current)}
              />
            </>
          ) : null}
        </>
      ) : (
        <>

          {isRegister && !otpSent ? (
            <>
              <TextField label={t("auth.fullName", "Full name")} value={form.name} onChangeText={update("name")} placeholder={t("auth.yourName", "Your name")} />
              <TextField label={t("auth.phone", "Phone")} value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
              {selectedRole === "user" ? (
                <TextField label={t("auth.address", "Address")} value={form.address} onChangeText={update("address")} placeholder="House, street, city" multiline />
              ) : null}
            </>
          ) : null}

          <TextField
            label={t("auth.email", "Email")}
            value={form.email}
            onChangeText={update("email")}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!otpSent ? (
            <TextField
              label={t("auth.password", "Password")}
              value={form.password}
              onChangeText={update("password")}
              placeholder={t("auth.atLeastSix", "At least 6 characters")}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              rightIconLabel={showPassword ? "Hide password" : "Show password"}
              onRightIconPress={() => setShowPassword((current) => !current)}
            />
          ) : (
            <TextField
              label={t("auth.emailOtp", "Email OTP")}
              value={form.otp}
              onChangeText={update("otp")}
              placeholder={t("auth.sixDigitCode", "6 digit code")}
              keyboardType="number-pad"
            />
          )}

          {isRegister && !otpSent ? (
            <TextField
              label={t("auth.reEnterPassword", "Re-enter password")}
              value={form.confirmPassword}
              onChangeText={update("confirmPassword")}
              placeholder={t("auth.typePasswordAgain", "Type password again")}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              rightIconLabel={showConfirmPassword ? "Hide re-enter password" : "Show re-enter password"}
              onRightIconPress={() => setShowConfirmPassword((current) => !current)}
            />
          ) : null}

          {isRegister && selectedRole === "provider" && !otpSent ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.providerApprovalCopy}>Website admin approval is required before provider jobs and payments unlock.</Text>
              <TextField label={t("auth.businessName", "Business Name")} value={form.providerName} onChangeText={update("providerName")} placeholder="Business or display name" />
              <Text style={styles.fieldLabel}>{t("auth.serviceCategory", "Service category")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
                {providerCategoryOptions.map((category) => {
                  const active = selectedProviderCategory === category;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={category}
                      onPress={() => selectProviderCategory(category)}
                      style={({ pressed }) => [styles.categoryChip, active && styles.categoryChipActive, pressed && styles.pressed]}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {selectedProviderCategory === "Other" ? (
                <TextField label="Other service name" value={customProviderCategory} onChangeText={updateCustomProviderCategory} placeholder="Enter your service category" />
              ) : null}
              <TextField label={t("auth.location", "Location")} value={form.location} onChangeText={update("location")} placeholder="Pune, Mumbai..." />
              <TextField label={t("auth.startingPrice", "Starting price")} value={form.price} onChangeText={update("price")} placeholder="From Rs. 299" />
              <TextField label={t("auth.responseTime", "Response time")} value={form.responseTime} onChangeText={update("responseTime")} placeholder="~1 hr" />
              <TextField
                label="Aadhaar number"
                value={form.aadhaarNumber}
                onChangeText={(value) => update("aadhaarNumber")(value.replace(/\D/g, "").slice(0, 12))}
                placeholder="12 digit Aadhaar number"
                keyboardType="number-pad"
              />
              <View style={styles.documentCard}>
                <View style={styles.documentPreview}>
                  {form.aadhaarCardImage ? (
                    <Image source={{ uri: form.aadhaarCardImage }} style={styles.documentImage} />
                  ) : (
                    <MaterialCommunityIcons name="card-account-details-outline" size={32} color={colors.teal} />
                  )}
                </View>
                <View style={styles.documentText}>
                  <Text style={styles.documentTitle}>Aadhaar card</Text>
                  <Text style={styles.documentCopy}>Required for website admin approval.</Text>
                  <View style={styles.documentActions}>
                    <Pressable accessibilityRole="button" onPress={pickAadhaarCard} style={({ pressed }) => [styles.documentButton, pressed && styles.pressed]}>
                      <MaterialCommunityIcons name={form.aadhaarCardImage ? "image-edit-outline" : "image-plus"} size={17} color={colors.teal} />
                      <Text style={styles.documentButtonText}>{form.aadhaarCardImage ? "Change" : "Upload"}</Text>
                    </Pressable>
                    {form.aadhaarCardImage ? (
                      <Pressable accessibilityRole="button" onPress={removeAadhaarCard} style={({ pressed }) => [styles.documentButton, pressed && styles.pressed]}>
                        <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.rose} />
                        <Text style={[styles.documentButtonText, { color: colors.rose }]}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.55,
  },
  categoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  categoryChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },
  categoryChipTextActive: {
    color: colors.teal,
  },
  categoryRail: {
    gap: 8,
    paddingBottom: 2,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 2,
  },
  documentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
  },
  documentButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 11,
  },
  documentButtonText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
  },
  documentCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 11,
  },
  documentCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  documentImage: {
    height: "100%",
    width: "100%",
  },
  documentPreview: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 13,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    width: 92,
  },
  documentText: {
    flex: 1,
    minWidth: 0,
  },
  documentTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  footerStack: {
    gap: 10,
  },
  forgotButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  forgotText: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: "900",
  },
  providerApprovalCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
});
