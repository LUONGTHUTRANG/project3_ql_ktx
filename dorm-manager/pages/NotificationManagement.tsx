import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';

type NotificationItem = {
  id: string;
  title: string;
  recipient: string;
  createdDate: string;
};

const NotificationManagement: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  if (!user) return null;

  // Mock data for notifications created by manager
  const allNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Thông báo đóng tiền điện tháng 10',
      recipient: 'Toàn thể sinh viên Khu A',
      createdDate: '20/10/2023',
    },
    {
      id: '2',
      title: 'Lịch bảo trì thang máy',
      recipient: 'Tòa B',
      createdDate: '18/10/2023',
    },
    {
      id: '3',
      title: 'Thông báo tăng giá nước sinh hoạt',
      recipient: 'Toàn thể sinh viên',
      createdDate: '15/10/2023',
    },
    {
      id: '4',
      title: 'Chương trình vệ sinh môi trường chung',
      recipient: 'Toàn thể sinh viên Khu A, Khu B',
      createdDate: '12/10/2023',
    },
    {
      id: '5',
      title: 'Đăng ký phòng ở cho năm học mới',
      recipient: 'Sinh viên năm 2',
      createdDate: '10/10/2023',
    },
    {
      id: '6',
      title: 'Thông báo bảo trì đường ống nước',
      recipient: 'Tòa A1, A2',
      createdDate: '08/10/2023',
    },
    {
      id: '7',
      title: 'Quy định mới về giờ yên tĩnh',
      recipient: 'Toàn thể sinh viên',
      createdDate: '05/10/2023',
    },
    {
      id: '8',
      title: 'Lịch tổng vệ sinh ký túc xá',
      recipient: 'Toàn thể sinh viên',
      createdDate: '01/10/2023',
    },
    {
      id: '9',
      title: 'Thông báo cắt điện bảo trì',
      recipient: 'Tòa C',
      createdDate: '28/09/2023',
    },
    {
      id: '10',
      title: 'Kế hoạch sửa chữa các phòng',
      recipient: 'Sinh viên Tòa A',
      createdDate: '25/09/2023',
    },
  ];

  const totalItems = allNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentItems = allNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleView = (notification: NotificationItem) => {
    navigate(`/notifications/${notification.id}`);
  };

  const handleEdit = (notification: NotificationItem) => {
    alert(`Chỉnh sửa thông báo: ${notification.title}`);
    // navigate(`/notifications/${notification.id}/edit`);
  };

  const handleDeleteClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNotification) {
      alert(`Đã xóa thông báo: ${selectedNotification.title}`);
      setDeleteModalOpen(false);
      setSelectedNotification(null);
    }
  };

  return (
    <DashboardLayout
      navItems={MANAGER_NAV_ITEMS.map(item => ({
        ...item,
        isActive: item.label === 'Quản lý Thông báo'
      }))}
      searchPlaceholder="Tìm thông báo..."
      headerTitle="Quản lý Thông báo"
      sidebarTitle="A1 Manager"
    >
      <div className="flex flex-col w-full mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
              Quản lý Thông báo
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">
              Quản lý tất cả thông báo đã tạo, xem chi tiết, chỉnh sửa hoặc xóa
            </p>
          </div>
          <button
            onClick={() => navigate('/notifications/create')}
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
                {currentItems.map((item, index) => (
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
                        {item.recipient}
                      </span>
                    </td>
                    <td className="px-6 py-2">
                      <span className="text-sm text-text-secondary dark:text-gray-400">
                        {item.createdDate}
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
                ))}
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
                  Ngày tạo: {selectedNotification.createdDate}
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">
              ⚠️ Hành động này không thể hoàn tác!
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default NotificationManagement;
