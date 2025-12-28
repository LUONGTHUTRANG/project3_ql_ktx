import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Input } from 'antd';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';
import { SearchOutlined } from "@ant-design/icons";

const RoomManagement: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const rooms = [
    { id: 'P.101', building: 'Tòa A', floor: 'Tầng 1', type: '4 Giường (Chuẩn)', status: 'occupied', statusLabel: 'Đã ở', capacity: '3/4', progress: 75, area: '25 m²', price: '1,200,000 đ', utilities: ['ac_unit', 'wifi'] },
    { id: 'P.102', building: 'Tòa A', floor: 'Tầng 1', type: '6 Giường (Thường)', status: 'available', statusLabel: 'Còn trống', capacity: '0/6', progress: 0, area: '30 m²', price: '800,000 đ', utilities: ['wifi'] },
    { id: 'P.205', building: 'Tòa B', floor: 'Tầng 2', type: '2 Giường (VIP)', status: 'maintenance', statusLabel: 'Bảo trì', capacity: '0/2', progress: 0, area: '20 m²', price: '2,500,000 đ', utilities: ['ac_unit', 'kitchen', 'wifi'] },
    { id: 'P.301', building: 'Tòa C', floor: 'Tầng 3', type: '4 Giường (Chuẩn)', status: 'occupied', statusLabel: 'Đã ở', capacity: '4/4', progress: 100, area: '25 m²', price: '1,200,000 đ', utilities: ['ac_unit', 'wifi'] },
  ];

  const handleRoomClick = (id: string) => {
    navigate(`/manager/rooms/${id}`);
  };

  const totalItems = 120; // Mock total count
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <DashboardLayout 
      navItems={MANAGER_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/manager/rooms'}))}
      searchPlaceholder="Tìm kiếm phòng, sinh viên..."
      headerTitle="Quản lý Phòng"
      sidebarTitle="A1 Manager"
    >
      <div className="flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Page Heading & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-text-main dark:text-white md:text-3xl">Quản lý Phòng</h2>
            <p className="mt-1 text-sm text-text-secondary dark:text-gray-400 font-medium">Xem và cập nhật thông tin chi tiết các phòng ký túc xá.</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark px-5 py-2.5 text-sm font-bold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Rooms */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Tổng số phòng</p>
                <p className="mt-2 text-3xl font-black text-text-main dark:text-white">120</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 text-primary">
                <span className="material-symbols-outlined text-2xl font-bold">apartment</span>
              </div>
            </div>
          </div>
          {/* Available */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Còn trống</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-text-main dark:text-white">15</p>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">+2%</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-emerald-600">
                <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
              </div>
            </div>
          </div>
          {/* Occupied */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Đã ở</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-text-main dark:text-white">100</p>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">+5%</span>
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4 text-purple-600">
                <span className="material-symbols-outlined text-2xl font-bold">groups</span>
              </div>
            </div>
          </div>
          {/* Maintenance */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Bảo trì</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-black text-text-main dark:text-white">5</p>
                  <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">-1%</span>
                </div>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600">
                <span className="material-symbols-outlined text-2xl font-bold">build_circle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Tìm kiếm phòng, tòa nhà..."
            prefix={<SearchOutlined />}
            className="w-full h-11 gap-3 pl-1 flex-1"
          />

          <div>
              <Select 
                className="min-w-[180px] h-11"
                defaultValue=""
                options={[
                  { value: '', label: 'Tất cả Trạng thái' },
                  { value: 'empty', label: 'Còn trống' },
                  { value: 'occupied', label: 'Đã ở' },
                  { value: 'maintenance', label: 'Bảo trì' },
                ]}
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
              />
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400">
                <tr>
                  <th className="px-6 py-5" scope="col">Phòng</th>
                  <th className="px-6 py-5" scope="col">Loại phòng</th>
                  <th className="px-6 py-5" scope="col">Trạng thái</th>
                  <th className="px-6 py-5" scope="col">Sức chứa</th>
                  <th className="px-6 py-5" scope="col">Diện tích</th>
                  <th className="px-6 py-5" scope="col">Giá (Tháng)</th>
                  <th className="px-6 py-5" scope="col">Tiện ích</th>
                  <th className="px-6 py-5 text-right" scope="col">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {rooms.map((room, idx) => (
                  <tr key={idx} onClick={() => handleRoomClick(room.id)} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                          room.status === 'occupied' ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' : 
                          room.status === 'available' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                          'bg-red-50 dark:bg-red-900/20 text-red-600'
                        }`}>
                          <span className="material-symbols-outlined text-[22px]">{room.status === 'maintenance' ? 'construction' : 'door_front'}</span>
                        </div>
                        <div>
                          <div className="font-black text-text-main dark:text-white text-base group-hover:text-primary transition-colors">{room.id}</div>
                          <div className="text-[11px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-tighter">{room.building} - {room.floor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-text-main dark:text-gray-200">{room.type}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                        room.status === 'occupied' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' : 
                        room.status === 'available' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50' :
                        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-100 dark:border-red-900/50'
                      }`}>
                        {room.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-16 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-inner">
                          <div className={`h-2 rounded-full transition-all duration-500 ${
                            room.status === 'occupied' ? 'bg-primary' : 
                            room.status === 'available' ? 'bg-emerald-500' : 
                            'bg-red-500'
                          }`} style={{ width: `${room.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-text-main dark:text-white">{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-text-main dark:text-gray-300">{room.area}</td>
                    <td className="px-6 py-5 font-black text-text-main dark:text-white">{room.price}</td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {room.utilities.map((util, uIdx) => (
                          <span key={uIdx} className="material-symbols-outlined text-[20px] text-text-secondary/50 dark:text-gray-600 hover:text-primary transition-colors cursor-help" title={util === 'ac_unit' ? 'Điều hòa' : util === 'wifi' ? 'Wifi' : 'Tủ lạnh'}>
                            {util}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        <button className="size-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button className="size-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90">
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
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomManagement;