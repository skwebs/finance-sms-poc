import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SMS } from "../constants/sms";
import { ParsedSMS } from "../parsers/parseSmsPreview";
import { BankChip } from "./BankChip";
import { CategoryBadge } from "./CategoryBadge";
import { CustomButton } from "./CustomButton";

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  sms: SMS;
  parsed: ParsedSMS;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  visible,
  onClose,
  sms,
  parsed,
}) => {
  const date = new Date(sms.date);

  const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Transaction Details</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.mainInfo}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountText}>₹{parsed.amount || "0"}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{parsed.transactionType.replace(/_/g, " ").toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Info</Text>
              <View style={styles.detailsBox}>
                <DetailRow label="Bank" value={parsed.bank} />
                <DetailRow label="Merchant" value={parsed.merchant} />
                <DetailRow label="Card ending" value={parsed.cardLast4} />
                <DetailRow label="A/C ending" value={parsed.accountLast4} />
                <DetailRow label="UPI Ref" value={parsed.upiRef} />
                <DetailRow label="Date" value={date.toLocaleString()} />
                <DetailRow label="Expense?" value={parsed.isExpense ? "YES" : "NO"} />
              </View>
            </View>

            {parsed.categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.badgeRow}>
                  {parsed.categories.map((cat, i) => (
                    <CategoryBadge key={i} category={cat} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Original Message</Text>
              <View style={styles.rawSmsBox}>
                <Text style={styles.rawSmsText}>{sms.body}</Text>
                <Text style={styles.senderText}>From: {sms.address}</Text>
              </View>
            </View>

            <View style={styles.debugSection}>
              <Text style={styles.debugText}>Confidence Score: {(parsed.confidence * 100).toFixed(0)}%</Text>
              <Text style={styles.debugText}>Type: {parsed.transactionType}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CustomButton 
              title="Close" 
              variant="secondary" 
              onPress={onClose} 
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: height * 0.85,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E1E4E8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1C1E",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: "#8E8E93",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  mainInfo: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  amountLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#1A1C1E",
  },
  statusBadge: {
    marginTop: 16,
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#65676B",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  detailsBox: {
    backgroundColor: "#F8F9FB",
    borderRadius: 20,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E4E8",
  },
  detailLabel: {
    fontSize: 14,
    color: "#65676B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1C1E",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rawSmsBox: {
    backgroundColor: "#1A1C1E",
    borderRadius: 20,
    padding: 20,
  },
  rawSmsText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  senderText: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
  },
  debugSection: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#C1C4C8",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    flexDirection: "row",
    gap: 12,
  },
});
