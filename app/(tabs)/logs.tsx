import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SmsLog, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "success" | "error";

export default function LogsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logs, clearLogs } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter);

  const handleClear = () => {
    Alert.alert("ล้าง Logs?", "ข้อมูล logs ทั้งหมดจะถูกลบ", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ล้าง",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          clearLogs();
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const renderItem = ({ item }: { item: SmsLog }) => {
    const isOk = item.status === "success";
    return (
      <View style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logTop}>
          <View style={[styles.senderBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.senderText, { color: colors.primary }]}>{item.sender}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: isOk ? colors.success + "20" : colors.destructive + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: isOk ? colors.success : colors.destructive }]} />
            <Text style={[styles.statusText, { color: isOk ? colors.success : colors.destructive }]}>
              {isOk ? "สำเร็จ" : "ผิดพลาด"}
            </Text>
          </View>
          {item.amount !== null && (
            <Text style={[styles.amount, { color: isOk ? colors.success : colors.mutedForeground }]}>
              ฿{item.amount.toLocaleString()}
            </Text>
          )}
        </View>
        <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
          {item.message}
        </Text>
        {item.error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{item.error}</Text>
        )}
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {new Date(item.timestamp).toLocaleString("th-TH")}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Logs</Text>
        {logs.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.clearText, { color: colors.destructive }]}>ล้าง</Text>
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["all", "success", "error"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary + "20" : "transparent", borderColor: filter === f ? colors.primary + "60" : "transparent" }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.mutedForeground }]}>
              {f === "all" ? "ทั้งหมด" : f === "success" ? "✓ สำเร็จ" : "✗ ผิดพลาด"}
            </Text>
          </Pressable>
        ))}
        <Text style={[styles.countText, { color: colors.mutedForeground }]}>{filtered.length} รายการ</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 16, gap: 8 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>ยังไม่มี Logs</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              กลับไปแท็บ Home แล้วกด "ส่ง SMS ทดสอบ"
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: "700" as const },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearText: { fontSize: 13 },
  filterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 6, borderBottomWidth: 1 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: "600" as const },
  countText: { marginLeft: "auto", fontSize: 12 },
  logItem: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 6 },
  logTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  senderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  senderText: { fontSize: 11, fontWeight: "700" as const },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" as const },
  amount: { marginLeft: "auto", fontSize: 14, fontWeight: "700" as const },
  message: { fontSize: 13, lineHeight: 18 },
  errorText: { fontSize: 12 },
  time: { fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600" as const },
  emptyText: { fontSize: 13, textAlign: "center" },
});
