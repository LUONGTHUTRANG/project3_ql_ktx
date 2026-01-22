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
    
    let { token, user } = response.data;
    
    // Nếu role là manager, lấy building_id từ manager profile
    if (role === 'manager' && user.id) {
      try {
        const managerApi = axios.create({
          baseURL: API_ENDPOINTS.MANAGER,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const managerResponse = await managerApi.get(`/${user.id}`);
        const managerData = managerResponse.data || managerResponse.data.data;
        if (managerData.building_id) {
          user.building_id = managerData.building_id;
        }
      } catch (err) {
        console.error('Failed to fetch manager building info:', err);
        // Tiếp tục mà không lỗi, vì building_id là optional
      }
    }
    
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

// Get contact info
export const getContactInfo = async () => {
  try {
    const response = await api.get('/contact-info');
    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Lấy thông tin liên lạc thất bại');
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

// Change password
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await api.post('/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Thay đổi mật khẩu thất bại');
  }
};

export default api;

