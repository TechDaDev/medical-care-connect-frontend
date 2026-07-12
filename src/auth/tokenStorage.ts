const ACCESS_KEY = "mcc_access_token";
const REFRESH_KEY = "mcc_refresh_token";

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
