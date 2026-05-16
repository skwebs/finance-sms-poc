import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MessageCategory, CATEGORIES } from "../constants/messageCategories";

interface CategoryBadgeProps {
  category: MessageCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const config = CATEGORIES[category];
  const isGeneral = category === MessageCategory.GENERAL;

  return (
    <View style={[
      styles.badge, 
      { backgroundColor: isGeneral ? "#E1E4E8" : config.color + "20" },
      !isGeneral && { borderColor: config.color, borderWidth: 0.5 }
    ]}>
      <Text style={[
        styles.text, 
        { color: isGeneral ? "#65676B" : config.color }
      ]}>
        {config.displayName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: "600",
  },
});
