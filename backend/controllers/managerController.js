import Manager from "../models/managerModel.js";
import Student from "../models/studentModel.js";
import Room from "../models/roomModel.js";
import Registration from "../models/registrationModel.js";
import SupportRequest from "../models/supportRequestModel.js";
import Invoice from "../models/invoiceModel.js";
import bcrypt from "bcryptjs";
import { generateRandomPassword } from "../utils/passwordGenerator.js";
import { sendManagerPassword } from "../utils/emailService.js";
import db from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countAll();
    const emptyRooms = await Room.countEmpty();
    const newRegistrations = await Registration.countNew();
    const pendingRequests = await SupportRequest.countPending();
    const overdueInvoices = await Invoice.countOverdue();
    const totalCapacity = await Room.countTotalCapacity();

    res.json({
      totalStudents,
      emptyRooms,
      newRegistrations,
      pendingRequests,
      overdueInvoices,
      totalCapacity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.getAll();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getManagerById = async (req, res) => {
  try {
    const manager = await Manager.getById(req.params.id);
    if (!manager) return res.status(404).json({ message: "Manager not found" });
    res.json(manager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createManager = async (req, res) => {
  try {
    const { email, full_name, phone_number, building_id } = req.body;

    // Validate required fields
    if (!email || !full_name || !phone_number) {
      return res.status(400).json({
        error: "Email, full_name, and phone_number are required",
      });
    }

    // Generate random password
    const password = generateRandomPassword();

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Prepare data for creation
    const managerData = {
      email,
      password_hash,
      full_name,
      phone_number,
      is_first_login: true, // Set true since this is first login
      building_id: building_id || null,
      fcm_token: null,
    };

    // Create manager in database
    const newManager = await Manager.create(managerData);

    // Fetch system name from database
    let systemName = "Hệ thống quản lý ký túc xá";
    try {
      const [systemConfig] = await db.query(
        "SELECT system_name FROM system_setting LIMIT 1"
      );
      if (systemConfig && systemConfig.length > 0) {
        systemName = systemConfig[0].system_name;
      }
    } catch (configError) {
      console.error("Failed to fetch system name:", configError);
      // Continue with default name
    }

    // Send password to email
    try {
      await sendManagerPassword(email, full_name, password, systemName);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Continue anyway - manager is created even if email fails
      return res.status(201).json({
        ...newManager,
        warning:
          "Manager created successfully, but failed to send password to email",
      });
    }

    res.status(201).json({
      ...newManager,
      message: "Manager created successfully. Password sent to email.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateManager = async (req, res) => {
  try {
    await Manager.update(req.params.id, req.body);
    
    // Get updated manager data with building_name
    const updatedManager = await Manager.getById(req.params.id);
    
    res.json({
      message: 'Cập nhật cán bộ thành công',
      data: updatedManager
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteManager = async (req, res) => {
  try {
    await Manager.delete(req.params.id);
    res.json({ message: "Manager deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateManagerContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, email } = req.body;

    // Validate input
    if (!phone_number && !email) {
      return res.status(400).json({ error: "Cần cung cấp ít nhất một thông tin cần cập nhật" });
    }

    // Prepare update data - only update specified fields
    const updateData = {};
    if (phone_number) updateData.phone_number = phone_number;
    if (email) updateData.email = email;

    // Update manager
    const result = await Manager.updateContact(id, updateData);
    
    if (!result) {
      return res.status(404).json({ error: "Cán bộ quản lý không tồn tại" });
    }

    // Get updated manager data
    const updatedManager = await Manager.getById(id);
    res.json({
      message: "Cập nhật thông tin liên lạc thành công",
      data: updatedManager
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
