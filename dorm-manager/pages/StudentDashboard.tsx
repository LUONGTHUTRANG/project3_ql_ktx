import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { formatPrice } from '../utils/formatters';
import {
  getStudentById,
  getStudentsByRoomId,
  getInvoicesForStudent,
  getAllSupportRequests,
  getMyNotifications,
  fetchRoomById
} from '../api';

interface StudentData {
  id: string;
  full_name: string;
  room_number?: string;
  current_room_id?: string;
}

interface RoomData {
  id: string;
  room_number: string;
  capacity?: number;
  current_occupants?: number;
}

interface Invoice {
  id: number | string;
  amount?: number;
  status?: string;
  created_at?: string;
  due_date?: string;
}

interface SupportRequest {
  id: number | string;
  title?: string;
  status?: string;
  created_at?: string;
}

interface Notification {
  id: number | string;
  title?: string;
  content?: string;
  created_at?: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [roommates, setRoommates] = useState<StudentData[]>([]);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [latestRequest, setLatestRequest] = useState<SupportRequest | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student profile
        const studentResponse = await getStudentById(user.id);
        const student = studentResponse || studentResponse;
        setStudentData(student);

        // Fetch room data if student has a room
        if (student?.current_room_id) {
          const roomResponse = await fetchRoomById(student.current_room_id);
          const room = roomResponse || roomResponse;
          setRoomData(room);

          // Fetch roommates
          const roommatesResponse = await getStudentsByRoomId(student.current_room_id);
          const roommates = roommatesResponse || [];
          setRoommates(Array.isArray(roommates) ? roommates.filter(r => r.id !== user.id) : []);
        }

        // Fetch latest invoice
        const invoicesResponse = await getInvoicesForStudent(user.id);
        const invoices = invoicesResponse || [];
        if (Array.isArray(invoices) && invoices.length > 0) {
          setLatestInvoice(invoices[0]);
        }

        // Fetch latest support request
        const requestsResponse = await getAllSupportRequests(1, 1);
        const requests = requestsResponse?.data || requestsResponse || [];
        if (Array.isArray(requests) && requests.length > 0) {
          setLatestRequest(requests[0]);
        }

