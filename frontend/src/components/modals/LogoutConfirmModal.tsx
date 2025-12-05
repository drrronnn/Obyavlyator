import { useAuthStore } from "@/store/authStore";

import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@heroui/modal";

import { useNavigate } from "react-router-dom";
import NiceModal, { useModal } from "@ebay/nice-modal-react";

export default NiceModal.create(() => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const modal = useModal();

  const handleLogout = (onClose: () => any) => {
    logout();
    navigate("/auth/login");
    onClose();
  };

  return (
    <>
      <Modal isOpen={modal.visible} onOpenChange={modal.hide} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Уверены что хотите выйти?
              </ModalHeader>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  Нет
                </Button>
                <Button color="danger" onPress={() => handleLogout(onClose)}>
                  Да
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
});
