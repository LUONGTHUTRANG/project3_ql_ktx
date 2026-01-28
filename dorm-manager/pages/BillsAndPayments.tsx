import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { Select, Spin, message } from 'antd';
import Pagination from '../components/Pagination';
import { getInvoicesForStudent, getAllInvoices, getAllSemesters } from '../api';
import { generateQRCodeForAll } from '../api_handlers/paymentApi';

type TabType = 'unpaid' | 'paid' | 'overdue';

const BillsAndPayments: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('unpaid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [semester, setSemester] = useState<string>('');
  const [semesterOptions, setSemesterOptions] = useState<any[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [bills, setBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billsError, setBillsError] = useState<string | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentQRCode, setPaymentQRCode] = useState<any>(null);
  const [isGeneratingPaymentQR, setIsGeneratingPaymentQR] = useState(false);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  if (!user) return null;

  // Fetch semesters
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        setLoadingSemesters(true);
        const data = await getAllSemesters();
        const options = data.map((sem: any) => ({
          value: String(sem.id),
          label: `Kỳ ${sem.term} - ${sem.academic_year}`,
          is_active: sem.is_active,
        }));
        setSemesterOptions(options);
        // Set default to active semester, or first one if none active
        const activeSemester = options.find((opt: any) => opt.is_active);
        if (activeSemester) {
          setSemester(activeSemester.value);
        } else if (options.length > 0) {
          setSemester(options[0].value);
        }
      } catch (err) {
        console.error('Failed to load semesters:', err);
      } finally {
        setLoadingSemesters(false);
      }
    };

    loadSemesters();
  }, []);

  // Fetch invoices for student (or all if manager) with semester filter
  useEffect(() => {
    const loadBills = async () => {
      if (!user || !semester) return;
      try {
        setLoadingBills(true);
        setBillsError(null);
        let data = [];
        console.log('User role in BillsAndPayments:', user);
        if (user.role === 'student') {
          data = await getInvoicesForStudent(user.id, semester);
        } else {
          data = await getAllInvoices();
        }
        console.log('Fetched invoices:', data);
        setBills(data);
      } catch (err: any) {
        console.error('Failed to load invoices:', err);
        setBillsError(err.response?.data?.error || err.message || 'Lỗi khi tải hóa đơn');
      } finally {
        setLoadingBills(false);
      }
    };

    loadBills();
  }, [user, semester]);

  // Helper to map invoice to display-friendly object
  const mapInvoiceToRow = (inv: any) => {
    // Determine status based on invoice status field
    let status = 'unpaid';
    let statusLabel = 'Chưa thanh toán';
    let statusClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';

    const invoiceStatus = inv.status?.toUpperCase();

    if (invoiceStatus === 'PAID') {
      status = 'paid';
      statusLabel = 'Đã thanh toán';
      statusClass = 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    } else if (invoiceStatus === 'OVERDUE') {
      status = 'overdue';
      statusLabel = 'Quá hạn';
      statusClass = 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    } else if (invoiceStatus === 'PUBLISHED') {
      status = 'unpaid';
      statusLabel = 'Chưa thanh toán';
      statusClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    }

    // Get amount - use total_amount from API response
    const amount = inv.total_amount 
      ? `${Number(inv.total_amount).toLocaleString('vi-VN')}₫` 
      : inv.amount 
      ? `${Number(inv.amount).toLocaleString('vi-VN')}₫` 
      : '0₫';

    // Extract month from created_at timestamp
    let monthLabel = '-';
    if (inv.created_at) {
      const d = new Date(inv.created_at);
      monthLabel = `${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    // Map invoice_category to typeLabel
    let typeLabel = 'Hóa đơn';
    const category = inv.invoice_category?.toUpperCase();
    if (category === 'ROOM_FEE') typeLabel = 'Phí phòng ở';
    if (category === 'UTILITY') typeLabel = 'Phí điện nước';
    if (category === 'OTHER') typeLabel = 'Khác';

    // Generate invoice name based on category
    let invoiceName = 'Hóa đơn';
    if (category === 'ROOM_FEE') invoiceName = 'Hóa đơn tiền phòng';
    if (category === 'UTILITY') invoiceName = 'Hóa đơn điện nước';
    if (category === 'OTHER') invoiceName = inv.title || 'Hóa đơn khác';

    // icon selection based on invoice_category
    let icon = 'receipt_long';
    let iconColor = 'text-primary';
    let iconBg = 'bg-primary/10';
    if (category === 'UTILITY') { 
      icon = 'electric_bolt'; 
      iconColor = 'text-yellow-600'; 
      iconBg = 'bg-yellow-50 dark:bg-yellow-900/20'; 
    }
    if (category === 'ROOM_FEE') { 
      icon = 'bedroom_parent'; 
      iconColor = 'text-purple-600'; 
      iconBg = 'bg-purple-50 dark:bg-purple-900/20'; 
    }

    return {
      id: String(inv.id || inv.invoice_code || ''),
      type: typeLabel,
      invoiceName,
      icon,
      iconColor,
      iconBg,
      semesterLabel: '-',
      monthLabel,
      amount,
      deadline_at: inv.deadline_at ? new Date(inv.deadline_at).toLocaleDateString('vi-VN') : '-',
      status,
      statusLabel,
      statusClass,
      original: inv,
    };
  };

  const filteredBills = bills
    .map(mapInvoiceToRow)
    .filter(bill => {
      if (activeTab === 'unpaid') return bill.status === 'unpaid';
      if (activeTab === 'paid') return bill.status === 'paid';
      if (activeTab === 'overdue') return bill.status === 'overdue';
      return true;
    });

  // Paginate the filtered bills
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (id: string) => {
    navigate(`/student/bills/${id}`);
  };

  const getTotalDebt = () => {
    return bills
      .filter(bill => bill.status?.toUpperCase() === 'PUBLISHED' || bill.status?.toUpperCase() === 'OVERDUE')
      .reduce((sum, bill) => sum + Number(bill.total_amount || bill.amount || 0), 0);
  };

  const handleGeneratePaymentQR = async () => {
    const totalDebt = getTotalDebt();
    if (totalDebt === 0) {
      message.info('Không có khoản nợ để thanh toán');
      return;
    }

    setIsGeneratingPaymentQR(true);
    try {
      const qrData = await generateQRCodeForAll('all', user.id);
      setPaymentQRCode(qrData);
      setShowPaymentQR(true);
      message.success('Mã QR được tạo thành công!');
    } catch (err: any) {
      message.error('Lỗi khi tạo mã QR');
      console.error('Error:', err);
    } finally {
      setIsGeneratingPaymentQR(false);
    }
  };

  const handlePaymentFromQR = () => {
    if (!paymentQRCode) return;
    // Pass unpaid invoices data via state
    const unpaidInvoices = bills
      .filter(bill => bill.status?.toUpperCase() === 'PUBLISHED' || bill.status?.toUpperCase() === 'OVERDUE')
      .map(bill => ({
        invoice_code: bill.invoice_code,
        total_amount: parseFloat(bill.total_amount || bill.amount || 0),
      }));
    
    navigate(`/student/payment-confirmation?ref=${paymentQRCode.paymentRef}&invoiceId=all`, {
      state: { invoices: unpaidInvoices }
    });
  };

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm hóa đơn..."
      headerTitle="Hóa đơn & Thanh toán"
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Hóa đơn & Thanh toán</h1>
            <p className="text-text-secondary text-base font-normal dark:text-gray-400">Quản lý các khoản phí sinh hoạt và ký túc xá của bạn</p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              className="min-w-[200px] h-11"
              value={semester}
              onChange={setSemester}
              loading={loadingSemesters}
              suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">calendar_month</span>}
              options={semesterOptions.length > 0 ? semesterOptions : [{ value: '', label: 'Đang tải...' }]}
            />
          </div>
        </div>

        {/* Debt Summary Card */}
        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-border-color dark:bg-surface-dark dark:border-gray-700">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-text-secondary dark:text-gray-400">Tổng dư nợ hiện tại</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-main dark:text-white">
                  {(() => {
                    const totalDebt = bills
                      .filter(bill => bill.status?.toUpperCase() === 'PUBLISHED' || bill.status?.toUpperCase() === 'OVERDUE')
                      .reduce((sum, bill) => sum + Number(bill.total_amount || bill.amount), 0);
                    return totalDebt.toLocaleString('vi-VN') + '₫';
                  })()}
                </span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">Cần thanh toán</span>
              </div>
            </div>
            <button 
              onClick={handleGeneratePaymentQR}
              disabled={isGeneratingPaymentQR || getTotalDebt() === 0}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPaymentQR ? (
                <>
                  <Spin size="small" style={{ color: 'white' }} />
                  Đang tạo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  Thanh toán tất cả
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-border-color dark:border-gray-800">
          <nav className="-mb-px flex gap-8">
            <button 
              onClick={() => setActiveTab('unpaid')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'unpaid' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Chưa thanh toán</span>
              <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${activeTab === 'unpaid' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>
                {bills.filter(b => {
                  const status = b.status?.toUpperCase();
                  return status === 'PUBLISHED' || status === 'OVERDUE';
                }).length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('paid')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'paid' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Đã thanh toán</span>
              <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${activeTab === 'paid' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>
                {bills.filter(b => b.status?.toUpperCase() === 'PAID').length}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('overdue')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'overdue' ? 'border-primary text-red-600' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Quá hạn</span>
              <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${activeTab === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>
                {bills.filter(b => b.status?.toUpperCase() === 'OVERDUE').length}
              </span>
            </button>
          </nav>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-xl border border-border-color bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm" style={{ minWidth: '960px' }}>
              <thead className="bg-gray-50 text-text-secondary dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '16.67%' }}>Mã hóa đơn</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '8.33%' }}>Loại hóa đơn</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '16.67%' }}>Tên hóa đơn</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '8.33%' }}>Tháng</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '16.67%' }}>Tổng tiền</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '12.5%' }}>Hạn thanh toán</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs" scope="col" style={{ width: '12.5%' }}>Trạng thái</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs text-center" scope="col" style={{ width: '8.33%' }}>Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-surface-dark">
                {loadingBills ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Spin tip="Đang tải hóa đơn..." />
                    </td>
                  </tr>
                ) : billsError ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-red-600">
                      {billsError}
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-text-secondary dark:text-gray-500">
                      Không có hóa đơn nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  paginatedBills.map((bill) => (
                    <tr key={bill.id} onClick={() => handleRowClick(bill.id)} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-4 font-medium text-text-secondary dark:text-gray-400 text-sm" style={{ width: '16.67%' }}>{bill.original.invoice_code || bill.id}</td>
                      <td className="px-4 py-4" style={{ width: '8.33%' }}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-main dark:text-white text-sm">{bill.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-main dark:text-white text-sm font-medium truncate" style={{ width: '16.67%' }}>{bill.invoiceName}</td>
                      <td className="px-4 py-4 text-text-main dark:text-white text-sm whitespace-nowrap" style={{ width: '8.33%' }}>{bill.monthLabel}</td>
                      <td className={`px-4 py-4 font-bold text-sm whitespace-nowrap ${bill.status === 'overdue' ? 'text-red-600' : bill.status === 'paid' ? 'text-green-600' : 'text-primary'}`} style={{ width: '16.67%' }}>
                        {bill.amount}
                      </td>
                      <td className={`px-4 py-4 font-medium text-sm whitespace-nowrap ${bill.status === 'overdue' ? 'text-red-600' : bill.status === 'expiring' ? 'text-orange-600' : 'text-text-main dark:text-white'}`} style={{ width: '12.5%' }}>
                        {bill.deadline_at}
                      </td>
                      <td className="px-4 py-4" style={{ width: '12.5%' }}>
                        <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold border ${bill.statusClass} border-current/10`}>
                          {bill.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center" style={{ width: '8.33%' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(bill.id);
                          }}
                          title={bill.status === 'paid' ? 'Xem biên lai' : 'Thanh toán'}
                          className={`inline-flex items-center justify-center size-9 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                            bill.status === 'paid' 
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                              : bill.status === 'overdue'
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'text-primary hover:bg-primary/10 dark:hover:bg-primary/20'
                          }`}>
                          <span className="material-symbols-outlined text-[22px]">
                            {bill.status === 'paid' ? 'receipt_long' : 'payment'}
                          </span>
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
            totalPages={Math.max(1, Math.ceil(filteredBills.length / itemsPerPage))}
            totalItems={filteredBills.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

        {/* Note / Support */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-secondary dark:text-gray-500 text-center">
            Bạn gặp vấn đề về hóa đơn? <a href="#/student/requests/create" className="text-primary font-bold hover:underline">Gửi yêu cầu hỗ trợ ngay</a>
          </p>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentQR && paymentQRCode && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setShowPaymentQR(false)}
        >
          <button 
            onClick={() => setShowPaymentQR(false)}
            className="absolute top-6 right-6 size-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div 
            className="max-w-[500px] w-full bg-white dark:bg-surface-dark p-8 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl shadow-primary/20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6 bg-white rounded-2xl border-2 border-primary/20 shadow-xl mb-6 relative group cursor-zoom-in transition-all hover:scale-105 active:scale-95"
              onClick={() => setIsQrZoomed(true)}
            >
              <div className="flex justify-center">
                <QRCode 
                  value={JSON.stringify({
                    type: 'all',
                    amount: getTotalDebt(),
                    ref: paymentQRCode.paymentRef,
                  })}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 backdrop-blur-sm text-text-main text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-tighter">Phóng to</span>
              </div>
            </div>

            {/* QR Info */}
            <div className="text-center w-full mb-6">
              <p className="text-text-main dark:text-white font-bold text-xl mb-1">Mã QR Thanh toán</p>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-medium mb-1">Tổng tiền</p>
              <p className="text-3xl font-bold text-primary mb-3">{getTotalDebt().toLocaleString('vi-VN')}₫</p>
              <p className="text-text-secondary dark:text-gray-400 text-xs font-medium">Hết hạn: {new Date(paymentQRCode.expiresAt).toLocaleTimeString('vi-VN')}</p>
            </div>

            {/* QR Expiry Alert */}
            <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-3 mb-6 text-center">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold">
                ⏱️ Mã QR hết hạn trong: <span className="text-orange-600">{new Date(paymentQRCode.expiresAt).toLocaleTimeString('vi-VN')}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-3">
              <button 
                onClick={() => setShowPaymentQR(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-main dark:text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={handlePaymentFromQR}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">payment</span>
                Thanh toán ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Zoom Modal */}
      {isQrZoomed && paymentQRCode && (
        <div 
          className="fixed inset-0 z-[101] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setIsQrZoomed(false)}
        >
          <button 
            onClick={() => setIsQrZoomed(false)}
            className="absolute top-6 right-6 size-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div 
            className="max-w-[600px] w-full bg-white dark:bg-surface-dark p-10 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl shadow-primary/20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCode 
              value={JSON.stringify({
                type: 'all',
                amount: getTotalDebt(),
                ref: paymentQRCode.paymentRef,
              })}
              size={350}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />
            <div className="mt-8 text-center w-full">
              <p className="text-text-main dark:text-white font-bold text-xl mb-1">Mã QR Thanh toán Tất cả</p>
              <p className="text-text-secondary dark:text-gray-400 text-sm font-medium mb-2">Tổng tiền: <strong className="text-primary">{getTotalDebt().toLocaleString('vi-VN')}₫</strong></p>
              <p className="text-text-secondary dark:text-gray-400 text-xs font-medium">Hết hạn: {new Date(paymentQRCode.expiresAt).toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>
        </div>
      )}
    </RoleBasedLayout>
  );
};

export default BillsAndPayments;