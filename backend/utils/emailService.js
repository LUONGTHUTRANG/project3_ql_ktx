import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Cấu hình Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL || "your-email@gmail.com",
    pass: process.env.GMAIL_PASSWORD || "your-app-password",
  },
});

export const sendManagerPassword = async (email, fullName, password, systemName) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || "your-email@gmail.com",
      to: email,
      subject: `Thông tin đăng nhập - ${systemName}`,
      html: `
        <h2>Chào ${fullName},</h2>
        <p>Bạn đã được thêm vào ${systemName} với vai trò là cán bộ quản lý.</p>
        <p><strong>Thông tin đăng nhập của bạn:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Mật khẩu tạm thời:</strong> <code>${password}</code></li>
        </ul>
        <p style="color: #d32f2f;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên.</p>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với quản trị viên.</p>
        <p>Trân trọng,<br/>${systemName}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

export default sendManagerPassword;
