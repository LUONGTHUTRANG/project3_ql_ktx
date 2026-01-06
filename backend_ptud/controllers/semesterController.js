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
