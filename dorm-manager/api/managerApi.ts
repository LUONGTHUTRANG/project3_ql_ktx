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

// Lấy tất cả cán bộ quản lý
export const getAllManagers = async (): Promise<ManagerProfile[]> => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách cán bộ:', error);
    throw error;
  }
};

// Tạo cán bộ quản lý mới
export const createManager = async (data: Partial<ManagerProfile>): Promise<ManagerProfile> => {
  try {
    const response = await api.post('/', data);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi tạo cán bộ:', error);
    throw error;
  }
};

// Cập nhật cán bộ quản lý
export const updateManager = async (id: string, data: Partial<ManagerProfile>): Promise<ManagerProfile> => {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật cán bộ:', error);
    throw error;
  }
};

// Xóa cán bộ quản lý
export const deleteManager = async (id: string): Promise<any> => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi xóa cán bộ:', error);
    throw error;
  }
};

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
