import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, stats, logs, isConnected, updateConfig, testConnection, sendTestSms } = useApp();
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isConfigured = !!(config.apiUrl && config.apiToken);
  const lastLog = logs[0];

  const handleToggle = async (val: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateConfig({ forwardingEnabled: val });
  };

  const handleTestConnect = async () => {
    setConnecting(true);
    await testConnection();
    setConnecting(false);
  };

  const handleTestSms = async () => {
    if (!isConfigured) return;
    setTesting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendTestSms();
    setTesting(false);
  };

  const statusColor = !isConfigured
    ? colors.mutedForeground
    : isConnected === null
    ? colors.warning
    : isConnected
    ? colors.success
    : colors.destructive;

  const statusText = !isConfigured
    ? "ยังไม่ได้ตั้งค่า"
    : isConnected === null
    ? "ยังไม่ได้ทดสอบ"
    : isConnected
    ? "เชื่อมต่อแล้ว"
    : "เชื่อมต่อไม่ได้";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.foreground }]}>PayGate</Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>SMS Forwarder</Text>
        </View>

        {/* Status card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            {connecting && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>เปิดส่ง SMS อัตโนมัติ</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                {config.forwardingEnabled ? "กำลังทำงาน — รอ SMS จากธนาคาร" : "ปิดอยู่ — กดเพื่อเปิดใช้งาน"}
              </Text>
            </View>
            <Switch
              value={config.forwardingEnabled && isConfigured}
              onValueChange={handleToggle}
              disabled={!isConfigured}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={config.forwardingEnabled && isConfigured ? colors.primary : colors.mutedForeground}
            />
          </View>

          {!isConfigured && (
            <View style={[styles.warningBadge, { backgroundColor: colors.warning + "20", borderColor: colors.warning + "40" }]}>
              <Feather name="alert-circle" size={13} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>ตั้งค่า API URL และ Token ที่แท็บ ⚙️ ก่อน</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "SMS วันนี้", value: stats.today, color: colors.primary },
            { label: "ส่งสำเร็จ", value: stats.forwarded, color: colors.success },
            { label: "ผิดพลาด", value: stats.errors, color: colors.destructive },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Last SMS */}
        {lastLog && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SMS ล่าสุด</Text>
            <View style={styles.lastSmsRow}>
              <View style={[styles.senderBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.senderText, { color: colors.primary }]}>{lastLog.sender}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: lastLog.status === "success" ? colors.success + "20" : colors.destructive + "20" }]}>
                <Text style={{ color: lastLog.status === "success" ? colors.success : colors.destructive, fontSize: 11, fontWeight: "600" as const }}>
                  {lastLog.status === "success" ? "✓ สำเร็จ" : "✗ ผิดพลาด"}
                </Text>
              </View>
            </View>
            <Text style={[styles.smsMessage, { color: colors.foreground }]} numberOfLines={2}>{lastLog.message}</Text>
            <Text style={[styles.smsTime, { color: colors.mutedForeground }]}>
              {new Date(lastLog.timestamp).toLocaleString("th-TH")}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border, flex: 1 }]}
            onPress={handleTestConnect}
            disabled={!isConfigured || connecting}
          >
            {connecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name="wifi" size={16} color={isConfigured ? colors.primary : colors.mutedForeground} />
            )}
            <Text style={[styles.actionBtnText, { color: isConfigured ? colors.foreground : colors.mutedForeground }]}>
              ทดสอบเชื่อมต่อ
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: testing ? colors.success + "20" : colors.secondary, borderColor: testing ? colors.success + "40" : colors.border, flex: 1 }]}
            onPress={handleTestSms}
            disabled={!isConfigured || testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Feather name="send" size={16} color={isConfigured ? colors.success : colors.mutedForeground} />
            )}
            <Text style={[styles.actionBtnText, { color: isConfigured ? colors.foreground : colors.mutedForeground }]}>
              ส่ง SMS ทดสอบ
            </Text>
          </Pressable>
        </View>

        {/* Native SMS note */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Feather name="info" size={14} color={colors.primary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>ข้อมูลสำหรับนักพัฒนา</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              การดักจับ SMS บน Android ต้องใช้ Custom Development Build (ไม่ใช่ Expo Go)
              ร่วมกับ library <Text style={{ color: colors.foreground }}>react-native-sms-listener</Text>
              {"\n"}ปัจจุบันสามารถใช้ปุ่ม "ส่ง SMS ทดสอบ" เพื่อทดสอบการเชื่อมต่อกับ API ได้ทันที
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, gap: 12 },
  header: { paddingBottom: 4 },
  appName: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5 },
  appSub: { fontSize: 14, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600" as const, flex: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 15, fontWeight: "600" as const },
  toggleSub: { fontSize: 12, marginTop: 2 },
  warningBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  warningText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1 },
  statValue: { fontSize: 24, fontWeight: "700" as const },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  lastSmsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  senderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  senderText: { fontSize: 12, fontWeight: "700" as const },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  smsMessage: { fontSize: 13, lineHeight: 18 },
  smsTime: { fontSize: 11 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "500" as const },
  infoCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoTitle: { fontSize: 12, fontWeight: "700" as const, marginBottom: 4 },
  infoText: { fontSize: 12, lineHeight: 18 },
});
