import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import Pagination from '../components/Pagination';
import { Input, Select, Spin, message } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';
import { UserRole } from '../types';
import { getAllStudents, getStudentsByBuildingId } from '../api/studentApi';
import { fetchBuildings } from '../api/buildingApi';

interface Student {
  id: number;
  mssv: string;
  full_name: string;
  room_number?: string;
  building_name?: string;
  student_status: string;
  stay_status: string;
  current_room_id?: number;
}

interface Building {
  id: number;
  name: string;
}

const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  // Check if user is admin
  const isAdmin = user?.role === UserRole.ADMIN;

  // Fetch buildings for filter
  useEffect(() => {
    const fetchBuildingsData = async () => {
      try {
        const data = await fetchBuildings();
        setBuildings(Array.isArray(data) ? data : data.data || []);
      } catch (error: any) {
        console.error('Error fetching buildings:', error);
      }
    };
    fetchBuildingsData();
  }, []);

  // Fetch students
  useEffect(() => {
    const fetchStudentsData = async () => {
      setIsLoading(true);
      try {
        const response = await getAllStudents(currentPage, itemsPerPage);
        setStudents(response.data || []);
        setTotalStudents(response.meta?.total || 0);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách sinh viên');
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentsData();
  }, [currentPage, itemsPerPage]);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchText || 
      student.mssv.toLowerCase().includes(searchText.toLowerCase()) ||
      student.full_name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesBuilding = !selectedBuilding || student.building_name === selectedBuilding;
    
    return matchesSearch && matchesBuilding;
  });

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items (apply local pagination if needed)
  const currentItems = filteredStudents.slice(
    0,
    itemsPerPage
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
                    ...buildings.map(b => ({ label: b.name, value: b.name }))
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
                  disabled
                  className="w-full h-11"
                  options={[
                    { label: 'Tất cả phòng', value: '' }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          ) : (
            <>
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
                    {currentItems.map((student, index) => {
                      const stayStatusMap: Record<string, { label: string; color: string }> = {
                        'STAYING': { label: 'Đang ở', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
                        'NOT_STAYING': { label: 'Chưa ở', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
                        'APPLIED': { label: 'Đã đăng ký', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
                      };
                      const statusInfo = stayStatusMap[student.stay_status] || { label: student.stay_status, color: 'bg-gray-100 text-gray-800' };
                      
                      return (
                        <tr 
                          key={student.id}
                          onClick={() => handleRowClick(student.id)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-400">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-main dark:text-white">{student.mssv}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-main dark:text-white">{student.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-secondary dark:text-gray-300">{student.building_name || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-secondary dark:text-gray-300">{student.room_number || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <button className="text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                              <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
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
                totalPages={Math.ceil(totalStudents / itemsPerPage)}
                totalItems={totalStudents}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(val) => {
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                itemsPerPageOptions={[5, 10, 20, 50]}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentManagement;
