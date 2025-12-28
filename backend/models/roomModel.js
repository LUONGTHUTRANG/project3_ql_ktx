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
    await db.query("DELETE FROM rooms WHERE id = ?", [id]);
    return { id };
  },
};

export default Room;
