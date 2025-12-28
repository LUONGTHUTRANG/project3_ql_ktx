import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';
import { Input, Select } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';
import { UserRole } from '../types';

interface Student {
  id: number;
  mssv: string;
  name: string;
  building: string;
  room: string;
  status: 'active' | 'pending' | 'inactive' | 'disciplined';
  statusLabel: string;
  statusColor: string;
}

const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === UserRole.ADMIN;

  // Mock data for 97 students
  const allStudents: Student[] = Array.from({ length: 97 }, (_, i) => {
    const buildings = ['Tòa A1', 'Tòa A2', 'Tòa B1', 'Tòa B2', 'Tòa C3'];
    const rooms = ['P.101', 'P.102', 'P.201', 'P.305', 'P.402', 'P.505'];
    const statuses = [
      { status: 'active' as const, label: 'Đang ở', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      { status: 'pending' as const, label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      { status: 'inactive' as const, label: 'Đã trả phòng', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      { status: 'disciplined' as const, label: 'Kỷ luật', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    ];

    const statusObj = statuses[i % statuses.length];
    return {
      id: i + 1,
      mssv: `${20 + Math.floor(i / 10)}${String(Math.floor(Math.random() * 9) + 1).padStart(6, '0')}`,
      name: ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Thanh Tâm', 'Võ Quốc Hưng'][i % 5],
      building: buildings[i % buildings.length],
      room: rooms[i % rooms.length],
      status: statusObj.status,
      statusLabel: statusObj.label,
      statusColor: statusObj.color
    };
  });

  // Filter students
  const filteredStudents = allStudents.filter(student => {
    const matchesSearch = !searchText || 
      student.mssv.toLowerCase().includes(searchText.toLowerCase()) ||
      student.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesBuilding = !selectedBuilding || student.building === selectedBuilding;
    const matchesRoom = !selectedRoom || student.room === selectedRoom;
    
    return matchesSearch && matchesBuilding && matchesRoom;
  });

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const currentItems = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleReset = () => {
    setSearchText('');
    setSelectedBuilding('');
    setSelectedRoom('');
    setCurrentPage(1);
  };

  const handleRowClick = (studentId: string) => {
    navigate(`/manager/students/${studentId}`);
  };

  return (
    <DashboardLayout
      navItems={MANAGER_NAV_ITEMS.map(item => ({...item, isActive: item.label === 'Quản lý Sinh viên'}))}
      searchPlaceholder="Tìm kiếm sinh viên..."
      headerTitle="Quản lý Sinh viên"
    >
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Danh sách Sinh viên</h1>
            <p className="text-text-secondary dark:text-gray-400 text-sm mt-2">Quản lý hồ sơ, phòng ở và trạng thái của sinh viên.</p>
          </div>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <button className="flex cursor-pointer items-center justify-center gap-2 h-10 px-4 bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span className="truncate">Xuất Excel</span>
            </button>
            {isAdmin && (
              <button className="flex cursor-pointer items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95">
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="truncate">Thêm sinh viên</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12 lg:col-span-6">
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

              <div className="md:col-span-6 lg:col-span-3">
                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tòa nhà</label>
                <Select
                  placeholder="Tất cả tòa nhà"
                  value={selectedBuilding || undefined}
                  onChange={(value) => {
                    setSelectedBuilding(value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11"
                  options={[
                    { label: 'Tất cả tòa nhà', value: '' },
                    { label: 'Tòa A1', value: 'Tòa A1' },
                    { label: 'Tòa A2', value: 'Tòa A2' },
                    { label: 'Tòa B1', value: 'Tòa B1' },
                    { label: 'Tòa B2', value: 'Tòa B2' },
                    { label: 'Tòa C3', value: 'Tòa C3' }
                  ]}
                />
              </div>

              <div className="md:col-span-6 lg:col-span-3">
                <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Phòng</label>
                <Select
                  placeholder="Tất cả phòng"
                  value={selectedRoom || undefined}
                  onChange={(value) => {
                    setSelectedRoom(value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-11"
                  options={[
                    { label: 'Tất cả phòng', value: '' },
                    { label: 'P.101', value: 'P.101' },
                    { label: 'P.102', value: 'P.102' },
                    { label: 'P.201', value: 'P.201' },
                    { label: 'P.305', value: 'P.305' },
                    { label: 'P.402', value: 'P.402' },
                    { label: 'P.505', value: 'P.505' }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">STT</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">MSSV</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Họ và tên</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Tòa nhà</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Phòng</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {currentItems.map((student, index) => (
                  <tr 
                    key={student.id}
                    onClick={() => handleRowClick(student.mssv)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-400">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-main dark:text-white">{student.mssv}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-main dark:text-white">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary dark:text-gray-300">{student.building}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary dark:text-gray-300">{student.room}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${student.statusColor}`}>
                        {student.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <button className="text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
                      Không tìm thấy sinh viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            itemsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentManagement;
