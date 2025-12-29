import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.SUPPORT_REQUESTS,
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

export interface SupportRequestItem {
  id: number;
  student_id: string;
  type?: string;
  title?: string;
  content?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  attachment_path?: string;
  attachment_url?: string;
}

export const getAllSupportRequests = async (page: number = 1, limit: number = 10, filters?: any) => {
  try {
    const params: any = { page, limit };
    if (filters?.status) params.status = filters.status;
    if (filters?.type) params.type = filters.type;
    
    const response = await api.get('/', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching support requests:', error);
    throw error;
  }
};

export const getSupportRequestById = async (id: number | string) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching support request by id:', error);
    throw error;
  }
};

export const createSupportRequest = async (data: any, file?: File) => {
  try {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (file) formData.append('attachment', file);
    
    const response = await api.post('/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating support request:', error);
    throw error;
  }
};

export const updateSupportRequestStatus = async (id: number | string, status: string) => {
  try {
    const response = await api.put(`/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    console.error('Error updating support request status:', error);
    throw error;
  }
};
