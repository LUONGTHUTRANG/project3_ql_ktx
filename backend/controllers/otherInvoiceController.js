import OtherInvoice from "../models/otherInvoiceModel.js";
import Invoice from "../models/invoiceModel.js";

// Get other invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const otherInvoice = await OtherInvoice.getById(invoiceId);
    if (!otherInvoice) {
      return res.status(404).json({ message: "Other invoice not found" });
    }
    res.json(otherInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all other invoices
export const getAll = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const invoices = await OtherInvoice.getAll(limit ? parseInt(limit) : null, offset ? parseInt(offset) : null);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get other invoices for a student
export const getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const invoices = await OtherInvoice.getByStudentId(studentId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get other invoices for a room
export const getByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const invoices = await OtherInvoice.getByRoomId(roomId);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create other invoice
export const create = async (req, res) => {
  try {
    const {
      invoice_id,
      target_type,
      target_student_id,
      target_room_id,
      title,
      description,
      amount,
    } = req.body;

    if (!invoice_id || !target_type || !title || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (target_type === "STUDENT" && !target_student_id) {
      return res.status(400).json({ message: "target_student_id is required for STUDENT type" });
    }

    if (target_type === "ROOM" && !target_room_id) {
      return res.status(400).json({ message: "target_room_id is required for ROOM type" });
    }

    const otherInvoiceId = await OtherInvoice.create({
      invoice_id,
      target_type,
      target_student_id,
      target_room_id,
      title,
      description,
      amount,
    });

    const otherInvoice = await OtherInvoice.getById(otherInvoiceId);
    res.status(201).json(otherInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update other invoice
export const update = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { invoice_id, title, description, amount, target_student_id, target_room_id } = req.body;

    const otherInvoice = await OtherInvoice.getById(invoiceId);
    if (!otherInvoice) {
      return res.status(404).json({ message: "Other invoice not found" });
    }

    await OtherInvoice.update(invoiceId, {
      invoice_id,
      title,
      description,
      amount,
      target_student_id,
      target_room_id,
    });

    const updated = await OtherInvoice.getById(invoiceId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete other invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const otherInvoice = await OtherInvoice.getById(invoiceId);
    if (!otherInvoice) {
      return res.status(404).json({ message: "Other invoice not found" });
    }

    // Also delete the corresponding invoice record
    await Invoice.delete(otherInvoice.invoice_code);
    await OtherInvoice.delete(invoiceId);

    res.json({ message: "Other invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get other invoices by target and status
export const getByTargetAndStatus = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { status } = req.query;

    if (!targetType || !targetId) {
      return res.status(400).json({ message: "targetType and targetId are required" });
    }

    const invoices = await OtherInvoice.getByTargetAndStatus(targetType, targetId, status);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get other invoices by invoice ID
export const getByInvoiceId = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const otherInvoices = await OtherInvoice.getByInvoiceId(invoiceId);
    res.json(otherInvoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
