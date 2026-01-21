import db from "../config/db.js";

const OtherInvoice = {
  // Get other invoice by ID
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT oi.*, inv.status, inv.invoice_code, inv.created_at, inv.total_amount,
              r.room_number, r.floor
       FROM other_invoices oi
       JOIN invoices inv ON oi.invoice_id = inv.id
       LEFT JOIN rooms r ON oi.target_room_id = r.id
       WHERE oi.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get other invoices by invoice ID
  getByInvoiceId: async (invoiceId) => {
    const [rows] = await db.query(
      `SELECT oi.*, inv.status, inv.invoice_code, inv.created_at
       FROM other_invoices oi
       JOIN invoices inv ON oi.invoice_id = inv.id
       WHERE oi.invoice_id = ?`,
      [invoiceId]
    );
    return rows;
  },

  // Get other invoices for a target student
  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT oi.*, inv.status, inv.invoice_code, inv.created_at
       FROM other_invoices oi
       JOIN invoices inv ON oi.invoice_id = inv.id
       WHERE oi.target_type = 'STUDENT' AND oi.target_student_id = ?
       ORDER BY inv.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  // Get other invoices for a target room
  getByRoomId: async (roomId) => {
    const [rows] = await db.query(
      `SELECT oi.*, inv.status, inv.invoice_code, inv.created_at, r.room_number, b.name as building_name
       FROM other_invoices oi
       JOIN invoices inv ON oi.invoice_id = inv.id
       JOIN rooms r ON oi.target_room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       WHERE oi.target_type = 'ROOM' AND oi.target_room_id = ?
       ORDER BY inv.created_at DESC`,
      [roomId]
    );
    return rows;
  },

  // Get all other invoices (for admin/manager view)
  getAll: async (limit = null, offset = null) => {
    let query = `
      SELECT oi.*, inv.status, inv.invoice_code, inv.created_at, 
             s.full_name as student_name, s.mssv,
             r.room_number, b.name as building_name
      FROM other_invoices oi
      JOIN invoices inv ON oi.invoice_id = inv.id
      LEFT JOIN students s ON oi.target_student_id = s.id
      LEFT JOIN rooms r ON oi.target_room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      ORDER BY inv.created_at DESC
    `;

    if (limit && offset !== null) {
      query += ` LIMIT ? OFFSET ?`;
      const [rows] = await db.query(query, [limit, offset]);
      return rows;
    }

    const [rows] = await db.query(query);
    return rows;
  },

  // Create other invoice
  create: async (data) => {
    const {
      invoice_id,
      target_type,
      target_student_id,
      target_room_id,
      title,
      description,
      amount,
      attachment_path,
      file_name,
      file_size
    } = data;

    const [result] = await db.query(
      `INSERT INTO other_invoices 
       (invoice_id, target_type, target_student_id, target_room_id, title, description, amount, attachment_path, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoice_id, target_type, target_student_id, target_room_id, title, description, amount, attachment_path, file_name, file_size]
    );
    return result.insertId;
  },

  // Update other invoice
  update: async (id, data) => {
    const {
      invoice_id,
      title,
      description,
      amount,
      target_student_id,
      target_room_id,
    } = data;

    const updates = [];
    const values = [];

    if (invoice_id !== undefined) {
      updates.push("invoice_id = ?");
      values.push(invoice_id);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (amount !== undefined) {
      updates.push("amount = ?");
      values.push(amount);
    }
    if (target_student_id !== undefined) {
      updates.push("target_student_id = ?");
      values.push(target_student_id);
    }
    if (target_room_id !== undefined) {
      updates.push("target_room_id = ?");
      values.push(target_room_id);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE other_invoices SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(query, values);
  },

  // Delete other invoice
  delete: async (id) => {
    await db.query(`DELETE FROM other_invoices WHERE id = ?`, [id]);
  },

  // Get other invoices by target and status
  getByTargetAndStatus: async (targetType, targetId, status = null) => {
    let query = `
      SELECT oi.*, inv.status, inv.invoice_code, inv.created_at
      FROM other_invoices oi
      JOIN invoices inv ON oi.invoice_id = inv.id
      WHERE oi.target_type = ? AND 
    `;

    const values = [targetType];

    if (targetType === "STUDENT") {
      query += `oi.target_student_id = ?`;
      values.push(targetId);
    } else if (targetType === "ROOM") {
      query += `oi.target_room_id = ?`;
      values.push(targetId);
    }

    if (status) {
      query += ` AND inv.status = ?`;
      values.push(status);
    }

    query += ` ORDER BY inv.created_at DESC`;

    const [rows] = await db.query(query, values);
    return rows;
  },
};

export default OtherInvoice;
