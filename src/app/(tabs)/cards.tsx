import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local imports
import { CustomButton } from "@/components/CustomButton";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { Bank, BANKS } from "@/constants/banks";
import { MessageCategory } from "@/constants/messageCategories";
import { type SMS } from "@/constants/sms";
import {
  batchSaveTransactions,
  getCardBillSummaries,
  getCardSettings,
  getUnlinkedPayments,
  saveCardSettings,
  type CardBillSummary,
  type CardSettings,
} from "@/db/transactionStore";
import { parseSmsPreview, type ParsedSMS } from "@/parsers/parseSmsPreview";
import { parseSafeAmount } from "@/utils/amountParser";
import { getLatestStatementDate } from "@/utils/billingCycle";
import { getSms } from "../../../modules/expo-sms-reader";

// Type definitions
interface CardData {
  bank: Bank;
  last4: string;
  transactions: (ParsedSMS & { date: number })[];
  latestStatement: (ParsedSMS & { date: number }) | null;
  settings: CardSettings;
}

type CardViewMode = "Current Bill" | "Current Expense";

/**
 * Cards Screen
 * Dynamically detects unique credit cards from SMS and calculates billing cycle expenses.
 * Uses FlashList for performance and persists card settings.
 */
export default function CardsScreen() {
  const [smsList, setSmsList] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cardBillSummaries, setCardBillSummaries] = useState<CardBillSummary[]>(
    [],
  );
  const [unlinkedPayments, setUnlinkedPayments] = useState<
    { amount: number; bank: string }[]
  >([]);
  const [viewMode, setViewMode] = useState<CardViewMode>("Current Bill");
  const [persistedSettings, setPersistedSettings] = useState<
    Record<string, CardSettings>
  >({});

  const [editingCard, setEditingCard] = useState<{
    key: string;
    bank: Bank;
    last4: string;
  } | null>(null);
  const [editBillingDay, setEditBillingDay] = useState("");
  const [editGracePeriod, setEditGracePeriod] = useState("");

  // Fetch data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const messages = await getSms({ maxCount: 200 });
      setSmsList(messages as SMS[]);

      // Batch save transactions for better performance
      await batchSaveTransactions(messages as SMS[]);

      const [summaries, unlinked] = await Promise.all([
        getCardBillSummaries(),
        getUnlinkedPayments(),
      ]);

      setCardBillSummaries(summaries);
      setUnlinkedPayments(unlinked);

      // Load settings for all detected cards
      const uniqueCards = new Set<string>();
      messages.forEach((sms) => {
        const parsed = parseSmsPreview(sms.address, sms.body);
        if (parsed.cardLast4) {
          uniqueCards.add(`${parsed.bank}-${parsed.cardLast4}`);
        }
      });

      const settingsMap: Record<string, CardSettings> = {};
      await Promise.all(
        Array.from(uniqueCards).map(async (key) => {
          const [bank, last4] = key.split("-");
          const settings = await getCardSettings(bank, last4);
          if (settings) {
            settingsMap[key] = settings;
          }
        }),
      );
      setPersistedSettings(settingsMap);
    } catch (err) {
      console.error("Failed to fetch data for cards:", err);
      Alert.alert("Error", "Could not load SMS data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize detected cards to prevent expensive recalculations
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
          settings: persistedSettings[cardKey] || {
            billingDay: 15,
            gracePeriod: 20,
          },
        };
      }

      const txn = { ...parsed, date: sms.date };
      cardsMap[cardKey].transactions.push(txn);

      if (parsed.categories.includes(MessageCategory.STATEMENT)) {
        if (
          !cardsMap[cardKey].latestStatement ||
          sms.date > (cardsMap[cardKey].latestStatement?.date || 0)
        ) {
          cardsMap[cardKey].latestStatement = txn;
        }
      }
    });

    return Object.values(cardsMap);
  }, [smsList, persistedSettings]);

  const handleEditCard = useCallback((card: CardData) => {
    const key = `${card.bank}-${card.last4}`;
    const settings = card.settings;
    setEditingCard({ key, bank: card.bank, last4: card.last4 });
    setEditBillingDay(settings.billingDay.toString());
    setEditGracePeriod(settings.gracePeriod.toString());
  }, []);

  const saveSettings = async () => {
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

    const newSettings = { billingDay: bDay, gracePeriod: gPeriod };

    // Persist card settings to local database
    await saveCardSettings(editingCard.bank, editingCard.last4, newSettings);

    setPersistedSettings((prev) => ({
      ...prev,
      [editingCard.key]: newSettings,
    }));
    setEditingCard(null);
  };

  // Billing Cycle Logic
  const getCardStats = useCallback(
    (card: CardData) => {
      const { billingDay, gracePeriod } = card.settings;

      // Latest statement date (e.g., 15th May)
      const latestStatementDate = getLatestStatementDate(billingDay);

      // Previous Cycle (Current Bill): e.g., 16 April - 15 May
      const prevCycleStart = new Date(latestStatementDate);
      prevCycleStart.setMonth(prevCycleStart.getMonth() - 1);
      prevCycleStart.setDate(prevCycleStart.getDate() + 1);
      prevCycleStart.setHours(0, 0, 0, 0);

      // Current Cycle (Unbilled Expense): e.g., 16 May - 15 June
      const currCycleStart = new Date(latestStatementDate);
      currCycleStart.setDate(currCycleStart.getDate() + 1);
      currCycleStart.setHours(0, 0, 0, 0);

      const currCycleEnd = new Date(currCycleStart);
      currCycleEnd.setMonth(currCycleEnd.getMonth() + 1);
      currCycleEnd.setDate(currCycleEnd.getDate() - 1);
      currCycleEnd.setHours(23, 59, 59, 999);

      // Current Bill stats from DB
      const billSummary = cardBillSummaries.find(
        (s) => s.bank === card.bank && s.cardLast4 === card.last4,
      );

      // Unbilled Spends: after latest statement
      const unbilledTxns = card.transactions.filter(
        (t) => t.date > latestStatementDate.getTime(),
      );

      let unbilledSpend = 0;
      let spendCount = 0;
      unbilledTxns.forEach((t) => {
        if (t.transactionType === "credit_card_spend") {
          unbilledSpend += parseSafeAmount(t.amount);
          spendCount++;
        } else if (t.transactionType === "refund") {
          unbilledSpend -= parseSafeAmount(t.amount);
        }
      });

      const dueDate = new Date(latestStatementDate);
      dueDate.setDate(dueDate.getDate() + gracePeriod);

      return {
        // Current Bill section
        totalDue: billSummary?.totalDue || 0,
        minDue: billSummary?.minDue || 0,
        paidAmount: billSummary?.paidAmount || 0,
        status: billSummary?.status || "unpaid",
        statementDueDate: billSummary?.dueDate || dueDate.toLocaleDateString(),
        prevCycleRange: `${prevCycleStart.getDate()} ${prevCycleStart.toLocaleString("default", { month: "short" })} - ${latestStatementDate.getDate()} ${latestStatementDate.toLocaleString("default", { month: "short" })}`,

        // Current Expense section
        unbilledSpend,
        transactionCount: spendCount,
        cycleRange: `${currCycleStart.getDate()} ${currCycleStart.toLocaleString("default", { month: "short" })} - ${currCycleEnd.getDate()} ${currCycleEnd.toLocaleString("default", { month: "short" })}`,
      };
    },
    [cardBillSummaries],
  );

  // Render Helpers
  const renderCard = ({ item: card }: { item: CardData }) => {
    const bankConfig = BANKS[card.bank] || BANKS[Bank.UNKNOWN];
    const stats = getCardStats(card);

    return (
      <View style={styles.cardContainer}>
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
              <Text style={styles.cardValue}>
                {viewMode === "Current Bill"
                  ? stats.prevCycleRange
                  : stats.cycleRange}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLabel}>DUE DATE</Text>
              <Text style={styles.cardValue}>{stats.statementDueDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {viewMode === "Current Bill" ? (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Statement Amount</Text>
                <Text style={styles.statValue}>
                  ₹{stats.totalDue.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Minimum Due</Text>
                <Text style={styles.statValue}>
                  ₹{stats.minDue.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Paid Amount</Text>
                <Text style={styles.statValue}>
                  ₹{stats.paidAmount.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.statLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        stats.status === "paid"
                          ? "#E7F8ED"
                          : stats.status === "partially_paid"
                            ? "#FFF9E6"
                            : "#FFEBEB",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          stats.status === "paid"
                            ? "#34C759"
                            : stats.status === "partially_paid"
                              ? "#FF9500"
                              : "#FF3B30",
                      },
                    ]}
                  >
                    {stats.status.toUpperCase().replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={styles.paymentDisplay}>
                ₹{stats.paidAmount.toLocaleString()} / ₹
                {stats.totalDue.toLocaleString()} paid
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Unbilled Spends</Text>
                <Text style={styles.statValue}>
                  ₹{stats.unbilledSpend.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Cycle Range</Text>
                <Text style={styles.statValue}>{stats.cycleRange}</Text>
              </View>
              <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.statLabel}>Live Transactions</Text>
                <Text style={styles.statValue}>{stats.transactionCount}</Text>
              </View>
              <Text style={styles.paymentDisplay}>
                Expenses tracked after latest statement
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.globalToggleContainer}>
          <SegmentedToggle
            options={["Current Bill", "Current Expense"]}
            selectedOption={viewMode}
            onSelect={(opt) => setViewMode(opt as CardViewMode)}
            containerStyle={styles.globalToggle}
          />
        </View>

        {unlinkedPayments.length > 0 && (
          <View style={styles.unlinkedContainer}>
            <View style={styles.unlinkedHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF9500" />
              <Text style={styles.unlinkedTitle}>Unlinked Payments</Text>
            </View>
            <Text style={styles.unlinkedText}>
              We found ₹
              {unlinkedPayments
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}{" "}
              in payments that aren&apos;t clearly linked to a card.
            </Text>
          </View>
        )}
      </View>
    );
  }, [unlinkedPayments, viewMode]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>My Cards</Text>
        <Text style={styles.subtitle}>Dynamic cycle tracking</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Detecting your cards...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={detectedCards}
            renderItem={renderCard}
            keyExtractor={(item: any) => `${item.bank}-${item.last4}`}
            contentContainerStyle={styles.content}
            ListHeaderComponent={ListHeader}
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No cards detected</Text>
                <Text style={styles.emptyText}>
                  We couldn&apos;t find any credit card transactions in your SMS
                  inbox.
                </Text>
              </View>
            }
          />
        </View>
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
  globalToggleContainer: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  globalToggle: {
    backgroundColor: "transparent",
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
  cardToggle: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  paymentDisplay: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  unlinkedContainer: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  unlinkedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  unlinkedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#856404",
  },
  unlinkedText: {
    fontSize: 13,
    color: "#856404",
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 40,
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
