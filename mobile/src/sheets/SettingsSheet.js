import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import SegmentedControl from "../components/SegmentedControl";
import { supportedLanguages } from "../lib/i18n";
import { colors, radius, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;

function SettingSwitch({ icon, title, copy, value, disabled, onValueChange }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.settingRow, { backgroundColor: theme.surface }, disabled && styles.disabled]}>
      <View style={[styles.settingIcon, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.teal} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingCopy, { color: theme.textMuted }]}>{copy}</Text>
      </View>
      <Switch
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.surfaceMuted, true: theme.tealSoft }}
        thumbColor={value ? theme.teal : "#f8fafc"}
      />
    </View>
  );
}

function SettingAction({ icon, title, copy, onPress }) {
  const theme = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, { backgroundColor: theme.surface }, pressed && styles.pressed]}
    >
      <View style={[styles.settingIcon, { backgroundColor: theme.tealSoft }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.teal} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingCopy, { color: theme.textMuted }]}>{copy}</Text>
      </View>
      <MaterialCommunityIcons name="share-variant-outline" size={21} color={theme.textMuted} />
    </Pressable>
  );
}

function SettingPanel({ icon, title, value, expanded, onPress, children }) {
  const theme = useThemeColors();
  return (
    <View style={[styles.settingPanel, { backgroundColor: theme.surface }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.settingPanelButton, pressed && styles.pressed]}
      >
        <View style={[styles.settingIcon, { backgroundColor: theme.tealSoft }]}>
          <MaterialCommunityIcons name={icon} size={22} color={theme.teal} />
        </View>
        <Text style={[styles.settingTitle, styles.settingTitleFlex, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.settingValue, { color: theme.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={theme.textMuted}
        />
      </Pressable>
      {expanded ? <View style={styles.inlineControl}>{children}</View> : null}
    </View>
  );
}

function LanguageGrid({ value, options, onChange }) {
  const theme = useThemeColors();

  return (
    <View style={styles.languageGrid}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.languageChip,
              {
                backgroundColor: active ? theme.slate : theme.surfaceMuted,
                borderColor: active ? theme.slate : theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.languageText, { color: active ? "#ffffff" : theme.text }]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsSheet({
  visible,
  settings,
  submitting,
  mode = "settings",
  t = defaultT,
  onClose,
  onSubmit,
  onDraftChange,
  onShareApp,
}) {
  const [form, setForm] = useState(settings);
  const [openPanel, setOpenPanel] = useState("");
  const theme = useThemeColors();
  const isNotificationsMode = mode === "notifications";
  const appearanceOptions = useMemo(
    () => [
      { label: t("settings.light", "Light"), value: "light" },
      { label: t("settings.dark", "Dark"), value: "dark" },
      { label: t("settings.system", "System"), value: "system" },
    ],
    [t]
  );
  const languageOptions = useMemo(
    () => supportedLanguages.map((language) => ({ label: language.nativeLabel, value: language.code })),
    []
  );

  useEffect(() => {
    if (visible) {
      setForm(settings);
      setOpenPanel("");
    }
  }, [settings, visible]);

  const update = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      onDraftChange?.(next);
      return next;
    });
  };
  const notificationsDisabled = !form.notificationsEnabled;
  const appearanceLabel = appearanceOptions.find((option) => option.value === form.appearance)?.label || t("settings.light", "Light");
  const languageLabel =
    supportedLanguages.find((language) => language.code === (form.language || "en"))?.nativeLabel ||
    supportedLanguages[0].nativeLabel;
  const togglePanel = (panel) => setOpenPanel((current) => (current === panel ? "" : panel));

  return (
    <ModalSheet
      visible={visible}
      title={isNotificationsMode ? t("settings.notificationsTitle", "Notifications") : t("settings.title", "Settings")}
      subtitle={
        isNotificationsMode
          ? t("settings.notificationsSubtitle", "Control booking, provider, and email alerts.")
          : null
      }
      onClose={onClose}
      footer={
        <ActionButton
          title={
            submitting
              ? t("common.saving", "Saving...")
              : isNotificationsMode
                ? t("settings.saveNotifications", "Save notifications")
                : t("settings.save", "Save settings")
          }
          icon="content-save-outline"
          disabled={submitting}
          onPress={() => onSubmit(form)}
        />
      }
    >
      {!isNotificationsMode ? (
        <>
          <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("settings.appOptions", "Manage app setting")}</Text>
            <SettingPanel
              icon="theme-light-dark"
              title={t("settings.appearance", "Appearance")}
              value={appearanceLabel}
              expanded={openPanel === "appearance"}
              onPress={() => togglePanel("appearance")}
            >
              <SegmentedControl value={form.appearance} onChange={(value) => update("appearance", value)} options={appearanceOptions} />
            </SettingPanel>
            <SettingPanel
              icon="translate"
              title={t("settings.language", "Language")}
              value={languageLabel}
              expanded={openPanel === "language"}
              onPress={() => togglePanel("language")}
            >
              <LanguageGrid value={form.language || "en"} onChange={(value) => update("language", value)} options={languageOptions} />
            </SettingPanel>
            <SettingSwitch
              icon="signal-cellular-outline"
              title={t("settings.dataSaver", "Data saver")}
              copy={t("settings.dataSaverCopy", "Reduce background image preloading on mobile data.")}
              value={form.dataSaver}
              onValueChange={(value) => update("dataSaver", value)}
            />
            <SettingAction
              icon="whatsapp"
              title={t("settings.shareApp", "Share app to friends")}
              copy={t("settings.shareAppCopy", "Send the ServiceHub app link through WhatsApp or your phone share menu.")}
              onPress={onShareApp}
            />
          </View>
        </>
      ) : (
        <>
          <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("notifications.section", "Notification Settings")}</Text>
            <SettingSwitch
              icon="bell-ring-outline"
              title={t("notifications.allow", "Allow notifications")}
              copy={t("notifications.allowCopy", "Turn app alerts on or mute them.")}
              value={form.notificationsEnabled}
              onValueChange={(value) => update("notificationsEnabled", value)}
            />
            <SettingSwitch
              icon="calendar-check-outline"
              title={t("notifications.bookingUpdates", "Booking updates")}
              copy={t("notifications.bookingUpdatesCopy", "Alerts for booking status and cancellations.")}
              value={form.bookingUpdates}
              disabled={notificationsDisabled}
              onValueChange={(value) => update("bookingUpdates", value)}
            />
            <SettingSwitch
              icon="briefcase-clock-outline"
              title={t("notifications.providerRequests", "Provider requests")}
              copy={t("notifications.providerRequestsCopy", "Alerts when clients create matching service requests.")}
              value={form.providerRequests}
              disabled={notificationsDisabled}
              onValueChange={(value) => update("providerRequests", value)}
            />
            <SettingSwitch
              icon="email-fast-outline"
              title={t("notifications.emailAlerts", "Email alerts")}
              copy={t("notifications.emailAlertsCopy", "Keep service emails enabled for important updates.")}
              value={form.emailAlerts}
              disabled={notificationsDisabled}
              onValueChange={(value) => update("emailAlerts", value)}
            />
          </View>

          <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("notifications.reminders", "Reminders")}</Text>
            <SettingSwitch
              icon="clock-alert-outline"
              title={t("notifications.bookingReminders", "Booking reminders")}
              copy={t("notifications.bookingRemindersCopy", "Remember upcoming service dates.")}
              value={form.bookingReminders}
              disabled={notificationsDisabled}
              onValueChange={(value) => update("bookingReminders", value)}
            />
          </View>
        </>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.48,
  },
  group: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  groupCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  groupText: {
    flex: 1,
    minWidth: 0,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.78,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  settingCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  settingIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
  },
  inlineControl: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  languageChip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: 10,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languageText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  settingPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  settingPanelButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    padding: 10,
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  settingText: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  settingTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  settingValue: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    maxWidth: 92,
    textAlign: "right",
  },
});
