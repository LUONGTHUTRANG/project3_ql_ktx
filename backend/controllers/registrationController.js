import Registration from "../models/registrationModel.js";
import Semester from "../models/semesterModel.js";
import Room from "../models/roomModel.js";
import db from "../config/db.js";

export const createRegistration = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
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
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Không có học kỳ nào đang mở đăng ký." });
    }

    // 2. Validate registration time based on registration type
    const now = new Date();
    let openDate = null;
    let closeDate = null;
    let registrationType = "";

    if (registration_type === 'NORMAL') {
      openDate = activeSemester.registration_open_date;
      closeDate = activeSemester.registration_close_date;
      registrationType = "Đơn đăng ký thông thường";
    } else if (registration_type === 'PRIORITY') {
      openDate = activeSemester.registration_special_open_date;
      closeDate = activeSemester.registration_special_close_date;
      registrationType = "Đơn ưu tiên/đặc biệt";
    } else if (registration_type === 'RENEWAL') {
      openDate = activeSemester.renewal_open_date;
      closeDate = activeSemester.renewal_close_date;
      registrationType = "Gia hạn chỗ ở";
    }

    // Helper function to format datetime (hh:mm:ss dd/mm/yyyy)
    const formatDateTime = (dateStr) => {
      if (!dateStr) return "Chưa cấu hình";
      try {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
      } catch (error) {
        return dateStr;
      }
    };

    // Validate that dates are configured
    if (!openDate || !closeDate) {
      await connection.rollback();
      return res.status(400).json({ 
        message: `Chưa cấu hình thời gian đăng ký cho loại "${registrationType}". Vui lòng liên hệ quản lý.` 
      });
    }

    // Check if current time is within registration period
    const openDateTime = new Date(openDate);
    const closeDateTime = new Date(closeDate);

    if (now < openDateTime) {
      await connection.rollback();
      const daysUntilOpen = Math.ceil((openDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return res.status(400).json({ 
        message: `Chưa đến thời gian đăng ký cho loại "${registrationType}". Đăng ký mở vào ${formatDateTime(openDate)} (còn ${daysUntilOpen} ngày). Thời gian đóng: ${formatDateTime(closeDate)}` 
      });
    }

    if (now > closeDateTime) {
      await connection.rollback();
      return res.status(400).json({ 
        message: `Đã hết thời gian đăng ký cho loại "${registrationType}". Thời gian đóng: ${formatDateTime(closeDate)}. Vui lòng liên hệ quản lý nếu cần hỗ trợ.` 
      });
    }

    // 3. For NORMAL registrations with room selection, check room availability
    let roomPrice = null;
    if (registration_type === 'NORMAL' && desired_room_id) {
      // Get room info
      const [roomRows] = await connection.query('SELECT * FROM rooms WHERE id = ?', [desired_room_id]);
      const room = roomRows[0];
      
      if (!room) {
        await connection.rollback();
        return res.status(404).json({ message: "Phòng không tồn tại" });
      }

      if (room.status !== 'AVAILABLE') {
        await connection.rollback();
        return res.status(400).json({ message: "Phòng không khả dụng" });
      }

      roomPrice = room.price_per_semester;

      // Check current occupancy
      const occupancy = await Room.getRoomOccupancy(desired_room_id, activeSemester.id);
      if (occupancy.count >= room.max_capacity) {
        await connection.rollback();
        return res.status(400).json({ message: "Phòng đã đầy" });
      }

      // Check gender compatibility
      const [studentRows] = await connection.query('SELECT gender FROM students WHERE id = ?', [student_id]);
      const studentGender = studentRows[0]?.gender;
      
      // Check building gender restriction
      const [buildingRows] = await connection.query(
        'SELECT gender_restriction FROM buildings WHERE id = ?',
        [room.building_id]
      );
      const buildingGender = buildingRows[0]?.gender_restriction;
      
      if (buildingGender === 'MALE' && studentGender !== 'MALE') {
        await connection.rollback();
        return res.status(400).json({ message: "Tòa nhà này chỉ dành cho nam" });
      }
      if (buildingGender === 'FEMALE' && studentGender !== 'FEMALE') {
        await connection.rollback();
        return res.status(400).json({ message: "Tòa nhà này chỉ dành cho nữ" });
      }

      // Check room gender compatibility (if room has people)
      if (occupancy.count > 0 && occupancy.genders) {
        const roomGenders = occupancy.genders.split(',').map(g => g.trim());
        if (!roomGenders.every(g => g === studentGender)) {
          await connection.rollback();
          return res.status(400).json({ message: "Phòng không phù hợp giới tính" });
        }
      }
    }

    let evidence_file_path = null;
    if (req.file) {
      evidence_file_path = req.file.path.replace(/\\/g, "/");
    }

    // Create registration
    const [regResult] = await connection.query(
      `INSERT INTO registrations 
       (student_id, semester_id, registration_type, desired_room_id, desired_building_id, 
        priority_category, priority_description, evidence_file_path, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        activeSemester.id,
        registration_type,
        desired_room_id || null,
        desired_building_id || null,
        priority_category || "NONE",
        priority_description || null,
        evidence_file_path,
        'PENDING'
      ]
    );

    const registrationId = regResult.insertId;

    // Create room fee invoice for NORMAL registration with room selection
    let invoiceId = null;
    if (registration_type === 'NORMAL' && desired_room_id && roomPrice) {
      const now = new Date();
      const invoiceCode = `ROOM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(registrationId).padStart(6, '0')}`;
      
      // Create invoice
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices 
         (invoice_code, invoice_category, total_amount, status) 
         VALUES (?, 'ROOM_FEE', ?, 'PUBLISHED')`,
        [invoiceCode, roomPrice]
      );
      
      invoiceId = invoiceResult.insertId;

      // Create room fee invoice detail
      await connection.query(
        `INSERT INTO room_fee_invoices 
         (invoice_id, student_id, room_id, semester_id, price_per_semester) 
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, student_id, desired_room_id, activeSemester.id, roomPrice]
      );

      // Link invoice to registration
      await connection.query(
        'UPDATE registrations SET invoice_id = ? WHERE id = ?',
        [invoiceId, registrationId]
      );
    }

    await connection.commit();

    res.status(201).json({ 
      message: registration_type === 'NORMAL' && desired_room_id 
        ? "Đăng ký thành công! Vui lòng thanh toán trong vòng 24h để giữ phòng." 
        : "Đăng ký thành công",
      id: registrationId,
      invoice_id: invoiceId
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
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
      building_id: req.query.building_id ? parseInt(req.query.building_id) : undefined,
    };

    // Manager chỉ xem đơn PRIORITY và RENEWAL
    // NORMAL đã tự động xử lý sau thanh toán
    const registrations = await Registration.getAll(limit, offset, filters);
    const filteredRegistrations = registrations.filter(
      r => r.registration_type === 'PRIORITY' || r.registration_type === 'RENEWAL'
    );
    
    const total = await Registration.countAll(filters);
    // Count only PRIORITY and RENEWAL
    const filteredTotal = filteredRegistrations.length;

    res.json({
      data: filteredRegistrations,
      meta: {
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
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
      await Notification.addRecipient(notificationId, registration.student_id, 'student');
    }

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    console.error("Error updating registration status:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * AUTO-ASSIGN ROOMS
 * Tự động phân phòng cho các đơn đăng ký NORMAL có trạng thái PENDING
 */
export const autoAssignRooms = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { semester_id } = req.body;
    
    if (!semester_id) {
      return res.status(400).json({ message: "Thiếu thông tin semester_id" });
    }

    // 1. Lấy danh sách đơn PENDING NORMAL (đã sắp xếp theo FIFO)
    const pendingRegistrations = await Registration.getPendingNormalRegistrations(semester_id);
    
    if (!pendingRegistrations || pendingRegistrations.length === 0) {
      await connection.commit();
      return res.json({
        message: "Không có đăng ký nào cần phân phòng",
        result: {
          total: 0,
          success: 0,
          failed: 0,
          details: []
        }
      });
    }

    // 2. Lấy danh sách phòng còn trống
    const availableRooms = await Room.getAvailableRoomsForAssignment(semester_id);

    // Kết quả phân phòng
    const assignmentResults = {
      total: pendingRegistrations.length,
      success: 0,
      failed: 0,
      details: []
    };

    // 3. Thuật toán phân phòng
    for (const registration of pendingRegistrations) {
      const studentGender = registration.gender; // MALE or FEMALE
      const desiredBuildingId = registration.desired_building_id;
      const desiredRoomId = registration.desired_room_id;

      let assignedRoom = null;
      let failureReason = null;

      // Case 1: Nếu sinh viên chọn phòng cụ thể
      if (desiredRoomId) {
        const room = availableRooms.find(r => r.id === desiredRoomId);
        
        if (room) {
          // Kiểm tra giới tính
          const occupancy = await Room.getRoomOccupancy(room.id, semester_id);
          const canAssign = checkGenderCompatibility(
            studentGender, 
            room.building_gender, 
            occupancy.genders
          );

          if (canAssign && occupancy.count < room.max_capacity) {
            assignedRoom = room;
          } else if (!canAssign) {
            failureReason = "Phòng mong muốn không phù hợp giới tính";
          } else {
            failureReason = "Phòng mong muốn đã đầy";
          }
        } else {
          failureReason = "Phòng mong muốn không có sẵn";
        }
      }

      // Case 2: Nếu chưa có phòng, tìm theo tòa nhà mong muốn
      if (!assignedRoom && desiredBuildingId && !failureReason) {
        const buildingRooms = availableRooms.filter(r => r.building_id === desiredBuildingId);
        assignedRoom = await findBestRoom(buildingRooms, studentGender, semester_id);
        
        if (!assignedRoom) {
          failureReason = "Không tìm thấy phòng phù hợp trong tòa nhà mong muốn";
        }
      }

      // Case 3: Tìm bất kỳ phòng nào phù hợp
      if (!assignedRoom && !failureReason) {
        assignedRoom = await findBestRoom(availableRooms, studentGender, semester_id);
        
        if (!assignedRoom) {
          failureReason = "Không còn phòng phù hợp";
        }
      }

      // 4. Thực hiện phân phòng
      if (assignedRoom) {
        try {
          // Cập nhật registration status
          await connection.query(
            `UPDATE registrations SET status = 'APPROVED', admin_note = ? WHERE id = ?`,
            [`Tự động phân phòng: ${assignedRoom.building_name} - Phòng ${assignedRoom.room_number}`, registration.id]
          );

          // Tạo stay_record
          const semester = await Semester.getById(semester_id);
          await connection.query(
            `INSERT INTO stay_records (student_id, room_id, semester_id, start_date, end_date, status) 
             VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
            [registration.student_id, assignedRoom.id, semester_id, semester.start_date, semester.end_date]
          );

          // Gửi thông báo cho sinh viên
          const Notification = (await import("../models/notificationModel.js")).default;
          const notificationId = await Notification.create({
            title: "Đã phân phòng KTX thành công",
            content: `Chúc mừng! Bạn đã được phân phòng ${assignedRoom.room_number} tại ${assignedRoom.building_name}. Vui lòng kiểm tra thông tin chi tiết.`,
            attachment_path: null,
            sender_role: "MANAGER",
            sender_id: req.user?.id || 1,
            target_scope: "INDIVIDUAL",
            type: "ANNOUNCEMENT",
          });
          await Notification.addRecipient(notificationId, registration.student_id, 'student');

          assignmentResults.success++;
          assignmentResults.details.push({
            student_id: registration.student_id,
            student_name: registration.student_name,
            mssv: registration.mssv,
            status: 'SUCCESS',
            assigned_room: `${assignedRoom.building_name} - Phòng ${assignedRoom.room_number}`,
            room_id: assignedRoom.id
          });

          // Cập nhật danh sách phòng available (giảm số chỗ trống)
          const roomIndex = availableRooms.findIndex(r => r.id === assignedRoom.id);
          if (roomIndex !== -1) {
            availableRooms[roomIndex].current_occupancy++;
            if (availableRooms[roomIndex].current_occupancy >= availableRooms[roomIndex].max_capacity) {
              availableRooms.splice(roomIndex, 1); // Xóa phòng đã đầy
            }
          }
        } catch (error) {
          console.error('Error assigning room:', error);
          assignmentResults.failed++;
          assignmentResults.details.push({
            student_id: registration.student_id,
            student_name: registration.student_name,
            mssv: registration.mssv,
            status: 'FAILED',
            reason: 'Lỗi hệ thống khi phân phòng'
          });
        }
      } else {
        assignmentResults.failed++;
        assignmentResults.details.push({
          student_id: registration.student_id,
          student_name: registration.student_name,
          mssv: registration.mssv,
          status: 'FAILED',
          reason: failureReason || 'Không rõ lý do'
        });
      }
    }

    await connection.commit();

    res.json({
      message: "Hoàn tất phân phòng tự động",
      result: assignmentResults
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error in auto-assign:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

/**
 * HÀM HỖ TRỢ: Kiểm tra giới tính có phù hợp không
 */
function checkGenderCompatibility(studentGender, buildingRestriction, currentGenders) {
  // Kiểm tra quy định tòa nhà
  if (buildingRestriction === 'MALE' && studentGender !== 'MALE') return false;
  if (buildingRestriction === 'FEMALE' && studentGender !== 'FEMALE') return false;

  // Nếu phòng trống, OK
  if (!currentGenders || currentGenders === '') return true;

  // Nếu phòng đã có người, kiểm tra giới tính phải giống nhau
  const gendersInRoom = currentGenders.split(',').map(g => g.trim());
  return gendersInRoom.every(g => g === studentGender);
}

/**
 * HÀM HỖ TRỢ: Tìm phòng tốt nhất cho sinh viên
 */
async function findBestRoom(rooms, studentGender, semesterId) {
  // Sắp xếp phòng: Phòng có người nhiều hơn → ưu tiên trước (để lấp đầy)
  const sortedRooms = rooms.sort((a, b) => b.current_occupancy - a.current_occupancy);

  for (const room of sortedRooms) {
    const occupancy = await Room.getRoomOccupancy(room.id, semesterId);
    
    const canAssign = checkGenderCompatibility(
      studentGender,
      room.building_gender,
      occupancy.genders
    );

    if (canAssign && occupancy.count < room.max_capacity) {
      return room;
    }
  }

  return null;
}

/**
 * GET ASSIGNMENT REPORT
 * Lấy báo cáo thống kê phân phòng
 */
export const getAssignmentReport = async (req, res) => {
  try {
    const { semester_id } = req.query;

    if (!semester_id) {
      return res.status(400).json({ message: "Thiếu thông tin semester_id" });
    }

    // Thống kê registrations
    const [registrationStats] = await db.query(
      `SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN registration_type = 'NORMAL' THEN 1 ELSE 0 END) as normal_type,
        SUM(CASE WHEN registration_type = 'PRIORITY' THEN 1 ELSE 0 END) as priority_type,
        SUM(CASE WHEN registration_type = 'RENEWAL' THEN 1 ELSE 0 END) as renewal_type
       FROM registrations
       WHERE semester_id = ?`,
      [semester_id]
    );

    // Thống kê phòng
    const [roomStats] = await db.query(
      `SELECT 
        COUNT(*) as total_rooms,
        SUM(max_capacity) as total_capacity,
        SUM(current_occupancy) as current_occupancy,
        SUM(CASE WHEN current_occupancy >= max_capacity THEN 1 ELSE 0 END) as full_rooms,
        SUM(CASE WHEN current_occupancy = 0 THEN 1 ELSE 0 END) as empty_rooms
       FROM rooms WHERE is_active = 1`
    );

    // Thống kê theo tòa nhà
    const [buildingStats] = await db.query(
      `SELECT 
        b.id, b.name,
        COUNT(r.id) as total_rooms,
        SUM(r.max_capacity) as total_capacity,
        SUM(r.current_occupancy) as current_occupancy
       FROM buildings b
       LEFT JOIN rooms r ON b.id = r.building_id AND r.is_active = 1
       GROUP BY b.id, b.name`
    );

    res.json({
      semester_id: parseInt(semester_id),
      registration_stats: registrationStats[0],
      room_stats: roomStats[0],
      building_stats: buildingStats
    });

  } catch (err) {
    console.error("Error getting assignment report:", err);
    res.status(500).json({ error: err.message });
  }
};
