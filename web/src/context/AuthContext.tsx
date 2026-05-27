import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/client";
import type { AuthUser, ProfileType } from "../types";

const STORAGE_KEY = "schoolportal_auth";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, portal?: ProfileType) => Promise<void>;
  completeSso: (token: string, profileType: ProfileType, email?: string) => void;
  logout: () => void;
  isStaff: boolean;
  isStudent: boolean;
  isParent: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStored);

  const login = useCallback(
    async (email: string, password: string, portal?: ProfileType) => {
      let next: AuthUser;
      if (portal === "PARENT") {
        const res = await authApi.parentLogin(email, password);
        const p = res.parent as { _id?: string; id?: string; email: string; name?: string };
        next = {
          token: res.token,
          email: p.email,
          name: p.name,
          profileType: "PARENT",
          profileId: String(p.id ?? p._id),
          roleCode: "PARENT",
        };
      } else if (portal === "STUDENT") {
        const res = await authApi.studentLogin(email, password);
        const s = res.student as { _id?: string; id?: string; email: string; name?: string };
        next = {
          token: res.token,
          email: s.email,
          name: s.name,
          profileType: "STUDENT",
          profileId: String(s.id ?? s._id),
          roleCode: "STUDENT",
        };
      } else {
        next = await authApi.login(email, password);
      }
      setUser(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    []
  );

  const completeSso = useCallback((token: string, profileType: ProfileType, email = "") => {
    const next: AuthUser = {
      token,
      email,
      profileType,
      profileId: "",
      roleCode:
        profileType === "ADMIN"
          ? "SCHOOL_ADMIN"
          : profileType === "TEACHER"
            ? "TEACHER"
            : profileType,
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("schoolportal_tenant");
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      completeSso,
      logout,
      isStaff:
        user?.profileType === "ADMIN" || user?.profileType === "TEACHER",
      isStudent: user?.profileType === "STUDENT",
      isParent: user?.profileType === "PARENT",
    }),
    [user, login, completeSso, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
