import express from "express";
import * as otherInvoiceController from "../controllers/otherInvoiceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Get all other invoices
router.get("/", otherInvoiceController.getAll);

// Get other invoice by ID
router.get("/:invoiceId", otherInvoiceController.getInvoiceById);

// Get other invoices by invoice ID
router.get("/invoice/:invoiceId", otherInvoiceController.getByInvoiceId);

// Get other invoices for a student
router.get("/student/:studentId", otherInvoiceController.getByStudent);

// Get other invoices for a room
router.get("/room/:roomId", otherInvoiceController.getByRoom);

// Get other invoices by target and status
router.get("/target/:targetType/:targetId", otherInvoiceController.getByTargetAndStatus);

// Create other invoice
router.post("/", otherInvoiceController.create);

// Update other invoice
router.put("/:invoiceId", otherInvoiceController.update);

// Delete other invoice
router.delete("/:invoiceId", otherInvoiceController.deleteInvoice);

export default router;
