import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from "react-native";

interface CustomButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "outline";
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title,
  disabled,
  style,
  textStyle,
  variant = "primary",
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#007AFF",
  },
  secondary: {
    backgroundColor: "#F2F2F7",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#007AFF",
  },
  outlineText: {
    color: "#007AFF",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
