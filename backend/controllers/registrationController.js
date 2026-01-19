import Registration from "../models/registrationModel.js";
import Semester from "../models/semesterModel.js";

export const createRegistration = async (req, res) => {
  try {
    const {
      student_id,
      registration_type, // 'NORMAL', 'PRIORITY', 'RENEWAL'
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

    // Note: Removed restriction - students can now submit multiple registration requests
    // The manager will review and handle duplicates if needed

    let evidence_file_path = null;
    if (req.file) {
      evidence_file_path = req.file.path.replace(/\\/g, "/");
    }

    const registrationId = await Registration.create({
      student_id,
      semester_id: activeSemester.id,
      registration_type,
      desired_room_id: desired_room_id || null,
      desired_building_id: desired_building_id || null,
      priority_category: priority_category || "NONE",
      priority_description: priority_description || null,
      evidence_file_path,
    });

    res.status(201).json({ message: "Đăng ký thành công", id: registrationId });
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

// GET ALL REGISTRATIONS (for Manager - all types)
export const getAllRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      status: req.query.status,
      search: req.query.search,
      registration_type: req.query.registration_type,
    };

    const registrations = await Registration.getAll(limit, offset, filters);
    const total = await Registration.countAll(filters);

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

    res.json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!["APPROVED", "REJECTED", "PENDING", "RETURN"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Get registration details before updating
    const registration = await Registration.getById(id);
    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký" });
    }

    const success = await Registration.updateStatus(id, status, admin_note);

    if (!success) {
      return res.status(404).json({ message: "Không tìm thấy đơn đăng ký" });
    }

    // Create notification for student
    const Notification = (await import("../models/notificationModel.js")).default;

    let notificationTitle = "";
    let notificationContent = "";

    if (status === "APPROVED") {
      notificationTitle = "Đơn đăng ký KTX đã được duyệt";
      notificationContent = `Đơn đăng ký chỗ ở KTX của bạn đã được duyệt. ${admin_note ? `Ghi chú: ${admin_note}` : "Vui lòng theo dõi thông tin tiếp theo."}`;
    } else if (status === "REJECTED") {
      notificationTitle = "Đơn đăng ký KTX bị từ chối";
      notificationContent = `Đơn đăng ký chỗ ở KTX của bạn đã bị từ chối. ${admin_note ? `Lý do: ${admin_note}` : "Vui lòng liên hệ ban quản lý để biết thêm chi tiết."}`;
    } else if (status === "RETURN") {
      notificationTitle = "Yêu cầu bổ sung hồ sơ đăng ký KTX";
      notificationContent = `Đơn đăng ký KTX của bạn cần bổ sung thông tin. ${admin_note ? `Nội dung: ${admin_note}` : "Vui lòng kiểm tra và cập nhật hồ sơ."}`;
    }

    if (notificationTitle) {
      // Create notification
      const notificationId = await Notification.create({
        title: notificationTitle,
        content: notificationContent,
        attachment_path: null,
        sender_role: "MANAGER",
        sender_id: req.user?.id || 1, // fallback to 1 if no user in request
        target_scope: "INDIVIDUAL",
        type: "ANNOUNCEMENT",
      });

      // Add student as recipient
      await Notification.addRecipient(notificationId, registration.student_id);
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    console.error("Error updating registration status:", err);
    res.status(500).json({ error: err.message });
  }
};
