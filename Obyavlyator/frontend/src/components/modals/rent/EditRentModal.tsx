import React from "react";
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
import { useUpdateRent } from "@/shared/hooks/useRent";
import { useRentListing } from "@/shared/hooks/useRentListing";
import { parseDate } from "@internationalized/date";
import { Ad } from "@/shared/constants/ads";

interface EditRentModalProps {
  listingId: string;
  ad: Ad;
}

const EditRentModal = NiceModal.create<EditRentModalProps>(({ listingId, ad }) => {
  const modal = useModal();
  const updateRent = useUpdateRent();
  const { data: rentListing, isLoading } = useRentListing(listingId);

  console.log('rentListing', rentListing);

  const methods = useForm<MoveToRentData>({
    mode: "onChange",
    defaultValues: {
      tenantFirstName: "",
      tenantLastName: "",
      tenantPhone: "",
      rentPrice: 0,
      rentDates: null,
      responsibleEmployee: "",
    },
    shouldUnregister: false,
  });

  React.useEffect(() => {
    if (rentListing && modal.visible) {
      methods.reset({
        tenantFirstName: rentListing.tenant_first_name,
        tenantLastName: rentListing.tenant_last_name,
        tenantPhone: rentListing.tenant_phone,
        rentPrice: rentListing.rent_price,
        rentDates: {
          start: parseDate(rentListing.rent_start_date),
          end: parseDate(rentListing.rent_end_date),
        },
        responsibleEmployee: rentListing.responsible_user_id || "",
      });
    }
  }, [rentListing, modal.visible]);

  const handleSubmit = (data: MoveToRentData) => {
    if (!data.rentDates || !rentListing) return;

    updateRent.mutate({
      listingId: rentListing.listing_id,
      data: {
        tenant_first_name: data.tenantFirstName,
        tenant_last_name: data.tenantLastName,
        tenant_phone: data.tenantPhone,
        rent_price: data.rentPrice,
        rent_start_date: data.rentDates.start.toString(),
        rent_end_date: data.rentDates.end.toString(),
        responsible_user_id: data.responsibleEmployee || undefined,
      }
    }, {
      onSuccess: () => {
        modal.hide();
        methods.reset();
      }
    });
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
          <span className="text-lg font-semibold">Изменить данные аренды</span>
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
          {!rentListing ? (
            <div className="flex justify-center py-8">
              <span>Загрузка...</span>
            </div>
          ) : (
            <FormProvider {...methods}>
              <MoveToRentForm
                ad={ad}
                onSubmit={methods.handleSubmit(handleSubmit)}
                onCancel={handleCancel}
              />
            </FormProvider>
          )}
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
              Сохранить
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default EditRentModal;
