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
      `SELECT r.*, 
              sr.room_id as assigned_room_id,
              rm.room_number as assigned_room_number,
              b.name as assigned_building_name
       FROM registrations r
       LEFT JOIN stay_records sr ON r.student_id = sr.student_id 
           AND sr.semester_id = r.semester_id 
           AND sr.status = 'ACTIVE'
       LEFT JOIN rooms rm ON sr.room_id = rm.id
       LEFT JOIN buildings b ON rm.building_id = b.id
       WHERE r.student_id = ? 
       ORDER BY r.created_at DESC`,
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
      SELECT r.*, s.full_name as student_name, s.mssv,
             sr.room_id as assigned_room_id,
             rm.room_number as assigned_room_number,
             b.name as assigned_building_name
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN stay_records sr ON r.student_id = sr.student_id 
          AND sr.semester_id = r.semester_id 
          AND sr.status = 'ACTIVE'
      LEFT JOIN rooms rm ON sr.room_id = rm.id
      LEFT JOIN buildings b ON rm.building_id = b.id
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

  // Get ALL registrations (for Manager to see all types)
  getAll: async (limit = 20, offset = 0, filters = {}) => {
    let query = `
      SELECT r.*, s.full_name as student_name, s.mssv, b.name as building_name,
             sr.room_id as assigned_room_id,
             rm.room_number as assigned_room_number,
             b2.name as assigned_building_name
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN buildings b ON r.desired_building_id = b.id
      LEFT JOIN stay_records sr ON r.student_id = sr.student_id 
          AND sr.semester_id = r.semester_id 
          AND sr.status = 'ACTIVE'
      LEFT JOIN rooms rm ON sr.room_id = rm.id
      LEFT JOIN buildings b2 ON rm.building_id = b2.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND r.status = ?";
      params.push(filters.status);
    }

    if (filters.registration_type) {
      query += " AND r.registration_type = ?";
      params.push(filters.registration_type);
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

  countAll: async (filters = {}) => {
    let query = `
      SELECT COUNT(*) as count
      FROM registrations r
      JOIN students s ON r.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND r.status = ?";
      params.push(filters.status);
    }

    if (filters.registration_type) {
      query += " AND r.registration_type = ?";
      params.push(filters.registration_type);
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
      `SELECT r.*, s.full_name as student_name, s.mssv, b.name as building_name,
              sr.room_id as assigned_room_id,
              rm.room_number as assigned_room_number,
              b2.name as assigned_building_name
       FROM registrations r
       JOIN students s ON r.student_id = s.id
       LEFT JOIN buildings b ON r.desired_building_id = b.id
       LEFT JOIN stay_records sr ON r.student_id = sr.student_id 
           AND sr.semester_id = r.semester_id 
           AND sr.status = 'ACTIVE'
       LEFT JOIN rooms rm ON sr.room_id = rm.id
       LEFT JOIN buildings b2 ON rm.building_id = b2.id
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

  // Get pending NORMAL registrations for auto-assign
  getPendingNormalRegistrations: async (semesterId) => {
    const [rows] = await db.query(
      `SELECT r.*, s.mssv, s.full_name as student_name, s.gender
       FROM registrations r
       JOIN students s ON r.student_id = s.id
       WHERE r.status = 'PENDING' 
         AND r.registration_type = 'NORMAL'
         AND r.semester_id = ?
       ORDER BY r.created_at ASC`,
      [semesterId]
    );
    return rows;
  },

  // Assign room to student
  assignRoom: async (registrationId, roomId, semesterId, studentId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Update registration status
      await connection.query(
        "UPDATE registrations SET status = 'APPROVED' WHERE id = ?",
        [registrationId]
      );

      // Create stay record
      const [semester] = await connection.query(
        "SELECT start_date, end_date FROM semesters WHERE id = ?",
        [semesterId]
      );

      await connection.query(
        `INSERT INTO stay_records (student_id, room_id, semester_id, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [studentId, roomId, semesterId, semester[0].start_date, semester[0].end_date]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

export default Registration;
