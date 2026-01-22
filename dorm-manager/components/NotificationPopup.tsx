import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Modal } from 'antd';
import { getMyNotifications, markAsRead } from '../api';

interface NotificationPopupProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ onClose, onNotificationRead }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const startTime = performance.now();
        const response = await getMyNotifications(1, 4);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        setLoadTime(duration);
        const data = response.data || [];
        setNotifications(data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const getNotificationTypeInfo = (type: string) => {
    let typeIcon = 'notifications';
    let colorClass = 'text-primary';
    let bgClass = 'bg-blue-50 dark:bg-blue-900/30';
    let groupHoverBg = 'group-hover:bg-white dark:group-hover:bg-blue-900/50';

    if (type === 'ANNOUNCEMENT') {
      typeIcon = 'notifications_active';
      colorClass = 'text-blue-600 dark:text-blue-400';
      bgClass = 'bg-blue-50 dark:bg-blue-900/30';
      groupHoverBg = 'group-hover:bg-white dark:group-hover:bg-blue-900/50';
    } else if (type === 'INVOICE' || type === 'PAYMENT') {
      typeIcon = 'payments';
      colorClass = 'text-red-600 dark:text-red-400';
      bgClass = 'bg-red-50 dark:bg-red-900/30';
      groupHoverBg = 'group-hover:bg-white dark:group-hover:bg-red-900/50';
    } else if (type === 'MAINTENANCE') {
      typeIcon = 'home_repair_service';
      colorClass = 'text-amber-600 dark:text-amber-400';
      bgClass = 'bg-amber-50 dark:bg-amber-900/30';
      groupHoverBg = 'group-hover:bg-white dark:group-hover:bg-amber-900/50';
    } else if (type === 'ALERT') {
      typeIcon = 'warning';
      colorClass = 'text-orange-600 dark:text-orange-400';
      bgClass = 'bg-orange-50 dark:bg-orange-900/30';
      groupHoverBg = 'group-hover:bg-white dark:group-hover:bg-orange-900/50';
    }

    return { typeIcon, colorClass, bgClass, groupHoverBg };
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
    return 'Tuần trước';
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    
    // Mark as read when opening the modal
    if (!notification.is_read) {
      markAsRead(notification.id)
        .then(() => {
          // Update the notification in the list
          setNotifications((prevNotifications) =>
            prevNotifications.map((notif) =>
              notif.id === notification.id
                ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                : notif
            )
          );
          // Update selected notification
          setSelectedNotification((prev: any) => 
            prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : prev
          );
          // Call the callback to update header unread count
          onNotificationRead?.();
        })
        .catch((err) => {
          console.error('Failed to mark notification as read:', err);
        });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
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
          {loading && loadTime >= 5 ? (
            <div className="flex items-center justify-center py-10">
              <Spin size="small" />
            </div>
          ) : !loading && notifications.length === 0 ? (
            <div className="py-4 text-center text-text-secondary text-sm">Không có thông báo nào</div>
          ) : (
            notifications.map((item) => {
              const typeInfo = getNotificationTypeInfo(item.type);
              return (
                <div 
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex gap-3 px-4 py-3 transition-colors border-b border-[#f0f2f4] dark:border-gray-800 cursor-pointer group ${
                    !item.is_read 
                      ? 'bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-[#f0f2f4] dark:hover:bg-gray-800' 
                      : 'hover:bg-[#f0f2f4] dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Icon - Reduced size to size-10 */}
                    <div className={`flex items-center justify-center rounded-lg shrink-0 size-10 transition-colors shadow-sm ${typeInfo.colorClass} ${typeInfo.bgClass} ${typeInfo.groupHoverBg}`}>
                      <span className="material-symbols-outlined text-[20px]">{typeInfo.typeIcon}</span>
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start w-full gap-2">
                        {/* Title - Reduced to text-sm */}
                        <p className={`text-text-main dark:text-white text-sm leading-snug line-clamp-1 ${!item.is_read ? 'font-bold' : 'font-medium'}`}>
                          {item.title}
                        </p>
                        {/* Time - Reduced to text-[10px] */}
                        <span className={`text-[10px] shrink-0 pt-0.5 whitespace-nowrap ${!item.is_read ? 'font-medium text-primary' : 'font-normal text-text-secondary dark:text-gray-500'}`}>
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      {/* Description - Reduced to text-xs */}
                      <p className="text-text-secondary dark:text-gray-400 text-xs font-normal leading-relaxed mt-0.5 line-clamp-2 break-words">
                        {item.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Unread Dot - Smaller size */}
                  {!item.is_read && (
                    <div className="shrink-0 pt-1.5">
                      <div className="size-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-[#1A2633]"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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

      {/* Notification Detail Modal */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={500}
        className="notification-modal"
        classNames={{
          content: 'dark:bg-[#1A2633]',
        }}
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          },
        }}
      >
        {selectedNotification && (
          <div className="flex flex-col gap-4">
            {/* Header with Icon and Close */}
            <div className="flex items-start justify-between pb-4 border-b border-border-color dark:border-gray-700 pr-8">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {(() => {
                  const typeInfo = getNotificationTypeInfo(selectedNotification.type);
                  return (
                    <>
                      <div className={`flex items-center justify-center rounded-lg shrink-0 size-14 transition-colors shadow-sm ${typeInfo.colorClass} ${typeInfo.bgClass}`}>
                        <span className="material-symbols-outlined text-[32px]">{typeInfo.typeIcon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight break-words">
                          {selectedNotification.title}
                        </h2>
                        <p className="text-text-secondary dark:text-gray-400 text-xs mt-1">
                          {formatTime(selectedNotification.created_at)}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#f9fafb] dark:bg-[#15202b] rounded-lg p-4">
                <p className="text-text-main dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.content}
                </p>
              </div>

              {/* Attachment if exists */}
              {selectedNotification.attachment_path && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    attachment
                  </span>
                  <a 
                    href={selectedNotification.attachment_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline flex-1 truncate"
                  >
                    Xem tệp đính kèm
                  </a>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 pt-4 border-t border-border-color dark:border-gray-700">
              <button
                onClick={handleModalClose}
                className="flex-1 h-10 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white font-medium hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleModalClose();
                  navigate('/notifications');
                }}
                className="flex-1 h-10 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                Xem đầy đủ
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default NotificationPopup;