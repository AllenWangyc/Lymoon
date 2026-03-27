import { create } from 'zustand';

export type UserRole = 'Manager' | 'Member';

interface AuthState {
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  avatarInitials: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser(userId: string, userName: string, userRole: UserRole, avatarInitials: string): void;
  setTokens(accessToken: string, refreshToken: string): void;
  clearUser(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userName: null,
  userRole: null,
  avatarInitials: null,
  accessToken: null,
  refreshToken: null,
  setUser: (userId, userName, userRole, avatarInitials) =>
    set({ userId, userName, userRole, avatarInitials }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  clearUser: () =>
    set({
      userId: null,
      userName: null,
      userRole: null,
      avatarInitials: null,
      accessToken: null,
      refreshToken: null,
    }),
}));
