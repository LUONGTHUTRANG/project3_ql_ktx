import db from "../config/db.js";

const MonthlyUsage = {
  getUsageStatus: async (month, year, buildingId) => {
    let query = `
      SELECT 
        r.id as room_id, 
        r.room_number, 
        r.floor,
        b.name as building_name,
        mu.id as usage_id,
        mu.electricity_new_index as current_electricity,
        mu.water_new_index as current_water,
        mu.total_amount,
        mu.created_at as last_updated,
        i.status as invoice_status,
        (SELECT electricity_new_index FROM monthly_usages WHERE room_id = r.id AND (year < ? OR (year = ? AND month < ?)) ORDER BY year DESC, month DESC LIMIT 1) as old_electricity,
        (SELECT water_new_index FROM monthly_usages WHERE room_id = r.id AND (year < ? OR (year = ? AND month < ?)) ORDER BY year DESC, month DESC LIMIT 1) as old_water
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      LEFT JOIN monthly_usages mu ON r.id = mu.room_id AND mu.month = ? AND mu.year = ?
      LEFT JOIN invoices i ON mu.id = i.usage_id
    `;

    // Params for subqueries (old index)
    const params = [year, year, month, year, year, month];
    // Params for main join (current usage)
    params.push(month, year);

    if (buildingId && buildingId !== "all") {
      query += " WHERE r.building_id = ?";
      params.push(buildingId);
    }

    query += " ORDER BY b.name, r.room_number";

    const [rows] = await db.query(query, params);
    return rows;
  },

  getLatestUsageBefore: async (roomId, month, year) => {
    const [rows] = await db.query(
      `SELECT * FROM monthly_usages 
       WHERE room_id = ? AND (year < ? OR (year = ? AND month < ?)) 
       ORDER BY year DESC, month DESC LIMIT 1`,
      [roomId, year, year, month]
    );
    return rows[0];
  },

  create: async (data) => {
    const {
      room_id,
      month,
      year,
      electricity_old_index,
      electricity_new_index,
      electricity_price,
      water_old_index,
      water_new_index,
      water_price,
      total_amount,
    } = data;

    const [result] = await db.query(
      `INSERT INTO monthly_usages 
      (room_id, month, year, electricity_old_index, electricity_new_index, electricity_price, water_old_index, water_new_index, water_price, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        room_id,
        month,
        year,
        electricity_old_index,
        electricity_new_index,
        electricity_price,
        water_old_index,
        water_new_index,
        water_price,
        total_amount,
      ]
    );
    return result.insertId;
  },

  // Get service prices (assuming they are stored in a table or config, but for now let's assume we fetch them)
  // Wait, I seeded 'service_prices' table. I should use it.
  getCurrentServicePrices: async () => {
    const [rows] = await db.query(
      "SELECT * FROM service_prices WHERE is_active = 1"
    );
    return rows;
  },
};

export default MonthlyUsage;
