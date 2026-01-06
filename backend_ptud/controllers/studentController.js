import Student from "../models/studentModel.js";

export const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const students = await Student.getAll(limit, offset);
    const total = await Student.countAll();

    res.json({
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentsByRoomId = async (req, res) => {
  try {
    const students = await Student.getByRoomId(req.params.roomId);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentsByBuildingId = async (req, res) => {
  try {
    const students = await Student.getByBuildingId(req.params.buildingId);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const putAsignRoom = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { room_id } = req.body;
    const updatedStudent = await Student.assignRoom(studentId, room_id);
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};