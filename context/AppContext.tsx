import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SmsLog {
  id: string;
  sender: string;
  message: string;
  amount: number | null;
  status: "success" | "error" | "filtered";
  error?: string;
  timestamp: string;
}

export interface AppConfig {
  apiUrl: string;
  apiToken: string;
  bankKeywords: string;
  forwardingEnabled: boolean;
}

interface AppContextValue {
  config: AppConfig;
  logs: SmsLog[];
  stats: { today: number; forwarded: number; errors: number };
  isConnected: boolean | null;
  updateConfig: (c: Partial<AppConfig>) => Promise<void>;
  addLog: (log: SmsLog) => void;
  clearLogs: () => void;
  testConnection: (overrideUrl?: string, overrideToken?: string) => Promise<boolean>;
  sendTestSms: () => Promise<void>;
}

const DEFAULT_CONFIG: AppConfig = {
  apiUrl: "",
  apiToken: "",
  bankKeywords: "KBANK,SCB,BBL,KTB,BAY,KRUNGTHAI,KASIKORN,SCB Alert,ยอดเงิน,โอนเงิน",
  forwardingEnabled: false,
};

/** Cross-platform fetch with a manual timeout (AbortSignal.timeout not available in all Expo runtimes) */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("paygate_config");
      if (stored) setConfig(JSON.parse(stored));
      const storedLogs = await AsyncStorage.getItem("paygate_logs");
      if (storedLogs) setLogs(JSON.parse(storedLogs));
    })();
  }, []);

  const updateConfig = useCallback(async (partial: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem("paygate_config", JSON.stringify(next));
      return next;
    });
  }, []);

  const addLog = useCallback((log: SmsLog) => {
    setLogs((prev) => {
      const next = [log, ...prev].slice(0, 200);
      AsyncStorage.setItem("paygate_logs", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearLogs = useCallback(async () => {
    setLogs([]);
    await AsyncStorage.removeItem("paygate_logs");
  }, []);

  /**
   * Test connection using the provided credentials, or fall back to saved config.
   * Passing overrideUrl/overrideToken lets the Settings screen test unsaved values.
   */
  const testConnection = useCallback(async (
    overrideUrl?: string,
    overrideToken?: string,
  ): Promise<boolean> => {
    const url = (overrideUrl ?? config.apiUrl).replace(/\/$/, "");
    const token = overrideToken ?? config.apiToken;
    if (!url || !token) return false;
    try {
      const res = await fetchWithTimeout(
        `${url}/api/v1/ping`,
        { method: "GET", headers: { "X-SMS-Token": token } },
        5000,
      );
      // Accept 2xx and 401 (server reachable but token wrong shows mis-config clearly below)
      // Reject anything ≥ 400 except 401 so user gets an accurate signal
      const ok = res.ok;
      setIsConnected(ok);
      return ok;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, [config.apiUrl, config.apiToken]);

  const sendTestSms = useCallback(async () => {
    setConfig((current) => {
      const { apiUrl, apiToken } = current;
      if (!apiUrl || !apiToken) return current;
      const testMsg = `[ทดสอบ] KBANK โอนเงินเข้า 100.00 บาท เวลา ${new Date().toLocaleTimeString("th-TH")}`;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const url = apiUrl.replace(/\/$/, "");
      fetchWithTimeout(
        `${url}/api/v1/sms/callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SMS-Token": apiToken,
          },
          body: JSON.stringify({ sender: "KBANK", message: testMsg }),
        },
        8000,
      )
        .then((res) => {
          addLog({
            id,
            sender: "KBANK",
            message: testMsg,
            amount: 100,
            status: res.ok ? "success" : "error",
            error: res.ok ? undefined : `HTTP ${res.status}`,
            timestamp: new Date().toISOString(),
          });
        })
        .catch((e: unknown) => {
          addLog({
            id,
            sender: "KBANK",
            message: testMsg,
            amount: 100,
            status: "error",
            error: e instanceof Error ? e.message : "Connection failed",
            timestamp: new Date().toISOString(),
          });
        });
      return current;
    });
  }, [addLog]);

  const today = new Date().toDateString();
  const todayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === today);
  const stats = {
    today: todayLogs.length,
    forwarded: todayLogs.filter((l) => l.status === "success").length,
    errors: todayLogs.filter((l) => l.status === "error").length,
  };

  return (
    <AppContext.Provider value={{ config, logs, stats, isConnected, updateConfig, addLog, clearLogs, testConnection, sendTestSms }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
