import React, { useState, useCallback, useEffect } from "react";
import NiceModal from "@ebay/nice-modal-react";
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
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";

import {
  Ad,
  dealTypeOptions,
  sourceOptions,
  adStatusOptions,
} from "@/shared/constants/ads";
import { useEmployees } from "@/shared/hooks/useEmployees";
import { ICONS } from "@/config/constants";
import { useFavoritesWebSocket } from "@/shared/hooks/useFavoritesWebSocket";
import { useUpdateListingMetadata } from "@/shared/hooks/useListingMetadata";
import { useDownloadPhotos } from "@/shared/hooks/useDownloadPhotos";
import { useRemoveFromRent } from "@/shared/hooks/useRent";
import { useDeleteListing } from "@/shared/hooks/useDeleteListing";
import { useAuthStore } from "@/store/authStore";

export const columns = [
  { name: "ДАТА И ВРЕМЯ", uid: "createdAt", sortable: true },
  { name: "ОБЪЕКТ", uid: "object" },
  { name: "АДРЕС", uid: "address" },
  { name: "СТОИМОСТЬ", uid: "price", sortable: true },
  { name: "ИСТОЧНИК", uid: "source" },
  { name: "ОТВЕТСТВЕННЫЙ", uid: "responsible" },
  { name: "СТАТУС", uid: "status" },
  { name: "ДЕЙСТВИЯ", uid: "actions" },
];

interface AdsTableProps {
  ads?: Ad[];
  isLoading?: boolean;
  searchQuery?: string;
  variant?: "default" | "rent";
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onResponsibleChange?: () => void;
}

const sourceColorMap = {
  cian: "primary",
  avito: "success",
} as const;

