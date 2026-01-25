// api/roomApi.ts
import axios from "axios";
import { API_ENDPOINTS } from "./config";

const BASE_URL = API_ENDPOINTS.ROOMS;

// Create axios instance with interceptor for token
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

/**
 * Fetch all rooms
 */
export const fetchRooms = async () => {
  try {
    const response = await api.get("");
    return response.data;
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

/**
 * Fetch rooms by building ID
 */
export const fetchRoomsByBuilding = async (buildingId: number | string) => {
  try {
    const response = await api.get(`?building_id=${buildingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching rooms for building ${buildingId}:`, error);
    throw error;
  }
};

/**
 * Fetch a room by ID
 */
export const fetchRoomById = async (id: number | string) => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching room ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new room
 */
export const createRoom = async (data: any) => {
  try {
    const response = await api.post("", data);
    return response.data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

/**
 * Update an existing room
 */
export const updateRoom = async (id: number | string, data: any) => {
  try {
    const response = await api.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating room ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (id: number | string) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting room ${id}:`, error);
    throw error;
  }
};

/**
 * Alias for fetchRooms for consistency
 */
export const getAllRooms = fetchRooms;
