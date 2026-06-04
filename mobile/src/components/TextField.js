import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, useThemeColors } from "../theme";

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  autoCapitalize = "sentences",
  rightIcon,
  rightIconLabel,
  onRightIconPress,
}) {
  const theme = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
          },
          multiline && styles.textareaShell,
        ]}
      >
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry}
          style={[
            styles.input,
            {
              color: theme.text,
            },
            multiline && styles.textarea,
          ]}
          textAlignVertical={multiline ? "top" : "center"}
          value={value}
        />
        {rightIcon ? (
          <Pressable
            accessibilityLabel={rightIconLabel}
            accessibilityRole="button"
            onPress={onRightIconPress}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name={rightIcon} size={22} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default React.memo(TextField);

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
    paddingVertical: 10,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    minWidth: 40,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.65,
  },
  textarea: {
    paddingTop: 10,
  },
  textareaShell: {
    alignItems: "flex-start",
    minHeight: 110,
  },
  wrap: {
    gap: 7,
  },
});
