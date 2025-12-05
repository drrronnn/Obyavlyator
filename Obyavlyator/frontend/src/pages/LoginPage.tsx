import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { loginSchema } from "../config/validationSchemas";
import { LoginFormData } from "../config/validationSchemas";
import { useLoginMutation } from "../shared/hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { GoogleLoginButton } from "../components/ui/GoogleLoginButton";
import AuthLayout from "../layouts/AuthLayout";

import Logo from "@/assets/images/logo.svg?react";

/**
 * Страница входа в систему
 * Содержит форму с email и паролем, валидацию и обработку ошибок
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const loginMutation = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({
        username: data.email,
        password: data.password,
      });
      
      const { user } = useAuthStore.getState();
      const userName = user?.first_name || 'Пользователь';
      
      addToast({
        title: "Успешный вход",
        description: `Добро пожаловать, ${userName}!`,
        variant: "flat",
        color: "success",
      });
      navigate("/");
    } catch (error: any) {
      if (error.code === 'EMAIL_NOT_VERIFIED' && error.email) {
        navigate('/auth/verify-employee', { state: { email: error.email } });
      }
    }
  };

  return (
    <AuthLayout>
      <div className="w-full mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex justify-center gap-4">
            Вход в{" "}
            <div className="flex gap-1">
              <Logo className="w-8 h-8 rounded-lg flex items-center justify-center" />
              <span className="text-2xl font-semibold text-gray-900">
                Объявлятор
              </span>
            </div>
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email поле */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Email
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder="Email"
              variant="flat"
              size="md"
              radius="sm"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              className="w-full"
              classNames={{
                input:
                  "bg-gray-50 border-0 text-gray-900 placeholder-gray-400 text-sm h-10",
                inputWrapper:
                  "bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 h-10",
              }}
            />
          </div>

          {/* Пароль поле */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Пароль
            </label>
            <Input
              {...register("password")}
              type="password"
              placeholder="Пароль"
              variant="flat"
              size="md"
              radius="sm"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              className="w-full"
              classNames={{
                input:
                  "bg-gray-50 border-0 text-gray-900 placeholder-gray-400 text-sm h-10",
                inputWrapper:
                  "bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 h-10",
              }}
            />
          </div>

          {/* Ссылка "Забыли пароль?" */}
          <div className="space-y-6">
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Кнопка входа */}
            <Button
              type="submit"
              size="md"
              radius="lg"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 transition-colors text-sm h-11"
              isLoading={loginMutation.isPending}
              isDisabled={!isValid}
            >
              {loginMutation.isPending ? "Вход..." : "Вход"}
            </Button>

            {/* Разделитель */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">или</span>
              </div>
            </div>

            {/* Google вход */}
            <div className="flex justify-center w-full">
              <GoogleLoginButton />
            </div>

            {/* Кнопка регистрации */}
            <Button
              as={Link}
              to="/auth/register"
              variant="bordered"
              size="md"
              radius="lg"
              className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 font-medium py-3 transition-colors text-sm h-11"
            >
              У вас нет аккаунта? Создать аккаунт
            </Button>

            {/* Дополнительная информация */}
            <div className="text-center text-xs text-gray-500 mt-6">
              Входя в систему, вы соглашаетесь с{" "}
              <Link to="/terms" className="text-blue-500 hover:text-blue-600">
                Условиями использования
              </Link>{" "}
              и{" "}
              <Link to="/privacy" className="text-blue-500 hover:text-blue-600">
                Политикой конфиденциальности
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
