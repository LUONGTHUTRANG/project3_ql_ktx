import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.STUDENTS,
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

export interface StudentProfile {
  id: string;
  mssv: string;
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  class_name: string;
  student_status: string;
  stay_status: string;
  current_room_id: string | null;
  room_number?: string;
  building_name?: string;
}

// Lấy thông tin sinh viên theo ID
export const getStudentById = async (id: string): Promise<StudentProfile> => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin sinh viên:', error);
    throw error;
  }
};

// Lấy tất cả sinh viên
export const getAllStudents = async (page: number = 1, limit: number = 20) => {
  try {
    const response = await api.get('/', {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách sinh viên:', error);
    throw error;
  }
};

// Lấy sinh viên theo phòng
export const getStudentsByRoomId = async (roomId: string): Promise<StudentProfile[]> => {
  try {
    const response = await api.get(`/room/${roomId}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy sinh viên theo phòng:', error);
    throw error;
  }
};

// Lấy sinh viên theo tòa nhà
export const getStudentsByBuildingId = async (buildingId: string): Promise<StudentProfile[]> => {
  try {
    const response = await api.get(`/building/${buildingId}`);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy sinh viên theo tòa:', error);
    throw error;
  }
};

// Cập nhật thông tin liên lạc sinh viên
export const updateStudentContact = async (id: string, data: { phone_number?: string; email?: string }): Promise<StudentProfile> => {
  try {
    const response = await api.put(`/${id}/contact`, data);
    return response.data.data;
  } catch (error: any) {
    console.error('Lỗi khi cập nhật thông tin sinh viên:', error);
    throw error;
  }
};
