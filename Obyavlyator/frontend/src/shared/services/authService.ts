import { apiClient } from './apiClient';

export const registerUser = async (data: { 
  email: string; 
  password: string; 
  first_name: string; 
  last_name: string 
}) => {
  const response = await apiClient.post('/auth/register', data);
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

export const verifyEmail = async (data: { email: string; otp_code: string }) => {
  const response = await apiClient.post('/auth/verify-email', data);
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

export const loginUser = async (data: { username: string; password: string }) => {
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('password', data.password);
  
  const response = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

export const verifyEmployee = async (data: { email: string; otp_code: string }) => {
  const response = await apiClient.post('/auth/verify-employee', data);
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const response = await apiClient.post('/auth/forgot-password', data);
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};

export const resetPassword = async (data: { 
  email: string; 
  otp_code: string; 
  new_password: string 
}) => {
  const response = await apiClient.post('/auth/reset-password', data);
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
};