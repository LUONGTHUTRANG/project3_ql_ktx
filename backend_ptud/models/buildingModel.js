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
};

export default Building;
