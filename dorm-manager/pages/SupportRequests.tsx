import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import Pagination from '../components/Pagination';
import { Input, Spin } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import { AuthContext } from '../App';
import { UserRole } from '../types';
import { getAllSupportRequests } from '../api';

const SupportRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Determine if the user is a manager
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  // Fetch support requests
  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getAllSupportRequests(currentPage, itemsPerPage, {
          status: statusFilter || undefined,
        });
        
        const data = response.data || [];
        setRequests(data);
        setTotalItems(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 0);
      } catch (err: any) {
        console.error('Failed to load support requests:', err);
        setError(err.response?.data?.error || err.message || 'Lỗi khi tải yêu cầu hỗ trợ');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user, currentPage, itemsPerPage, statusFilter]);

  // Helper to map request to display-friendly object
  const mapRequestToRow = (req: any) => {
    let typeLabel = req.type || 'Khác';
    let icon = 'help';
    let iconColor = 'text-primary';
    let iconBg = 'bg-primary/10';

    // Map type to icon and color
    if (req.type === 'COMPLAINT') {
      typeLabel = 'Khiếu nại';
      icon = 'report_problem';
      iconColor = 'text-red-600 dark:text-red-400';
      iconBg = 'bg-red-100 dark:bg-red-900/30';
    } else if (req.type === 'REPAIR') {
      typeLabel = 'Sửa chữa';
      icon = 'construction';
      iconColor = 'text-orange-600 dark:text-orange-400';
      iconBg = 'bg-orange-100 dark:bg-orange-900/30';
    } else if (req.type === 'PROPOSAL') {
      typeLabel = 'Đề xuất';
      icon = 'lightbulb';
      iconColor = 'text-yellow-600 dark:text-yellow-400';
      iconBg = 'bg-yellow-100 dark:bg-yellow-900/30';
    }

    let statusLabel = 'Chưa xác định';
    let statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    let statusDot = 'bg-gray-500';

    if (req.status === 'PENDING' || req.status === 'pending') {
      statusLabel = 'Đang chờ';
      statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      statusDot = 'bg-yellow-500';
    } else if (req.status === 'PROCESSING' || req.status === 'processing') {
      statusLabel = 'Đang xử lý';
      statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      statusDot = 'bg-blue-500';
    } else if (req.status === 'COMPLETED' || req.status === 'completed') {
      statusLabel = 'Đã hoàn thành';
      statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
      statusDot = 'bg-green-500';
    }

    const createdDate = req.created_at ? new Date(req.created_at).toLocaleDateString('vi-VN') : '-';
    const createdTime = req.created_at ? new Date(req.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

    return {
      id: String(req.id),
      type: typeLabel,
      icon,
      iconColor,
      iconBg,
      title: req.title || 'Không có tiêu đề',
      description: req.content || 'Chi tiết yêu cầu...',
      date: createdDate,
      time: createdTime,
      status: req.status?.toLowerCase() || 'pending',
      statusLabel,
      statusClass,
      statusDot,
      original: req,
    };
  };

  const filteredRequests = requests
    .map(mapRequestToRow)
    .filter(req => {
      const matchSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         req.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });

  const currentItems = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (id: string) => {
    if (isManager) {
      navigate(`/manager/requests/${id}`);
    } else {
      navigate(`/student/requests/${id}`);
    }
  };

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm yêu cầu, dịch vụ..."
      headerTitle="Yêu cầu hỗ trợ"
    >
      <div className="mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Danh sách Yêu cầu</h2>
            <p className="text-text-secondary dark:text-gray-400 text-base">
              {isManager 
                ? 'Theo dõi và quản lý các yêu cầu hỗ trợ từ sinh viên.' 
                : 'Theo dõi và quản lý các vấn đề bạn đã báo cáo.'}
            </p>
          </div>
          {!isManager && (
            <button 
              onClick={() => navigate('/student/requests/create')}
              className="group flex items-center justify-center gap-2 h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Tạo yêu cầu mới</span>
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-[280px]">
            <Input
              placeholder="Tìm kiếm theo tiêu đề, mã yêu cầu..."
              prefix={<SearchOutlined />}
              className="w-full h-11 gap-3 pl-1 flex-1"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            <button 
              onClick={() => {
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className={`flex h-11 items-center justify-center px-4 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition-colors ${
                statusFilter === '' 
                  ? 'bg-primary text-white dark:bg-white dark:text-text-main' 
                  : 'bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
              }`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => {
                setStatusFilter('pending');
                setCurrentPage(1);
              }}
              className={`flex h-11 items-center justify-center px-4 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition-colors ${
                statusFilter === 'pending' 
                  ? 'bg-primary text-white dark:bg-white dark:text-text-main' 
                  : 'bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
              }`}
            >
              Đang chờ
            </button>
            <button 
              onClick={() => {
                setStatusFilter('processing');
                setCurrentPage(1);
              }}
              className={`flex h-11 items-center justify-center px-4 rounded-lg text-sm font-medium shadow-sm whitespace-nowrap transition-colors ${
                statusFilter === 'processing' 
                  ? 'bg-primary text-white dark:bg-white dark:text-text-main' 
                  : 'bg-white dark:bg-surface-dark border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
              }`}
            >
              Đang xử lý
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">STT</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Vấn đề</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Chi tiết</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Ngày gửi</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Spin tip="Đang tải yêu cầu hỗ trợ..." />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
                      Không tìm thấy yêu cầu nào.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, index) => (
                    <tr key={item.id} onClick={() => handleRowClick(item.id)} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 align-top text-sm text-text-secondary dark:text-gray-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${item.iconBg} ${item.iconColor}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-main dark:text-white">{item.type}</p>
                            <p className="text-xs text-text-secondary dark:text-gray-500">Mã: #{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-medium text-text-main dark:text-white mb-0.5">{item.title}</p>
                        <p className="text-sm text-text-secondary dark:text-gray-300 line-clamp-1 leading-relaxed">{item.description}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm text-text-main dark:text-gray-300 font-medium">{item.date}</p>
                        <p className="text-xs text-text-secondary">{item.time}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.statusClass}`}>
                          <span className={`size-1.5 rounded-full ${item.statusDot} ${item.status === 'processing' ? 'animate-pulse' : ''}`}></span>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <button className="text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))
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
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default SupportRequests;