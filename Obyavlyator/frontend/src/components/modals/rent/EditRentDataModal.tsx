import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { MoveToRentForm, MoveToRentData } from "../../ui/MoveToRentForm";
import { Ad } from "@/shared/constants/ads";

interface EditRentDataModalProps {
  ad: Ad;
  onConfirm: (ad: Ad, data: MoveToRentData) => void;
}

const EditRentDataModal = NiceModal.create<EditRentDataModalProps>(
  ({ ad, onConfirm }) => {
    const modal = useModal();

    const methods = useForm<MoveToRentData>({
      mode: "onChange",
      defaultValues: {
        ownerName: "",
        ownerPhone: "",
        tenantName: "",
        tenantPhone: "",
        rentPrice: "",
        rentDates: null,
        responsibleEmployee: "",
      },
    });

    const handleSubmit = (data: MoveToRentData) => {
      onConfirm(ad, data);
      modal.hide();
      methods.reset();
    };

    const handleCancel = () => {
      modal.hide();
      methods.reset();
    };

    return (
      <Modal
        isOpen={modal.visible}
        onClose={modal.hide}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-w-2xl",
          header: "border-b border-gray-200",
          body: "py-6",
        }}
        hideCloseButton
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-between">
            <span className="text-lg font-semibold">Изменить данные</span>
            <Button
              isIconOnly
              variant="light"
              onPress={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </ModalHeader>
          <ModalBody>
            <FormProvider {...methods}>
              <MoveToRentForm
                ad={ad}
                onSubmit={methods.handleSubmit(handleSubmit)}
                onCancel={handleCancel}
              />
            </FormProvider>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                type="button"
                variant="light"
                onPress={handleCancel}
                className="px-8"
                fullWidth
              >
                Отмена
              </Button>
              <Button
                type="submit"
                color="primary"
                isDisabled={!methods.formState.isValid}
                className="px-8"
                fullWidth
                form="move-to-rent-form"
              >
                Изменить
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

export default EditRentDataModal;