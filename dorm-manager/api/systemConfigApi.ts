import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.SYSTEM_CONFIG,
});

// Attach token and handle 401
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export interface SystemConfig {
  id?: number;
  system_name: string;
  hotline: string;
  email: string;
  address: string;
  utility_start_day: number;
  utility_end_day: number;
  max_reservation_time: number;
}

// Get system configuration
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const response = await api.get('');
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch system configuration');
  }
};

// Update system configuration
export const updateSystemConfig = async (config: SystemConfig): Promise<SystemConfig> => {
  try {
    const response = await api.put('', config);
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update system configuration');
  }
};
