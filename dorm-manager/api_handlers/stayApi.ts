import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: `${API_ENDPOINTS.STAYS}`,
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

export interface ActiveStayInfo {
  id: number;
  student_id: number;
  room_id: number;
  semester_id: number;
  start_date: string;
  end_date: string;
  status: string;
  room_number?: string;
  building_name?: string;
  floor?: number;
  term?: string;
  academic_year?: string;
}

/**
 * Check if student has an active stay record
 * Query: stay_records where student_id = ? AND status = 'ACTIVE'
 */
export const checkActiveStay = async (studentId: number): Promise<{ hasActiveStay: boolean; data: ActiveStayInfo | null }> => {
  try {
    const response = await api.get(`/check-active/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error checking active stay:', error);
    throw error;
  }
};

/**
 * Get active stay details for a student
 */
export const getActiveStayDetails = async (studentId: number): Promise<ActiveStayInfo | null> => {
  try {
    const response = await api.get(`/active/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting active stay details:', error);
    return null;
  }
};
