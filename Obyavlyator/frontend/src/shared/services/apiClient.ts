import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      const apiError = new Error(error.response.data.error.message);
      (apiError as any).code = error.response.data.error.message;
      (apiError as any).email = error.response.data.data?.email;
      throw apiError;
    }
    throw error;
  }
);