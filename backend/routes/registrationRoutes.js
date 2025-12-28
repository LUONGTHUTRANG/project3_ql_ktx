import express from "express";
import multer from "multer";
import path from "path";
import {
  createRegistration,
  getStudentRegistrations,
  getAllPriorityRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
} from "../controllers/registrationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Configure Multer for evidence files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/evidence/"); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "evidence-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("evidence"), createRegistration);
router.get("/my-registrations", getStudentRegistrations);
router.get("/priority", getAllPriorityRegistrations);
router.get("/:id", getRegistrationById);
router.put("/:id/status", updateRegistrationStatus);

export default router;
