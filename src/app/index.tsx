import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getSms } from "../../modules/expo-sms-reader";
import { SMS, BANK_KEYWORDS } from "../constants/sms";
import { MessageCard } from "../components/MessageCard";
import { CustomButton } from "../components/CustomButton";
import { identifyBank } from "../utils/messageClassifier";
import { Bank } from "../constants/banks";

type PermissionState = "granted" | "denied" | "pending";

export default function Index() {
  const [smsList, setSmsList] = useState<SMS[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>("pending");
  const [filter, setFilter] = useState<"all" | "bank">("all");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS !== "android") return;
    try {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      setPermissionStatus(granted ? "granted" : "denied");
      if (granted) {
        readSms();
      }
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
        readSms();
      } else {
        setPermissionStatus("denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const readSms = async () => {
    setLoading(true);
    try {
      const messages = await getSms({ maxCount: 50 });
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
      const bank = identifyBank(sms.address, sms.body);
      if (bank !== Bank.UNKNOWN) return true;
      
      const body = sms.body.toUpperCase();
      const address = sms.address.toUpperCase();
      return BANK_KEYWORDS.some((kw) => body.includes(kw) || address.includes(kw));
    });
  }, [smsList, filter]);

  const renderPermissionBadge = () => {
    let color = "#8E8E93";
    let bgColor = "#F2F2F7";
    
    if (permissionStatus === "granted") {
      color = "#34C759";
      bgColor = "#E7F8ED";
    } else if (permissionStatus === "denied") {
      color = "#FF3B30";
      bgColor = "#FFEBEB";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <View style={[styles.badgeDot, { backgroundColor: color }]} />
        <Text style={[styles.badgeText, { color }]}>
          {permissionStatus === "granted" ? "Access Granted" : permissionStatus === "denied" ? "Access Denied" : "Pending"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Custom Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Finance SMS POC</Text>
            <Text style={styles.subtitle}>Android SMS Access Test</Text>
          </View>
          {renderPermissionBadge()}
        </View>

        {permissionStatus !== "granted" && (
          <CustomButton 
            title="Grant SMS Permission" 
            onPress={requestPermission} 
            style={styles.permissionButton}
          />
        )}
      </View>

      <View style={styles.filterBar}>
        <Pressable 
          onPress={() => setFilter("all")}
          style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, filter === "all" && styles.filterTabTextActive]}>All Messages</Text>
        </Pressable>
        <Pressable 
          onPress={() => setFilter("bank")}
          style={[styles.filterTab, filter === "bank" && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, filter === "bank" && styles.filterTabTextActive]}>Financial Only</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Fetching your messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSms}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <MessageCard item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No messages found</Text>
              <Text style={styles.emptySubtitle}>
                {permissionStatus !== "granted" 
                  ? "We need SMS permission to show your financial transactions." 
                  : "We couldn't find any relevant messages on your device."}
              </Text>
              {permissionStatus === "granted" && (
                <CustomButton 
                  title="Refresh" 
                  variant="outline" 
                  onPress={readSms} 
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
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1C1E",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
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
    letterSpacing: 0.5,
  },
  permissionButton: {
    marginTop: 16,
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E4E8",
  },
  filterTabActive: {
    backgroundColor: "#1A1C1E",
    borderColor: "#1A1C1E",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#65676B",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
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
    lineHeight: 20,
  },
});
