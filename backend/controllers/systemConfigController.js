import db from "../config/db.js";

// Get system configuration
export const getSystemConfig = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, system_name, hotline, email, address, utility_start_day, utility_end_day, max_reservation_time FROM system_setting LIMIT 1"
    );

    // if (!rows || rows.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Không tìm thấy cấu hình hệ thống",
    //   });
    // }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching system config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy cấu hình hệ thống",
      error: error.message,
    });
  }
};

// Update system configuration
export const updateSystemConfig = async (req, res) => {
  try {
    const { system_name, hotline, email, address, utility_start_day, utility_end_day, max_reservation_time } = req.body;

    // Validate required fields
    if (!system_name || !hotline || !email || !address || utility_start_day === undefined || utility_end_day === undefined || max_reservation_time === undefined) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin",
      });
    }

    // Validate dates
    if (utility_start_day < 1 || utility_start_day > 31 || utility_end_day < 1 || utility_end_day > 31) {
      return res.status(400).json({
        success: false,
        message: "Ngày phải từ 1 đến 31",
      });
    }

    // Check if system_setting exists
    const [existing] = await db.query("SELECT id FROM system_setting LIMIT 1");

    if (existing && existing.length > 0) {
      // Update existing record
      const [updateResult] = await db.query(
        `UPDATE system_setting SET 
         system_name = ?, 
         hotline = ?, 
         email = ?, 
         address = ?, 
         utility_start_day = ?, 
         utility_end_day = ?, 
         max_reservation_time = ? 
         WHERE id = ?`,
        [system_name, hotline, email, address, utility_start_day, utility_end_day, max_reservation_time, existing[0].id]
      );

      return res.status(200).json({
        success: true,
        message: "Cấu hình hệ thống đã được cập nhật thành công",
        data: {
          id: existing[0].id,
          system_name,
          hotline,
          email,
          address,
          utility_start_day,
          utility_end_day,
          max_reservation_time,
        },
      });
    } else {
      // Insert new record
      const [insertResult] = await db.query(
        `INSERT INTO system_setting 
         (system_name, hotline, email, address, utility_start_day, utility_end_day, max_reservation_time) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [system_name, hotline, email, address, utility_start_day, utility_end_day, max_reservation_time]
      );

      return res.status(201).json({
        success: true,
        message: "Cấu hình hệ thống đã được tạo thành công",
        data: {
          id: insertResult.insertId,
          system_name,
          hotline,
          email,
          address,
          utility_start_day,
          utility_end_day,
          max_reservation_time,
        },
      });
    }
  } catch (error) {
    console.error("Error updating system config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật cấu hình hệ thống",
      error: error.message,
    });
  }
};
