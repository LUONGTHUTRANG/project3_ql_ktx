import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createNotification,
  getMyNotifications,
  markAsRead,
  getManagerSentNotifications,
  getNotificationById,
  deleteNotification,
  getUnreadNotificationCount,
} from "../controllers/notificationController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Ensure uploads/notifications directory exists
const notificationsDir = "uploads/notifications";
if (!fs.existsSync(notificationsDir)) {
  fs.mkdirSync(notificationsDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, notificationsDir);
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

// Routes

// Create notification (Manager/Admin only)
router.post(
  "/",
  authorizeRoles("manager", "admin"),
  upload.single("attachment"),
  createNotification
);

// Get unread notification count
router.get("/my/unread-count", getUnreadNotificationCount);

// Get my notifications
router.get("/my", getMyNotifications);

// Mark as read
router.put("/:id/read", markAsRead);

// Get sent notifications (Manager)
router.get(
  "/manager",
  authorizeRoles("manager", "admin"),
  getManagerSentNotifications
);

// Get notification by ID
router.get("/:id", getNotificationById);

// Delete notification
router.delete("/:id", authorizeRoles("manager", "admin"), deleteNotification);

export default router;
