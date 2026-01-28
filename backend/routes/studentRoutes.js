import express from "express";
import * as studentController from "../controllers/studentController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get(
  "/",
  authorizeRoles("admin", "manager"),
  studentController.getAllStudents
);
router.get(
  "/:id",
  authorizeRoles("admin", "manager", "student"),
  studentController.getStudentById
);
router.get(
  "/room/:roomId",
  authorizeRoles("admin", "manager", "student"),
  studentController.getStudentsByRoomId
);
router.get(
  "/building/:buildingId",
  authorizeRoles("admin", "manager"),
  studentController.getStudentsByBuildingId
);

router.put(
  "/:id/contact",
  authorizeRoles("admin", "manager", "student"),
  studentController.updateStudentContact
);

// Get current stay for the logged-in student (for renewal)
router.get(
  "/me/current-stay",
  authorizeRoles("student"),
  studentController.getCurrentStay
);

// Get stay for a specific semester
router.post(
  "/me/stay-by-semester",
  authorizeRoles("student"),
  studentController.getStayBySemester
);

export default router;

