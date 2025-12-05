import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import NiceModal from "@ebay/nice-modal-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/ui/PageHeader";
import { useAuthStore } from "../store/authStore";
import {
  useUpdateProfile,
  useChangeEmail,
  useChangePassword,
} from "../shared/hooks/useProfile";
import {
  UpdateProfileRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
} from "../types";
import {
  updateProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
} from "../config/validationSchemas";

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const profileForm = useForm<UpdateProfileRequest>({
    resolver: yupResolver(updateProfileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    },
  });

  const emailForm = useForm<ChangeEmailRequest>({
    resolver: yupResolver(changeEmailSchema),
    defaultValues: {
      new_email: "",
      current_password: "",
    },
  });

  const passwordForm = useForm<ChangePasswordRequest>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      new_password: "",
    },
  });

  const onProfileSubmit = async (data: UpdateProfileRequest) => {
    await updateProfile.mutateAsync(data);
    setIsEditingProfile(false);
    profileForm.reset({
      first_name: data.first_name,
      last_name: data.last_name,
    });
  };

  const onEmailSubmit = async (data: ChangeEmailRequest) => {
    await changeEmail.mutateAsync(data);
    setIsEditingEmail(false);
    NiceModal.show("email-otp-modal", { emailData: data });
    emailForm.reset();
  };

  const onPasswordSubmit = async (data: ChangePasswordRequest) => {
    await changePassword.mutateAsync(data);
    setIsEditingPassword(false);
    NiceModal.show("password-otp-modal", { passwordData: data });
    passwordForm.reset();
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader title="Профиль" />

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Основная информация
            </h2>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <Input
                    {...profileForm.register("first_name", {
                      required: "Имя обязательно",
                    })}
                    isDisabled={!isEditingProfile}
                    variant="bordered"
                    isInvalid={!!profileForm.formState.errors.first_name}
                    errorMessage={
                      profileForm.formState.errors.first_name?.message
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <Input
                    {...profileForm.register("last_name", {
                      required: "Фамилия обязательна",
                    })}
                    isDisabled={!isEditingProfile}
                    variant="bordered"
                    isInvalid={!!profileForm.formState.errors.last_name}
                    errorMessage={
                      profileForm.formState.errors.last_name?.message
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3">
                {!isEditingProfile ? (
                  <Button
                    color="primary"
                    type="button"
                    variant="light"
                    onPress={() => setIsEditingProfile(true)}
                  >
                    Изменить
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      color="primary"
                      isLoading={updateProfile.isPending}
                      isDisabled={!profileForm.formState.isDirty}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="bordered"
                      onPress={() => {
                        setIsEditingProfile(false);
                        profileForm.reset({
                          first_name: user?.first_name || "",
                          last_name: user?.last_name || "",
                        });
                      }}
                    >
                      Отменить
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Безопасность */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Безопасность
            </h2>

            {/* Изменение Email */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Email</h3>
              <p className="text-sm text-gray-500 mb-3">
                Текущий: {user?.email}
              </p>
              {!isEditingEmail ? (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsEditingEmail(true)}
                >
                  Изменить email
                </Button>
              ) : (
                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-3"
                >
                  <Input
                    {...emailForm.register("new_email", {
                      required: "Email обязателен",
                    })}
                    type="email"
                    label="Новый email"
                    variant="bordered"
                    isInvalid={!!emailForm.formState.errors.new_email}
                    errorMessage={emailForm.formState.errors.new_email?.message}
                  />
                  <Input
                    {...emailForm.register("current_password", {
                      required: "Пароль обязателен",
                    })}
                    type="password"
                    label="Текущий пароль"
                    variant="bordered"
                    isInvalid={!!emailForm.formState.errors.current_password}
                    errorMessage={
                      emailForm.formState.errors.current_password?.message
                    }
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      color="primary"
                      size="sm"
                      isLoading={changeEmail.isPending}
                    >
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() => {
                        setIsEditingEmail(false);
                        emailForm.reset();
                      }}
                    >
                      Отменить
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Изменение пароля */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Пароль</h3>
              {!isEditingPassword ? (
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsEditingPassword(true)}
                >
                  Изменить пароль
                </Button>
              ) : (
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-3"
                >
                  <Input
                    {...passwordForm.register("new_password", {
                      required: "Новый пароль обязателен",
                      minLength: { value: 6, message: "Минимум 6 символов" },
                    })}
                    type="password"
                    label="Новый пароль"
                    variant="bordered"
                    isInvalid={!!passwordForm.formState.errors.new_password}
                    errorMessage={
                      passwordForm.formState.errors.new_password?.message
                    }
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      color="primary"
                      size="sm"
                      isLoading={changePassword.isPending}
                    >
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() => {
                        setIsEditingPassword(false);
                        passwordForm.reset();
                      }}
                    >
                      Отменить
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
