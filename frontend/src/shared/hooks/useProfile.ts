import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addToast } from '@heroui/toast';
import { profileApi } from '../services/profileService';
import { useAuthStore } from '../../store/authStore';
import { UpdateProfileRequest, ChangeEmailRequest, ChangePasswordRequest } from '../../types';
import { getProfileErrorMessage } from '../utils/profileErrorHandler';

const profileQueryKeys = {
  profile: ['profile'] as const,
};

export const useProfile = () => {
  const { user, setUser } = useAuthStore();

  return useQuery({
    queryKey: profileQueryKeys.profile,
    queryFn: async () => {
      const profile = await profileApi.getProfile();
      setUser(profile);
      return profile;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProfile = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
      addToast({
        title: 'Успешно',
        description: 'Профиль обновлен',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error),
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useChangeEmail = () => {
  return useMutation({
    mutationFn: (data: ChangeEmailRequest) => profileApi.changeEmail(data),
    onSuccess: (response) => {
      addToast({
        title: 'Успешно',
        description: response.data.message || 'Код отправлен на новый email',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error),
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useConfirmChangeEmail = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otp_code: string) => profileApi.confirmEmailChange(otp_code),
    onSuccess: (profile) => {
      setUser(profile);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
      addToast({
        title: 'Успешно',
        description: 'Email успешно изменен',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error),
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
    onSuccess: () => {
      addToast({
        title: 'Успешно',
        description: 'Код отправлен на ваш email',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error),
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useConfirmChangePassword = () => {
  return useMutation({
    mutationFn: (otp_code: string) => profileApi.confirmPasswordChange(otp_code),
    onSuccess: () => {
      addToast({
        title: 'Успешно',
        description: 'Пароль успешно изменен',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error),
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};
