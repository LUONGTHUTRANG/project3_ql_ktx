import db from "../config/db.js";

const Notification = {
  create: async (data) => {
    const {
      title,
      content,
      attachment_path,
      sender_role,
      sender_id,
      target_scope,
      type,
    } = data;
    const [result] = await db.query(
      "INSERT INTO notifications (title, content, attachment_path, sender_role, sender_id, target_scope, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        content,
        attachment_path,
        sender_role,
        sender_id,
        target_scope,
        type,
      ]
    );
    return result.insertId;
  },

  addRecipient: async (notificationId, studentId) => {
    await db.query(
      "INSERT INTO notification_recipients (notification_id, student_id) VALUES (?, ?)",
      [notificationId, studentId]
    );
  },

  addRecipients: async (values, type = "STUDENT") => {
    if (!values || values.length === 0) return;
    // values is array of [notification_id, id]

    let columns = "(notification_id, student_id)";
    if (type === "ROOM") columns = "(notification_id, room_id)";
    if (type === "BUILDING") columns = "(notification_id, building_id)";

    const placeholders = values.map(() => "(?, ?)").join(", ");
    const flatValues = values.flat();
    await db.query(
      `INSERT INTO notification_recipients ${columns} VALUES ${placeholders}`,
      flatValues
    );
  },

  getForStudent: async (studentId) => {
    // Get student's room and building info
    const [studentInfo] = await db.query(
      `SELECT s.current_room_id, r.building_id 
       FROM students s 
       LEFT JOIN rooms r ON s.current_room_id = r.id 
       WHERE s.id = ?`,
      [studentId]
    );

    const roomId = studentInfo[0]?.current_room_id;
    const buildingId = studentInfo[0]?.building_id;

    const query = `
      SELECT DISTINCT n.*, 
             COALESCE(nr_read.is_read, 0) as is_read,
             nr_read.read_at
      FROM notifications n
      -- Check for direct assignment or group assignment
      LEFT JOIN notification_recipients nr_s ON n.id = nr_s.notification_id AND nr_s.student_id = ?
      LEFT JOIN notification_recipients nr_r ON n.id = nr_r.notification_id AND nr_r.room_id = ?
      LEFT JOIN notification_recipients nr_b ON n.id = nr_b.notification_id AND nr_b.building_id = ?
      -- Check for read status (individual row)
      LEFT JOIN notification_recipients nr_read ON n.id = nr_read.notification_id AND nr_read.student_id = ?
      WHERE n.target_scope = 'ALL'
         OR nr_s.id IS NOT NULL
         OR (n.target_scope = 'ROOM' AND nr_r.id IS NOT NULL)
         OR (n.target_scope = 'BUILDING' AND nr_b.id IS NOT NULL)
      ORDER BY n.created_at DESC
    `;
    const [rows] = await db.query(query, [
      studentId,
      roomId,
      buildingId,
      studentId,
    ]);
    return rows;
  },

  markAsRead: async (notificationId, studentId) => {
    // Check if record exists
    const [exists] = await db.query(
      "SELECT id FROM notification_recipients WHERE notification_id = ? AND student_id = ?",
      [notificationId, studentId]
    );

    if (exists.length > 0) {
      await db.query(
        "UPDATE notification_recipients SET is_read = TRUE, read_at = NOW() WHERE notification_id = ? AND student_id = ?",
        [notificationId, studentId]
      );
    } else {
      // If it's an ALL, ROOM, or BUILDING notification, insert a record to track it's read
      const [notif] = await db.query(
        "SELECT target_scope FROM notifications WHERE id = ?",
        [notificationId]
      );
      if (
        notif.length > 0 &&
        ["ALL", "ROOM", "BUILDING"].includes(notif[0].target_scope)
      ) {
        await db.query(
          "INSERT INTO notification_recipients (notification_id, student_id, is_read, read_at) VALUES (?, ?, TRUE, NOW())",
          [notificationId, studentId]
        );
      }
    }
  },

  getSentByManager: async (managerId) => {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE sender_role = 'MANAGER' AND sender_id = ? ORDER BY created_at DESC",
      [managerId]
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM notifications WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) return null;
    const notification = rows[0];

    if (notification.target_scope === "ROOM") {
      const [rooms] = await db.query(
        "SELECT r.id, r.room_number FROM rooms r JOIN notification_recipients nr ON r.id = nr.room_id WHERE nr.notification_id = ?",
        [id]
      );
      notification.rooms = rooms;
    } else if (notification.target_scope === "BUILDING") {
      const [buildings] = await db.query(
        "SELECT b.id, b.name FROM buildings b JOIN notification_recipients nr ON b.id = nr.building_id WHERE nr.notification_id = ?",
        [id]
      );
      notification.buildings = buildings;
    } else if (notification.target_scope === "INDIVIDUAL") {
      const [students] = await db.query(
        "SELECT s.id, s.full_name, s.mssv FROM students s JOIN notification_recipients nr ON s.id = nr.student_id WHERE nr.notification_id = ?",
        [id]
      );
      notification.students = students;
    }
    return notification;
  },

  delete: async (id) => {
    // Delete recipients first (foreign key constraint usually handles this if ON DELETE CASCADE, but to be safe)
    await db.query(
      "DELETE FROM notification_recipients WHERE notification_id = ?",
      [id]
    );
    await db.query("DELETE FROM notifications WHERE id = ?", [id]);
  },
};

export default Notification;
