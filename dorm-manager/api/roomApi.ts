// api/roomApi.ts
import axios from 'axios';
import { API_ENDPOINTS } from './config';

const BASE_URL = API_ENDPOINTS.ROOMS;

/**
 * Fetch all rooms
 */
export const fetchRooms = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

/**
 * Fetch a room by ID
 */
export const fetchRoomById = async (id: number | string) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
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
    const response = await axios.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Update an existing room
 */
export const updateRoom = async (id: number | string, data: any) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, data);
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
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting room ${id}:`, error);
    throw error;
  }
};
