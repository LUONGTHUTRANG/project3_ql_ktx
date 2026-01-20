import RoomFeeInvoice from "../models/roomFeeInvoiceModel.js";
import Invoice from "../models/invoiceModel.js";

// Get room fee invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const roomFeeInvoice = await RoomFeeInvoice.getById(invoiceId);
    if (!roomFeeInvoice) {
      return res.status(404).json({ message: "Room fee invoice not found" });
    }
    res.json(roomFeeInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get room fee invoices by student
export const getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const invoices = await RoomFeeInvoice.getByStudentId(studentId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get room fee invoices by semester
export const getBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const invoices = await RoomFeeInvoice.getBySemesterId(semesterId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get room fee invoices by semester and building
export const getBySemesterAndBuilding = async (req, res) => {
  try {
    const { semesterId, buildingId } = req.params;
    const invoices = await RoomFeeInvoice.getBySemesterAndBuilding(semesterId, buildingId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create room fee invoice
export const create = async (req, res) => {
  try {
    const { invoice_id, student_id, room_id, semester_id, price_per_semester } = req.body;

    if (!invoice_id || !student_id || !room_id || !semester_id || !price_per_semester) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if invoice exists
    const checkExists = await RoomFeeInvoice.checkExists(student_id, semester_id);
    if (checkExists) {
      return res.status(400).json({ message: "Room fee invoice already exists for this student in this semester" });
    }

    const roomFeeInvoiceId = await RoomFeeInvoice.create({
      invoice_id,
      student_id,
      room_id,
      semester_id,
      price_per_semester,
    });

    const roomFeeInvoice = await RoomFeeInvoice.getById(roomFeeInvoiceId);
    res.status(201).json(roomFeeInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update room fee invoice
export const update = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { invoice_id, price_per_semester } = req.body;

    const roomFeeInvoice = await RoomFeeInvoice.getById(invoiceId);
    if (!roomFeeInvoice) {
      return res.status(404).json({ message: "Room fee invoice not found" });
    }

    await RoomFeeInvoice.update(invoiceId, {
      invoice_id,
      price_per_semester,
    });

    const updated = await RoomFeeInvoice.getById(invoiceId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete room fee invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const roomFeeInvoice = await RoomFeeInvoice.getById(invoiceId);
    if (!roomFeeInvoice) {
      return res.status(404).json({ message: "Room fee invoice not found" });
    }

    await RoomFeeInvoice.delete(invoiceId);
    res.json({ message: "Room fee invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get room fee invoice by invoice ID
export const getByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const roomFeeInvoices = await RoomFeeInvoice.getByInvoiceId(invoiceId);
    res.json(roomFeeInvoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
