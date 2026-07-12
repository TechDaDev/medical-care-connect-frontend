import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { User } from "../types";
import { authApi, accountsApi } from "../api/auth";
import { tokenStorage } from "./tokenStorage";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerPatient: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const me = await accountsApi.getMe();
      setUser(me);
    } catch {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const access = tokenStorage.getAccess();
    if (!access) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }
    refreshCurrentUser().finally(() => setIsLoading(false));
  }, [refreshCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStorage.setTokens(res.access, res.refresh);
    setUser(res.user);
  }, []);

  const registerPatient = useCallback(
    async (data: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      password: string;
      password_confirm: string;
    }) => {
      const res = await authApi.registerPatient(data);
      tokenStorage.setTokens(res.access, res.refresh);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // ignore logout errors
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback(async (data: Partial<User>) => {
    const updated = await accountsApi.updateMe(data);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerPatient,
        logout,
        refreshCurrentUser,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
