import db from "../config/db.js";

// Helper function to format date to YYYY-MM-DD
const formatDateToSQL = (date) => {
  if (!date) return null;
  
  // If it's a string, handle ISO datetime format
  if (typeof date === 'string') {
    // Extract just the date part from ISO string (2026-01-06T17:00:00.000Z -> 2026-01-06)
    return date.split('T')[0];
  }
  
  // If it's a Date object, convert to YYYY-MM-DD
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

const ServicePrice = {
  getAll: async () => {
    const [rows] = await db.query(
      "SELECT * FROM service_prices WHERE is_active = 1"
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
    const { service_name, unit, unit_price, apply_date, is_active = 1 } = data;
    
    // Format date to YYYY-MM-DD
    const formattedDate = formatDateToSQL(apply_date);

    const [result] = await db.query(
      "INSERT INTO service_prices (service_name, unit, unit_price, apply_date, is_active) VALUES (?, ?, ?, ?, ?)",
      [service_name, unit, parseFloat(unit_price), formattedDate, is_active]
    );

    return ServicePrice.getById(result.insertId);
  },

  update: async (id, data) => {
    const allowedFields = ['unit', 'unit_price', 'apply_date', 'is_active'];
    const setClause = [];
    const values = [];

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        // Format date if it's apply_date
        if (key === 'apply_date') {
          setClause.push(`${key} = ?`);
          values.push(formatDateToSQL(value));
        } else if (key === 'unit_price') {
          setClause.push(`${key} = ?`);
          values.push(parseFloat(value));
        } else {
          setClause.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (setClause.length === 0) {
      throw new Error("Không có trường nào để cập nhật");
    }

    values.push(id);
    const query = `UPDATE service_prices SET ${setClause.join(', ')} WHERE id = ?`;
    
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      throw new Error("Giá dịch vụ không tồn tại");
    }

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
