import db from "../config/db.js";

const Invoice = {
  countOverdue: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM invoices WHERE status = 'UNPAID' AND due_date < NOW()"
    );
    return rows[0].count;
  },

  getAll: async () => {
    const [rows] = await db.query(`
      SELECT i.*, r.room_number, s.full_name as student_name, s.mssv 
      FROM invoices i
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN students s ON i.student_id = s.id
      ORDER BY i.time_invoiced DESC
    `);
    return rows;
  },

  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT i.*, r.room_number, s.full_name as student_name, s.mssv 
      FROM invoices i
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN students s ON i.student_id = s.id
      WHERE i.student_id = ?
      ORDER BY i.time_invoiced DESC`,
      [studentId]
    );
    return rows;
  },

  getForStudentApp: async (studentId, roomId) => {
    const query = `
      SELECT i.*, r.room_number, s.full_name as student_name, s.mssv 
      FROM invoices i
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN students s ON i.student_id = s.id
      WHERE (i.room_id = ? AND i.type = 'UTILITY_FEE')
         OR (i.student_id = ? AND (i.type = 'ROOM_FEE' OR i.type = 'OTHER'))
      ORDER BY i.time_invoiced DESC
    `;
    const [rows] = await db.query(query, [roomId, studentId]);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT 
        i.*,
        mu.electricity_old_index,
        mu.electricity_new_index,
        mu.electricity_price,
        mu.water_old_index,
        mu.water_new_index,
        mu.water_price,
        mu.month as usage_month,
        mu.year as usage_year,
        r.room_number,
        b.name as building_name,
        s.full_name as student_name,
        s.mssv as student_code,
        payer.full_name as payer_name,
        payer.mssv as payer_code
      FROM invoices i
      LEFT JOIN monthly_usages mu ON i.usage_id = mu.id
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN students s ON i.student_id = s.id
      LEFT JOIN students payer ON i.paid_by_student_id = payer.id
      WHERE i.id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const {
      invoice_code,
      type,
      semester_id,
      room_id,
      student_id,
      usage_id,
      amount,
      description,
      status,
      due_date,
      paid_at,
      paid_by_student_id,
      payment_method,
      payment_proof,
      created_by_manager_id,
    } = data;
    const [result] = await db.query(
      "INSERT INTO invoices (invoice_code, type, semester_id, room_id, student_id, usage_id, amount, description, status, due_date, paid_at, paid_by_student_id, payment_method, payment_proof, created_by_manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        invoice_code,
        type,
        semester_id,
        room_id,
        student_id,
        usage_id,
        amount,
        description,
        status,
        due_date,
        paid_at,
        paid_by_student_id,
        payment_method,
        payment_proof,
        created_by_manager_id,
      ]
    );
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const {
      invoice_code,
      type,
      semester_id,
      room_id,
      student_id,
      usage_id,
      amount,
      description,
      status,
      due_date,
      paid_at,
      paid_by_student_id,
      payment_method,
      payment_proof,
      created_by_manager_id,
    } = data;
    await db.query(
      "UPDATE invoices SET invoice_code = ?, type = ?, semester_id = ?, room_id = ?, student_id = ?, usage_id = ?, amount = ?, description = ?, status = ?, due_date = ?, paid_at = ?, paid_by_student_id = ?, payment_method = ?, payment_proof = ?, created_by_manager_id = ? WHERE id = ?",
      [
        invoice_code,
        type,
        semester_id,
        room_id,
        student_id,
        usage_id,
        amount,
        description,
        status,
        due_date,
        paid_at,
        paid_by_student_id,
        payment_method,
        payment_proof,
        created_by_manager_id,
        id,
      ]
    );
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM invoices WHERE id = ?", [id]);
    return { id };
  },

  getByBuildingId: async (buildingId, type = null, status = null) => {
    let query = `
      SELECT i.*, r.room_number, b.name as building_name, s.full_name as student_name, s.mssv,
             mu.month as usage_month, mu.year as usage_year
      FROM invoices i
      LEFT JOIN rooms r ON i.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN students s ON i.student_id = s.id
      LEFT JOIN monthly_usages mu ON i.usage_id = mu.id
      WHERE r.building_id = ?
    `;
    const params = [buildingId];

    if (type) {
      query += ` AND i.type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY i.time_invoiced DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default Invoice;
