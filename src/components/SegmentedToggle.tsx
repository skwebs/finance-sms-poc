import React from "react";
import { StyleSheet, Text, View, Pressable, Animated } from "react-native";

interface SegmentedToggleProps {
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  containerStyle?: any;
}

export function SegmentedToggle({
  options,
  selectedOption,
  onSelect,
  containerStyle,
}: SegmentedToggleProps) {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    const selectedIndex = options.indexOf(selectedOption);
    Animated.spring(animation, {
      toValue: selectedIndex,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [selectedOption, options]);

  const translateX = animation.interpolate({
    inputRange: [0, options.length - 1],
    outputRange: ["0%", `${(options.length - 1) * (100 / options.length)}%`],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            width: `${100 / options.length}%`,
            left: translateX,
          },
        ]}
      />
      {options.map((option) => (
        <Pressable
          key={option}
          style={styles.option}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === option && styles.activeOptionText,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 4,
    height: 44,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeOptionText: {
    color: "#1A1C1E",
  },
});
