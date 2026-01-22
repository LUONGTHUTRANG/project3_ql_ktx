import express from "express";
import { getSystemConfig, updateSystemConfig } from "../controllers/systemConfigController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get system configuration
router.get("/", verifyToken, getSystemConfig);

// Update system configuration
router.put("/", verifyToken, updateSystemConfig);

export default router;
