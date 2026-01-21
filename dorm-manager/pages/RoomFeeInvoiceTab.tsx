import React, { useEffect, useState, useContext } from 'react';
import { Select, Spin, message } from 'antd';
import Pagination from '../components/Pagination';
import { getRoomFeeInvoicesBySemester, getRoomFeeInvoicesBySemesterAndBuilding } from '../api/roomFeeInvoiceApi';
import { getAllSemesters, Semester } from '../api/semesterApi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

interface Invoice {
  id: number;
  invoice_code: string;
  invoice_id: number;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  room_id: number;
  room_number?: string;
  building_name?: string;
  semester_id?: number;
  student_id?: number;
  mssv?: string;
  full_name?: string;
  floor?: number;
  price_per_semester?: number;
}

interface InvoiceRow {
  key: string;
  id: number;
  invoiceCode: string;
  mssv: string;
  studentName: string;
  room: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  dueDate: string;
  original: Invoice;
}

const RoomFeeInvoiceTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load semesters on mount
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        const data = await getAllSemesters();
        setSemesters(data || []);
        
        // Set default to active semester
        const activeSemester = data.find((sem: Semester) => sem.is_active === 1);
        if (activeSemester) {
          setSelectedSemesterId(activeSemester.id);
        } else if (data.length > 0) {
          setSelectedSemesterId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load semesters:', err);
        message.error('Không thể tải danh sách kỳ');
      }
    };

    loadSemesters();
  }, []);

  // Load invoices when semester changes
  useEffect(() => {
    if (!selectedSemesterId) return;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        // Get building ID from manager's managed_building_id
        const buildingId = user?.managed_building_id || user?.building_id;
        let data;
        
        if (buildingId) {
          data = await getRoomFeeInvoicesBySemesterAndBuilding(selectedSemesterId, buildingId);
        } else {
          data = await getRoomFeeInvoicesBySemester(selectedSemesterId);
        }
        
        setInvoices(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        message.error('Không thể tải danh sách hóa đơn tiền phòng');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [selectedSemesterId, user]);

  // Map invoice to row display
  const mapInvoiceToRow = (inv: Invoice): InvoiceRow => {
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

    const amount = inv.price_per_semester ? `${Number(inv.price_per_semester).toLocaleString('vi-VN')}₫` : '0₫';
    const dueDate = inv.created_at ? new Date(inv.created_at).toLocaleDateString('vi-VN') : '-';

    return {
      key: String(inv.id),
      id: inv.id,
      invoiceCode: inv.invoice_code || `RF-${inv.id}`,
      mssv: inv.mssv || '-',
      studentName: inv.full_name || '-',
      room: inv.room_number || `Phòng ${inv.room_id}`,
      amount,
      status: status,
      statusLabel,
      statusColor,
      dueDate,
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
      {/* Semester Filter */}
      <div>
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Kỳ ở</label>
          <Select
            placeholder="Chọn kỳ ở..."
            value={selectedSemesterId}
            onChange={(value) => {
              setSelectedSemesterId(value);
              setCurrentPage(1);
            }}
            className="w-full h-11"
            optionLabelProp="label"
            options={semesters.map((sem) => ({
              value: sem.id,
              label: `Kỳ ${sem.term} - Năm học ${sem.academic_year}${sem.is_active === 1 ? ' (Hiện tại)' : ''}`,
            }))}
          />
      </div>

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
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">MSSV</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Tên sinh viên</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Phòng</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Số tiền</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color dark:divide-gray-700">
                  {paginatedInvoices.map((invoice, index) => (
                    <tr 
                      key={invoice.key}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">{invoice.invoiceCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.mssv}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">{invoice.studentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.room}</div>
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
                          onClick={() => navigate(`/invoice/room-fee/detail/${invoice.id}`)}
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
                        {invoices.length === 0 ? 'Không có hóa đơn tiền phòng cho kỳ này' : 'Không tìm thấy hóa đơn phù hợp'}
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

export default RoomFeeInvoiceTab;
