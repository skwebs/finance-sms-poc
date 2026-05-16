import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getSms } from "../../modules/expo-sms-reader";
import { SMS, SMSFilter, BANK_KEYWORDS } from "../constants/sms";

// SMS Reader component
export default function Index() {
  const [smsList, setSmsList] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "pending">("pending");
  const [filter, setFilter] = useState<SMSFilter>("all");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS !== "android") return;
    try {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      setPermissionStatus(granted ? "granted" : "denied");
    } catch (err) {
      console.warn(err);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Error", "SMS reading is only supported on Android.");
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
        title: "SMS Permission",
        message: "Finance SMS POC needs access to your SMS to track financial messages.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermissionStatus("granted");
      } else {
        setPermissionStatus("denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const readSms = async () => {
    if (permissionStatus !== "granted") {
      Alert.alert("Permission Required", "Please grant SMS permission first.");
      return;
    }

    setLoading(true);
    try {
      const messages = await getSms({ maxCount: 20 });
      setSmsList(messages as SMS[]);
    } catch (err) {
      Alert.alert("Error", "Failed to read SMS: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const filteredSms = useMemo(() => {
    if (filter === "all") return smsList;
    return smsList.filter((sms) => {
      const body = sms.body.toUpperCase();
      const address = sms.address.toUpperCase();
      return BANK_KEYWORDS.some((kw) => body.includes(kw) || address.includes(kw));
    });
  }, [smsList, filter]);

  const renderSmsItem = ({ item }: { item: SMS }) => {
    const date = new Date(item.date);
    return (
      <View style={styles.smsItem}>
        <View style={styles.smsHeader}>
          <Text style={styles.sender}>{item.address}</Text>
          <Text style={styles.timestamp}>{date.toLocaleString()}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Finance SMS POC</Text>
        <Text style={styles.subtitle}>Android SMS Access Test</Text>
        <View style={[styles.badge, permissionStatus === "granted" ? styles.badgeGranted : styles.badgeDenied]}>
          <Text style={styles.badgeText}>
            Permission: {permissionStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Request SMS Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, permissionStatus !== "granted" && styles.buttonDisabled]} 
          onPress={readSms}
          disabled={permissionStatus !== "granted"}
        >
          <Text style={styles.buttonText}>Read Last 20 SMS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]} 
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === "bank" && styles.filterButtonActive]} 
          onPress={() => setFilter("bank")}
        >
          <Text style={[styles.filterText, filter === "bank" && styles.filterTextActive]}>Bank SMS Only</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredSms}
          keyExtractor={(item) => item._id}
          renderItem={renderSmsItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {smsList.length === 0 ? "No SMS loaded yet." : "No SMS match the filter."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E4E8",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1C1E",
  },
  subtitle: {
    fontSize: 14,
    color: "#65676B",
    marginTop: 4,
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGranted: {
    backgroundColor: "#E7F8ED",
  },
  badgeDenied: {
    backgroundColor: "#FFEBEB",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1C1E",
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A0CFFF",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  smsItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  smsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sender: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#1A1C1E",
  },
  timestamp: {
    fontSize: 12,
    color: "#65676B",
  },
  body: {
    fontSize: 14,
    color: "#303234",
    lineHeight: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#65676B",
    fontSize: 16,
  },
});
