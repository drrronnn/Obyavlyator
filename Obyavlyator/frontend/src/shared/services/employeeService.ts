import { apiClient } from './apiClient';
import { Employee, EmployeeCreate, EmployeeUpdate } from '@/types';

export const employeeApi = {
  getEmployees: async (): Promise<{ employees: Employee[]; total: number }> => {
    const response = await apiClient.get('/employees');
    return response.data;
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: EmployeeUpdate): Promise<Employee> => {
    const response = await apiClient.patch(`/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};
