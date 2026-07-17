import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";
import { colors, radius, useThemeColors } from "../theme";

const defaultT = (_key, fallback) => fallback;

const emptyAddress = {
  label: "",
  name: "",
  phone: "",
  line: "",
  city: "",
  pincode: "",
};

export default function AddressBookSheet({ visible, addresses, submitting, t = defaultT, onClose, onSave }) {
  const theme = useThemeColors();
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    if (!visible) return;
    setForm(emptyAddress);
    setEditingId("");
  }, [visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyAddress);
    setEditingId("");
  };

  const saveAddress = () => {
    const label = form.label.trim() || t("addresses.defaultLabel", "Home");
    const nextAddress = {
      id: editingId || `address-${Date.now()}`,
      label,
      name: form.name.trim(),
      phone: form.phone.trim(),
      line: form.line.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
    };

    if (!nextAddress.line || !nextAddress.city) return;

    const nextAddresses = editingId
      ? addresses.map((address) => (address.id === editingId ? nextAddress : address))
      : [nextAddress, ...addresses];

    onSave(nextAddresses);
    resetForm();
  };

  const editAddress = (address) => {
    setEditingId(address.id);
    setForm({
      label: address.label || "",
      name: address.name || "",
      phone: address.phone || "",
      line: address.line || "",
      city: address.city || "",
      pincode: address.pincode || "",
    });
  };

  const deleteAddress = (addressId) => {
    onSave(addresses.filter((address) => address.id !== addressId));
    if (editingId === addressId) resetForm();
  };

  return (
    <ModalSheet
      visible={visible}
      title={t("addresses.title", "Manage Addresses")}
      subtitle={t("addresses.subtitle", "Save addresses for faster service booking.")}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? t("common.saving", "Saving...") : editingId ? t("addresses.update", "Update address") : t("addresses.save", "Save address")}
          icon="content-save-outline"
          disabled={submitting || !form.line.trim() || !form.city.trim()}
          onPress={saveAddress}
        />
      }
    >
      <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("addresses.formTitle", "Address details")}</Text>
        <TextField label={t("addresses.label", "Label")} value={form.label} onChangeText={update("label")} placeholder={t("addresses.labelPlaceholder", "Home, Office, Shop")} />
        <TextField label={t("addresses.name", "Receiver name")} value={form.name} onChangeText={update("name")} placeholder={t("addresses.namePlaceholder", "Full name")} />
        <TextField label={t("addresses.phone", "Phone")} value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
        <TextField label={t("addresses.address", "Full address")} value={form.line} onChangeText={update("line")} placeholder={t("addresses.addressPlaceholder", "House, street, area")} multiline />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField label={t("addresses.city", "City")} value={form.city} onChangeText={update("city")} placeholder={t("addresses.cityPlaceholder", "Pune")} />
          </View>
          <View style={styles.rowItem}>
            <TextField label={t("addresses.pincode", "Pincode")} value={form.pincode} onChangeText={update("pincode")} placeholder="411001" keyboardType="number-pad" />
          </View>
        </View>
        {editingId ? (
          <Pressable accessibilityRole="button" onPress={resetForm} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Text style={[styles.clearText, { color: theme.teal }]}>{t("addresses.addNew", "Add new address instead")}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.group, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("addresses.saved", "Saved addresses")}</Text>
        {addresses.length ? (
          addresses.map((address) => (
            <View key={address.id} style={[styles.savedCard, { backgroundColor: theme.surface }]}>
              <Pressable accessibilityRole="button" onPress={() => editAddress(address)} style={styles.savedMain}>
                <MaterialCommunityIcons name="map-marker-outline" size={22} color={theme.teal} />
                <View style={styles.savedText}>
                  <Text style={[styles.savedTitle, { color: theme.text }]} numberOfLines={1}>{address.label}</Text>
                  <Text style={[styles.savedCopy, { color: theme.textMuted }]} numberOfLines={2}>
                    {[address.line, address.city, address.pincode].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => deleteAddress(address.id)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="delete-outline" size={22} color={theme.rose} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t("addresses.empty", "No saved addresses yet.")}</Text>
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    minHeight: 34,
    justifyContent: "center",
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
  pressed: {
    opacity: 0.72,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
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
    lineHeight: 17,
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
