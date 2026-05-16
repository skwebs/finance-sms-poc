import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bank, BANKS } from "../constants/banks";

interface BankChipProps {
  bank: Bank;
}

export const BankChip: React.FC<BankChipProps> = ({ bank }) => {
  const config = BANKS[bank];
  
  return (
    <View style={[styles.chip, { backgroundColor: config.color }]}>
      <Text style={styles.text}>{config.displayName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
