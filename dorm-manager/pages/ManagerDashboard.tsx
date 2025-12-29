import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { NavItem } from '../types';
import { 
  getAllStudents, 
  getAllRooms, 
  getAllSupportRequests, 
  getMyNotifications 
} from '../api';

export const MANAGER_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan Tòa A1', icon: 'dashboard', link: '/manager/home' },
  { label: 'Quản lý Phòng', icon: 'meeting_room', link: '/manager/rooms', isActive: true },
  { label: 'Quản lý Sinh viên', icon: 'school', link: '/manager/students' },
  { label: 'Yêu cầu hỗ trợ', icon: 'support_agent', link: '/manager/requests' },
  { label: 'Quản lý Thông báo', icon: 'notifications', link: '/manager/notifications' },
];

interface DashboardStats {
  totalStudents: number;
  newStudentsThisMonth: number;
  totalRooms: number;
  emptyRooms: number;
  occupancyRate: number;
  pendingRequests: number;
  urgentRequests: number;
  maintenanceInProgress: number;
}

interface SupportRequest {
  id: number | string;
  student_id?: string;
  full_name?: string;
  room_number?: string;
  type?: string;
  title?: string;
  content?: string;
  status?: string;
  created_at?: string;
}

interface Notification {
  id: number;
  title?: string;
  content?: string;
  type?: string;
  created_at?: string;
}

