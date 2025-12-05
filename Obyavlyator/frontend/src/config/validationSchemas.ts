import * as yup from 'yup';
import { LoginData, RegisterData, UpdateProfileRequest, ChangeEmailRequest, ChangePasswordRequest } from '../types';

// Схема для логина
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
});

// Схема для регистрации
export const registerSchema = yup.object({
  first_name: yup
    .string()
    .required('Имя обязательно')
    .min(2, 'Имя должно содержать минимум 2 символа'),
  last_name: yup
    .string()
    .required('Фамилия обязательна')
    .min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: yup
    .string()
    .required('Email обязателен')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  agreeToTerms: yup
    .boolean()
    .required('Необходимо согласиться с условиями использования')
    .oneOf([true], 'Необходимо согласиться с условиями использования')
});

// Схема для сброса пароля
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен')
    .email('Введите корректный email')
});

// Схема для подтверждения сброса пароля
export const resetPasswordSchema = yup.object({
  otp_code: yup
    .string()
    .required('Код подтверждения обязателен')
    .length(6, 'Код должен содержать 6 цифр'),
  new_password: yup
    .string()
    .required('Новый пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
});

// Схема для OTP
export const otpSchema = yup.object({
  otp_code: yup
    .string()
    .required('Код подтверждения обязателен')
    .length(6, 'Код должен содержать 6 цифр')
});

// Схема для обновления профиля
export const updateProfileSchema = yup.object({
  first_name: yup
    .string()
    .required('Имя обязательно')
    .min(2, 'Имя должно содержать минимум 2 символа'),
  last_name: yup
    .string()
    .required('Фамилия обязательна')
    .min(2, 'Фамилия должна содержать минимум 2 символа')
});

// Схема для изменения email
export const changeEmailSchema = yup.object({
  new_email: yup
    .string()
    .required('Email обязателен')
    .email('Введите корректный email'),
  current_password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
});

// Схема для изменения пароля
export const changePasswordSchema = yup.object({
  new_password: yup
    .string()
    .required('Новый пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
});

// Схема для OTP подтверждения (6 цифр)
export const otpConfirmSchema = yup.object({
  otp_code: yup
    .string()
    .required('Код обязателен')
    .matches(/^\d{6}$/, 'Код должен содержать 6 цифр')
});

// Типы для форм (используем централизованные типы)
export type LoginFormData = LoginData;
export type RegisterFormData = RegisterData & {
  agreeToTerms: boolean;
};
export type ForgotPasswordFormData = { email: string };
export type ResetPasswordFormData = { otp_code: string; new_password: string };
export type OtpFormData = { otp_code: string };
export type UpdateProfileFormData = UpdateProfileRequest;
export type ChangeEmailFormData = ChangeEmailRequest;
export type ChangePasswordFormData = ChangePasswordRequest;
export type OtpConfirmFormData = { otp_code: string };