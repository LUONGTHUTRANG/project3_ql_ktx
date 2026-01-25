import React, { useState, useEffect } from 'react';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import AddManagerModal from '@/components/AddManagerModal';
import Pagination from '../components/Pagination';
import { Input, Select, Spin, message, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllManagers, deleteManager, ManagerProfile } from '../api';
import { fetchBuildings } from '@/api';

const ManagerManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);

  // Building options - dynamic from API
  const buildingOptions = [
    { label: 'Tất cả Tòa nhà', value: 'all' },
    ...buildings.map((building: any) => ({
      label: building.building_name || building.name,
      value: building.id || building.building_id,
    })),
  ];

  // Fetch buildings on mount
  useEffect(() => {
    const loadBuildings = async () => {
      setIsBuildingsLoading(true);
      try {
        const data = await fetchBuildings();
        setBuildings(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('Error fetching buildings:', error);
        setBuildings([]);
      } finally {
        setIsBuildingsLoading(false);
      }
    };

    loadBuildings();
  }, []);

  // Fetch managers
  useEffect(() => {
    const fetchManagers = async () => {
      setIsLoading(true);
      try {
        const data = await getAllManagers();
        setManagers(Array.isArray(data) ? data : []);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách cán bộ');
        console.error('Error fetching managers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // Filter managers
  const filteredManagers = managers.filter(manager => {
    const matchesSearch = !searchText ||
      manager.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
      manager.phone_number.toLowerCase().includes(searchText.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
      (manager.building_id === selectedFilter);

    return matchesSearch && matchesFilter;
  });

  const totalItems = filteredManagers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredManagers.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Handle reset filter
  const handleReset = () => {
    setSearchText('');
    setSelectedFilter('all');
    setCurrentPage(1);
  };

  // Handle edit row
  const handleEdit = (manager: ManagerProfile) => {
    setEditingManager(manager);
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = (manager: ManagerProfile) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa cán bộ ${manager.full_name} không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteManager(manager.id);
          message.success('Xóa cán bộ thành công');
          setManagers(managers.filter(m => m.id !== manager.id));
        } catch (error: any) {
          message.error('Lỗi khi xóa cán bộ');
          console.error('Error deleting manager:', error);
        }
      },
    });
  };

  const handleOpenModal = () => {
    setEditingManager(null);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingManager(null);
  };

  const handleCreateSuccess = async () => {
    const data = await getAllManagers();
    setManagers(Array.isArray(data) ? data : []);
    setEditingManager(null);
    setCurrentPage(1);
  };

  return (
    <RoleBasedLayout
      headerTitle="Danh sách Cán bộ"
      headerSubtitle="Quản lý thông tin cán bộ quản lý tòa nhà."
    >
      <div className="space-y-6">
        {/* Page Header with Add Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text-main dark:text-white mb-2">Danh sách Cán bộ</h2>
            <p className="text-text-secondary dark:text-gray-400">Quản lý thông tin cán bộ quản lý tòa nhà.</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Thêm cán bộ mới
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="w-full sm:max-w-xs">
            <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tìm kiếm</label>
            <Input
              placeholder="Nhập tên hoặc số điện thoại..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 gap-3 pl-1 flex-1"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tòa nhà</label>
              <Select
                className="w-full sm:w-48 h-11"
                value={selectedFilter}
                onChange={(value) => {
                  setSelectedFilter(value);
                  setCurrentPage(1);
                }}
                options={buildingOptions}
              />
            </div>  
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
          {/* Data Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spin />
              </div>
            ) : currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50">info</span>
                <p>Không có dữ liệu</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">STT</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Số điện thoại</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Tòa nhà</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
                  {currentItems.map((manager, index) => {
                    const rowNumber = startIndex + index + 1;

                    return (
                      <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4 text-center text-sm text-text-secondary">{rowNumber}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text-main dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {manager.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{manager.full_name}</p>
                              {/* <p className="text-xs text-text-secondary dark:text-gray-400">{manager.username}</p> */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{manager.email}</td>
                        <td className="px-6 py-4 text-sm font-mono text-text-secondary dark:text-gray-400">{manager.phone_number}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{manager.building_name || '-'}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEdit(manager)}
                              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(manager)}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && currentItems.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>

        {/* Add/Edit Manager Modal Component */}
        <AddManagerModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSuccess={handleCreateSuccess}
          editingData={editingManager}
          buildings={buildings}
        />
      </div>
    </RoleBasedLayout>
  );
};

export default ManagerManagement;
