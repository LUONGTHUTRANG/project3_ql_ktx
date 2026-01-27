import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { AuthContext } from '../App';
import Pagination from '../components/Pagination';
import { Input, Spin, message } from 'antd';
import { fetchRoomById } from '../api';
import { getStudentsByRoomId, getStudentById } from '../api';
import { getServicePrices } from '../api';
import { SearchOutlined } from "@ant-design/icons";
import { formatPrice } from '../utils/formatters';
import { UserRole } from '../types';

interface Room {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  max_capacity: number;
  price_per_semester: number;
  has_ac: number;
  has_heater: number;
  has_washer: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Student {
  id: number;
  mssv: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  class_name?: string;
  student_status?: string;
  stay_status?: string;
  current_room_id?: number;
  room_number?: string;
  building_name?: string;
}

interface ServicePrice {
  id: number;
  service_name: string;
  unit_price: number;
  apply_date: string;
  is_active: number;
}

const RoomDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);

  if (!user) return null;

  // Fetch room, students, and service prices data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let roomId = id;
        
        // If no id param, fetch student's current room
        if (!roomId && user.role === UserRole.STUDENT) {
          const studentData = await getStudentById(user.id);
          roomId = studentData?.current_room_id || studentData?.current_room_id;
        }
        
        if (roomId) {
          const [roomData, studentsData, pricesData] = await Promise.all([
            fetchRoomById(roomId),
            getStudentsByRoomId(roomId),
            getServicePrices()
          ]);
          setRoom(roomData);
          setStudents(Array.isArray(studentsData) ? studentsData : []);
          setServicePrices(Array.isArray(pricesData) ? pricesData : []);
        } else if (user.role === UserRole.STUDENT) {
          message.warning('Bạn chưa được phân phòng');
          navigate('/student/home');
        }
      } catch (error: any) {
        message.error('Lỗi khi tải thông tin phòng');
        console.error('Error fetching room details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, user.id, user.role, navigate]);

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    return !searchText || 
      student.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
      student.mssv.toLowerCase().includes(searchText.toLowerCase());
  });

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
  const isStudent = user.role === UserRole.STUDENT;
  const backLink = isManager ? `/${user.role}/rooms` : '/student/home';

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm sinh viên trong phòng..."
      headerTitle="Thông tin Phòng"
    >
      {isManager && (<button
            onClick={() => navigate(backLink)}
            className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách phòng</span>
          </button>)}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      ) : !room ? (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <div className="text-center">
            <p className="font-medium text-red-600 mb-2">Không tìm thấy phòng</p>
            <button 
              onClick={() => navigate('/manager/rooms')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col mx-auto gap-6">

        {/* Page Header & Actions */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 px-1 items-start lg:items-end border-b border-border-color dark:border-gray-700 pb-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Phòng {room.room_number} - Tầng {room.floor}</h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary dark:text-gray-400 text-sm md:text-base font-medium">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[20px] text-primary">layers</span> Tầng {room.floor}</span>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-widest ${
                room.status === 'AVAILABLE' 
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-800' 
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800'
              }`}>
                <span className={`size-2 rounded-full ${room.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></span>
                {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đầy'}
              </span>
            </div>
          </div>
          {/* {user.role === UserRole.ADMIN && <div className="flex gap-3 flex-wrap">
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-5 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Cấu hình
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-5 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Chỉnh sửa
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Thêm sinh viên
            </button>
          </div>} */}
        </div>

        {/* Info Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Overview */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-primary">
                <span className="material-symbols-outlined font-bold">info</span>
              </div>
              <h3 className="text-lg font-bold text-xl dark:text-white tracking-tight">Thông tin chung</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-bold uppercase tracking-widest">Sức chứa</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">group</span>
                  {students.length}/{room.max_capacity}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-bold uppercase tracking-widest">Tầng</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">layers</span>
                  {room.floor}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-bold uppercase tracking-widest">Điều hòa</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">ac_unit</span>
                  {room.has_ac ? 'Có' : 'Không'}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-bold uppercase tracking-widest">Nóng lạnh</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">hot_tub</span>
                  {room.has_heater ? 'Có' : 'Không'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Costs */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600">
                <span className="material-symbols-outlined font-bold">payments</span>
              </div>
              <h3 className="text-lg font-bold text-xl dark:text-white tracking-tight">Chi phí hàng tháng</h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">bedroom_parent</span>
                  <span className="text-sm font-bold">Giá phòng / kỳ</span>
                </div>
                <span className="text-text-main dark:text-white font-bold text-base">{formatPrice(room.price_per_semester)}</span>
              </div>
              {servicePrices.length > 0 && (
                <>
                  {servicePrices.find(p => p.service_name === 'ELECTRICITY') && (
                    <div className="flex justify-between items-center pt-4 border-t border-border-color/30 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">flash_on</span>
                        <span className="text-sm font-bold">Giá điện / kWh</span>
                      </div>
                      <span className="text-text-main dark:text-white font-bold text-base">{formatPrice(servicePrices.find(p => p.service_name === 'ELECTRICITY')?.unit_price)}</span>
                    </div>
                  )}
                  {servicePrices.find(p => p.service_name === 'WATER') && (
                    <div className="flex justify-between items-center pt-4 border-t border-border-color/30 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                        <span className="material-symbols-outlined text-[20px]">water_drop</span>
                        <span className="text-sm font-bold">Giá nước / m³</span>
                      </div>
                      <span className="text-text-main dark:text-white font-bold text-base">{formatPrice(servicePrices.find(p => p.service_name === 'WATER')?.unit_price)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3: Facilities */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600">
                <span className="material-symbols-outlined font-bold">chair</span>
              </div>
              <h3 className="text-lg font-bold text-xl dark:text-white tracking-tight">Trang thiết bị</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {room.has_ac ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">ac_unit</span>
                  <span className="text-xs font-bold text-text-main dark:text-gray-300">Điều hòa</span>
                </div>
              ) : null}
              {room.has_heater ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">hot_tub</span>
                  <span className="text-xs font-bold text-text-main dark:text-gray-300">Nóng lạnh</span>
                </div>
              ) : null}
              {room.has_washer ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">local_laundry_service</span>
                  <span className="text-xs font-bold text-text-main dark:text-gray-300">Máy giặt</span>
                </div>
              ) : null}
            </div>
            <button className="mt-auto text-xs font-bold text-text-secondary dark:text-gray-500 hover:text-primary transition-colors uppercase tracking-widest text-center">
              Quản lý tài sản
            </button>
          </div>
        </div>

        {/* Student List Section */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-text-main dark:text-white tracking-tight text-xl font-bold">Danh sách sinh viên hiện tại ({filteredStudents.length})</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400">Theo dõi thông tin và tình trạng cư trú của sinh viên</p>
            </div>
            <div className="relative min-w-[240px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
          
              <Input
                placeholder="Tìm sinh viên..."
                prefix={<SearchOutlined />}
                className="w-full h-11 gap-3 pl-1 flex-1"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                    <th className="py-5 px-6 text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400">Sinh viên</th>
                    <th className="py-5 px-6 text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 text-center">MSSV</th>
                    <th className="py-5 px-6 text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400">Thông tin liên hệ</th>
                    <th className="py-5 px-6 text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400">Tình trạng</th>
                    {isManager && <th className="py-5 px-6 text-xs font-semibold uppercase tracking-widest text-text-secondary dark:text-gray-400 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color dark:divide-gray-700">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student, index) => (
                      <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-5 px-6 font-bold">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-md text-text-main dark:text-white group-hover:text-primary transition-colors">{student.full_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="font-bold py-5 px-6 text-center">
                          <span className="text-md text-text-main dark:text-gray-300">
                            {student.mssv}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-text-main dark:text-gray-400">
                              <span className="material-symbols-outlined text-[16px] text-text-secondary">call</span>
                              {student.phone_number}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-text-main dark:text-gray-400">
                              <span className="material-symbols-outlined text-[16px] text-text-secondary">mail</span>
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            student.student_status === 'STUDYING' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                            'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                          }`}>
                            {student.student_status === 'STUDYING' ? 'Đang học' : 'Đã tốt nghiệp'}
                          </span>
                        </td>
                        {isManager && <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="size-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 hover:text-primary text-text-secondary dark:text-gray-400 transition-all" title="Xem hồ sơ"
                              onClick={() => navigate(`/${user.role}/students/${student.id}`)}
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            {/* <button className="size-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 transition-all" title="Rời phòng">
                              <span className="material-symbols-outlined text-[20px]">logout</span>
                            </button> */}
                          </div>
                        </td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isManager ? 5 : 4} className="py-12 px-6 text-center text-text-secondary dark:text-gray-400">
                        Phòng chưa có sinh viên ở
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      </div>
      )}
    </RoleBasedLayout>
  );
};

export default RoomDetail;