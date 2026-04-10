import { create } from 'zustand';

export type UserRole = 'Manager' | 'Member';

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: UserRole | null;
  avatarInitials: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

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
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userName: null,
  userEmail: null,
  userRole: null,
  avatarInitials: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

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
}));
