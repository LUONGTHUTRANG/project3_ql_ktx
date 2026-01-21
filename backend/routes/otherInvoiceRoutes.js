import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as otherInvoiceController from "../controllers/otherInvoiceController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Ensure uploads/other_invoices directory exists
const uploadsDir = "uploads/other_invoices";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Get all other invoices
router.get("/", otherInvoiceController.getAll);

// Download file attachment
router.get("/:invoiceId/download", otherInvoiceController.downloadFile);

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

// Create other invoice (with file upload support for managers/admins)
router.post(
  "/",
  authorizeRoles("manager", "admin"),
  upload.single("attachment"),
  otherInvoiceController.create
);

// Update other invoice
router.put("/:invoiceId", otherInvoiceController.update);

// Delete other invoice
router.delete("/:invoiceId", otherInvoiceController.deleteInvoice);

export default router;
