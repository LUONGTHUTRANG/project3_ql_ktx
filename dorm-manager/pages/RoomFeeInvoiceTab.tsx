import React from 'react';
import { Input, Select } from 'antd';
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
  month?: number;
  year?: number;
  semester_id?: number;
}

interface InvoiceRow {
  id: string;
  invoiceCode: string;
  room: string;
  period: string;
  indices: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  dueDate: string;
  original: Invoice;
}

interface RoomFeeInvoiceTabProps {
  invoices: InvoiceRow[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  searchTerm: string;
  selectedStatus: 'all' | 'paid' | 'unpaid' | 'overdue';
  onPageChange: (page: number) => void;
  onSearchChange: (term: string) => void;
  onStatusChange: (status: 'all' | 'paid' | 'unpaid' | 'overdue') => void;
}

const RoomFeeInvoiceTab: React.FC<RoomFeeInvoiceTabProps> = ({
  invoices,
  loading,
  error,
  currentPage,
  itemsPerPage,
  totalPages,
  searchTerm,
  selectedStatus,
  onPageChange,
  onSearchChange,
  onStatusChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-border-color dark:border-gray-700">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 lg:col-span-6">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Tìm kiếm</label>
              <Input
                placeholder="Nhập mã hóa đơn hoặc số phòng..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onPageChange(1);
                }}
                className="h-11 gap-3 pl-1 flex-1"
              />
            </div>

            <div className="md:col-span-6 lg:col-span-3">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Trạng thái</label>
              <Select
                placeholder="Chọn trạng thái"
                value={selectedStatus || undefined}
                onChange={(value) => {
                  onStatusChange(value);
                  onPageChange(1);
                }}
                className="w-full h-11"
                options={[
                  { label: 'Tất cả trạng thái', value: 'all' },
                  { label: 'Đã thu', value: 'paid' },
                  { label: 'Chờ thu', value: 'unpaid' },
                  { label: 'Quá hạn', value: 'overdue' }
                ]}
              />
            </div>

            <div className="md:col-span-6 lg:col-span-3">
              <label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-2">Xuất dữ liệu</label>
              <button className="w-full h-11 flex items-center justify-center gap-2 px-4 text-text-main dark:text-gray-300 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-text-secondary">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-red-600">{error}</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-text-secondary">Không có hóa đơn nào</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-primary">
                      Mã HĐ
                      <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Phòng</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Kỳ/Tháng</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right sticky right-0 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((row) => (
                  <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-main dark:text-white">{row.invoiceCode}</div>
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
                      <span className="text-sm text-text-main dark:text-gray-300">{row.period}</span>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white dark:bg-surface-dark group-hover:bg-gray-50 dark:group-hover:bg-gray-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] transition-colors z-10">
                      <button 
                        className="text-text-secondary hover:text-primary transition-colors p-1 inline-flex" 
                        title="Xem chi tiết"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && invoices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default RoomFeeInvoiceTab;
