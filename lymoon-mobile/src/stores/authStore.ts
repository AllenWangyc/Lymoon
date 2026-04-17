import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'Manager' | 'Member';

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  avatarInitials: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setUser: (data: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: UserRole;
    avatarInitials: string;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearUser: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      userEmail: null,
      userRole: null,
      avatarInitials: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (data) =>
        set({
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userRole: data.userRole,
          avatarInitials: data.avatarInitials,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      clearUser: () =>
        set({
          userId: null,
          userName: null,
          userEmail: null,
          userRole: null,
          avatarInitials: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'lymoon-auth',
      storage: createJSONStorage(() => secureStorage),
      // Do not persist the hydration flag itself
      partialize: (state) => ({
        userId: state.userId,
        userName: state.userName,
        userEmail: state.userEmail,
        userRole: state.userRole,
        avatarInitials: state.avatarInitials,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
