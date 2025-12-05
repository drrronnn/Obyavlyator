import { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from "@heroui/modal";
import { Tab, Tabs } from "@heroui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Employee, EmployeeUpdate } from "../../../types";
import { useUpdateEmployee, useDeleteEmployee } from "../../../shared/hooks/useEmployees";
import { useAuthStore } from "../../../store/authStore";
import EmployeeStatsCard from "../../ui/EmployeeStatsCard";
import EmployeeForm from "../../ui/EmployeeForm";
import CustomAlert from "@/components/ui/CustomAlert";
import { canEditEmployee, canDeleteEmployee } from "../../../shared/utils/permissions";
import { useUserStats } from "../../../shared/services/statsService";

interface Props {
  employee: Employee;
}

export default NiceModal.create(({ employee }: Props) => {
  const modal = useModal();
  const { user } = useAuthStore();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const [activeTab, setActiveTab] = useState("user_profile");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const defaultRange = useMemo(() => {
    const end = today(getLocalTimeZone());
    const start = end.subtract({ days: 30 });
    return { start, end };
  }, []);
  
  const formatDate = (date: any) => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  };
  
  const [dateRange, setDateRange] = useState({
    start: formatDate(defaultRange.start),
    end: formatDate(defaultRange.end)
  });
  
  const { data: stats, isLoading: isLoadingStats } = useUserStats(
    employee.id,
    dateRange.start,
    dateRange.end
  );

  const canEdit = canEditEmployee(user, employee);
  const canDelete = canDeleteEmployee(user, employee);

  const defaultValues: EmployeeUpdate = {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    position: employee.position || '',
    role: employee.role,
    password: "",
  };

  const methods = useForm<EmployeeUpdate>({
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: EmployeeUpdate) => {
    const updateData = { ...data };
    if (!updateData.password) delete updateData.password;
    
    await updateEmployee.mutateAsync({ id: employee.id, data: updateData });
    modal.hide();
  };

  const handleDeleteClick = () => {
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async (onClose: () => void) => {
    await deleteEmployee.mutateAsync(employee.id);
    setShowDeleteAlert(false);
    onClose();
  };

  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
  };



  return (
    <Modal
      isOpen={modal.visible}
      onOpenChange={() => {
        modal.hide();
        modal.remove();
      }}
      size="lg"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Изменить профиль пользователя
            </ModalHeader>
            <ModalBody>
              <AnimatePresence>
                {showDeleteAlert && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="mb-4 overflow-hidden"
                  >
                    <CustomAlert
                      color="danger"
                      variant="bordered"
                      title="Точно ли вы хотите удалить пользователя?"
                    >
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          color="danger"
                          size="sm"
                          onPress={() => handleConfirmDelete(onClose)}
                        >
                          Уверен
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          onPress={handleCancelDelete}
                        >
                          Отмена
                        </Button>
                      </div>
                    </CustomAlert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Tabs
                aria-label="Employee tabs"
                variant="underlined"
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
              >
                <Tab key="user_profile" title="Профиль">
                  <FormProvider {...methods}>
                    <form
                      onSubmit={methods.handleSubmit(onSubmit)}
                      className="py-2"
                      id="edit-employee-form"
                    >
                      <EmployeeForm isViewMode={!canEdit} isEditing={true} />
                      {canEdit && (
                        <div className="flex justify-end pt-4">
                          <Button
                            type="submit"
                            color="primary"
                            isDisabled={!methods.formState.isDirty}
                            isLoading={updateEmployee.isPending}
                          >
                            Сохранить изменения
                          </Button>
                        </div>
                      )}
                    </form>
                  </FormProvider>
                </Tab>

                <Tab key="user_stats" title="Статистика">
                  <div className="pt-4 space-y-4">
                    <DateRangePicker 
                      label="Период статистики"
                      defaultValue={defaultRange}
                      onChange={(value) => {
                        if (value?.start && value?.end) {
                          setDateRange({
                            start: formatDate(value.start),
                            end: formatDate(value.end)
                          });
                        }
                      }}
                    />

                    <EmployeeStatsCard 
                      stats={stats || { total_ads: 0, our_apartments: 0, conversion: 0 }} 
                      isLoading={isLoadingStats}
                    />
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              {canDelete && (
                <Button
                  color="danger"
                  onPress={handleDeleteClick}
                  disabled={showDeleteAlert}
                  isDisabled={showDeleteAlert}
                  isLoading={deleteEmployee.isPending}
                >
                  Удалить сотрудника
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});
