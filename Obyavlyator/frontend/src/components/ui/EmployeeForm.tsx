import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { EmployeeRole } from "../../types";

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  password?: string;
  role: EmployeeRole;
}

interface EmployeeFormProps {
  isViewMode?: boolean;
  isEditing?: boolean;
}

/**
 * Общая форма для создания/редактирования сотрудника
 */
const EmployeeForm: React.FC<EmployeeFormProps> = ({ isViewMode = false, isEditing = false }) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<EmployeeFormData>();

  const watchedRole = watch("role");

  return (
    <div className="space-y-4">
      {/* Первый ряд: Имя и Фамилия */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("first_name", {
            required: "Имя обязательно для заполнения",
          })}
          labelPlacement="outside-top"
          label="Имя"
          placeholder="Введите имя"
          variant={isViewMode ? "flat" : "bordered"}
          isReadOnly={isViewMode}
          isInvalid={!!errors.first_name}
          errorMessage={errors.first_name?.message}
        />

        <Input
          {...register("last_name", {
            required: "Фамилия обязательна для заполнения",
          })}
          label="Фамилия"
          placeholder="Введите фамилию"
          variant={isViewMode ? "flat" : "bordered"}
          isReadOnly={isViewMode}
          labelPlacement="outside-top"
          isInvalid={!!errors.last_name}
          errorMessage={errors.last_name?.message}
        />
      </div>

      {/* Второй ряд: Email и Должность */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("email", {
            required: "Email обязателен для заполнения",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Некорректный email адрес",
            },
          })}
          labelPlacement="outside-top"
          label="Email"
          type="email"
          placeholder="Введите email"
          variant={isViewMode ? "flat" : "bordered"}
          isReadOnly={isViewMode}
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
        />

        <Input
          {...register("position")}
          labelPlacement="outside-top"
          label="Должность"
          placeholder="Введите должность"
          variant={isViewMode ? "flat" : "bordered"}
          isReadOnly={isViewMode}
          isInvalid={!!errors.position}
          errorMessage={errors.position?.message}
        />
      </div>

      {/* Третий ряд: Доступ и Пароль */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Доступ"
          placeholder="Выбрать"
          labelPlacement="outside"
          variant={isViewMode ? "flat" : "bordered"}
          isDisabled={isViewMode}
          selectedKeys={watchedRole ? [watchedRole] : []}
          onSelectionChange={(keys) => {
            const selectedRole = Array.from(keys)[0] as EmployeeRole;
            setValue("role", selectedRole, { shouldDirty: true });
          }}
        >
          <SelectItem key="admin">Админ</SelectItem>
          <SelectItem key="employee">Сотрудник</SelectItem>
        </Select>

        {!isViewMode && (
          <Input
            {...register("password", {
              required: isEditing ? false : "Пароль обязателен для заполнения",
              minLength: {
                value: 6,
                message: "Пароль должен содержать минимум 6 символов",
              },
            })}
            labelPlacement="outside-top"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            variant="bordered"
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeForm;
