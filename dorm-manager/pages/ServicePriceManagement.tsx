import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import Pagination from '../components/Pagination';
import AddServicePriceModal from '../components/AddServicePriceModal';
import { Input, Select, Spin, message, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import { getServicePrices, updateServicePrice, deleteServicePrice } from '../api';
import { SearchOutlined } from '@ant-design/icons';
import { formatPrice } from '../utils/formatters';

interface ServicePrice {
  id: number;
  service_name: string;
  unit: string;
  unit_price: number;
  apply_date: string;
  is_active: number;
}

interface EditingRow {
  id: number;
  unit_price: string;
  apply_date: string;
  is_active: number;
}

const ServicePriceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch service prices
  useEffect(() => {
    const fetchServicePrices = async () => {
      setIsLoading(true);
      try {
        const data = await getServicePrices();
        setServicePrices(Array.isArray(data) ? data : []);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách giá dịch vụ');
        console.error('Error fetching service prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServicePrices();
  }, []);

  // Filter service prices
  const filteredServicePrices = servicePrices.filter(price => {
    const matchesSearch = !searchText ||
      price.service_name.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'active' && price.is_active === 1) ||
      (selectedFilter === 'inactive' && price.is_active === 0);

    return matchesSearch && matchesFilter;
  });

  const totalItems = filteredServicePrices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredServicePrices.slice(startIndex, startIndex + itemsPerPage);

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
  const handleEdit = (price: ServicePrice) => {
    setEditingRow({
      id: price.id,
      unit_price: price.unit_price.toString(),
      apply_date: price.apply_date,
      is_active: price.is_active,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingRow) return;

    if (!editingRow.unit_price || !editingRow.apply_date) {
      message.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        unit_price: parseFloat(editingRow.unit_price),
        apply_date: editingRow.apply_date,
        is_active: editingRow.is_active,
      };

      await updateServicePrice(editingRow.id, updateData);
      message.success('Cập nhật giá dịch vụ thành công');

      // Update local state
      setServicePrices(servicePrices.map(price =>
        price.id === editingRow.id
          ? { 
              ...price, 
              unit_price: parseFloat(editingRow.unit_price), 
              apply_date: editingRow.apply_date,
              is_active: editingRow.is_active,
            }
          : price
      ));

      setEditingRow(null);
    } catch (error: any) {
      message.error('Lỗi khi cập nhật giá dịch vụ');
      console.error('Error updating service price:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = (price: ServicePrice) => {
    modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa dịch vụ “${price.service_name}” không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteServicePrice(price.id);
          message.success('Xóa giá dịch vụ thành công');
          setServicePrices(servicePrices.filter(p => p.id !== price.id));
        } catch (error: any) {
          message.error('Lỗi khi xóa giá dịch vụ');
          console.error('Error deleting service price:', error);
        }
      },
    });
  };

  // Handle add new service
  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleCreateSuccess = async () => {
    const data = await getServicePrices();
    setServicePrices(Array.isArray(data) ? data : []);
    setCurrentPage(1);
  };

  // Get service icon based on service name
  const getServiceIcon = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    if (name.includes('điện') || name.includes('electricity')) return 'bolt';
    if (name.includes('nước') || name.includes('water')) return 'water_drop';
    if (name.includes('internet') || name.includes('wifi')) return 'wifi';
    if (name.includes('vệ sinh') || name.includes('cleaning')) return 'cleaning_services';
    if (name.includes('gửi xe') || name.includes('parking')) return 'two_wheeler';
    return 'local_offer';
  };

  // Get service color based on service name
  const getServiceColor = (serviceName: string): { bg: string; icon: string; border: string } => {
    const name = serviceName.toLowerCase();
    if (name.includes('điện') || name.includes('electricity')) {
      return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' };
    }
    if (name.includes('nước') || name.includes('water')) {
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
    }
    if (name.includes('internet') || name.includes('wifi')) {
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' };
    }
    if (name.includes('vệ sinh') || name.includes('cleaning')) {
      return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' };
    }
    if (name.includes('gửi xe') || name.includes('parking')) {
      return { bg: 'bg-gray-100 dark:bg-gray-700', icon: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600' };
    }
    return { bg: 'bg-gray-100 dark:bg-gray-700', icon: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600' };
  };

  return (
    <RoleBasedLayout
      headerTitle="Quản lý Giá Dịch vụ"
      headerSubtitle="Quản lý đơn giá điện, nước, internet và các dịch vụ khác trong ký túc xá."
    >
      <div className="space-y-6">
        {/* Page Header with Add Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text-main dark:text-white mb-2">Quản lý Giá Dịch vụ</h2>
            <p className="text-text-secondary dark:text-gray-400">Quản lý đơn giá điện, nước, internet và các dịch vụ khác trong ký túc xá.</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Thêm dịch vụ mới
          </button>
        </div>

        {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="w-full sm:max-w-xs">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tìm kiếm</label>
              <Input
                  placeholder="Nhập tên hoặc MSSV..."
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
                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Trạng thái</label>
                <Select
                  className="w-full sm:w-48 h-11"
                  value={selectedFilter}
                  onChange={(value) => {
                    setSelectedFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'Tất cả dịch vụ', value: 'all' },
                    { label: 'Đang áp dụng', value: 'active' },
                    { label: 'Ngừng áp dụng', value: 'inactive' },
                  ]}
                />
              </div>
              <button
                onClick={handleReset}
                className="h-11 px-2 mt-6 text-text-secondary hover:text-primary hover:bg-background-light dark:hover:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark transition-colors"
                title="Reset"
              >
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              </button>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/5" scope="col">
                      Tên dịch vụ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/12" scope="col">
                      Đơn vị
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/6" scope="col">
                      Giá hiện tại
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/6" scope="col">
                      Ngày áp dụng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/6" scope="col">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/6" scope="col">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
                  {currentItems.map((price) => {
                    const colorConfig = getServiceColor(price.service_name);
                    const icon = getServiceIcon(price.service_name);
                    const isEditing = editingRow?.id === price.id;

                    return (
                      <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${colorConfig.bg} flex items-center justify-center ${colorConfig.icon}`}>
                              <span className="material-symbols-outlined">{icon}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-text-main dark:text-white">{price.service_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            {price.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Input
                              type="number"
                              size="small"
                              className="w-32 h-10"
                              value={editingRow.unit_price}
                              onChange={(e) => setEditingRow({ ...editingRow, unit_price: e.target.value })}
                              min="0"
                              step="0.01"
                              prefix={<span className="hidden" />}
                            />
                          ) : (
                            <span className="text-sm font-bold text-text-main dark:text-white">
                              {formatPrice(price.unit_price)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <DatePicker
                              format="DD/MM/YYYY"
                              value={editingRow.apply_date ? dayjs(editingRow.apply_date) : null}
                              onChange={(date) => setEditingRow({ ...editingRow, apply_date: date ? date.format('YYYY-MM-DD') : '' })}
                              style={{ width: '100%' }}
                              className="h-10"
                            />
                          ) : (
                            <span className="text-sm text-text-secondary">
                              {new Date(price.apply_date).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <Select
                              style={{ width: '100%' }}
                              value={editingRow.is_active}
                              onChange={(value) => setEditingRow({ ...editingRow, is_active: value })}
                              options={[
                                { label: 'Đang áp dụng', value: 1 },
                                { label: 'Ngừng áp dụng', value: 0 },
                              ]}
                              className='h-10'
                            />
                          ) : (
                            <>
                              {price.is_active === 1 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  <span className="size-1.5 rounded-full bg-green-500"></span>
                                  Đang áp dụng
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  <span className="size-1.5 rounded-full bg-gray-400"></span>
                                  Ngừng áp dụng
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                                title="Lưu"
                              >
                                <span className="material-symbols-outlined text-[20px]">check</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="text-gray-600 hover:text-gray-700 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                title="Hủy"
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2 transition-opacity">
                              <button
                                onClick={() => handleEdit(price)}
                                className="text-text-secondary hover:text-primary p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Sửa"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(price)}
                                className="text-text-secondary hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Xóa"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          )}
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

        {/* Add Service Modal Component */}
        <AddServicePriceModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </RoleBasedLayout>
  );
};

export default ServicePriceManagement;
