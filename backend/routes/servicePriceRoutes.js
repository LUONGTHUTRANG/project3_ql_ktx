import express from "express";
import * as servicePriceController from "../controllers/servicePriceController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes - lấy giá dịch vụ
router.get("/", servicePriceController.getAllServicePrices);
router.get("/name", servicePriceController.getServicePriceByName);
router.get("/:id", servicePriceController.getServicePriceById);

// Admin only routes - quản lý giá dịch vụ
router.post("/", verifyToken, authorizeRoles("admin"), servicePriceController.createServicePrice);
router.put("/:id", verifyToken, authorizeRoles("admin"), servicePriceController.updateServicePrice);
router.delete("/:id", verifyToken, authorizeRoles("admin"), servicePriceController.deleteServicePrice);
router.patch("/:id/deactivate", verifyToken, authorizeRoles("admin"), servicePriceController.deactivateServicePrice);

export default router;
