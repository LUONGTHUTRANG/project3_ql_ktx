import db from "../config/db.js";

const Building = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT b.*, COUNT(r.id) as room_count 
      FROM buildings b 
      LEFT JOIN rooms r ON b.id = r.building_id 
      GROUP BY b.id
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM buildings WHERE id = ?", [id]);
    return rows[0];
  },

  create: async (data) => {
    const { name, location, gender_restriction } = data;
    const [result] = await db.query(
      "INSERT INTO buildings (name, location, gender_restriction) VALUES (?, ?, ?)",
      [name, location, gender_restriction]
    );
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const { name, location, gender_restriction } = data;
    await db.query(
      "UPDATE buildings SET name = ?, location = ?, gender_restriction = ? WHERE id = ?",
      [name, location, gender_restriction, id]
    );
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM buildings WHERE id = ?", [id]);
    return { id };
  },

  /**
   * Get building occupancy rates with room and student statistics
   * Uses stay_records to get accurate occupancy data
   */
  getOccupancyStats: async () => {
    const [rows] = await db.query(`
      SELECT 
        b.id,
        b.name,
        b.location,
        COUNT(DISTINCT r.id) as total_rooms,
        COALESCE(SUM(r.max_capacity), 0) as total_capacity,
        COALESCE(COUNT(DISTINCT s.id), 0) as total_students,
        CASE 
          WHEN COALESCE(SUM(r.max_capacity), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(COUNT(DISTINCT s.id), 0) / COALESCE(SUM(r.max_capacity), 0)) * 100)
        END as occupancy_rate
      FROM buildings b
      LEFT JOIN rooms r ON b.id = r.building_id
      LEFT JOIN stay_records sr ON r.id = sr.room_id AND sr.status = 'ACTIVE'
      LEFT JOIN students s ON sr.student_id = s.id
      GROUP BY b.id, b.name, b.location
      ORDER BY b.name
    `);
    return rows;
  },
};

export default Building;
