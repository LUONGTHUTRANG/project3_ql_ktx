import express from "express";
import * as invoiceController from "../controllers/invoiceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/manager/building", invoiceController.getInvoicesByManager);
router.get("/", invoiceController.getAllInvoices);
router.get("/:id", invoiceController.getInvoiceById);
router.post("/", invoiceController.createInvoice);
router.put("/:id", invoiceController.updateInvoice);
router.put("/:invoice_code/status", invoiceController.updateInvoiceStatus);
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
