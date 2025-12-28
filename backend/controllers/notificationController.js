import Notification from "../models/notificationModel.js";

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
      type,
      room_id,
      building_id,
      student_ids,
    } = req.body;
    const sender_role = req.user.role === "manager" ? "MANAGER" : "ADMIN"; // Assuming role is lowercase in token
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
      type: type || "ANNOUNCEMENT",
    });

    // Handle recipients based on scope
    let recipients = [];
    let recipientType = "STUDENT";

    if (target_scope === "INDIVIDUAL") {
      recipientType = "STUDENT";
      let ids = [];
      if (Array.isArray(student_ids)) ids = student_ids;
      else if (typeof student_ids === "string") {
        try {
          const parsed = JSON.parse(student_ids);
          if (Array.isArray(parsed)) ids = parsed;
          else ids = [parsed];
        } catch (e) {
          // If not json, maybe comma separated
          ids = student_ids.split(",").map((id) => id.trim());
        }
      } else if (student_ids) {
        ids = [student_ids];
      }

      recipients = ids.map((id) => [notificationId, id]);
    } else if (target_scope === "ROOM") {
      recipientType = "ROOM";
      let ids = [];
      if (Array.isArray(room_id)) ids = room_id;
      else if (typeof room_id === "string") {
        try {
          const parsed = JSON.parse(room_id);
          if (Array.isArray(parsed)) ids = parsed;
          else ids = [parsed];
        } catch (e) {
          ids = room_id.split(",").map((id) => id.trim());
        }
      } else if (room_id) {
        ids = [room_id];
      }

      recipients = ids.map((id) => [notificationId, id]);
    } else if (target_scope === "BUILDING") {
      recipientType = "BUILDING";
      let ids = [];
      if (Array.isArray(building_id)) ids = building_id;
      else if (typeof building_id === "string") {
        try {
          const parsed = JSON.parse(building_id);
          if (Array.isArray(parsed)) ids = parsed;
          else ids = [parsed];
        } catch (e) {
          ids = building_id.split(",").map((id) => id.trim());
        }
      } else if (building_id) {
        ids = [building_id];
      }

      recipients = ids.map((id) => [notificationId, id]);
    }
    // If ALL, we don't add recipients

    if (recipients.length > 0) {
      await Notification.addRecipients(recipients, recipientType);
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
    const notifications = await Notification.getSentByManager(managerId);
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
