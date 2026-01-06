import express from "express";
import * as semesterController from "../controllers/semesterController.js";

const router = express.Router();

router.get("/", semesterController.getAllSemesters);
router.get("/:id", semesterController.getSemesterById);
router.post("/", semesterController.createSemester);
router.put("/:id", semesterController.updateSemester);
router.delete("/:id", semesterController.deleteSemester);

export default router;
