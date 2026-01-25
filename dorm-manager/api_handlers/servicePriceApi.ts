import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: `${API_ENDPOINTS.STUDENTS.split('/students')[0]}/service-prices`,
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

export interface ServicePrice {
  id: number;
  service_name: string;
  unit: string;
  unit_price: number;
  apply_date: string;
  is_active: number;
}

// Lấy tất cả giá dịch vụ
export const getServicePrices = async (): Promise<ServicePrice[]> => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy giá dịch vụ:', error);
    throw error;
  }
};

// Lấy giá dịch vụ theo tên
export const getServicePriceByName = async (serviceName: string): Promise<ServicePrice | null> => {
  try {
    const prices = await getServicePrices();
    return prices.find(p => p.service_name === serviceName) || null;
  } catch (error: any) {
    console.error('Lỗi khi lấy giá dịch vụ:', error);
    throw error;
  }
};

// Lấy giá dịch vụ theo ID
export const getServicePriceById = async (id: number): Promise<ServicePrice | null> => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy giá dịch vụ:', error);
    throw error;
  }
};

// Tạo giá dịch vụ mới
export const createServicePrice = async (data: Partial<ServicePrice>): Promise<ServicePrice> => {
  try {
    const response = await api.post('/', data);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi tạo giá dịch vụ:', error);
    throw error;
  }
};

// Cập nhật giá dịch vụ
export const updateServicePrice = async (id: number, data: Partial<ServicePrice>): Promise<ServicePrice> => {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật giá dịch vụ:', error);
    throw error;
  }
};

// Xóa giá dịch vụ
export const deleteServicePrice = async (id: number): Promise<any> => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi xóa giá dịch vụ:', error);
    throw error;
  }
};

// Vô hiệu hóa giá dịch vụ
export const deactivateServicePrice = async (id: number): Promise<any> => {
  try {
    const response = await api.patch(`/${id}/deactivate`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi vô hiệu hóa giá dịch vụ:', error);
    throw error;
  }
};

export default {
  getServicePrices,
  getServicePriceByName,
  getServicePriceById,
  createServicePrice,
  updateServicePrice,
  deleteServicePrice,
  deactivateServicePrice,
};
