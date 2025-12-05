import { useMutation } from '@tanstack/react-query';
import { addToast } from '@heroui/toast';
import { 
  registerUser, 
  verifyEmail, 
  loginUser, 
  getCurrentUser,
  forgotPassword, 
  resetPassword,
  verifyEmployee
} from '../services/authService';
import { useAuthStore } from '../../store/authStore';

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: registerUser,
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useVerifyEmailMutation = () => {
  const { setToken } = useAuthStore();
  
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      if (data.access_token) {
        setToken(data.access_token);
      }
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useLoginMutation = () => {
  const { setToken, setUser } = useAuthStore();
  
  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      if (data.access_token) {
        setToken(data.access_token);
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('Failed to get current user:', error);
        }
      }
    },
    onError: (error: any) => {
      if (error.code !== 'EMAIL_NOT_VERIFIED') {
        addToast({
          title: 'Ошибка',
          description: error.message,
          variant: 'flat',
          color: 'danger',
        });
      }
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: forgotPassword,
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: resetPassword,
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useVerifyEmployeeMutation = () => {
  const { setToken, setUser } = useAuthStore();
  
  return useMutation({
    mutationFn: verifyEmployee,
    onSuccess: async (data) => {
      if (data.access_token) {
        setToken(data.access_token);
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('Failed to get current user:', error);
        }
      }
    },
    onError: (error: Error) => {
      addToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};