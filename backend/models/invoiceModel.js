import db from "../config/db.js";

const Invoice = {
  countOverdue: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM invoices WHERE status = 'DRAFT' AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    return rows[0].count;
  },

  getAll: async () => {
    const [rows] = await db.query(`
      SELECT i.* FROM invoices i
      ORDER BY i.created_at DESC
    `);
    return rows;
  },

  getByStudentId: async (studentId) => {
    const [rows] = await db.query(
      `SELECT * FROM invoices WHERE id IN 
       (SELECT invoice_id FROM room_fee_invoices WHERE student_id = ?)
       OR id IN 
       (SELECT invoice_id FROM other_invoices WHERE target_student_id = ?)
       ORDER BY created_at DESC`,
      [studentId, studentId]
    );
    return rows;
  },

  getForStudentApp: async (studentId, roomId) => {
    // For student app, get utility invoices for the room and room fee/other invoices for the student
    const query = `
      SELECT i.* FROM invoices i
      WHERE i.id IN (SELECT invoice_id FROM utility_invoices WHERE room_id = ?)
         OR i.id IN (SELECT invoice_id FROM room_fee_invoices WHERE student_id = ?)
         OR i.id IN (SELECT invoice_id FROM other_invoices WHERE target_student_id = ?)
      ORDER BY i.created_at DESC
    `;
    const [rows] = await db.query(query, [roomId, studentId, studentId]);
    return rows;
  },

  getById: async (id) => {
    const [invoices] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );
    
    if (!invoices || invoices.length === 0) {
      return null;
    }
    
    const invoice = invoices[0];
    const category = invoice.invoice_category;
    
    // Enrich invoice data based on category
    if (category === 'ROOM_FEE') {
      // For room fee, join with room_fee_invoices to get semester_id
      const [roomFeeData] = await db.query(
        `SELECT rfi.semester_id, sem.term, sem.academic_year
         FROM room_fee_invoices rfi
         JOIN semesters sem ON rfi.semester_id = sem.id
         WHERE rfi.invoice_id = ?
         LIMIT 1`,
        [id]
      );
      
      if (roomFeeData && roomFeeData.length > 0) {
        invoice.semester_id = roomFeeData[0].semester_id;
        invoice.semester_term = roomFeeData[0].term;
        invoice.semester_academic_year = roomFeeData[0].academic_year;
      }
    } else if (category === 'UTILITY') {
      // For utility, join with utility_invoices and utility_invoice_cycles to get month/year and meter readings
      // Also join with service_prices to get unit_price and unit for electricity (id=1) and water (id=2)
      const [utilityData] = await db.query(
        `SELECT ui.electricity_old, ui.electricity_new, ui.water_old, ui.water_new, ui.amount as utility_amount, uic.month, uic.year,
                sp_elec.unit_price as electricity_price, sp_elec.unit as electricity_unit,
                sp_water.unit_price as water_price, sp_water.unit as water_unit
         FROM utility_invoices ui
         JOIN utility_invoice_cycles uic ON ui.cycle_id = uic.id
         LEFT JOIN service_prices sp_elec ON sp_elec.id = 1 AND sp_elec.is_active = 1
         LEFT JOIN service_prices sp_water ON sp_water.id = 2 AND sp_water.is_active = 1
         WHERE ui.invoice_id = ?
         LIMIT 1`,
        [id]
      );
      
      if (utilityData && utilityData.length > 0) {
        invoice.month = utilityData[0].month;
        invoice.year = utilityData[0].year;
        invoice.electricity_old = utilityData[0].electricity_old;
        invoice.electricity_new = utilityData[0].electricity_new;
        invoice.water_old = utilityData[0].water_old;
        invoice.water_new = utilityData[0].water_new;
        invoice.utility_amount = utilityData[0].utility_amount;
        invoice.electricity_price = utilityData[0].electricity_price;
        invoice.electricity_unit = utilityData[0].electricity_unit;
        invoice.water_price = utilityData[0].water_price;
        invoice.water_unit = utilityData[0].water_unit;
      }
    }
    
    return invoice;
  },

  create: async (data) => {
    const {
      invoice_code,
      invoice_category,
      total_amount,
      status = "UNPAID",
      created_by_manager_id,
      published_at,
    } = data;

    const [result] = await db.query(
      `INSERT INTO invoices 
       (invoice_code, invoice_category, total_amount, status, created_by_manager_id, published_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoice_code, invoice_category, total_amount, status, created_by_manager_id, published_at]
    );
    return result.insertId;
  },

  delete: async (invoiceCode) => {
    await db.query(`DELETE FROM invoices WHERE invoice_code = ?`, [invoiceCode]);
  },

  getByBuildingId: async (buildingId, category = null, status = null) => {
    let query = `
      SELECT i.* FROM invoices i
      WHERE i.id IN (
        SELECT ui.invoice_id FROM utility_invoices ui
        JOIN rooms r ON ui.room_id = r.id
        WHERE r.building_id = ?
      )
      OR i.id IN (
        SELECT rfi.invoice_id FROM room_fee_invoices rfi
        JOIN rooms r ON rfi.room_id = r.id
        WHERE r.building_id = ?
      )
    `;
    
    const params = [buildingId, buildingId];

    if (category) {
      query += ` AND i.invoice_category = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY i.created_at DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default Invoice;
