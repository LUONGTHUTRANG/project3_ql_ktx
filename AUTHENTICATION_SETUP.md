# 🔐 Hướng dẫn cấu hình Authentication (Xác thực người dùng)

## Tổng quan

API xác thực người dùng đã được kết nối với frontend. Hệ thống hỗ trợ 3 loại người dùng:
- **Student (Sinh viên)** - Sử dụng `mssv` (Mã số sinh viên) để đăng nhập
- **Manager (Cán bộ)** - Sử dụng `username` hoặc `email` để đăng nhập
- **Admin (Quản trị)** - Sử dụng `username` để đăng nhập

---

## 🛠️ Setup & Configuration

### 1. Backend Configuration

**File**: `backend/config/db.js` - Cấu hình kết nối database
```javascript
// Đảm bảo các biến môi trường được setup đúng
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dormitory_management
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 2. Frontend Configuration

**File**: `dorm-manager/api/config.ts` - Cấu hình API endpoints
```typescript
// Backend server URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

**File**: `.env.local` (tạo file này trong folder `dorm-manager/`)
```
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

### 1. Login - Đăng nhập
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "20240001",  // Cho sinh viên: mssv, cho cán bộ: username/email
  "password": "password123",
  "role": "student"  // "student", "manager", hoặc không gửi
}
```

**Response Success (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "20240001",
    "fullName": "Nguyễn Văn A",
    "role": "student",
    "email": "student@example.com",
    "currentRoomId": 101
  }
}
```

**Response Error (401)**:
```json
{
  "message": "Thông tin tài khoản chưa đúng. Vui lòng kiểm tra lại"
}
```

### 2. Get Current User - Lấy thông tin người dùng hiện tại
**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200)**:
```json
{
  "id": 1,
  "username": "20240001",
  "full_name": "Nguyễn Văn A",
  "email": "student@example.com"
  // Các field khác tùy loại người dùng
}
```

---

## 🔄 Authentication Flow

### Frontend Implementation

1. **Login Flow**:
   ```
   User nhập username/password → Form Submit
   → API call: loginUser(username, password, role)
   → Lưu token & user info vào localStorage
   → Redirect to dashboard
   ```

2. **Token Management**:
   - Token được tự động thêm vào header của tất cả requests
   - Axios interceptor xử lý việc này (xem `api/auth.ts`)

3. **Session Recovery**:
   - Khi page reload, app khôi phục user từ localStorage
   - Nếu token hết hạn → tự động redirect về login

### Code Examples

**Trong Component**:
```tsx
import { useContext } from 'react';
import { AuthContext } from '../App';

const MyComponent = () => {
  const { user, login, logout, loading, error } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      await login('username', 'password', 'student');
      // Đăng nhập thành công, component sẽ re-render
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div>
      {user && <p>Welcome, {user.name}</p>}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};
```

---

## 🧪 Test Credentials

### Database có sẵn:

**Admin**:
- Username: `admin`
- Password: `admin123` (hoặc check trong database)

**Manager**:
- Username: `manager1` (check trong table `managers`)
- Email: `manager@example.com`

**Student**:
- MSSV: `20240001` (check trong table `students`)

> **Lưu ý**: Lấy password từ database (đã hash). Để test nhanh, có thể reset password trong DB hoặc dùng seed data.

---

## 🔒 Security Features

### 1. JWT Token
- Issued after successful login
- Valid for 24 hours
- Contains: `user_id`, `role`, `username`
- Verified on each protected request

### 2. Password Hashing
- Passwords hashed using bcryptjs (bcrypt)
- Never stored in plain text
- Verified during login

### 3. Role-Based Access Control
- Backend validates user role on each request
- Frontend renders UI based on user role
- Protected routes require authentication

### 4. Token Expiration Handling
- Automatic redirect to login on 401 Unauthorized
- Token stored in localStorage for persistence

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Network Error" when logging in
**Solution**: 
- Check backend is running: `npm start` in `backend/` folder
- Verify API_BASE_URL in `api/config.ts`
- Check CORS settings in `backend/server.js`

### Issue 2: "Invalid token" after page reload
**Solution**:
- Check localStorage in browser DevTools
- Verify JWT_SECRET is same in backend & token verification
- Check token expiration time

### Issue 3: Wrong role not showing correct dashboard
**Solution**:
- Ensure role is correctly returned from backend
- Check role mapping in `App.tsx` (student/manager conversion)
- Verify route protection in `ProtectedRoute.tsx`

---

## 📝 Implementation Checklist

- [x] Backend auth routes setup
- [x] Frontend auth API functions
- [x] AuthContext implementation
- [x] Login form integration
- [x] Token storage in localStorage
- [x] Axios interceptors for token injection
- [x] Error handling in login
- [x] Protected routes
- [ ] Refresh token mechanism (optional)
- [ ] Social login (optional)
- [ ] Two-factor authentication (optional)

---

## 🚀 Next Steps

1. **Test the login** with provided credentials
2. **Implement other APIs** (buildings, rooms, invoices, etc.)
3. **Add refresh token logic** for better security
4. **Setup logging out mechanism** on unauthorized error
5. **Add password reset functionality**

---

## 📚 File References

- Backend: `backend/controllers/authController.js`
- Backend Routes: `backend/routes/authRoutes.js`
- Frontend Auth: `dorm-manager/api/auth.ts`
- Frontend Context: `dorm-manager/App.tsx`
- Login Component: `dorm-manager/pages/Login.tsx`
- Config: `dorm-manager/api/config.ts`

---

## 💡 Tips

- Use browser DevTools → Application → LocalStorage để debug
- Network tab để xem API requests/responses
- Console để xem error messages
- Postman để test APIs trước khi integrate frontend

