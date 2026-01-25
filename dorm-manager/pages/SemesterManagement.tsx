import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import AddSemesterModal from '@/components/AddSemesterModal';
import Pagination from '../components/Pagination';
import { Input, Select, Spin, message, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllSemesters, deleteSemester, Semester } from '../api';

const SemesterManagement: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSemester, setEditingSemester] = useState<any>(null);
  const [deletingPending, setDeletingPending] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    visible: boolean;
    semester: Semester | null;
  }>({
    visible: false,
    semester: null,
  });

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      setIsLoading(true);
      try {
        const data = await getAllSemesters();
        setSemesters(Array.isArray(data) ? data : []);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách kỳ ở');
        console.error('Error fetching semesters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // Filter semesters
  const filteredSemesters = semesters.filter(semester => {
    const matchesSearch = !searchText ||
      semester.academic_year.toLowerCase().includes(searchText.toLowerCase()) ||
      semester.term.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'active' && semester.is_active === 1) ||
      (selectedFilter === 'inactive' && semester.is_active === 0);

    return matchesSearch && matchesFilter;
  });

  const totalItems = filteredSemesters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSemesters.slice(startIndex, startIndex + itemsPerPage);

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
  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = (semester: Semester) => {
    // console.log('Delete button clicked for semester:', semester);
    setDeleteConfirmModal({
      visible: true,
      semester: semester,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal.semester) return;
    
    setDeletingPending(true);
    try {
      await deleteSemester(deleteConfirmModal.semester.id);
      message.success(`Kỳ ${deleteConfirmModal.semester.term} năm ${deleteConfirmModal.semester.academic_year} đã được xóa thành công`);
      setSemesters(semesters.filter(s => s.id !== deleteConfirmModal.semester!.id));
      setDeleteConfirmModal({ visible: false, semester: null });
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa kỳ ở');
      console.error('Error deleting semester:', error);
    } finally {
      setDeletingPending(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ visible: false, semester: null });
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingSemester(null);
  };

  const handleCreateSuccess = async () => {
    const data = await getAllSemesters();
    setSemesters(Array.isArray(data) ? data : []);
    setEditingSemester(null);
    setCurrentPage(1);
  };

  return (
    <RoleBasedLayout
      headerTitle="Danh sách Kỳ ở"
      headerSubtitle="Quản lý thông tin và thời gian lưu trú của các kỳ học."
    >
      <div className="space-y-6">
        {/* Page Header with Add Button */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-text-main dark:text-white mb-2">Danh sách Kỳ ở</h2>
            <p className="text-text-secondary dark:text-gray-400">Quản lý thông tin và thời gian lưu trú của các kỳ học.</p>
          </div>
          <button 
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Thêm kỳ ở mới
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
                    type="button"
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
                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-[60px]">STT</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-[80px]">Kỳ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-[150px]">Năm học</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-[160px]">Ngày bắt đầu</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-[160px]">Ngày kết thúc</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-[180px]">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-[140px]">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
                  {currentItems.map((semester, index) => {
                    const rowNumber = startIndex + index + 1;

                    return (
                      <tr key={semester.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4 text-center text-sm text-text-secondary">{rowNumber}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-primary dark:text-blue-400">{semester.term}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text-main dark:text-white">{semester.academic_year}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {semester.start_date ? new Date(semester.start_date).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {semester.end_date ? new Date(semester.end_date).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {semester.is_active === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                              <span className="size-1.5 rounded-full bg-green-500"></span>
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                              Không hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            {semester.is_active === 1 && (<button
                              type="button"
                              onClick={() => handleEdit(semester)}
                              // disabled={semester.is_active === 0}
                              className={`p-2 rounded-lg transition-colors ${
                                semester.is_active === 0
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }`}
                              title={semester.is_active === 0 ? "Không thể chỉnh sửa kỳ đã ngừng hoạt động" : "Chỉnh sửa"}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>)}
                            <button
                              type="button"
                              onClick={() => handleDelete(semester)}
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

        {/* Add/Edit Semester Modal Component */}
        <AddSemesterModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSuccess={handleCreateSuccess}
          editingData={editingSemester}
        />

        {/* Delete Confirm Modal */}
        <Modal
          title="Xác nhận xóa"
          open={deleteConfirmModal.visible}
          onOk={handleConfirmDelete}
          onCancel={handleCancelDelete}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true, loading: deletingPending }}
          cancelButtonProps={{ disabled: deletingPending }}
          confirmLoading={deletingPending}
        >
          {deleteConfirmModal.semester && (
            <p>
              Bạn có chắc chắn muốn xóa kỳ {deleteConfirmModal.semester.term} năm{' '}
              {deleteConfirmModal.semester.academic_year} không?
            </p>
          )}
        </Modal>
      </div>
    </RoleBasedLayout>
  );
};

export default SemesterManagement;
