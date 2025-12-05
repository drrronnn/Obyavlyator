import React, { useMemo, useCallback } from "react";
import { Slider } from "@heroui/slider";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import {
  dealTypeOptions,
  sourceOptions,
  adStatusOptions,
} from "@/shared/constants/ads";
import { useCachedValue } from "@/shared/hooks/useCachedValue";
import { useEmployees } from "@/shared/hooks/useEmployees";

export interface FilterFormData {
  priceRange: [number, number];
  areaRange: [number, number];
  rooms: string[];
  dealType: string;
  source: string;
  status: string;
  responsible: string;
  search: string;
}

interface FilterFormProps {
  filters: FilterFormData;
  setFilters: (filters: FilterFormData) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  isLoading?: boolean;
  stats?: {
    max_price: number;
    max_meters: number;
  };
  hideFilters?: string[];
  priceStep?: number;
}

export const FilterForm: React.FC<FilterFormProps> = React.memo(({
  filters,
  setFilters,
  resetFilters,
  applyFilters,
  isLoading = false,
  stats,
  hideFilters = [],
  priceStep = 100_000,
}) => {
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesData?.employees || [];
  const maxPrice = useCachedValue(stats?.max_price);
  const maxMeters = useCachedValue(stats?.max_meters);

  const handlePriceChange = useCallback((value: number | number[]) => {
    const range = Array.isArray(value) ? value : [value, value];
    setFilters({ ...filters, priceRange: [range[0], range[1]] });
  }, [filters, setFilters]);

  const handleAreaChange = useCallback((value: number | number[]) => {
    const range = Array.isArray(value) ? value : [value, value];
    setFilters({ ...filters, areaRange: [range[0], range[1]] });
  }, [filters, setFilters]);

  const handleRoomsChange = useCallback((values: string[]) => {
    setFilters({ ...filters, rooms: values });
  }, [filters, setFilters]);

  const handleDealTypeChange = useCallback((value: string) => {
    setFilters({ ...filters, dealType: value });
  }, [filters, setFilters]);

  const handleSourceChange = useCallback((value: string) => {
    setFilters({ ...filters, source: value });
  }, [filters, setFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setFilters({ ...filters, status: value });
  }, [filters, setFilters]);

  const handleResponsibleChange = useCallback((value: string) => {
    setFilters({ ...filters, responsible: value });
  }, [filters, setFilters]);

  return (
    <div className="space-y-6 p-4">
      {/* Первая строка: Тип сделки | Стоимость | Кол-во комнат | Статус */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="space-y-6 lg:space-y-12">
          {!hideFilters.includes('dealType') && (
            <Select
              placeholder="Выберите тип"
              label="Тип сделки"
              labelPlacement="outside"
              selectedKeys={filters.dealType ? [filters.dealType] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleDealTypeChange(value || "");
              }}
            >
              {dealTypeOptions.map((type) => (
                <SelectItem key={type.uid}>{type.name}</SelectItem>
              ))}
            </Select>
          )}
          <Select
            placeholder="Выберите источник"
            label="Источник"
            labelPlacement="outside"
            selectedKeys={filters.source ? [filters.source] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              handleSourceChange(value || "");
            }}
          >
            {sourceOptions.map((source) => (
              <SelectItem key={source.uid}>{source.name}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Вторая колонка: Слайдеры */}
        <div className="space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <Slider
              label="Стоимость (₽)"
              step={priceStep}
              minValue={0}
              maxValue={maxPrice}
              getValue={(prices) =>
                `От ${(prices as number[])?.[0]?.toLocaleString()} До ${(prices as number[])?.[1].toLocaleString()} ₽ `
              }
              renderValue={({ children, ...props }) => (
                <output
                  {...props}
                  className="text-[12px] text-gray-500 relative w-1/2"
                >
                  <div className="absolute -top-5 right-0 w-full">
                    {children}
                  </div>
                </output>
              )}
              value={filters?.priceRange}
              onChange={handlePriceChange}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Slider
              label="Площадь (м²)"
              step={1}
              minValue={0}
              maxValue={maxMeters}
              getValue={(meters) =>
                `От ${(meters as number[])?.[0]} До ${(meters as number[])?.[1]} м² `
              }
              renderValue={({ children, ...props }) => (
                <output {...props} className="text-gray-500 relative w-1/2">
                  {children}
                </output>
              )}
              value={filters.areaRange}
              onChange={handleAreaChange}
              className="w-full"
            />
            {/* <div className="flex justify-between text-xs text-gray-500">
              <span>От {filters.areaRange[0]}</span>
              <span>До {filters.areaRange[1] || stats?.max_meters}</span>
            </div> */}
          </div>
        </div>

        {/* Третья колонка: Количество комнат */}
        <div className="space-y-2">
          <CheckboxGroup
            label="Кол-во комнат"
            value={filters.rooms}
            onValueChange={handleRoomsChange}
            classNames={{
              wrapper: "grid grid-cols-2 sm:grid-cols-1 gap-2",
            }}
          >
            <Checkbox value="studio">Студия</Checkbox>
            <Checkbox value="1">1-комн.</Checkbox>
            <Checkbox value="2">2-комн.</Checkbox>
            <Checkbox value="3">3-комн.</Checkbox>
            <Checkbox value="4+">4+ комн.</Checkbox>
          </CheckboxGroup>
        </div>

        {/* Четвертая колонка: Статус и Ответственный */}
        <div className="space-y-6 lg:space-y-12">
          <Select
            placeholder="Выберите статус"
            label="Статус"
            labelPlacement="outside"
            selectedKeys={filters.status ? [filters.status] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              handleStatusChange(value || "");
            }}
          >
            {adStatusOptions.map((status) => (
              <SelectItem key={status.uid}>{status.name}</SelectItem>
            ))}
          </Select>
          <Select
            placeholder="Выберите ответственного"
            label="Ответственный"
            labelPlacement="outside"
            selectedKeys={filters.responsible ? [filters.responsible] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              handleResponsibleChange(value || "");
            }}
            isLoading={isLoadingEmployees}
            renderValue={() => {
              const selected = employees.find(e => e.id === filters.responsible);
              return selected ? `${selected.first_name} ${selected.last_name}` : "Выберите ответственного";
            }}
          >
            {employees.map((employee) => (
              <SelectItem key={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="flat" onPress={resetFilters} className="text-sm">
          Сбросить фильтры
        </Button>
        <Button
          color="primary"
          onPress={applyFilters}
          className="text-sm"
          isLoading={isLoading}
        >
          Применить фильтры
        </Button>
      </div>
    </div>
  );
});
