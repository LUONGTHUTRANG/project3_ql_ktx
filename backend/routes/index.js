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
import servicePriceRoutes from "./servicePriceRoutes.js";
import utilityInvoiceRoutes from "./utilityInvoiceRoutes.js";
import roomFeeInvoiceRoutes from "./roomFeeInvoiceRoutes.js";
import otherInvoiceRoutes from "./otherInvoiceRoutes.js";
import paymentRoutes from "./paymentRoutes.js";

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
router.use("/service-prices", servicePriceRoutes);
router.use("/utility-invoices", utilityInvoiceRoutes);
router.use("/room-fee-invoices", roomFeeInvoiceRoutes);
router.use("/other-invoices", otherInvoiceRoutes);
router.use("/payments", paymentRoutes);

export default router;
