import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { Select, SelectItem } from "@heroui/select";
import { DateRangePicker } from "@heroui/date-picker";
import { Ad } from "@/shared/constants/ads";
import { useEmployees } from "@/shared/hooks/useEmployees";

interface MoveToRentFormProps {
  ad: Ad;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface MoveToRentData {
  tenantFirstName: string;
  tenantLastName: string;
  tenantPhone: string;
  rentPrice: number;
  rentDates: { start: any; end: any } | null;
  responsibleEmployee: string;
}

export const MoveToRentForm: React.FC<MoveToRentFormProps> = ({
  ad,
  onSubmit,
}) => {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<MoveToRentData>();

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees();
  const employees = employeesData?.employees || [];
  const watchedValues = watch();

  return (
    <form onSubmit={onSubmit} className="space-y-6" id="move-to-rent-form">
      {/* Информация об объекте */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-blue-600">{ad.address}</h3>
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
          <span className="text-sm text-gray-600">Площадь Ильича</span>
        </div>
        <p className="text-sm text-gray-500">
          Квартира, {ad.area} м²,{" "}
          {ad.rooms === 0 ? "Студия" : `${ad.rooms} этаж`} (Аренда, Жилая)
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Недвижимость сдается</h2>
        <p className="text-sm text-gray-500 mb-6">
          Заполните необходимую информацию, чтобы
          <br />
          отслеживать сданную недвижимость
        </p>
      </div>

      {/* Форма */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="tenantFirstName"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <Input
                label="Имя съемщика"
                labelPlacement="outside"
                placeholder="Василий"
                value={field.value}
                onChange={field.onChange}
                isInvalid={!!errors.tenantFirstName}
                errorMessage={errors.tenantFirstName?.message}
              />
            )}
          />
          <Controller
            name="tenantLastName"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <Input
                label="Фамилия съемщика"
                labelPlacement="outside"
                placeholder="Кукушкин"
                value={field.value}
                onChange={field.onChange}
                isInvalid={!!errors.tenantLastName}
                errorMessage={errors.tenantLastName?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="rentPrice"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <NumberInput
                label="Стоимость сдачи жилья"
                labelPlacement="outside"
                placeholder="100000"
                value={field.value}
                onValueChange={field.onChange}
                formatOptions={{
                  style: "currency",
                  currency: "RUB",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                  currencyDisplay: "symbol",
                }}
                isInvalid={!!errors.rentPrice}
                errorMessage={errors.rentPrice?.message}
              />
            )}
          />
          <Controller
            name="rentDates"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <DateRangePicker
                label="Даты съема"
                labelPlacement="outside"
                value={field.value}
                onChange={field.onChange}
                isInvalid={!!errors.rentDates}
                errorMessage={errors.rentDates?.message}
                showMonthAndYearPickers
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="tenantPhone"
            control={control}
            rules={{ required: "Обязательное поле" }}
            render={({ field }) => (
              <Input
                label="Номер телефона съемщика"
                labelPlacement="outside"
                placeholder="+7 915 842 88 30"
                value={field.value}
                onChange={field.onChange}
                isInvalid={!!errors.tenantPhone}
                errorMessage={errors.tenantPhone?.message}
              />
            )}
          />
          <Select
            label="Ответственный сотрудник"
            labelPlacement="outside"
            placeholder="Выбрать"
            selectedKeys={
              watchedValues.responsibleEmployee
                ? [watchedValues.responsibleEmployee]
                : []
            }
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              setValue("responsibleEmployee", value, { shouldValidate: true });
            }}
            isInvalid={!!errors.responsibleEmployee}
            errorMessage={errors.responsibleEmployee?.message}
            isLoading={isLoadingEmployees}
            renderValue={(items) => {
              const selectedEmployee = employees.find(e => e.id === watchedValues.responsibleEmployee);
              return selectedEmployee ? (
                <span className="text-small">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </span>
              ) : <span className="text-small text-gray-400">Выбрать</span>;
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
    </form>
  );
};
