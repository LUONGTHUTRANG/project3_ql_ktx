import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Select, Spin, message } from 'antd';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import Pagination from '../components/Pagination';
import { Input } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import { fetchBuildings, fetchRooms } from '../api';

interface Building {
  id: number;
  name: string;
  location: string;
  gender_restriction?: string;
  room_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Room {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  max_capacity: number;
  price_per_semester: number;
  has_ac: number;
  has_heater: number;
  has_washer: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DisplayBuilding extends Building {
  color: string;
}

const BUILDING_COLORS = [
  'bg-blue-100 text-primary',
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-orange-100 text-orange-600',
  'bg-yellow-100 text-yellow-600',
  'bg-gray-100 text-gray-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
];

const BuildingList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // States for filtering - default to empty string for "All"
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Data states
  const [allBuildings, setAllBuildings] = useState<DisplayBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get unique locations from buildings
  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(allBuildings.map(b => b.location).filter(Boolean))];
    return uniqueLocations.sort();
  }, [allBuildings]);

  // Load buildings from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const buildingsData = await fetchBuildings();
        
        // Transform buildings data - thêm colors
        const transformedBuildings: DisplayBuilding[] = buildingsData.map((building: Building, index: number) => ({
          ...building,
          color: BUILDING_COLORS[index % BUILDING_COLORS.length]
        }));
        
        setAllBuildings(transformedBuildings);
      } catch (err: any) {
        const errorMessage = err.message || 'Không thể tải danh sách tòa nhà';
        setError(errorMessage);
        message.error(errorMessage);
        console.error('Error loading buildings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredBuildings = useMemo(() => {
    return allBuildings.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = filterArea === '' || b.location === filterArea;
      return matchesSearch && matchesArea;
    });
  }, [searchTerm, filterArea, allBuildings]);

  const totalItems = filteredBuildings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentItems = filteredBuildings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (type: 'search' | 'area' | 'status', value: string) => {
    if (type === 'search') setSearchTerm(value);
    if (type === 'area') setFilterArea(value);
    if (type === 'status') setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleBuildingClick = (id: string) => {
    navigate(`/student/buildings/${id}`);
  };

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === location.pathname}))}
      searchPlaceholder="Tìm kiếm tòa nhà..."
      headerTitle="Khám phá Tòa nhà"
    >
      <div className="mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Danh sách Tòa nhà</h2>
          <p className="text-text-secondary dark:text-gray-400 text-base">Xem thông tin chi tiết và tìm kiếm nơi ở phù hợp nhất cho bạn.</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Input
            placeholder="Tìm kiếm theo tên hoặc vị trí tòa nhà..."
            prefix={<SearchOutlined />}
            className="w-full h-11 gap-3 pl-1 flex-1"
            value={searchTerm}
            onChange={(e: any) => handleFilterChange('search', e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            {/* Area Filter using AntD Select */}
            <Select
              className="min-w-[180px] h-11"
              value={filterArea}
              onChange={(val) => handleFilterChange('area', val)}
              options={[
                { value: '', label: 'Tất cả khu vực' },
                ...locations.map(loc => ({ value: loc, label: loc }))
              ]}
              suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
            />
          </div>
        </div>

        {/* Table Container */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <span className="material-symbols-outlined text-4xl text-red-500">error</span>
              <div className="text-center">
                <p className="font-medium text-red-600 mb-2">Lỗi tải dữ liệu</p>
                <p className="text-sm text-text-secondary mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                      <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Tên Tòa nhà</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Vị trí</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Giới tính</th>
                      <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Số phòng</th>
                      <th className="p-4 text-right text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color dark:divide-gray-700">
                    {currentItems.map((b) => (
                      <tr key={b.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-lg ${b.color} flex items-center justify-center font-bold text-lg shrink-0`}>
                              {String(b.name).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-main dark:text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleBuildingClick(String(b.id))}>{b.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-text-main dark:text-gray-300">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">location_on</span>
                            {b.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-text-main dark:text-gray-300">
                            {b.gender_restriction === 'MIXED' ? 'Nam và Nữ' : 
                             b.gender_restriction === 'MALE' ? 'Nam' : 
                             b.gender_restriction === 'FEMALE' ? 'Nữ' : 
                             'Chưa xác định'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm font-medium text-text-main dark:text-gray-300">{b.room_count || 0}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button 
                              onClick={() => handleBuildingClick(String(b.id))}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors" 
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentItems.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-text-secondary dark:text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-4xl">search_off</span>
                            <p className="font-medium">Không tìm thấy tòa nhà nào phù hợp với bộ lọc.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
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
            </>
          )}
        </div>
    </DashboardLayout>
  );
};

export default BuildingList;