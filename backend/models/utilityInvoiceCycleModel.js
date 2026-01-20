import db from "../config/db.js";

const UtilityInvoiceCycle = {
  // Get cycle by ID
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoice_cycles WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get cycle by month and year
  getByMonthYear: async (month, year) => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoice_cycles WHERE month = ? AND year = ?`,
      [month, year]
    );
    return rows[0];
  },

  // Get all cycles
  getAll: async () => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoice_cycles ORDER BY year DESC, month DESC`
    );
    return rows;
  },

  // Get current cycle (latest one)
  getCurrent: async () => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoice_cycles ORDER BY year DESC, month DESC LIMIT 1`
    );
    return rows[0];
  },

  // Create new cycle
  create: async (data) => {
    const { month, year, status = "DRAFT" } = data;

    const [result] = await db.query(
      `INSERT INTO utility_invoice_cycles (month, year, status)
       VALUES (?, ?, ?)`,
      [month, year, status]
    );
    return result.insertId;
  },

  // Update cycle status
  updateStatus: async (id, status) => {
    let updateData = { status };

    if (status === "PUBLISHED") {
      updateData.published_at = new Date();
    } else if (status === "CLOSED") {
      updateData.closed_at = new Date();
    }

    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    values.push(id);

    await db.query(
      `UPDATE utility_invoice_cycles SET ${fields} WHERE id = ?`,
      values
    );
  },

  // Delete cycle
  delete: async (id) => {
    // First delete all utility invoices in this cycle
    await db.query(`DELETE FROM utility_invoices WHERE cycle_id = ?`, [id]);
    // Then delete the cycle
    await db.query(`DELETE FROM utility_invoice_cycles WHERE id = ?`, [id]);
  },

  // Get cycles by status
  getByStatus: async (status) => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoice_cycles WHERE status = ? ORDER BY year DESC, month DESC`,
      [status]
    );
    return rows;
  },

  // Count invoices in cycle by status
  countInvoicesByStatus: async (cycleId, status) => {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM utility_invoices 
       WHERE cycle_id = ? AND status = ?`,
      [cycleId, status]
    );
    return rows[0].count;
  },
};

export default UtilityInvoiceCycle;
