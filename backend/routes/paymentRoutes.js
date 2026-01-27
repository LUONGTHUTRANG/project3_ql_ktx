import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Generate QR code for all unpaid invoices
router.post("/qrcode/all", verifyToken, paymentController.generateQRCodeForAll);

// Generate QR code for single invoice
router.post("/qrcode/:invoiceId", verifyToken, paymentController.generateQRCode);

// Confirm payment
router.post("/confirm", verifyToken, paymentController.confirmPayment);

// Verify payment reference
router.get("/verify/:paymentRef", paymentController.verifyPaymentRef);

export default router;
