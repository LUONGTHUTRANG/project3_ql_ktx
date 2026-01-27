import express from "express";
import * as roomController from "../controllers/roomController.js";

const router = express.Router();

// Get available rooms for registration (must be before /:id route)
router.get("/available", roomController.getAvailableRoomsForRegistration);

// Get rooms by building_id query parameter, or all rooms if no parameter
router.get("/", (req, res) => {
  if (req.query.building_id) {
    return roomController.getRoomsByBuilding(req, res);
  }
  return roomController.getAllRooms(req, res);
});

router.get("/:id", roomController.getRoomById);
router.post("/", roomController.createRoom);
router.put("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);

export default router;
