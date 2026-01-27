import express from 'express';
import {
  checkActiveStay,
  getActiveStayDetails,
  getStayById,
  getStudentStays,
  createStay,
  updateStayStatus
} from '../controllers/stayController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Check if student has active stay (no auth required for frontend page load)
router.get('/check-active/:studentId', checkActiveStay);

// Get active stay details (no auth required)
router.get('/active/:studentId', getActiveStayDetails);

// Apply auth middleware for all routes below
router.use(verifyToken);

// Get stay by ID
router.get('/:id', authorizeRoles("admin", "manager", "student"), getStayById);

// Get all stays for a student
router.get('/student/:studentId', authorizeRoles("admin", "manager", "student"), getStudentStays);

// Create new stay
router.post('/', authorizeRoles("admin", "manager"), createStay);

// Update stay status
router.patch('/:id/status', authorizeRoles("admin", "manager"), updateStayStatus);

export default router;
