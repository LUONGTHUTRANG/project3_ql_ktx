import React, { useEffect, useState, useContext } from 'react';
import { Spin, message } from 'antd';
import Pagination from '../components/Pagination';
import { getAllOtherInvoices } from '../api/otherInvoiceApi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

interface OtherInvoice {
  id: number;
  invoice_id: number;
  target_type: string;
  target_student_id?: number;
  target_room_id?: number;
  title: string;
  description?: string;
  amount: number;
  status: string;
  attachment_path?: string;
  created_at?: string;
  room_number?: string;
  building_name?: string;
  mssv?: string;
  full_name?: string;
  floor?: number;
}

interface InvoiceRow {
  key: string;
  id: number;
  invoiceCode: string;
  title: string;
  targetType: string;
  target: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  createdDate: string;
  original: OtherInvoice;
}

const OtherInvoiceTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState<OtherInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load invoices on mount
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const data = await getAllOtherInvoices();
        setInvoices(data || []);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        message.error('Không thể tải danh sách hóa đơn khác');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  // Map invoice to row display
  const mapInvoiceToRow = (inv: OtherInvoice): InvoiceRow => {
    const status = inv.status || 'DRAFT';
    let statusLabel = 'Chưa xác định';
    let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

    if (status === 'PAID') {
      statusLabel = 'Đã thanh toán';
      statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    } else if (status === 'OVERDUE') {
      statusLabel = 'Đã quá hạn';
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else if (status === 'PUBLISHED') {
      statusLabel = 'Chưa thanh toán';
      statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (status === 'DRAFT') {
      statusLabel = 'Nháp';
      statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    } else if (status === 'CANCELLED') {
      statusLabel = 'Đã hủy';
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }

    const amount = inv.amount ? `${Number(inv.amount).toLocaleString('vi-VN')}₫` : '0₫';
    const createdDate = inv.created_at ? new Date(inv.created_at).toLocaleDateString('vi-VN') : '-';
    
    let targetDisplay = '-';
    if (inv.target_type === 'STUDENT') {
      targetDisplay = inv.full_name || `SV ${inv.target_student_id}`;
    } else if (inv.target_type === 'ROOM') {
      targetDisplay = inv.room_number || `Phòng ${inv.target_room_id}`;
    }

    return {
      key: String(inv.id),
      id: inv.id,
      invoiceCode: `OTH-${inv.id}`,
      title: inv.title || '-',
      targetType: inv.target_type === 'STUDENT' ? 'Sinh viên' : 'Phòng',
      target: targetDisplay,
      amount,
      status: status,
      statusLabel,
      statusColor,
      createdDate,
      original: inv,
    };
  };

  const allMappedInvoices = invoices.map(mapInvoiceToRow);
  const totalPages = Math.ceil(allMappedInvoices.length / itemsPerPage);
  const paginatedInvoices = allMappedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Invoices Table Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
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
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Mã hóa đơn</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Tiêu đề</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Đối tượng</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Thông tin</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Số tiền</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color dark:divide-gray-700">
                  {paginatedInvoices.map((invoice, index) => (
                    <tr 
                      key={invoice.key}
                      onClick={() => navigate(`/invoice/other/detail/${invoice.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">{invoice.invoiceCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">{invoice.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.targetType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.target}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{invoice.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${invoice.statusColor}`}>
                          {invoice.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoice/other/detail/${invoice.id}`);
                          }}
                          className="text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
                        {invoices.length === 0 ? 'Không có hóa đơn khác' : 'Không tìm thấy hóa đơn phù hợp'}
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
              totalItems={allMappedInvoices.length}
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
  );
};

export default OtherInvoiceTab;
