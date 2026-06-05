import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

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
  providerName: "",
  category: "",
  location: "",
  price: "",
  responseTime: "",
  otp: "",
  resetIdentifier: "",
  resetOtp: "",
  newPassword: "",
  confirmNewPassword: "",
};

const defaultT = (_key, fallback) => fallback;

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
      Alert.alert(t("auth.accountRequired", "Account required"), t("auth.accountRequiredCopy", "Enter your registered email or mobile number."));
      return;
    }

    if (resetStep === "request") {
      const result = await onForgotPasswordOtp({ role: selectedRole, identifier });
      if (result) setResetStep("verify");
      return;
    }

    if (resetStep === "verify") {
      if (!form.resetOtp.trim()) {
        Alert.alert(t("auth.otpRequired", "OTP required"), t("auth.otpRequiredCopy", "Enter the OTP sent to your registered email."));
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
      Alert.alert(t("auth.passwordTooShort", "Password too short"), t("auth.passwordTooShortCopy", "Password must be at least 6 characters."));
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      Alert.alert(t("auth.passwordMismatch", "Password mismatch"), t("auth.passwordMismatchNewCopy", "Re-enter password must match your new password."));
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
      Alert.alert(t("auth.passwordMismatch", "Password mismatch"), t("auth.passwordMismatchCopy", "Re-enter password must match your password."));
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
              <TextField label={t("auth.businessName", "Business Name")} value={form.providerName} onChangeText={update("providerName")} placeholder="Business or display name" />
              <TextField label={t("auth.serviceCategory", "Service category")} value={form.category} onChangeText={update("category")} placeholder="Plumber, Electrician, Cleaning..." />
              <TextField label={t("auth.location", "Location")} value={form.location} onChangeText={update("location")} placeholder="Pune, Mumbai..." />
              <TextField label={t("auth.startingPrice", "Starting price")} value={form.price} onChangeText={update("price")} placeholder="From Rs. 299" />
              <TextField label={t("auth.responseTime", "Response time")} value={form.responseTime} onChangeText={update("responseTime")} placeholder="~1 hr" />
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
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 2,
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
  pressed: {
    opacity: 0.75,
  },
});
