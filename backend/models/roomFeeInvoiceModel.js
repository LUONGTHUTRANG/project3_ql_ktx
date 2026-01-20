import db from "../config/db.js";

const RoomFeeInvoice = {
  // Get room fee invoice by ID
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT rfi.*, r.room_number, s.mssv, s.full_name
       FROM room_fee_invoices rfi
       JOIN rooms r ON rfi.room_id = r.id
       JOIN students s ON rfi.student_id = s.id
       WHERE rfi.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get room fee invoices by invoice ID
  getByInvoiceId: async (invoiceId) => {
    const [rows] = await db.query(
      `SELECT rfi.*, r.room_number, s.mssv, s.full_name
       FROM room_fee_invoices rfi
       JOIN rooms r ON rfi.room_id = r.id
       JOIN students s ON rfi.student_id = s.id
       WHERE rfi.invoice_id = ?`,
      [invoiceId]
    );
    return rows;
  },

  // Get room fee invoices by student
  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT rfi.*, inv.status, inv.invoice_code, inv.created_at, r.room_number, sem.term, sem.academic_year
       FROM room_fee_invoices rfi
       JOIN invoices inv ON rfi.invoice_id = inv.id
       JOIN rooms r ON rfi.room_id = r.id
       JOIN semesters sem ON rfi.semester_id = sem.id
       WHERE rfi.student_id = ?
       ORDER BY rfi.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  // Get room fee invoices by semester
  getBySemesterId: async (semesterId) => {
    const [rows] = await db.query(
      `SELECT rfi.*, r.room_number, r.floor, b.name as building_name, s.mssv, s.full_name, inv.status
       FROM room_fee_invoices rfi
       JOIN rooms r ON rfi.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       JOIN students s ON rfi.student_id = s.id
       JOIN invoices inv ON rfi.invoice_id = inv.id
       WHERE rfi.semester_id = ?
       ORDER BY r.floor DESC, r.room_number ASC`,
      [semesterId]
    );
    return rows;
  },

  // Get room fee invoices by semester and building
  getBySemesterAndBuilding: async (semesterId, buildingId) => {
    const [rows] = await db.query(
      `SELECT rfi.*, r.room_number, r.floor, b.name as building_name, s.mssv, s.full_name, inv.status
       FROM room_fee_invoices rfi
       JOIN rooms r ON rfi.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       JOIN students s ON rfi.student_id = s.id
       JOIN invoices inv ON rfi.invoice_id = inv.id
       WHERE rfi.semester_id = ? AND b.id = ?
       ORDER BY r.floor DESC, r.room_number ASC`,
      [semesterId, buildingId]
    );
    return rows;
  },

  // Create room fee invoice
  create: async (data) => {
    const {
      invoice_id,
      student_id,
      room_id,
      semester_id,
      price_per_semester,
    } = data;

    const [result] = await db.query(
      `INSERT INTO room_fee_invoices 
       (invoice_id, student_id, room_id, semester_id, price_per_semester)
       VALUES (?, ?, ?, ?, ?)`,
      [invoice_id, student_id, room_id, semester_id, price_per_semester]
    );
    return result.insertId;
  },

  // Update room fee invoice
  update: async (id, data) => {
    const { invoice_id, price_per_semester } = data;

    const updates = [];
    const values = [];

    if (invoice_id !== undefined) {
      updates.push("invoice_id = ?");
      values.push(invoice_id);
    }
    if (price_per_semester !== undefined) {
      updates.push("price_per_semester = ?");
      values.push(price_per_semester);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE room_fee_invoices SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(query, values);
  },

  // Delete room fee invoice
  delete: async (id) => {
    await db.query(`DELETE FROM room_fee_invoices WHERE id = ?`, [id]);
  },

  // Get room fee invoices by student and semester
  getByStudentAndSemester: async (studentId, semesterId) => {
    const [rows] = await db.query(
      `SELECT rfi.*, r.room_number, inv.status, inv.invoice_code
       FROM room_fee_invoices rfi
       JOIN rooms r ON rfi.room_id = r.id
       JOIN invoices inv ON rfi.invoice_id = inv.id
       WHERE rfi.student_id = ? AND rfi.semester_id = ?`,
      [studentId, semesterId]
    );
    return rows[0];
  },

  // Check if room fee invoice exists for student in semester
  checkExists: async (studentId, semesterId) => {
    const [rows] = await db.query(
      `SELECT id FROM room_fee_invoices 
       WHERE student_id = ? AND semester_id = ?`,
      [studentId, semesterId]
    );
    return rows.length > 0;
  },
};

export default RoomFeeInvoice;
