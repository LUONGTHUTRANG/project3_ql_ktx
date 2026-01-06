import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { AuthContext } from '../App';
import { 
  getAllStudents, 
  getAllRooms, 
  getAllSupportRequests, 
  fetchBuildings 
} from '../api';

interface DashboardStats {
  totalStudents: number;
  availableRooms: number;
  totalRooms: number;
  pendingRequests: number;
  overduePayments: number;
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

interface BuildingOccupancy {
  building: string;
  occupancyRate: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    availableRooms: 0,
    totalRooms: 0,
    pendingRequests: 0,
    overduePayments: 0,
  });
  
  const [buildingOccupancy, setBuildingOccupancy] = useState<BuildingOccupancy[]>([]);
  
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
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

        // Fetch rooms
        const roomsResponse = await getAllRooms();
        const rooms = Array.isArray(roomsResponse) 
          ? roomsResponse 
          : (roomsResponse?.data || roomsResponse || []);
        
        const totalRooms = Array.isArray(rooms) ? rooms.length : roomsResponse?.total || 0;
        
        // Calculate available rooms - rooms with capacity > current occupants
        const availableRoomsCount = Array.isArray(rooms)
          ? rooms.filter(r => {
              const capacity = r.capacity || r.max_capacity || 0;
              const occupants = r.current_occupants || r.occupants || 0;
              return capacity > occupants;
            }).length
          : 0;

        // Fetch support requests
        const requestsResponse = await getAllSupportRequests(1, 10, {});
        const requests = requestsResponse?.data || requestsResponse || [];
        
        const pendingCount = Array.isArray(requests)
          ? requests.filter(r => r.status === 'pending' || r.status === 'waiting').length
          : 0;

        setSupportRequests(Array.isArray(requests) ? requests.slice(0, 3) : []);

        // Fetch buildings and calculate occupancy rates
        try {
          const buildingsResponse = await fetchBuildings();
          const buildings = Array.isArray(buildingsResponse) 
            ? buildingsResponse 
            : (buildingsResponse?.data || buildingsResponse || []);

          // Calculate occupancy rate for each building
          const buildingOccupancyData = buildings
            .map((building: any) => {
              const buildingRooms = Array.isArray(rooms)
                ? rooms.filter((r: any) => r.building_id === building.id || r.building_name === building.name)
                : [];
              
              const totalCapacity = buildingRooms.reduce((sum: number, room: any) => {
                return sum + (room.capacity || room.max_capacity || 0);
              }, 0);

              const totalOccupants = buildingRooms.reduce((sum: number, room: any) => {
                return sum + (room.current_occupants || room.occupants || 0);
              }, 0);

              const occupancyRate = totalCapacity > 0 
                ? Math.round((totalOccupants / totalCapacity) * 100)
                : 0;

              return {
                building: building.name || building.building_name || `Building ${building.id}`,
                occupancyRate: occupancyRate,
              };
            })
            .sort((a: any, b: any) => b.occupancyRate - a.occupancyRate);

          setBuildingOccupancy(buildingOccupancyData.length > 0 ? buildingOccupancyData : []);
        } catch (buildingErr) {
          console.error('Error fetching buildings:', buildingErr);
          setBuildingOccupancy([]);
        }

        // Update stats
        setStats({
          totalStudents: studentCount || 0,
          availableRooms: availableRoomsCount,
          totalRooms: totalRooms || 0,
          pendingRequests: pendingCount,
          overduePayments: 5, // This would need a separate API call if available
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

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'pending':
      case 'waiting':
        return 'Đang chờ';
      case 'in_progress':
        return 'Đang xử lý';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status || 'N/A';
    }
  };

  return (
    <RoleBasedLayout
      searchPlaceholder="Tìm sinh viên, phòng..."
      headerTitle="Trang chủ"
    >
      <div className="flex flex-col gap-8">
        {/* Stats Grid */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat Card 1 - Total Students */}
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+4.5%</span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tổng sinh viên</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.totalStudents}</h3>
            </div>
          </div>

          {/* Stat Card 2 - Available Rooms */}
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <span className="material-symbols-outlined">door_front</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Còn trống {stats.availableRooms}</span>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Phòng khả dụng</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? '...' : `${stats.availableRooms} / ${stats.totalRooms}`}
              </h3>
            </div>
          </div>

          {/* Stat Card 3 - Pending Requests */}
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-y border-r border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute right-0 top-0 p-16 bg-orange-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
            <div className="flex items-center justify-between z-10">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <span className={`flex size-3 rounded-full animate-pulse ${stats.pendingRequests > 0 ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
            </div>
            <div className="z-10">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Yêu cầu chờ xử lý</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.pendingRequests}</h3>
            </div>
          </div>

          {/* Stat Card 4 - Overdue Payments */}
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Phí quá hạn</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.overduePayments}</h3>
            </div>
          </div>
        </div>

        {/* Charts and Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tỷ lệ lấp đầy theo tòa nhà</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Cập nhật: 10 phút trước</p>
              </div>
              <button className="text-primary text-sm font-medium hover:underline">Chi tiết</button>
            </div>
            <div className="flex-1 flex items-end justify-around gap-4 h-64 px-4 pt-4 border-b border-slate-100 dark:border-slate-800">
              {buildingOccupancy.map((building, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                  <div className="relative w-full max-w-[60px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-48 overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-primary/80 group-hover:bg-primary transition-all duration-300 rounded-t-lg" 
                      style={{ height: `${building.occupancyRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{building.building}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{building.occupancyRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tác vụ nhanh</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/admin/students')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
              >
                <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-primary group-hover:text-primary/80">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Thêm sinh viên mới</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đăng ký hồ sơ và xếp phòng</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/admin/notifications')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
              >
                <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-orange-500 group-hover:text-orange-600">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Tạo thông báo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gửi tin nhắn toàn khu</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/admin/rooms')}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
              >
                <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-purple-500 group-hover:text-purple-600">
                  <span className="material-symbols-outlined">key</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Check-in phòng</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Giao nhận chìa khóa</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Requests Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yêu cầu hỗ trợ gần đây</h3>
            <button 
              onClick={() => navigate('/admin/requests')}
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
                        #RQ-{String(request.id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden bg-cover flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {(request.student_name || 'N/A')[0]?.toUpperCase()}
                            </span>
                          </div>
                          {request.student_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {request.room_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '18px' }}>
                          plumbing
                        </span>
                        {request.title || request.type || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {request.created_at ? new Date(request.created_at).toLocaleString('vi-VN') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate(`/admin/requests/${request.id}`)}
                          className="text-slate-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
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
        onClick={() => navigate('/admin/notifications/create')}
        className="fixed bottom-8 right-8 z-30 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl px-5 py-4 shadow-lg shadow-primary/30 transition-all transform hover:scale-105 active:scale-95"
      >
        <span className="material-symbols-outlined">add</span>
        <span className="font-bold pr-1">Tạo mới</span>
      </button>
    </RoleBasedLayout>
  );
};

export default AdminDashboard;
