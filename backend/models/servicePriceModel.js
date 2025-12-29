import db from "../config/db.js";

const ServicePrice = {
  getAll: async () => {
    const [rows] = await db.query(
      "SELECT * FROM service_prices WHERE is_active = 1 ORDER BY apply_date DESC"
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      "SELECT * FROM service_prices WHERE id = ? AND is_active = 1",
      [id]
    );
    return rows[0];
  },

  getByServiceName: async (serviceName) => {
    const [rows] = await db.query(
      "SELECT * FROM service_prices WHERE service_name = ? AND is_active = 1 ORDER BY apply_date DESC LIMIT 1",
      [serviceName]
    );
    return rows[0];
  },

  create: async (data) => {
    const { service_name, unit_price, apply_date, is_active = 1 } = data;

    const [result] = await db.query(
      "INSERT INTO service_prices (service_name, unit_price, apply_date, is_active) VALUES (?, ?, ?, ?)",
      [service_name, unit_price, apply_date, is_active]
    );

    return ServicePrice.getById(result.insertId);
  },

  update: async (id, data) => {
    const { service_name, unit_price, apply_date, is_active } = data;

    await db.query(
      "UPDATE service_prices SET service_name = ?, unit_price = ?, apply_date = ?, is_active = ? WHERE id = ?",
      [service_name, unit_price, apply_date, is_active, id]
    );

    return ServicePrice.getById(id);
  },

  delete: async (id) => {
    const [result] = await db.query(
      "DELETE FROM service_prices WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  },

  // Soft delete - just set is_active to 0
  deactivate: async (id) => {
    await db.query(
      "UPDATE service_prices SET is_active = 0 WHERE id = ?",
      [id]
    );
    return { success: true };
  },
};

export default ServicePrice;
