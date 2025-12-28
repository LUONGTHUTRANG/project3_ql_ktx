import axios from 'axios';
import { API_ENDPOINTS } from './config';

const BASE_URL = API_ENDPOINTS.AUTH;

const api = axios.create({
  baseURL: BASE_URL,
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
    // Kiểm tra nếu là lỗi 401 VÀ không phải là request gửi đến endpoint /login
    if (error.response?.status === 401 && !error.config.url.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chỉ redirect khi token hết hạn lúc đang sử dụng app
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Login function
export const loginUser = async (username: string, password: string, role: string) => {
  try {
    const response = await api.post('/login', {
      username,
      password,
      role,
    });
    
    const { token, user } = response.data;
    
    // Lưu token và user info vào localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Đăng nhập thất bại';
    throw new Error(message);
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get stored user from localStorage
export const getStoredUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export default api;

