# API Integration Guide

## Cấu trúc API Frontend

Frontend API được tổ chức thành các thư mục con, tương tự như cách backend sắp xếp các route:

```
api/
├── config.ts          # Cấu hình API (base URL, endpoints)
├── buildingApi.ts     # API functions cho buildings
├── roomApi.ts         # API functions cho rooms
└── index.ts           # Centralized exports
```

## Cách sử dụng

### 1. Import API functions

```typescript
// Cách 1: Import từ file cụ thể
import { fetchBuildings, createBuilding } from '../api/buildingApi';

// Cách 2: Import từ index (khuyến khích)
import { fetchBuildings, createBuilding, fetchRooms } from '../api';
```

### 2. Gọi API functions

```typescript
import { fetchBuildings, fetchBuildingById, createBuilding } from '../api';

// Fetch tất cả buildings
const buildings = await fetchBuildings();

// Fetch building theo ID
const building = await fetchBuildingById(1);

// Tạo building mới
const newBuilding = await createBuilding({
  name: 'Tòa A',
  location: 'Khu Nam',
  gender_restriction: 'Nam'
});
```

### 3. Error Handling

Tất cả API functions đã có error handling tích hợp:

```typescript
try {
  const buildings = await fetchBuildings();
} catch (error) {
  console.error('Error fetching buildings:', error);
  message.error('Không thể tải dữ liệu');
}
```

## Cấu hình Backend URL

### Development

1. Tạo file `.env.local` trong thư mục frontend:
```
VITE_API_URL=http://localhost:5000/api
```

2. Backend mặc định chạy trên port 5000 (được cấu hình trong `server.js`)

### Production

Cập nhật `.env.local` với URL của backend:
```
VITE_API_URL=https://your-production-api.com/api
```

## Backend Routes Mapping

### Buildings
- `GET /api/buildings` - Lấy tất cả buildings
- `GET /api/buildings/:id` - Lấy building theo ID
- `POST /api/buildings` - Tạo building mới
- `PUT /api/buildings/:id` - Cập nhật building
- `DELETE /api/buildings/:id` - Xóa building

### Rooms
- `GET /api/rooms` - Lấy tất cả rooms
- `GET /api/rooms/:id` - Lấy room theo ID
- `POST /api/rooms` - Tạo room mới
- `PUT /api/rooms/:id` - Cập nhật room
- `DELETE /api/rooms/:id` - Xóa room

## Thêm API mới

Để thêm API cho entity mới (ví dụ: Students):

1. Tạo file mới `api/studentApi.ts`:
```typescript
import axios from 'axios';
import { API_ENDPOINTS } from './config';

const BASE_URL = API_ENDPOINTS.STUDENTS;

export const fetchStudents = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// ... other functions
```

2. Cập nhật `api/config.ts` để thêm endpoint:
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  STUDENTS: `${API_BASE_URL}/students`,
};
```

3. Cập nhật `api/index.ts`:
```typescript
export * from './studentApi';
```

## Data Transformation

BuildingList.tsx transform dữ liệu từ backend:

```typescript
// Backend data từ /api/buildings
{
  id: 1,
  name: "Tòa A",
  location: "Khu Nam",
  gender_restriction: "Nam",
  room_count: 120
}

// Transform thành display data
{
  id: 1,
  name: "Tòa A",
  location: "Khu Nam",
  gender_restriction: "Nam",
  room_count: 120,
  info: "Khu Nam - Dành cho Nam",        // Tạo từ location + gender_restriction
  floors: 5,                              // Tính từ rooms
  emptyRooms: "12 / 120",                // Tính từ rooms count
  status: "available",                   // Xác định từ empty rooms
  statusLabel: "Còn chỗ",
  color: "bg-blue-100 text-primary"
}
```

## Testing

Để test API:

1. Đảm bảo backend server chạy:
   ```bash
   cd backend
   npm start
   ```

2. Trong frontend, gọi API:
   ```typescript
   import { fetchBuildings } from './api';
   
   // Test trong console
   fetchBuildings().then(data => console.log(data));
   ```

## Khắc phục sự cố

### CORS Error
- Đảm bảo backend đã cấu hình CORS: `app.use(cors())`
- Kiểm tra URL trong config.ts

### Connection Refused
- Kiểm tra backend có chạy không
- Kiểm tra port trong config.ts khớp với backend (5000)
- Kiểm tra `.env.local` có cấu hình đúng không

### 404 Not Found
- Kiểm tra routes trong backend có được define không
- Kiểm tra database schema có match không

