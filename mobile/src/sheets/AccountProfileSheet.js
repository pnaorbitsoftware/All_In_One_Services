import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { showConfirm } from "../lib/confirm";

import ActionButton from "../components/ActionButton";
import ModalSheet from "../components/ModalSheet";
import TextField from "../components/TextField";
import { colors, radius } from "../theme";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  avatar: "",
};

function toProfileForm(user = {}) {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    avatar: user.avatar || user.profileImage || "",
  };
}

export default function AccountProfileSheet({ visible, user, submitting, profileCompletion = false, locatingAddress = false, onClose, onSubmit, onUseCurrentLocation }) {
  const [form, setForm] = useState(emptyProfile);
  const formValid = form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email.trim()) && (!profileCompletion || form.address.trim().length >= 5);

  useEffect(() => {
    if (visible) setForm(toProfileForm(user));
  }, [user, visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showConfirm("Photo permission", "Allow photo access to add your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        mediaTypes: ["images"],
        quality: 0.45,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const mimeType = asset.mimeType || "image/jpeg";
      const avatar = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setForm((current) => ({ ...current, avatar }));
    } catch {
      showConfirm("Profile picture", "Could not select this image. Please try another photo.");
    }
  };

  const removeAvatar = () => setForm((current) => ({ ...current, avatar: "" }));
  const useCurrentLocation = async () => {
    if (!onUseCurrentLocation) return;
    const location = await onUseCurrentLocation();
    if (!location) return;
    setForm((current) => ({ ...current, address: location.address || current.address, currentLocation: location }));
  };

  return (
    <ModalSheet
      visible={visible}
      title={profileCompletion ? "Complete Client Profile" : "Edit Profile"}
      subtitle={profileCompletion ? "Add real client details before booking. Your verified mobile number cannot be changed." : "Update your login and contact profile."}
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Saving..." : profileCompletion ? "Complete profile" : "Save account"}
          icon="content-save-outline"
          disabled={submitting || !formValid}
          onPress={() => onSubmit(form)}
        />
      }
    >
      {profileCompletion ? (
        <View style={styles.completionIntro}><View style={styles.progressTrack}><View style={styles.progressValue} /></View><View style={styles.completionRow}><View style={styles.completionIcon}><MaterialCommunityIcons name="shield-check" size={23} color={colors.teal} /></View><View style={styles.completionCopy}><Text style={styles.completionTitle}>One last step</Text><Text style={styles.completionBody}>Tell your professional who to meet and where to arrive. You can edit this later.</Text></View></View></View>
      ) : <View style={styles.photoCard}>
        <Pressable accessibilityRole="button" onPress={pickAvatar} style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}>
          {form.avatar ? (
            <Image source={{ uri: form.avatar }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle-outline" size={44} color={colors.teal} />
          )}
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera-outline" size={17} color="#ffffff" />
          </View>
        </Pressable>
        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>Profile picture</Text>
          <Text style={styles.photoCopy}>Shown on your account profile icon.</Text>
          <View style={styles.photoActions}>
            <ActionButton
              title={form.avatar ? "Change photo" : "Add photo"}
              icon="image-plus"
              variant="secondary"
              onPress={pickAvatar}
              style={styles.photoAction}
            />
            {form.avatar ? (
              <ActionButton
                title="Remove"
                icon="trash-can-outline"
                variant="secondary"
                onPress={removeAvatar}
                style={styles.photoAction}
              />
            ) : null}
          </View>
        </View>
      </View>}
      <TextField label="Full name" value={form.name} onChangeText={update("name")} placeholder="Your name" />
      <TextField
        label="Email"
        value={form.email}
        onChangeText={update("email")}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {profileCompletion ? <View style={styles.verifiedPhone}><MaterialCommunityIcons name="check-decagram" size={20} color={colors.success} /><View><Text style={styles.verifiedLabel}>Verified mobile</Text><Text style={styles.verifiedValue}>+91 {form.phone}</Text></View></View> : <TextField label="Phone" value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" editable={!user?.mobileVerified} />}
      <TextField label="Address" value={form.address} onChangeText={update("address")} placeholder="House, street, city" multiline />
      <ActionButton title={locatingAddress ? "Detecting location..." : "Use Current Location"} icon="crosshairs-gps" variant="secondary" loading={locatingAddress} disabled={locatingAddress} onPress={useCurrentLocation} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  completionBody: { color: colors.textMuted, fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 2 },
  completionCopy: { flex: 1 },
  completionIcon: { alignItems: "center", backgroundColor: colors.tealSoft, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  completionIntro: { gap: 15 },
  completionRow: { alignItems: "center", flexDirection: "row", gap: 11 },
  completionTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 999, height: 5, overflow: "hidden" },
  progressValue: { backgroundColor: colors.teal, borderRadius: 999, height: "100%", width: "75%" },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 20,
    height: 82,
    justifyContent: "center",
    overflow: "hidden",
    width: 82,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: 16,
    bottom: 6,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    width: 30,
  },
  photoAction: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  photoCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 12,
  },
  photoCopy: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  photoText: {
    flex: 1,
    minWidth: 0,
  },
  photoTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.82,
  },
  verifiedLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: .5 },
  verifiedPhone: { alignItems: "center", backgroundColor: colors.successSoft, borderRadius: radius.md, flexDirection: "row", gap: 10, padding: 13 },
  verifiedValue: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 2 },
});
