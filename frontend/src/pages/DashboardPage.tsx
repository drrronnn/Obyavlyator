import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";

/**
 * Главная страница для авторизованных пользователей
 */
const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <PageHeader title="Добро пожаловать в Объявлятор!" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Карточка статистики */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Активные объявления
          </h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-500 mt-1">+2 за последнюю неделю</p>
        </div>

        {/* Карточка статистики */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Просмотры
          </h3>
          <p className="text-3xl font-bold text-green-600">1,234</p>
          <p className="text-sm text-gray-500 mt-1">+15% за месяц</p>
        </div>

        {/* Карточка статистики */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Сообщения
          </h3>
          <p className="text-3xl font-bold text-orange-600">8</p>
          <p className="text-sm text-gray-500 mt-1">3 непрочитанных</p>
        </div>
      </div>

      {/* Последние объявления */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Последние объявления
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Продам iPhone 15 Pro
              </h3>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Активно
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Опубликовано 2 дня назад • 45 просмотров
            </p>
          </div>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Сдам квартиру в центре
              </h3>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                На модерации
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Опубликовано 1 день назад • 12 просмотров
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
