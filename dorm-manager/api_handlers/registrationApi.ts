// api/registrationApi.ts
import axios from 'axios';
import { API_ENDPOINTS } from './config';

const api = axios.create({
    baseURL: API_ENDPOINTS.REGISTRATIONS,
});

// Request interceptor - thêm JWT token vào header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - xử lý lỗi 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ===== INTERFACES =====

export interface Registration {
    id: number;
    student_id: number;
    semester_id: number;
    registration_type: 'NORMAL' | 'PRIORITY' | 'RENEWAL';
    desired_room_id?: number | null;
    desired_building_id?: number | null;
    priority_category: 'NONE' | 'POOR_HOUSEHOLD' | 'DISABILITY' | 'OTHER';
    priority_description?: string | null;
    evidence_file_path?: string | null;
    status: 'PENDING' | 'RETURN' | 'AWAITING_PAYMENT' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
    invoice_id?: number | null;
    created_at: string;
    updated_at?: string | null;
    admin_note?: string | null;
    // Joined fields
    student_name?: string;
    mssv?: string;
    building_name?: string;
}

export interface CreateRegistrationData {
    student_id: number;
    semester_id?: number;
    registration_type: 'NORMAL' | 'PRIORITY' | 'RENEWAL';
    desired_room_id?: number | null;
    desired_building_id?: number | null;
    priority_category?: 'NONE' | 'POOR_HOUSEHOLD' | 'DISABILITY' | 'OTHER';
    priority_description?: string | null;
    evidence?: File | null; // File upload
}

// ===== API FUNCTIONS =====

/**
 * Tạo đơn đăng ký mới
 * Sử dụng FormData để hỗ trợ upload file minh chứng
 */
export const createRegistration = async (data: CreateRegistrationData): Promise<{ message: string; id: number; invoice_id?: number | null }> => {
    try {
        const formData = new FormData();

        formData.append('student_id', data.student_id.toString());
        if (data.semester_id) {
            formData.append('semester_id', data.semester_id.toString());
        }
        formData.append('registration_type', data.registration_type);

        if (data.desired_room_id) {
            formData.append('desired_room_id', data.desired_room_id.toString());
        }
        if (data.desired_building_id) {
            formData.append('desired_building_id', data.desired_building_id.toString());
        }
        if (data.priority_category) {
            formData.append('priority_category', data.priority_category);
        }
        if (data.priority_description) {
            formData.append('priority_description', data.priority_description);
        }
        if (data.evidence) {
            formData.append('evidence', data.evidence);
        }

        const response = await api.post('/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Đăng ký thất bại';
        throw new Error(message);
    }
};

/**
 * Lấy danh sách đơn đăng ký của sinh viên hiện tại
 */
export const getMyRegistrations = async (): Promise<Registration[]> => {
    try {
        const response = await api.get('/my-registrations');
        return response.data;
    } catch (error: any) {
        console.error('Lỗi khi lấy danh sách đơn đăng ký:', error);
        throw error;
    }
};

/**
 * Lấy chi tiết một đơn đăng ký theo ID
 */
export const getRegistrationById = async (id: number | string): Promise<Registration> => {
    try {
        const response = await api.get(`/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Lỗi khi lấy chi tiết đơn đăng ký:', error);
        throw error;
    }
};

/**
 * Lấy danh sách đơn đăng ký ưu tiên (dành cho Admin)
 */
export const getAllPriorityRegistrations = async (
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; search?: string }
): Promise<{ data: Registration[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    try {
        const response = await api.get('/priority', {
            params: { page, limit, ...filters },
        });
        return response.data;
    } catch (error: any) {
        console.error('Lỗi khi lấy danh sách đơn ưu tiên:', error);
        throw error;
    }
};

/**
 * Lấy tất cả đơn đăng ký (dành cho Manager - tất cả loại)
 */
export const getAllRegistrations = async (
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; search?: string; registration_type?: string; building_id?: number }
): Promise<{ data: Registration[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    try {
        const response = await api.get('/all', {
            params: { page, limit, ...filters },
        });
        return response.data;
    } catch (error: any) {
        console.error('Lỗi khi lấy danh sách đơn đăng ký:', error);
        throw error;
    }
};

/**
 * Cập nhật trạng thái đơn đăng ký (dành cho Admin)
 */
export const updateRegistrationStatus = async (
    id: number | string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'RETURN',
    adminNote?: string
): Promise<{ message: string }> => {
    try {
        const response = await api.put(`/${id}/status`, { status, admin_note: adminNote });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Cập nhật trạng thái thất bại';
        throw new Error(message);
    }
};

/**
 * Phân phòng tự động (Auto-assign) cho các đơn đăng ký NORMAL
 */
export const autoAssignRooms = async (semesterId: number): Promise<{
    message: string;
    result: {
        total: number;
        success: number;
        failed: number;
        details: Array<{
            student_id: number;
            student_name: string;
            mssv: string;
            status: 'SUCCESS' | 'FAILED';
            assigned_room?: string;
            room_id?: number;
            reason?: string;
        }>;
    };
}> => {
    try {
        const response = await api.post('/auto-assign', { semester_id: semesterId });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Phân phòng tự động thất bại';
        throw new Error(message);
    }
};

/**
 * Lấy báo cáo phân phòng
 */
export const getAssignmentReport = async (semesterId: number): Promise<{
    semester_id: number;
    registration_stats: {
        total_registrations: number;
        approved: number;
        pending: number;
        rejected: number;
        normal_type: number;
        priority_type: number;
        renewal_type: number;
    };
    room_stats: {
        total_rooms: number;
        total_capacity: number;
        current_occupancy: number;
        full_rooms: number;
        empty_rooms: number;
    };
    building_stats: Array<{
        id: number;
        name: string;
        total_rooms: number;
        total_capacity: number;
        current_occupancy: number;
    }>;
}> => {
    try {
        const response = await api.get('/report/assignment', {
            params: { semester_id: semesterId }
        });
        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Lấy báo cáo thất bại';
        throw new Error(message);
    }
};

export default api;
