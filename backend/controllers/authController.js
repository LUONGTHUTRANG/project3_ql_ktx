import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username || user.mssv },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "24h" }
  );
};

export const login = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    let user = null;
    let userRole = role;

    // If role is specified, check that table specifically
    if (role === "student") {
      const [rows] = await db.query("SELECT * FROM students WHERE mssv = ?", [
        username,
      ]);
      if (rows.length > 0) user = rows[0];
    } else if (role === "manager") {
      // Check Manager table first
      const [managers] = await db.query(
        "SELECT * FROM managers WHERE username = ?",
        [username]
      );
      if (managers.length > 0) {
        user = managers[0];
        userRole = "manager";
      } else {
        // If not found in managers, check Admins
        const [admins] = await db.query(
          "SELECT * FROM admins WHERE username = ?",
          [username]
        );
        if (admins.length > 0) {
          user = admins[0];
          userRole = "admin";
        }
      }
    } else {
      // If no role specified, try to find in all tables (fallback)
      // Check Admin
      const [admins] = await db.query(
        "SELECT * FROM admins WHERE username = ?",
        [username]
      );
      if (admins.length > 0) {
        user = admins[0];
        userRole = "admin";
      } else {
        // Check Manager
        const [managers] = await db.query(
        "SELECT * FROM managers WHERE username = ?",
          [username]
        );
        if (managers.length > 0) {
          user = managers[0];
          userRole = "manager";
        } else {
          // Check Student
          const [students] = await db.query(
            "SELECT * FROM students WHERE mssv = ?",
            [username]
          );
          if (students.length > 0) {
            user = students[0];
            userRole = "student";
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "Thông tin tài khoản chưa đúng. Vui lòng kiểm tra lại",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Thông tin tài khoản chưa đúng. Vui lòng kiểm tra lại",
      });
    }

    const token = generateToken({ ...user, role: userRole });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username || user.mssv,
        fullName: user.full_name,
        role: userRole,
        // Add other relevant fields
        email: user.email,
        buildingId: user.building_id, // For managers
        currentRoomId: user.current_room_id, // For students
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    let user = null;

    if (role === "admin") {
      const [rows] = await db.query(
        "SELECT id, username, full_name FROM admins WHERE id = ?",
        [id]
      );
      if (rows.length > 0) user = rows[0];
    } else if (role === "manager") {
      const [rows] = await db.query(
        "SELECT id, username, email, full_name, building_id FROM managers WHERE id = ?",
        [id]
      );
      if (rows.length > 0) user = rows[0];
    } else if (role === "student") {
      const [rows] = await db.query(
        "SELECT id, mssv, full_name, email, gender, class_name, current_room_id FROM students WHERE id = ?",
        [id]
      );
      if (rows.length > 0) user = rows[0];
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: { ...user, role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
    }

    let user = null;
    let tableName = "";

    // Get user from appropriate table
    if (role === "admin") {
      const [rows] = await db.query("SELECT * FROM admins WHERE id = ?", [id]);
      if (rows.length > 0) {
        user = rows[0];
        tableName = "admins";
      }
    } else if (role === "manager") {
      const [rows] = await db.query("SELECT * FROM managers WHERE id = ?", [
        id,
      ]);
      if (rows.length > 0) {
        user = rows[0];
        tableName = "managers";
      }
    } else if (role === "student") {
      const [rows] = await db.query("SELECT * FROM students WHERE id = ?", [
        id,
      ]);
      if (rows.length > 0) {
        user = rows[0];
        tableName = "students";
      }
    }

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        message: "Mật khẩu hiện tại không chính xác",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`, [
      hashedPassword,
      id,
    ]);

    res.json({
      message: "Mật khẩu đã được cập nhật thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
