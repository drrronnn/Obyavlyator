const ERROR_MESSAGES: Record<string, string> = {
  // Аутентификация
  NOT_AUTHORIZED: 'Необходима авторизация',
  INVALID_CREDENTIALS: 'Неверный пароль',
  EMAIL_NOT_VERIFIED: 'Email не подтвержден',
  TOKEN_EXPIRED: 'Сессия истекла',
  INVALID_TOKEN: 'Неверный токен',
  INVALID_GOOGLE_TOKEN: 'Неверный Google токен',
  
  // Регистрация
  EMAIL_ALREADY_EXISTS: 'Email уже используется',
  INVALID_OTP: 'Неверный код подтверждения',
  OTP_EXPIRED: 'Код подтверждения истек. Запросите новый код',
  REGISTRATION_DATA_NOT_FOUND: 'Данные регистрации не найдены',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Слишком много запросов. Попробуйте позже',
  
  // Пользователь
  USER_NOT_FOUND: 'Пользователь не найден',
  
  // Валидация
  VALIDATION_ERROR: 'Ошибка валидации данных',
  
  // Общие
  INTERNAL_ERROR: 'Внутренняя ошибка сервера',
  NOT_FOUND: 'Ресурс не найден',
};

export const getProfileErrorMessage = (error: Error): string => {
  const message = error.message;
  return ERROR_MESSAGES[message] || message || 'Произошла ошибка';
};
