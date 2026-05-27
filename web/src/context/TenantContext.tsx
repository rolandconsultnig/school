import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { foundationApi } from "../api/client";
import type { BootstrapData, SchoolTier, TenantState } from "../types";
import { recordId } from "../types";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "schoolportal_tenant";

interface TenantContextValue {
  campusId: string;
  tier: SchoolTier;
  setCampusId: (id: string) => void;
  setTier: (tier: SchoolTier) => void;
  bootstrap: BootstrapData | null;
  campusName: string;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function loadTenant(): Partial<TenantState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isStudent, isParent } = useAuth();
  const stored = loadTenant();
  const [campusId, setCampusIdState] = useState(stored.campusId ?? "");
  const [tier, setTierState] = useState<SchoolTier>(stored.tier ?? "PRIMARY");
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(false);

  const persist = useCallback((c: string, t: SchoolTier) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ campusId: c, tier: t }));
  }, []);

  const setCampusId = useCallback(
    (id: string) => {
      setCampusIdState(id);
      persist(id, tier);
    },
    [tier, persist]
  );

  const setTier = useCallback(
    (t: SchoolTier) => {
      setTierState(t);
      persist(campusId, t);
    },
    [campusId, persist]
  );

  useEffect(() => {
    if (!user?.token || isStudent || isParent) return;
    setLoading(true);
    foundationApi
      .bootstrap(user.token)
      .then((data) => {
        setBootstrap(data);
        if (!campusId && data.organizations[0]?.campuses?.[0]) {
          const c = recordId(data.organizations[0].campuses[0]);
          setCampusIdState(c);
          persist(c, tier);
        }
      })
      .catch(() => setBootstrap(null))
      .finally(() => setLoading(false));
  }, [user?.token, isStudent, isParent]);

  const campusName = useMemo(() => {
    if (!bootstrap) return "";
    for (const org of bootstrap.organizations) {
      for (const c of org.campuses ?? []) {
        if (recordId(c) === campusId) return c.name;
      }
    }
    return "";
  }, [bootstrap, campusId]);

  const value = useMemo(
    () => ({
      campusId,
      tier,
      setCampusId,
      setTier,
      bootstrap,
      campusName,
      loading,
    }),
    [campusId, tier, setCampusId, setTier, bootstrap, campusName, loading]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function useApiContext() {
  const { user } = useAuth();
  const { campusId, tier } = useTenant();
  return { token: user?.token ?? "", campusId, tier };
}
