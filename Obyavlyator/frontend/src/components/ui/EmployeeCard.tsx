import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";
import NiceModal from "@ebay/nice-modal-react";
import { Employee } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { ICONS } from "../../config/constants";
import { canEditEmployee } from "../../shared/utils/permissions";
import { UserStatus } from "../../shared/services/socketService";

interface EmployeeCardProps {
  employee: Employee;
  status?: UserStatus;
}

/**
 * Карточка сотрудника
 */
const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, status }) => {
  const { user } = useAuthStore();
  const canEdit = canEditEmployee(user, employee);

  // Определяем статус
  const isOnline = status?.status === 'online';
  const lastSeenDate = status?.last_seen || employee.last_seen;

  const formatTimeDistance = (dateString: string) => {
    // Ensure dateString is treated as UTC if it doesn't have timezone info
    const normalizedDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(normalizedDateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Helper to format time
    const formatTime = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Helper to check if same day
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    // Helper to check if yesterday
    const isYesterday = (d: Date) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return isSameDay(d, yesterday);
    };

    if (diffInSeconds < 60) return 'только что';

    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} мин. назад`;
    }

    if (diffInSeconds < 86400 && isSameDay(date, now)) {
      return `сегодня в ${formatTime(date)}`;
    }

    if (isYesterday(date)) {
      return `вчера в ${formatTime(date)}`;
    }

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  const getStatusText = () => {
    if (isOnline) return "В сети";
    if (!lastSeenDate) return "Оффлайн123";

    try {
      return `Был(а) ${formatTimeDistance(lastSeenDate)}`;
    } catch (e) {
      return "Оффлайн";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRoleColor = (role: Employee["role"]) => {
    return role === "admin" ? "primary" : "default";
  };

  const getRoleLabel = (role: Employee["role"]) => {
    return role === "admin" ? "Админ" : "Сотрудник";
  };

  const handleCardClick = () => {
    NiceModal.show("edit-employee-modal", { employee });
  };

  const handleAction = (key: string) => {
    if (key === "edit") {
      NiceModal.show("edit-employee-modal", { employee });
    }
  };

  return (
    <Card
      isPressable={!canEdit}
      onPress={!canEdit ? handleCardClick : undefined}
      className="hover:scale-[1.02] transition-transform relative"
    >
      {canEdit && (
        <div className="absolute top-3 right-3 z-10">
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="min-w-unit-8 w-8 h-8"
              >
                <ICONS.moreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu onAction={(key) => handleAction(key as string)}>
              <DropdownItem key="edit">Изменить</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}
      <CardBody className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar
              name={getInitials(employee.first_name, employee.last_name)}
              size="lg"
              className="w-20 h-20 text-xl"
              color={employee.role === "admin" ? "primary" : "default"}
            />
            {/* Status Indicator */}
            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-3 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
          </div>

          <div className="text-center w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {employee.last_name} {employee.first_name}
            </h3>
            <p className="text-xs font-medium mb-1" style={{ color: isOnline ? '#10B981' : '#9CA3AF' }}>
              {getStatusText()}
            </p>
            <p className="text-sm text-gray-500 mb-1">{employee.email}</p>
            {employee.position && (
              <p className="text-xs text-gray-400">{employee.position}</p>
            )}
          </div>

          <Chip
            color={getRoleColor(employee.role)}
            variant="flat"
            size="sm"
            className="font-medium"
          >
            {getRoleLabel(employee.role)}
          </Chip>
        </div>
      </CardBody>

      <CardFooter className="justify-center border-t border-gray-100 py-3">
        {employee.is_verified ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Верифицирован</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-400">Не верифицирован</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmployeeCard;
