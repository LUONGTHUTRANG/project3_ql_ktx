import express from "express";
import { login, getMe, changePassword, getContactInfo } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.get("/contact-info", verifyToken, getContactInfo);
router.post("/change-password", verifyToken, changePassword);

export default router;
