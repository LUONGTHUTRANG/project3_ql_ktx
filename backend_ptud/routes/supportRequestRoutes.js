import express from "express";
import multer from "multer";
import path from "path";
import {
  createSupportRequest,
  getAllSupportRequests,
  getSupportRequestById,
  updateSupportRequestStatus,
} from "../controllers/supportRequestController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/support_requests/");
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

router.post("/", upload.single("attachment"), createSupportRequest);
router.get("/", getAllSupportRequests);
router.get("/:id", getSupportRequestById);
router.put("/:id/status", updateSupportRequestStatus);

export default router;
