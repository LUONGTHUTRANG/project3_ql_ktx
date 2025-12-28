import db from "../config/db.js";

const Registration = {
  countNew: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM registrations WHERE status = 'PENDING'"
    );
    return rows[0].count;
  },

  create: async (data) => {
    const {
      student_id,
      semester_id,
      registration_type,
      desired_room_id,
      desired_building_id,
      priority_category,
      priority_description,
      evidence_file_path,
    } = data;

    const [result] = await db.query(
      `INSERT INTO registrations 
      (student_id, semester_id, registration_type, desired_room_id, desired_building_id, priority_category, priority_description, evidence_file_path, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        student_id,
        semester_id,
        registration_type,
        desired_room_id,
        desired_building_id,
        priority_category,
        priority_description,
        evidence_file_path,
      ]
    );
    return result.insertId;
  },

  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      "SELECT * FROM registrations WHERE student_id = ? ORDER BY created_at DESC",
      [studentId]
    );
    return rows;
  },

  // Check if student already has a pending or approved registration for this semester
  checkExistingRegistration: async (studentId, semesterId) => {
    const [rows] = await db.query(
      "SELECT * FROM registrations WHERE student_id = ? AND semester_id = ? AND status IN ('PENDING', 'AWAITING_PAYMENT', 'APPROVED', 'COMPLETED')",
      [studentId, semesterId]
    );
    return rows.length > 0;
  },

  getAllPriority: async (limit = 20, offset = 0, filters = {}) => {
    let query = `
      SELECT r.*, s.full_name as student_name, s.mssv
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.registration_type = 'PRIORITY'
    `;
    const params = [];

    if (filters.status) {
      query += " AND r.status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (s.full_name LIKE ? OR s.mssv LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  },

  countAllPriority: async (filters = {}) => {
    let query = `
      SELECT COUNT(*) as count
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.registration_type = 'PRIORITY'
    `;
    const params = [];

    if (filters.status) {
      query += " AND r.status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (s.full_name LIKE ? OR s.mssv LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count;
  },
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT r.*, s.full_name as student_name, s.mssv, b.name as building_name
       FROM registrations r
       JOIN students s ON r.student_id = s.id
       LEFT JOIN buildings b ON r.desired_building_id = b.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0];
  },

  updateStatus: async (id, status, adminNote) => {
    const [result] = await db.query(
      "UPDATE registrations SET status = ?, admin_note = ? WHERE id = ?",
      [status, adminNote, id]
    );
    return result.affectedRows > 0;
  },
};

export default Registration;
