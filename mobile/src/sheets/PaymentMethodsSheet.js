import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import SegmentedControl from "../components/SegmentedControl";
import TextField from "../components/TextField";
import { colors, radius, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;

const emptyPaymentMethod = {
  type: "upi",
  label: "",
  detail: "",
};

const methodIcons = {
  upi: "qrcode-scan",
  card: "credit-card-outline",
  cash: "cash",
};

export default function PaymentMethodsSheet({ visible, paymentMethods, submitting, t = defaultT, onClose, onSave }) {
  const theme = useThemeColors();
  const [form, setForm] = useState(emptyPaymentMethod);
  const [editingId, setEditingId] = useState("");
  const typeOptions = useMemo(
    () => [
      { label: "UPI", value: "upi" },
      { label: t("payments.card", "Card"), value: "card" },
      { label: t("payments.cash", "Cash"), value: "cash" },
    ],
    [t]
  );

  useEffect(() => {
    if (!visible) return;
    setForm(emptyPaymentMethod);
    setEditingId("");
  }, [visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyPaymentMethod);
    setEditingId("");
  };

  const savePaymentMethod = () => {
    const nextMethod = {
      id: editingId || `payment-${Date.now()}`,
      type: form.type,
      label: form.label.trim() || typeOptions.find((option) => option.value === form.type)?.label || "UPI",
      detail: form.detail.trim(),
    };

    if (nextMethod.type !== "cash" && !nextMethod.detail) return;

    const nextPaymentMethods = editingId
      ? paymentMethods.map((method) => (method.id === editingId ? nextMethod : method))
      : [nextMethod, ...paymentMethods];

    onSave(nextPaymentMethods);
    resetForm();
  };

  const editPaymentMethod = (method) => {
    setEditingId(method.id);
    setForm({
      type: method.type || "upi",
      label: method.label || "",
      detail: method.detail || "",
    });
  };

  const deletePaymentMethod = (methodId) => {
    onSave(paymentMethods.filter((method) => method.id !== methodId));
    if (editingId === methodId) resetForm();
  };

  return (
    <ModalSheet
      visible={visible}
      title={t("payments.title", "Manage Payments")}
      subtitle={t("payments.subtitle", "Save payment preferences for faster checkout.")}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? t("common.saving", "Saving...") : editingId ? t("payments.update", "Update method") : t("payments.save", "Save method")}
          icon="content-save-outline"
          disabled={submitting || (form.type !== "cash" && !form.detail.trim())}
          onPress={savePaymentMethod}
        />
      }
    >
      <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("payments.formTitle", "Payment method")}</Text>
        <SegmentedControl value={form.type} options={typeOptions} onChange={update("type")} />
        <TextField label={t("payments.label", "Label")} value={form.label} onChangeText={update("label")} placeholder={t("payments.labelPlaceholder", "Personal UPI, HDFC card")} />
        <TextField
          label={form.type === "card" ? t("payments.cardDetail", "Card name or last 4 digits") : form.type === "cash" ? t("payments.cashNote", "Cash note") : t("payments.upiId", "UPI ID")}
          value={form.detail}
          onChangeText={update("detail")}
          placeholder={form.type === "card" ? "Visa **** 1234" : form.type === "cash" ? t("payments.cashPlaceholder", "Pay after service") : "name@upi"}
          autoCapitalize="none"
        />
        {editingId ? (
          <Pressable accessibilityRole="button" onPress={resetForm} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Text style={[styles.clearText, { color: theme.teal }]}>{t("payments.addNew", "Add new method instead")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("payments.saved", "Saved payment methods")}</Text>
        {paymentMethods.length ? (
          paymentMethods.map((method) => (
            <View key={method.id} style={[styles.savedCard, { backgroundColor: theme.surface }]}>
              <Pressable accessibilityRole="button" onPress={() => editPaymentMethod(method)} style={styles.savedMain}>
                <View style={[styles.methodIcon, { backgroundColor: theme.tealSoft }]}>
                  <MaterialCommunityIcons name={methodIcons[method.type] || "wallet-outline" } size={21} color={theme.teal} />
                </View>
                <View style={styles.savedText}>
                  <Text style={[styles.savedTitle, { color: theme.text }]} numberOfLines={1}>{method.label}</Text>
                  <Text style={[styles.savedCopy, { color: theme.textMuted }]} numberOfLines={1}>{method.detail || t("payments.cash", "Cash")}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => deletePaymentMethod(method.id)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="delete-outline" size={22} color={theme.rose} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t("payments.empty", "No saved payment methods yet.")}</Text>
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  clearText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  group: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
  },
  methodIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 42,
  },
  pressed: {
    opacity: 0.72,
  },
  savedCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  savedCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  savedMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  savedText: {
    flex: 1,
    minWidth: 0,
  },
  savedTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
});
