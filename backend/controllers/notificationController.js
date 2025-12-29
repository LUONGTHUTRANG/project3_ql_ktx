import Notification from "../models/notificationModel.js";
import db from "../config/db.js";

// Helper to get full URL for local file
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  const normalizedFilename = filename.replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${normalizedFilename}`;
};

export const createNotification = async (req, res) => {
  try {
    const {
      title,
      content,
      target_scope,
      target_value,
      type,
    } = req.body;
    const sender_role = req.user.role === "manager" ? "MANAGER" : "ADMIN";
    const sender_id = req.user.id;

    let attachment_path = null;
    if (req.file) {
      attachment_path = req.file.path.replace(/\\/g, "/");
    }

    const notificationId = await Notification.create({
      title,
      content,
      attachment_path,
      sender_role,
      sender_id,
      target_scope,
      target_value,
      type: type || "ANNOUNCEMENT",
    });

    // Handle recipients based on scope
    let recipients = [];

    if (target_scope === "INDIVIDUAL" && target_value) {
      // Get individual student IDs
      let studentIds = [];
      if (Array.isArray(target_value)) studentIds = target_value;
      else if (typeof target_value === "string") {
        try {
          const parsed = JSON.parse(target_value);
          if (Array.isArray(parsed)) studentIds = parsed;
          else studentIds = [parsed];
        } catch (e) {
          studentIds = target_value.split(",").map((id) => id.trim());
        }
      } else if (target_value) {
        studentIds = [target_value];
      }

      recipients = studentIds.map((id) => [notificationId, id, null, null]);
    } else if (target_scope === "ROOM" && target_value) {
      // Get all students in the room(s)
      let roomIds = [];
      if (Array.isArray(target_value)) roomIds = target_value;
      else if (typeof target_value === "string") {
        try {
          const parsed = JSON.parse(target_value);
          if (Array.isArray(parsed)) roomIds = parsed;
          else roomIds = [parsed];
        } catch (e) {
          roomIds = target_value.split(",").map((id) => id.trim());
        }
      } else if (target_value) {
        roomIds = [target_value];
      }

      // Query all students in these rooms
      const [students] = await db.query(
        `SELECT id FROM students WHERE current_room_id IN (${roomIds.map(() => "?").join(",")})`,
        roomIds
      );

      recipients = students.map((student) => [
        notificationId,
        student.id,
        null,
        null,
      ]);
    } else if (target_scope === "BUILDING" && target_value) {
      // Get all students in the building(s)
      let buildingIds = [];
      if (Array.isArray(target_value)) buildingIds = target_value;
      else if (typeof target_value === "string") {
        try {
          const parsed = JSON.parse(target_value);
          if (Array.isArray(parsed)) buildingIds = parsed;
          else buildingIds = [parsed];
        } catch (e) {
          buildingIds = target_value.split(",").map((id) => id.trim());
        }
      } else if (target_value) {
        buildingIds = [target_value];
      }

      // Query all students in these buildings
      const [students] = await db.query(
        `SELECT s.id FROM students s 
         JOIN rooms r ON s.current_room_id = r.id 
         WHERE r.building_id IN (${buildingIds.map(() => "?").join(",")})`,
        buildingIds
      );

      recipients = students.map((student) => [
        notificationId,
        student.id,
        null,
        null,
      ]);
    } else if (target_scope === "ALL") {
      // Get all students
      const [students] = await db.query("SELECT id FROM students");
      recipients = students.map((student) => [
        notificationId,
        student.id,
        null,
        null,
      ]);
    }

    if (recipients.length > 0) {
      await Notification.addRecipients(recipients);
    }

    res
      .status(201)
      .json({ message: "Notification created", id: notificationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;
    const notifications = await Notification.getForStudent(studentId);

    // Map attachment path to full URL
    const notificationsWithUrl = notifications.map((n) => ({
      ...n,
      attachment_url: getFileUrl(req, n.attachment_path),
    }));

    res.json(notificationsWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;
    await Notification.markAsRead(notificationId, studentId);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getManagerSentNotifications = async (req, res) => {
  try {
    const managerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const notifications = await Notification.getSentByManager(managerId);
    
    // Handle pagination in controller
    const paginatedNotifications = notifications.slice(offset, offset + limit);
    const total = notifications.length;
    
    const notificationsWithUrl = paginatedNotifications.map((n) => ({
      ...n,
      attachment_url: getFileUrl(req, n.attachment_path),
    }));
    
    res.json({
      data: notificationsWithUrl,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.getById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    const notificationWithUrl = {
      ...notification,
      attachment_url: getFileUrl(req, notification.attachment_path),
    };
    res.json(notificationWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.delete(notificationId);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
