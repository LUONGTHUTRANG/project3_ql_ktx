import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.MANAGERS || '/api/managers',
});

// Request interceptor - thêm JWT token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ManagerProfile {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  full_name: string;
  building_id?: string;
  building_name?: string;
}

// Cập nhật thông tin liên lạc của cán bộ quản lý
export const updateManagerContact = async (id: string, data: { phone_number?: string; email?: string }): Promise<ManagerProfile> => {
  try {
    const response = await api.put(`/${id}/contact`, data);
    return response.data.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật thông tin cán bộ:', error);
    throw error;
  }
};

// Lấy thông tin cán bộ quản lý theo ID
export const getManagerById = async (id: string): Promise<ManagerProfile> => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin cán bộ:', error);
    throw error;
  }
};