        // Fetch notifications
        const notificationsResponse = await getMyNotifications(1, 3);
        const notifs = notificationsResponse?.data || notificationsResponse || [];
        setNotifications(Array.isArray(notifs) ? notifs : []);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user.id]);

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm dịch vụ, thông báo..."
      headerTitle="Trang chủ"
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-white dark:bg-surface-dark p-6 md:p-8 shadow-sm border border-border-color dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">Xin chào, {user.name}! 👋</h1>
            <p className="text-text-secondary dark:text-gray-400">Chào mừng bạn trở lại hệ thống quản lý ký túc xá.</p>
          </div>
          <div className="relative z-10">
            <button 
              onClick={() => navigate('/student/register')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
              Gia hạn hợp đồng
            </button>
          </div>
        </div>

        {/* Room Info Card */}
        <div className="rounded-xl bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <span className="material-symbols-outlined text-3xl">meeting_room</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-text-main dark:text-white text-lg font-bold">
                {loading ? 'Đang tải...' : roomData?.room_number ? `Phòng của tôi (${roomData.room_number})` : 'Chưa có phòng'}
              </h3>
              <div className="flex items-center gap-3 text-sm text-text-secondary dark:text-gray-400 mt-1">
                {roomData && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                      {roommates.length + 1} thành viên
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border-color"></span>
                    <span className={roomData.capacity && roomData.current_occupants && roomData.current_occupants >= roomData.capacity ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                      {roomData.capacity && roomData.current_occupants && roomData.current_occupants >= roomData.capacity ? 'Đã đủ người' : 'Còn chỗ trống'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors font-medium text-sm w-full md:w-auto"
            onClick={() => navigate('/student/my-room')}
          >
            <span className="material-symbols-outlined text-[20px]">list_alt</span>
            Xem danh sách thành viên
          </button>
        </div>

        {/* Notifications Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[#137fec] to-[#0b5ac9] shadow-md text-white p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <h3 className="font-bold text-lg">Thông báo mới</h3>
            </div>
            <div className="flex-1 w-full md:w-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:mx-6">
              {loading ? (
                <div className="text-sm text-blue-100">Đang tải thông báo...</div>
              ) : notifications.length === 0 ? (
                <div className="text-sm text-blue-100">Không có thông báo mới</div>
              ) : (
                notifications.slice(0, 2).map((notif, index) => (
                  <div 
                    key={notif.id || index}
                    onClick={() => navigate('/notifications')}
                    className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-yellow-300 text-[20px]">notifications</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title || 'Thông báo'}</p>
                      <p className="text-xs text-blue-100">{notif.created_at ? new Date(notif.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => navigate('/notifications')}
              className="text-sm font-medium text-blue-50 hover:text-white flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Xem tất cả <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill Card */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 flex flex-col gap-4 h-full justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Hóa đơn mới nhất</p>
                    <p className="text-text-main dark:text-white text-2xl font-bold mt-0.5">
                      {loading ? '...' : latestInvoice?.amount ? formatPrice(latestInvoice.amount) : 'N/A'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  latestInvoice?.status === 'paid' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-600/10' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-600/10'
                }`}>
                  {latestInvoice?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-border-color dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary dark:text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Hạn thanh toán:</span>
                  <span className="font-medium text-text-main dark:text-white">
                    {latestInvoice?.due_date ? new Date(latestInvoice.due_date).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/student/bills')}
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>
          </div>

          {/* Request Card */}
          <div className="flex flex-col rounded-xl bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 flex flex-col gap-4 h-full justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    <span className="material-symbols-outlined">build</span>
                  </div>
                  <div>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Yêu cầu sửa chữa</p>
                    <p className="text-text-main dark:text-white text-xl font-bold mt-0.5">
                      {loading ? '...' : latestRequest?.title || 'Không có yêu cầu'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  latestRequest?.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-green-600/10'
                    : latestRequest?.status === 'in_progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-blue-600/10'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-yellow-600/20'
                }`}>
                  {latestRequest?.status === 'completed' ? 'Hoàn thành' : latestRequest?.status === 'in_progress' ? 'Đang xử lý' : 'Chờ xử lý'}
                </span>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-border-color dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary dark:text-gray-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> Ngày gửi:</span>
                  <span className="font-medium text-text-main dark:text-white">
                    {latestRequest?.created_at ? new Date(latestRequest.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/student/requests')}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-border-color dark:border-gray-600 py-2.5 text-sm font-semibold text-text-main dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-text-main dark:text-white text-xl font-bold leading-tight tracking-tight">Truy cập nhanh</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div 
              onClick={() => navigate('/student/register')}
              className="group flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-border-color dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">app_registration</span>
                </div>
                <div className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[#9ca3af] group-hover:text-primary">arrow_forward</span>
                </div>
              </div>
              <h3 className="text-text-main dark:text-white text-lg font-bold mb-2">Đăng ký lưu trú</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-2">Gia hạn hợp đồng hiện tại hoặc đăng ký phòng mới cho kỳ tới.</p>
              <button className="mt-auto w-full rounded-lg bg-background-light dark:bg-gray-800 py-2 text-sm font-semibold text-text-main dark:text-white group-hover:bg-primary group-hover:text-white transition-colors">
                Đăng ký ngay
              </button>
            </div>

            <div 
              onClick={() => navigate('/student/requests/create')}
              className="group flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-border-color dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">handyman</span>
                </div>
                <div className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[#9ca3af] group-hover:text-orange-600">arrow_forward</span>
                </div>
              </div>
              <h3 className="text-text-main dark:text-white text-lg font-bold mb-2">Báo cáo sự cố</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-2">Gửi yêu cầu sửa chữa điện, nước hoặc cơ sở vật chất trong phòng.</p>
              <button className="mt-auto w-full rounded-lg bg-background-light dark:bg-gray-800 py-2 text-sm font-semibold text-text-main dark:text-white group-hover:bg-orange-600 group-hover:text-white transition-colors">
                Tạo yêu cầu
              </button>
            </div>

            <div 
              onClick={() => navigate('/student/bills')}
              className="group flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-border-color dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">history_edu</span>
                </div>
                <div className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[#9ca3af] group-hover:text-purple-600">arrow_forward</span>
                </div>
              </div>
              <h3 className="text-text-main dark:text-white text-lg font-bold mb-2">Hóa đơn & Thanh toán</h3>
              <p className="text-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-2">Xem lại các hóa đơn đã thanh toán và lịch sử giao dịch chi tiết.</p>
              <button className="mt-auto w-full rounded-lg bg-background-light dark:bg-gray-800 py-2 text-sm font-semibold text-text-main dark:text-white group-hover:bg-purple-600 group-hover:text-white transition-colors">
                Xem chi tiết
              </button>
            </div>

          </div>
        </div>
        
        <div className="h-10"></div>
      </div>
    </RoleBasedLayout>
  );
};

export default StudentDashboard;