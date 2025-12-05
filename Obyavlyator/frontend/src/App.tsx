import { Route, Routes } from "react-router-dom";

// Страницы авторизации
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ConfirmPasswordPage from "./pages/ConfirmPasswordPage";
// import DashboardPage from "./pages/DashboardPage";
import AdsPage from "./pages/AdsPage";
import RentPage from "./pages/RentPage";
import FavoritesPage from "./pages/FavoritesPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

// Компоненты
import ProtectedRoute from "./shared/guard/ProtectedRoute";
import AuthRoute from "./shared/guard/AuthRoute";
import { useWebSocket } from "./shared/hooks/useWebSocket";

/**
 * Главный компонент приложения
 * Настраивает маршрутизацию для системы авторизации
 */
function App() {
  useWebSocket();
  
  return (
    <Routes>
      {/* Корневой маршрут - защищенная главная страница */}
      {/* <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      /> */}

      {/* Публичные маршруты авторизации */}

      <Route
        path="/auth/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/confirm-password"
        element={
          <AuthRoute>
            <ConfirmPasswordPage />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/verify-employee"
        element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rent"
        element={
          <ProtectedRoute>
            <RentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Заглушки для ссылок в footer */}
      <Route
        path="/terms"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl">Условия использования</h1>
          </div>
        }
      />
      <Route
        path="/privacy"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl">Политика конфиденциальности</h1>
          </div>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthRoute>
            <ConfirmPasswordPage />
          </AuthRoute>
        }
      />

      {/* Обработка несуществующих маршрутов */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
