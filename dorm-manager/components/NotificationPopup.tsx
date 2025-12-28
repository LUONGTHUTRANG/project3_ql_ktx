import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationPopupProps {
  onClose: () => void;
}

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Hóa đơn điện nước T10",
    description: "Vui lòng thanh toán hóa đơn điện nước trước ngày 15/10 để tránh gián đoạn dịch vụ.",
    time: "Vừa xong",
    isRead: false,
    type: "receipt", // icon type
    colorClass: "text-primary",
    bgClass: "bg-blue-50 dark:bg-blue-900/30",
    groupHoverBg: "group-hover:bg-white dark:group-hover:bg-blue-900/50"
  },
  {
    id: 2,
    title: "Lịch bảo trì thang máy",
    description: "Thang máy khu B sẽ tạm ngưng hoạt động từ 8:00 - 12:00 ngày mai để bảo dưỡng.",
    time: "1 giờ trước",
    isRead: false,
    type: "home_repair_service",
    colorClass: "text-[#F59E0B]",
    bgClass: "bg-amber-50 dark:bg-amber-900/30",
    groupHoverBg: "group-hover:bg-white dark:group-hover:bg-amber-900/50"
  },
  {
    id: 3,
    title: "Thông báo đăng ký nội trú",
    description: "Cổng đăng ký cho học kỳ tới đã mở. Sinh viên lưu ý hoàn tất hồ sơ sớm.",
    time: "Hôm qua",
    isRead: true,
    type: "school",
    colorClass: "text-text-main dark:text-gray-300",
    bgClass: "bg-[#f0f2f4] dark:bg-gray-700/50",
    groupHoverBg: "group-hover:bg-white dark:group-hover:bg-gray-700"
  },
  {
    id: 4,
    title: "Nhắc nhở vệ sinh phòng",
    description: "Đợt kiểm tra vệ sinh phòng ở sẽ diễn ra vào cuối tuần này.",
    time: "2 ngày trước",
    isRead: true,
    type: "cleaning_services",
    colorClass: "text-text-main dark:text-gray-300",
    bgClass: "bg-[#f0f2f4] dark:bg-gray-700/50",
    groupHoverBg: "group-hover:bg-white dark:group-hover:bg-gray-700"
  }
];

const NotificationPopup: React.FC<NotificationPopupProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <>
      {/* Overlay to close when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>

      {/* Popup Container - Reduced width to 360px */}
      <div className="absolute top-full right-[-10px] mt-4 w-[360px] bg-white dark:bg-[#1A2633] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border-color dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
        
        {/* Popup Header - Smaller padding and fonts */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-color dark:border-gray-800 bg-white dark:bg-[#1A2633]">
          <h3 className="text-text-main dark:text-white text-base font-bold leading-tight tracking-[-0.015em]">Thông báo</h3>
          <a className="text-primary text-xs font-bold hover:text-primary-hover transition-colors flex items-center gap-1 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            Đánh dấu đã đọc
          </a>
        </div>

        {/* Popup Content: Notification List */}
        <div className="flex flex-col max-h-[400px] overflow-y-auto scrollbar-thin overscroll-contain bg-white dark:bg-[#1A2633]">
          {NOTIFICATIONS.map((item) => (
            <div 
              key={item.id}
              className={`flex gap-3 px-4 py-3 transition-colors border-b border-[#f0f2f4] dark:border-gray-800 cursor-pointer group ${
                !item.isRead 
                  ? 'bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-[#f0f2f4] dark:hover:bg-gray-800' 
                  : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Icon - Reduced size to size-10 */}
                <div className={`flex items-center justify-center rounded-lg shrink-0 size-10 transition-colors shadow-sm ${item.colorClass} ${item.bgClass} ${item.groupHoverBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.type}</span>
                </div>
                
                <div className="flex flex-1 flex-col justify-center min-w-0">
                  <div className="flex justify-between items-start w-full">
                    {/* Title - Reduced to text-sm */}
                    <p className={`text-text-main dark:text-white text-sm leading-snug truncate pr-2 ${!item.isRead ? 'font-bold' : 'font-medium'}`}>
                      {item.title}
                    </p>
                    {/* Time - Reduced to text-[10px] */}
                    <span className={`text-[10px] shrink-0 pt-0.5 ${!item.isRead ? 'font-medium text-primary' : 'font-normal text-text-secondary dark:text-gray-500'}`}>
                      {item.time}
                    </span>
                  </div>
                  {/* Description - Reduced to text-xs */}
                  <p className="text-text-secondary dark:text-gray-400 text-xs font-normal leading-relaxed mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
              
              {/* Unread Dot - Smaller size */}
              {!item.isRead && (
                <div className="shrink-0 pt-1.5">
                  <div className="size-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-[#1A2633]"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Popup Footer - Compact */}
        <div className="p-3 bg-[#f9fafb] dark:bg-[#15202b] border-t border-border-color dark:border-gray-800">
          <button 
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-[#1A2633] border border-border-color dark:border-gray-700 px-3 py-2 text-xs font-bold text-text-main dark:text-white hover:bg-[#f0f2f4] dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
          >
            Xem tất cả thông báo
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationPopup;