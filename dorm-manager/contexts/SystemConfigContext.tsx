import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getSystemConfig, SystemConfig } from "../api";

interface SystemConfigContextType {
  systemConfig: SystemConfig | null;
  loading: boolean;
  error: string | null;
  refetchSystemConfig: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(
  undefined,
);

export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch system config on mount
  useEffect(() => {
    // Check if user is logged in before fetching
    const token = localStorage.getItem("token");
    if (token) {
      fetchSystemConfig();
    } else {
      // If not logged in, use default config and don't show loading
      setSystemConfig({
        id: 0,
        system_name: "Hệ thống Quản lý Ký túc xá",
        hotline: "",
        email: "",
        address: "",
        utility_start_day: 5,
        utility_end_day: 25,
        max_reservation_time: 72,
      });
      setLoading(false);
    }
  }, []);

  const fetchSystemConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await getSystemConfig();
      setSystemConfig(config);
    } catch (err: any) {
      console.error("Error fetching system config:", err);
      setError(err.message || "Failed to fetch system config");
      // Set a default config so the app doesn't break
      setSystemConfig({
        id: 0,
        system_name: "Hệ thống Quản lý Ký túc xá",
        hotline: "",
        email: "",
        address: "",
        utility_start_day: 5,
        utility_end_day: 25,
        max_reservation_time: 72,
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchSystemConfig = async () => {
    await fetchSystemConfig();
  };

  return (
    <SystemConfigContext.Provider
      value={{ systemConfig, loading, error, refetchSystemConfig }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = (): SystemConfigContextType => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error(
      "useSystemConfig must be used within a SystemConfigProvider",
    );
  }
  return context;
};
