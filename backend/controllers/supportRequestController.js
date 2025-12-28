import SupportRequest from "../models/supportRequestModel.js";

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
