import db from "../config/db.js";

const Room = {
  countEmpty: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM rooms WHERE status = 'AVAILABLE'"
    );
    return rows[0].count;
  },

  countTotalCapacity: async () => {
    const [rows] = await db.query(
      "SELECT SUM(max_capacity) as total FROM rooms"
    );
    return rows[0].total || 0;
  },

  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM rooms");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM rooms WHERE id = ?", [id]);
    return rows[0];
  },

  getByBuildingId: async (buildingId) => {
    const [rows] = await db.query("SELECT * FROM rooms WHERE building_id = ? ORDER BY floor, room_number", [buildingId]);
    return rows;
  },

  create: async (data) => {
    const {
      building_id,
      room_number,
      floor,
      max_capacity,
      price_per_semester,
      has_ac,
      has_heater,
      has_washer,
      status,
    } = data;
    const [result] = await db.query(
      "INSERT INTO rooms (building_id, room_number, floor, max_capacity, price_per_semester, has_ac, has_heater, has_washer, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        building_id,
        room_number,
        floor,
        max_capacity,
        price_per_semester,
        has_ac,
        has_heater,
        has_washer,
        status,
      ]
    );
    return { id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const {
      building_id,
      room_number,
      floor,
      max_capacity,
      price_per_semester,
      has_ac,
      has_heater,
      has_washer,
      status,
    } = data;
    await db.query(
      "UPDATE rooms SET building_id = ?, room_number = ?, floor = ?, max_capacity = ?, price_per_semester = ?, has_ac = ?, has_heater = ?, has_washer = ?, status = ? WHERE id = ?",
      [
        building_id,
        room_number,
        floor,
        max_capacity,
        price_per_semester,
        has_ac,
        has_heater,
        has_washer,
        status,
        id,
      ]
    );
    return { id, ...data };
  },

  delete: async (id) => {
    // Delete related data from other tables (cascade delete)
    // 1. Delete invoices related to this room
    await db.query("DELETE FROM invoices WHERE room_id = ?", [id]);
    
    // 2. Delete monthly usages related to this room
    await db.query("DELETE FROM monthly_usages WHERE room_id = ?", [id]);
    
    // 3. Delete notification recipients related to this room
    await db.query("DELETE FROM notification_recipients WHERE room_id = ?", [id]);
    
    // 4. Delete registrations with this room as desired_room
    await db.query("DELETE FROM registrations WHERE desired_room_id = ?", [id]);
    
    // 5. Finally, delete the room itself
    await db.query("DELETE FROM rooms WHERE id = ?", [id]);
    
    return { id };
  },
};

export default Room;
