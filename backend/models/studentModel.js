import db from "../config/db.js";

const Student = {
  getAll: async (limit = 20, offset = 0) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status, s.stay_status, s.current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN rooms r ON s.current_room_id = r.id
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
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status, s.stay_status, s.current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN rooms r ON s.current_room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE s.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  getByRoomId: async (roomId) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status, s.stay_status, s.current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      LEFT JOIN rooms r ON s.current_room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE s.current_room_id = ?
    `;
    const [rows] = await db.query(query, [roomId]);
    return rows;
  },

  getByBuildingId: async (buildingId) => {
    const query = `
      SELECT s.id, s.mssv, s.full_name, s.email, s.phone_number, s.gender, s.class_name, s.student_status, s.stay_status, s.current_room_id,
             r.room_number, b.name as building_name
      FROM students s
      JOIN rooms r ON s.current_room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      WHERE r.building_id = ?
    `;
    const [rows] = await db.query(query, [buildingId]);
    return rows;
  },
};

export default Student;
