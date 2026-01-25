import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Spin, message } from 'antd';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import Pagination from '../components/Pagination';
import { getNotificationsByManager, deleteNotification } from '../api';

type NotificationItem = {
  id: number;
  title: string;
  content?: string;
  target_scope?: string;
  created_at: string;
  sender_id?: number;
  sender_role?: string;
  type?: string;
  attachment_path?: string;
};

const NotificationManagement: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  if (!user) return null;

  // Map target_scope to Vietnamese labels
  const getTargetScopeLabel = (scope?: string): string => {
    const scopeMap: Record<string, string> = {
      'ALL': 'Tất cả sinh viên',
      'BUILDING': 'Tòa nhà',
      'ROOM': 'Phòng',
      'INDIVIDUAL': 'Sinh viên'
    };
    return scopeMap[scope || ''] || scope || 'N/A';
  };

  // Fetch notifications created by manager
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await getNotificationsByManager(currentPage, itemsPerPage);
        setNotifications(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách thông báo');
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, currentPage, itemsPerPage]);

  const handleView = (notification: NotificationItem) => {
    navigate(`/manager/notifications/${notification.id}`);
  };

  const handleEdit = (notification: NotificationItem) => {
    navigate(`/manager/notifications/${notification.id}/edit`);
  };

  const handleDeleteClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedNotification) {
      try {
        await deleteNotification(selectedNotification.id);
        message.success('Đã xóa thông báo thành công');
        setDeleteModalOpen(false);
        setSelectedNotification(null);
        // Refresh notifications
        const response = await getNotificationsByManager(currentPage, itemsPerPage);
        setNotifications(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error: any) {
        message.error('Lỗi khi xóa thông báo');
        console.error('Error deleting notification:', error);
      }
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <RoleBasedLayout
      searchPlaceholder="Tìm thông báo..."
      headerTitle="Quản lý Thông báo"
    >
      <div className="flex flex-col w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
              Quản lý Thông báo
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">
              Quản lý tất cả thông báo đã tạo, xem chi tiết, chỉnh sửa hoặc xóa
            </p>
          </div>
          <button
            onClick={() => navigate(`/${user.role}/notifications/create`)}
            className="flex items-center justify-center gap-2 px-6 h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Tạo thông báo
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-800 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-border-color dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">STT</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Tiêu đề</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Đối tượng nhận</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Ngày tạo</span>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Hành động</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <Spin tip="Đang tải dữ liệu..." />
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <span className="text-text-secondary dark:text-gray-400">Không có thông báo nào</span>
                    </td>
                  </tr>
                ) : (
                  notifications.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-border-color dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-2">
                        <span className="text-sm font-medium text-text-main dark:text-gray-300">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-sm font-medium text-text-main dark:text-gray-200 line-clamp-2">
                          {item.title}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-sm text-text-secondary dark:text-gray-400 line-clamp-1">
                          {getTargetScopeLabel(item.target_scope)}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <span className="text-sm text-text-secondary dark:text-gray-400">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(item)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Xem"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Xóa"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[24px]">delete</span>
              <span className="text-base font-bold text-text-main dark:text-white">Xóa thông báo</span>
            </div>
          }
          open={deleteModalOpen}
          onOk={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setSelectedNotification(null);
          }}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          width={420}
          centered
        >
          <div className="py-4">
            <p className="text-text-main dark:text-gray-200 mb-2">
              Bạn có chắc chắn muốn xóa thông báo này?
            </p>
            {selectedNotification && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border-color dark:border-gray-700">
                <p className="text-sm font-semibold text-text-main dark:text-gray-200">
                  {selectedNotification.title}
                </p>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                  Ngày tạo: {new Date(selectedNotification.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">
              Hành động này không thể hoàn tác!
            </p>
          </div>
        </Modal>
      </div>
    </RoleBasedLayout>
  );
};

export default NotificationManagement;
