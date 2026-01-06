import Building from "../models/buildingModel.js";

export const getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.getAll();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBuildingById = async (req, res) => {
  try {
    const building = await Building.getById(req.params.id);
    if (!building)
      return res.status(404).json({ message: "Building not found" });
    res.json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBuilding = async (req, res) => {
  try {
    const newBuilding = await Building.create(req.body);
    res.status(201).json(newBuilding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBuilding = async (req, res) => {
  try {
    const updatedBuilding = await Building.update(req.params.id, req.body);
    res.json(updatedBuilding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteBuilding = async (req, res) => {
  try {
    await Building.delete(req.params.id);
    res.json({ message: "Building deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
