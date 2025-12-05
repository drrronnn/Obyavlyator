import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from "@heroui/modal";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { EmployeeCreate } from "../../../types";
import { useCreateEmployee } from "../../../shared/hooks/useEmployees";
import EmployeeForm from "../../ui/EmployeeForm";

export default NiceModal.create(() => {
  const modal = useModal();
  const createEmployee = useCreateEmployee();

  const methods = useForm<EmployeeCreate>({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      position: "",
      password: "",
      role: "employee",
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const onSubmit = async (data: EmployeeCreate) => {
    await createEmployee.mutateAsync(data);
    modal.hide();
  };

  return (
    <Modal isOpen={modal.visible} onOpenChange={modal.hide} size="lg">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Добавить пользователя
            </ModalHeader>
            <ModalBody>
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} id="add-employee-form">
                  <EmployeeForm />
                </form>
              </FormProvider>
            </ModalBody>
            <ModalFooter>
              <Button
                type="submit"
                form="add-employee-form"
                color="primary"
                isDisabled={!isValid}
                isLoading={createEmployee.isPending}
              >
                Добавить
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});
