import { User, Employee } from '../../types';

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canEditEmployee = (user: User | null, employee: Employee): boolean => {
  return isAdmin(user) && user?.id !== employee.id;
};

export const canDeleteEmployee = (user: User | null, employee: Employee): boolean => {
  return isAdmin(user) && user?.id !== employee.id;
};

export const canAddEmployee = (user: User | null): boolean => {
  return isAdmin(user);
};
