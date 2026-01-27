import db from "../config/db.js";

const Stay = {
  // Check if student has an active stay record
  hasActiveStay: async (studentId) => {
    try {
      const [rows] = await db.query(
        `SELECT sr.*, r.room_number, b.name as building_name, r.floor,
                s.term, s.academic_year
         FROM stay_records sr
         JOIN rooms r ON sr.room_id = r.id
         JOIN buildings b ON r.building_id = b.id
         JOIN semesters s ON sr.semester_id = s.id
         WHERE sr.student_id = ? AND sr.status = 'ACTIVE'
         LIMIT 1`,
        [studentId]
      );
      return rows.length > 0 ? { hasActiveStay: true, data: rows[0] } : { hasActiveStay: false, data: null };
    } catch (error) {
      console.error("Error checking active stay:", error);
      throw error;
    }
  },

  // Get active stay details for a student
  getActiveStay: async (studentId) => {
    try {
      const [rows] = await db.query(
        `SELECT sr.*, r.room_number, b.name as building_name, r.floor,
                s.term, s.academic_year
         FROM stay_records sr
         JOIN rooms r ON sr.room_id = r.id
         JOIN buildings b ON r.building_id = b.id
         JOIN semesters s ON sr.semester_id = s.id
         WHERE sr.student_id = ? AND sr.status = 'ACTIVE'
         LIMIT 1`,
        [studentId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error getting active stay:", error);
      throw error;
    }
  },

  // Get stay record by ID
  getById: async (id) => {
    try {
      const [rows] = await db.query("SELECT * FROM stay_records WHERE id = ?", [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error getting stay by id:", error);
      throw error;
    }
  },

  // Get all stays for a student
  getByStudentId: async (studentId) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM stay_records WHERE student_id = ? ORDER BY start_date DESC",
        [studentId]
      );
      return rows;
    } catch (error) {
      console.error("Error getting stays by student id:", error);
      throw error;
    }
  },

  // Create new stay record
  create: async (data) => {
    const { student_id, room_id, semester_id, start_date, end_date, status } = data;
    try {
      const [result] = await db.query(
        "INSERT INTO stay_records (student_id, room_id, semester_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
        [student_id, room_id, semester_id, start_date, end_date, status || 'ACTIVE']
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error("Error creating stay record:", error);
      throw error;
    }
  },

  // Update stay record status
  updateStatus: async (id, status) => {
    try {
      const [result] = await db.query(
        "UPDATE stay_records SET status = ? WHERE id = ?",
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating stay status:", error);
      throw error;
    }
  },
};

export default Stay;
