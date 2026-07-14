import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, useThemeColors } from "../theme";

function ProfileCompletionBanner({ visible, onPress }) {
  const theme = useThemeColors();
  if (!visible) return null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: theme.tealSoft }, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: theme.surface }]}><MaterialCommunityIcons name="account-check-outline" size={22} color={theme.teal} /></View>
      <View style={styles.copy}><Text style={[styles.title, { color: theme.text }]}>Finish your profile when you’re ready</Text><Text style={[styles.body, { color: theme.textMuted }]}>Browse freely now. We’ll need a few details only before confirmation.</Text></View>
      <MaterialCommunityIcons name="arrow-right" size={20} color={theme.teal} />
    </Pressable>
  );
}
export default React.memo(ProfileCompletionBanner);
const styles = StyleSheet.create({
  body: { fontSize: 12, fontWeight: "600", lineHeight: 17, marginTop: 2 },
  card: { alignItems: "center", borderRadius: radius.lg, flexDirection: "row", gap: 11, padding: 14 },
  copy: { flex: 1 },
  icon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  pressed: { opacity: 0.8 },
  title: { fontSize: 14, fontWeight: "900", lineHeight: 19 },
});
