import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { UserRole } from '../types';
import { Spin, message } from 'antd';
import { getNotificationById } from '../api/notificationApi';

interface NotificationDetailProps {
  isManager?: boolean;
}

type Notification = {
  id: string;
  title: string;
  sender?: string;
  timestamp?: string;
  recipients?: string;
  content: string;
  target_scope?: string;
  created_at?: string;
  sender_id?: string;
  sender_role?: string;
  attachment_path?: string;
  attachment_url?: string;
};

const NotificationDetail: React.FC<NotificationDetailProps> = ({ isManager = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!user) return null;

  useEffect(() => {
    const loadNotification = async () => {
      if (id) {
        try {
          const data = await getNotificationById(id);
          setNotification(data);
        } catch (error: any) {
          message.error('Lỗi khi tải thông báo');
          console.error('Error loading notification:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNotification();
  }, [id]);

  const navItems = isManager ? MANAGER_NAV_ITEMS : STUDENT_NAV_ITEMS;
  const sidebarTitle = isManager ? "A1 Manager" : undefined;

  if (isLoading) {
    return (
      <DashboardLayout
        navItems={navItems}
        searchPlaceholder={isManager ? "Tìm sinh viên, phòng..." : "Tìm kiếm dịch vụ, thông báo..."}
        headerTitle="Chi tiết Thông báo"
        sidebarTitle={sidebarTitle}
      >
        <div className="flex items-center justify-center py-16">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!notification) {
    return (
      <DashboardLayout
        navItems={navItems}
        searchPlaceholder={isManager ? "Tìm sinh viên, phòng..." : "Tìm kiếm dịch vụ, thông báo..."}
        headerTitle="Chi tiết Thông báo"
        sidebarTitle={sidebarTitle}
      >
        <div className="flex items-center justify-center py-16">
          <p className="text-text-secondary dark:text-gray-400">Thông báo không tồn tại</p>
        </div>
      </DashboardLayout>
    );
  }

  const getFileType = (filename: string): 'pdf' | 'image' | 'document' => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return 'image';
    return 'document';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'image':
        return 'image';
      default:
        return 'description';
    }
  };

  const getFileIconColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'image':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const handleDownload = () => {
    if (notification?.attachment_url) {
      window.open(notification.attachment_url, '_blank');
    }
  };

  const handleView = () => {
    if (notification?.attachment_url) {
      window.open(notification.attachment_url, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    alert('Chia sẻ thông báo này');
  };

  return (
    <DashboardLayout
      navItems={navItems}
      searchPlaceholder={isManager ? "Tìm sinh viên, phòng..." : "Tìm kiếm dịch vụ, thông báo..."}
      headerTitle="Chi tiết Thông báo"
      sidebarTitle={sidebarTitle}
    >
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Header Section with Back Button and Actions */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <button
            onClick={() => navigate(isManager ? '/manager/notifications' : '/notifications')}
            className="group flex items-center gap-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách</span>
          </button>
          <div className="flex items-center gap-2">
            {isManager && (
              <button
                onClick={() => navigate(`/manager/notifications/${id}/edit`)}
                className="flex items-center justify-center size-9 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                title="Chỉnh sửa"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center justify-center size-9 rounded-lg text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="In thông báo"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center size-9 rounded-lg text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Chia sẻ"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>

        {/* Notification Detail Card */}
        <div className="flex flex-col bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-color dark:border-gray-800 overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 border-b border-border-color dark:border-gray-800 bg-background-light dark:bg-surface-dark/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
              
              {/* Sender Info */}
              <div className="flex items-center gap-4">
                <div className="size-12 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/30">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-text-main dark:text-white">{notification.sender}</h3>
                  <p className="text-xs font-medium text-text-secondary dark:text-gray-400">Người gửi</p>
                </div>
              </div>

              {/* Timestamp and Recipients */}
              <div className="flex flex-col md:items-end gap-2">
                <div className="flex items-center gap-2 text-sm text-text-main dark:text-gray-300 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary dark:text-gray-500">schedule</span>
                  {notification.timestamp}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap md:justify-end">
                  <span className="text-xs text-text-secondary dark:text-gray-500">Gửi đến:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                    {notification.recipients}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-text-main dark:text-white leading-tight tracking-[-0.015em]">
                {notification.title}
              </h1>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 text-text-main dark:text-gray-200 leading-relaxed text-base space-y-4 border-b border-border-color dark:border-gray-800">
            {notification.content.split('\n').map((paragraph, index) => (
              <p key={index} className={paragraph.trim() === '' ? 'h-0' : ''}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Attachments Section */}
          {notification?.attachment_path && (
            <div className="p-6 border-t border-border-color dark:border-gray-800">
              <h3 className="text-xs font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">attachment</span>
                Tệp đính kèm
              </h3>
              <div className="flex items-center p-3 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark hover:shadow-md hover:border-primary/30 transition-all group">
                <div className={`flex items-center justify-center size-10 rounded ${getFileIconColor(getFileType(notification.attachment_path))} mr-3 shrink-0`}>
                  <span className="material-symbols-outlined">{getFileIcon(getFileType(notification.attachment_path))}</span>
                </div>
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-semibold text-text-main dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                    {notification.attachment_path.split('/').pop() || notification.attachment_path}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleView}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Xem"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Tải xuống"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationDetail;
