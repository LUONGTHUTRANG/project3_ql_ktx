import db from "../config/db.js";

const Manager = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM managers");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM managers WHERE id = ?", [id]);
    return rows[0];
  },

  create: async (data) => {
    const {
      email,
      password_hash,
      full_name,
      phone_number,
      is_first_login,
      building_id,
      fcm_token,
    } = data;
    const [result] = await db.query(
      "INSERT INTO managers (email, password_hash, full_name, phone_number, is_first_login, building_id, fcm_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        email,
        password_hash,
        full_name,
        phone_number,
        is_first_login,
        building_id,
        fcm_token,
      ]
    );
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const { email, full_name, phone_number, building_id, is_active } = data;
    await db.query(
      "UPDATE managers SET email = ?, full_name = ?, phone_number = ?, is_active = ?, building_id = ? WHERE id = ?",
      [email, full_name, phone_number, is_active, building_id, id]
    );
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM managers WHERE id = ?", [id]);
    return { id };
  },
};

export default Manager;
