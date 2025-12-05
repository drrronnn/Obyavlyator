import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addToast } from '@heroui/toast';
import { employeeApi } from '../services/employeeService';
import { EmployeeCreate, EmployeeUpdate } from '@/types';

export const employeeQueryKeys = {
  all: ['employees'] as const,
  detail: (id: string) => ['employees', id] as const,
};

export const useEmployees = () => {
  return useQuery({
    queryKey: employeeQueryKeys.all,
    queryFn: employeeApi.getEmployees,
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id),
    queryFn: () => employeeApi.getEmployee(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EmployeeCreate) => employeeApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      addToast({
        title: 'Успешно',
        description: 'Сотрудник добавлен',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Ошибка при добавлении сотрудника';
      addToast({
        title: 'Ошибка',
        description: message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdate }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      addToast({
        title: 'Успешно',
        description: 'Данные сотрудника обновлены',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Ошибка при обновлении';
      addToast({
        title: 'Ошибка',
        description: message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      addToast({
        title: 'Успешно',
        description: 'Сотрудник удален',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Ошибка при удалении';
      addToast({
        title: 'Ошибка',
        description: message,
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};
