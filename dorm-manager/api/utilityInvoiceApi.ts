import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.UTILITY_INVOICES,
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

export interface UtilityInvoice {
  id: number;
  invoice_id: number;
  cycle_id: number;
  room_id: number;
  electricity_old: number;
  electricity_new: number;
  water_old: number;
  water_new: number;
  amount: number;
  status: string;
  invoice_code?: string;
  mssv?: string;
  full_name?: string;
  room_number?: string;
  building_name?: string;
  floor?: number;
  created_at?: string;
}

export interface UtilityInvoiceCycle {
  id: number;
  month: number;
  year: number;
  status: string;
  created_at?: string;
  published_at?: string;
  closed_at?: string;
}

/**
 * Get utility invoice cycles
 */
export const getUtilityInvoiceCycles = async (): Promise<UtilityInvoiceCycle[]> => {
  try {
    const response = await api.get(`/cycles`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching utility invoice cycles:', error);
    throw error;
  }
};

/**
 * Get utility invoices by cycle
 */
export const getUtilityInvoicesByCycle = async (cycleId: number, buildingId?: number): Promise<UtilityInvoice[]> => {
  try {
    let url = `/cycles/${cycleId}/invoices`;
    if (buildingId) {
      url += `?buildingId=${buildingId}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching utility invoices by cycle:', error);
    throw error;
  }
};

/**
 * Get utility invoices by room and cycle
 */
export const getUtilityInvoiceByRoomAndCycle = async (roomId: number, cycleId: number): Promise<UtilityInvoice> => {
  try {
    const response = await api.get(`/room/${roomId}/cycle/${cycleId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching utility invoice by room and cycle:', error);
    throw error;
  }
};

/**
 * Get utility invoice by ID
 */
export const getUtilityInvoiceById = async (invoiceId: number): Promise<UtilityInvoice> => {
  try {
    const response = await api.get(`/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching utility invoice:', error);
    throw error;
  }
};

/**
 * Record utility invoice readings
 */
export const recordUtilityInvoice = async (data: {
  room_id: number;
  cycle_id: number;
  electricity_new: number;
  water_new: number;
}): Promise<UtilityInvoice> => {
  try {
    const response = await api.post(`/record`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error recording utility invoice:', error);
    throw error;
  }
};

/**
 * Record bulk utility invoice readings
 */
export const recordBulkUtilityReadings = async (data: {
  cycle_id: number;
  readings: Array<{
    room_id: number;
    electricity_old?: number | null;
    electricity_new: number;
    water_old?: number | null;
    water_new: number;
  }>;
}): Promise<any> => {
  try {
    const response = await api.post(`/cycles/${data.cycle_id}/record-readings`, {
      readings: data.readings,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error recording bulk utility readings:', error);
    throw error;
  }
};

/**
 * Publish utility invoice cycle
 */
export const publishUtilityInvoiceCycle = async (cycleId: number): Promise<any> => {
  try {
    const response = await api.post(`/cycles/${cycleId}/publish`);
    return response.data;
  } catch (error: any) {
    console.error('Error publishing utility invoice cycle:', error);
    throw error;
  }
};

/**
 * Create utility invoice manually
 */
export const createUtilityInvoice = async (data: {
  cycle_id: number;
  room_id: number;
  electricity_old: number;
  electricity_new: number;
  water_old: number;
  water_new: number;
}): Promise<UtilityInvoice> => {
  try {
    const response = await api.post(`/`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating utility invoice:', error);
    throw error;
  }
};

/**
 * Update utility invoice
 */
export const updateUtilityInvoice = async (
  invoiceId: number,
  data: Partial<UtilityInvoice>
): Promise<UtilityInvoice> => {
  try {
    const response = await api.put(`/${invoiceId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating utility invoice:', error);
    throw error;
  }
};

/**
 * Delete utility invoice
 */
export const deleteUtilityInvoice = async (invoiceId: number): Promise<any> => {
  try {
    const response = await api.delete(`/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting utility invoice:', error);
    throw error;
  }
};
