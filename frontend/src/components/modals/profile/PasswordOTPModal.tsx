import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useConfirmChangePassword, useChangePassword } from "@/shared/hooks/useProfile";
import { ChangePasswordRequest } from "@/types";
import { otpConfirmSchema } from "@/config/validationSchemas";
import { getProfileErrorMessage } from "@/shared/utils/profileErrorHandler";

interface PasswordOTPModalProps {
  passwordData: ChangePasswordRequest;
}

export default NiceModal.create<PasswordOTPModalProps>(({ passwordData }) => {
  const modal = useModal();
  const confirmPassword = useConfirmChangePassword();
  const resendPassword = useChangePassword();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { register, handleSubmit, formState: { errors } , reset:resetForm } = useForm<{ otp_code: string }>({
    resolver: yupResolver(otpConfirmSchema),
    defaultValues: { otp_code: "" },
  });

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const onSubmit = async (data: { otp_code: string }) => {
    await confirmPassword.mutateAsync(data.otp_code);
    resetForm()
    modal.hide();
  };

  const handleResend = async () => {
    try {
      await resendPassword.mutateAsync(passwordData);
      setTimer(60);
      setCanResend(false);
      addToast({
        title: 'Успешно',
        description: 'Код отправлен повторно',
        variant: 'flat',
        color: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Ошибка',
        description: getProfileErrorMessage(error as Error),
        variant: 'flat',
        color: 'danger',
      });
    }
  };

  return (
    <Modal isOpen={modal.visible} onOpenChange={modal.hide} size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Подтверждение пароля</ModalHeader>
            <ModalBody>
              <p className="text-sm text-gray-600 mb-4">
                Код подтверждения отправлен на вашу почту
              </p>
              <form onSubmit={handleSubmit(onSubmit)} id="password-otp-form">
                <Input
                  {...register("otp_code")}
                  label="Код подтверждения"
                  placeholder="000000"
                  variant="bordered"
                  maxLength={6}
                  isInvalid={!!errors.otp_code}
                  errorMessage={errors.otp_code?.message}
                />
              </form>
              <div className="mt-3 text-sm text-gray-500">
                {canResend ? (
                  <Button size="sm" variant="light" onPress={handleResend} isLoading={resendPassword.isPending}>
                    Отправить код повторно
                  </Button>
                ) : (
                  <span>Повторная отправка через {timer} сек</span>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="bordered" onPress={onClose}>
                Отменить
              </Button>
              <Button type="submit" form="password-otp-form" color="primary" isLoading={confirmPassword.isPending}>
                Подтвердить
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
});
