import Invoice from "../models/invoiceModel.js";
import Manager from "../models/managerModel.js";
import Student from "../models/studentModel.js";

export const getAllInvoices = async (req, res) => {
  try {
    const { student_id } = req.query;
    console.log("getAllInvoices called with student_id:", student_id);
    let invoices;
    if (student_id) {
      const student = await Student.getById(student_id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      const roomId = student.current_room_id;
      console.log("Student's current room ID:", roomId);
      invoices = await Invoice.getForStudentApp(student_id, roomId);
    } else {
      invoices = await Invoice.getAll();
    }
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvoicesByManager = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { type, status } = req.query;

    // Get manager's building
    const manager = await Manager.getById(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Get all invoices for the manager's building
    let invoices;
    if (type === "room") {
      invoices = await Invoice.getByBuildingId(
        manager.building_id,
        "ROOM_FEE",
        status
      );
    } else if (type === "utility") {
      invoices = await Invoice.getByBuildingId(
        manager.building_id,
        "UTILITY_FEE",
        status
      );
    } else {
      invoices = await Invoice.getByBuildingId(
        manager.building_id,
        null,
        status
      );
    }

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.getById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const newInvoice = await Invoice.create(req.body);
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.update(req.params.id, req.body);
    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.delete(req.params.id);
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