const ManagerDashboard: React.FC = () => {
  // Fix: Initialize useNavigate hook
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    newStudentsThisMonth: 0,
    totalRooms: 0,
    emptyRooms: 0,
    occupancyRate: 0,
    pendingRequests: 0,
    urgentRequests: 0,
    maintenanceInProgress: 0,
  });
  
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch students
        const studentsResponse = await getAllStudents(1, 1000);
        const students = studentsResponse?.data || studentsResponse || [];
        const studentCount = Array.isArray(students) ? students.length : studentsResponse?.total || 0;
        
        // Calculate new students this month (mock calculation, adjust based on your data)
        const currentMonth = new Date().getMonth();
        const newStudents = Array.isArray(students) 
          ? students.filter(s => {
              const createdDate = s.created_at ? new Date(s.created_at) : null;
              return createdDate && createdDate.getMonth() === currentMonth;
            }).length
          : Math.floor(Math.random() * 20);

        // Fetch rooms
        const roomsResponse = await getAllRooms();
        const rooms = roomsResponse?.data || roomsResponse || [];
        const totalRooms = Array.isArray(rooms) ? rooms.length : roomsResponse?.total || 0;
        
        // Calculate empty rooms
        const emptyRoomsCount = Array.isArray(rooms)
          ? rooms.filter(r => r.capacity && r.current_occupants && r.current_occupants < r.capacity).length
          : 0;
        
        const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - emptyRoomsCount) / totalRooms) * 100) : 0;

        // Fetch support requests
        const requestsResponse = await getAllSupportRequests(1, 10, {});
        const requests = requestsResponse?.data || requestsResponse || [];
        
        const pendingCount = Array.isArray(requests)
          ? requests.filter(r => r.status === 'pending' || r.status === 'waiting').length
          : 0;
        
        const urgentCount = Array.isArray(requests)
          ? requests.filter(r => r.type === 'urgent' || r.status === 'urgent').length
          : 0;

        setSupportRequests(Array.isArray(requests) ? requests.slice(0, 3) : []);

        // Fetch notifications
        const notifResponse = await getMyNotifications(1, 3);
        const notifs = notifResponse?.data || notifResponse || [];
        setNotifications(Array.isArray(notifs) ? notifs : []);

        // Update stats
        setStats({
          totalStudents: studentCount,
          newStudentsThisMonth: newStudents,
          totalRooms: totalRooms,
          emptyRooms: emptyRoomsCount,
          occupancyRate: occupancyRate,
          pendingRequests: pendingCount,
          urgentRequests: urgentCount,
          maintenanceInProgress: 2, // This might need a separate API endpoint
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Lỗi khi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <DashboardLayout
        navItems={MANAGER_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/manager/home'}))}
        searchPlaceholder="Tìm sinh viên, phòng tại Tòa A1..."
        headerTitle="Tòa nhà A1"
        headerSubtitle="Khu ký túc xá Đại học Quốc gia"
        sidebarTitle="A1 Manager"
      >
        <div className="flex flex-col gap-8">
          {/* Stats Grid */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <span className="material-symbols-outlined">groups</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tổng sinh viên</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.totalStudents}</h3>
                <p className="text-xs text-green-600 font-medium mt-1">+{stats.newStudentsThisMonth} sinh viên mới tháng này</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <span className="material-symbols-outlined">door_front</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Tổng: {loading ? '...' : stats.totalRooms}</span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Phòng còn trống</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.emptyRooms}</h3>
                <p className="text-xs text-slate-400 mt-1">Tỷ lệ lấp đầy: {loading ? '...' : stats.occupancyRate}%</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-y border-r border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-0 top-0 p-16 bg-orange-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between z-10">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className={`flex size-3 rounded-full animate-pulse ${stats.pendingRequests > 0 ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
              </div>
              <div className="z-10">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Yêu cầu cần xử lý</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.pendingRequests}</h3>
                <p className="text-xs text-orange-600 font-medium mt-1">{stats.urgentRequests} yêu cầu khẩn cấp</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <span className="material-symbols-outlined">handyman</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bảo trì đang thực hiện</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.maintenanceInProgress}</h3>
                <p className="text-xs text-slate-400 mt-1">Dự kiến xong: 16:00 hôm nay</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notifications Column */}
            <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  Thông báo quan trọng Tòa A1
                </h3>
                <button 
                  onClick={() => navigate('/manager/notifications')}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Tất cả thông báo
                </button>
              </div>
              <div className="flex-1 space-y-4">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Đang tải...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">Không có thông báo</div>
                ) : (
                  notifications.map((notif, index) => (
                    <div 
                      key={notif.id || index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent"
                    >
                      <div className="p-2 bg-white dark:bg-slate-700 text-blue-500 rounded-lg shrink-0 shadow-sm">
                        <span className="material-symbols-outlined">notifications</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {notif.title || 'Thông báo'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {notif.content || 'Không có nội dung'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {notif.created_at ? new Date(notif.created_at).toLocaleString('vi-VN') : 'Mới đây'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Truy cập nhanh</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/manager/rooms')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">meeting_room</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Quản lý Phòng</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Xem danh sách, tình trạng phòng</p>
                  </div>
                  <span className="material-symbols-outlined text-primary ml-auto" style={{ fontSize: '20px' }}>arrow_forward</span>
                </button>
                <button 
                  onClick={() => navigate('/manager/students')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-blue-500 group-hover:text-blue-600">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Quản lý Sinh viên</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tra cứu thông tin, hồ sơ</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/manager/requests')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-orange-500 group-hover:text-orange-600">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Xử lý Yêu cầu</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Báo hỏng, hỗ trợ sinh viên</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/manager/notifications')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-purple-500 group-hover:text-purple-600">
                    <span className="material-symbols-outlined">add_alert</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Tạo thông báo mới</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gửi tin đến sinh viên tòa A1</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yêu cầu hỗ trợ mới nhất (Tòa A1)</h3>
              <button 
                onClick={() => navigate('/student/requests')}
                className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Sinh viên</th>
                    <th className="px-6 py-4">Phòng</th>
                    <th className="px-6 py-4">Vấn đề</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : supportRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Không có yêu cầu hỗ trợ
                      </td>
                    </tr>
                  ) : (
                    supportRequests.map((request, index) => (
                      <tr key={request.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          #{String(request.id).padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden bg-cover flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {(request.full_name || 'N/A')[0]?.toUpperCase()}
                              </span>
                            </div>
                            {request.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {request.room_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '18px' }}>
                            construction
                          </span>
                          {request.title || request.type || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {request.status === 'pending' || request.status === 'waiting' ? 'Đang chờ' :
                             request.status === 'in_progress' ? 'Đang xử lý' :
                             request.status === 'completed' ? 'Hoàn thành' :
                             request.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {request.created_at ? new Date(request.created_at).toLocaleString('vi-VN') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/manager/requests/${request.id}`)}
                            className="text-slate-400 hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined">edit_square</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="h-10"></div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/student/requests/create')}
          className="fixed bottom-8 right-8 z-30 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl px-5 py-4 shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-bold pr-1">Ghi nhận sự cố</span>
        </button>
      </DashboardLayout>
    </>
  );
};

export default ManagerDashboard;