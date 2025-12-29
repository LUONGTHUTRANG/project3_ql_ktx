import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Spin } from 'antd';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { UserRole } from '../types';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';
import { getMyNotifications, getAllNotifications } from '../api';
import { SearchOutlined } from "@ant-design/icons";

const NotificationList: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) return null;

  const navItems = user.role === UserRole.STUDENT ? STUDENT_NAV_ITEMS : MANAGER_NAV_ITEMS;
  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  // Fetch notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        
        // const fetchFunc = isManager ? getAllNotifications : getMyNotifications;
        const response = await getMyNotifications(currentPage, itemsPerPage, {
          type: filterType || undefined,
        });
        
        setNotifications(response.data || []);
        setTotalItems(response.pagination?.totalItems || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err: any) {
        console.error('Failed to load notifications:', err);
        setError(err.response?.data?.error || err.message || 'Lỗi khi tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user, currentPage, itemsPerPage, filterType, isManager]);

  const getNotificationTypeInfo = (type: string) => {
    let typeIcon = 'notifications';
    let typeColor = 'text-primary dark:text-primary';
    let typeBg = 'bg-primary/10 dark:bg-primary/20';

    if (type === 'ANNOUNCEMENT') {
      typeIcon = 'notifications_active';
      typeColor = 'text-blue-600 dark:text-blue-400';
      typeBg = 'bg-blue-50 dark:bg-blue-900/20';
    } else if (type === 'INVOICE' || type === 'PAYMENT') {
      typeIcon = 'payments';
      typeColor = 'text-red-600 dark:text-red-400';
      typeBg = 'bg-red-50 dark:bg-red-900/20';
    } else if (type === 'MAINTENANCE') {
      typeIcon = 'home_repair_service';
      typeColor = 'text-amber-600 dark:text-amber-400';
      typeBg = 'bg-amber-50 dark:bg-amber-900/20';
    } else if (type === 'ALERT') {
      typeIcon = 'warning';
      typeColor = 'text-orange-600 dark:text-orange-400';
      typeBg = 'bg-orange-50 dark:bg-orange-900/20';
    }

    return { typeIcon, typeColor, typeBg };
  };

  const formatTime = (createdAt: string) => {
    if (!createdAt) return '-';
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredNotifications.slice(
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            
            <Select 
              className="w-full h-11 col-span-4"
              value={filterType}
              onChange={(val) => {
                setFilterType(val);
                setCurrentPage(1);
              }}
              options={[
                { value: '', label: 'Tất cả loại tin' },
                { value: 'ANNOUNCEMENT', label: 'Thông báo' },
                { value: 'PAYMENT', label: 'Đóng phí' },
                { value: 'MAINTENANCE', label: 'Bảo trì' },
                { value: 'ALERT', label: 'Cảnh báo' },
              ]}
              suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">filter_list</span>}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin tip="Đang tải thông báo..." />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-600">{error}</div>
          ) : currentItems.length === 0 ? (
            <div className="py-20 text-center text-text-secondary">Không có thông báo nào.</div>
          ) : (
            currentItems.map((item) => {
              const typeInfo = getNotificationTypeInfo(item.type);
              return (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/notifications/${item.id}`)}
                  className={`group flex flex-col md:flex-row gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${item.is_read ? 'border-transparent' : 'border-primary'}`}
                >
                  <div className="flex flex-1 gap-4 items-start">
                    <div className={`flex items-center justify-center rounded-full shrink-0 size-12 ${typeInfo.typeBg} ${typeInfo.typeColor}`}>
                      <span className="material-symbols-outlined text-[24px]">{typeInfo.typeIcon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className={`text-base leading-tight ${item.is_read ? 'font-medium text-text-main dark:text-gray-200' : 'font-bold text-text-main dark:text-white'}`}>{item.title}</h3>
                      <p className="text-text-main dark:text-gray-300 text-sm leading-normal line-clamp-1">{item.content}</p>
                      <p className="text-text-secondary dark:text-gray-500 text-xs font-medium mt-1">{formatTime(item.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {!item.is_read && <div className="size-2.5 rounded-full bg-primary" title="Chưa đọc"></div>}
                  </div>
                </div>
              );
            })
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