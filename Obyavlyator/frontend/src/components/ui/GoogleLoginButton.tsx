import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { apiClient } from "../../shared/services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { ICONS } from "@/config/constants";
import { Button } from "@heroui/button";

export const GoogleLoginButton: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Отправляем access_token на бэкенд
        const response = await apiClient.post("/auth/google", {
          access_token: tokenResponse.access_token,
        });

        if (response.data.error) {
          throw new Error(response.data.error.message);
        }

        const { access_token } = response.data.data;
        if (access_token) {
          await loginWithGoogle(access_token);
          const { user } = useAuthStore.getState();
          const userName = user?.first_name || "Пользователь";

          addToast({
            title: "Успешный вход",
            description: `Добро пожаловать, ${userName}!`,
            variant: "flat",
            color: "success",
          });
          navigate("/");
        }
      } catch (error) {
        addToast({
          title: "Ошибка входа",
          description:
            error instanceof Error
              ? error.message
              : "Не удалось войти через Google",
          variant: "flat",
          color: "danger",
        });
      }
    },
    onError: () => {
      addToast({
        title: "Ошибка",
        description: "Не удалось войти через Google",
        variant: "flat",
        color: "danger",
      });
    },
  });

  return (
    <Button
      fullWidth
      type="button"
      variant="bordered"
      size="md"
      radius="lg"
      className="w-full border-gray-500 text-blue-500 hover:bg-blue-50 font-medium py-3 transition-colors text-sm h-11"
      onClick={() => login()}
    >
      <ICONS.google width={30} height={30} />
    </Button>
  );
};
