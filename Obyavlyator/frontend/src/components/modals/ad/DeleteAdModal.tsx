import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@heroui/modal";
import NiceModal, { useModal } from "@ebay/nice-modal-react";

interface DeleteAdModalProps {
  isLoading?: boolean;
  onConfirm: (close: () => any) => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

const DeleteAdModal = NiceModal.create<DeleteAdModalProps>(
  ({ onConfirm, isLoading, title, confirmText = "Да", cancelText = "Нет" }) => {
    const modal = useModal();

    const handleConfirm = () => {
      onConfirm(modal.hide);
    };

    const handleClose = (onClose: () => any) => () => {
      modal.hide();
      onClose();
    };

    return (
      <Modal isOpen={modal.visible} onOpenChange={modal.hide} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {title || "Уверены что хотите удалить объявление?"}
              </ModalHeader>
              <ModalFooter>
                <Button
                  color="primary"
                  variant="light"
                  onPress={handleClose(onClose)}
                >
                  {cancelText}
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirm}
                  isLoading={isLoading}
                >
                  {confirmText}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
);

export default DeleteAdModal;
