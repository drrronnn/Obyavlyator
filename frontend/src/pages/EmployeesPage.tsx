import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import NiceModal from "@ebay/nice-modal-react";
import DashboardLayout from "../layouts/DashboardLayout";
import EmployeeCard from "../components/ui/EmployeeCard";
import AddEmployeeCard from "../components/ui/AddEmployeeCard";
import PageHeader from "../components/ui/PageHeader";
import { useEmployees } from "../shared/hooks/useEmployees";
import { useAuthStore } from "../store/authStore";
import { canAddEmployee } from "../shared/utils/permissions";
import { socketService, UserStatus } from "../shared/services/socketService";

const EmployeesPage: React.FC = () => {
  const { data, isLoading } = useEmployees();
  const { user } = useAuthStore();
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});

  useEffect(() => {
    const handleUserStatus = (status: UserStatus) => {
      setStatuses(prev => ({
        ...prev,
        [status.user_id]: status
      }));
    };

    socketService.onUserStatus(handleUserStatus);
    return () => {
      socketService.offUserStatus(handleUserStatus);
    };
  }, []);

  const handleAddEmployee = () => {
    NiceModal.show("add-employee-modal");
  };

  const employees = data?.employees || [];
  const totalCount = employees.length;
  const maxEmployees = 20;

  return (
    <DashboardLayout>
      <PageHeader title="Сотрудники">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-full  text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
            Сотрудников добавлено{" "}
            <span className="font-medium">
              {totalCount}/{maxEmployees}
            </span>
          </div>
          {canAddEmployee(user) && (
            <Button
              color="primary"
              variant="bordered"
              size="sm"
              fullWidth
              className="w-full sm:w-auto order-1 sm:order-2"
              onPress={handleAddEmployee}
            >
              Добавить
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Сетка карточек */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              status={statuses[employee.id]}
            />
          ))}

          {canAddEmployee(user) && totalCount < maxEmployees && (
            <AddEmployeeCard onAddEmployee={handleAddEmployee} />
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeesPage;
