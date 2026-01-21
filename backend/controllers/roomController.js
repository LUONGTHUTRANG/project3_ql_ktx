import Room from "../models/roomModel.js";

export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.getAll();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await Room.getById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomsByBuilding = async (req, res) => {
  try {
    const { building_id } = req.query;
    if (!building_id) {
      return res.status(400).json({ error: "building_id query parameter is required" });
    }
    const rooms = await Room.getByBuildingId(building_id);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const newRoom = await Room.create(req.body);
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const updatedRoom = await Room.update(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    await Room.delete(req.params.id);
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
