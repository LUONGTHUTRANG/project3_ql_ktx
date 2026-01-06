import Registration from "../models/registrationModel.js";
import Semester from "../models/semesterModel.js";
import Invoice from "../models/invoiceModel.js";
import Room from "../models/roomModel.js";
import { generateInvoiceCode } from "../utils/invoiceCode.js";

export const createRegistration = async (req, res) => {
  try {
    const {
      student_id,
      registration_type, // NORMAL | PRIORITY | RENEWAL
      desired_room_id,
      desired_building_id,
      priority_category,
      priority_description,
    } = req.body;

    // 1. Get current active semester
    const activeSemester = await Semester.getActiveSemester();
    if (!activeSemester) {
      return res
        .status(400)
        .json({ message: "Không có học kỳ nào đang mở đăng ký." });
    }

    // 2. Check if student already registered for this semester
    const existing = await Registration.checkExistingRegistration(
      student_id,
      activeSemester.id
    );
    if (existing) {
      return res
        .status(400)
        .json({ message: "Bạn đã đăng ký cho học kỳ này rồi." });
    }

    let evidence_file_path = null;
    if (req.file) {
      evidence_file_path = req.file.path.replace(/\\/g, "/");
    }

    // 4. Validate theo loại đăng ký
    const isPriority = registration_type === "PRIORITY";

    if (!isPriority && !desired_room_id) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn phòng để đăng ký." });
    }

    // 5. Create registration
    const registrationId = await Registration.create({
      student_id,
      semester_id: activeSemester.id,
      registration_type,
      desired_room_id: isPriority ? null : desired_room_id,
      desired_building_id: desired_building_id || null,
      priority_category: isPriority ? priority_category || "NONE" : "NONE",
      priority_description: isPriority ? priority_description || null : null,
      evidence_file_path,
      status: "PENDING",
    });

    // 6. Nếu PRIORITY → kết thúc
    if (isPriority) {
      return res.status(201).json({
        message: "Đăng ký diện ưu tiên thành công. Vui lòng chờ xét duyệt.",
        registration_id: registrationId,
      });
    }

    // 7. Lấy giá phòng
    const room = await Room.getById(desired_room_id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    // 8. Create invoice (24h)
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoice_code: generateInvoiceCode("R"),
      type: "ROOM_FEE",
      semester_id: activeSemester.id,
      room_id: desired_room_id,
      student_id,
      amount: room.price_per_semester,
      description: `Tiền phòng ${room.room_number} - HK ${activeSemester.term} ${activeSemester.academic_year}`,
      status: "UNPAID",
      due_date: dueDate,
    });

    // 9. Add invoice_id to registration
    await Registration.addInvoiceId(registrationId, invoice.id);

    res.status(201).json({
      message: "Đăng ký thành công. Vui lòng thanh toán trong vòng 24 giờ.",
      registration_id: registrationId,
      invoice_id: invoice.id,
      amount: room.price_per_semester,
      due_date: dueDate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getStudentRegistrations = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming from auth middleware
    const registrations = await Registration.getByStudentId(studentId);
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getManagerRegistrations = async (req, res) => {
  try {
    const type = req.query.type || "NORMAL"; // NORMAL | PRIORITY
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;  
    const filters = {
      status: req.query.status,
      search: req.query.search,
    };
    const registrations = await Registration.getByType(
      type,
      limit,
      offset,
      filters
    );
    const total = await Registration.countByType(type, filters);
    res.json({
      data: registrations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    } catch (err) {
    console.error("Error fetching manager registrations:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllPriorityRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      status: req.query.status,
      search: req.query.search,
    };

    const registrations = await Registration.getAllPriority(
      limit,
      offset,
      filters
    );
    const total = await Registration.countAllPriority(filters);

    res.json({
      data: registrations,
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

export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.getById(id);

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký" });
    }
    console.log("Registration details:", registration);
    res.json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!["APPROVED", "REJECTED", "PENDING", "RETURN", "COMPLETED"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const success = await Registration.updateStatus(id, status, admin_note);

    if (!success) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký" });
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignRoomToRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_id } = req.body;
    const registration = await Registration.getById(id);

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký" });
    }
    if (registration.registration_type !== "PRIORITY") {
      return res.status(400).json({ message: "Chỉ có thể gán phòng cho đơn ưu tiên" });
    }

    await Registration.assignRoomToRegistration(id, room_id);
    res.json({ message: "Gán phòng thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
