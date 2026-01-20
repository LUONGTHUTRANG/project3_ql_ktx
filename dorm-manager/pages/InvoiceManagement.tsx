import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getAllInvoices, getAllSemesters } from '../api';
import { message } from 'antd';
import RoomFeeInvoiceTab from './RoomFeeInvoiceTab';
import UtilityFeeInvoiceTab from './UtilityFeeInvoiceTab';

type StatusType = 'PAID' | 'UNPAID' | 'SUBMITTED' | 'CANCELLED' | 'PENDING';
type TabType = 'room_fee' | 'utility_fee';

interface Invoice {
  id: number;
  invoice_code: string;
  type: string;
  amount: number;
  status: StatusType;
  due_date: string;
  time_invoiced: string;
  room_id: number;
  usage_id?: number | null;
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
  status: StatusType;
  statusLabel: string;
  statusClass: string;
  dueDate: string;
  original: Invoice;
}

const InvoiceManagement: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL
  const getActiveTabFromUrl = (): TabType => {
    if (location.pathname.includes('/utility-fee')) {
      return 'utility_fee';
    }
    return 'room_fee';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromUrl());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location]);

  // Fetch invoices
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllInvoices();
        setInvoices(data || []);
      } catch (err: any) {
        console.error('Failed to load invoices:', err);
        setError(err.response?.data?.error || 'Lỗi khi tải hóa đơn');
        message.error('Không thể tải danh sách hóa đơn');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  // Map invoice to row display
  const mapInvoiceToRow = (inv: Invoice): InvoiceRow => {
    const now = new Date();
    const due = inv.due_date ? new Date(inv.due_date) : null;

    let status = inv.status || 'UNPAID';
    let statusLabel = 'Chưa xác định';
    let statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';

    // Check if this is a utility fee that hasn't been recorded (no usage_id)
    if (inv.type === 'UTILITY_FEE' && (inv.usage_id === null || inv.usage_id === undefined)) {
      statusLabel = 'Chưa ghi';
      statusClass = 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
    } else if (status === 'PAID') {
      statusLabel = 'Đã thu';
      statusClass = 'status-badge-paid border border-green-200 dark:border-green-800';
    } else if (status === 'UNPAID') {
      if (due && due < now) {
        statusLabel = 'Quá hạn';
        statusClass = 'status-badge-overdue border border-red-200 dark:border-red-800';
      } else {
        statusLabel = 'Chờ thu';
        statusClass = 'status-badge-pending border border-yellow-200 dark:border-yellow-800';
      }
    } else if (status === 'SUBMITTED') {
      statusLabel = 'Đã nộp';
      statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    } else if (status === 'CANCELLED') {
      statusLabel = 'Đã hủy';
      statusClass = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600';
    }

    const period = inv.month ? `${inv.month}/${inv.year || new Date().getFullYear()}` : '-';
    const amount = inv.amount ? `${Number(inv.amount).toLocaleString('vi-VN')}₫` : '0₫';
    
    // Mock indices data
    const indices = 'N/A';
    const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '-';

    return {
      id: String(inv.id),
      invoiceCode: inv.invoice_code || `INV-${inv.id}`,
      room: inv.room_number || `Phòng ${inv.room_id}`,
      period,
      indices,
      amount,
      status: status as StatusType,
      statusLabel,
      statusClass,
      dueDate,
      original: inv,
    };
  };

  // Calculate badge counts for each tab
  const roomFeeUnpaidCount = invoices.filter(inv => {
    const row = mapInvoiceToRow(inv);
    return inv.type === 'ROOM_FEE' && (row.status === 'UNPAID' || row.statusLabel === 'Quá hạn');
  }).length;

  const utilityFeeUnpaidCount = invoices.filter(inv => {
    const row = mapInvoiceToRow(inv);
    return inv.type === 'UTILITY_FEE' && (row.status === 'UNPAID' || row.statusLabel === 'Quá hạn');
  }).length;

  // Filter and paginate for ROOM_FEE
  const roomFeeFilteredInvoices = invoices
    .filter(inv => {
      const row = mapInvoiceToRow(inv);
      const matchesSearch = 
        row.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.room.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = inv.type === 'ROOM_FEE';
      
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'paid' && row.status === 'PAID') ||
        (selectedStatus === 'unpaid' && row.status === 'UNPAID') ||
        (selectedStatus === 'overdue' && row.statusLabel === 'Quá hạn');
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .map(mapInvoiceToRow);

  // Filter and paginate for UTILITY_FEE
  const utilityFeeFilteredInvoices = invoices
    .filter(inv => {
      const row = mapInvoiceToRow(inv);
      const matchesSearch = 
        row.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.room.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = inv.type === 'UTILITY_FEE';
      
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'paid' && row.status === 'PAID') ||
        (selectedStatus === 'unpaid' && row.status === 'UNPAID') ||
        (selectedStatus === 'overdue' && row.statusLabel === 'Quá hạn');
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .map(mapInvoiceToRow);

  // Filter and paginate for TRANSACTION_HISTORY (all)
  const transactionHistoryFilteredInvoices = invoices
    .filter(inv => {
      const row = mapInvoiceToRow(inv);
      const matchesSearch = 
        row.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.room.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'paid' && row.status === 'PAID') ||
        (selectedStatus === 'unpaid' && row.status === 'UNPAID') ||
        (selectedStatus === 'overdue' && row.statusLabel === 'Quá hạn');
      
      return matchesSearch && matchesStatus;
    })
    .map(mapInvoiceToRow);

  // Get current tab's filtered invoices
  const getFilteredInvoices = () => {
    switch (activeTab) {
      case 'room_fee':
        return roomFeeFilteredInvoices;
      case 'utility_fee':
        return utilityFeeFilteredInvoices;
      case 'transaction_history':
        return transactionHistoryFilteredInvoices;
      default:
        return [];
    }
  };

  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm hóa đơn..."
      headerTitle="Quản lý Hóa đơn"
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-text-main dark:text-white">
              Quản lý Hóa đơn
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mt-1 text-base">
              Theo dõi chỉ số, phát hành và thu tiền điện nước hàng tháng.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/record-utility-meters')}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-text-main dark:text-gray-200 font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
              <span>Ghi điện nước</span>
            </button>
            <button className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Tạo hóa đơn</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border-color dark:border-gray-700">
          <nav aria-label="Tabs" className="flex gap-8 -mb-px overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                navigate('/manager/invoices/room-fee');
                setCurrentPage(1);
              }}
              className={`group inline-flex items-center py-4 px-1 border-b-[3px] font-medium text-sm leading-5 transition-colors whitespace-nowrap ${
                activeTab === 'room_fee'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200 hover:border-border-color'
              }`}
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">meeting_room</span>
              Hóa đơn tiền phòng
              {roomFeeUnpaidCount > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs hidden sm:inline-block dark:bg-orange-900/20 dark:text-orange-400">{roomFeeUnpaidCount}</span>
              )}
            </button>
            <button
              onClick={() => {
                navigate('/manager/invoices/utility-fee');
                setCurrentPage(1);
              }}
              className={`group inline-flex items-center py-4 px-1 border-b-[3px] font-medium text-sm leading-5 transition-colors whitespace-nowrap ${
                activeTab === 'utility_fee'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200 hover:border-border-color'
              }`}
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">bolt</span>
              Hóa đơn điện nước
              {utilityFeeUnpaidCount > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs hidden sm:inline-block dark:bg-blue-900/20 dark:text-blue-400">{utilityFeeUnpaidCount}</span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'room_fee' && (
          <RoomFeeInvoiceTab />
        )}

        {activeTab === 'utility_fee' && (
          <UtilityFeeInvoiceTab />
        )}
      </div>
    </RoleBasedLayout>
  );
};

export default InvoiceManagement;
