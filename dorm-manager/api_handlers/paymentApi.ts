import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
  baseURL: API_ENDPOINTS.PAYMENTS,
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

export const generateQRCode = async (invoiceId: string, studentId: string) => {
  try {
    const response = await api.post(`/qrcode/${invoiceId}`, { studentId });
    return response.data;
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateQRCodeForAll = async (type: string, studentId: string) => {
  try {
    // If type is 'all', call the new endpoint for all invoices
    if (type === 'all') {
      const response = await api.post('/qrcode/all');
      return response.data;
    }
    // Otherwise, fall back to single invoice
    return generateQRCode(type, studentId);
  } catch (error: any) {
    console.error('Error generating QR code for all:', error);
    throw error;
  }
};

export const confirmPayment = async (paymentRef: string, invoiceId: string, studentId: string) => {
  try {
    const response = await api.post('/confirm', {
      paymentRef,
      invoiceId,
      studentId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const verifyPaymentRef = async (paymentRef: string) => {
  try {
    const response = await api.get(`/verify/${paymentRef}`);
    return response.data;
  } catch (error: any) {
    console.error('Error verifying payment ref:', error);
    throw error;
  }
};
