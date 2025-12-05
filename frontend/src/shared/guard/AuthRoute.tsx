import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Компонент для защиты маршрутов
 * Перенаправляет неавторизованных пользователей на страницу входа
 */
const AuthRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    // Сохраняем текущий путь для перенаправления после авторизации
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
