import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, shadow, useThemeColors } from "../theme";

function normalizeAddress(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export default function LocationSearchSheet({ visible, selectedLocation, recentLocations = [], detecting, onClose, onUseCurrentLocation, onSelectLocation, onSaveManualLocation }) {
  const theme = useThemeColors();
  const [query, setQuery] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (visible) {
      setQuery("");
      setLocalError("");
    }
  }, [visible]);

  const filteredRecents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return recentLocations;
    return recentLocations.filter((item) => String(item.address || item.label || "").toLowerCase().includes(normalized));
  }, [query, recentLocations]);

  const submitManualLocation = () => {
    const address = normalizeAddress(query);
    if (!address) {
      setLocalError("Search or enter your location first.");
      return;
    }

    onSaveManualLocation?.({
      id: `manual-${Date.now()}`,
      address,
      label: address,
      timestamp: new Date().toISOString(),
      source: "manual",
    });
  };

  const detectLocation = async () => {
    setLocalError("");
    const result = await onUseCurrentLocation?.();
    if (!result) {
      setLocalError("Location permission is required to detect your current address.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.iconButton, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="arrow-left" size={23} color={theme.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Select location</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for your location/society/apartment"
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={submitManualLocation}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={detecting}
            onPress={detectLocation}
            style={({ pressed }) => [styles.currentButton, { backgroundColor: theme.surface }, pressed && !detecting && styles.pressed]}
          >
            <View style={[styles.currentIcon, { backgroundColor: theme.tealSoft }]}>
              {detecting ? <ActivityIndicator color={theme.teal} size="small" /> : <MaterialCommunityIcons name="crosshairs-gps" size={21} color={theme.teal} />}
            </View>
            <View style={styles.currentText}>
              <Text style={[styles.currentTitle, { color: theme.text }]}>Use current location</Text>
              <Text style={[styles.currentSubtitle, { color: theme.textMuted }]}>Detect your address automatically</Text>
            </View>
          </Pressable>

          {query.trim() ? (
            <Pressable accessibilityRole="button" onPress={submitManualLocation} style={({ pressed }) => [styles.manualButton, { backgroundColor: theme.teal }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="map-marker-plus-outline" size={19} color="#ffffff" />
              <Text style={styles.manualButtonText}>Use “{normalizeAddress(query)}”</Text>
            </Pressable>
          ) : null}

          {localError ? <Text style={[styles.error, { color: theme.rose, backgroundColor: theme.roseSoft }]}>{localError}</Text> : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {selectedLocation?.address ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Selected location</Text>
                <LocationRow location={selectedLocation} icon="map-marker-check-outline" onPress={onSelectLocation} />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent locations</Text>
              {filteredRecents.length ? (
                filteredRecents.map((location) => (
                  <LocationRow key={location.id || location.address} location={location} icon="history" onPress={onSelectLocation} />
                ))
              ) : (
                <Text style={[styles.empty, { color: theme.textMuted }]}>No recent locations yet.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LocationRow({ location, icon, onPress }) {
  const theme = useThemeColors();
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(location)} style={({ pressed }) => [styles.locationRow, { backgroundColor: theme.surface }, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceMuted }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.teal} />
      </View>
      <View style={styles.locationText}>
        <Text style={[styles.locationTitle, { color: theme.text }]} numberOfLines={1}>{location.label || location.address}</Text>
        <Text style={[styles.locationSubtitle, { color: theme.textMuted }]} numberOfLines={2}>{location.address}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingBottom: 34,
  },
  currentButton: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 18,
    marginTop: 14,
    padding: 14,
    ...shadow,
  },
  currentIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  currentSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  currentText: {
    flex: 1,
    minWidth: 0,
  },
  currentTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  empty: {
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 14,
    textAlign: "center",
  },
  error: {
    borderRadius: radius.md,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginHorizontal: 18,
    marginTop: 12,
    padding: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerSpacer: {
    width: 44,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  locationRow: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: 12,
    padding: 13,
    ...shadow,
  },
  locationSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  locationText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  manualButton: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginHorizontal: 18,
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  manualButtonText: {
    color: "#ffffff",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  overlay: {
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    flex: 1,
    justifyContent: "flex-end",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  searchBox: {
    alignItems: "center",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 18,
    minHeight: 56,
    paddingHorizontal: 14,
    ...shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    minHeight: 50,
    minWidth: 0,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "92%",
    minHeight: "72%",
    overflow: "hidden",
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
});
