import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';
import { Input } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import { AuthContext } from '../App';
import { UserRole } from '../types';

const SupportRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Determine if the user is a manager
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  // Mock data for 12 items
  const allRequests = Array.from({ length: 12 }, (_, i) => ({
    id: `REQ-2023-${(i + 1).toString().padStart(3, '0')}`,
    category: i % 2 === 0 ? 'Điện' : 'Nước',
    icon: i % 2 === 0 ? 'bolt' : 'water_drop',
    iconColor: i % 2 === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400',
    iconBg: i % 2 === 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30',
    title: i % 2 === 0 ? 'Bóng đèn phòng tắm bị nhấp nháy' : 'Vòi nước bồn rửa mặt bị rò rỉ',
    description: 'Chi tiết nội dung yêu cầu hỗ trợ từ sinh viên...',
    date: '20/10/2023',
    time: '09:30 AM',
    status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'processing' : 'completed',
    statusLabel: i % 3 === 0 ? 'Đang chờ' : i % 3 === 1 ? 'Đang xử lý' : 'Đã hoàn thành',
    statusClass: i % 3 === 0 
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' 
      : i % 3 === 1 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    statusDot: i % 3 === 0 ? 'bg-yellow-500' : i % 3 === 1 ? 'bg-blue-500' : 'bg-green-500'
  }));

  const totalItems = allRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Logic to get current page items
  const currentItems = allRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (id: string) => {
    if (isManager) {
      navigate(`/manager/requests/${id}`);
    } else {
      navigate(`/student/requests/${id}`);
    }
  };

  return (
    <DashboardLayout 
      navItems={isManager ? MANAGER_NAV_ITEMS : STUDENT_NAV_ITEMS}
      searchPlaceholder="Tìm kiếm yêu cầu, dịch vụ..."
      headerTitle="Yêu cầu hỗ trợ"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Danh sách Yêu cầu</h2>
            <p className="text-text-secondary dark:text-gray-400 text-base">
              {isManager 
                ? 'Theo dõi và quản lý các yêu cầu hỗ trợ từ sinh viên.' 
                : 'Theo dõi và quản lý các vấn đề bạn đã báo cáo.'}
            </p>
          </div>
          {!isManager && (
            <button 
              onClick={() => navigate('/student/requests/create')}
              className="group flex items-center justify-center gap-2 h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Tạo yêu cầu mới</span>
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-[280px]">
            <Input
              placeholder="Tìm kiếm theo tiêu đề, mã yêu cầu..."
              prefix={<SearchOutlined />}
              className="w-full h-11 gap-3 pl-1 flex-1"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            <button className="flex h-11 items-center justify-center px-4 rounded-lg bg-text-main text-white dark:bg-white dark:text-text-main text-sm font-medium shadow-sm whitespace-nowrap transition-colors">Tất cả</button>
            <button className="flex h-11 items-center justify-center px-4 rounded-lg bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300 text-sm font-medium shadow-sm whitespace-nowrap transition-colors">Đang chờ</button>
            <button className="flex h-11 items-center justify-center px-4 rounded-lg bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300 text-sm font-medium shadow-sm whitespace-nowrap transition-colors">Đang xử lý</button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden min-h-[300px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">STT</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Vấn đề</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Chi tiết</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Ngày gửi</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {currentItems.map((item, index) => (
                  <tr key={item.id} onClick={() => handleRowClick(item.id)} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 align-top text-sm text-text-secondary dark:text-gray-400">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${item.iconBg} ${item.iconColor}`}>
                          <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-main dark:text-white">{item.category}</p>
                          <p className="text-xs text-text-secondary dark:text-gray-500">Mã: #{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm font-medium text-text-main dark:text-white mb-0.5">{item.title}</p>
                      <p className="text-sm text-text-secondary dark:text-gray-300 line-clamp-1 leading-relaxed">{item.description}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-sm text-text-main dark:text-gray-300 font-medium">{item.date}</p>
                      <p className="text-xs text-text-secondary">{item.time}</p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.statusClass}`}>
                        <span className={`size-1.5 rounded-full ${item.statusDot} ${item.status === 'processing' ? 'animate-pulse' : ''}`}></span>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <button className="text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
                      Không tìm thấy yêu cầu nào.
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

export default SupportRequests;