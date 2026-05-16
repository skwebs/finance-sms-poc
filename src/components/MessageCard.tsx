import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SMS } from "../constants/sms";
import { parseSmsPreview, ParsedSMS } from "../parsers/parseSmsPreview";
import { BankChip } from "./BankChip";
import { CategoryBadge } from "./CategoryBadge";
import { MessageCategory } from "../constants/messageCategories";
import { TransactionDetailsModal } from "./TransactionDetailsModal";

interface MessageCardProps {
  item: SMS;
}

export const MessageCard: React.FC<MessageCardProps> = ({ item }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const parsed = parseSmsPreview(item.address, item.body);
  const date = new Date(item.date);

  const renderPreview = () => {
    if (parsed.categories.includes(MessageCategory.STATEMENT)) {
      return (
        <View style={styles.previewContainer}>
          {parsed.totalDue && (
            <Text style={styles.previewLabel}>
              Total Due: <Text style={styles.previewValue}>₹{parsed.totalDue}</Text>
            </Text>
          )}
          {parsed.minDue && (
            <Text style={styles.previewLabel}>
              Min Due: <Text style={styles.previewValue}>₹{parsed.minDue}</Text>
            </Text>
          )}
          {parsed.dueDate && (
            <Text style={styles.previewLabel}>
              Due: <Text style={styles.previewValue}>{parsed.dueDate}</Text>
            </Text>
          )}
        </View>
      );
    }

    if (parsed.amount) {
      return (
        <View style={styles.previewContainer}>
          <Text style={styles.amount}>₹{parsed.amount}</Text>
          {parsed.merchant && (
            <Text style={styles.merchant}>at {parsed.merchant}</Text>
          )}
          <View style={styles.metaRow}>
            {parsed.cardLast4 && (
              <Text style={styles.metaText}>Card • {parsed.cardLast4}</Text>
            )}
            {parsed.accountLast4 && (
              <Text style={styles.metaText}>A/C • {parsed.accountLast4}</Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <BankChip bank={parsed.bank} />
            <Text style={styles.sender} numberOfLines={1}>{item.address}</Text>
          </View>
          <Text style={styles.timestamp}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.categoryRow}>
          {parsed.categories.map((cat, index) => (
            <CategoryBadge key={index} category={cat} />
          ))}
        </View>

        {renderPreview()}

        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </Pressable>

      <TransactionDetailsModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        sms={item}
        parsed={parsed}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sender: {
    fontSize: 12,
    color: "#65676B",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 10,
    color: "#8E8E93",
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  previewContainer: {
    backgroundColor: "#F8F9FB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1C1E",
  },
  merchant: {
    fontSize: 14,
    color: "#303234",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#65676B",
  },
  previewLabel: {
    fontSize: 12,
    color: "#65676B",
    marginBottom: 2,
  },
  previewValue: {
    fontWeight: "bold",
    color: "#1A1C1E",
  },
  body: {
    fontSize: 13,
    color: "#65676B",
    lineHeight: 18,
  },
});
