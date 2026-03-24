import { create } from 'zustand';

export type UserRole = 'Manager' | 'Member';

interface AuthState {
  userId: string;
  userName: string;
  userRole: UserRole;
  avatarInitials: string;
}

// TODO: replace mock seed with data from login API response stored via setUser()
export const useAuthStore = create<AuthState>(() => ({
  userId: 'emp-1',
  userName: 'Alex Rivera',
  userRole: 'Manager',
  avatarInitials: 'AR',
}));
