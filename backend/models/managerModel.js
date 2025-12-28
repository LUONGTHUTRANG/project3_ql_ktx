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
      username,
      email,
      password_hash,
      full_name,
      phone_number,
      is_first_login,
      building_id,
      fcm_token,
    } = data;
    const [result] = await db.query(
      "INSERT INTO managers (username, email, password_hash, full_name, phone_number, is_first_login, building_id, fcm_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        username,
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
    const {
      username,
      email,
      password_hash,
      full_name,
      phone_number,
      is_first_login,
      building_id,
      fcm_token,
    } = data;
    await db.query(
      "UPDATE managers SET username = ?, email = ?, password_hash = ?, full_name = ?, phone_number = ?, is_first_login = ?, building_id = ?, fcm_token = ? WHERE id = ?",
      [
        username,
        email,
        password_hash,
        full_name,
        phone_number,
        is_first_login,
        building_id,
        fcm_token,
        id,
      ]
    );
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM managers WHERE id = ?", [id]);
    return { id };
  },
};

export default Manager;
