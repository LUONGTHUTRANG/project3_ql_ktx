import db from "../config/db.js";

const UtilityInvoice = {
  // Get utility invoice by ID
  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoices WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // Get all utility invoices for a cycle (with optional building filter)
  getByCycleId: async (cycleId, buildingId = null) => {
    let query = `SELECT ui.*, r.room_number, r.floor, b.id as building_id, b.name as building_name,
                 i.status as invoice_status
                 FROM utility_invoices ui
                 JOIN rooms r ON ui.room_id = r.id
                 JOIN buildings b ON r.building_id = b.id
                 LEFT JOIN invoices i ON ui.invoice_id = i.id
                 WHERE ui.cycle_id = ?`;
    const params = [cycleId];
    
    // Add building filter if provided (for manager accounts)
    if (buildingId) {
      query += ` AND b.id = ?`;
      params.push(buildingId);
    }
    
    query += ` ORDER BY r.floor DESC, r.room_number ASC`;
    
    const [rows] = await db.query(query, params);
    return rows;
  },

  // Get utility invoices by room and cycle
  getByRoomAndCycle: async (roomId, cycleId) => {
    const [rows] = await db.query(
      `SELECT * FROM utility_invoices 
       WHERE room_id = ? AND cycle_id = ?`,
      [roomId, cycleId]
    );
    return rows[0];
  },

  // Create utility invoice
  create: async (data) => {
    const {
      cycle_id,
      room_id,
      electricity_old,
      electricity_new,
      water_old,
      water_new,
      amount,
      status = "DRAFT",
    } = data;

    const [result] = await db.query(
      `INSERT INTO utility_invoices 
       (cycle_id, room_id, electricity_old, electricity_new, water_old, water_new, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cycle_id, room_id, electricity_old, electricity_new, water_old, water_new, amount, status]
    );
    return result.insertId;
  },

  // Update utility invoice
  update: async (id, data) => {
    const {
      electricity_old,
      electricity_new,
      water_old,
      water_new,
      amount,
      status,
      invoice_id,
    } = data;

    const updates = [];
    const values = [];

    if (electricity_old !== undefined) {
      updates.push("electricity_old = ?");
      values.push(electricity_old);
    }
    if (electricity_new !== undefined) {
      updates.push("electricity_new = ?");
      values.push(electricity_new);
    }
    if (water_old !== undefined) {
      updates.push("water_old = ?");
      values.push(water_old);
    }
    if (water_new !== undefined) {
      updates.push("water_new = ?");
      values.push(water_new);
    }
    if (amount !== undefined) {
      updates.push("amount = ?");
      values.push(amount);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (invoice_id !== undefined) {
      updates.push("invoice_id = ?");
      values.push(invoice_id);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE utility_invoices SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(query, values);
  },

  // Delete utility invoice
  delete: async (id) => {
    await db.query(`DELETE FROM utility_invoices WHERE id = ?`, [id]);
  },

  // Get utility invoices by status for a cycle
  getByCycleIdAndStatus: async (cycleId, status) => {
    const [rows] = await db.query(
      `SELECT ui.*, r.room_number, r.floor, b.id as building_id, b.name as building_name
       FROM utility_invoices ui
       JOIN rooms r ON ui.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       WHERE ui.cycle_id = ? AND ui.status = ?
       ORDER BY r.floor DESC, r.room_number ASC`,
      [cycleId, status]
    );
    return rows;
  },

  // Get utility invoices ready to publish
  getReadyToPublish: async (cycleId) => {
    const [rows] = await db.query(
      `SELECT ui.*, r.room_number, r.floor, b.name as building_name
       FROM utility_invoices ui
       JOIN rooms r ON ui.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       WHERE ui.cycle_id = ? AND ui.status IN ('READY', 'PUBLISHED')
       ORDER BY r.floor DESC, r.room_number ASC`,
      [cycleId]
    );
    return rows;
  },

  // Check if all invoices in a cycle have been recorded (no unrecorded readings)
  checkReadyToPublish: async (cycleId, buildingId = null) => {
    let query = `SELECT COUNT(*) as unrecordedCount
       FROM utility_invoices ui
       JOIN rooms r ON ui.room_id = r.id
       WHERE ui.cycle_id = ? AND (ui.electricity_new = ui.electricity_old OR ui.water_new = ui.water_old OR ui.electricity_new IS NULL OR ui.water_new IS NULL)`;
    const params = [cycleId];
    
    // Add building filter if provided (for manager accounts)
    if (buildingId) {
      query += ` AND r.building_id = ?`;
      params.push(buildingId);
    }
    
    const [rows] = await db.query(query, params);
    console.log("Unrecorded count for cycle", cycleId, ":", rows[0].unrecordedCount);
    return rows[0].unrecordedCount === 0;
  },

  // Get all utility invoices for a cycle (for publishing)
  getAllByCycle: async (cycleId, buildingId = null) => {
    let query = `SELECT ui.id, ui.cycle_id, ui.room_id, ui.electricity_old, ui.electricity_new, 
                        ui.water_old, ui.water_new, ui.amount, ui.status, ui.invoice_id, ui.created_at,
                        r.room_number, r.floor, b.id as building_id, b.name as building_name
       FROM utility_invoices ui
       JOIN rooms r ON ui.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       WHERE ui.cycle_id = ?`;
    const params = [cycleId];
    
    // Add building filter if provided (for manager accounts)
    if (buildingId) {
      query += ` AND b.id = ?`;
      params.push(buildingId);
    }
    
    query += ` ORDER BY r.floor DESC, r.room_number ASC`;
    
    const [rows] = await db.query(query, params);
    console.log(`getAllByCycle returned ${rows.length} rows with room_ids:`, rows.map(r => r.room_id));
    return rows;
  },
};

export default UtilityInvoice;
