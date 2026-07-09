import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, updateConfig, testConnection, clearLogs, logs } = useApp();

  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [apiToken, setApiToken] = useState(config.apiToken);
  const [bankKeywords, setBankKeywords] = useState(config.bankKeywords);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    setApiUrl(config.apiUrl);
    setApiToken(config.apiToken);
    setBankKeywords(config.bankKeywords);
  }, [config]);

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateConfig({ apiUrl: apiUrl.trim(), apiToken: apiToken.trim(), bankKeywords: bankKeywords.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Pass current form values so unsaved edits are also tested
    const ok = await testConnection(apiUrl.trim(), apiToken.trim());
    setTestResult(ok);
    setTesting(false);
    await Haptics.impactAsync(ok ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleClearLogs = () => {
    Alert.alert(
      "ล้าง Logs ทั้งหมด?",
      `จะลบ ${logs.length} รายการ`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ล้าง", style: "destructive", onPress: clearLogs },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad + 16, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>ตั้งค่า</Text>

        {/* API Config */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>🔗 เชื่อมต่อ PayGate API</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>API URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://yourdomain.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              URL ของเว็บ PayGate (ไม่ต้องใส่ /api/v1/...)
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>SMS Token</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }]}
              value={apiToken}
              onChangeText={setApiToken}
              placeholder="Token จากหน้า Admin → ตั้งค่า SMS"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              คัดลอกจากหน้า Admin → ตั้งค่า → SMS นำเข้า
            </Text>
          </View>

          {/* Test connection result */}
          {testResult !== null && (
            <View style={[styles.resultBox, { backgroundColor: testResult ? colors.success + "15" : colors.destructive + "15", borderColor: testResult ? colors.success + "40" : colors.destructive + "40" }]}>
              <Feather name={testResult ? "check-circle" : "x-circle"} size={14} color={testResult ? colors.success : colors.destructive} />
              <Text style={{ color: testResult ? colors.success : colors.destructive, fontSize: 13 }}>
                {testResult ? "เชื่อมต่อสำเร็จ! ระบบพร้อมรับ SMS" : "เชื่อมต่อไม่ได้ — ตรวจสอบ URL และ Token อีกครั้ง"}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.testBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
            onPress={handleTest}
            disabled={testing || !apiUrl || !apiToken}
          >
            <Feather name="wifi" size={14} color={colors.primary} />
            <Text style={[styles.testBtnText, { color: colors.primary }]}>
              {testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}
            </Text>
          </Pressable>
        </View>

        {/* Bank Keywords */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>🏦 กรอง SMS จากธนาคาร</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground, marginBottom: 8 }]}>
            ใส่ชื่อ Sender ของธนาคารที่ใช้ คั่นด้วย , (จะส่งเฉพาะ SMS จากชื่อเหล่านี้)
          </Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
            value={bankKeywords}
            onChangeText={setBankKeywords}
            placeholder="KBANK,SCB,BBL,KTB,BAY"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            autoCapitalize="characters"
          />
          <Text style={[styles.hint, { color: colors.mutedForeground, marginTop: 6 }]}>
            ตัวอย่าง: <Text style={{ color: colors.foreground }}>KBANK, SCB, BBL, KTB, BAY, TMB, KRUNGTHAI</Text>
          </Text>
        </View>

        {/* Forwarding Toggle */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>⚡ การทำงาน</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>เปิด Forward SMS อัตโนมัติ</Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                เมื่อได้รับ SMS จากธนาคาร จะส่งไปยัง PayGate ทันที
              </Text>
            </View>
            <Switch
              value={config.forwardingEnabled && !!(config.apiUrl && config.apiToken)}
              onValueChange={(v) => updateConfig({ forwardingEnabled: v })}
              disabled={!(config.apiUrl && config.apiToken)}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={config.forwardingEnabled ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={[styles.infoBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="info" size={12} color={colors.mutedForeground} />
            <Text style={[styles.hint, { color: colors.mutedForeground, flex: 1 }]}>
              การดักจับ SMS บน Android ต้องใช้ Custom Build ร่วมกับ{" "}
              <Text style={{ color: colors.foreground }}>react-native-sms-listener</Text>
              {" "}ปัจจุบันใช้ปุ่ม "ส่ง SMS ทดสอบ" ที่แท็บ Home เพื่อทดสอบการส่งข้อมูลได้
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
          onPress={handleSave}
        >
          <Feather name={saved ? "check" : "save"} size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? "บันทึกแล้ว!" : "บันทึกการตั้งค่า"}</Text>
        </Pressable>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.destructive + "30" }]}>
          <Text style={[styles.sectionTitle, { color: colors.destructive }]}>⚠️ อันตราย</Text>
          <Pressable
            style={[styles.testBtn, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}
            onPress={handleClearLogs}
            disabled={logs.length === 0}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
            <Text style={[styles.testBtnText, { color: colors.destructive }]}>
              ล้าง Logs ทั้งหมด ({logs.length} รายการ)
            </Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <Text style={[styles.hint, { color: colors.mutedForeground, textAlign: "center" }]}>
            PayGate SMS Forwarder v1.0{"\n"}
            สร้างโดย PayGate • ใช้ร่วมกับ PayGate Payment Gateway
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700" as const, marginBottom: 16, letterSpacing: -0.5 },
  section: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "700" as const, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" as const },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  hint: { fontSize: 12, lineHeight: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoBanner: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: "flex-start" },
  testBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 11, borderRadius: 10, borderWidth: 1 },
  testBtnText: { fontSize: 13, fontWeight: "600" as const },
  resultBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, marginBottom: 12 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
});
