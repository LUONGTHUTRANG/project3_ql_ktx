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
  "/room/:roomId",
  authorizeRoles("admin", "manager", "student"),
  studentController.getStudentsByRoomId
);
router.get(
  "/building/:buildingId",
  authorizeRoles("admin", "manager"),
  studentController.getStudentsByBuildingId
);

export default router;
