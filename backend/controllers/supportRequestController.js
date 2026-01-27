import SupportRequest from "../models/supportRequestModel.js";
import Notification from "../models/notificationModel.js";
import Stay from "../models/stayModel.js";
import db from "../config/db.js";

// Helper to send notification to building manager
const sendNotificationToManager = async (studentId, title, content, notificationType) => {
  try {
    // Get student's building from active stay using Stay model
    const buildingId = await Stay.getActiveBuildingId(studentId);

    if (buildingId) {
      // Get managers for this building
      const [managers] = await db.query(
        "SELECT id FROM managers WHERE building_id = ?",
        [buildingId]
      );

      if (managers && managers.length > 0) {
        // Create notification
        const notificationId = await Notification.create({
          title,
          content,
          sender_role: "STUDENT",
          sender_id: studentId,
          target_scope: "BUILDING",
          type: notificationType,
        });

        // Add managers as recipients with building_id
        const recipientValues = managers.map((manager) => [
          notificationId,
          manager.id,
          "manager",
          null,
          buildingId,
        ]);

        await Notification.addRecipients(recipientValues);
        console.log(
          `Notification (${notificationType}) sent to ${managers.length} manager(s) for student #${studentId}`
        );
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't throw - notification error shouldn't break the main operation
  }
};

// Helper to get full URL for local file
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  // Ensure forward slashes for URLs
  const normalizedFilename = filename.replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/${normalizedFilename}`;
};

export const createSupportRequest = async (req, res) => {
  try {
    let { student_id, type, title, content } = req.body;
    let attachment_path = null;

    // If user is a student, use their ID from the token
    if (req.user && req.user.role === "student") {
      student_id = req.user.id;
    }

    console.log("request", type, title, "student_id:", student_id);

    if (req.file) {
      // Store the relative path that can be served statically
      // req.file.path is like "uploads\support_requests\filename.jpg"
      // We want "uploads/support_requests/filename.jpg"
      attachment_path = req.file.path.replace(/\\/g, "/");
    }

    const requestId = await SupportRequest.create({
      student_id,
      type,
      title,
      content,
      attachment_path,
    });

    // Send notification to building manager
    await sendNotificationToManager(
      student_id,
      `Yêu cầu hỗ trợ mới: ${title}`,
      `Sinh viên đã gửi yêu cầu hỗ trợ: ${content}`,
      "SUPPORT_REQUEST_CREATED"
    );

    res.status(201).json({ message: "Support request created", id: requestId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllSupportRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      status: req.query.status,
      type: req.query.type,
      // Pass user info for role-based filtering
      userRole: req.user.role,
      userId: req.user.id,
    };

    const requests = await SupportRequest.getAll(limit, offset, filters);
    const total = await SupportRequest.countAll(filters);

    // Add full URL for attachments
    const requestsWithUrls = requests.map((reqItem) => {
      if (reqItem.attachment_path) {
        reqItem.attachment_url = getFileUrl(req, reqItem.attachment_path);
      }
      return reqItem;
    });

    res.json({
      data: requestsWithUrls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSupportRequestById = async (req, res) => {
  try {
    const request = await SupportRequest.getById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Support request not found" });
    }

    request.images = [];

    if (request.attachment_path) {
      // Nếu logic của bạn là 1 ảnh:
      const fullUrl = getFileUrl(req, request.attachment_path);
      request.attachment_url = fullUrl; // Giữ lại field cũ nếu cần tương thích ngược
      request.images.push(fullUrl); // Thêm vào mảng images
    }

    console.log("Fetched support request:", request);

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSupportRequestStatus = async (req, res) => {
  try {
    const { status, manager_id, response_content } = req.body;
    const success = await SupportRequest.updateStatus(
      req.params.id,
      status,
      manager_id,
      response_content
    );

    if (!success) {
      return res.status(404).json({ message: "Support request not found" });
    }

    res.json({ message: "Support request updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSupportRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Get the support request to verify ownership (for students)
    const request = await SupportRequest.getById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Support request not found" });
    }

    // Verify user can delete (only student who created it or admin/manager)
    if (req.user.role === "student" && request.student_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own support requests" });
    }

    // Delete the request
    const success = await SupportRequest.delete(requestId);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to delete support request" });
    }

    // Send notification to building manager
    await sendNotificationToManager(
      request.student_id,
      `Yêu cầu hỗ trợ đã bị xóa: ${request.title}`,
      `Sinh viên đã xóa yêu cầu hỗ trợ: ${request.content}`,
      "ANNOUNCEMENT"
    );

    res.json({ message: "Support request deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateSupportRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { type, title, content } = req.body;
    
    // Get the support request to verify ownership
    const request = await SupportRequest.getById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Support request not found" });
    }

    // Verify user can update (only student who created it)
    if (req.user.role === "student" && request.student_id !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own support requests" });
    }

    let attachment_path = request.attachment_path;
    
    // Handle new file upload
    if (req.file) {
      attachment_path = req.file.path.replace(/\\/g, "/");
    }

    const success = await SupportRequest.update(requestId, {
      type,
      title,
      content,
      attachment_path,
    });

    if (!success) {
      return res.status(500).json({ message: "Failed to update support request" });
    }

    // Send notification to building manager
    await sendNotificationToManager(
      request.student_id,
      `Yêu cầu hỗ trợ đã được cập nhật: ${title}`,
      `Sinh viên đã cập nhật yêu cầu hỗ trợ: ${content}`,
      "ANNOUNCEMENT"
    );

    res.json({ message: "Support request updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
