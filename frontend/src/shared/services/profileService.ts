import { apiClient } from "./apiClient";
import {
  UserProfile,
  UpdateProfileRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
  OTPResponse,
} from "@/types";

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>("/auth/me", data);
    return response.data;
  },

  changeEmail: async (data: ChangeEmailRequest): Promise<OTPResponse> => {
    const response = await apiClient.post<OTPResponse>("/auth/change-email", data);
    return response.data;
  },

  confirmEmailChange: async (otp_code: string): Promise<UserProfile> => {
    const response = await apiClient.post<UserProfile>("/auth/confirm-change-email", { otp_code });
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<OTPResponse> => {
    const response = await apiClient.post<OTPResponse>("/auth/change-password", data);
    return response.data;
  },

  confirmPasswordChange: async (otp_code: string): Promise<{ data: { message: string } }> => {
    const response = await apiClient.post<{ data: { message: string } }>("/auth/confirm-change-password", { otp_code });
    return response.data;
  },
};
