import React from "react";
import DashboardLayout from "../layouts/DashboardLayout";

const NotFoundPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <h1 className="text-9xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600">Страница не найдена</p>
      </div>
    </DashboardLayout>
  );
};

export default NotFoundPage;