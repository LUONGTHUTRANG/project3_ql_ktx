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

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.getById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
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

export const updateStudentContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, email } = req.body;

    // Validate input
    if (!phone_number && !email) {
      return res.status(400).json({ error: "Cần cung cấp ít nhất một thông tin cần cập nhật" });
    }

    // Prepare update data
    const updateData = {};
    if (phone_number) updateData.phone_number = phone_number;
    if (email) updateData.email = email;

    // Update student
    const result = await Student.updateById(id, updateData);
    
    if (!result) {
      return res.status(404).json({ error: "Sinh viên không tồn tại" });
    }

    // Get updated student data
    const updatedStudent = await Student.getById(id);
    res.json({
      message: "Cập nhật thông tin liên lạc thành công",
      data: updatedStudent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
