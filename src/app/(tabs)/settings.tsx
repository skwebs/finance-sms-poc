import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Switch, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function SettingsScreen() {
  const [showRaw, setShowRaw] = useState(false);
  const [showGeneral, setShowGeneral] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const SettingRow = ({ label, value, onValueChange, type = "switch" }: any) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {type === "switch" ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: "#E1E4E8", true: "#34C759" }}
        />
      ) : (
        <Pressable>
          <Text style={styles.actionText}>{value}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Preferences and Data Management</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Preferences</Text>
          <SettingRow label="Show Raw SMS" value={showRaw} onValueChange={setShowRaw} />
          <SettingRow label="Show General Messages" value={showGeneral} onValueChange={setShowGeneral} />
          <SettingRow label="Compact Mode" value={compactMode} onValueChange={setCompactMode} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <SettingRow label="Show Parsing Debug" value={false} onValueChange={() => {}} />
          <SettingRow label="Show Confidence Score" value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <SettingRow label="Export Data" value="CSV / JSON" type="action" />
          <SettingRow label="Import Data" value="Select File" type="action" />
          <SettingRow label="Clear Database" value="Reset" type="action" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>
          <SettingRow label="Manage Billing Cycles" value="Configure" type="action" />
        </View>

        <Text style={styles.versionText}>Finance SMS POC v1.1.0</Text>
      </ScrollView>
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
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1C1E",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  settingLabel: {
    fontSize: 15,
    color: "#303234",
    fontWeight: "500",
  },
  actionText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
