import db from "../config/db.js";

const Invoice = {
  countOverdue: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM invoices WHERE status = 'DRAFT' AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    return rows[0].count;
  },

  getAll: async () => {
    const [rows] = await db.query(`
      SELECT i.* FROM invoices i
      ORDER BY i.created_at DESC
    `);
    return rows;
  },

  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT * FROM invoices WHERE id IN 
       (SELECT invoice_id FROM room_fee_invoices WHERE student_id = ?)
       OR id IN 
       (SELECT invoice_id FROM other_invoices WHERE target_student_id = ?)
       ORDER BY created_at DESC`,
      [studentId, studentId]
    );
    return rows;
  },

  getForStudentApp: async (studentId, roomId) => {
    // For student app, get utility invoices for the room and room fee/other invoices for the student
    const query = `
      SELECT i.* FROM invoices i
      WHERE i.id IN (SELECT invoice_id FROM utility_invoices WHERE room_id = ?)
         OR i.id IN (SELECT invoice_id FROM room_fee_invoices WHERE student_id = ?)
         OR i.id IN (SELECT invoice_id FROM other_invoices WHERE target_student_id = ?)
      ORDER BY i.created_at DESC
    `;
    const [rows] = await db.query(query, [roomId, studentId, studentId]);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const {
      invoice_code,
      invoice_category,
      total_amount,
      status = "DRAFT",
      created_by_manager_id,
    } = data;

    const [result] = await db.query(
      `INSERT INTO invoices 
       (invoice_code, invoice_category, total_amount, status, created_by_manager_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [invoice_code, invoice_category, total_amount, status, created_by_manager_id]
    );
    return result.insertId;
  },

  delete: async (invoiceCode) => {
    await db.query(`DELETE FROM invoices WHERE invoice_code = ?`, [invoiceCode]);
  },

  getByBuildingId: async (buildingId, category = null, status = null) => {
    let query = `
      SELECT i.* FROM invoices i
      WHERE i.id IN (
        SELECT ui.invoice_id FROM utility_invoices ui
        JOIN rooms r ON ui.room_id = r.id
        WHERE r.building_id = ?
      )
      OR i.id IN (
        SELECT rfi.invoice_id FROM room_fee_invoices rfi
        JOIN rooms r ON rfi.room_id = r.id
        WHERE r.building_id = ?
      )
    `;
    
    const params = [buildingId, buildingId];

    if (category) {
      query += ` AND i.invoice_category = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY i.created_at DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default Invoice;
