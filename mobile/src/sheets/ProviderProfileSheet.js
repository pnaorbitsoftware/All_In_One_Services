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
  category: "",
  location: "",
  phone: "",
  email: "",
  price: "",
  responseTime: "",
  description: "",
  about: "",
  features: "",
  image: "",
  aadhaarNumber: "",
  aadhaarFrontImage: "",
  aadhaarBackImage: "",
};

function toProfileForm(provider = {}) {
  return {
    name: provider.name || "",
    category: provider.category || "",
    location: provider.location || "",
    phone: provider.phone || "",
    email: provider.email || "",
    price: provider.price || "",
    responseTime: provider.responseTime || "",
    description: provider.description || "",
    about: provider.about || "",
    features: Array.isArray(provider.features) ? provider.features.join(", ") : provider.features || "",
    image: provider.image || provider.profileImage || "",
    aadhaarNumber: provider.aadhaarNumber || "",
    aadhaarFrontImage: provider.aadhaarFrontUrl || provider.aadhaarCardImage || "",
    aadhaarBackImage: provider.aadhaarBackUrl || "",
  };
}

export default function ProviderProfileSheet({ visible, provider, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyProfile);

  useEffect(() => {
    if (visible) setForm(toProfileForm(provider));
  }, [provider, visible]);

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const pickProviderImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Photo permission", "Allow photo access to add your provider profile picture.");
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
      const image = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
      setForm((current) => ({ ...current, image }));
    } catch {
      Alert.alert("Provider photo", "Could not select this image. Please try another photo.");
    }
  };

  const removeProviderImage = () => setForm((current) => ({ ...current, image: "" }));

  const pickAadhaarCard = async (side) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Aadhaar upload", "Allow photo access to upload your Aadhaar card.");
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
      if (!asset?.base64) {
        Alert.alert("Aadhaar upload", "This image could not be prepared for upload. Please choose another image.");
        return;
      }

      const mimeType = asset.mimeType || "image/jpeg";
      const key = side === "back" ? "aadhaarBackImage" : "aadhaarFrontImage";
      setForm((current) => ({ ...current, [key]: `data:${mimeType};base64,${asset.base64}` }));
    } catch {
      Alert.alert("Aadhaar upload", "Could not select this image. Please try another photo.");
    }
  };

  return (
    <ModalSheet
      visible={visible}
      title="Provider profile"
      subtitle="Keep your public service details accurate."
      onClose={onClose}
      footer={
        <ActionButton
          title={submitting ? "Saving..." : "Save profile"}
          icon="content-save-outline"
          disabled={submitting}
          onPress={() => onSubmit(form)}
        />
      }
    >
      <View style={styles.photoCard}>
        <Pressable
          accessibilityRole="button"
          onPress={pickProviderImage}
          style={({ pressed }) => [styles.providerImageButton, pressed && styles.pressed]}
        >
          {form.image ? (
            <Image source={{ uri: form.image }} style={styles.providerImage} />
          ) : (
            <MaterialCommunityIcons name="account-hard-hat-outline" size={44} color={colors.teal} />
          )}
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera-outline" size={17} color="#ffffff" />
          </View>
        </Pressable>
        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>Provider profile picture</Text>
          <Text style={styles.photoCopy}>Shown on your provider workspace and service listing.</Text>
          <View style={styles.photoActions}>
            <ActionButton
              title={form.image ? "Change photo" : "Add photo"}
              icon="image-plus"
              variant="secondary"
              onPress={pickProviderImage}
              style={styles.photoAction}
            />
            {form.image ? (
              <ActionButton
                title="Remove"
                icon="trash-can-outline"
                variant="secondary"
                onPress={removeProviderImage}
                style={styles.photoAction}
              />
            ) : null}
          </View>
        </View>
      </View>
      <TextField label="Business Name" value={form.name} onChangeText={update("name")} placeholder="Business name" />
      <TextField label="Category" value={form.category} onChangeText={update("category")} placeholder="Plumber, Electrician..." />
      <TextField label="Location" value={form.location} onChangeText={update("location")} placeholder="City or area" />
      <TextField label="Phone" value={form.phone} onChangeText={update("phone")} placeholder="+91..." keyboardType="phone-pad" />
      <TextField label="Email" value={form.email} onChangeText={update("email")} placeholder="provider@example.com" keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Pricing" value={form.price} onChangeText={update("price")} placeholder="From Rs. 299" />
      <TextField label="Response time" value={form.responseTime} onChangeText={update("responseTime")} placeholder="~1 hr" />
      <TextField label="Short description" value={form.description} onChangeText={update("description")} placeholder="Describe your service" multiline />
      <TextField label="About provider" value={form.about} onChangeText={update("about")} placeholder="Experience and service style" multiline />
      <TextField label="Included work" value={form.features} onChangeText={update("features")} placeholder="Repair, installation, inspection" multiline />
      <TextField label="Aadhaar number" value={form.aadhaarNumber} onChangeText={(value) => update("aadhaarNumber")(value.replace(/\D/g, "").slice(0, 12))} placeholder="12 digit Aadhaar number" keyboardType="number-pad" />
      {[{ side: "front", label: "Aadhaar front", value: form.aadhaarFrontImage }, { side: "back", label: "Aadhaar back", value: form.aadhaarBackImage }].map((document) => (
      <View key={document.side} style={styles.documentCard}>
        {document.value ? <Image source={{ uri: document.value }} style={styles.documentImage} /> : null}
        <View style={styles.photoText}>
          <Text style={styles.photoTitle}>{document.label}</Text>
          <Text style={styles.photoCopy}>Required for admin review and resubmission.</Text>
          <ActionButton title={document.value ? "Change image" : "Upload image"} icon="card-account-details-outline" variant="secondary" onPress={() => pickAadhaarCard(document.side)} />
        </View>
      </View>
      ))}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  documentCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    marginTop: 12,
    padding: 12,
  },
  documentImage: {
    borderRadius: 12,
    height: 72,
    width: 96,
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
  providerImage: {
    height: "100%",
    width: "100%",
  },
  providerImageButton: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 20,
    height: 82,
    justifyContent: "center",
    overflow: "hidden",
    width: 82,
  },
});
