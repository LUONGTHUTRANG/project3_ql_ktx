import OtherInvoice from "../models/otherInvoiceModel.js";
import Invoice from "../models/invoiceModel.js";
import db from "../config/db.js";
import fs from "fs";

// Helper to get full URL for local file
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  const normalizedFilename = filename.replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${normalizedFilename}`;
};

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

// Create other invoice with file upload
export const create = async (req, res) => {
  try {
    const {
      target_type,
      target_student_id,
      target_room_id,
      title,
      description,
      amount,
      due_date,
    } = req.body;

    console.log("Creating other invoice with data:", req.body);

    // Validation
    if (!target_type || !title || !amount) {
      return res.status(400).json({ message: "Missing required fields: target_type, title, amount" });
    }

    if (target_type === "STUDENT" && !target_student_id) {
      return res.status(400).json({ message: "target_student_id is required for STUDENT type" });
    }

    if (target_type === "ROOM" && !target_room_id) {
      return res.status(400).json({ message: "target_room_id is required for ROOM type" });
    }

    // Validate that room/student exists in database before creating invoice
    if (target_type === "ROOM") {
      const roomId = parseInt(target_room_id, 10);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "target_room_id must be a valid number" });
      }
      
      const [roomExists] = await db.query("SELECT id FROM rooms WHERE id = ?", [roomId]);
      if (!roomExists || roomExists.length === 0) {
        return res.status(404).json({ message: `Phòng với ID ${roomId} không tồn tại trong hệ thống` });
      }
    }

    if (target_type === "STUDENT") {
      const [studentExists] = await db.query("SELECT id FROM students WHERE id = ?", [target_student_id]);
      if (!studentExists || studentExists.length === 0) {
        return res.status(404).json({ message: `Sinh viên với ID ${target_student_id} không tồn tại trong hệ thống` });
      }
    }

    // Create invoice first
    const invoiceId = await Invoice.create({
      invoice_code: `INV-${Date.now()}`,
      invoice_category: 'OTHER',
      total_amount: amount,
      status: 'PUBLISHED',
      created_by_manager_id: req.user?.id || null,
      published_at: new Date(),
      deadline_at: due_date ? new Date(due_date) : null,
    });

    // Handle file attachment if provided
    let attachment_path = null;
    let file_name = null;
    let file_size = null;
    console.log("check req other invoice", req.file);
    if (req.file) {
      attachment_path = req.file.path.replace(/\\/g, "/");
      file_name = req.file.originalname || req.file.filename;
      file_size = req.file.size || null;
    }

    // Create other invoice
    const otherInvoiceId = await OtherInvoice.create({
      invoice_id: invoiceId,
      target_type,
      target_student_id: target_type === "STUDENT" ? target_student_id : null,
      target_room_id: target_type === "ROOM" ? parseInt(target_room_id, 10) : null,
      title,
      description,
      amount,
      attachment_path,
      file_name,
      file_size,
    });

    const otherInvoice = await OtherInvoice.getById(otherInvoiceId);
    
    // Add attachment URL if file exists
    if (otherInvoice && otherInvoice.attachment_path) {
      otherInvoice.attachment_url = getFileUrl(req, otherInvoice.attachment_path);
    }

    res.status(201).json(otherInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create other invoice (old endpoint kept for backward compatibility)
export const createOld = async (req, res) => {
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

    // Delete other invoice first (because of foreign key constraint)
    await OtherInvoice.delete(invoiceId);
    
    // Then delete the corresponding invoice record
    if (otherInvoice.invoice_id) {
      await Invoice.deleteById(otherInvoice.invoice_id);
    }

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

// Download file attachment
export const downloadFile = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const otherInvoice = await OtherInvoice.getById(invoiceId);
    
    if (!otherInvoice) {
      return res.status(404).json({ message: "Other invoice not found" });
    }
    
    if (!otherInvoice.attachment_path) {
      return res.status(404).json({ message: "No attachment found" });
    }
    
    const filePath = otherInvoice.attachment_path;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }
    
    // Set appropriate headers for download
    const fileName = otherInvoice.file_name || filePath.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error downloading file" });
      }
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
};
