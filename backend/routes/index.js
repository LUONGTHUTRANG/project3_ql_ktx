import express from "express";
import semesterRoutes from "./semesterRoutes.js";
import buildingRoutes from "./buildingRoutes.js";
import managerRoutes from "./managerRoutes.js";
import roomRoutes from "./roomRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import studentRoutes from "./studentRoutes.js";
import supportRequestRoutes from "./supportRequestRoutes.js";
import authRoutes from "./authRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import registrationRoutes from "./registrationRoutes.js";
import monthlyUsageRoutes from "./monthlyUsageRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/semesters", semesterRoutes);
router.use("/buildings", buildingRoutes);
router.use("/managers", managerRoutes);
router.use("/rooms", roomRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/students", studentRoutes);
router.use("/support-requests", supportRequestRoutes);
router.use("/notifications", notificationRoutes);
router.use("/registrations", registrationRoutes);
router.use("/monthly-usages", monthlyUsageRoutes);

export default router;
