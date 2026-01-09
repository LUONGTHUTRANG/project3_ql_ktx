import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.SEMESTERS,
});

// Attach token like other API clients
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

export interface Semester {
  id: number;
  term: string;
  academic_year: string;
  start_date?: string;
  end_date?: string;
  is_active?: number;
}

export const getAllSemesters = async (): Promise<Semester[]> => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching semesters:', error);
    throw error;
  }
};

export const getSemesterById = async (id: number | string) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching semester by id:', error);
    throw error;
  }
};
export const createSemester = async (data: Partial<Semester>): Promise<Semester> => {
  try {
    const response = await api.post('/', data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating semester:', error);
    throw error;
  }
};

export const updateSemester = async (id: number | string, data: Partial<Semester>): Promise<Semester> => {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating semester:', error);
    throw error;
  }
};

export const deleteSemester = async (id: number | string): Promise<any> => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting semester:', error);
    throw error;
  }
};

export default {
  getAllSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
};