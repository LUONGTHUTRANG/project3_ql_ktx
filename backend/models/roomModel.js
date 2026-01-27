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

  // Get available rooms for auto-assignment
  getAvailableRoomsForAssignment: async (semesterId) => {
    const [rows] = await db.query(
      `SELECT 
        r.id, r.room_number, r.max_capacity, r.building_id,
        b.name AS building_name, b.gender_restriction AS building_gender,
        COALESCE(COUNT(sr.id), 0) as current_occupancy
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      LEFT JOIN stay_records sr ON r.id = sr.room_id 
        AND sr.semester_id = ? 
        AND sr.status = 'ACTIVE'
      WHERE r.status = 'AVAILABLE'
      GROUP BY r.id, r.room_number, r.max_capacity, 
               r.building_id, b.name, b.gender_restriction
      HAVING current_occupancy < r.max_capacity
      ORDER BY current_occupancy DESC`,
      [semesterId]
    );
    return rows;
  },

  // Get room occupancy details
  getRoomOccupancy: async (roomId, semesterId) => {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as count,
        GROUP_CONCAT(s.gender) as genders
      FROM stay_records sr
      JOIN students s ON sr.student_id = s.id
      WHERE sr.room_id = ?
        AND sr.semester_id = ?
        AND sr.status = 'ACTIVE'`,
      [roomId, semesterId]
    );
    return rows[0] || { count: 0, genders: null };
  },

  // Get available rooms for student registration (with occupancy info)
  getAvailableRoomsForRegistration: async (buildingId, semesterId) => {
    const query = `
      SELECT 
        r.id,
        r.building_id,
        r.room_number,
        r.floor,
        r.max_capacity,
        r.price_per_semester,
        r.has_ac,
        r.has_heater,
        r.has_washer,
        r.status,
        b.name AS building_name,
        b.gender_restriction AS building_gender,
        COALESCE(COUNT(sr.id), 0) as current_occupancy,
        (r.max_capacity - COALESCE(COUNT(sr.id), 0)) as available_slots,
        GROUP_CONCAT(DISTINCT s.gender) as current_genders
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      LEFT JOIN stay_records sr ON r.id = sr.room_id 
        AND sr.semester_id = ? 
        AND sr.status = 'ACTIVE'
      LEFT JOIN students s ON sr.student_id = s.id
      WHERE r.status = 'AVAILABLE'
        ${buildingId ? 'AND r.building_id = ?' : ''}
      GROUP BY r.id, r.building_id, r.room_number, r.floor, r.max_capacity, 
               r.price_per_semester, r.has_ac, r.has_heater, r.has_washer, 
               r.status, b.name, b.gender_restriction
      HAVING available_slots > 0
      ORDER BY r.building_id, r.floor, r.room_number`;
    
    const params = buildingId ? [semesterId, buildingId] : [semesterId];
    const [rows] = await db.query(query, params);
    return rows;
  },
};

export default Room;
