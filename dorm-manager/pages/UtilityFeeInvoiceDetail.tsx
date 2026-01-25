import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getAllInvoices } from '../api';
import { message, Input, Select, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Pagination from '../components/Pagination';

interface Invoice {
  id: number;
  invoice_code: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
  time_invoiced: string;
  room_id: number;
  room_number?: string;
  building_name?: string;
  description?: string;
  semester_time?: string;
}

interface InvoiceRow {
  id: string;
  invoiceCode: string;
  room: string;
  month: string;
  indices: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  dueDate: string;
  original: Invoice;
}

const UtilityFeeInvoiceDetail: React.FC = () => {
  const { month, year } = useParams<{ month: string; year: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const allInvoices = await getAllInvoices();
        
        const monthNum = parseInt(month || '0');
        const yearNum = parseInt(year || '0');

        const filtered = allInvoices.filter((inv: Invoice) => {
          if (inv.type !== 'UTILITY_FEE') return false;
          if (!inv.semester_time) return false;
          
          const date = new Date(inv.semester_time);
          const invMonth = date.getMonth() + 1;
          const invYear = date.getFullYear();
          
          return invMonth === monthNum && invYear === yearNum;
        });

        const rows: InvoiceRow[] = filtered.map((inv: Invoice) => {
          const statusLabel =
            inv.status === 'PAID'
              ? 'Đã thu'
              : new Date(inv.due_date) < new Date() && inv.status === 'UNPAID'
              ? 'Quá hạn'
              : 'Chờ thu';

          const date = new Date(inv.semester_time || '');
          const monthLabel = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;

          return {
            id: inv.id.toString(),
            invoiceCode: inv.invoice_code,
            room: inv.room_number || `Phòng ${inv.room_id}`,
            month: monthLabel,
            indices: inv.description || 'N/A',
            amount: inv.amount ? `${inv.amount.toLocaleString('vi-VN')} ₫` : '0 ₫',
            status: inv.status,
            statusLabel,
            statusClass: inv.status === 'PAID'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : statusLabel === 'Quá hạn'
              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            dueDate: new Date(inv.due_date).toLocaleDateString('vi-VN'),
            original: inv,
          };
        });

        setInvoices(rows);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        message.error('Không thể tải danh sách hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [month, year]);

  const filtered = invoices.filter(row => {
    const matchesSearch = row.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          row.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'paid' && row.status === 'PAID') ||
                          (selectedStatus === 'unpaid' && row.status === 'UNPAID' && row.statusLabel !== 'Quá hạn') ||
                          (selectedStatus === 'overdue' && row.statusLabel === 'Quá hạn');

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedInvoices = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm hóa đơn..."
      headerTitle={`Danh sách hóa đơn Tháng ${month}/${year}`}
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-text-main dark:text-white">
              Tháng {month}/{year}
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mt-1 text-base">
              Danh sách hóa đơn điện nước
            </p>
          </div>
          <button
            onClick={() => navigate('/manager/invoices')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-text-secondary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            <span>Quay lại</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-border-color dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">
                Tìm kiếm
              </label>
              <Input
                placeholder="Nhập mã hóa đơn hoặc số phòng..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 gap-3 pl-1"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">
                Trạng thái thanh toán
              </label>
              <Select
                placeholder="Chọn trạng thái"
                value={selectedStatus || undefined}
                onChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
                className="w-full h-11"
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Đã thu', value: 'paid' },
                  { label: 'Chờ thu', value: 'unpaid' },
                  { label: 'Quá hạn', value: 'overdue' }
                ]}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">
                Xuất dữ liệu
              </label>
              <button className="w-full h-11 flex items-center justify-center gap-2 px-4 text-text-main dark:text-gray-300 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Spin />
              </div>
            ) : paginatedInvoices.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-text-secondary">Không có hóa đơn nào</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                      Mã HĐ
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                      Phòng
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                      Tháng
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                      Mô tả
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-center">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                      Hạn thanh toán
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right sticky right-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedInvoices.map((row) => (
                    <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">
                          {row.invoiceCode}
                        </div>
                        <div className="text-xs text-text-secondary dark:text-gray-400">
                          {row.original.time_invoiced
                            ? `Tạo: ${new Date(row.original.time_invoiced).toLocaleDateString('vi-VN')}`
                            : 'Tạo: --/--/----'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-text-secondary text-[18px]">bed</span>
                          <span className="text-sm text-text-main dark:text-gray-200">{row.room}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-main dark:text-gray-300">{row.month}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-text-secondary dark:text-gray-400 truncate">{row.indices}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          row.status === 'PAID'
                            ? 'text-text-main dark:text-white'
                            : row.statusLabel === 'Quá hạn'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-text-main dark:text-white'
                        }`}>
                          {row.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.statusClass}`}>
                          <span className="size-1.5 rounded-full mr-1.5"
                            style={{
                              backgroundColor:
                                row.status === 'PAID' ? '#10b981' :
                                  row.statusLabel === 'Quá hạn' ? '#ef4444' :
                                    row.statusLabel === 'Chờ thu' ? '#eab308' :
                                      '#6b7280'
                            }}
                          ></span>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-secondary dark:text-gray-400">
                          {row.dueDate}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white dark:bg-surface-dark group-hover:bg-gray-50 dark:group-hover:bg-gray-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] transition-colors z-10">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="text-text-secondary hover:text-primary transition-colors p-1"
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button
                            className="text-text-secondary hover:text-primary transition-colors p-1"
                            title="Tải xuống"
                          >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && paginatedInvoices.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default UtilityFeeInvoiceDetail;
