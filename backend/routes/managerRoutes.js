import express from "express";
import * as managerController from "../controllers/managerController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(verifyToken);

router.get(
  "/dashboard/stats",
  authorizeRoles("manager", "admin"),
  managerController.getDashboardStats
);

router.get("/", authorizeRoles("admin"), managerController.getAllManagers);
router.get("/:id", authorizeRoles("admin"), managerController.getManagerById);
router.post("/", authorizeRoles("admin"), managerController.createManager);
router.put("/:id", authorizeRoles("admin"), managerController.updateManager);
router.delete("/:id", authorizeRoles("admin"), managerController.deleteManager);

export default router;