export function AdsTable({
  ads,
  isLoading = false,
  searchQuery = "",
  variant = "default",
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  onResponsibleChange,
}: AdsTableProps) {
  const [page, setPage] = useState(currentPage);
  const { toggleFavorite } = useFavoritesWebSocket();
  const updateMetadata = useUpdateListingMetadata();
  const downloadPhotos = useDownloadPhotos();
  const removeFromRent = useRemoveFromRent();
  const deleteListing = useDeleteListing();
  const { user } = useAuthStore();
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesData?.employees || [];

  const filteredAds = React.useMemo(() => {
    if (!ads) return [];
    if (!searchQuery.trim()) return ads;

    return ads.filter((ad) =>
      ad.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ads, searchQuery]);

  // Update page when currentPage prop changes
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Reset to first page when search changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setPage(1);
      onPageChange?.(1);
    }
  }, [searchQuery, onPageChange]);

  const handleStatusChange = (adId: number | string, status: string) => {
    updateMetadata.mutate({
      listingId: adId.toString(),
      data: { status }
    });
  };

  const handleResponsibleChange = (
    adId: number | string,
    responsible: string
  ) => {
    updateMetadata.mutate({
      listingId: adId.toString(),
      data: { responsible_user_id: responsible }
    }, {
      onSuccess: () => {
        onResponsibleChange?.();
      }
    });
  };

  const handleFavoriteToggle = (
    adId: number | string | string,
    isFavorite: boolean
  ) => {
    toggleFavorite(adId.toString(), isFavorite);
  };

  const handlePhoneCall = (ad: Ad) => {
    window.open(`tel:${ad?.phone_number}`, "_blank");
    console.log(ad.phone_number);
  };

  const handleDownloadPhotos = (adId: number | string) => {
    downloadPhotos.mutate(adId.toString());
  };

  const handleMoveToRent = (ad: Ad) => {
    NiceModal.show("move-to-rent-modal", {
      ad,
    });
  };

  const handleDelete = (adId: number | string | string) => {
    NiceModal.show("delete-ad-modal", {
      title: "Удалить объявление?",
      confirmText: "Удалить",
      cancelText: "Отмена",
      isLoading: deleteListing.isPending,
      onConfirm: (close: () => any) => {
        deleteListing.mutate(adId.toString(), {
          onSuccess: () => {
            close();
          }
        });
      },
    });
  };

  const handleEditRentData = (ad: Ad) => {
    NiceModal.show("edit-rent-modal", {
      listingId: ad.id.toString(),
      ad,
    });
  };

  const handleRemoveFromRent = (adId: number | string) => {
    NiceModal.show("delete-ad-modal", {
      title: "Убрать данное объявление из сдается?",
      confirmText: "Убрать",
      cancelText: "Отмена",
      isLoading: removeFromRent.isPending,
      onConfirm: (close: () => any) => {
        removeFromRent.mutate(adId.toString(), {
          onSuccess: () => {
            close();
          }
        });
      },
    });
  };

  console.log(filteredAds , 'filteredAds')

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const formatPrice = (price: number, isRent: boolean) => {
    return price.toLocaleString("ru-RU") + " ₽" + (isRent ? " / мес." : "");
  };

  const getObjectInfo = (ad: Ad) => {
    const dealTypeName =
      dealTypeOptions.find((d) => d.uid === ad.dealType)?.name || ad.dealType;
    const roomsText = ad.rooms === 0 ? "Студия" : `${ad.rooms}-комн.`;
    return `${dealTypeName}, ${roomsText}`;
  };

  const getSourceName = (source: string) => {
    return sourceOptions.find((s) => s.uid === source)?.name || source;
  };

  const renderCell = useCallback((ad: Ad, columnKey: React.Key) => {
    const cellValue = ad[columnKey as keyof Ad];

    switch (columnKey) {
      case "createdAt":
        return (
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => handleFavoriteToggle(ad.id, ad.isFavorite)}
              className="min-w-unit-8 w-unit-8 h-unit-8"
            >
              {ad.isFavorite ? (
                <ICONS.heartFilled className="w-4 h-4 text-red-500" />
              ) : (
                <ICONS.heart className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <span className="text-small">{formatDateTime(ad.createdAt)}</span>
          </div>
        );
      case "object":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{getObjectInfo(ad)}</p>
            <p className="text-bold text-tiny text-default-400">{ad.area} м²</p>
          </div>
        );
      case "address":
        return <span className="text-small">{ad.address}</span>;
      case "price":
        return (
          <span className="text-bold text-small">
            {formatPrice(ad.price, ad.dealType === "rent")}
          </span>
        );
      case "source":
        return (
          <Chip
            className="capitalize"
            color={sourceColorMap[ad.source as keyof typeof sourceColorMap]}
            size="lg"
            variant="flat"
          >
            {getSourceName(ad.source)}
          </Chip>
        );
      case "responsible":
        const selectedEmployee = employees.find(e => e.id === ad.responsible);
        const displayValue = selectedEmployee
          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
          : "Не назначен";

        return (
          <Select
            size="md"
            color="secondary"
            placeholder="Не назначен"
            selectedKeys={ad.responsible ? [ad.responsible] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              if (value) {
                handleResponsibleChange(ad.id, value);
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
      case "status":
        return (
          <Select
            size="md"
            variant="faded"
            selectedKeys={[ad.status]}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              handleStatusChange(ad.id, value);
            }}
            className="min-w-[120px]"
          >
            {adStatusOptions.map((status) => (
              <SelectItem key={status.uid}>{status.name}</SelectItem>
            ))}
          </Select>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content={ad.phone_number || "Номер не указан"} placement="top">
              <Button
                isIconOnly
                size="sm"
                radius="full"
                onPress={() => handlePhoneCall(ad)}
                className="text-green-600"
                color="success"
              >
                <ICONS.phone className="w-4 h-4 text-white" />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <ICONS.moreVertical className="w-5 h-5 text-gray-500" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                {ad.is_in_rent ? (
                  <>
                    <DropdownItem
                      key="open-link"
                      startContent={<ICONS.externalLink className="w-4 h-4" />}
                      onPress={() => window.open(ad.url, "_blank")}
                    >
                      Просмотреть
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      startContent={<ICONS.edit className="text-lg" />}
                      onPress={() => handleEditRentData(ad)}
                    >
                      Изменить
                    </DropdownItem>
                    <DropdownItem
                      key="download"
                      startContent={<ICONS.download className="w-4 h-4" />}
                      onPress={() => handleDownloadPhotos(ad.id)}
                      isDisabled={downloadPhotos.isPending}
                    >
                      {downloadPhotos.isPending ? 'Загрузка...' : 'Скачать фотографии'}
                    </DropdownItem>
                    <DropdownItem
                      key="remove"
                      className="text-danger"
                      color="danger"
                      startContent={<ICONS.delete className="w-4 h-4" />}
                      onPress={() => handleRemoveFromRent(ad.id)}
                    >
                      Убрать из сдается
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownItem
                      key="open-link"
                      startContent={<ICONS.externalLink className="w-4 h-4" />}
                      onPress={() => window.open(ad.url, "_blank")}
                    >
                      Открыть объявление
                    </DropdownItem>
                    <DropdownItem
                      key="download"
                      startContent={<ICONS.download className="w-4 h-4" />}
                      onPress={() => handleDownloadPhotos(ad.id)}
                      isDisabled={downloadPhotos.isPending}
                    >
                      {downloadPhotos.isPending ? 'Загрузка...' : 'Скачать фотографии'}
                    </DropdownItem>
                    <DropdownItem
                      key="move"
                      startContent={<ICONS.rent className="w-4 h-4" />}
                      onPress={() => handleMoveToRent(ad)}
                    >
                      Переместить в сдается
                    </DropdownItem>
                    {user?.role === "admin" && (
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<ICONS.delete className="w-4 h-4" />}
                        onPress={() => handleDelete(ad.id)}
                      >
                        Неактуально
                      </DropdownItem>
                    )}
                  </>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, [employees]);


  return (
    <Table
      aria-label="Таблица объявлений"
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
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        isLoading={isLoading}
        loadingContent={<Spinner />}
        emptyContent={"Объявления не найдены"}
        items={filteredAds}
      >
        {(item) => (
          <TableRow
            key={item.id}
            // className={item.isNew ? "bg-success-50" : item.is_in_rent ? "bg-yellow-50" : ""}
            className={ item.is_in_rent ? "bg-yellow-50" : ""}
          >
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
