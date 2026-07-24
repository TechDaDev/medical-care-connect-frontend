import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { DoctorRegistrationInput, DoctorRegistrationResponse, User } from "../types";
import { authApi, accountsApi } from "../api/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerPatient: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  registerDoctor: (data: DoctorRegistrationInput) => Promise<DoctorRegistrationResponse>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => Promise<User>;
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
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await accountsApi.getMe();
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    return res.user;
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
      setUser(res.user);
    },
    []
  );

  const registerDoctor = useCallback(async (data: DoctorRegistrationInput) => {
    const res = await authApi.registerDoctor(data);
    await refreshCurrentUser();
    return res;
  }, [refreshCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback(async (data: Partial<User>) => {
    const updated = await accountsApi.updateMe(data);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerPatient,
        registerDoctor,
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
