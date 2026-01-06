import express from "express";
import * as monthlyUsageController from "../controllers/monthlyUsageController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", monthlyUsageController.getMonthlyUsages);
router.get("/prices", monthlyUsageController.getServicePrices);
router.post("/", monthlyUsageController.recordUsage);

export default router;
