import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.NOTIFICATIONS,
});

// Attach token
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

export interface NotificationItem {
  id: number;
  title?: string;
  content?: string;
  type?: string;
  sender_role?: string;
  sender_id?: string;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
  attachment_path?: string;
  attachment_url?: string;
}

export const getMyNotifications = async (page: number = 1, limit: number = 10, filters?: any) => {
  try {
    const params: any = { page, limit };
    if (filters?.type) params.type = filters.type;
    
    const response = await api.get('/my', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/my/unread-count');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};

export const getNotificationById = async (id: number | string) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching notification by id:', error);
    throw error;
  }
};

export const markAsRead = async (id: number | string) => {
  try {
    const response = await api.put(`/${id}/read`);
    return response.data;
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getAllNotifications = async (page: number = 1, limit: number = 10, filters?: any) => {
  try {
    const params: any = { page, limit };
    if (filters?.type) params.type = filters.type;
    
    const response = await api.get('/', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
};

export const getNotificationsByManager = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await api.get('/manager', {
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching manager notifications:', error);
    throw error;
  }
};

export const deleteNotification = async (id: number | string) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const createNotification = async (
  data: {
    title: string;
    content: string;
    target_scope: string;
    target_value?: string | number;
    type?: string;
  },
  file?: File
) => {
  try {
    if (file) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('target_scope', data.target_scope);
      if (data.target_value) formData.append('target_value', String(data.target_value));
      if (data.type) formData.append('type', data.type);
      formData.append('attachment', file);
      
      const response = await api.post('/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } else {
      // Send JSON without file
      const response = await api.post('/', data);
      return response.data;
    }
  } catch (error: any) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
