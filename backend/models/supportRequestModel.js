import db from "../config/db.js";

const SupportRequest = {
  countPending: async () => {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM support_requests WHERE status = 'PENDING'"
    );
    return rows[0].count;
  },

  create: async (data) => {
    const { student_id, type, title, content, attachment_path } = data;
    const [result] = await db.query(
      "INSERT INTO support_requests (student_id, type, title, content, attachment_path) VALUES (?, ?, ?, ?, ?)",
      [student_id, type, title, content, attachment_path]
    );
    return result.insertId;
  },

  getAll: async (limit = 20, offset = 0, filters = {}) => {
    let query = `
      SELECT sr.*, s.full_name as student_name, s.mssv, r.room_number, b.name as building_name
      FROM support_requests sr
      JOIN students s ON sr.student_id = s.id
      LEFT JOIN rooms r ON s.current_room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
    `;
    const params = [];
    const whereClauses = [];

    if (filters.status) {
      whereClauses.push("sr.status = ?");
      params.push(filters.status);
    }
    if (filters.type) {
      whereClauses.push("sr.type = ?");
      params.push(filters.type);
    }

    // Role-based filtering
    if (filters.userRole === "student") {
      whereClauses.push("sr.student_id = ?");
      params.push(filters.userId);
    } else if (filters.userRole === "manager") {
      // Filter by manager's building
      // We need to check if the student's room belongs to the manager's building
      whereClauses.push(
        "r.building_id = (SELECT building_id FROM managers WHERE id = ?)"
      );
      params.push(filters.userId);
    }
    // Admin sees all, so no extra filter needed

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY sr.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  },

  countAll: async (filters = {}) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM support_requests sr
      JOIN students s ON sr.student_id = s.id
      LEFT JOIN rooms r ON s.current_room_id = r.id
    `;
    const params = [];
    const whereClauses = [];

    if (filters.status) {
      whereClauses.push("sr.status = ?");
      params.push(filters.status);
    }
    if (filters.type) {
      whereClauses.push("sr.type = ?");
      params.push(filters.type);
    }

    // Role-based filtering
    if (filters.userRole === "student") {
      whereClauses.push("sr.student_id = ?");
      params.push(filters.userId);
    } else if (filters.userRole === "manager") {
      whereClauses.push(
        "r.building_id = (SELECT building_id FROM managers WHERE id = ?)"
      );
      params.push(filters.userId);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    const [rows] = await db.query(query, params);
    return rows[0].count;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `
      SELECT sr.*, s.full_name as student_name, s.mssv, r.room_number, b.name as building_name,
             m.full_name as manager_name
      FROM support_requests sr
      JOIN students s ON sr.student_id = s.id
      LEFT JOIN rooms r ON s.current_room_id = r.id
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN managers m ON sr.processed_by_manager_id = m.id
      WHERE sr.id = ?
    `,
      [id]
    );
    return rows[0];
  },

  updateStatus: async (id, status, manager_id, response_content) => {
    const [result] = await db.query(
      "UPDATE support_requests SET status = ?, processed_by_manager_id = ?, response_content = ? WHERE id = ?",
      [status, manager_id, response_content, id]
    );
    return result.affectedRows > 0;
  },
};

export default SupportRequest;
