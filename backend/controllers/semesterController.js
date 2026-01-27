import Semester from "../models/semesterModel.js";

export const getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.getAll();
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.getById(req.params.id);
    if (!semester)
      return res.status(404).json({ message: "Semester not found" });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSemester = async (req, res) => {
  try {
    const newSemester = await Semester.create(req.body);
    res.status(201).json(newSemester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSemester = async (req, res) => {
  try {
    // Check if semester exists and is not inactive
    const semester = await Semester.getById(req.params.id);
    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }
    if (semester.is_active === 0) {
      return res.status(400).json({ message: "Cannot update an inactive semester" });
    }
    
    const updatedSemester = await Semester.update(req.params.id, req.body);
    res.json(updatedSemester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    await Semester.delete(req.params.id);
    res.json({ message: "Semester deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getActiveSemester = async (req, res) => {
  try {
    const semester = await Semester.getActiveSemester();
    if (!semester) {
      return res.status(404).json({ message: "No active semester found" });
    }
    res.json(semester);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
