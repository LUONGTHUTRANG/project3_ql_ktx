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

export default {
  getServicePrices,
  getServicePriceByName,
};
