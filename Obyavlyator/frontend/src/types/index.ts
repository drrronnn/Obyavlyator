/**
 * Основные типы данных приложения
 */

// Базовый тип пользователя
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'employee';
}

// Расширенный тип пользователя для профиля
export interface UserProfile extends User {
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Данные для регистрации
export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// Данные для формы профиля
export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// Данные для входа
export interface LoginData {
  email: string;
  password: string;
}

// Состояние аутентификации
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  confirmPassword: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Дополнительные типы для форм
export interface LoginFormData extends LoginData { }

export interface RegisterFormData extends RegisterData {
  agreeToTerms: boolean;
}

// Типы для сотрудников
export type EmployeeRole = 'admin' | 'employee';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  role: EmployeeRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_seen?: string;
}

export interface EmployeeCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  position?: string;
  role: EmployeeRole;
}

export interface EmployeeUpdate {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  role?: EmployeeRole;
}

// Типы для статистики сотрудника
export interface EmployeeStats {
  total_ads: number;
  not_take: number;
  not_take_phone: number;
  our_apartments: number;
  not_first: number;
  conversion: number; // в процентах
}

// Типы для обновления профиля
export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
}

export interface ChangeEmailRequest {
  new_email: string;
  current_password: string;
}

export interface ChangePasswordRequest {
  new_password: string;
}

export interface OTPResponse {
  data: {
    message: string;
  };
}
