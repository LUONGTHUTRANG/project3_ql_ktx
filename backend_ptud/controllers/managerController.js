import Manager from "../models/managerModel.js";
import Student from "../models/studentModel.js";
import Room from "../models/roomModel.js";
import Registration from "../models/registrationModel.js";
import SupportRequest from "../models/supportRequestModel.js";
import Invoice from "../models/invoiceModel.js";
import bcrypt from "bcryptjs";
import { generateRandomPassword } from "../utils/passwordGenerator.js";
import { sendManagerPassword } from "../utils/emailService.js";

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

    // Send password to email
    try {
      await sendManagerPassword(email, full_name, password);
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
    console.log("Updating manager with data:", req.body);
    console.log("Manager ID:", req.params.id);
    const updatedManager = await Manager.update(req.params.id, req.body);
    res.json(updatedManager);
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
