import { create } from "zustand";
import type { User, LoginCredentials } from "@/types";
import { authService } from "@/lib/services/authService";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null });
  },

  checkAuth: () => {
    const user = authService.getCurrentUser();
    set({ user });
  },

  clearError: () => set({ error: null }),
}));
