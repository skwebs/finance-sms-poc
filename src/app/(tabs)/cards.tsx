import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Local imports
import { SMS } from "@/constants/sms";
import { Bank, BANKS } from "@/constants/banks";
import { MessageCategory } from "@/constants/messageCategories";
import { parseSmsPreview, ParsedSMS } from "@/parsers/parseSmsPreview";
import { getSms } from "../../../modules/expo-sms-reader";
import { CustomButton } from "@/components/CustomButton";

const { width } = Dimensions.get("window");

interface CardSettings {
  billingDay: number;
  gracePeriod: number;
}

interface CardData {
  bank: Bank;
  last4: string;
  transactions: (ParsedSMS & { date: number })[];
  latestStatement: (ParsedSMS & { date: number }) | null;
}

/**
 * Cards Screen
 * Dynamically detects unique credit cards from SMS and calculates billing cycle expenses.
 * Allows users to set billing day and grace period for each card.
 */
export default function CardsScreen() {
  const [smsList, setSmsList] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(true);

  // Local config for cards (could be persisted via AsyncStorage or DB)
  const [cardConfigs, setCardConfigs] = useState<Record<string, CardSettings>>(
    {},
  );

  const [editingCard, setEditingCard] = useState<{
    key: string;
    bank: Bank;
    last4: string;
  } | null>(null);
  const [editBillingDay, setEditBillingDay] = useState("");
  const [editGracePeriod, setEditGracePeriod] = useState("");

  // Fetch SMS
  const fetchSms = useCallback(async () => {
    setLoading(true);
    try {
      const messages = await getSms({ maxCount: 200 });
      setSmsList(messages as SMS[]);
    } catch (err) {
      console.error("Failed to fetch SMS for cards:", err);
      Alert.alert("Error", "Could not load SMS data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSms();
  }, [fetchSms]);

  // Group transactions by Card
  const detectedCards = useMemo(() => {
    const cardsMap: Record<string, CardData> = {};

    smsList.forEach((sms) => {
      const parsed = parseSmsPreview(sms.address, sms.body);
      if (!parsed.cardLast4) return;

      const cardKey = `${parsed.bank}-${parsed.cardLast4}`;
      if (!cardsMap[cardKey]) {
        cardsMap[cardKey] = {
          bank: parsed.bank,
          last4: parsed.cardLast4,
          transactions: [],
          latestStatement: null,
        };
      }

      const txn = { ...parsed, date: sms.date };
      cardsMap[cardKey].transactions.push(txn);

      if (parsed.categories.includes(MessageCategory.STATEMENT)) {
        if (
          !cardsMap[cardKey].latestStatement ||
          sms.date > cardsMap[cardKey].latestStatement.date
        ) {
          cardsMap[cardKey].latestStatement = txn;
        }
      }
    });

    return Object.values(cardsMap);
  }, [smsList]);

  const handleEditCard = (card: CardData) => {
    const key = `${card.bank}-${card.last4}`;
    const config = cardConfigs[key] || { billingDay: 15, gracePeriod: 20 };
    setEditingCard({ key, bank: card.bank, last4: card.last4 });
    setEditBillingDay(config.billingDay.toString());
    setEditGracePeriod(config.gracePeriod.toString());
  };

  const saveSettings = () => {
    if (!editingCard) return;

    const bDay = parseInt(editBillingDay);
    const gPeriod = parseInt(editGracePeriod);

    if (isNaN(bDay) || bDay < 1 || bDay > 31) {
      Alert.alert("Invalid Input", "Billing day must be between 1 and 31");
      return;
    }
    if (isNaN(gPeriod) || gPeriod < 0) {
      Alert.alert("Invalid Input", "Grace period must be a positive number");
      return;
    }

    setCardConfigs((prev) => ({
      ...prev,
      [editingCard.key]: { billingDay: bDay, gracePeriod: gPeriod },
    }));
    setEditingCard(null);
  };

  // Billing cycle helper
  const calculateCardStats = (card: CardData) => {
    const key = `${card.bank}-${card.last4}`;
    const config = cardConfigs[key] || { billingDay: 15, gracePeriod: 20 };

    const { billingDay, gracePeriod } = config;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let cycleStart: Date;
    let cycleEnd: Date;

    // "if billing cycle is 15 june it means transaction calculate from 16 june to 15 july"
    // This means if today is after 15th, cycle started on 16th of THIS month.
    // If today is 15th or before, cycle started on 16th of LAST month.
    if (day > billingDay) {
      cycleStart = new Date(year, month, billingDay + 1);
      cycleEnd = new Date(year, month + 1, billingDay);
    } else {
      cycleStart = new Date(year, month - 1, billingDay + 1);
      cycleEnd = new Date(year, month, billingDay);
    }

    cycleStart.setHours(0, 0, 0, 0);
    cycleEnd.setHours(23, 59, 59, 999);

    const currentCycleTxns = card.transactions.filter(
      (t) => t.date >= cycleStart.getTime() && t.date <= cycleEnd.getTime(),
    );

    const currentSpend = currentCycleTxns.reduce((sum, t) => {
      if (t.isExpense && t.amount) {
        return sum + parseFloat(t.amount);
      }
      return sum;
    }, 0);

    // Due Date = Cycle End Date + Grace Period
    const dueDateObj = new Date(cycleEnd);
    dueDateObj.setDate(dueDateObj.getDate() + gracePeriod);
    const dueDateStr = `${dueDateObj.getDate()} ${dueDateObj.toLocaleString("default", { month: "short" })}`;

    return {
      currentSpend,
      unbilled: currentSpend,
      cycleRange: `${cycleStart.getDate()} ${cycleStart.toLocaleString("default", { month: "short" })} - ${cycleEnd.getDate()} ${cycleEnd.toLocaleString("default", { month: "short" })}`,
      dueDate: dueDateStr,
      totalDue: card.latestStatement?.totalDue
        ? parseFloat(card.latestStatement.totalDue)
        : 0,
    };
  };

  const renderCard = (card: CardData) => {
    const bankConfig = BANKS[card.bank] || BANKS[Bank.UNKNOWN];
    const stats = calculateCardStats(card);

    return (
      <View key={`${card.bank}-${card.last4}`} style={styles.cardContainer}>
        <View
          style={[styles.creditCard, { backgroundColor: bankConfig.color }]}
        >
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.bankName}>{bankConfig.displayName} BANK</Text>
              <Text style={styles.cardType}>CREDIT</Text>
            </View>
            <Pressable
              onPress={() => handleEditCard(card)}
              style={styles.editIcon}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </Pressable>
          </View>
          <View style={styles.cardMiddle}>
            <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
          </View>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>BILLING CYCLE</Text>
              <Text style={styles.cardValue}>{stats.cycleRange}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>DUE DATE (EST.)</Text>
              <Text style={styles.cardValue}>{stats.dueDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Cycle Summary</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Spend</Text>
            <Text style={styles.statValue}>
              ₹{stats.currentSpend.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Unbilled Amount</Text>
            <Text style={styles.statValue}>
              ₹{stats.unbilled.toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Last Statement Due</Text>
            <Text
              style={[
                styles.statValue,
                { color: stats.totalDue > 0 ? "#FF3B30" : "#1A1C1E" },
              ]}
            >
              ₹{stats.totalDue.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
        <Text style={styles.subtitle}>Dynamic cycle tracking</Text>
      </View>

      {loading && smsList.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Detecting your cards...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchSms} />
          }
        >
          {detectedCards.length > 0 ? (
            detectedCards.map(renderCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No cards detected</Text>
              <Text style={styles.emptyText}>
                We couldn&apos;t find any credit card transactions in your SMS
                inbox.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Card Settings Modal */}
      <Modal
        visible={!!editingCard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingCard(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Card Settings</Text>
            <Text style={styles.modalSubtitle}>
              {editingCard?.bank} ending in {editingCard?.last4}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Billing Cycle End Day (1-31)
              </Text>
              <TextInput
                style={styles.input}
                value={editBillingDay}
                onChangeText={setEditBillingDay}
                keyboardType="number-pad"
                placeholder="e.g. 15"
              />
              <Text style={styles.inputHint}>If 15, cycle is 16th to 15th</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grace Period (Days)</Text>
              <TextInput
                style={styles.input}
                value={editGracePeriod}
                onChangeText={setEditGracePeriod}
                keyboardType="number-pad"
                placeholder="e.g. 20"
              />
              <Text style={styles.inputHint}>
                Days after cycle end for payment
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancel"
                variant="secondary"
                onPress={() => setEditingCard(null)}
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Save"
                onPress={saveSettings}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1C1E",
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 32,
  },
  creditCard: {
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bankName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardType: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  editIcon: {
    padding: 4,
  },
  cardMiddle: {
    marginVertical: 20,
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statsContainer: {
    marginTop: -20,
    marginHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    paddingTop: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    zIndex: -1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1C1E",
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  statLabel: {
    fontSize: 14,
    color: "#65676B",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1C1E",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#65676B",
    fontSize: 14,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1C1E",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1C1E",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#303234",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1A1C1E",
  },
  inputHint: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
});
