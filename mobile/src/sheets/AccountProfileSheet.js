import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

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

export default function AccountProfileSheet({ visible, user, submitting, locatingAddress = false, onClose, onSubmit, onUseCurrentLocation }) {
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    if (visible) setForm(toProfileForm(user));
  }, [user, visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Photo permission", "Allow photo access to add your profile picture.");
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
      Alert.alert("Profile picture", "Could not select this image. Please try another photo.");
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
      title="Edit Profile"
      subtitle="Update your login and contact profile."
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Saving..." : "Save account"}
          icon="content-save-outline"
          disabled={submitting}
          onPress={() => onSubmit(form)}
        />
      }
    >
      <View style={styles.photoCard}>
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
      </View>
      <TextField label="Full name" value={form.name} onChangeText={update("name")} placeholder="Your name" />
      <TextField
        label="Email"
        value={form.email}
        onChangeText={update("email")}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField label="Phone" value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
      <TextField label="Address" value={form.address} onChangeText={update("address")} placeholder="House, street, city" multiline />
      <ActionButton title={locatingAddress ? "Detecting location..." : "Use Current Location"} icon="crosshairs-gps" variant="secondary" loading={locatingAddress} disabled={locatingAddress} onPress={useCurrentLocation} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
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
});
