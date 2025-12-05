import React from "react";
import Logo from "@/assets/images/logo.svg?react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout для страниц авторизации
 * Содержит header с логотипом и footer с информацией о правах
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/auth/login" className="flex items-center space-x-3">
                <Logo className="w-8 h-8 rounded-lg flex items-center justify-center" />
                <span className="text-2xl font-semibold text-gray-900">
                  Объявлятор
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-8xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-12 py-3 sm:py-0 text-xs sm:text-sm md:text-base text-gray-500">
            <div className="mb-2 sm:mb-0 text-sm">© 2025 Все права защищены</div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 text-center sm:text-left">
              <Link
                to="/terms"
                className="hover:text-gray-700 transition-colors text-sm"
              >
                Условия использования
              </Link>
              <Link
                to="/privacy"
                className="hover:text-gray-700 transition-colors text-sm"
              >
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
