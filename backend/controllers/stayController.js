import Stay from "../models/stayModel.js";

export const checkActiveStay = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Thiếu thông tin student ID" });
    }

    const result = await Stay.hasActiveStay(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error("Error checking active stay:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getActiveStayDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Thiếu thông tin student ID" });
    }

    const stayData = await Stay.getActiveStay(parseInt(studentId));
    res.json(stayData || null);
  } catch (error) {
    console.error("Error getting active stay details:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStayById = async (req, res) => {
  try {
    const { id } = req.params;
    const stay = await Stay.getById(id);

    if (!stay) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi ở" });
    }

    res.json(stay);
  } catch (error) {
    console.error("Error getting stay by id:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStudentStays = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Thiếu thông tin student ID" });
    }

    const stays = await Stay.getByStudentId(parseInt(studentId));
    res.json(stays);
  } catch (error) {
    console.error("Error getting student stays:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createStay = async (req, res) => {
  try {
    const { student_id, room_id, semester_id, start_date, end_date, status } = req.body;

    if (!student_id || !room_id || !semester_id || !start_date || !end_date) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const stay = await Stay.create({
      student_id,
      room_id,
      semester_id,
      start_date,
      end_date,
      status: status || 'ACTIVE'
    });

    res.status(201).json(stay);
  } catch (error) {
    console.error("Error creating stay:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStayStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Thiếu thông tin status" });
    }

    const success = await Stay.updateStatus(id, status);

    if (!success) {
      return res.status(404).json({ message: "Không tìm thấy bản ghi ở" });
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Error updating stay status:", error);
    res.status(500).json({ error: error.message });
  }
};
