// api/buildingApi.ts
import axios from 'axios';
import { API_ENDPOINTS } from './config';

const BASE_URL = API_ENDPOINTS.BUILDINGS;

/**
 * Fetch all buildings
 */
export const fetchBuildings = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw error;
  }
};

/**
 * Fetch a building by ID
 */
export const fetchBuildingById = async (id: number | string) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching building ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new building
 */
export const createBuilding = async (data: any) => {
  try {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creating building:', error);
    throw error;
  }
};

/**
 * Update an existing building
 */
export const updateBuilding = async (id: number | string, data: any) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating building ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a building
 */
export const deleteBuilding = async (id: number | string) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting building ${id}:`, error);
    throw error;
  }
};
/**
 * Fetch building occupancy statistics
 * Returns occupancy rate for each building
 */
export const fetchBuildingOccupancyStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/occupancy/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching building occupancy stats:', error);
    throw error;
  }
};