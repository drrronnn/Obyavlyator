import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UpdateProfileRequest, ChangeEmailRequest, ChangePasswordRequest } from '../types';
import { getCurrentUser } from '../shared/services/authService';
import { extractUserFromToken } from '../shared/utils/decodeToken';
import { profileApi } from '../shared/services/profileService';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  loginWithGoogle: (access_token: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changeEmail: (data: ChangeEmailRequest) => Promise<string>;
  confirmChangeEmail: (otp: string) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isProfileLoading: false,

      setUser: (user: User) => set({ user, isAuthenticated: true }),

      setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      },

      loginWithGoogle: async (access_token: string) => {
        localStorage.setItem('token', access_token);
        set({ token: access_token, isAuthenticated: true });
        
        try {
          const user = await getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Failed to get current user:', error);
          
          // Fallback: извлекаем данные из токена
          const tokenData = extractUserFromToken(access_token);
          if (tokenData) {
            set({ 
              user: {
                id: '',
                ...tokenData
              }
            });
          }
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        set({ isProfileLoading: true });
        try {
          const user = await profileApi.getProfile();
          set({ user });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          throw error;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      updateProfile: async (data: UpdateProfileRequest) => {
        set({ isProfileLoading: true });
        try {
          const user = await profileApi.updateProfile(data);
          set({ user });
        } catch (error) {
          console.error('Failed to update profile:', error);
          throw error;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      changeEmail: async (data: ChangeEmailRequest) => {
        set({ isProfileLoading: true });
        try {
          const response = await profileApi.changeEmail(data);
          return response.data.message;
        } catch (error) {
          console.error('Failed to change email:', error);
          throw error;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      confirmChangeEmail: async (otp: string) => {
        set({ isProfileLoading: true });
        try {
          await profileApi.confirmEmailChange(otp);
          await get().fetchProfile();
        } catch (error) {
          console.error('Failed to confirm email change:', error);
          throw error;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      changePassword: async (data: ChangePasswordRequest) => {
        set({ isProfileLoading: true });
        try {
          await profileApi.changePassword(data);
        } catch (error) {
          console.error('Failed to change password:', error);
          throw error;
        } finally {
          set({ isProfileLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        const token = localStorage.getItem('token');
        if (token && state) {
          state.token = token;
          getCurrentUser()
            .then((user) => state.setUser(user))
            .catch(() => state.logout());
        }
      },
    }
  )
);