import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.OTHER_INVOICES,
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

export interface OtherInvoiceCreateData {
  target_type: 'STUDENT' | 'ROOM';
  target_student_id?: string;
  target_room_id?: string;
  title: string;
  description?: string;
  amount: number;
  attachment?: File;
  file_name?: string;
  file_size?: number;
}

/**
 * Create an OTHER type invoice with optional file attachment
 */
export const createOtherInvoice = async (data: OtherInvoiceCreateData) => {
  try {
    const formData = new FormData();
    formData.append('target_type', data.target_type);
    if (data.target_student_id) {
      formData.append('target_student_id', data.target_student_id);
    }
    if (data.target_room_id) {
      formData.append('target_room_id', data.target_room_id);
    }
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('amount', String(data.amount));
    
    if (data.attachment) {
      formData.append('attachment', data.attachment);
      if (data.file_name) {
        formData.append('file_name', data.file_name);
      }
      if (data.file_size) {
        formData.append('file_size', String(data.file_size));
      }
    }

    const response = await api.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating other invoice:', error);
    throw error;
  }
};

/**
 * Get all other invoices
 */
export const getAllOtherInvoices = async (limit?: number, offset?: number) => {
  try {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    const response = await api.get('/', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching other invoices:', error);
    throw error;
  }
};

/**
 * Get other invoice by ID
 */
export const getOtherInvoiceById = async (invoiceId: string | number) => {
  try {
    const response = await api.get(`/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching other invoice:', error);
    throw error;
  }
};

/**
 * Get other invoices by student ID
 */
export const getOtherInvoicesByStudent = async (studentId: string) => {
  try {
    const response = await api.get(`/student/${studentId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching other invoices for student:', error);
    throw error;
  }
};

/**
 * Get other invoices by room ID
 */
export const getOtherInvoicesByRoom = async (roomId: string) => {
  try {
    const response = await api.get(`/room/${roomId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching other invoices for room:', error);
    throw error;
  }
};

/**
 * Delete other invoice
 */
export const deleteOtherInvoice = async (invoiceId: string | number) => {
  try {
    const response = await api.delete(`/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting other invoice:', error);
    throw error;
  }
};

/**
 * Download file attachment from other invoice
 */
export const downloadOtherInvoiceFile = async (invoiceId: string | number, fileName?: string) => {
  try {
    const response = await api.get(`/${invoiceId}/download`, {
      responseType: 'blob',
    });
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `invoice-${invoiceId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error: any) {
    console.error('Error downloading file:', error);
    throw error;
  }
};
