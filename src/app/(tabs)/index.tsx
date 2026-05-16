import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Local imports
import { CustomButton } from "@/components/CustomButton";
import { MessageCard } from "@/components/MessageCard";
import { SegmentedToggle } from "@/components/SegmentedToggle";
import { Bank } from "@/constants/banks";
import { BANK_KEYWORDS, SMS } from "@/constants/sms";
import { parseSmsPreview } from "@/parsers/parseSmsPreview";
import { identifyBank } from "@/utils/messageClassifier";
import { getSms } from "../../../modules/expo-sms-reader";
import { batchSaveTransactions, getMonthlyExpenses, getOutstandingBillTotal } from "@/db/transactionStore";

type PermissionState = "granted" | "denied" | "unknown";
type ViewMode = "Current Bill" | "Current Expense";

/**
 * Finance Home Screen
 * Displays a summary of financial SMS messages and recent transactions.
 */
function FinanceHomeScreen() {
  // 1. State
  const [smsList, setSmsList] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState>("unknown");
  const [filter, setFilter] = useState<"all" | "bank">("bank");
  const [viewMode, setViewMode] = useState<ViewMode>("Current Bill");
  
  // Data from DB
  const [dbMonthlyExpense, setDbMonthlyExpense] = useState(0);
  const [dbOutstandingBill, setDbOutstandingBill] = useState(0);

  // 2. readSms
  const readSms = useCallback(async () => {
    setLoading(true);
    try {
      const messages = await getSms({ maxCount: 100 });
      setSmsList(messages as SMS[]);
      
      // Batch save transactions for better performance
      await batchSaveTransactions(messages as SMS[]);
      
      // Refresh DB values
      const expense = await getMonthlyExpenses();
      const bill = await getOutstandingBillTotal();
      setDbMonthlyExpense(expense);
      setDbOutstandingBill(bill);
      
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to read SMS: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. checkPermission
  const checkPermission = useCallback(async () => {
    // SMS reading is only supported on Android
    if (Platform.OS !== "android") {
      setPermissionStatus("denied");
      return;
    }
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      );
      const status = granted ? "granted" : "denied";
      setPermissionStatus(status);
      if (granted) {
        readSms();
      }
    } catch (err) {
      console.warn("Permission check error:", err);
      setPermissionStatus("denied");
    }
  }, [readSms]);

  // 4. requestPermission
  const requestPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Error", "SMS reading is only supported on Android.");
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message:
            "Finance SMS POC needs access to your SMS to track financial messages.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissionStatus("granted");
        readSms();
      } else {
        setPermissionStatus("denied");
      }
    } catch (err) {
      console.warn("Permission request error:", err);
      Alert.alert("Error", "Failed to request SMS permission.");
    }
  }, [readSms]);

  // 5. useEffect startup
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // 6. memo logic
  const financialSms = useMemo(() => {
    return smsList
      .map((sms) => ({
        ...sms,
        parsed: parseSmsPreview(sms.address, sms.body),
      }))
      .filter((item) => {
        if (filter === "all") return true;
        const bank = identifyBank(item.address, item.body);
        if (bank !== Bank.UNKNOWN) return true;

        const body = item.body.toUpperCase();
        const address = item.address.toUpperCase();
        return BANK_KEYWORDS.some(
          (kw) => body.includes(kw) || address.includes(kw),
        );
      });
  }, [smsList, filter]);

  const summary = useMemo(() => {
    let creditCard = 0;
    let bankUpi = 0;

    financialSms.forEach((item) => {
      if (item.parsed.isExpense && item.parsed.amount) {
        const amt = parseFloat(item.parsed.amount);
        if (item.parsed.transactionType === "credit_card_spend") {
          creditCard += amt;
        } else {
          bankUpi += amt;
        }
      }
    });

    return { creditCard, bankUpi };
  }, [financialSms]);

  const renderPermissionBadge = () => {
    let color = "#8E8E93";
    let bgColor = "#F2F2F7";
    let label = "Unknown";

    if (permissionStatus === "granted") {
      color = "#34C759";
      bgColor = "#E7F8ED";
      label = "Live";
    } else if (permissionStatus === "denied") {
      color = "#FF3B30";
      bgColor = "#FFEBEB";
      label = "Offline";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <View style={[styles.badgeDot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  // 7. Render
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Finance Inbox</Text>
            <Text style={styles.subtitle}>Recent transactions</Text>
          </View>
          {renderPermissionBadge()}
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <SegmentedToggle
          options={["Current Bill", "Current Expense"]}
          selectedOption={viewMode}
          onSelect={(opt) => setViewMode(opt as ViewMode)}
          containerStyle={styles.toggle}
        />
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {viewMode === "Current Bill" ? "Outstanding Bill" : "Total Monthly Expense"}
            </Text>
            <Text style={styles.summaryValue}>
              ₹{(viewMode === "Current Bill" ? dbOutstandingBill : dbMonthlyExpense).toLocaleString()}
            </Text>
          </View>
        </View>
        
        {viewMode === "Current Expense" && (
          <View style={[styles.summaryRow, { marginTop: 12 }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Credit Card</Text>
              <Text style={styles.summarySubValue}>
                ₹{summary.creditCard.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Bank / UPI</Text>
              <Text style={styles.summarySubValue}>
                ₹{summary.bankUpi.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Recent Activity</Text>
        <Pressable onPress={() => setFilter(filter === "all" ? "bank" : "all")}>
          <Text style={styles.filterLink}>
            {filter === "all" ? "Financial Only" : "Show All"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing messages...</Text>
        </View>
      ) : (
        <FlatList
          data={financialSms}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <MessageCard item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptySubtitle}>
                {permissionStatus !== "granted"
                  ? "Grant SMS permission to see your finance overview."
                  : "We couldn't find any financial transactions recently."}
              </Text>
              {permissionStatus !== "granted" && (
                <CustomButton
                  title="Grant Permission"
                  onPress={requestPermission}
                  style={{ marginTop: 20 }}
                />
              )}
            </View>
          }
          refreshing={loading}
          onRefresh={readSms}
        />
      )}
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
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  summaryContainer: {
    backgroundColor: "#1A1C1E",
    margin: 20,
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  toggle: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  summaryTitle: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },
  summarySubValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1C1E",
  },
  filterLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1C1E",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});

export default FinanceHomeScreen;
