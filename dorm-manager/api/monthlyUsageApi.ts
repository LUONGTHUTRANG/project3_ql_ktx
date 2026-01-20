import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.MONTHLY_USAGE,
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

export interface MonthlyUsage {
  id: number;
  room_id: number;
  month: number;
  year: number;
  electricity_old: number;
  electricity_new: number;
  water_old: number;
  water_new: number;
  electricity_price: number;
  water_price: number;
  created_at?: string;
  updated_at?: string;
}

export const getMonthlyUsageByRoomAndDate = async (roomId: number, month: number, year: number): Promise<MonthlyUsage> => {
  try {
    const response = await api.get('/', {
      params: {
        room_id: roomId,
        month,
        year,
      },
    });
    return response.data[0];
  } catch (error: any) {
    console.error('Error fetching monthly usage:', error);
    throw error;
  }
};

export const getMonthlyUsageById = async (usageId: number | string): Promise<MonthlyUsage> => {
  try {
    const response = await api.get(`/${usageId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching monthly usage by id:', error);
    throw error;
  }
};

export const getMonthlyUsageByRoom = async (roomId: number): Promise<MonthlyUsage[]> => {
  try {
    const response = await api.get('/', {
      params: {
        room_id: roomId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching monthly usage by room:', error);
    throw error;
  }
};
export const recordBulkUsage = async (data: {
  readings: Array<{
    roomId: number;
    electricityIndex: number | string;
    waterIndex: number | string;
  }>;
  month: number;
  year: number;
}) => {
  try {
    const response = await api.post('/bulk-record', data);
    return response.data;
  } catch (error: any) {
    console.error('Error recording bulk usage:', error);
    throw error;
  }
};

export const getRoomsWithLastUsage = async (month: number, year: number) => {
  try {
    const response = await api.get('/rooms-with-last-usage', {
      params: {
        month,
        year,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching rooms with last usage:', error);
    throw error;
  }
};