import React from "react";
import { ICONS } from "../../config/constants";
import { UserStats } from "../../shared/services/statsService";

interface EmployeeStatsCardProps {
  stats: UserStats;
  isLoading?: boolean;
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, isLoading }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="text-sm text-gray-500 mb-2">{label}</div>
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-2xl font-bold text-gray-900">{isLoading ? '...' : value}</span>
    </div>
  </div>
);

/**
 * Карточка статистики сотрудника
 */
const EmployeeStatsCard: React.FC<EmployeeStatsCardProps> = ({ stats, isLoading = false }) => {
  
  const statsItems = [
    {
      label: "Всего объявлений",
      value: stats.total_ads,
      icon: <ICONS.list className="w-5 h-5 text-gray-600" />
    },
    {
      label: "Наших квартир",
      value: stats.our_apartments,
      icon: <ICONS.thumbsUp className="w-5 h-5 text-gray-600" />
    },
    {
      label: "Конверсия",
      value: `${stats.conversion}%`,
      icon: <ICONS.chartBar className="w-5 h-5 text-gray-600" />
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {statsItems.map((item, index) => (
        <StatItem
          key={index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default EmployeeStatsCard;
