// api/config.ts
/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Backend server URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Endpoints
export const API_ENDPOINTS = {
  BUILDINGS: `${API_BASE_URL}/buildings`,
  ROOMS: `${API_BASE_URL}/rooms`,
  AUTH: `${API_BASE_URL}/auth`,
  STUDENTS: `${API_BASE_URL}/students`,
  MANAGERS: `${API_BASE_URL}/managers`,
  INVOICES: `${API_BASE_URL}/invoices`,
  ROOM_FEE_INVOICES: `${API_BASE_URL}/room-fee-invoices`,
  UTILITY_INVOICES: `${API_BASE_URL}/utility-invoices`,
  OTHER_INVOICES: `${API_BASE_URL}/other-invoices`,
  SEMESTERS: `${API_BASE_URL}/semesters`,
  REGISTRATIONS: `${API_BASE_URL}/registrations`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  MONTHLY_USAGE: `${API_BASE_URL}/monthly-usages`,
  SUPPORT_REQUESTS: `${API_BASE_URL}/support-requests`,
  PAYMENTS: `${API_BASE_URL}/payments`,
  SYSTEM_CONFIG: `${API_BASE_URL}/system-config`,
};

export default API_BASE_URL;
