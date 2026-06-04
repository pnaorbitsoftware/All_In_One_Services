import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

function ActionButton({
  title,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}) {
  const theme = useThemeColors();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isDangerSoft = variant === "dangerSoft";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: theme.teal },
        variant === "secondary" && { backgroundColor: theme.surfaceMuted },
        isDanger && { backgroundColor: theme.rose },
        isDangerSoft && { backgroundColor: theme.roseSoft },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={isPrimary || isDanger ? "#ffffff" : isDangerSoft ? theme.rose : theme.text}
          />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
        style={[
          styles.label,
          { color: isDangerSoft ? theme.rose : theme.text },
          (isPrimary || isDanger) && styles.lightLabel,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default React.memo(ActionButton);

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.55,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  lightLabel: {
    color: "#ffffff",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
