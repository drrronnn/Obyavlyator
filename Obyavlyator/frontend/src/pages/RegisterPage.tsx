import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { InputOtp } from "@heroui/input-otp";
import { addToast } from "@heroui/toast";
import { registerSchema, otpSchema } from "../config/validationSchemas";
import { RegisterFormData, OtpFormData } from "../config/validationSchemas";
import {
  useRegisterMutation,
  useVerifyEmailMutation,
  useVerifyEmployeeMutation,
} from "../shared/hooks/useAuth";
import { GoogleLoginButton } from "../components/ui/GoogleLoginButton";
import AuthLayout from "../layouts/AuthLayout";
import { ICONS } from "../config/constants";

/**
 * Страница регистрации нового пользователя
 * Содержит форму с полями имя, фамилия, email, пароль и подтверждение пароля
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email;
  const [showOtp, setShowOtp] = useState(!!emailFromState);
  const [userEmail, setUserEmail] = useState(emailFromState || "");

  const registerMutation = useRegisterMutation();
  const verifyEmailMutation = useVerifyEmailMutation();
  const verifyEmployeeMutation = useVerifyEmployeeMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
    watch: watchOtp
  } = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
  });

  const otpCode = watchOtp("otp_code") || "";

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      setUserEmail(data.email);
      setShowOtp(true);
      addToast({
        title: "Регистрация успешна",
        description: "Проверьте email для подтверждения.",
        variant: "flat",
        color: "success",
      });
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      if (emailFromState) {
        await verifyEmployeeMutation.mutateAsync({
          email: userEmail,
          otp_code: data.otp_code,
        });
      } else {
        await verifyEmailMutation.mutateAsync({
          email: userEmail,
          otp_code: data.otp_code,
        });
      }

      addToast({
        title: "Email подтвержден",
        description: "Добро пожаловать!",
        variant: "flat",
        color: "success",
      });
      navigate("/");
    } catch (error) {
      // Ошибка уже обработана в хуке
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpValue("otp_code", value);
    if (value.length === 6) {
      handleOtpSubmit(()=> onOtpSubmit({ otp_code: value }));
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {showOtp ? "Подтверждение email" : "Регистрация"}
        </h2>
        <p className="text-sm text-gray-600 mb-8">
          {showOtp
            ? `Введите код, отправленный на ${userEmail}`
            : "Создайте аккаунт для доступа к платформе"}
        </p>
      </div>

      {!showOtp ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Имя и Фамилия в одной строке */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("first_name")}
              type="text"
              label="Имя"
              labelPlacement={"outside-top"}
              placeholder="Иван"
              variant="bordered"
              size="lg"
              isInvalid={!!errors.first_name}
              errorMessage={errors.first_name?.message}
              classNames={{
                input: "text-base h-12",
                inputWrapper: "h-12",
              }}
            />
            <Input
              {...register("last_name")}
              type="text"
              label="Фамилия"
              labelPlacement={"outside-top"}
              placeholder="Иванов"
              variant="bordered"
              size="lg"
              isInvalid={!!errors.last_name}
              errorMessage={errors.last_name?.message}
              classNames={{
                input: "text-base h-12",
                inputWrapper: "h-12",
              }}
            />
          </div>

          {/* Email и Пароль в одной строке */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("email")}
              type="email"
              label="Email"
              labelPlacement={"outside-top"}
              placeholder="Email"
              variant="bordered"
              size="lg"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              classNames={{
                input: "text-base h-12",
                inputWrapper: "h-12",
              }}
            />
            <Input
              {...register("password")}
              type="password"
              label="Пароль"
              labelPlacement={"outside-top"}
              placeholder="Пароль"
              variant="bordered"
              size="lg"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              classNames={{
                input: "text-base h-12",
                inputWrapper: "h-12",
              }}
            />
          </div>

          {/* Согласие с условиями */}
          <div className="flex items-start space-x-2">
            <Checkbox
              {...register("agreeToTerms")}
              isInvalid={!!errors.agreeToTerms}
              size="sm"
            />
            <div className="text-sm text-gray-600">
              Я соглашаюсь с{" "}
              <Link
                to="/terms"
                className="text-blue-600 hover:text-blue-500"
                target="_blank"
              >
                Условиями использования
              </Link>{" "}
              и{" "}
              <Link
                to="/privacy"
                className="text-blue-600 hover:text-blue-500"
                target="_blank"
              >
                Политикой конфиденциальности
              </Link>
            </div>
          </div>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-xs -mt-4">
              {errors.agreeToTerms.message}
            </p>
          )}

          {/* Кнопка регистрации */}
          <Button
            type="submit"
            color="primary"
            size="md"
            variant="bordered"
            className="w-full h-11 text-sm font-medium hover:bg-blue-500 hover:text-white"
            isLoading={registerMutation.isPending}
            isDisabled={!isValid}
          >
            {registerMutation.isPending
              ? "Регистрация..."
              : "Зарегистрироваться"}
          </Button>

          {/* Альтернативный способ регистрации */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Или зарегистрируйтесь через
              </span>
            </div>
          </div>

          {/* Google регистрация */}
          <div className="flex justify-center w-full">
            <GoogleLoginButton />
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
          {/* OTP поле */}
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
          {otpErrors.otp_code && (
            <p className="text-red-500 text-sm text-center">
              {otpErrors.otp_code.message}
            </p>
          )}

          {/* Кнопка подтверждения */}
          <Button
            type="submit"
            color="primary"
            size="md"
            className="w-full h-11 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
            isLoading={verifyEmailMutation.isPending || verifyEmployeeMutation.isPending}
            isDisabled={otpCode.length !== 6}
          >
            {(verifyEmailMutation.isPending || verifyEmployeeMutation.isPending) ? "Подтверждение..." : "Подтвердить"}
          </Button>

          {/* Кнопка назад */}
          <Button
            type="button"
            variant="bordered"
            size="md"
            className="w-full h-11 text-sm font-medium"
            onPress={() => setShowOtp(false)}
          >
            Назад
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default RegisterPage;
