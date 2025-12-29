import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.INVOICES,
});

// Attach token and handle 401 like other API clients
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

export interface InvoiceItem {
  id: number;
  invoice_code?: string;
  type?: string;
  semester_id?: string;
  room_id?: number;
  room_number?: string;
  student_id?: string;
  amount?: number;
  description?: string;
  status?: string;
  due_date?: string;
  time_invoiced?: string;
  usage_month?: number;
  usage_year?: number;
  // any other fields returned
}

export const getInvoicesForStudent = async (studentId: string): Promise<InvoiceItem[]> => {
  try {
    const response = await api.get('/', { params: { student_id: studentId } });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching invoices for student:', error);
    throw error;
  }
};

export const getInvoiceById = async (id: string | number) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching invoice by id:', error);
    throw error;
  }
};

export const getAllInvoices = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all invoices:', error);
    throw error;
  }
};
