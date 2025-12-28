import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { UserRole } from '../types';

type AttachedFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'image' | 'document';
};

type Notification = {
  id: string;
  title: string;
  sender: string;
  timestamp: string;
  recipients: string;
  content: string;
  attachments: AttachedFile[];
};

// Mock notification data
const mockNotifications: Record<string, Notification> = {
  '1': {
    id: '1',
    title: 'Thông báo đóng tiền điện tháng 10',
    sender: 'Ban Quản Lý Ký Túc Xá',
    timestamp: '10:30 - 20/10/2023',
    recipients: 'Toàn thể sinh viên Khu A',
    content: `Thân gửi các bạn sinh viên,

Ban quản lý ký túc xá xin thông báo về việc thanh toán tiền điện tháng 10/2023 cho các phòng thuộc khu vực tòa nhà A. Theo số liệu ghi nhận từ công tơ điện vào ngày 15/10/2023, chi tiết tiêu thụ điện năng của các phòng đã được tổng hợp đầy đủ.

Thông tin chi tiết thanh toán:
• Số tiền cần thanh toán trung bình: 350.000 VNĐ / phòng.
• Hạn chót thanh toán: Trước 17:00 ngày 25/10/2023.
• Hình thức thanh toán: Chuyển khoản qua App Dormitory Manager hoặc nộp trực tiếp tại Văn phòng BQL (Tầng 1, Nhà A).

Đề nghị đại diện các phòng kiểm tra lại chỉ số điện và thực hiện thanh toán đúng hạn để tránh bị cắt điện sinh hoạt. Nếu có thắc mắc về chỉ số điện, vui lòng liên hệ ban quản lý tòa nhà trong giờ hành chính.

Các trường hợp chậm thanh toán quá 3 ngày so với hạn chót sẽ bị xử lý theo quy định của ký túc xá.

Trân trọng,
Ban quản lý Ký túc xá.`,
    attachments: [
      {
        id: '1',
        name: 'Chi_tiet_tien_dien_T10.pdf',
        size: '2.4 MB',
        date: '20/10/2023',
        type: 'pdf',
      },
      {
        id: '2',
        name: 'QR_Code_Thanh_Toan.png',
        size: '540 KB',
        date: '20/10/2023',
        type: 'image',
      },
    ],
  },
};

const NotificationDetail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  if (!user) return null;

  const isStudent = user.role === UserRole.STUDENT;
  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
  const navItems = isStudent ? STUDENT_NAV_ITEMS : MANAGER_NAV_ITEMS;
  const sidebarTitle = isManager ? "A1 Manager" : undefined;

  const notification = mockNotifications[id || '1'];

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

  const handleDownload = (file: AttachedFile) => {
    // Simulate download
    alert(`Đang tải xuống: ${file.name}`);
  };

  const handleView = (file: AttachedFile) => {
    // Simulate file view
    alert(`Xem: ${file.name}`);
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
            onClick={() => navigate('/notifications')}
            className="group flex items-center gap-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách</span>
          </button>
          <div className="flex items-center gap-2">
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
          {notification.attachments.length > 0 && (
            <div className="p-6 border-t border-border-color dark:border-gray-800">
              <h3 className="text-xs font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">attachment</span>
                Tệp đính kèm ({notification.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notification.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center p-3 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className={`flex items-center justify-center size-10 rounded ${getFileIconColor(file.type)} mr-3 shrink-0`}>
                      <span className="material-symbols-outlined">{getFileIcon(file.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-semibold text-text-main dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-500">
                        {file.size} • {file.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleView(file)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Xem"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Tải xuống"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationDetail;
