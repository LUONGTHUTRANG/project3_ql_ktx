import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select } from 'antd';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { UserRole } from '../types';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';

import { SearchOutlined } from "@ant-design/icons";

const NotificationList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  if (!user) return null;

  const navItems = user.role === UserRole.STUDENT ? STUDENT_NAV_ITEMS : MANAGER_NAV_ITEMS;
  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  // Mock data for 25 items
  const allNotifications = Array.from({ length: 25 }, (_, i) => ({
    id: (i + 1).toString(),
    title: i % 2 === 0 ? `Thông báo đóng tiền điện tháng ${10 - (i % 10)}/2023` : `Lịch bảo trì thang máy khu ${String.fromCharCode(65 + (i % 4))}`,
    description: i % 2 === 0 
      ? `Vui lòng thanh toán số tiền 350.000 VNĐ trước ngày 15/${10 - (i % 10)}/2023...` 
      : `Bảo trì thang máy từ 08:00 đến 11:00. Vui lòng sử dụng cầu thang bộ.`,
    time: `${i + 1} giờ trước`,
    isRead: i > 2,
    type: i % 2 === 0 ? 'payments' : 'home_repair_service',
    typeColor: i % 2 === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
    typeBg: i % 2 === 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
  }));

  const totalItems = allNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentItems = allNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout 
      navItems={navItems}
      searchPlaceholder="Tìm kiếm dịch vụ, thông báo..."
      headerTitle="Thông báo"
      sidebarTitle={isManager ? "A1 Manager" : undefined}
    >
      <div className="layout-container flex h-full grow flex-col w-full mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Danh sách Thông báo</h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">Cập nhật tin tức và sự kiện mới nhất từ ban quản lý ký túc xá</p>
          </div>
          <button className="group flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary transition-all">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span className="text-sm font-bold leading-normal tracking-[0.015em] whitespace-nowrap">Đánh dấu tất cả đã đọc</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* <div className={`relative ${isManager ? 'md:col-span-6' : 'md:col-span-8'}`}>
              <Input
                placeholder="Tìm kiếm phòng, tòa nhà..."
                prefix={<SearchOutlined />}
                className="w-full h-11 gap-3 pl-1"
              />
            </div> */}
            <Input
              placeholder="Tìm kiếm phòng, tòa nhà..."
              prefix={<SearchOutlined />}
              className={`w-full h-11 gap-3 pl-1 col-span-8`}
            />
            
            {/* <div> */}
              <Select 
                className="w-full h-11 col-span-4"
                defaultValue=""
                options={[
                  { value: '', label: 'Tất cả loại tin' },
                  { value: 'payments', label: 'Đóng phí' },
                  { value: 'maintenance', label: 'Bảo trì' },
                ]}
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">filter_list</span>}
              />
            {/* </div> */}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {currentItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/notifications/${item.id}`)}
              className={`group flex flex-col md:flex-row gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${item.isRead ? 'border-transparent' : 'border-primary'}`}
            >
              <div className="flex flex-1 gap-4 items-start">
                <div className={`flex items-center justify-center rounded-full shrink-0 size-12 ${item.typeBg} ${item.typeColor}`}>
                  <span className="material-symbols-outlined text-[24px]">{item.type}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className={`text-base leading-tight ${item.isRead ? 'font-medium text-text-main dark:text-gray-200' : 'font-bold text-text-main dark:text-white'}`}>{item.title}</h3>
                  <p className="text-text-main dark:text-gray-300 text-sm leading-normal line-clamp-1">{item.description}</p>
                  <p className="text-text-secondary dark:text-gray-500 text-xs font-medium mt-1">{item.time}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                {!item.isRead && <div className="size-2.5 rounded-full bg-primary" title="Chưa đọc"></div>}
              </div>
            </div>
          ))}
          {currentItems.length === 0 && (
            <div className="py-20 text-center text-text-secondary">Không có thông báo nào.</div>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
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

export default NotificationList;