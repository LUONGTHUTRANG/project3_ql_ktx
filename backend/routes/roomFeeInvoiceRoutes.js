import express from "express";
import * as roomFeeInvoiceController from "../controllers/roomFeeInvoiceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Get room fee invoice by ID
router.get("/:invoiceId", roomFeeInvoiceController.getInvoiceById);

// Get room fee invoices by invoice ID
router.get("/invoice/:invoiceId", roomFeeInvoiceController.getByInvoiceId);

// Get room fee invoices by student
router.get("/student/:studentId", roomFeeInvoiceController.getByStudent);

// Get room fee invoices by semester
router.get("/semester/:semesterId", roomFeeInvoiceController.getBySemester);

// Get room fee invoices by semester and building
router.get("/semester/:semesterId/building/:buildingId", roomFeeInvoiceController.getBySemesterAndBuilding);

// Create room fee invoice
router.post("/", roomFeeInvoiceController.create);

// Update room fee invoice
router.put("/:invoiceId", roomFeeInvoiceController.update);

// Delete room fee invoice
router.delete("/:invoiceId", roomFeeInvoiceController.deleteInvoice);

export default router;
