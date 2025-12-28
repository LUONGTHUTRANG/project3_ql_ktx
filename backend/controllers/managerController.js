import Manager from "../models/managerModel.js";
import Student from "../models/studentModel.js";
import Room from "../models/roomModel.js";
import Registration from "../models/registrationModel.js";
import SupportRequest from "../models/supportRequestModel.js";
import Invoice from "../models/invoiceModel.js";

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
    const newManager = await Manager.create(req.body);
    res.status(201).json(newManager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateManager = async (req, res) => {
  try {
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
