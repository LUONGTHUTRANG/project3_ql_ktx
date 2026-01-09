import db from "../config/db.js";

const Manager = {
  getAll: async () => {
    const [rows] = await db.query(
      `SELECT m.*, b.name as building_name
       FROM managers m
       LEFT JOIN buildings b ON m.building_id = b.id
      `
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT m.*, b.name as building_name
       FROM managers m
       LEFT JOIN buildings b ON m.building_id = b.id
       WHERE m.id = ?`,
      [id]
    );
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
    const allowedFields = ['email', 'full_name', 'phone_number', 'building_id'];
    const setClause = [];
    const values = [];

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setClause.length === 0) {
      throw new Error("Không có trường nào để cập nhật");
    }

    values.push(id);
    const query = `UPDATE managers SET ${setClause.join(', ')} WHERE id = ?`;
    
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      throw new Error("Cán bộ quản lý không tồn tại");
    }
    
    return { id, ...data };
  },

  delete: async (id) => {
    await db.query("DELETE FROM managers WHERE id = ?", [id]);
    return { id };
  },

  updateContact: async (id, updateData) => {
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
    const query = `UPDATE managers SET ${setClause.join(', ')} WHERE id = ?`;
    
    const [result] = await db.query(query, values);
    return result.affectedRows > 0;
  },
};

export default Manager;
