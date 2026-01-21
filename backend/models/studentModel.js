import db from "../config/db.js";

const Student = {
  getAll: async (limit = 20, offset = 0) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status,
             sr.status as stay_status, sr.room_id as current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN stay_records sr ON s.id = sr.student_id AND sr.status = 'ACTIVE'
      LEFT JOIN rooms r ON sr.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE s.student_status = 'STUDYING'
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(query, [limit, offset]);
    return rows;
  },

  countAll: async () => {
    const [rows] = await db.query("SELECT COUNT(*) as count FROM students");
    return rows[0].count;
  },

  getById: async (id) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status,
             sr.status as stay_status, sr.room_id as current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN stay_records sr ON s.id = sr.student_id AND sr.status = 'ACTIVE'
      LEFT JOIN rooms r ON sr.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE s.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  getByRoomId: async (roomId) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status,
             sr.status as stay_status, sr.room_id as current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN stay_records sr ON s.id = sr.student_id AND sr.status = 'ACTIVE'
      LEFT JOIN rooms r ON sr.room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE sr.room_id = ?
    `;
    const [rows] = await db.query(query, [roomId]);
    return rows;
  },

  getByBuildingId: async (buildingId) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status,
             sr.status as stay_status, sr.room_id as current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      JOIN stay_records sr ON s.id = sr.student_id AND sr.status = 'ACTIVE'
      JOIN rooms r ON sr.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      WHERE r.building_id = ?
    `;
    const [rows] = await db.query(query, [buildingId]);
    return rows;
  },

  updateById: async (id, updateData) => {
    const allowedFields = ['phone_number', 'email'];
    const setClause = [];
    const values = [];

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setClause.length === 0) {
      throw new Error("Không có trường nào để cập nhật");
    }

    values.push(id);
    const query = `UPDATE students SET ${setClause.join(', ')} WHERE id = ?`;

    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },

  // Get current active stay record with full details for renewal
  getCurrentStay: async (studentId) => {
    const query = `
      SELECT 
        sr.id as stay_id,
        sr.student_id,
        sr.room_id,
        sr.semester_id,
        sr.start_date,
        sr.end_date,
        sr.status as stay_status,
        r.room_number,
        r.floor,
        r.max_capacity,
        r.price_per_semester,
        b.id as building_id,
        b.name as building_name,
        s.term,
        s.academic_year,
        s.start_date as semester_start,
        s.end_date as semester_end,
        DATEDIFF(CURDATE(), sr.start_date) as days_stayed,
        TIMESTAMPDIFF(MONTH, sr.start_date, CURDATE()) as months_stayed
      FROM stay_records sr
      JOIN rooms r ON sr.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      JOIN semesters s ON sr.semester_id = s.id
      WHERE sr.student_id = ? AND sr.status = 'ACTIVE'
      ORDER BY sr.start_date DESC
      LIMIT 1
    `;
    const [rows] = await db.query(query, [studentId]);
    return rows[0] || null;
  },
};

export default Student;

