import React, { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { Select, SelectItem } from "@heroui/select";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { ICONS } from "@/config/constants";
import { RentListing } from "@/shared/services/rentService";
import { useEmployees } from "@/shared/hooks/useEmployees";
import { useUpdateRent, useRemoveFromRent } from "@/shared/hooks/useRent";
import { dealTypeOptions } from "@/shared/constants/ads";
import NiceModal from "@ebay/nice-modal-react";

export const rentColumns = [
  { name: "ДАТА СЪЕМА", uid: "rentDates" },
  { name: "СЪЕМЩИК", uid: "tenant" },
  { name: "ОТВЕТСТВЕННЫЙ", uid: "responsible" },
  { name: "ОБЪЕКТ", uid: "object" },
  { name: "АДРЕС", uid: "address" },
  { name: "СТОИМОСТЬ", uid: "price" },
  { name: "КОНТАКТ", uid: "contact" },
  { name: "ДЕЙСТВИЯ", uid: "actions" },
];

interface RentTableProps {
  rentListings?: RentListing[];
  isLoading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function RentTable({
  rentListings = [],
  isLoading = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}: RentTableProps) {
  const [page, setPage] = useState(currentPage);
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesData?.employees || [];
  const updateRent = useUpdateRent();
  const removeFromRent = useRemoveFromRent();

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  const handleResponsibleChange = (listingId: string, responsible: string) => {
    updateRent.mutate({
      listingId,
      data: { responsible_user_id: responsible }
    });
  };

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, "_blank");
  };

  const handleRemove = (listingId: string) => {
    NiceModal.show("delete-ad-modal", {
      title: "Убрать данное объявление из сдается?",
      confirmText: "Убрать",
      cancelText: "Отмена",
      isLoading: removeFromRent.isPending,
      onConfirm: (close: () => any) => {
        removeFromRent.mutate(listingId, {
          onSuccess: () => {
            close();
          }
        });
      },
    });
  };

  const formatDateRange = (startDate: string, endDate: string, isEnding: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString("ru-RU");
    const endStr = end.toLocaleDateString("ru-RU");
    
    if (isEnding) {
      return (
        <>
          {startStr} - <span className="text-red-600 font-semibold">{endStr}</span>
        </>
      );
    }
    
    return `${startStr} - ${endStr}`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU") + " ₽ / мес.";
  };

  const getObjectInfo = (listing: RentListing) => {
    const dealTypeName = dealTypeOptions.find((d) => d.uid === "rent")?.name || "Аренда";
    const roomsText = listing.rooms === 0 ? "Студия" : `${listing.rooms}-комн.`;
    return `${dealTypeName}, ${roomsText}`;
  };

  const isEndingSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 5 && daysLeft >= 0;
  };

  const renderCell = useCallback((listing: RentListing, columnKey: React.Key) => {
    switch (columnKey) {
      case "rentDates":
        return (
          <span className="text-small">
            {formatDateRange(listing.rent_start_date, listing.rent_end_date, isEndingSoon(listing.rent_end_date))}
          </span>
        );
      case "tenant":
        return (
          <span className="text-small">
            {listing.tenant_first_name} {listing.tenant_last_name}
          </span>
        );
      case "responsible":
        const selectedEmployee = employees.find(e => e.id === listing.responsible_user_id);
        const displayValue = selectedEmployee
          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
          : "Не назначен";

        return (
          <Select
            size="md"
            color="secondary"
            placeholder="Не назначен"
            selectedKeys={listing.responsible_user_id ? [listing.responsible_user_id] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value) {
                handleResponsibleChange(listing.listing_id, value);
              }
            }}
            className="min-w-[140px]"
            isLoading={isLoadingEmployees}
            renderValue={() => <span className="text-small">{displayValue}</span>}
          >
            {employees.map((employee) => (
              <SelectItem key={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </Select>
        );
      case "object":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{getObjectInfo(listing)}</p>
            <p className="text-bold text-tiny text-default-400">
              {listing.area} м², {listing.floor} этаж
            </p>
          </div>
        );
      case "address":
        return <span className="text-small">{listing.address}</span>;
      case "price":
        return (
          <span className="text-bold text-small">
            {formatPrice(listing.rent_price)}
          </span>
        );
      case "contact":
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              radius="full"
              onPress={() => handlePhoneCall(listing.tenant_phone)}
              className="text-green-600"
              color="success"
            >
              <ICONS.phone className="w-4 h-4 text-white" />
            </Button>
            <span className="text-small">{listing.tenant_phone}</span>
          </div>
        );
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <ICONS.moreVertical className="w-5 h-5 text-gray-500" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="open-link"
                startContent={<ICONS.externalLink className="w-4 h-4" />}
                onPress={() => window.open(listing.url, "_blank")}
              >
                Просмотреть
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<ICONS.edit className="w-4 h-4" />}
                onPress={() => {
                  NiceModal.show("edit-rent-modal", {
                    listingId: listing.listing_id.toString(),
                    ad: listing,
                  });
                }}
              >
                Изменить данные
              </DropdownItem>
              <DropdownItem
                key="download"
                startContent={<ICONS.download className="w-4 h-4" />}
              >
                Скачать фотографии
              </DropdownItem>
              <DropdownItem
                key="remove"
                className="text-danger"
                color="danger"
                startContent={<ICONS.delete className="w-4 h-4" />}
                onPress={() => handleRemove(listing.listing_id)}
              >
                Убрать из сдается
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return null;
    }
  }, [employees, isLoadingEmployees]);

  return (
    <Table
      aria-label="Таблица арендованных объявлений"
      bottomContent={
        totalPages > 1 ? (
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={totalPages}
              onChange={(newPage) => {
                setPage(newPage);
                onPageChange?.(newPage);
              }}
            />
          </div>
        ) : null
      }
      classNames={{
        wrapper: "min-h-[400px]",
      }}
    >
      <TableHeader columns={rentColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        isLoading={isLoading}
        loadingContent={<Spinner />}
        emptyContent={"Арендованные объявления не найдены"}
        items={rentListings}
      >
        {(item) => (
          <TableRow 
            key={item.rent_id}
            className={isEndingSoon(item.rent_end_date) ? "bg-red-100" : ""}
          >
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
