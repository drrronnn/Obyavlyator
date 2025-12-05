import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { InputOtp } from "@heroui/input-otp";
import { addToast } from "@heroui/toast";
import { forgotPasswordSchema, resetPasswordSchema } from "../config/validationSchemas";
import { ForgotPasswordFormData, ResetPasswordFormData } from "../config/validationSchemas";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../shared/hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";

/**
 * Страница сброса пароля
 * Двухэтапный процесс: запрос сброса по email, затем ввод OTP и нового пароля
 */
const ConfirmPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [userEmail, setUserEmail] = useState("");
  
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  // Форма для ввода email
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isValid: isEmailValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  // Форма для сброса пароля
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isValid: isResetValid },
    setValue: setResetValue,
    watch: watchReset
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const otpCode = watchReset("otp_code") || "";

  const onEmailSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      
      setUserEmail(data.email);
      setStep('reset');
      addToast({
        title: "Код отправлен",
        description: "Проверьте email для получения кода сброса пароля.",
        variant: "flat",
        color: "success",
      });
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync({
        email: userEmail,
        otp_code: data.otp_code,
        new_password: data.new_password,
      });
      
      addToast({
        title: "Пароль изменен",
        description: "Пароль успешно изменен. Войдите с новым паролем.",
        variant: "flat",
        color: "success",
      });
      navigate("/auth/login");
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleOtpChange = (value: string) => {
    setResetValue("otp_code", value);
  };

  return (
    <AuthLayout>
      <div className="w-full mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            {step === 'email' ? "Сброс пароля" : "Новый пароль"}
          </h1>
          <p className="text-sm text-gray-600">
            {step === 'email' 
              ? "Введите email для получения кода сброса пароля" 
              : `Введите код из письма, отправленного на ${userEmail}`
            }
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
            {/* Email поле */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Email
              </label>
              <Input
                {...registerEmail("email")}
                type="email"
                placeholder="Введите ваш email"
                variant="flat"
                size="md"
                radius="sm"
                isInvalid={!!emailErrors.email}
                errorMessage={emailErrors.email?.message}
                className="w-full"
                classNames={{
                  input:
                    "bg-gray-50 border-0 text-gray-900 placeholder-gray-400 text-sm h-10",
                  inputWrapper:
                    "bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 h-10",
                }}
              />
            </div>

            {/* Кнопка отправки */}
            <Button
              type="submit"
              size="md"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors text-sm h-11"
              isLoading={forgotPasswordMutation.isPending}
              isDisabled={!isEmailValid}
            >
              {forgotPasswordMutation.isPending ? "Отправка..." : "Отправить код"}
            </Button>

            {/* Ссылка назад */}
            <div className="text-center">
              <Button
                as="button"
                variant="light"
                size="sm"
                className="text-blue-500 hover:text-blue-600"
                onPress={() => navigate("/auth/login")}
              >
                Назад к входу
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-6">
            {/* OTP поле */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block text-center">
                Код подтверждения
              </label>
              <div className="flex justify-center">
                <InputOtp
                  length={6}
                  value={otpCode}
                  onValueChange={handleOtpChange}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    segment:
                      "w-12 h-12 text-xl font-medium border-gray-300 focus:border-blue-500",
                    segmentWrapper: "gap-3",
                  }}
                />
              </div>
              {resetErrors.otp_code && (
                <p className="text-red-500 text-sm text-center">
                  {resetErrors.otp_code.message}
                </p>
              )}
            </div>

            {/* Новый пароль */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Новый пароль
              </label>
              <Input
                {...registerReset("new_password")}
                type="password"
                placeholder="Введите новый пароль"
                variant="flat"
                size="md"
                radius="sm"
                isInvalid={!!resetErrors.new_password}
                errorMessage={resetErrors.new_password?.message}
                className="w-full"
                classNames={{
                  input:
                    "bg-gray-50 border-0 text-gray-900 placeholder-gray-400 text-sm h-10",
                  inputWrapper:
                    "bg-gray-50 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 h-10",
                }}
              />
            </div>

            {/* Кнопка сброса пароля */}
            <Button
              type="submit"
              size="md"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors text-sm h-11"
              isLoading={resetPasswordMutation.isPending}
              isDisabled={!isResetValid}
            >
              {resetPasswordMutation.isPending ? "Изменение..." : "Изменить пароль"}
            </Button>

            {/* Кнопка назад */}
            <Button
              type="button"
              variant="bordered"
              size="md"
              className="w-full h-11 text-sm font-medium"
              onPress={() => setStep('email')}
            >
              Назад
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ConfirmPasswordPage;