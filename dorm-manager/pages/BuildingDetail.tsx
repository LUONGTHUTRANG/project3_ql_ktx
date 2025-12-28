import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Select } from 'antd';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import Pagination from '../components/Pagination';

const BuildingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock data for rooms
  const allRooms = [
    { id: 'P.101', floor: 1, capacity: '4', price: '2.500.000đ', status: 'available', statusLabel: 'Còn trống (2/4)', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', hasAC: true, hasHeater: true },
    { id: 'P.102', floor: 1, capacity: '4', price: '2.500.000đ', status: 'full', statusLabel: 'Đã đầy', statusColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', hasAC: true, hasHeater: true },
    { id: 'P.201', floor: 2, capacity: '6', price: '2.250.000đ', status: 'available', statusLabel: 'Còn trống (1/6)', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', hasAC: true, hasHeater: false },
    { id: 'P.202', floor: 2, capacity: '6', price: '2.250.000đ', status: 'available', statusLabel: 'Còn trống (6/6)', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', hasAC: true, hasHeater: false },
    { id: 'P.305', floor: 3, capacity: '8', price: '1.750.000đ', status: 'available', statusLabel: 'Còn trống (1/8)', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', hasAC: false, hasHeater: true },
    { id: 'P.306', floor: 3, capacity: '8', price: '1.750.000đ', status: 'full', statusLabel: 'Đã đầy', statusColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', hasAC: false, hasHeater: true },
    { id: 'P.401', floor: 4, capacity: '4', price: '2.750.000đ', status: 'available', statusLabel: 'Còn trống (4/4)', statusColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', hasAC: true, hasHeater: true },
  ];

  const totalRooms = 120; // Giả lập tổng số phòng cho pagination

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/buildings'}))}
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết Tòa nhà"
    >
      <div className="mx-auto flex flex-col gap-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link to="/student" className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors">Trang chủ</Link>
          <span className="text-text-secondary dark:text-gray-600">/</span>
          <Link to="/student/buildings" className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors">Danh sách Tòa nhà</Link>
          <span className="text-text-secondary dark:text-gray-600">/</span>
          <span className="text-text-main dark:text-white font-bold">Chi tiết Tòa nhà {id}</span>
        </nav>

        <div className="flex flex-col gap-1">
          <h1 className="text-text-main dark:text-white text-3xl font-black tracking-tight">Chi tiết Tòa nhà {id}</h1>
          <p className="text-text-secondary dark:text-gray-400 text-base">Thông tin tổng quan và danh sách phòng tại Tòa nhà {id}</p>
        </div>

        {/* Building Info Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">Tòa nhà {id} - Khu Nam</h2>
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400 text-sm">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    Vị trí: Trung tâm Khu Nam, gần nhà ăn sinh viên số 1
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Đang hoạt động
                </span>
              </div>
              <p className="text-text-main dark:text-gray-300 text-sm leading-relaxed text-justify max-w-none">
                Tòa nhà {id} là một trong những khu ký túc xá hiện đại, được thiết kế thoáng mát, sạch sẽ. Tòa nhà có vị trí thuận lợi cho việc di chuyển đến giảng đường và các khu tiện ích chung. Hệ thống an ninh đảm bảo với camera giám sát và bảo vệ trực 24/7. Có khu vực sinh hoạt chung, phòng tự học và bãi gửi xe rộng rãi ở tầng hầm.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-border-color dark:border-gray-700 pt-6">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">SỐ TẦNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">layers</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">5</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">TỔNG SỐ PHÒNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">meeting_room</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">120</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">PHÒNG TRỐNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-green-500 text-xl font-bold">check_circle</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">12</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">LOẠI PHÒNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">bed</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">4 - 6 Giường</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room List Header & Filters - Enhanced Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4 px-1 sm:px-0">
          <div className="flex flex-col gap-1 shrink-0">
            <h3 className="text-xl font-bold text-text-main dark:text-white">Danh sách Phòng</h3>
            <p className="text-sm text-text-secondary dark:text-gray-400">Chọn phòng để xem chi tiết và quản lý</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px] z-10 pointer-events-none">search</span>
              <input 
                className="h-11 w-full pl-10 pr-4 rounded-lg bg-white dark:bg-gray-800 border-none shadow-sm ring-1 ring-inset ring-border-color dark:ring-gray-700 text-text-main dark:text-white placeholder:text-text-secondary focus:ring-2 focus:ring-primary text-sm transition-all" 
                placeholder="Tìm số phòng..."
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Select 
                className="h-11 flex-1 sm:min-w-[160px]"
                defaultValue=""
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                options={[
                  { value: '', label: 'Tất cả các tầng' },
                  { value: '1', label: 'Tầng 1' },
                  { value: '2', label: 'Tầng 2' },
                  { value: '3', label: 'Tầng 3' },
                  { value: '4', label: 'Tầng 4' },
                  { value: '5', label: 'Tầng 5' },
                ]}
              />
              <Select 
                className="h-11 flex-1 sm:min-w-[160px]"
                defaultValue=""
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">filter_list</span>}
                options={[
                  { value: '', label: 'Trạng thái' },
                  { value: 'available', label: 'Còn trống' },
                  { value: 'full', label: 'Đã đầy' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Room Table */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden mb-8 min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Số phòng</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Tầng</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Sức chứa</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Điều hòa</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Nóng lạnh</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Giá phòng / kỳ</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-right">Trạng thái</th>
                  <th className="p-4 text-right text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {allRooms.map((room) => (
                  <tr key={room.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{room.id}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm text-text-main dark:text-white font-medium">{room.floor}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm text-text-main dark:text-white font-bold">{room.capacity}</span>
                    </td>
                    <td className="p-4 text-center">
                      {room.hasAC ? (
                        <span className="material-symbols-outlined text-primary text-[20px] font-bold">ac_unit</span>
                      ) : (
                        <span className="material-symbols-outlined text-text-secondary/30 text-[20px]">close</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {room.hasHeater ? (
                        <span className="material-symbols-outlined text-orange-500 text-[20px] font-bold">hot_tub</span>
                      ) : (
                        <span className="material-symbols-outlined text-text-secondary/30 text-[20px]">close</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-primary">{room.price}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${room.statusColor} border-current/10`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${room.status === 'full' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        {room.statusLabel}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors" title="Xem chi tiết">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Sửa thông tin">
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </button>
                        <button className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Xóa phòng">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(totalRooms / itemsPerPage)}
            totalItems={totalRooms}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuildingDetail;