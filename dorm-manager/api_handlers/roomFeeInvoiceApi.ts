import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.ROOM_FEE_INVOICES,
});

// Attach token and handle 401
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

export interface RoomFeeInvoice {
  id: number;
  invoice_id: number;
  student_id: number;
  room_id: number;
  semester_id: number;
  price_per_semester: number;
  invoice_code?: string;
  status?: string;
  mssv?: string;
  full_name?: string;
  room_number?: string;
  building_name?: string;
  floor?: number;
  created_at?: string;
}

/**
 * Get room fee invoices by semester
 */
export const getRoomFeeInvoicesBySemester = async (semesterId: number): Promise<RoomFeeInvoice[]> => {
  try {
    const response = await api.get(`/semester/${semesterId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room fee invoices by semester:', error);
    throw error;
  }
};

/**
 * Get room fee invoices by semester and building
 */
export const getRoomFeeInvoicesBySemesterAndBuilding = async (semesterId: number, buildingId: number): Promise<RoomFeeInvoice[]> => {
  try {
    const response = await api.get(`/semester/${semesterId}/building/${buildingId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room fee invoices by semester and building:', error);
    throw error;
  }
};

/**
 * Get room fee invoices by student
 */
export const getRoomFeeInvoicesByStudent = async (studentId: number): Promise<RoomFeeInvoice[]> => {
  try {
    const response = await api.get(`/student/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room fee invoices by student:', error);
    throw error;
  }
};

/**
 * Get room fee invoice by ID
 */
export const getRoomFeeInvoiceById = async (invoiceId: number): Promise<RoomFeeInvoice> => {
  try {
    const response = await api.get(`/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching room fee invoice:', error);
    throw error;
  }
};

/**
 * Create room fee invoice
 */
export const createRoomFeeInvoice = async (data: Omit<RoomFeeInvoice, 'id'>): Promise<RoomFeeInvoice> => {
  try {
    const response = await api.post('/', data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating room fee invoice:', error);
    throw error;
  }
};

/**
 * Update room fee invoice
 */
export const updateRoomFeeInvoice = async (invoiceId: number, data: Partial<RoomFeeInvoice>): Promise<RoomFeeInvoice> => {
  try {
    const response = await api.put(`/${invoiceId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating room fee invoice:', error);
    throw error;
  }
};

/**
 * Delete room fee invoice
 */
export const deleteRoomFeeInvoice = async (invoiceId: number): Promise<void> => {
  try {
    await api.delete(`/${invoiceId}`);
  } catch (error: any) {
    console.error('Error deleting room fee invoice:', error);
    throw error;
  }
};
